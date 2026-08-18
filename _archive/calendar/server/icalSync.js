import ical from 'node-ical';
import { db, transaction } from '../db.js';

// How far back / forward to materialize recurring events, in days.
const WINDOW_PAST_DAYS = 60;
const WINDOW_FUTURE_DAYS = 365;

const upsertEvent = db.prepare(`
  INSERT INTO events (calendar_id, title, starts_at, ends_at, all_day, location, description, source, external_uid)
  VALUES (@calendar_id, @title, @starts_at, @ends_at, @all_day, @location, @description, 'ical', @external_uid)
  ON CONFLICT(calendar_id, external_uid) WHERE external_uid IS NOT NULL DO UPDATE SET
    title       = excluded.title,
    starts_at   = excluded.starts_at,
    ends_at     = excluded.ends_at,
    all_day     = excluded.all_day,
    location    = excluded.location,
    description = excluded.description
`);

const deleteIcalEvents = db.prepare(
  `DELETE FROM events WHERE calendar_id = ? AND source = 'ical'`
);

const markSynced = db.prepare(
  `UPDATE calendars SET last_synced_at = datetime('now'), sync_error = NULL WHERE id = ?`
);
const markError = db.prepare(
  `UPDATE calendars SET last_synced_at = datetime('now'), sync_error = ? WHERE id = ?`
);

function normalizeUrl(rawUrl) {
  let url = rawUrl.trim();

  // webcal:// is just http(s) under the hood.
  if (url.startsWith('webcal://')) url = 'https://' + url.slice('webcal://'.length);

  // Google "add by CID" links (…/calendar/u/1?cid=<base64 calendar id>) are web
  // pages, not feeds. Convert to the public iCal URL for that calendar id. This
  // only resolves if the calendar is shared publicly; otherwise the fetch below
  // 404s and we surface an actionable error pointing at the secret address.
  try {
    const parsed = new URL(url);
    if (parsed.hostname.endsWith('calendar.google.com')) {
      const cid = parsed.searchParams.get('cid');
      if (cid) {
        const calId = Buffer.from(cid, 'base64').toString('utf8');
        return `https://calendar.google.com/calendar/ical/${encodeURIComponent(
          calId
        )}/public/basic.ics`;
      }
    }
  } catch {
    /* not a parseable URL; fall through and let the fetch fail clearly */
  }
  return url;
}

function toISO(d) {
  return (d instanceof Date ? d : new Date(d)).toISOString();
}

// Expand a single VEVENT (including recurrences) into concrete rows within the window.
function expandEvent(ev, windowStart, windowEnd) {
  const rows = [];
  const durationMs =
    ev.end && ev.start ? new Date(ev.end) - new Date(ev.start) : 60 * 60 * 1000;
  const allDay = ev.datetype === 'date' ? 1 : 0;

  const push = (start, uidSuffix = '') => {
    const startDate = new Date(start);
    const endDate = new Date(startDate.getTime() + durationMs);
    rows.push({
      title: ev.summary || '(no title)',
      starts_at: toISO(startDate),
      ends_at: toISO(endDate),
      all_day: allDay,
      location: ev.location || null,
      description: ev.description || null,
      external_uid: `${ev.uid}${uidSuffix}`,
    });
  };

  if (ev.rrule) {
    const occurrences = ev.rrule.between(windowStart, windowEnd, true);
    const exdates = Object.keys(ev.exdate || {}).map((k) =>
      new Date(ev.exdate[k]).getTime()
    );
    for (const occ of occurrences) {
      if (exdates.includes(occ.getTime())) continue;
      push(occ, `-${occ.toISOString()}`);
    }
  } else {
    const start = new Date(ev.start);
    if (start >= windowStart && start <= windowEnd) push(start);
  }
  return rows;
}

export async function syncCalendar(calendarId) {
  const cal = db
    .prepare(`SELECT * FROM calendars WHERE id = ? AND type = 'ical'`)
    .get(calendarId);
  if (!cal) throw new Error('Calendar not found or not an iCal calendar');
  if (!cal.ical_url) throw new Error('Calendar has no iCal URL');

  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - WINDOW_PAST_DAYS);
  const windowEnd = new Date();
  windowEnd.setDate(windowEnd.getDate() + WINDOW_FUTURE_DAYS);

  try {
    const url = normalizeUrl(cal.ical_url);

    // Fetch the raw body ourselves so we can validate it's actually an iCal feed
    // instead of silently "succeeding" on an HTML page (the classic mistake of
    // pasting a calendar's share/CID link rather than its .ics URL).
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) {
      throw new Error(
        `Feed returned HTTP ${res.status}. If this is a private Google calendar, use ` +
          `Settings → “Integrate calendar” → “Secret address in iCal format”.`
      );
    }
    const text = await res.text();
    if (!text.includes('BEGIN:VCALENDAR')) {
      throw new Error(
        'That URL is not an iCal (.ics) feed — it returned a web page. In Google ' +
          'Calendar, copy the “Secret address in iCal format” (it ends in /basic.ics).'
      );
    }

    const data = await ical.async.parseICS(text);
    const rows = [];
    for (const key of Object.keys(data)) {
      const ev = data[key];
      if (ev.type !== 'VEVENT') continue;
      rows.push(...expandEvent(ev, windowStart, windowEnd));
    }

    // Replace this calendar's ical events atomically.
    transaction(() => {
      deleteIcalEvents.run(calendarId);
      for (const r of rows) upsertEvent.run({ ...r, calendar_id: calendarId });
      markSynced.run(calendarId);
    });
    return { count: rows.length };
  } catch (err) {
    markError.run(String(err.message || err), calendarId);
    throw err;
  }
}

export async function syncAllCalendars() {
  const cals = db.prepare(`SELECT id FROM calendars WHERE type = 'ical'`).all();
  const results = [];
  for (const { id } of cals) {
    try {
      const r = await syncCalendar(id);
      results.push({ id, ...r });
    } catch (err) {
      results.push({ id, error: String(err.message || err) });
    }
  }
  return results;
}

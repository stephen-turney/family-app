import { useMemo, useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addDays } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useEvents, useMembers } from '../api/client.js';
import MemberBadge from '../components/MemberBadge.jsx';
import EventModal from '../components/EventModal.jsx';
import Avatar from '../components/Avatar.jsx';

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales: { 'en-US': enUS },
});

// Query a broad window (matches the server's iCal materialization range) so
// navigating months/weeks never shows an empty grid.
const RANGE_FROM = addDays(new Date(), -60).toISOString();
const RANGE_TO = addDays(new Date(), 365).toISOString();

// Constrain the day/week time grid to 6 AM – 9 PM (date part is ignored).
const MIN_TIME = new Date(1970, 0, 1, 6, 0, 0);
const MAX_TIME = new Date(1970, 0, 1, 21, 0, 0);

// Gutter labels as just the hour + AM/PM (e.g. "6 AM"), not "6:00 AM".
const FORMATS = {
  timeGutterFormat: (date, culture, loc) => loc.format(date, 'h a', culture),
};

// Return a darker shade of a #rrggbb (or #rgb) color, for event borders.
function darken(hex, amount = 0.3) {
  const m = hex.replace('#', '');
  const full = m.length === 3 ? m.split('').map((x) => x + x).join('') : m;
  const ch = (i) => {
    const v = Math.round(parseInt(full.slice(i, i + 2), 16) * (1 - amount));
    return Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0');
  };
  return `#${ch(0)}${ch(2)}${ch(4)}`;
}

export default function CalendarPage() {
  const { data: rawEvents = [], isLoading } = useEvents(RANGE_FROM, RANGE_TO);
  const { data: members = [] } = useMembers();
  const [hidden, setHidden] = useState(() => new Set()); // member ids filtered out
  const [modalEvent, setModalEvent] = useState(null);
  const [view, setView] = useState('day');
  const [date, setDate] = useState(() => new Date());

  const events = useMemo(
    () =>
      rawEvents
        .filter((e) => !(e.calendar_member_id && hidden.has(e.calendar_member_id)))
        .map((e) => ({
          ...e,
          start: new Date(e.starts_at),
          end: new Date(e.ends_at),
          allDay: Boolean(e.all_day),
          // Which member column this event belongs to; 0 = whole-family (unassigned).
          resourceId: e.calendar_member_id ?? 0,
        })),
    [rawEvents, hidden]
  );

  // One column per visible member in Day view, plus a "Family" column for any
  // events on calendars with no assigned member (so nothing disappears).
  const resources = useMemo(() => {
    const list = members
      .filter((m) => !hidden.has(m.id))
      .map((m) => ({ resourceId: m.id, resourceTitle: m.name }));
    if (events.some((e) => e.resourceId === 0)) {
      list.push({ resourceId: 0, resourceTitle: '👪 Family' });
    }
    return list;
  }, [members, hidden, events]);

  const membersById = useMemo(
    () => Object.fromEntries(members.map((m) => [m.id, m])),
    [members]
  );

  // Custom column header: a large avatar (photo or emoji) with the name below it.
  const calendarComponents = useMemo(() => {
    const stack = {
      display: 'inline-flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6,
      fontWeight: 700,
    };
    return {
      resourceHeader: ({ resource }) => {
        const m = membersById[resource?.resourceId];
        if (!m) {
          return (
            <span style={stack}>
              <span style={{ fontSize: 92, lineHeight: 1 }}>👪</span>
              <span>Family</span>
            </span>
          );
        }
        return (
          <span style={stack}>
            <Avatar member={m} size={112} />
            <span>{m.name}</span>
          </span>
        );
      },
    };
  }, [membersById]);

  const useColumns = view === 'day' && resources.length > 0;

  const memberColorById = useMemo(
    () => Object.fromEntries(members.map((m) => [m.id, m.color])),
    [members]
  );

  // Column wash keyed to each member's color (neutral for the Family column).
  const tintFor = (resourceId) => {
    const color = memberColorById[resourceId];
    return color ? `${color}73` : 'rgba(14,20,32,0.06)';
  };

  // Body columns are tinted here; header cells reuse the same tints via the CSS
  // vars below (there's no per-resource style hook for the header).
  const dayPropGetter = (date, resourceId) =>
    useColumns && resourceId !== undefined
      ? { style: { backgroundColor: tintFor(resourceId) } }
      : {};

  const columnVars = useColumns
    ? Object.fromEntries(resources.map((r, i) => [`--col-${i}`, tintFor(r.resourceId)]))
    : {};

  const toggleMember = (id) =>
    setHidden((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div>
      <div className="row" style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Calendar</h1>
        <div className="spacer" />
        {members.map((m) => (
          <span key={m.id} onClick={() => toggleMember(m.id)}>
            <MemberBadge member={m} selectable dim={hidden.has(m.id)} />
          </span>
        ))}
        <button className="btn" onClick={() => setModalEvent({ start: new Date() })}>
          + New event
        </button>
      </div>

      <div
        className={`card${useColumns ? ' cal-columns' : ''}`}
        style={{ height: 'calc(100vh - 180px)', ...columnVars }}
      >
        {isLoading ? (
          <p className="muted">Loading…</p>
        ) : (
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            views={['month', 'week', 'day', 'agenda']}
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            resources={useColumns ? resources : undefined}
            resourceIdAccessor="resourceId"
            resourceTitleAccessor="resourceTitle"
            components={useColumns ? calendarComponents : undefined}
            dayPropGetter={dayPropGetter}
            min={MIN_TIME}
            max={MAX_TIME}
            step={60}
            timeslots={1}
            formats={FORMATS}
            popup
            selectable
            onSelectSlot={(slot) =>
              setModalEvent({
                start: slot.start,
                end: slot.end,
                // In Day view with columns, slot.resourceId is the member's id
                // (0 = Family column) so the new event lands on their calendar.
                member: members.find((m) => m.id === slot.resourceId),
              })
            }
            onSelectEvent={(ev) => setModalEvent(ev)}
            eventPropGetter={(ev) => {
              const c = ev.calendar_color || '#4a63e7';
              // Pastel fill + a uniform border on all four sides in a darker shade
              // of the same color. Set inline so it overrides RBC's default border.
              return {
                style: {
                  backgroundColor: `${c}d9`,
                  color: 'var(--text)',
                  border: `1px solid ${darken(c, 0.3)}`,
                  borderRadius: 6,
                  fontWeight: 600,
                  // Nudge right so the left border clears the column edge.
                  marginLeft: 5,
                },
              };
            }}
            style={{ height: '100%' }}
          />
        )}
      </div>

      {modalEvent && <EventModal event={modalEvent} onClose={() => setModalEvent(null)} />}
    </div>
  );
}

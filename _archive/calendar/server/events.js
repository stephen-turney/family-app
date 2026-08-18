import { Router } from 'express';
import { db } from '../db.js';

export const eventsRouter = Router();

// Merged events across all calendars within [from, to], joined with calendar
// color/name and the owning member so the client can color-code directly.
eventsRouter.get('/', (req, res) => {
  const { from, to, member_id } = req.query;
  const clauses = [];
  const params = {};
  if (from) {
    clauses.push('e.ends_at >= @from');
    params.from = from;
  }
  if (to) {
    clauses.push('e.starts_at <= @to');
    params.to = to;
  }
  if (member_id) {
    clauses.push('c.member_id = @member_id');
    params.member_id = Number(member_id);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const rows = db
    .prepare(
      `SELECT e.*, c.name AS calendar_name, c.color AS calendar_color,
              c.member_id AS calendar_member_id
       FROM events e JOIN calendars c ON c.id = e.calendar_id
       ${where}
       ORDER BY e.starts_at`
    )
    .all(params);
  res.json(rows);
});

eventsRouter.post('/', (req, res) => {
  const { calendar_id, title, starts_at, ends_at, all_day, location, description } =
    req.body || {};
  if (!calendar_id || !title?.trim() || !starts_at || !ends_at)
    return res
      .status(400)
      .json({ error: 'calendar_id, title, starts_at, ends_at are required' });

  const info = db
    .prepare(
      `INSERT INTO events (calendar_id, title, starts_at, ends_at, all_day, location, description, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'local')`
    )
    .run(calendar_id, title.trim(), starts_at, ends_at, all_day ? 1 : 0, location || null, description || null);
  res.status(201).json(db.prepare('SELECT * FROM events WHERE id = ?').get(info.lastInsertRowid));
});

eventsRouter.patch('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'not found' });
  if (existing.source !== 'local')
    return res.status(400).json({ error: 'synced (iCal) events cannot be edited' });

  const { title, starts_at, ends_at, all_day, location, description, calendar_id } = req.body || {};
  db.prepare(
    `UPDATE events SET title = ?, starts_at = ?, ends_at = ?, all_day = ?,
       location = ?, description = ?, calendar_id = ? WHERE id = ?`
  ).run(
    title ?? existing.title,
    starts_at ?? existing.starts_at,
    ends_at ?? existing.ends_at,
    all_day === undefined ? existing.all_day : all_day ? 1 : 0,
    location === undefined ? existing.location : location,
    description === undefined ? existing.description : description,
    calendar_id ?? existing.calendar_id,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id));
});

eventsRouter.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (existing && existing.source !== 'local')
    return res.status(400).json({ error: 'synced (iCal) events cannot be deleted' });
  db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

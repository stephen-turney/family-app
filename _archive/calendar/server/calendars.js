import { Router } from 'express';
import { db } from '../db.js';
import { syncCalendar } from '../services/icalSync.js';

export const calendarsRouter = Router();

calendarsRouter.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM calendars ORDER BY id').all());
});

calendarsRouter.post('/', async (req, res) => {
  const { name, color, type, ical_url, member_id } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'name is required' });
  const calType = type === 'ical' ? 'ical' : 'local';
  if (calType === 'ical' && !ical_url?.trim())
    return res.status(400).json({ error: 'ical_url is required for ical calendars' });

  const info = db
    .prepare(
      'INSERT INTO calendars (name, color, type, ical_url, member_id) VALUES (?, ?, ?, ?, ?)'
    )
    .run(name.trim(), color || '#4f7cff', calType, ical_url?.trim() || null, member_id || null);
  const id = info.lastInsertRowid;

  // Kick off an initial sync for iCal calendars (best-effort).
  if (calType === 'ical') {
    try {
      await syncCalendar(id);
    } catch {
      /* sync_error is recorded on the row; surface it via GET */
    }
  }
  res.status(201).json(db.prepare('SELECT * FROM calendars WHERE id = ?').get(id));
});

calendarsRouter.patch('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM calendars WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'not found' });
  const { name, color, member_id, ical_url } = req.body || {};
  db.prepare(
    'UPDATE calendars SET name = ?, color = ?, member_id = ?, ical_url = ? WHERE id = ?'
  ).run(
    name ?? existing.name,
    color ?? existing.color,
    member_id === undefined ? existing.member_id : member_id,
    ical_url ?? existing.ical_url,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM calendars WHERE id = ?').get(req.params.id));
});

calendarsRouter.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM calendars WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

calendarsRouter.post('/:id/sync', async (req, res) => {
  try {
    const result = await syncCalendar(Number(req.params.id));
    res.json({ ...result, calendar: db.prepare('SELECT * FROM calendars WHERE id = ?').get(req.params.id) });
  } catch (err) {
    res.status(400).json({ error: String(err.message || err) });
  }
});

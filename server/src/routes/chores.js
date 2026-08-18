import { Router } from 'express';
import { db } from '../db.js';

export const choresRouter = Router();

// List chores; when ?date=YYYY-MM-DD is given, include a `done` flag for that day
// and filter to chores that are actually due that day.
choresRouter.get('/', (req, res) => {
  const { date, member_id } = req.query;
  let chores = db
    .prepare(
      `SELECT * FROM chores WHERE active = 1 ${member_id ? 'AND member_id = @member_id' : ''} ORDER BY id`
    )
    .all(member_id ? { member_id: Number(member_id) } : {});

  if (date) {
    const done = new Set(
      db
        .prepare('SELECT chore_id FROM chore_completions WHERE due_date = ?')
        .all(date)
        .map((r) => r.chore_id)
    );
    chores = chores
      .filter((c) => isChoreDueOn(c, date))
      .map((c) => ({ ...c, done: done.has(c.id) }));
  }
  res.json(chores);
});

choresRouter.post('/', (req, res) => {
  const { member_id, title, recurrence, weekdays, points, icon } = req.body || {};
  if (!member_id || !title?.trim())
    return res.status(400).json({ error: 'member_id and title are required' });
  const rec = ['once', 'daily', 'weekly'].includes(recurrence) ? recurrence : 'daily';
  const info = db
    .prepare(
      'INSERT INTO chores (member_id, title, recurrence, weekdays, points, icon) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .run(
      member_id,
      title.trim(),
      rec,
      rec === 'weekly' ? weekdays || null : null,
      points || 0,
      icon || null
    );
  res.status(201).json(db.prepare('SELECT * FROM chores WHERE id = ?').get(info.lastInsertRowid));
});

choresRouter.patch('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM chores WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'not found' });
  const { title, recurrence, weekdays, points, active, member_id, icon } = req.body || {};
  db.prepare(
    `UPDATE chores SET title = ?, recurrence = ?, weekdays = ?, points = ?, active = ?, member_id = ?, icon = ? WHERE id = ?`
  ).run(
    title ?? existing.title,
    recurrence ?? existing.recurrence,
    weekdays === undefined ? existing.weekdays : weekdays,
    points ?? existing.points,
    active === undefined ? existing.active : active ? 1 : 0,
    member_id ?? existing.member_id,
    // Explicit null clears the choice back to "match from the title", so this
    // can't use ?? — only an absent key means "leave alone".
    icon === undefined ? existing.icon : icon || null,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM chores WHERE id = ?').get(req.params.id));
});

choresRouter.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM chores WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

// Toggle completion for a specific day (defaults to today's date on the client).
choresRouter.post('/:id/toggle', (req, res) => {
  const chore = db.prepare('SELECT * FROM chores WHERE id = ?').get(req.params.id);
  if (!chore) return res.status(404).json({ error: 'not found' });
  const date = (req.body && req.body.date) || new Date().toISOString().slice(0, 10);

  const existing = db
    .prepare('SELECT id FROM chore_completions WHERE chore_id = ? AND due_date = ?')
    .get(chore.id, date);
  if (existing) {
    db.prepare('DELETE FROM chore_completions WHERE id = ?').run(existing.id);
    res.json({ done: false, date });
  } else {
    db.prepare('INSERT INTO chore_completions (chore_id, due_date) VALUES (?, ?)').run(chore.id, date);
    res.json({ done: true, date });
  }
});

// Whether a chore is "due" on a given YYYY-MM-DD.
export function isChoreDueOn(chore, date) {
  if (chore.recurrence === 'daily') return true;
  if (chore.recurrence === 'once') return true; // shown until completed; simple for MVP
  if (chore.recurrence === 'weekly') {
    if (!chore.weekdays) return false;
    const dow = new Date(`${date}T00:00:00`).getDay(); // 0-6, Sun-Sat
    return chore.weekdays.split(',').map((s) => Number(s.trim())).includes(dow);
  }
  return false;
}

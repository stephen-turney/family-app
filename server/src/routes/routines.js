import { Router } from 'express';
import { db, transaction } from '../db.js';

export const routinesRouter = Router();

// List routines with their steps. When ?date=YYYY-MM-DD, each step gets a `done`
// flag for that day.
routinesRouter.get('/', (req, res) => {
  const { date, member_id } = req.query;
  const routines = db
    .prepare(
      `SELECT * FROM routines ${member_id ? 'WHERE member_id = @member_id' : ''} ORDER BY
         CASE time_of_day WHEN 'morning' THEN 0 WHEN 'afternoon' THEN 1 ELSE 2 END, id`
    )
    .all(member_id ? { member_id: Number(member_id) } : {});

  const doneByStep = new Set(
    date
      ? db
          .prepare('SELECT step_id FROM routine_step_completions WHERE due_date = ?')
          .all(date)
          .map((r) => r.step_id)
      : []
  );

  const withSteps = routines.map((r) => {
    const steps = db
      .prepare('SELECT * FROM routine_steps WHERE routine_id = ? ORDER BY sort_order, id')
      .all(r.id)
      .map((s) => ({ ...s, done: doneByStep.has(s.id) }));
    return { ...r, steps };
  });
  res.json(withSteps);
});

routinesRouter.post('/', (req, res) => {
  const { member_id, title, time_of_day, steps } = req.body || {};
  if (!member_id || !title?.trim())
    return res.status(400).json({ error: 'member_id and title are required' });
  const tod = ['morning', 'afternoon', 'evening'].includes(time_of_day) ? time_of_day : 'morning';

  const id = transaction(() => {
    const info = db
      .prepare('INSERT INTO routines (member_id, title, time_of_day) VALUES (?, ?, ?)')
      .run(member_id, title.trim(), tod);
    const rid = info.lastInsertRowid;
    (Array.isArray(steps) ? steps : []).forEach((s, i) => {
      const label = typeof s === 'string' ? s : s?.title;
      const icon = typeof s === 'string' ? null : s?.icon || null;
      const completedIcon = typeof s === 'string' ? null : s?.completed_icon || null;
      if (label?.trim())
        db.prepare(
          `INSERT INTO routine_steps
             (routine_id, title, sort_order, icon, completed_icon)
           VALUES (?, ?, ?, ?, ?)`
        ).run(rid, label.trim(), i, icon, completedIcon);
    });
    return rid;
  });
  res.status(201).json(db.prepare('SELECT * FROM routines WHERE id = ?').get(id));
});

routinesRouter.patch('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM routines WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'not found' });
  const { title, time_of_day, member_id } = req.body || {};
  db.prepare('UPDATE routines SET title = ?, time_of_day = ?, member_id = ? WHERE id = ?').run(
    title ?? existing.title,
    time_of_day ?? existing.time_of_day,
    member_id ?? existing.member_id,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM routines WHERE id = ?').get(req.params.id));
});

routinesRouter.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM routines WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

// --- Step management ---
routinesRouter.post('/:id/steps', (req, res) => {
  const routine = db.prepare('SELECT * FROM routines WHERE id = ?').get(req.params.id);
  if (!routine) return res.status(404).json({ error: 'routine not found' });
  const { title, icon, completed_icon } = req.body || {};
  if (!title?.trim()) return res.status(400).json({ error: 'title is required' });
  const max = db
    .prepare('SELECT COALESCE(MAX(sort_order), -1) AS m FROM routine_steps WHERE routine_id = ?')
    .get(req.params.id).m;
  const info = db
    .prepare(
      `INSERT INTO routine_steps
         (routine_id, title, sort_order, icon, completed_icon)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(req.params.id, title.trim(), max + 1, icon || null, completed_icon || null);
  res.status(201).json(db.prepare('SELECT * FROM routine_steps WHERE id = ?').get(info.lastInsertRowid));
});

routinesRouter.patch('/steps/:stepId', (req, res) => {
  const existing = db.prepare('SELECT * FROM routine_steps WHERE id = ?').get(req.params.stepId);
  if (!existing) return res.status(404).json({ error: 'not found' });
  const { icon, completed_icon } = req.body || {};
  db.prepare('UPDATE routine_steps SET icon = ?, completed_icon = ? WHERE id = ?').run(
    icon === undefined ? existing.icon : icon || null,
    completed_icon === undefined ? existing.completed_icon : completed_icon || null,
    req.params.stepId
  );
  res.json(db.prepare('SELECT * FROM routine_steps WHERE id = ?').get(req.params.stepId));
});

routinesRouter.delete('/steps/:stepId', (req, res) => {
  db.prepare('DELETE FROM routine_steps WHERE id = ?').run(req.params.stepId);
  res.status(204).end();
});

// Toggle a step's completion for a given day.
routinesRouter.post('/steps/:stepId/toggle', (req, res) => {
  const step = db.prepare('SELECT * FROM routine_steps WHERE id = ?').get(req.params.stepId);
  if (!step) return res.status(404).json({ error: 'not found' });
  const date = (req.body && req.body.date) || new Date().toISOString().slice(0, 10);

  const existing = db
    .prepare('SELECT id FROM routine_step_completions WHERE step_id = ? AND due_date = ?')
    .get(step.id, date);
  if (existing) {
    db.prepare('DELETE FROM routine_step_completions WHERE id = ?').run(existing.id);
    res.json({ done: false, date });
  } else {
    db.prepare('INSERT INTO routine_step_completions (step_id, due_date) VALUES (?, ?)').run(step.id, date);
    res.json({ done: true, date });
  }
});

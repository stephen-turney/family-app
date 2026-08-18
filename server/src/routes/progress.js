import { Router } from 'express';
import { db } from '../db.js';
import { isChoreDueOn } from './chores.js';

export const progressRouter = Router();

function eachDate(from, to) {
  const days = [];
  const d = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  while (d <= end) {
    days.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

// Chores are currently hidden from the UI (the checklist is routines-only), so
// counting them here would make 100% unreachable: a kid could tick every visible
// row and still see 8/11. Flip this back to true when chores return to the page —
// the loop below is left intact for that, since there's no version control yet.
const COUNT_CHORES = false;

// Per-member completion stats over [from, to] (inclusive, YYYY-MM-DD).
// Counts expected chore occurrences + routine steps vs. what was completed.
progressRouter.get('/', (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const from = req.query.from || today;
  const to = req.query.to || today;
  const days = eachDate(from, to);

  const members = db.prepare('SELECT * FROM members ORDER BY id').all();
  const chores = db.prepare('SELECT * FROM chores WHERE active = 1').all();
  const routines = db.prepare('SELECT * FROM routines').all();
  const steps = db.prepare('SELECT * FROM routine_steps').all();

  const choreDone = new Set(
    db
      .prepare('SELECT chore_id, due_date FROM chore_completions WHERE due_date BETWEEN ? AND ?')
      .all(from, to)
      .map((r) => `${r.chore_id}|${r.due_date}`)
  );
  const stepDone = new Set(
    db
      .prepare('SELECT step_id, due_date FROM routine_step_completions WHERE due_date BETWEEN ? AND ?')
      .all(from, to)
      .map((r) => `${r.step_id}|${r.due_date}`)
  );

  const stepsByRoutine = {};
  for (const s of steps) (stepsByRoutine[s.routine_id] ||= []).push(s);

  const result = members.map((m) => {
    let expected = 0;
    let completed = 0;
    let points = 0;

    if (COUNT_CHORES) {
      for (const chore of chores.filter((c) => c.member_id === m.id)) {
        for (const day of days) {
          if (!isChoreDueOn(chore, day)) continue;
          expected += 1;
          if (choreDone.has(`${chore.id}|${day}`)) {
            completed += 1;
            points += chore.points || 0;
          }
        }
      }
    }

    for (const routine of routines.filter((r) => r.member_id === m.id)) {
      const rSteps = stepsByRoutine[routine.id] || [];
      for (const day of days) {
        for (const step of rSteps) {
          expected += 1;
          if (stepDone.has(`${step.id}|${day}`)) completed += 1;
        }
      }
    }

    return {
      member_id: m.id,
      name: m.name,
      color: m.color,
      emoji: m.emoji,
      expected,
      completed,
      points,
      percent: expected === 0 ? 0 : Math.round((completed / expected) * 100),
    };
  });

  res.json({ from, to, members: result });
});

import { Router } from 'express';
import { db } from '../db.js';

export const membersRouter = Router();

membersRouter.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM members ORDER BY id').all());
});

membersRouter.post('/', (req, res) => {
  const { name, color, emoji, avatar } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'name is required' });
  const info = db
    .prepare('INSERT INTO members (name, color, emoji, avatar) VALUES (?, ?, ?, ?)')
    .run(name.trim(), color || '#4f7cff', emoji || '🙂', avatar || null);
  res.status(201).json(db.prepare('SELECT * FROM members WHERE id = ?').get(info.lastInsertRowid));
});

membersRouter.patch('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM members WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'not found' });
  const { name, color, emoji, avatar } = req.body || {};
  db.prepare('UPDATE members SET name = ?, color = ?, emoji = ?, avatar = ? WHERE id = ?').run(
    name ?? existing.name,
    color ?? existing.color,
    emoji ?? existing.emoji,
    avatar === undefined ? existing.avatar : avatar, // null clears the photo
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM members WHERE id = ?').get(req.params.id));
});

membersRouter.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM members WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

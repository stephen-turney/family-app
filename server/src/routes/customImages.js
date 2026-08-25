import { Router } from 'express';
import { db } from '../db.js';

export const customImagesRouter = Router();

customImagesRouter.get('/', (req, res) => {
  res.json(
    db.prepare('SELECT id, data_url, created_at FROM custom_images ORDER BY id DESC').all()
  );
});

customImagesRouter.post('/', (req, res) => {
  const dataUrl = req.body?.data_url;
  if (typeof dataUrl !== 'string' || !/^data:image\/(png|jpe?g|gif|webp);base64,/i.test(dataUrl)) {
    return res.status(400).json({ error: 'Please upload a valid image.' });
  }

  const existing = db.prepare('SELECT id, data_url, created_at FROM custom_images WHERE data_url = ?').get(dataUrl);
  if (existing) return res.json(existing);

  const result = db.prepare('INSERT INTO custom_images (data_url) VALUES (?)').run(dataUrl);
  res.status(201).json(
    db.prepare('SELECT id, data_url, created_at FROM custom_images WHERE id = ?').get(result.lastInsertRowid)
  );
});

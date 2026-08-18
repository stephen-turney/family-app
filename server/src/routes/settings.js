import { Router } from 'express';
import { db } from '../db.js';

export const settingsRouter = Router();

function allSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const obj = {};
  for (const r of rows) obj[r.key] = r.value;
  return obj;
}

// Simple key/value app settings (e.g. family_name).
settingsRouter.get('/', (req, res) => {
  res.json(allSettings());
});

settingsRouter.patch('/', (req, res) => {
  const body = req.body || {};
  const upsert = db.prepare(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  );
  for (const [k, v] of Object.entries(body)) {
    upsert.run(k, v == null ? null : String(v));
  }
  res.json(allSettings());
});

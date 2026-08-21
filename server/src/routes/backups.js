import express, { Router } from 'express';
import { DatabaseSync, backup } from 'node:sqlite';
import {
  chmodSync,
  closeSync,
  openSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DB_PATH, db } from '../db.js';

export const backupsRouter = Router();

const REQUIRED_TABLES = [
  'settings',
  'members',
  'chores',
  'chore_completions',
  'routines',
  'routine_steps',
  'routine_step_completions',
];

const pad = (number) => String(number).padStart(2, '0');
function timestamp(date = new Date()) {
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-` +
    `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function validateDatabase(filename) {
  const candidate = new DatabaseSync(filename, { readOnly: true });
  try {
    const { integrity_check: integrity } = candidate.prepare('PRAGMA integrity_check').get();
    if (integrity !== 'ok') throw new Error(`SQLite integrity check failed: ${integrity}`);

    const tables = new Set(
      candidate.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all()
        .map(({ name }) => name)
    );
    const missing = REQUIRED_TABLES.filter((table) => !tables.has(table));
    if (missing.length) throw new Error(`Not a Family Hub database (missing ${missing.join(', ')})`);

    const foreignKeyErrors = candidate.prepare('PRAGMA foreign_key_check').all();
    if (foreignKeyErrors.length) throw new Error('The uploaded database has broken relationships');

    return {
      members: Number(candidate.prepare('SELECT COUNT(*) AS count FROM members').get().count),
      steps: Number(candidate.prepare('SELECT COUNT(*) AS count FROM routine_steps').get().count),
    };
  } finally {
    candidate.close();
    rmSync(`${filename}-wal`, { force: true });
    rmSync(`${filename}-shm`, { force: true });
  }
}

backupsRouter.get('/database', async (req, res, next) => {
  const tempFile = path.join(os.tmpdir(), `familyhub-download-${process.pid}-${Date.now()}.sqlite`);
  try {
    await backup(db, tempFile);
    chmodSync(tempFile, 0o600);
    const downloadName = `familyhub-backup-${timestamp().slice(0, 8)}.sqlite`;
    res.download(tempFile, downloadName, (error) => {
      rmSync(tempFile, { force: true });
      if (error && !res.headersSent) next(error);
    });
  } catch (error) {
    rmSync(tempFile, { force: true });
    next(error);
  }
});

const receiveDatabase = express.raw({
  type: ['application/vnd.sqlite3', 'application/x-sqlite3', 'application/octet-stream'],
  limit: '100mb',
});

backupsRouter.post('/restore', receiveDatabase, async (req, res, next) => {
  if (!Buffer.isBuffer(req.body) || req.body.length < 100) {
    return res.status(400).json({ error: 'Choose a non-empty SQLite database file' });
  }

  const suffix = `${process.pid}-${Date.now()}`;
  const staged = `${DB_PATH}.restore-${suffix}`;
  const displaced = `${DB_PATH}.replaced-${suffix}`;
  const safetyBackup = `${DB_PATH}.before-restore-${timestamp()}.sqlite`;
  let databaseClosed = false;

  try {
    // Exclusive creation prevents an accidental overwrite if names ever collide.
    const fd = openSync(staged, 'wx', 0o600);
    try {
      writeFileSync(fd, req.body);
    } finally {
      closeSync(fd);
    }
    let summary;
    try {
      summary = validateDatabase(staged);
    } catch (error) {
      rmSync(staged, { force: true });
      return res.status(400).json({ error: error.message });
    }

    // node:sqlite backup captures committed data plus the live WAL. A plain file
    // copy here could lose recent checklist completions.
    await backup(db, safetyBackup);
    chmodSync(safetyBackup, 0o600);

    db.close();
    databaseClosed = true;
    rmSync(`${DB_PATH}-wal`, { force: true });
    rmSync(`${DB_PATH}-shm`, { force: true });

    renameSync(DB_PATH, displaced);
    try {
      renameSync(staged, DB_PATH);
    } catch (error) {
      renameSync(displaced, DB_PATH);
      throw error;
    }
    rmSync(displaced, { force: true });

    res.status(202).json({
      ok: true,
      members: summary.members,
      steps: summary.steps,
      safety_backup: path.basename(safetyBackup),
    });
    res.once('finish', () => setTimeout(() => process.exit(0), 500));
  } catch (error) {
    rmSync(staged, { force: true });
    rmSync(displaced, { force: true });
    if (databaseClosed) setTimeout(() => process.exit(1), 500);
    next(error);
  }
});

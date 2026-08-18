#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Nightly backup of server/data.sqlite — the app's entire state.
//
// Run by the com.familyhub.backup launchd agent; safe to run by hand any time
// (./hosting/install-agent.command --backup-now).
//
// Two decisions worth knowing:
//
// 1. It uses node:sqlite's backup(), NOT a file copy. The DB runs in WAL mode,
//    so recent writes live in data.sqlite-wal — copying data.sqlite alone
//    silently loses them (measured: a plain cp restored 0 of 3 completions).
//
// 2. It's Node rather than the shell script this started as, because macOS TCC
//    denies /bin/bash access to ~/Desktop when launchd starts it ("Operation
//    not permitted", exit 126) while it allows the same read to node — which is
//    already proven here, since the server agent reads this same directory.
//    So both agents now stand or fall together. See CLAUDE.md's hosting notes.
//
// Overridable by env: FAMILYHUB_BACKUP_DIR, DB_PATH, FAMILYHUB_KEEP_DAYS.
// ---------------------------------------------------------------------------
import { DatabaseSync, backup } from 'node:sqlite';
import { gzipSync } from 'node:zlib';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DB = process.env.DB_PATH || path.join(ROOT, 'server', 'data.sqlite');
const KEEP_DAYS = Number(process.env.FAMILYHUB_KEEP_DAYS || 30);
// iCloud Drive by default: a backup on the same disk as the original doesn't
// survive the disk. Point this at an external drive or NAS if you'd rather.
const DEST = process.env.FAMILYHUB_BACKUP_DIR ||
  path.join(os.homedir(), 'Library', 'Mobile Documents', 'com~apple~CloudDocs', 'FamilyHubBackups');

// Local time, not toISOString() — same trap the server routes have: a UTC date
// would name the file after tomorrow for anything after 7pm Central.
const pad = (n) => String(n).padStart(2, '0');
const localDay = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const localTime = (d = new Date()) => `${localDay(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

const say = (msg) => console.log(`[${localTime()}] ${msg}`);
const die = (msg) => { console.error(`[${localTime()}] ERROR: ${msg}`); process.exit(1); };

if (!fs.existsSync(DB)) die(`no database at ${DB}`);

// Staged in the temp dir so a half-written file never appears in the backup
// folder, and iCloud never starts syncing a partial one.
const tmpDb = path.join(os.tmpdir(), `familyhub-backup-${process.pid}.sqlite`);
const tmpGz = `${tmpDb}.gz`;
const cleanup = () => { for (const f of [tmpDb, tmpGz]) fs.rmSync(f, { force: true }); };

try {
  fs.mkdirSync(DEST, { recursive: true });
} catch (err) {
  die(`cannot create ${DEST} — ${err.message}`);
}

try {
  const src = new DatabaseSync(DB, { readOnly: true });
  let pages;
  try {
    pages = await backup(src, tmpDb);
  } finally {
    src.close();
  }

  // A backup you haven't verified is a guess. This also catches a truncated file.
  const copy = new DatabaseSync(tmpDb, { readOnly: true });
  let summary;
  try {
    const { integrity_check: check } = copy.prepare('PRAGMA integrity_check').get();
    if (check !== 'ok') die(`integrity_check on the backup said: ${check}`);
    const count = (t) => copy.prepare(`SELECT COUNT(*) AS c FROM ${t}`).get().c;
    summary = `${count('members')} members, ${count('routine_steps')} steps, ` +
              `${count('routine_step_completions')} completions`;
  } finally {
    copy.close();
  }

  fs.writeFileSync(tmpGz, gzipSync(fs.readFileSync(tmpDb), { level: 9 }));

  const final = path.join(DEST, `familyhub-${localDay()}.sqlite.gz`);
  try {
    fs.renameSync(tmpGz, final);
  } catch (err) {
    // Different filesystem (an external drive, say) — rename can't cross one.
    if (err.code !== 'EXDEV') throw err;
    fs.copyFileSync(tmpGz, final);
  }

  const kb = (fs.statSync(final).size / 1024).toFixed(1);
  say(`backed up ${summary} (${pages} pages) → ${final} (${kb} kB)`);

  // Prune old backups by their own filename date, not mtime: iCloud can rewrite
  // mtimes when it materializes an evicted file, which would keep them forever.
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - KEEP_DAYS);
  const all = fs.readdirSync(DEST).filter((f) => /^familyhub-\d{4}-\d{2}-\d{2}\.sqlite\.gz$/.test(f));
  let pruned = 0;
  for (const f of all) {
    if (f.slice('familyhub-'.length, 'familyhub-'.length + 10) < localDay(cutoff)) {
      fs.rmSync(path.join(DEST, f), { force: true });
      pruned++;
    }
  }
  if (pruned) say(`pruned ${pruned} backup(s) older than ${KEEP_DAYS} days`);
  say(`${all.length - pruned} backup(s) on hand in ${DEST}`);
} catch (err) {
  cleanup();
  die(err.message);
}

cleanup();

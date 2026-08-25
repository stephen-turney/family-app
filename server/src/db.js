import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data.sqlite');

// Node 26's built-in SQLite — no native build step required.
export const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

// node:sqlite has no better-sqlite3-style db.transaction() helper, so provide
// one: run fn() inside a transaction, committing on success and rolling back on error.
export function transaction(fn) {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS members (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    color      TEXT NOT NULL DEFAULT '#4f7cff',
    emoji      TEXT NOT NULL DEFAULT '🙂',
    weekly_allowance_cents INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS chores (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id  INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    title      TEXT NOT NULL,
    recurrence TEXT NOT NULL DEFAULT 'daily' CHECK (recurrence IN ('once','daily','weekly')),
    weekdays   TEXT,                        -- CSV of 0-6 (Sun-Sat) for weekly
    points     INTEGER NOT NULL DEFAULT 0,
    active     INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS chore_completions (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    chore_id     INTEGER NOT NULL REFERENCES chores(id) ON DELETE CASCADE,
    due_date     TEXT NOT NULL,             -- YYYY-MM-DD (local day)
    completed_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_chore_completion
    ON chore_completions(chore_id, due_date);

  CREATE TABLE IF NOT EXISTS routines (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id    INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    title        TEXT NOT NULL,
    time_of_day  TEXT NOT NULL DEFAULT 'morning' CHECK (time_of_day IN ('morning','afternoon','evening')),
    created_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS routine_steps (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    routine_id INTEGER NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
    title      TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS routine_step_completions (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    step_id      INTEGER NOT NULL REFERENCES routine_steps(id) ON DELETE CASCADE,
    due_date     TEXT NOT NULL,             -- YYYY-MM-DD
    completed_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_step_completion
    ON routine_step_completions(step_id, due_date);

  -- Reusable custom pictures. Task rows still retain their selected data URL so
  -- deleting a library item later never breaks a picture already in use.
  CREATE TABLE IF NOT EXISTS custom_images (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    data_url   TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// ---------------------------------------------------------------------------
// Lightweight migrations: add columns to existing databases when missing.
// ---------------------------------------------------------------------------
function ensureColumn(table, column, type) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
  }
}
ensureColumn('members', 'avatar', 'TEXT'); // base64 data URL for a profile photo
ensureColumn('members', 'weekly_allowance_cents', 'INTEGER');
// Optional pictures for a task. NULL `icon` means "work it out from the title";
// NULL `completed_icon` uses the client's standard done picture. Existing rows
// therefore gain the completed-state treatment without a data backfill.
ensureColumn('chores', 'icon', 'TEXT');
ensureColumn('routine_steps', 'icon', 'TEXT');
ensureColumn('routine_steps', 'completed_icon', 'TEXT');

// Pictures uploaded before the library existed were saved directly on a step.
// Preserve those choices and make them selectable for future tasks too.
db.exec(`
  INSERT OR IGNORE INTO custom_images (data_url)
  SELECT icon FROM chores WHERE icon LIKE 'data:image/%'
  UNION
  SELECT icon FROM routine_steps WHERE icon LIKE 'data:image/%'
  UNION
  SELECT completed_icon FROM routine_steps WHERE completed_icon LIKE 'data:image/%';
`);

// Configure the two existing children without tying report calculations to
// member ids. The value remains editable in Settings and is left alone once set.
db.prepare(
  `UPDATE members
      SET weekly_allowance_cents = CASE lower(name)
        WHEN 'everett' THEN 1200
        WHEN 'beau' THEN 750
      END
    WHERE weekly_allowance_cents IS NULL
      AND lower(name) IN ('everett', 'beau')`
).run();

// ---------------------------------------------------------------------------
// Seed (only when the DB is empty) so a fresh install isn't a blank page.
// One child with the three time-of-day routines the checklist is built around —
// enough to show the shape of the thing, little enough to delete in a minute.
// (Chores are seeded not at all: they're hidden from the UI, so rows would sit
// invisible. Calendars and events are gone entirely — see _archive/.)
// ---------------------------------------------------------------------------
function seed() {
  const memberCount = db.prepare('SELECT COUNT(*) AS n FROM members').get().n;
  if (memberCount > 0) return;

  const kid = db
    .prepare('INSERT INTO members (name, color, emoji) VALUES (?, ?, ?)')
    .run('Riley', '#cce8db', '🧒').lastInsertRowid;

  const insertRoutine = db.prepare(
    'INSERT INTO routines (member_id, title, time_of_day) VALUES (?, ?, ?)'
  );
  const insertStep = db.prepare(
    'INSERT INTO routine_steps (routine_id, title, sort_order) VALUES (?, ?, ?)'
  );
  const routine = (title, timeOfDay, steps) => {
    const id = insertRoutine.run(kid, title, timeOfDay).lastInsertRowid;
    steps.forEach((t, i) => insertStep.run(id, t, i));
  };

  routine('Before School', 'morning', [
    'Make Bed', 'Get Dressed', 'Eat Breakfast', 'Brush Teeth', 'Pack Backpack',
  ]);
  routine('After School', 'afternoon', [
    'Put Away Backpack', 'Have a Snack', 'Do Homework', 'Play Outside (30 min.)', 'Daily Chore',
  ]);
  routine('Before Bed', 'evening', [
    'Eat Dinner', 'Pick Up Toys', 'Take a Bath', 'Put on PJs', 'Brush Teeth', 'Read Books',
  ]);

  console.log('[db] Seeded a starter checklist.');
}

seed();

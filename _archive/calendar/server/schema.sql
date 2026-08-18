-- The two tables removed from server/src/db.js when the calendar feature was
-- stripped (2026-08-15). Paste back into the db.exec(`…`) schema block to restore.
--
-- The partial unique index is load-bearing: icalSync.js upserts with
--   ON CONFLICT(calendar_id, external_uid) WHERE external_uid IS NOT NULL
-- and SQLite requires the WHERE clause in the conflict target to match it.

CREATE TABLE IF NOT EXISTS calendars (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  name           TEXT NOT NULL,
  color          TEXT NOT NULL DEFAULT '#4f7cff',
  type           TEXT NOT NULL DEFAULT 'local' CHECK (type IN ('local','ical')),
  ical_url       TEXT,
  member_id      INTEGER REFERENCES members(id) ON DELETE SET NULL,
  last_synced_at TEXT,
  sync_error     TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS events (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  calendar_id  INTEGER NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  starts_at    TEXT NOT NULL,           -- ISO 8601 UTC
  ends_at      TEXT NOT NULL,           -- ISO 8601 UTC
  all_day      INTEGER NOT NULL DEFAULT 0,
  location     TEXT,
  description  TEXT,
  source       TEXT NOT NULL DEFAULT 'local' CHECK (source IN ('local','ical')),
  external_uid TEXT,                     -- set for ical-sourced events
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_external
  ON events(calendar_id, external_uid) WHERE external_uid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_range ON events(starts_at, ends_at);

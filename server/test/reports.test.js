import assert from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import express from 'express';

// Every test uses disposable storage, including the module's SQLite connection.
const temporaryRoot = mkdtempSync(path.join(tmpdir(), 'family-reports-test-'));
const reportsDir = path.join(temporaryRoot, 'reports');
const originalEnvironment = { REPORTS_DIR: process.env.REPORTS_DIR, DB_PATH: process.env.DB_PATH };
process.env.REPORTS_DIR = reportsDir;
process.env.DB_PATH = path.join(temporaryRoot, 'data.sqlite');
const { db } = await import('../src/db.js');
const { deleteSavedReport, generateAllowanceReport, generateWeeklyReport, listSavedReports,
  migrateLegacyReports, parseLegacyReport, readSavedReport, reportFilename } = await import('../src/weeklyReports.js');
const { reportsRouter } = await import('../src/routes/reports.js');

const legacyFilename = 'Allowance-Totals_Week-of-August-24th.txt';
const jsonFilename = legacyFilename.replace('.txt', '.json');
const legacyText = `ALLOWANCE TOTALS
Week of August 24th, 2026 through August 28th, 2026

============================================================
EVERETT — TOTAL ALLOWANCE EARNED: $10.10
EVERETT — ADDITIONAL ROUNDING:    $0.10

EVERETT — GRAND TOTAL:            $10.20
============================================================
  SPENDING (50%):  $5.05
  SAVINGS  (30%):  $3.03 (+$0.02) = $3.05
  GIVING   (10%):  $1.01 (+$0.04) = $1.05
  TAXES    (10%):  $1.01 (+$0.04) = $1.05
------------------------------------------------------------
  Full weekly allowance: $12.00
  Tasks completed: 84 of 100
  Points earned: 840 of 1000
  Completion: 84%

============================================================
BEAU — TOTAL ALLOWANCE EARNED: $6.30
BEAU — ADDITIONAL ROUNDING:    $0.05

BEAU — GRAND TOTAL:            $6.35
============================================================
  SPENDING (50%):  $3.15
  SAVINGS  (30%):  $1.89 (+$0.01) = $1.90
  GIVING   (10%):  $0.63 (+$0.02) = $0.65
  TAXES    (10%):  $0.63 (+$0.02) = $0.65
------------------------------------------------------------
  Full weekly allowance: $7.50
  Tasks completed: 83 of 100
  Points earned: 830 of 1000
  Completion: 83%

Each completed task earns 10 points. Earned allowances are rounded up to the nearest $0.10.
Each category is then rounded up to the nearest $0.05; the added amount is shown above.
`;

const expectedLegacyReport = {
  monday: '2026-08-24', friday: '2026-08-28',
  mondayLabel: 'August 24th, 2026', fridayLabel: 'August 28th, 2026',
  taskTarget: 100, pointTarget: 1000,
  members: [
    { id: 'legacy-1', name: 'EVERETT', weeklyAllowanceCents: 1200,
      creditedTasks: 84, points: 840, percent: 84, allowanceCents: 1010,
      additionalRoundingCents: 10, grandTotalCents: 1020,
      categories: {
        spending: { originalCents: 505, adjustmentCents: 0, roundedCents: 505 },
        savings: { originalCents: 303, adjustmentCents: 2, roundedCents: 305 },
        giving: { originalCents: 101, adjustmentCents: 4, roundedCents: 105 },
        taxes: { originalCents: 101, adjustmentCents: 4, roundedCents: 105 },
      } },
    { id: 'legacy-2', name: 'BEAU', weeklyAllowanceCents: 750,
      creditedTasks: 83, points: 830, percent: 83, allowanceCents: 630,
      additionalRoundingCents: 5, grandTotalCents: 635,
      categories: {
        spending: { originalCents: 315, adjustmentCents: 0, roundedCents: 315 },
        savings: { originalCents: 189, adjustmentCents: 1, roundedCents: 190 },
        giving: { originalCents: 63, adjustmentCents: 2, roundedCents: 65 },
        taxes: { originalCents: 63, adjustmentCents: 2, roundedCents: 65 },
      } },
  ],
};

let server;
let baseUrl;
before(async () => {
  const app = express();
  app.use('/api/reports', reportsRouter);
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api/reports`;
});

beforeEach(() => {
  assert.equal(path.dirname(path.resolve(reportsDir)), path.resolve(temporaryRoot));
  rmSync(reportsDir, { recursive: true, force: true });
  mkdirSync(reportsDir);
  db.exec('DELETE FROM members');
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  db.close();
  assert.equal(path.dirname(path.resolve(temporaryRoot)), path.resolve(tmpdir()));
  assert.match(path.basename(temporaryRoot), /^family-reports-test-/);
  rmSync(temporaryRoot, { recursive: true, force: true });
  for (const [key, value] of Object.entries(originalEnvironment)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

function saveLegacy(text = legacyText, filename = legacyFilename) {
  writeFileSync(path.join(reportsDir, filename), text);
}

test('legacy parsing preserves names, history, integer cents and both category forms', () => {
  db.prepare('INSERT INTO members (name, weekly_allowance_cents) VALUES (?, ?)').run('Renamed Child', 99999);
  assert.deepEqual(parseLegacyReport(legacyText.replace(/\n/g, '\r\n')), expectedLegacyReport);
  assert.equal(parseLegacyReport(legacyText.replace('August 24th, 2026 through August 28th, 2026',
    'August 31st, 2026 through September 4th, 2026')).friday, '2026-09-04');
  assert.throws(() => parseLegacyReport(legacyText.replace('BEAU — TOTAL ALLOWANCE EARNED: $6.30',
    'BEAU — TOTAL ALLOWANCE EARNED: $bad')), /Invalid member total/);
});

test('empty legacy reports migrate without inventing members', () => {
  saveLegacy('ALLOWANCE TOTALS\nWeek of August 24th, 2026 through August 28th, 2026\n\n'
    + 'No family members have a weekly allowance configured.\n');
  const report = readSavedReport(legacyFilename);
  assert.deepEqual(report.members, []);
  assert.equal(report.taskTarget, 100);
  assert.equal(readSavedReport(jsonFilename).members.length, 0);
});

test('migration retains original bytes and ordering time, is idempotent, and hides TXT duplicates', () => {
  saveLegacy();
  const originalTime = new Date('2026-08-30T07:00:00Z');
  utimesSync(path.join(reportsDir, legacyFilename), originalTime, originalTime);
  assert.deepEqual(migrateLegacyReports(), { converted: [legacyFilename], failed: [] });
  assert.equal(readFileSync(path.join(reportsDir, legacyFilename), 'utf8'), legacyText);
  const snapshot = readSavedReport(jsonFilename);
  assert.deepEqual(snapshot, { schemaVersion: 1, ...expectedLegacyReport });
  const statBefore = statSync(path.join(reportsDir, jsonFilename));
  assert.equal(statBefore.mtime.toISOString(), originalTime.toISOString());
  assert.deepEqual(migrateLegacyReports(), { converted: [], failed: [] });
  assert.equal(statSync(path.join(reportsDir, jsonFilename)).mtimeMs, statBefore.mtimeMs);
  assert.deepEqual(listSavedReports().map(({ filename, created_at, monday, friday, mondayLabel, fridayLabel }) => (
    { filename, created_at, monday, friday, mondayLabel, fridayLabel }
  )), [{ filename: jsonFilename, created_at: originalTime.toISOString(),
    monday: '2026-08-24', friday: '2026-08-28', mondayLabel: 'August 24th, 2026', fridayLabel: 'August 28th, 2026' }]);
  assert.deepEqual(readSavedReport(legacyFilename), snapshot);
});

test('corrupt originals stay listed; corrupt JSON copies recover from the retained TXT', async () => {
  saveLegacy('damaged archive');
  const result = migrateLegacyReports();
  assert.equal(result.failed.length, 1);
  assert.equal(existsSync(path.join(reportsDir, jsonFilename)), false);
  assert.deepEqual(listSavedReports().map(({ filename, readable }) => ({ filename, readable })),
    [{ filename: legacyFilename, readable: false }]);
  assert.equal((await fetch(`${baseUrl}/${legacyFilename}`)).status, 422);
  saveLegacy();
  writeFileSync(path.join(reportsDir, jsonFilename), '{broken');
  assert.deepEqual(readSavedReport(jsonFilename), expectedLegacyReport);
  assert.deepEqual(readSavedReport(jsonFilename), { schemaVersion: 1, ...expectedLegacyReport });
});

test('weekly generation saves the popup report as an immutable JSON snapshot', () => {
  const memberId = db.prepare('INSERT INTO members (name, weekly_allowance_cents) VALUES (?, ?)')
    .run('Current Child', 1234).lastInsertRowid;
  const routineId = db.prepare('INSERT INTO routines (member_id, title) VALUES (?, ?)').run(memberId, 'Routine').lastInsertRowid;
  const insertStep = db.prepare('INSERT INTO routine_steps (routine_id, title) VALUES (?, ?)');
  const insertCompletion = db.prepare('INSERT INTO routine_step_completions (step_id, due_date) VALUES (?, ?)');
  for (let index = 0; index < 21; index += 1) {
    const stepId = insertStep.run(routineId, `Task ${index}`).lastInsertRowid;
    insertCompletion.run(stepId, '2026-10-05');
    if (index < 6) insertCompletion.run(stepId, '2026-10-06');
    insertCompletion.run(stepId, '2026-10-12'); // Outside the report's week.
  }
  const reference = new Date('2026-10-11T08:00:00Z');
  const expected = generateAllowanceReport(reference);
  assert.equal(expected.members[0].creditedTasks, 26); // 21 in a day is capped at 20.
  assert.equal(expected.members[0].allowanceCents, 330);
  const created = generateWeeklyReport(reference);
  assert.equal(created.filename, 'Allowance-Totals_Week-of-October-5th-2026.json');
  assert.equal(created.created, true);
  assert.deepEqual(readSavedReport(created.filename), { schemaVersion: 1, ...expected });
  db.prepare('UPDATE members SET name = ?, weekly_allowance_cents = ? WHERE id = ?')
    .run('Changed Later', 99999, memberId);
  db.exec('DELETE FROM routine_step_completions');
  assert.equal(generateWeeklyReport(reference).created, false);
  assert.deepEqual(readSavedReport(created.filename), { schemaVersion: 1, ...expected });
  assert.equal(readdirSync(reportsDir).some((name) => name.endsWith('.txt')), false);
  assert.throws(() => generateWeeklyReport(reference, { outputFilename: '../outside.json' }), /report not found/);
});

test('legacy weekly snapshots prevent duplicate generation and never block a later year', () => {
  saveLegacy();
  const original = generateWeeklyReport(new Date('2026-08-30T08:00:00Z'));
  assert.equal(original.created, false);
  assert.equal(original.filename, jsonFilename);
  assert.equal(readSavedReport(original.filename).members[0].allowanceCents, 1010);
  const later = generateWeeklyReport(new Date('2037-08-30T08:00:00Z'));
  assert.equal(later.created, true);
  assert.equal(later.filename, reportFilename('2037-08-24'));
  assert.equal(listSavedReports().length, 2);
});

test('JSON access migrates a retained TXT source before listing, and overwrite keeps one week', () => {
  saveLegacy();
  assert.deepEqual(readSavedReport(jsonFilename), expectedLegacyReport);
  const result = generateWeeklyReport(new Date('2026-08-30T08:00:00Z'), { overwrite: true });
  assert.equal(result.filename, jsonFilename);
  assert.equal(result.created, true);
  assert.equal(listSavedReports().length, 1);
  assert.equal(readdirSync(reportsDir).filter((name) => name.endsWith('.json')).length, 1);
  assert.deepEqual(readSavedReport(jsonFilename).members, []);
  assert.equal(readFileSync(path.join(reportsDir, legacyFilename), 'utf8'), legacyText);
});

test('routes list/open reports as JSON, leave Generate unsaved, and delete both aliases', async () => {
  saveLegacy();
  const list = await (await fetch(baseUrl)).json();
  assert.equal(list.length, 1);
  assert.equal(list[0].filename, jsonFilename);
  assert.equal(list[0].mondayLabel, 'August 24th, 2026');
  const opened = await fetch(`${baseUrl}/${jsonFilename}`);
  assert.match(opened.headers.get('content-type'), /application\/json/);
  assert.equal(opened.headers.get('content-disposition'), null);
  assert.deepEqual(await opened.json(), { schemaVersion: 1, ...expectedLegacyReport });
  const beforeGeneration = readdirSync(reportsDir);
  assert.equal((await fetch(baseUrl, { method: 'POST' })).status, 200);
  assert.deepEqual(readdirSync(reportsDir), beforeGeneration);
  assert.equal((await fetch(`${baseUrl}/${jsonFilename}`, { method: 'DELETE' })).status, 204);
  assert.equal(existsSync(path.join(reportsDir, jsonFilename)), false);
  assert.equal(existsSync(path.join(reportsDir, legacyFilename)), false);
  assert.deepEqual(await (await fetch(baseUrl)).json(), []);
  assert.equal((await fetch(`${baseUrl}/${jsonFilename}`)).status, 404);
});

test('invalid names and encoded traversal cannot read or delete files outside reports', async () => {
  const outsideFile = path.join(temporaryRoot, 'outside.txt');
  writeFileSync(outsideFile, 'preserve me');
  for (const filename of ['outside.txt', '..%2Foutside.txt', '..%5Coutside.txt',
    'user-report_2026-08-30.json.bak', 'user-report_2026-08-30.json%0A']) {
    assert.equal((await fetch(`${baseUrl}/${filename}`)).status, 404);
    assert.equal((await fetch(`${baseUrl}/${filename}`, { method: 'DELETE' })).status, 404);
  }
  assert.equal(readFileSync(outsideFile, 'utf8'), 'preserve me');
  saveLegacy();
  deleteSavedReport(legacyFilename);
  assert.equal(existsSync(path.join(reportsDir, legacyFilename)), false);
  assert.throws(() => deleteSavedReport('../outside.txt'), /report not found/);
});

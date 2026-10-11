import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, renameSync, statSync, unlinkSync, utimesSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './db.js';

export const REPORT_TIME_ZONE = 'America/Chicago';
export const REPORTS_DIR = process.env.REPORTS_DIR
  || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../reports');

const TASKS_PER_DAY = 20;
const WEEKDAYS_PER_WEEK = 5;
const POINTS_PER_TASK = 10;
const WEEKLY_TASK_TARGET = TASKS_PER_DAY * WEEKDAYS_PER_WEEK;
const WEEKLY_POINT_TARGET = WEEKLY_TASK_TARGET * POINTS_PER_TASK;

// The final assertion requires the actual end of the string, including rejecting a trailing newline.
export const REPORT_NAME = /^(?:Allowance-Totals_Week-of-[A-Za-z]+-\d{1,2}(?:st|nd|rd|th)(?:-\d{4})?|user-report_\d{4}-\d{2}-\d{2}(?:_\d{3})?)\.(?:txt|json)(?![\s\S])/;

function reportPath(filename) {
  if (!REPORT_NAME.test(filename)) throw new Error('report not found');
  return path.join(REPORTS_DIR, filename);
}

function isReportFile(filename) {
  return REPORT_NAME.test(filename) && lstatSync(reportPath(filename)).isFile();
}

function addDays(isoDate, amount) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function centralParts(date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: REPORT_TIME_ZONE,
    year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short',
    hour: '2-digit', hourCycle: 'h23',
  }).formatToParts(date);
  return Object.fromEntries(parts.map(({ type, value }) => [type, value]));
}

function localIsoDate(date) {
  const p = centralParts(date);
  return `${p.year}-${p.month}-${p.day}`;
}

export function reportWeek(referenceDate = new Date()) {
  const iso = localIsoDate(referenceDate);
  const weekday = new Date(`${iso}T00:00:00Z`).getUTCDay();
  // A Sunday report covers the Monday-Friday that just ended.
  const monday = addDays(iso, weekday === 0 ? -6 : 1 - weekday);
  return { monday, friday: addDays(monday, 4) };
}

function ordinal(day) {
  const remainder100 = day % 100;
  if (remainder100 >= 11 && remainder100 <= 13) return `${day}th`;
  const suffix = day % 10 === 1 ? 'st' : day % 10 === 2 ? 'nd' : day % 10 === 3 ? 'rd' : 'th';
  return `${day}${suffix}`;
}

function dateParts(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  const name = new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' })
    .format(new Date(Date.UTC(year, month - 1, day)));
  return { year, month, day, name };
}

export function reportFilename(monday) {
  const { name, day, year } = dateParts(monday);
  return `Allowance-Totals_Week-of-${name}-${ordinal(day)}-${year}.json`;
}

function displayDate(isoDate) {
  const { year, name, day } = dateParts(isoDate);
  return `${name} ${ordinal(day)}, ${year}`;
}

function allowanceBreakdown(totalCents) {
  const roundUpToNickel = (cents) => Math.ceil(cents / 5) * 5;
  const category = (cents) => ({
    original: cents,
    rounded: roundUpToNickel(cents),
    adjustment: roundUpToNickel(cents) - cents,
  });
  const categories = {
    spending: category(Math.round(totalCents * 0.5)),
    savings: category(Math.round(totalCents * 0.3)),
    giving: category(Math.round(totalCents * 0.1)),
    taxes: category(Math.round(totalCents * 0.1)),
  };
  const additionalRounding = Object.values(categories)
    .reduce((sum, item) => sum + item.adjustment, 0);
  return { categories, additionalRounding, grandTotal: totalCents + additionalRounding };
}

export function generateAllowanceReport(referenceDate = new Date()) {
  const { monday, friday } = reportWeek(referenceDate);
  const members = db.prepare(
    `SELECT id, name, weekly_allowance_cents FROM members
      WHERE weekly_allowance_cents IS NOT NULL ORDER BY id`
  ).all();
  const dailyCounts = db.prepare(
    `SELECT c.due_date, COUNT(*) AS completed
       FROM routine_step_completions c
       JOIN routine_steps s ON s.id = c.step_id
       JOIN routines r ON r.id = s.routine_id
      WHERE r.member_id = ? AND c.due_date BETWEEN ? AND ?
      GROUP BY c.due_date`
  );

  return {
    monday,
    friday,
    mondayLabel: displayDate(monday),
    fridayLabel: displayDate(friday),
    taskTarget: WEEKLY_TASK_TARGET,
    pointTarget: WEEKLY_POINT_TARGET,
    members: members.map((member) => {
      const creditedTasks = dailyCounts.all(member.id, monday, friday)
        .reduce((sum, row) => sum + Math.min(Number(row.completed), TASKS_PER_DAY), 0);
      const points = creditedTasks * POINTS_PER_TASK;
      const percent = Math.round((creditedTasks / WEEKLY_TASK_TARGET) * 100);
      const allowanceCents = Math.ceil(
        (member.weekly_allowance_cents * creditedTasks) / WEEKLY_TASK_TARGET / 10
      ) * 10;
      const breakdown = allowanceBreakdown(allowanceCents);
      const categories = Object.fromEntries(
        Object.entries(breakdown.categories).map(([key, category]) => [key, {
          originalCents: category.original,
          roundedCents: category.rounded,
          adjustmentCents: category.adjustment,
        }])
      );

      return {
        id: member.id,
        name: member.name,
        weeklyAllowanceCents: member.weekly_allowance_cents,
        creditedTasks,
        points,
        percent,
        allowanceCents,
        additionalRoundingCents: breakdown.additionalRounding,
        grandTotalCents: breakdown.grandTotal,
        categories,
      };
    }),
  };
}

export function generateWeeklyReport(
  referenceDate = new Date(),
  { overwrite = false, outputFilename } = {}
) {
  const { monday, friday } = reportWeek(referenceDate);
  // Custom callers may still pass the old TXT extension; all new snapshots are JSON.
  let filename = (outputFilename || reportFilename(monday)).replace(/\.txt$/, '.json');
  let filePath = reportPath(filename);
  mkdirSync(REPORTS_DIR, { recursive: true });
  migrateLegacyReports();
  if (!overwrite && existsSync(filePath)) {
    return { filename, filePath, created: false, monday, friday };
  }
  if (!outputFilename) {
    // An archived weekly report is authoritative even if its old name omits the year.
    const existing = listSavedReports().find((item) => (
      item.filename.startsWith('Allowance-Totals_Week-of-') && item.monday === monday
    ));
    if (existing) {
      if (!overwrite) {
        return { filename: existing.filename, filePath: reportPath(existing.filename), created: false, monday, friday };
      }
      // An explicit overwrite updates the existing snapshot rather than creating a duplicate week.
      filename = existing.filename;
      filePath = reportPath(filename);
    }
    // A damaged legacy report must not be replaced with a newly calculated history.
    const legacyName = filename.replace(/-\d{4}\.json$/, '.txt');
    if (!overwrite && existsSync(reportPath(legacyName))) {
      try {
        readSavedReport(legacyName);
      } catch {
        throw new Error(`Cannot generate this week until the archived report can be read: ${legacyName}`);
      }
    }
  }

  const report = generateAllowanceReport(referenceDate);
  writeSnapshot(filePath, report);
  return { filename, filePath, created: true, monday, friday };
}

function writeSnapshot(filePath, report, originalStat) {
  const tempPath = `${filePath}.tmp-${process.pid}`;
  try {
    writeFileSync(tempPath, `${JSON.stringify({ schemaVersion: 1, ...report }, null, 2)}\n`, 'utf8');
    if (originalStat) utimesSync(tempPath, originalStat.atime, originalStat.mtime);
    renameSync(tempPath, filePath);
  } finally {
    if (existsSync(tempPath)) unlinkSync(tempPath);
  }
}

function parseArchivedDate(label) {
  const match = /^([A-Za-z]+) (\d{1,2})(?:st|nd|rd|th), (\d{4})$/.exec(label);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  if (!match || !monthNames.includes(match[1])) throw new Error('Invalid archived report date');
  const month = monthNames.indexOf(match[1]) + 1;
  const isoDate = `${match[3]}-${String(month).padStart(2, '0')}-${match[2].padStart(2, '0')}`;
  if (new Date(`${isoDate}T00:00:00Z`).toISOString().slice(0, 10) !== isoDate) {
    throw new Error('Invalid archived report date');
  }
  return isoDate;
}

function cents(value) {
  const [dollars, fraction] = value.split('.');
  return Number(dollars) * 100 + Number(fraction);
}

function requiredMatch(pattern, value, field) {
  const match = pattern.exec(value);
  if (!match) throw new Error(`Missing ${field} in archived report`);
  return match;
}

// Parse the saved text only. Looking up current members or completions would change history.
export function parseLegacyReport(text) {
  text = text.replace(/\r/g, '');
  const dates = requiredMatch(/^Week of (.+) through (.+)$/m, text, 'week dates');
  const report = {
    monday: parseArchivedDate(dates[1]),
    friday: parseArchivedDate(dates[2]),
    mondayLabel: dates[1],
    fridayLabel: dates[2],
    taskTarget: WEEKLY_TASK_TARGET,
    pointTarget: WEEKLY_POINT_TARGET,
    members: [],
  };
  const headers = [...text.matchAll(/^(.+) [—–-] TOTAL ALLOWANCE EARNED:\s*\$(\d+\.\d{2})\s*$/gm)];
  if ((text.match(/TOTAL ALLOWANCE EARNED:/g) || []).length !== headers.length) {
    throw new Error('Invalid member total in archived report');
  }
  if (headers.length === 0 && !text.includes('No family members have a weekly allowance configured.')) {
    throw new Error('No member totals found in archived report');
  }
  for (const [index, header] of headers.entries()) {
    const block = text.slice(header.index, headers[index + 1]?.index ?? text.length);
    const additional = requiredMatch(/^[^\r\n]+ [—–-] ADDITIONAL ROUNDING:\s*\$(\d+\.\d{2})\s*$/m, block, 'rounding');
    const grand = requiredMatch(/^[^\r\n]+ [—–-] GRAND TOTAL:\s*\$(\d+\.\d{2})\s*$/m, block, 'grand total');
    const full = requiredMatch(/^\s*Full weekly allowance:\s*\$(\d+\.\d{2})\s*$/m, block, 'weekly allowance');
    const tasks = requiredMatch(/^\s*Tasks completed:\s*(\d+) of (\d+)\s*$/m, block, 'task count');
    const points = requiredMatch(/^\s*Points earned:\s*(\d+) of (\d+)\s*$/m, block, 'points');
    const completion = requiredMatch(/^\s*Completion:\s*(\d+)%\s*$/m, block, 'completion');
    if (index > 0 && (report.taskTarget !== Number(tasks[2]) || report.pointTarget !== Number(points[2]))) {
      throw new Error('Inconsistent targets in archived report');
    }
    report.taskTarget = Number(tasks[2]);
    report.pointTarget = Number(points[2]);
    const categories = {};
    for (const key of ['spending', 'savings', 'giving', 'taxes']) {
      const category = requiredMatch(new RegExp(
        `^\\s*${key.toUpperCase()}\\s+\\(\\d+%\\):\\s*\\$(\\d+\\.\\d{2})(?: \\(\\+\\$(\\d+\\.\\d{2})\\) = \\$(\\d+\\.\\d{2}))?\\s*$`, 'm'
      ), block, key);
      categories[key] = {
        originalCents: cents(category[1]),
        adjustmentCents: category[2] ? cents(category[2]) : 0,
        roundedCents: cents(category[3] || category[1]),
      };
    }
    report.members.push({
      id: `legacy-${index + 1}`,
      name: header[1],
      weeklyAllowanceCents: cents(full[1]),
      creditedTasks: Number(tasks[1]),
      points: Number(points[1]),
      percent: Number(completion[1]),
      allowanceCents: cents(header[2]),
      additionalRoundingCents: cents(additional[1]),
      grandTotalCents: cents(grand[1]),
      categories,
    });
  }
  return validateSnapshot(report);
}

function validateSnapshot(report) {
  const isCount = (value) => Number.isSafeInteger(value) && value >= 0;
  const isIsoDate = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && !Number.isNaN(Date.parse(`${value}T00:00:00Z`))
    && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
  if (!report || !isIsoDate(report.monday) || !isIsoDate(report.friday)
    || typeof report.mondayLabel !== 'string' || typeof report.fridayLabel !== 'string'
    || !isCount(report.taskTarget) || report.taskTarget === 0
    || !isCount(report.pointTarget) || report.pointTarget === 0 || !Array.isArray(report.members)) {
    throw new Error('Invalid saved report');
  }
  const countFields = ['weeklyAllowanceCents', 'creditedTasks', 'points', 'percent',
    'allowanceCents', 'additionalRoundingCents', 'grandTotalCents'];
  for (const member of report.members) {
    if (!member || !['string', 'number'].includes(typeof member.id) || typeof member.name !== 'string'
      || !countFields.every((field) => isCount(member[field]))
      || !['spending', 'savings', 'giving', 'taxes'].every((key) => (
        member.categories?.[key] && ['originalCents', 'roundedCents', 'adjustmentCents']
          .every((field) => isCount(member.categories[key][field]))
      ))) throw new Error('Invalid saved report member');
  }
  return report;
}

function readJsonSnapshot(filename) {
  if (!isReportFile(filename)) throw new Error('report not found');
  return validateSnapshot(JSON.parse(readFileSync(reportPath(filename), 'utf8')));
}

function convertLegacyReport(filename) {
  if (!isReportFile(filename)) throw new Error('report not found');
  const jsonFilename = filename.replace(/\.txt$/, '.json');
  if (existsSync(reportPath(jsonFilename))) {
    // Validate the conversion before hiding its TXT source from the list.
    try {
      return readJsonSnapshot(jsonFilename);
    } catch {
      // A damaged generated copy can be recovered from its retained historical source.
      // Directories and symlinks are never migration destinations.
      if (!isReportFile(jsonFilename)) throw new Error('report not found');
    }
  }
  const filePath = reportPath(filename);
  const originalStat = statSync(filePath);
  const report = parseLegacyReport(readFileSync(filePath, 'utf8'));
  writeSnapshot(reportPath(jsonFilename), report, originalStat);
  return report;
}

export function migrateLegacyReports() {
  const result = { converted: [], failed: [] };
  if (!existsSync(REPORTS_DIR)) return result;
  for (const filename of readdirSync(REPORTS_DIR).filter((name) => REPORT_NAME.test(name) && name.endsWith('.txt'))) {
    try {
      const alreadyConverted = existsSync(reportPath(filename.replace(/\.txt$/, '.json')));
      convertLegacyReport(filename);
      if (!alreadyConverted) result.converted.push(filename);
    } catch (error) {
      result.failed.push({ filename, error: error.message });
      console.error(`[reports] Could not convert ${filename}: ${error.message}`);
    }
  }
  return result;
}

export function readSavedReport(filename) {
  if (!REPORT_NAME.test(filename)) throw new Error('report not found');
  if (filename.endsWith('.txt')) {
    if (!existsSync(reportPath(filename))) throw new Error('report not found');
    return convertLegacyReport(filename);
  }
  const legacyFilename = filename.replace(/\.json$/, '.txt');
  if (!existsSync(reportPath(filename))) {
    if (existsSync(reportPath(legacyFilename))) return convertLegacyReport(legacyFilename);
    throw new Error('report not found');
  }
  try {
    return readJsonSnapshot(filename);
  } catch (error) {
    if (existsSync(reportPath(legacyFilename))) return convertLegacyReport(legacyFilename);
    throw error;
  }
}

export function listSavedReports() {
  if (!existsSync(REPORTS_DIR)) return [];
  migrateLegacyReports();
  const reports = readdirSync(REPORTS_DIR).filter(isReportFile).map(reportInfo);
  const readableJson = new Set(reports.filter((item) => item.readable && item.filename.endsWith('.json'))
    .map((item) => item.filename.replace(/\.json$/, '.txt')));
  return reports.filter((item) => !readableJson.has(item.filename))
    .sort((a, b) => b.created_at.localeCompare(a.created_at) || a.filename.localeCompare(b.filename));
}

export function deleteSavedReport(filename) {
  const filePath = reportPath(filename);
  if (!existsSync(filePath) || !isReportFile(filename)) throw new Error('report not found');
  const counterpart = filename.replace(/\.(txt|json)$/, filename.endsWith('.txt') ? '.json' : '.txt');
  unlinkSync(filePath);
  if (existsSync(reportPath(counterpart)) && isReportFile(counterpart)) unlinkSync(reportPath(counterpart));
}

function scheduleNextSunday() {
  const now = new Date();
  const target = new Date(now);
  target.setHours(2, 0, 0, 0);
  let days = (7 - now.getDay()) % 7;
  if (days === 0 && now >= target) days = 7;
  target.setDate(target.getDate() + days);
  const scheduledFor = new Date(target);

  return setTimeout(() => {
    try {
      // Use the intended Sunday as the report reference. If the Mac was asleep
      // at 2:00, the delayed timer may actually run after midnight on Monday.
      const result = generateWeeklyReport(scheduledFor);
      console.log(`[reports] ${result.created ? 'Generated' : 'Already exists'}: ${result.filename}`);
    } catch (error) {
      console.error('[reports] Weekly report failed:', error);
    }
    scheduleNextSunday();
  }, Math.max(0, target.getTime() - now.getTime()));
}

export function startWeeklyReportScheduler() {
  migrateLegacyReports();
  // If the server restarts later on Sunday, make that morning's report once.
  const now = new Date();
  const parts = centralParts(now);
  if (parts.weekday === 'Sun' && Number(parts.hour) >= 2) {
    try {
      generateWeeklyReport(now);
    } catch (error) {
      console.error('[reports] Sunday catch-up report failed:', error);
    }
  }
  return scheduleNextSunday();
}

export function reportInfo(filename) {
  const stat = statSync(reportPath(filename));
  const info = { filename, size: stat.size, created_at: stat.mtime.toISOString() };
  try {
    const report = readSavedReport(filename);
    return { ...info, readable: true, monday: report.monday, friday: report.friday,
      mondayLabel: report.mondayLabel, fridayLabel: report.fridayLabel };
  } catch {
    // Keep unreadable files visible so a damaged archive never silently disappears.
    return { ...info, readable: false };
  }
}

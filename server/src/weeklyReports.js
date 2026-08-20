import { existsSync, mkdirSync, renameSync, statSync, writeFileSync } from 'node:fs';
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
  const { name, day } = dateParts(monday);
  return `Allowance-Totals_Week-of-${name}-${ordinal(day)}.txt`;
}

function displayDate(isoDate) {
  const { year, name, day } = dateParts(isoDate);
  return `${name} ${ordinal(day)}, ${year}`;
}

function money(cents) {
  return `$${(cents / 100).toFixed(2)}`;
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

function categoryLine(label, percent, category) {
  const base = `  ${label.padEnd(8)} (${percent}%):  ${money(category.original)}`;
  return category.adjustment === 0
    ? base
    : `${base} (+${money(category.adjustment)}) = ${money(category.rounded)}`;
}

export function generateWeeklyReport(
  referenceDate = new Date(),
  { overwrite = false, outputFilename } = {}
) {
  const { monday, friday } = reportWeek(referenceDate);
  const filename = outputFilename || reportFilename(monday);
  mkdirSync(REPORTS_DIR, { recursive: true });
  const filePath = path.join(REPORTS_DIR, filename);
  if (!overwrite && existsSync(filePath)) {
    return { filename, filePath, created: false, monday, friday };
  }

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

  const lines = [
    'ALLOWANCE TOTALS',
    `Week of ${displayDate(monday)} through ${displayDate(friday)}`,
    '',
  ];
  if (members.length === 0) {
    lines.push('No family members have a weekly allowance configured.');
  }

  for (const member of members) {
    const creditedTasks = dailyCounts.all(member.id, monday, friday)
      .reduce((sum, row) => sum + Math.min(Number(row.completed), TASKS_PER_DAY), 0);
    const points = creditedTasks * POINTS_PER_TASK;
    const percent = Math.round((creditedTasks / WEEKLY_TASK_TARGET) * 100);
    // Calculate the exact pro-rata payout, then round upward to a dime.
    const roundedAllowanceCents = Math.ceil(
      (member.weekly_allowance_cents * creditedTasks) / WEEKLY_TASK_TARGET / 10
    ) * 10;
    const breakdown = allowanceBreakdown(roundedAllowanceCents);
    const memberName = member.name.toUpperCase();

    lines.push(
      '============================================================',
      `${memberName} — TOTAL ALLOWANCE EARNED: ${money(roundedAllowanceCents)}`,
      `${memberName} — ADDITIONAL ROUNDING:    ${money(breakdown.additionalRounding)}`,
      '',
      `${memberName} — GRAND TOTAL:            ${money(breakdown.grandTotal)}`,
      '============================================================',
      categoryLine('SPENDING', 50, breakdown.categories.spending),
      categoryLine('SAVINGS', 30, breakdown.categories.savings),
      categoryLine('GIVING', 10, breakdown.categories.giving),
      categoryLine('TAXES', 10, breakdown.categories.taxes),
      '------------------------------------------------------------',
      `  Full weekly allowance: ${money(member.weekly_allowance_cents)}`,
      `  Tasks completed: ${creditedTasks} of ${WEEKLY_TASK_TARGET}`,
      `  Points earned: ${points} of ${WEEKLY_POINT_TARGET}`,
      `  Completion: ${percent}%`,
      ''
    );
  }

  lines.push(
    'Each completed task earns 10 points. Earned allowances are rounded up to the nearest $0.10.',
    'Each category is then rounded up to the nearest $0.05; the added amount is shown above.'
  );
  const tempPath = `${filePath}.tmp-${process.pid}`;
  writeFileSync(tempPath, `${lines.join('\n')}\n`, 'utf8');
  renameSync(tempPath, filePath);
  return { filename, filePath, created: true, monday, friday };
}

export function generateUserReport(referenceDate = new Date()) {
  mkdirSync(REPORTS_DIR, { recursive: true });
  const date = localIsoDate(referenceDate);
  const base = `user-report_${date}`;
  let filename = `${base}.txt`;
  let sequence = 1;
  while (existsSync(path.join(REPORTS_DIR, filename))) {
    filename = `${base}_${String(sequence).padStart(3, '0')}.txt`;
    sequence += 1;
  }
  return generateWeeklyReport(referenceDate, { outputFilename: filename });
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
  const stat = statSync(path.join(REPORTS_DIR, filename));
  return { filename, size: stat.size, created_at: stat.mtime.toISOString() };
}

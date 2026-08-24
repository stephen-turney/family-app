import { Router } from 'express';
import { existsSync, readdirSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { REPORTS_DIR, generateAllowanceReport, reportInfo } from '../weeklyReports.js';

export const reportsRouter = Router();
const REPORT_NAME = /^(?:Allowance-Totals_Week-of-[A-Za-z]+-\d{1,2}(?:st|nd|rd|th)|user-report_\d{4}-\d{2}-\d{2}(?:_\d{3})?)\.txt$/;

reportsRouter.post('/', (req, res) => {
  res.json(generateAllowanceReport(new Date()));
});

reportsRouter.get('/', (req, res) => {
  if (!existsSync(REPORTS_DIR)) return res.json([]);
  const reports = readdirSync(REPORTS_DIR)
    .filter((filename) => REPORT_NAME.test(filename))
    .map(reportInfo)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  res.json(reports);
});

reportsRouter.get('/:filename', (req, res) => {
  const { filename } = req.params;
  if (!REPORT_NAME.test(filename)) return res.status(404).json({ error: 'report not found' });
  const filePath = path.join(REPORTS_DIR, filename);
  if (!existsSync(filePath)) return res.status(404).json({ error: 'report not found' });
  res.download(filePath, filename);
});

reportsRouter.delete('/:filename', (req, res) => {
  const { filename } = req.params;
  if (!REPORT_NAME.test(filename)) return res.status(404).json({ error: 'report not found' });
  const filePath = path.join(REPORTS_DIR, filename);
  if (!existsSync(filePath)) return res.status(404).json({ error: 'report not found' });
  unlinkSync(filePath);
  res.status(204).end();
});

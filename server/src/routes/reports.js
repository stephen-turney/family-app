import { Router } from 'express';
import { REPORT_NAME, deleteSavedReport, generateAllowanceReport, listSavedReports, readSavedReport } from '../weeklyReports.js';

export const reportsRouter = Router();

reportsRouter.post('/', (req, res) => {
  res.json(generateAllowanceReport(new Date()));
});

reportsRouter.get('/', (req, res) => {
  res.json(listSavedReports());
});

reportsRouter.get('/:filename', (req, res) => {
  const { filename } = req.params;
  if (!REPORT_NAME.test(filename)) return res.status(404).json({ error: 'report not found' });
  try {
    res.json(readSavedReport(filename));
  } catch (error) {
    res.status(error.message === 'report not found' ? 404 : 422)
      .json({ error: error.message === 'report not found' ? error.message : 'This saved report could not be read.' });
  }
});

reportsRouter.delete('/:filename', (req, res) => {
  const { filename } = req.params;
  if (!REPORT_NAME.test(filename)) return res.status(404).json({ error: 'report not found' });
  try {
    deleteSavedReport(filename);
    res.status(204).end();
  } catch (error) {
    if (error.message === 'report not found') return res.status(404).json({ error: error.message });
    throw error;
  }
});

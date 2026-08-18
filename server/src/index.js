import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import './db.js';
import { membersRouter } from './routes/members.js';
import { choresRouter } from './routes/chores.js';
import { routinesRouter } from './routes/routines.js';
import { progressRouter } from './routes/progress.js';
import { settingsRouter } from './routes/settings.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '5mb' })); // room for base64 avatar images

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/members', membersRouter);
// Chores are still hidden from the UI but the routes stay mounted, ready for when
// they come back. Calendars/events were removed entirely — see _archive/.
app.use('/api/chores', choresRouter);
app.use('/api/routines', routinesRouter);
app.use('/api/progress', progressRouter);
app.use('/api/settings', settingsRouter);

// Serve the built frontend, so one process on one port is the whole app — that's
// what makes hosting it on the home network a single `node src/index.js`. In dev
// you still run Vite instead (it proxies /api here), and this block is inert
// because it only matches paths the API didn't claim above.
const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');

if (existsSync(path.join(DIST, 'index.html'))) {
  // Vite hashes asset filenames, so they can be cached hard; index.html must not
  // be, or a rebuild would keep serving the old asset URLs to a tablet.
  app.use('/assets', express.static(path.join(DIST, 'assets'), { maxAge: '1y', immutable: true }));
  app.use(express.static(DIST));

  // SPA fallback: /tasks/3 is a client route with no file behind it, so it has to
  // get index.html. /api is passed through untouched, or a typo'd endpoint would
  // return the app's HTML with a 200 instead of a 404.
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(DIST, 'index.html'));
  });
} else {
  console.warn(`[server] No built frontend at ${DIST} — API only. Run 'npm run build' in client/.`);
}

// Generic error guard so a thrown route never crashes the process.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: String(err.message || err) });
});

// No host argument: bind every interface, so other devices on the home network
// can reach it by this Mac's IP or .local name, not just localhost.
app.listen(PORT, () => {
  console.log(`[server] Daily checklist listening on http://localhost:${PORT}`);
});

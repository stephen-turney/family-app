# Family Hub

A daily routine checklist for the kids: Morning / Afternoon / Evening blocks of big tappable rows,
one sheet per child, modelled on the printed chore chart on the fridge. Every row carries a picture
so a child who can't read yet can still find their task.

Built as an MVP with a React (Vite) frontend and a Node/Express + SQLite backend.

## Features

- **Home** — the landing page: today's date, then one large photo per family member with their
  progress. Tap someone to open their checklist. The family name in the header returns here.
- **A tab per person** — the top bar carries *Overview* (everyone side by side) and a tab for each
  family member, with Settings as a gear on the far right.
- **Daily checklist** — each person's day split into Morning / Afternoon / Evening, with a tinted
  graphic panel beside each block, exactly as tall as the rows next to it. A routine's own name
  ("Before School") is the block heading. The whole row is the tap target, sized for a tablet.
- **Day navigation** — step back and forward a day at a time on a person's checklist; ticks land on
  the day you're looking at, so an unfinished yesterday can still be completed.
- **Progress** — each member's completion count and % for the day, on their card and on Home.
- **Weekly allowance reports** — every Sunday at 2:00 a.m. Central, the server totals Monday–Friday
  completions (10 points each, capped at 20 per day), calculates each child's completion percentage
  and pro-rata allowance, rounds the payout up to the nearest dime, and adds a downloadable text
  report under Settings → Reports. Reports can also be generated on demand there; manual files use
  `user-report_YYYY-MM-DD.txt`, then `_001`, `_002`, and so on for additional runs that day. Any
  report can be downloaded or deleted from the same list. Each child's final payout is prominently
  divided into spending (50%), savings (30%), giving (10%), and taxes (10%). Each category is
  rounded upward to the nearest $0.05, with the extra rounding and resulting grand total shown.
- **Task pictures** — ~90 emoji in 12 groups, matched from the task's own wording, or chosen
  explicitly per step from a searchable picker.
- **Members** — name, colour, emoji, optional photo avatar (resized in the browser), and full weekly
  allowance. Members without an allowance are omitted from allowance reports.
- Data lives in a local SQLite file so every device on your network shares it in real time.

Calendar merging and iCal sync were removed in August 2026 to keep this focused on the checklist.
The code and the removed data are parked in [`_archive/`](_archive/README.md) if they're ever wanted
back. Chores exist in the database and the API but are hidden from the UI.

## Requirements

- **Node.js 22+** (uses the built-in `node:sqlite` module — no native build step).
  Verified on Node 26.

## Running it

**Double-click `start.command`** in the project folder. It installs dependencies on first
run, starts both halves, waits until each one actually answers a request, opens
http://localhost:5173 in your browser, and streams both logs into the Terminal window.
Ctrl-C — or just closing the window — stops both.

```bash
./start.command                # same thing from a shell
./start.command --no-browser   # don't open a browser tab
./start.command --local-only   # this Mac only; skip binding to the home network
./start.command --help
```

By default the development web server is bound to your local network, so current phones and
tablets can open the hub at the `http://<your-mac-ip>:5173` address it prints on startup. Full
logs are kept in `logs/server.log` and `logs/client.log`. The old iOS 10 iPad must use the
production build on port 3001 instead; see the next section.

If the API is already running when you launch, it's reused as-is and left running on exit.

### Or start the two halves by hand

**1. Backend** (API on http://localhost:3001):

```bash
cd server
npm install
npm start        # or: npm run dev  (auto-restart on changes)
```

On first run it creates `server/data.sqlite` and seeds one child with three routines so the app
isn't empty. Delete `server/data.sqlite*` to start over.

**2. Frontend** (app on http://localhost:5173):

```bash
cd client
npm install
npm run dev
```

Then open http://localhost:5173. The Vite dev server proxies `/api/*` to the backend.

### Old iPad / iOS 10

Vite's development server on port 5173 sends modern JavaScript that Safari on iOS 10 cannot
parse. The production build includes a separate legacy bundle and polyfills targeted at iOS 10.
Build the client, then let the Express server serve both the app and API from port 3001:

```bash
cd client
npm run build

cd ../server
npm start
```

On the iPad, open `http://<your-mac-ip>:3001` (not port 5173). Re-run `npm run build` after client
changes. If the launchd hosting agent is installed, it already serves this built version on port
3001; rebuilding `client/dist` is enough to publish a client-only change.

## Setting up a child's checklist

1. **⚙️ (top right) → Members → + Add member** — name, colour, and optionally a photo. They get
   their own tab in the top bar straight away.
2. Open their checklist from Home, then use **+ Add a routine** (or the dashed button inside an
   empty Morning / Afternoon / Evening block, which preselects that time of day).
3. Give the routine the name you want as the block's heading — "Before School" reads better than
   "Morning", which the panel already says — and add its steps in order.

Note: routines can be created but **not yet edited or deleted from the UI**, so get the wording
right first; fixing it currently means editing the database directly.

## Project layout

```
server/   Express API + SQLite (node:sqlite)
  src/db.js              schema, migrations, seed
  src/weeklyReports.js   weekly allowance calculation, file generation, Sunday scheduler
  src/routes/            members, routines, progress, settings, reports, chores (hidden)
client/   React + Vite
  src/pages/             HomePage, TasksPage, FamilyPage (= Settings)
  src/components/        Modal, RoutineModal, Avatar, IconPicker
  src/lib/taskIcons.js   task picture library + keyword matcher
  src/api/client.js      fetch wrapper + TanStack Query hooks
_archive/ removed features, kept so they can come back (see its README)
```

## Notes / not yet built

Editing and deleting routines in the UI is the main gap. Chores are hidden rather than gone.
Meal planning, shopping lists, rewards redemption, and accounts/auth are out of scope — there is no
authentication at all, since this is designed for a trusted home network.

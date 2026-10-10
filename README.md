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
  report under Settings → Reports. Reports generated on demand open immediately in a formatted
  popup instead of creating a file. Scheduled reports can be downloaded or deleted from the list.
  Each child's final payout is prominently
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

The Halloween skin adds a purple night sky, charcoal cards, pumpkin accents, and friendly SVG
ghosts and bats across Home, checklists, Settings, and dialogs. The skin lives in
`client/src/halloween.css`, applies seasonal member colours without changing saved values,
keeps member photos, and respects reduced-motion preferences.
Completed checkboxes show a cartoon knife embedded at the centre of a wooden block. The default
done task picture and block celebration remain checkmarks; custom done pictures are preserved.

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

### Windows scheduled-task hosting

On the Windows home server, Family Hub runs as the scheduled task **`Family Hub`**. It starts
`C:\Program Files\nodejs\node.exe src\index.js` with its working directory set to
`C:\Family Hub\server`, and serves the built app and API on port 3001.

After changing anything under `server/`, restart the task so Node loads the new code. After a
client change, build first, then restart the task if the update also changes the server:

```powershell
cd 'C:\Family Hub\client'
npm run build
```

In **Task Scheduler**, select **Task Scheduler Library → Family Hub**, right-click the task, choose
**End**, then right-click it again and choose **Run**. This only restarts the web server; it does not
delete or reset `C:\Family Hub\server\data.sqlite`.

If your Windows account has permission to control the task, the equivalent PowerShell commands are:

```powershell
schtasks /end /tn "\Family Hub"
schtasks /run /tn "\Family Hub"
```

### Encrypted cloud database backups

Do not commit `server/data.sqlite` or database snapshots to Git: they contain
private family information. Use the included Restic-to-Backblaze B2 job instead.
Restic encrypts each backup before upload, while `hosting/backup-db.mjs` creates
a SQLite-consistent snapshot that includes live WAL changes.

1. Create a **private** Backblaze B2 bucket and a B2 application key restricted
   to that bucket with read/write access.
2. Install [Restic](https://restic.net/) and ensure `restic` is on your PATH.
3. Copy `hosting/restic.env.example` to `hosting/restic.env`, then fill in the
   B2 key ID, application key, and bucket name. This file is ignored by Git.
4. Put a long, unique Restic passphrase in the local text file named by
   `RESTIC_PASSWORD_FILE`. Store a second copy of that passphrase somewhere
   safe; without it, the cloud backups cannot be recovered.
5. In an elevated PowerShell, run:

   ```powershell
   cd 'C:\Family Hub\hosting'
   .\install-restic-backup.ps1 -RunNow
   ```

The task runs at 3:30 AM daily, retains 30 daily and 12 monthly snapshots, and
runs a repository integrity check each Sunday. Its log is
`C:\Family Hub\logs\restic-backup.log`.

### Restarting the Raspberry Pi production service

The production server on the Raspberry Pi runs as the systemd service `familyhub`. After pulling
changes that modify anything under `server/`, restart the service so Node loads the new backend
code:

```bash
sudo systemctl restart familyhub
sudo systemctl status familyhub --no-pager
```

To inspect recent server output when troubleshooting:

```bash
sudo journalctl -u familyhub -n 100 --no-pager
```

Changes limited to `client/` only require rebuilding the production client:

```bash
cd client
npm run build
```

If an update includes both client and server changes, rebuild the client and restart `familyhub`.
Restarting the service does not delete or reset `server/data.sqlite`.

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

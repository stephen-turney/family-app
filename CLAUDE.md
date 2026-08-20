# Family Hub — project context

A **daily routine checklist** for the two kids, Everett and Beau: Morning / Afternoon / Evening
blocks of tappable rows on a tablet, modelled on the printed chore sheet on their corkboard, with a
per-day progress readout. Built as an MVP over several sessions. This file is the fast on-ramp for
picking the work back up.

It started as a Skylight-Calendar–style family organizer (merged calendars, chores, routines). On
**2026-08-15 the user deliberately narrowed it**: "get rid of the calendar function completely…
all I want right now is for it to be a clean, simple, daily routine checklist." What that removed
is in the next section — and, because there's still no version control, physically in `_archive/`.

## Where we left off (2026-08-15, later)

**The calendar is gone and the family is just the two kids.** Removed, with everything needed to
put it back parked in `_archive/` (read `_archive/README.md` first — it has the restore steps):

- Client: `CalendarPage`, `EventModal`, the `/calendar` route + nav link, `useCalendars`/`useEvents`,
  the Calendars section of `/settings`, all react-big-calendar overrides in `styles.css`, and the
  `react-big-calendar` dependency (`npm uninstall`ed). Bundle went **450 kB → 256 kB** of JS and
  27 kB → 10.7 kB of CSS.
- Server: `routes/calendars.js`, `routes/events.js`, `services/icalSync.js` (the whole `services/`
  dir), both routers, the 30-minute sync interval, the `node-ical` dependency — plus the junk that
  was flagged long ago, the stray `server/:3001` file and `npm`-as-a-dependency.
- Schema: the `calendars` and `events` tables are dropped from `db.js` **and from the live DB**.
  Their rows are in `_archive/calendar/removed-data.json`: 5 calendars, 196 events (194 of them
  iCal-synced), **including the private Google iCal URL** — so restoring the feed is a copy-paste,
  and that file must never be committed to a public repo.
- Members: **Mom and Dad are deleted** (their routines and steps cascaded away with them). Only
  Everett (23 steps) and Beau (20) remain. Their rows are in the same dump.
- `/tasks` grid columns are now capped at 420px and centred; with two members `auto-fill` was
  leaving two empty tracks and half an empty screen (see the gotcha below).
- A catch-all `*` route sends any unknown path — a bookmarked `/calendar` included — to `/home`.
- The seed (fresh DBs only) is now one child, "Riley", with the three time-of-day routines. No
  calendars, no events, no chores.

Everything verified in the browser afterwards: every route renders, no console errors, no failed
requests, `/api/calendars` and `/api/events` 404, and ticking a row still updates the day's count.

### The checklist itself

`/tasks` is a **Daily Checklist** modelled on a printed kids' chore sheet the user photographed —
Morning / Afternoon / Evening blocks, tinted graphic panel left of the rows. Details and the
reasoning behind each number are under *Features* and *Key decisions* below.

**The placeholder scaffolding is gone and every row on screen is now real data.** What replaced it:

- **Everett's three routines hold the wording the user supplied** (2026-08-15), which is close to
  but not identical to the paper sheet — take his list as authoritative over the photo. "Before
  School" (8 steps), "After School" (7), "Before Bed" (8) = **23 rows**, Title Case. Notable
  differences from the sheet: "Check School Folder" for "Go through folder", "Put Dishes in Sink"
  for "Put dishes away", and "Pick Up Dirty Clothes" for "Put dirty clothes in the hamper". His
  first list also left "Brush Teeth" out of the evening block — flagged, and he asked for it back,
  so it now sits between "Take Shower" and "Put On PJs", where the sheet has it.
  All 23 pictures resolve from the title, so no `icon` column was set; two are worth knowing about,
  "Check School Folder" → 🏫 (the `school` keyword) and "Empty Lunchbox" → 🥪, which it shares with
  "Pack Lunch" in the morning block. Steps were *updated in place* rather than replaced, so their
  ids — and any completion history — survived.
  The sheet the design came from is still worth re-reading before layout work:
  `~/Pictures/Photos Library.photoslibrary/originals/3/371AFA05-BB8D-42F9-9F7A-7533C9D5A6AD.heic`
  (HEIC rotated 90°; `sips -s format png --resampleHeightWidthMax 1600 <file> --out /tmp/x.png`).
- **Beau's three routines are in too** (supplied 2026-08-15, same block names as Everett's):
  Before School 7, After School 5, Before Bed 8 = **20 rows**. His differ from Everett's in more
  than length — "Put Shoes Away" instead of a folder check, "Take a Bath" not a shower, and evening
  "Brush Teeth" last rather than after the wash. **His wording is stored exactly as given**, which
  includes lowercase "up"/"on" in "Pick up Toys", "Put on PJs" and "Pick up Dirty Clothes" where
  Everett's read "Pick Up"/"Put On". Flagged to the user, who can have it normalised on request —
  don't quietly "fix" it.
- `BLOCK_TARGET_ROWS`, `PLACEHOLDER_TITLES` and `.checkline.placeholder` are **deleted**, not
  switched off. `displayGroups()` is now just a map over the block's routines.
- **The panel is sized per block from the real step count**, not from a fixed eight rows —
  `TasksPage` sets `--block-rows` inline on each `<section>`. Verified over CDP: Everett's 8/7/8-row
  blocks get 496/434/496px panels and Beau's 7/5/8 get 434/310/496, all at `topΔ 0 / botΔ 0`. Beau's
  5-row block is the useful case — it sits exactly on `--block-panel-min`, so 5 rows is both the
  floor and the shortest block that still aligns perfectly.
- **A block with no routines keeps the compact stacked strip** even in a wide card
  (`.checklist-block.empty`) — a 310px panel beside a single dashed "add" button looked broken.
- **The card stayed at 740px.** It was briefly widened to 800 for the sheet's longest name; the
  user's wording is shorter ("Play Outside (30 min.)" at 177px in 206px of room), so it went back.
  **0 of 23 labels wrap.**

Outstanding, in rough priority order:

1. **Routines can't be edited or deleted from the UI.** `RoutineModal` only creates. This is the
   biggest gap by a distance — both kids' routines had to be entered with one-off scripts against
   `data.sqlite`, and fixing a typo in a step still means another one. `PATCH /routines/:id`,
   `DELETE /routines/:id` and `DELETE /routines/steps/:id` all already exist; nothing calls them.
2. **Chores are still hidden** (deferred, not deleted — the table, `routes/chores.js` and
   `ChoreModal.jsx` are intact and the router is still mounted). Flip `COUNT_CHORES` in
   `progress.js` when they come back, which also restores the ⭐ points badge. Chores have no
   `time_of_day` column — that decision is still open. Note both kids have a "Daily Chore"
   *checklist step*, which is not a chore record. One real chore row survives, Everett's
   "Make Bed" (id 5), invisible in the UI.
3. **Anything the strip left dangling.** `components/MemberBadge.jsx` and `components/ChoreModal.jsx`
   are on disk but unreferenced, and `useChores` is still exported from `api/client.js`. Left alone
   on purpose (chores are coming back), but they're the first things to check if something looks
   unused.
4. The paper sheet prints a time range under its morning panel ("7:00 am – 7:55am"); the app has no
   field for it. Not asked for, just noted.

Nothing is half-finished in the code: `npm run build` is clean and the app runs.

## Run it

**`./start.command`** (or double-click it in Finder) starts both halves, gates on a real
`/api/health` + web response, opens the browser, and tears both down on Ctrl-C / window
close. Flags: `--no-browser`, `--local-only`, `--help`. Logs tee to `logs/{server,client}.log`.

Or by hand, two processes:

```bash
cd server && npm install && npm start     # API → http://localhost:3001
cd client && npm install && npm run dev    # app → http://localhost:5173 (proxies /api)
```

Open http://localhost:5173. First server start creates + seeds `server/data.sqlite`.
`npm run build` in `client/` is the quick way to typecheck/verify the frontend compiles.

### Hosted mode — the tablet on the home network (2026-08-16)

**Two ways to run this now.** The above is *dev*. For the tablet, the server serves the built
frontend itself, so the whole app is **one process on one port** and there's no Vite:

```bash
cd client && npm run build        # produces client/dist (256 kB JS, 11 kB CSS)
cd server && node src/index.js    # API *and* app → http://localhost:3001
```

`index.js` mounts `client/dist` after the API routes: `/assets` with a 1-year immutable
`Cache-Control` (Vite hashes those filenames), everything else with `max-age=0`, then an
`app.get('*')` SPA fallback that skips `/api/` so a bad endpoint still 404s as an error instead
of returning the app's HTML with a 200. If `dist` is missing it logs a warning and runs API-only.

**`./hosting/install-agent.command`** installs `hosting/com.familyhub.server.plist` as a launchd
LaunchAgent (`com.familyhub.server`): `RunAtLoad` + `KeepAlive`, `PORT=3001`,
`TZ=America/Chicago`, logging to `logs/launchd-server.log`. Flags: `--restart` (after editing
`server/src`), `--status`, `--uninstall`. Verified 2026-08-16 — every route, asset and API path
answers on the LAN IP, a real browser renders `/home` and `/tasks` over it, a step toggle writes
through, and `kill -9` brought it back on its own (`runs = 2`).

Addresses: `http://<lan-ip>:3001` or `http://MNWRMQV72.local:3001` (this Mac's mDNS name — no
config, and it survives a DHCP lease change, which a bookmarked IP does not).

**The iOS 10 iPad must use this hosted build, not Vite on port 5173.** The client uses Vite's
official legacy plugin with an `iOS >= 10` target, so `npm run build` emits a SystemJS legacy
bundle and usage-based core-js polyfills alongside the modern bundle. It also explicitly bundles
an AbortController DOM shim: TanStack Query constructs one before every query, while iOS 10 lacks
that API; without the shim the shell renders but every data request fails. The dev server
intentionally remains modern-only. iOS 10 also lacks container queries, so a guarded 650px
viewport-query fallback reproduces the left-hand time-of-day panel on single-member tablet pages;
overview cards and genuinely narrow screens remain stacked. The same legacy guard replaces flex
`gap` with explicit margins between the panel, checkbox, task picture, and label—iOS 10 otherwise
runs those elements together even though their individual sizes are correct.

**Backups exist now too** (2026-08-17). The same installer adds a second agent,
`com.familyhub.backup`, running `hosting/backup-db.mjs` nightly at 3:17am: `node:sqlite`'s
`backup()` → `PRAGMA integrity_check` on the copy → gzip → `familyhub-YYYY-MM-DD.sqlite.gz` in
**iCloud Drive** (`~/Library/Mobile Documents/com~apple~CloudDocs/FamilyHubBackups`), keeping 30
days. Env overrides: `FAMILYHUB_BACKUP_DIR`, `DB_PATH`, `FAMILYHUB_KEEP_DAYS`. A whole backup is
2.2 kB. `--backup-now` runs one on demand; `--status` prints the most recent.
Restore is `gunzip -c familyhub-<day>.sqlite.gz > server/data.sqlite` with the server stopped
(and delete the stale `data.sqlite-wal`/`-shm` beside it).

### Hosting gotchas (`hosting/`)

- **The agent runs old server code until you restart it.** `server/src` is read once at startup,
  so a route or `db.js` edit needs `./hosting/install-agent.command --restart`
  (`launchctl kickstart -k`). *Client* edits only need `npm run build` — `express.static` reads
  `dist` per request, and `index.html` is uncached, so a rebuilt bundle is live immediately.
  This is the same class of trap as the launcher's "reusing it" notice, and quieter.
- **`start.command` and the agent coexist correctly** — verified. The launcher finds port 3001
  busy, prints "API already running … reusing it", starts only Vite, and its dev server proxies
  `/api` to the agent. Stopping the launcher leaves the agent up. The catch is the bullet above:
  that reused API is the agent's, so it's running whatever code it started with.
- **After a crash there's a ~10s hole**, not an instant recovery: `ThrottleInterval` is 10, so a
  health check fired immediately after a kill gets a connection refused even though launchd is
  already restarting. Don't read that as a failed restart (it looked like one at first).
- **A LaunchAgent needs the user logged in** — it's `gui/501`, not a system daemon. After a reboot
  the app is down until someone logs into this account; enable auto-login if that matters. A
  LaunchDaemon would start at boot but runs as root and would hit TCC on the Desktop path.
  Related: the Mac must not sleep, or the tablet gets nothing — Energy Saver's "Prevent automatic
  sleeping when the display is off", or wrap it in `caffeinate -is`.
- **TCC bites `/bin/bash` under launchd but not `node`, and that dictated the backup's language.**
  The backup started as `hosting/backup-db.sh`; launchd ran it and got
  `getcwd: Operation not permitted` plus `/bin/bash: …/backup-db.sh: Operation not permitted`,
  **exit 126** — macOS won't let an Apple platform shell touch `~/Desktop` from a launchd job, and
  no amount of script fixing changes that. It was rewritten as `backup-db.mjs` run by
  `/opt/homebrew/bin/node`, which is allowed (and reads that directory all day as the server
  agent). Both agents therefore share one permission story: if a future macOS revokes it, they
  fail together, and the fixes are Full Disk Access for that node binary or moving the project off
  `~/Desktop`. **Don't reintroduce a shell script as a launchd job here.**
- **The server agent's own Desktop access is fine** — `data.sqlite` and `client/dist` both read
  normally, verified after a launchd-initiated `KeepAlive` restart, not just a hand-bootstrapped
  one. Writing into iCloud Drive from the backup job works too.
- **Absolute paths in the plist**, including `/opt/homebrew/bin/node` — launchd doesn't expand `~`
  and gives the agent a minimal `PATH`, so a bare `node` wouldn't resolve. Both paths hardcode
  `/Users/stephen.turney/Desktop/family-app`; moving the folder means editing the plist and
  re-running the installer.
- **Never back this DB up with `cp data.sqlite`.** It runs in WAL mode, so the recent writes are in
  `data.sqlite-wal` — measured 2026-08-17, the WAL was 367 kB against a 49 kB main file, and a
  plain `cp` restored **0 of 3** completions while `backup()` restored all 3. Anything that copies
  the DB has to go through the SQLite API (or copy `-wal` and `-shm` too).
- **Backups are pruned by the date in the filename, not `mtime`** — iCloud rewrites mtimes when it
  materializes an evicted file, which would quietly keep every backup forever.
- **`backup-db.mjs` builds its filename from local date parts, not `toISOString()`** — same trap as
  the server routes: after 7pm Central a UTC date would name the file after tomorrow.
- `cors()` is now redundant in hosted mode (same origin) but is still mounted for the dev flow.

### Launcher gotchas (`start.command`)

- Ports are **hardcoded** to 3001/5173 on purpose — `client/vite.config.js` hardcodes the
  `/api` proxy target, so a port flag would start the app with an unreachable backend.
- Runs `node src/index.js` / `node node_modules/vite/bin/vite.js` **directly, not via npm** —
  npm would leave the real server orphaned when the launcher is signalled.
- Traps **HUP** as well as INT/TERM: closing the Terminal window sends SIGHUP, and without
  it bash dies without running the EXIT trap, leaving both ports held.
- Signal handlers `exit` right after cleanup, or control returns to the monitor loop, which
  sees the just-killed PIDs and misreports a deliberate Ctrl-C as an unexpected crash.
- `kill` is followed by `wait` to reap children *and* suppress bash's own
  `Terminated: 15` job notice. Don't use `disown` for that — it stops bash reaping, so the
  zombie answers `kill -0` and the crash detector goes blind.
- Brace port vars in messages (`${API_PORT}…`): a following multibyte char (`…`, `—`) gets
  eaten into the variable name and trips `set -u`.
- LAN IP comes from `route -n get default`, not `en0` — this Mac's default route is `en14`.

## Stack & layout

- **Backend:** Node/Express, **Node 26's built-in `node:sqlite`** (see gotcha below). Port 3001.
  Dependencies are down to `express` + `cors`.
  - `server/src/db.js` — schema, `ensureColumn()` migrations, seed, and a `transaction()` helper.
  - `server/src/routes/` — `members`, `chores`, `routines`, `progress`, `settings`.
  - `server/src/index.js` — app wiring, `express.json({limit:'5mb'})`, and the static serving of
    `client/dist` + SPA fallback that makes hosted mode one process.
- **Frontend:** React + Vite, TanStack Query, date-fns. Port 5173.
  - `client/src/pages/` — `HomePage`, `TasksPage`, `FamilyPage` (this is the **Settings** page).
  - Routes: `/` → `/home` · `/home` · `/tasks` · `/tasks/:memberId` · `/settings` · `*` → `/home`.
  - `client/src/components/` — `Modal`, `RoutineModal`, `Avatar`, `IconPicker`, plus `MemberBadge`
    and `ChoreModal` (on disk, unreferenced — see outstanding #3).
  - `client/src/api/client.js` — fetch wrapper + all query/mutation hooks.
  - `client/src/lib/` — `familyName.js` (surname pluralizer), `image.js` (avatar resize/crop),
    `taskIcons.js` (task picture library + keyword matcher).
  - `client/src/styles.css` — light theme via CSS vars, ~362 lines, no third-party overrides left.
- **Hosting:** `hosting/` — `com.familyhub.server.plist` + `com.familyhub.backup.plist` (the two
  launchd agents), `backup-db.mjs` (the nightly backup, plain Node + `node:sqlite`), and
  `install-agent.command` (install / `--restart` / `--backup-now` / `--status` / `--uninstall`).

## Data model (SQLite)

`settings(key,value)` · `members(id,name,color,emoji,avatar,created_at)` ·
`chores(...recurrence['once'|'daily'|'weekly'],weekdays CSV,points,active,icon)` + `chore_completions(chore_id,due_date)` ·
`routines(...time_of_day)` + `routine_steps(...icon)` + `routine_step_completions`.
`icon` is NULL by default = "work it out from the title" (see task pictures below).
All day/date fields are local `YYYY-MM-DD`.
The `calendars` and `events` tables were dropped 2026-08-15; their `CREATE TABLE`s live in
`_archive/calendar/server/schema.sql` if the feature comes back.

## Features currently working

- **Topbar:** family name (a `<Link>` home) · **Overview** (`/tasks`) · **one tab per member**
  (`/tasks/:id`, each with their 24px avatar) · then the **⚙️ gear alone on the hard right**, icon
  only, 44px square around a 26px glyph. Member tabs are generated from `useMembers()`, so adding
  someone in Settings gives them a tab. Overview's `NavLink` needs `end`, or `/tasks/3` would light
  it up as well as the member's own tab. The gear sits outside `.nav` (which is `flex: 1`) — that's
  what pins it right, in the space the date used to occupy.
- **Home (`/home`):** the landing page (`/` redirects here, as does any unknown path), also reached
  by clicking the family name in the header. Its heading is **today's date** ("Saturday, August 15")
  — since 2026-08-15 that's the only date in the chrome, the topbar's copy having been removed. One
  large 220px photo tile per member with today's progress; tapping a tile opens `/tasks/:memberId`.
  With two members it's two tiles side by side.
- **Daily Checklist (`/tasks`):** modelled on a printed kids' chore sheet. The day is split
  into **Morning / Afternoon / Evening** blocks, each a **360px-wide** tinted panel beside that
  block's routines — as tall as that block's own rows (`--row-h` × `--block-rows`, the latter set
  inline per block from the real step count, floored at 5 rows by `--block-panel-min` so the 190px
  icon still fits) and dropped past the heading, so its top and bottom edges line up with the
  first and last checklist row. A routine's own name is the block's bold-caps heading (the sheet's
  "BEFORE SCHOOL"). Blocks are separated by a 2px rule — with a panel that stops at the last row
  instead of a full-height spine, nothing else marks where one block ends. A block with no
  routines drops back to the compact strip layout and is its own dashed "+ Add an evening routine"
  button, which opens `RoutineModal` with that `time_of_day` preselected. Grouping keys off the
  existing `routines.time_of_day` column, so no migration was needed. `TasksPage` serves both
  `/tasks` (everyone in a grid) and `/tasks/:memberId` (one centered **740px** card via
  `.member-columns.single`).
- **`/tasks/:memberId` header:** the member's photo large (170px) and centred, with a plain
  "{Name}'s Daily Checklist" under it in the app's own font — an earlier version set that in
  Snell Roundhand to ape the paper sheet and it was dropped. The "← Family" link is
  `position:absolute` so it can't pull the photo off-centre.
- **Day navigation (`/tasks/:memberId` only):** under the title, `‹  Friday, August 14  ›` steps a
  day at a time (`.checklist-daynav`), with a **TODAY** tag on the current day and a "Jump to today"
  button that only appears when you're off it. Ticks land on **the day being viewed**, so an unfinished
  yesterday can still be completed; both `useRoutines` and `useProgress` key off the date, so the right
  day refetches and each day caches separately. The date lives in `TasksPage` component state, not the
  URL — reloading returns to today. The `/tasks` grid has no controls and stays on today.
- The card's progress bar is **derived from the rows on screen**, not from `/api/progress`, so it
  can't disagree with the list under it. Home still uses the endpoint.
- **Chores are currently hidden** (deferred, not deleted — see gotchas). The table, routes and
  `ChoreModal.jsx` are all still in place; nothing in the UI reaches them.
- **Tablet-sized checkboxes:** rows are `min-height:62px` with a 46px box — the app is used by
  kids on a tablet, so the whole row is the tap target (still clears the 44px minimum). These
  were 78/60 before eight-row blocks made the page too tall; don't shrink them further.
- **Task pictures:** every chore/step shows a picture so pre-readers can find their task.
  `lib/taskIcons.js` holds ~90 emoji in 12 groups; `IconPicker` (searchable) sets an explicit
  one in `ChoreModal` and per step in `RoutineModal`.
- **Settings (`/settings`):** family name and members (large avatar tiles, click one to edit or
  delete). Two cards — the Calendars card went with the calendar. Reached only by the gear now, so
  don't remove that icon without putting the route somewhere else.
- **Members:** name, color (Six Pastels palette), emoji, and optional **photo avatar**.
- **Family name:** stored in `settings`; header shows `pluralizeFamily(name)` (e.g. "The Joneses")
  or falls back to "Family Hub".

## Key decisions & gotchas (READ before editing)

- **`node:sqlite`, not better-sqlite3** — the native module failed to build on Node 26.
  Differences: no `db.pragma()` (use `db.exec('PRAGMA …')`); **no `db.transaction()`** (use the
  `transaction()` helper in `db.js`); bare named params work; `lastInsertRowid` is a BigInt.
- **The placeholder scaffolding is gone** (`BLOCK_TARGET_ROWS`, `PLACEHOLDER_TITLES`, the
  `.checkline.placeholder` rules and the filler-dedup logic were all deleted once Everett's real
  routines went in). If you see those names in an old note or screenshot, that's why they're not in
  the code. Every row on `/tasks` is now a real `routine_steps` row the server knows about, so the
  card's derived progress and `/api/progress` agree (Everett: 23 both ways).
- **Chores are hidden, not removed.** Nothing in the client references them, but the table,
  `routes/chores.js` and `ChoreModal.jsx` are intact so they can come back. Two things go with
  that: `progress.js` has a **`COUNT_CHORES = false`** flag (counting invisible chores made 100%
  unreachable — a kid could tick every visible row and still read 8/11), and since `points` only
  ever came from chores, the ⭐ badge is now always absent. Flip the flag when chores return.
- **Checklist geometry lives in four CSS vars** on `:root`: `--row-h` (62px, the `.checkline`
  height), `--block-rows` (a *fallback* of 8 — the real value is set inline per `<section>` by
  `TasksPage` from that block's step count), `--block-panel-min` (5 rows = 310px, the floor that
  keeps the 190px icon inside a short block's panel), `--block-panel-w` (360px, the panel's width —
  deliberately independent of its height, so it's a tall rectangle not a square), and
  `--routine-head-h` (28px). So "the panel is as tall as its rows" is enforced rather than a magic
  number — change `--row-h` and everything follows.
- **The panel's height calc has to live at the point of use, not in a `:root` shorthand.** There
  used to be a `--block-panel: calc(var(--row-h) * var(--block-rows))` var; a custom property's own
  `var()`s are substituted where it's *declared*, so that froze `:root`'s `--block-rows` and
  ignored the per-block value set inline. `.block-panel { height: max(calc(...), ...) }` is why the
  per-block sizing works at all — don't "tidy" it back into a variable.
- **A short block's panel deliberately overhangs its rows.** Blocks of 5+ rows land exactly; a
  4-row block gets the 310px floor next to 248px of rows, so 62px of overhang (`botΔ 62`). That's
  the accepted trade — shrinking the panel to 248px would clip the 190px icon. Nothing in the app
  is under 5 rows now that Dad's 4-step routines are gone (Beau's 5-row afternoon is the shortest,
  and it lands exactly), so if you see an overhang it's a new short routine.
- **An empty block needs `align-items: stretch` as well as `flex-direction: column`.** Overriding
  only the direction on `.checklist-block.empty` leaves the row layout's `flex-start` in place, and
  the tinted strip plus its dashed button shrink to content width instead of spanning the card. It
  looks like a stray 166px tab; the fix is one property.
- **Panel/row alignment is exact, and depends on `--routine-head-h` being a real height.** The
  panel gets `margin-top: var(--routine-head-h)` and the *first* group's `.routine-head` gets that
  same value as a fixed `height`, so the panel's top lands on the first row and its bottom on the
  last (verified 0px on all three blocks). Pinning the heading is what makes it exact rather than
  approximate — but it also means a routine name long enough to wrap at 430px would clip, which is
  why only the first heading is pinned and only inside the ≥900px container query. Its top edge
  sits ~7px above the first *checkbox*, because the 46px box is centred in a 62px row; aligning to
  the box's edge instead would push the panel's bottom past the last row.
- **The checklist blocks use a container query, not a media query** — whether the tinted panel
  sits *beside* the rows or becomes a strip *above* them depends on the member-column width
  (i.e. how many people share the grid), not the viewport. **The query matches on the container's
  *content* box, not its border box** — a 740px `.card` measures 702px inside its 18px padding and
  1px border — so the breakpoint has to clear that margin. It's **600px**: high enough that the
  420px member columns on `/tasks` still stack (382px of content), low enough that the 740px single
  card doesn't. Any time `.member-columns` or `.member-columns.single` changes, re-check it against
  this breakpoint; a card that crosses it flips layout with no other symptom.
- **`/tasks` grid columns are `auto-fit` with a 420px *max*, and centred** — not `auto-fill` with
  `1fr`. With four members the difference didn't show; with two, `auto-fill` kept reserving four
  325px tracks, so both cards sat squashed against the left with half the screen empty. Plain `1fr`
  is the other trap: two cards stretch to ~660px, which crosses the 600px container query into the
  side-by-side panel layout with only ~126px left for labels, so most of them wrap.
- **The 740px card width is set by label wrapping.** 740 → 702 content → 328px of rows after the
  360px panel → **206px for a label**, against Everett's longest ("Play Outside (30 min.)") at
  177px — 29px of slack, so a somewhat longer task name still fits on one line. Below ~660, five of
  the rows wrapped. A name past 206px needs one of three levers — wider card (800 buys 266px),
  narrower panel, smaller label font. Worth knowing before reaching for one: wrapping is cosmetic,
  not structural. Two 17px lines still fit a 62px row, and it was measured with two labels wrapped
  — rows stayed 62px and `topΔ/botΔ` stayed 0.
- **Don't check for wrapping via `height / line-height`.** `.checkline .label` has no explicit
  `line-height`, so the computed value is the keyword `normal`, `parseFloat` gives `NaN`, and every
  comparison silently reads as "not wrapped". Measure a `white-space:nowrap` clone's width against
  the available room instead — that's what the numbers above come from. `container-type: inline-size` is set on `.checklist`
  rather than `.card` on purpose: the containment it creates would trap a `position:fixed` modal
  backdrop, so `RoutineModal` also renders outside the cards.
- **Parse a `YYYY-MM-DD` day with `parseLocalDate()` in `TasksPage`, never `new Date(iso)`.** A bare
  date string is read as **UTC**, so west of Greenwich `new Date('2026-08-15')` is the 14th at 8pm
  local and the day-nav label would sit a day behind the data. `parseLocalDate` builds
  `new Date(y, m-1, d)` instead; `shiftDate` then uses `setDate`, which rolls months, years and DST
  over on its own. Same class of bug as the `toISOString()` notes on the server side.
- **The day-nav centre is a fixed 320px** (`.daynav-date`) so stepping between days doesn't slide the
  arrows sideways. Worst-case label is 297px — "Wednesday, September 30" plus the TODAY tag, a real
  date — leaving 23px. Under 560px the fixed width is dropped, since drift beats overflow there.
- **The card's progress label follows the day being viewed** ("Friday's progress", not "Today's").
  Easy to miss when adding anything else date-dependent to that card.
- **`routines.time_of_day` is the only thing grouping a routine into a block**, and a routine's own
  title is free text — so Everett's "Before School" routine is what puts those 8 steps in the
  Morning block, not its name. Renaming it to something else leaves it exactly where it is.
- **A container query adds no specificity.** `@container … { .checkline .label { … } }` ties with
  the plain `.checkline .label` rule, so only source order breaks it — the override has to sit
  *after* the base rule in `styles.css`. Cost me a confusing round of "why is this ignored".
- **Avatars** are base64 JPEG data URLs stored in `members.avatar`, resized/cropped client-side to
  256px (`lib/image.js`). That's why `express.json` limit is 5mb. `Avatar` component falls back to
  the emoji when there's no photo.
- **Task pictures** resolve in `resolveIcon()` order: explicit `icon` column → keyword match on
  the title → `DEFAULT_ICON` (📋). So existing chores got pictures with **no backfill**. Emoji
  rather than an SVG set: no dependency, sharp at 42px, and more legible to a pre-reader than
  line art. Keep glyphs unique across groups — a repeated one looks like a bug in the picker.
  Keyword matching is whole-word, so multi-word keys ('make bed') outrank single ones ('bed');
  don't give the same single word to two entries.
- **Clearing an icon** needs `icon === undefined ? existing.icon : icon || null` in the chores
  PATCH — `??` would make "back to automatic" (an explicit `null`) impossible to express.
- **DB reset:** deleting `server/data.sqlite*` reseeds fresh; schema changes to existing DBs go
  through `ensureColumn()` in `db.js`.
- **The launcher reuses a running API** — so if you change `db.js` or a route while an older
  instance is up, `start.command` prints "API already running … reusing it" and your migration
  silently never runs. Stop the old process first; the reuse notice is easy to skim past.

## Not built yet / ideas

**Deliberately out of scope right now.** The user narrowed this to a checklist on 2026-08-15, so
resist re-adding breadth unasked. Parked: the calendar (in `_archive/`, with Google **OAuth two-way
sync** as the someday version of it), chores + rewards redemption, meal planning, shopping lists,
accounts/auth (none today — designed for a trusted home network).

**Hosting on the home network is done** (2026-08-16, backups 2026-08-17) — see *Hosted mode* under
**Run it**. That closed **all three** prerequisites the remote options needed: Express serves
`client/dist` with an SPA fallback, `TZ` is set explicitly in both plists, and `server/data.sqlite`
is backed up nightly to iCloud Drive with 30 days kept.

**Reaching it from outside the house** (discussed 2026-08-13, still no decision — don't start
building it). Ranked by effort: (1) Tailscale — private access from anywhere, zero code changes;
(2) **Cloudflare Tunnel + Cloudflare Access** — real HTTPS domain, login handled at the edge, still
runs at home (recommended); (3) cloud host, which is the only option that forces writing auth. Both
tunnel options now just point at port 3001 and are done, since one process serves everything. Notes
that still apply to option 3: dates come from `toISOString()` (`routines.js:102`, `chores.js:80`,
`progress.js:12,27`), so `TZ` must be set there too; `DB_PATH` and `PORT` are env-driven, so a
mounted volume just works; SQLite needs a **persistent disk**, as serverless hosts would silently
reset the data; requires Node ≥ 22.13 for an unflagged `node:sqlite`.

## Housekeeping

- **No version control yet** — user deferred `git init`. This is now the sharpest tool missing:
  the 2026-08-15 strip deleted a working feature, and the only reason it's recoverable is the
  hand-rolled `_archive/` folder. Worth raising again before the next removal.
  When it happens, `.gitignore` needs `node_modules/`, `dist/`, `logs/`, `data.sqlite*`, `.DS_Store`
  — **and `_archive/calendar/removed-data.json`**, which holds a private Google iCal URL and a
  base64 avatar. The rest of `_archive/` should be committed; that's the point of it.
- No tests yet. Verification is `npm run build` + curling the API + **screenshots**: no Playwright
  here, but headless Chrome works well and caught real layout bugs that a passing build hid.
  ```bash
  CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --window-size=1400,960 --virtual-time-budget=6000 --screenshot=/tmp/s.png \
    "http://localhost:5173/home"
  ```
  For anything needing a click (modals, the icon picker), add `--remote-debugging-port=9222
  --user-data-dir=/tmp/cdp-profile` and drive it over CDP — Node 26 has a global `WebSocket`, so
  `Runtime.evaluate` + `Page.captureScreenshot` needs no dependencies. **When clicking React
  inputs that way, set values through the native setter** (`Object.getOwnPropertyDescriptor(
  HTMLInputElement.prototype,'value').set.call(el, v)`) then dispatch `input` — assigning
  `el.value` directly leaves React's state stale and fakes a bug that isn't there.
- **For layout work, measure over CDP instead of eyeballing screenshots.** The checklist geometry
  (panel 360×496 sitting exactly on the first and last rows, label room vs. the widest label) was
  all settled by reading `getBoundingClientRect()` through `Runtime.evaluate` and printing the
  deltas. A screenshot shows *roughly* aligned; `topΔ 0 / botΔ 0` shows aligned. This also caught
  a 2px drift a screenshot hid. Two lessons from getting it wrong first:
  - **Sanity-check the assertion itself, not just its output.** A wrap test that divided by
    `line-height` reported "0 wrapped" while the screenshot plainly showed wrapped labels —
    `line-height: normal` → `parseFloat` → `NaN` → every comparison false. A check that can only
    pass is worse than no check. Compare a `white-space:nowrap` clone's width to the room instead.
  - Take the screenshot *as well*, and actually look at it. The bogus check agreed with the
    conclusion I wanted; the picture was what contradicted it.
- **Known rough edges** (flagged to the user, deliberately not fixed):
  - **Midnight staleness is down to one case.** No page computes the date at module load any more —
    `HomePage` and `TasksPage` both read `localDate()` per render. What's left: `TasksPage` seeds its
    *selected* day into state at mount, so a checklist left open and untouched past midnight still
    shows yesterday's list. It says so, though — "Friday, August 14" with a "Jump to today" button —
    rather than silently claiming to be today. A real fix is still a today-hook that ticks at
    midnight and resets that state.
  - The **topbar isn't responsive** — it overflows horizontally below ~500px (all pages, pre-existing).
    Watch this if the family grows: every member now adds a tab, so the bar's width scales with the
    number of people. Two kids plus Overview and the gear fits 1400px with ~880px spare.
  - Home fits without scrolling at two members; it needed ~960px of window height back when four
    tiles made it 2×2.
  - **Routines can't be edited or deleted from the UI** — `RoutineModal` only creates, and there's
    no affordance for `PATCH /routines/:id` or `DELETE`. Pre-existing, but the sharpest edge now:
    entering Everett's real routines meant running a one-off `node:sqlite` script against
    `data.sqlite` (updating the four existing morning steps in place so their ids survived), because
    there's no way to rename a routine or fix a step's wording in the app.
  - A routine named e.g. "Morning" sitting in the Morning block prints the word twice (block
    label + routine heading). Left alone deliberately — it's the user's own naming, and hiding a
    heading that happens to match would be surprising.
  - Beau's step wording keeps the user's own casing ("Pick up Toys", "Put on PJs"), which differs
    from Everett's ("Pick Up Toys", "Put On PJs"). Visible side by side on `/tasks`. He was told;
    don't normalise it unasked.
  - A React Router **v7 `startTransition` future-flag warning** logs on every page. Pre-existing and
    harmless; `v7_relativeSplatPath` *is* opted into in `main.jsx`, because the new catch-all `*`
    route made that second warning appear.

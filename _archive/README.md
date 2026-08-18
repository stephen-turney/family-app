# _archive

Code and data removed from the running app but kept so it can come back. Nothing in here is
imported, built, or served — it's a parking lot, not a module. There's no version control on this
project yet, so this folder is the only route back.

## calendar/ — removed 2026-08-15

The whole calendar feature, stripped at the user's request ("get rid of the calendar function
completely… we'll probably build some back in later"), along with the Mom and Dad members.

| File | Was |
|---|---|
| `client/CalendarPage.jsx` | the `/calendar` page — merged day view, one column per member |
| `client/EventModal.jsx` | create/edit an event |
| `client/FamilyPage-CalendarsCard.jsx` | the Calendars section of `/settings` (list, sync, add/edit modal) |
| `client/client-calendar-hooks.js` | `useCalendars` / `useEvents` from `api/client.js` |
| `client/calendar-styles.css` | the react-big-calendar overrides + per-member column tints from `styles.css` |
| `server/calendars.js` | `/api/calendars` router |
| `server/events.js` | `/api/events` router |
| `server/icalSync.js` | `.ics` fetch/parse, URL normalisation, `syncAllCalendars()` |
| `server/schema.sql` | the `calendars` + `events` `CREATE TABLE`s and their indexes |
| `removed-data.json` | every row that was deleted (see below) |

**`removed-data.json` contains a private Google iCal URL** (Mom's calendar secret address) and one
base64 avatar photo. Keep it out of any repo you publish — it belongs in `.gitignore` along with
`data.sqlite*`.

What it holds: 5 calendars, 196 events (194 iCal-synced + 2 local), the Mom and Dad member rows,
their 2 routines and 8 steps, and their 4 chore rows. No routine-step completion history was lost —
there wasn't any for those two.

### To bring the calendar back

1. Paste `server/schema.sql` back into the `db.exec(\`…\`)` block in `server/src/db.js`. It keeps the
   partial unique index `idx_events_external`, which the `ON CONFLICT … WHERE external_uid IS NOT
   NULL` upsert in `icalSync.js` depends on.
2. Copy the three server files back and re-register the routers plus the 30-minute
   `syncAllCalendars()` interval in `server/src/index.js`.
3. Copy the client files back, restore the two hooks, re-add the `/calendar` route and nav link in
   `App.jsx`, re-append `calendar-styles.css` to `styles.css`, and
   `npm i react-big-calendar` (it was uninstalled).
4. Re-insert from `removed-data.json` if the old events are still wanted — or just re-add the iCal
   feed and let it sync.

### Gotchas that came with it (moved out of CLAUDE.md so they're not lost)

- **Partial-index upserts** need the `WHERE` clause in the conflict target:
  `ON CONFLICT(calendar_id, external_uid) WHERE external_uid IS NOT NULL …` in `icalSync.js`.
  Without it SQLite won't match `idx_events_external` and the upsert fails.
- **iCal URLs:** `normalizeUrl()` converts `webcal://` and Google **`cid=` links** to the public
  `.ics`; sync validates the body contains `BEGIN:VCALENDAR`, else records a clear `sync_error`
  (e.g. "paste the Secret address in iCal format"). Private Google calendars need the **secret iCal
  address**, not the share/cid link — that's the one in `removed-data.json`.
- **react-big-calendar's CSS loads *after* `styles.css`** in the bundle, at equal specificity. To
  override it (event borders, `.rbc-events-container` left, …) use **inline styles** — which
  `eventPropGetter` does — or `!important`. This bit us repeatedly.
- **Event chips:** near-fill `${color}d9` plus a uniform 1px border in a `darken(color, 0.3)` shade,
  set **inline** so it beats RBC's default dark-blue `.rbc-day-slot .rbc-event` border, and
  `marginLeft: 5` so the left border clears the column edge instead of being clipped.
- **Per-member Day columns:** body tints via `dayPropGetter`; header cells have no per-resource
  style hook, so they reuse the same tint through CSS vars `--col-0…--col-9` set on the
  `.cal-columns` wrapper. The empty all-day row is hidden in that view.
- Clicking an empty slot in a member's column created the event on that member's calendar,
  auto-creating "{Name}'s Calendar" when they didn't have one. That's why the dump has a
  "Stephen's Calendar", a "Beau's Calendar" and a "Mom's Calendar" nobody explicitly added.

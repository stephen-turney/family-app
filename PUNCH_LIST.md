# Family Hub Punch List

Captured August 19, 2026. Implemented and user-reviewed on `codex/punch-list-updates`.

## iOS 10 layout and compatibility

1. [x] Fix the missing spacing between the Everett and Beau tiles on the Home page. It is correct in
   modern browsers but missing on iOS 10.
2. [x] Center the previous-day and next-day arrow glyphs inside their buttons on each member's Daily
   Checklist page.
3. [x] Fix the task pictures that do not render on iOS 10 for:
   - Pack Lunch
   - Pick up Toys
   - Pick Up Dirty Clothes
4. [x] Vertically center the Morning, Afternoon, and Evening pictures and labels within their colored
   panels. They currently align to the top.

## Checklist and navigation behavior

5. [x] Change “Today's progress” from completion percentage to daily points:
   - Display `x/200` points instead of a percentage.
   - Keep the visual progress bar, with its width showing progress toward 200 points.
6. [x] Remove the Everett and Beau tabs from the navigation bar on every page. Keep only the family
   name (“The Turneys”), Overview, and Settings.
7. [x] After 90 seconds without user interaction, automatically return to the Home page.
8. [x] Remove the Home-page instruction “Tap a photo to open that person's daily checklist.”

## Settings and reports

9. [x] Remove the informational text from Settings → Reports. Leave only the reports list and the
   generate-report button.
10. [x] Center the family-member icons within the Members card on the Settings page.
11. [x] Add a **Backup/Restore** section below Reports:
    - Download a backup of the SQLite database.
    - Restore by uploading a SQLite database file.
    - Before replacing the live database, validate the upload and preserve a recoverable copy of
      the current database.

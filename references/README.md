# Project references

## Reports spacing and recalculation — November 6, 2026

User-provided screenshot: [Original Reports layout](reports/original-spacing.png).

The screenshot shows “Generate report now” touching the first saved report. Add
space below that button and place a “Recalculate” button immediately to the left
of each report's “Delete” button. Recalculation should use the current checkboxes
from that saved report's week and replace its saved totals so retroactive checks
are reflected.

## Theme row and dropdown arrow — November 6, 2026

User-provided screenshot: [Original Theme layout below Backup/Restore](themes/original-layout.png).

Keep the Theme heading and current-theme dropdown on one line, with the dropdown
aligned to the right like the Backup/Restore actions above it. Move the arrow
inward from the dropdown's right edge with padding. Keep other theme names hidden
until the dropdown opens.

## Thanksgiving theme — November 6, 2026

The user approved the generated pixel art and requested a Thanksgiving theme using those
images and their colour palette. Keep the autumn countryside background and the transparent
nine-decoration sheet as the visual reference; use warm cream, brown, pumpkin orange,
mustard gold, olive, and cranberry. The theme remains selectable alongside Default and Spooky.

- [Approved autumn background](../output/imagegen/thanksgiving/autumn-background.png)
- [Approved transparent decoration sheet](../output/imagegen/thanksgiving/thanksgiving-sprites.png)
- [Original generation prompts](../output/imagegen/thanksgiving/prompts.md)

The application copies are in `client/src/assets/thanksgiving/`. Decorations are displayed
as sprite-sheet cells, preserving the original generated artwork.

Follow-up: keep the banner as artwork only, with no overlaid text. The top bar's
seasonal label reads “Give Thanks”.

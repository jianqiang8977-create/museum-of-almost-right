# Verification record

## 2026-09-22, local implementation stage

- Chrome connected to the new real public project `e1rm1vsv/production`: walking skeleton displayed **Public collection connected: 0 exhibits.**
- Full frontend with the same empty dataset displayed **0 published exhibits** and the honest empty-state message. No seeded local fallback was used.
- Root independently ran `npm test`: **25 tests, 25 passed, 0 failed, 0 skipped**.
- Root ran `npm run build`: success, one static route built.
- Public dataset, $0 trial / automatic downgrade to Free, and exact-origin CORS settings were inspected in the actual Sanity account UI.

## 2026-09-22, actual content and browser checks

- Official CLI Google login completed in Chrome as the authorized account.
- Official CLI imported 16 documents into the explicit project `e1rm1vsv`, dataset `production`, using `--missing` (no replacement of existing documents).
- Reload in Chrome changed the actual page from zero to four published exhibits without a frontend build.
- All eight browser results verified: `[1,10,2]`, `[1,2,10]`, `["0042","42"]`, `[42]`, `6`, `4`, `62.5%`, `40%`.
- One browser automation command timed out on the already-selected missing-values interpretation. A fresh DOM read showed the page and correct result; checks continued from that state. This was not a confirmed application calculation failure.
- Keyboard Enter on Reset hides notes, clears choices and focuses the exhibit heading inside the viewport.
- Independent static review found and root fixed the hidden skip-link target, offscreen focus after navigation, and whitespace-only missing-value display.
- `sanity schema validate`: 0 errors, 0 warnings. Initial Studio build succeeded. Auto-updates were then disabled for a reproducible deployment; final deployment build remains to run.

Pending: mobile/reduced-motion and complete keyboard journeys; public deployment; Studio edit/Publish-to-Reload update; DEV submission. These are not implied by local or unit tests.

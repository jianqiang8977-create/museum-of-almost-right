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
## 2026-09-22, deployment and editorial update

- Hosted Studio deployed: https://almost-right-jianqiang.sanity.studio/ . The deployment used Sanity 6.15.0 with auto-updates disabled and successfully deployed its schema.
- Actual `sanity documents validate -p e1rm1vsv -d production --yes`: 16 valid content documents, 0 errors, 0 warnings.
- Independent reviewer reran all 25 domain tests and fetched the production Query API: four exhibits and eight interpretations passed the current validator. The API returned the expected GitHub Pages CORS origin.
- GitHub Actions run 35663461113 built successfully but deployment returned 404 because Pages was not yet enabled. After enabling Actions as the Pages source, run 35663675972 completed successfully for commit b57c184.
- Public frontend opened in Chrome at https://jianqiang8977-create.github.io/museum-of-almost-right/ and showed four exhibits.
- Local Studio: edited the first exhibit's takeaway to append “State the comparison rule alongside the result.”, then selected Publish. The UI remained on Saving/Validating for an extended period. The public Query API subsequently returned the new text and revision; reopening the Studio retained the text and showed a published timestamp. Reload on the public frontend displayed the new sentence without a frontend code change for that update. The initial seed was synchronized afterward for reproduction.
- Studio still displayed HTTP/1 performance / connection warnings. Public HTTP/2 probes through the same local proxies succeeded. The specific browser-session cause remains unproven; this report does not claim the network problem was permanently fixed.
- Actual Chrome CSS viewport checks used temporary same-origin iframes at 360, 768 and 1280 CSS pixels. At 360, selecting It depends revealed notes and Enter on Compare as numbers produced [1,2,10]; the inspected screenshot showed wrapped controls. At 768, Enter on Give each trial equal weight produced 40%. At 1280, Enter on Next opened the second exhibit. These are desktop-browser responsive checks, not physical mobile-device or complete accessibility certification.
- Reduced-motion CSS was inspected; OS/browser reduced-motion behavior and dark mode have not been exercised. Complete keyboard traversal and screen-reader testing remain unverified.
- Actual public screenshot: docs/screenshots/public-exhibit.png. The temporary viewport fixture was removed and not committed.

DEV submission remains pending until the public article is published and read back. No prize or payment is claimed.

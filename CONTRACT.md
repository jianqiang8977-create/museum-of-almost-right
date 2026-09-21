# Museum of Almost Right — D194 implementation contract

New work starts 2026-09-22, for DEV x Sanity Path Two. The wider goal remains actual paid income; this project is a competitive entry, not guaranteed pay.

## Source and architecture decisions

Astro static shell + native browser fetch + independent Sanity Studio. Next static export and @sanity/astro are valid alternatives, but introduce client framework/integration features we do not need. Use official Query API, a public dataset, published perspective and no frontend credentials. No runtime LLM, paid APIs, visitor accounts or anonymous writes.

- https://docs.astro.build/en/guides/client-side-scripts/
- https://docs.astro.build/en/guides/deploy/github/
- https://www.sanity.io/docs/http-reference/query
- https://www.sanity.io/docs/studio/installation
- https://dev.to/challenges/sanity-2026-09-16

Project e1rm1vsv, public dataset production. Account UI says Growth Trial $0, automatically downgraded to Free after 30 days; do not enable paid features. Content budget: 16 initial documents, maximum 30 in this release, less than 1 MB. One read per load or explicit Reload. No polling.

## Module contracts

`src/lib/domain.mjs` exports `evaluate(evidence, interpretation)` -> `{value, display, steps: string[]}`; `validateExhibit(exhibit)` -> `string[]` errors; `validateCollection(array)` -> throws descriptive Error or returns same validated array. Numeric comparisons use tolerance, not formatted-string equality. Unknown algorithms reject. No eval, network or DOM.

Sanity documents:

- evidence: `_id,_type:'evidence',title,kind:'list'|'table',columns:string[],rows:{_key,label,cells:string[]}[],synthetic:true,originNote`.
- interpretation: `_id,_type:'interpretation',label,assumption,evaluatorKey,expectedJson:string,verdict:'supported'|'unsupported'|'conditional',explanation,evidence` (reference).
- exhibit: `_id,_type:'exhibit',title,slug` (Sanity slug object),`category,claim,order:number,reviewStatus:'draft'|'verified',takeaway,evidence` (reference),`interpretations` (reference array),`sources` (array `{_key,title,url}`). Verified means automated domain checks, not a human review claim.

Query expands exhibit.evidence and exhibit.interpretations[].evidence to full documents. Fixed evaluatorKey enum: `sortText,sortNumber,identityText,identityNumber,meanExcludeMissing,meanMissingZero,meanOfRates,pooledRate`. Input numeric strings must parse as finite numbers, empty cells only where permitted. Results: sorted number lists, distinct text/number arrays, mean/rate numbers. expectedJson is parsed data, never code.

Initial four cases: [2,10,1] sorting; ['0042','42'] identity; [4,'',8] missing mean; two groups (2/2 and 2/8) rates. Eight expected results are [1,10,2], [1,2,10], ['0042','42'], [42], 6, 4, 62.5, 40 respectively. Rates use columns=["success","total"], each row has exactly two cells [success,total]; row.label is separate. meanOfRates and pooledRate return percentages on 0-100 scale. Every interpretation references its exhibit's evidence. validateExhibit checks identical evidence _id, re-evaluates every interpretation and compares expectedJson using numeric tolerance; it validates all required shapes, not just the status field. Sixteen original synthetic documents in content/seed.ndjson (4+8+4).

Frontend: first-load query / Reload -> validation -> exhibition navigation -> visitor chooses supported/unsupported/depends -> evidence reveal -> interpretation buttons recompute from CMS data -> result, explanation, takeaway. No claim of universal correctness: answers depend on assumptions. Buttons can reveal directly to avoid forced guessing. Changing interpretation performs no network request. Reload retains previous verified collection on failure with explicit stale message; zero results has a real empty state. No hardcoded content fallback.

## Design baseline

Reading this as an interactive editorial exhibit for curious adults and technical judges, with a quiet laboratory-museum language. Native CSS, variance 6 / motion 2 / density 3. Wired reference supplies readable editorial hierarchy and metadata spacing only; no borrowed branding or magazine columns.

Palette: porcelain #f5f8fc, midnight ink #15263c, slate #526176, glass #e4edf6, cobalt #2556bc, rust #aa390b. Display Georgia (restrained italic emphasis), body system humanist Segoe UI, evidence ui-monospace. 8/16/24/40/64 spacing, 4px labels and 20px exhibit stage corners. Light and dark via prefers-color-scheme. No stock imagery needed: the actual data is the exhibit.

Signature: a large central evidence tray with a small left exhibit index, the claim above it and an interpretation rail alongside it. Evidence unlock unfolds the actual calculation rather than flipping cards. Avoid a generic marketing hero, three feature cards, gratuitous decoration or fake metrics. Narrow layout stacks index then claim then evidence. Motion limited to 180ms opacity/transform, disabled for reduced motion.

## Acceptance and failure plan

1. Create account/project, public empty-query walking skeleton, then expand modules.
2. Eight mathematical outputs independently tested; malformed content and missing refs fail clearly.
3. Studio supports all three types and validates schema; seeded public content is actually fetched.
4. Build + domain tests, browser desktop/mobile/keyboard/reset/reload checks, independent review.
5. Deploy static front and Studio, demonstrate Publish -> Reload update without rebuild; English DEV entry with real evidence and AI disclosure.

Main risks: auth, misleading educational claims, stale content and weak submission. Simpler options considered above. Rollback only this new project/source and its created artifacts; preserve all other projects. Do not delete public content or alter billing to get past a failure. No guarantee of winning or payment. Task source of truth: ../../specs/changes/income-20260910/tasks.md.

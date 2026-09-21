# Museum of Almost Right

An original interactive collection about the conditions hidden behind apparently correct data results. Built during the September 2026 DEV × Sanity Challenge by Codex, an AI assistant acting on behalf of Jianqiang.

## Run the frontend

Requires Node.js 22.12 or newer. Developed with Node 26.2.0 and Astro 7.3.3.

```sh
npm ci
npm test
npm run dev
```

Open `http://127.0.0.1:4321/museum-of-almost-right/`. Build with `npm run build`; inspect production with `npm run preview`. Current Astro can run the development server as a background process; use `npx astro dev status` and `npx astro dev stop` to manage it.

The frontend reads project `e1rm1vsv`, public dataset `production`, using Sanity's published perspective. There are no frontend tokens. Add the exact preview origin in Sanity CORS settings, with credentials disabled. Only the public project identifier and dataset are bundled. `astro.config.mjs` sets the GitHub Pages project path; adjust `site` and `base` for a different deployment.

## Content drives the interaction

Three document types model the experience:

- **Evidence** contains the actual synthetic rows and a provenance note.
- **Interpretations** reference evidence, specify an assumption, and select a fixed calculation. Expected results are JSON data, never executable code.
- **Exhibits** reference evidence and multiple interpretations, framing them with a claim and a takeaway.

The browser fetches this graph once on load or Reload exhibits. It verifies document shapes, references and every calculation before displaying the collection. Content updates do not require a frontend build. A failed refresh retains the previous successful collection with a visible stale-data message. No local sample is silently substituted for failed CMS content.

An editor can add another exhibit using the existing calculation types without changing frontend code. A new calculation type does require a reviewed code change and tests. `reviewStatus: verified` means automated consistency checks; it does not claim independent human review. Published wording and editorial verdicts still need review: numeric agreement cannot prove that a natural-language claim is appropriate.

## Four original exhibits

Sorting numbers as text; losing leading zeros in identifiers; interpreting missing data; and comparing equally weighted group rates with a pooled rate. The source data and prose were created for this project. All are synthetic; equal converted identifiers do not establish the identity of real entities.

`content/seed.ndjson` contains 16 documents. Import into the authenticated project only after checking the destination. This file has no secrets. The browser calculates the results from the fetched rows rather than looking up precomputed answers.

## Privacy and costs

No visitor login, analytics, form submissions, runtime AI services or payment flows. Choices live only in page memory. Network requests go to the static host and the public Sanity Query API. The implementation uses features available on Free. The actual project account initially shows a $0 Growth Trial and automatic downgrade to Free; no paid upgrade was selected.

## Verification and limits

Run `npm test` for independent expected outputs, malformed inputs, missing references, mismatched expected values and non-mutation. `npm run build` produces `dist/`. See `TEST_REPORT.md` for the current evidence and remaining checks; tests are not a claim of publication, winning or payment.

This is an educational demonstration, not a validated assessment. No user research or learning-gain study has been performed. Keyboard and mobile acceptance must be recorded from actual browser use, separately from unit tests.

Design uses original CSS and system fonts, with editorial hierarchy informed by a local Wired design-language reference. No Wired marks, proprietary fonts, imagery or copied content are used. Source references for mathematical/programming concepts are listed per exhibit.

## License

Original code and content are available under the MIT license. Dependencies retain their own licenses. Third-party reference pages are linked, not republished.
## Live project

- Public demo: https://jianqiang8977-create.github.io/museum-of-almost-right/
- Content Studio (authorized editors only): https://almost-right-jianqiang.sanity.studio/
- Studio setup and publishing: [studio/README.md](studio/README.md)

The frontend is public and needs no visitor account. See the verification record for actual deployment and content-update evidence; Studio network warnings remain a known environment limitation.

- Published challenge writeup: https://dev.to/jianqiang8977/museum-of-almost-right-change-an-assumption-change-the-answer-2cck

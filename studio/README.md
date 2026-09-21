# Museum of Almost Right — Content Studio

This Studio edits the evidence, interpretations and exhibits consumed by the Astro frontend. Both `sanity.config.ts` and `sanity.cli.ts` target project **`e1rm1vsv`**, public dataset **`production`**. These identifiers are public; permission to edit requires an authorized Sanity account. Never put an account token in frontend code or share an editor login with visitors.

## Install and run

Use Node.js 22.12 or newer. From the repository root:

```sh
cd studio
npm ci
npm run dev
```

Open the local URL printed by the CLI and sign in with an account authorized for this project. The frontend is a separate process: from the repository root, run `npm ci` and `npm run dev`, then open `http://127.0.0.1:4321/museum-of-almost-right/`.

This repository's configuration points at the live project, not an isolated test dataset. Check the project and dataset before any import, publication or deployment. The 16 initial documents are already imported; ordinary setup does not require importing them again. A separate fork should use its own project and update both Studio configuration files and the frontend query endpoint.

## Validate before publishing

Run these commands from `studio/`:

```sh
npx --no-install sanity schema validate
npx --no-install sanity documents validate --dataset production
npm run build
```

Document validation reads the configured dataset and evaluates the schema rules; it may require an authorized CLI login. Read the reported errors and warnings, rather than treating a process exit alone as acceptance. The verified-exhibit validator fetches published references and recomputes expected results using `src/lib/domain.mjs`. It does not prove that editorial wording or a real-world conclusion is correct. From the repository root, `npm test` separately checks the calculation functions.

## Publish references in order

1. Create and publish **Evidence** with original synthetic rows, column names and an origin note. A list has one column; rates use `success`, then `total`. Represent a missing observation with an empty string cell, not zero or an omitted cell.
2. Create and publish at least two **Interpretations** referencing that same evidence. Choose a supported calculation, write its explicit assumption and explanation, and enter the expected result as JSON data. Rates use percentages from 0 to 100.
3. Create the **Exhibit**, referencing the published evidence and interpretations. Add the claim, takeaway, order, slug and HTTPS method sources. Keep `reviewStatus` at `draft` until its references are ready.
4. Set `reviewStatus` to `verified`, resolve validation errors, review the prose, then publish the exhibit. Here, verified means automated calculation consistency, not independent human review.

When changing calculation data already used by published exhibits, first set every affected exhibit's `reviewStatus` to `draft` and publish that status change. Then update and publish the evidence and interpretations, recheck the dependent exhibits, and restore their verified status. This avoids temporarily exposing mismatched expected values. Merely saving an unpublished Studio draft does not change the public page. One invalid published exhibit causes the frontend to reject the incoming collection; a failed refresh retains the prior successful collection with a warning.

## Check Publish → Reload

For a small, authorized wording edit, record the existing text, edit and publish the exhibit, then select **Reload exhibits** in the frontend. Confirm that the published text appears, the collection status refreshes, and calculations still agree. Do not rebuild the frontend during this check. Draft-only changes should remain absent because the frontend queries the published perspective. Restore temporary demonstration edits through the same publication flow when appropriate.

The browser uses the public Query API without a token or credentials. Its exact origin must be allowed in the project's CORS settings. Interpretation changes calculate locally; loading or explicitly reloading the collection makes the content request.

These are reproducible instructions, not a claim that the full Studio UI journey or a public deployment has passed. Consult the repository's [verification record](../TEST_REPORT.md) for completed checks and remaining acceptance work. `npm run deploy` publishes the Studio and is a separate authorized release action; it is not needed to run local validation. Studio auto-updates are disabled in `sanity.cli.ts` for controlled deployments.

## License

Original Studio code uses the repository's [MIT license](../LICENSE). Dependencies retain their own licenses.

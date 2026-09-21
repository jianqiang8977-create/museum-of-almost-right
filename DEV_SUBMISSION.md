---
title: "Museum of Almost Right: change an assumption, change the answer"
published: true
tags: devchallenge, sanitychallenge, sanity, ai
---

*This is a submission for the [Sanity Challenge, Path Two: Vibe-Code Something Strange](https://dev.to/challenges/sanity-2026-09-16).*

## What I Built

**Museum of Almost Right** is an interactive collection about the assumptions hidden inside convincing data results. It is for curious readers who want to inspect a claim without opening a spreadsheet or writing code.

Each exhibit presents a small dataset and a label. Choose whether the evidence supports the label, open the notes, then switch interpretations. The same source data produces a different result when the comparison rule, representation, missing-value policy or weighting changes.

There are four original, synthetic exhibits:

- Sorting `[2,10,1]` with JavaScript's default comparison versus numeric comparison.
- Preserving `0042` and `42` as text versus converting both to numbers.
- Averaging `4`, a blank observation and `8`, with two treatments of missing data.
- Comparing two groups' average success rates with the pooled success rate.

There is no score. The point is to name the condition that makes an answer defensible. All observations are invented; this is an educational demonstration, not a validated assessment.

**Authorship disclosure:** this new project was built during the challenge by Codex, an AI assistant acting on behalf of Jianqiang. Implementation, tests, documentation and this article are AI-led. Separate agent review and actual browser checks are described below; they are not claims of independent human review or user research.

## Demo

[Open the public museum](https://jianqiang8977-create.github.io/museum-of-almost-right/). No visitor account is required.

![The public Museum of Almost Right page, showing its exhibit navigation, claim and synthetic evidence table](https://raw.githubusercontent.com/jianqiang8977-create/museum-of-almost-right/main/docs/screenshots/public-exhibit.png)

For a quick walkthrough, open the first exhibit's notes and switch to numeric comparison: the result becomes `[1,2,10]`. In the success-rate exhibit, compare equal group weighting, `62.5%`, with pooled trials, `40%`.

The [deployed Studio](https://almost-right-jianqiang.sanity.studio/) requires an authorized editor account. Judges can use the public frontend and project details below without editor credentials.

## Code

[Source repository](https://github.com/jianqiang8977-create/museum-of-almost-right)

Astro provides a static shell; native browser JavaScript queries Sanity and performs deterministic calculations. Original code and content are MIT-licensed. Dependencies retain their licenses. MDN and NIST references are linked inside each exhibit; their pages are not republished. The visual hierarchy was informed by a Wired design reference, with original CSS, system fonts and no borrowed branding or imagery.

## My Build Process

### Start with an honest empty room

The first useful milestone was a real public Sanity query returning **zero exhibits**. The page displayed that empty state. Hardcoding local exhibits behind a successful-looking interface would have concealed the most important integration failure.

The implementation brief can be paraphrased as: *Build a small editorial museum where content supplies evidence and competing assumptions, while reviewed calculation code shows their consequences.* This is a reconstruction of the design direction, not a verbatim user prompt or session transcript.

The scope stayed small: four exhibits, eight interpretations, no runtime language model, no visitor writes and no paid API dependency.

### Model the disagreement

Three document types separate the concerns:

1. **Evidence** stores rows, columns and provenance.
2. **Interpretations** reference evidence and specify an assumption, calculation key, expected JSON result, verdict and explanation.
3. **Exhibits** assemble those references into a claim and takeaway.

The calculation keys select eight fixed functions. JSON is parsed as data, never executed. Adding another exhibit with an existing calculation needs content changes; introducing a new calculation requires code review and tests.

Studio validation checks verified exhibits against their published references. The frontend independently validates the fetched collection and recomputes expected results. A matching number proves consistency with the declared expectation; it cannot certify the truth of editorial prose. The interface states that distinction.

### Challenge the apparent successes

The test suite uses explicit expected outputs, then exercises malformed cells, unsafe numeric values, missing or conflicting references, unsupported algorithms, incorrect expectations and accidental mutation. Both the main implementation context and a separate review context ran **25 tests with 25 passes**.

Independent review also found three practical defects: a skip link targeted hidden content, navigation could focus an offscreen heading, and whitespace-only missing values were displayed inconsistently. Those were corrected. A keyboard Reset check then confirmed that notes collapsed, the choice cleared and the heading received visible focus.

The work included mundane failures too. A package mirror did not provide the required CLI dependency, so installation used the official registry. Git authentication used device login. GitHub Pages initially needed enabling before deployment succeeded. These were setup corrections, not application features.

### Verify publication beyond the button

After importing the 16 documents, Reload changed the museum from zero to four exhibits. All eight calculation results were checked in Chrome.

A later Studio edit added “State the comparison rule alongside the result.” to the first takeaway. Clicking Publish left a prolonged Saving state and an HTTP/1 warning. That interface state alone was inconclusive. The public API returned a new revision, reopening the editor preserved the text, and the public frontend displayed it after Reload, without a code change or rebuild for that content update.

The transport warning's cause remains unproven; an external HTTP/2 probe succeeded. I am not claiming that protocol issue was diagnosed or fixed.

## Sanity Project Details

- **Project ID:** `e1rm1vsv`
- **Public dataset:** `production`
- **Content:** 4 evidence documents, 8 interpretations and 4 exhibits.
- **Validation:** schema validation reported no errors or warnings; document validation reported 16 valid documents and no warnings.

The frontend queries the published perspective without a token. It reads on initial load or explicit Reload; switching interpretations requires no additional request. Failed refreshes retain the previous successful collection with a warning. Choices remain in page memory.

Responsive interactions were checked in real Chrome using 360, 768 and 1280 CSS-pixel iframes: selecting a position and numeric sorting, obtaining the pooled `40%`, and navigating to the second exhibit. These are viewport checks, not physical-device tests or a complete accessibility audit. Reduced-motion handling exists in CSS but has not been independently exercised end to end.

The project uses Free-compatible features. Its account initially showed a $0 Growth Trial with automatic downgrade to Free; no paid upgrade was selected. This entry does not claim a prize or payment. Its completed result is the working public museum and the documented content-to-interface path.

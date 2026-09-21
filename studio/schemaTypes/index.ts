import {defineArrayMember, defineField, defineType} from 'sanity'
import {validateExhibit} from '../../src/lib/domain.mjs'

const algorithms = [
  'sortText', 'sortNumber', 'identityText', 'identityNumber',
  'meanExcludeMissing', 'meanMissingZero', 'meanOfRates', 'pooledRate',
]
const verdicts = ['supported', 'unsupported', 'conditional']
const statuses = ['draft', 'verified']
const nonempty = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0
const record = (value: unknown): Record<string, unknown> | undefined =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined

function requiredText(value: unknown) {
  return nonempty(value) || 'Enter non-empty text.'
}

function enumValue(value: unknown, values: string[]) {
  return typeof value === 'string' && values.includes(value) || 'Choose one of the listed values.'
}

function strongReference(value: unknown) {
  const ref = record(value)
  return Boolean(ref && ref._type === 'reference' && nonempty(ref._ref)
    && /^[A-Za-z0-9_.-]{1,128}$/.test(ref._ref)
    && !/^(drafts|versions)\./.test(ref._ref) && ref._weak !== true)
    || 'Select a strong reference to a document, using its canonical ID.'
}

function expectedJson(value: unknown) {
  if (!nonempty(value)) return 'Enter a JSON number or array of numbers/text.'
  try {
    const parsed: unknown = JSON.parse(value)
    const finiteNumber = (item: unknown) => typeof item === 'number' && Number.isFinite(item)
    if (finiteNumber(parsed)) return true
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string' || finiteNumber(item))) return true
    return 'Expected JSON must be a finite number or an array of finite numbers/text.'
  } catch {
    return 'Use valid JSON data, not JavaScript. Rates are percentages from 0 to 100.'
  }
}

function evidenceRows(value: unknown) {
  const document = record(value)
  if (!document) return true // Field rules guide an unfinished draft.
  const columns = document.columns
  const rows = document.rows
  if (!Array.isArray(columns) || !Array.isArray(rows)) return true
  if (document.kind === 'list' && columns.length !== 1) return 'List evidence needs exactly one column.'
  const keys = new Set<string>()
  for (const [index, item] of rows.entries()) {
    const row = record(item)
    if (!row || !nonempty(row._key)) return 'Row ' + (index + 1) + ' needs a Sanity array key.'
    if (keys.has(row._key)) return 'Every evidence row must have a distinct array key.'
    keys.add(row._key)
    if (!Array.isArray(row.cells) || row.cells.length !== columns.length || !row.cells.every((cell) => typeof cell === 'string')) {
      return 'Row ' + (index + 1) + ' must have one text cell for each column; use an empty string for missing data.'
    }
  }
  return true
}

const evidence = defineType({
  name: 'evidence',
  title: 'Evidence',
  type: 'document',
  initialValue: {synthetic: true, kind: 'list'},
  description: 'Original synthetic data. Publish evidence before verifying an exhibit that uses it.',
  validation: (rule) => rule.custom(evidenceRows),
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required().custom(requiredText)}),
    defineField({
      name: 'kind', title: 'Shape', type: 'string',
      options: {list: ['list', 'table'], layout: 'radio'},
      validation: (rule) => rule.required().custom((value) => enumValue(value, ['list', 'table'])),
    }),
    defineField({
      name: 'columns', title: 'Column names', type: 'array',
      description: 'Lists have one column. Rates use exactly success, total, in that order; the row label is separate.',
      of: [defineArrayMember({type: 'string', validation: (rule) => rule.required().custom(requiredText)})],
      validation: (rule) => rule.required().min(1).unique(),
    }),
    defineField({
      name: 'rows', title: 'Data rows', type: 'array',
      of: [defineArrayMember({
        name: 'evidenceRow', title: 'Row', type: 'object',
        fields: [
          defineField({name: 'label', title: 'Row label', type: 'string', validation: (rule) => rule.required().custom(requiredText)}),
          defineField({
            name: 'cells', title: 'Cells', type: 'array',
            description: 'Text cells in column order. A missing observation is an empty string cell, not zero or an omitted cell.',
            // Do not mark individual strings required: the missing-data case intentionally contains "".
            of: [defineArrayMember({type: 'string'})],
            validation: (rule) => rule.required().min(1).custom((value) =>
              Array.isArray(value) && value.every((cell) => typeof cell === 'string') || 'All cells must be strings, including empty strings.'),
          }),
        ],
        preview: {select: {title: 'label'}},
      })],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: 'synthetic', title: 'Synthetic data', type: 'boolean',
      description: 'This release accepts only original synthetic evidence, not personal or customer data.',
      validation: (rule) => rule.required().custom((value) => value === true || 'Synthetic must be true.'),
    }),
    defineField({name: 'originNote', title: 'Origin note', type: 'text', rows: 3, validation: (rule) => rule.required().custom(requiredText)}),
  ],
  preview: {select: {title: 'title', subtitle: 'kind'}},
})

const interpretation = defineType({
  name: 'interpretation', title: 'Interpretation', type: 'document',
  description: 'An explicit assumption and deterministic calculation. Publish before verifying its exhibit.',
  fields: [
    defineField({name: 'label', title: 'Mode label', type: 'string', validation: (rule) => rule.required().custom(requiredText)}),
    defineField({name: 'assumption', title: 'Assumption', type: 'text', rows: 3, validation: (rule) => rule.required().custom(requiredText)}),
    defineField({
      name: 'evaluatorKey', title: 'Calculation', type: 'string',
      options: {list: algorithms},
      description: 'Fixed calculation code; no executable code is stored in Content Lake.',
      validation: (rule) => rule.required().custom((value) => enumValue(value, algorithms)),
    }),
    defineField({
      name: 'expectedJson', title: 'Expected result (JSON)', type: 'text', rows: 2,
      description: 'For example [1,10,2], ["0042","42"], 6 or 62.5. Rates use 0-100 percentages. The exhibit validator recomputes this value.',
      validation: (rule) => rule.required().custom(expectedJson),
    }),
    defineField({
      name: 'verdict', title: 'Verdict under this assumption', type: 'string',
      options: {list: verdicts, layout: 'radio'},
      description: 'An editorial explanation of the claim, not an automatically proven real-world fact.',
      validation: (rule) => rule.required().custom((value) => enumValue(value, verdicts)),
    }),
    defineField({name: 'explanation', title: 'Explanation', type: 'text', rows: 4, validation: (rule) => rule.required().custom(requiredText)}),
    defineField({
      name: 'evidence', title: 'Evidence', type: 'reference', to: [{type: 'evidence'}],
      description: 'Must be the same evidence document selected by the exhibit.',
      validation: (rule) => rule.required().custom(strongReference),
    }),
  ],
  preview: {select: {title: 'label', subtitle: 'evaluatorKey'}},
})

const exhibit = defineType({
  name: 'exhibit', title: 'Exhibit', type: 'document',
  initialValue: {reviewStatus: 'draft'},
  description: 'Verify against published evidence and interpretations, then Publish. Visitors see only published, verified exhibits.',
  // This is the only custom network validation: one grouped read per verified exhibit check.
  validation: (rule) => rule.custom(async (value, context) => {
    const current = record(value)
    if (!current || current.reviewStatus !== 'verified') return true
    if (strongReference(current.evidence) !== true) return 'Select the exhibit evidence before verification.'
    if (!Array.isArray(current.interpretations) || current.interpretations.length < 2) return 'Select at least two interpretations before verification.'
    if (!current.interpretations.every((item) => strongReference(item) === true)) return 'Every interpretation must be a strong reference.'
    const evidenceId = record(current.evidence)!._ref as string
    const interpretationIds = current.interpretations.map((item) => record(item)!._ref as string)
    if (new Set(interpretationIds).size !== interpretationIds.length) return 'Choose distinct interpretation documents.'
    if (!nonempty(current._id)) return 'The exhibit needs a document ID before verification.'
    try {
      const client = context.getClient({apiVersion: '2026-03-01'}).withConfig({perspective: 'published', useCdn: false})
      const fetched = await client.fetch<{evidence: unknown; interpretations: Array<Record<string, unknown>>}>(
        '{"evidence": *[_type == "evidence" && _id == $evidenceId][0], "interpretations": *[_type == "interpretation" && _id in $interpretationIds]{..., "evidence": evidence->}}',
        {evidenceId, interpretationIds},
      )
      if (!fetched.evidence) return 'Publish the selected evidence before verifying this exhibit.'
      const byId = new Map(fetched.interpretations.map((item) => [item._id, item]))
      if (interpretationIds.some((id) => !byId.has(id))) return 'Publish every selected interpretation before verifying this exhibit.'
      const expanded = {
        ...current,
        // Validate the current edit as a prospective published exhibit, not a stale stored copy.
        _id: current._id.replace(/^drafts\./, ''),
        evidence: fetched.evidence,
        interpretations: interpretationIds.map((id) => byId.get(id)),
      }
      const errors: string[] = validateExhibit(expanded)
      return errors.length === 0 || 'Automatic calculation checks failed: ' + errors.join(' | ')
    } catch {
      return 'Could not check published references. Keep the exhibit in draft, check the connection and retry verification.'
    }
  }),
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required().custom(requiredText)}),
    defineField({
      name: 'slug', title: 'Slug', type: 'slug', options: {source: 'title'},
      validation: (rule) => rule.required().custom((value) =>
        typeof value?.current === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.current) || 'Use lowercase words separated by hyphens.'),
    }),
    defineField({name: 'category', title: 'Category', type: 'string', validation: (rule) => rule.required().custom(requiredText)}),
    defineField({name: 'claim', title: 'Claim to inspect', type: 'text', rows: 2, validation: (rule) => rule.required().custom(requiredText)}),
    defineField({name: 'order', title: 'Exhibition order', type: 'number', validation: (rule) => rule.required().integer().min(0).max(Number.MAX_SAFE_INTEGER)}),
    defineField({
      name: 'reviewStatus', title: 'Calculation review status', type: 'string',
      options: {list: [{title: 'Draft', value: 'draft'}, {title: 'Verified: automatic calculation checks', value: 'verified'}], layout: 'radio'},
      description: 'Verified requires matching computed results and consistent published references. It does not claim human review or establish the truth of editorial prose.',
      validation: (rule) => rule.required().custom((value) => enumValue(value, statuses)),
    }),
    defineField({name: 'takeaway', title: 'Takeaway', type: 'text', rows: 3, validation: (rule) => rule.required().custom(requiredText)}),
    defineField({name: 'evidence', title: 'Evidence', type: 'reference', to: [{type: 'evidence'}], validation: (rule) => rule.required().custom(strongReference)}),
    defineField({
      name: 'interpretations', title: 'Interpretations', type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'interpretation'}], validation: (rule) => rule.required().custom(strongReference)})],
      validation: (rule) => rule.required().min(2).unique(),
    }),
    defineField({
      name: 'sources', title: 'Method sources', type: 'array',
      description: 'Verified authoritative URLs for the method; these sources are not the origin of our synthetic observations.',
      of: [defineArrayMember({
        name: 'methodSource', title: 'Source', type: 'object',
        fields: [
          defineField({name: 'title', title: 'Source title', type: 'string', validation: (rule) => rule.required().custom(requiredText)}),
          defineField({
            name: 'url', title: 'HTTPS URL', type: 'url',
            validation: (rule) => rule.required().uri({scheme: ['https']}).custom((value) => {
              if (!nonempty(value)) return 'Enter an HTTPS source URL.'
              try {
                const url = new URL(value)
                return url.protocol === 'https:' && !url.username && !url.password || 'Use HTTPS without embedded credentials.'
              } catch { return 'Enter a valid HTTPS source URL.' }
            }),
          }),
        ],
        preview: {select: {title: 'title', subtitle: 'url'}},
      })],
      validation: (rule) => rule.required().min(1),
    }),
  ],
  orderings: [{title: 'Exhibition order', name: 'exhibitionOrder', by: [{field: 'order', direction: 'asc'}]}],
  preview: {select: {title: 'title', subtitle: 'reviewStatus'}},
})

export const schemaTypes = [evidence, interpretation, exhibit]

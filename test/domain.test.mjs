import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {evaluate, validateExhibit, validateCollection} from '../src/lib/domain.mjs';

const seedText = readFileSync(new URL('../content/seed.ndjson', import.meta.url), 'utf8');
const documents = seedText.trim().split(/\r?\n/).map((line) => JSON.parse(line));
const byId = new Map(documents.map((document) => [document._id, document]));
function expand(value) {
  if (Array.isArray(value)) return value.map(expand);
  if (value && typeof value === 'object') {
    if (value._type === 'reference') {
      assert.ok(byId.has(value._ref), 'Seed has a dangling reference: ' + value._ref);
      return expand(byId.get(value._ref));
    }
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, expand(item)]));
  }
  return value;
}
const collection = documents.filter((document) => document._type === 'exhibit').map(expand);
const clone = (index = 0) => structuredClone(collection[index]);
const golden = new Map([
  ['sortText', [1, 10, 2]], ['sortNumber', [1, 2, 10]],
  ['identityText', ['0042', '42']], ['identityNumber', [42]],
  ['meanExcludeMissing', 6], ['meanMissingZero', 4],
  ['meanOfRates', 62.5], ['pooledRate', 40],
]);

test('seed is 16 distinct original documents within the contract budget', () => {
  assert.equal(documents.length, 16);
  assert.equal(byId.size, 16);
  assert.ok(Buffer.byteLength(seedText, 'utf8') < 1_000_000);
  for (const [type, count] of [['exhibit', 4], ['interpretation', 8], ['evidence', 4]]) {
    assert.equal(documents.filter((document) => document._type === type).length, count);
  }
  for (const document of documents.filter((document) => document._type === 'evidence')) {
    assert.equal(document.synthetic, true);
    assert.match(document.originNote, /Original synthetic/);
  }
});

for (const exhibit of collection) {
  for (const interpretation of exhibit.interpretations) {
    test('independent golden result: ' + interpretation.evaluatorKey, () => {
      const result = evaluate(exhibit.evidence, interpretation);
      assert.deepEqual(result.value, golden.get(interpretation.evaluatorKey));
      assert.deepEqual(JSON.parse(interpretation.expectedJson), golden.get(interpretation.evaluatorKey));
      assert.ok(result.steps.length >= 2 && result.steps.every((step) => typeof step === 'string' && step.length > 0));
      assert.equal(typeof result.display, 'string');
    });
  }
}

test('a valid expanded collection returns the same array; empty is valid', () => {
  assert.equal(validateCollection(collection), collection);
  const empty = [];
  assert.equal(validateCollection(empty), empty);
  assert.throws(() => validateCollection(null), /array/);
});

test('calculations and validation do not mutate their inputs', () => {
  const exhibit = clone();
  const before = structuredClone(exhibit);
  function freeze(value) {
    if (value && typeof value === 'object') {
      Object.freeze(value);
      for (const child of Object.values(value)) freeze(child);
    }
  }
  freeze(exhibit);
  for (const interpretation of exhibit.interpretations) evaluate(exhibit.evidence, interpretation);
  assert.deepEqual(validateExhibit(exhibit), []);
  assert.deepEqual(exhibit, before);
});

test('new data is computed rather than mapped to seed answers', () => {
  const evidence = clone().evidence;
  evidence.rows.forEach((row, i) => { row.cells[0] = ['11', '-2', '3'][i]; });
  assert.deepEqual(evaluate(evidence, {evaluatorKey: 'sortText'}).value, [-2, 11, 3]);
  assert.deepEqual(evaluate(evidence, {evaluatorKey: 'sortNumber'}).value, [-2, 3, 11]);
  const rates = clone(3).evidence;
  rates.rows[0].cells = ['1', '2'];
  rates.rows[1].cells = ['3', '4'];
  assert.equal(evaluate(rates, {evaluatorKey: 'meanOfRates'}).value, 62.5);
  assert.ok(Math.abs(evaluate(rates, {evaluatorKey: 'pooledRate'}).value - 200 / 3) < 1e-10);
});

test('text identity preserves characters and first occurrence order', () => {
  const evidence = clone(1).evidence;
  evidence.rows.push({_key: 'extra', label: 'Line C', cells: ['0042']});
  assert.deepEqual(evaluate(evidence, {evaluatorKey: 'identityText'}).value, ['0042', '42']);
  assert.deepEqual(evaluate(evidence, {evaluatorKey: 'identityNumber'}).value, [42]);
  evidence.rows[0].cells = ['A42'];
  assert.deepEqual(evaluate(evidence, {evaluatorKey: 'identityText'}).value, ['A42', '42', '0042']);
  assert.throws(() => evaluate(evidence, {evaluatorKey: 'identityNumber'}), /numeric string/);
});

test('blank, zero and unknown mean are distinct', () => {
  const evidence = clone(2).evidence;
  evidence.rows.forEach((row) => { row.cells = ['']; });
  assert.throws(() => evaluate(evidence, {evaluatorKey: 'meanExcludeMissing'}), /observed/);
  assert.equal(evaluate(evidence, {evaluatorKey: 'meanMissingZero'}).value, 0);
  evidence.rows[0].cells = ['0'];
  assert.equal(evaluate(evidence, {evaluatorKey: 'meanExcludeMissing'}).value, 0);
  evidence.rows[1].cells = ['6'];
  assert.equal(evaluate(evidence, {evaluatorKey: 'meanExcludeMissing'}).value, 3);
  assert.equal(evaluate(evidence, {evaluatorKey: 'meanMissingZero'}).value, 2);
});

test('reject invalid, blank, non-finite and unsafe numeric input', () => {
  for (const invalid of ['', ' ', '12px', 'NaN', 'Infinity', '0x10', '1e309', '9007199254740993']) {
    const evidence = clone().evidence;
    evidence.rows[0].cells = [invalid];
    assert.throws(() => evaluate(evidence, {evaluatorKey: 'sortNumber'}), /numeric string|finite|precision/, invalid);
  }
});

test('rate counts cannot be zero-denominator, negative, fractional or exceed total', () => {
  for (const pair of [['0', '0'], ['-1', '2'], ['3', '2'], ['1.5', '2'], ['1', '2.5']]) {
    const evidence = clone(3).evidence;
    evidence.rows[0].cells = pair;
    for (const evaluatorKey of ['meanOfRates', 'pooledRate']) assert.throws(() => evaluate(evidence, {evaluatorKey}), /Rate counts/);
  }
  const evidence = clone(3).evidence;
  evidence.columns.reverse();
  assert.throws(() => evaluate(evidence, {evaluatorKey: 'pooledRate'}), /columns/);
});

test('unknown algorithms and incompatible evidence shapes fail', () => {
  for (const evaluatorKey of ['eval', '__proto__', 'toString', '', null]) assert.throws(() => evaluate(clone().evidence, {evaluatorKey}), /Unknown/);
  assert.throws(() => evaluate(clone().evidence, {evaluatorKey: 'pooledRate'}), /table/);
  assert.throws(() => evaluate(clone(3).evidence, {evaluatorKey: 'sortNumber'}), /one-column/);
});

test('malformed documents, cells, row keys and metadata fail clearly', () => {
  const mutations = [
    (x) => { x.evidence = null; },
    (x) => { x.evidence.rows[0].cells = [2]; },
    (x) => { x.evidence.rows[0].cells = []; },
    (x) => { x.evidence.rows[1]._key = x.evidence.rows[0]._key; },
    (x) => { x.evidence.synthetic = false; },
    (x) => { x.evidence.originNote = ''; },
    (x) => { x.evidence.rows = []; },
    (x) => { x.slug = 'not-a-slug-object'; },
    (x) => { x.order = 1.5; },
    (x) => { x.title = ''; },
    (x) => { x._type = 'post'; },
    (x) => { x._id = 'drafts.exhibit-sort'; },
    (x) => { x.reviewStatus = 'draft'; },
  ];
  for (const mutate of mutations) {
    const exhibit = clone();
    mutate(exhibit);
    assert.ok(validateExhibit(exhibit).length > 0);
    assert.throws(() => validateCollection([exhibit]), /Invalid public collection/);
  }
  assert.ok(validateExhibit(null).length > 0);
});

test('missing, conflicting and unresolved evidence references fail', () => {
  for (const mutation of [
    (x) => { x.interpretations[0].evidence = null; },
    (x) => { x.interpretations[0].evidence = {_type: 'reference', _ref: x.evidence._id}; },
    (x) => { x.interpretations[0].evidence._id = 'another-evidence'; },
    (x) => { x.interpretations[0].evidence.rows[0].cells = ['999']; },
  ]) {
    const exhibit = clone();
    mutation(exhibit);
    assert.ok(validateExhibit(exhibit).some((error) => /evidence|expanded/.test(error)));
  }
});

test('expected JSON must match values, types and array ordering', () => {
  for (const expectedJson of ['[1,2,10]', '["1","10","2"]', 'null', '{}', '[1,10]', '{invalid}', '[1e999,10,2]']) {
    const exhibit = clone();
    exhibit.interpretations[0].expectedJson = expectedJson;
    assert.ok(validateExhibit(exhibit).some((error) => /expectedJson/.test(error)), expectedJson);
  }
  const exhibit = clone(3);
  exhibit.interpretations[0].expectedJson = '0.625';
  assert.ok(validateExhibit(exhibit).some((error) => /expectedJson/.test(error)));
});

test('numeric tolerance accepts rounding noise but rejects material errors', () => {
  const exhibit = clone(3);
  exhibit.interpretations[0].expectedJson = '62.50000000001';
  assert.deepEqual(validateExhibit(exhibit), []);
  exhibit.interpretations[0].expectedJson = '62.51';
  assert.ok(validateExhibit(exhibit).length > 0);
});

test('interpretation shape, uniqueness and editorial verdict are checked', () => {
  for (const mutation of [
    (x) => { x.interpretations = []; },
    (x) => { x.interpretations[0] = null; },
    (x) => { x.interpretations[1] = structuredClone(x.interpretations[0]); },
    (x) => { x.interpretations[0].verdict = 'true'; },
    (x) => { x.interpretations[0].assumption = ''; },
    (x) => { x.interpretations[0].evaluatorKey = 'newFunction'; },
  ]) {
    const exhibit = clone();
    mutation(exhibit);
    assert.ok(validateExhibit(exhibit).length > 0);
  }
});

test('source links require valid HTTPS and no embedded credentials', () => {
  for (const url of ['javascript:alert(1)', 'http://example.com', 'not a URL', 'https://user:secret@example.com']) {
    const exhibit = clone();
    exhibit.sources[0].url = url;
    assert.ok(validateExhibit(exhibit).some((error) => /source.url/.test(error)));
  }
  const exhibit = clone();
  exhibit.sources = [];
  assert.ok(validateExhibit(exhibit).some((error) => /sources/.test(error)));
});

test('duplicate exhibit IDs or slugs cannot hide behind a valid document', () => {
  assert.throws(() => validateCollection([clone(), clone()]), /duplicate exhibit _id/);
  const duplicateSlug = clone(1);
  duplicateSlug.slug = structuredClone(collection[0].slug);
  assert.throws(() => validateCollection([clone(), duplicateSlug]), /duplicate exhibit slug/);
});

test('Sanity system metadata does not invalidate expanded documents', () => {
  const exhibit = clone();
  exhibit._rev = 'example-revision';
  exhibit._updatedAt = '2026-09-22T00:00:00Z';
  assert.deepEqual(validateExhibit(exhibit), []);
});

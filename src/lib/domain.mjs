// Pure calculations and validation for the public exhibit contract.
const KEYS = new Set(['sortText', 'sortNumber', 'identityText', 'identityNumber', 'meanExcludeMissing', 'meanMissingZero', 'meanOfRates', 'pooledRate']);
const RATE_KEYS = new Set(['meanOfRates', 'pooledRate']);
const MISSING_KEYS = new Set(['meanExcludeMissing', 'meanMissingZero']);
const DECIMAL = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = (value) => typeof value === 'string' && value.trim().length > 0;
const assert = (condition, message) => { if (!condition) throw new Error(message); };

function document(value, type, path) {
  assert(object(value), path + ' must be an expanded document');
  assert(value._type === type, path + '._type must be ' + type);
  assert(text(value._id) && /^[A-Za-z0-9_.-]{1,128}$/.test(value._id), path + '._id is invalid');
  assert(!/^(drafts|versions)\./.test(value._id), path + ' must be published content');
}

function requireText(value, fields, path) {
  for (const field of fields) assert(text(value[field]), path + '.' + field + ' must be non-empty text');
}

function evidenceShape(evidence) {
  document(evidence, 'evidence', 'evidence');
  requireText(evidence, ['title', 'originNote'], 'evidence');
  assert(['list', 'table'].includes(evidence.kind), 'evidence.kind must be list or table');
  assert(evidence.synthetic === true, 'evidence.synthetic must be true');
  assert(Array.isArray(evidence.columns) && evidence.columns.length > 0 && evidence.columns.every(text), 'evidence.columns must contain non-empty names');
  assert(new Set(evidence.columns).size === evidence.columns.length, 'evidence.columns must be unique');
  assert(Array.isArray(evidence.rows) && evidence.rows.length > 0, 'evidence.rows must be a non-empty array');
  const keys = new Set();
  for (const [index, row] of evidence.rows.entries()) {
    const path = 'evidence.rows[' + index + ']';
    assert(object(row), path + ' must be an object');
    requireText(row, ['_key', 'label'], path);
    assert(!keys.has(row._key), path + '._key must be unique');
    keys.add(row._key);
    assert(Array.isArray(row.cells) && row.cells.length === evidence.columns.length && row.cells.every((cell) => typeof cell === 'string'), path + '.cells must be strings matching the column count');
  }
  assert(evidence.kind !== 'list' || evidence.columns.length === 1, 'list evidence must have exactly one column');
}

function numeric(cell, path) {
  assert(typeof cell === 'string' && DECIMAL.test(cell.trim()), path + ' must be a decimal numeric string');
  const number = Number(cell);
  assert(Number.isFinite(number), path + ' must be finite');
  assert(!Number.isInteger(number) || Number.isSafeInteger(number), path + ' exceeds safe integer precision');
  return number;
}

function finite(value) {
  assert(Number.isFinite(value), 'Calculation produced a non-finite result');
  return value;
}

function formatted(number) {
  return Number(number.toPrecision(12)).toString();
}

/** Result values retain numeric types; percentages are on a 0-100 scale. */
export function evaluate(evidence, interpretation) {
  evidenceShape(evidence);
  assert(object(interpretation) && KEYS.has(interpretation.evaluatorKey), 'Unknown evaluatorKey');
  const key = interpretation.evaluatorKey;
  let value;
  let steps;
  if (RATE_KEYS.has(key)) {
    assert(evidence.kind === 'table' && evidence.columns.length === 2 && evidence.columns[0] === 'success' && evidence.columns[1] === 'total', 'Rate evidence requires table columns [success,total]');
    const pairs = evidence.rows.map((row, index) => {
      const success = numeric(row.cells[0], 'row ' + index + ' success');
      const total = numeric(row.cells[1], 'row ' + index + ' total');
      assert(Number.isSafeInteger(success) && Number.isSafeInteger(total) && total > 0 && success >= 0 && success <= total, 'Rate counts require integers with 0 <= success <= total and total > 0');
      return {success, total, label: row.label};
    });
    if (key === 'meanOfRates') {
      const rates = pairs.map(({success, total}) => success / total * 100);
      value = finite(rates.reduce((sum, rate) => sum + rate / rates.length, 0));
      steps = pairs.map(({success, total, label}, i) => label + ': ' + success + ' / ' + total + ' x 100 = ' + formatted(rates[i]) + '%');
      steps.push('Give each group equal weight: (' + rates.map(formatted).join(' + ') + ') / ' + rates.length + ' = ' + formatted(value) + '%');
    } else {
      const success = pairs.reduce((sum, pair) => sum + pair.success, 0);
      const total = pairs.reduce((sum, pair) => sum + pair.total, 0);
      assert(Number.isSafeInteger(success) && Number.isSafeInteger(total), 'Pooled counts exceed safe integer precision');
      value = finite(success / total * 100);
      steps = ['Count each trial once: ' + success + ' successes across ' + total + ' trials.', success + ' / ' + total + ' x 100 = ' + formatted(value) + '%'];
    }
  } else {
    assert(evidence.kind === 'list' && evidence.columns.length === 1, key + ' requires one-column list evidence');
    const cells = evidence.rows.map((row) => row.cells[0]);
    if (key === 'identityText') {
      assert(cells.every(text), 'Text identifiers cannot be blank');
      value = [...new Set(cells)];
      steps = ['Preserve every character, including leading zeros.', 'Distinct text values: ' + JSON.stringify(value) + '. This does not establish real-world identity.'];
    } else {
      const numbers = cells.map((cell, index) => MISSING_KEYS.has(key) && cell.trim() === '' ? null : numeric(cell, 'row ' + index));
      if (key === 'sortText') {
        value = [...numbers].sort();
        steps = ['Parse decimal cells as numbers, then compare their string forms using JavaScript default sort.', 'Result: ' + JSON.stringify(value)];
      } else if (key === 'sortNumber') {
        value = [...numbers].sort((a, b) => a - b);
        steps = ['Compare numeric values in ascending order.', 'Result: ' + JSON.stringify(value)];
      } else if (key === 'identityNumber') {
        value = [...new Set(numbers)];
        steps = ['Convert each decimal identifier to a number; leading zeros are lost.', 'Distinct numeric values: ' + JSON.stringify(value) + '. Equal converted values do not prove equal entities.'];
      } else {
        const selected = key === 'meanExcludeMissing' ? numbers.filter((number) => number !== null) : numbers.map((number) => number ?? 0);
        assert(selected.length > 0, 'A mean requires at least one observed value');
        const sum = finite(selected.reduce((total, number) => total + number, 0));
        value = finite(sum / selected.length);
        steps = [key === 'meanExcludeMissing' ? 'Exclude blank cells from both sum and count.' : 'Assume every blank cell represents zero; include it in the count.', '(' + selected.map(formatted).join(' + ') + ') / ' + selected.length + ' = ' + formatted(value)];
      }
    }
  }
  const display = Array.isArray(value) ? JSON.stringify(value) : formatted(value) + (RATE_KEYS.has(key) ? '%' : '');
  return {value, display, steps};
}

function sameResult(actual, expected) {
  if (Array.isArray(actual)) return Array.isArray(expected) && actual.length === expected.length && actual.every((item, index) => sameResult(item, expected[index]));
  if (typeof actual === 'number') {
    if (typeof expected !== 'number' || !Number.isFinite(expected)) return false;
    if (Number.isInteger(actual) && Number.isInteger(expected)) return actual === expected;
    return Math.abs(actual - expected) <= 1e-10 * Math.max(1, Math.abs(actual), Math.abs(expected));
  }
  return typeof actual === typeof expected && actual === expected;
}

function evidenceSignature(evidence) {
  return JSON.stringify([evidence.kind, evidence.columns, evidence.rows.map(({_key, label, cells}) => [_key, label, cells]), evidence.synthetic]);
}

/** Validate a fully expanded public query result, collecting descriptive errors. */
export function validateExhibit(exhibit) {
  const errors = [];
  const capture = (check) => { try { check(); } catch (error) { errors.push(error.message); } };
  capture(() => document(exhibit, 'exhibit', 'exhibit'));
  if (!object(exhibit)) return errors;
  capture(() => requireText(exhibit, ['title', 'category', 'claim', 'takeaway'], 'exhibit'));
  capture(() => assert(object(exhibit.slug) && text(exhibit.slug.current) && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(exhibit.slug.current), 'exhibit.slug.current must be a lowercase URL slug'));
  capture(() => assert(Number.isSafeInteger(exhibit.order) && exhibit.order >= 0, 'exhibit.order must be a nonnegative integer'));
  capture(() => assert(exhibit.reviewStatus === 'verified', 'exhibit.reviewStatus must be verified for public display'));
  capture(() => evidenceShape(exhibit.evidence));
  capture(() => {
    assert(Array.isArray(exhibit.sources) && exhibit.sources.length > 0, 'exhibit.sources must contain at least one source');
    const sourceKeys = new Set();
    for (const source of exhibit.sources) {
      assert(object(source), 'source must be an object');
      requireText(source, ['_key', 'title', 'url'], 'source');
      assert(!sourceKeys.has(source._key), 'source._key must be unique');
      sourceKeys.add(source._key);
      let url;
      try { url = new URL(source.url); } catch { throw new Error('source.url must be a valid HTTPS URL'); }
      assert(url.protocol === 'https:' && !url.username && !url.password, 'source.url must be HTTPS without credentials');
    }
  });
  if (!Array.isArray(exhibit.interpretations) || exhibit.interpretations.length < 2) {
    errors.push('exhibit.interpretations requires at least two expanded interpretations');
    return errors;
  }
  const ids = new Set();
  for (const [index, interpretation] of exhibit.interpretations.entries()) {
    capture(() => {
      const path = 'interpretations[' + index + ']';
      document(interpretation, 'interpretation', path);
      assert(!ids.has(interpretation._id), path + ' duplicates an interpretation');
      ids.add(interpretation._id);
      requireText(interpretation, ['label', 'assumption', 'expectedJson', 'explanation'], path);
      assert(['supported', 'unsupported', 'conditional'].includes(interpretation.verdict), path + '.verdict is invalid');
      evidenceShape(interpretation.evidence);
      assert(interpretation.evidence._id === exhibit.evidence?._id, path + ' evidence reference must match the exhibit evidence');
      evidenceShape(exhibit.evidence);
      assert(evidenceSignature(interpretation.evidence) === evidenceSignature(exhibit.evidence), path + ' evidence payload must match the exhibit evidence');
      let expected;
      try { expected = JSON.parse(interpretation.expectedJson); } catch { throw new Error(path + '.expectedJson must be valid JSON data'); }
      const actual = evaluate(exhibit.evidence, interpretation).value;
      assert(sameResult(actual, expected), path + '.expectedJson disagrees with the computed result');
    });
  }
  return errors;
}

/** Empty public datasets are valid. Return the caller's array without mutation. */
export function validateCollection(collection) {
  assert(Array.isArray(collection), 'Collection must be an array');
  const ids = new Set();
  const slugs = new Set();
  const errors = [];
  for (const [index, exhibit] of collection.entries()) {
    const prefix = 'Exhibit ' + index + (text(exhibit?._id) ? ' (' + exhibit._id + ')' : '') + ': ';
    errors.push(...validateExhibit(exhibit).map((error) => prefix + error));
    if (object(exhibit)) {
      if (ids.has(exhibit._id)) errors.push(prefix + 'duplicate exhibit _id');
      ids.add(exhibit._id);
      if (text(exhibit.slug?.current)) {
        if (slugs.has(exhibit.slug.current)) errors.push(prefix + 'duplicate exhibit slug');
        slugs.add(exhibit.slug.current);
      }
    }
  }
  assert(errors.length === 0, 'Invalid public collection:\n' + errors.join('\n'));
  return collection;
}

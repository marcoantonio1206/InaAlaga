import test from 'node:test';
import assert from 'node:assert/strict';
import { strings } from '../src/lib/translations.js';
import { visitCountdown } from '../src/lib/countdown.js';

test('every mother interface message has a Filipino translation without English fallback', () => {
  assert.deepEqual(Object.keys(strings.fil).sort(), Object.keys(strings.en).sort());
  for (const [key, english] of Object.entries(strings.en)) {
    if (!english) continue;
    assert.ok(strings.fil[key].trim(), `${key} must have Filipino copy`);
    assert.notEqual(strings.fil[key], english, `${key} must not fall back to English`);
  }
});

test('Filipino countdown localizes units and elapsed status without changing English output', () => {
  const now = '2026-10-19T00:00:00Z';
  const later = '2026-10-20T02:03:04Z';
  assert.equal(visitCountdown(later, now, 'fil').text, '1 araw 2 oras 03 min 04 seg');
  assert.equal(visitCountdown(later, now, 'en').text, '1d 2h 03m 04s');
  assert.equal(visitCountdown(now, later, 'fil').text, strings.fil.awaitingVisitUpdate);
  assert.equal(visitCountdown(now, later, 'fil').passed, true);
  assert.equal(visitCountdown('invalid', now, 'fil'), null);
});

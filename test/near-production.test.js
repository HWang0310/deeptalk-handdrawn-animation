import test from 'node:test';
import assert from 'node:assert/strict';
import { nearProductionBriefs, nearProductionScenes, reuseAnalysis } from '../fixtures/near-production.js';
import { validateBenchmarks } from '../src/schema.js';

test('reuses existing grammar for six sanitized near-production briefs', () => {
  assert.equal(nearProductionBriefs.length, 6);
  assert.equal(validateBenchmarks(nearProductionScenes).length, 6);
  assert.ok(reuseAnalysis.every((item) => item.result === 'REUSABLE' && item.grammarExtension === null));
});

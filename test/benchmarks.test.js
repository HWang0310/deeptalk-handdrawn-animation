import test from 'node:test';
import assert from 'node:assert/strict';

import { benchmarks } from '../fixtures/benchmarks.js';
import { validateBenchmarks } from '../src/schema.js';

test('defines seven distinct original benchmark scenes for V1 grammar coverage', () => {
  const expectedIds = [
    'core-object',
    'relationship',
    'causal-chain',
    'number-label',
    'process',
    'abstract-mechanism',
    'progressive-complexity',
  ];
  assert.deepEqual(benchmarks.map((scene) => scene.id), expectedIds);
  assert.equal(validateBenchmarks(benchmarks).length, 7);
  assert.ok(benchmarks.every((scene) => scene.elements.length >= 4));
});

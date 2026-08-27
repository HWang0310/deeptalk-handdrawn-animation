import test from 'node:test';
import assert from 'node:assert/strict';

import { benchmarks, v11Benchmarks } from '../fixtures/benchmarks.js';
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

test('derives V1.1 from the same benchmark content with seeded style and held endings', () => {
  assert.deepEqual(v11Benchmarks.map((scene) => scene.id), benchmarks.map((scene) => scene.id));
  for (const v11 of v11Benchmarks) {
    const baseline = benchmarks.find((scene) => scene.id === v11.id);
    assert.deepEqual(v11.elements.map(({ id, type, text, bounds }) => ({ id, type, text, bounds })), baseline.elements.map(({ id, type, text, bounds }) => ({ id, type, text, bounds })));
    assert.ok(v11.style.organic.seed.length > 0);
    assert.ok(v11.motion.finalHoldMs >= 600);
    assert.ok(v11.elements.every((element) => element.reveal.endMs <= v11.durationMs - v11.motion.finalHoldMs));
    assert.ok(new Set(v11.elements.map((element) => element.reveal.easing)).size > 1);
  }
  assert.deepEqual(v11Benchmarks.find((scene) => scene.id === 'core-object').composition.semanticOverlaps, [['lantern', 'glow']]);
});

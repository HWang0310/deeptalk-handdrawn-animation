import test from 'node:test';
import assert from 'node:assert/strict';

import { validateBenchmarks, validateScene } from '../src/schema.js';

const validScene = {
  id: 'valid',
  title: '有效场景',
  durationMs: 4000,
  canvas: { width: 1920, height: 1080 },
  elements: [
    {
      id: 'line',
      type: 'path',
      d: 'M 100 100 L 300 100',
      bounds: { x: 100, y: 90, width: 200, height: 20 },
      reveal: { startMs: 0, endMs: 1000 },
    },
  ],
};

test('rejects a scene outside the 3–10 second asset duration', () => {
  assert.throws(
    () => validateScene({ ...validScene, durationMs: 2000 }),
    /durationMs must be between 3000 and 10000/,
  );
});

test('rejects duplicate element identities that make a reveal ambiguous', () => {
  assert.throws(
    () => validateScene({
      ...validScene,
      elements: [...validScene.elements, { ...validScene.elements[0] }],
    }),
    /duplicate element id: line/,
  );
});

test('accepts all required independent benchmark identities', () => {
  const benchmarkIds = [
    'core-object',
    'relationship',
    'causal-chain',
    'number-label',
    'process',
    'abstract-mechanism',
    'progressive-complexity',
  ];

  assert.deepEqual(validateBenchmarks(benchmarkIds.map((id) => ({ ...validScene, id }))).map((scene) => scene.id), benchmarkIds);
});

test('rejects a semantic overlap annotation that names an unknown element', () => {
  assert.throws(
    () => validateScene({
      ...validScene,
      composition: { semanticOverlaps: [['line', 'missing']] },
    }),
    /semantic overlap references unknown element: missing/,
  );
});

test('rejects an invalid deterministic organic profile before rendering', () => {
  const scene = structuredClone(validScene);
  scene.style = { organic: { seed: '', wobble: -1, widthVariance: 2, duplicateSketch: 'yes' } };
  assert.throws(() => validateScene(scene), /organic seed/);
});

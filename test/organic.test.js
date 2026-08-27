import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveOrganic, seededValue, wobblePathData } from '../src/organic.js';

test('repeats the same bounded perturbation for the same seed and channel', () => {
  const first = seededValue('scene-a', 'line-1:width', -0.8, 0.8);
  const second = seededValue('scene-a', 'line-1:width', -0.8, 0.8);
  assert.equal(first, second);
  assert.ok(first >= -0.8 && first <= 0.8);
});

test('changes controlled path wobble when the seed changes', () => {
  const original = 'M 100 100 L 300 100 Q 400 120 500 200';
  assert.equal(wobblePathData(original, 'quiet', 0), original);
  assert.notEqual(wobblePathData(original, 'quiet', 1.2), wobblePathData(original, 'lively', 1.2));
  assert.equal(wobblePathData(original, 'quiet', 1.2), wobblePathData(original, 'quiet', 1.2));
});

test('inherits an explicit organic profile without applying one to baseline scenes', () => {
  assert.equal(resolveOrganic({ id: 'baseline' }, { id: 'line' }), null);
  assert.deepEqual(resolveOrganic({ id: 'styled', style: { organic: { seed: 'same', wobble: 1.1, widthVariance: 0.12, duplicateSketch: true } } }, { id: 'line' }), {
    seed: 'same', wobble: 1.1, widthVariance: 0.12, duplicateSketch: true,
  });
});

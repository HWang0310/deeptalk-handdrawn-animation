import test from 'node:test';
import assert from 'node:assert/strict';

import { benchmarks } from '../fixtures/benchmarks.js';
import { runQa } from '../src/qa.js';

test('flags an element that risks clipping beyond the protected canvas area', () => {
  const scene = structuredClone(benchmarks[0]);
  scene.elements[1].bounds.x = -12;
  const result = runQa(scene);
  assert.equal(result.passed, false);
  assert.ok(result.findings.some((finding) => finding.code === 'bounds-overflow'));
});

test('flags an element whose reveal order goes backwards', () => {
  const scene = structuredClone(benchmarks[0]);
  scene.elements[1].reveal = { startMs: 1200, endMs: 900 };
  const result = runQa(scene);
  assert.ok(result.findings.some((finding) => finding.code === 'reveal-order'));
});

test('accepts the benchmark core object scene as mechanically renderable', () => {
  const result = runQa(benchmarks[0]);
  assert.equal(result.passed, true);
  assert.equal(result.checks.finalFrameVisible, true);
  assert.equal(result.checks.chineseLabelsPresent, true);
});

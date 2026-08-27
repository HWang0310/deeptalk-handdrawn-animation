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

const compositionScene = {
  id: 'composition', title: '构图测试', durationMs: 4000, canvas: { width: 1920, height: 1080 }, motion: { finalHoldMs: 700 },
  composition: { focusArea: { x: 300, y: 250, width: 1000, height: 500 }, semanticOverlaps: [] },
  elements: [
    { id: 'title', type: 'label', text: '中文标题', bounds: { x: 100, y: 100, width: 200, height: 50 }, reveal: { startMs: 0, endMs: 300 } },
    { id: 'a', type: 'box', bounds: { x: 500, y: 400, width: 260, height: 180 }, reveal: { startMs: 300, endMs: 900 } },
    { id: 'b', type: 'circle', bounds: { x: 650, y: 470, width: 180, height: 180 }, reveal: { startMs: 700, endMs: 1300 } },
  ],
};

test('warns about an unannotated object collision without failing a valid scene', () => {
  const result = runQa(compositionScene);
  assert.equal(result.passed, true);
  assert.ok(result.warnings.some((warning) => warning.code === 'collision-candidate'));
});

test('suppresses a collision candidate explicitly annotated as semantic overlap', () => {
  const scene = structuredClone(compositionScene);
  scene.composition.semanticOverlaps = [['a', 'b']];
  const result = runQa(scene);
  assert.ok(!result.warnings.some((warning) => warning.code === 'collision-candidate'));
});

test('warns when text crowding, a missed focus area, or short final hold threatens readability', () => {
  const scene = structuredClone(compositionScene);
  scene.elements[1].bounds = { x: 295, y: 100, width: 260, height: 180 };
  scene.composition.focusArea = { x: 900, y: 700, width: 300, height: 200 };
  scene.motion.finalHoldMs = 250;
  const codes = runQa(scene).warnings.map((warning) => warning.code);
  assert.ok(codes.includes('text-spacing'));
  assert.ok(codes.includes('focus-miss'));
  assert.ok(codes.includes('final-hold'));
});

test('warns when declared group reading order contradicts reveal order', () => {
  const scene = structuredClone(compositionScene);
  scene.groups = [{ id: 'first', layer: 'middle', role: 'support' }, { id: 'last', layer: 'foreground', role: 'focal' }];
  scene.composition.readingOrder = ['first', 'last'];
  scene.elements[0].groupId = 'first'; scene.elements[1].groupId = 'last';
  scene.elements[0].reveal.startMs = 900; scene.elements[1].reveal.startMs = 0;
  assert.ok(runQa(scene).warnings.some((warning) => warning.code === 'visual-path'));
});

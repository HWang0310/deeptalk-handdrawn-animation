import test from 'node:test';
import assert from 'node:assert/strict';

import { compileSvg, revealProgress } from '../src/svg.js';

const scene = {
  id: 'svg-test', title: '测试', durationMs: 4000, canvas: { width: 1920, height: 1080 },
  elements: [
    { id: 'line', type: 'path', d: 'M 100 100 L 300 100', fill: '#f1c453', bounds: { x: 100, y: 90, width: 200, height: 20 }, reveal: { startMs: 1000, endMs: 2000 } },
    { id: 'cn', type: 'label', text: '资料 & <数据>', x: 100, y: 300, fontSize: 44, bounds: { x: 100, y: 256, width: 350, height: 56 }, reveal: { startMs: 0, endMs: 500 } },
  ],
};

test('keeps a future element entirely hidden before its reveal starts', () => {
  assert.deepEqual(revealProgress(scene.elements[0], 500), { stroke: 0, fill: 0 });
});

test('exposes a partial stroke before permitting the fill phase', () => {
  assert.deepEqual(revealProgress(scene.elements[0], 1500), { stroke: 0.5, fill: 0 });
});

test('compiles escaped Chinese labels and a visible final fill state', () => {
  const svg = compileSvg(scene, 4000);
  assert.match(svg, /资料 &amp; &lt;数据&gt;/);
  assert.match(svg, /id="line"/);
  assert.match(svg, /fill-opacity="1"/);
});

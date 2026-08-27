import test from 'node:test';
import assert from 'node:assert/strict';

import { compileSvg, revealProgress } from '../src/svg.js';

const scene = {
  id: 'svg-test', title: '测试', durationMs: 4000, canvas: { width: 1920, height: 1080 },
  elements: [
    { id: 'line', type: 'path', d: 'M 100 100 L 300 100', fill: '#f1c453', bounds: { x: 100, y: 90, width: 200, height: 20 }, reveal: { startMs: 1000, endMs: 2000 } },
    { id: 'cn', type: 'label', text: '资料 & <数据>', x: 100, y: 300, fontSize: 44, bounds: { x: 100, y: 256, width: 350, height: 56 }, reveal: { startMs: 0, endMs: 500 } },
    { id: 'arrow', type: 'arrow', x1: 200, y1: 500, x2: 500, y2: 500, bounds: { x: 200, y: 470, width: 300, height: 60 }, reveal: { startMs: 2000, endMs: 3000 } },
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

test('withholds arrowheads until their stroke reaches the destination', () => {
  assert.doesNotMatch(compileSvg(scene, 1000), /id="arrow"[^>]*>.*marker-end/);
  assert.match(compileSvg(scene, 3000), /marker-end="url\(#arrowhead\)"/);
});

test('honors a scene-specified translucent fill without weakening the drawn outline', () => {
  const translucent = structuredClone(scene);
  translucent.elements[0].fillOpacity = 0.18;
  assert.match(compileSvg(translucent, 4000), /fill-opacity="0\.18"/);
});

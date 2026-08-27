import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { renderScene } from '../src/render.js';

const scene = {
  id: 'render-test', title: '渲染测试', durationMs: 3000, canvas: { width: 1920, height: 1080 },
  elements: [
    { id: 'box', type: 'box', x: 700, y: 400, width: 400, height: 240, fill: '#fff2d8', bounds: { x: 700, y: 400, width: 400, height: 240 }, reveal: { startMs: 0, endMs: 800 } },
    { id: 'text', type: 'label', text: '本地渲染', x: 800, y: 540, fontSize: 48, bounds: { x: 800, y: 490, width: 220, height: 60 }, reveal: { startMs: 900, endMs: 1400 } },
  ],
};

test('rasterizes deterministic SVG frame states to local PNG evidence', async () => {
  const outputDir = await mkdtemp(join(tmpdir(), 'handdrawn-render-'));
  const result = await renderScene(scene, { outputDir, fps: 2, encode: false });
  assert.equal(result.frames.length, 6);
  assert.ok((await stat(result.frames[0])).size > 1000);
  assert.ok((await stat(result.finalFrame)).size > 1000);
});

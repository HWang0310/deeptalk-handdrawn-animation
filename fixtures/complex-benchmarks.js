import { createCompositionPattern } from '../src/composition.js';

const definitions = [
  ['cause-mechanism-outcome', 'actor-action-consequence', '原因如何穿过机制，变成结果'],
  ['multi-actor-relation', 'multi-actor-relation', '多方关系不是单向传递'],
  ['accumulation-pressure', 'accumulation-pressure', '累积如何挤压系统'],
  ['before-after-transition', 'before-after-transition', '改变前后，路径不同'],
];

export const complexBenchmarks = definitions.map(([id, pattern, title]) => {
  const fragment = createCompositionPattern(pattern, { id });
  return {
    id, title, durationMs: 8000, canvas: { width: 1920, height: 1080 }, background: '#fffaf0',
    style: { organic: { seed: `v12:${id}`, wobble: 1.8, widthVariance: 0.16, duplicateSketch: true } },
    motion: { finalHoldMs: 800 }, groups: fragment.groups, composition: { focusArea: fragment.focusArea, semanticOverlaps: fragment.semanticOverlaps, focalGroup: fragment.focalGroup, readingOrder: fragment.readingOrder },
    elements: [{ id: `${id}-title`, type: 'label', text: title, x: 520, y: 150, fontSize: 48, color: '#263238', groupId: 'context', bounds: { x: 520, y: 95, width: 900, height: 64 }, reveal: { startMs: 0, endMs: 450, easing: 'easeOut' } }, ...fragment.elements],
  };
});

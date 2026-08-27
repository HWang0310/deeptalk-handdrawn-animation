import { createPrimitive } from './primitives.js';

export const compositionPatternNames = ['actor-action-consequence', 'multi-actor-relation', 'accumulation-pressure', 'before-after-transition'];
const palette = { ink: '#263238', coral: '#ed6a5a' };
const group = (id, layer, role) => ({ id, layer, role });
const label = (id, text, x, y, groupId, startMs) => ({ id, type: 'label', text, x, y, fontSize: 34, color: palette.ink, groupId, bounds: { x, y: y - 42, width: text.length * 38, height: 48 }, reveal: { startMs, endMs: startMs + 420, easing: 'easeOut' } });
const arrow = (id, x1, y1, x2, y2, groupId, startMs) => ({ id, type: 'arrow', x1, y1, x2, y2, stroke: palette.coral, groupId, bounds: { x: Math.min(x1, x2), y: Math.min(y1, y2) - 20, width: Math.abs(x2 - x1), height: Math.abs(y2 - y1) + 40 }, reveal: { startMs, endMs: startMs + 520, easing: 'easeInOut' } });
const withGroup = (items, groupId) => items.map((item) => ({ ...item, groupId }));

export function createCompositionPattern(name, { id = name } = {}) {
  if (!compositionPatternNames.includes(name)) throw new Error(`unknown composition pattern: ${name}`);
  const groups = [group('context', 'background', 'context'), group('action', 'middle', 'support'), group('outcome', 'foreground', 'focal')];
  let elements;
  if (name === 'actor-action-consequence') elements = [
    ...withGroup(createPrimitive('role-person', { id: `${id}-actor`, x: 270, y: 410, startMs: 0 }), 'context'), label(`${id}-actor-label`, '决策者', 265, 650, 'context', 400),
    ...withGroup(createPrimitive('document', { id: `${id}-doc`, x: 800, y: 390, startMs: 1100 }), 'action'), arrow(`${id}-flow`, 520, 510, 790, 510, 'action', 850), label(`${id}-action-label`, '执行动作', 760, 650, 'action', 1450),
    ...withGroup(createPrimitive('simple-chart', { id: `${id}-chart`, x: 1320, y: 390, startMs: 2300 }), 'outcome'), arrow(`${id}-result`, 1030, 510, 1310, 510, 'outcome', 2050), label(`${id}-outcome-label`, '结果变化', 1310, 650, 'outcome', 2700),
  ];
  else if (name === 'multi-actor-relation') elements = [
    ...withGroup(createPrimitive('role-person', { id: `${id}-left`, x: 260, y: 400, startMs: 0 }), 'context'), label(`${id}-left-label`, '用户', 285, 650, 'context', 350),
    ...withGroup(createPrimitive('building', { id: `${id}-center`, x: 845, y: 385, startMs: 1200 }), 'action'), label(`${id}-center-label`, '机构', 875, 650, 'action', 1550),
    ...withGroup(createPrimitive('role-person', { id: `${id}-right`, x: 1430, y: 400, startMs: 2300 }), 'outcome'), label(`${id}-right-label`, '合作方', 1435, 650, 'outcome', 2650),
    arrow(`${id}-left-flow`, 500, 510, 830, 510, 'action', 800), arrow(`${id}-right-flow`, 1100, 510, 1420, 510, 'outcome', 1950),
  ];
  else if (name === 'accumulation-pressure') elements = [
    ...withGroup(createPrimitive('resource-stack', { id: `${id}-stack`, x: 260, y: 420, startMs: 0 }), 'context'), label(`${id}-stack-label`, '资源累积', 270, 650, 'context', 450),
    ...withGroup(createPrimitive('factory', { id: `${id}-bottleneck`, x: 855, y: 405, startMs: 1250 }), 'action'), label(`${id}-bottleneck-label`, '瓶颈', 875, 650, 'action', 1650),
    ...withGroup(createPrimitive('emotion-mark', { id: `${id}-pressure`, x: 1435, y: 405, startMs: 2450 }), 'outcome'), label(`${id}-pressure-label`, '压力上升', 1410, 650, 'outcome', 2850),
    arrow(`${id}-in`, 500, 510, 835, 510, 'action', 850), arrow(`${id}-out`, 1080, 510, 1420, 510, 'outcome', 2050),
  ];
  else elements = [
    ...withGroup(createPrimitive('document', { id: `${id}-before`, x: 270, y: 395, startMs: 0 }), 'context'), label(`${id}-before-label`, '调整前', 285, 650, 'context', 450),
    ...withGroup(createPrimitive('arrow-family', { id: `${id}-change`, x: 875, y: 425, startMs: 1150 }), 'action'), label(`${id}-change-label`, '关键改变', 825, 650, 'action', 1600),
    ...withGroup(createPrimitive('screen', { id: `${id}-after`, x: 1400, y: 410, startMs: 2300 }), 'outcome'), label(`${id}-after-label`, '调整后', 1425, 650, 'outcome', 2750),
    arrow(`${id}-transition`, 540, 510, 850, 510, 'action', 800), arrow(`${id}-result`, 1100, 510, 1380, 510, 'outcome', 2000),
  ];
  return { groups, elements, focalGroup: 'outcome', readingOrder: ['context', 'action', 'outcome'], focusArea: { x: 1180, y: 300, width: 600, height: 430 }, semanticOverlaps: [] };
}

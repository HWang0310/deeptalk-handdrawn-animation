import { createCompositionPattern } from '../src/composition.js';

export const nearProductionBriefs = [
  { id: 'commercial-transmission', grammar: 'actor-action-consequence', brief: '一个商业机制如何从决策、执行层层传导到可见结果', title: '决策变化如何层层传导到业务结果' },
  { id: 'interest-tension', grammar: 'multi-actor-relation', brief: '两个主体围绕资源分配形成持续利益冲突', title: '双方目标不同，协作为何变得紧张' },
  { id: 'expansion-pressure', grammar: 'accumulation-pressure', brief: '系统扩张时资源与流程不断积累压力', title: '规模扩张后，压力为何集中在瓶颈' },
  { id: 'surface-mechanism', grammar: 'actor-action-consequence', brief: '表面结果改善，但底层机制并未同步改变', title: '表面结果变化，不等于机制已经改善' },
  { id: 'rule-transition', grammar: 'before-after-transition', brief: '规则变化前后，信息与执行路径发生改变', title: '规则改变后，执行路径如何重新分配' },
  { id: 'coordination-constraint', grammar: 'multi-actor-relation', brief: '多主体协作中，机构成为协调与约束节点', title: '多主体协作，需要谁来协调与制约' },
];

export const reuseAnalysis = nearProductionBriefs.map((brief) => ({
  briefId: brief.id, grammar: brief.grammar, grammarExtension: null, result: 'REUSABLE',
  primitiveFamilies: ['people/roles', 'institution', 'document/information', 'resource/metric', 'arrow/emphasis'],
  missingPrimitives: [], sceneComplexity: '3 groups, 5–8 visual elements, staged narrative reveal', finalReadability: 'reviewed after local render',
}));

export const nearProductionScenes = nearProductionBriefs.map((brief) => {
  const fragment = createCompositionPattern(brief.grammar, { id: brief.id });
  return {
    id: brief.id, title: brief.title, durationMs: 9000, canvas: { width: 1920, height: 1080 }, background: '#fffaf0',
    style: { organic: { seed: `v13:${brief.id}`, wobble: 1.8, widthVariance: 0.16, duplicateSketch: true } }, motion: { finalHoldMs: 900 },
    groups: fragment.groups, composition: { focusArea: fragment.focusArea, semanticOverlaps: fragment.semanticOverlaps, focalGroup: fragment.focalGroup, readingOrder: fragment.readingOrder },
    elements: [{ id: `${brief.id}-title`, type: 'label', text: brief.title, x: 330, y: 145, fontSize: 44, color: '#263238', groupId: 'context', bounds: { x: 330, y: 90, width: 1250, height: 62 }, reveal: { startMs: 0, endMs: 500, easing: 'easeOut' } }, ...fragment.elements],
  };
});

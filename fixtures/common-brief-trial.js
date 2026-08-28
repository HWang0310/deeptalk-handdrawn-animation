import { createCompositionPattern } from '../src/composition.js';
import { benchmarks } from './benchmarks.js';

export const commonBriefAssessment = [
  ['CB01', 'ABSTAIN', null, '核心判断更接近 headline；强行加对象会削弱判断。'],
  ['CB02', 'SUITABLE', 'actor-action-consequence', '因果传导与逐步 reveal 天然匹配。'],
  ['CB03', 'SUITABLE', 'accumulation-pressure', '积累、压力、阈值适合 staged explanatory scene。'],
  ['CB04', 'SUITABLE', 'abstract-mechanism', '现有 feedback loop scene 可复用。'],
  ['CB05', 'SUITABLE', 'multi-actor-relation', '双方拉扯与资源关系清晰。'],
  ['CB06', 'BORDERLINE', 'actor-action-consequence', '隐藏机制缺少自然视觉隐喻，仅做有限结构实验。'],
  ['CB07', 'SUITABLE', 'before-after-transition', '规则变化前后路径适合显式顺序。'],
  ['CB08', 'SUITABLE', 'number-label + actor-action-consequence', '数字与机制可分阶段表达，但不是纯数字展示强项。'],
].map(([id, suitability, grammar, reason]) => ({ id, suitability, grammar, reason }));

const scene = (id, title, grammar) => { const f = createCompositionPattern(grammar, { id }); return { id, title, durationMs: 9000, canvas: { width: 1920, height: 1080 }, style: { organic: { seed: `common:${id}`, wobble: 1.8, widthVariance: .16, duplicateSketch: true } }, motion: { finalHoldMs: 900 }, groups: f.groups, composition: { focusArea: f.focusArea, semanticOverlaps: f.semanticOverlaps, focalGroup: f.focalGroup, readingOrder: f.readingOrder }, elements: [{ id: `${id}-title`, type: 'label', text: title, x: 320, y: 145, fontSize: 42, color: '#263238', groupId: 'context', bounds: { x: 320, y: 90, width: 1280, height: 62 }, reveal: { startMs: 0, endMs: 500 } }, ...f.elements] }; };
export const commonBriefCandidates = [
  scene('cb02-causal-transmission', '成本上升如何传导到体验', 'actor-action-consequence'),
  scene('cb03-accumulation-pressure', '扩张如何把压力集中到阈值', 'accumulation-pressure'),
  { ...structuredClone(benchmarks.find((item) => item.id === 'abstract-mechanism')), id: 'cb04-feedback-loop', title: '体验、用户与数据的正反馈', durationMs: 7000 },
  scene('cb05-two-side-tension', '增长与风险的持续拉扯', 'multi-actor-relation'),
  scene('cb06-surface-mechanism', '表面稳定，不等于风险消失', 'actor-action-consequence'),
  scene('cb07-rule-change', '规则改变后路径为何不同', 'before-after-transition'),
  { ...structuredClone(benchmarks.find((item) => item.id === 'number-label')), id: 'cb08-numeric-evidence', title: '42% 到 58%，机制比数字重要' },
];

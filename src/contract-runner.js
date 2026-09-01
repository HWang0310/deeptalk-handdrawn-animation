// Contract V1 runner entry point for the hand-drawn animation plugin.
//
// Implements the Core `visual-asset-plugin-contract/1` boundary as a standalone
// process. It is intentionally separate from src/cli.js (the named-fixture
// research CLI) and reuses the existing render/QA/schema/composition modules
// unchanged.
//
// Supported arguments:
//   node src/contract-runner.js --version
//   node src/contract-runner.js --request <path> --result <path> --output-dir <path>
//
// Exit contract: the process writes exactly one JSON result to --result and
// exits 0 only when that result is a valid Contract V1 response. Any malformed
// request or runner infrastructure failure fails closed (non-zero exit, no
// fake plugin result).

import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { access, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createCompositionPattern } from './composition.js';
import { runQa } from './qa.js';
import { renderScene } from './render.js';
import { validateScene } from './schema.js';

export const PLUGIN_ID = 'org.deeptalk.handdrawn-animation';
export const PLUGIN_VERSION = 'handdrawn-animation-contract/0.1.0';
export const CONTRACT_VERSION = 'visual-asset-plugin-contract/1';
const COMPILER_SEMANTICS_TAG = 'handdrawn-svg/v1';
const RENDER_ENGINE_TAG = 'resvg+ffmpeg-h264';
const FFMPEG_FLAGS_TAG = 'libx264-yuv420p-faststart-fps12-crf23-preset-medium';
const ASSET_FAMILY = 'HANDDRAWN_SVG';
const URI_SCHEME = 'local-runner://';
const FPS = 12;
const MAX_TITLE_LENGTH = 40;

// Minimum scene duration (ms) each composition grammar needs for its last
// element reveal to complete within the scene (readiness §4 note; verified
// against primitives reveal timings: max endMs is 3270 for accumulation).
const GRAMMAR_NEED_MIN_MS = {
  'actor-action-consequence': 3200,
  'multi-actor-relation': 3100,
  'accumulation-pressure': 3300,
  'before-after-transition': 3200,
};

// Keyword rules map opportunity semantics to one of the four composition
// grammars. Higher hit count wins; ties keep first match order. No match
// means ABSTAIN (conservative, readiness §4).
const GRAMMAR_RULES = [
  { grammar: 'accumulation-pressure', signals: ['积累', '累积', '压力', '瓶颈', '阈值', '堆积', '涌'] },
  { grammar: 'multi-actor-relation', signals: ['双方', '两方', '机构', '合作', '协调', '关系', '拉扯', '博弈', '协同', '用户'] },
  { grammar: 'before-after-transition', signals: ['前后', '变化前', '变化后', '调整前', '调整后', '规则变化', '切换', '转变', '过渡', '升级', '新规'] },
  { grammar: 'actor-action-consequence', signals: ['因果', '导致', '引发', '传导', '机制', '后果', '影响', '结果', '作用', '推动'] },
];

// ---------------------------------------------------------------------------
// Deterministic identifiers (readiness §7)
// ---------------------------------------------------------------------------

function sha256Hex(...parts) {
  return createHash('sha256').update(parts.join('')).digest('hex');
}

export function computeProposalId(opportunity) {
  const payload = [
    opportunity.opportunity_id,
    opportunity.spoken_semantics,
    opportunity.visual_purpose,
    String(opportunity.target_duration_ms),
    String(opportunity.canvas?.width),
    String(opportunity.canvas?.height),
    opportunity.language,
    PLUGIN_ID,
    PLUGIN_VERSION,
    CONTRACT_VERSION,
    COMPILER_SEMANTICS_TAG,
  ];
  return `prop_${sha256Hex(...payload).slice(0, 24)}`;
}

export function computeCandidateId({ proposalId, scene, fps }) {
  const payload = [
    proposalId,
    scene.id,
    String(scene.durationMs),
    String(scene.canvas.width),
    String(scene.canvas.height),
    String(fps),
    scene.style?.organic?.seed ?? '',
    scene.composition?.focalGroup ?? '',
    PLUGIN_VERSION,
    RENDER_ENGINE_TAG,
    FFMPEG_FLAGS_TAG,
  ];
  return `cand_${sha256Hex(...payload).slice(0, 24)}`;
}

// ---------------------------------------------------------------------------
// Runtime capability detection (fail closed, never fake ABSTAIN)
// ---------------------------------------------------------------------------

async function hasFfmpeg() {
  const { spawn } = await import('node:child_process');
  return new Promise((resolvePromise) => {
    const child = spawn('ffmpeg', ['-version'], { stdio: ['ignore', 'ignore', 'pipe'] });
    child.on('error', () => resolvePromise(false));
    child.on('close', (code) => resolvePromise(code === 0));
  });
}

async function hasCjkFonts() {
  const { spawn } = await import('node:child_process');
  const names = ['PingFang SC', 'PingFang HK', 'Noto Sans CJK SC', 'Microsoft YaHei', 'Hiragino Sans GB', 'STHeiti'];
  return new Promise((resolvePromise) => {
    const child = spawn('fc-list', [':family'], { stdio: ['ignore', 'pipe', 'ignore'] });
    let out = '';
    child.stdout.on('data', (chunk) => { out += chunk; });
    child.on('error', () => resolvePromise(false));
    child.on('close', (code) => {
      if (code !== 0) { resolvePromise(false); return; }
      resolvePromise(names.some((name) => out.includes(name)));
    });
  });
}

async function hasResvg() {
  try {
    const { Resvg } = await import('@resvg/resvg-js');
    return typeof Resvg === 'function';
  } catch {
    return false;
  }
}

export async function checkRuntimeCapabilities() {
  const ffmpeg = await hasFfmpeg();
  const cjk = await hasCjkFonts();
  const resvg = await hasResvg();
  return { ffmpeg, cjk, resvg };
}

// ---------------------------------------------------------------------------
// Opportunity → scene mapping (deterministic, no fixture lookup)
// ---------------------------------------------------------------------------

export function selectGrammar(opportunity) {
  const haystack = `${opportunity.spoken_semantics} ${opportunity.visual_purpose} ${opportunity.semantic_context ?? ''}`;
  let selected = null;
  let priority = -1;
  for (const rule of GRAMMAR_RULES) {
    const hits = rule.signals.filter((signal) => haystack.includes(signal)).length;
    if (hits > 0 && hits > priority) {
      selected = rule.grammar;
      priority = hits;
    }
  }
  return selected;
}

export function buildScene(opportunity, grammar) {
  const fragment = createCompositionPattern(grammar, { id: opportunity.opportunity_id });
  const titleText = opportunity.spoken_semantics.trim().slice(0, MAX_TITLE_LENGTH);
  const scene = {
    id: opportunity.opportunity_id,
    title: titleText,
    durationMs: opportunity.target_duration_ms,
    canvas: { width: opportunity.canvas.width, height: opportunity.canvas.height },
    style: { organic: { seed: `contract:${opportunity.opportunity_id}`, wobble: 1.8, widthVariance: 0.16, duplicateSketch: true } },
    motion: { finalHoldMs: 900 },
    groups: fragment.groups,
    composition: {
      focusArea: fragment.focusArea,
      semanticOverlaps: fragment.semanticOverlaps,
      focalGroup: fragment.focalGroup,
      readingOrder: fragment.readingOrder,
    },
    elements: [
      { id: `${opportunity.opportunity_id}-title`, type: 'label', text: titleText, x: 30, y: 90, fontSize: 42, color: '#263238', bounds: { x: 30, y: 44, width: 760, height: 56 }, reveal: { startMs: 0, endMs: 420, easing: 'easeOut' } },
      ...fragment.elements,
    ],
  };
  validateScene(scene);
  return scene;
}

// ---------------------------------------------------------------------------
// Suitability assessment
// ---------------------------------------------------------------------------

export function assessSuitability(opportunity) {
  if (!opportunity || typeof opportunity !== 'object') return { status: 'FAILED', code: 'invalid-opportunity', message: 'opportunity 必须是 JSON 对象', retryable: true };
  const required = ['opportunity_id', 'spoken_semantics', 'visual_purpose', 'a_roll_window', 'target_duration_ms', 'language', 'canvas'];
  for (const field of required) {
    if (opportunity[field] === undefined) return { status: 'FAILED', code: 'invalid-opportunity', message: `opportunity 缺少必填字段 ${field}`, retryable: true };
  }
  if (typeof opportunity.spoken_semantics !== 'string' || !opportunity.spoken_semantics.trim()) return { status: 'FAILED', code: 'invalid-opportunity', message: 'opportunity.spoken_semantics 必须是非空文本', retryable: true };
  if (typeof opportunity.visual_purpose !== 'string' || !opportunity.visual_purpose.trim()) return { status: 'FAILED', code: 'invalid-opportunity', message: 'opportunity.visual_purpose 必须是非空文本', retryable: true };
  if (!Number.isInteger(opportunity.target_duration_ms) || opportunity.target_duration_ms <= 0) return { status: 'FAILED', code: 'invalid-opportunity', message: 'opportunity.target_duration_ms 必须是正整数', retryable: true };
  const canvas = opportunity.canvas;
  if (!canvas || typeof canvas !== 'object') return { status: 'FAILED', code: 'invalid-opportunity', message: 'opportunity.canvas 缺失', retryable: true };
  const window = opportunity.a_roll_window;
  if (!window || typeof window !== 'object' || !Number.isInteger(window.start_ms) || !Number.isInteger(window.end_ms) || window.start_ms < 0 || window.end_ms <= window.start_ms) return { status: 'FAILED', code: 'invalid-opportunity', message: 'opportunity.a_roll_window 必须满足 start_ms < end_ms', retryable: true };

  // Hard geometry/duration gates (ABSTAIN, not clamp).
  if (canvas.width !== 1920 || canvas.height !== 1080) return { status: 'ABSTAIN', code: 'unsupported-canvas', message: '仅支持 1920x1080 画布' };
  if (opportunity.target_duration_ms < 3000 || opportunity.target_duration_ms > 10000) return { status: 'ABSTAIN', code: 'duration-out-of-range', message: 'target_duration_ms 必须在 3000-10000 之间' };

  const grammar = selectGrammar(opportunity);
  if (!grammar) return { status: 'ABSTAIN', code: 'no-matching-grammar', message: '未找到匹配的组合语法' };
  if (opportunity.target_duration_ms < GRAMMAR_NEED_MIN_MS[grammar]) return { status: 'ABSTAIN', code: 'duration-too-short-for-grammar', message: `${grammar} 需要至少 ${GRAMMAR_NEED_MIN_MS[grammar]}ms` };

  const haystack = `${opportunity.spoken_semantics} ${opportunity.visual_purpose} ${opportunity.semantic_context ?? ''}`;
  const hidden = /隐藏|内部|无形|情绪|感受|暗涌|未显露/.test(haystack);
  const numeric = /数字|数值|金额|百分比|数据展示|指标/.test(haystack);
  const cjkLang = opportunity.language === 'zh-CN' || opportunity.language.startsWith('zh');

  if (hidden) return { status: 'BORDERLINE', code: 'hidden-mechanism', message: '机会包含隐藏机制，缺少自然视觉隐喻，仅做有限结构实验' };
  if (numeric && opportunity.target_duration_ms < 4500) return { status: 'BORDERLINE', code: 'numeric-mechanism', message: '数字与机制混合表达，非纯数字展示强项' };
  if (!cjkLang) return { status: 'ABSTAIN', code: 'unsupported-language', message: '当前字体栈仅面向中文，language 需为 zh-CN' };
  return { status: 'SUITABLE', code: null, message: '因果/机制类机会可映射到确定性语法' };
}

// ---------------------------------------------------------------------------
// Result envelope construction
// ---------------------------------------------------------------------------

function sha256File(filePath) {
  return new Promise((resolvePromise, reject) => {
    const hash = createHash('sha256');
    const stream = createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolvePromise(hash.digest('hex')));
    stream.on('error', reject);
  });
}

function buildManifest(scene, frameCount) {
  return {
    manifest_version: 'handdrawn-asset-manifest/1',
    scene_id: scene.id,
    scene_title: scene.title,
    duration_ms: scene.durationMs,
    fps: FPS,
    frame_count: frameCount,
    canvas: { width: scene.canvas.width, height: scene.canvas.height },
    organic_profile: {
      seed: scene.style?.organic?.seed ?? null,
      wobble: scene.style?.organic?.wobble ?? null,
      widthVariance: scene.style?.organic?.widthVariance ?? null,
      duplicateSketch: scene.style?.organic?.duplicateSketch ?? null,
    },
    render_version: PLUGIN_VERSION,
  };
}

async function writeResultAtomic(resultPath, result) {
  await mkdir(dirname(resultPath), { recursive: true });
  const tmpPath = `${resultPath}.tmp`;
  await writeFile(tmpPath, `${JSON.stringify(result, null, 2)}\n`, 'utf-8');
  await rename(tmpPath, resultPath);
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--request') args.request = argv[++index];
    else if (arg === '--result') args.result = argv[++index];
    else if (arg === '--output-dir') args.outputDir = argv[++index];
  }
  return args;
}

async function readRequest(requestPath) {
  const raw = await readFile(requestPath, 'utf-8');
  const data = JSON.parse(raw);
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('request JSON 必须是对象');
  return data;
}

// Suitability response: SUITABLE/BORDERLINE/ABSTAIN carry proposal_id;
// FAILED/UNAVAILABLE carry problem and no proposal_id.
export async function runSuitability(opportunity, requestId) {
  const assessment = assessSuitability(opportunity);
  const base = {
    contract_version: CONTRACT_VERSION,
    request_id: requestId,
    opportunity_id: opportunity?.opportunity_id ?? '',
    plugin_id: PLUGIN_ID,
    plugin_version: PLUGIN_VERSION,
  };
  if (assessment.status === 'FAILED') {
    return { ...base, operation_status: 'FAILED', problem: { code: assessment.code, message: assessment.message, retryability: assessment.retryable } };
  }
  if (assessment.status === 'UNAVAILABLE') {
    return { ...base, operation_status: 'UNAVAILABLE', problem: { code: assessment.code, message: assessment.message, retryability: false } };
  }
  return {
    ...base,
    operation_status: 'COMPLETED',
    proposal_id: computeProposalId(opportunity),
    suitability: assessment.status,
    reason: assessment.message,
  };
}

// Generation result: COMPLETED carries exactly one candidate; FAILED /
// BLOCKED / UNAVAILABLE carry problem and no candidate. Candidate READY
// requires PRIMARY_MEDIA + QA PASSED + non-empty provenance; QA_REJECTED
// requires QA FAILED. Never fabricate a candidate for failure statuses.
export async function runGeneration(opportunity, proposalId, outputDir) {
  const assessment = assessSuitability(opportunity);
  const base = {
    contract_version: CONTRACT_VERSION,
    request_id: '',
    opportunity_id: opportunity.opportunity_id,
    proposal_id: proposalId,
    plugin_id: PLUGIN_ID,
    plugin_version: PLUGIN_VERSION,
  };
  if (assessment.status !== 'SUITABLE' && assessment.status !== 'BORDERLINE') {
    return { ...base, operation_status: 'FAILED', problem: { code: assessment.code ?? 'not-generatable', message: assessment.message, retryability: true } };
  }
  const grammar = selectGrammar(opportunity);
  let scene;
  try {
    if (process.env.HANDDRAWN_FORCE_SCENE_BLOCK === '1') throw new Error('forced scene build failure for tests');
    scene = buildScene(opportunity, grammar);
  } catch (error) {
    return { ...base, operation_status: 'BLOCKED', problem: { code: 'scene-build-failed', message: `无法构建场景：${error.message}`, retryability: false } };
  }

  await mkdir(outputDir, { recursive: true });
  const render = await renderScene(scene, { outputDir, fps: FPS, encode: true });
  const mp4Path = render.mp4;
  const mediaSha = await sha256File(mp4Path);

  // Test hook: force a QA failure to exercise the QA_REJECTED envelope shape.
  if (process.env.HANDDRAWN_FORCE_QA_FAIL === '1') {
    scene.elements[0].bounds = { x: -500, y: -500, width: 100, height: 100 };
  }

  const manifestPath = join(outputDir, 'manifest.json');
  const qaPath = join(outputDir, 'qa.json');
  const manifest = buildManifest(scene, render.frames.length);
  const qaResult = runQa(scene);
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(qaPath, `${JSON.stringify(qaResult, null, 2)}\n`);

  const candidateId = computeCandidateId({ proposalId, scene, fps: FPS });
  const durationMs = scene.durationMs;
  const window = opportunity.a_roll_window;
  const placementStart = window.start_ms;
  const placementDuration = Math.min(durationMs, window.end_ms - window.start_ms);

  const artifacts = [
    { role: 'PRIMARY_MEDIA', uri: `${URI_SCHEME}${join(outputDir, `${scene.id}.mp4`)}`, media_type: 'video/mp4', sha256: mediaSha, duration_ms: durationMs },
    { role: 'PREVIEW', uri: `${URI_SCHEME}contact-sheet.png`, media_type: 'image/png' },
    { role: 'MANIFEST', uri: `${URI_SCHEME}manifest.json`, media_type: 'application/json' },
    { role: 'QA_REPORT', uri: `${URI_SCHEME}qa.json`, media_type: 'application/json' },
  ];
  const candidate = {
    candidate_id: candidateId,
    asset_family: ASSET_FAMILY,
    candidate_status: qaResult.passed ? 'READY' : 'QA_REJECTED',
    duration_ms: durationMs,
    suggested_placement: { start_ms: placementStart, end_ms: placementStart + placementDuration },
    artifacts,
    qa: { status: qaResult.passed ? 'PASSED' : 'FAILED', summary: qaResult.passed ? '所有机器 QA 检查通过' : `QA 发现 ${qaResult.findings.length} 个问题` },
    provenance: { origin: 'plugin-generated', source_ref: COMPILER_SEMANTICS_TAG },
    plugin_metadata: {},
  };
  return { ...base, operation_status: 'COMPLETED', candidate };
}

async function writeRuntimeUnavailable(resultPath, requestData, code, message) {
  await writeResultAtomic(resultPath, {
    contract_version: CONTRACT_VERSION,
    request_id: requestData?.request_id ?? '',
    opportunity_id: requestData?.opportunity?.opportunity_id ?? '',
    plugin_id: PLUGIN_ID,
    plugin_version: PLUGIN_VERSION,
    operation_status: 'UNAVAILABLE',
    problem: { code, message, retryability: false },
  });
}

// Dispatch a single request file. Returns the operation_status written.
export async function runContract(args) {
  const { request, result, outputDir } = parseArgs(args);
  if (!request) throw new Error('缺少 --request 参数');
  if (!result) throw new Error('缺少 --result 参数');
  if (!outputDir) throw new Error('缺少 --output-dir 参数');

  let requestData;
  try {
    requestData = await readRequest(request);
  } catch (error) {
    // Malformed request: fail closed without fabricating a plugin result.
    throw new Error(`无法读取请求：${error.message}`);
  }

  const capability = { ...await checkRuntimeCapabilities() };
  const forcedMissing = process.env.HANDDRAWN_FORCE_MISSING_CAPABILITY;
  if (forcedMissing) capability[forcedMissing] = false;
  if (!capability.ffmpeg) {
    await writeRuntimeUnavailable(result, requestData, 'ffmpeg-missing');
    return 'UNAVAILABLE';
  }
  if (!capability.cjk) {
    await writeRuntimeUnavailable(result, requestData, 'cjk-font-missing');
    return 'UNAVAILABLE';
  }
  if (!capability.resvg) {
    await writeRuntimeUnavailable(result, requestData, 'resvg-missing');
    return 'UNAVAILABLE';
  }

  const opportunity = requestData.opportunity;
  if (!opportunity || typeof opportunity !== 'object') {
    await writeResultAtomic(result, {
      contract_version: CONTRACT_VERSION,
      request_id: requestData.request_id ?? '',
      opportunity_id: '',
      plugin_id: PLUGIN_ID,
      plugin_version: PLUGIN_VERSION,
      operation_status: 'FAILED',
      problem: { code: 'invalid-opportunity', message: '请求缺少 opportunity', retryability: true },
    });
    return 'FAILED';
  }

  if (!Object.prototype.hasOwnProperty.call(requestData, 'proposal_id')) {
    const suitability = await runSuitability(opportunity, requestData.request_id ?? '');
    await writeResultAtomic(result, suitability);
    return suitability.operation_status;
  }

  const generation = await runGeneration(opportunity, requestData.proposal_id, outputDir);
  generation.request_id = requestData.request_id ?? '';
  await writeResultAtomic(result, generation);
  return generation.operation_status;
}

export async function main(argv) {
  if (argv[0] === '--version') {
    process.stdout.write(PLUGIN_VERSION);
    return 0;
  }
  try {
    await runContract(argv);
    return 0;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    return 1;
  }
}

const __dirname = dirname(fileURLToPath(import.meta.url));

if (process.argv[1] && import.meta.url === new URL(process.argv[1], 'file:').href) {
  main(process.argv.slice(2)).then((code) => { process.exitCode = code; });
}
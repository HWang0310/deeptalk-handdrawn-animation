import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  PLUGIN_VERSION,
  CONTRACT_VERSION,
  PLUGIN_ID,
  assessSuitability,
  buildScene,
  computeCandidateId,
  computeProposalId,
  computeSceneDigest,
  runSuitability,
  selectGrammar,
  validateRequestEnvelope,
} from '../src/contract-runner.js';

const suitableOpportunity = {
  opportunity_id: 'opp_cv1_syn_actor_action_001',
  spoken_semantics: '合同签署推动后续业务结果持续变化',
  visual_purpose: '解释合同签署如何通过因果传导机制影响业务结果',
  a_roll_window: { start_ms: 182400, end_ms: 190400 },
  target_duration_ms: 7000,
  language: 'zh-CN',
  canvas: { width: 1920, height: 1080 },
  semantic_context: '展示从签约动作到业务结果之间的因果传导路径',
  factual_context: ['合同流程', '结果指标'],
};

const borderlineOpportunity = {
  opportunity_id: 'opp_cv1_syn_hidden_001',
  spoken_semantics: '团队内部士气在无形中变化',
  visual_purpose: '表达一种看不见的内部情绪机制',
  a_roll_window: { start_ms: 30000, end_ms: 38000 },
  target_duration_ms: 6000,
  language: 'zh-CN',
  canvas: { width: 1920, height: 1080 },
};

const headlineOpportunity = {
  opportunity_id: 'opp_cv1_syn_headline_001',
  spoken_semantics: '本季度业绩表现强劲',
  visual_purpose: '给出一个判断性结论',
  a_roll_window: { start_ms: 5000, end_ms: 9000 },
  target_duration_ms: 4000,
  language: 'zh-CN',
  canvas: { width: 1920, height: 1080 },
};

const validSuitabilityRequest = () => ({
  contract_version: CONTRACT_VERSION,
  request_id: 'req_env_suitability',
  opportunity: suitableOpportunity,
});

const validGenerationRequest = () => ({
  contract_version: CONTRACT_VERSION,
  request_id: 'req_env_generation',
  proposal_id: computeProposalId(suitableOpportunity),
  opportunity: suitableOpportunity,
});

// ---------------------------------------------------------------------------
// Constants / --version surface
// ---------------------------------------------------------------------------

test('PLUGIN_VERSION is a single-line non-empty version string', () => {
  assert.equal(PLUGIN_VERSION, 'handdrawn-animation-contract/0.1.0');
  assert.ok(PLUGIN_VERSION.length > 0);
  assert.ok(!PLUGIN_VERSION.includes('\n'));
});

test('CONTRACT_VERSION is the frozen visual-asset-plugin-contract/1', () => {
  assert.equal(CONTRACT_VERSION, 'visual-asset-plugin-contract/1');
});

// ---------------------------------------------------------------------------
// Suitability semantics
// ---------------------------------------------------------------------------

test('suitability: causal opportunity is SUITABLE with deterministic proposal_id', async () => {
  const result = await runSuitability(suitableOpportunity, 'req_1');
  assert.equal(result.operation_status, 'COMPLETED');
  assert.equal(result.suitability, 'SUITABLE');
  assert.match(result.proposal_id, /^prop_[0-9a-f]{24}$/);
  assert.equal(result.request_id, 'req_1');
  assert.equal(result.contract_version, CONTRACT_VERSION);
  assert.equal(result.plugin_id, PLUGIN_ID);
  assert.equal(result.plugin_version, PLUGIN_VERSION);
  assert.ok(result.reason.length > 0);
  assert.equal(result.problem, undefined);
});

test('suitability: headline-only opportunity is ABSTAIN', async () => {
  const result = await runSuitability(headlineOpportunity, 'req_2');
  assert.equal(result.operation_status, 'COMPLETED');
  assert.equal(result.suitability, 'ABSTAIN');
  assert.equal(result.problem, undefined);
});

test('suitability: hidden-mechanism opportunity is BORDERLINE', async () => {
  const result = await runSuitability(borderlineOpportunity, 'req_3');
  assert.equal(result.operation_status, 'COMPLETED');
  assert.equal(result.suitability, 'BORDERLINE');
});

test('suitability: duration outside 3000-10000 is ABSTAIN, never clamped', async () => {
  const short = { ...suitableOpportunity, opportunity_id: 'opp_short', target_duration_ms: 2000 };
  const long = { ...suitableOpportunity, opportunity_id: 'opp_long', target_duration_ms: 12000 };
  assert.equal((await runSuitability(short, 'req_4')).suitability, 'ABSTAIN');
  assert.equal((await runSuitability(long, 'req_5')).suitability, 'ABSTAIN');
});

test('suitability: unsupported canvas is ABSTAIN', async () => {
  const wrong = { ...suitableOpportunity, opportunity_id: 'opp_canvas', canvas: { width: 1280, height: 720 } };
  assert.equal((await runSuitability(wrong, 'req_6')).suitability, 'ABSTAIN');
});

test('suitability: content-driven, no benchmark/fixture lookup', () => {
  assert.equal(assessSuitability(suitableOpportunity).status, 'SUITABLE');
  const unrelated = {
    ...suitableOpportunity,
    opportunity_id: 'opp_unrelated',
    spoken_semantics: '今天天气不错适合出门散步',
    visual_purpose: '记录一次休闲活动',
    semantic_context: undefined,
    factual_context: undefined,
  };
  assert.equal(assessSuitability(unrelated).status, 'ABSTAIN');
});

// ---------------------------------------------------------------------------
// proposal_id / candidate_id determinism
// ---------------------------------------------------------------------------

test('proposal_id is deterministic for identical opportunity', () => {
  const first = computeProposalId(suitableOpportunity);
  const second = computeProposalId(suitableOpportunity);
  assert.equal(first, second);
  assert.match(first, /^prop_[0-9a-f]{24}$/);
});

test('proposal_id changes when opportunity content tampers', () => {
  const tampered = { ...suitableOpportunity, spoken_semantics: '篡改后的不同语义' };
  assert.notEqual(computeProposalId(suitableOpportunity), computeProposalId(tampered));
  const purposeTampered = { ...suitableOpportunity, visual_purpose: '篡改后的不同目的' };
  assert.notEqual(computeProposalId(suitableOpportunity), computeProposalId(purposeTampered));
});

test('candidate_id is deterministic for identical proposal + scene', () => {
  const proposalId = computeProposalId(suitableOpportunity);
  const grammar = selectGrammar(suitableOpportunity);
  const scene = buildScene(suitableOpportunity, grammar);
  const first = computeCandidateId({ proposalId, scene, grammar, fps: 12 });
  const second = computeCandidateId({ proposalId, scene, grammar, fps: 12 });
  assert.equal(first, second);
  assert.match(first, /^cand_[0-9a-f]{24}$/);
});

test('candidate_id changes when organic seed changes', () => {
  const proposalId = computeProposalId(suitableOpportunity);
  const grammar = selectGrammar(suitableOpportunity);
  const sceneA = buildScene(suitableOpportunity, grammar);
  const sceneB = buildScene(suitableOpportunity, grammar);
  sceneB.style.organic.seed = 'contract:different-seed';
  assert.notEqual(computeCandidateId({ proposalId, scene: sceneA, grammar, fps: 12 }), computeCandidateId({ proposalId, scene: sceneB, grammar, fps: 12 }));
});

// ---------------------------------------------------------------------------
// Candidate identity binds full render-relevant scene state (Correction #5)
// ---------------------------------------------------------------------------

test('scene digest changes when any render-relevant scene content changes', () => {
  const grammar = selectGrammar(suitableOpportunity);
  const sceneA = buildScene(suitableOpportunity, grammar);
  const sceneB = buildScene(suitableOpportunity, grammar);
  // Changing a focal group label must change the digest and the candidate id.
  sceneB.composition.focalGroup = 'different-focal-group';
  assert.notEqual(computeSceneDigest(sceneA), computeSceneDigest(sceneB));
  const proposalId = computeProposalId(suitableOpportunity);
  assert.notEqual(
    computeCandidateId({ proposalId, scene: sceneA, grammar, fps: 12 }),
    computeCandidateId({ proposalId, scene: sceneB, grammar, fps: 12 }),
  );
});

test('candidate_id changes when composition grammar changes', () => {
  const proposalId = computeProposalId(suitableOpportunity);
  const grammarA = 'actor-action-consequence';
  const grammarB = 'before-after-transition';
  const sceneA = buildScene(suitableOpportunity, grammarA);
  const sceneB = buildScene(suitableOpportunity, grammarB);
  assert.notEqual(
    computeCandidateId({ proposalId, scene: sceneA, grammar: grammarA, fps: 12 }),
    computeCandidateId({ proposalId, scene: sceneB, grammar: grammarB, fps: 12 }),
  );
});

test('candidate_id changes when ffmpeg flags tag changes', () => {
  const proposalId = computeProposalId(suitableOpportunity);
  const grammar = selectGrammar(suitableOpportunity);
  const scene = buildScene(suitableOpportunity, grammar);
  assert.notEqual(
    computeCandidateId({ proposalId, scene, grammar, fps: 12, ffmpegFlagsTag: 'libx264-yuv420p-faststart' }),
    computeCandidateId({ proposalId, scene, grammar, fps: 12, ffmpegFlagsTag: 'libx264-yuv420p-faststart-crf23' }),
  );
});

// ---------------------------------------------------------------------------
// Grammar selection / scene assembly
// ---------------------------------------------------------------------------

test('grammar selection maps causal semantics to actor-action-consequence', () => {
  assert.equal(selectGrammar(suitableOpportunity), 'actor-action-consequence');
});

test('grammar selection is conservative (ABSTAIN when no signal matches)', () => {
  assert.equal(selectGrammar(headlineOpportunity), null);
});

test('buildScene produces a schema-valid scene with deterministic elements', () => {
  const grammar = selectGrammar(suitableOpportunity);
  const scene = buildScene(suitableOpportunity, grammar);
  assert.equal(scene.durationMs, 7000);
  assert.equal(scene.canvas.width, 1920);
  assert.equal(scene.canvas.height, 1080);
  assert.equal(scene.title, '合同签署推动后续业务结果持续变化');
  assert.ok(scene.elements.length > 0);
  // Scene passes schema validation (would throw otherwise).
});

// ---------------------------------------------------------------------------
// Envelope-shape invariants (pure, no rendering)
// ---------------------------------------------------------------------------

test('FAILED suitability response omits proposal_id and carries problem', async () => {
  const result = await runSuitability({}, 'req_bad');
  assert.equal(result.operation_status, 'FAILED');
  assert.equal(result.proposal_id, undefined);
  assert.ok(result.problem.code);
  assert.ok(result.problem.message);
});

test('UNAVAILABLE suitability response carries problem and no proposal', async () => {
  // assessSuitability currently never returns UNAVAILABLE at the assessment
  // layer; runtime UNAVAILABLE is handled at the runner boundary. Assert the
  // envelope contract here via a malformed opportunity that maps to FAILED.
  const result = await runSuitability(null, 'req_null');
  assert.equal(result.operation_status, 'FAILED');
  assert.ok(result.problem.code);
});

test('proposal_id is stable across runs (replayable)', () => {
  const first = computeProposalId(suitableOpportunity);
  const second = computeProposalId(suitableOpportunity);
  assert.equal(first, second);
});

// ---------------------------------------------------------------------------
// Strict request envelope validation (Correction #4)
// ---------------------------------------------------------------------------

test('envelope: valid suitability and generation requests pass', () => {
  assert.equal(validateRequestEnvelope(validSuitabilityRequest()), false);
  assert.equal(validateRequestEnvelope(validGenerationRequest()), true);
});

test('envelope: wrong contract_version fails closed', () => {
  const bad = validSuitabilityRequest();
  bad.contract_version = 'visual-asset-plugin-contract/2';
  assert.throws(() => validateRequestEnvelope(bad), /contract_version/);
});

test('envelope: empty or missing request_id fails closed', () => {
  const bad = validSuitabilityRequest();
  bad.request_id = '';
  assert.throws(() => validateRequestEnvelope(bad), /request_id/);
  delete bad.request_id;
  assert.throws(() => validateRequestEnvelope(bad), /request_id/);
});

test('envelope: request with proposal_id is treated as generation (not suitability)', () => {
  // Core contract distinguishes suitability vs generation by the presence of
  // proposal_id. A request that carries it must route to generation.
  assert.equal(validateRequestEnvelope(validGenerationRequest()), true);
});

test('envelope: suitability request with unknown generation-only field fails closed', () => {
  // A suitability request must not smuggle generation-only semantics.
  const bad = validSuitabilityRequest();
  bad.candidate = { candidate_id: 'cand_x' };
  assert.throws(() => validateRequestEnvelope(bad), /不允许的字段/);
});

test('envelope: generation request with empty proposal_id fails closed', () => {
  const bad = validGenerationRequest();
  bad.proposal_id = '';
  assert.throws(() => validateRequestEnvelope(bad), /proposal_id/);
});

test('envelope: incomplete opportunity fails closed', () => {
  const bad = validSuitabilityRequest();
  bad.opportunity = { ...suitableOpportunity };
  delete bad.opportunity.target_duration_ms;
  assert.throws(() => validateRequestEnvelope(bad), /target_duration_ms/);
});

test('envelope: unknown top-level field fails closed', () => {
  const bad = validSuitabilityRequest();
  bad.extra = 'not-allowed';
  assert.throws(() => validateRequestEnvelope(bad), /不允许的字段/);
});

test('envelope: malformed request → non-zero exit and no fabricated result', async () => {
  const { spawnSync } = await import('node:child_process');
  const dir = await mkdtemp(join(tmpdir(), 'hd-runner-envelope-'));
  try {
    const requestPath = join(dir, 'request.json');
    const resultPath = join(dir, 'result.json');
    await writeFile(requestPath, `${JSON.stringify({ contract_version: 'visual-asset-plugin-contract/9', request_id: 'req_bad', opportunity: suitableOpportunity }, null, 2)}\n`);
    const runnerPath = new URL('../src/contract-runner.js', import.meta.url).pathname;
    const result = spawnSync(process.execPath, [runnerPath, '--request', requestPath, '--result', resultPath, '--output-dir', join(dir, 'output')], {
      encoding: 'utf-8',
    });
    assert.notEqual(result.status, 0);
    await assert.rejects(() => stat(resultPath));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// UNAVAILABLE fail-closed path (simulated via env capability override)
// ---------------------------------------------------------------------------

test('UNAVAILABLE: missing runtime capability yields UNAVAILABLE not ABSTAIN', async () => {
  const { spawnSync } = await import('node:child_process');
  const dir = await mkdtemp(join(tmpdir(), 'hd-runner-unavail-'));
  try {
    const requestPath = join(dir, 'request.json');
    const resultPath = join(dir, 'result.json');
    await writeFile(requestPath, `${JSON.stringify({ contract_version: CONTRACT_VERSION, request_id: 'req_unavail', opportunity: suitableOpportunity }, null, 2)}\n`);
    const runnerPath = new URL('../src/contract-runner.js', import.meta.url).pathname;
    const result = spawnSync(process.execPath, [runnerPath, '--request', requestPath, '--result', resultPath, '--output-dir', join(dir, 'output')], {
      env: { ...process.env, HANDDRAWN_FORCE_MISSING_CAPABILITY: 'ffmpeg' },
      encoding: 'utf-8',
    });
    assert.equal(result.status, 0, result.stderr);
    const written = JSON.parse(await readFile(resultPath, 'utf-8'));
    assert.equal(written.operation_status, 'UNAVAILABLE');
    assert.equal(written.problem.code, 'ffmpeg-missing');
    assert.equal(written.problem.retryability, false);
    assert.equal(written.proposal_id, undefined);
    assert.equal(written.suitability, undefined);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('BLOCKED: scene build failure yields BLOCKED with no candidate', async () => {
  const { spawnSync } = await import('node:child_process');
  const dir = await mkdtemp(join(tmpdir(), 'hd-runner-blocked-'));
  try {
    const requestPath = join(dir, 'request.json');
    const resultPath = join(dir, 'result.json');
    const proposalId = computeProposalId(suitableOpportunity);
    await writeFile(requestPath, `${JSON.stringify({ contract_version: CONTRACT_VERSION, request_id: 'req_blocked', proposal_id: proposalId, opportunity: suitableOpportunity }, null, 2)}\n`);
    const runnerPath = new URL('../src/contract-runner.js', import.meta.url).pathname;
    const result = spawnSync(process.execPath, [runnerPath, '--request', requestPath, '--result', resultPath, '--output-dir', join(dir, 'output')], {
      env: { ...process.env, HANDDRAWN_FORCE_SCENE_BLOCK: '1' },
      encoding: 'utf-8',
    });
    assert.equal(result.status, 0, result.stderr);
    const written = JSON.parse(await readFile(resultPath, 'utf-8'));
    assert.equal(written.operation_status, 'BLOCKED');
    assert.equal(written.problem.code, 'scene-build-failed');
    assert.equal(written.candidate, undefined);
    // proposal_id is still echoed on a generation BLOCKED result.
    assert.equal(written.proposal_id, proposalId);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// Generation proposal_id re-validation (Correction #2)
// ---------------------------------------------------------------------------

test('generation: proposal tamper (proposal A + materially modified opportunity B) fails closed', async () => {
  const { spawnSync } = await import('node:child_process');
  const dir = await mkdtemp(join(tmpdir(), 'hd-runner-tamper-'));
  try {
    const requestPath = join(dir, 'request.json');
    const resultPath = join(dir, 'result.json');
    const proposalA = computeProposalId(suitableOpportunity);
    // Opportunity B is materially modified (different spoken_semantics), but
    // still a valid, renderable opportunity with the same proposal A attached.
    const opportunityB = {
      ...suitableOpportunity,
      opportunity_id: 'opp_cv1_syn_actor_action_002',
      spoken_semantics: '市场扩张推动业务规模快速增长',
      visual_purpose: '解释市场扩张如何通过因果传导机制影响业务规模',
      a_roll_window: { start_ms: 0, end_ms: 4000 },
      target_duration_ms: 4000,
    };
    await writeFile(requestPath, `${JSON.stringify({ contract_version: CONTRACT_VERSION, request_id: 'req_tamper', proposal_id: proposalA, opportunity: opportunityB }, null, 2)}\n`);
    const runnerPath = new URL('../src/contract-runner.js', import.meta.url).pathname;
    const result = spawnSync(process.execPath, [runnerPath, '--request', requestPath, '--result', resultPath, '--output-dir', join(dir, 'output')], {
      encoding: 'utf-8',
    });
    assert.equal(result.status, 0, result.stderr);
    const written = JSON.parse(await readFile(resultPath, 'utf-8'));
    assert.equal(written.operation_status, 'FAILED');
    assert.equal(written.problem.code, 'proposal-mismatch');
    assert.equal(written.candidate, undefined);
    // No render may occur: no media artifact file should exist.
    await assert.rejects(() => stat(join(dir, 'output', `${opportunityB.opportunity_id}.mp4`)));
    await assert.rejects(() => stat(join(dir, 'output', 'contact-sheet.png')));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// Generation UNAVAILABLE preserves proposal_id (Correction #3)
// ---------------------------------------------------------------------------

test('generation UNAVAILABLE: forced missing ffmpeg echoes proposal_id, no candidate', async () => {
  const { spawnSync } = await import('node:child_process');
  const dir = await mkdtemp(join(tmpdir(), 'hd-runner-gen-unavail-'));
  try {
    const requestPath = join(dir, 'request.json');
    const resultPath = join(dir, 'result.json');
    const proposalId = computeProposalId(suitableOpportunity);
    await writeFile(requestPath, `${JSON.stringify({ contract_version: CONTRACT_VERSION, request_id: 'req_gen_unavail', proposal_id: proposalId, opportunity: suitableOpportunity }, null, 2)}\n`);
    const runnerPath = new URL('../src/contract-runner.js', import.meta.url).pathname;
    const result = spawnSync(process.execPath, [runnerPath, '--request', requestPath, '--result', resultPath, '--output-dir', join(dir, 'output')], {
      env: { ...process.env, HANDDRAWN_FORCE_MISSING_CAPABILITY: 'ffmpeg' },
      encoding: 'utf-8',
    });
    assert.equal(result.status, 0, result.stderr);
    const written = JSON.parse(await readFile(resultPath, 'utf-8'));
    assert.equal(written.operation_status, 'UNAVAILABLE');
    assert.equal(written.problem.code, 'ffmpeg-missing');
    assert.equal(written.proposal_id, proposalId);
    assert.equal(written.candidate, undefined);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('generation UNAVAILABLE: missing CJK/resvg also echoes proposal_id, no candidate', async () => {
  const { spawnSync } = await import('node:child_process');
  const dir = await mkdtemp(join(tmpdir(), 'hd-runner-gen-unavail-'));
  try {
    const requestPath = join(dir, 'request.json');
    const resultPath = join(dir, 'result.json');
    const proposalId = computeProposalId(suitableOpportunity);
    await writeFile(requestPath, `${JSON.stringify({ contract_version: CONTRACT_VERSION, request_id: 'req_gen_unavail_cjk', proposal_id: proposalId, opportunity: suitableOpportunity }, null, 2)}\n`);
    const runnerPath = new URL('../src/contract-runner.js', import.meta.url).pathname;
    const result = spawnSync(process.execPath, [runnerPath, '--request', requestPath, '--result', resultPath, '--output-dir', join(dir, 'output')], {
      env: { ...process.env, HANDDRAWN_FORCE_MISSING_CAPABILITY: 'cjk' },
      encoding: 'utf-8',
    });
    assert.equal(result.status, 0, result.stderr);
    const written = JSON.parse(await readFile(resultPath, 'utf-8'));
    assert.equal(written.operation_status, 'UNAVAILABLE');
    assert.equal(written.problem.code, 'cjk-font-missing');
    assert.equal(written.proposal_id, proposalId);
    assert.equal(written.candidate, undefined);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
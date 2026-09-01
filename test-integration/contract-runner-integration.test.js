import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  CONTRACT_VERSION,
  PLUGIN_ID,
  PLUGIN_VERSION,
  computeProposalId,
  runContract,
  runGeneration,
  selectGrammar,
  buildScene,
} from '../src/contract-runner.js';

const suitableOpportunity = {
  opportunity_id: 'opp_cv1_integration_actor_action_001',
  spoken_semantics: '合同签署推动后续业务结果持续变化',
  visual_purpose: '解释合同签署如何通过因果传导机制影响业务结果',
  a_roll_window: { start_ms: 182400, end_ms: 190400 },
  target_duration_ms: 4000,
  language: 'zh-CN',
  canvas: { width: 1920, height: 1080 },
  semantic_context: '展示从签约动作到业务结果之间的因果传导路径',
  factual_context: ['合同流程', '结果指标'],
};

test('integration: full pipeline produces READY candidate with real MP4', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'hd-cv1-integration-'));
  try {
    const proposalId = computeProposalId(suitableOpportunity);
    const outputDir = join(dir, 'output');
    const result = await runGeneration(suitableOpportunity, proposalId, outputDir);

    assert.equal(result.operation_status, 'COMPLETED');
    assert.equal(result.proposal_id, proposalId);
    assert.equal(result.contract_version, CONTRACT_VERSION);
    assert.equal(result.plugin_id, PLUGIN_ID);
    assert.equal(result.plugin_version, PLUGIN_VERSION);

    const candidate = result.candidate;
    assert.equal(candidate.asset_family, 'HANDDRAWN_SVG');
    assert.equal(candidate.candidate_status, 'READY');
    assert.match(candidate.candidate_id, /^cand_[0-9a-f]{24}$/);
    assert.equal(candidate.duration_ms, 4000);
    assert.equal(candidate.qa.status, 'PASSED');
    assert.ok(candidate.provenance && candidate.provenance.origin === 'plugin-generated');

    // Suggested placement inside a_roll_window.
    assert.ok(candidate.suggested_placement.start_ms >= 182400);
    assert.ok(candidate.suggested_placement.end_ms <= 190400);

    // PRIMARY_MEDIA real MP4 with matching SHA-256.
    const primary = candidate.artifacts.find((artifact) => artifact.role === 'PRIMARY_MEDIA');
    assert.ok(primary);
    const mp4Path = primary.uri.replace('local-runner://', '');
    const mp4Stat = await stat(mp4Path);
    assert.ok(mp4Stat.size > 0);
    assert.match(primary.sha256, /^[0-9a-f]{64}$/);
    // Verify the sha256 matches the actual file bytes.
    const { createHash } = await import('node:crypto');
    const { createReadStream } = await import('node:fs');
    const actual = await new Promise((resolvePromise, reject) => {
      const hash = createHash('sha256');
      const stream = createReadStream(mp4Path);
      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('end', () => resolvePromise(hash.digest('hex')));
      stream.on('error', reject);
    });
    assert.equal(primary.sha256, actual);

    // Contact sheet preview exists.
    const preview = candidate.artifacts.find((artifact) => artifact.role === 'PREVIEW');
    assert.ok((await stat(join(outputDir, 'contact-sheet.png'))).size > 1000);

    // Manifest and QA report exist.
    assert.ok((await stat(join(outputDir, 'manifest.json'))).size > 0);
    assert.ok((await stat(join(outputDir, 'qa.json'))).size > 0);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('integration: end-to-end CLI request/result files', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'hd-cv1-cli-'));
  try {
    const requestPath = join(dir, 'request.json');
    const resultPath = join(dir, 'result.json');
    const outputDir = join(dir, 'output');
    const request = {
      contract_version: CONTRACT_VERSION,
      request_id: 'req_cv1_cli_e2e',
      proposal_id: computeProposalId(suitableOpportunity),
      opportunity: suitableOpportunity,
    };
    await writeFile(requestPath, `${JSON.stringify(request, null, 2)}\n`);
    await runContract(['--request', requestPath, '--result', resultPath, '--output-dir', outputDir]);
    const result = JSON.parse(await readFile(resultPath, 'utf-8'));
    assert.equal(result.operation_status, 'COMPLETED');
    assert.equal(result.request_id, 'req_cv1_cli_e2e');
    assert.equal(result.opportunity_id, suitableOpportunity.opportunity_id);
    assert.equal(result.candidate.candidate_status, 'READY');
    // No .tmp residue after atomic write.
    await assert.rejects(() => stat(`${resultPath}.tmp`));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('integration: QA_REJECTED is not produced by a passing scene (sanity)', async () => {
  // A normal generation must never return QA_REJECTED; only forced QA failure
  // yields that status. Here we assert the opposite (READY) to lock the gate.
  const dir = await mkdtemp(join(tmpdir(), 'hd-cv1-qa-'));
  try {
    const proposalId = computeProposalId(suitableOpportunity);
    const result = await runGeneration(suitableOpportunity, proposalId, join(dir, 'output'));
    assert.equal(result.candidate.candidate_status, 'READY');
    assert.equal(result.candidate.qa.status, 'PASSED');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('QA_REJECTED: forced QA failure yields QA_REJECTED with QA FAILED', async () => {
  const { spawnSync } = await import('node:child_process');
  const dir = await mkdtemp(join(tmpdir(), 'hd-runner-qareject-'));
  try {
    const requestPath = join(dir, 'request.json');
    const resultPath = join(dir, 'result.json');
    const proposalId = computeProposalId(suitableOpportunity);
    await writeFile(requestPath, `${JSON.stringify({ contract_version: CONTRACT_VERSION, request_id: 'req_qareject', proposal_id: proposalId, opportunity: suitableOpportunity }, null, 2)}\n`);
    const runnerPath = new URL('../src/contract-runner.js', import.meta.url).pathname;
    const result = spawnSync(process.execPath, [runnerPath, '--request', requestPath, '--result', resultPath, '--output-dir', join(dir, 'output')], {
      env: { ...process.env, HANDDRAWN_FORCE_QA_FAIL: '1' },
      encoding: 'utf-8',
    });
    assert.equal(result.status, 0, result.stderr);
    const written = JSON.parse(await readFile(resultPath, 'utf-8'));
    assert.equal(written.operation_status, 'COMPLETED');
    assert.equal(written.candidate.candidate_status, 'QA_REJECTED');
    assert.equal(written.candidate.qa.status, 'FAILED');
    // QA_REJECTED still carries required fields per contract.
    assert.ok(written.candidate.candidate_id);
    assert.ok(written.candidate.qa.summary.length > 0);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
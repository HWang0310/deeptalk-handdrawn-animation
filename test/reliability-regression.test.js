// Regression test for generation-completeness blocker (Issue #1, Stage 1).
//
// Root cause: runGeneration() does not catch errors from renderScene(),
// sha256File(), or writeFile() for manifest/qa. When any of these steps
// fails after frame rendering (e.g. ffmpeg encoding error, disk-full,
// timeout kill), the exception propagates to main(), the process exits
// non-zero, and NO result.json is written. DeepTalk Core correctly
// records this as "non_zero_exit" generation failure and exposes no
// READY candidate — but the plugin never produced the Contract-required
// FAILED envelope either.
//
// This test simulates a render failure by pointing output-dir at a
// read-only directory and asserting that the runner:
//   1. exits 0 (not 1);
//   2. writes a valid result.json with operation_status FAILED;
//   3. includes a problem envelope with a code, message, and retryability;
//   4. does NOT fabricate a candidate.
//
// Before the fix the runner exits 1 and writes no result.json at all.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile, chmod, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

import { CONTRACT_VERSION, computeProposalId } from '../src/contract-runner.js';

const suitableOpportunity = {
  opportunity_id: 'opp_phase6_reliability_001',
  spoken_semantics: '利率调整通过信贷渠道传导至实体经济融资成本',
  visual_purpose: '解释利率调整如何通过因果传导机制影响实体经济融资成本变化',
  a_roll_window: { start_ms: 182400, end_ms: 190400 },
  target_duration_ms: 7000,
  language: 'zh-CN',
  canvas: { width: 1920, height: 1080 },
  semantic_context: '展示从利率决策到融资成本变化之间的因果传导路径',
};

test('regression: render failure writes FAILED result.json, not exit 1 with no result', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'hd-reliability-'));
  try {
    const outputDir = join(dir, 'output');
    const requestPath = join(dir, 'request.json');
    const resultPath = join(dir, 'result.json');
    const proposalId = computeProposalId(suitableOpportunity);
    await writeFile(requestPath, `${JSON.stringify({
      contract_version: CONTRACT_VERSION,
      request_id: 'req_reliability_001',
      proposal_id: proposalId,
      opportunity: suitableOpportunity,
    }, null, 2)}\n`);

    // Make output-dir read-only so mkdir(frames) inside renderScene fails.
    await mkdir(outputDir, { recursive: true });
    await chmod(outputDir, 0o444);

    const runnerPath = new URL('../src/contract-runner.js', import.meta.url).pathname;
    const result = spawnSync(process.execPath, [runnerPath, '--request', requestPath, '--result', resultPath, '--output-dir', outputDir], {
      encoding: 'utf-8',
    });

    // The runner MUST exit 0 and write a result.json even when rendering fails.
    assert.equal(result.status, 0, `runner should exit 0 on render failure, got ${result.status}\nstderr: ${result.stderr}`);

    const written = JSON.parse(await readFile(resultPath, 'utf-8'));
    assert.equal(written.contract_version, CONTRACT_VERSION);
    assert.equal(written.opportunity_id, suitableOpportunity.opportunity_id);
    assert.equal(written.proposal_id, proposalId);
    assert.equal(written.operation_status, 'FAILED');
    assert.ok(written.problem, 'FAILED result must carry a problem envelope');
    assert.ok(written.problem.code, 'problem must have a code');
    assert.ok(written.problem.message, 'problem must have a message');
    assert.equal(typeof written.problem.retryability, 'boolean');
    assert.equal(written.candidate, undefined, 'FAILED result must not fabricate a candidate');
  } finally {
    // Restore permissions so rm can clean up.
    try { await chmod(join(dir, 'output'), 0o755); } catch { /* already gone */ }
    await rm(dir, { recursive: true, force: true });
  }
});

// Use mkdir from node:fs/promises — the import at top only pulls specific
// functions. Add it here so the test can create the output dir.
import { mkdir } from 'node:fs/promises';

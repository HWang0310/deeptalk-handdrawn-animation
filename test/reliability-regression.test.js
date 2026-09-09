// Regression tests for generation-completeness blocker (Issue #1, Stage 1).
//
// Root cause: DeepTalk Core uses subprocess.Popen(timeout=120, start_new_session=True)
// to run the plugin. When the timeout fires, Core sends SIGTERM to the entire process
// group via os.killpg(). The Node process had NO SIGTERM handler, so it exited
// immediately (default behavior) without writing result.json — even though frames
// had already been rendered to disk. Core correctly recorded this as a non_zero_exit
// generation failure with no READY candidate.
//
// Additionally, render-pipeline errors (ffmpeg encoding, resvg rasterization, disk-full)
// were not caught by try/catch in runGeneration(), so they also caused exit 1 with no
// result.json.
//
// Fix: (1) try/catch around render → encode → manifest/QA → candidate assembly;
// (2) SIGTERM/SIGINT handler that writes a FAILED result.json before exiting.
//
// These tests verify:
//   1. Render failure (non-signal): exits 0, writes FAILED result.json.
//   2. SIGTERM during generation: exits 0, writes FAILED result.json.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile, chmod, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';

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

test('regression: SIGTERM during generation writes FAILED result.json, not exit-with-signal and no result', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'hd-sigterm-'));
  try {
    const outputDir = join(dir, 'output');
    const requestPath = join(dir, 'request.json');
    const resultPath = join(dir, 'result.json');
    const proposalId = computeProposalId(suitableOpportunity);
    await writeFile(requestPath, `${JSON.stringify({
      contract_version: CONTRACT_VERSION,
      request_id: 'req_sigterm_001',
      proposal_id: proposalId,
      opportunity: suitableOpportunity,
    }, null, 2)}\n`);
    await mkdir(outputDir, { recursive: true });

    const runnerPath = new URL('../src/contract-runner.js', import.meta.url).pathname;
    const child = spawn(process.execPath, [runnerPath, '--request', requestPath, '--result', resultPath, '--output-dir', outputDir], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    // Wait enough for frame rendering to start but before MP4 encoding completes.
    // On a fast machine, 7000ms/84 frames takes ~35-40s. 5s is enough for several
    // frames to be written but before ffmpeg encode starts.
    const killDelay = 5000;

    const timer = setTimeout(() => {
      child.kill('SIGTERM');
    }, killDelay);

    const exitInfo = await new Promise((resolve) => {
      child.on('close', (code, signal) => {
        clearTimeout(timer);
        resolve({ code, signal });
      });
    });

    // The runner MUST exit 0 (not killed by signal) and write a result.json.
    assert.equal(exitInfo.code, 0, `runner should exit 0 on SIGTERM, got code=${exitInfo.code} signal=${exitInfo.signal}`);
    assert.equal(exitInfo.signal, null, `runner should not die from signal, got signal=${exitInfo.signal}`);

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
    await rm(dir, { recursive: true, force: true });
  }
});

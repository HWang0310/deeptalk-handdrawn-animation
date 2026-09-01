import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  computeProposalId,
  runGeneration,
  selectGrammar,
} from '../src/contract-runner.js';

const opportunity = {
  opportunity_id: 'opp_cv1_determinism_actor_action_001',
  spoken_semantics: '合同签署推动后续业务结果持续变化',
  visual_purpose: '解释合同签署如何通过因果传导机制影响业务结果',
  a_roll_window: { start_ms: 0, end_ms: 4000 },
  target_duration_ms: 4000,
  language: 'zh-CN',
  canvas: { width: 1920, height: 1080 },
  semantic_context: '展示从签约动作到业务结果之间的因果传导路径',
};

function sha256File(filePath) {
  return new Promise((resolvePromise, reject) => {
    const hash = createHash('sha256');
    const stream = createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolvePromise(hash.digest('hex')));
    stream.on('error', reject);
  });
}

test('mp4 determinism: two fresh renders produce identical binary SHA-256', async () => {
  const root = await mkdtemp(join(tmpdir(), 'hd-cv1-determinism-'));
  const dir1 = join(root, 'run1');
  const dir2 = join(root, 'run2');
  const proposalId = computeProposalId(opportunity);
  try {
    // Fresh render #1.
    const result1 = await runGeneration(opportunity, proposalId, dir1);
    // Fresh render #2 into a completely separate output root.
    const result2 = await runGeneration(opportunity, proposalId, dir2);

    const candidate1 = result1.candidate;
    const candidate2 = result2.candidate;

    // Same identity chain: same proposal_id → same candidate_id.
    assert.equal(result1.proposal_id, proposalId);
    assert.equal(result2.proposal_id, proposalId);
    assert.equal(candidate1.candidate_id, candidate2.candidate_id);

    // Same declared artifact SHA-256.
    const primary1 = candidate1.artifacts.find((artifact) => artifact.role === 'PRIMARY_MEDIA');
    const primary2 = candidate2.artifacts.find((artifact) => artifact.role === 'PRIMARY_MEDIA');
    assert.equal(primary1.sha256, primary2.sha256);

    // Byte-for-byte equality of the actual MP4 files (relative locator resolves
    // inside each run's own output-dir).
    const mp41 = join(dir1, primary1.uri.replace('local-runner://', ''));
    const mp42 = join(dir2, primary2.uri.replace('local-runner://', ''));
    const fileSha1 = await sha256File(mp41);
    const fileSha2 = await sha256File(mp42);
    assert.equal(fileSha1, fileSha2);
    assert.equal(fileSha1, primary1.sha256);

    // Both rendered the same number of frames (same scene).
    const manifest1 = JSON.parse(await readFile(join(join(root, 'run1'), 'manifest.json'), 'utf-8'));
    const manifest2 = JSON.parse(await readFile(join(join(root, 'run2'), 'manifest.json'), 'utf-8'));
    assert.equal(manifest1.frame_count, manifest2.frame_count);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
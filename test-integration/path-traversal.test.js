import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, stat, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  CONTRACT_VERSION,
  computeProposalId,
  sanitizeFilesystemId,
} from '../src/contract-runner.js';

// Base opportunity: a valid, SUITABLE opportunity whose opportunity_id will be
// replaced with each malicious variant to test path-traversal isolation.
const baseOpportunity = {
  opportunity_id: 'PLACEHOLDER',
  spoken_semantics: '合同签署推动后续业务结果持续变化',
  visual_purpose: '解释合同签署如何通过因果传导机制影响业务结果',
  a_roll_window: { start_ms: 0, end_ms: 4000 },
  target_duration_ms: 4000,
  language: 'zh-CN',
  canvas: { width: 1920, height: 1080 },
  semantic_context: '展示从签约动作到业务结果之间的因果传导路径',
};

// The six opportunity_id classes mandated by CORRECTION-2:
//   1. ../escaped          — parent traversal
//   2. foo/../../escaped    — nested traversal
//   3. /absolute/path       — absolute unix path
//   4. ..\escaped            — backslash traversal
//   5. C:\escaped            — Windows drive-letter absolute path
//   6. opp_cv1_safe_001     — normal safe ID (control)
const MALICIOUS_IDS = [
  '../escaped',
  'foo/../../escaped',
  '/absolute/path',
  '..\\escaped',
  'C:\\escaped',
];

const SAFE_ID = 'opp_cv1_safe_001';

// Recursively list every file under a directory (returns absolute paths).
async function listAllFiles(dir) {
  const results = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await listAllFiles(fullPath)));
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

// Run the contract runner CLI as a subprocess with a given opportunity_id.
// Returns { status, stdout, stderr, resultJson, outputDirFiles, parentDirFiles }.
async function runGenerationWithOpportunityId(opportunityId, parentDir) {
  const opportunity = { ...baseOpportunity, opportunity_id: opportunityId };
  const proposalId = computeProposalId(opportunity);
  const outputDir = join(parentDir, 'output');
  const requestPath = join(parentDir, 'request.json');
  const resultPath = join(parentDir, 'result.json');

  await (await import('node:fs/promises')).writeFile(
    requestPath,
    `${JSON.stringify({
      contract_version: CONTRACT_VERSION,
      request_id: `req_traversal_${Date.now()}`,
      proposal_id: proposalId,
      opportunity,
    }, null, 2)}\n`,
  );

  const runnerPath = new URL('../src/contract-runner.js', import.meta.url).pathname;
  const result = spawnSync(process.execPath, [runnerPath,
    '--request', requestPath,
    '--result', resultPath,
    '--output-dir', outputDir,
  ], { encoding: 'utf-8' });

  let resultJson = null;
  try {
    resultJson = JSON.parse(await readFile(resultPath, 'utf-8'));
  } catch {
    // No result file — runner may have exited non-zero.
  }

  const outputDirFiles = await listAllFiles(outputDir);
  // Scan parent directory for files that should NOT exist (escaped files).
  // We list one level up (parentDir) excluding the known temp entries.
  const parentDirFiles = await listAllFiles(parentDir);

  return { status: result.status, stdout: result.stdout, stderr: result.stderr, resultJson, outputDirFiles, parentDirFiles, outputDir, parentDir };
}

// ---------------------------------------------------------------------------
// Malicious opportunity_id regression: no file escapes --output-dir
// ---------------------------------------------------------------------------

for (const maliciousId of MALICIOUS_IDS) {
  test(`path traversal: opportunity_id "${maliciousId}" must not create files outside --output-dir`, async () => {
    const parentDir = await mkdtemp(join(tmpdir(), 'hd-traversal-'));
    try {
      const { resultJson, outputDirFiles, parentDirFiles, outputDir } = await runGenerationWithOpportunityId(maliciousId, parentDir);

      // The safe scene ID derived from the malicious opportunity_id.
      const safeId = sanitizeFilesystemId(maliciousId);

      // Case 1: runner may fail closed (BLOCKED) or may succeed with safe filename.
      // Either way, NO file may exist outside --output-dir that was created by this run.
      // Check that no file in parentDir is outside outputDir and not a known temp file.
      const knownTempFiles = new Set([
        join(parentDir, 'request.json'),
        join(parentDir, 'result.json'),
      ]);
      const escapedFiles = parentDirFiles.filter(
        (f) => !f.startsWith(outputDir) && !knownTempFiles.has(f),
      );

      // Any escaped file is a critical security violation.
      assert.equal(escapedFiles.length, 0,
        `opportunity_id "${maliciousId}" created files outside --output-dir: ${JSON.stringify(escapedFiles)}`,
      );

      // If the runner succeeded, verify the MP4 filename is the safe ID (not the raw malicious ID).
      if (resultJson && resultJson.operation_status === 'COMPLETED' && resultJson.candidate) {
        const primary = resultJson.candidate.artifacts.find((a) => a.role === 'PRIMARY_MEDIA');
        assert.ok(primary, 'PRIMARY_MEDIA artifact must exist on COMPLETED');
        const relative = primary.uri.replace('local-runner://', '');
        // The relative path must contain the safe ID, never the raw malicious ID.
        assert.ok(relative.includes(safeId),
          `PRIMARY_MEDIA uri "${primary.uri}" must contain safe ID "${safeId}", not raw "${maliciousId}"`);
        assert.ok(!relative.includes('..'),
          `PRIMARY_MEDIA uri must not contain '..': ${primary.uri}`);
        assert.ok(!relative.startsWith('/'),
          `PRIMARY_MEDIA uri must not be absolute: ${primary.uri}`);
      }

      // All files inside outputDir must have safe names (no traversal components).
      for (const f of outputDirFiles) {
        const relative = f.slice(outputDir.length);
        assert.ok(!relative.includes('..'),
          `file inside output-dir must not contain '..' in path: ${f}`);
      }
    } finally {
      await rm(parentDir, { recursive: true, force: true });
    }
  });
}

// ---------------------------------------------------------------------------
// Normal (safe) opportunity_id: must COMPLETED → READY with real artifacts
// ---------------------------------------------------------------------------

test('path traversal: safe opportunity_id produces COMPLETED → READY with real artifacts', async () => {
  const parentDir = await mkdtemp(join(tmpdir(), 'hd-traversal-safe-'));
  try {
    const { resultJson, outputDirFiles, outputDir } = await runGenerationWithOpportunityId(SAFE_ID, parentDir);

    assert.ok(resultJson, 'result JSON must be written for a safe opportunity_id');
    assert.equal(resultJson.operation_status, 'COMPLETED');
    assert.ok(resultJson.candidate, 'candidate must exist');
    assert.equal(resultJson.candidate.candidate_status, 'READY');
    assert.equal(resultJson.candidate.qa.status, 'PASSED');

    // PRIMARY_MEDIA must be a relative URI resolving inside output-dir.
    const primary = resultJson.candidate.artifacts.find((a) => a.role === 'PRIMARY_MEDIA');
    assert.ok(primary, 'PRIMARY_MEDIA must exist');
    const relative = primary.uri.replace('local-runner://', '');
    assert.ok(!relative.startsWith('/'), 'PRIMARY_MEDIA uri must be relative');
    assert.ok(!relative.includes('..'), 'PRIMARY_MEDIA uri must not contain ".."');

    // Real MP4 file exists.
    const mp4Path = join(outputDir, relative);
    const mp4Stat = await stat(mp4Path);
    assert.ok(mp4Stat.size > 0, 'MP4 file must exist and be non-empty');

    // Safe ID is deterministic: same input → same safe filename.
    const safeId = sanitizeFilesystemId(SAFE_ID);
    assert.ok(relative.includes(safeId),
      `PRIMARY_MEDIA uri must contain safe ID "${safeId}": ${primary.uri}`);

    // opportunity_id preserved in manifest for Contract lineage.
    const manifest = JSON.parse(await readFile(join(outputDir, 'manifest.json'), 'utf-8'));
    assert.equal(manifest.opportunity_id, SAFE_ID,
      'manifest must preserve original opportunity_id for Contract lineage');
    assert.equal(manifest.scene_id, safeId,
      'manifest scene_id must be the safe filesystem ID');

    // All output files are inside output-dir (no escape).
    const knownTempFiles = new Set([
      join(parentDir, 'request.json'),
      join(parentDir, 'result.json'),
    ]);
    const parentDirFiles = await listAllFiles(parentDir);
    const escapedFiles = parentDirFiles.filter(
      (f) => !f.startsWith(outputDir) && !knownTempFiles.has(f),
    );
    assert.equal(escapedFiles.length, 0,
      `safe opportunity_id must not create files outside --output-dir: ${JSON.stringify(escapedFiles)}`);
  } finally {
    await rm(parentDir, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// Determinism: sanitizeFilesystemId produces same safe ID across calls
// ---------------------------------------------------------------------------

test('path traversal: safe scene ID is deterministic across separate runs', async () => {
  const parentDir1 = await mkdtemp(join(tmpdir(), 'hd-traversal-det1-'));
  const parentDir2 = await mkdtemp(join(tmpdir(), 'hd-traversal-det2-'));
  try {
    const run1 = await runGenerationWithOpportunityId(SAFE_ID, parentDir1);
    const run2 = await runGenerationWithOpportunityId(SAFE_ID, parentDir2);

    assert.equal(run1.resultJson.operation_status, 'COMPLETED');
    assert.equal(run2.resultJson.operation_status, 'COMPLETED');

    const primary1 = run1.resultJson.candidate.artifacts.find((a) => a.role === 'PRIMARY_MEDIA');
    const primary2 = run2.resultJson.candidate.artifacts.find((a) => a.role === 'PRIMARY_MEDIA');
    assert.equal(primary1.uri, primary2.uri,
      'same opportunity_id must produce same PRIMARY_MEDIA uri (deterministic safe ID)');

    // candidate_id must also be identical (full determinism chain).
    assert.equal(
      run1.resultJson.candidate.candidate_id,
      run2.resultJson.candidate.candidate_id,
      'candidate_id must be deterministic across separate runs',
    );
  } finally {
    await rm(parentDir1, { recursive: true, force: true });
    await rm(parentDir2, { recursive: true, force: true });
  }
});

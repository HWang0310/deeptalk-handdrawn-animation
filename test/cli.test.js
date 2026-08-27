import test from 'node:test';
import assert from 'node:assert/strict';

import { runCli } from '../src/cli.js';

test('runs machine QA across all seven benchmark fixtures without rendering media', async () => {
  const report = await runCli(['qa-benchmarks'], { writeOutput: false });
  assert.equal(report.total, 7);
  assert.equal(report.failed, 0);
});

test('rejects a command outside the public local CLI surface', async () => {
  await assert.rejects(() => runCli(['publish']), /unknown command: publish/);
});

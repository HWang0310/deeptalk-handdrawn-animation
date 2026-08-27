import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';

import { benchmarks, v11Benchmarks } from '../fixtures/benchmarks.js';
import { primitiveSheet } from '../fixtures/primitive-sheet.js';
import { renderScene } from './render.js';
import { runQa } from './qa.js';

function qaReport(scenes, version) {
  const results = scenes.map((scene) => ({ sceneId: scene.id, ...runQa(scene) }));
  return {
    version,
    generatedAt: new Date().toISOString(),
    total: results.length,
    failed: results.filter((result) => !result.passed).length,
    results,
  };
}

async function writeReport(report, outputRoot) {
  const outputDir = join(outputRoot, report.version, 'qa');
  await mkdir(outputDir, { recursive: true });
  await writeFile(join(outputDir, 'benchmark-qa.json'), `${JSON.stringify(report, null, 2)}\n`);
}

async function renderBenchmarks(scenes, version, outputRoot, writeOutput) {
  const report = qaReport(scenes, version);
  if (report.failed > 0) throw new Error(`machine QA rejected ${report.failed} benchmark scene(s)`);
  const renders = [];
  for (const scene of scenes) {
    renders.push({ sceneId: scene.id, ...await renderScene(scene, { outputDir: join(outputRoot, version, 'benchmarks', scene.id), fps: 12, encode: true }) });
  }
  if (writeOutput) await writeReport(report, outputRoot);
  return { ...report, renders };
}

export async function runCli(args, { outputRoot = resolve('output'), writeOutput = true } = {}) {
  const [command] = args;
  if (command === 'qa-benchmarks') {
    const report = qaReport(benchmarks, 'v1');
    if (writeOutput) await writeReport(report, outputRoot);
    return report;
  }
  if (command === 'qa-v11-benchmarks') {
    const report = qaReport(v11Benchmarks, 'v1.1');
    if (writeOutput) await writeReport(report, outputRoot);
    return report;
  }
  if (command === 'render-benchmarks') return renderBenchmarks(benchmarks, 'v1', outputRoot, writeOutput);
  if (command === 'render-v11-benchmarks') return renderBenchmarks(v11Benchmarks, 'v1.1', outputRoot, writeOutput);
  if (command === 'render-primitive-sheet') {
    const qa = runQa(primitiveSheet);
    if (!qa.passed) throw new Error('machine QA rejected primitive sheet');
    const render = await renderScene(primitiveSheet, { outputDir: join(outputRoot, 'v1.1', 'primitives', primitiveSheet.id), fps: 12, encode: true });
    return { version: 'v1.1', total: 1, failed: 0, renders: [{ sceneId: primitiveSheet.id, ...render }], qa };
  }
  throw new Error(`unknown command: ${command ?? '(none)'}`);
}

if (process.argv[1] && import.meta.url === new URL(process.argv[1], 'file:').href) {
  runCli(process.argv.slice(2))
    .then((result) => process.stdout.write(`${JSON.stringify({ total: result.total, failed: result.failed }, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.message}\n`);
      process.exitCode = 1;
    });
}

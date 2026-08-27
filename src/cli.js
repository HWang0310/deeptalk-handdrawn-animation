import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';

import { benchmarks } from '../fixtures/benchmarks.js';
import { renderScene } from './render.js';
import { runQa } from './qa.js';

function qaReport() {
  const results = benchmarks.map((scene) => ({ sceneId: scene.id, ...runQa(scene) }));
  return {
    generatedAt: new Date().toISOString(),
    total: results.length,
    failed: results.filter((result) => !result.passed).length,
    results,
  };
}

export async function runCli(args, { outputRoot = resolve('output'), writeOutput = true } = {}) {
  const [command] = args;
  if (command === 'qa-benchmarks') {
    const report = qaReport();
    if (writeOutput) {
      const outputDir = join(outputRoot, 'qa');
      await mkdir(outputDir, { recursive: true });
      await writeFile(join(outputDir, 'benchmark-qa.json'), `${JSON.stringify(report, null, 2)}\n`);
    }
    return report;
  }
  if (command === 'render-benchmarks') {
    const report = qaReport();
    if (report.failed > 0) throw new Error(`machine QA rejected ${report.failed} benchmark scene(s)`);
    const renders = [];
    for (const scene of benchmarks) {
      renders.push({ sceneId: scene.id, ...await renderScene(scene, { outputDir: join(outputRoot, 'benchmarks', scene.id), fps: 12, encode: true }) });
    }
    if (writeOutput) {
      const outputDir = join(outputRoot, 'qa');
      await mkdir(outputDir, { recursive: true });
      await writeFile(join(outputDir, 'benchmark-qa.json'), `${JSON.stringify(report, null, 2)}\n`);
    }
    return { ...report, renders };
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

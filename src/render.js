import { Resvg } from '@resvg/resvg-js';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

import { validateScene } from './schema.js';
import { compileSvg } from './svg.js';

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited ${code}: ${stderr}`));
    });
  });
}

function rasterize(svg) {
  return new Resvg(svg, { fitTo: { mode: 'width', value: 1920 } }).render().asPng();
}

export async function renderScene(scene, { outputDir, fps = 12, encode = true } = {}) {
  validateScene(scene);
  if (!outputDir) throw new Error('outputDir is required');
  if (!Number.isInteger(fps) || fps < 1 || fps > 60) throw new Error('fps must be an integer between 1 and 60');

  const framesDir = join(outputDir, 'frames');
  await mkdir(framesDir, { recursive: true });
  const frameCount = Math.ceil(scene.durationMs / 1000 * fps);
  const frames = [];
  for (let index = 0; index < frameCount; index += 1) {
    const timeMs = index * 1000 / fps;
    const framePath = join(framesDir, `frame-${String(index).padStart(5, '0')}.png`);
    await writeFile(framePath, rasterize(compileSvg(scene, timeMs)));
    frames.push(framePath);
  }

  const finalFrame = join(outputDir, 'final-frame.png');
  await writeFile(finalFrame, rasterize(compileSvg(scene, scene.durationMs)));
  const result = { frames, finalFrame, mp4: null, contactSheet: null };
  if (!encode) return result;

  const mp4 = join(outputDir, `${scene.id}.mp4`);
  await run('ffmpeg', ['-y', '-framerate', String(fps), '-i', join(framesDir, 'frame-%05d.png'), '-frames:v', String(frameCount), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4]);
  const contactSheet = join(outputDir, 'contact-sheet.png');
  const sampleStep = Math.max(Math.floor(frameCount / 18), 1);
  await run('ffmpeg', ['-y', '-framerate', String(fps), '-i', join(framesDir, 'frame-%05d.png'), '-vf', `select='not(mod(n\\,${sampleStep}))',scale=320:180,tile=6x3`, '-frames:v', '1', contactSheet]);
  return { ...result, mp4, contactSheet };
}

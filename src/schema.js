const MIN_DURATION_MS = 3000;
const MAX_DURATION_MS = 10000;
const PRIMITIVES = new Set(['path', 'box', 'circle', 'arrow', 'label', 'number', 'group']);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function validateBounds(bounds, elementId) {
  assert(bounds && Number.isFinite(bounds.x) && Number.isFinite(bounds.y)
    && Number.isFinite(bounds.width) && Number.isFinite(bounds.height), `element ${elementId} requires finite bounds`);
  assert(bounds.width >= 0 && bounds.height >= 0, `element ${elementId} bounds cannot be negative`);
}

function validateElement(element, scene) {
  assert(element && typeof element.id === 'string' && element.id.length > 0, 'element requires an id');
  assert(PRIMITIVES.has(element.type), `element ${element.id} has unsupported type: ${element.type}`);
  validateBounds(element.bounds, element.id);
  assert(element.reveal && Number.isFinite(element.reveal.startMs) && Number.isFinite(element.reveal.endMs), `element ${element.id} requires reveal timing`);
  assert(element.reveal.startMs >= 0 && element.reveal.endMs >= element.reveal.startMs, `element ${element.id} has invalid reveal timing`);
  assert(element.reveal.endMs <= scene.durationMs, `element ${element.id} reveal exceeds scene duration`);
  if (element.type === 'path') assert(typeof element.d === 'string' && element.d.length > 0, `path ${element.id} requires d`);
  if (element.type === 'label' || element.type === 'number') assert(typeof element.text === 'string' && element.text.trim().length > 0, `text element ${element.id} requires text`);
}

export function validateScene(scene) {
  assert(scene && typeof scene.id === 'string' && scene.id.length > 0, 'scene requires an id');
  assert(Number.isFinite(scene.durationMs) && scene.durationMs >= MIN_DURATION_MS && scene.durationMs <= MAX_DURATION_MS, `durationMs must be between ${MIN_DURATION_MS} and ${MAX_DURATION_MS}`);
  assert(scene.canvas?.width === 1920 && scene.canvas?.height === 1080, 'canvas must be 1920x1080');
  assert(Array.isArray(scene.elements) && scene.elements.length > 0, 'scene requires elements');
  const ids = new Set();
  for (const element of scene.elements) {
    validateElement(element, scene);
    assert(!ids.has(element.id), `duplicate element id: ${element.id}`);
    ids.add(element.id);
  }
  return scene;
}

export function validateBenchmarks(benchmarks) {
  assert(Array.isArray(benchmarks), 'benchmarks must be an array');
  const ids = new Set();
  for (const benchmark of benchmarks) {
    validateScene(benchmark);
    assert(!ids.has(benchmark.id), `duplicate benchmark id: ${benchmark.id}`);
    ids.add(benchmark.id);
  }
  return benchmarks;
}

export const sceneLimits = { minDurationMs: MIN_DURATION_MS, maxDurationMs: MAX_DURATION_MS };

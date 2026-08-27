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

function validateOrganic(scene) {
  const organic = scene.style?.organic;
  if (!organic) return;
  assert(typeof organic.seed === 'string' && organic.seed.length > 0, 'organic seed must be a non-empty string');
  assert(Number.isFinite(organic.wobble) && organic.wobble >= 0 && organic.wobble <= 4, 'organic wobble must be between 0 and 4');
  assert(Number.isFinite(organic.widthVariance) && organic.widthVariance >= 0 && organic.widthVariance <= 0.3, 'organic widthVariance must be between 0 and 0.3');
  assert(typeof organic.duplicateSketch === 'boolean', 'organic duplicateSketch must be boolean');
}

function validateMotion(scene) {
  const finalHoldMs = scene.motion?.finalHoldMs;
  if (finalHoldMs === undefined) return;
  assert(Number.isFinite(finalHoldMs) && finalHoldMs >= 0 && finalHoldMs < scene.durationMs, 'finalHoldMs must be within scene duration');
}

function validateGroups(scene) {
  const ids = new Set();
  for (const group of scene.groups ?? []) {
    assert(group && typeof group.id === 'string' && group.id.length > 0, 'group requires an id');
    assert(!ids.has(group.id), `duplicate group id: ${group.id}`);
    assert(['background', 'middle', 'foreground'].includes(group.layer), `group ${group.id} has invalid layer`);
    assert(['focal', 'support', 'context'].includes(group.role), `group ${group.id} has invalid role`);
    ids.add(group.id);
  }
  return ids;
}

export function validateScene(scene) {
  assert(scene && typeof scene.id === 'string' && scene.id.length > 0, 'scene requires an id');
  assert(Number.isFinite(scene.durationMs) && scene.durationMs >= MIN_DURATION_MS && scene.durationMs <= MAX_DURATION_MS, `durationMs must be between ${MIN_DURATION_MS} and ${MAX_DURATION_MS}`);
  assert(scene.canvas?.width === 1920 && scene.canvas?.height === 1080, 'canvas must be 1920x1080');
  assert(Array.isArray(scene.elements) && scene.elements.length > 0, 'scene requires elements');
  validateOrganic(scene);
  validateMotion(scene);
  const groupIds = validateGroups(scene);
  const ids = new Set();
  for (const element of scene.elements) {
    validateElement(element, scene);
    if (element.groupId !== undefined) assert(groupIds.has(element.groupId), `element ${element.id} references unknown group: ${element.groupId}`);
    assert(!ids.has(element.id), `duplicate element id: ${element.id}`);
    ids.add(element.id);
  }
  for (const overlap of scene.composition?.semanticOverlaps ?? []) {
    assert(Array.isArray(overlap) && overlap.length === 2, 'semantic overlap must name exactly two elements');
    for (const elementId of overlap) assert(ids.has(elementId), `semantic overlap references unknown element: ${elementId}`);
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

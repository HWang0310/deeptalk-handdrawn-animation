const SAFE_MARGIN = 24;
const MAX_DENSITY = 0.72;
const MIN_TEXT_GAP = 24;
const MIN_FINAL_HOLD_MS = 600;

function finding(code, elementId, message) {
  return { code, elementId, message };
}

function inCanvas(bounds, canvas) {
  return bounds.x >= SAFE_MARGIN
    && bounds.y >= SAFE_MARGIN
    && bounds.x + bounds.width <= canvas.width - SAFE_MARGIN
    && bounds.y + bounds.height <= canvas.height - SAFE_MARGIN;
}

function overlapArea(first, second) {
  const width = Math.max(0, Math.min(first.x + first.width, second.x + second.width) - Math.max(first.x, second.x));
  const height = Math.max(0, Math.min(first.y + first.height, second.y + second.height) - Math.max(first.y, second.y));
  return width * height;
}

function boundsGap(first, second) {
  const dx = Math.max(second.x - (first.x + first.width), first.x - (second.x + second.width), 0);
  const dy = Math.max(second.y - (first.y + first.height), first.y - (second.y + second.height), 0);
  return Math.hypot(dx, dy);
}

function isInside(bounds, container) {
  return bounds.x >= container.x && bounds.y >= container.y
    && bounds.x + bounds.width <= container.x + container.width
    && bounds.y + bounds.height <= container.y + container.height;
}

export function runQa(scene) {
  const findings = [];
  const warnings = [];
  const canvasArea = scene.canvas.width * scene.canvas.height;
  let coverageArea = 0;
  let chineseLabelCount = 0;
  let finalFrameVisible = true;
  let strokeConsistent = true;

  for (const element of scene.elements) {
    coverageArea += element.bounds.width * element.bounds.height;
    if (!inCanvas(element.bounds, scene.canvas)) {
      findings.push(finding('bounds-overflow', element.id, 'element crosses the protected canvas margin'));
    }
    if (element.reveal.startMs < 0 || element.reveal.endMs < element.reveal.startMs || element.reveal.endMs > scene.durationMs) {
      findings.push(finding('reveal-order', element.id, 'reveal timing is not monotonic within scene duration'));
    }
    if (element.reveal.endMs > scene.durationMs) finalFrameVisible = false;
    if ((element.type === 'label' || element.type === 'number') && /[\u3400-\u9fff]/.test(element.text ?? '')) chineseLabelCount += 1;
    const width = element.strokeWidth ?? 8;
    if (element.type !== 'label' && element.type !== 'number' && (width < 3 || width > 14)) {
      strokeConsistent = false;
      findings.push(finding('stroke-width', element.id, 'stroke width is outside the hand-drawn profile'));
    }
  }

  const density = coverageArea / canvasArea;
  if (density > MAX_DENSITY) findings.push(finding('visual-density', null, `declared element bounds cover ${(density * 100).toFixed(1)}% of canvas`));
  if (chineseLabelCount === 0) findings.push(finding('chinese-labels', null, 'scene has no Chinese SVG label for readability review'));
  if (!finalFrameVisible) findings.push(finding('final-frame', null, 'one or more elements do not complete before the final frame'));

  const checks = {
    durationInRange: scene.durationMs >= 3000 && scene.durationMs <= 10000,
    boundsWithinMargin: !findings.some((item) => item.code === 'bounds-overflow'),
    revealOrderMonotonic: !findings.some((item) => item.code === 'reveal-order'),
    chineseLabelsPresent: chineseLabelCount > 0,
    finalFrameVisible,
    density: Number(density.toFixed(4)),
    strokeConsistent,
    handOverlayRequired: false,
  };
  const objects = scene.elements.filter((element) => element.type === 'box' || element.type === 'circle');
  const labels = scene.elements.filter((element) => element.type === 'label' || element.type === 'number');
  const annotations = new Set((scene.composition?.semanticOverlaps ?? []).map(([first, second]) => [first, second].sort().join(':')));
  for (let firstIndex = 0; firstIndex < objects.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < objects.length; secondIndex += 1) {
      const first = objects[firstIndex];
      const second = objects[secondIndex];
      const key = [first.id, second.id].sort().join(':');
      if (overlapArea(first.bounds, second.bounds) > 0 && !annotations.has(key)) {
        warnings.push(finding('collision-candidate', `${first.id}:${second.id}`, 'object bounds overlap without a semantic-overlap annotation'));
      }
    }
  }
  for (const label of labels) {
    for (const object of objects) {
      if (!isInside(label.bounds, object.bounds) && boundsGap(label.bounds, object.bounds) < MIN_TEXT_GAP) {
        warnings.push(finding('text-spacing', `${label.id}:${object.id}`, 'text is too close to an unrelated object bound'));
      }
    }
  }
  const focusArea = scene.composition?.focusArea;
  if (focusArea && objects.length > 0) {
    const insideCount = objects.filter((object) => isInside(object.bounds, focusArea)).length;
    if (insideCount / objects.length < 0.6) warnings.push(finding('focus-miss', null, 'fewer than 60% of primary object bounds are inside the declared focus area'));
  }
  if ((scene.motion?.finalHoldMs ?? 0) < MIN_FINAL_HOLD_MS) warnings.push(finding('final-hold', null, `final hold is shorter than ${MIN_FINAL_HOLD_MS}ms`));
  checks.compositionWarnings = warnings.length;
  if (!checks.durationInRange) findings.push(finding('duration', null, 'asset duration must stay between 3 and 10 seconds'));
  return { passed: findings.length === 0, checks, findings, warnings };
}

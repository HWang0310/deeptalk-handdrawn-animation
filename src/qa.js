const SAFE_MARGIN = 24;
const MAX_DENSITY = 0.72;

function finding(code, elementId, message) {
  return { code, elementId, message };
}

function inCanvas(bounds, canvas) {
  return bounds.x >= SAFE_MARGIN
    && bounds.y >= SAFE_MARGIN
    && bounds.x + bounds.width <= canvas.width - SAFE_MARGIN
    && bounds.y + bounds.height <= canvas.height - SAFE_MARGIN;
}

export function runQa(scene) {
  const findings = [];
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
  if (!checks.durationInRange) findings.push(finding('duration', null, 'asset duration must stay between 3 and 10 seconds'));
  return { passed: findings.length === 0, checks, findings };
}

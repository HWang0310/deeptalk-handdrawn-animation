const DEFAULT_STROKE = '#263238';
const DEFAULT_FILL = '#fffaf0';
const DASH_LENGTH = 2200;

function clamp(value) {
  return Math.max(0, Math.min(1, value));
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export function revealProgress(element, timeMs) {
  const { startMs, endMs } = element.reveal;
  const stroke = clamp((timeMs - startMs) / (endMs - startMs || 1));
  const fill = clamp((stroke - 0.65) / 0.35);
  return { stroke: Number(stroke.toFixed(4)), fill: Number(fill.toFixed(4)) };
}

function drawAttributes(element, progress) {
  const stroke = element.stroke ?? DEFAULT_STROKE;
  const fill = element.fill ?? DEFAULT_FILL;
  const width = element.strokeWidth ?? 8;
  const dashOffset = Number((DASH_LENGTH * (1 - progress.stroke)).toFixed(2));
  const fillOpacity = Number((progress.fill * (element.fillOpacity ?? 1)).toFixed(4));
  return `stroke="${escapeXml(stroke)}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${DASH_LENGTH}" stroke-dashoffset="${dashOffset}" fill="${escapeXml(fill)}" fill-opacity="${fillOpacity}"`;
}

function renderShape(element, progress) {
  const attrs = drawAttributes(element, progress);
  switch (element.type) {
    case 'path':
      return `<path d="${escapeXml(element.d)}" ${attrs}/>`;
    case 'box':
      return `<rect x="${element.x}" y="${element.y}" width="${element.width}" height="${element.height}" rx="${element.rx ?? 0}" ${attrs}/>`;
    case 'circle':
      return `<circle cx="${element.cx}" cy="${element.cy}" r="${element.r}" ${attrs}/>`;
    case 'arrow':
      return `<line x1="${element.x1}" y1="${element.y1}" x2="${element.x2}" y2="${element.y2}" ${attrs}${progress.stroke >= 0.995 ? ' marker-end="url(#arrowhead)"' : ''}/>`;
    case 'label':
    case 'number':
      return `<text x="${element.x}" y="${element.y}" fill="${escapeXml(element.color ?? DEFAULT_STROKE)}" opacity="${progress.stroke}" font-family="PingFang SC, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="${element.fontSize ?? 42}" font-weight="${element.fontWeight ?? 600}">${escapeXml(element.text)}</text>`;
    case 'group':
      return '';
    default:
      throw new Error(`unsupported element type: ${element.type}`);
  }
}

export function compileSvg(scene, timeMs) {
  const elements = scene.elements.map((element) => {
    const progress = revealProgress(element, timeMs);
    return `<g id="${escapeXml(element.id)}">${renderShape(element, progress)}</g>`;
  }).join('');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${scene.canvas.width}" height="${scene.canvas.height}" viewBox="0 0 ${scene.canvas.width} ${scene.canvas.height}">
  <defs><marker id="arrowhead" markerWidth="12" markerHeight="12" refX="10" refY="5" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="${DEFAULT_STROKE}"/></marker></defs>
  <rect width="100%" height="100%" fill="${scene.background ?? '#fffaf0'}"/>
  ${elements}
</svg>`;
}

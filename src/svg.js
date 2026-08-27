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
  const rawStroke = clamp((timeMs - startMs) / (endMs - startMs || 1));
  const easing = element.reveal.easing ?? 'linear';
  const stroke = easing === 'easeOut'
    ? 1 - (1 - rawStroke) ** 2
    : easing === 'easeInOut'
      ? (rawStroke < 0.5 ? 2 * rawStroke ** 2 : 1 - ((-2 * rawStroke + 2) ** 2) / 2)
      : rawStroke;
  const fillStart = element.reveal.fillStart ?? 0.65;
  const fill = clamp((stroke - fillStart) / (1 - fillStart || 1));
  return { stroke: Number(stroke.toFixed(4)), fill: Number(fill.toFixed(4)) };
}

function drawAttributes(element, progress, organic, variant = 'main') {
  const stroke = element.stroke ?? DEFAULT_STROKE;
  const fill = element.fill ?? DEFAULT_FILL;
  const baseWidth = element.strokeWidth ?? 8;
  const widthOffset = organic ? seededValue(organic.seed, `${element.id}:${variant}:width`, -organic.widthVariance, organic.widthVariance) : 0;
  const width = Number((baseWidth * (1 + widthOffset)).toFixed(2));
  const dashOffset = Number((DASH_LENGTH * (1 - progress.stroke)).toFixed(2));
  const fillOpacity = variant === 'duplicate' ? 0 : Number((progress.fill * (element.fillOpacity ?? 1)).toFixed(4));
  return `stroke="${escapeXml(stroke)}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${DASH_LENGTH}" stroke-dashoffset="${dashOffset}" fill="${escapeXml(fill)}" fill-opacity="${fillOpacity}"`;
}

function organicTransform(organic, element, variant) {
  if (!organic || variant === 'main') return '';
  const x = seededValue(organic.seed, `${element.id}:${variant}:x`, -organic.wobble, organic.wobble);
  const y = seededValue(organic.seed, `${element.id}:${variant}:y`, -organic.wobble, organic.wobble);
  return ` transform="translate(${x} ${y})"`;
}

function renderShape(element, progress, organic = null, variant = 'main') {
  const attrs = drawAttributes(element, progress, organic, variant);
  const transform = organicTransform(organic, element, variant);
  switch (element.type) {
    case 'path':
      return `<path d="${escapeXml(organic ? wobblePathData(element.d, `${organic.seed}:${element.id}:${variant}`, organic.wobble) : element.d)}" ${attrs}${transform}/>`;
    case 'box':
      return `<rect x="${element.x}" y="${element.y}" width="${element.width}" height="${element.height}" rx="${element.rx ?? 0}" ${attrs}${transform}/>`;
    case 'circle':
      return `<circle cx="${element.cx}" cy="${element.cy}" r="${element.r}" ${attrs}${transform}/>`;
    case 'arrow':
      return `<line x1="${element.x1}" y1="${element.y1}" x2="${element.x2}" y2="${element.y2}" ${attrs}${transform}${variant === 'main' && progress.stroke >= 0.995 ? ' marker-end="url(#arrowhead)"' : ''}/>`;
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
  const layers = { background: 0, middle: 1, foreground: 2 };
  const groups = new Map((scene.groups ?? []).map((group) => [group.id, group]));
  const elements = scene.elements.map((element, index) => ({ element, index })).sort((first, second) => {
    const firstLayer = layers[groups.get(first.element.groupId)?.layer] ?? 1;
    const secondLayer = layers[groups.get(second.element.groupId)?.layer] ?? 1;
    return firstLayer - secondLayer || first.index - second.index;
  }).map(({ element }) => {
    const progress = revealProgress(element, timeMs);
    const organic = resolveOrganic(scene, element);
    const primary = renderShape(element, progress, organic);
    const duplicate = organic?.duplicateSketch && element.type !== 'label' && element.type !== 'number'
      ? `<g data-sketch="duplicate" opacity="0.24">${renderShape(element, progress, organic, 'duplicate')}</g>`
      : '';
    return `<g id="${escapeXml(element.id)}">${primary}${duplicate}</g>`;
  }).join('');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${scene.canvas.width}" height="${scene.canvas.height}" viewBox="0 0 ${scene.canvas.width} ${scene.canvas.height}">
  <defs><marker id="arrowhead" markerWidth="12" markerHeight="12" refX="10" refY="5" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="${DEFAULT_STROKE}"/></marker></defs>
  <rect width="100%" height="100%" fill="${scene.background ?? '#fffaf0'}"/>
  ${elements}
</svg>`;
}
import { resolveOrganic, seededValue, wobblePathData } from './organic.js';

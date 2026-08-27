const ink = '#263238';
const coral = '#ed6a5a';
const mint = '#74b49b';
const gold = '#f1c453';
const blue = '#6f9fd8';
const paper = '#fffaf0';

export const primitiveNames = [
  'person', 'building', 'document', 'money-bag', 'light-bulb', 'cloud', 'factory', 'screen',
  'simple-chart', 'emotion-mark', 'arrow-family', 'circle-annotation', 'underline', 'cross-out', 'emphasis-strokes', 'role-person', 'resource-stack',
];

function createTools({ id, x, y, scale = 1, startMs = 0 }) {
  const p = (value) => Number((value * scale).toFixed(2));
  const px = (value) => Number((x + p(value)).toFixed(2));
  const py = (value) => Number((y + p(value)).toFixed(2));
  const bounds = (left, top, width, height) => ({ x: px(left), y: py(top), width: p(width), height: p(height) });
  const reveal = (offset = 0, duration = 460) => ({ startMs: startMs + offset, endMs: startMs + offset + duration });
  const path = (suffix, d, area, offset = 0, stroke = ink) => ({ id: `${id}-${suffix}`, type: 'path', d, stroke, fill: 'none', bounds: area, reveal: reveal(offset) });
  const box = (suffix, left, top, width, height, offset = 0, fill = paper, stroke = ink) => ({ id: `${id}-${suffix}`, type: 'box', x: px(left), y: py(top), width: p(width), height: p(height), rx: p(14), fill, stroke, bounds: bounds(left, top, width, height), reveal: reveal(offset) });
  const circle = (suffix, cx, cy, r, offset = 0, fill = paper, stroke = ink) => ({ id: `${id}-${suffix}`, type: 'circle', cx: px(cx), cy: py(cy), r: p(r), fill, stroke, bounds: bounds(cx - r, cy - r, r * 2, r * 2), reveal: reveal(offset) });
  const arrow = (suffix, x1, y1, x2, y2, offset = 0, stroke = ink) => ({ id: `${id}-${suffix}`, type: 'arrow', x1: px(x1), y1: py(y1), x2: px(x2), y2: py(y2), stroke, bounds: bounds(Math.min(x1, x2), Math.min(y1, y2) - 18, Math.abs(x2 - x1), Math.abs(y2 - y1) + 36), reveal: reveal(offset) });
  return { p, px, py, bounds, path, box, circle, arrow };
}

export function createPrimitive(name, options) {
  if (!primitiveNames.includes(name)) throw new Error(`unknown primitive: ${name}`);
  const { px, py, bounds, path, box, circle, arrow } = createTools(options);
  const d = (parts) => parts.join(' ');
  switch (name) {
    case 'person': return [circle('head', 60, 30, 22, 0, '#e8eff9', blue), path('body', d(['M', px(60), py(54), 'L', px(60), py(120), 'M', px(28), py(82), 'L', px(92), py(82), 'M', px(60), py(120), 'L', px(32), py(164), 'M', px(60), py(120), 'L', px(88), py(164)]), bounds(24, 50, 72, 118), 260, ink)];
    case 'building': return [box('body', 20, 40, 100, 120, 0, '#e8f4ef', mint), path('roof', d(['M', px(10), py(40), 'L', px(70), py(4), 'L', px(130), py(40), 'M', px(48), py(70), 'L', px(48), py(105), 'M', px(92), py(70), 'L', px(92), py(105)]), bounds(10, 4, 120, 105), 260, ink)];
    case 'document': return [box('page', 20, 10, 105, 145, 0, '#fffdf7', gold), path('fold-lines', d(['M', px(92), py(10), 'L', px(125), py(43), 'L', px(92), py(43), 'M', px(43), py(70), 'L', px(103), py(70), 'M', px(43), py(95), 'L', px(103), py(95), 'M', px(43), py(120), 'L', px(82), py(120)]), bounds(40, 8, 88, 118), 260, ink)];
    case 'money-bag': return [path('bag', d(['M', px(42), py(35), 'Q', px(70), py(55), px(98), py(35), 'M', px(42), py(35), 'Q', px(10), py(150), px(70), py(165), 'Q', px(130), py(150), px(98), py(35)]), bounds(10, 32, 120, 136), 0, gold), path('mark', d(['M', px(70), py(78), 'Q', px(45), py(105), px(70), py(130), 'Q', px(95), py(105), px(70), py(78)]), bounds(42, 75, 56, 58), 280, coral)];
    case 'light-bulb': return [circle('globe', 70, 58, 43, 0, '#fff5cb', gold), path('base-rays', d(['M', px(50), py(102), 'L', px(90), py(102), 'M', px(54), py(118), 'L', px(86), py(118), 'M', px(70), py(1), 'L', px(70), py(18), 'M', px(17), py(25), 'L', px(30), py(35), 'M', px(123), py(25), 'L', px(110), py(35)]), bounds(15, 0, 110, 122), 250, ink)];
    case 'cloud': return [path('cloud', d(['M', px(20), py(120), 'C', px(-5), py(78), px(48), py(56), px(70), py(82), 'C', px(92), py(38), px(155), py(66), px(145), py(106), 'C', px(180), py(112), px(165), py(150), px(130), py(145), 'L', px(42), py(145), 'C', px(8), py(150), px(0), py(128), px(20), py(120)]), bounds(0, 52, 170, 100), 0, blue)];
    case 'factory': return [box('base', 12, 70, 135, 90, 0, '#e8eff9', blue), path('roof-stack', d(['M', px(12), py(70), 'L', px(45), py(42), 'L', px(72), py(70), 'L', px(98), py(42), 'L', px(126), py(70), 'M', px(115), py(42), 'L', px(115), py(5), 'M', px(126), py(5), 'C', px(155), py(8), px(152), py(38), px(126), py(30)]), bounds(10, 2, 148, 160), 260, ink)];
    case 'screen': return [box('display', 10, 18, 145, 92, 0, '#e8eff9', blue), path('stand', d(['M', px(82), py(110), 'L', px(82), py(140), 'M', px(45), py(140), 'L', px(120), py(140)]), bounds(43, 108, 80, 35), 260, ink)];
    case 'simple-chart': return [path('axes', d(['M', px(20), py(145), 'L', px(20), py(22), 'M', px(20), py(145), 'L', px(155), py(145)]), bounds(18, 20, 140, 128), 0, ink), path('trend', d(['M', px(34), py(124), 'L', px(68), py(94), 'L', px(96), py(108), 'L', px(140), py(45)]), bounds(30, 42, 114, 85), 300, coral)];
    case 'emotion-mark': return [circle('face', 70, 70, 56, 0, '#fff7dc', gold), path('smile', d(['M', px(47), py(56), 'L', px(52), py(56), 'M', px(88), py(56), 'L', px(93), py(56), 'M', px(45), py(92), 'Q', px(70), py(118), px(97), py(90)]), bounds(42, 52, 58, 70), 260, ink)];
    case 'arrow-family': return [arrow('forward', 10, 50, 145, 50, 0, coral), path('curve', d(['M', px(25), py(130), 'Q', px(80), py(82), px(140), py(130)]), bounds(20, 78, 125, 56), 250, mint)];
    case 'circle-annotation': return [circle('ring', 75, 75, 58, 0, 'none', coral), path('tail', d(['M', px(122), py(122), 'L', px(158), py(150)]), bounds(120, 120, 40, 34), 260, coral)];
    case 'underline': return [path('line', d(['M', px(10), py(105), 'Q', px(75), py(120), px(155), py(102)]), bounds(8, 98, 150, 28), 0, coral)];
    case 'cross-out': return [path('cross', d(['M', px(20), py(35), 'L', px(145), py(130), 'M', px(145), py(35), 'L', px(20), py(130)]), bounds(18, 32, 130, 102), 0, coral)];
    case 'emphasis-strokes': return [path('marks', d(['M', px(70), py(72), 'L', px(70), py(5), 'M', px(24), py(72), 'L', px(5), py(40), 'M', px(116), py(72), 'L', px(135), py(40), 'M', px(31), py(108), 'L', px(8), py(128), 'M', px(109), py(108), 'L', px(132), py(128)]), bounds(3, 2, 134, 130), 0, gold)];
    case 'role-person': return [circle('head', 58, 28, 21, 0, '#e8eff9', blue), box('badge', 28, 70, 60, 28, 180, '#fff5cb', gold), path('body', d(['M', px(58), py(50), 'L', px(58), py(142), 'M', px(22), py(86), 'L', px(94), py(86), 'M', px(58), py(142), 'L', px(28), py(178), 'M', px(58), py(142), 'L', px(88), py(178)]), bounds(20, 48, 78, 132), 260, ink)];
    case 'resource-stack': return [box('block-one', 10, 78, 120, 42, 0, '#fff5cb', gold), box('block-two', 24, 42, 120, 42, 180, '#e8f4ef', mint), box('block-three', 38, 6, 120, 42, 360, '#e8eff9', blue), path('marks', d(['M', px(56), py(98), 'L', px(88), py(98), 'M', px(70), py(62), 'L', px(102), py(62), 'M', px(84), py(26), 'L', px(116), py(26)]), bounds(52, 20, 70, 86), 520, ink)];
    default: throw new Error(`unknown primitive: ${name}`);
  }
}

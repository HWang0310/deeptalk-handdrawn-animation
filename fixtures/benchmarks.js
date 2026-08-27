const ink = '#263238';
const paper = '#fffaf0';
const coral = '#ed6a5a';
const mint = '#74b49b';
const gold = '#f1c453';
const blue = '#6f9fd8';

const bounds = (x, y, width, height) => ({ x, y, width, height });
const reveal = (startMs, endMs) => ({ startMs, endMs });
const label = (id, text, x, y, startMs, color = ink, size = 44) => ({
  id, type: 'label', text, x, y, fontSize: size, color, bounds: bounds(x, y - size, Math.max(90, text.length * size), size + 12), reveal: reveal(startMs, startMs + 520),
});
const box = (id, x, y, width, height, startMs, fill = paper, stroke = ink) => ({
  id, type: 'box', x, y, width, height, rx: 30, fill, stroke, bounds: bounds(x, y, width, height), reveal: reveal(startMs, startMs + 600),
});
const circle = (id, cx, cy, r, startMs, fill = paper, stroke = ink) => ({
  id, type: 'circle', cx, cy, r, fill, stroke, bounds: bounds(cx - r, cy - r, r * 2, r * 2), reveal: reveal(startMs, startMs + 480),
});
const path = (id, d, area, startMs, stroke = ink) => ({
  id, type: 'path', d, stroke, fill: 'none', bounds: area, reveal: reveal(startMs, startMs + 700),
});
const arrow = (id, x1, y1, x2, y2, startMs, color = ink) => ({
  id, type: 'arrow', x1, y1, x2, y2, stroke: color, bounds: bounds(Math.min(x1, x2), Math.min(y1, y2) - 30, Math.abs(x2 - x1), Math.abs(y2 - y1) + 60), reveal: reveal(startMs, startMs + 500),
});

export const benchmarks = [
  {
    id: 'core-object', title: '核心物体：点亮灯笼', durationMs: 4000, canvas: { width: 1920, height: 1080 },
    elements: [
      label('title', '一盏灯，照亮一个判断', 610, 150, 0, ink, 58),
      path('lantern-top', 'M 825 300 Q 960 220 1095 300', bounds(815, 210, 290, 110), 280),
      box('lantern', 825, 300, 270, 340, 780, '#fff5cb'),
      path('lantern-ribs', 'M 892 320 L 892 620 M 960 305 L 960 635 M 1028 320 L 1028 620', bounds(882, 295, 156, 345), 1400, coral),
      path('tassel', 'M 960 640 L 960 760 M 925 740 Q 960 785 995 740', bounds(915, 630, 90, 170), 2050, gold),
      { ...circle('glow', 960, 470, 210, 2600, '#fff0a8', gold), fillOpacity: 0.18 },
      label('caption', '聚焦', 905, 875, 3200, coral, 58),
    ],
  },
  {
    id: 'relationship', title: '对象关系：清晰交接', durationMs: 5000, canvas: { width: 1920, height: 1080 },
    elements: [
      label('title', '信息不是堆积，而是交接', 540, 150, 0, ink, 58),
      circle('sender', 480, 510, 130, 350, '#e8f4ef', mint),
      label('sender-label', '提出者', 400, 735, 850, ink, 46),
      box('message', 805, 430, 300, 160, 1200, '#fff2d8', gold),
      label('message-label', '关键问题', 855, 530, 1650, ink, 46),
      arrow('handoff', 625, 510, 795, 510, 2050, coral),
      arrow('receive', 1115, 510, 1285, 510, 2700, coral),
      circle('receiver', 1440, 510, 130, 3250, '#e8eff9', blue),
      label('receiver-label', '执行者', 1360, 735, 3750, ink, 46),
    ],
  },
  {
    id: 'causal-chain', title: '因果链：堵点会传导', durationMs: 6000, canvas: { width: 1920, height: 1080 },
    elements: [
      label('title', '一个堵点，会拖慢整条链路', 530, 150, 0, ink, 58),
      box('input', 220, 450, 280, 180, 300, '#e8f4ef', mint), label('input-label', '输入', 305, 560, 750, ink, 48),
      arrow('flow-1', 510, 540, 720, 540, 1200, ink),
      box('block', 730, 450, 280, 180, 1700, '#fff0ef', coral), label('block-label', '堵点', 815, 560, 2150, ink, 48),
      path('crack', 'M 850 470 L 900 520 L 850 590 L 920 625', bounds(840, 460, 90, 180), 2550, coral),
      arrow('flow-2', 1020, 540, 1230, 540, 3200, coral),
      box('delay', 1240, 450, 280, 180, 3700, '#fff7dc', gold), label('delay-label', '延迟', 1325, 560, 4150, ink, 48),
      label('caption', '后果在下游才显现', 685, 835, 4900, coral, 54),
    ],
  },
  {
    id: 'number-label', title: '数字标签：从 32 到 78', durationMs: 4000, canvas: { width: 1920, height: 1080 },
    elements: [
      label('title', '关键指标正在抬升', 650, 150, 0, ink, 58),
      path('axis', 'M 430 760 L 1490 760', bounds(420, 745, 1090, 30), 250),
      box('bar-old', 620, 570, 200, 190, 720, '#dce9f8', blue), label('old-number', '32', 665, 690, 1200, ink, 64),
      box('bar-new', 1080, 330, 200, 430, 1750, '#ffe6df', coral), label('new-number', '78', 1125, 545, 2250, ink, 64),
      arrow('rise', 850, 660, 1050, 440, 2750, coral),
      label('caption', '活跃度', 820, 890, 3250, ink, 52),
    ],
  },
  {
    id: 'process', title: '流程：三个阶段，逐步清楚', durationMs: 6000, canvas: { width: 1920, height: 1080 },
    elements: [
      label('title', '把复杂流程拆成可见阶段', 520, 150, 0, ink, 58),
      box('collect', 270, 430, 350, 250, 350, '#e8f4ef', mint), label('collect-label', '收集', 370, 570, 850, ink, 54),
      arrow('step-1', 630, 555, 775, 555, 1300, ink),
      box('sort', 785, 430, 350, 250, 1800, '#fff7dc', gold), label('sort-label', '整理', 885, 570, 2300, ink, 54),
      arrow('step-2', 1145, 555, 1290, 555, 2800, ink),
      box('decide', 1300, 430, 350, 250, 3300, '#ffe6df', coral), label('decide-label', '决定', 1400, 570, 3800, ink, 54),
      label('caption', '每一步都有明确输出', 690, 875, 4650, blue, 52),
    ],
  },
  {
    id: 'abstract-mechanism', title: '抽象机制：反馈稳定系统', durationMs: 7000, canvas: { width: 1920, height: 1080 },
    elements: [
      label('title', '反馈不是重复，而是校正', 600, 150, 0, ink, 58),
      circle('system', 960, 530, 190, 400, '#e8eff9', blue), label('system-label', '系统', 895, 550, 900, ink, 54),
      arrow('pressure', 360, 530, 750, 530, 1450, coral), label('pressure-label', '压力', 480, 445, 1900, coral, 46),
      arrow('response', 1170, 530, 1560, 530, 2500, mint), label('response-label', '响应', 1320, 445, 2950, mint, 46),
      path('feedback-loop', 'M 1560 620 C 1560 890 360 890 360 620', bounds(350, 610, 1220, 300), 3600, gold),
      arrow('return', 380, 620, 430, 590, 4400, gold),
      label('caption', '观察 → 调整 → 稳定', 660, 970, 5350, ink, 52),
    ],
  },
  {
    id: 'progressive-complexity', title: '渐进复杂：一张图长出网络', durationMs: 8000, canvas: { width: 1920, height: 1080 },
    elements: [
      label('title', '先看一个点，再看一张网', 610, 130, 0, ink, 58),
      circle('hub', 960, 540, 95, 400, '#fff2d8', gold), label('hub-label', '核心', 905, 555, 850, ink, 44),
      circle('node-a', 560, 360, 70, 1500, '#e8f4ef', mint), circle('node-b', 1380, 350, 70, 2100, '#e8eff9', blue),
      circle('node-c', 500, 760, 70, 2700, '#ffe6df', coral), circle('node-d', 1420, 760, 70, 3300, '#e8f4ef', mint),
      arrow('link-a', 620, 385, 870, 500, 3900, ink), arrow('link-b', 1315, 380, 1050, 505, 4500, ink),
      arrow('link-c', 570, 720, 875, 575, 5100, ink), arrow('link-d', 1350, 720, 1045, 575, 5700, ink),
      path('route', 'M 560 360 Q 960 190 1380 350 Q 1680 550 1420 760', bounds(550, 180, 1140, 600), 6300, coral),
      label('caption', '复杂度来自关系，不来自装饰', 585, 980, 7200, coral, 50),
    ],
  },
];

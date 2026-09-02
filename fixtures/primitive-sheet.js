import { createPrimitive, primitiveNames } from '../src/primitives.js';

const label = (id, text, x, y, startMs) => ({
  id, type: 'label', text, x, y, fontSize: 30, color: '#263238',
  bounds: { x, y: y - 34, width: 220, height: 44 }, reveal: { startMs, endMs: startMs + 360 },
});

const chineseNames = ['人物', '建筑', '文档', '钱袋', '灯泡', '云朵', '工厂', '屏幕', '折线图', '情绪', '箭头', '圈注', '下划线', '划除', '强调线', '角色', '资源堆叠'];
const grid = { columns: 6, startX: 100, startY: 210, columnGap: 300, rowGap: 290 };

export const primitiveSheet = {
  id: 'primitive-vocabulary', title: 'V1.1 原创手绘图元', durationMs: 10000, canvas: { width: 1920, height: 1080 },
  style: { organic: { seed: 'primitive-v11', wobble: 1.5, widthVariance: 0.14, duplicateSketch: true } },
  motion: { finalHoldMs: 900 },
  elements: [
    label('title', '原创手绘图元：可组合，不复制参考', 560, 100, 0),
    ...primitiveNames.flatMap((name, index) => {
      const column = index % grid.columns;
      const row = Math.floor(index / grid.columns);
      const x = grid.startX + column * grid.columnGap;
      const y = grid.startY + row * grid.rowGap;
      const startMs = 320 + index * 510;
      return [...createPrimitive(name, { id: name, x, y, scale: 0.82, startMs }), label(`${name}-label`, chineseNames[index], x + 5, y + 190, startMs + 360)];
    }),
  ],
};

import type { ProblemVisual } from '../data/subjects/utils';

const COLORS = {
  text: '#f8fafc',
  muted: '#94a3b8',
  primary: '#22d3ee',
  secondary: '#60a5fa',
  accent: '#fbbf24',
  danger: '#fb7185',
  good: '#34d399',
  purple: '#c084fc',
  leaf: '#4ade80',
  line: 'rgba(226, 232, 240, 0.72)',
};

const text = (
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  size = 9,
  color = COLORS.text,
  align: CanvasTextAlign = 'center',
) => {
  ctx.fillStyle = color;
  ctx.font = `700 ${size}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
};

const line = (
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color = COLORS.line,
  width = 2,
) => {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
};

const arrow = (
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color = COLORS.primary,
  width = 2,
) => {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  line(ctx, x1, y1, x2, y2, color, width);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 7 * Math.cos(angle - Math.PI / 6), y2 - 7 * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - 7 * Math.cos(angle + Math.PI / 6), y2 - 7 * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
};

const roundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius = 8,
) => {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
};

const title = (ctx: CanvasRenderingContext2D, value?: string) => {
  if (value) text(ctx, value, 130, 14, 11, COLORS.muted);
};

const circle = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, fill: string, stroke?: string) => {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
};

const drawLeaf = (ctx: CanvasRenderingContext2D, x: number, y: number, mirror = false) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(mirror ? -1 : 1, 1);
  ctx.fillStyle = 'rgba(74, 222, 128, 0.42)';
  ctx.strokeStyle = COLORS.leaf;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(22, -18, 40, 1);
  ctx.quadraticCurveTo(21, 17, 0, 0);
  ctx.fill();
  ctx.stroke();
  line(ctx, 2, 0, 32, 0, 'rgba(248,250,252,0.45)', 1);
  ctx.restore();
};

const drawPlantAnatomy = (ctx: CanvasRenderingContext2D, visual: Extract<ProblemVisual, { kind: 'plant_anatomy' }>) => {
  title(ctx, visual.title);
  const stemX = 130;
  const rootY = 145;
  line(ctx, stemX, 47, stemX, rootY, COLORS.good, 7);
  drawLeaf(ctx, stemX - 2, 67, false);
  drawLeaf(ctx, stemX + 2, 91, true);
  line(ctx, stemX, rootY - 2, 103, 165, '#d6b079', 3);
  line(ctx, stemX, rootY - 2, 117, 169, '#d6b079', 3);
  line(ctx, stemX, rootY - 2, 143, 169, '#d6b079', 3);
  line(ctx, stemX, rootY - 2, 157, 165, '#d6b079', 3);

  if (visual.mode === 'photosynthesis') {
    arrow(ctx, 39, 64, 85, 67, COLORS.accent, 2.5);
    text(ctx, '日光', 42, 49, 8, COLORS.accent);
    arrow(ctx, 54, 91, 91, 86, COLORS.primary, 2.5);
    text(ctx, 'CO₂', 55, 106, 8, COLORS.primary);
    arrow(ctx, 167, 65, 216, 55, COLORS.good, 2.5);
    text(ctx, 'O₂', 213, 43, 8, COLORS.good);
    text(ctx, '葉で養分をつくる', 130, 126, 9, COLORS.text);
    text(ctx, '光合成', 130, 160, 10, COLORS.accent);
    return;
  }

  arrow(ctx, 116, 151, 116, 57, COLORS.secondary, 3);
  arrow(ctx, 144, 58, 144, 140, COLORS.accent, 3);
  text(ctx, '水・無機養分', 69, 116, 8, COLORS.secondary);
  text(ctx, '道管 ↑', 103, 83, 8, COLORS.secondary);
  text(ctx, '養分', 184, 103, 8, COLORS.accent);
  text(ctx, '師管 ↓', 160, 83, 8, COLORS.accent);
  text(ctx, '根', 130, 168, 8, COLORS.muted);
};

const drawHeart = (ctx: CanvasRenderingContext2D, x: number, y: number, size = 16) => {
  ctx.fillStyle = COLORS.danger;
  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.9);
  ctx.bezierCurveTo(x - size * 1.3, y + size * 0.15, x - size * 0.9, y - size * 0.75, x, y - size * 0.18);
  ctx.bezierCurveTo(x + size * 0.9, y - size * 0.75, x + size * 1.3, y + size * 0.15, x, y + size * 0.9);
  ctx.fill();
};

const drawLungs = (ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1) => {
  ctx.fillStyle = 'rgba(96, 165, 250, 0.26)';
  ctx.strokeStyle = COLORS.secondary;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(x - 12 * scale, y, 10 * scale, 18 * scale, -0.15, 0, Math.PI * 2);
  ctx.ellipse(x + 12 * scale, y, 10 * scale, 18 * scale, 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  line(ctx, x, y - 26 * scale, x, y - 5 * scale, COLORS.line, 2);
};

const drawBodySystem = (ctx: CanvasRenderingContext2D, visual: Extract<ProblemVisual, { kind: 'body_system' }>) => {
  title(ctx, visual.title);

  if (visual.mode === 'digestion') {
    const ys = [44, 72, 104, 139];
    const labels = ['口', '胃', '小腸', '大腸'];
    labels.forEach((label, index) => {
      circle(ctx, 130, ys[index], index === 2 ? 13 : 10, index === 2 ? 'rgba(251,191,36,0.35)' : 'rgba(96,165,250,0.25)', index === 2 ? COLORS.accent : COLORS.secondary);
      text(ctx, label, 130, ys[index], 8, COLORS.text);
      if (index < labels.length - 1) arrow(ctx, 130, ys[index] + 12, 130, ys[index + 1] - 14, COLORS.primary, 2);
    });
    text(ctx, '養分を吸収', 178, ys[2], 8, COLORS.accent, 'left');
    return;
  }

  if (visual.mode === 'respiration') {
    drawLungs(ctx, 130, 86, 1.6);
    arrow(ctx, 48, 69, 95, 75, COLORS.primary, 2.5);
    arrow(ctx, 165, 97, 214, 108, COLORS.danger, 2.5);
    text(ctx, 'O₂', 47, 54, 9, COLORS.primary);
    text(ctx, 'CO₂', 215, 123, 9, COLORS.danger);
    text(ctx, '肺胞で気体交換', 130, 145, 9, COLORS.text);
    return;
  }

  if (visual.mode === 'integrated') {
    const panels = [
      { x: 28, label: '肺', sub: '酸素', color: COLORS.secondary },
      { x: 103, label: '心臓', sub: '血液', color: COLORS.danger },
      { x: 178, label: '小腸', sub: '養分', color: COLORS.accent },
    ];
    panels.forEach((panel) => {
      roundedRect(ctx, panel.x, 53, 54, 58, 8);
      ctx.fillStyle = 'rgba(15,23,42,0.58)';
      ctx.fill();
      ctx.strokeStyle = panel.color;
      ctx.lineWidth = 1.8;
      ctx.stroke();
      text(ctx, panel.label, panel.x + 27, 72, 9, panel.color);
      text(ctx, panel.sub, panel.x + 27, 96, 8, COLORS.text);
    });
    arrow(ctx, 82, 82, 101, 82, COLORS.secondary, 2.3);
    arrow(ctx, 178, 82, 159, 82, COLORS.accent, 2.3);
    arrow(ctx, 130, 117, 130, 147, COLORS.danger, 2.7);
    text(ctx, '全身の細胞へ', 130, 159, 9, COLORS.text);
    return;
  }

  drawLungs(ctx, 130, 54, 0.8);
  drawHeart(ctx, 130, 96, 13);
  roundedRect(ctx, 92, 132, 76, 26, 10);
  ctx.fillStyle = 'rgba(52,211,153,0.12)';
  ctx.fill();
  ctx.strokeStyle = COLORS.good;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  text(ctx, '全身', 130, 145, 8, COLORS.good);
  arrow(ctx, 115, 68, 117, 89, COLORS.secondary, 2.2);
  arrow(ctx, 142, 105, 151, 132, COLORS.danger, 2.2);
  arrow(ctx, 108, 132, 114, 105, COLORS.secondary, 2.2);
  arrow(ctx, 143, 89, 145, 68, COLORS.danger, 2.2);
  text(ctx, '肺循環', 76, 79, 8, COLORS.secondary);
  text(ctx, '体循環', 186, 121, 8, COLORS.danger);
};

const drawCellPanel = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  plant: boolean,
) => {
  if (plant) {
    roundedRect(ctx, x, y, width, height, 8);
    ctx.fillStyle = 'rgba(74,222,128,0.08)';
    ctx.fill();
    ctx.strokeStyle = COLORS.good;
    ctx.lineWidth = 3;
    ctx.stroke();
    roundedRect(ctx, x + 5, y + 5, width - 10, height - 10, 7);
    ctx.strokeStyle = COLORS.primary;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    roundedRect(ctx, x + 28, y + 18, 38, 45, 9);
    ctx.fillStyle = 'rgba(96,165,250,0.15)';
    ctx.fill();
    ctx.strokeStyle = COLORS.secondary;
    ctx.stroke();
    [[18, 17], [72, 20], [18, 55], [72, 53]].forEach(([dx, dy]) => circle(ctx, x + dx, y + dy, 4, COLORS.leaf));
    circle(ctx, x + 18, y + 38, 7, COLORS.purple);
  } else {
    ctx.fillStyle = 'rgba(96,165,250,0.10)';
    ctx.strokeStyle = COLORS.primary;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    circle(ctx, x + width / 2 - 9, y + height / 2, 8, COLORS.purple);
  }
};

const drawCellDiagram = (ctx: CanvasRenderingContext2D, visual: Extract<ProblemVisual, { kind: 'cell_diagram' }>) => {
  title(ctx, visual.title);
  if (visual.mode === 'division') {
    circle(ctx, 74, 91, 30, 'rgba(96,165,250,0.12)', COLORS.primary);
    circle(ctx, 74, 91, 10, COLORS.purple);
    arrow(ctx, 111, 91, 145, 91, COLORS.accent, 2.7);
    circle(ctx, 176, 72, 24, 'rgba(96,165,250,0.12)', COLORS.primary);
    circle(ctx, 176, 110, 24, 'rgba(96,165,250,0.12)', COLORS.primary);
    circle(ctx, 176, 72, 7, COLORS.purple);
    circle(ctx, 176, 110, 7, COLORS.purple);
    text(ctx, '1個', 74, 138, 8, COLORS.muted);
    text(ctx, '2個', 176, 145, 8, COLORS.accent);
    text(ctx, '細胞分裂', 130, 161, 9, COLORS.text);
    return;
  }

  drawCellPanel(ctx, 23, 53, 91, 79, true);
  drawCellPanel(ctx, 154, 56, 78, 72, false);
  text(ctx, '植物細胞', 68, 145, 9, COLORS.good);
  text(ctx, '動物細胞', 193, 145, 9, COLORS.primary);
  text(ctx, '核', 41, 91, 7, COLORS.purple);
  text(ctx, '葉緑体', 50, 61, 7, COLORS.leaf);
  text(ctx, '細胞壁', 68, 40, 7, COLORS.good);
  text(ctx, '核', 184, 91, 7, COLORS.purple);
  text(ctx, 'どちらにも核・細胞膜', 130, 164, 8, COLORS.text);
};

const gametesFromParent = (parent: string): [string, string] => {
  const symbols = parent.replace(/\s/g, '').split('').filter(Boolean);
  if (symbols.length >= 2) return [symbols[0], symbols[1]];
  if (symbols.length === 1) return [symbols[0], symbols[0]];
  return ['A', 'a'];
};

const combineGenes = (left: string, top: string) => {
  const values = [left, top].sort((a, b) => {
    const upperA = a === a.toUpperCase();
    const upperB = b === b.toUpperCase();
    if (upperA !== upperB) return upperA ? -1 : 1;
    return a.localeCompare(b);
  });
  return values.join('');
};

const drawPunnettSquare = (ctx: CanvasRenderingContext2D, visual: Extract<ProblemVisual, { kind: 'punnett_square' }>) => {
  title(ctx, visual.title);
  const topGenes = gametesFromParent(visual.parentA);
  const leftGenes = gametesFromParent(visual.parentB);
  const x = 90;
  const y = 57;
  const cell = 42;
  text(ctx, `${visual.parentA} × ${visual.parentB}`, 130, 35, 10, COLORS.accent);
  topGenes.forEach((gene, index) => text(ctx, gene, x + cell * (index + 0.5), y - 12, 10, COLORS.primary));
  leftGenes.forEach((gene, index) => text(ctx, gene, x - 13, y + cell * (index + 0.5), 10, COLORS.secondary));
  for (let row = 0; row < 2; row += 1) {
    for (let col = 0; col < 2; col += 1) {
      const result = combineGenes(leftGenes[row], topGenes[col]);
      ctx.fillStyle = result.toLowerCase() === result ? 'rgba(192,132,252,0.16)' : 'rgba(52,211,153,0.13)';
      ctx.fillRect(x + col * cell, y + row * cell, cell, cell);
      ctx.strokeStyle = COLORS.line;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + col * cell, y + row * cell, cell, cell);
      text(ctx, result, x + col * cell + cell / 2, y + row * cell + cell / 2, 10, result.toLowerCase() === result ? COLORS.purple : COLORS.good);
    }
  }
  text(ctx, visual.dominantLabel ?? 'AA : Aa : aa = 1 : 2 : 1', 130, 155, 8, COLORS.text);
  if (visual.recessiveLabel) text(ctx, visual.recessiveLabel, 130, 169, 7, COLORS.muted);
};

const node = (ctx: CanvasRenderingContext2D, x: number, y: number, label: string, color: string) => {
  roundedRect(ctx, x - 23, y - 12, 46, 24, 8);
  ctx.fillStyle = 'rgba(15,23,42,0.74)';
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  text(ctx, label, x, y, 7.5, color);
};

const drawFoodWeb = (ctx: CanvasRenderingContext2D, visual: Extract<ProblemVisual, { kind: 'food_web' }>) => {
  title(ctx, visual.title);
  if (visual.mode === 'chain') {
    const xs = [37, 99, 161, 223];
    const labels = ['植物', 'バッタ', 'カエル', 'ヘビ'];
    const colors = [COLORS.good, COLORS.accent, COLORS.primary, COLORS.danger];
    labels.forEach((label, index) => {
      node(ctx, xs[index], 91, label, colors[index]);
      if (index < labels.length - 1) arrow(ctx, xs[index] + 26, 91, xs[index + 1] - 26, 91, COLORS.muted, 1.8);
    });
    text(ctx, '食べられる → 食べる', 130, 132, 9, COLORS.text);
    text(ctx, '食物連鎖', 130, 157, 10, COLORS.accent);
    return;
  }

  if (visual.mode === 'cycle') {
    node(ctx, 130, 47, '植物', COLORS.good);
    node(ctx, 205, 96, '動物', COLORS.accent);
    node(ctx, 130, 143, '分解者', COLORS.purple);
    node(ctx, 55, 96, '無機養分', COLORS.secondary);
    arrow(ctx, 153, 53, 183, 80, COLORS.accent, 2);
    arrow(ctx, 192, 111, 151, 135, COLORS.purple, 2);
    arrow(ctx, 107, 137, 76, 112, COLORS.secondary, 2);
    arrow(ctx, 68, 80, 107, 55, COLORS.good, 2);
    text(ctx, '物質は循環する', 130, 166, 9, COLORS.text);
    return;
  }

  node(ctx, 45, 92, '植物', COLORS.good);
  node(ctx, 111, 58, '昆虫', COLORS.accent);
  node(ctx, 111, 126, 'ウサギ', COLORS.accent);
  node(ctx, 180, 62, '小鳥', COLORS.primary);
  node(ctx, 180, 125, 'カエル', COLORS.primary);
  node(ctx, 226, 93, 'タカ', COLORS.danger);
  arrow(ctx, 69, 82, 86, 66, COLORS.muted, 1.5);
  arrow(ctx, 69, 102, 86, 118, COLORS.muted, 1.5);
  arrow(ctx, 136, 59, 155, 61, COLORS.muted, 1.5);
  arrow(ctx, 133, 67, 160, 111, COLORS.muted, 1.5);
  arrow(ctx, 136, 124, 155, 124, COLORS.muted, 1.5);
  arrow(ctx, 202, 67, 211, 80, COLORS.muted, 1.5);
  arrow(ctx, 202, 117, 211, 105, COLORS.muted, 1.5);
  text(ctx, '1本ではなく網のようにつながる', 130, 162, 8, COLORS.text);
};

export const drawScienceBiologyProblemVisual = (
  ctx: CanvasRenderingContext2D,
  visual: ProblemVisual,
  _w: number,
  _h: number,
): boolean => {
  switch (visual.kind) {
    case 'plant_anatomy':
      drawPlantAnatomy(ctx, visual);
      return true;
    case 'body_system':
      drawBodySystem(ctx, visual);
      return true;
    case 'cell_diagram':
      drawCellDiagram(ctx, visual);
      return true;
    case 'punnett_square':
      drawPunnettSquare(ctx, visual);
      return true;
    case 'food_web':
      drawFoodWeb(ctx, visual);
      return true;
    default:
      return false;
  }
};

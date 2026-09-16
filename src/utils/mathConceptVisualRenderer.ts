import type { ProblemVisual } from '../data/subjects/utils';

const COLORS = {
  text: '#f8fafc',
  muted: '#94a3b8',
  primary: '#22d3ee',
  secondary: '#60a5fa',
  accent: '#fbbf24',
  danger: '#fb7185',
  line: 'rgba(226, 232, 240, 0.72)',
  grid: 'rgba(148, 163, 184, 0.24)',
};

const fillText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  color = COLORS.text,
  align: CanvasTextAlign = 'center',
) => {
  ctx.fillStyle = color;
  ctx.font = `700 ${size}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
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

const drawAreaGrid = (
  ctx: CanvasRenderingContext2D,
  visual: Extract<ProblemVisual, { kind: 'area_grid' }>,
  w: number,
  h: number,
) => {
  const widthUnits = Math.max(1, Math.round(visual.widthUnits));
  const heightUnits = Math.max(1, Math.round(visual.heightUnits));
  const shape = visual.shape ?? 'rectangle';
  const left = 48;
  const right = w - 32;
  const top = 28;
  const bottom = h - 42;

  const makeShapePath = () => {
    ctx.beginPath();
    if (shape === 'triangle') {
      ctx.moveTo(left, bottom);
      ctx.lineTo(right, bottom);
      ctx.lineTo(left, top);
    } else {
      ctx.rect(left, top, right - left, bottom - top);
    }
    ctx.closePath();
  };

  makeShapePath();
  ctx.fillStyle = 'rgba(34, 211, 238, 0.16)';
  ctx.fill();
  ctx.save();
  makeShapePath();
  ctx.clip();
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;
  for (let i = 1; i < widthUnits; i += 1) {
    const x = left + ((right - left) * i) / widthUnits;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
    ctx.stroke();
  }
  for (let i = 1; i < heightUnits; i += 1) {
    const y = top + ((bottom - top) * i) / heightUnits;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
  }
  ctx.restore();

  makeShapePath();
  ctx.strokeStyle = COLORS.primary;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  const widthText = visual.unknownWidth ? '?' : visual.widthLabel ?? `${widthUnits}`;
  const heightText = visual.unknownHeight ? '?' : visual.heightLabel ?? `${heightUnits}`;
  fillText(ctx, widthText, (left + right) / 2, bottom + 19, 12, visual.unknownWidth ? COLORS.accent : COLORS.text);
  fillText(ctx, heightText, 20, (top + bottom) / 2, 12, visual.unknownHeight ? COLORS.accent : COLORS.text, 'left');
  fillText(ctx, shape === 'triangle' ? '底辺 × 高さ ÷ 2' : 'たて × よこ', w / 2, 15, 10, COLORS.muted);
};

const drawUnitCubes = (
  ctx: CanvasRenderingContext2D,
  visual: Extract<ProblemVisual, { kind: 'unit_cubes' }>,
  w: number,
  h: number,
) => {
  const widthCount = Math.max(1, Math.round(visual.width));
  const depthCount = Math.max(1, Math.round(visual.depth));
  const heightCount = Math.max(1, Math.round(visual.height));
  const a = { x: 48, y: 140 };
  const b = { x: 177, y: 140 };
  const c = { x: 177, y: 66 };
  const d = { x: 48, y: 66 };
  const v = { x: 35, y: -25 };
  const b2 = { x: b.x + v.x, y: b.y + v.y };
  const c2 = { x: c.x + v.x, y: c.y + v.y };
  const d2 = { x: d.x + v.x, y: d.y + v.y };

  ctx.fillStyle = 'rgba(34, 211, 238, 0.12)';
  ctx.fillRect(a.x, d.y, b.x - a.x, a.y - d.y);
  ctx.beginPath();
  ctx.moveTo(d.x, d.y);
  ctx.lineTo(c.x, c.y);
  ctx.lineTo(c2.x, c2.y);
  ctx.lineTo(d2.x, d2.y);
  ctx.closePath();
  ctx.fillStyle = 'rgba(96, 165, 250, 0.18)';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(b.x, b.y);
  ctx.lineTo(c.x, c.y);
  ctx.lineTo(c2.x, c2.y);
  ctx.lineTo(b2.x, b2.y);
  ctx.closePath();
  ctx.fillStyle = 'rgba(251, 191, 36, 0.12)';
  ctx.fill();

  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 1;
  for (let i = 1; i < widthCount; i += 1) {
    const t = i / widthCount;
    const x = a.x + (b.x - a.x) * t;
    ctx.beginPath();
    ctx.moveTo(x, a.y);
    ctx.lineTo(x, d.y);
    ctx.moveTo(d.x + (c.x - d.x) * t, d.y);
    ctx.lineTo(d2.x + (c2.x - d2.x) * t, d2.y);
    ctx.stroke();
  }
  for (let i = 1; i < heightCount; i += 1) {
    const t = i / heightCount;
    const y = a.y + (d.y - a.y) * t;
    ctx.beginPath();
    ctx.moveTo(a.x, y);
    ctx.lineTo(b.x, y);
    ctx.moveTo(b.x, y);
    ctx.lineTo(b2.x, y + v.y);
    ctx.stroke();
  }
  for (let i = 1; i < depthCount; i += 1) {
    const t = i / depthCount;
    ctx.beginPath();
    ctx.moveTo(d.x + v.x * t, d.y + v.y * t);
    ctx.lineTo(c.x + v.x * t, c.y + v.y * t);
    ctx.moveTo(b.x + v.x * t, b.y + v.y * t);
    ctx.lineTo(c.x + v.x * t, c.y + v.y * t);
    ctx.stroke();
  }

  ctx.strokeStyle = COLORS.primary;
  ctx.lineWidth = 2.3;
  const edges: Array<[number, number, number, number]> = [
    [a.x, a.y, b.x, b.y], [b.x, b.y, c.x, c.y], [c.x, c.y, d.x, d.y], [d.x, d.y, a.x, a.y],
    [d.x, d.y, d2.x, d2.y], [c.x, c.y, c2.x, c2.y], [b.x, b.y, b2.x, b2.y],
    [d2.x, d2.y, c2.x, c2.y], [c2.x, c2.y, b2.x, b2.y], [b2.x, b2.y, b.x, b.y],
  ];
  edges.forEach(([x1, y1, x2, y2]) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  });

  fillText(ctx, visual.widthLabel ?? `${widthCount}`, (a.x + b.x) / 2, 156, 11, COLORS.text);
  fillText(ctx, visual.heightLabel ?? `${heightCount}`, 22, 101, 11, COLORS.text, 'left');
  fillText(ctx, visual.depthLabel ?? `${depthCount}`, 214, 48, 11, COLORS.text, 'right');
};

const drawProbabilityTree = (
  ctx: CanvasRenderingContext2D,
  visual: Extract<ProblemVisual, { kind: 'probability_tree' }>,
  w: number,
  h: number,
) => {
  const stages = visual.stages.slice(0, 6);
  if (!stages.length) return;
  const gap = w / (stages.length + 1);
  const y = 82;
  stages.forEach((stage, index) => {
    const x = gap * (index + 1);
    if (index > 0) {
      const prevX = gap * index;
      ctx.strokeStyle = COLORS.line;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(prevX + 18, y);
      ctx.lineTo(x - 18, y);
      ctx.stroke();
      fillText(ctx, '×', (prevX + x) / 2, y, 12, COLORS.accent);
    }
    roundedRect(ctx, x - 18, y - 22, 36, 44, 8);
    ctx.fillStyle = index % 2 === 0 ? 'rgba(34,211,238,0.16)' : 'rgba(96,165,250,0.16)';
    ctx.fill();
    ctx.strokeStyle = index % 2 === 0 ? COLORS.primary : COLORS.secondary;
    ctx.lineWidth = 1.7;
    ctx.stroke();
    fillText(ctx, `${stage.choices}`, x, y + 3, 15, COLORS.text);
    if (stage.label) fillText(ctx, stage.label, x, y - 33, 9, COLORS.muted);
    const branchCount = Math.min(5, Math.max(1, Math.round(stage.choices)));
    for (let branch = 0; branch < branchCount; branch += 1) {
      const bx = x - 12 + (branchCount === 1 ? 12 : (24 * branch) / (branchCount - 1));
      ctx.strokeStyle = 'rgba(148,163,184,0.38)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y + 22);
      ctx.lineTo(bx, y + 31);
      ctx.stroke();
    }
  });
  const equation = stages.map((stage) => stage.choices).join(' × ');
  fillText(ctx, `${equation} = ${visual.resultLabel ?? '?'}`, w / 2, h - 24, 12, COLORS.accent);
};

const drawDiceGrid = (
  ctx: CanvasRenderingContext2D,
  visual: Extract<ProblemVisual, { kind: 'dice_grid' }>,
  w: number,
  h: number,
) => {
  const highlighted = new Set((visual.highlightedFaces ?? []).filter((face) => face >= 1 && face <= 6));
  if (visual.label) fillText(ctx, visual.label, w / 2, 18, 11, COLORS.muted);
  const size = 46;
  const gapX = 13;
  const gapY = 12;
  const startX = (w - (3 * size + 2 * gapX)) / 2;
  const startY = 35;
  const pips: Record<number, Array<[number, number]>> = {
    1: [[0, 0]],
    2: [[-1, -1], [1, 1]],
    3: [[-1, -1], [0, 0], [1, 1]],
    4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
    5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
    6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
  };
  for (let face = 1; face <= 6; face += 1) {
    const index = face - 1;
    const col = index % 3;
    const row = Math.floor(index / 3);
    const x = startX + col * (size + gapX);
    const y = startY + row * (size + gapY);
    roundedRect(ctx, x, y, size, size, 9);
    ctx.fillStyle = highlighted.has(face) ? 'rgba(251,191,36,0.24)' : 'rgba(248,250,252,0.08)';
    ctx.fill();
    ctx.strokeStyle = highlighted.has(face) ? COLORS.accent : COLORS.line;
    ctx.lineWidth = highlighted.has(face) ? 2.5 : 1.4;
    ctx.stroke();
    pips[face].forEach(([px, py]) => {
      ctx.beginPath();
      ctx.arc(x + size / 2 + px * 10, y + size / 2 + py * 10, 3.2, 0, Math.PI * 2);
      ctx.fillStyle = highlighted.has(face) ? COLORS.accent : COLORS.text;
      ctx.fill();
    });
  }
  fillText(ctx, `当たり ${highlighted.size} / 6`, w / 2, h - 20, 12, COLORS.accent);
};

const drawSoroban = (
  ctx: CanvasRenderingContext2D,
  visual: Extract<ProblemVisual, { kind: 'soroban' }>,
  w: number,
  h: number,
) => {
  const digits = [visual.hundreds ?? 0, visual.tens ?? 0, visual.ones ?? 0].map((value) => Math.max(0, Math.min(9, Math.round(value))));
  const labels = ['百', '十', '一'];
  const xs = [80, 130, 180];
  const beamY = 82;
  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(46, beamY);
  ctx.lineTo(214, beamY);
  ctx.stroke();
  xs.forEach((x, index) => {
    ctx.strokeStyle = 'rgba(148,163,184,0.62)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, 28);
    ctx.lineTo(x, 158);
    ctx.stroke();
    fillText(ctx, labels[index], x, 16, 10, COLORS.muted);
    const digit = digits[index];
    const upperActive = digit >= 5;
    ctx.beginPath();
    ctx.ellipse(x, upperActive ? 67 : 48, 12, 6, 0, 0, Math.PI * 2);
    ctx.fillStyle = upperActive ? COLORS.accent : 'rgba(148,163,184,0.30)';
    ctx.fill();
    const lowerActive = digit % 5;
    for (let bead = 0; bead < 4; bead += 1) {
      const active = bead < lowerActive;
      const y = 100 + bead * 15;
      ctx.beginPath();
      ctx.ellipse(x, y, 12, 6, 0, 0, Math.PI * 2);
      ctx.fillStyle = active ? COLORS.primary : 'rgba(148,163,184,0.30)';
      ctx.fill();
    }
    fillText(ctx, String(digit), x, 169, 10, digit > 0 ? COLORS.text : COLORS.muted);
  });
};

const drawBalanceEquation = (
  ctx: CanvasRenderingContext2D,
  visual: Extract<ProblemVisual, { kind: 'balance_equation' }>,
  w: number,
  h: number,
) => {
  if (visual.focusLabel) fillText(ctx, visual.focusLabel, w / 2, 20, 11, COLORS.muted);
  const beamY = 112;
  const leftX = 72;
  const rightX = w - 72;
  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(42, beamY);
  ctx.lineTo(w - 42, beamY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w / 2, beamY + 1);
  ctx.lineTo(w / 2 - 18, h - 18);
  ctx.lineTo(w / 2 + 18, h - 18);
  ctx.closePath();
  ctx.fillStyle = 'rgba(96,165,250,0.25)';
  ctx.fill();
  const drawPan = (x: number, parts: string[], color: string) => {
    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(x - 34, beamY + 2);
    ctx.lineTo(x - 25, beamY + 20);
    ctx.lineTo(x + 25, beamY + 20);
    ctx.lineTo(x + 34, beamY + 2);
    ctx.stroke();
    const visible = parts.slice(0, 3);
    const boxW = Math.min(48, 108 / Math.max(1, visible.length));
    visible.forEach((part, index) => {
      const px = x + (index - (visible.length - 1) / 2) * (boxW + 4);
      roundedRect(ctx, px - boxW / 2, 58, boxW, 34, 7);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = color === 'rgba(34,211,238,0.18)' ? COLORS.primary : COLORS.secondary;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      fillText(ctx, part, px, 75, 11, COLORS.text);
    });
  };
  drawPan(leftX, visual.leftParts, 'rgba(34,211,238,0.18)');
  drawPan(rightX, visual.rightParts, 'rgba(96,165,250,0.18)');
  fillText(ctx, '=', w / 2, 75, 20, COLORS.accent);
};

export const drawMathConceptProblemVisual = (
  ctx: CanvasRenderingContext2D,
  visual: ProblemVisual,
  w: number,
  h: number,
): boolean => {
  switch (visual.kind) {
    case 'area_grid':
      drawAreaGrid(ctx, visual, w, h);
      return true;
    case 'unit_cubes':
      drawUnitCubes(ctx, visual, w, h);
      return true;
    case 'probability_tree':
      drawProbabilityTree(ctx, visual, w, h);
      return true;
    case 'dice_grid':
      drawDiceGrid(ctx, visual, w, h);
      return true;
    case 'soroban':
      drawSoroban(ctx, visual, w, h);
      return true;
    case 'balance_equation':
      drawBalanceEquation(ctx, visual, w, h);
      return true;
    default:
      return false;
  }
};

import type { ProblemVisual } from '../data/subjects/utils';

const COLORS = {
  text: '#f8fafc',
  muted: '#94a3b8',
  primary: '#22d3ee',
  secondary: '#60a5fa',
  accent: '#fbbf24',
  line: 'rgba(226, 232, 240, 0.62)',
};

const fillText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  color: string,
) => {
  ctx.fillStyle = color;
  ctx.font = `700 ${size}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
};

const roundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius = 9,
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

const drawArrow = (
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color = COLORS.line,
) => {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 7 * Math.cos(angle - Math.PI / 6), y2 - 7 * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - 7 * Math.cos(angle + Math.PI / 6), y2 - 7 * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
};

const drawLifeCycle = (
  ctx: CanvasRenderingContext2D,
  visual: Extract<ProblemVisual, { kind: 'life_cycle' }>,
  w: number,
  h: number,
) => {
  const stages = visual.stages.slice(0, 6);
  if (stages.length < 2) return;

  if (visual.title) fillText(ctx, visual.title, w / 2, 15, 11, COLORS.muted);

  const count = stages.length;
  const cols = count <= 4 ? count : 3;
  const rows = Math.ceil(count / cols);
  const cardW = count <= 4 ? Math.min(52, (w - 36) / cols - 8) : 58;
  const cardH = 46;
  const gapX = 12;
  const gapY = rows > 1 ? 27 : 0;
  const rowWidth = cols * cardW + (cols - 1) * gapX;
  const startX = (w - rowWidth) / 2;
  const startY = rows > 1 ? 38 : 63;

  const positions: Array<{ x: number; y: number; row: number; col: number }> = [];
  stages.forEach((_, index) => {
    const row = Math.floor(index / cols);
    const indexInRow = index % cols;
    const rowCount = Math.min(cols, count - row * cols);
    const reversed = row % 2 === 1;
    const col = reversed ? rowCount - 1 - indexInRow : indexInRow;
    const actualRowWidth = rowCount * cardW + (rowCount - 1) * gapX;
    const rowStartX = (w - actualRowWidth) / 2;
    positions.push({
      x: rowStartX + col * (cardW + gapX),
      y: startY + row * (cardH + gapY),
      row,
      col,
    });
  });

  for (let index = 0; index < positions.length - 1; index += 1) {
    const current = positions[index];
    const next = positions[index + 1];
    if (current.row === next.row) {
      const movingRight = next.x > current.x;
      drawArrow(
        ctx,
        movingRight ? current.x + cardW + 2 : current.x - 2,
        current.y + cardH / 2,
        movingRight ? next.x - 4 : next.x + cardW + 4,
        next.y + cardH / 2,
      );
    } else {
      drawArrow(
        ctx,
        current.x + cardW / 2,
        current.y + cardH + 2,
        next.x + cardW / 2,
        next.y - 4,
      );
    }
  }

  positions.forEach((position, index) => {
    const stage = stages[index];
    const emphasized = stage.emphasized === true;
    roundedRect(ctx, position.x, position.y, cardW, cardH, 9);
    ctx.fillStyle = emphasized
      ? 'rgba(251, 191, 36, 0.22)'
      : index % 2 === 0
        ? 'rgba(34, 211, 238, 0.14)'
        : 'rgba(96, 165, 250, 0.14)';
    ctx.fill();
    ctx.strokeStyle = emphasized ? COLORS.accent : index % 2 === 0 ? COLORS.primary : COLORS.secondary;
    ctx.lineWidth = emphasized ? 2.5 : 1.5;
    ctx.stroke();
    fillText(ctx, `${index + 1}`, position.x + 10, position.y + 10, 9, emphasized ? COLORS.accent : COLORS.muted);
    const labelSize = stage.label.length >= 7 ? 8 : stage.label.length >= 5 ? 9 : 10;
    fillText(ctx, stage.label, position.x + cardW / 2, position.y + cardH / 2 + 4, labelSize, emphasized ? COLORS.accent : COLORS.text);
  });

  if (visual.cycle) {
    const first = positions[0];
    const last = positions[positions.length - 1];
    ctx.save();
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.7)';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([4, 4]);
    const y = h - 12;
    ctx.beginPath();
    ctx.moveTo(last.x + cardW / 2, last.y + cardH + 4);
    ctx.quadraticCurveTo(w / 2, y, first.x + cardW / 2, first.y + cardH + 4);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    fillText(ctx, visual.cycleLabel || 'つぎの命へ', w / 2, h - 10, 9, COLORS.accent);
  }
};

const drawScienceClassification = (
  ctx: CanvasRenderingContext2D,
  visual: Extract<ProblemVisual, { kind: 'science_classification' }>,
  w: number,
  h: number,
) => {
  const branches = visual.branches.slice(0, 4);
  if (!branches.length) return;

  if (visual.title) fillText(ctx, visual.title, w / 2, 15, 11, COLORS.muted);

  const rootW = Math.min(104, w - 60);
  const rootH = 34;
  const rootX = (w - rootW) / 2;
  const rootY = 34;
  roundedRect(ctx, rootX, rootY, rootW, rootH, 10);
  ctx.fillStyle = 'rgba(34, 211, 238, 0.14)';
  ctx.fill();
  ctx.strokeStyle = COLORS.primary;
  ctx.lineWidth = 2;
  ctx.stroke();
  fillText(ctx, visual.rootLabel, w / 2, rootY + rootH / 2, visual.rootLabel.length >= 9 ? 8 : 10, COLORS.primary);

  const gap = 7;
  const branchW = Math.min(58, (w - 24 - gap * (branches.length - 1)) / branches.length);
  const totalW = branchW * branches.length + gap * (branches.length - 1);
  const startX = (w - totalW) / 2;
  const branchY = 105;
  const branchH = 52;

  branches.forEach((branch, index) => {
    const x = startX + index * (branchW + gap);
    const cx = x + branchW / 2;
    const emphasized = branch.emphasized === true;
    drawArrow(ctx, w / 2, rootY + rootH + 2, cx, branchY - 5, emphasized ? COLORS.accent : COLORS.line);
    roundedRect(ctx, x, branchY, branchW, branchH, 9);
    ctx.fillStyle = emphasized
      ? 'rgba(251, 191, 36, 0.18)'
      : index % 2 === 0
        ? 'rgba(96, 165, 250, 0.13)'
        : 'rgba(34, 211, 238, 0.11)';
    ctx.fill();
    ctx.strokeStyle = emphasized ? COLORS.accent : index % 2 === 0 ? COLORS.secondary : COLORS.primary;
    ctx.lineWidth = emphasized ? 2.4 : 1.5;
    ctx.stroke();
    const labelSize = branch.label.length >= 8 ? 7 : branch.label.length >= 5 ? 8 : 9;
    fillText(ctx, branch.label, cx, branchY + (branch.note ? 18 : branchH / 2), labelSize, emphasized ? COLORS.accent : COLORS.text);
    if (branch.note) {
      fillText(ctx, branch.note, cx, branchY + 36, branch.note.length >= 8 ? 6 : 7, COLORS.muted);
    }
  });
};

export const drawScienceLifeProblemVisual = (
  ctx: CanvasRenderingContext2D,
  visual: ProblemVisual,
  w: number,
  h: number,
): boolean => {
  if (visual.kind === 'life_cycle') {
    drawLifeCycle(ctx, visual, w, h);
    return true;
  }
  if (visual.kind === 'science_classification') {
    drawScienceClassification(ctx, visual, w, h);
    return true;
  }
  return false;
};

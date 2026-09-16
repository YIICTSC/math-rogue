import type { ProblemVisual } from '../data/subjects/utils';

const COLORS = {
  text: '#f8fafc',
  muted: '#94a3b8',
  primary: '#22d3ee',
  secondary: '#60a5fa',
  accent: '#fbbf24',
  line: 'rgba(226, 232, 240, 0.72)',
  grid: 'rgba(148, 163, 184, 0.18)',
};

const fillText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  color: string,
  align: CanvasTextAlign = 'center',
) => {
  ctx.fillStyle = color;
  ctx.font = `700 ${size}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
};

const formatNumber = (value: number) => {
  if (Math.abs(value) < 1e-9) return '0';
  if (Number.isInteger(value)) return String(value);
  return String(Math.round(value * 100) / 100);
};

const niceStep = (range: number, targetIntervals = 6) => {
  const raw = Math.max(range / targetIntervals, 1e-9);
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const normalized = raw / magnitude;
  const factor = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return factor * magnitude;
};

const drawCoordinatePlane = (
  ctx: CanvasRenderingContext2D,
  visual: Extract<ProblemVisual, { kind: 'coordinate_plane' }>,
  w: number,
  h: number,
) => {
  const xMin = visual.xMin;
  const xMax = visual.xMax > xMin ? visual.xMax : xMin + 1;
  const yMin = visual.yMin;
  const yMax = visual.yMax > yMin ? visual.yMax : yMin + 1;
  const left = 33;
  const right = w - 17;
  const top = 14;
  const bottom = h - 27;
  const toX = (x: number) => left + ((x - xMin) / (xMax - xMin)) * (right - left);
  const toY = (y: number) => bottom - ((y - yMin) / (yMax - yMin)) * (bottom - top);

  const xStep = niceStep(xMax - xMin);
  const xStart = Math.ceil((xMin - 1e-9) / xStep) * xStep;
  for (let value = xStart; value <= xMax + 1e-9; value += xStep) {
    const x = toX(value);
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
    ctx.stroke();
    fillText(ctx, formatNumber(value), x, bottom + 13, 9, COLORS.muted);
  }
  const yStep = niceStep(yMax - yMin);
  const yStart = Math.ceil((yMin - 1e-9) / yStep) * yStep;
  for (let value = yStart; value <= yMax + 1e-9; value += yStep) {
    const y = toY(value);
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
    fillText(ctx, formatNumber(value), left - 6, y, 9, COLORS.muted, 'right');
  }

  const axisX = xMin <= 0 && xMax >= 0 ? toX(0) : left;
  const axisY = yMin <= 0 && yMax >= 0 ? toY(0) : bottom;
  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(left, axisY);
  ctx.lineTo(right, axisY);
  ctx.moveTo(axisX, top);
  ctx.lineTo(axisX, bottom);
  ctx.stroke();

  if (visual.xLabel) fillText(ctx, visual.xLabel, right, h - 8, 10, COLORS.muted, 'right');
  if (visual.yLabel) fillText(ctx, visual.yLabel, left + 2, 8, 10, COLORS.muted, 'left');

  const relations = visual.relations?.length ? visual.relations : visual.relation ? [visual.relation] : [];
  relations.forEach((relation, relationIndex) => {
    ctx.save();
    ctx.beginPath();
    ctx.rect(left, top, right - left, bottom - top);
    ctx.clip();
    ctx.strokeStyle = relationIndex === 0 ? COLORS.primary : COLORS.secondary;
    ctx.lineWidth = 3;
    ctx.beginPath();
    let drawing = false;
    const samples = 160;
    for (let i = 0; i <= samples; i += 1) {
      const x = xMin + ((xMax - xMin) * i) / samples;
      let y: number;
      if (relation.type === 'linear') {
        y = relation.slope * x + (relation.intercept ?? 0);
      } else {
        if (Math.abs(x) < (xMax - xMin) / samples / 2) {
          drawing = false;
          continue;
        }
        y = relation.constant / x;
      }
      if (!Number.isFinite(y) || y < yMin - (yMax - yMin) || y > yMax + (yMax - yMin)) {
        drawing = false;
        continue;
      }
      const px = toX(x);
      const py = toY(y);
      if (!drawing) {
        ctx.moveTo(px, py);
        drawing = true;
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();
    ctx.restore();
  });

  (visual.points ?? []).forEach((point) => {
    if (point.x < xMin || point.x > xMax || point.y < yMin || point.y > yMax) return;
    const x = toX(point.x);
    const y = toY(point.y);
    ctx.beginPath();
    ctx.arc(x, y, point.emphasized ? 6 : 4.5, 0, Math.PI * 2);
    ctx.fillStyle = point.emphasized ? COLORS.accent : COLORS.secondary;
    ctx.fill();
    if (point.emphasized) {
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(x, axisY);
      ctx.lineTo(x, y);
      ctx.moveTo(axisX, y);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (point.label) fillText(ctx, point.label, x, Math.max(top + 9, y - 11), 10, point.emphasized ? COLORS.accent : COLORS.text);
  });
};

const drawDotPlot = (
  ctx: CanvasRenderingContext2D,
  visual: Extract<ProblemVisual, { kind: 'dot_plot' }>,
  w: number,
  h: number,
) => {
  const values = visual.values.filter(Number.isFinite);
  if (!values.length) return;
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const rawSpan = Math.max(1e-6, rawMax - rawMin);
  const step = niceStep(rawSpan, 4);
  const min = Math.floor(rawMin / step) * step - step;
  const max = Math.ceil(rawMax / step) * step + step;
  const x0 = 28;
  const x1 = w - 22;
  const y = 119;
  const toX = (value: number) => x0 + ((value - min) / (max - min)) * (x1 - x0);

  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(x1, y);
  ctx.stroke();

  const tickCount = Math.round((max - min) / step);
  for (let i = 0; i <= tickCount; i += 1) {
    const value = min + step * i;
    const x = toX(value);
    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y - 5);
    ctx.lineTo(x, y + 5);
    ctx.stroke();
    fillText(ctx, formatNumber(value), x, y + 17, 9, COLORS.muted);
  }

  const counts = new Map<number, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  const highlights = new Set(visual.highlightValues ?? []);
  const stacked = new Map<number, number>();
  values.slice().sort((a, b) => a - b).forEach((value) => {
    const level = stacked.get(value) ?? 0;
    stacked.set(value, level + 1);
    const x = toX(value);
    const cy = y - 17 - level * 15;
    ctx.beginPath();
    ctx.arc(x, cy, highlights.has(value) ? 6 : 5, 0, Math.PI * 2);
    ctx.fillStyle = highlights.has(value) ? COLORS.accent : COLORS.primary;
    ctx.fill();
  });
  counts.forEach((count, value) => {
    const x = toX(value);
    const topDotY = y - 17 - (count - 1) * 15;
    fillText(ctx, formatNumber(value), x, topDotY - 12, 9, highlights.has(value) ? COLORS.accent : COLORS.text);
  });

  if (visual.summaryValue !== undefined && Number.isFinite(visual.summaryValue)) {
    const x = toX(Math.max(min, Math.min(max, visual.summaryValue)));
    ctx.strokeStyle = COLORS.secondary;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(x, 35);
    ctx.lineTo(x, y + 2);
    ctx.stroke();
    ctx.setLineDash([]);
    fillText(ctx, visual.summaryLabel || '代表値', x, 24, 10, COLORS.secondary);
  }
};

export const drawGraphProblemVisual = (
  ctx: CanvasRenderingContext2D,
  visual: ProblemVisual,
  w: number,
  h: number,
): boolean => {
  if (visual.kind === 'coordinate_plane') {
    drawCoordinatePlane(ctx, visual, w, h);
    return true;
  }
  if (visual.kind === 'dot_plot') {
    drawDotPlot(ctx, visual, w, h);
    return true;
  }
  return false;
};

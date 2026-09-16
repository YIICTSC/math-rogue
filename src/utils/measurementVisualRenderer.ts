import type { ProblemVisual } from '../data/subjects/utils';

const COLORS = {
  text: '#f8fafc',
  muted: '#94a3b8',
  primary: '#22d3ee',
  secondary: '#60a5fa',
  accent: '#fbbf24',
  line: 'rgba(226, 232, 240, 0.72)',
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

const drawMeasurementScale = (
  ctx: CanvasRenderingContext2D,
  visual: Extract<ProblemVisual, { kind: 'measurement_scale' }>,
  w: number,
  h: number,
) => {
  const minorPerMajor = Math.max(1, visual.minorPerMajor);
  const sourceMinorValue = Math.max(0, visual.sourceMinorValue);
  const majorValue = sourceMinorValue / minorPerMajor;
  const majorSegments = Math.max(1, Math.ceil(majorValue));
  const x0 = 30;
  const x1 = w - 24;
  const y = 93;
  const barH = 26;
  const segmentW = (x1 - x0) / majorSegments;
  const fillX = x0 + Math.min(1, majorValue / majorSegments) * (x1 - x0);
  const fullMajorCount = Math.floor(majorValue);
  const hasRemainder = Math.abs(majorValue - fullMajorCount) > 1e-7;

  if (visual.sourceLabel) fillText(ctx, visual.sourceLabel, w / 2, 26, 17, COLORS.text);

  ctx.fillStyle = 'rgba(15, 23, 42, 0.68)';
  ctx.fillRect(x0, y - barH / 2, x1 - x0, barH);

  for (let i = 0; i < majorSegments; i += 1) {
    const segmentStart = x0 + i * segmentW;
    const segmentEnd = segmentStart + segmentW;
    const full = i < fullMajorCount;
    const partial = i === fullMajorCount && hasRemainder;
    if (full) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(34, 211, 238, 0.32)' : 'rgba(96, 165, 250, 0.30)';
      ctx.fillRect(segmentStart, y - barH / 2, segmentW, barH);
    } else if (partial) {
      ctx.fillStyle = 'rgba(251, 191, 36, 0.34)';
      ctx.fillRect(segmentStart, y - barH / 2, Math.max(0, fillX - segmentStart), barH);
    }
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(segmentStart, y - barH / 2, segmentEnd - segmentStart, barH);
  }

  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x0, y + barH / 2 + 7);
  ctx.lineTo(x1, y + barH / 2 + 7);
  ctx.stroke();

  const labelEvery = majorSegments > 6 ? 2 : 1;
  for (let i = 0; i <= majorSegments; i += 1) {
    const x = x0 + (i / majorSegments) * (x1 - x0);
    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y + barH / 2 + 2);
    ctx.lineTo(x, y + barH / 2 + 13);
    ctx.stroke();
    if (i % labelEvery === 0 || i === majorSegments) fillText(ctx, `${i}`, x, y + barH / 2 + 27, 10, COLORS.muted);
  }

  fillText(ctx, visual.majorUnit, x1 + 3, y + barH / 2 + 27, 10, COLORS.muted, 'left');

  if (hasRemainder) {
    ctx.strokeStyle = COLORS.accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(fillX, y - barH / 2 - 6);
    ctx.lineTo(fillX, y + barH / 2 + 4);
    ctx.stroke();
    const remainderMinor = Math.round((majorValue - fullMajorCount) * minorPerMajor * 1e6) / 1e6;
    fillText(ctx, `+${remainderMinor}${visual.minorUnit}`, fillX, y - barH / 2 - 16, 11, COLORS.accent);
  }

  fillText(ctx, `1${visual.majorUnit} = ${minorPerMajor}${visual.minorUnit}`, w / 2, h - 23, 12, COLORS.muted);
  if (visual.targetLabel) fillText(ctx, visual.targetLabel, w / 2, 56, 15, COLORS.accent);
};

export const drawMeasurementProblemVisual = (
  ctx: CanvasRenderingContext2D,
  visual: ProblemVisual,
  w: number,
  h: number,
): boolean => {
  if (visual.kind !== 'measurement_scale') return false;
  drawMeasurementScale(ctx, visual, w, h);
  return true;
};

import type { ProblemVisual } from '../data/subjects/utils';

const COLORS = {
  text: '#f8fafc',
  muted: '#94a3b8',
  primary: '#22d3ee',
  secondary: '#60a5fa',
  accent: '#fbbf24',
  danger: '#fb7185',
  panel: 'rgba(15, 23, 42, 0.78)',
  line: 'rgba(226, 232, 240, 0.72)',
};

const QUANTITY_KINDS = new Set([
  'ten_frame',
  'place_value_blocks',
  'bar_model',
  'array_model',
  'groups_model',
  'number_line',
  'double_number_line',
]);

const roundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius = 8,
) => {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
};

const fillText = (
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  size = 15,
  color = COLORS.text,
  align: CanvasTextAlign = 'center',
) => {
  ctx.fillStyle = color;
  ctx.font = `700 ${size}px sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
};

const formatNumber = (value: number) => {
  if (!Number.isFinite(value)) return '0';
  if (Number.isInteger(value)) return String(value);
  return String(Number(value.toFixed(2)));
};

const drawTenFrame = (
  ctx: CanvasRenderingContext2D,
  visual: Extract<ProblemVisual, { kind: 'ten_frame' }>,
  w: number,
  h: number,
) => {
  const total = visual.total ?? (visual.value > 10 ? 20 : 10);
  const frameCount = total > 10 ? 2 : 1;
  const frameWidth = frameCount === 2 ? 102 : 132;
  const cell = frameWidth / 5;
  const gap = 10;
  const startX = (w - frameWidth * frameCount - gap * (frameCount - 1)) / 2;
  const startY = 52;
  const dotCount = Math.max(0, Math.min(total, Math.round(visual.value)));
  const splitAt = Math.max(0, Math.min(dotCount, Math.round(visual.splitAt ?? dotCount)));
  const removed = Math.max(0, Math.min(dotCount, Math.round(visual.removed ?? 0)));
  const removedFrom = Math.max(0, dotCount - removed);

  fillText(ctx, '10のまとまり', w / 2, 24, 13, COLORS.muted);
  for (let frame = 0; frame < frameCount; frame += 1) {
    const fx = startX + frame * (frameWidth + gap);
    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 2;
    roundedRect(ctx, fx, startY, frameWidth, cell * 2, 7);
    ctx.stroke();
    for (let col = 1; col < 5; col += 1) {
      ctx.beginPath();
      ctx.moveTo(fx + col * cell, startY);
      ctx.lineTo(fx + col * cell, startY + cell * 2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(fx, startY + cell);
    ctx.lineTo(fx + frameWidth, startY + cell);
    ctx.stroke();

    for (let local = 0; local < 10; local += 1) {
      const index = frame * 10 + local;
      if (index >= dotCount) continue;
      const row = Math.floor(local / 5);
      const col = local % 5;
      const cx = fx + col * cell + cell / 2;
      const cy = startY + row * cell + cell / 2;
      const isRemoved = index >= removedFrom;
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(5, cell * 0.27), 0, Math.PI * 2);
      ctx.fillStyle = isRemoved ? 'rgba(251,113,133,0.22)' : index < splitAt ? COLORS.primary : COLORS.accent;
      ctx.fill();
      ctx.strokeStyle = isRemoved ? COLORS.danger : index < splitAt ? '#67e8f9' : '#fde68a';
      ctx.lineWidth = 2;
      ctx.stroke();
      if (isRemoved) {
        ctx.beginPath();
        ctx.moveTo(cx - 6, cy - 6);
        ctx.lineTo(cx + 6, cy + 6);
        ctx.moveTo(cx + 6, cy - 6);
        ctx.lineTo(cx - 6, cy + 6);
        ctx.stroke();
      }
    }
  }
  if (removed > 0) fillText(ctx, `${dotCount} から ${removed} へる`, w / 2, 143, 14, COLORS.danger);
  else if (splitAt < dotCount) fillText(ctx, `${splitAt} と ${dotCount - splitAt}`, w / 2, 143, 14, COLORS.accent);
  else fillText(ctx, `${dotCount}`, w / 2, 143, 18, COLORS.primary);
};

const drawPlaceValueBlocks = (
  ctx: CanvasRenderingContext2D,
  visual: Extract<ProblemVisual, { kind: 'place_value_blocks' }>,
  w: number,
  h: number,
) => {
  const values = visual.values.slice(0, 2);
  const headers = [
    { key: 'hundreds' as const, label: '100', divisor: 100 },
    { key: 'tens' as const, label: '10', divisor: 10 },
    { key: 'ones' as const, label: '1', divisor: 1 },
  ];
  const left = 54;
  const right = 245;
  const colWidth = (right - left) / 3;
  const top = 34;
  const rowHeight = values.length === 2 ? 57 : 88;

  headers.forEach((header, i) => {
    const x = left + i * colWidth;
    const active = visual.highlightPlace === header.key;
    ctx.fillStyle = active ? 'rgba(251,191,36,0.16)' : 'rgba(15,23,42,0.55)';
    ctx.fillRect(x, top, colWidth, rowHeight * values.length + 24);
    ctx.strokeStyle = active ? COLORS.accent : 'rgba(148,163,184,0.30)';
    ctx.strokeRect(x, top, colWidth, rowHeight * values.length + 24);
    fillText(ctx, header.label, x + colWidth / 2, 22, 12, active ? COLORS.accent : COLORS.muted);
  });

  values.forEach((item, row) => {
    const value = Math.max(0, Math.round(item.value));
    const counts = [Math.floor(value / 100), Math.floor((value % 100) / 10), value % 10];
    const cy = top + 23 + row * rowHeight;
    if (item.label) fillText(ctx, item.label, 8, cy, 11, item.emphasized ? COLORS.accent : COLORS.muted, 'left');
    counts.forEach((count, i) => {
      const cx = left + i * colWidth + colWidth / 2;
      const color = i === 0 ? '#a78bfa' : i === 1 ? COLORS.secondary : COLORS.primary;
      const maxGlyphs = Math.min(5, count);
      const glyphGap = 8;
      const glyphStart = cx - ((maxGlyphs - 1) * glyphGap) / 2;
      for (let j = 0; j < maxGlyphs; j += 1) {
        ctx.fillStyle = color;
        roundedRect(ctx, glyphStart + j * glyphGap - 3, cy - 10, 6, 20, 2);
        ctx.fill();
      }
      if (count > 0) fillText(ctx, `×${count}`, cx, cy + 20, 11, COLORS.text);
      else fillText(ctx, '0', cx, cy + 5, 11, 'rgba(148,163,184,0.55)');
    });
    if (row === 0 && values.length === 2 && visual.operation) {
      fillText(ctx, visual.operation, 28, top + rowHeight, 22, COLORS.accent);
    }
  });
};

const drawBarModel = (
  ctx: CanvasRenderingContext2D,
  visual: Extract<ProblemVisual, { kind: 'bar_model' }>,
  w: number,
  h: number,
) => {
  const bars = visual.bars.slice(0, 3);
  const maxTotal = Math.max(1, ...bars.map((bar) => bar.segments.reduce((sum, segment) => sum + Math.max(0, segment.value), 0)));
  const x0 = 70;
  const available = 168;
  const rowGap = bars.length === 3 ? 45 : 58;
  const y0 = bars.length === 3 ? 32 : 42;
  bars.forEach((bar, row) => {
    const y = y0 + row * rowGap;
    if (bar.label) fillText(ctx, bar.label, 62, y + 15, 12, COLORS.muted, 'right');
    let x = x0;
    const total = Math.max(1, bar.segments.reduce((sum, segment) => sum + Math.max(0, segment.value), 0));
    bar.segments.forEach((segment, index) => {
      const width = Math.max(18, (Math.max(0, segment.value) / maxTotal) * available);
      ctx.fillStyle = segment.emphasized ? 'rgba(251,191,36,0.28)' : index % 2 === 0 ? 'rgba(34,211,238,0.22)' : 'rgba(96,165,250,0.22)';
      roundedRect(ctx, x, y, width, 30, 4);
      ctx.fill();
      ctx.strokeStyle = segment.emphasized ? COLORS.accent : index % 2 === 0 ? COLORS.primary : COLORS.secondary;
      ctx.lineWidth = 2;
      ctx.stroke();
      const text = segment.unknown ? '?' : segment.label || formatNumber(segment.value);
      fillText(ctx, text, x + width / 2, y + 15, width < 34 ? 11 : 13, segment.unknown ? COLORS.accent : COLORS.text);
      x += width;
    });
    if (total < maxTotal) {
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(148,163,184,0.4)';
      ctx.beginPath();
      ctx.moveTo(x, y + 15);
      ctx.lineTo(x0 + available, y + 15);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  });
  if (visual.compareLabel) fillText(ctx, visual.compareLabel, w / 2, h - 17, 13, COLORS.accent);
};

const drawArrayModel = (
  ctx: CanvasRenderingContext2D,
  visual: Extract<ProblemVisual, { kind: 'array_model' }>,
  w: number,
  h: number,
) => {
  const rows = Math.max(1, Math.min(10, Math.round(visual.rows)));
  const columns = Math.max(1, Math.min(10, Math.round(visual.columns)));
  const count = rows * columns;
  const maxW = 176;
  const maxH = 112;
  const gap = Math.max(10, Math.min(22, maxW / Math.max(columns, 1), maxH / Math.max(rows, 1)));
  const startX = w / 2 - ((columns - 1) * gap) / 2;
  const startY = h / 2 - ((rows - 1) * gap) / 2 + 3;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < columns; c += 1) {
      const index = r * columns + c;
      const emphasized = visual.highlightCount !== undefined && index < visual.highlightCount;
      ctx.beginPath();
      ctx.arc(startX + c * gap, startY + r * gap, Math.max(3.8, gap * 0.26), 0, Math.PI * 2);
      ctx.fillStyle = emphasized ? COLORS.accent : COLORS.primary;
      ctx.fill();
    }
  }
  if (visual.rowLabel) fillText(ctx, visual.rowLabel, 24, h / 2, 12, COLORS.muted);
  if (visual.columnLabel) fillText(ctx, visual.columnLabel, w / 2, 18, 12, COLORS.muted);
  fillText(ctx, `${columns} × ${rows}`, w / 2, h - 14, 14, COLORS.text);
};

const drawGroupsModel = (
  ctx: CanvasRenderingContext2D,
  visual: Extract<ProblemVisual, { kind: 'groups_model' }>,
  w: number,
  h: number,
) => {
  const groups = Math.max(1, Math.min(8, Math.round(visual.groups)));
  const perGroup = Math.max(1, Math.min(10, Math.round(visual.perGroup)));
  const remainder = Math.max(0, Math.min(9, Math.round(visual.remainder ?? 0)));
  const cols = Math.min(4, groups);
  const rows = Math.ceil(groups / cols);
  const boxW = 48;
  const boxH = rows > 1 ? 47 : 62;
  const gapX = 7;
  const gapY = 7;
  const groupAreaWidth = cols * boxW + (cols - 1) * gapX;
  const startX = (w - groupAreaWidth) / 2;
  const startY = rows > 1 ? 28 : 48;
  for (let i = 0; i < groups; i += 1) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const x = startX + col * (boxW + gapX);
    const y = startY + row * (boxH + gapY);
    ctx.fillStyle = 'rgba(34,211,238,0.10)';
    roundedRect(ctx, x, y, boxW, boxH, 9);
    ctx.fill();
    ctx.strokeStyle = 'rgba(34,211,238,0.65)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    const dotCols = perGroup > 6 ? 4 : 3;
    const dotGap = 9;
    const dotRows = Math.ceil(perGroup / dotCols);
    const dx0 = x + boxW / 2 - ((Math.min(dotCols, perGroup) - 1) * dotGap) / 2;
    const dy0 = y + boxH / 2 - ((dotRows - 1) * dotGap) / 2;
    for (let j = 0; j < perGroup; j += 1) {
      ctx.beginPath();
      ctx.arc(dx0 + (j % dotCols) * dotGap, dy0 + Math.floor(j / dotCols) * dotGap, 3.2, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.secondary;
      ctx.fill();
    }
  }
  if (visual.groupLabel) fillText(ctx, visual.groupLabel, w / 2, 15, 12, COLORS.muted);
  if (remainder > 0) {
    fillText(ctx, `あまり ${remainder}`, w / 2, h - 15, 13, COLORS.danger);
    for (let i = 0; i < remainder; i += 1) {
      ctx.beginPath();
      ctx.arc(w / 2 - ((remainder - 1) * 10) / 2 + i * 10, h - 34, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.danger;
      ctx.fill();
    }
  } else {
    fillText(ctx, `${groups}グループ × ${perGroup}こ`, w / 2, h - 14, 12, COLORS.text);
  }
};

const drawNumberLine = (
  ctx: CanvasRenderingContext2D,
  visual: Extract<ProblemVisual, { kind: 'number_line' }>,
  w: number,
  h: number,
) => {
  let min = Number.isFinite(visual.min) ? visual.min : 0;
  let max = Number.isFinite(visual.max) ? visual.max : min + 10;
  if (max <= min) max = min + 1;
  const step = visual.step && visual.step > 0 ? visual.step : Math.max(1, (max - min) / 10);
  const x0 = 27;
  const x1 = w - 23;
  const y = 105;
  const toX = (value: number) => x0 + ((value - min) / (max - min)) * (x1 - x0);
  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(x1, y);
  ctx.stroke();
  ctx.fillStyle = COLORS.line;
  ctx.beginPath();
  ctx.moveTo(x1 + 6, y);
  ctx.lineTo(x1 - 4, y - 5);
  ctx.lineTo(x1 - 4, y + 5);
  ctx.closePath();
  ctx.fill();

  const tickCount = Math.min(30, Math.floor((max - min) / step + 0.0001) + 1);
  const labelEvery = Math.max(1, Math.ceil(tickCount / 11));
  for (let i = 0; i < tickCount; i += 1) {
    const value = min + i * step;
    if (value > max + 1e-7) break;
    const x = toX(value);
    ctx.strokeStyle = 'rgba(226,232,240,0.65)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y - 7);
    ctx.lineTo(x, y + 7);
    ctx.stroke();
    if (i % labelEvery === 0 || i === tickCount - 1) fillText(ctx, formatNumber(value), x, y + 20, 10, COLORS.muted);
  }
  const markerPoints = (visual.markers ?? [])
    .filter((marker) => marker.value >= min && marker.value <= max)
    .map((marker) => ({ marker, x: toX(marker.value) }));
  markerPoints.forEach(({ marker, x }, markerIndex) => {
    ctx.beginPath();
    ctx.arc(x, y, marker.emphasized ? 7 : 5, 0, Math.PI * 2);
    ctx.fillStyle = marker.emphasized ? COLORS.accent : COLORS.primary;
    ctx.fill();
    const hasCloseMarker = markerPoints.some((point, index) => index !== markerIndex && Math.abs(point.x - x) < 24);
    const markerLabelY = y - 19 - (hasCloseMarker && markerIndex % 2 === 0 ? 14 : 0);
    fillText(ctx, marker.label || formatNumber(marker.value), x, markerLabelY, 12, marker.emphasized ? COLORS.accent : COLORS.text);
  });
  if (visual.jump) {
    const fromX = toX(Math.max(min, Math.min(max, visual.jump.from)));
    const to = Math.max(min, Math.min(max, visual.jump.to));
    const toJumpX = toX(to);
    const middle = (fromX + toJumpX) / 2;
    const radius = Math.abs(toJumpX - fromX) / 2;
    ctx.strokeStyle = COLORS.accent;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(middle, y - 2, radius, Math.PI, 0, false);
    ctx.stroke();
    ctx.fillStyle = COLORS.accent;
    ctx.beginPath();
    ctx.moveTo(toJumpX, y - 2);
    ctx.lineTo(toJumpX - Math.sign(toJumpX - fromX || 1) * 9, y - 7);
    ctx.lineTo(toJumpX - Math.sign(toJumpX - fromX || 1) * 8, y + 2);
    ctx.closePath();
    ctx.fill();
    if (visual.jump.label) {
      const jumpLabelY = Math.max(18, Math.min(y - radius - 8, y - 38));
      fillText(ctx, visual.jump.label, middle, jumpLabelY, 12, COLORS.accent);
    }
  }
};

const drawDoubleNumberLine = (
  ctx: CanvasRenderingContext2D,
  visual: Extract<ProblemVisual, { kind: 'double_number_line' }>,
  w: number,
  h: number,
) => {
  const length = Math.min(6, visual.topValues.length, visual.bottomValues.length);
  if (length < 2) return;
  const x0 = 48;
  const x1 = w - 18;
  const ys = [66, 125];
  [visual.topValues, visual.bottomValues].forEach((values, row) => {
    const rowValues = values.slice(0, length);
    const rowMin = Math.min(...rowValues);
    const rowMax = Math.max(...rowValues);
    const rowRange = rowMax - rowMin;
    const positions = rowValues.map((value, index) => rowRange > 0
      ? x0 + ((value - rowMin) / rowRange) * (x1 - x0)
      : x0 + (index / (length - 1)) * (x1 - x0));
    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x0, ys[row]);
    ctx.lineTo(x1, ys[row]);
    ctx.stroke();
    for (let i = 0; i < length; i += 1) {
      const x = positions[i];
      const emphasized = i === visual.highlightIndex;
      ctx.strokeStyle = emphasized ? COLORS.accent : COLORS.line;
      ctx.lineWidth = emphasized ? 3 : 1.5;
      ctx.beginPath();
      ctx.moveTo(x, ys[row] - 7);
      ctx.lineTo(x, ys[row] + 7);
      ctx.stroke();
      const isUnknown = row === 0 ? i === visual.topUnknownIndex : i === visual.bottomUnknownIndex;
      const nextIsClose = i < length - 1 && Math.abs(positions[i + 1] - x) < 28;
      const labelOffset = row === 0
        ? (nextIsClose ? -31 : -18)
        : (nextIsClose ? 32 : 19);
      fillText(ctx, isUnknown ? '?' : formatNumber(values[i]), x, ys[row] + labelOffset, isUnknown ? 15 : 11, isUnknown || emphasized ? COLORS.accent : COLORS.text);
      if (emphasized) {
        ctx.strokeStyle = 'rgba(251,191,36,0.5)';
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.moveTo(x, ys[0] + 7);
        ctx.lineTo(x, ys[1] - 7);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  });
  fillText(ctx, visual.topLabel || '上', 10, ys[0], 11, COLORS.muted, 'left');
  fillText(ctx, visual.bottomLabel || '下', 10, ys[1], 11, COLORS.muted, 'left');
};

export const drawQuantityProblemVisual = (
  ctx: CanvasRenderingContext2D,
  visual: ProblemVisual,
  w: number,
  h: number,
): boolean => {
  if (!QUANTITY_KINDS.has(visual.kind)) return false;
  switch (visual.kind) {
    case 'ten_frame':
      drawTenFrame(ctx, visual, w, h);
      return true;
    case 'place_value_blocks':
      drawPlaceValueBlocks(ctx, visual, w, h);
      return true;
    case 'bar_model':
      drawBarModel(ctx, visual, w, h);
      return true;
    case 'array_model':
      drawArrayModel(ctx, visual, w, h);
      return true;
    case 'groups_model':
      drawGroupsModel(ctx, visual, w, h);
      return true;
    case 'number_line':
      drawNumberLine(ctx, visual, w, h);
      return true;
    case 'double_number_line':
      drawDoubleNumberLine(ctx, visual, w, h);
      return true;
    default:
      return false;
  }
};

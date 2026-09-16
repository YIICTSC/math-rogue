import type { ProblemVisual } from '../data/subjects/utils';

const COLORS = {
  text: '#f8fafc',
  muted: '#94a3b8',
  primary: '#22d3ee',
  secondary: '#60a5fa',
  accent: '#fbbf24',
  danger: '#fb7185',
  good: '#34d399',
  line: 'rgba(226, 232, 240, 0.7)',
  panel: 'rgba(15, 23, 42, 0.72)',
};

const text = (
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  size = 10,
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
  width = 2.5,
) => {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  line(ctx, x1, y1, x2, y2, color, width);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 8 * Math.cos(angle - Math.PI / 6), y2 - 8 * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - 8 * Math.cos(angle + Math.PI / 6), y2 - 8 * Math.sin(angle + Math.PI / 6));
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

const drawRayDiagram = (
  ctx: CanvasRenderingContext2D,
  visual: Extract<ProblemVisual, { kind: 'ray_diagram' }>,
) => {
  title(ctx, visual.title);
  if (visual.mode === 'lens') {
    const cx = 130;
    ctx.strokeStyle = COLORS.secondary;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, 42);
    ctx.bezierCurveTo(cx - 13, 64, cx - 13, 116, cx, 138);
    ctx.bezierCurveTo(cx + 13, 116, cx + 13, 64, cx, 42);
    ctx.closePath();
    ctx.stroke();
    const focusX = 205;
    [62, 88, 114].forEach((y) => {
      arrow(ctx, 38, y, cx - 7, y, COLORS.primary, 2);
      arrow(ctx, cx + 7, y, focusX, 90, COLORS.accent, 2);
    });
    ctx.fillStyle = COLORS.accent;
    ctx.beginPath();
    ctx.arc(focusX, 90, 4, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, '焦点', focusX, 108, 9, COLORS.accent);
    text(ctx, '凸レンズ', cx, 151, 9, COLORS.secondary);
    return;
  }

  const cx = 130;
  const cy = 92;
  line(ctx, 35, cy, 225, cy, 'rgba(226, 232, 240, 0.86)', 3);
  ctx.save();
  ctx.setLineDash([4, 4]);
  line(ctx, cx, 32, cx, 154, COLORS.muted, 1.5);
  ctx.restore();
  text(ctx, '法線', cx + 18, 36, 8, COLORS.muted);

  const incident = Math.max(20, Math.min(70, visual.incidentAngle ?? 45)) * Math.PI / 180;
  const length = 76;
  const ix = cx - Math.sin(incident) * length;
  const iy = cy - Math.cos(incident) * length;
  arrow(ctx, ix, iy, cx, cy, COLORS.primary, 2.5);
  text(ctx, '入射光', ix - 2, iy - 8, 8, COLORS.primary);

  if (visual.mode === 'reflection') {
    const rx = cx + Math.sin(incident) * length;
    const ry = cy - Math.cos(incident) * length;
    arrow(ctx, cx, cy, rx, ry, COLORS.accent, 2.5);
    text(ctx, '反射光', rx + 2, ry - 8, 8, COLORS.accent);
    text(ctx, '入射角 ＝ 反射角', cx, 160, 10, COLORS.text);
  } else {
    const refracted = Math.max(10, Math.min(60, visual.refractedAngle ?? 28)) * Math.PI / 180;
    ctx.fillStyle = 'rgba(96, 165, 250, 0.08)';
    ctx.fillRect(35, cy + 2, 190, 61);
    const rx = cx + Math.sin(refracted) * 68;
    const ry = cy + Math.cos(refracted) * 68;
    arrow(ctx, cx, cy, rx, ry, COLORS.accent, 2.5);
    text(ctx, '水・ガラス', 62, 147, 8, COLORS.secondary);
    text(ctx, '屈折光', rx + 5, ry - 7, 8, COLORS.accent);
  }
};

const drawWaveDiagram = (
  ctx: CanvasRenderingContext2D,
  visual: Extract<ProblemVisual, { kind: 'wave_diagram' }>,
) => {
  title(ctx, visual.title);
  const midY = 94;
  const left = 28;
  const right = 232;
  const amplitude = 18 + Math.max(0, Math.min(1, visual.amplitude ?? 0.6)) * 30;
  const cycles = Math.max(1.5, Math.min(6, visual.frequency ?? 3));
  line(ctx, left, midY, right, midY, 'rgba(148, 163, 184, 0.35)', 1.2);
  ctx.strokeStyle = COLORS.primary;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i <= 180; i += 1) {
    const ratio = i / 180;
    const x = left + ratio * (right - left);
    const y = midY - Math.sin(ratio * Math.PI * 2 * cycles) * amplitude;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  arrow(ctx, 44, midY, 44, midY - amplitude, COLORS.accent, 1.8);
  text(ctx, visual.amplitudeLabel ?? '振幅', 56, midY - amplitude / 2, 8, COLORS.accent, 'left');
  const wavelength = (right - left) / cycles;
  line(ctx, 70, 151, 70 + wavelength, 151, COLORS.secondary, 1.5);
  line(ctx, 70, 146, 70, 156, COLORS.secondary, 1.5);
  line(ctx, 70 + wavelength, 146, 70 + wavelength, 156, COLORS.secondary, 1.5);
  text(ctx, visual.frequencyLabel ?? '振動の間隔', 70 + wavelength / 2, 163, 8, COLORS.secondary);
};

const drawBattery = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
  line(ctx, x, y - 9, x, y + 9, COLORS.line, 2);
  line(ctx, x + 7, y - 14, x + 7, y + 14, COLORS.text, 3);
  text(ctx, '−', x - 6, y - 17, 8, COLORS.muted);
  text(ctx, '+', x + 13, y - 19, 8, COLORS.accent);
};

const drawLoad = (
  ctx: CanvasRenderingContext2D,
  kind: Extract<ProblemVisual, { kind: 'electric_circuit' }>['load'],
  x: number,
  y: number,
) => {
  const load = kind ?? 'bulb';
  if (load === 'bulb') {
    ctx.strokeStyle = COLORS.accent;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x, y, 13, 0, Math.PI * 2);
    ctx.stroke();
    line(ctx, x - 8, y - 8, x + 8, y + 8, COLORS.accent, 1.8);
    line(ctx, x + 8, y - 8, x - 8, y + 8, COLORS.accent, 1.8);
    text(ctx, '豆電球', x, y + 26, 8, COLORS.accent);
  } else if (load === 'motor') {
    ctx.strokeStyle = COLORS.secondary;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.stroke();
    text(ctx, 'M', x, y, 12, COLORS.secondary);
    text(ctx, 'モーター', x, y + 26, 8, COLORS.secondary);
  } else if (load === 'capacitor') {
    line(ctx, x - 5, y - 14, x - 5, y + 14, COLORS.secondary, 3);
    line(ctx, x + 5, y - 14, x + 5, y + 14, COLORS.secondary, 3);
    text(ctx, 'ためる', x, y + 26, 8, COLORS.secondary);
  } else {
    ctx.strokeStyle = COLORS.danger;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x - 18, y - 8, 36, 16);
    text(ctx, '抵抗', x, y + 23, 8, COLORS.danger);
  }
};

const drawElectricCircuit = (
  ctx: CanvasRenderingContext2D,
  visual: Extract<ProblemVisual, { kind: 'electric_circuit' }>,
) => {
  title(ctx, visual.title);
  const top = 50;
  const bottom = 132;
  const left = 42;
  const right = 218;
  const sourceX = 70;
  const loadX = 181;
  const midY = (top + bottom) / 2;

  if (visual.source === 'generator') {
    ctx.strokeStyle = COLORS.good;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(sourceX, midY, 14, 0, Math.PI * 2);
    ctx.stroke();
    text(ctx, 'G', sourceX, midY, 11, COLORS.good);
    text(ctx, '発電', sourceX, midY + 27, 8, COLORS.good);
  } else {
    const count = Math.max(1, Math.min(2, visual.sourceCount ?? 1));
    for (let i = 0; i < count; i += 1) drawBattery(ctx, sourceX - 4 + i * 17, midY);
    text(ctx, `${count}こ`, sourceX + (count - 1) * 8, midY + 27, 8, COLORS.muted);
  }

  if (visual.arrangement === 'parallel') {
    line(ctx, left, top, right, top, COLORS.line, 2.5);
    line(ctx, left, bottom, right, bottom, COLORS.line, 2.5);
    line(ctx, left, top, left, bottom, COLORS.line, 2.5);
    line(ctx, right, top, right, bottom, COLORS.line, 2.5);
    line(ctx, 118, top, 118, bottom, COLORS.line, 2);
    drawLoad(ctx, visual.load, 118, 71);
    drawLoad(ctx, visual.load, 177, 111);
  } else {
    line(ctx, left, top, right, top, COLORS.line, 2.5);
    line(ctx, right, top, right, bottom, COLORS.line, 2.5);
    line(ctx, right, bottom, left, bottom, COLORS.line, 2.5);
    line(ctx, left, bottom, left, top, COLORS.line, 2.5);
    drawLoad(ctx, visual.load, loadX, top);
    if (visual.arrangement === 'series') {
      ctx.strokeStyle = COLORS.danger;
      ctx.lineWidth = 2.2;
      ctx.strokeRect(116, bottom - 8, 30, 16);
      text(ctx, 'R', 131, bottom, 8, COLORS.danger);
    }
  }
  arrow(ctx, 105, bottom, 132, bottom, COLORS.primary, 2);
  text(ctx, '電流', 118, bottom + 15, 8, COLORS.primary);
};

const drawMagneticField = (
  ctx: CanvasRenderingContext2D,
  visual: Extract<ProblemVisual, { kind: 'magnetic_field' }>,
) => {
  title(ctx, visual.title);
  if (visual.mode === 'wire') {
    const cx = 130;
    const cy = 94;
    [24, 43, 62].forEach((r, index) => {
      ctx.strokeStyle = index === 0 ? COLORS.accent : 'rgba(34, 211, 238, 0.62)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      const angle = -0.7 + index * 0.25;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      const tangent = angle + (visual.currentDirection === 'in' ? -Math.PI / 2 : Math.PI / 2);
      arrow(ctx, x - Math.cos(tangent) * 7, y - Math.sin(tangent) * 7, x + Math.cos(tangent) * 7, y + Math.sin(tangent) * 7, COLORS.primary, 1.4);
    });
    ctx.fillStyle = COLORS.text;
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, visual.currentDirection === 'in' ? '×' : '・', cx, cy, 12, '#0f172a');
    text(ctx, '電流のまわりに磁界', cx, 163, 9, COLORS.text);
    return;
  }

  const left = 76;
  const right = 184;
  const y = 88;
  roundedRect(ctx, left, y - 18, right - left, 36, 5);
  ctx.fillStyle = 'rgba(96, 165, 250, 0.18)';
  ctx.fill();
  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = 'rgba(251, 113, 133, 0.25)';
  ctx.fillRect(left, y - 18, (right - left) / 2, 36);
  text(ctx, 'N', left + 27, y, 13, COLORS.danger);
  text(ctx, 'S', right - 27, y, 13, COLORS.secondary);

  if (visual.mode === 'electromagnet') {
    ctx.strokeStyle = COLORS.accent;
    ctx.lineWidth = 2;
    for (let x = left + 10; x < right - 6; x += 13) {
      ctx.beginPath();
      ctx.ellipse(x, y, 7, 24, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    text(ctx, 'コイル＋鉄しん', 130, 135, 9, COLORS.accent);
  }

  [-1, 1].forEach((sign) => {
    [30, 49].forEach((offset) => {
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.64)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(left + 18, y + sign * 9);
      ctx.bezierCurveTo(70, y + sign * offset, 190, y + sign * offset, right - 18, y + sign * 9);
      ctx.stroke();
    });
  });
  text(ctx, '磁力線', 130, 158, 9, COLORS.primary);
};

const drawForceDiagram = (
  ctx: CanvasRenderingContext2D,
  visual: Extract<ProblemVisual, { kind: 'force_diagram' }>,
) => {
  title(ctx, visual.title);
  if (visual.layout === 'balance') {
    const y = 78;
    line(ctx, 58, y, 202, y, COLORS.line, 4);
    ctx.fillStyle = 'rgba(96, 165, 250, 0.32)';
    ctx.beginPath();
    ctx.moveTo(130, y + 4);
    ctx.lineTo(113, 139);
    ctx.lineTo(147, 139);
    ctx.closePath();
    ctx.fill();
    [78, 182].forEach((x) => {
      line(ctx, x, y, x, 118, COLORS.line, 1.5);
      ctx.strokeStyle = COLORS.secondary;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, 125, 19, 0.1, Math.PI - 0.1);
      ctx.stroke();
    });
    text(ctx, visual.leftLabel ?? '同じ重さ', 78, 137, 9, COLORS.primary);
    text(ctx, visual.rightLabel ?? '同じ重さ', 182, 137, 9, COLORS.primary);
    text(ctx, 'つり合い', 130, 158, 10, COLORS.accent);
    return;
  }

  const cx = 130;
  const cy = 96;
  roundedRect(ctx, cx - 28, cy - 20, 56, 40, 7);
  ctx.fillStyle = 'rgba(96, 165, 250, 0.16)';
  ctx.fill();
  ctx.strokeStyle = COLORS.secondary;
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, visual.objectLabel ?? '物体', cx, cy, 10, COLORS.text);

  const forces = visual.forces ?? [];
  forces.slice(0, 4).forEach((force, index) => {
    const scale = 30;
    const x2 = cx + force.dx * scale;
    const y2 = cy + force.dy * scale;
    const color = force.emphasized ? COLORS.accent : index % 2 === 0 ? COLORS.primary : COLORS.danger;
    arrow(ctx, cx, cy, x2, y2, color, force.emphasized ? 3 : 2.2);
    const labelX = x2 + (force.dx >= 0 ? 8 : -8);
    const labelY = y2 + (force.dy >= 0 ? 8 : -8);
    text(ctx, force.label, labelX, labelY, 8, color, force.dx >= 0 ? 'left' : 'right');
  });

  if (visual.layout === 'composition' && forces.length >= 2) {
    const fx = forces.slice(0, 2).reduce((sum, item) => sum + item.dx, 0);
    const fy = forces.slice(0, 2).reduce((sum, item) => sum + item.dy, 0);
    arrow(ctx, cx, cy, cx + fx * 25, cy + fy * 25, COLORS.accent, 3.2);
    text(ctx, visual.resultantLabel ?? '合力', cx + fx * 26, cy + fy * 26 - 10, 9, COLORS.accent);
  }
};

const drawLever = (
  ctx: CanvasRenderingContext2D,
  visual: Extract<ProblemVisual, { kind: 'lever' }>,
) => {
  title(ctx, visual.title);
  const pivotX = 130;
  const beamY = 86;
  line(ctx, 38, beamY, 222, beamY, COLORS.line, 5);
  ctx.fillStyle = 'rgba(96, 165, 250, 0.35)';
  ctx.beginPath();
  ctx.moveTo(pivotX, beamY + 4);
  ctx.lineTo(pivotX - 19, 142);
  ctx.lineTo(pivotX + 19, 142);
  ctx.closePath();
  ctx.fill();
  text(ctx, '支点', pivotX, 151, 9, COLORS.secondary);

  const maxDistance = Math.max(visual.leftDistance, visual.rightDistance, 1);
  const leftX = pivotX - 78 * (visual.leftDistance / maxDistance);
  const rightX = pivotX + 78 * (visual.rightDistance / maxDistance);
  arrow(ctx, leftX, 43, leftX, beamY - 4, COLORS.danger, 3);
  arrow(ctx, rightX, 43, rightX, beamY - 4, COLORS.primary, 3);
  text(ctx, visual.leftLabel ?? `作用点 ${visual.leftDistance}`, leftX, 31, 8, COLORS.danger);
  text(ctx, visual.rightLabel ?? `力点 ${visual.rightDistance}`, rightX, 31, 8, COLORS.primary);
  text(ctx, `${visual.leftDistance}`, (leftX + pivotX) / 2, beamY + 15, 8, COLORS.muted);
  text(ctx, `${visual.rightDistance}`, (rightX + pivotX) / 2, beamY + 15, 8, COLORS.muted);
};

const drawMotionGraph = (
  ctx: CanvasRenderingContext2D,
  visual: Extract<ProblemVisual, { kind: 'motion_graph' }>,
) => {
  title(ctx, visual.title);
  const left = 45;
  const right = 224;
  const top = 35;
  const bottom = 145;
  line(ctx, left, bottom, right, bottom, COLORS.line, 2.5);
  line(ctx, left, bottom, left, top, COLORS.line, 2.5);
  const xMax = Math.max(...visual.points.map((point) => point.x), 1);
  const yMax = Math.max(...visual.points.map((point) => point.y), 1);
  const mapX = (value: number) => left + (value / xMax) * (right - left - 8);
  const mapY = (value: number) => bottom - (value / yMax) * (bottom - top - 8);
  ctx.strokeStyle = COLORS.primary;
  ctx.lineWidth = 3;
  ctx.beginPath();
  visual.points.forEach((point, index) => {
    const x = mapX(point.x);
    const y = mapY(point.y);
    if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();
  visual.points.forEach((point, index) => {
    const x = mapX(point.x);
    const y = mapY(point.y);
    ctx.fillStyle = index === visual.highlightIndex ? COLORS.accent : COLORS.secondary;
    ctx.beginPath();
    ctx.arc(x, y, index === visual.highlightIndex ? 5 : 3, 0, Math.PI * 2);
    ctx.fill();
  });
  text(ctx, visual.xLabel ?? '時間', right, bottom + 16, 8, COLORS.muted, 'right');
  text(ctx, visual.yLabel ?? (visual.mode === 'distance_time' ? '道のり' : '速さ'), left + 4, top - 10, 8, COLORS.muted, 'left');
};

const drawEnergyBar = (
  ctx: CanvasRenderingContext2D,
  visual: Extract<ProblemVisual, { kind: 'energy_bar' }>,
) => {
  title(ctx, visual.title);
  const stages = visual.stages.slice(0, 4);
  const barW = 38;
  const maxH = 92;
  const baseline = 139;
  const gap = stages.length > 1 ? Math.min(28, (220 - stages.length * barW) / (stages.length - 1)) : 0;
  const totalW = stages.length * barW + (stages.length - 1) * gap;
  const startX = (260 - totalW) / 2;
  stages.forEach((stage, index) => {
    const x = startX + index * (barW + gap);
    const total = Math.max(1, stage.potential + stage.kinetic);
    const potentialH = maxH * stage.potential / total;
    const kineticH = maxH * stage.kinetic / total;
    ctx.fillStyle = 'rgba(96, 165, 250, 0.5)';
    ctx.fillRect(x, baseline - kineticH, barW, kineticH);
    ctx.fillStyle = 'rgba(251, 191, 36, 0.56)';
    ctx.fillRect(x, baseline - kineticH - potentialH, barW, potentialH);
    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, baseline - maxH, barW, maxH);
    text(ctx, stage.label, x + barW / 2, baseline + 15, 8, COLORS.text);
  });
  text(ctx, '位置', 38, 54, 8, COLORS.accent);
  text(ctx, '運動', 38, 68, 8, COLORS.secondary);
  text(ctx, '合計は一定', 130, 164, 9, COLORS.good);
};

export const drawSciencePhysicsProblemVisual = (
  ctx: CanvasRenderingContext2D,
  visual: ProblemVisual,
  _w: number,
  _h: number,
): boolean => {
  switch (visual.kind) {
    case 'ray_diagram':
      drawRayDiagram(ctx, visual);
      return true;
    case 'wave_diagram':
      drawWaveDiagram(ctx, visual);
      return true;
    case 'electric_circuit':
      drawElectricCircuit(ctx, visual);
      return true;
    case 'magnetic_field':
      drawMagneticField(ctx, visual);
      return true;
    case 'force_diagram':
      drawForceDiagram(ctx, visual);
      return true;
    case 'lever':
      drawLever(ctx, visual);
      return true;
    case 'motion_graph':
      drawMotionGraph(ctx, visual);
      return true;
    case 'energy_bar':
      drawEnergyBar(ctx, visual);
      return true;
    default:
      return false;
  }
};

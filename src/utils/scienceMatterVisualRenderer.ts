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

const roleColor = (role?: 'primary' | 'secondary' | 'positive' | 'negative' | 'solute') => {
  if (role === 'secondary' || role === 'negative') return COLORS.secondary;
  if (role === 'positive') return COLORS.danger;
  if (role === 'solute') return COLORS.accent;
  return COLORS.primary;
};

const drawParticle = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  label?: string,
  radius = 5,
) => {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  if (label) text(ctx, label, x, y, Math.max(6, radius + 1), '#0f172a');
};

const particlePositions = (count: number, x: number, y: number, width: number, height: number) => {
  const positions: Array<{ x: number; y: number }> = [];
  const safeCount = Math.max(1, count);
  for (let i = 0; i < safeCount; i += 1) {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const px = x + 13 + col * Math.max(15, (width - 26) / 3) + ((row % 2) * 3);
    const py = y + 14 + row * Math.max(15, (height - 28) / Math.max(1, Math.ceil(safeCount / 4) - 1));
    positions.push({ x: Math.min(x + width - 11, px), y: Math.min(y + height - 11, py) });
  }
  return positions;
};

const drawStateBox = (
  ctx: CanvasRenderingContext2D,
  state: 'solid' | 'liquid' | 'gas',
  x: number,
  y: number,
  width: number,
  height: number,
) => {
  roundedRect(ctx, x, y, width, height, 8);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.5)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)';
  ctx.lineWidth = 1.3;
  ctx.stroke();
  if (state === 'solid') {
    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        drawParticle(ctx, x + 16 + col * 15, y + height - 16 - row * 13, COLORS.secondary, undefined, 4.5);
      }
    }
  } else if (state === 'liquid') {
    const positions = [
      [14, 45], [28, 39], [43, 46], [20, 28], [37, 25], [49, 32], [11, 20], [31, 17],
    ];
    positions.forEach(([dx, dy], index) => drawParticle(ctx, x + Math.min(width - 10, dx), y + Math.min(height - 10, dy), index % 2 ? COLORS.primary : COLORS.secondary, undefined, 4.5));
  } else {
    const positions = [[14, 14], [width - 15, 18], [width / 2, height / 2], [18, height - 14], [width - 18, height - 16], [width * 0.72, height * 0.35]];
    positions.forEach(([dx, dy], index) => drawParticle(ctx, x + dx, y + dy, index % 2 ? COLORS.primary : COLORS.secondary, undefined, 4.5));
  }
};

const drawParticleModel = (
  ctx: CanvasRenderingContext2D,
  visual: Extract<ProblemVisual, { kind: 'particle_model' }>,
) => {
  title(ctx, visual.title);
  if (visual.mode === 'compression') {
    const y = 48;
    const h = 78;
    const leftX = 24;
    const leftW = 84;
    const rightX = 160;
    const rightW = 54;
    [
      [leftX, leftW, visual.leftLabel ?? 'おす前'],
      [rightX, rightW, visual.rightLabel ?? 'おした後'],
    ].forEach(([rawX, rawW, label], boxIndex) => {
      const x = Number(rawX);
      const w = Number(rawW);
      roundedRect(ctx, x, y, w, h, 7);
      ctx.fillStyle = boxIndex === 0 ? 'rgba(34, 211, 238, 0.08)' : 'rgba(251, 191, 36, 0.1)';
      ctx.fill();
      ctx.strokeStyle = boxIndex === 0 ? COLORS.primary : COLORS.accent;
      ctx.lineWidth = 1.8;
      ctx.stroke();
      particlePositions(10, x, y, w, h).forEach((position) => drawParticle(ctx, position.x, position.y, COLORS.primary, undefined, 4.2));
      text(ctx, String(label), x + w / 2, y + h + 14, 8, boxIndex === 0 ? COLORS.primary : COLORS.accent);
    });
    arrow(ctx, 118, 87, 150, 87, COLORS.accent, 2.5);
    text(ctx, '同じ数の粒', 130, 151, 9, COLORS.text);
    return;
  }

  if (visual.mode === 'molecules') {
    const particles = visual.particles?.slice(0, 4) ?? [{ label: 'O₂', count: 2 }];
    const cardW = 50;
    const gap = 10;
    const totalW = particles.length * cardW + (particles.length - 1) * gap;
    const startX = (260 - totalW) / 2;
    particles.forEach((particle, index) => {
      const x = startX + index * (cardW + gap);
      roundedRect(ctx, x, 58, cardW, 60, 8);
      ctx.fillStyle = 'rgba(96, 165, 250, 0.12)';
      ctx.fill();
      ctx.strokeStyle = roleColor(particle.role);
      ctx.lineWidth = 1.8;
      ctx.stroke();
      const count = Math.max(1, Math.min(3, particle.count ?? 2));
      const spacing = 12;
      const startAtomX = x + cardW / 2 - ((count - 1) * spacing) / 2;
      for (let atom = 0; atom < count; atom += 1) drawParticle(ctx, startAtomX + atom * spacing, 82, roleColor(particle.role), undefined, 6);
      text(ctx, particle.label, x + cardW / 2, 105, 9, COLORS.text);
    });
    text(ctx, '原子が結びついて分子になる', 130, 143, 9, COLORS.muted);
    return;
  }

  const boxX = 47;
  const boxY = 43;
  const boxW = 166;
  const boxH = 98;
  drawStateBox(ctx, visual.mode === 'dissolved' ? 'liquid' : visual.mode, boxX, boxY, boxW, boxH);
  if (visual.mode === 'dissolved') {
    const particles = visual.particles ?? [{ label: 'しお', count: 8, role: 'secondary' as const }];
    const positions = particlePositions(10, boxX + 5, boxY + 5, boxW - 10, boxH - 10);
    positions.forEach((position, index) => {
      const particle = particles[index % particles.length];
      drawParticle(ctx, position.x, position.y, roleColor(particle.role), undefined, 4.3);
    });
    text(ctx, '見えなくても粒は全体に広がる', 130, 157, 9, COLORS.accent);
  }
};

const drawPhaseChange = (
  ctx: CanvasRenderingContext2D,
  visual: Extract<ProblemVisual, { kind: 'phase_change' }>,
) => {
  title(ctx, visual.title);
  const stages = visual.stages.slice(0, 3);
  const cardW = 63;
  const gap = 20;
  const totalW = stages.length * cardW + (stages.length - 1) * gap;
  const startX = (260 - totalW) / 2;
  stages.forEach((stage, index) => {
    const x = startX + index * (cardW + gap);
    drawStateBox(ctx, stage.state, x, 52, cardW, 67);
    if (stage.emphasized) {
      roundedRect(ctx, x - 2, 50, cardW + 4, 71, 9);
      ctx.strokeStyle = COLORS.accent;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
    text(ctx, stage.label, x + cardW / 2, 135, 9, stage.emphasized ? COLORS.accent : COLORS.text);
    if (index < stages.length - 1) arrow(ctx, x + cardW + 4, 85, x + cardW + gap - 4, 85, COLORS.accent, 2);
  });
  text(ctx, '粒の数は同じ・並び方が変わる', 130, 157, 8, COLORS.muted);
};

const drawHeatFlow = (
  ctx: CanvasRenderingContext2D,
  visual: Extract<ProblemVisual, { kind: 'heat_flow' }>,
) => {
  title(ctx, visual.title);
  if (visual.mode === 'conduction') {
    const y = 92;
    line(ctx, 35, y, 225, y, COLORS.line, 12);
    for (let i = 0; i < 8; i += 1) {
      const ratio = i / 7;
      const x = 40 + ratio * 180;
      const color = ratio < 0.35 ? COLORS.danger : ratio < 0.7 ? COLORS.accent : COLORS.secondary;
      drawParticle(ctx, x, y, color, undefined, 5.5);
      if (i < 7) arrow(ctx, x + 7, y - 16, x + 15, y - 16, color, 1.2);
    }
    text(ctx, visual.hotLabel ?? 'あたためる', 42, 128, 8, COLORS.danger);
    text(ctx, visual.coolLabel ?? '熱が順に伝わる', 188, 128, 8, COLORS.primary);
    return;
  }

  const bx = 74;
  const by = 43;
  const bw = 112;
  const bh = 100;
  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(bx + 7, by + bh);
  ctx.lineTo(bx + bw - 7, by + bh);
  ctx.lineTo(bx + bw, by);
  ctx.stroke();
  ctx.fillStyle = 'rgba(96, 165, 250, 0.16)';
  ctx.fillRect(bx + 8, by + 12, bw - 16, bh - 14);
  arrow(ctx, 105, 126, 105, 66, COLORS.danger, 3);
  arrow(ctx, 155, 66, 155, 126, COLORS.secondary, 3);
  arrow(ctx, 110, 60, 148, 60, COLORS.accent, 2);
  arrow(ctx, 150, 132, 112, 132, COLORS.primary, 2);
  text(ctx, 'あたたかい水 ↑', 104, 52, 8, COLORS.danger);
  text(ctx, '冷たい水 ↓', 160, 151, 8, COLORS.secondary);
  ctx.fillStyle = COLORS.danger;
  ctx.beginPath();
  ctx.moveTo(112, 157);
  ctx.lineTo(130, 143);
  ctx.lineTo(148, 157);
  ctx.closePath();
  ctx.fill();
};

const drawBeaker = (
  ctx: CanvasRenderingContext2D,
  visual: Extract<ProblemVisual, { kind: 'beaker_model' }>,
) => {
  title(ctx, visual.title);
  const x = 63;
  const y = 39;
  const w = 134;
  const h = 108;
  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + 9, y + h);
  ctx.lineTo(x + w - 9, y + h);
  ctx.lineTo(x + w, y);
  ctx.stroke();
  const liquidTop = y + 28;
  ctx.fillStyle = 'rgba(34, 211, 238, 0.12)';
  ctx.fillRect(x + 8, liquidTop, w - 16, h - 29);
  line(ctx, x + 8, liquidTop, x + w - 8, liquidTop, COLORS.primary, 1.5);

  const expanded: Array<{ label: string; role?: 'solute' | 'positive' | 'negative' }> = [];
  visual.particles.forEach((particle) => {
    const count = Math.max(1, Math.min(8, particle.count ?? 3));
    for (let i = 0; i < count; i += 1) expanded.push({ label: particle.label, role: particle.role });
  });
  const positions = particlePositions(Math.min(expanded.length, 16), x + 12, liquidTop + 6, w - 24, h - 42);
  positions.forEach((position, index) => {
    const particle = expanded[index];
    const color = particle.role === 'positive' ? COLORS.danger : particle.role === 'negative' ? COLORS.secondary : COLORS.accent;
    drawParticle(ctx, position.x, position.y, color, visual.mode === 'ions' ? (particle.role === 'positive' ? '+' : particle.role === 'negative' ? '−' : '') : undefined, 5);
  });

  if (visual.electrodes) {
    line(ctx, 92, 29, 92, 100, COLORS.text, 3);
    line(ctx, 168, 29, 168, 100, COLORS.text, 3);
    text(ctx, '−', 92, 21, 10, COLORS.secondary);
    text(ctx, '+', 168, 21, 10, COLORS.danger);
  }
  text(ctx, visual.liquidLabel ?? (visual.mode === 'ions' ? 'イオンが動ける' : '水よう液'), 130, 160, 9, COLORS.text);
};

const drawCombustion = (
  ctx: CanvasRenderingContext2D,
  visual: Extract<ProblemVisual, { kind: 'combustion_model' }>,
) => {
  title(ctx, visual.title);
  const drawPanel = (x: number, oxygen: number, carbonDioxide: number, label: string) => {
    roundedRect(ctx, x, 43, 82, 94, 8);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.52)';
    ctx.fill();
    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    text(ctx, label, x + 41, 54, 9, COLORS.text);
    for (let i = 0; i < oxygen; i += 1) drawParticle(ctx, x + 18 + (i % 3) * 22, 74 + Math.floor(i / 3) * 20, COLORS.secondary, 'O', 6);
    for (let i = 0; i < carbonDioxide; i += 1) drawParticle(ctx, x + 20 + (i % 3) * 23, 118 - Math.floor(i / 3) * 18, COLORS.danger, 'C', 6);
  };
  drawPanel(27, visual.beforeOxygen, visual.beforeCarbonDioxide, 'もえる前');
  drawPanel(151, visual.afterOxygen, visual.afterCarbonDioxide, 'もえた後');
  ctx.fillStyle = COLORS.accent;
  ctx.beginPath();
  ctx.moveTo(130, 63);
  ctx.quadraticCurveTo(111, 93, 130, 117);
  ctx.quadraticCurveTo(151, 90, 130, 63);
  ctx.fill();
  text(ctx, 'O₂ ↓', 103, 154, 9, COLORS.secondary);
  text(ctx, 'CO₂ ↑', 160, 154, 9, COLORS.danger);
};

const atomColor = (atom: string, index: number) => {
  if (/^H/.test(atom)) return COLORS.primary;
  if (/^O/.test(atom)) return COLORS.danger;
  if (/^C/.test(atom)) return COLORS.muted;
  if (/^Na/.test(atom)) return COLORS.accent;
  if (/^Cl/.test(atom)) return COLORS.good;
  return index % 2 === 0 ? COLORS.secondary : COLORS.purple;
};

const drawMolecule = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  atoms?: string[],
) => {
  const parts = atoms?.length ? atoms.slice(0, 4) : [label];
  const spacing = 12;
  const startX = x - ((parts.length - 1) * spacing) / 2;
  parts.forEach((atom, index) => drawParticle(ctx, startX + index * spacing, y, atomColor(atom, index), atom.length <= 2 ? atom : undefined, 6.5));
  text(ctx, label, x, y + 18, 8, COLORS.text);
};

const drawParticleReaction = (
  ctx: CanvasRenderingContext2D,
  visual: Extract<ProblemVisual, { kind: 'particle_reaction' }>,
) => {
  title(ctx, visual.title);
  const leftX = 70;
  const rightX = 190;
  text(ctx, visual.beforeLabel ?? '反応前', leftX, 42, 9, COLORS.muted);
  text(ctx, visual.afterLabel ?? '反応後', rightX, 42, 9, COLORS.muted);
  const drawSide = (items: typeof visual.before, centerX: number) => {
    const expanded: Array<{ label: string; atoms?: string[] }> = [];
    items.forEach((item) => {
      const count = Math.max(1, Math.min(3, item.count ?? 1));
      for (let i = 0; i < count; i += 1) expanded.push({ label: item.label, atoms: item.atoms });
    });
    expanded.slice(0, 4).forEach((item, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      drawMolecule(ctx, centerX - 24 + col * 48, 72 + row * 46, item.label, item.atoms);
    });
  };
  drawSide(visual.before, leftX);
  drawSide(visual.after, rightX);
  arrow(ctx, 116, 96, 144, 96, COLORS.accent, 2.5);
  text(ctx, '原子は組み替わる', 130, 160, 9, COLORS.good);
};

const drawPhScale = (
  ctx: CanvasRenderingContext2D,
  visual: Extract<ProblemVisual, { kind: 'ph_scale' }>,
) => {
  title(ctx, visual.title);
  const left = 38;
  const right = 222;
  const y = 94;
  const acidEnd = left + (right - left) * (6.5 / 14);
  const neutralX = left + (right - left) * 0.5;
  const alkaliStart = left + (right - left) * (7.5 / 14);
  ctx.lineWidth = 12;
  ctx.strokeStyle = 'rgba(251, 113, 133, 0.65)';
  ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(acidEnd, y); ctx.stroke();
  ctx.strokeStyle = 'rgba(52, 211, 153, 0.75)';
  ctx.beginPath(); ctx.moveTo(acidEnd, y); ctx.lineTo(alkaliStart, y); ctx.stroke();
  ctx.strokeStyle = 'rgba(96, 165, 250, 0.7)';
  ctx.beginPath(); ctx.moveTo(alkaliStart, y); ctx.lineTo(right, y); ctx.stroke();
  for (let value = 0; value <= 14; value += 1) {
    const x = left + (right - left) * (value / 14);
    line(ctx, x, y - 9, x, y + 9, 'rgba(226, 232, 240, 0.7)', value === 7 ? 2.5 : 1);
    if (value % 2 === 0 || value === 7) text(ctx, String(value), x, y + 22, 7, value === 7 ? COLORS.good : COLORS.muted);
  }
  text(ctx, '酸性', 63, 55, 10, COLORS.danger);
  text(ctx, '中性', neutralX, 55, 10, COLORS.good);
  text(ctx, 'アルカリ性', 190, 55, 10, COLORS.secondary);
  let markerValue = visual.value;
  if (markerValue == null && visual.emphasize) markerValue = visual.emphasize === 'acid' ? 3 : visual.emphasize === 'neutral' ? 7 : 11;
  if (markerValue != null) {
    const safeValue = Math.max(0, Math.min(14, markerValue));
    const x = left + (right - left) * (safeValue / 14);
    ctx.fillStyle = COLORS.accent;
    ctx.beginPath();
    ctx.moveTo(x, y - 21);
    ctx.lineTo(x - 6, y - 31);
    ctx.lineTo(x + 6, y - 31);
    ctx.closePath();
    ctx.fill();
    text(ctx, visual.markerLabel ?? `pH ${safeValue}`, x, y - 42, 9, COLORS.accent);
  }
};

export const drawScienceMatterProblemVisual = (
  ctx: CanvasRenderingContext2D,
  visual: ProblemVisual,
  _w: number,
  _h: number,
): boolean => {
  switch (visual.kind) {
    case 'particle_model':
      drawParticleModel(ctx, visual);
      return true;
    case 'phase_change':
      drawPhaseChange(ctx, visual);
      return true;
    case 'heat_flow':
      drawHeatFlow(ctx, visual);
      return true;
    case 'beaker_model':
      drawBeaker(ctx, visual);
      return true;
    case 'combustion_model':
      drawCombustion(ctx, visual);
      return true;
    case 'particle_reaction':
      drawParticleReaction(ctx, visual);
      return true;
    case 'ph_scale':
      drawPhScale(ctx, visual);
      return true;
    default:
      return false;
  }
};

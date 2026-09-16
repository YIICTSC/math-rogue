import type { ProblemVisual } from '../data/subjects/utils';

const COLORS = {
  text: '#f8fafc',
  muted: '#94a3b8',
  primary: '#22d3ee',
  secondary: '#60a5fa',
  accent: '#fbbf24',
  danger: '#fb7185',
  good: '#34d399',
  earth: '#a78bfa',
  line: 'rgba(226, 232, 240, 0.72)',
};

const text = (ctx: CanvasRenderingContext2D, value: string, x: number, y: number, size = 9, color = COLORS.text, align: CanvasTextAlign = 'center') => {
  ctx.fillStyle = color;
  ctx.font = `700 ${size}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
};

const line = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color = COLORS.line, width = 2) => {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
};

const arrow = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color = COLORS.primary, width = 2) => {
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

const title = (ctx: CanvasRenderingContext2D, value?: string) => {
  if (value) text(ctx, value, 130, 14, 11, COLORS.muted);
};

const circle = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string, stroke?: string) => {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
};

const drawSun = (ctx: CanvasRenderingContext2D, x: number, y: number, radius = 14) => {
  circle(ctx, x, y, radius, COLORS.accent);
  for (let i = 0; i < 8; i += 1) {
    const angle = i * Math.PI / 4;
    line(ctx, x + Math.cos(angle) * (radius + 4), y + Math.sin(angle) * (radius + 4), x + Math.cos(angle) * (radius + 10), y + Math.sin(angle) * (radius + 10), COLORS.accent, 1.5);
  }
};

const drawSunShadow = (ctx: CanvasRenderingContext2D, visual: Extract<ProblemVisual, { kind: 'sun_shadow' }>) => {
  title(ctx, visual.title);
  const groundY = 136;
  line(ctx, 26, groundY, 234, groundY, COLORS.line, 2.5);
  const objectX = 130;
  line(ctx, objectX, groundY, objectX, 76, COLORS.text, 5);
  circle(ctx, objectX, 68, 8, COLORS.secondary);
  const sunByPosition = {
    morning: { x: 48, y: 63, label: '朝', shadowX: 212 },
    noon: { x: 130, y: 43, label: '昼', shadowX: 164 },
    evening: { x: 212, y: 63, label: '夕方', shadowX: 48 },
  } as const;
  const sun = sunByPosition[visual.sunPosition];
  drawSun(ctx, sun.x, sun.y, 12);
  line(ctx, sun.x, sun.y, objectX, 75, 'rgba(251,191,36,0.45)', 1.5);
  line(ctx, objectX, groundY + 2, sun.shadowX, groundY + 2, 'rgba(96,165,250,0.7)', 7);
  text(ctx, sun.label, sun.x, 97, 9, COLORS.accent);
  text(ctx, visual.sunPosition === 'noon' ? 'かげは短い' : 'かげは長い', (objectX + sun.shadowX) / 2, 156, 9, COLORS.secondary);
};

const drawCloud = (ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1, color = 'rgba(226,232,240,0.82)') => {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x - 12 * scale, y, 10 * scale, Math.PI, 0);
  ctx.arc(x, y - 7 * scale, 14 * scale, Math.PI, 0);
  ctx.arc(x + 14 * scale, y, 10 * scale, Math.PI, 0);
  ctx.lineTo(x + 24 * scale, y + 9 * scale);
  ctx.lineTo(x - 22 * scale, y + 9 * scale);
  ctx.closePath();
  ctx.fill();
};

const drawWeatherMap = (ctx: CanvasRenderingContext2D, visual: Extract<ProblemVisual, { kind: 'weather_map' }>) => {
  title(ctx, visual.title);
  if (visual.mode === 'temperature') {
    const left = 38; const right = 226; const top = 48; const bottom = 142;
    line(ctx, left, bottom, right, bottom, COLORS.line, 2);
    line(ctx, left, bottom, left, top, COLORS.line, 2);
    const values = [9, 14, 21, 25, 20, 15];
    const labels = ['6', '9', '12', '15', '18', '21'];
    ctx.strokeStyle = COLORS.primary; ctx.lineWidth = 3; ctx.beginPath();
    values.forEach((value, index) => {
      const x = left + index * ((right - left) / (values.length - 1));
      const y = bottom - ((value - 5) / 25) * (bottom - top);
      if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      circle(ctx, x, y, 3.5, index === 3 ? COLORS.accent : COLORS.primary);
      text(ctx, labels[index], x, bottom + 14, 7, COLORS.muted);
    });
    text(ctx, '気温', left + 4, top - 9, 8, COLORS.muted, 'left');
    text(ctx, '時こく →', right, top - 9, 8, COLORS.muted, 'right');
    text(ctx, '昼ごろに高くなる', 130, 162, 9, COLORS.accent);
    return;
  }
  if (visual.mode === 'typhoon') {
    const cx = 130; const cy = 94;
    for (let turn = 0; turn < 3; turn += 1) {
      ctx.strokeStyle = turn === 0 ? COLORS.primary : `rgba(96,165,250,${0.65 - turn * 0.14})`;
      ctx.lineWidth = 3 - turn * 0.4;
      ctx.beginPath();
      for (let i = 0; i <= 55; i += 1) {
        const t = i / 55 * Math.PI * 1.75 + turn * 0.65;
        const r = 12 + i * 0.85;
        const x = cx + Math.cos(t) * r;
        const y = cy + Math.sin(t) * r * 0.68;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    circle(ctx, cx, cy, 9, 'rgba(15,23,42,0.95)', COLORS.accent);
    text(ctx, '目', cx, cy, 8, COLORS.accent);
    text(ctx, '反時計回りに風が吹きこむ', 130, 158, 9, COLORS.text);
    return;
  }
  if (visual.mode === 'front') {
    const baseY = 128;
    ctx.fillStyle = 'rgba(96,165,250,0.18)';
    ctx.beginPath(); ctx.moveTo(24, baseY); ctx.lineTo(104, 72); ctx.lineTo(142, baseY); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(251,113,133,0.17)';
    ctx.beginPath(); ctx.moveTo(104, 72); ctx.lineTo(236, 51); ctx.lineTo(236, baseY); ctx.lineTo(142, baseY); ctx.closePath(); ctx.fill();
    line(ctx, 24, baseY, 236, baseY, COLORS.line, 2);
    arrow(ctx, 58, 122, 111, 80, COLORS.secondary, 2.5);
    arrow(ctx, 184, 103, 126, 78, COLORS.danger, 2.5);
    drawCloud(ctx, 117, 55, 0.75, 'rgba(226,232,240,0.8)');
    text(ctx, '寒気', 58, 145, 9, COLORS.secondary);
    text(ctx, '暖気', 193, 145, 9, COLORS.danger);
    text(ctx, '前線で上昇気流', 130, 163, 8, COLORS.accent);
    return;
  }

  drawCloud(ctx, 61, 77, 0.85, 'rgba(148,163,184,0.68)');
  drawCloud(ctx, 126, 71, 1, 'rgba(226,232,240,0.86)');
  drawCloud(ctx, 197, 83, 0.78, 'rgba(148,163,184,0.65)');
  arrow(ctx, 40, 122, 219, 122, COLORS.primary, 3);
  text(ctx, '西', 35, 145, 9, COLORS.muted);
  text(ctx, '東', 225, 145, 9, COLORS.muted);
  text(ctx, '雲と天気は西から東へ', 130, 161, 9, COLORS.text);
};

const drawOrbitDiagram = (ctx: CanvasRenderingContext2D, visual: Extract<ProblemVisual, { kind: 'orbit_diagram' }>) => {
  title(ctx, visual.title);
  if (visual.mode === 'moon_phase') {
    const cx = 130; const cy = 96;
    circle(ctx, cx, cy, 14, '#2563eb');
    text(ctx, '地球', cx, cy + 28, 8, COLORS.secondary);
    drawSun(ctx, 35, cy, 13);
    ctx.strokeStyle = 'rgba(148,163,184,0.45)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(cx, cy, 70, 48, 0, 0, Math.PI * 2); ctx.stroke();
    const moons = [{ x: 75, y: 96, label: '新月' }, { x: 130, y: 50, label: '半月' }, { x: 191, y: 96, label: '満月' }, { x: 130, y: 142, label: '半月' }];
    moons.forEach((moon, index) => {
      circle(ctx, moon.x, moon.y, 7, index === 2 ? '#f8fafc' : '#64748b', COLORS.line);
      if (index === 0 || index === 2) text(ctx, moon.label, moon.x, moon.y - 16, 7, index === 2 ? COLORS.accent : COLORS.muted);
    });
    arrow(ctx, 151, 54, 172, 65, COLORS.primary, 1.7);
    return;
  }
  if (visual.mode === 'solar_system') {
    drawSun(ctx, 31, 91, 17);
    const names = ['水', '金', '地', '火', '木', '土', '天', '海'];
    const radii = [4, 5, 5, 4, 9, 8, 6, 6];
    const colors = [COLORS.muted, COLORS.accent, '#2563eb', COLORS.danger, '#d97706', '#eab308', '#38bdf8', '#3b82f6'];
    names.forEach((name, index) => {
      const x = 61 + index * 23;
      circle(ctx, x, 91, radii[index], colors[index]);
      text(ctx, name, x, 116, 7, COLORS.text);
    });
    text(ctx, '太陽からの順番', 130, 148, 9, COLORS.muted);
    return;
  }
  if (visual.mode === 'earth_sun') {
    const cx = 130; const cy = 94;
    drawSun(ctx, cx, cy, 17);
    ctx.strokeStyle = 'rgba(148,163,184,0.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(cx, cy, 88, 52, 0, 0, Math.PI * 2); ctx.stroke();
    const earths = [{ x: 42, y: 94, label: '夏' }, { x: 130, y: 42, label: '秋' }, { x: 218, y: 94, label: '冬' }, { x: 130, y: 146, label: '春' }];
    earths.forEach((earth) => {
      circle(ctx, earth.x, earth.y, 8, '#2563eb');
      line(ctx, earth.x - 4, earth.y + 10, earth.x + 5, earth.y - 12, COLORS.text, 1.4);
      text(ctx, earth.label, earth.x, earth.y + (earth.y < cy ? -17 : 18), 7, COLORS.text);
    });
    text(ctx, '地軸を傾けたまま公転', 130, 167, 9, COLORS.accent);
    return;
  }

  const horizonY = 137;
  line(ctx, 29, horizonY, 231, horizonY, COLORS.line, 2);
  ctx.strokeStyle = COLORS.primary; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(130, horizonY, 82, Math.PI, 0); ctx.stroke();
  ['東', '南', '西'].forEach((label, index) => text(ctx, label, [48, 130, 212][index], 153, 8, COLORS.muted));
  const points = [{ x: 63, y: 92 }, { x: 93, y: 64 }, { x: 130, y: 55 }, { x: 167, y: 64 }, { x: 197, y: 92 }];
  points.forEach((point, index) => {
    circle(ctx, point.x, point.y, index === 2 ? 4.5 : 3, index === 2 ? COLORS.accent : COLORS.primary);
    if (index < points.length - 1) arrow(ctx, point.x + 6, point.y, points[index + 1].x - 6, points[index + 1].y, 'rgba(34,211,238,0.6)', 1.3);
  });
  text(ctx, '東 → 南中 → 西', 130, 166, 9, COLORS.text);
};

const drawRiverCrossSection = (ctx: CanvasRenderingContext2D, visual: Extract<ProblemVisual, { kind: 'river_cross_section' }>) => {
  title(ctx, visual.title);
  if (visual.mode === 'upper_lower') {
    ctx.strokeStyle = COLORS.earth; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(22, 55); ctx.quadraticCurveTo(78, 65, 111, 93); ctx.quadraticCurveTo(160, 128, 236, 134); ctx.stroke();
    ctx.strokeStyle = COLORS.primary; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(30, 63); ctx.quadraticCurveTo(82, 73, 113, 99); ctx.quadraticCurveTo(163, 132, 228, 137); ctx.stroke();
    arrow(ctx, 77, 78, 113, 99, COLORS.primary, 2);
    arrow(ctx, 149, 123, 191, 135, COLORS.primary, 2);
    text(ctx, '上流：速い・けずる', 68, 38, 8, COLORS.danger);
    text(ctx, '下流：ゆるい・つもる', 187, 158, 8, COLORS.accent);
    return;
  }
  ctx.strokeStyle = COLORS.primary; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(35, 63); ctx.bezierCurveTo(210, 43, 57, 143, 225, 122); ctx.stroke();
  arrow(ctx, 65, 61, 108, 70, '#7dd3fc', 2);
  arrow(ctx, 152, 104, 197, 119, '#7dd3fc', 2);
  circle(ctx, 108, 64, 6, COLORS.danger);
  circle(ctx, 115, 115, 7, COLORS.accent);
  text(ctx, '外側：侵食', 83, 39, 9, COLORS.danger);
  text(ctx, '内側：堆積', 146, 145, 9, COLORS.accent);
};

const drawEarthCrossSection = (ctx: CanvasRenderingContext2D, visual: Extract<ProblemVisual, { kind: 'earth_cross_section' }>) => {
  title(ctx, visual.title);
  if (visual.mode === 'strata') {
    const colors = ['rgba(251,191,36,0.35)', 'rgba(96,165,250,0.32)', 'rgba(167,139,250,0.32)', 'rgba(52,211,153,0.28)'];
    const labels = ['新しい', '', '', '古い'];
    for (let i = 0; i < 4; i += 1) {
      const y = 48 + i * 24;
      ctx.fillStyle = colors[i]; ctx.fillRect(45, y, 170, 22);
      line(ctx, 45, y, 215, y, 'rgba(226,232,240,0.45)', 1);
      if (labels[i]) text(ctx, labels[i], 225, y + 11, 7, i === 0 ? COLORS.primary : COLORS.accent, 'left');
    }
    circle(ctx, 85, 107, 5, COLORS.muted); circle(ctx, 98, 107, 3, COLORS.muted);
    text(ctx, 'れき・砂・泥などが積み重なる', 130, 159, 9, COLORS.text);
    return;
  }
  if (visual.mode === 'volcano') {
    ctx.fillStyle = 'rgba(148,163,184,0.28)'; ctx.beginPath(); ctx.moveTo(31, 137); ctx.lineTo(113, 49); ctx.lineTo(137, 49); ctx.lineTo(229, 137); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(251,113,133,0.55)'; ctx.beginPath(); ctx.moveTo(121, 137); ctx.lineTo(121, 73); ctx.quadraticCurveTo(130, 59, 139, 73); ctx.lineTo(139, 137); ctx.closePath(); ctx.fill();
    circle(ctx, 130, 142, 27, 'rgba(251,113,133,0.28)', COLORS.danger);
    arrow(ctx, 130, 126, 130, 63, COLORS.danger, 3);
    drawCloud(ctx, 129, 39, 0.68, 'rgba(148,163,184,0.72)');
    text(ctx, 'マグマ', 130, 146, 8, COLORS.danger);
    text(ctx, '火口', 158, 58, 8, COLORS.accent);
    return;
  }
  if (visual.mode === 'earthquake') {
    line(ctx, 31, 58, 229, 58, COLORS.line, 2.5);
    const fx = 130; const fy = 119;
    circle(ctx, fx, fy, 6, COLORS.danger);
    text(ctx, '震源', fx, fy + 18, 8, COLORS.danger);
    line(ctx, fx, fy - 6, fx, 58, 'rgba(251,191,36,0.55)', 1.5);
    circle(ctx, fx, 58, 5, COLORS.accent);
    text(ctx, '震央', fx + 12, 48, 8, COLORS.accent, 'left');
    [20, 38, 57].forEach((r, index) => {
      ctx.strokeStyle = index === 0 ? COLORS.primary : `rgba(96,165,250,${0.65 - index * 0.15})`;
      ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(fx, fy, r, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
    });
    text(ctx, 'P波 → S波', 130, 163, 9, COLORS.text);
    return;
  }

  ctx.fillStyle = 'rgba(96,165,250,0.22)'; ctx.fillRect(24, 49, 98, 37);
  ctx.fillStyle = 'rgba(148,163,184,0.30)'; ctx.beginPath(); ctx.moveTo(122, 49); ctx.lineTo(236, 49); ctx.lineTo(236, 112); ctx.lineTo(151, 87); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(167,139,250,0.22)'; ctx.beginPath(); ctx.moveTo(24, 86); ctx.lineTo(122, 86); ctx.lineTo(183, 145); ctx.lineTo(24, 145); ctx.closePath(); ctx.fill();
  line(ctx, 122, 49, 183, 145, COLORS.line, 3);
  arrow(ctx, 82, 71, 116, 71, COLORS.primary, 2.7);
  arrow(ctx, 188, 70, 149, 85, COLORS.danger, 2.7);
  text(ctx, '海のプレート', 68, 157, 8, COLORS.secondary);
  text(ctx, '陸のプレート', 194, 130, 8, COLORS.muted);
  text(ctx, 'しずみこみ', 147, 108, 8, COLORS.accent);
};

export const drawScienceEarthProblemVisual = (ctx: CanvasRenderingContext2D, visual: ProblemVisual, _w: number, _h: number): boolean => {
  switch (visual.kind) {
    case 'sun_shadow': drawSunShadow(ctx, visual); return true;
    case 'weather_map': drawWeatherMap(ctx, visual); return true;
    case 'orbit_diagram': drawOrbitDiagram(ctx, visual); return true;
    case 'river_cross_section': drawRiverCrossSection(ctx, visual); return true;
    case 'earth_cross_section': drawEarthCrossSection(ctx, visual); return true;
    default: return false;
  }
};

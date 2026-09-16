import type { ProblemVisual } from '../data/subjects/utils';

const COLORS = {
  text: '#f8fafc',
  muted: '#94a3b8',
  primary: '#22d3ee',
  secondary: '#60a5fa',
  accent: '#fbbf24',
  good: '#34d399',
  danger: '#fb7185',
  purple: '#c084fc',
  line: 'rgba(226, 232, 240, 0.72)',
  panel: 'rgba(15, 23, 42, 0.68)',
};

type Tone = 'primary' | 'secondary' | 'accent' | 'good' | 'danger' | 'purple';

const toneColor = (tone: Tone | undefined) => tone ? COLORS[tone] : COLORS.primary;

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

const fitText = (
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  maxWidth: number,
  size = 10,
  color = COLORS.text,
  align: CanvasTextAlign = 'center',
) => {
  let fontSize = size;
  ctx.font = `700 ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  while (fontSize > 6 && ctx.measureText(value).width > maxWidth) {
    fontSize -= 0.5;
    ctx.font = `700 ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  }
  ctx.fillStyle = color;
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

const title = (ctx: CanvasRenderingContext2D, value?: string, note?: string) => {
  if (value) fitText(ctx, value, 130, 14, 220, 11, COLORS.text);
  if (note) fitText(ctx, note, 130, 28, 220, 7.5, COLORS.muted);
};

const drawPanel = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color = COLORS.primary,
) => {
  roundedRect(ctx, x, y, width, height, 8);
  ctx.fillStyle = COLORS.panel;
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.stroke();
};

const drawCompass = (
  ctx: CanvasRenderingContext2D,
  visual: Extract<ProblemVisual, { kind: 'social_map' }>,
) => {
  title(ctx, visual.title || '方位を読む', '上が北の地図（模式図）');
  const cx = 130;
  const cy = 102;
  const directions = [
    { key: 'N', dx: 0, dy: -1, label: '北' },
    { key: 'NE', dx: 0.7, dy: -0.7 },
    { key: 'E', dx: 1, dy: 0 },
    { key: 'SE', dx: 0.7, dy: 0.7 },
    { key: 'S', dx: 0, dy: 1 },
    { key: 'SW', dx: -0.7, dy: 0.7 },
    { key: 'W', dx: -1, dy: 0 },
    { key: 'NW', dx: -0.7, dy: -0.7 },
  ];
  ctx.strokeStyle = 'rgba(148,163,184,0.25)';
  ctx.lineWidth = 1;
  for (let x = 34; x <= 226; x += 32) line(ctx, x, 42, x, 162, 'rgba(148,163,184,0.18)', 1);
  for (let y = 46; y <= 158; y += 28) line(ctx, 32, y, 228, y, 'rgba(148,163,184,0.18)', 1);
  directions.forEach(({ key, dx, dy, label }) => {
    const emphasized = key === visual.highlightDirection;
    const color = emphasized ? COLORS.accent : key === 'N' ? COLORS.primary : COLORS.line;
    arrow(ctx, cx, cy, cx + dx * 58, cy + dy * 58, color, emphasized ? 4 : 2);
    if (label) fitText(ctx, label, cx + dx * 76, cy + dy * 68, 26, 11, color);
  });
  ctx.fillStyle = COLORS.text;
  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx.fill();
};

const drawAtlas = (ctx: CanvasRenderingContext2D, visual: Extract<ProblemVisual, { kind: 'social_map' }>) => {
  title(ctx, visual.title || '地図帳を読む', '位置を探すための道具');
  drawPanel(ctx, 18, 42, 150, 116, COLORS.secondary);
  for (let x = 44; x < 168; x += 30) line(ctx, x, 42, x, 158, 'rgba(148,163,184,0.16)', 1);
  for (let y = 68; y < 158; y += 28) line(ctx, 18, y, 168, y, 'rgba(148,163,184,0.16)', 1);
  ctx.strokeStyle = COLORS.primary;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(26, 134);
  ctx.bezierCurveTo(52, 112, 75, 124, 91, 96);
  ctx.bezierCurveTo(110, 64, 134, 87, 160, 57);
  ctx.stroke();
  line(ctx, 38, 55, 145, 142, COLORS.accent, 3);
  drawPanel(ctx, 178, 43, 64, 32, COLORS.good);
  drawPanel(ctx, 178, 83, 64, 32, COLORS.purple);
  drawPanel(ctx, 178, 123, 64, 32, COLORS.accent);
  fitText(ctx, 'さくいん', 210, 59, 56, 8, COLORS.good);
  fitText(ctx, '凡例', 210, 99, 56, 8, COLORS.purple);
  fitText(ctx, '縮尺', 210, 139, 56, 8, COLORS.accent);
};

const drawLatLon = (ctx: CanvasRenderingContext2D, visual: Extract<ProblemVisual, { kind: 'social_map' }>) => {
  title(ctx, visual.title || '緯度・経度', '地球上の位置を表す線');
  const cx = 130;
  const cy = 103;
  ctx.strokeStyle = COLORS.secondary;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 91, 55, 0, 0, Math.PI * 2);
  ctx.stroke();
  [-28, 0, 28].forEach((offset) => {
    ctx.beginPath();
    ctx.ellipse(cx, cy + offset, 91 * Math.sqrt(Math.max(0.1, 1 - (offset / 58) ** 2)), 9, 0, 0, Math.PI * 2);
    ctx.strokeStyle = offset === 0 ? COLORS.accent : 'rgba(96,165,250,0.48)';
    ctx.lineWidth = offset === 0 ? 2.5 : 1.2;
    ctx.stroke();
  });
  [-50, -25, 0, 25, 50].forEach((offset) => {
    ctx.beginPath();
    ctx.ellipse(cx, cy, Math.max(9, 91 - Math.abs(offset) * 0.9), 55, 0, 0, Math.PI * 2);
    ctx.strokeStyle = offset === 0 ? COLORS.good : 'rgba(96,165,250,0.38)';
    ctx.lineWidth = offset === 0 ? 2.5 : 1;
    ctx.stroke();
  });
  fitText(ctx, '0°', 222, 103, 26, 8, COLORS.accent);
  fitText(ctx, '0°', 130, 165, 26, 8, COLORS.good);
};

const drawJapanOverview = (ctx: CanvasRenderingContext2D, visual: Extract<ProblemVisual, { kind: 'social_map' }>) => {
  title(ctx, visual.title || '日本列島の広がり', '位置関係をつかむための概略図');
  fitText(ctx, '北', 48, 49, 20, 10, COLORS.primary);
  arrow(ctx, 49, 62, 49, 40, COLORS.primary, 2.5);
  fitText(ctx, '南', 211, 151, 20, 10, COLORS.accent);
  arrow(ctx, 210, 139, 210, 163, COLORS.accent, 2.5);

  ctx.fillStyle = 'rgba(52,211,153,0.28)';
  ctx.strokeStyle = COLORS.good;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(78, 59, 19, 13, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(95, 74);
  ctx.bezierCurveTo(112, 79, 126, 94, 143, 101);
  ctx.bezierCurveTo(157, 108, 169, 119, 182, 123);
  ctx.lineTo(174, 132);
  ctx.bezierCurveTo(156, 126, 145, 117, 129, 110);
  ctx.bezierCurveTo(115, 103, 103, 93, 89, 86);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(147, 132, 18, 6, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(178, 143, 16, 11, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  [194, 203, 213].forEach((x, index) => {
    ctx.beginPath();
    ctx.arc(x, 153 + index * 4, 2.2, 0, Math.PI * 2);
    ctx.fill();
  });
  arrow(ctx, 86, 67, 186, 143, COLORS.muted, 1.6);
};

const drawSocialMap = (ctx: CanvasRenderingContext2D, visual: Extract<ProblemVisual, { kind: 'social_map' }>) => {
  switch (visual.mode) {
    case 'compass': drawCompass(ctx, visual); break;
    case 'atlas': drawAtlas(ctx, visual); break;
    case 'latlon': drawLatLon(ctx, visual); break;
    case 'japan_overview': drawJapanOverview(ctx, visual); break;
  }
};

const drawMountain = (ctx: CanvasRenderingContext2D, x: number, baseY: number, width: number, height: number) => {
  ctx.fillStyle = 'rgba(148,163,184,0.2)';
  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - width / 2, baseY);
  ctx.lineTo(x, baseY - height);
  ctx.lineTo(x + width / 2, baseY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
};

const drawSocialLandform = (
  ctx: CanvasRenderingContext2D,
  visual: Extract<ProblemVisual, { kind: 'social_landform' }>,
) => {
  title(ctx, visual.title || '土地の高低と水の流れ', '地形の模式断面');
  const baseY = 146;
  drawMountain(ctx, 48, baseY, 75, 83);
  drawMountain(ctx, 84, baseY, 62, 61);
  ctx.fillStyle = 'rgba(52,211,153,0.18)';
  ctx.fillRect(105, 116, 86, 30);
  ctx.strokeStyle = COLORS.good;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(105, 116);
  ctx.lineTo(191, 116);
  ctx.stroke();
  ctx.fillStyle = 'rgba(34,211,238,0.25)';
  ctx.fillRect(191, 116, 54, 30);
  fitText(ctx, '海', 218, 132, 32, 9, COLORS.primary);
  ctx.strokeStyle = COLORS.primary;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(70, 83);
  ctx.bezierCurveTo(96, 97, 111, 103, 125, 119);
  ctx.bezierCurveTo(150, 136, 172, 130, 198, 129);
  ctx.stroke();
  arrow(ctx, 120, 117, 179, 129, COLORS.primary, 2.2);
  if (visual.mode === 'terrain') {
    fitText(ctx, '高い', 46, 157, 36, 8, COLORS.muted);
    fitText(ctx, '低い', 147, 157, 36, 8, COLORS.muted);
  } else if (visual.mode === 'river_plain') {
    fitText(ctx, '川が運ぶ土砂', 137, 99, 78, 8, COLORS.accent);
  } else if (visual.mode === 'coast') {
    ctx.strokeStyle = COLORS.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(205, 109, 15, Math.PI, Math.PI * 2);
    ctx.stroke();
  } else {
    fitText(ctx, '山地が多い', 68, 51, 80, 8, COLORS.accent);
    fitText(ctx, '川は短く急', 137, 91, 86, 8, COLORS.primary);
  }
};

const drawSocialClimograph = (
  ctx: CanvasRenderingContext2D,
  visual: Extract<ProblemVisual, { kind: 'social_climograph' }>,
) => {
  title(ctx, visual.title || '雨温図を読む', '棒と折れ線を同じ月で比べる');
  const left = 30;
  const top = 45;
  const width = 200;
  const height = 105;
  line(ctx, left, top, left, top + height, COLORS.line, 1.5);
  line(ctx, left, top + height, left + width, top + height, COLORS.line, 1.5);
  const count = Math.max(1, Math.min(12, visual.precipitation.length, visual.temperatures.length));
  const maxRain = Math.max(1, ...visual.precipitation.slice(0, count));
  const minTemp = Math.min(...visual.temperatures.slice(0, count));
  const maxTemp = Math.max(minTemp + 1, ...visual.temperatures.slice(0, count));
  const slot = width / count;
  visual.precipitation.slice(0, count).forEach((value, index) => {
    const barHeight = (value / maxRain) * (height - 10);
    ctx.fillStyle = 'rgba(96,165,250,0.55)';
    ctx.fillRect(left + index * slot + 2, top + height - barHeight, Math.max(3, slot - 4), barHeight);
  });
  ctx.strokeStyle = COLORS.danger;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  visual.temperatures.slice(0, count).forEach((value, index) => {
    const x = left + index * slot + slot / 2;
    const ratio = (value - minTemp) / (maxTemp - minTemp);
    const y = top + height - 8 - ratio * (height - 24);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
    ctx.fillStyle = COLORS.danger;
    ctx.beginPath();
    ctx.arc(x, y, 2.3, 0, Math.PI * 2);
    ctx.fill();
    if (index === 0) ctx.beginPath(), ctx.moveTo(x, y);
    else if (index < count - 1) ctx.lineTo(x, y);
  });
  // Rebuild the line after drawing markers so the path remains continuous.
  ctx.beginPath();
  visual.temperatures.slice(0, count).forEach((value, index) => {
    const x = left + index * slot + slot / 2;
    const ratio = (value - minTemp) / (maxTemp - minTemp);
    const y = top + height - 8 - ratio * (height - 24);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  fitText(ctx, 'mm', 14, 51, 24, 7, COLORS.secondary);
  fitText(ctx, '℃', 245, 51, 20, 7, COLORS.danger);
  fitText(ctx, '1', left + slot / 2, 163, 14, 7, COLORS.muted);
  fitText(ctx, '6', left + slot * 5.5, 163, 14, 7, COLORS.muted);
  fitText(ctx, '12月', left + slot * 11.5, 163, 28, 7, COLORS.muted);
};

const drawSocialFlow = (
  ctx: CanvasRenderingContext2D,
  visual: Extract<ProblemVisual, { kind: 'social_flow' }>,
) => {
  title(ctx, visual.title || '流れをつなぐ', visual.direction === 'cycle' ? '循環の模式図' : '工程・移動の模式図');
  const nodes = visual.nodes.slice(0, 6);
  if (visual.direction === 'cycle' && nodes.length >= 3) {
    const radiusX = 82;
    const radiusY = 48;
    nodes.forEach((node, index) => {
      const angle = -Math.PI / 2 + (index / nodes.length) * Math.PI * 2;
      const nextAngle = -Math.PI / 2 + ((index + 1) / nodes.length) * Math.PI * 2;
      const x = 130 + Math.cos(angle) * radiusX;
      const y = 103 + Math.sin(angle) * radiusY;
      const nx = 130 + Math.cos(nextAngle) * radiusX;
      const ny = 103 + Math.sin(nextAngle) * radiusY;
      arrow(ctx, x + Math.cos(nextAngle - angle) * 16, y + Math.sin(nextAngle - angle) * 10, nx - Math.cos(nextAngle - angle) * 19, ny - Math.sin(nextAngle - angle) * 12, COLORS.muted, 1.5);
      drawPanel(ctx, x - 28, y - 14, 56, 28, toneColor(node.tone));
      fitText(ctx, node.label, x, y - (node.sublabel ? 4 : 0), 50, 8.5, toneColor(node.tone));
      if (node.sublabel) fitText(ctx, node.sublabel, x, y + 8, 50, 6.5, COLORS.muted);
    });
    return;
  }
  const count = Math.max(1, nodes.length);
  const gap = 8;
  const available = 226 - gap * (count - 1);
  const nodeWidth = Math.min(62, available / count);
  const startX = (260 - (nodeWidth * count + gap * (count - 1))) / 2;
  const y = 79;
  nodes.forEach((node, index) => {
    const x = startX + index * (nodeWidth + gap);
    const color = toneColor(node.tone);
    drawPanel(ctx, x, y, nodeWidth, 54, color);
    fitText(ctx, node.label, x + nodeWidth / 2, y + (node.sublabel ? 20 : 27), nodeWidth - 8, 9, color);
    if (node.sublabel) fitText(ctx, node.sublabel, x + nodeWidth / 2, y + 37, nodeWidth - 8, 6.5, COLORS.muted);
    if (index < count - 1) {
      const fromX = x + nodeWidth + 1;
      const toX = x + nodeWidth + gap - 1;
      arrow(ctx, fromX, y + 27, toX, y + 27, COLORS.accent, 1.8);
      if (visual.direction === 'bidirectional') arrow(ctx, toX, y + 36, fromX, y + 36, COLORS.secondary, 1.4);
    }
  });
};

const drawSocialHazard = (
  ctx: CanvasRenderingContext2D,
  visual: Extract<ProblemVisual, { kind: 'social_hazard' }>,
) => {
  title(ctx, visual.title || 'ハザードマップの見方', '危険な場所と避難先を分けて読む模式図');
  drawPanel(ctx, 19, 42, 222, 121, COLORS.secondary);
  ctx.fillStyle = 'rgba(34,211,238,0.28)';
  ctx.fillRect(104, 42, 32, 121);
  fitText(ctx, '川', 120, 101, 20, 8, COLORS.primary);
  ctx.fillStyle = 'rgba(251,113,133,0.20)';
  ctx.fillRect(77, 42, 27, 121);
  ctx.fillRect(136, 42, 25, 121);
  for (let y = 48; y < 160; y += 12) {
    line(ctx, 79, y, 102, y + 10, 'rgba(251,113,133,0.5)', 1);
    line(ctx, 138, y, 159, y + 10, 'rgba(251,113,133,0.5)', 1);
  }
  drawMountain(ctx, 52, 153, 55, 58);
  drawPanel(ctx, 178, 55, 46, 36, COLORS.good);
  fitText(ctx, '避難所', 201, 73, 40, 8, COLORS.good);
  arrow(ctx, 62, 132, 176, 83, COLORS.good, 3);
  if (visual.mode === 'earthquake') fitText(ctx, '広い道を使う', 183, 135, 78, 8, COLORS.accent);
  else if (visual.mode === 'tsunami') fitText(ctx, '高い所へ', 190, 135, 72, 8, COLORS.accent);
  else if (visual.mode === 'landslide') fitText(ctx, '斜面から離れる', 186, 135, 84, 8, COLORS.accent);
  else fitText(ctx, '浸水区域を避ける', 187, 135, 90, 8, COLORS.accent);
};

const PYRAMID_WIDTHS: Record<Extract<ProblemVisual, { kind: 'social_population_pyramid' }>['shape'], number[]> = {
  expanding: [44, 38, 31, 23, 14],
  stationary: [32, 35, 36, 34, 27],
  constrictive: [21, 27, 34, 41, 45],
};

const drawSocialPopulation = (
  ctx: CanvasRenderingContext2D,
  visual: Extract<ProblemVisual, { kind: 'social_population_pyramid' }>,
) => {
  title(ctx, visual.title || '人口ピラミッド', visual.subtitle || '年齢の構成を形で読む');
  const widths = PYRAMID_WIDTHS[visual.shape];
  const center = 130;
  const baseY = 151;
  const bandH = 19;
  const labels = ['0–14', '15–29', '30–44', '45–64', '65+'];
  widths.forEach((width, index) => {
    const y = baseY - (index + 1) * bandH;
    ctx.fillStyle = index >= 4 ? 'rgba(251,191,36,0.48)' : 'rgba(34,211,238,0.42)';
    ctx.fillRect(center - width, y, width - 2, bandH - 3);
    ctx.fillStyle = index >= 4 ? 'rgba(251,113,133,0.42)' : 'rgba(96,165,250,0.42)';
    ctx.fillRect(center + 2, y, width - 2, bandH - 3);
    fitText(ctx, labels[index], center, y + (bandH - 3) / 2, 34, 6.5, COLORS.text);
  });
  line(ctx, center, 54, center, 153, COLORS.line, 1.2);
  fitText(ctx, '年少 ← 年齢 → 高齢', center, 164, 150, 7, COLORS.muted);
};

const governmentBox = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  color: string,
  sublabel?: string,
) => {
  drawPanel(ctx, x, y, w, h, color);
  fitText(ctx, label, x + w / 2, y + (sublabel ? 15 : h / 2), w - 8, 8.5, color);
  if (sublabel) fitText(ctx, sublabel, x + w / 2, y + 29, w - 8, 6.5, COLORS.muted);
};

const drawSocialGovernment = (
  ctx: CanvasRenderingContext2D,
  visual: Extract<ProblemVisual, { kind: 'social_government' }>,
) => {
  title(ctx, visual.title || '政治のしくみ', '制度の関係を読む模式図');
  if (visual.mode === 'constitution') {
    governmentBox(ctx, 25, 60, 62, 70, '国民主権', COLORS.primary, '政治の主人公');
    governmentBox(ctx, 99, 60, 62, 70, '基本的人権', COLORS.good, '一人ひとり');
    governmentBox(ctx, 173, 60, 62, 70, '平和主義', COLORS.accent, '平和を守る');
    line(ctx, 25, 145, 235, 145, COLORS.text, 4);
    fitText(ctx, '日本国憲法', 130, 160, 120, 9, COLORS.text);
    return;
  }
  if (visual.mode === 'legislature') {
    governmentBox(ctx, 25, 54, 78, 45, '衆議院', COLORS.primary);
    governmentBox(ctx, 157, 54, 78, 45, '参議院', COLORS.secondary);
    governmentBox(ctx, 91, 112, 78, 42, '国会', COLORS.accent, '二院で審議');
    arrow(ctx, 64, 101, 108, 120, COLORS.primary, 2);
    arrow(ctx, 196, 101, 152, 120, COLORS.secondary, 2);
    return;
  }
  if (visual.mode === 'cabinet') {
    governmentBox(ctx, 23, 48, 64, 40, '国会', COLORS.secondary);
    governmentBox(ctx, 98, 48, 64, 40, '首相', COLORS.accent);
    governmentBox(ctx, 173, 48, 64, 40, '内閣', COLORS.primary);
    governmentBox(ctx, 82, 116, 96, 40, '各省庁', COLORS.good, '行政を実行');
    arrow(ctx, 87, 68, 96, 68, COLORS.secondary, 2);
    arrow(ctx, 162, 68, 171, 68, COLORS.accent, 2);
    arrow(ctx, 205, 90, 158, 116, COLORS.primary, 2);
    return;
  }
  if (visual.mode === 'judiciary') {
    governmentBox(ctx, 87, 47, 86, 32, '最高裁判所', COLORS.accent);
    governmentBox(ctx, 87, 93, 86, 32, '高等裁判所', COLORS.secondary);
    governmentBox(ctx, 87, 139, 86, 32, '地方裁判所など', COLORS.primary);
    arrow(ctx, 130, 137, 130, 127, COLORS.line, 1.7);
    arrow(ctx, 130, 91, 130, 81, COLORS.line, 1.7);
    fitText(ctx, '上級の裁判所へ', 205, 109, 78, 7.5, COLORS.muted);
    return;
  }
  if (visual.mode === 'local') {
    governmentBox(ctx, 28, 52, 76, 42, '地方議会', COLORS.secondary, '条例・予算');
    governmentBox(ctx, 156, 52, 76, 42, '首長', COLORS.accent, '行政を進める');
    governmentBox(ctx, 91, 127, 78, 40, '住民', COLORS.good, '地域の主役');
    arrow(ctx, 112, 127, 77, 96, COLORS.good, 2);
    arrow(ctx, 148, 127, 183, 96, COLORS.good, 2);
    return;
  }
  if (visual.mode === 'election') {
    governmentBox(ctx, 20, 75, 52, 42, '有権者', COLORS.good);
    governmentBox(ctx, 82, 75, 52, 42, '投票', COLORS.primary);
    governmentBox(ctx, 144, 75, 52, 42, '代表', COLORS.accent);
    governmentBox(ctx, 206, 75, 36, 42, '議会', COLORS.secondary);
    arrow(ctx, 72, 96, 80, 96, COLORS.line, 1.8);
    arrow(ctx, 134, 96, 142, 96, COLORS.line, 1.8);
    arrow(ctx, 196, 96, 204, 96, COLORS.line, 1.8);
    fitText(ctx, '意見を政治へつなぐ', 130, 143, 150, 8, COLORS.muted);
    return;
  }
  if (visual.mode === 'democracy') {
    governmentBox(ctx, 20, 63, 58, 46, '国民', COLORS.good);
    governmentBox(ctx, 101, 45, 58, 42, '話し合い', COLORS.primary);
    governmentBox(ctx, 101, 105, 58, 42, '選挙', COLORS.secondary);
    governmentBox(ctx, 182, 63, 58, 46, '政治', COLORS.accent);
    arrow(ctx, 78, 81, 99, 67, COLORS.good, 1.8);
    arrow(ctx, 78, 92, 99, 123, COLORS.good, 1.8);
    arrow(ctx, 159, 67, 180, 81, COLORS.primary, 1.8);
    arrow(ctx, 159, 123, 180, 92, COLORS.secondary, 1.8);
    fitText(ctx, '少数の意見も尊重', 130, 162, 150, 8, COLORS.muted);
    return;
  }

  governmentBox(ctx, 20, 69, 62, 45, '国会', COLORS.primary, '立法');
  governmentBox(ctx, 99, 69, 62, 45, '内閣', COLORS.accent, '行政');
  governmentBox(ctx, 178, 69, 62, 45, '裁判所', COLORS.good, '司法');
  arrow(ctx, 82, 91, 97, 91, COLORS.line, 1.6);
  arrow(ctx, 161, 91, 176, 91, COLORS.line, 1.6);
  fitText(ctx, '互いに役割を分け、抑制する', 130, 144, 190, 8, COLORS.muted);
};

const drawSocialTimeline = (
  ctx: CanvasRenderingContext2D,
  visual: Extract<ProblemVisual, { kind: 'social_timeline' }>,
) => {
  title(ctx, visual.title || '時代の流れ', '左から右へ時間が進む');
  const events = visual.events.slice(0, 5);
  const startX = 33;
  const endX = 227;
  const y = 105;
  arrow(ctx, startX, y, endX, y, COLORS.line, 2.5);
  events.forEach((event, index) => {
    const x = events.length === 1 ? 130 : startX + (index / (events.length - 1)) * (endX - startX);
    const color = event.emphasized ? COLORS.accent : index % 2 === 0 ? COLORS.primary : COLORS.secondary;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, event.emphasized ? 6 : 4.5, 0, Math.PI * 2);
    ctx.fill();
    const above = index % 2 === 0;
    fitText(ctx, event.label, x, above ? 71 : 139, 68, 7.5, color);
    if (event.year) fitText(ctx, event.year, x, above ? 85 : 125, 50, 6.5, COLORS.muted);
    line(ctx, x, y + (above ? -5 : 5), x, above ? 89 : 121, 'rgba(148,163,184,0.4)', 1);
  });
};

const drawRegionProfile = (
  ctx: CanvasRenderingContext2D,
  visual: Extract<ProblemVisual, { kind: 'social_region_profile' }>,
) => {
  title(ctx, visual.title, visual.schematicLabel || '地域の特色を比べる模式図');
  const items = visual.items.slice(0, 4);
  const count = items.length;
  const gap = 8;
  const width = (220 - gap * (count - 1)) / count;
  items.forEach((item, index) => {
    const x = 20 + index * (width + gap);
    const color = toneColor(item.tone);
    drawPanel(ctx, x, 54, width, 94, color);
    fitText(ctx, item.heading, x + width / 2, 73, width - 8, 9, color);
    line(ctx, x + 8, 88, x + width - 8, 88, 'rgba(226,232,240,0.2)', 1);
    const parts = item.value.split('／');
    parts.slice(0, 3).forEach((part, partIndex) => {
      fitText(ctx, part, x + width / 2, 105 + partIndex * 17, width - 8, 7.5, COLORS.text);
    });
  });
};

export const drawSocialProblemVisual = (
  ctx: CanvasRenderingContext2D,
  visual: ProblemVisual,
  _w: number,
  _h: number,
): boolean => {
  switch (visual.kind) {
    case 'social_map':
      drawSocialMap(ctx, visual);
      return true;
    case 'social_landform':
      drawSocialLandform(ctx, visual);
      return true;
    case 'social_climograph':
      drawSocialClimograph(ctx, visual);
      return true;
    case 'social_flow':
      drawSocialFlow(ctx, visual);
      return true;
    case 'social_hazard':
      drawSocialHazard(ctx, visual);
      return true;
    case 'social_population_pyramid':
      drawSocialPopulation(ctx, visual);
      return true;
    case 'social_government':
      drawSocialGovernment(ctx, visual);
      return true;
    case 'social_timeline':
      drawSocialTimeline(ctx, visual);
      return true;
    case 'social_region_profile':
      drawRegionProfile(ctx, visual);
      return true;
    default:
      return false;
  }
};

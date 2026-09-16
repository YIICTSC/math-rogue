import type { ProblemVisual } from '../data/subjects/utils';

const COLORS = {
  text: '#f8fafc',
  muted: '#94a3b8',
  primary: '#22d3ee',
  secondary: '#60a5fa',
  accent: '#fbbf24',
  good: '#34d399',
  purple: '#c084fc',
  danger: '#fb7185',
  line: 'rgba(226, 232, 240, 0.72)',
  panel: 'rgba(15, 23, 42, 0.72)',
};

const toneColor = (tone?: 'primary' | 'secondary' | 'accent' | 'good' | 'purple') => {
  if (tone === 'secondary') return COLORS.secondary;
  if (tone === 'accent') return COLORS.accent;
  if (tone === 'good') return COLORS.good;
  if (tone === 'purple') return COLORS.purple;
  return COLORS.primary;
};

const roundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r = 8) => {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
};

const text = (
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  maxWidth: number,
  size = 9,
  color = COLORS.text,
) => {
  let fontSize = size;
  ctx.font = `700 ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  while (fontSize > 5.5 && ctx.measureText(value).width > maxWidth) {
    fontSize -= 0.5;
    ctx.font = `700 ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  }
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
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

const title = (ctx: CanvasRenderingContext2D, value: string, note: string) => {
  text(ctx, value, 130, 15, 224, 11, COLORS.text);
  text(ctx, note, 130, 29, 224, 7.4, COLORS.muted);
};

const box = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  color: string,
  sublabel?: string,
) => {
  roundedRect(ctx, x, y, w, h, 8);
  ctx.fillStyle = COLORS.panel;
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;
  ctx.stroke();
  text(ctx, label, x + w / 2, y + (sublabel ? 16 : h / 2), w - 8, 8.4, color);
  if (sublabel) text(ctx, sublabel, x + w / 2, y + 32, w - 8, 6.4, COLORS.muted);
};

const drawSentenceBlocks = (
  ctx: CanvasRenderingContext2D,
  visual: Extract<ProblemVisual, { kind: 'sentence_blocks' }>,
) => {
  title(ctx, visual.title || '英文の組み立て', visual.note || '役割ごとにブロックで読む');
  const count = Math.max(1, visual.blocks.length);
  const gap = count >= 4 ? 5 : 8;
  const available = 224 - gap * (count - 1);
  const width = available / count;
  const startX = 18;
  visual.blocks.forEach((block, index) => {
    const x = startX + index * (width + gap);
    box(ctx, x, 67, width, 56, block.label, toneColor(block.tone), block.sublabel);
    if (index < count - 1) {
      arrow(ctx, x + width + 1, 95, x + width + gap - 1, 95, COLORS.line, 1.6);
    }
  });
  text(ctx, '語順を保つと意味の関係が見えやすい', 130, 150, 210, 7.8, COLORS.muted);
};

const timelineX = (position: number) => 32 + 196 * position;

const drawTenseTimeline = (
  ctx: CanvasRenderingContext2D,
  visual: Extract<ProblemVisual, { kind: 'tense_timeline' }>,
) => {
  const configs = {
    past: { title: '過去の出来事', marker: 0.25, span: null, note: '過去の一点を表す' },
    past_progressive: { title: '過去の途中', marker: 0.28, span: [0.14, 0.42] as [number, number], note: '過去のある時点で進行中' },
    future: { title: '未来の予定・意志', marker: 0.78, span: null, note: '今より後のことを表す' },
    present_progressive: { title: '今している途中', marker: 0.5, span: [0.38, 0.62] as [number, number], note: '今を含む動作の途中' },
    present_perfect: { title: '過去から今へ', marker: 0.5, span: [0.18, 0.5] as [number, number], note: '経験・完了・継続を今と結ぶ' },
    present_perfect_progressive: { title: '過去から今まで継続', marker: 0.5, span: [0.12, 0.5] as [number, number], note: '動作が今まで続いている' },
  } as const;
  const config = configs[visual.focus];
  title(ctx, visual.title || config.title, config.note);

  const y = 98;
  line(ctx, 32, y, 228, y, COLORS.line, 3);
  line(ctx, 130, 76, 130, 122, COLORS.text, 2);
  text(ctx, '過去', 35, 128, 42, 7, COLORS.muted);
  text(ctx, '今', 130, 130, 30, 7.5, COLORS.text);
  text(ctx, '未来', 225, 128, 42, 7, COLORS.muted);

  if (config.span) {
    const [from, to] = config.span;
    const x1 = timelineX(from);
    const x2 = timelineX(to);
    line(ctx, x1, y, x2, y, COLORS.primary, 8);
    ctx.fillStyle = COLORS.primary;
    ctx.beginPath();
    ctx.arc(x1, y, 5, 0, Math.PI * 2);
    ctx.arc(x2, y, 5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const x = timelineX(config.marker);
    ctx.fillStyle = COLORS.accent;
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fill();
  }
};

const drawSpatialPreposition = (ctx: CanvasRenderingContext2D, visual: Extract<ProblemVisual, { kind: 'spatial_preposition' }>) => {
  title(ctx, visual.title || '位置を表す前置詞', 'ものと場所の関係を図で比べる');
  const panels = [
    { x: 18, label: 'in', mode: 'in', color: COLORS.primary },
    { x: 79, label: 'on', mode: 'on', color: COLORS.good },
    { x: 140, label: 'under', mode: 'under', color: COLORS.accent },
    { x: 201, label: 'by', mode: 'by', color: COLORS.purple },
  ];
  panels.forEach((panel) => {
    roundedRect(ctx, panel.x, 56, 48, 88, 7);
    ctx.fillStyle = COLORS.panel;
    ctx.fill();
    ctx.strokeStyle = panel.color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    text(ctx, panel.label, panel.x + 24, 68, 40, 8.5, panel.color);
    const bx = panel.x + 13;
    const by = 99;
    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bx, by, 22, 22);
    ctx.fillStyle = panel.color;
    ctx.beginPath();
    if (panel.mode === 'in') ctx.arc(bx + 11, by + 11, 5, 0, Math.PI * 2);
    if (panel.mode === 'on') ctx.arc(bx + 11, by - 5, 5, 0, Math.PI * 2);
    if (panel.mode === 'under') ctx.arc(bx + 11, by + 29, 5, 0, Math.PI * 2);
    if (panel.mode === 'by') ctx.arc(bx + 30, by + 11, 5, 0, Math.PI * 2);
    ctx.fill();
  });
};

const drawComparisonScale = (ctx: CanvasRenderingContext2D, visual: Extract<ProblemVisual, { kind: 'comparison_scale' }>) => {
  title(ctx, visual.title || '比較の表し方', '二者・三者の関係を高さで見る');
  const baseline = 137;
  const bars = visual.mode === 'equality'
    ? [70, 70, 45]
    : visual.mode === 'comparative'
      ? [58, 88, 42]
      : visual.mode === 'superlative'
        ? [50, 66, 94]
        : [48, 68, 92];
  const labels = ['A', 'B', 'C'];
  bars.forEach((height, index) => {
    const x = 48 + index * 72;
    roundedRect(ctx, x, baseline - height, 38, height, 6);
    ctx.fillStyle = index === 2 ? 'rgba(251, 191, 36, 0.28)' : index === 1 ? 'rgba(52, 211, 153, 0.24)' : 'rgba(34, 211, 238, 0.24)';
    ctx.fill();
    ctx.strokeStyle = index === 2 ? COLORS.accent : index === 1 ? COLORS.good : COLORS.primary;
    ctx.lineWidth = 1.7;
    ctx.stroke();
    text(ctx, labels[index], x + 19, baseline + 13, 32, 8, COLORS.text);
  });
  line(ctx, 34, baseline, 229, baseline, COLORS.line, 1.5);
  const note = visual.mode === 'equality'
    ? '同じ程度 → as ... as'
    : visual.mode === 'superlative'
      ? '三者以上で いちばん'
      : visual.mode === 'comparative'
        ? '二者の差を比べる'
        : '比較級・最上級・同等比較';
  text(ctx, note, 130, 157, 210, 7.8, COLORS.muted);
};

const drawConditionBranch = (ctx: CanvasRenderingContext2D, visual: Extract<ProblemVisual, { kind: 'condition_branch' }>) => {
  title(ctx, visual.title || '仮定の文', '現実とは異なる想像を枝分かれで見る');
  box(ctx, 86, 47, 88, 38, '今の現実', COLORS.secondary);
  arrow(ctx, 112, 87, 67, 118, COLORS.line, 1.8);
  arrow(ctx, 148, 87, 193, 118, COLORS.purple, 2.2);
  box(ctx, 23, 120, 88, 40, '実際の状況', COLORS.secondary);
  box(ctx, 149, 120, 88, 40, 'もし〜なら…', COLORS.purple);
  text(ctx, '想像した結果へ', 193, 169, 90, 7, COLORS.muted);
};

export const drawEnglishSupportProblemVisual = (
  ctx: CanvasRenderingContext2D,
  visual: ProblemVisual,
  _w: number,
  _h: number,
): boolean => {
  switch (visual.kind) {
    case 'sentence_blocks':
      drawSentenceBlocks(ctx, visual);
      return true;
    case 'tense_timeline':
      drawTenseTimeline(ctx, visual);
      return true;
    case 'spatial_preposition':
      drawSpatialPreposition(ctx, visual);
      return true;
    case 'comparison_scale':
      drawComparisonScale(ctx, visual);
      return true;
    case 'condition_branch':
      drawConditionBranch(ctx, visual);
      return true;
    default:
      return false;
  }
};

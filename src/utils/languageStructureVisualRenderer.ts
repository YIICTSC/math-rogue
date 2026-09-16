import type { ProblemVisual } from '../data/subjects/utils';

const COLORS = {
  text: '#f8fafc',
  muted: '#94a3b8',
  primary: '#22d3ee',
  secondary: '#60a5fa',
  accent: '#fbbf24',
  good: '#34d399',
  purple: '#c084fc',
  line: 'rgba(226, 232, 240, 0.7)',
  panel: 'rgba(15, 23, 42, 0.72)',
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
  while (fontSize > 6 && ctx.measureText(value).width > maxWidth) {
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
  text(ctx, value, 130, 15, 220, 11, COLORS.text);
  text(ctx, note, 130, 29, 220, 7.5, COLORS.muted);
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
  ctx.lineWidth = 1.7;
  ctx.stroke();
  text(ctx, label, x + w / 2, y + (sublabel ? 16 : h / 2), w - 8, 8.5, color);
  if (sublabel) text(ctx, sublabel, x + w / 2, y + 32, w - 8, 6.5, COLORS.muted);
};

const drawSentenceStructure = (
  ctx: CanvasRenderingContext2D,
  visual: Extract<ProblemVisual, { kind: 'sentence_structure' }>,
) => {
  if (visual.mode === 'elementary') {
    title(ctx, visual.title || '文の くみたて', '文の やくわりを 色で みる');
    box(ctx, 20, 72, 66, 52, 'だれ・なに', COLORS.primary, '文の はじめ');
    box(ctx, 97, 72, 66, 52, 'くわしく', COLORS.good, 'ばしょ・ようす');
    box(ctx, 174, 72, 66, 52, 'どうする', COLORS.accent, '文の おわり');
    arrow(ctx, 86, 98, 95, 98, COLORS.line, 1.8);
    arrow(ctx, 163, 98, 172, 98, COLORS.line, 1.8);
    text(ctx, '「だれが」 と 「どうする」 を つなげる', 130, 151, 210, 8, COLORS.muted);
    return;
  }

  if (visual.mode === 'sentence_order') {
    title(ctx, visual.title || '文の きまり', 'ことばの じゅんと しるしを たしかめる');
    box(ctx, 24, 70, 64, 46, 'だれ・なに', COLORS.primary);
    box(ctx, 101, 70, 64, 46, 'どうする', COLORS.accent);
    box(ctx, 184, 70, 50, 46, '。', COLORS.good);
    arrow(ctx, 88, 93, 99, 93, COLORS.line, 1.8);
    arrow(ctx, 165, 93, 182, 93, COLORS.line, 1.8);
    text(ctx, 'ことばを ならべて 文を ひとまとまりに', 130, 146, 210, 8, COLORS.muted);
    return;
  }

  if (visual.mode === 'clause') {
    title(ctx, visual.title || '節と文の関係', '複数のまとまりがどう結ばれるかを見る');
    box(ctx, 26, 58, 82, 48, '従属する節', COLORS.secondary, '理由・条件・修飾など');
    box(ctx, 152, 58, 82, 48, '中心の節', COLORS.accent, '文の核');
    arrow(ctx, 109, 82, 150, 82, COLORS.primary, 2.2);
    box(ctx, 70, 127, 120, 34, '接続関係を確かめる', COLORS.good);
    arrow(ctx, 130, 107, 130, 125, COLORS.good, 1.8);
    return;
  }

  title(ctx, visual.title || '文の成分', '主語・述語・修飾の関係を見る');
  box(ctx, 20, 68, 65, 50, '主語', COLORS.primary, 'だれ・なにが');
  box(ctx, 98, 68, 65, 50, '修飾語', COLORS.good, 'くわしくする');
  box(ctx, 176, 68, 65, 50, '述語', COLORS.accent, 'どうする・どんなだ');
  arrow(ctx, 85, 93, 96, 93, COLORS.line, 1.8);
  arrow(ctx, 163, 93, 174, 93, COLORS.line, 1.8);
  text(ctx, 'どの部分が どこに かかるかを追う', 130, 149, 200, 8, COLORS.muted);
};

const drawWordClasses = (ctx: CanvasRenderingContext2D, visual: Extract<ProblemVisual, { kind: 'word_class_blocks' }>) => {
  title(ctx, visual.title || '品詞の見分け方', '語の働きと活用を比べる');
  const cells = [
    { x: 20, y: 54, label: '名詞', sub: 'もの・ことの名', color: COLORS.primary },
    { x: 136, y: 54, label: '動詞', sub: '動作・状態', color: COLORS.accent },
    { x: 20, y: 112, label: '形容詞など', sub: '性質・ようす', color: COLORS.good },
    { x: 136, y: 112, label: 'その他', sub: 'つなぐ・そえる', color: COLORS.purple },
  ];
  cells.forEach((cell) => box(ctx, cell.x, cell.y, 104, 42, cell.label, cell.color, cell.sub));
};

const drawParagraphStructure = (
  ctx: CanvasRenderingContext2D,
  visual: Extract<ProblemVisual, { kind: 'paragraph_structure' }>,
) => {
  if (visual.mode === 'paragraphs') {
    title(ctx, visual.title || '文章の まとまり', '話題ごとに段落を分けて読む');
    box(ctx, 20, 59, 64, 70, '段落①', COLORS.primary, '一つの話題');
    box(ctx, 98, 59, 64, 70, '段落②', COLORS.secondary, '次の話題');
    box(ctx, 176, 59, 64, 70, '段落③', COLORS.good, 'さらに展開');
    arrow(ctx, 84, 94, 96, 94, COLORS.line, 1.8);
    arrow(ctx, 162, 94, 174, 94, COLORS.line, 1.8);
    text(ctx, '段落をまとめると 文章の中心が見える', 130, 151, 210, 8, COLORS.muted);
    return;
  }

  if (visual.mode === 'argument') {
    title(ctx, visual.title || '論の組み立て', '課題・根拠・主張のつながりを追う');
    box(ctx, 18, 72, 62, 48, '課題', COLORS.secondary);
    box(ctx, 99, 52, 62, 48, '根拠', COLORS.good);
    box(ctx, 99, 120, 62, 38, '論拠', COLORS.purple);
    box(ctx, 180, 72, 62, 48, '主張', COLORS.accent);
    arrow(ctx, 80, 96, 97, 76, COLORS.line, 1.7);
    arrow(ctx, 80, 96, 97, 137, COLORS.line, 1.7);
    arrow(ctx, 161, 76, 178, 94, COLORS.good, 1.7);
    arrow(ctx, 161, 137, 178, 105, COLORS.purple, 1.7);
    return;
  }

  title(ctx, visual.title || '要約の組み立て', '中心と支える情報を整理する');
  box(ctx, 28, 56, 70, 42, '話題', COLORS.primary, '何について');
  box(ctx, 162, 56, 70, 42, '根拠・事実', COLORS.good, '何が支える');
  arrow(ctx, 99, 77, 160, 77, COLORS.line, 1.8);
  box(ctx, 77, 121, 106, 40, '中心の考え', COLORS.accent, '短くまとめる');
  arrow(ctx, 63, 100, 99, 120, COLORS.primary, 1.8);
  arrow(ctx, 197, 100, 161, 120, COLORS.good, 1.8);
};

export const drawLanguageStructureProblemVisual = (
  ctx: CanvasRenderingContext2D,
  visual: ProblemVisual,
  _w: number,
  _h: number,
): boolean => {
  switch (visual.kind) {
    case 'sentence_structure':
      drawSentenceStructure(ctx, visual);
      return true;
    case 'word_class_blocks':
      drawWordClasses(ctx, visual);
      return true;
    case 'paragraph_structure':
      drawParagraphStructure(ctx, visual);
      return true;
    default:
      return false;
  }
};

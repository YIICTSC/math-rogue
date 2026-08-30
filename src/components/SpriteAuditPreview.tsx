import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Check, ChevronLeft, ChevronRight, Gamepad2, Layers, Pause, Play, Search, Users } from 'lucide-react';
import { CHARACTERS } from '../constants';
import { MAGIC_HEROES, MAGIC_MALE_PROTAGONISTS } from '../data/magicHeroes';
import { MINI_GAME_SPRITE_AUDIT_MANIFEST, type SpriteAuditAssetDefinition, type SpriteAuditAssetKind } from '../data/spriteAuditManifest';
import { getThemedCharacters } from '../data/visualThemes';
import { MINI_GAMES } from '../miniGameConfig';
import type { LanguageMode } from '../types';
import { assetUrl } from '../utils/assetPaths';
import { trans } from '../utils/textUtils';

type AuditAsset = SpriteAuditAssetDefinition & {
  src?: string;
};

type ProtagonistEntry = {
  id: string;
  name: string;
  assets: AuditAsset[];
};

type ProtagonistGroup = {
  id: string;
  title: string;
  description: string;
  entries: ProtagonistEntry[];
};

type SpriteAuditCategory = {
  id: string;
  title: string;
  description: string;
  kind: 'protagonist' | 'mini-game';
  entries?: ProtagonistEntry[];
  assets?: AuditAsset[];
  miniGameId?: string;
};

const HIGH_SCHOOL_SPRITE_INDEX_BY_ID: Record<string, number> = {
  WARRIOR: 0,
  CARETAKER: 1,
  ASSASSIN: 2,
  MAGE: 3,
  DODGEBALL: 4,
  BARD: 5,
  LIBRARIAN: 6,
  CHEF: 7,
  GARDENER: 8,
};

const HIGH_SCHOOL_IDLE_EXTENSION_BY_INDEX: Record<number, 'png' | 'webp'> = { 1: 'png' };
const HIGH_SCHOOL_SPECIAL_IDLE_FILE_BY_INDEX: Record<number, string> = {
  1: '1-rabbit-care.webp',
};

const MAGIC_BATTLE_ACTIONS = [
  { id: 'idle-special', label: '特殊アイドル', folder: 'idle-special' },
  { id: 'attack', label: '攻撃', folder: 'attack' },
  { id: 'skill', label: 'スキル', folder: 'skill' },
  { id: 'hit', label: '被弾', folder: 'hit' },
  { id: 'low-hp', label: '瀕死', folder: 'low-hp' },
] as const;

const auditAsset = (
  path: string,
  label: string,
  kind: SpriteAuditAssetKind = 'sheet',
  note?: string,
): AuditAsset => ({ path, label, kind, note });

const elementaryProtagonists = (): ProtagonistEntry[] => CHARACTERS.map(character => ({
  id: character.id,
  name: character.name,
  assets: [{
    ...auditAsset('内蔵SVG', '小学生編 立ち絵', 'sprite', 'CHARACTERS.imageData の内蔵SVG'),
    src: character.imageData,
  }],
}));

const highSchoolProtagonists = (): ProtagonistEntry[] => (
  getThemedCharacters(CHARACTERS, 'high-school').map(character => {
    const index = HIGH_SCHOOL_SPRITE_INDEX_BY_ID[character.id] ?? 0;
    const idleExtension = HIGH_SCHOOL_IDLE_EXTENSION_BY_INDEX[index] ?? 'webp';
    const specialIdleFile = HIGH_SCHOOL_SPECIAL_IDLE_FILE_BY_INDEX[index] ?? `${index}.webp`;
    return {
      id: character.id,
      name: character.name,
      assets: [
        auditAsset(`sprites/high-school/characters/${index}.webp`, '立ち絵', 'sprite'),
        auditAsset(`sprites/high-school/characters-idle-sheets/${index}.${idleExtension}`, 'idleシート'),
        auditAsset(`sprites/high-school/characters-idle-special/${specialIdleFile}`, '特殊idleシート'),
        ...[
          ['attack', '攻撃'],
          ['skill', 'スキル'],
          ['hit', '被弾'],
          ['low-hp', '瀕死'],
        ].map(([action, label]) => auditAsset(`sprites/high-school/characters-${action}-sheets/${index}.webp`, label)),
      ],
    };
  })
);

const magicFemaleProtagonists = (): ProtagonistEntry[] => (
  getThemedCharacters(CHARACTERS, 'magic').map(character => {
    const heroIndex = MAGIC_HEROES.find(hero => hero.id === character.magicProtagonistId)?.index ?? 0;
    const fallbackIndex = CHARACTERS.findIndex(entry => entry.id === character.id) + 1;
    const index = heroIndex || fallbackIndex;
    const heroine = String(index).padStart(2, '0');
    const assets: AuditAsset[] = [];
    for (const form of ['before', 'after'] as const) {
      assets.push(auditAsset(`sprites/magic/characters/heroine-${heroine}-${form}.webp`, `立ち絵 ${form}` , 'sprite'));
      assets.push(auditAsset(`sprites/magic/characters-idle-sheets/heroine-${heroine}-${form}.webp`, `idleシート ${form}`));
      for (const action of MAGIC_BATTLE_ACTIONS) {
        assets.push(auditAsset(`sprites/magic/characters-${action.folder}-sheets/heroine-${heroine}-${form}.webp`, `${action.label} ${form}`));
      }
    }
    return { id: character.magicProtagonistId ?? character.id, name: character.name, assets };
  })
);

const magicMaleProtagonists = (): ProtagonistEntry[] => MAGIC_MALE_PROTAGONISTS.map(protagonist => {
  const assets: AuditAsset[] = [];
  for (const form of ['before', 'after'] as const) {
    assets.push(auditAsset(`sprites/magic/male-characters/${protagonist.assetId}-${form}.webp`, `立ち絵 ${form}`, 'sprite'));
    assets.push(auditAsset(`sprites/magic/male-characters-idle-sheets/${protagonist.assetId}-${form}.webp`, `idleシート ${form}`));
    for (const action of MAGIC_BATTLE_ACTIONS) {
      assets.push(auditAsset(`sprites/magic/male-characters-${action.folder}-sheets/${protagonist.assetId}-${form}.webp`, `${action.label} ${form}`));
    }
  }
  return { id: protagonist.id, name: protagonist.name, assets };
});

const assetKindLabel: Record<SpriteAuditAssetKind, string> = {
  sprite: 'IN-GAME SPRITE',
  sheet: 'IN-GAME FRAME',
  ui: 'IN-GAME UI',
};

type SpritePreviewLayout = {
  columns: number;
  rows: number;
  cellSize?: number;
  gap?: number;
  aspectRatio?: number;
  frameDurationMs?: number;
};

const getSpritePreviewLayout = (path: string): SpritePreviewLayout | null => {
  const normalizedPath = path.toLowerCase();
  if (normalizedPath.includes('go-home-dash-8-loop-grid')) return { columns: 8, rows: 1, aspectRatio: 290 / 249, frameDurationMs: 120 };
  if (normalizedPath.includes('go-home-dash-jump-3')) return { columns: 3, rows: 1, aspectRatio: 840 / 724, frameDurationMs: 180 };
  if (normalizedPath.includes('go-home-dash-enemies')) return { columns: 4, rows: 4, frameDurationMs: 220 };
  if (normalizedPath.includes('go-home-dash-projectiles')) return { columns: 5, rows: 2, frameDurationMs: 220 };
  if (normalizedPath.includes('schoolyard-survivor-enemies')) return { columns: 8, rows: 2, frameDurationMs: 220 };
  if (normalizedPath.includes('schoolyard-survivor-weapons')) return { columns: 8, rows: 5, frameDurationMs: 220 };
  if (normalizedPath.includes('schoolyard-survivor-effects')) return { columns: 8, rows: 2, frameDurationMs: 220 };
  if (normalizedPath.includes('after-school-poker-item-sheet-')) return { columns: 5, rows: 5, frameDurationMs: 220 };
  if (normalizedPath.includes('after-school-poker-items')) return { columns: 8, rows: 5, frameDurationMs: 220 };
  if (normalizedPath.includes('after-school-poker-card-ornaments')) return { columns: 8, rows: 2, frameDurationMs: 220 };
  if (normalizedPath.includes('after-school-poker-rivals-') || normalizedPath.includes('after-school-poker-endless-rivals-')) return { columns: 3, rows: 3, frameDurationMs: 220 };
  if (normalizedPath.includes('after-school-poker-overrides') || normalizedPath.includes('after-school-poker-consumable-overrides') || normalizedPath.includes('after-school-poker-stationery-overrides')) return { columns: 5, rows: 4, frameDurationMs: 220 };
  if (normalizedPath.includes('after-school-poker-supporter-fixes')) return { columns: 2, rows: 1, frameDurationMs: 220 };
  if (normalizedPath.includes('furai-shogakusei2-card-sheet')) return { columns: 6, rows: 5, cellSize: 72, gap: 16, frameDurationMs: 220 };
  if (normalizedPath.includes('furai-shogakusei2-card-effects')) return { columns: 6, rows: 3, aspectRatio: 1.2, frameDurationMs: 220 };
  if (normalizedPath.includes('furai-sfc-v2-') && normalizedPath.includes('5x5')) return { columns: 5, rows: 5, cellSize: 72, gap: 16, frameDurationMs: 220 };
  if (normalizedPath.includes('principal-final-boss-3x2')) return { columns: 3, rows: 2, frameDurationMs: 220 };
  if (normalizedPath.includes('characters-idle-sheets') || normalizedPath.includes('characters-idle-special') || normalizedPath.includes('characters-attack-sheets') || normalizedPath.includes('characters-skill-sheets') || normalizedPath.includes('characters-hit-sheets') || normalizedPath.includes('characters-low-hp-sheets')) return { columns: 2, rows: 2, frameDurationMs: 155 };
  if (normalizedPath.includes('kocho-hero-actions-') || normalizedPath.includes('kocho-effects-') || normalizedPath.includes('kocho-enemies-') || normalizedPath.includes('kocho-backgrounds-5x5')) return { columns: 5, rows: 5, frameDurationMs: 220 };
  if (normalizedPath.includes('high-school/sheets/')) return { columns: 5, rows: 5, frameDurationMs: 220 };
  if (normalizedPath.includes('paper-plane/parts-') || normalizedPath.includes('paper-plane/pilots-02') || normalizedPath.includes('paper-plane/scene-backgrounds-5x5') || normalizedPath.includes('paper-plane/stage-backgrounds-5x5')) return { columns: 5, rows: 5, frameDurationMs: 220 };
  return null;
};

const getBattlePreviewActionClass = (path: string): string => {
  const normalizedPath = path.toLowerCase();
  if (normalizedPath.includes('characters-attack-sheets')) return 'battle-hero-attack';
  if (normalizedPath.includes('characters-skill-sheets')) return 'battle-hero-skill';
  if (normalizedPath.includes('characters-hit-sheets')) return 'battle-hero-hit';
  if (normalizedPath.includes('characters-low-hp-sheets')) return 'battle-hero-low-hp';
  return '';
};

const getFrameImageStyle = (layout: SpritePreviewLayout, frame: number): React.CSSProperties => {
  const column = frame % layout.columns;
  const row = Math.floor(frame / layout.columns);
  if (layout.gap !== undefined && layout.cellSize !== undefined) {
    const sheetWidth = layout.gap + layout.columns * (layout.cellSize + layout.gap);
    const sheetHeight = layout.gap + layout.rows * (layout.cellSize + layout.gap);
    const sourceX = layout.gap + column * (layout.cellSize + layout.gap);
    const sourceY = layout.gap + row * (layout.cellSize + layout.gap);
    return {
      position: 'absolute',
      maxWidth: 'none',
      maxHeight: 'none',
      width: `${(sheetWidth / layout.cellSize) * 100}%`,
      height: `${(sheetHeight / layout.cellSize) * 100}%`,
      left: `-${(sourceX / layout.cellSize) * 100}%`,
      top: `-${(sourceY / layout.cellSize) * 100}%`,
      imageRendering: 'pixelated',
    };
  }
  return {
    position: 'absolute',
    maxWidth: 'none',
    maxHeight: 'none',
    width: `${layout.columns * 100}%`,
    height: `${layout.rows * 100}%`,
    left: `-${column * 100}%`,
    top: `-${row * 100}%`,
    imageRendering: 'pixelated',
  };
};

const Checkerboard = ({ children }: { children: React.ReactNode }) => (
  <div
    className="relative flex min-h-[9rem] items-center justify-center rounded border border-slate-700 p-2"
    style={{
      backgroundImage: 'linear-gradient(45deg, #111827 25%, transparent 25%), linear-gradient(-45deg, #111827 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #111827 75%), linear-gradient(-45deg, transparent 75%, #111827 75%)',
      backgroundColor: '#0f172a',
      backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
      backgroundSize: '16px 16px',
    }}
  >
    {children}
  </div>
);

const SpriteAuditCard: React.FC<{ asset: AuditAsset; languageMode: LanguageMode }> = ({ asset, languageMode }) => {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [dimensions, setDimensions] = useState<string>('');
  const layout = useMemo(() => getSpritePreviewLayout(asset.path), [asset.path]);
  const frameCount = layout ? layout.columns * layout.rows : 1;
  const [frame, setFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const source = asset.src ?? assetUrl(asset.path);

  useEffect(() => {
    setFrame(0);
    setIsPlaying(false);
  }, [asset.path]);

  useEffect(() => {
    if (!layout || frameCount <= 1 || !isPlaying) return undefined;
    const timer = window.setInterval(() => {
      setFrame(previous => (previous + 1) % frameCount);
    }, layout.frameDurationMs ?? 220);
    return () => window.clearInterval(timer);
  }, [frameCount, isPlaying, layout]);

  const battleActionClass = getBattlePreviewActionClass(asset.path);
  const isHighSchoolAsset = asset.path.toLowerCase().includes('high-school');
  const previewImage = layout ? (
    <div
      className={`relative w-full overflow-hidden ${battleActionClass ? `battle-scene-root ${isHighSchoolAsset ? 'battle-high-school' : ''}` : ''}`}
      style={{ aspectRatio: layout.aspectRatio ?? 1 }}
    >
      <div className={`relative h-full w-full ${battleActionClass}`}>
        <div className={`relative h-full w-full ${isHighSchoolAsset ? '-scale-x-100' : ''}`}>
          <img
            src={source}
            alt={asset.label}
            className="absolute"
            style={getFrameImageStyle(layout, frame)}
            draggable={false}
            loading="lazy"
            onLoad={(event) => {
              setStatus('loaded');
              setDimensions(`${event.currentTarget.naturalWidth} × ${event.currentTarget.naturalHeight}px`);
            }}
            onError={() => setStatus('error')}
          />
        </div>
      </div>
    </div>
  ) : (
    <img
      src={source}
      alt={asset.label}
      className="max-h-48 max-w-full object-contain [image-rendering:auto]"
      draggable={false}
      loading="lazy"
      onLoad={(event) => {
        setStatus('loaded');
        setDimensions(`${event.currentTarget.naturalWidth} × ${event.currentTarget.naturalHeight}px`);
      }}
      onError={() => setStatus('error')}
    />
  );

  return (
    <article className="min-w-0 rounded-lg border border-slate-700 bg-slate-950/70 p-2 shadow-inner">
      <Checkerboard>
        {previewImage}
        {status === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-950/85 px-2 text-center text-xs font-bold text-red-200">
            <AlertCircle size={14} className="mr-1 shrink-0" /> {trans('読み込み失敗', languageMode)}
          </div>
        )}
      </Checkerboard>
      {layout && frameCount > 1 && (
        <div className="mt-2 flex items-center justify-between gap-1 rounded border border-slate-700 bg-slate-900/80 px-1.5 py-1 text-[9px] text-slate-300">
          <button
            type="button"
            className="rounded p-0.5 text-slate-400 hover:bg-slate-700 hover:text-white"
            aria-label={trans('前のフレーム', languageMode)}
            onClick={() => setFrame(previous => (previous - 1 + frameCount) % frameCount)}
          >
            <ChevronLeft size={13} />
          </button>
          <span className="min-w-0 truncate text-center">{trans('ゲーム内フレーム', languageMode)} {frame + 1}/{frameCount}</span>
          <button
            type="button"
            className="rounded p-0.5 text-slate-400 hover:bg-slate-700 hover:text-white"
            aria-label={trans('次のフレーム', languageMode)}
            onClick={() => setFrame(previous => (previous + 1) % frameCount)}
          >
            <ChevronRight size={13} />
          </button>
          <button
            type="button"
            className="rounded p-0.5 text-cyan-300 hover:bg-cyan-950 hover:text-cyan-100"
            aria-label={trans(isPlaying ? '停止' : '再生', languageMode)}
            onClick={() => setIsPlaying(previous => !previous)}
          >
            {isPlaying ? <Pause size={12} /> : <Play size={12} />}
          </button>
        </div>
      )}
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="min-w-0 truncate text-xs font-black text-white" title={asset.label}>{asset.label}</div>
        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-black ${asset.kind === 'ui' ? 'bg-slate-700 text-slate-200' : asset.kind === 'sprite' ? 'bg-emerald-900 text-emerald-200' : 'bg-cyan-900 text-cyan-200'}`}>
          {assetKindLabel[asset.kind]}
        </span>
      </div>
      <code className="mt-1 block break-all text-[9px] leading-tight text-slate-500">{asset.path}</code>
      <div className="mt-1 flex min-h-4 items-center gap-1 text-[9px] text-slate-400">
        {status === 'loaded' ? <Check size={11} className="text-emerald-400" /> : status === 'error' ? <AlertCircle size={11} className="text-red-400" /> : <span className="text-yellow-400">…</span>}
        {status === 'loaded' ? dimensions : status === 'error' ? trans('ファイルを確認', languageMode) : trans('読み込み中', languageMode)}
      </div>
      {asset.note && <div className="mt-1 text-[9px] leading-tight text-amber-300">{trans(asset.note, languageMode)}</div>}
    </article>
  );
};

const ProtagonistCard: React.FC<{ entry: ProtagonistEntry; languageMode: LanguageMode }> = ({ entry, languageMode }) => (
  <article className="rounded-xl border border-slate-700 bg-black/25 p-3">
    <div className="mb-3 flex items-center justify-between gap-2 border-b border-slate-700 pb-2">
      <h4 className="truncate text-sm font-black text-white">{entry.name}</h4>
      <span className="shrink-0 text-[9px] font-mono text-slate-500">{entry.assets.length} assets</span>
    </div>
    <div className="grid grid-cols-2 gap-2 xl:grid-cols-3">
      {entry.assets.map((asset, index) => <SpriteAuditCard key={`${asset.path}-${index}`} asset={asset} languageMode={languageMode} />)}
    </div>
  </article>
);

const SpriteAuditPreview: React.FC<{ languageMode: LanguageMode }> = ({ languageMode }) => {
  const [activeCategoryId, setActiveCategoryId] = useState('protagonist-elementary');
  const [query, setQuery] = useState('');
  const protagonistGroups = useMemo<ProtagonistGroup[]>(() => [
    {
      id: 'elementary',
      title: '小学生編',
      description: '内蔵SVGの立ち絵。キャラクター画像自体が見切れていないか確認します。',
      entries: elementaryProtagonists(),
    },
    {
      id: 'high-school',
      title: '高校編',
      description: '立ち絵と、idle・特殊idle・攻撃・スキル・被弾・瀕死の各シートを確認します。',
      entries: highSchoolProtagonists(),
    },
    {
      id: 'magic-female',
      title: 'マジック編（ヒロイン）',
      description: '変身前後の立ち絵と全戦闘アニメーションシートを確認します。',
      entries: magicFemaleProtagonists(),
    },
    {
      id: 'magic-male',
      title: 'マジック編（男性主人公）',
      description: '変身前後の立ち絵と全戦闘アニメーションシートを確認します。',
      entries: magicMaleProtagonists(),
    },
  ], []);

  const categories = useMemo<SpriteAuditCategory[]>(() => [
    ...protagonistGroups.map(group => ({
      id: `protagonist-${group.id}`,
      title: group.title,
      description: group.description,
      kind: 'protagonist' as const,
      entries: group.entries,
    })),
    ...MINI_GAMES.map(game => {
      const definition = MINI_GAME_SPRITE_AUDIT_MANIFEST[game.id];
      return {
        id: `mini-game-${game.id}`,
        title: game.name,
        description: definition?.note ?? '',
        kind: 'mini-game' as const,
        assets: definition?.assets ?? [],
        miniGameId: game.id,
      };
    }),
  ], [protagonistGroups]);

  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visibleCategories = categories.filter(category => {
    if (!normalizedQuery) return true;
    const searchText = category.kind === 'protagonist'
      ? [category.title, category.id, ...(category.entries ?? []).flatMap(entry => [entry.name, ...entry.assets.map(asset => asset.label), ...entry.assets.map(asset => asset.path)])]
      : [category.title, category.id, ...(category.assets ?? []).flatMap(asset => [asset.label, asset.path])];
    return searchText.join(' ').toLocaleLowerCase().includes(normalizedQuery);
  });
  const activeCategory = visibleCategories.find(category => category.id === activeCategoryId) ?? visibleCategories[0] ?? null;
  const visibleProtagonistEntries = activeCategory?.kind === 'protagonist'
    ? (activeCategory.entries ?? []).filter(entry => !normalizedQuery || `${activeCategory.title} ${entry.name} ${entry.assets.map(asset => `${asset.label} ${asset.path}`).join(' ')}`.toLocaleLowerCase().includes(normalizedQuery))
    : [];
  const visibleMiniGameAssets = activeCategory?.kind === 'mini-game'
    ? (activeCategory.assets ?? []).filter(asset => !normalizedQuery || `${activeCategory.title} ${activeCategory.miniGameId ?? ''} ${asset.label} ${asset.path}`.toLocaleLowerCase().includes(normalizedQuery))
    : [];
  const protagonistCount = protagonistGroups.reduce((total, group) => total + group.entries.length, 0);
  const miniGameAssetCount = MINI_GAMES.reduce((total, game) => total + (MINI_GAME_SPRITE_AUDIT_MANIFEST[game.id]?.assets.length ?? 0), 0);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto bg-slate-950/40 p-3 custom-scrollbar md:p-4">
      <div className="shrink-0 rounded-xl border border-cyan-700/70 bg-slate-900/95 p-3 shadow-lg">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-base font-black text-cyan-200">
              <Layers size={18} /> {trans('ゲーム内スプライト確認', languageMode)}
            </h3>
            <p className="mt-1 text-[10px] leading-relaxed text-slate-400">
              {trans('シート全体ではなく、ゲーム内と同じように1フレームずつ切り出して表示します。前後のコマの写り込み、透明端の欠落、読み込み失敗をここで確認してください。', languageMode)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-slate-300">
            <span className="rounded bg-slate-800 px-2 py-1">{trans('主人公', languageMode)} {protagonistCount}{trans('体', languageMode)}</span>
            <span className="rounded bg-slate-800 px-2 py-1">{trans('ミニゲーム', languageMode)} {MINI_GAMES.length}{trans('種', languageMode)}</span>
            <span className="rounded bg-slate-800 px-2 py-1">{trans('素材', languageMode)} {miniGameAssetCount}{trans('件', languageMode)}</span>
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-2 md:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search size={14} className="pointer-events-none absolute left-2.5 top-2.5 text-slate-500" />
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder={trans('主人公・ミニゲームを検索', languageMode)}
              className="w-full rounded border border-slate-700 bg-slate-950 px-8 py-1.5 text-xs text-white outline-none focus:border-cyan-400"
            />
          </div>
        </div>
        <div className="mt-3 rounded border border-slate-700 bg-slate-950/80 p-2">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-black text-slate-300">
            <Layers size={14} className="text-cyan-300" />
            <span>{trans('カテゴリ', languageMode)}</span>
            <span className="text-slate-500">{visibleCategories.length}/{categories.length}</span>
          </div>
          {visibleCategories.length > 0 ? (
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 xl:grid-cols-4">
              {visibleCategories.map(category => {
                const count = category.kind === 'protagonist'
                  ? category.entries?.length ?? 0
                  : category.assets?.length ?? 0;
                const isActive = activeCategory?.id === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setActiveCategoryId(category.id)}
                    className={`flex min-w-0 items-center gap-2 rounded border px-2 py-2 text-left transition-colors ${isActive ? 'border-cyan-400 bg-cyan-950/80 text-cyan-100' : 'border-slate-700 bg-slate-900/80 text-slate-300 hover:border-cyan-700 hover:bg-slate-800'}`}
                  >
                    {category.kind === 'protagonist' ? <Users size={14} className="shrink-0" /> : <Gamepad2 size={14} className="shrink-0 text-orange-300" />}
                    <span className="min-w-0 flex-1 truncate text-[10px] font-black">{trans(category.title, languageMode)}</span>
                    <span className="shrink-0 text-[9px] text-slate-500">{count}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded border border-slate-800 bg-black/20 p-3 text-center text-xs text-slate-500">{trans('一致するカテゴリがありません。', languageMode)}</div>
          )}
        </div>
      </div>

      {activeCategory?.kind === 'protagonist' && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 border-b border-cyan-800/70 pb-2">
            <Users size={17} className="text-cyan-300" />
            <h3 className="text-sm font-black text-cyan-200">{trans(activeCategory.title, languageMode)}</h3>
            <span className="text-[10px] text-slate-500">{trans('学習ローグ 主人公', languageMode)} / {trans('立ち絵・戦闘シート', languageMode)}</span>
          </div>
          <p className="text-[10px] leading-relaxed text-slate-400">{trans(activeCategory.description, languageMode)}</p>
          {visibleProtagonistEntries.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 2xl:grid-cols-2">
              {visibleProtagonistEntries.map(entry => <ProtagonistCard key={entry.id} entry={entry} languageMode={languageMode} />)}
            </div>
          ) : (
            <div className="rounded border border-slate-800 bg-black/20 p-4 text-center text-xs text-slate-500">{trans('一致するカテゴリがありません。', languageMode)}</div>
          )}
        </section>
      )}

      {activeCategory?.kind === 'mini-game' && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 border-b border-orange-800/70 pb-2">
            <Gamepad2 size={17} className="text-orange-300" />
            <h3 className="text-sm font-black text-orange-200">{trans(activeCategory.title, languageMode)}</h3>
            <code className="text-[9px] text-orange-300">{activeCategory.miniGameId}</code>
            <span className="text-[10px] text-slate-400">{visibleMiniGameAssets.length}{trans('素材', languageMode)}</span>
          </div>
          {activeCategory.description && <p className="text-[10px] leading-relaxed text-slate-400">{trans(activeCategory.description, languageMode)}</p>}
          {visibleMiniGameAssets.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4 2xl:grid-cols-6">
              {visibleMiniGameAssets.map((asset, index) => <SpriteAuditCard key={`${asset.path}-${index}`} asset={asset} languageMode={languageMode} />)}
            </div>
          ) : (
            <div className="rounded border border-yellow-800/70 bg-yellow-950/30 p-3 text-xs text-yellow-200">{trans('素材マニフェスト未登録', languageMode)}</div>
          )}
        </section>
      )}

      {!activeCategory && <div className="rounded border border-slate-800 bg-black/20 p-4 text-center text-xs text-slate-500">{trans('一致するカテゴリがありません。', languageMode)}</div>}
    </div>
  );
};

export default SpriteAuditPreview;

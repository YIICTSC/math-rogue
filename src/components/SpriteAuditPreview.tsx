import React, { useMemo, useState } from 'react';
import { AlertCircle, Check, Gamepad2, Layers, Search, Users } from 'lucide-react';
import { CHARACTERS } from '../constants';
import { MAGIC_HEROES, MAGIC_MALE_PROTAGONISTS } from '../data/magicHeroes';
import { MINI_GAME_SPRITE_AUDIT_MANIFEST, type SpriteAuditAssetDefinition, type SpriteAuditAssetKind } from '../data/spriteAuditManifest';
import { getThemedCharacters } from '../data/visualThemes';
import { MINI_GAMES } from '../miniGameConfig';
import type { LanguageMode } from '../types';
import { assetUrl } from '../utils/assetPaths';
import { trans } from '../utils/textUtils';

type AuditScope = 'ALL' | 'PROTAGONISTS' | 'MINI_GAMES';

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
  sprite: 'SPRITE',
  sheet: 'SHEET',
  ui: 'UI / 背景',
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
  const source = asset.src ?? assetUrl(asset.path);

  return (
    <article className="min-w-0 rounded-lg border border-slate-700 bg-slate-950/70 p-2 shadow-inner">
      <Checkerboard>
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
        {status === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-950/85 px-2 text-center text-xs font-bold text-red-200">
            <AlertCircle size={14} className="mr-1 shrink-0" /> {trans('読み込み失敗', languageMode)}
          </div>
        )}
      </Checkerboard>
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
  const [scope, setScope] = useState<AuditScope>('ALL');
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

  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visibleProtagonistGroups = protagonistGroups
    .map(group => ({
      ...group,
      entries: group.entries.filter(entry => !normalizedQuery || `${group.title} ${entry.name}`.toLocaleLowerCase().includes(normalizedQuery)),
    }))
    .filter(group => group.entries.length > 0);
  const visibleMiniGames = MINI_GAMES.filter(game => {
    if (!normalizedQuery) return true;
    return `${game.name} ${game.id}`.toLocaleLowerCase().includes(normalizedQuery);
  });
  const protagonistCount = protagonistGroups.reduce((total, group) => total + group.entries.length, 0);
  const miniGameAssetCount = MINI_GAMES.reduce((total, game) => total + (MINI_GAME_SPRITE_AUDIT_MANIFEST[game.id]?.assets.length ?? 0), 0);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto bg-slate-950/40 p-3 custom-scrollbar md:p-4">
      <div className="sticky top-0 z-10 rounded-xl border border-cyan-700/70 bg-slate-900/95 p-3 shadow-lg backdrop-blur-md">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-base font-black text-cyan-200">
              <Layers size={18} /> {trans('スプライト見切れ確認', languageMode)}
            </h3>
            <p className="mt-1 text-[10px] leading-relaxed text-slate-400">
              {trans('画像をシート全体で表示します。隣のコマの写り込み、透明端の欠落、読み込み失敗をここで確認してください。', languageMode)}
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
          <div className="flex shrink-0 gap-1 rounded border border-slate-700 bg-slate-950 p-1">
            {([
              ['ALL', 'すべて'],
              ['PROTAGONISTS', '主人公'],
              ['MINI_GAMES', 'ミニゲーム'],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setScope(id)}
                className={`rounded px-2 py-1 text-[10px] font-black transition-colors ${scope === id ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                {trans(label, languageMode)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {(scope === 'ALL' || scope === 'PROTAGONISTS') && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 border-b border-cyan-800/70 pb-2">
            <Users size={17} className="text-cyan-300" />
            <h3 className="text-sm font-black text-cyan-200">{trans('学習ローグ 主人公', languageMode)}</h3>
            <span className="text-[10px] text-slate-500">{trans('立ち絵・戦闘シート', languageMode)}</span>
          </div>
          {visibleProtagonistGroups.length > 0 ? visibleProtagonistGroups.map(group => (
            <div key={group.id} className="space-y-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h4 className="text-xs font-black text-yellow-200">{trans(group.title, languageMode)}</h4>
                <span className="text-[10px] text-slate-500">{trans(group.description, languageMode)}</span>
              </div>
              <div className="grid grid-cols-1 gap-3 2xl:grid-cols-2">
                {group.entries.map(entry => <ProtagonistCard key={entry.id} entry={entry} languageMode={languageMode} />)}
              </div>
            </div>
          )) : <div className="rounded border border-slate-800 bg-black/20 p-4 text-center text-xs text-slate-500">{trans('一致する主人公がありません。', languageMode)}</div>}
        </section>
      )}

      {(scope === 'ALL' || scope === 'MINI_GAMES') && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 border-b border-orange-800/70 pb-2">
            <Gamepad2 size={17} className="text-orange-300" />
            <h3 className="text-sm font-black text-orange-200">{trans('ミニゲーム素材', languageMode)}</h3>
            <span className="text-[10px] text-slate-500">{trans('全', languageMode)} {MINI_GAMES.length} {trans('種', languageMode)}</span>
          </div>
          {visibleMiniGames.map(game => {
            const definition = MINI_GAME_SPRITE_AUDIT_MANIFEST[game.id];
            return (
              <article key={game.id} className="rounded-xl border border-slate-700 bg-black/25 p-3">
                <div className="mb-3 flex flex-col gap-1 border-b border-slate-700 pb-2 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-white">{trans(game.name, languageMode)}</h4>
                    <code className="text-[9px] text-orange-300">{game.id}</code>
                  </div>
                  <span className="text-[10px] text-slate-400">{definition?.assets.length ?? 0}{trans('素材', languageMode)}</span>
                </div>
                <p className="mb-3 text-[10px] leading-relaxed text-slate-400">{definition?.note ? trans(definition.note, languageMode) : trans('素材マニフェスト未登録', languageMode)}</p>
                {definition?.assets.length ? (
                  <div className="grid grid-cols-2 gap-2 lg:grid-cols-4 2xl:grid-cols-6">
                    {definition.assets.map((asset, index) => <SpriteAuditCard key={`${asset.path}-${index}`} asset={asset} languageMode={languageMode} />)}
                  </div>
                ) : (
                  <div className="rounded border border-yellow-800/70 bg-yellow-950/30 p-3 text-xs text-yellow-200">{trans('素材マニフェスト未登録', languageMode)}</div>
                )}
              </article>
            );
          })}
          {visibleMiniGames.length === 0 && <div className="rounded border border-slate-800 bg-black/20 p-4 text-center text-xs text-slate-500">{trans('一致するミニゲームがありません。', languageMode)}</div>}
        </section>
      )}
    </div>
  );
};

export default SpriteAuditPreview;

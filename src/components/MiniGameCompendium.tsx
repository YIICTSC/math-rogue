import React, { useMemo, useState } from 'react';
import { BookOpen, ChevronRight, Gamepad2, Lock, X } from 'lucide-react';
import type { LanguageMode } from '../types';
import { CONSUMABLES_LIBRARY, EXPANDED_SUPPORTER_IDS, PACK_LIBRARY, SUPPORTERS_LIBRARY, VOUCHERS_LIBRARY } from '../constants';
import { storageService } from '../services/storageService';
import { trans } from '../utils/textUtils';
import { assetUrl } from '../utils/assetPaths';
import PixelSprite from './PixelSprite';
import { SCHOOL_DUNGEON_ITEM_CATALOG } from './SchoolDungeonRPG';
import { SCHOOL_DUNGEON_2_CARD_CATALOG, SCHOOL_DUNGEON_2_ITEM_CATALOG } from './SchoolDungeonRPG2';
import { SCHOOLYARD_PASSIVE_CATALOG, SCHOOLYARD_WEAPON_CATALOG } from './SchoolyardSurvivorScreen';
import { KOCHO_CARD_CATALOG } from './KochoShowdown';
import {
    PAPER_PLANE_PART_CATALOG,
    PAPER_PLANE_PILOT_CATALOG,
    PAPER_PLANE_SHIP_CATALOG,
} from './PaperPlaneBattle';
import { STONE_GLOW_CARD_CATALOG } from './TriviaMiniGameScreen';
import { SCHOOL_TRPG_ENDINGS, SCHOOL_TRPG_REWARDS } from '../mini-games/school-trpg/schoolTrpgData';
import { localizeTrpgCopy } from '../mini-games/school-trpg/schoolTrpgTypes';
import { loadSchoolTrpgCampaign } from '../mini-games/school-trpg/schoolTrpgSave';
import { ADVANCED_PIECES, STANDARD_PIECES } from '../mini-games/shogi/shogiPieces';
import { loadPlacementTcgCollection } from '../mini-games/placement-tcg/placementTcgEngine';
import { PLACEMENT_TCG_CARDS } from '../mini-games/placement-tcg/placementTcgCards';

type MiniGameSectionId =
    | 'DUNGEON'
    | 'DUNGEON_2'
    | 'SURVIVOR'
    | 'POKER'
    | 'KOCHO'
    | 'PAPER_PLANE'
    | 'STONE_GLOW'
    | 'SCHOOL_TRPG'
    | 'LEARNING_TCG'
    | 'SHOGI';

type MiniGameVisual =
    | { type: 'sprite'; value: string }
    | { type: 'image'; value: string }
    | { type: 'glyph'; value: string };

type MiniGameEntry = {
    id: string;
    name: string;
    description: string;
    category: string;
    unlocked: boolean;
    tracked: boolean;
    visual: MiniGameVisual;
    metadata?: string[];
};

type MiniGameSection = {
    id: MiniGameSectionId;
    title: string;
    caption: string;
    entries: MiniGameEntry[];
};

type MiniGameCompendiumProps = {
    languageMode: LanguageMode;
    isDebug: boolean;
};

const SHOGI_PROGRESS_KEY = 'learning_rogue_shogi_progress_v2';

const spriteForCategory = (category: string) => {
    if (category.includes('武器') || category.includes('カード') || category === 'WEAPON') return 'SWORD|#38bdf8';
    if (category.includes('防具') || category.includes('パッシブ') || category === 'ARMOR') return 'SHIELD|#a78bfa';
    if (category.includes('パーツ')) return 'SWORD|#f59e0b';
    if (category.includes('発見')) return 'GEM|#fbbf24';
    if (category.includes('機体')) return 'FLIER|#22d3ee';
    return 'GEM|#fbbf24';
};

const entryFromDungeonItem = (game: string, item: { id: string; category: string; type: string; name: string; desc: string }): MiniGameEntry => ({
    id: `${game}-${item.id}`,
    name: item.name,
    description: item.desc,
    category: item.category,
    unlocked: true,
    tracked: false,
    visual: { type: 'sprite', value: `${spriteForCategory(item.category).split('|')[0]}|${item.category === 'ARMOR' ? '#a78bfa' : '#fbbf24'}` },
});

const readShogiHighestStage = () => {
    if (typeof window === 'undefined') return 1;
    try {
        const value = JSON.parse(window.localStorage.getItem(SHOGI_PROGRESS_KEY) || '');
        return typeof value?.highestStage === 'number' ? Math.max(1, Math.min(100, value.highestStage)) : 1;
    } catch {
        return 1;
    }
};

const renderVisual = (entry: MiniGameEntry, size = 'h-14 w-14') => {
    if (entry.visual.type === 'image') {
        return <img src={assetUrl(entry.visual.value)} alt="" className={`${size} object-contain`} />;
    }
    if (entry.visual.type === 'glyph') {
        return <span className={`${size} flex items-center justify-center text-4xl font-black text-amber-200`}>{entry.visual.value}</span>;
    }
    return <PixelSprite seed={entry.id} name={entry.visual.value} className={`${size} image-rendering-pixelated`} />;
};

const MiniGameCompendium: React.FC<MiniGameCompendiumProps> = ({ languageMode, isDebug }) => {
    const [activeSection, setActiveSection] = useState<MiniGameSectionId>('DUNGEON');
    const [selectedEntry, setSelectedEntry] = useState<MiniGameEntry | null>(null);

    const sections = useMemo<MiniGameSection[]>(() => {
        const paperProgress = storageService.loadPaperPlaneProgress();
        const unlockedPokerCount = Math.min(storageService.getPokerExpandedSupporterUnlockCount(), EXPANDED_SUPPORTER_IDS.length);
        const unlockedPokerIds = new Set(EXPANDED_SUPPORTER_IDS.slice(0, unlockedPokerCount));
        const unlockedKochoCards = new Set(storageService.getUnlockedKochoCards());
        const trpgCampaign = loadSchoolTrpgCampaign();
        const unlockedTrpgRewards = new Set(trpgCampaign?.inventory || []);
        const unlockedTrpgEndings = new Set([
            ...(trpgCampaign?.endingHistory || []),
            ...(trpgCampaign?.endingId ? [trpgCampaign.endingId] : []),
        ]);
        const placementCollection = loadPlacementTcgCollection();
        const unlockedPlacementCards = new Set(placementCollection.unlockedCardIds);
        const shogiHighestStage = readShogiHighestStage();

        const dungeonItems = SCHOOL_DUNGEON_ITEM_CATALOG.map(item => entryFromDungeonItem('dungeon', item));
        const dungeon2Items = SCHOOL_DUNGEON_2_ITEM_CATALOG.map(item => entryFromDungeonItem('dungeon-2', item));
        const dungeon2Cards = SCHOOL_DUNGEON_2_CARD_CATALOG.map(card => ({
            id: `dungeon-2-card-${card.templateId}`,
            name: card.name,
            description: card.description,
            category: 'デッキカード',
            unlocked: true,
            tracked: false,
            visual: { type: 'sprite' as const, value: `${card.type === 'DEFENSE' ? 'SHIELD' : card.type === 'BUFF' ? 'POTION' : 'SWORD'}|#38bdf8` },
            metadata: [`POWER ${card.power}`],
        }));

        const survivorWeapons = SCHOOLYARD_WEAPON_CATALOG.map(weapon => ({
            id: `survivor-weapon-${weapon.id}`,
            name: weapon.name,
            description: `${weapon.desc} / ${weapon.evolvedName}: ${weapon.evolvedDesc}`,
            category: '武器',
            unlocked: true,
            tracked: false,
            visual: { type: 'sprite' as const, value: `${weapon.sprite.template}|${weapon.sprite.color}` },
            metadata: [`進化: ${weapon.evolvedName}`, `連携: ${weapon.synergy}`],
        }));
        const survivorPassives = SCHOOLYARD_PASSIVE_CATALOG.map(passive => ({
            id: `survivor-passive-${passive.id}`,
            name: passive.name,
            description: passive.desc,
            category: 'パッシブ',
            unlocked: true,
            tracked: false,
            visual: { type: 'sprite' as const, value: `${passive.sprite.template}|${passive.sprite.color}` },
        }));

        const pokerSupporters = SUPPORTERS_LIBRARY.map(supporter => {
            const tracked = EXPANDED_SUPPORTER_IDS.includes(supporter.id);
            return {
                id: `poker-supporter-${supporter.id}`,
                name: supporter.name,
                description: supporter.description,
                category: 'サポーター',
                unlocked: isDebug || !tracked || unlockedPokerIds.has(supporter.id),
                tracked,
                visual: { type: 'sprite' as const, value: supporter.icon },
                metadata: [supporter.rarity, `価格 ${supporter.price}`],
            };
        });
        const pokerConsumables = CONSUMABLES_LIBRARY.map(item => ({
            id: `poker-consumable-${item.id}`,
            name: item.name,
            description: item.description,
            category: '消費アイテム',
            unlocked: true,
            tracked: false,
            visual: { type: 'sprite' as const, value: item.icon },
            metadata: [item.type, `価格 ${item.price}`],
        }));
        const pokerPacks = PACK_LIBRARY.map(item => ({
            id: `poker-pack-${item.id}`,
            name: item.name,
            description: item.description,
            category: 'パック',
            unlocked: true,
            tracked: false,
            visual: { type: 'sprite' as const, value: item.icon },
            metadata: [`${item.size}枚から${item.choose}枚`, `価格 ${item.price}`],
        }));
        const pokerVouchers = VOUCHERS_LIBRARY.map(item => ({
            id: `poker-voucher-${item.id}`,
            name: item.name,
            description: item.description,
            category: 'バウチャー',
            unlocked: true,
            tracked: false,
            visual: { type: 'sprite' as const, value: item.icon },
            metadata: [`価格 ${item.price}`],
        }));

        const kochoCards = KOCHO_CARD_CATALOG.map(card => {
            const tracked = card.unlockable;
            return {
                id: `kocho-${card.id}`,
                name: card.name,
                description: card.description,
                category: card.type === 'ATTACK' ? '攻撃カード' : card.type === 'MOVE' ? '移動カード' : 'ユーティリティ',
                unlocked: isDebug || !tracked || unlockedKochoCards.has(card.name),
                tracked,
                visual: { type: 'sprite' as const, value: `${card.type === 'ATTACK' ? 'SWORD' : card.type === 'MOVE' ? 'SHOE' : 'SHIELD'}|#38bdf8` },
                metadata: [`ダメージ ${card.damage}`, `CD ${card.cooldown}`, `EN ${card.energyCost}`],
            };
        });

        const paperParts = PAPER_PLANE_PART_CATALOG.map(part => ({
            id: `paper-part-${part.id}`,
            name: part.name,
            description: part.description || '説明なし',
            category: 'パーツ',
            unlocked: isDebug || part.unlockedByDefault || paperProgress.unlockedPartNames.includes(part.name),
            tracked: !part.unlockedByDefault,
            visual: { type: 'sprite' as const, value: `${part.type === 'SHIELD' ? 'SHIELD' : part.type === 'ENGINE' ? 'FLIER' : 'SWORD'}|#f59e0b` },
            metadata: [`${part.type}`, `出力 ${part.basePower}`, `HP ${part.hp}`],
        }));
        const paperPilots = PAPER_PLANE_PILOT_CATALOG.map(pilot => ({
            id: `paper-pilot-${pilot.id}`,
            name: pilot.name,
            description: `${pilot.intrinsicTalent.name}: ${pilot.intrinsicTalent.description}`,
            category: 'パイロット',
            unlocked: true,
            tracked: false,
            visual: { type: 'image' as const, value: `sprites/paper-plane/pilots/${pilot.id}.webp` },
        }));
        const paperShips = PAPER_PLANE_SHIP_CATALOG.map(ship => ({
            id: `paper-ship-${ship.id}`,
            name: ship.name,
            description: ship.description,
            category: '機体',
            unlocked: isDebug || paperProgress.rank >= ship.unlockRank,
            tracked: ship.unlockRank > 0,
            visual: { type: 'sprite' as const, value: `SHIP|${ship.color.includes('blue') ? '#38bdf8' : ship.color.includes('orange') ? '#fb923c' : '#34d399'}` },
            metadata: [`解禁ランク ${ship.unlockRank}`, `HP ${ship.baseHp}`],
        }));

        const stoneCards = STONE_GLOW_CARD_CATALOG.map(card => ({
            id: `stone-glow-${card.id}`,
            name: card.name,
            description: `ボーナス: ${card.bonus} / ${card.points}点`,
            category: `採掘カード Tier ${card.tier}`,
            unlocked: true,
            tracked: false,
            visual: { type: 'sprite' as const, value: 'GEM|#60a5fa' },
            metadata: [`コスト ${Object.entries(card.cost).map(([color, amount]) => `${color}:${amount}`).join(' ')}`],
        }));

        const trpgRewards = SCHOOL_TRPG_REWARDS.map(reward => ({
            id: `school-trpg-reward-${reward.id}`,
            name: localizeTrpgCopy(reward.name, languageMode),
            description: `${localizeTrpgCopy(reward.description, languageMode)}\n${localizeTrpgCopy(reward.useCopy, languageMode)}`,
            category: '発見物',
            unlocked: isDebug || unlockedTrpgRewards.has(reward.id),
            tracked: true,
            visual: reward.artAsset ? { type: 'image' as const, value: reward.artAsset } : { type: 'sprite' as const, value: 'GEM|#fbbf24' },
            metadata: [`効果 ${reward.effect.kind} +${reward.effect.amount}`],
        }));
        const trpgEndings = SCHOOL_TRPG_ENDINGS.map(ending => ({
            id: `school-trpg-ending-${ending.id}`,
            name: localizeTrpgCopy(ending.title, languageMode),
            description: localizeTrpgCopy(ending.body, languageMode),
            category: 'エンディング',
            unlocked: isDebug || unlockedTrpgEndings.has(ending.id),
            tracked: true,
            visual: ending.artAsset ? { type: 'image' as const, value: ending.artAsset } : { type: 'sprite' as const, value: 'TROPHY|#fbbf24' },
            metadata: [localizeTrpgCopy(ending.subtitle, languageMode)],
        }));

        const learningTcgCards = PLACEMENT_TCG_CARDS.map(card => ({
            id: `learning-tcg-${card.id}`,
            name: card.name,
            description: languageMode === 'ENGLISH' ? card.rulesText.en : card.rulesText.jp,
            category: `${card.edition} / ${card.kind}`,
            unlocked: isDebug || unlockedPlacementCards.has(card.id),
            tracked: true,
            visual: card.artAsset
                ? { type: 'image' as const, value: card.artAsset }
                : { type: 'sprite' as const, value: `${card.kind === 'UNIT' ? 'HUMANOID' : 'CARD'}|#38bdf8` },
            metadata: [`TIER ${card.tier}`, `SP ${card.spCost}`],
        }));

        const shogiPieces = [
            ...STANDARD_PIECES.map(piece => ({
                id: `shogi-standard-${piece.kind}`,
                name: piece.name,
                description: piece.description,
                category: '標準駒',
                unlocked: true,
                tracked: false,
                visual: { type: 'glyph' as const, value: piece.glyph },
                metadata: [piece.promotion, piece.restriction],
            })),
            ...ADVANCED_PIECES.map(piece => ({
                id: `shogi-advanced-${piece.kind}`,
                name: piece.name,
                description: piece.description,
                category: `追加駒 STAGE ${piece.stage}`,
                unlocked: isDebug || piece.stage <= shogiHighestStage,
                tracked: true,
                visual: { type: 'glyph' as const, value: piece.glyph },
                metadata: [piece.promotion, piece.restriction, ...(piece.special ? [piece.special] : [])],
            })),
        ];

        return [
            { id: 'DUNGEON', title: '学校ダンジョンRPG', caption: '小学生編の全アイテム', entries: dungeonItems },
            { id: 'DUNGEON_2', title: '学校ダンジョンRPG 2', caption: '高校編の全アイテム・カード', entries: [...dungeon2Items, ...dungeon2Cards] },
            { id: 'SURVIVOR', title: '校庭サバイバー', caption: '武器とパッシブ', entries: [...survivorWeapons, ...survivorPassives] },
            { id: 'POKER', title: '放課後ポーカー', caption: 'サポーター・アイテム・パック・バウチャー', entries: [...pokerSupporters, ...pokerConsumables, ...pokerPacks, ...pokerVouchers] },
            { id: 'KOCHO', title: '校長対決', caption: '全アクションカード', entries: kochoCards },
            { id: 'PAPER_PLANE', title: '紙飛行機バトル', caption: 'パーツ・パイロット・機体', entries: [...paperParts, ...paperPilots, ...paperShips] },
            { id: 'STONE_GLOW', title: '石ころの煌めき', caption: '全採掘カード', entries: stoneCards },
            { id: 'SCHOOL_TRPG', title: 'スクールTRPG', caption: '発見物とエンディング', entries: [...trpgRewards, ...trpgEndings] },
            { id: 'LEARNING_TCG', title: '学習ローグTCG', caption: '全カード', entries: learningTcgCards },
            { id: 'SHOGI', title: 'ミニ将棋', caption: '標準駒とステージ解禁駒', entries: shogiPieces },
        ];
    }, [isDebug, languageMode]);

    const currentSection = sections.find(section => section.id === activeSection) || sections[0];
    const trackedEntries = sections.flatMap(section => section.entries).filter(entry => entry.tracked);
    const unlockedTrackedEntries = trackedEntries.filter(entry => entry.unlocked).length;

    return (
        <div className="min-h-full w-full text-white">
            <div className="mb-5 rounded-xl border border-cyan-400/40 bg-slate-950/80 p-4 shadow-[0_0_24px_rgba(34,211,238,0.12)]">
                <div className="flex items-center gap-3">
                    <Gamepad2 className="text-cyan-300" size={24} />
                    <div>
                        <h3 className="text-lg font-black text-cyan-100">{trans('ミニゲーム収集要素', languageMode)}</h3>
                        <p className="text-xs leading-relaxed text-slate-300">
                            {trans('収集要素を持つミニゲームのマスター定義を一覧表示しています。解禁情報が保存される要素は現在の進捗も反映されます。', languageMode)}
                        </p>
                    </div>
                    <div className="ml-auto text-right text-xs text-slate-300">
                        <div>{sections.length} {trans('ゲーム', languageMode)}</div>
                        <div>{unlockedTrackedEntries}/{trackedEntries.length} {trans('解禁済み', languageMode)}</div>
                    </div>
                </div>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-5">
                {sections.map(section => {
                    const tracked = section.entries.filter(entry => entry.tracked);
                    const unlocked = tracked.filter(entry => entry.unlocked).length;
                    return (
                        <button
                            type="button"
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`rounded-lg border px-3 py-2 text-left transition-colors ${activeSection === section.id ? 'border-cyan-300 bg-cyan-900/70' : 'border-slate-600 bg-slate-950/70 hover:border-cyan-500'}`}
                        >
                            <span className="block truncate text-xs font-black text-white">{trans(section.title, languageMode)}</span>
                            <span className="mt-1 block truncate text-[10px] text-slate-400">{section.entries.length} {trans('件', languageMode)}{tracked.length > 0 ? ` / ${unlocked}` : ''}</span>
                        </button>
                    );
                })}
            </div>

            <div className="mb-3 flex items-center gap-2 border-b border-cyan-400/30 pb-3">
                <BookOpen size={18} className="text-amber-300" />
                <div>
                    <h4 className="font-black text-amber-100">{trans(currentSection.title, languageMode)}</h4>
                    <p className="text-xs text-slate-400">{trans(currentSection.caption, languageMode)} / {currentSection.entries.length} {trans('件', languageMode)}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
                {currentSection.entries.map(entry => (
                    <button
                        type="button"
                        key={entry.id}
                        onClick={() => setSelectedEntry(entry)}
                        className={`group relative flex min-h-[142px] flex-col items-center rounded-lg border p-3 text-center transition-all hover:-translate-y-0.5 ${entry.unlocked ? 'border-slate-600 bg-black/60 hover:border-cyan-300' : 'border-slate-700 bg-black/45 opacity-70 hover:border-amber-400'}`}
                    >
                        <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-lg border border-amber-400/60 bg-slate-900/90 p-1.5">
                            {renderVisual(entry)}
                            {!entry.unlocked && <Lock size={15} className="absolute right-2 top-2 text-slate-300" />}
                        </div>
                        <span className={`line-clamp-2 w-full text-xs font-bold ${entry.unlocked ? 'text-amber-100' : 'text-slate-400'}`}>{trans(entry.name, languageMode)}</span>
                        <span className="mt-1 line-clamp-1 w-full text-[9px] text-slate-500">{trans(entry.category, languageMode)}</span>
                        <span className={`mt-2 rounded px-1.5 py-0.5 text-[9px] font-bold ${entry.tracked ? entry.unlocked ? 'bg-emerald-900/70 text-emerald-200' : 'bg-slate-800 text-slate-400' : 'bg-cyan-950/70 text-cyan-200'}`}>
                            {entry.tracked ? entry.unlocked ? trans('解禁済み', languageMode) : trans('未解禁', languageMode) : trans('収録', languageMode)}
                        </span>
                    </button>
                ))}
            </div>

            {selectedEntry && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => setSelectedEntry(null)}>
                    <div className="relative w-full max-w-md rounded-xl border-2 border-cyan-400 bg-slate-900 p-5 shadow-[0_0_36px_rgba(34,211,238,0.25)]" onClick={event => event.stopPropagation()}>
                        <button type="button" onClick={() => setSelectedEntry(null)} className="absolute right-2 top-2 rounded p-2 text-slate-400 hover:text-white"><X size={20} /></button>
                        <div className="flex items-center gap-4 pr-8">
                            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-amber-300/60 bg-slate-950 p-2">{renderVisual(selectedEntry, 'h-16 w-16')}</div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-300">{trans(selectedEntry.category, languageMode)}</p>
                                <h3 className="mt-1 text-xl font-black text-amber-100">{trans(selectedEntry.name, languageMode)}</h3>
                            </div>
                        </div>
                        <p className="mt-5 whitespace-pre-line rounded-lg border border-slate-700 bg-black/30 p-4 text-sm leading-relaxed text-slate-200">{trans(selectedEntry.description, languageMode)}</p>
                        {selectedEntry.metadata && selectedEntry.metadata.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {selectedEntry.metadata.map(value => <span key={value} className="rounded bg-slate-800 px-2 py-1 text-[10px] text-slate-300">{trans(value, languageMode)}</span>)}
                            </div>
                        )}
                        <div className="mt-4 flex items-center justify-between border-t border-slate-700 pt-3 text-xs">
                            <span className={selectedEntry.unlocked ? 'text-emerald-300' : 'text-slate-400'}>{selectedEntry.tracked ? selectedEntry.unlocked ? trans('解禁済み', languageMode) : trans('未解禁', languageMode) : trans('ゲーム内に収録', languageMode)}</span>
                            <ChevronRight size={15} className="text-cyan-300" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MiniGameCompendium;

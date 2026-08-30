import React, { useMemo, useState } from 'react';
import { BookOpen, ChevronRight, Gamepad2, Lock, X } from 'lucide-react';
import type { LanguageMode } from '../types';
import { CONSUMABLES_LIBRARY, EXPANDED_SUPPORTER_IDS, PACK_LIBRARY, SUPPORTERS_LIBRARY, VOUCHERS_LIBRARY } from '../constants';
import { storageService } from '../services/storageService';
import { trans } from '../utils/textUtils';
import { assetUrl } from '../utils/assetPaths';
import PixelSprite from './PixelSprite';
import { SCHOOL_DUNGEON_ITEM_CATALOG, SCHOOL_DUNGEON_SPRITE_TYPES } from './SchoolDungeonRPG';
import {
    SCHOOL_DUNGEON_2_CARD_CATALOG,
    SCHOOL_DUNGEON_2_CARD_SPRITE_INDEX,
    SCHOOL_DUNGEON_2_ITEM_CATALOG,
    SCHOOL_DUNGEON_2_SPRITE_TYPES,
} from './SchoolDungeonRPG2';
import { SCHOOLYARD_PASSIVE_CATALOG, SCHOOLYARD_WEAPON_CATALOG } from './SchoolyardSurvivorScreen';
import { hasKochoCardActionArt, KOCHO_CARD_CATALOG, KochoCardActionArt } from './KochoShowdown';
import {
    getPaperPlanePartSprite,
    getPaperPlaneShipSprite,
    PaperPlaneSheetImage,
    PAPER_PLANE_PART_CATALOG,
    PAPER_PLANE_PILOT_CATALOG,
    PAPER_PLANE_SHIP_CATALOG,
} from './PaperPlaneBattle';
import { STONE_GLOW_CARD_CATALOG } from './TriviaMiniGameScreen';
import { SCHOOL_TRPG_ENDINGS, SCHOOL_TRPG_REWARDS } from '../mini-games/school-trpg/schoolTrpgData';
import { localizeTrpgCopy } from '../mini-games/school-trpg/schoolTrpgTypes';
import { loadSchoolTrpgCampaign } from '../mini-games/school-trpg/schoolTrpgSave';
import { ShogiPieceIcon } from '../mini-games/shogi/ShogiMiniGame';
import { ADVANCED_PIECES, STANDARD_PIECES } from '../mini-games/shogi/shogiPieces';
import { PLACEMENT_TCG_CARDS, type PlacementCardDefinition } from '../mini-games/placement-tcg/placementTcgCards';
import { CardArt } from '../mini-games/placement-tcg/PlacementTcgGame';
import { PokerCompendiumSprite } from './PokerGameScreen';

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
    | { type: 'glyph'; value: string }
    | { type: 'furai-sheet'; group: 'weapons' | 'armor' | 'items'; index: number }
    | { type: 'furai-card'; templateId: string }
    | { type: 'poker'; itemId: string; icon: string }
    | { type: 'kocho-card'; cardName: string }
    | { type: 'paper-part'; name: string }
    | { type: 'paper-ship'; id: string }
    | { type: 'stone-card'; bonus: string; points: number; tier: number }
    | { type: 'placement-card'; card: PlacementCardDefinition }
    | { type: 'shogi-piece'; glyph: string }
    | { type: 'none' };

type MiniGameEntry = {
    id: string;
    name: string;
    description: string;
    category: string;
    unlocked: boolean;
    tracked: boolean;
    visual: MiniGameVisual;
    /** Stable key written when this item is actually shown by its mini-game. */
    discoveryKey?: string;
    /** False means the catalog entry has no representation ever used by the game UI. */
    visibleInGame?: boolean;
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

const FURAI_SHEET_CELL = 72;
const FURAI_SHEET_GAP = 16;
const FURAI_SHEET_COLUMNS = 5;
const FURAI_SHEET_PAGE_SIZE = 25;
const FURAI_SHEET_ASSETS = {
    weapons: 'sprites/furai-sfc-v2-weapons-5x5',
    armor: 'sprites/furai-sfc-v2-armor-5x5',
    items: 'sprites/furai-sfc-v2-items-5x5',
    cards: 'sprites/furai-shogakusei2-card-sheet.webp?v=sg2-cards4',
} as const;

const stableSpriteIndex = (value: string, modulo: number) => {
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) hash = ((hash << 5) - hash) + value.charCodeAt(index);
    return Math.abs(hash) % modulo;
};

const getFuraiSheetPath = (group: 'weapons' | 'armor' | 'items', index: number) => {
    const page = Math.floor(Math.max(0, index) / FURAI_SHEET_PAGE_SIZE) + 1;
    const actualPage = page <= 2 ? page : 1;
    return `${FURAI_SHEET_ASSETS[group]}-${actualPage}.webp?v=sfcv2`;
};

const getFuraiSheetVisual = (group: 'weapons' | 'armor' | 'items', index: number): MiniGameVisual => ({
    type: 'furai-sheet',
    group,
    index,
});

const getDungeonItemVisual = (
    item: { category: string; type: string },
    spriteTypes: typeof SCHOOL_DUNGEON_SPRITE_TYPES | typeof SCHOOL_DUNGEON_2_SPRITE_TYPES,
): MiniGameVisual => {
    if (item.category === 'WEAPON') {
        const index = spriteTypes.weapons.indexOf(item.type);
        return getFuraiSheetVisual('weapons', index >= 0 ? index : stableSpriteIndex(item.type, 64));
    }
    if (item.category === 'ARMOR') {
        const index = spriteTypes.armor.indexOf(item.type);
        return getFuraiSheetVisual('armor', index >= 0 ? index : stableSpriteIndex(item.type, 64));
    }
    const generalType = item.category === 'STAFF'
        ? 'GENERIC_UMBRELLA'
        : item.category === 'ACCESSORY'
            ? 'GENERIC_BRACELET'
            : item.type;
    const index = spriteTypes.items.indexOf(generalType);
    return getFuraiSheetVisual('items', index >= 0 ? index : stableSpriteIndex(generalType, 64));
};

const renderFuraiSheet = (
    path: string,
    index: number,
    columns: number,
    pageSize: number,
    size: string,
) => {
    const normalizedIndex = ((index % pageSize) + pageSize) % pageSize;
    const col = normalizedIndex % columns;
    const row = Math.floor(normalizedIndex / columns);
    const rows = Math.ceil(pageSize / columns);
    const sx = FURAI_SHEET_GAP + col * (FURAI_SHEET_CELL + FURAI_SHEET_GAP);
    const sy = FURAI_SHEET_GAP + row * (FURAI_SHEET_CELL + FURAI_SHEET_GAP);
    const sheetWidth = FURAI_SHEET_GAP + columns * (FURAI_SHEET_CELL + FURAI_SHEET_GAP);
    const sheetHeight = FURAI_SHEET_GAP + rows * (FURAI_SHEET_CELL + FURAI_SHEET_GAP);
    return (
        <div className={`shrink-0 overflow-hidden relative ${size}`} style={{ imageRendering: 'pixelated' }}>
            <div
                className="absolute bg-no-repeat pointer-events-none"
                style={{
                    left: `-${(sx / FURAI_SHEET_CELL) * 100}%`,
                    top: `-${(sy / FURAI_SHEET_CELL) * 100}%`,
                    width: `${(sheetWidth / FURAI_SHEET_CELL) * 100}%`,
                    height: `${(sheetHeight / FURAI_SHEET_CELL) * 100}%`,
                    backgroundImage: `url(${assetUrl(path)})`,
                    backgroundSize: '100% 100%',
                    imageRendering: 'pixelated',
                }}
            />
        </div>
    );
};

const renderStoneCardVisual = (bonus: string, points: number, tier: number, size: string) => {
    const colorClass = bonus === 'ruby'
        ? 'border-rose-300/70 bg-rose-950/60'
        : bonus === 'sapphire'
            ? 'border-sky-300/70 bg-sky-950/60'
            : bonus === 'emerald'
                ? 'border-emerald-300/70 bg-emerald-950/60'
                : 'border-amber-300/70 bg-amber-950/60';
    const dotClass = bonus === 'ruby' ? 'bg-rose-500' : bonus === 'sapphire' ? 'bg-sky-500' : bonus === 'emerald' ? 'bg-emerald-500' : 'bg-amber-400';
    return (
        <div className={`${size} flex flex-col items-center justify-center rounded-lg border ${colorClass} text-[10px] font-black`}>
            <span className="text-yellow-300">★{points}</span>
            <span className={`my-0.5 h-2.5 w-2.5 rounded-full ${dotClass}`} />
            <span className="text-[8px] text-slate-300">T{tier}</span>
        </div>
    );
};

const entryFromDungeonItem = (game: string, item: { id: string; category: string; type: string; name: string; desc: string }): MiniGameEntry => ({
    id: `${game}-${item.id}`,
    name: item.name,
    description: item.desc,
    category: item.category,
    unlocked: false,
    tracked: true,
    visual: getDungeonItemVisual(item, game === 'dungeon-2' ? SCHOOL_DUNGEON_2_SPRITE_TYPES : SCHOOL_DUNGEON_SPRITE_TYPES),
    discoveryKey: `${game}-${item.id}`,
    visibleInGame: true,
});

const renderVisual = (entry: MiniGameEntry, size = 'h-14 w-14') => {
    if (entry.visual.type === 'image') {
        return <img src={assetUrl(entry.visual.value)} alt="" className={`${size} object-contain`} />;
    }
    if (entry.visual.type === 'glyph') {
        return <span className={`${size} flex items-center justify-center text-4xl font-black text-amber-200`}>{entry.visual.value}</span>;
    }
    if (entry.visual.type === 'furai-sheet') {
        return renderFuraiSheet(getFuraiSheetPath(entry.visual.group, entry.visual.index), entry.visual.index, FURAI_SHEET_COLUMNS, FURAI_SHEET_PAGE_SIZE, size);
    }
    if (entry.visual.type === 'furai-card') {
        const index = SCHOOL_DUNGEON_2_CARD_SPRITE_INDEX[entry.visual.templateId] ?? stableSpriteIndex(entry.visual.templateId, 30);
        return renderFuraiSheet(FURAI_SHEET_ASSETS.cards, index, 6, 30, size);
    }
    if (entry.visual.type === 'poker') {
        return <PokerCompendiumSprite itemId={entry.visual.itemId} icon={entry.visual.icon} name={entry.name} className={`${size} image-rendering-pixelated`} />;
    }
    if (entry.visual.type === 'kocho-card') {
        return <KochoCardActionArt card={{ name: entry.visual.cardName }} className={`${size} rounded bg-black/40`} />;
    }
    if (entry.visual.type === 'paper-part') {
        return <PaperPlaneSheetImage sprite={getPaperPlanePartSprite(entry.visual.name)} title={entry.name} className={`${size} bg-no-repeat`} />;
    }
    if (entry.visual.type === 'paper-ship') {
        return <PaperPlaneSheetImage sprite={getPaperPlaneShipSprite(entry.visual.id)} title={entry.name} className={`${size} bg-no-repeat`} />;
    }
    if (entry.visual.type === 'stone-card') {
        return renderStoneCardVisual(entry.visual.bonus, entry.visual.points, entry.visual.tier, size);
    }
    if (entry.visual.type === 'placement-card') {
        return <CardArt card={entry.visual.card} compact />;
    }
    if (entry.visual.type === 'shogi-piece') {
        return <ShogiPieceIcon glyph={entry.visual.glyph} className="scale-[1.7]" />;
    }
    if (entry.visual.type === 'none') {
        return <Lock size={22} className="text-slate-500" aria-hidden="true" />;
    }
    return <PixelSprite seed={entry.id} name={entry.visual.value} className={`${size} image-rendering-pixelated`} />;
};

const MiniGameCompendium: React.FC<MiniGameCompendiumProps> = ({ languageMode, isDebug }) => {
    const [activeSection, setActiveSection] = useState<MiniGameSectionId>('DUNGEON');
    const [selectedEntry, setSelectedEntry] = useState<MiniGameEntry | null>(null);

    const sections = useMemo<MiniGameSection[]>(() => {
        const paperProgress = storageService.loadPaperPlaneProgress();
        const discoveries = (scope: MiniGameSectionId) => new Set(storageService.getMiniGameDiscoveries(scope));
        const discoveredDungeon = discoveries('DUNGEON');
        const discoveredDungeon2 = discoveries('DUNGEON_2');
        const discoveredSurvivor = discoveries('SURVIVOR');
        const discoveredPoker = discoveries('POKER');
        const discoveredKocho = new Set([
            ...storageService.getMiniGameDiscoveries('KOCHO'),
            ...storageService.getUnlockedKochoCards().map(cardName => `kocho-${cardName}`),
        ]);
        const discoveredPaperPlane = new Set([
            ...storageService.getMiniGameDiscoveries('PAPER_PLANE'),
            ...paperProgress.unlockedPartNames.map(partName => `paper-part-${partName.replace(/\+$/, '')}`),
        ]);
        const discoveredStoneGlow = discoveries('STONE_GLOW');
        const discoveredTrpg = discoveries('SCHOOL_TRPG');
        const discoveredTcg = discoveries('LEARNING_TCG');
        const discoveredShogi = discoveries('SHOGI');
        const unlockedPokerCount = Math.min(storageService.getPokerExpandedSupporterUnlockCount(), EXPANDED_SUPPORTER_IDS.length);
        const unlockedPokerIds = new Set(EXPANDED_SUPPORTER_IDS.slice(0, unlockedPokerCount).map(id => `poker-supporter-${id}`));
        const trpgCampaign = loadSchoolTrpgCampaign();
        const unlockedTrpgRewards = new Set(trpgCampaign?.inventory || []);
        const unlockedTrpgEndings = new Set([
            ...(trpgCampaign?.endingHistory || []),
            ...(trpgCampaign?.endingId ? [trpgCampaign.endingId] : []),
        ]);

        const isDiscovered = (scope: MiniGameSectionId, key: string, visibleInGame = true) => {
            if (!visibleInGame) return false;
            if (isDebug) return true;
            const set = scope === 'DUNGEON' ? discoveredDungeon
                : scope === 'DUNGEON_2' ? discoveredDungeon2
                    : scope === 'SURVIVOR' ? discoveredSurvivor
                        : scope === 'POKER' ? discoveredPoker
                            : scope === 'KOCHO' ? discoveredKocho
                                : scope === 'PAPER_PLANE' ? discoveredPaperPlane
                                    : scope === 'STONE_GLOW' ? discoveredStoneGlow
                                        : scope === 'SCHOOL_TRPG' ? discoveredTrpg
                                            : scope === 'LEARNING_TCG' ? discoveredTcg
                                                : discoveredShogi;
            return set.has(key);
        };

        const dungeonItems = SCHOOL_DUNGEON_ITEM_CATALOG.map(item => {
            const entry = entryFromDungeonItem('dungeon', item);
            return { ...entry, unlocked: isDiscovered('DUNGEON', entry.discoveryKey || entry.id, entry.visibleInGame !== false) };
        });
        const dungeon2Items = SCHOOL_DUNGEON_2_ITEM_CATALOG.map(item => {
            const entry = entryFromDungeonItem('dungeon-2', item);
            return { ...entry, unlocked: isDiscovered('DUNGEON_2', entry.discoveryKey || entry.id, entry.visibleInGame !== false) };
        });
        const dungeon2Cards = SCHOOL_DUNGEON_2_CARD_CATALOG.map(card => ({
            id: `dungeon-2-card-${card.templateId}`,
            name: card.name,
            description: card.description,
            category: 'デッキカード',
            unlocked: isDiscovered('DUNGEON_2', `dungeon-2-card-${card.templateId}`),
            tracked: true,
            visual: { type: 'furai-card' as const, templateId: card.templateId },
            discoveryKey: `dungeon-2-card-${card.templateId}`,
            visibleInGame: true,
            metadata: [`POWER ${card.power}`],
        }));

        const survivorWeapons = SCHOOLYARD_WEAPON_CATALOG.map(weapon => ({
            id: `survivor-weapon-${weapon.id}`,
            name: weapon.name,
            description: `${weapon.desc} / ${weapon.evolvedName}: ${weapon.evolvedDesc}`,
            category: '武器',
            unlocked: isDiscovered('SURVIVOR', `survivor-weapon-${weapon.id}`),
            tracked: true,
            visual: { type: 'sprite' as const, value: `${weapon.sprite.template}|${weapon.sprite.color}` },
            discoveryKey: `survivor-weapon-${weapon.id}`,
            metadata: [`進化: ${weapon.evolvedName}`, `連携: ${weapon.synergy}`],
        }));
        const survivorPassives = SCHOOLYARD_PASSIVE_CATALOG.map(passive => ({
            id: `survivor-passive-${passive.id}`,
            name: passive.name,
            description: passive.desc,
            category: 'パッシブ',
            unlocked: isDiscovered('SURVIVOR', `survivor-passive-${passive.id}`),
            tracked: true,
            visual: { type: 'sprite' as const, value: `${passive.sprite.template}|${passive.sprite.color}` },
            discoveryKey: `survivor-passive-${passive.id}`,
        }));

        const pokerSupporters = SUPPORTERS_LIBRARY.map(supporter => {
            const tracked = EXPANDED_SUPPORTER_IDS.includes(supporter.id);
            return {
                id: `poker-supporter-${supporter.id}`,
                name: supporter.name,
                description: supporter.description,
                category: 'サポーター',
                unlocked: isDiscovered('POKER', `poker-supporter-${supporter.id}`) || (tracked && unlockedPokerIds.has(`poker-supporter-${supporter.id}`)),
                tracked: true,
                visual: { type: 'poker' as const, itemId: supporter.id, icon: supporter.icon },
                discoveryKey: `poker-supporter-${supporter.id}`,
                visibleInGame: true,
                metadata: [supporter.rarity, `価格 ${supporter.price}`],
            };
        });
        const pokerConsumables = CONSUMABLES_LIBRARY.map(item => ({
            id: `poker-consumable-${item.id}`,
            name: item.name,
            description: item.description,
            category: '消費アイテム',
            unlocked: isDiscovered('POKER', `poker-consumable-${item.id}`),
            tracked: true,
            visual: { type: 'poker' as const, itemId: item.id, icon: item.icon },
            discoveryKey: `poker-consumable-${item.id}`,
            visibleInGame: true,
            metadata: [item.type, `価格 ${item.price}`],
        }));
        const pokerPacks = PACK_LIBRARY.map(item => ({
            id: `poker-pack-${item.id}`,
            name: item.name,
            description: item.description,
            category: 'パック',
            unlocked: isDiscovered('POKER', `poker-pack-${item.id}`),
            tracked: true,
            visual: { type: 'poker' as const, itemId: item.id, icon: item.icon },
            discoveryKey: `poker-pack-${item.id}`,
            visibleInGame: true,
            metadata: [`${item.size}枚から${item.choose}枚`, `価格 ${item.price}`],
        }));
        const pokerVouchers = VOUCHERS_LIBRARY.map(item => ({
            id: `poker-voucher-${item.id}`,
            name: item.name,
            description: item.description,
            category: 'バウチャー',
            unlocked: isDiscovered('POKER', `poker-voucher-${item.id}`),
            tracked: true,
            visual: { type: 'poker' as const, itemId: item.id, icon: item.icon },
            discoveryKey: `poker-voucher-${item.id}`,
            visibleInGame: true,
            metadata: [`価格 ${item.price}`],
        }));

        const kochoCards = KOCHO_CARD_CATALOG.map(card => {
            const tracked = card.unlockable;
            return {
                id: `kocho-${card.id}`,
                name: card.name,
                description: card.description,
                category: card.type === 'ATTACK' ? '攻撃カード' : card.type === 'MOVE' ? '移動カード' : 'ユーティリティ',
                unlocked: isDiscovered('KOCHO', `kocho-${card.name}`) || (tracked && discoveredKocho.has(`kocho-${card.name}`)),
                tracked: true,
                visual: { type: 'kocho-card' as const, cardName: card.name },
                discoveryKey: `kocho-${card.name}`,
                visibleInGame: hasKochoCardActionArt(card.name),
                metadata: [`ダメージ ${card.damage}`, `CD ${card.cooldown}`, `EN ${card.energyCost}`],
            };
        });

        const paperParts = PAPER_PLANE_PART_CATALOG.map(part => ({
            id: `paper-part-${part.id}`,
            name: part.name,
            description: part.description || '説明なし',
            category: 'パーツ',
            unlocked: isDiscovered('PAPER_PLANE', `paper-part-${part.name.replace(/\+$/, '')}`),
            tracked: true,
            visual: { type: 'paper-part' as const, name: part.name },
            discoveryKey: `paper-part-${part.name.replace(/\+$/, '')}`,
            visibleInGame: Boolean(getPaperPlanePartSprite(part.name)),
            metadata: [`${part.type}`, `出力 ${part.basePower}`, `HP ${part.hp}`],
        }));
        const paperPilots = PAPER_PLANE_PILOT_CATALOG.map(pilot => ({
            id: `paper-pilot-${pilot.id}`,
            name: pilot.name,
            description: `${pilot.intrinsicTalent.name}: ${pilot.intrinsicTalent.description}`,
            category: 'パイロット',
            unlocked: isDiscovered('PAPER_PLANE', `paper-pilot-${pilot.id}`),
            tracked: true,
            visual: { type: 'image' as const, value: `sprites/paper-plane/pilots/${pilot.id}.webp` },
            discoveryKey: `paper-pilot-${pilot.id}`,
            visibleInGame: true,
        }));
        const paperShips = PAPER_PLANE_SHIP_CATALOG.map(ship => ({
            id: `paper-ship-${ship.id}`,
            name: ship.name,
            description: ship.description,
            category: '機体',
            unlocked: isDiscovered('PAPER_PLANE', `paper-ship-${ship.id}`),
            tracked: true,
            visual: { type: 'paper-ship' as const, id: ship.id },
            discoveryKey: `paper-ship-${ship.id}`,
            visibleInGame: Boolean(getPaperPlaneShipSprite(ship.id)),
            metadata: [`解禁ランク ${ship.unlockRank}`, `HP ${ship.baseHp}`],
        }));

        const stoneCards = STONE_GLOW_CARD_CATALOG.map(card => ({
            id: `stone-glow-${card.id}`,
            name: card.name,
            description: `ボーナス: ${card.bonus} / ${card.points}点`,
            category: `採掘カード Tier ${card.tier}`,
            unlocked: isDiscovered('STONE_GLOW', `stone-glow-${card.id}`),
            tracked: true,
            visual: { type: 'stone-card' as const, bonus: card.bonus, points: card.points, tier: card.tier },
            discoveryKey: `stone-glow-${card.id}`,
            visibleInGame: true,
            metadata: [`コスト ${Object.entries(card.cost).map(([color, amount]) => `${color}:${amount}`).join(' ')}`],
        }));

        const trpgRewards = SCHOOL_TRPG_REWARDS.map(reward => ({
            id: `school-trpg-reward-${reward.id}`,
            name: localizeTrpgCopy(reward.name, languageMode),
            description: `${localizeTrpgCopy(reward.description, languageMode)}\n${localizeTrpgCopy(reward.useCopy, languageMode)}`,
            category: '発見物',
            unlocked: isDebug || unlockedTrpgRewards.has(reward.id) || isDiscovered('SCHOOL_TRPG', `school-trpg-reward-${reward.id}`),
            tracked: true,
            visual: reward.artAsset ? { type: 'image' as const, value: reward.artAsset } : { type: 'none' as const },
            discoveryKey: `school-trpg-reward-${reward.id}`,
            visibleInGame: Boolean(reward.artAsset),
            metadata: [`効果 ${reward.effect.kind} +${reward.effect.amount}`],
        }));
        const trpgEndings = SCHOOL_TRPG_ENDINGS.map(ending => ({
            id: `school-trpg-ending-${ending.id}`,
            name: localizeTrpgCopy(ending.title, languageMode),
            description: localizeTrpgCopy(ending.body, languageMode),
            category: 'エンディング',
            unlocked: isDebug || unlockedTrpgEndings.has(ending.id) || isDiscovered('SCHOOL_TRPG', `school-trpg-ending-${ending.id}`),
            tracked: true,
            visual: ending.artAsset ? { type: 'image' as const, value: ending.artAsset } : { type: 'none' as const },
            discoveryKey: `school-trpg-ending-${ending.id}`,
            visibleInGame: Boolean(ending.artAsset),
            metadata: [localizeTrpgCopy(ending.subtitle, languageMode)],
        }));

        const learningTcgCards = PLACEMENT_TCG_CARDS.map(card => ({
            id: `learning-tcg-${card.id}`,
            name: card.name,
            description: languageMode === 'ENGLISH' ? card.rulesText.en : card.rulesText.jp,
            category: `${card.edition} / ${card.kind}`,
            unlocked: isDiscovered('LEARNING_TCG', `learning-tcg-${card.id}`),
            tracked: true,
            visual: { type: 'placement-card' as const, card },
            discoveryKey: `learning-tcg-${card.id}`,
            visibleInGame: true,
            metadata: [`TIER ${card.tier}`, `SP ${card.spCost}`],
        }));

        const shogiPieces = [
            ...STANDARD_PIECES.map(piece => ({
                id: `shogi-standard-${piece.kind}`,
                name: piece.name,
                description: piece.description,
                category: '標準駒',
                unlocked: isDiscovered('SHOGI', `shogi-standard-${piece.kind}`),
                tracked: true,
                visual: { type: 'shogi-piece' as const, glyph: piece.glyph },
                discoveryKey: `shogi-standard-${piece.kind}`,
                visibleInGame: true,
                metadata: [piece.promotion, piece.restriction],
            })),
            ...ADVANCED_PIECES.map(piece => ({
                id: `shogi-advanced-${piece.kind}`,
                name: piece.name,
                description: piece.description,
                category: `追加駒 STAGE ${piece.stage}`,
                unlocked: isDiscovered('SHOGI', `shogi-advanced-${piece.kind}`),
                tracked: true,
                visual: { type: 'shogi-piece' as const, glyph: piece.glyph },
                discoveryKey: `shogi-advanced-${piece.kind}`,
                visibleInGame: true,
                metadata: [piece.promotion, piece.restriction, ...(piece.special ? [piece.special] : [])],
            })),
        ];

        return [
            { id: 'DUNGEON', title: '風来の小学生シリーズ', caption: '小学生編の全アイテム', entries: dungeonItems },
            { id: 'DUNGEON_2', title: '風来の小学生シリーズ 2', caption: '高校編の全アイテム・カード', entries: [...dungeon2Items, ...dungeon2Cards] },
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
                            {trans('収集要素を持つミニゲームのマスター定義を一覧表示しています。ゲーム内で発見した情報は現在の進捗に反映されます。', languageMode)}
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
                {currentSection.entries.map(entry => {
                    const visibleInGame = entry.visibleInGame !== false;
                    const discovered = visibleInGame && entry.unlocked;
                    const canOpenDetails = discovered;
                    return (
                    <button
                        type="button"
                        key={entry.id}
                        disabled={!canOpenDetails}
                        onClick={canOpenDetails ? () => setSelectedEntry(entry) : undefined}
                        aria-label={discovered ? trans(entry.name, languageMode) : '???'}
                        className={`group relative flex min-h-[142px] flex-col items-center rounded-lg border p-3 text-center transition-all ${!discovered ? 'cursor-not-allowed border-slate-800 bg-black/65 opacity-55' : 'border-slate-600 bg-black/60 hover:-translate-y-0.5 hover:border-cyan-300'}`}
                    >
                        <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-lg border border-amber-400/60 bg-slate-900/90 p-1.5">
                            {discovered ? renderVisual(entry) : <span className="text-2xl font-black text-slate-300">?</span>}
                            {!discovered && <Lock size={15} className="absolute right-2 top-2 text-slate-300" />}
                        </div>
                        <span className={`line-clamp-2 w-full text-xs font-bold ${discovered ? 'text-amber-100' : 'text-slate-400'}`}>{discovered ? trans(entry.name, languageMode) : '???'}</span>
                        <span className="mt-1 line-clamp-1 w-full text-[9px] text-slate-500">{discovered ? trans(entry.category, languageMode) : '???'}</span>
                        <span className={`mt-2 rounded px-1.5 py-0.5 text-[9px] font-bold ${!visibleInGame ? 'bg-slate-800 text-slate-400' : discovered ? 'bg-emerald-900/70 text-emerald-200' : 'bg-slate-800 text-slate-400'}`}>
                            {!visibleInGame ? trans('未表示', languageMode) : discovered ? trans('解禁済み', languageMode) : trans('未発見', languageMode)}
                        </span>
                    </button>
                    );
                })}
            </div>

            {selectedEntry && selectedEntry.visibleInGame !== false && selectedEntry.unlocked && (
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

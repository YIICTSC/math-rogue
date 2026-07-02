
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { CARDS_LIBRARY, RELIC_LIBRARY, POTION_LIBRARY } from '../constants';
import { Card as ICard, LanguageMode } from '../types';
import Card from './Card';
import { BookOpen, Lock, ArrowLeft, Swords, Gem, FlaskConical, Skull, X, Music, StepBack, StepForward, Pause, Play, Square, Repeat, Heart, Users, Volume2, ChevronRight } from 'lucide-react';
import EnemyIllustration from './EnemyIllustration';
import PixelSprite from './PixelSprite';
import { storageService } from '../services/storageService';
import { audioService, type BgmThemeId } from '../services/audioService';
import { trans } from '../utils/textUtils';
import { assetUrl } from '../utils/assetPaths';
import { getCardIllustrationPaths } from '../utils/cardIllustration';
import { ENEMY_ILLUSTRATION_SIZE_CLASS } from '../constants/uiSizing';
import { PotionIcon, RelicIcon } from './ItemIcon';
import { getThemedEnemyDisplayName, type VisualThemeId } from '../data/visualThemes';
import { getEnemyLibraryByTheme } from '../data/enemyCatalogs';
import { getHumanoidEnemyVoiceProfile, type HumanoidEnemyVoiceAction } from '../data/humanoidEnemyVoiceLines';
import { MAGIC_CARDS } from '../data/magicCards';
import { getMagicCardArtUrl } from '../utils/cardArtPaths';
import { getDebugMagicEndingGalleryEntries, type MagicEndingGalleryEntry } from '../services/magicEndingService';

interface CompendiumScreenProps {
    unlockedCardNames: string[];
    onBack: () => void;
    languageMode: LanguageMode;
    isDebug?: boolean;
    visualTheme?: VisualThemeId;
}

type CompendiumEnemy = {
    name: string;
    description: string;
    tier: 1 | 2 | 3;
    collectionKey: string;
    enemyType: string;
    phase?: number;
};

const COMPENDIUM_ENEMY_THEME_OPTIONS: Array<{ id: VisualThemeId; label: string; caption: string }> = [
    { id: 'elementary', label: '小学生編', caption: 'School' },
    { id: 'high-school', label: '高校編', caption: 'High School' },
    { id: 'magic', label: 'マジック編', caption: 'Magic' },
];

const COMPENDIUM_ENEMY_VOICE_ACTIONS: HumanoidEnemyVoiceAction[] = ['spawn', 'attack', 'defense', 'skill', 'damage', 'defeat'];

const inferCompendiumEnemyType = (enemyName: string) => {
    if (enemyName.includes('校長')) return 'THE_HEART';
    if (
        enemyName.includes('先生') ||
        enemyName.includes('教頭') ||
        enemyName.includes('教育実習') ||
        enemyName.includes('顧問') ||
        enemyName.includes('委員長') ||
        enemyName.includes('会長') ||
        enemyName.includes('用務員') ||
        enemyName.includes('上級生') ||
        enemyName.includes('不良')
    ) {
        return 'TEACHER';
    }
    return 'GENERIC';
};

const getHighSchoolEnemyDescription = (enemy: CompendiumEnemy, displayName: string) => {
    if (enemy.enemyType === 'THE_HEART') {
        return `${displayName}。朝礼を三分で終わらせるという禁術を封印したまま、進路希望調査を武器にしてくる。`;
    }
    if (displayName.includes('風紀')) return `${displayName}。制服の乱れを見つける速度だけは光速級。こちらの心のシャツまできっちり入れ直してくる。`;
    if (displayName.includes('模試') || displayName.includes('答案') || displayName.includes('赤点') || displayName.includes('試験')) return `${displayName}。弱点欄に「ケアレスミス」と赤ペンで書き込んでくる。正解しても部分点の話を始めるのが厄介。`;
    if (displayName.includes('部') || displayName.includes('委員')) return `${displayName}。放課後の肩書きを戦闘力に変えた存在。会議は長いが、攻撃の結論だけは妙に早い。`;
    if (displayName.includes('進路') || displayName.includes('内申')) return `${displayName}。未来の話をするたびに防御力が上がる。夢を聞かれる前に倒したいタイプ。`;
    if (displayName.includes('購買') || displayName.includes('弁当') || displayName.includes('パン')) return `${displayName}。昼休みの争奪戦で鍛えられた怪物。残り一個の焼きそばパンを見る目をしている。`;
    if (displayName.includes('黒板') || displayName.includes('チョーク') || displayName.includes('赤ペン') || displayName.includes('参考書')) return `${displayName}。知識を振りかざすより、まず粉っぽい。近づくとノートの余白まで支配される。`;
    if (displayName.includes('ロッカー') || displayName.includes('階段') || displayName.includes('廊下') || displayName.includes('校門')) return `${displayName}。校舎のすき間に溜まった気配が形を持ったもの。通り道なのに、なぜか通してくれない。`;
    if (displayName.includes('スマホ') || displayName.includes('USB') || displayName.includes('コピー') || displayName.includes('カメラ')) return `${displayName}。便利さの裏側で育ったデジタル怪異。通知音ひとつで集中力を根こそぎ持っていく。`;
    if (displayName.includes('竜') || displayName.includes('覇王') || displayName.includes('女王') || displayName.includes('王')) return `${displayName}。名前の圧がすでに期末テスト三教科分。倒す前から反省文を書かされた気分になる。`;
    if (enemy.enemyType === 'TEACHER') return `${displayName}。注意、指導、再提出を三段コンボで放つ人型の圧。目が合うと姿勢だけ先に正される。`;
    if (enemy.tier === 1) return `${displayName}。高校生活の小さな不安が、妙に堂々と歩き出したもの。軽そうに見えて、地味に予定を狂わせる。`;
    if (enemy.tier === 2) return `${displayName}。放課後のざわめきをまとった中堅怪異。倒すと静かになるが、なぜかチャイムだけは鳴る。`;
    return `${displayName}。受験、部活、行事、寝不足が悪い方向に団結した強敵。青春の輝きより影のほうが濃い。`;
};

const getMagicEnemyDescription = (enemy: CompendiumEnemy, displayName: string) => {
    if (enemy.enemyType === 'THE_HEART') {
        return `${displayName}。校則を呪文に変える大魔法の使い手。詠唱は長いが、聞き終えるころには反省文が三枚増えている。`;
    }
    if (displayName.includes('星') || displayName.includes('彗星') || displayName.includes('星図')) return `${displayName}。星のまたたきを盗んでポケットに詰めている。倒すと夜空が少しだけ読みやすくなる。`;
    if (displayName.includes('月') || displayName.includes('月光') || displayName.includes('月蝕')) return `${displayName}。満月の日だけ強気になるロマン派の魔物。曇りの日はやや機嫌が悪い。`;
    if (displayName.includes('花') || displayName.includes('薔薇') || displayName.includes('茨') || displayName.includes('庭')) return `${displayName}。優雅に見えて根はかなりしつこい。花言葉はたぶん「再提出」。`;
    if (displayName.includes('火') || displayName.includes('炎')) return `${displayName}。情熱と火力の区別がついていない。黒板を焦がしても「演出」と言い張る。`;
    if (displayName.includes('影') || displayName.includes('闇') || displayName.includes('深淵')) return `${displayName}。暗がりに台詞を足して雰囲気を二倍にするタイプ。明るい場所でも少しだけ格好つけている。`;
    if (displayName.includes('時計') || displayName.includes('時') || displayName.includes('鐘')) return `${displayName}。時間割を勝手に組み替える迷惑な時術系。休み時間だけ短くするので評判は最悪。`;
    if (displayName.includes('風') || displayName.includes('旋風')) return `${displayName}。噂とプリントを同じ速度で飛ばしてくる。追い風のふりをした横風。`;
    if (displayName.includes('夢') || displayName.includes('悪夢')) return `${displayName}。寝不足の魔力を好む夢界の住人。勝つと少し眠くなるが、負けると宿題の夢を見る。`;
    if (displayName.includes('光') || displayName.includes('聖') || displayName.includes('晶')) return `${displayName}。まぶしさで正論を押し通すタイプ。清らかそうに見えて、目つぶし性能が高い。`;
    if (displayName.includes('魔導書') || displayName.includes('禁術') || displayName.includes('ルーン') || displayName.includes('図書')) return `${displayName}。ページをめくる音だけで威圧してくる知識系魔物。注釈が長い。`;
    if (displayName.includes('魔女') || displayName.includes('魔法') || displayName.includes('錬金') || displayName.includes('召喚')) return `${displayName}。実験成功率より自己演出を優先する魔法学園の強敵。煙が出ればだいたい満足する。`;
    if (enemy.enemyType === 'TEACHER') return `${displayName}。杖より指示棒が似合う人型の魔法使い。注意ひとつで黒板の文字まで整列する。`;
    if (enemy.tier === 1) return `${displayName}。初級魔法のこぼれ火から生まれた小さな厄介者。かわいい顔で机の上を異界にする。`;
    if (enemy.tier === 2) return `${displayName}。召喚陣の端で育った中堅魔物。名前を呼ぶと得意げに出てくるが、帰り方は知らない。`;
    return `${displayName}。星、呪文、寝不足が危険な配合で混ざった上級魔物。魔法陣より先に距離を取ったほうがいい。`;
};

const shuffleList = <T,>(items: T[]) => {
    const next = [...items];
    for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [next[i], next[j]] = [next[j], next[i]];
    }
    return next;
};

type CompendiumBgmLibraryId = 'mix' | 'elementary' | 'high-school' | 'magic-female' | 'magic-male' | 'minigame';

type CompendiumBgmTrack = {
    id: string;
    type: string;
    theme: BgmThemeId;
    library: Exclude<CompendiumBgmLibraryId, 'mix'>;
    title: string;
    subtitle: string;
};

const COMPENDIUM_MINIGAME_BGM_TRACKS = new Set([
    'school_psyche',
    'dungeon_gym',
    'dungeon_science',
    'dungeon_music',
    'dungeon_library',
    'dungeon_roof',
    'dungeon_boss',
    'kocho_setup',
    'kocho_battle',
    'kocho_boss',
    'poker_shop',
    'poker_play',
    'survivor_metal',
    'paper_plane_setup',
    'paper_plane_battle',
    'paper_plane_vacation',
]);

const CompendiumScreen: React.FC<CompendiumScreenProps> = ({ unlockedCardNames, onBack, languageMode, isDebug = false, visualTheme = 'elementary' }) => {
    const [activeTab, setActiveTab] = useState<'CARDS' | 'RELICS' | 'POTIONS' | 'ENEMIES' | 'ENDINGS'>('CARDS');
    const [unlockedRelics, setUnlockedRelics] = useState<string[]>([]);
    const [unlockedPotions, setUnlockedPotions] = useState<string[]>([]);
    const [defeatedEnemies, setDefeatedEnemies] = useState<string[]>([]);
    const [magicEndings, setMagicEndings] = useState<MagicEndingGalleryEntry[]>([]);
    const [enemyCompendiumTheme, setEnemyCompendiumTheme] = useState<VisualThemeId>(visualTheme);

    const [selectedItem, setSelectedItem] = useState<{
        type: 'CARD' | 'RELIC' | 'POTION' | 'ENEMY';
        data: any;
        unlocked: boolean;
    } | null>(null);
    const [fullscreenArtCard, setFullscreenArtCard] = useState<ICard | null>(null);
    const [selectedEnding, setSelectedEnding] = useState<MagicEndingGalleryEntry | null>(null);
    const [showBgmMode, setShowBgmMode] = useState(false);

    const longPressTimer = useRef<any>(null);
    const startPos = useRef({ x: 0, y: 0 });

    const handlePointerDown = (e: React.PointerEvent, type: 'CARD' | 'RELIC' | 'POTION' | 'ENEMY', data: any, unlocked: boolean) => {
        startPos.current = { x: e.clientX, y: e.clientY };
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
        longPressTimer.current = setTimeout(() => {
            handleItemClick(type, data, unlocked);
        }, 700);
    };

    const handlePointerUp = () => {
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        const dist = Math.hypot(e.clientX - startPos.current.x, e.clientY - startPos.current.y);
        if (dist > 10) {
            handlePointerUp();
        }
    };

    useEffect(() => {
        setUnlockedRelics(storageService.getUnlockedRelics());
        setUnlockedPotions(storageService.getUnlockedPotions());
        setDefeatedEnemies(storageService.getDefeatedEnemies());
        setMagicEndings(storageService.getMagicEndingGallery());
    }, []);

    useEffect(() => {
        setEnemyCompendiumTheme(visualTheme);
    }, [visualTheme]);

    const allCards = useMemo(() => {
        const cards = [
            ...Object.values(CARDS_LIBRARY),
            ...(visualTheme === 'magic' ? MAGIC_CARDS : []),
        ];
        return cards.sort((a, b) => {
            if (a.type !== b.type) return a.type.localeCompare(b.type);
            if (a.cost !== b.cost) return a.cost - b.cost;
            return a.name.localeCompare(b.name);
        });
    }, [visualTheme]);

    const allRelics = useMemo(() => Object.values(RELIC_LIBRARY), []);
    const allPotions = useMemo(() => Object.values(POTION_LIBRARY), []);
    const allEnemies = useMemo<CompendiumEnemy[]>(() => {
        return Object.values(getEnemyLibraryByTheme(enemyCompendiumTheme))
            .sort((a, b) => a.tier - b.tier)
            .map(enemy => ({
                ...enemy,
                collectionKey: enemy.name,
                enemyType: inferCompendiumEnemyType(enemy.name),
                phase: undefined,
            }));
    }, [enemyCompendiumTheme]);
    const getEnemyDisplayName = (enemy: CompendiumEnemy) => getThemedEnemyDisplayName(enemy, enemyCompendiumTheme);
    const getEnemyDescription = (enemy: CompendiumEnemy) => {
        if (languageMode === 'ENGLISH') return enemy.description;
        const displayName = getEnemyDisplayName(enemy);
        if (enemyCompendiumTheme === 'high-school') return getHighSchoolEnemyDescription(enemy, displayName);
        if (enemyCompendiumTheme === 'magic') return getMagicEnemyDescription(enemy, displayName);
        return enemy.description;
    };
    const displayEnemies = allEnemies;
    const unlockedCardsForShowcase = useMemo(() => {
        const visibleNames = isDebug ? allCards.map(card => card.name) : unlockedCardNames;
        const uniqueNames = Array.from(new Set(visibleNames));
        return uniqueNames
            .map(name => allCards.find(card => card.name === name))
            .filter((card): card is typeof allCards[number] => Boolean(card))
            .filter(card => !card.isSeed)
            .map((card, index) => ({ ...card, id: `compendium-showcase-${index}` }));
    }, [allCards, isDebug, unlockedCardNames]);
    const defeatedEnemySet = useMemo(() => {
        if (isDebug) {
            return new Set(allEnemies.map(enemy => enemy.collectionKey));
        }
        const knownNames = new Set(allEnemies.map(enemy => enemy.collectionKey));
        return new Set([
            ...defeatedEnemies.filter(name => knownNames.has(name)),
        ]);
    }, [allEnemies, defeatedEnemies, isDebug]);

    const totalCards = allCards.length;
    const currentLibraryUnlockedCount = isDebug
        ? totalCards
        : allCards.filter(c => unlockedCardNames.includes(c.name)).length;
    const percentage = Math.floor((currentLibraryUnlockedCount / totalCards) * 100);

    const totalRelics = allRelics.length;
    const unlockedRelicsCount = isDebug ? totalRelics : unlockedRelics.length;
    const relicsPercentage = Math.floor((unlockedRelicsCount / totalRelics) * 100);

    const totalPotions = allPotions.length;
    const unlockedPotionsCount = isDebug ? totalPotions : unlockedPotions.length;
    const potionsPercentage = Math.floor((unlockedPotionsCount / totalPotions) * 100);

    const totalEnemies = displayEnemies.length;
    const defeatedEnemiesCount = displayEnemies.filter(enemy => defeatedEnemySet.has(enemy.collectionKey) || defeatedEnemySet.has(enemy.name)).length;
    const enemiesPercentage = Math.floor((defeatedEnemiesCount / totalEnemies) * 100);

    const visibleMagicEndings = useMemo(
        () => isDebug ? getDebugMagicEndingGalleryEntries() : magicEndings,
        [isDebug, magicEndings]
    );
    const sortedMagicEndings = useMemo(
        () => [...visibleMagicEndings].sort((a, b) => b.unlockedAt - a.unlockedAt || a.heroName.localeCompare(b.heroName) || a.title.localeCompare(b.title)),
        [visibleMagicEndings]
    );

    const handleItemClick = (type: 'CARD' | 'RELIC' | 'POTION' | 'ENEMY', data: any, unlocked: boolean) => {
        if (type === 'ENEMY' && unlocked) {
            const enemy = data as CompendiumEnemy;
            const profile = getHumanoidEnemyVoiceProfile(enemyCompendiumTheme, enemy.name);
            if (profile) {
                const action = COMPENDIUM_ENEMY_VOICE_ACTIONS[Math.floor(Math.random() * COMPENDIUM_ENEMY_VOICE_ACTIONS.length)];
                audioService.playHumanoidEnemyVoice(enemyCompendiumTheme, enemy.name, action);
            } else {
                audioService.playSound('select');
            }
        }
        setSelectedItem({ type, data, unlocked });
    };

    const openBgmMode = () => {
        if (unlockedCardsForShowcase.length === 0) {
            audioService.playSound('wrong');
            return;
        }
        audioService.playSound('select');
        setShowBgmMode(true);
    };

    const closeBgmMode = () => {
        setShowBgmMode(false);
        audioService.playBGM('menu');
    };

    return (
        <div
            className="main-compendium-screen flex flex-col h-full w-full bg-gray-900 bg-cover bg-center text-white relative"
            style={{
                backgroundImage: `url(${assetUrl(visualTheme === 'magic'
                    ? 'sprites/backgrounds/learning-rogue/magic-compendium-library.webp'
                    : 'sprites/backgrounds/learning-rogue/compendium-library.webp')})`
            }}
        >
            <div className="absolute inset-0 bg-slate-950/62 pointer-events-none" />

            {/* Header */}
            <div className="compendium-header z-10 bg-black/80 border-b-4 border-amber-600 p-4 flex flex-col md:flex-row justify-between items-center shadow-xl gap-4 shrink-0">
                <div className="flex items-center">
                    <BookOpen size={32} className="text-amber-500 mr-3" />
                    <div>
                        <h2 className="text-2xl font-bold text-amber-100">{trans("図鑑", languageMode)}</h2>
                        {activeTab === 'CARDS' && <p className="text-xs text-gray-400">{trans("収集率", languageMode)}: {currentLibraryUnlockedCount}/{totalCards} ({percentage}%) {isDebug && "(DEBUG ON)"}</p>}
                        {activeTab === 'RELICS' && <p className="text-xs text-gray-400">{trans("収集率", languageMode)}: {unlockedRelicsCount}/{totalRelics} ({relicsPercentage}%) {isDebug && "(DEBUG ON)"}</p>}
                        {activeTab === 'POTIONS' && <p className="text-xs text-gray-400">{trans("収集率", languageMode)}: {unlockedPotionsCount}/{totalPotions} ({potionsPercentage}%) {isDebug && "(DEBUG ON)"}</p>}
                        {activeTab === 'ENEMIES' && <p className="text-xs text-gray-400">{trans("収集率", languageMode)}: {defeatedEnemiesCount}/{totalEnemies} ({enemiesPercentage}%) {isDebug && "(DEBUG ON)"}</p>}
                        {activeTab === 'ENDINGS' && <p className="text-xs text-gray-400">{trans("到達済み", languageMode)}: {sortedMagicEndings.length} {trans("件", languageMode)} {isDebug && "(DEBUG ON)"}</p>}
                    </div>
                </div>

                {/* Tabs */}
                <div className="compendium-tabs flex gap-2">
                    <button onClick={() => setActiveTab('CARDS')} className={`px-3 py-1 rounded text-sm font-bold flex items-center ${activeTab === 'CARDS' ? 'bg-amber-600 text-white' : 'bg-gray-700 text-gray-300'}`}>
                        <Swords size={14} className="mr-1" /> {trans("カード", languageMode)}
                    </button>
                    <button onClick={() => setActiveTab('RELICS')} className={`px-3 py-1 rounded text-sm font-bold flex items-center ${activeTab === 'RELICS' ? 'bg-amber-600 text-white' : 'bg-gray-700 text-gray-300'}`}>
                        <Gem size={14} className="mr-1" /> {trans("レリック", languageMode)}
                    </button>
                    <button onClick={() => setActiveTab('POTIONS')} className={`px-3 py-1 rounded text-sm font-bold flex items-center ${activeTab === 'POTIONS' ? 'bg-amber-600 text-white' : 'bg-gray-700 text-gray-300'}`}>
                        <FlaskConical size={14} className="mr-1" /> {trans("薬", languageMode)}
                    </button>
                    <button onClick={() => setActiveTab('ENEMIES')} className={`px-3 py-1 rounded text-sm font-bold flex items-center ${activeTab === 'ENEMIES' ? 'bg-amber-600 text-white' : 'bg-gray-700 text-gray-300'}`}>
                        <Skull size={14} className="mr-1" /> {trans("魔物", languageMode)}
                    </button>
                    <button onClick={() => setActiveTab('ENDINGS')} className={`px-3 py-1 rounded text-sm font-bold flex items-center ${activeTab === 'ENDINGS' ? 'bg-amber-600 text-white' : 'bg-gray-700 text-gray-300'}`}>
                        <Heart size={14} className="mr-1" /> {trans("エンディング", languageMode)}
                    </button>
                    <button
                        onClick={openBgmMode}
                        disabled={unlockedCardsForShowcase.length === 0}
                        className={`px-3 py-1 rounded text-sm font-bold flex items-center ${unlockedCardsForShowcase.length === 0 ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-cyan-700 text-white hover:bg-cyan-600'}`}
                    >
                        <Music size={14} className="mr-1" /> {trans("BGMモード", languageMode)}
                    </button>
                </div>

                <button
                    onClick={onBack}
                    className="compendium-back-button flex items-center bg-gray-700 hover:bg-gray-600 border border-gray-400 px-4 py-2 rounded text-white transition-colors"
                >
                    <ArrowLeft size={16} className="mr-2" /> {trans("戻る", languageMode)}
                </button>
            </div>

            {/* Content Area */}
            <div className="z-10 flex-grow overflow-y-auto p-4 md:p-8 custom-scrollbar texture-leather bg-amber-900/20">

                {activeTab === 'CARDS' && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4 justify-items-center">
                        {allCards.map((template, idx) => {
                            const isUnlocked = isDebug || visualTheme === 'magic' || unlockedCardNames.includes(template.name);
                            const cardInstance: ICard = { id: `compendium-${idx}`, ...template };

                            return (
                                <div key={idx} className="relative group cursor-pointer" onClick={() => handleItemClick('CARD', cardInstance, isUnlocked)}>
                                    {isUnlocked ? (
                                        <div className="transform hover:scale-105 transition-transform duration-200 scale-75 origin-top-left w-24 h-36">
                                            <Card card={cardInstance} onClick={() => handleItemClick('CARD', cardInstance, isUnlocked)} disabled={false} languageMode={languageMode} />
                                        </div>
                                    ) : (
                                        <div className="w-24 h-36 border-[3px] border-gray-700 bg-gray-800 rounded-lg flex flex-col items-center justify-center p-2 opacity-50 select-none grayscale">
                                            <Lock size={24} className="text-gray-500 mb-2" />
                                            <div className="text-xl text-gray-600 font-bold">?</div>
                                            <div className="text-[8px] text-gray-500 mt-2 text-center">{template.rarity}</div>
                                            <div className="text-[6px] text-gray-600 text-center">{template.type}</div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {activeTab === 'RELICS' && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                        {allRelics.map((relic, idx) => {
                            const isUnlocked = isDebug || unlockedRelics.includes(relic.id);
                            return (
                                <div
                                    key={idx}
                                    onClick={() => handleItemClick('RELIC', relic, isUnlocked)}
                                    onPointerDown={(e) => handlePointerDown(e, 'RELIC', relic, isUnlocked)}
                                    onPointerUp={handlePointerUp}
                                    onPointerMove={handlePointerMove}
                                    className={`bg-black/60 border ${isUnlocked ? 'border-gray-600 hover:border-yellow-500' : 'border-gray-800'} p-4 rounded flex flex-col items-center text-center cursor-pointer transition-colors aspect-square justify-center`}
                                >
                                    <div className={`w-12 h-12 bg-gray-800 rounded-full border border-yellow-600 flex items-center justify-center mb-2 p-1.5 ${!isUnlocked ? 'grayscale opacity-30' : ''}`}>
                                        <RelicIcon id={relic.id} alt={relic.name} />
                                    </div>
                                    <div className={`font-bold text-xs mb-1 truncate w-full ${isUnlocked ? 'text-yellow-200' : 'text-gray-600'}`}>{isUnlocked ? trans(relic.name, languageMode) : '???'}</div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {activeTab === 'POTIONS' && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                        {allPotions.map((potion, idx) => {
                            const isUnlocked = isDebug || unlockedPotions.includes(potion.templateId);
                            return (
                                <div
                                    key={idx}
                                    onClick={() => handleItemClick('POTION', potion, isUnlocked)}
                                    onPointerDown={(e) => handlePointerDown(e, 'POTION', potion, isUnlocked)}
                                    onPointerUp={handlePointerUp}
                                    onPointerMove={handlePointerMove}
                                    className={`bg-black/60 border ${isUnlocked ? 'border-gray-600 hover:border-white' : 'border-gray-800'} p-4 rounded flex flex-col items-center text-center cursor-pointer transition-colors aspect-square justify-center`}
                                >
                                    <div className={`w-12 h-12 bg-gray-800 rounded flex items-center justify-center mb-2 border border-white/30 p-1.5 ${!isUnlocked ? 'grayscale opacity-30' : ''}`}>
                                        <PotionIcon id={potion.templateId} alt={potion.name} />
                                    </div>
                                    <div className={`font-bold text-xs mb-1 truncate w-full ${isUnlocked ? 'text-white' : 'text-gray-600'}`}>{isUnlocked ? trans(potion.name, languageMode) : '???'}</div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {activeTab === 'ENEMIES' && (
                    <>
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                        {COMPENDIUM_ENEMY_THEME_OPTIONS.map(option => (
                            <button
                                key={option.id}
                                onClick={() => setEnemyCompendiumTheme(option.id)}
                                className={`px-3 py-1.5 rounded text-xs font-bold border transition-colors ${
                                    enemyCompendiumTheme === option.id
                                        ? option.id === 'elementary'
                                            ? 'bg-amber-600 border-amber-300 text-white'
                                            : option.id === 'high-school'
                                            ? 'bg-red-700 border-red-300 text-white'
                                            : 'bg-purple-700 border-purple-300 text-white'
                                        : 'bg-black/50 border-gray-700 text-gray-300 hover:border-gray-400'
                                }`}
                            >
                                <span>{trans(option.label, languageMode)}</span>
                                <span className="ml-2 text-[10px] opacity-75">{option.caption}</span>
                            </button>
                        ))}
                        <div className="text-xs text-gray-300">
                            {trans('表示テーマ', languageMode)}: {trans(COMPENDIUM_ENEMY_THEME_OPTIONS.find(option => option.id === enemyCompendiumTheme)?.label || '', languageMode)}
                        </div>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                        {displayEnemies.map((enemy, idx) => {
                            const isUnlocked = defeatedEnemySet.has(enemy.collectionKey) || defeatedEnemySet.has(enemy.name);
                            const enemyDisplayName = getEnemyDisplayName(enemy);
                            return (
                                <div
                                    key={idx}
                                    onClick={() => handleItemClick('ENEMY', enemy, isUnlocked)}
                                    onPointerDown={(e) => handlePointerDown(e, 'ENEMY', enemy, isUnlocked)}
                                    onPointerUp={handlePointerUp}
                                    onPointerMove={handlePointerMove}
                                    className={`bg-black/60 border ${isUnlocked ? 'border-red-900 hover:border-red-500' : 'border-gray-800'} p-2 rounded flex flex-col items-center text-center cursor-pointer transition-colors aspect-square justify-center relative overflow-hidden`}
                                >
                                    <div className={`${ENEMY_ILLUSTRATION_SIZE_CLASS.compendiumGrid} mb-2 bg-gray-900 rounded relative ${!isUnlocked ? 'brightness-0 opacity-20' : ''}`}>
                                        <EnemyIllustration
                                            name={enemy.name}
                                            seed={`${enemyCompendiumTheme}-${enemy.collectionKey}`}
                                            className="w-full h-full"
                                            size={16}
                                            visualTheme={enemyCompendiumTheme}
                                            enemyType={enemy.enemyType}
                                            phase={enemy.phase}
                                        />
                                    </div>
                                    <div className={`font-bold text-[10px] truncate w-full ${isUnlocked ? 'text-red-200' : 'text-gray-600'}`}>{isUnlocked ? trans(enemyDisplayName, languageMode) : '???'}</div>
                                    {!isUnlocked && <Lock size={16} className="absolute top-2 right-2 text-gray-600" />}
                                </div>
                            );
                        })}
                    </div>
                    </>
                )}

                {activeTab === 'ENDINGS' && (
                    sortedMagicEndings.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {sortedMagicEndings.map((ending) => (
                                <button
                                    key={ending.id}
                                    onClick={() => setSelectedEnding(ending)}
                                    className="group overflow-hidden rounded-lg border border-pink-300/35 bg-slate-950/80 text-left shadow-xl transition hover:border-pink-200 hover:bg-slate-900"
                                >
                                    <div className="relative aspect-[16/10] overflow-hidden bg-black">
                                        <img
                                            src={assetUrl(ending.imagePath)}
                                            alt={ending.title}
                                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                            onError={(event) => {
                                                if (!ending.fallbackImagePath || event.currentTarget.dataset.fallbackApplied === 'true') return;
                                                event.currentTarget.dataset.fallbackApplied = 'true';
                                                event.currentTarget.src = assetUrl(ending.fallbackImagePath);
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
                                        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2">
                                            <span className={`rounded px-2 py-1 text-[10px] font-black ${ending.kind === 'friendship' ? 'bg-emerald-400 text-slate-950' : ending.kind === 'double-romance' ? 'bg-rose-500 text-white' : 'bg-pink-300 text-slate-950'}`}>
                                                {trans(ending.rankLabel, languageMode)}
                                            </span>
                                            <span className="flex items-center rounded bg-black/70 px-2 py-1 text-[10px] font-bold text-white">
                                                <Volume2 size={12} className="mr-1" /> PLAY
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-3">
                                        <div className="text-[11px] font-bold text-pink-200">{trans(ending.heroName, languageMode)} / {trans(ending.metricLabel, languageMode)}</div>
                                        <div className="mt-1 line-clamp-2 text-sm font-black text-white">{trans(ending.title, languageMode)}</div>
                                        <div className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-300">{trans(ending.description, languageMode)}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="mx-auto flex min-h-[45vh] max-w-xl flex-col items-center justify-center rounded-lg border border-white/10 bg-black/55 p-8 text-center">
                            <Lock size={38} className="mb-4 text-slate-500" />
                            <h3 className="text-xl font-black text-white">{trans("マジック編エンディング未到達", languageMode)}</h3>
                            <p className="mt-3 text-sm leading-relaxed text-slate-300">
                                {trans("マジック編で恋愛エンド、修羅場エンド、友情エンドに到達すると、ここでイラストとボイス付きイベントを振り返れます。", languageMode)}
                            </p>
                        </div>
                    )
                )}
            </div>

            {/* Detail Modal */}
            {selectedItem && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedItem(null)}>
                    <div className="bg-gray-800 border-4 border-amber-600 w-full max-w-md p-6 rounded-lg shadow-2xl relative animate-in zoom-in duration-200 flex flex-col items-center text-center" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSelectedItem(null)} className="absolute top-2 right-2 text-gray-400 hover:text-white p-2">
                            <X size={24} />
                        </button>

                        <h3 className={`text-2xl font-bold mb-4 ${selectedItem.unlocked ? 'text-amber-200' : 'text-gray-500'}`}>
                            {selectedItem.unlocked
                                ? trans(selectedItem.type === 'ENEMY' ? getEnemyDisplayName(selectedItem.data) : selectedItem.data.name, languageMode)
                                : trans('未発見', languageMode)}
                        </h3>

                        <div
                            className={`flex items-center justify-center ${
                                selectedItem.type === 'CARD'
                                    ? 'mb-8 min-h-[260px] md:min-h-[360px]'
                                    : 'mb-6 min-h-[100px]'
                            }`}
                        >
                            {selectedItem.type === 'CARD' && (
                                selectedItem.unlocked ? (
                                    <div
                                        className="scale-125 md:scale-[1.7] cursor-zoom-in"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setFullscreenArtCard(selectedItem.data as ICard);
                                        }}
                                        title={trans("タッチでイラスト拡大", languageMode)}
                                    >
                                        <Card card={selectedItem.data} onClick={() => { }} disabled={false} languageMode={languageMode} />
                                    </div>
                                ) : <Lock size={64} className="text-gray-600" />
                            )}
                            {selectedItem.type === 'RELIC' && (
                                selectedItem.unlocked ? <div className="h-24 w-24 rounded-full border border-yellow-500/60 bg-gray-900 p-3 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]"><RelicIcon id={selectedItem.data.id} alt={selectedItem.data.name} /></div> : <Gem size={80} className="text-gray-700" />
                            )}
                            {selectedItem.type === 'POTION' && (
                                selectedItem.unlocked ? <div className="h-24 w-24 rounded border border-white/30 bg-gray-900 p-3 drop-shadow-[0_0_10px_rgba(255,255,255,0.35)]"><PotionIcon id={selectedItem.data.templateId} alt={selectedItem.data.name} /></div> : <FlaskConical size={80} className="text-gray-700" />
                            )}
                            {selectedItem.type === 'ENEMY' && (
                                <div className={`${ENEMY_ILLUSTRATION_SIZE_CLASS.compendiumDetail} bg-black rounded border border-gray-600 relative`}>
                                    {selectedItem.unlocked ? (
                                        <EnemyIllustration
                                            name={selectedItem.data.name}
                                            seed={`${enemyCompendiumTheme}-${selectedItem.data.collectionKey}`}
                                            className="w-full h-full"
                                            size={16}
                                            visualTheme={enemyCompendiumTheme}
                                            enemyType={selectedItem.data.enemyType}
                                            phase={selectedItem.data.phase}
                                        />
                                    ) : <div className="w-full h-full flex items-center justify-center text-gray-700 text-4xl">?</div>}
                                </div>
                            )}
                        </div>

                        <div className="bg-black/40 p-4 rounded border border-gray-600 w-full text-left">
                            {selectedItem.unlocked ? (
                                <>
                                    <p className="text-gray-300 text-sm leading-relaxed mb-2">
                                        {trans(selectedItem.type === 'ENEMY' ? getEnemyDescription(selectedItem.data) : selectedItem.data.description, languageMode)}
                                    </p>
                                    {selectedItem.type === 'ENEMY' && <p className="text-red-400 text-xs mt-2 font-mono">{trans("危険度", languageMode)}: Tier {selectedItem.data.tier}</p>}
                                    {selectedItem.type === 'RELIC' && <p className="text-yellow-600 text-xs mt-2 font-mono">{trans("レアリティ", languageMode)}: {selectedItem.data.rarity}</p>}
                                </>
                            ) : (
                                <p className="text-gray-500 text-sm italic">{trans("このアイテムはまだ発見されていません。", languageMode)}<br />{trans("冒険を進めて解禁しましょう。", languageMode)}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {fullscreenArtCard && (
                <FullscreenCardArtModal
                    card={fullscreenArtCard}
                    languageMode={languageMode}
                    onClose={() => setFullscreenArtCard(null)}
                />
            )}
            {selectedEnding && (
                <MagicEndingReplayModal
                    ending={selectedEnding}
                    languageMode={languageMode}
                    onClose={() => setSelectedEnding(null)}
                />
            )}
            {showBgmMode && (
                <CompendiumBgmModeModal
                    cards={unlockedCardsForShowcase}
                    languageMode={languageMode}
                    onClose={closeBgmMode}
                />
            )}
        </div>
    );
};

const FullscreenCardArtModal: React.FC<{ card: ICard; languageMode: LanguageMode; onClose: () => void }> = ({ card, languageMode, onClose }) => {
    const translated = trans(card.name, languageMode);
    const magicArtUrl = getMagicCardArtUrl(card);
    const imageCandidates = useMemo(
        () => getCardIllustrationPaths(card.id, translated, [card.name]),
        [card.id, card.name, translated]
    );
    const [imageIndex, setImageIndex] = useState(0);

    useEffect(() => {
        setImageIndex(0);
    }, [card.id, card.name, translated]);

    return (
        <div className="fixed inset-0 z-[70] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
                className="absolute top-3 right-3 text-white/80 hover:text-white p-2"
            >
                <X size={28} />
            </button>

            <div className="w-full h-full max-w-[96vw] max-h-[96vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                {magicArtUrl ? (
                    <img
                        src={magicArtUrl}
                        alt={translated}
                        className="max-w-full max-h-full object-contain rounded"
                    />
                ) : imageIndex < imageCandidates.length ? (
                    <img
                        src={imageCandidates[imageIndex]}
                        alt={translated}
                        className="max-w-full max-h-full object-contain rounded"
                        onError={() => setImageIndex((prev) => prev + 1)}
                    />
                ) : card.textureRef ? (
                    <div className="w-[70vmin] h-[70vmin] max-w-[90vw] max-h-[90vh]">
                        <PixelSprite seed={card.id} name={card.textureRef} className="w-full h-full" size={32} />
                    </div>
                ) : (
                    <div className="text-gray-400">{trans("イラストがありません", languageMode)}</div>
                )}
            </div>
        </div>
    );
};

const MagicEndingReplayModal: React.FC<{ ending: MagicEndingGalleryEntry; languageMode: LanguageMode; onClose: () => void }> = ({ ending, languageMode, onClose }) => {
    const [lineIndex, setLineIndex] = useState(-1);
    const currentLine = lineIndex < 0 ? ending.description : ending.lines[lineIndex];
    const isLast = lineIndex >= ending.lines.length - 1;

    useEffect(() => {
        audioService.stopMagicEventVoices();
        if (lineIndex < 0) return;
        const voiceLine = ending.voiceLines?.[lineIndex];
        if (voiceLine) {
            void audioService.playMagicEventVoice(voiceLine.heroId, voiceLine.lineId);
        }
        return () => audioService.stopMagicEventVoices();
    }, [ending, lineIndex]);

    useEffect(() => () => audioService.stopMagicEventVoices(), []);

    const handleClose = () => {
        audioService.stopMagicEventVoices();
        onClose();
    };

    const handleNext = () => {
        audioService.stopMagicEventVoices();
        if (isLast) {
            handleClose();
            return;
        }
        setLineIndex((current) => current + 1);
    };

    return (
        <div className="magic-romance-ending-screen fixed inset-0 z-[75] flex items-end justify-center overflow-hidden bg-black p-4 text-white sm:p-8" onClick={handleClose}>
            <img
                src={assetUrl(ending.imagePath)}
                alt={ending.title}
                className="magic-romance-ending-bg absolute inset-0 h-full w-full object-cover"
                onError={(event) => {
                    if (!ending.fallbackImagePath || event.currentTarget.dataset.fallbackApplied === 'true') return;
                    event.currentTarget.dataset.fallbackApplied = 'true';
                    event.currentTarget.src = assetUrl(ending.fallbackImagePath);
                }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/10" />
            <button
                onClick={(event) => {
                    event.stopPropagation();
                    handleClose();
                }}
                className="absolute right-3 top-3 z-20 rounded-full border border-white/20 bg-black/70 p-2.5 text-white/90 hover:text-white"
            >
                <X size={24} />
            </button>

            <div className="magic-romance-ending-layout relative z-10 mb-4 w-full max-w-5xl sm:mb-8" onClick={(event) => event.stopPropagation()}>
                <div className="magic-romance-ending-art hidden overflow-hidden rounded-xl border border-pink-200/45 bg-slate-950/60 shadow-2xl">
                    <img
                        src={assetUrl(ending.imagePath)}
                        alt={ending.title}
                        className="h-full w-full object-cover"
                        onError={(event) => {
                            if (!ending.fallbackImagePath || event.currentTarget.dataset.fallbackApplied === 'true') return;
                            event.currentTarget.dataset.fallbackApplied = 'true';
                            event.currentTarget.src = assetUrl(ending.fallbackImagePath);
                        }}
                    />
                </div>

                <div className="magic-romance-ending-panel w-full rounded-lg border border-pink-300/60 bg-slate-950/88 p-5 shadow-2xl backdrop-blur-sm sm:p-7">
                    <div className="magic-romance-ending-header mb-3 flex items-center gap-3 border-b border-pink-300/30 pb-3">
                        {ending.kind === 'friendship'
                            ? <Users className="shrink-0 text-emerald-300" size={22} />
                            : <Heart className="shrink-0 text-pink-300" fill="currentColor" size={22} />}
                        <div className="min-w-0">
                            <div className={`text-xs font-bold ${ending.kind === 'friendship' ? 'text-emerald-300' : 'text-pink-300'}`}>
                                {trans(ending.heroName, languageMode)} / {trans(ending.rankLabel, languageMode)} / {trans(ending.metricLabel, languageMode)}
                            </div>
                            <h1 className="magic-romance-ending-title text-xl font-black text-pink-100 sm:text-2xl">{trans(ending.title, languageMode)}</h1>
                        </div>
                    </div>
                    <p className="magic-romance-ending-text min-h-[7rem] whitespace-pre-wrap text-base leading-relaxed text-slate-100 sm:text-lg">
                        {trans(currentLine, languageMode)}
                    </p>
                    <button
                        onClick={handleNext}
                        className="magic-romance-ending-button mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-pink-400 px-5 py-3 font-black text-slate-950 transition-colors hover:bg-pink-300"
                    >
                        {trans(isLast ? '閉じる' : '次へ', languageMode)}
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

const CompendiumBgmModeModal: React.FC<{ cards: ICard[]; languageMode: LanguageMode; onClose: () => void }> = ({ cards, languageMode, onClose }) => {
    const sourceTracks = useMemo(() => [...audioService.getBgmTrackList()], []);
    const initialTheme = useMemo(() => audioService.getBgmTheme(), []);
    const libraries = useMemo(() => ([
        { id: 'mix' as const, label: 'ALL MIX', caption: '通常・高校・魔法男女' },
        { id: 'elementary' as const, label: '通常編', caption: 'Original' },
        { id: 'high-school' as const, label: '高校編', caption: 'High School' },
        { id: 'magic-female' as const, label: 'マジック編 女子', caption: 'Magic Girls' },
        { id: 'magic-male' as const, label: 'マジック編 男子', caption: 'Magic Boys' },
        { id: 'minigame' as const, label: 'ミニゲーム', caption: 'Mini Games' },
    ]), []);
    const allTracks = useMemo<CompendiumBgmTrack[]>(() => {
        const themes: Array<{ library: Exclude<CompendiumBgmLibraryId, 'mix'>; theme: BgmThemeId; subtitle: string }> = [
            { library: 'elementary', theme: 'elementary', subtitle: '通常編' },
            { library: 'high-school', theme: 'high-school', subtitle: '高校編' },
            { library: 'magic-female', theme: 'magic-female', subtitle: 'マジック編 女子' },
            { library: 'magic-male', theme: 'magic-male', subtitle: 'マジック編 男子' },
        ];
        const storyTracks = themes.flatMap(({ library, theme, subtitle }) =>
            sourceTracks.filter(track => !COMPENDIUM_MINIGAME_BGM_TRACKS.has(track)).map(track => ({
                id: `${theme}::${track}`,
                type: track,
                theme,
                library,
                title: track.replace(/_/g, ' ').toUpperCase(),
                subtitle,
            }))
        );
        const minigameTracks: CompendiumBgmTrack[] = sourceTracks
            .filter(track => COMPENDIUM_MINIGAME_BGM_TRACKS.has(track))
            .map(track => ({
                id: `elementary::${track}`,
                type: track,
                theme: 'elementary',
                library: 'minigame',
                title: track.replace(/_/g, ' ').toUpperCase(),
                subtitle: 'ミニゲーム',
            }));
        return [...storyTracks, ...minigameTracks];
    }, [sourceTracks]);
    const [libraryId, setLibraryId] = useState<CompendiumBgmLibraryId>('mix');
    const [screenView, setScreenView] = useState<'now-playing' | 'playlists'>('now-playing');
    const [playOrder, setPlayOrder] = useState<'sorted' | 'random'>(() => audioService.getBgmAdvanceMode());
    const selectedTracks = useMemo(
        () => allTracks.filter(track => libraryId === 'mix' ? track.library !== 'minigame' : track.library === libraryId),
        [allTracks, libraryId]
    );
    const [randomTrackOrder, setRandomTrackOrder] = useState<CompendiumBgmTrack[]>(() => shuffleList(allTracks));
    const bgmTracks = useMemo(() => {
        if (playOrder === 'sorted') {
            return [...selectedTracks].sort((a, b) => a.subtitle.localeCompare(b.subtitle) || a.title.localeCompare(b.title));
        }
        const selectedIds = new Set(selectedTracks.map(track => track.id));
        const ordered = randomTrackOrder.filter(track => selectedIds.has(track.id));
        return ordered.length > 0 ? ordered : shuffleList(selectedTracks);
    }, [playOrder, randomTrackOrder, selectedTracks]);
    const [cardIndex, setCardIndex] = useState(() => Math.floor(Math.random() * Math.max(1, cards.length)));
    const [trackIndex, setTrackIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const [isRepeat, setIsRepeat] = useState(false);
    const [imageIndex, setImageIndex] = useState(0);
    const [screenKey, setScreenKey] = useState(0);
    const activeCard = cards[cardIndex] || cards[0];
    const activeTrack = bgmTracks[trackIndex] || bgmTracks[0] || allTracks[0];
    const translated = activeCard ? trans(activeCard.name, languageMode) : '';
    const familiarActionSrc = activeCard?.familiarSummon
        ? assetUrl(`sprites/high-school/familiars-action/${activeCard.familiarSummon.imageIndex}.webp`)
        : null;
    const magicArtUrl = activeCard ? getMagicCardArtUrl(activeCard) : null;
    const imageCandidates = useMemo(
        () => activeCard ? getCardIllustrationPaths(activeCard.id, translated, [activeCard.name]) : [],
        [activeCard, translated]
    );

    useEffect(() => {
        setTrackIndex(0);
    }, [libraryId]);

    useEffect(() => {
        setImageIndex(0);
        setScreenKey(prev => prev + 1);
    }, [activeCard?.id]);

    useEffect(() => {
        setIsPlaying(true);
        setIsPaused(false);
    }, []);

    useEffect(() => {
        if (cards.length <= 1 || !isPlaying || isPaused) return;
        const interval = window.setInterval(() => {
            setCardIndex(prev => {
                let next = prev;
                while (next === prev && cards.length > 1) {
                    next = Math.floor(Math.random() * cards.length);
                }
                return next;
            });
        }, 5200);
        return () => window.clearInterval(interval);
    }, [cards.length, isPaused, isPlaying]);

    useEffect(() => {
        if (!activeTrack) return;
        audioService.setBgmAdvanceMode(playOrder, bgmTracks.map(track => track.id));
        if (!isPlaying) {
            audioService.stopBGM();
            return;
        }
        void audioService.switchThemeAndPlayBGM(activeTrack.theme, activeTrack.type as any, isRepeat);
        setIsPaused(false);
    }, [activeTrack, bgmTracks, isPlaying, isRepeat, playOrder]);

    useEffect(() => {
        const syncTrackLabel = () => {
            const current = audioService.getCurrentBgmType();
            const currentTheme = audioService.getBgmTheme();
            if (!current) return;
            const currentIndex = bgmTracks.findIndex(track => track.type === current && track.theme === currentTheme);
            if (currentIndex >= 0) setTrackIndex(prev => (prev === currentIndex ? prev : currentIndex));
        };
        syncTrackLabel();
        const interval = window.setInterval(syncTrackLabel, 300);
        return () => window.clearInterval(interval);
    }, [bgmTracks]);

    const handleClose = () => {
        audioService.setBgmAdvanceMode('random');
        void audioService.switchThemeAndPlayBGM(initialTheme, 'menu');
        onClose();
    };

    const handlePrevTrack = () => {
        if (bgmTracks.length === 0) return;
        setTrackIndex(prev => (prev - 1 + bgmTracks.length) % bgmTracks.length);
        setIsPlaying(true);
    };

    const handleNextTrack = () => {
        if (bgmTracks.length === 0) return;
        setTrackIndex(prev => (prev + 1) % bgmTracks.length);
        setIsPlaying(true);
    };

    const handlePlayPause = () => {
        if (!isPlaying) {
            setIsPlaying(true);
            if (activeTrack) void audioService.switchThemeAndPlayBGM(activeTrack.theme, activeTrack.type as any, isRepeat);
            setIsPaused(false);
            return;
        }
        if (isPaused) {
            audioService.resumeBGM();
            setIsPaused(false);
        } else {
            audioService.pauseBGM();
            setIsPaused(true);
        }
    };

    const handleStop = () => {
        audioService.stopBGM();
        setIsPlaying(false);
        setIsPaused(false);
    };

    const handleToggleRepeat = () => {
        const next = !isRepeat;
        setIsRepeat(next);
        if (isPlaying && activeTrack) {
            void audioService.switchThemeAndPlayBGM(activeTrack.theme, activeTrack.type as any, next);
        }
    };

    const handleTogglePlayOrder = () => {
        setPlayOrder(prev => {
            const nextMode = prev === 'sorted' ? 'random' : 'sorted';
            if (nextMode === 'random') {
                const currentId = activeTrack?.id;
                const shuffled = shuffleList(selectedTracks.filter(track => track.id !== currentId));
                setRandomTrackOrder(currentId && activeTrack ? [activeTrack, ...shuffled] : shuffled);
            }
            return nextMode;
        });
    };

    const handleNextCard = () => {
        if (cards.length <= 1) return;
        setCardIndex(prev => (prev + 1) % cards.length);
    };

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,#1f2937_0%,#030712_48%,#000_100%)] p-2 text-white">
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    handleClose();
                }}
                className="absolute right-3 top-3 z-20 rounded-full border border-white/15 bg-black/70 p-2.5 text-white/90 hover:text-white sm:right-4 sm:top-4 sm:p-3"
            >
                <X size={22} className="sm:h-[26px] sm:w-[26px]" />
            </button>

            <div className="flex h-full w-full items-center justify-center">
                <div className="compendium-ipod-shell mx-auto rounded-[38px] border border-white/80 bg-gradient-to-b from-zinc-100 to-zinc-300 p-4 text-slate-950 shadow-[0_34px_90px_rgba(0,0,0,0.65),inset_0_2px_8px_rgba(255,255,255,0.95)]">
                    <div className="compendium-ipod-header mb-2 flex items-center justify-between px-2 text-[9px] font-black tracking-[0.2em] text-zinc-500">
                        <span>LEARNING ROGUE</span>
                        <span>MUSIC MODE</span>
                    </div>
                    <div className="compendium-ipod-screen relative overflow-hidden rounded-[16px] border-[4px] border-zinc-800 bg-black shadow-inner">
                        {screenView === 'playlists' ? (
                            <div className="flex h-full min-h-0 flex-col bg-gradient-to-b from-slate-100 to-slate-300 text-slate-950">
                                <div className="flex items-center justify-between border-b border-slate-400/70 bg-gradient-to-b from-white to-slate-300 px-3 py-2 text-[11px] font-black">
                                    <span>PLAYLISTS</span>
                                    <span>{selectedTracks.length} SONGS</span>
                                </div>
                                <div className="min-h-0 flex-1 overflow-y-auto p-2 custom-scrollbar">
                                    {libraries.map((library, index) => (
                                        <button
                                            key={library.id}
                                            onClick={() => {
                                                setLibraryId(library.id);
                                                setScreenView('now-playing');
                                                setIsPlaying(true);
                                            }}
                                            className={`mb-1 flex w-full items-center justify-between rounded-md border px-3 py-2 text-left ${
                                                libraryId === library.id
                                                    ? 'border-slate-800 bg-slate-800 text-white'
                                                    : 'border-slate-300 bg-white/75 text-slate-800 hover:bg-white'
                                            }`}
                                        >
                                            <span>
                                                <span className="mr-2 text-[10px] opacity-50">{String(index + 1).padStart(2, '0')}</span>
                                                <span className="text-xs font-black">{trans(library.label, languageMode)}</span>
                                            </span>
                                            <span className="text-[10px] opacity-65">{trans(library.caption, languageMode)} ›</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <>
                        <div className="absolute left-3 top-2 z-10 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-bold text-lime-100">
                            {isPlaying && !isPaused ? 'PLAY' : isPaused ? 'PAUSE' : 'STOP'}
                        </div>
                        <div className="absolute right-3 top-2 z-10 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-bold text-white/80">
                            {trans(activeTrack?.subtitle || '', languageMode)}
                        </div>
                        <div key={screenKey} className="compendium-ipod-art flex items-center justify-center bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.9),#020617)] animate-in fade-in zoom-in-95 duration-700">
                            {activeCard && familiarActionSrc ? (
                                <img
                                    src={familiarActionSrc}
                                    alt={activeCard.familiarSummon?.name || translated}
                                    className="h-full w-full object-contain drop-shadow-[0_0_18px_rgba(244,114,182,0.8)]"
                                />
                            ) : activeCard && magicArtUrl ? (
                                <img src={magicArtUrl} alt={translated} className="h-full w-full object-contain" />
                            ) : activeCard && imageIndex < imageCandidates.length ? (
                                <img
                                    src={imageCandidates[imageIndex]}
                                    alt={translated}
                                    className="h-full w-full object-contain"
                                    onError={() => setImageIndex(prev => prev + 1)}
                                />
                            ) : activeCard ? (
                                <div className="h-[78%] w-[78%]">
                                    <PixelSprite seed={activeCard.id} name={activeCard.textureRef || 'SWORD'} className="h-full w-full" size={32} />
                                </div>
                            ) : (
                                <div className="text-sm text-white/60">NO CARD</div>
                            )}
                        </div>
                        <div className="border-t border-white/10 bg-slate-950/95 p-3">
                            <div className="truncate text-sm font-black text-white">{activeTrack?.title || 'NO TRACK'}</div>
                            <div className="mt-0.5 flex items-center justify-between gap-2 text-[10px] text-slate-300">
                                <span className="truncate">{translated || 'No Card'}</span>
                                <span className="shrink-0">{trackIndex + 1}/{bgmTracks.length}</span>
                            </div>
                            <div className="mt-0.5 line-clamp-2 text-[8px] leading-[11px] text-slate-400">
                                {activeCard ? trans(activeCard.description, languageMode) : ''}
                            </div>
                        </div>
                            </>
                        )}
                    </div>

                    <div className="compendium-ipod-wheel relative mx-auto mt-3 grid place-items-center rounded-full bg-gradient-to-b from-zinc-50 to-zinc-300 shadow-[inset_0_8px_18px_rgba(255,255,255,0.9),inset_0_-10px_18px_rgba(0,0,0,0.18)]">
                        <button onClick={() => setScreenView(prev => prev === 'now-playing' ? 'playlists' : 'now-playing')} className="self-start pt-4 text-[10px] font-black tracking-[0.2em] text-zinc-500 hover:text-zinc-900">
                            {screenView === 'playlists' ? 'NOW' : 'MENU'}
                        </button>
                        <button onClick={handlePrevTrack} className="absolute mr-36 text-zinc-500 hover:text-zinc-950 sm:mr-44">
                            <StepBack size={30} />
                        </button>
                        <button onClick={handleNextTrack} className="absolute ml-36 text-zinc-500 hover:text-zinc-950 sm:ml-44">
                            <StepForward size={30} />
                        </button>
                        <button onClick={handleNextCard} className="self-end pb-5 text-[11px] font-black tracking-[0.2em] text-zinc-500 hover:text-zinc-900">
                            CARD
                        </button>
                        <button
                            onClick={handlePlayPause}
                            className="absolute grid h-24 w-24 place-items-center rounded-full bg-gradient-to-b from-zinc-200 to-zinc-50 text-zinc-700 shadow-[inset_0_4px_10px_rgba(0,0,0,0.12),0_2px_8px_rgba(255,255,255,0.8)] hover:text-zinc-950"
                        >
                            {isPlaying && !isPaused ? <Pause size={34} /> : <Play size={34} />}
                        </button>
                    </div>
                    <div className="compendium-ipod-secondary-controls mt-2 flex justify-center gap-2">
                        <button onClick={handleStop} className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-black text-white hover:bg-zinc-700">
                            <Square size={13} className="mr-1 inline" /> STOP
                        </button>
                        <button onClick={handleToggleRepeat} className={`rounded-full px-4 py-2 text-xs font-black ${isRepeat ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-900 text-white hover:bg-zinc-700'}`}>
                            <Repeat size={13} className="mr-1 inline" /> LOOP
                        </button>
                    </div>
                </div>

                <div className="hidden">
                    <div className="mb-5">
                        <div className="text-xs font-black tracking-[0.4em] text-cyan-200">COMPENDIUM BGM</div>
                        <h3 className="mt-2 text-3xl font-black text-white sm:text-4xl">{activeTrack?.title}</h3>
                        <p className="mt-2 text-sm text-slate-300">
                            {trans(activeTrack?.subtitle || '', languageMode)} / {trackIndex + 1} of {bgmTracks.length} / cards {cards.length}
                        </p>
                    </div>

                    <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {libraries.map(library => (
                            <button
                                key={library.id}
                                onClick={() => setLibraryId(library.id)}
                                className={`rounded-2xl border p-3 text-left transition ${
                                    libraryId === library.id
                                        ? 'border-cyan-300 bg-cyan-300/20 text-cyan-50 shadow-[0_0_18px_rgba(34,211,238,0.25)]'
                                        : 'border-white/10 bg-black/20 text-slate-300 hover:bg-white/10'
                                }`}
                            >
                                <div className="text-sm font-black">{trans(library.label, languageMode)}</div>
                                <div className="mt-1 text-[10px] text-slate-400">{trans(library.caption, languageMode)}</div>
                            </button>
                        ))}
                    </div>

                    <div className="max-h-[38vh] overflow-y-auto rounded-2xl border border-white/10 bg-black/25 p-2 custom-scrollbar">
                        {bgmTracks.slice(0, 80).map((track, index) => (
                            <button
                                key={track.id}
                                onClick={() => {
                                    setTrackIndex(index);
                                    setIsPlaying(true);
                                }}
                                className={`mb-1 flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm ${
                                    index === trackIndex ? 'bg-white text-slate-950' : 'text-slate-200 hover:bg-white/10'
                                }`}
                            >
                                <span className="truncate font-bold">{track.title}</span>
                                <span className="ml-3 shrink-0 text-[10px] opacity-70">{trans(track.subtitle, languageMode)}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompendiumScreen;

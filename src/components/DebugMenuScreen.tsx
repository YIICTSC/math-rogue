
import { CARDS_LIBRARY, RELIC_LIBRARY, POTION_LIBRARY } from '../constants';
import { GAME_STORIES } from '../data/stories';
import { FLAVOR_TEXTS, ENEMY_NAMES } from '../services/geminiService';
import { AttackEffectKey, StatusEffectKey, Card as ICard, Relic, Potion, CardType, TargetType, LanguageMode, GameScreen, GameMode, MiniGameDebugPreview } from '../types';
import Card from './Card';
import AttackEffectSprite from './AttackEffectSprite';
import StatusEffectSprite from './StatusEffectSprite';
import EnemyIllustration from './EnemyIllustration';
import { ArrowRight, Trash2, Plus, Gem, FlaskConical, Swords, Shield, Zap, Search, Beaker, RotateCcw, Skull, Clock, History, Languages, FileText, BookOpen, MessageSquare, HelpCircle, AlertCircle, Copy, Check, X, Volume2, Sparkles, Monitor } from 'lucide-react';
import { createHolographicCard, synthesizeCards } from '../utils/cardUtils';
import { storageService, type UiPreviewCheckTarget, type UiPreviewChecklist } from '../services/storageService';
import { audioService } from '../services/audioService';
import { trans } from '../utils/textUtils';
import { ATTACK_EFFECT_LIST } from '../data/attackEffects';
import { STATUS_EFFECT_LIST } from '../data/statusEffects';
import { HIGH_SCHOOL_EVENT_THEMES, MAGIC_EVENT_THEMES, HIGH_SCHOOL_HUMANOID_ENEMY_VARIANTS, MAGIC_HUMANOID_ENEMY_VARIANTS, type HighSchoolEnemyAction, type VisualThemeId } from '../data/visualThemes';
import { getEnemyLibraryByTheme } from '../data/enemyCatalogs';
import { HUMANOID_ENEMY_VOICE_PROFILES, type HumanoidEnemyVoiceGender, type HumanoidEnemyVoiceProfile } from '../data/humanoidEnemyVoiceLines';
import { MAGIC_HEROES, MAGIC_MALE_PROTAGONISTS } from '../data/magicHeroes';
import { getMagicRomanceDialogue, getMagicRomanceEndingText, type MagicRomanceEndingRank } from '../data/magicRomanceDialogue';
import { getMagicRomanceVoiceLines } from '../services/magicRomanceEventService';
import { getMagicEndingVoiceLine } from '../services/magicEndingService';
import { MAGIC_ART_CONSISTENCY_TARGETS } from '../data/magicArtConsistencyTargets';
import { assetUrl } from '../utils/assetPaths';
import { UI_PREVIEW_GROUPS, UI_PREVIEW_SCREENS } from '../data/uiPreviewScreens';
import { getDebugProblemUnitGroups } from './ProblemChallengeScreen';
import { SUBJECT_DATA, type GeneralProblem } from '../data/subjectData';
import { ELEMENTARY_EVENT_TITLES } from '../services/eventService';
import { HIGH_SCHOOL_SUPPORTER_NPC_EVENTS, type SupporterNpcReward } from '../data/supporterNpcEvents';
import { DODOMEDESU_EVENT_STAGES } from '../data/dodomedesuBoss';
import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';

interface DebugMenuScreenProps {
    onStart: (deck: ICard[], relics: Relic[], potions: Potion[]) => void;
    onStartAct3Boss: (deck: ICard[], relics: Relic[], potions: Potion[]) => void;
    onStartMagicEventSimulation: () => void;
    onStartUiPreview: (screen: GameScreen, miniGameOutcome?: MiniGameDebugPreview) => void;
    onStartProblemUiPreview: (mode: GameMode, modePool?: string[]) => void;
    onStartEventUiPreview: (theme: VisualThemeId, title: string) => void;
    onStartCrowdfundingBoss: (boss: 'AZUKI' | 'DODOMEDESU') => void;
    onBack: () => void;
    onTimeUpdate: (newDailySeconds: number) => void;
    onAddClearCount: () => void;
    onBoostMathCorrect: () => void;
    clearCount: number;
    totalMathCorrect: number;
    nextMiniGameThreshold: number | null;
    languageMode: LanguageMode;
    focusedUiPreviewScreenId?: string;
    focusedSupporterNpcEventTitle?: string;
}

// 翻訳デバッグ用にイベントデータのサンプルを定義 (eventService.tsの内容を網羅)
const EVENT_SAMPLES = [
    { title: "怪しい薬売り", description: "路地裏で男が声をかけてきた。「とびきりの薬, あるよ」", options: [{ label: "買う", text: "20G支払って試す", result: "怪しい薬を手に入れた！" }, { label: "無視", text: "何もせず立ち去る", result: "怪しい男を無視して先へ進んだ。" }] },
    { title: "踊り場の鏡", description: "大きな鏡がある。映っている自分と目が合った。", options: [{ label: "見つめる", text: "じっと見つめる...", result: "鏡の中の自分が何かを手渡してきた。" }, { label: "割る", text: "鏡を叩き割る！", result: "破片が飛び散った！呪い「骨折」を入手。" }] },
    { title: "呪われた書物", description: "古びた祭壇に一冊の本が置かれている。不吉な気配がする。", options: [{ label: "読む", text: "勇気を出して読む", result: "ページをめくると激痛が走った！(HP-10) レリックを入手。" }, { label: "立ち去る", text: "危険を避ける", result: "危険を避けて立ち去った。" }] },
    { title: "伝説の給食", description: "今日は揚げパンの日だ！しかし、最後に一つだけ余っている。クラスメートとジャンケンで勝負だ。", options: [{ label: "グー", text: "力強く出す！", result: "勝った！揚げパンをゲット！" }, { label: "パー", text: "大きく広げる！", result: "お礼に50Gもらった。" }, { label: "チョキ", text: "鋭く出す！", result: "指を突き指した。(HP-5)" }] },
    { title: "校庭の野良犬", description: "授業中, 校庭に野良犬が迷い込んできた！首輪はなく、お腹を空かせているようだ。", options: [{ label: "なでる", text: "優しく近づく", result: "犬は嬉しそうに尻尾を振って去っていった。心が癒やされた。" }, { label: "餌をやる", text: "何かあげる", result: "パンを買ってあげた。お礼に「犬のフン」を置いていった。" }] },
    { title: "謎の転校生", description: "「ねえ, 君のそのカード、僕のと交換しない？」見たことのないカードを持っている。", options: [{ label: "交換", text: "ランダムに交換する", result: "カードが変化した！" }, { label: "断る", text: "自分のカードが大事", result: "断った。転校生はつまらなそうに去った。" }] },
    { title: "席替え", description: "今日は席替えの日だ。窓際の一番後ろになれるか...？それとも最前列か。", options: [{ label: "くじを引く", text: "手札(デッキ)が変わる予感...", result: "席替えの結果、付き合う友達(デッキ)が変わった！" }, { label: "祈る", text: "今の席を維持したい...", result: "なんとか今の席をキープできた。安心してHPが5回復した。" }] },
    { question: "避難訓練", description: "ジリリリリ！非常ベルが鳴り響く。「お・か・し」を守って避難しよう。", options: [{ label: "走る", text: "カードを1枚削除(逃げる)", result: "一目散に逃げ出した！不要なカードを置いてきた。" }, { label: "隠れる", text: "HP回復", result: "机の下に隠れてやり過ごした。HPが15回復した。" }] },
    { title: "プール開き", description: "待ちに待ったプール開きだ！しかし水は冷たそうだ。", options: [{ label: "泳ぐ", text: "全回復するが、風邪を引くかも", result: "最高に気持ちいい！HP全回復！...しかし風邪を引いてしまった。" }, { label: "見学", text: "カードを1枚強化", result: "プールサイドでイメトレをした。カードが強化された！" }] },
    { title: "修学旅行の積立金", description: "集金袋を拾った。中にはお金が入っている。", options: [{ label: "ネコババ", text: "150G入手。呪い「後悔」を得る。", result: "150Gを手に入れた！しかし良心が痛む...呪い「後悔」を入手。" }, { label: "届ける", text: "職員室に届ける", result: "正直者は報われる。先生から「図書カード」をもらった！" }] },
    { title: "魔の掃除時間", description: "廊下のワックスがけの時間だ。ツルツル滑る床は危険だが、滑れば速く移動できるかも？", options: [{ label: "滑る", text: "カード強化。HP-5。", result: "スライディング！(HP-5) カードの扱いが上手くなった！" }, { label: "磨く", text: "カード1枚削除。", result: "心を込めて磨いたら、心が洗われた。" }] },
    { title: "運命のテスト返却", description: "今日は算数のテストが返却される日だ。自信はあるか？", options: [{ label: "自信あり", text: "確率で100GかHP-10。", result: "100点満点だ！お祝いに100Gをもらった！" }, { label: "隠す", text: "呪い「恥」を得る。HP20回復。", result: "親に見つからないように隠した。安心したが、良心が痛む...呪い「恥」を入手。" }] },
    { title: "放送室のジャック", description: "放送室に誰もいない。マイクの電源が入っている。イタズラするチャンス？", options: [{ label: "歌う", text: "最大HP+4。", result: "生徒たちに大ウケだ！人気者になった。最大HP+4。" }, { label: "告白", text: "呪い「後悔」を得る。HP回復。", result: "校長先生の名前を叫んでしまった。呪い「後悔」を入手。" }] },
    { title: "理科室の人体模型", description: "夜の理科室。人体模型が動いている気がする。「心臓ヲ...クレ...」と聞こえた。", options: [{ label: "あげる", text: "HP-10。レリック「保健室の飴」入手。", result: "自分の血を分け与えた(HP-10)お礼に「保健室の飴(レリック)」を貰った。" }, { label: "逃げる", text: "カード1枚削除。", action: () => { }, result: "なんとか逃げ切った。怖かった...恐怖でカードを忘れてしまった。" }] },
    { title: "図書室の静寂", description: "放課後の図書室はとても静かだ。心地よい眠気が襲ってくる...", options: [{ label: "寝る", text: "HP20回復。", result: "ぐっすり眠れた。HPが20回復した。" }, { label: "勉強", text: "「先読み」カード入手。", result: "集中して勉強した。「先読み」のカードを習得した。" }] },
];

const HIGH_SCHOOL_HUMANOID_ACTIONS: { key: HighSchoolEnemyAction; label: string; folder: string }[] = [
    { key: 'idle', label: 'IDLE', folder: 'humanoid-enemies' },
    { key: 'attack', label: 'ATTACK', folder: 'humanoid-enemies-attack' },
    { key: 'skill', label: 'SKILL', folder: 'humanoid-enemies-skill' },
];

const DEBUG_PROBLEM_UNIT_GROUPS = getDebugProblemUnitGroups();
type ProblemDebugLevel = 'ALL' | 'LOWER' | 'UPPER';

const DYNAMIC_MATH_DEBUG_META: Partial<Record<GameMode, { range: string; examples: Array<{ question: string; answer: string; options: string[] }> }>> = {
    [GameMode.ADD_1DIGIT]: {
        range: '1桁 + 1桁、繰り上がりなし。a=1〜8、b=1〜(9-a)。',
        examples: [
            { question: '1 + 1 = ?', answer: '2', options: ['2', '1', '3', '4'] },
            { question: '4 + 5 = ?', answer: '9', options: ['9', '8', '10', '7'] },
        ],
    },
    [GameMode.ADD_1DIGIT_CARRY]: {
        range: '1桁 + 1桁、繰り上がりあり。a=1〜9、bは10-a以上〜9。',
        examples: [
            { question: '7 + 5 = ?', answer: '12', options: ['12', '11', '13', '10'] },
            { question: '9 + 8 = ?', answer: '17', options: ['17', '16', '18', '15'] },
        ],
    },
    [GameMode.SUB_1DIGIT]: {
        range: '1桁 - 1桁、繰り下がりなし。a=1〜9、b=1〜a。',
        examples: [
            { question: '9 - 4 = ?', answer: '5', options: ['5', '4', '6', '3'] },
            { question: '6 - 6 = ?', answer: '0', options: ['0', '1', '2', '3'] },
        ],
    },
    [GameMode.SUB_1DIGIT_BORROW]: {
        range: '繰り下がりあり。答え=1〜9、b=1〜9、a=答え+b。aが10未満なら補正。',
        examples: [
            { question: '13 - 5 = ?', answer: '8', options: ['8', '7', '9', '6'] },
            { question: '17 - 9 = ?', answer: '8', options: ['8', '9', '7', '6'] },
        ],
    },
    [GameMode.ADDITION]: {
        range: '2桁 + 2桁。a=10〜49、b=10〜49。',
        examples: [
            { question: '12 + 34 = ?', answer: '46', options: ['46', '45', '47', '41'] },
            { question: '49 + 49 = ?', answer: '98', options: ['98', '97', '99', '93'] },
        ],
    },
    [GameMode.SUBTRACTION]: {
        range: '2桁 - 1〜2桁。a=20〜69、b=5〜a-6。',
        examples: [
            { question: '20 - 5 = ?', answer: '15', options: ['15', '14', '16', '10'] },
            { question: '69 - 58 = ?', answer: '11', options: ['11', '10', '12', '9'] },
        ],
    },
    [GameMode.MULTIPLICATION]: {
        range: 'かけ算九九。1×1〜9×9。',
        examples: [
            { question: '1 × 1 = ?', answer: '1', options: ['1', '2', '3', '4'] },
            { question: '9 × 9 = ?', answer: '81', options: ['81', '80', '82', '72'] },
        ],
    },
    [GameMode.DIVISION]: {
        range: '九九の逆算。割る数=2〜9、答え=1〜9、割られる数=割る数×答え。',
        examples: [
            { question: '18 ÷ 2 = ?', answer: '9', options: ['9', '8', '10', '7'] },
            { question: '72 ÷ 8 = ?', answer: '9', options: ['9', '8', '7', '6'] },
        ],
    },
    [GameMode.MIXED]: {
        range: '2桁たし算、2桁ひき算、九九、わり算からランダム。',
        examples: [
            { question: '23 + 18 = ?', answer: '41', options: ['41', '40', '42', '39'] },
            { question: '8 × 7 = ?', answer: '56', options: ['56', '54', '63', '48'] },
        ],
    },
};

type DebugProblemUnit = ReturnType<typeof getDebugProblemUnitGroups>[number]['units'][number];

const getProblemDebugGradeLabel = (unit: Pick<DebugProblemUnit, 'name' | 'gradeLabel'> | string): string => {
    if (typeof unit !== 'string') return unit.gradeLabel;
    const unitName = unit;
    const lowerMatch = unitName.match(/(小\d|中\d)/);
    if (lowerMatch) return lowerMatch[1];
    const gradeMatch = unitName.match(/小学(\d)年|中学(\d)年/);
    if (gradeMatch) return gradeMatch[1] ? `小${gradeMatch[1]}` : `中${gradeMatch[2]}`;
    return '高校以上';
};

const getProblemDebugModeList = (unit: { mode: GameMode; modePool?: string[] }) =>
    unit.modePool && unit.modePool.length > 0 ? unit.modePool : [unit.mode];

const getProblemsForDebugUnit = (unit: { mode: GameMode; modePool?: string[] }): GeneralProblem[] =>
    getProblemDebugModeList(unit).flatMap(mode => SUBJECT_DATA[mode] || []);

const formatProblemDebugCopyLine = (
    groupName: string,
    unit: DebugProblemUnit,
    problemCount: number,
) => `${groupName}\t${getProblemDebugGradeLabel(unit)}\t${unit.name}\t${getProblemDebugModeList(unit).join(',')}\t${problemCount}問`;

const DEBUG_EVENT_GROUPS: Array<{ id: VisualThemeId; name: string; titles: string[] }> = [
    { id: 'elementary', name: '小学生編', titles: [...ELEMENTARY_EVENT_TITLES] },
    { id: 'high-school', name: '高校編', titles: [...HIGH_SCHOOL_EVENT_THEMES.map(event => event.title), ...HIGH_SCHOOL_SUPPORTER_NPC_EVENTS.map(event => event.title)] },
    { id: 'magic', name: 'マジック編', titles: MAGIC_EVENT_THEMES.map(event => event.title) },
];

const SUPPORTER_NPC_REWARD_LABELS: Record<SupporterNpcReward, string> = {
    synthesis: '任意カード合成',
    upgrade: 'カード強化',
    rareCard: 'レアカード獲得',
    heal: 'HP回復',
    gold: 'ゴールド獲得',
    maxHp: '最大HP上昇',
    organize: '心の整理（カードコスト-1）',
    community: '地域のつながり（30G＋次回ショップ20%OFF）',
    nutrition: '栄養チャージ（最大HP+2・HP10回復）',
    ramenBoost: 'ラーメンの気合（次の3戦の開始エナジー+1）',
    duplicate: '歩くボードゲーム倉庫（カード複製）',
    chaos: 'どどめの混沌（レアカード＋次戦ランダム0コスト）',
    fanFavorite: 'みんなの推し（キラカード3枚から1枚選択）',
};
const UI_PREVIEW_CHECK_TARGETS: Array<{ id: UiPreviewCheckTarget; label: string }> = [
    { id: 'pc', label: 'PC' },
    { id: 'mobileLandscape', label: 'スマホ横' },
    { id: 'mobilePortrait', label: '縦画面' },
    { id: 'buttonLayout', label: 'ボタン配置' },
];

const MAGIC_VOICE_CHARACTERS = [
    ...MAGIC_HEROES.map(hero => ({ id: hero.id, name: hero.name, label: hero.transformedTitle, gender: 'female' as const })),
    ...MAGIC_MALE_PROTAGONISTS.map(hero => ({ id: hero.id, name: hero.name, label: hero.transformedTitle, gender: 'male' as const })),
];

const MAGIC_BATTLE_VOICE_GROUPS = [
    { title: '攻撃', files: ['attack-1', 'attack-2', 'attack-3'] },
    { title: '被ダメ', files: ['damage-1', 'damage-2', 'damage-3'] },
    { title: '専用カード', files: ['spell-1', 'spell-2', 'spell-3'] },
];

const HIGH_SCHOOL_VOICE_CHARACTERS = [
    { id: 'WARRIOR', name: '反逆の高校生', label: '攻撃タイプ' },
    { id: 'CARETAKER', name: '生物部の先輩', label: '捕獲タイプ' },
    { id: 'ASSASSIN', name: '謎めく転入生', label: 'テクニカル' },
    { id: 'MAGE', name: '化学研究会長', label: '実験タイプ' },
    { id: 'DODGEBALL', name: 'バスケ部エース', label: 'スピード' },
    { id: 'BARD', name: '放送部ディレクター', label: 'デバフ・反射' },
    { id: 'LIBRARIAN', name: '文芸部書記', label: '戦略・保留' },
    { id: 'CHEF', name: '学食の料理長', label: 'パワー' },
    { id: 'GARDENER', name: '園芸部部長', label: '育成タイプ' },
];

const HIGH_SCHOOL_BATTLE_VOICE_GROUPS = [
    { title: '攻撃', files: ['attack-1', 'attack-2', 'attack-3', 'attack-4', 'attack-5'] },
    { title: '召喚', files: ['summon-1', 'summon-2', 'summon-3', 'summon-4', 'summon-5'] },
    { title: 'ブロック', files: ['block-1', 'block-2', 'block-3', 'block-4', 'block-5'] },
    { title: 'パワー', files: ['power-1', 'power-2', 'power-3', 'power-4', 'power-5'] },
    { title: '被ダメ', files: ['damage-1', 'damage-2', 'damage-3', 'damage-4', 'damage-5'] },
    { title: 'アイテム', files: ['item-1', 'item-2', 'item-3', 'item-4', 'item-5'] },
    { title: 'フィニッシュ', files: ['finish-1', 'finish-2', 'finish-3', 'finish-4', 'finish-5'] },
    { title: '戦闘不能', files: ['defeat-1', 'defeat-2', 'defeat-3', 'defeat-4', 'defeat-5'] },
];

const TranslationRow = React.memo(({ original, context, debugLanguageMode, isInline = false }: { original: string, context?: string, debugLanguageMode: LanguageMode, isInline?: boolean }) => {
    const translated = trans(original, debugLanguageMode);
    const isMissing = debugLanguageMode === 'HIRAGANA' && translated === original && original.match(/[一-龠]/);

    return (
        <div className={`p-2 border-b border-gray-700 flex flex-col gap-1 ${isMissing ? 'bg-red-900/20' : 'hover:bg-white/5'}`}>
            {context && <div className="text-[10px] text-gray-500 font-bold uppercase">{context}</div>}
            <div className={`flex ${isInline ? 'flex-row items-center gap-4' : 'flex-col md:flex-row gap-2'}`}>
                <div className="flex-1 text-xs text-gray-400 font-mono bg-black/40 p-1 rounded">
                    {original}
                </div>
                <div className="hidden md:flex items-center text-gray-600"><ArrowRight size={14} /></div>
                <div className={`flex-1 text-xs font-bold p-1 rounded ${isMissing ? 'text-red-400 bg-red-900/40' : 'text-green-400 bg-green-900/20'}`}>
                    {translated}
                </div>
            </div>
            {isMissing && <div className="text-[8px] text-red-500 font-bold italic tracking-tighter">MISSING TRANSLATION IN DICTIONARY</div>}
        </div>
    );
});

const DebugMenuScreen: React.FC<DebugMenuScreenProps> = ({
    onStart,
    onStartAct3Boss,
    onStartMagicEventSimulation,
    onStartUiPreview,
    onStartProblemUiPreview,
    onStartEventUiPreview,
    onStartCrowdfundingBoss,
    onBack,
    onTimeUpdate,
    onAddClearCount,
    onBoostMathCorrect,
    clearCount,
    totalMathCorrect,
    nextMiniGameThreshold,
    languageMode: initialLanguageMode,
    focusedUiPreviewScreenId,
    focusedSupporterNpcEventTitle
}) => {
    const [activeTab, setActiveTab] = useState<'CARDS' | 'RELICS' | 'POTIONS' | 'SYNTHESIS' | 'SYSTEM' | 'UI_PREVIEW' | 'PROBLEM_DEBUG' | 'EFFECTS' | 'MAGIC_VOICES' | 'ENEMY_VOICE_AUDIT' | 'MAGIC_ART_AUDIT' | 'EVENTS' | 'HUMANOID_SPRITES' | 'TRANSLATION'>(focusedSupporterNpcEventTitle ? 'EVENTS' : focusedUiPreviewScreenId ? 'UI_PREVIEW' : 'CARDS');
    const showLoadoutPanel = activeTab === 'CARDS' || activeTab === 'RELICS' || activeTab === 'POTIONS' || activeTab === 'SYNTHESIS';
    const focusedUiPreviewItemRef = useRef<HTMLDivElement | null>(null);
    const focusedSupporterNpcEventRef = useRef<HTMLDivElement | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [debugLanguageMode, setDebugLanguageMode] = useState<LanguageMode>(initialLanguageMode);
    const [transSubTab, setTransSubTab] = useState<'STORY' | 'FLAVOR' | 'CARD' | 'EVENT' | 'ENEMY' | 'MISSING'>('STORY');
    const [copied, setCopied] = useState(false);
    const [magicVoiceHeroId, setMagicVoiceHeroId] = useState('AKARI');
    const [highSchoolVoiceHeroId, setHighSchoolVoiceHeroId] = useState('WARRIOR');
    const [highSchoolVoiceFixTargets, setHighSchoolVoiceFixTargets] = useState<string[]>([]);
    const [highSchoolVoiceFixCopied, setHighSchoolVoiceFixCopied] = useState(false);
    const [enemyVoiceAuditTheme, setEnemyVoiceAuditTheme] = useState<'all' | 'high-school' | 'magic'>('all');
    const [enemyVoiceGenderOverrides, setEnemyVoiceGenderOverrides] = useState<Record<string, HumanoidEnemyVoiceGender>>({});
    const [enemyVoiceAuditCopied, setEnemyVoiceAuditCopied] = useState(false);
    const [magicArtSearchTerm, setMagicArtSearchTerm] = useState('');
    const [magicArtCategoryFilter, setMagicArtCategoryFilter] = useState<'ALL' | 'COMMON_EVENT' | 'ROMANCE_EVENT' | 'ENDING_EVENT'>('ALL');
    const [magicArtMismatchIds, setMagicArtMismatchIds] = useState<string[]>([]);
    const [magicArtMismatchCopied, setMagicArtMismatchCopied] = useState(false);
    const [magicArtZoomTarget, setMagicArtZoomTarget] = useState<{ label: string; filePath: string; expected: string } | null>(null);
    const [magicVoiceEventHeroId, setMagicVoiceEventHeroId] = useState('AKARI');
    const [magicVoiceEventTargetId, setMagicVoiceEventTargetId] = useState('REN');
    const [magicVoiceEventStage, setMagicVoiceEventStage] = useState(0);
    const [magicVoiceEndingRank, setMagicVoiceEndingRank] = useState<MagicRomanceEndingRank>('TRUE_ROMANCE');
    const [effectPreviewTokens, setEffectPreviewTokens] = useState<Record<AttackEffectKey, number>>({} as Record<AttackEffectKey, number>);
    const [playingEffectKey, setPlayingEffectKey] = useState<AttackEffectKey | null>(null);
    const [statusPreviewTokens, setStatusPreviewTokens] = useState<Record<StatusEffectKey, number>>({} as Record<StatusEffectKey, number>);
    const [playingStatusKey, setPlayingStatusKey] = useState<StatusEffectKey | null>(null);
    const [addHolographicCards, setAddHolographicCards] = useState(false);
    const [debugProblemGroupId, setDebugProblemGroupId] = useState(DEBUG_PROBLEM_UNIT_GROUPS[0]?.id ?? '');
    const [debugProblemUnitId, setDebugProblemUnitId] = useState(DEBUG_PROBLEM_UNIT_GROUPS[0]?.units[0]?.id ?? '');
    const [problemDebugLevel, setProblemDebugLevel] = useState<ProblemDebugLevel>('ALL');
    const [problemDebugGrade, setProblemDebugGrade] = useState('ALL');
    const [problemDebugSearch, setProblemDebugSearch] = useState('');
    const [problemDebugDetailUnitId, setProblemDebugDetailUnitId] = useState<string | null>(null);
    const [problemDebugFixUnitIds, setProblemDebugFixUnitIds] = useState<string[]>([]);
    const [problemDebugFixCopied, setProblemDebugFixCopied] = useState(false);
    const [debugEventTheme, setDebugEventTheme] = useState<VisualThemeId>('elementary');
    const [debugEventTitle, setDebugEventTitle] = useState(DEBUG_EVENT_GROUPS[0]?.titles[0] ?? '');
    const [uiPreviewChecklist, setUiPreviewChecklist] = useState<UiPreviewChecklist>(() => storageService.getUiPreviewChecklist());

    useEffect(() => {
        if (!focusedUiPreviewScreenId) return;
        setActiveTab('UI_PREVIEW');
    }, [focusedUiPreviewScreenId]);

    useEffect(() => {
        if (!focusedSupporterNpcEventTitle) return;
        setActiveTab('EVENTS');
    }, [focusedSupporterNpcEventTitle]);

    useEffect(() => {
        if (activeTab !== 'UI_PREVIEW' || !focusedUiPreviewScreenId) return;
        const timer = window.setTimeout(() => {
            focusedUiPreviewItemRef.current?.scrollIntoView({ block: 'center', inline: 'nearest' });
        }, 0);
        return () => window.clearTimeout(timer);
    }, [activeTab, focusedUiPreviewScreenId]);

    useEffect(() => {
        if (activeTab !== 'EVENTS' || !focusedSupporterNpcEventTitle) return;
        const timer = window.setTimeout(() => {
            focusedSupporterNpcEventRef.current?.scrollIntoView({ block: 'center', inline: 'nearest' });
        }, 0);
        return () => window.clearTimeout(timer);
    }, [activeTab, focusedSupporterNpcEventTitle]);

    const [selectedDeck, setSelectedDeck] = useState<ICard[]>([]);
    const [selectedRelics, setSelectedRelics] = useState<Relic[]>([]);
    const [selectedPotions, setSelectedPotions] = useState<Potion[]>([]);

    const [synthSlot1, setSynthSlot1] = useState<ICard | null>(null);
    const [synthSlot2, setSynthSlot2] = useState<ICard | null>(null);
    const [synthResult, setSynthResult] = useState<ICard | null>(null);
    const [stressHitCount, setStressHitCount] = useState(240);
    const [stressDamage, setStressDamage] = useState(1);
    const [stressDraw, setStressDraw] = useState(0);
    const [stressAddHand, setStressAddHand] = useState(0);
    const [stressAddDraw, setStressAddDraw] = useState(0);
    const [stressAddDiscard, setStressAddDiscard] = useState(0);
    const [stressNextTurnDraw, setStressNextTurnDraw] = useState(0);
    const [stressBattleBonusDraw, setStressBattleBonusDraw] = useState(0);
    const [stressOriginalNameCount, setStressOriginalNameCount] = useState(30);
    const debugProblemGroup = DEBUG_PROBLEM_UNIT_GROUPS.find(group => group.id === debugProblemGroupId) ?? DEBUG_PROBLEM_UNIT_GROUPS[0];
    const debugProblemUnit = debugProblemGroup?.units.find(unit => unit.id === debugProblemUnitId) ?? debugProblemGroup?.units[0];
    const debugEventGroup = DEBUG_EVENT_GROUPS.find(group => group.id === debugEventTheme) ?? DEBUG_EVENT_GROUPS[0];
    const selectedDebugEventTitle = debugEventGroup?.titles.includes(debugEventTitle) ? debugEventTitle : debugEventGroup?.titles[0] ?? '';
    const problemDebugGroupOptions = useMemo(() => (
        DEBUG_PROBLEM_UNIT_GROUPS.filter(group =>
            problemDebugLevel === 'ALL' || group.units.some(unit => unit.level === problemDebugLevel)
        )
    ), [problemDebugLevel]);
    const problemDebugGroup = problemDebugGroupOptions.find(group => group.id === debugProblemGroupId) ?? problemDebugGroupOptions[0] ?? DEBUG_PROBLEM_UNIT_GROUPS[0];
    const problemDebugGradeOptions = useMemo(() => {
        const labels = new Set((problemDebugGroup?.units ?? [])
            .filter(unit => problemDebugLevel === 'ALL' || unit.level === problemDebugLevel)
            .map(unit => getProblemDebugGradeLabel(unit)));
        return ['ALL', ...Array.from(labels).sort((a, b) => a.localeCompare(b, 'ja'))];
    }, [problemDebugGroup, problemDebugLevel]);
    const filteredProblemDebugUnits = useMemo(() => {
        const normalizedSearch = problemDebugSearch.trim().toLowerCase();
        return (problemDebugGroup?.units ?? []).filter(unit => {
            if (problemDebugLevel !== 'ALL' && unit.level !== problemDebugLevel) return false;
            if (problemDebugGrade !== 'ALL' && getProblemDebugGradeLabel(unit) !== problemDebugGrade) return false;
            if (!normalizedSearch) return true;
            const haystack = [
                problemDebugGroup?.name ?? '',
                unit.name,
                unit.mode,
                ...(unit.modePool ?? []),
            ].join(' ').toLowerCase();
            return haystack.includes(normalizedSearch);
        });
    }, [problemDebugGrade, problemDebugGroup, problemDebugSearch]);
    const selectedProblemDebugUnit = (
        problemDebugGroup?.units.find(unit => unit.id === problemDebugDetailUnitId)
        ?? filteredProblemDebugUnits[0]
        ?? problemDebugGroup?.units[0]
    );
    const selectedProblemDebugProblems = useMemo(() => (
        selectedProblemDebugUnit ? getProblemsForDebugUnit(selectedProblemDebugUnit) : []
    ), [selectedProblemDebugUnit]);
    const selectedProblemDebugDynamicMeta = selectedProblemDebugUnit ? DYNAMIC_MATH_DEBUG_META[selectedProblemDebugUnit.mode] : undefined;
    const problemDebugFixText = useMemo(() => {
        const selected = new Set(problemDebugFixUnitIds);
        return DEBUG_PROBLEM_UNIT_GROUPS.flatMap(group => (
            group.units
                .filter(unit => selected.has(unit.id))
                .map(unit => formatProblemDebugCopyLine(group.name, unit, getProblemsForDebugUnit(unit).length))
        )).join('\n');
    }, [problemDebugFixUnitIds]);

    useEffect(() => {
        if (!problemDebugGroupOptions.length) return;
        if (problemDebugGroupOptions.some(group => group.id === debugProblemGroupId)) return;
        setDebugProblemGroupId(problemDebugGroupOptions[0].id);
        setDebugProblemUnitId(problemDebugGroupOptions[0].units[0]?.id ?? '');
        setProblemDebugDetailUnitId(null);
        setProblemDebugGrade('ALL');
    }, [debugProblemGroupId, problemDebugGroupOptions]);

    const allCards = useMemo(() => Object.values(CARDS_LIBRARY).sort((a, b) => a.type.localeCompare(b.type) || a.cost - b.cost), []);
    const allRelics = useMemo(() => Object.values(RELIC_LIBRARY), []);
    const allPotions = useMemo(() => Object.values(POTION_LIBRARY), []);
    const selectedMagicVoiceHero = useMemo(
        () => MAGIC_VOICE_CHARACTERS.find(hero => hero.id === magicVoiceHeroId) ?? MAGIC_VOICE_CHARACTERS[0],
        [magicVoiceHeroId]
    );
    const selectedHighSchoolVoiceHero = useMemo(
        () => HIGH_SCHOOL_VOICE_CHARACTERS.find(hero => hero.id === highSchoolVoiceHeroId) ?? HIGH_SCHOOL_VOICE_CHARACTERS[0],
        [highSchoolVoiceHeroId]
    );
    const highSchoolVoiceFixText = useMemo(() => {
        return highSchoolVoiceFixTargets.map(key => {
            const [heroId, file] = key.split('/');
            const hero = HIGH_SCHOOL_VOICE_CHARACTERS.find(entry => entry.id === heroId);
            return `${hero?.name ?? heroId}\t${heroId}\t${file}.ogg`;
        }).join('\n');
    }, [highSchoolVoiceFixTargets]);
    const filteredEnemyVoiceAuditProfiles = useMemo(() => (
        HUMANOID_ENEMY_VOICE_PROFILES
            .filter(profile => enemyVoiceAuditTheme === 'all' || profile.theme === enemyVoiceAuditTheme)
            .sort((a, b) => a.theme.localeCompare(b.theme) || a.id.localeCompare(b.id))
    ), [enemyVoiceAuditTheme]);
    const enemyVoiceAuditRows = useMemo(() => (
        filteredEnemyVoiceAuditProfiles.map(profile => {
            const checkedGender = enemyVoiceGenderOverrides[profile.id] ?? profile.gender;
            return {
                profile,
                checkedGender,
                changed: checkedGender !== profile.gender,
            };
        })
    ), [enemyVoiceGenderOverrides, filteredEnemyVoiceAuditProfiles]);
    const enemyVoiceAuditChangedCount = enemyVoiceAuditRows.filter(row => row.changed).length;
    const enemyVoiceAuditCopyText = useMemo(() => {
        const header = 'theme\tid\tname\tcurrentGender\tcheckedGender\tspeakerId\tstatus';
        const rows = enemyVoiceAuditRows.map(({ profile, checkedGender, changed }) => [
            profile.theme,
            profile.id,
            profile.name,
            profile.gender,
            checkedGender,
            profile.speakerId,
            changed ? 'CHANGE' : 'OK',
        ].join('\t'));
        return [header, ...rows].join('\n');
    }, [enemyVoiceAuditRows]);
    const filteredMagicArtTargets = useMemo(() => {
        const normalizedSearch = magicArtSearchTerm.trim().toLowerCase();
        return MAGIC_ART_CONSISTENCY_TARGETS.filter(target => {
            if (magicArtCategoryFilter !== 'ALL' && target.category !== magicArtCategoryFilter) return false;
            if (!normalizedSearch) return true;
            const haystack = [
                target.label,
                target.filePath,
                target.heroId ?? '',
                target.targetId ?? '',
                target.expected,
            ].join(' ').toLowerCase();
            return haystack.includes(normalizedSearch);
        });
    }, [magicArtCategoryFilter, magicArtSearchTerm]);
    const magicArtMismatchText = useMemo(() => {
        const selected = new Set(magicArtMismatchIds);
        return MAGIC_ART_CONSISTENCY_TARGETS
            .filter(target => selected.has(target.id))
            .map(target => target.filePath)
            .join('\n');
    }, [magicArtMismatchIds]);
    const eventProtagonist = useMemo(
        () => MAGIC_VOICE_CHARACTERS.find(hero => hero.id === magicVoiceEventHeroId) ?? MAGIC_VOICE_CHARACTERS[0],
        [magicVoiceEventHeroId]
    );
    const eventTargetOptions = useMemo(
        () => eventProtagonist.gender === 'male'
            ? MAGIC_HEROES.map(hero => ({ id: hero.id, name: hero.name, label: hero.transformedTitle }))
            : MAGIC_MALE_PROTAGONISTS.map(hero => ({ id: hero.id, name: hero.name, label: hero.transformedTitle })),
        [eventProtagonist.gender]
    );
    const normalizedMagicVoiceEventTargetId = eventTargetOptions.some(target => target.id === magicVoiceEventTargetId)
        ? magicVoiceEventTargetId
        : eventTargetOptions[0]?.id ?? 'REN';
    const magicVoiceEventDialogue = useMemo(
        () => getMagicRomanceDialogue(magicVoiceEventHeroId, normalizedMagicVoiceEventTargetId, magicVoiceEventStage),
        [magicVoiceEventHeroId, magicVoiceEventStage, normalizedMagicVoiceEventTargetId]
    );
    const magicVoiceEventLines = useMemo(
        () => getMagicRomanceVoiceLines(magicVoiceEventHeroId, normalizedMagicVoiceEventTargetId, magicVoiceEventStage, magicVoiceEventDialogue.description),
        [magicVoiceEventDialogue.description, magicVoiceEventHeroId, magicVoiceEventStage, normalizedMagicVoiceEventTargetId]
    );
    const magicVoiceEventQuotedLines = useMemo(
        () => magicVoiceEventDialogue.description
            .split('\n')
            .map(line => line.match(/^([^「]+)「(.+)」$/))
            .filter((match): match is RegExpMatchArray => !!match),
        [magicVoiceEventDialogue.description]
    );
    const magicVoiceEndingAffection = {
        BOND: 20,
        SPECIAL: 60,
        ROMANCE: 90,
        TRUE_ROMANCE: 100,
    }[magicVoiceEndingRank];
    const magicVoiceEnding = useMemo(
        () => getMagicRomanceEndingText(magicVoiceEventHeroId, normalizedMagicVoiceEventTargetId, magicVoiceEndingAffection),
        [magicVoiceEndingAffection, magicVoiceEventHeroId, normalizedMagicVoiceEventTargetId]
    );
    const magicVoiceEndingLines = useMemo(
        () => magicVoiceEnding.lines.map((line) => ({
            text: line,
            voiceLine: getMagicEndingVoiceLine(line, magicVoiceEventHeroId),
        })),
        [magicVoiceEnding.lines, magicVoiceEventHeroId]
    );

    const filteredCards = useMemo(() => allCards.filter(c =>
        c.name.includes(searchTerm) ||
        c.description.includes(searchTerm) ||
        c.type.includes(searchTerm)
    ), [allCards, searchTerm]);

    const handleAddCard = useCallback((template: any) => {
        const baseCard: ICard = { ...template, id: `debug-${Date.now()}-${Math.random()}` };
        const newCard = addHolographicCards ? createHolographicCard(baseCard) : baseCard;
        if (activeTab === 'SYNTHESIS') {
            if (!synthSlot1) setSynthSlot1(newCard);
            else if (!synthSlot2) setSynthSlot2(newCard);
        } else {
            setSelectedDeck(prev => [...prev, newCard]);
        }
    }, [activeTab, addHolographicCards, synthSlot1, synthSlot2]);

    const handleRemoveCard = useCallback((index: number) => {
        setSelectedDeck(prev => {
            const next = [...prev];
            next.splice(index, 1);
            return next;
        });
    }, []);

    const toggleDeckCardHolographic = useCallback((index: number) => {
        setSelectedDeck(prev => prev.map((card, cardIndex) => {
            if (cardIndex !== index) return card;
            if (card.holographic) return card;
            return createHolographicCard(card);
        }));
    }, []);

    const toggleRelic = useCallback((relic: Relic) => {
        setSelectedRelics(prev => {
            if (prev.find(r => r.id === relic.id)) {
                return prev.filter(r => r.id !== relic.id);
            } else {
                return [...prev, relic];
            }
        });
    }, []);

    const togglePotion = useCallback((potionTemplate: any) => {
        setSelectedPotions(prev => {
            if (prev.length >= 3) return prev;
            const newPotion: Potion = { ...potionTemplate, id: `debug-pot-${Date.now()}` };
            return [...prev, newPotion];
        });
    }, []);

    const removePotion = useCallback((index: number) => {
        setSelectedPotions(prev => {
            const next = [...prev];
            next.splice(index, 1);
            return next;
        });
    }, []);

    const clearDeck = () => setSelectedDeck([]);

    const performSynthesis = () => {
        if (!synthSlot1 || !synthSlot2) return;
        const newCard = synthesizeCards(synthSlot1, synthSlot2);
        setSynthResult(newCard);
    };

    const normalizeDebugNumber = (value: number, fallback = 0) => {
        if (!Number.isFinite(value)) return fallback;
        return Math.max(0, Math.floor(value));
    };

    const makeStressOriginalNames = (count: number) => {
        const specialNames = [
            '大掃除',
            '山勘',
            '発見',
            '理科室の調合',
            '虹のプリズム',
            '磁石の力',
            '大ジャンプ',
            '早退',
            'あがく',
            '天気予報',
            '銀河鉄道の夜',
            'ドリーム・キャッチャー',
        ];
        return Array.from({ length: normalizeDebugNumber(count) }, (_item, index) => (
            specialNames[index] ?? `合成過多素材${index + 1}`
        ));
    };

    const createStressSynthCard = (): ICard => {
        const hits = Math.max(1, normalizeDebugNumber(stressHitCount, 1));
        const damage = normalizeDebugNumber(stressDamage, 1);
        const draw = normalizeDebugNumber(stressDraw);
        const addHand = normalizeDebugNumber(stressAddHand);
        const addDraw = normalizeDebugNumber(stressAddDraw);
        const addDiscard = normalizeDebugNumber(stressAddDiscard);
        const nextTurnDraw = normalizeDebugNumber(stressNextTurnDraw);
        const battleBonusDraw = normalizeDebugNumber(stressBattleBonusDraw);
        const originalNames = makeStressOriginalNames(stressOriginalNameCount);

        const card: ICard = {
            id: `debug-over-synth-${Date.now()}-${Math.random()}`,
            name: `合成過多テスト${hits}H`,
            cost: 0,
            type: CardType.ATTACK,
            target: TargetType.ENEMY,
            rarity: 'SPECIAL',
            damage,
            playCopies: hits > 1 ? hits - 1 : undefined,
            draw: draw || undefined,
            nextTurnDraw: nextTurnDraw || undefined,
            battleBonusDrawOnPlay: battleBonusDraw || undefined,
            addCardToHand: addHand > 0 ? { cardName: 'SHIV', count: addHand, cost0: true } : undefined,
            addCardToDraw: addDraw > 0 ? { cardName: 'WOUND', count: addDraw } : undefined,
            addCardToDiscard: addDiscard > 0 ? { cardName: 'BURN', count: addDiscard } : undefined,
            originalNames,
            textureRef: 'LIGHTNING|紫|ATTACK',
            description: [
                `${damage}ダメージを${hits}回`,
                draw > 0 ? `${draw}枚引く` : '',
                addHand > 0 ? `SHIVを${addHand}枚手札に加える` : '',
                addDraw > 0 ? `WOUNDを${addDraw}枚山札に加える` : '',
                addDiscard > 0 ? `BURNを${addDiscard}枚捨て札に加える` : '',
                nextTurnDraw > 0 ? `次ターン${nextTurnDraw}枚ドロー` : '',
                battleBonusDraw > 0 ? `使用後${battleBonusDraw}枚ドロー` : '',
                originalNames.length > 0 ? `元カード名${originalNames.length}件` : '',
            ].filter(Boolean).join('。') + '。',
        };

        return card;
    };

    const addStressSynthCardToDeck = () => {
        setSelectedDeck(prev => [...prev, createStressSynthCard()]);
    };

    const setStressSynthCardAsResult = () => {
        setSynthResult(createStressSynthCard());
    };

    const addSynthToDeck = () => {
        if (synthResult) {
            setSelectedDeck(prev => [...prev, { ...synthResult, id: `synth-added-${Date.now()}` }]);
        }
    };

    const addDebugTime = () => {
        const current = storageService.getDailyPlayTime();
        const next = current + (58 * 60);
        storageService.saveDailyPlayTime(next);
        onTimeUpdate(next);
        alert("きょうの ぼうけんじかんを 58ふん プラスしました。");
    };

    const resetDebugTime = () => {
        storageService.saveDailyPlayTime(0);
        onTimeUpdate(0);
        alert("きょうの ぼうけんじかんを リセットしました。");
    };

    // --- MISSING LIST LOGIC ---
    const missingList = useMemo(() => {
        const collected = new Set<string>();
        const kanjiRegex = /[一-龠]/;

        const check = (str: string) => {
            if (!str) return;
            const translated = trans(str, 'HIRAGANA');
            if (translated.match(kanjiRegex)) {
                collected.add(str);
            }
        };

        GAME_STORIES.forEach(s => s.parts.forEach(p => { check(p.title); check(p.content); }));
        FLAVOR_TEXTS.forEach(check);
        allCards.forEach(c => { check(c.name); check(c.description); });
        allRelics.forEach(r => { check(r.name); check(r.description); });
        allPotions.forEach(p => { check(p.name); check(p.description); });
        (['elementary', 'high-school', 'magic'] as VisualThemeId[])
            .flatMap(theme => Object.values(getEnemyLibraryByTheme(theme)))
            .forEach(e => check(e.name));
        ENEMY_NAMES.forEach(check);
        EVENT_SAMPLES.forEach(ev => {
            check(ev.title);
            check(ev.description);
            ev.options.forEach(opt => { check(opt.label); check(opt.text); });
        });

        return Array.from(collected).sort();
    }, [allCards, allRelics, allPotions]);

    const copyMissingToClipboard = () => {
        const text = missingList.map(item => `"${item}": "",`).join('\n');
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const toggleProblemDebugFixUnit = (unitId: string) => {
        setProblemDebugFixUnitIds(prev => {
            if (prev.includes(unitId)) return prev.filter(id => id !== unitId);
            return [...prev, unitId].sort();
        });
        setProblemDebugFixCopied(false);
    };

    const copyProblemDebugFixUnits = async () => {
        if (!problemDebugFixText) return;
        await navigator.clipboard.writeText(problemDebugFixText);
        setProblemDebugFixCopied(true);
        window.setTimeout(() => setProblemDebugFixCopied(false), 1600);
    };

    const playEffectPreview = (effectKey: AttackEffectKey) => {
        audioService.playAttackEffectSound(effectKey);
        const token = Date.now();
        setEffectPreviewTokens(prev => ({ ...prev, [effectKey]: token }));
        setPlayingEffectKey(effectKey);
        window.setTimeout(() => {
            setPlayingEffectKey(current => current === effectKey ? null : current);
        }, 520);
    };

    const playStatusPreview = (effectKey: StatusEffectKey) => {
        audioService.playStatusEffectSound(effectKey);
        const token = Date.now();
        setStatusPreviewTokens(prev => ({ ...prev, [effectKey]: token }));
        setPlayingStatusKey(effectKey);
        window.setTimeout(() => {
            setPlayingStatusKey(current => current === effectKey ? null : current);
        }, 620);
    };

    const handleMagicVoiceEventHeroChange = (heroId: string) => {
        const nextHero = MAGIC_VOICE_CHARACTERS.find(hero => hero.id === heroId) ?? MAGIC_VOICE_CHARACTERS[0];
        setMagicVoiceEventHeroId(nextHero.id);
        setMagicVoiceEventTargetId(nextHero.gender === 'male' ? MAGIC_HEROES[0].id : MAGIC_MALE_PROTAGONISTS[0].id);
    };

    const playMagicEventVoiceSequence = () => {
        void audioService.playMagicEventVoiceSequence(magicVoiceEventLines);
    };

    const playMagicEndingVoiceSequence = () => {
        void audioService.playMagicEventVoiceSequence(
            magicVoiceEndingLines
                .map(line => line.voiceLine)
                .filter((line): line is { heroId: string; lineId: string } => !!line)
        );
    };

    const toggleHighSchoolVoiceFixTarget = (heroId: string, file: string) => {
        const key = `${heroId}/${file}`;
        setHighSchoolVoiceFixTargets(prev => {
            if (prev.includes(key)) return prev.filter(entry => entry !== key);
            return [...prev, key].sort();
        });
        setHighSchoolVoiceFixCopied(false);
    };

    const copyHighSchoolVoiceFixTargets = async () => {
        if (!highSchoolVoiceFixText) return;
        await navigator.clipboard.writeText(highSchoolVoiceFixText);
        setHighSchoolVoiceFixCopied(true);
        window.setTimeout(() => setHighSchoolVoiceFixCopied(false), 1600);
    };

    const setEnemyVoiceAuditGender = (profile: HumanoidEnemyVoiceProfile, gender: HumanoidEnemyVoiceGender) => {
        setEnemyVoiceGenderOverrides(prev => ({ ...prev, [profile.id]: gender }));
        setEnemyVoiceAuditCopied(false);
    };

    const resetEnemyVoiceAuditGender = (profile: HumanoidEnemyVoiceProfile) => {
        setEnemyVoiceGenderOverrides(prev => {
            const next = { ...prev };
            delete next[profile.id];
            return next;
        });
        setEnemyVoiceAuditCopied(false);
    };

    const copyEnemyVoiceAuditResults = async () => {
        await navigator.clipboard.writeText(enemyVoiceAuditCopyText);
        setEnemyVoiceAuditCopied(true);
        window.setTimeout(() => setEnemyVoiceAuditCopied(false), 1600);
    };

    const toggleMagicArtMismatch = (id: string) => {
        setMagicArtMismatchIds(prev => {
            if (prev.includes(id)) return prev.filter(entry => entry !== id);
            return [...prev, id].sort();
        });
        setMagicArtMismatchCopied(false);
    };

    const copyMagicArtMismatchTargets = async () => {
        if (!magicArtMismatchText) return;
        await navigator.clipboard.writeText(magicArtMismatchText);
        setMagicArtMismatchCopied(true);
        window.setTimeout(() => setMagicArtMismatchCopied(false), 1600);
    };

    const toggleUiPreviewCheck = (key: string, target: UiPreviewCheckTarget) => {
        setUiPreviewChecklist(prev => {
            const next: UiPreviewChecklist = {
                ...prev,
                [key]: {
                    ...prev[key],
                    [target]: !prev[key]?.[target],
                },
            };
            storageService.saveUiPreviewChecklist(next);
            return next;
        });
    };

    const renderUiPreviewChecks = (key: string) => (
        <div className="flex flex-wrap items-center justify-center gap-2">
            {UI_PREVIEW_CHECK_TARGETS.map(target => (
                <label
                    key={target.id}
                    className={`flex cursor-pointer items-center gap-1 rounded border px-1.5 py-1 text-[9px] font-black transition-colors ${
                        uiPreviewChecklist[key]?.[target.id]
                            ? 'border-emerald-400 bg-emerald-950 text-emerald-200'
                            : 'border-slate-600 bg-slate-950 text-slate-400'
                    }`}
                >
                    <input
                        type="checkbox"
                        checked={Boolean(uiPreviewChecklist[key]?.[target.id])}
                        onChange={() => toggleUiPreviewCheck(key, target.id)}
                        className="h-3 w-3 accent-emerald-500"
                    />
                    {target.label}
                </label>
            ))}
        </div>
    );
    const completedUiPreviewScreenCount = UI_PREVIEW_SCREENS.filter(item =>
        UI_PREVIEW_CHECK_TARGETS.every(target => uiPreviewChecklist[`screen:${item.id}`]?.[target.id])
    ).length;
    const totalUiPreviewChecks = Object.values(uiPreviewChecklist).reduce(
        (total, entry) => total + UI_PREVIEW_CHECK_TARGETS.filter(target => entry?.[target.id]).length,
        0,
    );
    const renderStressNumberInput = (
        label: string,
        value: number,
        setter: React.Dispatch<React.SetStateAction<number>>,
        hint?: string,
    ) => (
        <label className="flex flex-col gap-1 rounded-lg border border-purple-900/70 bg-black/30 p-2">
            <span className="text-[10px] font-black text-purple-200">{label}</span>
            <input
                type="number"
                min={0}
                value={value}
                onChange={(event) => setter(Number(event.target.value))}
                className="w-full rounded border border-slate-600 bg-slate-950 px-2 py-1 text-sm font-bold text-white outline-none focus:border-purple-400"
            />
            {hint && <span className="text-[9px] leading-tight text-slate-400">{hint}</span>}
        </label>
    );

    return (
        <div className="flex flex-col h-full w-full bg-gray-900 text-white relative">
            <div className="bg-red-900/90 border-b-2 border-red-500 p-2 md:p-4 flex justify-between items-center shrink-0 z-20">
                <h2 className="text-lg md:text-xl font-bold text-red-100 flex items-center">
                    <Zap size={20} className="mr-2" /> DEBUG
                </h2>
                <div className="flex gap-2 md:gap-4 text-sm md:text-base">
                    <button onClick={onBack} className="text-gray-300 hover:text-white underline">{trans("戻る", initialLanguageMode)}</button>
                    <button
                        onClick={onStartMagicEventSimulation}
                        className="bg-fuchsia-800 hover:bg-fuchsia-700 text-white px-3 py-1 md:px-4 md:py-2 rounded font-bold flex items-center shadow-lg border border-fuchsia-400 text-xs"
                    >
                        恋愛イベントSIM <Sparkles size={14} className="ml-1" />
                    </button>
                    <button
                        onClick={() => onStartAct3Boss(selectedDeck, selectedRelics, selectedPotions)}
                        className="bg-purple-700 hover:bg-purple-600 text-white px-3 py-1 md:px-4 md:py-2 rounded font-bold flex items-center shadow-lg border border-purple-400 text-xs"
                    >
                        ACT3 BOSS <Skull size={14} className="ml-1" />
                    </button>
                    <button
                        onClick={() => onStart(selectedDeck, selectedRelics, selectedPotions)}
                        className="bg-green-600 hover:bg-green-500 text-white px-4 py-1 md:px-6 md:py-2 rounded font-bold flex items-center shadow-lg border-2 border-white animate-pulse text-xs md:text-sm"
                    >
                        {trans("出発する", initialLanguageMode)} <ArrowRight size={14} className="ml-1" />
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row flex-grow overflow-hidden">
                <div className={`w-full ${showLoadoutPanel ? 'h-[60%] md:h-full md:w-3/4 md:border-r' : 'h-full md:w-full'} border-b md:border-b-0 border-gray-700 flex flex-col bg-gray-800/50 min-h-0`}>
                    <div className="flex bg-gray-800 border-b border-gray-700 overflow-x-auto shrink-0">
                        <button onClick={() => setActiveTab('CARDS')} className={`flex-1 py-3 px-2 text-xs md:text-sm font-bold whitespace-nowrap ${activeTab === 'CARDS' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-750'}`}>カード</button>
                        <button onClick={() => setActiveTab('RELICS')} className={`flex-1 py-3 px-2 text-xs md:text-sm font-bold whitespace-nowrap ${activeTab === 'RELICS' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-750'}`}>レリック</button>
                        <button onClick={() => setActiveTab('POTIONS')} className={`flex-1 py-3 px-2 text-xs md:text-sm font-bold whitespace-nowrap ${activeTab === 'POTIONS' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-750'}`}>ポーション</button>
                        <button onClick={() => setActiveTab('SYNTHESIS')} className={`flex-1 py-3 px-2 text-xs md:text-sm font-bold whitespace-nowrap ${activeTab === 'SYNTHESIS' ? 'bg-purple-900 text-white' : 'text-purple-400 hover:bg-gray-750'}`}>合成</button>
                        <button onClick={() => setActiveTab('SYSTEM')} className={`flex-1 py-3 px-2 text-xs md:text-sm font-bold whitespace-nowrap ${activeTab === 'SYSTEM' ? 'bg-indigo-900 text-white' : 'text-indigo-400 hover:bg-gray-750'}`}>システム</button>
                        <button onClick={() => setActiveTab('UI_PREVIEW')} className={`flex-1 py-3 px-2 text-xs md:text-sm font-bold whitespace-nowrap ${activeTab === 'UI_PREVIEW' ? 'bg-sky-900 text-white' : 'text-sky-400 hover:bg-gray-750'}`}>UI実寸</button>
                        <button onClick={() => setActiveTab('PROBLEM_DEBUG')} className={`flex-1 py-3 px-2 text-xs md:text-sm font-bold whitespace-nowrap ${activeTab === 'PROBLEM_DEBUG' ? 'bg-lime-900 text-white' : 'text-lime-400 hover:bg-gray-750'}`}>問題デバッグ</button>
                        <button onClick={() => setActiveTab('EFFECTS')} className={`flex-1 py-3 px-2 text-xs md:text-sm font-bold whitespace-nowrap ${activeTab === 'EFFECTS' ? 'bg-orange-900 text-white' : 'text-orange-400 hover:bg-gray-750'}`}>エフェクト</button>
                        <button onClick={() => setActiveTab('MAGIC_VOICES')} className={`flex-1 py-3 px-2 text-xs md:text-sm font-bold whitespace-nowrap ${activeTab === 'MAGIC_VOICES' ? 'bg-fuchsia-900 text-white' : 'text-fuchsia-400 hover:bg-gray-750'}`}>マジック声</button>
                        <button onClick={() => setActiveTab('ENEMY_VOICE_AUDIT')} className={`flex-1 py-3 px-2 text-xs md:text-sm font-bold whitespace-nowrap ${activeTab === 'ENEMY_VOICE_AUDIT' ? 'bg-violet-900 text-white' : 'text-violet-400 hover:bg-gray-750'}`}>敵声整合</button>
                        <button onClick={() => setActiveTab('MAGIC_ART_AUDIT')} className={`flex-1 py-3 px-2 text-xs md:text-sm font-bold whitespace-nowrap ${activeTab === 'MAGIC_ART_AUDIT' ? 'bg-pink-900 text-white' : 'text-pink-400 hover:bg-gray-750'}`}>魔法絵不整合</button>
                        <button onClick={() => setActiveTab('EVENTS')} className={`flex-1 py-3 px-2 text-xs md:text-sm font-bold whitespace-nowrap ${activeTab === 'EVENTS' ? 'bg-cyan-900 text-white' : 'text-cyan-400 hover:bg-gray-750'}`}>高校編イベント</button>
                        <button onClick={() => setActiveTab('HUMANOID_SPRITES')} className={`flex-1 py-3 px-2 text-xs md:text-sm font-bold whitespace-nowrap ${activeTab === 'HUMANOID_SPRITES' ? 'bg-rose-900 text-white' : 'text-rose-400 hover:bg-gray-750'}`}>高校人型敵</button>
                        <button onClick={() => setActiveTab('TRANSLATION')} className={`flex-1 py-3 px-2 text-xs md:text-sm font-bold whitespace-nowrap ${activeTab === 'TRANSLATION' ? 'bg-emerald-900 text-white' : 'text-emerald-400 hover:bg-gray-750'}`}>翻訳確認</button>
                    </div>

                    {(activeTab === 'CARDS' || activeTab === 'SYNTHESIS') && (
                        <div className="p-2 bg-gray-800/80 border-b border-gray-700 shrink-0">
                            <div className="flex flex-col md:flex-row gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-2 text-gray-400" size={14} />
                                    <input
                                        type="text"
                                        placeholder="検索..."
                                        className="w-full bg-black border border-gray-600 rounded pl-9 p-1.5 text-sm text-white focus:border-blue-500 outline-none"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <button
                                    onClick={() => setAddHolographicCards(prev => !prev)}
                                    className={`px-3 py-1.5 rounded border text-xs font-black flex items-center justify-center gap-1 ${addHolographicCards ? 'bg-cyan-400 text-slate-950 border-white shadow-[0_0_12px_rgba(103,232,249,0.65)]' : 'bg-slate-900 text-cyan-200 border-cyan-700/60'}`}
                                >
                                    <Sparkles size={14} />
                                    追加時キラ
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex-grow overflow-y-auto p-2 md:p-4 custom-scrollbar min-h-0">
                        {activeTab === 'TRANSLATION' && (
                            <div className="space-y-4">
                                <div className="flex flex-wrap gap-2 items-center bg-black/30 p-2 rounded-lg border border-gray-700 sticky top-0 z-10 backdrop-blur-md">
                                    <button
                                        onClick={() => setDebugLanguageMode(prev => prev === 'JAPANESE' ? 'HIRAGANA' : prev === 'HIRAGANA' ? 'ENGLISH' : 'JAPANESE')}
                                        className={`px-4 py-1.5 rounded-full font-bold text-xs flex items-center gap-2 border-2 transition-all ${debugLanguageMode !== 'JAPANESE' ? 'bg-emerald-600 border-white text-white shadow-lg' : 'bg-gray-800 border-gray-600 text-gray-400'}`}
                                    >
                                        <Languages size={14} />
                                        {debugLanguageMode === 'JAPANESE' ? '日本語 モード' : debugLanguageMode === 'HIRAGANA' ? 'ひらがな モード' : 'English Mode'}
                                    </button>
                                    <div className="h-4 w-px bg-gray-700 mx-2"></div>
                                    <button onClick={() => setTransSubTab('STORY')} className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1 ${transSubTab === 'STORY' ? 'bg-white text-black' : 'text-gray-400'}`}><BookOpen size={12} /> ストーリー</button>
                                    <button onClick={() => setTransSubTab('FLAVOR')} className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1 ${transSubTab === 'FLAVOR' ? 'bg-white text-black' : 'text-gray-400'}`}><MessageSquare size={12} /> ログ</button>
                                    <button onClick={() => setTransSubTab('CARD')} className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1 ${transSubTab === 'CARD' ? 'bg-white text-black' : 'text-gray-400'}`}><Swords size={12} /> カード</button>
                                    <button onClick={() => setTransSubTab('EVENT')} className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1 ${transSubTab === 'EVENT' ? 'bg-white text-black' : 'text-gray-400'}`}><HelpCircle size={12} /> イベント</button>
                                    <button onClick={() => setTransSubTab('ENEMY')} className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1 ${transSubTab === 'ENEMY' ? 'bg-white text-black' : 'text-gray-400'}`}><Skull size={12} /> 敵</button>
                                    <button
                                        onClick={() => setTransSubTab('MISSING')}
                                        className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1 relative ${transSubTab === 'MISSING' ? 'bg-red-600 text-white' : 'text-red-400'}`}
                                    >
                                        <AlertCircle size={12} /> 未登録リスト
                                        {missingList.length > 0 && (
                                            <span className="absolute -top-1 -right-1 bg-white text-red-600 text-[8px] px-1 rounded-full font-black border border-red-600">
                                                {missingList.length}
                                            </span>
                                        )}
                                    </button>
                                </div>

                                <div className="bg-black/20 rounded-xl overflow-hidden border border-gray-700">
                                    {transSubTab === 'STORY' && GAME_STORIES.map(set => (
                                        <React.Fragment key={set.id}>
                                            <div className="bg-gray-800/80 p-1 px-3 text-[10px] font-black text-indigo-400 border-y border-gray-700">SET: {set.id}</div>
                                            {set.parts.map((part, i) => (
                                                <React.Fragment key={i}>
                                                    <TranslationRow original={part.title} context={`Act ${i + 1} Title`} debugLanguageMode={debugLanguageMode} />
                                                    <TranslationRow original={part.content} context={`Act ${i + 1} Content`} debugLanguageMode={debugLanguageMode} />
                                                </React.Fragment>
                                            ))}
                                        </React.Fragment>
                                    ))}

                                    {transSubTab === 'FLAVOR' && FLAVOR_TEXTS.map((text, i) => (
                                        <TranslationRow key={i} original={text} context={`Flavor ${i + 1}`} debugLanguageMode={debugLanguageMode} />
                                    ))}

                                    {transSubTab === 'CARD' && allCards.map((card, i) => (
                                        <React.Fragment key={i}>
                                            <TranslationRow original={card.name} context={`${card.type} Name`} debugLanguageMode={debugLanguageMode} />
                                            <TranslationRow original={card.description} context={`${card.name} Desc`} debugLanguageMode={debugLanguageMode} />
                                        </React.Fragment>
                                    ))}

                                    {transSubTab === 'EVENT' && EVENT_SAMPLES.map((event, i) => (
                                        <div key={i} className="border-b-2 border-indigo-900/50 bg-black/10 last:border-0">
                                            <div className="bg-indigo-950/40 p-1 px-3 text-[10px] font-black text-indigo-300">EVENT: {event.title}</div>
                                            <TranslationRow original={event.title} context="Title" debugLanguageMode={debugLanguageMode} />
                                            <TranslationRow original={event.description} context="Description" debugLanguageMode={debugLanguageMode} />
                                            {event.options.map((opt, oi) => (
                                                <div key={oi} className="ml-4 border-l-2 border-indigo-800/30">
                                                    <TranslationRow original={opt.label} context={`Option ${oi + 1} Label`} debugLanguageMode={debugLanguageMode} isInline />
                                                    <TranslationRow original={opt.text} context={`Option ${oi + 1} Explain`} debugLanguageMode={debugLanguageMode} isInline />
                                                </div>
                                            ))}
                                        </div>
                                    ))}

                                    {transSubTab === 'ENEMY' && (
                                        <>
                                            <div className="bg-gray-800/80 p-1 px-3 text-[10px] font-black text-red-400 border-y border-gray-700">LIBRARY ENEMIES</div>
                                            {(['elementary', 'high-school', 'magic'] as VisualThemeId[]).map(theme => (
                                                <React.Fragment key={theme}>
                                                    <div className="bg-gray-900/80 p-1 px-3 text-[10px] font-black text-red-300 border-y border-gray-800">THEME: {theme}</div>
                                                    {Object.values(getEnemyLibraryByTheme(theme)).map((enemy, i) => (
                                                        <TranslationRow key={`${theme}-${i}`} original={enemy.name} context={`Tier ${enemy.tier}`} debugLanguageMode={debugLanguageMode} />
                                                    ))}
                                                </React.Fragment>
                                            ))}
                                            <div className="bg-gray-800/80 p-1 px-3 text-[10px] font-black text-orange-400 border-y border-gray-700">GENERATED NAMES</div>
                                            {ENEMY_NAMES.map((name, i) => (
                                                <TranslationRow key={i} original={name} context="Random Enemy" debugLanguageMode={debugLanguageMode} />
                                            ))}
                                        </>
                                    )}

                                    {transSubTab === 'MISSING' && (
                                        <div className="p-4 flex flex-col gap-4 bg-slate-900/80 min-h-[400px]">
                                            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                                                <h3 className="text-sm font-bold text-red-400 flex items-center gap-2">
                                                    <AlertCircle size={16} /> 辞書未登録・漢字残留項目
                                                </h3>
                                                <button
                                                    onClick={copyMissingToClipboard}
                                                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full font-bold text-xs transition-all ${copied ? 'bg-green-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}
                                                >
                                                    {copied ? <Check size={14} /> : <Copy size={14} />}
                                                    {copied ? 'COPIED!' : '辞書形式でコピー'}
                                                </button>
                                            </div>
                                            <textarea
                                                readOnly
                                                className="w-full h-96 bg-black text-green-500 font-mono text-[10px] p-4 rounded border border-gray-700 focus:outline-none custom-scrollbar"
                                                value={missingList.map(item => `"${item}": "",`).join('\n')}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'SYSTEM' && (
                            <div className="space-y-6">
                                <section>
                                    <h3 className="text-amber-300 font-bold mb-4 flex items-center"><Plus size={18} className="mr-2" /> 解禁モーダル確認</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <button
                                            onClick={onAddClearCount}
                                            className="bg-amber-700 hover:bg-amber-600 text-white p-4 rounded-xl border border-amber-500 shadow-lg flex flex-col items-center gap-2 transition-transform active:scale-95"
                                        >
                                            <Plus size={32} />
                                            <div className="font-bold">主人公解禁用にクリア回数を+1</div>
                                            <div className="text-xs text-amber-100/80">現在: {clearCount} クリア</div>
                                        </button>
                                        <button
                                            onClick={onBoostMathCorrect}
                                            className="bg-cyan-700 hover:bg-cyan-600 text-white p-4 rounded-xl border border-cyan-500 shadow-lg flex flex-col items-center gap-2 transition-transform active:scale-95"
                                        >
                                            <BookOpen size={32} />
                                            <div className="font-bold">次のミニゲーム解禁まで正解数を加算</div>
                                            <div className="text-xs text-cyan-100/80">
                                                {nextMiniGameThreshold
                                                    ? `現在: ${totalMathCorrect} 問 / 次: ${nextMiniGameThreshold} 問`
                                                    : `現在: ${totalMathCorrect} 問 / 全解禁済み`}
                                            </div>
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-3">
                                        ここで増やした分は、デバッグメニューから戻った時に既存の解禁モーダルで確認できます。
                                    </p>
                                </section>

                                <section>
                                    <h3 className="text-indigo-300 font-bold mb-4 flex items-center"><Clock size={18} className="mr-2" /> 時間制限テスト</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <button
                                            onClick={addDebugTime}
                                            className="bg-indigo-700 hover:bg-indigo-600 text-white p-4 rounded-xl border border-indigo-500 shadow-lg flex flex-col items-center gap-2 transition-transform active:scale-95"
                                        >
                                            <History size={32} />
                                            <div className="font-bold">今日のプレイ時間を58分進める</div>
                                        </button>
                                        <button
                                            onClick={resetDebugTime}
                                            className="bg-slate-700 hover:bg-slate-600 text-white p-4 rounded-xl border border-slate-500 shadow-lg flex flex-col items-center gap-2 transition-transform active:scale-95"
                                        >
                                            <RotateCcw size={32} />
                                            <div className="font-bold">今日のプレイ時間をリセット</div>
                                        </button>
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeTab === 'EFFECTS' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between gap-3 border-b border-orange-700/60 pb-3">
                                    <h3 className="text-orange-300 font-bold flex items-center">
                                        <Zap size={18} className="mr-2" /> 攻撃エフェクト確認
                                    </h3>
                                    <div className="text-xs text-gray-400">攻撃15種 + 状態8種 / 各4フレーム</div>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-bold text-orange-200">
                                    <Swords size={14} /> 攻撃
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
                                    {ATTACK_EFFECT_LIST.map(effect => (
                                        <div key={effect.key} className="bg-black/35 border border-gray-700 rounded-lg p-3 flex flex-col items-center gap-2">
                                            <div className="w-32 h-32 flex items-center justify-center bg-slate-950/80 rounded overflow-hidden">
                                                <AttackEffectSprite
                                                    effectKey={effect.key}
                                                    size={128}
                                                    paused={playingEffectKey !== effect.key}
                                                    loop={false}
                                                    playToken={effectPreviewTokens[effect.key] || 0}
                                                />
                                            </div>
                                            <div className="w-full flex items-center justify-between gap-2 text-xs">
                                                <span className="font-bold text-orange-100">{effect.label}</span>
                                                <span className="text-gray-500">{effect.frames}F</span>
                                            </div>
                                            <button
                                                onClick={() => playEffectPreview(effect.key)}
                                                className="w-full bg-orange-700 hover:bg-orange-600 text-white py-1.5 rounded font-bold text-xs flex items-center justify-center gap-1"
                                            >
                                                <Volume2 size={13} /> SE
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2 text-xs font-bold text-cyan-200 pt-2 border-t border-gray-700">
                                    <Shield size={14} /> 状態変化
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
                                    {STATUS_EFFECT_LIST.map(effect => (
                                        <div key={effect.key} className="bg-black/35 border border-gray-700 rounded-lg p-3 flex flex-col items-center gap-2">
                                            <div className="w-32 h-32 flex items-center justify-center bg-slate-950/80 rounded overflow-hidden">
                                                <StatusEffectSprite
                                                    effectKey={effect.key}
                                                    size={128}
                                                    paused={playingStatusKey !== effect.key}
                                                    loop={false}
                                                    playToken={statusPreviewTokens[effect.key] || 0}
                                                />
                                            </div>
                                            <div className="w-full flex items-center justify-between gap-2 text-xs">
                                                <span className="font-bold text-cyan-100">{effect.label}</span>
                                                <span className="text-gray-500">{effect.frames}F</span>
                                            </div>
                                            <button
                                                onClick={() => playStatusPreview(effect.key)}
                                                className="w-full bg-cyan-700 hover:bg-cyan-600 text-white py-1.5 rounded font-bold text-xs flex items-center justify-center gap-1"
                                            >
                                                <Volume2 size={13} /> SE
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'PROBLEM_DEBUG' && (
                            <div className="space-y-4">
                                <div className="rounded-xl border border-lime-700/70 bg-lime-950/25 p-4">
                                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                        <div>
                                            <h3 className="flex items-center gap-2 text-sm font-black text-lime-200">
                                                <BookOpen size={18} /> 問題デバッグ
                                            </h3>
                                            <p className="mt-1 text-xs leading-relaxed text-gray-300">
                                                小中学校・高校以上の単元別に、出題される問題、選択肢、答え、動的生成問題の範囲と例を確認します。
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-2 text-[10px] font-black">
                                            <span className="rounded-full border border-lime-500/60 bg-black/40 px-3 py-1 text-lime-200">
                                                表示単元 {filteredProblemDebugUnits.length}
                                            </span>
                                            <span className="rounded-full border border-rose-500/60 bg-black/40 px-3 py-1 text-rose-200">
                                                修正チェック {problemDebugFixUnitIds.length}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[0.8fr_1fr_0.8fr_1.2fr]">
                                        <label className="flex flex-col gap-1 text-[10px] font-bold text-gray-400">
                                            区分
                                            <select
                                                value={problemDebugLevel}
                                                onChange={(event) => {
                                                    setProblemDebugLevel(event.target.value as ProblemDebugLevel);
                                                    setProblemDebugGrade('ALL');
                                                    setProblemDebugDetailUnitId(null);
                                                }}
                                                className="rounded-lg border border-lime-700 bg-slate-950 px-3 py-2 text-xs font-bold text-white"
                                            >
                                                <option value="ALL">すべて</option>
                                                <option value="LOWER">小中学校</option>
                                                <option value="UPPER">高校以上</option>
                                            </select>
                                        </label>
                                        <label className="flex flex-col gap-1 text-[10px] font-bold text-gray-400">
                                            教科・領域
                                            <select
                                                value={problemDebugGroup?.id ?? ''}
                                                onChange={(event) => {
                                                    const nextGroup = DEBUG_PROBLEM_UNIT_GROUPS.find(group => group.id === event.target.value);
                                                    setDebugProblemGroupId(event.target.value);
                                                    setDebugProblemUnitId(nextGroup?.units[0]?.id ?? '');
                                                    setProblemDebugGrade('ALL');
                                                    setProblemDebugDetailUnitId(null);
                                                }}
                                                className="rounded-lg border border-lime-700 bg-slate-950 px-3 py-2 text-xs font-bold text-white"
                                            >
                                                {problemDebugGroupOptions.map(group => (
                                                    <option key={group.id} value={group.id}>{group.name}</option>
                                                ))}
                                            </select>
                                        </label>
                                        <label className="flex flex-col gap-1 text-[10px] font-bold text-gray-400">
                                            学年
                                            <select
                                                value={problemDebugGrade}
                                                onChange={(event) => {
                                                    setProblemDebugGrade(event.target.value);
                                                    setProblemDebugDetailUnitId(null);
                                                }}
                                                className="rounded-lg border border-lime-700 bg-slate-950 px-3 py-2 text-xs font-bold text-white"
                                            >
                                                {problemDebugGradeOptions.map(grade => (
                                                    <option key={grade} value={grade}>{grade === 'ALL' ? 'すべて' : grade}</option>
                                                ))}
                                            </select>
                                        </label>
                                        <label className="flex flex-col gap-1 text-[10px] font-bold text-gray-400">
                                            検索
                                            <input
                                                value={problemDebugSearch}
                                                onChange={(event) => {
                                                    setProblemDebugSearch(event.target.value);
                                                    setProblemDebugDetailUnitId(null);
                                                }}
                                                placeholder="単元名・モードID"
                                                className="rounded-lg border border-lime-700 bg-slate-950 px-3 py-2 text-xs font-bold text-white outline-none focus:border-lime-300"
                                            />
                                        </label>
                                    </div>
                                </div>

                                {problemDebugDetailUnitId && selectedProblemDebugUnit ? (
                                    <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-4">
                                        <div className="mb-4 flex flex-col gap-3 border-b border-slate-700 pb-3 md:flex-row md:items-start md:justify-between">
                                            <div>
                                                <button
                                                    type="button"
                                                    onClick={() => setProblemDebugDetailUnitId(null)}
                                                    className="mb-2 rounded border border-slate-600 bg-slate-800 px-3 py-1 text-xs font-black text-slate-100 hover:bg-slate-700"
                                                >
                                                    ← 単元一覧へ戻る
                                                </button>
                                                <h4 className="text-base font-black text-lime-100">{selectedProblemDebugUnit.name}</h4>
                                                <div className="mt-1 text-[10px] font-mono text-slate-400">
                                                    {problemDebugGroup?.name} / {getProblemDebugGradeLabel(selectedProblemDebugUnit)} / {getProblemDebugModeList(selectedProblemDebugUnit).join(', ')}
                                                </div>
                                            </div>
                                            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-rose-700 bg-rose-950/30 px-3 py-2 text-xs font-black text-rose-100">
                                                <input
                                                    type="checkbox"
                                                    checked={problemDebugFixUnitIds.includes(selectedProblemDebugUnit.id)}
                                                    onChange={() => toggleProblemDebugFixUnit(selectedProblemDebugUnit.id)}
                                                />
                                                修正が必要
                                            </label>
                                        </div>

                                        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                                            <div className="rounded-lg border border-slate-700 bg-black/30 p-3">
                                                <div className="text-[10px] font-bold text-slate-500">出題問題数</div>
                                                <div className="mt-1 text-2xl font-black text-white">{selectedProblemDebugProblems.length}</div>
                                            </div>
                                            <div className="rounded-lg border border-slate-700 bg-black/30 p-3">
                                                <div className="text-[10px] font-bold text-slate-500">生成問題</div>
                                                <div className="mt-1 text-sm font-black text-white">{selectedProblemDebugDynamicMeta ? 'あり' : 'なし'}</div>
                                            </div>
                                            <div className="rounded-lg border border-slate-700 bg-black/30 p-3">
                                                <div className="text-[10px] font-bold text-slate-500">選択肢不足</div>
                                                <div className="mt-1 text-sm font-black text-white">
                                                    {selectedProblemDebugProblems.filter(problem => !problem.options || problem.options.length < 4).length} 件
                                                </div>
                                            </div>
                                        </div>

                                        {selectedProblemDebugDynamicMeta && (
                                            <section className="mb-4 rounded-xl border border-amber-700/70 bg-amber-950/20 p-3">
                                                <h5 className="mb-2 text-xs font-black text-amber-200">生成問題の出題範囲</h5>
                                                <p className="text-xs leading-relaxed text-amber-50/90">{selectedProblemDebugDynamicMeta.range}</p>
                                                <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                                                    {selectedProblemDebugDynamicMeta.examples.map((example, index) => (
                                                        <div key={index} className="rounded-lg border border-amber-800 bg-black/30 p-2 text-xs">
                                                            <div className="font-mono text-white">{example.question}</div>
                                                            <div className="mt-1 text-amber-200">答え: {example.answer}</div>
                                                            <div className="mt-1 text-slate-400">選択肢: {example.options.join(' / ')}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </section>
                                        )}

                                        <section className="rounded-xl border border-slate-700 bg-black/25">
                                            <div className="border-b border-slate-700 px-3 py-2 text-xs font-black text-slate-200">
                                                出題例・問題一覧
                                            </div>
                                            <div className="max-h-[560px] overflow-y-auto custom-scrollbar">
                                                {selectedProblemDebugProblems.length === 0 && !selectedProblemDebugDynamicMeta && (
                                                    <div className="p-4 text-sm text-slate-400">この単元の静的問題データは見つかりません。</div>
                                                )}
                                                {selectedProblemDebugProblems.map((problem, index) => (
                                                    <div key={`${problem.question}-${index}`} className="border-b border-slate-800 p-3 last:border-b-0">
                                                        <div className="mb-1 flex flex-wrap items-center gap-2 text-[10px] font-black text-slate-500">
                                                            <span>#{index + 1}</span>
                                                            {problem.unitLabel && <span className="rounded bg-slate-800 px-2 py-0.5 text-slate-300">{problem.unitLabel}</span>}
                                                            {problem.passageTitle && <span className="rounded bg-indigo-950 px-2 py-0.5 text-indigo-200">{problem.passageTitle}</span>}
                                                            {problem.visual && <span className="rounded bg-cyan-950 px-2 py-0.5 text-cyan-200">visual</span>}
                                                            {problem.audioPrompt && <span className="rounded bg-purple-950 px-2 py-0.5 text-purple-200">audio</span>}
                                                            {problem.speechPrompt && <span className="rounded bg-emerald-950 px-2 py-0.5 text-emerald-200">speech</span>}
                                                        </div>
                                                        {problem.passage && (
                                                            <pre className="mb-2 whitespace-pre-wrap rounded border border-slate-800 bg-slate-950 p-2 text-[11px] leading-relaxed text-slate-300">{problem.passage}</pre>
                                                        )}
                                                        <div className="whitespace-pre-wrap text-sm font-bold leading-relaxed text-white">{problem.question}</div>
                                                        <div className="mt-2 grid grid-cols-1 gap-1 md:grid-cols-2">
                                                            {(problem.options || []).map((option, optionIndex) => (
                                                                <div
                                                                    key={`${option}-${optionIndex}`}
                                                                    className={`rounded border px-2 py-1 text-xs ${option === problem.answer ? 'border-lime-400 bg-lime-950/50 text-lime-100' : 'border-slate-700 bg-slate-900 text-slate-300'}`}
                                                                >
                                                                    {optionIndex + 1}. {option}
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="mt-2 text-xs font-black text-lime-300">答え: {problem.answer}</div>
                                                        {problem.hint && <div className="mt-1 text-[11px] text-slate-400">ヒント: {problem.hint}</div>}
                                                        {problem.visual && <pre className="mt-2 overflow-x-auto rounded bg-slate-950 p-2 text-[10px] text-cyan-200">{JSON.stringify(problem.visual, null, 2)}</pre>}
                                                        {problem.speechPrompt?.examples && (
                                                            <div className="mt-2 text-[11px] text-emerald-200">
                                                                発話例: {problem.speechPrompt.examples.join(' / ')}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
                                        <section className="rounded-xl border border-slate-700 bg-slate-950/55">
                                            <div className="flex items-center justify-between gap-3 border-b border-slate-700 px-3 py-2">
                                                <h4 className="text-xs font-black text-slate-200">単元一覧</h4>
                                                <div className="text-[10px] text-slate-500">{problemDebugGroup?.name}</div>
                                            </div>
                                            <div className="max-h-[620px] overflow-y-auto custom-scrollbar">
                                                {filteredProblemDebugUnits.map(unit => {
                                                    const problemCount = getProblemsForDebugUnit(unit).length;
                                                    const dynamicMeta = DYNAMIC_MATH_DEBUG_META[unit.mode];
                                                    const checked = problemDebugFixUnitIds.includes(unit.id);
                                                    return (
                                                        <div key={unit.id} className={`grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 border-b border-slate-800 p-3 last:border-b-0 ${checked ? 'bg-rose-950/25' : 'hover:bg-white/5'}`}>
                                                            <label className="flex cursor-pointer items-start pt-1">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={checked}
                                                                    onChange={() => toggleProblemDebugFixUnit(unit.id)}
                                                                    aria-label={`${unit.name}を修正対象にする`}
                                                                />
                                                            </label>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setDebugProblemUnitId(unit.id);
                                                                    setProblemDebugDetailUnitId(unit.id);
                                                                }}
                                                                className="min-w-0 text-left"
                                                            >
                                                                <div className="text-sm font-black text-white">{unit.name}</div>
                                                                <div className="mt-1 flex flex-wrap gap-1 text-[10px] font-bold">
                                                                    <span className="rounded bg-slate-800 px-2 py-0.5 text-slate-300">{getProblemDebugGradeLabel(unit)}</span>
                                                                    <span className="rounded bg-slate-800 px-2 py-0.5 text-slate-300">{getProblemDebugModeList(unit).join(', ')}</span>
                                                                    {dynamicMeta && <span className="rounded bg-amber-900 px-2 py-0.5 text-amber-100">生成あり</span>}
                                                                </div>
                                                            </button>
                                                            <div className="flex flex-col items-end justify-center gap-1 text-right">
                                                                <div className="text-lg font-black text-lime-200">{problemCount}</div>
                                                                <div className="text-[10px] text-slate-500">問</div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                {filteredProblemDebugUnits.length === 0 && (
                                                    <div className="p-6 text-center text-sm text-slate-400">該当する単元がありません。</div>
                                                )}
                                            </div>
                                        </section>

                                        <section className="rounded-xl border border-rose-800/70 bg-rose-950/20 p-3">
                                            <div className="mb-3 flex items-center justify-between gap-2">
                                                <h4 className="text-xs font-black text-rose-200">修正が必要な単元</h4>
                                                <button
                                                    type="button"
                                                    disabled={!problemDebugFixText}
                                                    onClick={copyProblemDebugFixUnits}
                                                    className="flex items-center gap-1 rounded border border-rose-400 bg-rose-700 px-3 py-1 text-[10px] font-black text-white hover:bg-rose-600 disabled:opacity-40"
                                                >
                                                    {problemDebugFixCopied ? <Check size={12} /> : <Copy size={12} />}
                                                    {problemDebugFixCopied ? 'コピー済み' : 'コピー'}
                                                </button>
                                            </div>
                                            <textarea
                                                readOnly
                                                value={problemDebugFixText}
                                                placeholder="チェックした単元がここに TSV 形式でまとまります。"
                                                className="h-64 w-full resize-none rounded border border-rose-900 bg-black/50 p-2 font-mono text-[10px] text-rose-100 outline-none"
                                            />
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const visibleIds = filteredProblemDebugUnits.map(unit => unit.id);
                                                        setProblemDebugFixUnitIds(prev => Array.from(new Set([...prev, ...visibleIds])).sort());
                                                        setProblemDebugFixCopied(false);
                                                    }}
                                                    className="rounded border border-slate-600 bg-slate-800 px-3 py-1 text-[10px] font-bold text-slate-100 hover:bg-slate-700"
                                                >
                                                    表示中を全チェック
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const visible = new Set(filteredProblemDebugUnits.map(unit => unit.id));
                                                        setProblemDebugFixUnitIds(prev => prev.filter(id => !visible.has(id)));
                                                        setProblemDebugFixCopied(false);
                                                    }}
                                                    className="rounded border border-slate-600 bg-slate-800 px-3 py-1 text-[10px] font-bold text-slate-100 hover:bg-slate-700"
                                                >
                                                    表示中を解除
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setProblemDebugFixUnitIds([]);
                                                        setProblemDebugFixCopied(false);
                                                    }}
                                                    className="rounded border border-slate-600 bg-slate-800 px-3 py-1 text-[10px] font-bold text-slate-100 hover:bg-slate-700"
                                                >
                                                    全解除
                                                </button>
                                            </div>
                                        </section>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'UI_PREVIEW' && (
                            <div className="space-y-6">
                                <div className="rounded-xl border border-sky-700/70 bg-sky-950/30 p-4">
                                    <h3 className="flex items-center gap-2 font-bold text-sky-200">
                                        <Monitor size={20} /> UI実寸確認モード
                                    </h3>
                                    <p className="mt-2 text-xs leading-relaxed text-gray-300">
                                        選択した画面を拡大・縮小せず、現在のウィンドウサイズで表示します。画面右上のフローティングバーから別画面への切り替えとデバッグメニューへの復帰ができます。
                                    </p>
                                    <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black">
                                        <span className="rounded-full border border-emerald-500/60 bg-emerald-950 px-3 py-1 text-emerald-200">
                                            基本画面完了 {completedUiPreviewScreenCount} / {UI_PREVIEW_SCREENS.length}
                                        </span>
                                        <span className="rounded-full border border-sky-500/60 bg-sky-950 px-3 py-1 text-sky-200">
                                            保存済みチェック {totalUiPreviewChecks}
                                        </span>
                                    </div>
                                </div>
                                <section className="rounded-xl border border-emerald-600/70 bg-emerald-950/25 p-4">
                                    <h4 className="mb-3 flex items-center gap-2 text-sm font-black text-emerald-300">
                                        <BookOpen size={18} /> 問題UI・単元指定
                                    </h4>
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)_auto] md:items-end">
                                        <label className="flex min-w-0 flex-col gap-1 text-[10px] font-bold text-gray-400">
                                            教科
                                            <select
                                                value={debugProblemGroup?.id ?? ''}
                                                onChange={(event) => {
                                                    const nextGroup = DEBUG_PROBLEM_UNIT_GROUPS.find(group => group.id === event.target.value);
                                                    setDebugProblemGroupId(event.target.value);
                                                    setDebugProblemUnitId(nextGroup?.units[0]?.id ?? '');
                                                }}
                                                className="min-w-0 rounded-lg border border-emerald-700 bg-slate-950 px-3 py-2 text-xs font-bold text-white"
                                            >
                                                {DEBUG_PROBLEM_UNIT_GROUPS.map(group => (
                                                    <option key={group.id} value={group.id}>{group.name}</option>
                                                ))}
                                            </select>
                                        </label>
                                        <label className="flex min-w-0 flex-col gap-1 text-[10px] font-bold text-gray-400">
                                            単元
                                            <select
                                                value={debugProblemUnit?.id ?? ''}
                                                onChange={(event) => setDebugProblemUnitId(event.target.value)}
                                                className="min-w-0 rounded-lg border border-emerald-700 bg-slate-950 px-3 py-2 text-xs font-bold text-white"
                                            >
                                                {(debugProblemGroup?.units ?? []).map(unit => (
                                                    <option key={unit.id} value={unit.id}>{unit.name}</option>
                                                ))}
                                            </select>
                                        </label>
                                        <div className="flex flex-col gap-2">
                                            <button
                                                type="button"
                                                disabled={!debugProblemUnit}
                                                onClick={() => debugProblemUnit && onStartProblemUiPreview(debugProblemUnit.mode, debugProblemUnit.modePool)}
                                                className="rounded-lg border border-emerald-300 bg-emerald-600 px-5 py-2 text-xs font-black text-white hover:bg-emerald-500 disabled:opacity-40"
                                            >
                                                この単元を表示
                                            </button>
                                            {debugProblemUnit && renderUiPreviewChecks(`problem:${debugProblemUnit.id}`)}
                                        </div>
                                    </div>
                                </section>
                                <section className="rounded-xl border border-amber-600/70 bg-amber-950/25 p-4">
                                    <h4 className="mb-3 flex items-center gap-2 text-sm font-black text-amber-300">
                                        <HelpCircle size={18} /> イベントUI確認
                                    </h4>
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,0.7fr)_minmax(0,1.5fr)_auto] md:items-end">
                                        <label className="flex min-w-0 flex-col gap-1 text-[10px] font-bold text-gray-400">
                                            テーマ
                                            <select
                                                value={debugEventTheme}
                                                onChange={(event) => {
                                                    const theme = event.target.value as VisualThemeId;
                                                    const nextGroup = DEBUG_EVENT_GROUPS.find(group => group.id === theme);
                                                    setDebugEventTheme(theme);
                                                    setDebugEventTitle(nextGroup?.titles[0] ?? '');
                                                }}
                                                className="min-w-0 rounded-lg border border-amber-700 bg-slate-950 px-3 py-2 text-xs font-bold text-white"
                                            >
                                                {DEBUG_EVENT_GROUPS.map(group => (
                                                    <option key={group.id} value={group.id}>{group.name}</option>
                                                ))}
                                            </select>
                                        </label>
                                        <label className="flex min-w-0 flex-col gap-1 text-[10px] font-bold text-gray-400">
                                            イベント
                                            <select
                                                value={selectedDebugEventTitle}
                                                onChange={(event) => setDebugEventTitle(event.target.value)}
                                                className="min-w-0 rounded-lg border border-amber-700 bg-slate-950 px-3 py-2 text-xs font-bold text-white"
                                            >
                                                {(debugEventGroup?.titles ?? []).map(title => (
                                                    <option key={title} value={title}>{title}</option>
                                                ))}
                                            </select>
                                        </label>
                                        <div className="flex flex-col gap-2">
                                            <button
                                                type="button"
                                                disabled={!selectedDebugEventTitle}
                                                onClick={() => selectedDebugEventTitle && onStartEventUiPreview(debugEventTheme, selectedDebugEventTitle)}
                                                className="rounded-lg border border-amber-300 bg-amber-600 px-5 py-2 text-xs font-black text-white hover:bg-amber-500 disabled:opacity-40"
                                            >
                                                このイベントを表示
                                            </button>
                                            {selectedDebugEventTitle && renderUiPreviewChecks(`event:${debugEventTheme}:${selectedDebugEventTitle}`)}
                                        </div>
                                    </div>
                                </section>
                                {UI_PREVIEW_GROUPS.map(group => (
                                    <section key={group}>
                                        <h4 className="mb-3 border-b border-gray-700 pb-2 text-sm font-black text-sky-300">{group}</h4>
                                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                                            {UI_PREVIEW_SCREENS.filter(item => item.group === group).map(item => {
                                                const checklistKey = `screen:${item.id}`;
                                                const completed = UI_PREVIEW_CHECK_TARGETS.every(target => uiPreviewChecklist[checklistKey]?.[target.id]);
                                                const isFocusedPreviewItem = focusedUiPreviewScreenId === item.id;
                                                return (
                                                    <div
                                                        key={item.id}
                                                        ref={isFocusedPreviewItem ? focusedUiPreviewItemRef : undefined}
                                                        className={`flex min-h-28 flex-col rounded-xl border p-2 shadow-lg transition-colors ${completed ? 'border-emerald-500 bg-emerald-950/40' : 'border-sky-700 bg-slate-900'} ${isFocusedPreviewItem ? 'ring-2 ring-yellow-300 ring-offset-2 ring-offset-slate-950' : ''}`}
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={() => onStartUiPreview(item.screen, item.miniGameOutcome)}
                                                            className="flex min-h-16 flex-1 flex-col items-center justify-center gap-1 rounded-lg text-center text-sm font-bold text-white hover:bg-sky-900/70"
                                                        >
                                                            <Monitor size={20} className={completed ? 'text-emerald-300' : 'text-sky-300'} />
                                                            {item.label}
                                                        </button>
                                                        {renderUiPreviewChecks(checklistKey)}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </section>
                                ))}
                            </div>
                        )}

                        {activeTab === 'MAGIC_ART_AUDIT' && (
                            <div className="space-y-4">
                                <div className="rounded-xl border border-pink-700/70 bg-pink-950/30 p-4">
                                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                        <div>
                                            <h3 className="flex items-center gap-2 font-bold text-pink-200">
                                                <FileText size={20} /> マジック編 イベントイラスト不整合表
                                            </h3>
                                            <p className="mt-2 text-xs leading-relaxed text-gray-300">
                                                目視確認で髪型、髪色、服装、場面が違う画像にチェックを入れると、対象ファイルパスをまとめてコピーできます。
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-2 text-[10px] font-black">
                                            <span className="rounded-full border border-pink-500/60 bg-pink-950 px-3 py-1 text-pink-100">
                                                表示 {filteredMagicArtTargets.length} / {MAGIC_ART_CONSISTENCY_TARGETS.length}
                                            </span>
                                            <span className="rounded-full border border-red-500/60 bg-red-950 px-3 py-1 text-red-100">
                                                不整合チェック {magicArtMismatchIds.length}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_220px_auto_auto] lg:items-end">
                                        <label className="flex min-w-0 flex-col gap-1 text-[10px] font-bold text-gray-400">
                                            検索
                                            <input
                                                type="text"
                                                value={magicArtSearchTerm}
                                                onChange={(event) => setMagicArtSearchTerm(event.target.value)}
                                                placeholder="TSUBASA / SAKUYA / r6-true / ファイル名など"
                                                className="min-w-0 rounded-lg border border-pink-700 bg-slate-950 px-3 py-2 text-xs font-bold text-white outline-none focus:border-pink-300"
                                            />
                                        </label>
                                        <label className="flex min-w-0 flex-col gap-1 text-[10px] font-bold text-gray-400">
                                            種別
                                            <select
                                                value={magicArtCategoryFilter}
                                                onChange={(event) => setMagicArtCategoryFilter(event.target.value as typeof magicArtCategoryFilter)}
                                                className="min-w-0 rounded-lg border border-pink-700 bg-slate-950 px-3 py-2 text-xs font-bold text-white outline-none focus:border-pink-300"
                                            >
                                                <option value="ALL">すべて</option>
                                                <option value="COMMON_EVENT">共通イベント</option>
                                                <option value="ROMANCE_EVENT">恋愛イベント r1-r5</option>
                                                <option value="ENDING_EVENT">エンディング r6系</option>
                                            </select>
                                        </label>
                                        <button
                                            type="button"
                                            onClick={copyMagicArtMismatchTargets}
                                            disabled={!magicArtMismatchText}
                                            className="rounded-lg border border-pink-300 bg-pink-700 px-4 py-2 text-xs font-black text-white hover:bg-pink-600 disabled:border-gray-700 disabled:bg-gray-800 disabled:text-gray-500"
                                        >
                                            <span className="inline-flex items-center gap-1">
                                                {magicArtMismatchCopied ? <Check size={14} /> : <Copy size={14} />}
                                                {magicArtMismatchCopied ? 'コピー済み' : 'ファイル名コピー'}
                                            </span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMagicArtMismatchIds([]);
                                                setMagicArtMismatchCopied(false);
                                            }}
                                            disabled={magicArtMismatchIds.length === 0}
                                            className="rounded-lg border border-gray-600 bg-slate-800 px-4 py-2 text-xs font-black text-gray-200 hover:bg-slate-700 disabled:text-gray-600"
                                        >
                                            全解除
                                        </button>
                                    </div>
                                    <textarea
                                        readOnly
                                        value={magicArtMismatchText}
                                        placeholder="チェックした不整合イラストのファイルパスがここに並びます"
                                        className="mt-3 h-24 w-full resize-none rounded-lg border border-gray-700 bg-slate-950 p-3 text-[10px] leading-relaxed text-pink-50 outline-none custom-scrollbar"
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                                    {filteredMagicArtTargets.map(target => {
                                        const checked = magicArtMismatchIds.includes(target.id);
                                        const categoryLabel = target.category === 'COMMON_EVENT'
                                            ? '共通イベント'
                                            : target.category === 'ROMANCE_EVENT'
                                                ? '恋愛イベント'
                                                : 'エンディング';
                                        return (
                                            <div
                                                key={target.id}
                                                className={`grid grid-cols-[92px_minmax(0,1fr)] gap-3 rounded-xl border p-3 ${
                                                    checked ? 'border-red-500 bg-red-950/25' : 'border-gray-700 bg-black/35'
                                                }`}
                                            >
                                                <div className="flex flex-col gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setMagicArtZoomTarget({
                                                            label: target.label,
                                                            filePath: target.filePath,
                                                            expected: target.expected,
                                                        })}
                                                        className="group relative aspect-square overflow-hidden rounded-lg border border-gray-700 bg-slate-950 transition hover:border-pink-300 focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-400"
                                                        aria-label={`${target.label}を拡大表示`}
                                                    >
                                                        <img
                                                            src={assetUrl(target.filePath)}
                                                            alt={target.label}
                                                            loading="lazy"
                                                            className="h-full w-full object-contain"
                                                            onError={(event) => {
                                                                event.currentTarget.style.opacity = '0.22';
                                                            }}
                                                        />
                                                        <span className="absolute bottom-1 right-1 rounded bg-black/75 px-1.5 py-0.5 text-[9px] font-black text-white opacity-90 group-hover:bg-pink-700">
                                                            拡大
                                                        </span>
                                                    </button>
                                                    <label className="flex cursor-pointer items-center justify-center gap-1 rounded border border-red-700 bg-red-950/50 px-2 py-1 text-[10px] font-black text-red-100">
                                                        <input
                                                            type="checkbox"
                                                            checked={checked}
                                                            onChange={() => toggleMagicArtMismatch(target.id)}
                                                            className="h-4 w-4 accent-red-500"
                                                        />
                                                        不整合
                                                    </label>
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="rounded-full border border-pink-700 bg-pink-950 px-2 py-0.5 text-[10px] font-black text-pink-100">
                                                            {categoryLabel}
                                                        </span>
                                                        {target.heroId && (
                                                            <span className="rounded-full border border-slate-700 bg-slate-950 px-2 py-0.5 text-[10px] font-black text-slate-200">
                                                                {target.heroId}{target.targetId ? ` / ${target.targetId}` : ''}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="mt-2 text-sm font-black text-white">{target.label}</div>
                                                    <div className="mt-1 break-all rounded border border-gray-800 bg-slate-950 p-2 font-mono text-[10px] leading-relaxed text-pink-100">
                                                        {target.filePath}
                                                    </div>
                                                    <div className="mt-2 text-xs leading-relaxed text-gray-300">
                                                        <span className="font-black text-gray-100">確認基準: </span>{target.expected}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {magicArtZoomTarget && (
                                    <div
                                        className="fixed inset-0 z-[10070] flex items-center justify-center bg-black/92 p-3 text-white sm:p-6"
                                        role="dialog"
                                        aria-modal="true"
                                        aria-label={`${magicArtZoomTarget.label} 拡大画像`}
                                        onClick={() => setMagicArtZoomTarget(null)}
                                    >
                                        <div
                                            className="flex max-h-[96dvh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-pink-300/50 bg-slate-950 shadow-2xl"
                                            onClick={(event) => event.stopPropagation()}
                                        >
                                            <div className="flex items-start justify-between gap-3 border-b border-pink-500/30 p-3 sm:p-4">
                                                <div className="min-w-0">
                                                    <div className="truncate text-sm font-black text-pink-100 sm:text-base">{magicArtZoomTarget.label}</div>
                                                    <div className="mt-1 break-all font-mono text-[10px] leading-relaxed text-pink-200/80">{magicArtZoomTarget.filePath}</div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setMagicArtZoomTarget(null)}
                                                    className="shrink-0 rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-xs font-black text-white hover:bg-slate-800"
                                                >
                                                    閉じる
                                                </button>
                                            </div>
                                            <div className="min-h-0 flex-1 bg-black p-2 sm:p-4">
                                                <img
                                                    src={assetUrl(magicArtZoomTarget.filePath)}
                                                    alt={`${magicArtZoomTarget.label} enlarged`}
                                                    className="h-full max-h-[72dvh] w-full object-contain"
                                                />
                                            </div>
                                            <div className="border-t border-pink-500/25 bg-slate-950 p-3 text-xs leading-relaxed text-gray-200 sm:p-4">
                                                <span className="font-black text-pink-100">確認基準: </span>{magicArtZoomTarget.expected}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'ENEMY_VOICE_AUDIT' && (
                            <div className="space-y-4">
                                <div className="flex flex-col gap-3 rounded-xl border border-violet-800/70 bg-black/35 p-4">
                                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                        <div>
                                            <h3 className="flex items-center text-lg font-black text-violet-200">
                                                <Volume2 size={18} className="mr-2" /> 敵ボイス男女整合チェック
                                            </h3>
                                            <p className="mt-1 text-xs leading-relaxed text-gray-400">
                                                敵イラストを見ながら男女をチェックし、結果をTSVでコピーできます。変更が必要な行は `CHANGE` になります。
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {[
                                                { id: 'all', label: '全体' },
                                                { id: 'high-school', label: '高校編' },
                                                { id: 'magic', label: 'マジック編' },
                                            ].map(option => (
                                                <button
                                                    key={option.id}
                                                    onClick={() => setEnemyVoiceAuditTheme(option.id as typeof enemyVoiceAuditTheme)}
                                                    className={`rounded px-3 py-1.5 text-xs font-black ${enemyVoiceAuditTheme === option.id ? 'bg-violet-500 text-white' : 'bg-slate-900 text-violet-200 hover:bg-slate-800'}`}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_360px]">
                                        <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                                            <div className="rounded border border-violet-900/60 bg-slate-950 p-3">
                                                <div className="text-[10px] font-black text-gray-500">表示</div>
                                                <div className="mt-1 text-lg font-black text-white">{enemyVoiceAuditRows.length}</div>
                                            </div>
                                            <div className="rounded border border-violet-900/60 bg-slate-950 p-3">
                                                <div className="text-[10px] font-black text-gray-500">変更</div>
                                                <div className={`mt-1 text-lg font-black ${enemyVoiceAuditChangedCount > 0 ? 'text-amber-300' : 'text-emerald-300'}`}>{enemyVoiceAuditChangedCount}</div>
                                            </div>
                                            <div className="rounded border border-violet-900/60 bg-slate-950 p-3">
                                                <div className="text-[10px] font-black text-gray-500">男性</div>
                                                <div className="mt-1 text-lg font-black text-sky-200">{enemyVoiceAuditRows.filter(row => row.checkedGender === 'male').length}</div>
                                            </div>
                                            <div className="rounded border border-violet-900/60 bg-slate-950 p-3">
                                                <div className="text-[10px] font-black text-gray-500">女性</div>
                                                <div className="mt-1 text-lg font-black text-pink-200">{enemyVoiceAuditRows.filter(row => row.checkedGender === 'female').length}</div>
                                            </div>
                                        </div>
                                        <div className="space-y-2 rounded border border-violet-900/60 bg-slate-950 p-3">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="text-xs font-black text-violet-100">コピー結果</div>
                                                <button
                                                    onClick={copyEnemyVoiceAuditResults}
                                                    className="flex items-center gap-1 rounded bg-violet-700 px-3 py-1.5 text-xs font-black text-white hover:bg-violet-600"
                                                >
                                                    {enemyVoiceAuditCopied ? <Check size={13} /> : <Copy size={13} />}
                                                    {enemyVoiceAuditCopied ? 'コピー済み' : 'TSVコピー'}
                                                </button>
                                            </div>
                                            <textarea
                                                readOnly
                                                value={enemyVoiceAuditCopyText}
                                                className="h-28 w-full resize-none rounded border border-violet-900/60 bg-black/60 p-2 font-mono text-[10px] leading-relaxed text-violet-50 outline-none"
                                            />
                                            <button
                                                onClick={() => {
                                                    setEnemyVoiceGenderOverrides({});
                                                    setEnemyVoiceAuditCopied(false);
                                                }}
                                                disabled={Object.keys(enemyVoiceGenderOverrides).length === 0}
                                                className="w-full rounded bg-slate-800 py-1.5 text-[10px] font-black text-gray-200 hover:bg-slate-700 disabled:text-gray-600"
                                            >
                                                チェックを初期状態へ戻す
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                                    {enemyVoiceAuditRows.map(({ profile, checkedGender, changed }) => {
                                        const variant = profile.theme === 'high-school'
                                            ? HIGH_SCHOOL_HUMANOID_ENEMY_VARIANTS.find(entry => entry.name === profile.name)
                                            : MAGIC_HUMANOID_ENEMY_VARIANTS.find(entry => entry.name === profile.name);
                                        return (
                                            <div
                                                key={profile.id}
                                                className={`rounded-xl border p-3 ${changed ? 'border-amber-400 bg-amber-950/25' : 'border-violet-900/60 bg-black/35'}`}
                                            >
                                                <div className="flex gap-3">
                                                    <div className="relative h-24 w-24 shrink-0 rounded-lg border border-slate-700 bg-slate-950">
                                                        <EnemyIllustration
                                                            name={profile.name}
                                                            seed={`${profile.theme}-${profile.name}`}
                                                            visualTheme={profile.theme}
                                                            enemyType="GENERIC"
                                                            className="h-full w-full"
                                                            size={14}
                                                        />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="truncate text-sm font-black text-white">{profile.name}</div>
                                                        <div className="mt-1 text-[10px] font-mono text-gray-500">{profile.theme} / {profile.id} / img {variant?.imageIndex ?? '-'}</div>
                                                        <div className="mt-2 text-[11px] text-gray-300">
                                                            現在: <span className={profile.gender === 'male' ? 'text-sky-300' : 'text-pink-300'}>{profile.gender === 'male' ? '男性' : '女性'}</span>
                                                        </div>
                                                        <div className="text-[11px] text-gray-400">話者: <span className="font-mono text-violet-200">{profile.speakerId}</span></div>
                                                    </div>
                                                </div>
                                                <div className="mt-3 grid grid-cols-2 gap-2">
                                                    <button
                                                        onClick={() => setEnemyVoiceAuditGender(profile, 'male')}
                                                        className={`rounded border px-2 py-2 text-xs font-black ${checkedGender === 'male' ? 'border-sky-300 bg-sky-600 text-white' : 'border-slate-700 bg-slate-900 text-sky-200 hover:bg-slate-800'}`}
                                                    >
                                                        男性
                                                    </button>
                                                    <button
                                                        onClick={() => setEnemyVoiceAuditGender(profile, 'female')}
                                                        className={`rounded border px-2 py-2 text-xs font-black ${checkedGender === 'female' ? 'border-pink-300 bg-pink-600 text-white' : 'border-slate-700 bg-slate-900 text-pink-200 hover:bg-slate-800'}`}
                                                    >
                                                        女性
                                                    </button>
                                                </div>
                                                <div className="mt-2 flex gap-2">
                                                    <button
                                                        onClick={() => audioService.playHumanoidEnemyVoice(profile.theme, profile.name, 'spawn')}
                                                        className="flex flex-1 items-center justify-center gap-1 rounded bg-violet-800 py-1.5 text-[10px] font-black text-white hover:bg-violet-700"
                                                    >
                                                        <Volume2 size={12} /> 出現声
                                                    </button>
                                                    <button
                                                        onClick={() => resetEnemyVoiceAuditGender(profile)}
                                                        disabled={!enemyVoiceGenderOverrides[profile.id]}
                                                        className="rounded bg-slate-800 px-2 py-1.5 text-[10px] font-black text-gray-200 hover:bg-slate-700 disabled:text-gray-600"
                                                    >
                                                        戻す
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {activeTab === 'MAGIC_VOICES' && (
                            <div className="space-y-6">
                                <section className="space-y-4">
                                    <div className="flex items-center justify-between gap-3 border-b border-fuchsia-700/60 pb-3">
                                        <h3 className="text-fuchsia-300 font-bold flex items-center">
                                            <Volume2 size={18} className="mr-2" /> マジック編 戦闘ボイス確認
                                        </h3>
                                        <div className="text-xs text-gray-400">17人 / attack・damage・spell / 変身後エフェクト</div>
                                    </div>
                                    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
                                        <div className="bg-black/35 border border-gray-700 rounded-lg p-3 space-y-2">
                                            <div className="text-xs font-bold text-gray-400">キャラクター</div>
                                            <select
                                                value={magicVoiceHeroId}
                                                onChange={(event) => setMagicVoiceHeroId(event.target.value)}
                                                className="w-full bg-slate-950 border border-fuchsia-700/70 rounded px-3 py-2 text-sm font-bold text-white outline-none focus:border-fuchsia-300"
                                            >
                                                {MAGIC_VOICE_CHARACTERS.map(hero => (
                                                    <option key={hero.id} value={hero.id}>{hero.name} / {hero.id}</option>
                                                ))}
                                            </select>
                                            <div className="rounded border border-fuchsia-900/60 bg-fuchsia-950/20 p-3">
                                                <div className="text-base font-black text-white">{selectedMagicVoiceHero.name}</div>
                                                <div className="text-xs text-fuchsia-200">{selectedMagicVoiceHero.label}</div>
                                                <div className="mt-2 text-[10px] text-gray-500 font-mono">{selectedMagicVoiceHero.id}</div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            {MAGIC_BATTLE_VOICE_GROUPS.map(group => (
                                                <div key={group.title} className="bg-black/35 border border-gray-700 rounded-lg p-3">
                                                    <div className="mb-2 text-sm font-black text-fuchsia-100">{group.title}</div>
                                                    <div className="space-y-2">
                                                        {group.files.map(file => (
                                                            <button
                                                                key={file}
                                                                onClick={() => audioService.playMagicVoiceFile(magicVoiceHeroId, file, 2200, true)}
                                                                className="w-full bg-fuchsia-800 hover:bg-fuchsia-700 text-white py-2 rounded font-bold text-xs flex items-center justify-center gap-2"
                                                            >
                                                                <Volume2 size={13} /> {file}.ogg
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-4">
                                    <div className="flex items-center justify-between gap-3 border-b border-sky-700/60 pb-3">
                                        <h3 className="text-sky-300 font-bold flex items-center">
                                            <Volume2 size={18} className="mr-2" /> 高校編 戦闘ボイス確認
                                        </h3>
                                        <div className="text-xs text-gray-400">9人 / 8カテゴリ / 各5種 / 要修正 {highSchoolVoiceFixTargets.length}</div>
                                    </div>
                                    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
                                        <div className="bg-black/35 border border-gray-700 rounded-lg p-3 space-y-2">
                                            <div className="text-xs font-bold text-gray-400">キャラクター</div>
                                            <select
                                                value={highSchoolVoiceHeroId}
                                                onChange={(event) => setHighSchoolVoiceHeroId(event.target.value)}
                                                className="w-full bg-slate-950 border border-sky-700/70 rounded px-3 py-2 text-sm font-bold text-white outline-none focus:border-sky-300"
                                            >
                                                {HIGH_SCHOOL_VOICE_CHARACTERS.map(hero => (
                                                    <option key={hero.id} value={hero.id}>{hero.name} / {hero.id}</option>
                                                ))}
                                            </select>
                                            <div className="rounded border border-sky-900/60 bg-sky-950/20 p-3">
                                                <div className="text-base font-black text-white">{selectedHighSchoolVoiceHero.name}</div>
                                                <div className="text-xs text-sky-200">{selectedHighSchoolVoiceHero.label}</div>
                                                <div className="mt-2 text-[10px] text-gray-500 font-mono">{selectedHighSchoolVoiceHero.id}</div>
                                            </div>
                                            <div className="rounded border border-gray-700 bg-black/40 p-3 space-y-2">
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="text-xs font-black text-sky-100">要修正リスト</div>
                                                    <button
                                                        onClick={copyHighSchoolVoiceFixTargets}
                                                        disabled={!highSchoolVoiceFixText}
                                                        className="bg-sky-800 hover:bg-sky-700 disabled:bg-gray-700 disabled:text-gray-500 text-white px-2 py-1 rounded font-bold text-[10px] flex items-center gap-1"
                                                    >
                                                        {highSchoolVoiceFixCopied ? <Check size={12} /> : <Copy size={12} />}
                                                        {highSchoolVoiceFixCopied ? 'コピー済み' : 'コピー'}
                                                    </button>
                                                </div>
                                                <textarea
                                                    readOnly
                                                    value={highSchoolVoiceFixText}
                                                    placeholder="要修正にチェックしたボイスがここに並びます"
                                                    className="h-28 w-full resize-none rounded border border-gray-700 bg-slate-950 p-2 text-[10px] leading-relaxed text-sky-50 outline-none"
                                                />
                                                <button
                                                    onClick={() => setHighSchoolVoiceFixTargets([])}
                                                    disabled={highSchoolVoiceFixTargets.length === 0}
                                                    className="w-full bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-600 text-gray-200 py-1.5 rounded font-bold text-[10px]"
                                                >
                                                    チェックを全解除
                                                </button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                                            {HIGH_SCHOOL_BATTLE_VOICE_GROUPS.map(group => (
                                                <div key={group.title} className="bg-black/35 border border-gray-700 rounded-lg p-3">
                                                    <div className="mb-2 text-sm font-black text-sky-100">{group.title}</div>
                                                    <div className="space-y-2">
                                                        {group.files.map(file => {
                                                            const fixKey = `${highSchoolVoiceHeroId}/${file}`;
                                                            const needsFix = highSchoolVoiceFixTargets.includes(fixKey);
                                                            return (
                                                                <div key={file} className={`rounded border p-2 ${needsFix ? 'border-red-500 bg-red-950/35' : 'border-sky-900/50 bg-slate-950/45'}`}>
                                                                    <button
                                                                        onClick={() => audioService.playHighSchoolVoiceFile(highSchoolVoiceHeroId, file)}
                                                                        className="w-full bg-sky-800 hover:bg-sky-700 text-white py-2 rounded font-bold text-xs flex items-center justify-center gap-2"
                                                                    >
                                                                        <Volume2 size={13} /> {file}.ogg
                                                                    </button>
                                                                    <label className="mt-2 flex items-center justify-center gap-2 text-[10px] font-bold text-red-200">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={needsFix}
                                                                            onChange={() => toggleHighSchoolVoiceFixTarget(highSchoolVoiceHeroId, file)}
                                                                            className="h-4 w-4 accent-red-500"
                                                                        />
                                                                        要修正
                                                                    </label>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-4">
                                    <div className="flex items-center justify-between gap-3 border-b border-purple-700/60 pb-3">
                                        <h3 className="text-purple-300 font-bold flex items-center">
                                            <MessageSquare size={18} className="mr-2" /> 恋愛イベント ボイス確認
                                        </h3>
                                        <button
                                            onClick={playMagicEventVoiceSequence}
                                            className="bg-purple-700 hover:bg-purple-600 text-white px-3 py-1.5 rounded font-bold text-xs flex items-center gap-1"
                                        >
                                            <Volume2 size={13} /> 全行再生
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
                                        <div className="bg-black/35 border border-gray-700 rounded-lg p-3 space-y-3">
                                            <label className="block space-y-1">
                                                <span className="text-xs font-bold text-gray-400">主人公</span>
                                                <select
                                                    value={magicVoiceEventHeroId}
                                                    onChange={(event) => handleMagicVoiceEventHeroChange(event.target.value)}
                                                    className="w-full bg-slate-950 border border-purple-700/70 rounded px-3 py-2 text-sm font-bold text-white outline-none focus:border-purple-300"
                                                >
                                                    {MAGIC_VOICE_CHARACTERS.map(hero => (
                                                        <option key={hero.id} value={hero.id}>{hero.name} / {hero.id}</option>
                                                    ))}
                                                </select>
                                            </label>
                                            <label className="block space-y-1">
                                                <span className="text-xs font-bold text-gray-400">相手</span>
                                                <select
                                                    value={normalizedMagicVoiceEventTargetId}
                                                    onChange={(event) => setMagicVoiceEventTargetId(event.target.value)}
                                                    className="w-full bg-slate-950 border border-purple-700/70 rounded px-3 py-2 text-sm font-bold text-white outline-none focus:border-purple-300"
                                                >
                                                    {eventTargetOptions.map(target => (
                                                        <option key={target.id} value={target.id}>{target.name} / {target.id}</option>
                                                    ))}
                                                </select>
                                            </label>
                                            <label className="block space-y-1">
                                                <span className="text-xs font-bold text-gray-400">段階</span>
                                                <select
                                                    value={magicVoiceEventStage}
                                                    onChange={(event) => setMagicVoiceEventStage(Number(event.target.value))}
                                                    className="w-full bg-slate-950 border border-purple-700/70 rounded px-3 py-2 text-sm font-bold text-white outline-none focus:border-purple-300"
                                                >
                                                    {[0, 1, 2, 3, 4].map(stage => (
                                                        <option key={stage} value={stage}>第{stage + 1}段階 / r{stage + 1}</option>
                                                    ))}
                                                </select>
                                            </label>
                                            <div className="rounded border border-purple-900/60 bg-purple-950/20 p-3">
                                                <div className="text-sm font-black text-white">{magicVoiceEventDialogue.title}</div>
                                                <div className="mt-1 text-[10px] text-gray-500 font-mono">
                                                    romance-{magicVoiceEventHeroId.toLowerCase()}-{normalizedMagicVoiceEventTargetId.toLowerCase()}-r{magicVoiceEventStage + 1}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            {magicVoiceEventLines.map((line, index) => (
                                                <div key={line.lineId} className="rounded-lg border border-gray-700 bg-black/35 p-3">
                                                    <div className="mb-2 flex items-center justify-between gap-2">
                                                        <div className="min-w-0">
                                                            <div className="text-xs font-black text-purple-200">{line.heroId} / {line.lineId}.ogg</div>
                                                            <div className="mt-1 text-sm text-gray-100 leading-relaxed">
                                                                {magicVoiceEventQuotedLines[index]?.[1]}「{magicVoiceEventQuotedLines[index]?.[2]}」
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => audioService.playMagicEventVoice(line.heroId, line.lineId)}
                                                            className="shrink-0 bg-purple-800 hover:bg-purple-700 text-white px-3 py-2 rounded font-bold text-xs flex items-center gap-1"
                                                        >
                                                            <Volume2 size={13} /> 再生
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-4">
                                    <div className="flex items-center justify-between gap-3 border-b border-pink-700/60 pb-3">
                                        <h3 className="text-pink-300 font-bold flex items-center">
                                            <Sparkles size={18} className="mr-2" /> クリア後エンディング ボイス確認
                                        </h3>
                                        <button
                                            onClick={playMagicEndingVoiceSequence}
                                            className="bg-pink-700 hover:bg-pink-600 text-white px-3 py-1.5 rounded font-bold text-xs flex items-center gap-1"
                                        >
                                            <Volume2 size={13} /> 全行再生
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
                                        <div className="bg-black/35 border border-gray-700 rounded-lg p-3 space-y-3">
                                            <label className="block space-y-1">
                                                <span className="text-xs font-bold text-gray-400">エンド種別</span>
                                                <select
                                                    value={magicVoiceEndingRank}
                                                    onChange={(event) => setMagicVoiceEndingRank(event.target.value as MagicRomanceEndingRank)}
                                                    className="w-full bg-slate-950 border border-pink-700/70 rounded px-3 py-2 text-sm font-bold text-white outline-none focus:border-pink-300"
                                                >
                                                    <option value="BOND">絆エンド</option>
                                                    <option value="SPECIAL">特別な関係エンド</option>
                                                    <option value="ROMANCE">恋愛エンド</option>
                                                    <option value="TRUE_ROMANCE">真恋愛エンド</option>
                                                </select>
                                            </label>
                                            <div className="rounded border border-pink-900/60 bg-pink-950/20 p-3">
                                                <div className="text-sm font-black text-white">{magicVoiceEnding.title}</div>
                                                <div className="mt-1 text-xs text-pink-200">{magicVoiceEnding.rankLabel}</div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            {magicVoiceEndingLines.map((line, index) => (
                                                <div key={`${index}-${line.voiceLine?.lineId ?? line.text}`} className="rounded-lg border border-gray-700 bg-black/35 p-3">
                                                    <div className="mb-2 flex items-center justify-between gap-2">
                                                        <div className="min-w-0">
                                                            <div className="text-xs font-black text-pink-200">
                                                                {line.voiceLine ? `${line.voiceLine.heroId} / ${line.voiceLine.lineId}.ogg` : 'ボイスなし'}
                                                            </div>
                                                            <div className="mt-1 text-sm text-gray-100 leading-relaxed">{line.text}</div>
                                                        </div>
                                                        {line.voiceLine && (
                                                            <button
                                                                onClick={() => audioService.playMagicEventVoice(line.voiceLine?.heroId, line.voiceLine?.lineId)}
                                                                className="shrink-0 bg-pink-800 hover:bg-pink-700 text-white px-3 py-2 rounded font-bold text-xs flex items-center gap-1"
                                                            >
                                                                <Volume2 size={13} /> 再生
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeTab === 'EVENTS' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between gap-3 border-b border-cyan-700/60 pb-3">
                                    <h3 className="text-cyan-300 font-bold flex items-center">
                                        <HelpCircle size={18} className="mr-2" /> 高校編イベント確認
                                    </h3>
                                    <div className="text-xs text-gray-400">
                                        通常{HIGH_SCHOOL_EVENT_THEMES.length}件 / NPC{HIGH_SCHOOL_SUPPORTER_NPC_EVENTS.length}件
                                    </div>
                                </div>
                                <section className="rounded-xl border border-fuchsia-500/70 bg-fuchsia-950/20 p-4">
                                    <div className="mb-3">
                                        <h4 className="text-sm font-black text-fuchsia-200">クラウドファンディング ボス導線</h4>
                                        <p className="mt-1 text-xs text-gray-400">遭遇イベントからボス戦まで、各段階を直接起動して確認できます。</p>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                                        <div className="overflow-hidden rounded-lg border border-amber-600/70 bg-black/35">
                                            <img src={assetUrl('event-illustrations/あずきとの出会い.webp')} alt="あずきとの出会い" className="aspect-square w-full object-cover" />
                                            <div className="space-y-2 p-3">
                                                <div className="font-black text-amber-200">あずき</div>
                                                <button type="button" onClick={() => onStartEventUiPreview('high-school', 'あずきとの出会い')} className="w-full rounded-lg border border-amber-300 bg-amber-700 px-3 py-2 text-xs font-black text-white hover:bg-amber-600">出会いイベントを開始</button>
                                                <button type="button" onClick={() => onStartCrowdfundingBoss('AZUKI')} className="w-full rounded-lg border border-red-300 bg-red-800 px-3 py-2 text-xs font-black text-white hover:bg-red-700">あずき戦〜特別カード報酬を確認</button>
                                            </div>
                                        </div>
                                        <div className="overflow-hidden rounded-lg border border-violet-600/70 bg-black/35">
                                            <img src={assetUrl('event-illustrations/dodomedesu-event-5.webp')} alt="ドドメデス覚醒" className="aspect-square w-full object-cover" />
                                            <div className="space-y-2 p-3">
                                                <div className="font-black text-violet-200">ドドメデス＆ゲンゾー</div>
                                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                                    {DODOMEDESU_EVENT_STAGES.map((stage, index) => (
                                                        <button key={stage.title} type="button" onClick={() => onStartEventUiPreview('high-school', stage.title)} className="rounded-lg border border-violet-400 bg-violet-900 px-3 py-2 text-left text-xs font-bold text-white hover:bg-violet-800">第{index + 1}段階: {stage.title}</button>
                                                    ))}
                                                </div>
                                                <button type="button" onClick={() => onStartCrowdfundingBoss('DODOMEDESU')} className="w-full rounded-lg border border-red-300 bg-red-800 px-3 py-2 text-xs font-black text-white hover:bg-red-700">ドドメデス戦〜特別カード報酬を確認</button>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                                <section className="rounded-xl border border-yellow-600/70 bg-yellow-950/20 p-4">
                                    <div className="mb-3 flex items-center justify-between gap-3">
                                        <div>
                                            <h4 className="text-sm font-black text-yellow-200">支援NPCイベント動作確認</h4>
                                            <p className="mt-1 text-xs text-gray-400">
                                                高校編エンドレスの？マスに出るNPCイベントを個別に起動します。
                                            </p>
                                        </div>
                                        <div className="shrink-0 text-xs font-bold text-yellow-300">{HIGH_SCHOOL_SUPPORTER_NPC_EVENTS.length}件</div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                                        {HIGH_SCHOOL_SUPPORTER_NPC_EVENTS.map(event => {
                                            const isFocusedSupporterNpcEvent = focusedSupporterNpcEventTitle === event.title;
                                            return (
                                            <div
                                                key={event.id}
                                                ref={isFocusedSupporterNpcEvent ? focusedSupporterNpcEventRef : undefined}
                                                className={`overflow-hidden rounded-lg border bg-black/35 ${isFocusedSupporterNpcEvent ? 'border-yellow-200 ring-2 ring-yellow-300 ring-offset-2 ring-offset-slate-950' : 'border-yellow-700/70'}`}
                                            >
                                                <div className="aspect-square bg-slate-950">
                                                    <img
                                                        src={assetUrl(`sprites/high-school/supporter-npcs/${event.imageFile}`)}
                                                        alt={event.npcName}
                                                        className="h-full w-full object-cover"
                                                        draggable={false}
                                                    />
                                                </div>
                                                <div className="space-y-2 p-3">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="min-w-0">
                                                            <div className="text-[10px] font-black text-yellow-300">{event.npcName}</div>
                                                            <div className="truncate font-bold text-white">{event.title}</div>
                                                        </div>
                                                        <div className="shrink-0 rounded-full border border-yellow-500/60 px-2 py-1 text-[10px] font-bold text-yellow-100">
                                                            {event.questions.length}問
                                                        </div>
                                                    </div>
                                                    <div className="text-[11px] font-bold text-cyan-200">
                                                        報酬: {SUPPORTER_NPC_REWARD_LABELS[event.reward]}
                                                    </div>
                                                    <p className="line-clamp-3 text-xs leading-relaxed text-gray-300">{event.description}</p>
                                                    <button
                                                        type="button"
                                                        onClick={() => onStartEventUiPreview('high-school', event.title)}
                                                        className="w-full rounded-lg border border-yellow-300 bg-yellow-600 px-4 py-2 text-xs font-black text-slate-950 hover:bg-yellow-400"
                                                    >
                                                        このNPCイベントを開始
                                                    </button>
                                                    {renderUiPreviewChecks(`event:high-school:${event.title}`)}
                                                </div>
                                            </div>
                                            );
                                        })}
                                    </div>
                                </section>
                                <div className="flex items-center justify-between gap-3 border-b border-cyan-700/40 pb-2 pt-2">
                                    <h4 className="text-sm font-black text-cyan-300">通常イベント素材</h4>
                                    <div className="text-xs text-gray-400">{HIGH_SCHOOL_EVENT_THEMES.length}件</div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {HIGH_SCHOOL_EVENT_THEMES.map(event => (
                                        <div key={event.imageIndex} className="bg-black/35 border border-gray-700 rounded-lg overflow-hidden">
                                            <div className="aspect-square bg-slate-950 overflow-hidden">
                                                <img
                                                    src={assetUrl(`sprites/high-school/events/${event.imageIndex}.webp`)}
                                                    alt={event.title}
                                                    className={`w-full h-full object-cover ${event.imageIndex < 18 ? 'scale-[1.18]' : ''}`}
                                                />
                                            </div>
                                            <div className="p-3 space-y-1">
                                                <div className="text-xs text-cyan-400 font-bold">#{event.imageIndex}</div>
                                                <div className="font-bold text-white">{event.title}</div>
                                                <div className="text-xs text-gray-300 leading-relaxed">{event.description}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'HUMANOID_SPRITES' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between gap-3 border-b border-rose-700/60 pb-3">
                                    <h3 className="text-rose-300 font-bold flex items-center">
                                        <Skull size={18} className="mr-2" /> 高校編 人型敵スプライト確認
                                    </h3>
                                    <div className="text-xs text-gray-400">{HIGH_SCHOOL_HUMANOID_ENEMY_VARIANTS.length}体 / idle・attack・skill</div>
                                </div>
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                    {HIGH_SCHOOL_HUMANOID_ENEMY_VARIANTS.map(enemy => (
                                        <div key={enemy.imageIndex} className="bg-black/35 border border-gray-700 rounded-lg p-3">
                                            <div className="flex items-center justify-between gap-3 mb-3">
                                                <div className="min-w-0">
                                                    <div className="text-xs text-rose-400 font-bold">#{enemy.imageIndex}</div>
                                                    <div className="font-bold text-white truncate">{enemy.name}</div>
                                                </div>
                                                <div className="text-[10px] text-gray-500 font-mono shrink-0">high-school humanoid</div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                                {HIGH_SCHOOL_HUMANOID_ACTIONS.map(action => (
                                                    <div key={action.key} className="bg-slate-950/80 border border-gray-800 rounded p-2">
                                                        <div className="aspect-square bg-[linear-gradient(45deg,#111827_25%,#0f172a_25%,#0f172a_50%,#111827_50%,#111827_75%,#0f172a_75%)] bg-[length:16px_16px] rounded relative overflow-hidden">
                                                            <img
                                                                src={assetUrl(`sprites/high-school/${action.folder}/${enemy.imageIndex}.webp`)}
                                                                alt={`${enemy.name} ${action.label}`}
                                                                className="absolute inset-0 w-full h-full object-contain"
                                                                draggable={false}
                                                            />
                                                        </div>
                                                        <div className="mt-1 text-center text-[10px] font-bold text-gray-300">{action.label}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'SYNTHESIS' && (
                            <div className="mb-8 border-b-2 border-purple-500 pb-4">
                                <h3 className="text-purple-300 font-bold mb-4 flex items-center text-sm md:text-base"><Beaker className="mr-2" /> SYNTHESIS LAB</h3>
                                <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-4 bg-black/40 p-4 rounded-xl">
                                    <div className="flex gap-4">
                                        <div
                                            className="w-20 h-32 md:w-24 md:h-36 border-2 border-dashed border-gray-500 rounded flex items-center justify-center cursor-pointer hover:border-purple-400 bg-gray-900"
                                            onClick={() => setSynthSlot1(null)}
                                        >
                                            {synthSlot1 ? (
                                                <div className="scale-[0.6] md:scale-75 pointer-events-none"><Card card={synthSlot1} onClick={() => { }} disabled={false} languageMode={initialLanguageMode} /></div>
                                            ) : (
                                                <span className="text-gray-600 text-xs">Slot 1</span>
                                            )}
                                        </div>
                                        <div className="flex items-center"><Plus size={20} className="text-gray-500" /></div>
                                        <div
                                            className="w-20 h-32 md:w-24 md:h-36 border-2 border-dashed border-gray-500 rounded flex items-center justify-center cursor-pointer hover:border-purple-400 bg-gray-900"
                                            onClick={() => setSynthSlot2(null)}
                                        >
                                            {synthSlot2 ? (
                                                <div className="scale-[0.6] md:scale-75 pointer-events-none"><Card card={synthSlot2} onClick={() => { }} disabled={false} languageMode={initialLanguageMode} /></div>
                                            ) : (
                                                <span className="text-gray-600 text-xs">Slot 2</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-row md:flex-col gap-2 items-center">
                                        <button
                                            onClick={performSynthesis}
                                            disabled={!synthSlot1 || !synthSlot2}
                                            className={`px-4 py-2 rounded font-bold text-xs md:text-sm ${!synthSlot1 || !synthSlot2 ? 'bg-gray-700 text-gray-500' : 'bg-purple-600 text-white hover:bg-purple-500 animate-pulse'}`}
                                        >
                                            Mix
                                        </button>
                                        <button
                                            onClick={() => { setSynthSlot1(null); setSynthSlot2(null); setSynthResult(null); }}
                                            className="text-gray-500 hover:text-white text-xs flex items-center justify-center"
                                        >
                                            <RotateCcw size={12} className="mr-1" /> やめる
                                        </button>
                                    </div>

                                    {synthResult && (
                                        <>
                                            <ArrowRight size={24} className="text-purple-400 rotate-90 md:rotate-0" />
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="scale-[0.8] md:scale-90"><Card card={synthResult} onClick={() => { }} disabled={false} languageMode={initialLanguageMode} /></div>
                                                <button
                                                    onClick={addSynthToDeck}
                                                    className="bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold w-full"
                                                >
                                                    ゲット
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="rounded-xl border border-purple-700/70 bg-purple-950/20 p-4">
                                    <div className="mb-3 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
                                        <div>
                                            <h4 className="text-sm font-black text-purple-100">合成過多カード再現</h4>
                                            <p className="text-[10px] leading-relaxed text-purple-200/70">
                                                効果値の上限なしで、重い合成カードを直接作成します。主に戦闘時の大量ヒット・大量生成・元カード名肥大の検証用です。
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={setStressSynthCardAsResult}
                                                className="rounded bg-purple-700 px-3 py-2 text-xs font-black text-white hover:bg-purple-600"
                                            >
                                                結果に反映
                                            </button>
                                            <button
                                                type="button"
                                                onClick={addStressSynthCardToDeck}
                                                className="rounded bg-emerald-600 px-3 py-2 text-xs font-black text-white hover:bg-emerald-500"
                                            >
                                                デッキへ追加
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2">
                                        {renderStressNumberInput('ヒット数', stressHitCount, setStressHitCount, 'playCopies + 1')}
                                        {renderStressNumberInput('1ヒット威力', stressDamage, setStressDamage)}
                                        {renderStressNumberInput('即時ドロー', stressDraw, setStressDraw)}
                                        {renderStressNumberInput('手札生成', stressAddHand, setStressAddHand, 'SHIV')}
                                        {renderStressNumberInput('山札生成', stressAddDraw, setStressAddDraw, 'WOUND')}
                                        {renderStressNumberInput('捨て札生成', stressAddDiscard, setStressAddDiscard, 'BURN')}
                                        {renderStressNumberInput('次ターンドロー', stressNextTurnDraw, setStressNextTurnDraw)}
                                        {renderStressNumberInput('使用後ドロー', stressBattleBonusDraw, setStressBattleBonusDraw)}
                                        {renderStressNumberInput('元カード名数', stressOriginalNameCount, setStressOriginalNameCount, 'originalNames')}
                                    </div>
                                </div>
                            </div>
                        )}

                        {(activeTab === 'CARDS' || activeTab === 'SYNTHESIS') && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                                {filteredCards.map((c, idx) => (
                                    <div key={idx} className="cursor-pointer hover:scale-105 transition-transform flex justify-center" onClick={() => handleAddCard(c)}>
                                        <div className="scale-90 origin-top pointer-events-none -mb-4">
                                            <Card card={{ ...c, id: 'temp' }} onClick={() => { }} disabled={false} languageMode={initialLanguageMode} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'RELICS' && (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                                {allRelics.map((r) => {
                                    const isSelected = selectedRelics.some(sr => sr.id === r.id);
                                    return (
                                        <div
                                            key={r.id}
                                            onClick={() => toggleRelic(r)}
                                            className={`p-2 rounded border cursor-pointer flex flex-col items-center text-center transition-all ${isSelected ? 'bg-yellow-900/50 border-yellow-400 scale-105' : 'bg-black/40 border-gray-700 hover:border-gray-500'}`}
                                        >
                                            <Gem size={20} className={isSelected ? "text-yellow-400" : "text-gray-500"} />
                                            <span className="text-[10px] mt-1 font-bold leading-tight">{trans(r.name, initialLanguageMode)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {activeTab === 'POTIONS' && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {allPotions.map((p, idx) => {
                                    const isOwned = selectedPotions.some(sp => sp.templateId === p.templateId);
                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => togglePotion(p)}
                                            className={`p-2 rounded border transition-all bg-black/40 cursor-pointer flex flex-col items-center text-center ${isOwned ? 'border-indigo-400 bg-indigo-900/20' : 'border-gray-700 hover:border-white'}`}
                                        >
                                            <FlaskConical size={20} style={{ color: p.color }} />
                                            <span className="text-[10px] mt-1 font-bold">{trans(p.name, initialLanguageMode)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {showLoadoutPanel && (
                <div className="w-full md:w-1/4 h-[40%] md:h-full flex flex-col bg-black/20 text-xs min-h-0">
                    <div className="p-2 bg-black/50 border-b border-gray-700 font-bold text-gray-300 text-[10px] md:text-xs shrink-0">
                        LOADOUT
                    </div>
                    <div className="flex-grow overflow-y-auto p-2 md:p-3 custom-scrollbar space-y-4">
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <h3 className="font-bold text-blue-300 flex items-center text-[10px] md:text-xs"><Swords size={12} className="mr-1" /> デッキ ({selectedDeck.length})</h3>
                                <button onClick={clearDeck} className="text-[10px] text-red-400 hover:text-red-200">Clear</button>
                            </div>
                            <div className="space-y-1">
                                {selectedDeck.map((c, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-gray-800 p-1 rounded border border-gray-700 group">
                                        <span className={`truncate text-[10px] ${c.holographic ? 'text-cyan-200' : c.type === CardType.ATTACK ? 'text-red-300' : c.type === CardType.SKILL ? 'text-blue-300' : 'text-yellow-300'}`}>
                                            {c.holographic ? 'キラ ' : ''}{trans(c.name, initialLanguageMode)}{c.upgraded ? '+' : ''}
                                        </span>
                                        <div className="flex items-center gap-1 ml-1 shrink-0">
                                            <button
                                                onClick={() => toggleDeckCardHolographic(idx)}
                                                className={`${c.holographic ? 'text-cyan-200' : 'text-gray-500'} hover:text-cyan-100`}
                                                title="キラ切替"
                                            >
                                                <Sparkles size={12} />
                                            </button>
                                            <button onClick={() => handleRemoveCard(idx)} className="text-gray-500 hover:text-red-500">
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="font-bold text-yellow-300 mb-1 flex items-center text-[10px] md:text-xs"><Gem size={12} className="mr-1" /> レリック ({selectedRelics.length})</h3>
                            <div className="flex flex-wrap gap-1">
                                {selectedRelics.map(r => (
                                    <div key={r.id} className="bg-gray-800 p-1 rounded border border-yellow-700 flex items-center shadow-sm">
                                        <span className="truncate max-w-[60px] text-[9px]">{trans(r.name, initialLanguageMode)}</span>
                                        <button onClick={() => toggleRelic(r)} className="ml-1 text-gray-500 hover:text-red-500"><X size={10} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="font-bold text-purple-300 mb-1 flex items-center text-[10px] md:text-xs"><FlaskConical size={12} className="mr-1" /> ポーション ({selectedPotions.length})</h3>
                            <div className="space-y-1">
                                {selectedPotions.map((p, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-gray-800 p-1 rounded border border-gray-700">
                                        <span style={{ color: p.color }} className="truncate text-[10px]">{trans(p.name, initialLanguageMode)}</span>
                                        <button onClick={() => removePotion(idx)} className="text-gray-500 hover:text-red-500 ml-1 shrink-0">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                )}
            </div>
        </div>
    );
};

export default DebugMenuScreen;


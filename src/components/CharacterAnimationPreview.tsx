import React, { useMemo, useState } from 'react';
import { RotateCcw, Sparkles } from 'lucide-react';
import { CHARACTERS } from '../constants';
import { MAGIC_MALE_PROTAGONISTS } from '../data/magicHeroes';
import {
    BATTLE_SPECIAL_IDLE_DURATION_MS,
    getThemedCharacterAnimationSheetPath,
    getThemedCharacterIdleSpriteScale,
    getThemedCharacterIdleSpriteSheetPath,
    getThemedCharacterSpritePath,
    getThemedCharacters,
    type BattleHeroAnimationAction,
    type HighSchoolHeroAction,
    type VisualThemeId,
} from '../data/visualThemes';
import { assetUrl } from '../utils/assetPaths';
import type { Character, LanguageMode } from '../types';
import { trans } from '../utils/textUtils';

type PreviewAction = 'idle' | BattleHeroAnimationAction | 'power';

interface PreviewCharacter {
    id: string;
    name: string;
    imageData: string;
    magicProtagonistId?: string;
    magicProtagonistGender?: 'female' | 'male';
}

const PREVIEW_ACTIONS: Array<{ id: PreviewAction; label: string; description: string }> = [
    { id: 'idle', label: '通常待機', description: '通常の立ち姿・待機表示' },
    { id: 'idle-special', label: '固有待機', description: 'キャラクター固有の待機シート' },
    { id: 'attack', label: '攻撃', description: '攻撃カード使用時' },
    { id: 'skill', label: 'スキル', description: 'スキルカード使用時' },
    { id: 'power', label: '必殺', description: 'パワーカード使用時' },
    { id: 'hit', label: '被弾', description: 'ダメージを受けた時' },
    { id: 'low-hp', label: '低HP', description: '体力が少ない時' },
];

const THEME_OPTIONS: Array<{ id: VisualThemeId; label: string }> = [
    { id: 'elementary', label: '小学生編' },
    { id: 'high-school', label: '高校編' },
    { id: 'magic', label: 'マジック編' },
];

const getMagicMalePreviewCharacter = (hero: typeof MAGIC_MALE_PROTAGONISTS[number]): PreviewCharacter => ({
    id: `MAGIC_MALE_${hero.id}`,
    name: hero.name,
    imageData: assetUrl(`sprites/magic/male-characters/${hero.assetId}-before.webp`),
    magicProtagonistId: hero.id,
    magicProtagonistGender: 'male',
});

const getPreviewCharacters = (theme: VisualThemeId): PreviewCharacter[] => {
    if (theme === 'magic') {
        const femaleCharacters = getThemedCharacters(CHARACTERS, theme);
        return [
            ...femaleCharacters,
            ...MAGIC_MALE_PROTAGONISTS.map(getMagicMalePreviewCharacter),
        ];
    }

    return getThemedCharacters(CHARACTERS, theme).map((character: Character) => ({
        id: character.id,
        name: character.name,
        imageData: character.imageData,
        magicProtagonistId: character.magicProtagonistId,
        magicProtagonistGender: character.magicProtagonistGender,
    }));
};

const getStaticAction = (action: PreviewAction): HighSchoolHeroAction => {
    if (action === 'attack') return 'attack';
    if (action === 'skill' || action === 'power') return 'skill';
    return 'idle';
};

const getActionClassName = (action: PreviewAction) => {
    if (action === 'attack') return 'battle-hero-attack';
    if (action === 'skill') return 'battle-hero-skill';
    if (action === 'power') return 'battle-hero-power';
    if (action === 'hit') return 'battle-hero-hit';
    if (action === 'low-hp') return 'battle-hero-low-hp';
    return '';
};

const getAnimationSheetClassName = (action: PreviewAction, isIdleFallback: boolean) => {
    if (isIdleFallback || action === 'idle') return 'battle-hero-idle-sprite-sheet';
    if (action === 'idle-special') return 'battle-hero-special-idle-sprite-sheet';
    if (action === 'low-hp') return 'battle-hero-low-hp-sprite-sheet';
    return 'battle-hero-action-sprite-sheet';
};

const getAnimationSheetDuration = (action: PreviewAction) => {
    if (action === 'hit') return '380ms';
    if (action === 'low-hp') return '2400ms';
    if (action === 'idle-special') return `${BATTLE_SPECIAL_IDLE_DURATION_MS}ms`;
    if (action === 'power') return '760ms';
    return '620ms';
};

interface CharacterAnimationPreviewProps {
    languageMode: LanguageMode;
}

const CharacterAnimationPreview: React.FC<CharacterAnimationPreviewProps> = ({ languageMode }) => {
    const translate = (text: string) => trans(text, languageMode);
    const [theme, setTheme] = useState<VisualThemeId>('high-school');
    const [characterId, setCharacterId] = useState('WARRIOR');
    const [action, setAction] = useState<PreviewAction>('idle');
    const [transformed, setTransformed] = useState(false);
    const [replayKey, setReplayKey] = useState(0);

    const characters = useMemo(() => getPreviewCharacters(theme), [theme]);
    const selectedCharacter = characters.find(character => character.id === characterId) ?? characters[0];
    const selectedAction = PREVIEW_ACTIONS.find(entry => entry.id === action) ?? PREVIEW_ACTIONS[0];

    const selectTheme = (nextTheme: VisualThemeId) => {
        setTheme(nextTheme);
        const nextCharacters = getPreviewCharacters(nextTheme);
        setCharacterId(nextCharacters[0]?.id ?? '');
        setAction('idle');
        setTransformed(false);
        setReplayKey(previous => previous + 1);
    };

    if (!selectedCharacter) {
        return <div className="rounded-xl border border-red-700 bg-red-950/40 p-4 text-sm text-red-200">{translate('表示できるキャラクターがありません。')}</div>;
    }

    const idleSheetSource = getThemedCharacterIdleSpriteSheetPath(theme, selectedCharacter.id);
    const idleSheetScale = getThemedCharacterIdleSpriteScale(theme, selectedCharacter.id);
    const requestedAnimationAction: BattleHeroAnimationAction | null = action === 'idle'
        ? null
        : action === 'power'
            ? 'skill'
            : action;
    const requestedSheetSource = requestedAnimationAction
        ? getThemedCharacterAnimationSheetPath(theme, selectedCharacter.id, requestedAnimationAction)
        : idleSheetSource;
    const isIdleFallback = action === 'idle-special' && !requestedSheetSource && !!idleSheetSource;
    const sheetSource = requestedSheetSource ?? (isIdleFallback ? idleSheetSource : null);
    const staticSource = getThemedCharacterSpritePath(
        theme,
        selectedCharacter.id,
        getStaticAction(action),
        selectedCharacter.imageData,
        transformed,
        selectedCharacter.magicProtagonistId,
        selectedCharacter.magicProtagonistGender,
    );
    const actionClassName = getActionClassName(action);
    const sheetClassName = getAnimationSheetClassName(action, isIdleFallback);
    const isMagicTheme = theme === 'magic';
    const isMirrored = theme === 'high-school';
    const hasDedicatedAsset = !!requestedSheetSource;
    const statusLabel = hasDedicatedAsset
        ? '専用シートを表示中'
        : isIdleFallback
            ? '固有待機シート未導入：通常待機へフォールバック'
            : action === 'idle'
                ? '通常待機シートを表示中'
                : '専用シート未導入：既存アクション表示へフォールバック';

    return (
        <div className="space-y-4">
            <div className="rounded-xl border border-cyan-700/70 bg-slate-950/50 p-3 md:p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                        <h3 className="flex items-center gap-2 text-base font-black text-cyan-200">
                            <Sparkles size={18} /> {translate('キャラクターアクション確認')}
                        </h3>
                        <p className="mt-1 text-xs leading-relaxed text-slate-300">
                            {translate('戦闘中と同じ立ち絵・アクションシート・CSS演出を、セーブデータや戦闘状態を変えずに確認できます。')}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setReplayKey(previous => previous + 1)}
                        className="inline-flex shrink-0 items-center justify-center gap-1 rounded-lg border border-cyan-500/70 bg-cyan-950/60 px-3 py-2 text-xs font-black text-cyan-100 hover:bg-cyan-800/70"
                    >
                        <RotateCcw size={14} /> {translate('アクション再生')}
                    </button>
                </div>

                <div className="mt-3 rounded-lg border border-amber-700/60 bg-amber-950/20 p-3 text-xs leading-relaxed text-amber-100">
                    <div className="font-black text-amber-200">{translate('戦闘中の固有待機')}</div>
                    <p className="mt-1">{translate('通常状態が6.5秒続くと再生を開始します。')}</p>
                    <p>{translate('1回の再生時間は3.2秒です。終了後、再び6.5秒の待機時間を測ります。')}</p>
                    <p className="text-amber-200/80">{translate('攻撃・スキル・被弾・低HP・カード選択中・敵行動中・必殺・戦闘不能・スマホ縦画面の仲間演出中は再生しません。')}</p>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                    <label className="flex flex-col gap-1 text-xs font-bold text-slate-300">
                        {translate('編')}
                        <select
                            value={theme}
                            onChange={event => selectTheme(event.target.value as VisualThemeId)}
                            className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
                        >
                            {THEME_OPTIONS.map(option => <option key={option.id} value={option.id}>{translate(option.label)}</option>)}
                        </select>
                    </label>
                    <label className="flex flex-col gap-1 text-xs font-bold text-slate-300">
                        {translate('キャラクター')}
                        <select
                            value={selectedCharacter.id}
                            onChange={event => {
                                setCharacterId(event.target.value);
                                setReplayKey(previous => previous + 1);
                            }}
                            className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
                        >
                            {characters.map(character => <option key={character.id} value={character.id}>{translate(character.name)}</option>)}
                        </select>
                    </label>
                    <label className="flex flex-col gap-1 text-xs font-bold text-slate-300">
                        {translate('アクション')}
                        <select
                            value={action}
                            onChange={event => {
                                setAction(event.target.value as PreviewAction);
                                setReplayKey(previous => previous + 1);
                            }}
                            className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
                        >
                            {PREVIEW_ACTIONS.map(option => <option key={option.id} value={option.id}>{translate(option.label)}</option>)}
                        </select>
                    </label>
                </div>

                {isMagicTheme && (
                    <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-fuchsia-700/70 bg-fuchsia-950/30 px-3 py-2 text-xs font-bold text-fuchsia-100">
                        <input
                            type="checkbox"
                            checked={transformed}
                            onChange={event => {
                                setTransformed(event.target.checked);
                                setReplayKey(previous => previous + 1);
                            }}
                            className="accent-fuchsia-400"
                        />
                        {translate('変身後の立ち絵で確認')}
                    </label>
                )}
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,28rem)]">
                <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-3 md:p-5">
                    <div className="mb-3 flex flex-wrap items-end justify-between gap-2 border-b border-slate-700 pb-3">
                        <div>
                            <div className="text-lg font-black text-white">{translate(selectedCharacter.name)}</div>
                            <div className="text-xs text-slate-400">{translate(selectedAction.description)}</div>
                        </div>
                        <div className={`rounded-full border px-2 py-1 text-[10px] font-black ${hasDedicatedAsset ? 'border-emerald-500/70 bg-emerald-950/60 text-emerald-200' : 'border-amber-500/70 bg-amber-950/60 text-amber-200'}`}>
                            {translate(statusLabel)}
                        </div>
                    </div>

                    <div className={`battle-scene-root ${theme === 'high-school' ? 'battle-high-school' : theme === 'magic' ? 'battle-magic' : ''} character-animation-preview-battle relative flex min-h-[20rem] items-end justify-center overflow-hidden rounded-xl border border-slate-700 bg-gradient-to-b from-slate-900 via-slate-950 to-black p-4 md:min-h-[28rem]`}>
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.16),transparent_70%)]" />
                        <div
                            key={`${selectedCharacter.id}-${action}-${transformed}-${replayKey}`}
                            className={`character-animation-preview-sprite relative z-10 h-64 w-64 md:h-80 md:w-80 ${actionClassName}`}
                            style={{
                                '--battle-hero-animation-sheet-duration': getAnimationSheetDuration(action),
                                '--battle-hero-animation-sheet-scale': action === 'idle-special' ? idleSheetScale : 1,
                            } as React.CSSProperties}
                        >
                            {sheetSource ? (
                                <div
                                    role="img"
                                    aria-label={`${translate(selectedCharacter.name)} ${translate(selectedAction.label)}`}
                                    className={`${sheetClassName} relative h-full w-full ${isMirrored ? '-scale-x-100' : ''}`}
                                    style={{
                                        backgroundImage: `url(${sheetSource})`,
                                        '--battle-hero-idle-sprite-scale': idleSheetScale,
                                    } as React.CSSProperties}
                                />
                            ) : (
                                <img
                                    src={staticSource}
                                    alt={`${translate(selectedCharacter.name)} ${translate(selectedAction.label)}`}
                                    className={`relative h-full w-full object-contain ${isMirrored ? '-scale-x-100' : ''}`}
                                    style={{ imageRendering: theme === 'elementary' ? 'pixelated' : 'auto' }}
                                />
                            )}
                        </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-300 md:grid-cols-4">
                        <div className="rounded-lg border border-slate-700 bg-black/30 p-2"><span className="block text-slate-500">{translate('編')}</span>{translate(THEME_OPTIONS.find(option => option.id === theme)?.label ?? '')}</div>
                        <div className="rounded-lg border border-slate-700 bg-black/30 p-2"><span className="block text-slate-500">{translate('アクション')}</span>{translate(selectedAction.label)}</div>
                        <div className="rounded-lg border border-slate-700 bg-black/30 p-2"><span className="block text-slate-500">{translate('表示方式')}</span>{translate(sheetSource ? '2×2シート' : '既存立ち絵')}</div>
                        <div className="rounded-lg border border-slate-700 bg-black/30 p-2"><span className="block text-slate-500">{translate('反転')}</span>{translate(isMirrored ? '戦闘表示と同じ' : 'なし')}</div>
                    </div>
                </div>

                <div className="rounded-xl border border-slate-700 bg-slate-950/50 p-3 md:p-4">
                    <h4 className="mb-3 text-sm font-black text-slate-200">{translate('アクション一覧')}</h4>
                    <div className="space-y-2">
                        {PREVIEW_ACTIONS.map(option => {
                            const optionAnimationAction: BattleHeroAnimationAction | null = option.id === 'idle'
                                ? null
                                : option.id === 'power'
                                    ? 'skill'
                                    : option.id;
                            const available = option.id === 'idle'
                                ? !!idleSheetSource
                                : !!(optionAnimationAction && getThemedCharacterAnimationSheetPath(theme, selectedCharacter.id, optionAnimationAction));
                            return (
                                <button
                                    type="button"
                                    key={option.id}
                                    onClick={() => {
                                        setAction(option.id);
                                        setReplayKey(previous => previous + 1);
                                    }}
                                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors ${action === option.id ? 'border-cyan-400 bg-cyan-950/70 text-cyan-100' : 'border-slate-700 bg-black/20 text-slate-300 hover:border-slate-500'}`}
                                >
                                    <span>
                                        <span className="block text-xs font-black">{translate(option.label)}</span>
                                        <span className="block text-[10px] text-slate-500">{translate(option.description)}</span>
                                    </span>
                                    <span className={`ml-2 shrink-0 rounded px-1.5 py-0.5 text-[9px] font-black ${available ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'}`}>
                                        {translate(available ? '専用あり' : 'フォールバック')}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                    <p className="mt-4 text-[11px] leading-relaxed text-slate-500">
                        {translate('「フォールバック」は専用画像がまだない状態です。現在の戦闘で使われる既存立ち絵とCSS演出を確認できます。固有待機シートは実装済みのキャラクターだけ専用表示になります。')}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CharacterAnimationPreview;

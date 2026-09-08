import React, { useEffect, useMemo, useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { CHARACTERS } from '../constants';
import { MAGIC_MALE_PROTAGONISTS } from '../data/magicHeroes';
import {
    getThemedCharacterAnimationSheetPath,
    getThemedCharacterIdleSpriteSheetPath,
    getThemedCharacters,
    type BattleHeroAnimationAction,
    type VisualThemeId,
} from '../data/visualThemes';
import type { LanguageMode } from '../types';
import { trans } from '../utils/textUtils';
import { getVacationIdleFrameAnchor, getVacationAnimationFrameTranslation } from '../data/vacationAnimationAnchors.generated';

type AuditAction = 'idle' | BattleHeroAnimationAction;

interface AuditCharacter {
    id: string;
    name: string;
    magicProtagonistId?: string;
    magicProtagonistGender?: 'female' | 'male';
}

const AUDIT_ACTIONS: Array<{ id: AuditAction; label: string; detail: string }> = [
    { id: 'idle', label: '通常待機', detail: 'idle reference' },
    { id: 'idle-special', label: '固有待機', detail: 'idle-special' },
    { id: 'attack', label: '攻撃', detail: 'attack' },
    { id: 'skill', label: 'スキル', detail: 'skill' },
    { id: 'hit', label: '被弾', detail: 'hit' },
    { id: 'low-hp', label: '低HP', detail: 'low-hp' },
];

const FRAME_POSITIONS = ['0% 0%', '100% 0%', '0% 100%', '100% 100%'];

const getVacationCharacters = (theme: VisualThemeId): AuditCharacter[] => {
    const femaleCharacters = getThemedCharacters(CHARACTERS, theme).map(character => ({
        id: character.id,
        name: character.name,
        magicProtagonistId: character.magicProtagonistId,
        magicProtagonistGender: character.magicProtagonistGender,
    }));

    if (theme !== 'magic') return femaleCharacters;

    return [
        ...femaleCharacters,
        ...MAGIC_MALE_PROTAGONISTS.map(hero => ({
            id: `MAGIC_MALE_${hero.id}`,
            name: hero.name,
            magicProtagonistId: hero.id,
            magicProtagonistGender: 'male' as const,
        })),
    ];
};

interface AuditStageProps {
    idleSource: string | null;
    actionSource: string | null;
    frameIndex: number;
    ghostOpacity: number;
    compact?: boolean;
    showIdle: boolean;
    missingLabel: string;
    feetLabel: string;
    centerLabel: string;
}

const AuditStage: React.FC<AuditStageProps> = ({
    idleSource,
    actionSource,
    frameIndex,
    ghostOpacity,
    compact = false,
    showIdle,
    missingLabel,
    feetLabel,
    centerLabel,
}) => {
    const framePosition = FRAME_POSITIONS[frameIndex] ?? FRAME_POSITIONS[0];
    // Use the first normal-idle frame as the shared audit baseline. The
    // displayed frame still changes so the original animation motion remains
    // visible while placement drift is measured against one fixed origin.
    const idleAnchor = getVacationIdleFrameAnchor(idleSource, 0);
    const centerGuideStyle = idleAnchor
        ? { left: `${(idleAnchor.centerX / idleAnchor.cellWidth) * 100}%` }
        : undefined;
    const feetGuideStyle = idleAnchor
        ? { top: `${(idleAnchor.bottomY / idleAnchor.cellHeight) * 100}%` }
        : undefined;
    const layerStyle = (source: string | null, opacity: number) => {
        if (!source) return undefined;
        const translation = getVacationAnimationFrameTranslation(source, frameIndex);
        return {
            backgroundImage: `url("${source}")`,
            backgroundSize: '200% 200%',
            backgroundPosition: framePosition,
            opacity,
            transform: translation ? `translate(${translation.x}%, ${translation.y}%)` : undefined,
        };
    };

    return (
        <div
            className={`relative aspect-square w-full overflow-hidden rounded-lg border bg-slate-950 ${compact ? 'border-slate-700' : 'border-cyan-700/70 shadow-[0_0_24px_rgba(34,211,238,0.12)]'}`}
            aria-label="Idle reference and action frame overlay"
        >
            <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(148,163,184,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.16)_1px,transparent_1px)] [background-size:25%_25%]" />
            <div
                className={`pointer-events-none absolute inset-y-0 z-20 w-px bg-rose-300/70 ${idleAnchor ? '' : 'left-1/2'}`}
                style={centerGuideStyle}
            />
            <div
                className={`pointer-events-none absolute inset-x-0 z-20 h-px bg-amber-300/70 ${idleAnchor ? '' : 'bottom-[13%]'}`}
                style={feetGuideStyle}
            />
            {showIdle && idleSource && (
                <div
                    className="pointer-events-none absolute inset-0 z-10 bg-contain bg-no-repeat grayscale sepia saturate-[8] hue-rotate-[300deg]"
                    style={layerStyle(idleSource, ghostOpacity)}
                />
            )}
            {actionSource ? (
                <div
                    className="pointer-events-none absolute inset-0 z-10 bg-contain bg-no-repeat"
                    style={layerStyle(actionSource, 0.92)}
                />
            ) : (
                <div className="absolute inset-0 z-30 flex items-center justify-center p-4 text-center text-xs text-red-200">{missingLabel}</div>
            )}
            <div className="pointer-events-none absolute bottom-1 left-2 z-30 rounded bg-black/70 px-1.5 py-0.5 text-[9px] text-amber-200">{feetLabel}</div>
            <div className="pointer-events-none absolute right-2 top-1 z-30 rounded bg-black/70 px-1.5 py-0.5 text-[9px] text-rose-200">{centerLabel}</div>
        </div>
    );
};

interface ActionPositionAuditPreviewProps {
    languageMode: LanguageMode;
}

const ActionPositionAuditPreview: React.FC<ActionPositionAuditPreviewProps> = ({ languageMode }) => {
    const translate = (text: string) => trans(text, languageMode);
    const [theme, setTheme] = useState<VisualThemeId>('high-school');
    const [characterId, setCharacterId] = useState('WARRIOR');
    const [transformed, setTransformed] = useState(false);
    const [frameIndex, setFrameIndex] = useState(0);
    const [selectedAction, setSelectedAction] = useState<AuditAction>('attack');
    const [ghostOpacity, setGhostOpacity] = useState(0.38);
    const [showIdle, setShowIdle] = useState(true);
    const [playing, setPlaying] = useState(false);

    const characters = useMemo(() => getVacationCharacters(theme), [theme]);
    const selectedCharacter = characters.find(character => character.id === characterId) ?? characters[0];

    useEffect(() => {
        if (!playing) return;
        const timer = window.setInterval(() => {
            setFrameIndex(current => (current + 1) % FRAME_POSITIONS.length);
        }, 560);
        return () => window.clearInterval(timer);
    }, [playing]);

    useEffect(() => {
        if (!selectedCharacter || characters.some(character => character.id === characterId)) return;
        setCharacterId(selectedCharacter.id);
    }, [characterId, characters, selectedCharacter]);

    if (!selectedCharacter) {
        return <div className="rounded-xl border border-red-700 bg-red-950/40 p-4 text-sm text-red-200">{translate('表示できるキャラクターがありません。')}</div>;
    }

    const idleSource = getThemedCharacterIdleSpriteSheetPath(
        theme,
        selectedCharacter.id,
        transformed,
        selectedCharacter.magicProtagonistId,
        selectedCharacter.magicProtagonistGender,
        'VACATION',
    );

    const getActionSource = (action: AuditAction) => action === 'idle'
        ? idleSource
        : getThemedCharacterAnimationSheetPath(
            theme,
            selectedCharacter.id,
            action,
            transformed,
            selectedCharacter.magicProtagonistId,
            selectedCharacter.magicProtagonistGender,
            'VACATION',
        );

    const selectTheme = (nextTheme: VisualThemeId) => {
        setTheme(nextTheme);
        setCharacterId(getVacationCharacters(nextTheme)[0]?.id ?? '');
        setTransformed(false);
        setFrameIndex(0);
        setPlaying(false);
    };

    return (
        <div className="w-full min-w-0 space-y-4 overflow-x-hidden">
            <section className="rounded-xl border border-cyan-800/70 bg-slate-950/50 p-3 md:p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h2 className="text-base font-black text-cyan-100">{translate('バカンスアクション配置監査')}</h2>
                        <p className="mt-1 max-w-3xl text-xs leading-relaxed text-slate-400">
                            {translate('シート一覧ではなく、アイドルを基準に各アクションの同じコマを重ねて、中央・足元・見切れのぶれを確認します。')}
                        </p>
                    </div>
                    <div className="rounded-lg border border-amber-700/60 bg-amber-950/30 px-3 py-2 text-[11px] text-amber-100">
                        {translate('赤ゴースト = アイドル基準 / 全アクション軸補正済み表示で比較')}
                    </div>
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1.6fr]">
                    <div className="space-y-3 rounded-lg border border-slate-800 bg-black/20 p-3">
                        <div className="flex flex-wrap gap-2">
                            {(['high-school', 'magic'] as const).map(option => (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => selectTheme(option)}
                                    className={`rounded border px-3 py-1.5 text-xs font-bold ${theme === option ? 'border-cyan-300 bg-cyan-700 text-white' : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-cyan-700'}`}
                                >
                                    {option === 'high-school' ? translate('高校編') : translate('マジック編')}
                                </button>
                            ))}
                        </div>
                        <label className="block text-[11px] font-bold text-slate-400">{translate('キャラクター')}</label>
                        <select
                            value={selectedCharacter.id}
                            onChange={event => {
                                setCharacterId(event.target.value);
                                setFrameIndex(0);
                            }}
                            className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-2 text-sm text-white outline-none focus:border-cyan-400"
                        >
                            {characters.map(character => <option key={character.id} value={character.id}>{character.name}</option>)}
                        </select>
                        {theme === 'magic' && (
                            <button
                                type="button"
                                onClick={() => setTransformed(current => !current)}
                                className={`w-full rounded border px-3 py-2 text-xs font-bold ${transformed ? 'border-fuchsia-300 bg-fuchsia-800 text-white' : 'border-slate-700 bg-slate-900 text-slate-400'}`}
                            >
                                {transformed ? translate('変身後') : translate('変身前')}
                            </button>
                        )}
                        <div className="border-t border-slate-800 pt-3">
                            <div className="mb-1 flex items-center justify-between text-[11px] text-slate-400">
                                <span>{translate('アイドル基準の濃さ')}</span>
                                <span>{Math.round(ghostOpacity * 100)}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="0.8"
                                step="0.02"
                                value={ghostOpacity}
                                onChange={event => setGhostOpacity(Number(event.target.value))}
                                className="w-full accent-rose-400"
                            />
                            <label className="mt-2 flex items-center gap-2 text-xs text-slate-300">
                                <input type="checkbox" checked={showIdle} onChange={event => setShowIdle(event.target.checked)} />
                                {translate('アイドル基準を重ねる')}
                            </label>
                        </div>
                    </div>

                    <div className="space-y-3 rounded-lg border border-slate-800 bg-black/20 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="text-xs font-bold text-slate-200">{translate('2×2シートのフレーム送り')}</div>
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={() => setFrameIndex(current => (current + 3) % 4)} className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:border-cyan-500">←</button>
                                <span className="min-w-16 text-center text-xs font-bold text-cyan-200">{frameIndex + 1} / 4</span>
                                <button type="button" onClick={() => setFrameIndex(current => (current + 1) % 4)} className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:border-cyan-500">→</button>
                                <button type="button" onClick={() => setPlaying(current => !current)} className="flex items-center gap-1 rounded border border-cyan-700 bg-cyan-950/60 px-2 py-1 text-xs font-bold text-cyan-100">
                                    {playing ? <Pause size={12} /> : <Play size={12} />}
                                    {playing ? translate('停止') : translate('再生')}
                                </button>
                                <button type="button" onClick={() => { setFrameIndex(0); setPlaying(false); }} className="rounded border border-slate-700 p-1 text-slate-400 hover:border-cyan-500" title={translate('先頭に戻す')}>
                                    <RotateCcw size={13} />
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                            {AUDIT_ACTIONS.map(action => (
                                <button
                                    key={action.id}
                                    type="button"
                                    onClick={() => setSelectedAction(action.id)}
                                    className={`rounded-lg border bg-slate-950/80 p-2 text-left ${selectedAction === action.id ? 'border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.15)]' : 'border-slate-800'}`}
                                >
                                    <div className="mb-1 flex items-center justify-between gap-1">
                                        <span className="truncate text-[11px] font-bold text-slate-200">{translate(action.label)}</span>
                                        <code className="text-[9px] text-slate-500">{action.detail}</code>
                                    </div>
                                    <AuditStage
                                        idleSource={idleSource}
                                        actionSource={getActionSource(action.id)}
                                        frameIndex={frameIndex}
                                        ghostOpacity={ghostOpacity}
                                        compact
                                        showIdle={showIdle}
                                        missingLabel={translate('画像が見つかりません')}
                                        feetLabel={translate('足元')}
                                        centerLabel={translate('中央')}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="rounded-xl border border-slate-800 bg-black/20 p-3 md:p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h3 className="text-sm font-black text-slate-100">{translate('選択中の比較')}</h3>
                        <p className="text-[11px] text-slate-500">{selectedCharacter.name} / {transformed ? translate('変身後') : translate('変身前')} / {translate('フレーム')} {frameIndex + 1}</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {AUDIT_ACTIONS.map(action => (
                            <span key={action.id} className="rounded border border-slate-700 px-2 py-1 text-[10px] text-slate-400">{translate(action.label)}</span>
                        ))}
                    </div>
                </div>
                <div className="mx-auto max-w-[440px]">
                    <AuditStage
                        idleSource={idleSource}
                        actionSource={getActionSource(selectedAction)}
                        frameIndex={frameIndex}
                        ghostOpacity={ghostOpacity}
                        showIdle={showIdle}
                        missingLabel={translate('画像が見つかりません')}
                        feetLabel={translate('足元')}
                        centerLabel={translate('中央')}
                    />
                </div>
                <p className="mx-auto mt-3 max-w-2xl text-center text-[11px] leading-relaxed text-slate-500">
                    {translate('中央線と足元ラインを基準に、赤いアイドルゴーストから身体・武器・エフェクトが意図せず移動していないか確認してください。')}
                </p>
            </section>
        </div>
    );
};

export default ActionPositionAuditPreview;

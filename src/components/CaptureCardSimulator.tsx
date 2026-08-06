import React, { useMemo, useState } from 'react';
import { Search, Swords, WandSparkles } from 'lucide-react';
import { Card as ICard, CardType, LanguageMode, TargetType } from '../types';
import Card from './Card';
import { trans } from '../utils/textUtils';

interface CaptureCardSimulatorProps {
    cards: ICard[];
    languageMode: LanguageMode;
    onAddToDeck: (card: ICard) => void;
    onSetTestDeck: (card: ICard) => void;
}

const CAPTURE_SIMULATOR_DEFAULT_ENEMY = 'テスト敵';

const buildSimulatedCaptureCard = (template: ICard, enemyName: string, enemyHp: number, id: string): ICard => {
    const normalizedEnemyName = enemyName.trim() || CAPTURE_SIMULATOR_DEFAULT_ENEMY;
    const captureDamage = Math.max(5, Math.floor(Math.max(1, enemyHp) * 0.25));
    const totalDamage = (template.damage || 0) + captureDamage;
    const originalNames = Array.from(new Set([
        ...(template.originalNames || []),
        template.name,
    ]));
    const {
        familiarSummon: _removedFamiliarSummon,
        highSchoolCardArtIndex: _removedHighSchoolCardArtIndex,
        ...effectTemplate
    } = template;

    return {
        ...effectTemplate,
        id,
        name: normalizedEnemyName,
        originalNames,
        enemyIllustrationName: normalizedEnemyName,
        enemyIllustrationNames: [normalizedEnemyName],
        visualTheme: 'elementary',
        rarity: 'SPECIAL',
        exhaust: true,
        familiarSummon: undefined,
        damage: totalDamage,
        target: template.target === TargetType.SELF ? TargetType.ENEMY : template.target,
        type: totalDamage > 0 ? CardType.ATTACK : template.type,
        description: `${captureDamage}ダメージ。${template.description} 廃棄。`,
    };
};

const CaptureCardSimulator: React.FC<CaptureCardSimulatorProps> = ({
    cards,
    languageMode,
    onAddToDeck,
    onSetTestDeck,
}) => {
    const sourceCards = useMemo(() => cards
        .filter(card => (
            card.rarity !== 'SPECIAL'
            && card.type !== CardType.CURSE
            && card.type !== CardType.STATUS
            && card.type !== CardType.SUMMON
            && !card.familiarSummon
            && !card.capture
            && card.cost <= 3
        ))
        .sort((a, b) => a.name.localeCompare(b.name, 'ja') || a.cost - b.cost), [cards]);
    const defaultSource = sourceCards.find(card => card.name === '発見' || card.name === 'ゼロの発見') || sourceCards[0];
    const [sourceCardId, setSourceCardId] = useState(defaultSource?.id || '');
    const [searchTerm, setSearchTerm] = useState('');
    const [enemyName, setEnemyName] = useState(CAPTURE_SIMULATOR_DEFAULT_ENEMY);
    const [enemyHp, setEnemyHp] = useState(40);
    const sourceCard = sourceCards.find(card => card.id === sourceCardId) || defaultSource;
    const filteredSourceCards = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();
        if (!normalizedSearch) return sourceCards;
        return sourceCards.filter(card => `${card.name} ${card.description}`.toLowerCase().includes(normalizedSearch));
    }, [searchTerm, sourceCards]);
    const previewCard = sourceCard
        ? buildSimulatedCaptureCard(sourceCard, enemyName, enemyHp, 'debug-captured-preview')
        : null;

    const createCapturedCard = () => {
        if (!sourceCard) return null;
        return buildSimulatedCaptureCard(
            sourceCard,
            enemyName,
            enemyHp,
            `debug-captured-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        );
    };

    return (
        <div className="mx-auto max-w-5xl space-y-4">
            <section className="rounded-xl border border-amber-500/60 bg-amber-950/20 p-4">
                <div className="flex items-center gap-2 text-amber-200">
                    <WandSparkles size={20} />
                    <h3 className="text-lg font-black">{trans('捕獲カードシミュレータ', languageMode)}</h3>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-amber-100/75">
                    {trans('捕獲時のランダム効果カードと敵名を指定して、実際の捕獲カードと同じ形のカードを作成します。', languageMode)}
                    {' '}
                    {trans('「元カード名」に効果カード名が残っていることを確認してから、デッキに追加して戦闘で使用できます。', languageMode)}
                </p>
            </section>

            <section className="grid grid-cols-1 gap-3 rounded-xl border border-slate-700 bg-black/25 p-4 md:grid-cols-3">
                <label className="flex flex-col gap-1 text-xs font-bold text-slate-200 md:col-span-2">
                    <span>{trans('付与する効果カード', languageMode)}</span>
                    <div className="relative">
                        <Search className="absolute left-2 top-2 text-slate-500" size={14} />
                        <input
                            type="search"
                            value={searchTerm}
                            onChange={event => setSearchTerm(event.target.value)}
                            placeholder={trans('効果カードを検索...', languageMode)}
                            className="w-full rounded border border-slate-600 bg-slate-950 py-1.5 pl-8 pr-2 text-sm text-white outline-none focus:border-amber-400"
                        />
                    </div>
                    <select
                        value={sourceCard?.id || ''}
                        onChange={event => setSourceCardId(event.target.value)}
                        className="rounded border border-slate-600 bg-slate-950 px-2 py-1.5 text-sm text-white outline-none focus:border-amber-400"
                    >
                        {filteredSourceCards.map(card => (
                            <option key={card.id} value={card.id}>
                                {trans(card.name, languageMode)} / {trans('コスト', languageMode)}{card.cost}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="flex flex-col gap-1 text-xs font-bold text-slate-200">
                    <span>{trans('敵HP（捕獲ダメージ計算用）', languageMode)}</span>
                    <input
                        type="number"
                        min={1}
                        value={enemyHp}
                        onChange={event => setEnemyHp(Math.max(1, Number(event.target.value) || 1))}
                        className="rounded border border-slate-600 bg-slate-950 px-2 py-1.5 text-sm text-white outline-none focus:border-amber-400"
                    />
                </label>
                <label className="flex flex-col gap-1 text-xs font-bold text-slate-200 md:col-span-3">
                    <span>{trans('捕獲した敵の表示名', languageMode)}</span>
                    <input
                        type="text"
                        value={enemyName}
                        onChange={event => setEnemyName(event.target.value)}
                        placeholder={CAPTURE_SIMULATOR_DEFAULT_ENEMY}
                        className="rounded border border-slate-600 bg-slate-950 px-2 py-1.5 text-sm text-white outline-none focus:border-amber-400"
                    />
                </label>
            </section>

            {previewCard ? (
                <section className="grid grid-cols-1 gap-4 rounded-xl border border-amber-500/50 bg-slate-950/70 p-4 md:grid-cols-[180px_1fr]">
                    <div className="flex justify-center">
                        <div className="w-40">
                            <Card card={previewCard} onClick={() => undefined} disabled={false} languageMode={languageMode} />
                        </div>
                    </div>
                    <div className="space-y-3 text-xs">
                        <div className="font-black text-amber-200">{trans('生成結果', languageMode)}</div>
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                            <div className="rounded border border-slate-700 bg-black/35 p-2">
                                <div className="text-slate-500">{trans('表示名', languageMode)}</div>
                                <div className="font-bold text-white">{previewCard.name}</div>
                            </div>
                            <div className="rounded border border-slate-700 bg-black/35 p-2">
                                <div className="text-slate-500">{trans('効果元', languageMode)}</div>
                                <div className="font-bold text-cyan-200">{sourceCard ? trans(sourceCard.name, languageMode) : '-'}</div>
                            </div>
                        </div>
                        <div className="rounded border border-emerald-700/70 bg-emerald-950/30 p-2">
                            <div className="text-emerald-300">{trans('originalNames（効果判定用）', languageMode)}</div>
                            <div className="mt-1 break-words font-mono font-bold text-emerald-100">
                                {previewCard.originalNames?.join(' / ') || '(なし)'}
                            </div>
                        </div>
                        <div className="rounded border border-slate-700 bg-black/35 p-2 text-slate-300">
                            <div>{trans('捕獲追加ダメージ', languageMode)}: {Math.max(5, Math.floor(Math.max(1, enemyHp) * 0.25))}</div>
                            <div>{trans('合計ダメージ', languageMode)}: {previewCard.damage || 0}</div>
                            <div>{trans('効果説明', languageMode)}: {trans(sourceCard?.description || '', languageMode)}</div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    const card = createCapturedCard();
                                    if (card) onAddToDeck(card);
                                }}
                                className="flex items-center gap-1 rounded border border-amber-300 bg-amber-700 px-3 py-2 font-black text-white hover:bg-amber-600"
                            >
                                <Swords size={14} /> {trans('デッキに追加', languageMode)}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const card = createCapturedCard();
                                    if (card) onSetTestDeck(card);
                                }}
                                className="rounded border border-cyan-300 bg-cyan-800 px-3 py-2 font-black text-white hover:bg-cyan-700"
                            >
                                {trans('確認用デッキをセット', languageMode)}
                            </button>
                        </div>
                        <p className="text-[10px] leading-relaxed text-slate-500">
                            {trans('「確認用デッキをセット」後、上部の「出発する」からマップへ進み、戦闘でこのカードを使用してください。', languageMode)}
                        </p>
                    </div>
                </section>
            ) : (
                <div className="rounded border border-red-700 bg-red-950/30 p-4 text-sm text-red-200">
                    {trans('付与候補カードがありません。', languageMode)}
                </div>
            )}
        </div>
    );
};

export default CaptureCardSimulator;

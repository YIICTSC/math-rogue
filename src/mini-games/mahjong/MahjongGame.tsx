import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LanguageMode } from '../../types';
import { assetUrl } from '../../utils/assetPaths';
import { trans } from '../../utils/textUtils';
import { audioService } from '../../services/audioService';
import { MAHJONG_ENGLISH, MAHJONG_HIRAGANA } from './copy';
import { bestDiscard, HONORS, shapes, shanten, Tile, tileKey, tileName, waits } from './tiles';
import { Call, canTsumo, cpuStep, createTable, indicators, isFuriten, kanTypes, riichiDiscards, seatWind, Table, TableAction, tableStep } from './table';
import { bankHint, bossRule, classify, createRogue, PATTERNS, RELICS, Rogue, RogueAction, rogueGoal, rogueScore, rogueStep, validRogueSave } from './rogue';
import './mahjong.css';

const SAVE = 'learning_rogue_mahjong_expedition_v2';
type Mode = 'lobby' | 'learn' | 'full' | 'rogue';
type Props = { onBack: () => void; languageMode?: LanguageMode; onMissionClear?: () => void };
const FLOWERS = ['紅梅', '青花', '翠竹', '金菊', '春', '夏', '秋', '冬'];
const GROUP_NAMES = { sequence: '順子', triplet: '刻子', quad: '槓子', pair: '雀頭' };
function savedRun(): Rogue | null { try { const s = JSON.parse(localStorage.getItem(SAVE) || 'null'); return validRogueSave(s) && s.phase !== 'lost' ? s : null; } catch { return null; } }

export default function MahjongGame({ onBack, languageMode = 'JAPANESE', onMissionClear }: Props) {
  const tr = (s: string) => languageMode === 'ENGLISH' ? MAHJONG_ENGLISH[s] || s : languageMode === 'HIRAGANA' ? MAHJONG_HIRAGANA[s] || trans(s, languageMode) : s;
  const [mode, setMode] = useState<Mode>('lobby'), [table, setTable] = useState<Table>(() => createTable(4));
  const [rogue, setRogue] = useState<Rogue>(() => savedRun() || createRogue());
  const [selection, setSelection] = useState<string[]>([]), [riichi, setRiichi] = useState(false), [guide, setGuide] = useState(true), [help, setHelp] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false), [continueAvailable, setContinueAvailable] = useState(() => Boolean(savedRun()));
  const [shopTarget, setShopTarget] = useState('');
  const notified = useRef(false);
  const nameOf = (seat: number) => seat === 0 ? tr('あなた') : `CPU ${seat}`;
  const label = (t: Tile) => t.type >= 34 ? tr(FLOWERS[t.type - 34]) : languageMode === 'ENGLISH' ? t.type < 27 ? `${t.type % 9 + 1} ${['Characters', 'Dots', 'Bamboo'][Math.floor(t.type / 9)]}` : tr(HONORS[t.type - 27]) : languageMode === 'HIRAGANA' ? t.type < 27 ? `${t.type % 9 + 1}${['まん', 'ぴん', 'そー'][Math.floor(t.type / 9)]}` : tr(HONORS[t.type - 27]) : tileName(t.type);
  const art = (t: Tile, small = false) => <span className={`mj-tile-art ${small ? 'mj-tile-small' : ''} ${t.foil ? 'mj-foil' : ''}`}><img draggable={false} src={assetUrl(`sprites/mahjong/tiles/${t.type >= 34 ? `f${t.type - 33}` : tileKey(t.type)}.webp`)} alt="" />{t.foil && <span className="mj-foil-star" aria-hidden="true">✦</span>}</span>;
  const openMode = (next: Mode, resume = false) => {
    setSelection([]); setRiichi(false); notified.current = false;
    if (next === 'learn' || next === 'full') { setTable(createTable(next === 'learn' ? 4 : 8)); setGuide(next === 'learn'); }
    if (next === 'rogue') setRogue(resume ? savedRun() || createRogue() : createRogue());
    setMode(next); audioService.playSound('select');
  };
  const act = (action: TableAction) => { setTable(s => tableStep(s, action)); setSelection([]); setRiichi(false); audioService.playSound('select'); };
  const runAct = (action: RogueAction) => { setRogue(s => rogueStep(s, action)); setSelection([]); audioService.playSound('select'); };
  useEffect(() => {
    if (help || (mode !== 'learn' && mode !== 'full')) return;
    if (table.phase === 'result' || table.phase === 'finished' || (table.turn === 0 && table.phase !== 'reaction') || (table.phase === 'reaction' && table.pending?.calls.some(c => c.seat === 0))) return;
    const timer = window.setTimeout(() => setTable(s => cpuStep(s)), 380);
    return () => window.clearTimeout(timer);
  }, [mode, table, help]);
  useEffect(() => {
    if (mode !== 'rogue') return;
    try { localStorage.setItem(SAVE, JSON.stringify(rogue)); setContinueAvailable(rogue.phase !== 'lost'); setSaveFailed(false); } catch { setSaveFailed(true); }
  }, [mode, rogue]);
  useEffect(() => {
    const won = mode === 'rogue' ? rogue.phase === 'won' : (mode === 'learn' || mode === 'full') && table.phase === 'finished' && table.players.every(p => p.points <= table.players[0].points);
    if (won && !notified.current) { notified.current = true; audioService.playSound('win'); onMissionClear?.(); }
  }, [mode, rogue.phase, table.phase, table.players, onMissionClear]);
  const player = table.players[0], myTurn = table.turn === 0 && table.phase === 'discard';
  const legalRiichi = useMemo(() => riichiDiscards(table), [table]);
  const myWaits = useMemo(() => waits(player.hand, player.melds), [player.hand, player.melds]);
  const afterSelection = myTurn && selection.length === 1 ? player.hand.filter(t => t.id !== selection[0]) : player.hand;
  const currentWaits = myTurn && selection.length === 1 ? waits(afterSelection, player.melds) : myWaits;
  const distance = useMemo(() => shanten(afterSelection, player.melds.length), [afterSelection, player.melds]);
  const legalTsumo = myTurn ? canTsumo(table) : null;
  const calls = table.phase === 'reaction' ? table.pending?.calls.filter(c => c.seat === 0) || [] : [];
  const estimate = useMemo(() => rogueScore(rogue), [rogue]);
  const chosenTiles = rogue.hand.filter(t => selection.includes(t.id)), chosenKind = classify(chosenTiles);
  const canBank = chosenKind && (chosenKind === 'pair' ? !rogue.banks.some(b => b.kind === 'pair') : rogue.banks.filter(b => b.kind !== 'pair').length < 4);
  const selectTile = (id: string, multiple: boolean) => setSelection(old => multiple ? old.includes(id) ? old.filter(t => t !== id) : old.length < 5 ? [...old, id] : old : old[0] === id ? [] : [id]);
  const tileButtons = (tiles: Tile[], multiple: boolean) => <div className={`mj-hand ${multiple ? 'mj-hand-rogue' : ''}`} aria-label={tr('手牌')}>
    {tiles.map((t, i) => {
      const locked = !multiple && (!myTurn || (Boolean(player.riichi) && t.id !== table.drawn) || (riichi && !legalRiichi.includes(t.id)));
      return <button key={t.id} type="button" disabled={locked} data-tile-id={t.id} data-tile-type={t.type} data-gamepad-zone="mahjong-hand" data-gamepad-order={i} className={`mj-tile-button ${selection.includes(t.id) ? 'is-selected' : ''} ${!multiple && table.drawn === t.id ? 'is-drawn' : ''}`} aria-label={`${label(t)}${t.foil ? ` ${tr('金箔牌')}` : ''}`} aria-pressed={selection.includes(t.id)} onClick={() => selectTile(t.id, multiple)}>{art(t)}<span className="mj-tile-caption">{label(t)}</span></button>;
    })}
  </div>;
  const scoreDetails = (s: typeof estimate) => <div className="mj-score"><strong>{s.chips.toLocaleString()} × {s.mult} × {s.factor} = {s.total.toLocaleString()}</strong><small>{tr('基礎点')} × {tr('教本')} × {tr('遺物')}</small><div>{s.lines.map(l => <span key={l.name}>{tr(l.name)} +{l.value}</span>)}</div></div>;
  const renderSeat = (seat: number, position: string) => {
    const p = table.players[seat];
    return <section className={`mj-seat mj-seat-${position} ${table.turn === seat && !['result', 'finished'].includes(table.phase) ? 'is-turn' : ''}`} aria-label={nameOf(seat)}>
      <div className="mj-seat-title"><b>{tr(HONORS[seatWind(table, seat) - 27])} · {nameOf(seat)}</b><strong>{p.points.toLocaleString()}</strong>{Boolean(p.riichi) && <em>{tr('リーチ')}</em>}</div>
      {seat !== 0 && <div className="mj-hidden-hand" aria-label={`${tr('手牌')} ${p.hand.length}`}><img src={assetUrl('sprites/mahjong/tiles/back.webp')} alt="" /><span>×{p.hand.length}</span></div>}
      <div className="mj-river" aria-label={tr('捨て牌')}>{p.river.map(r => <span key={r.tile.id} title={label(r.tile)} className={`${r.called ? 'was-called' : ''} ${r.riichi ? 'was-riichi' : ''}`}>{art(r.tile, true)}</span>)}</div>
      {p.melds.length > 0 && <div className="mj-open-melds" aria-label={tr('固定面子')}>{p.melds.map((m, i) => <div key={i}>{m.tiles.map(t => <span title={label(t)} key={t.id}>{art(t, true)}</span>)}<small>{tr(m.kind === 'chi' ? 'チー' : m.kind === 'pon' ? 'ポン' : 'カン')}</small></div>)}</div>}
    </section>;
  };
  const guideCopy = [
    '4面子＋1雀頭。順子は同種の連番3枚、刻子は同じ牌3枚、雀頭は同じ牌2枚。',
    '七対子は異なる7組の対子。国士無双は1・9・字牌13種＋どれか1枚。',
    '和了には役が必要です。ドラだけでは和了できません。',
    'チーは上家だけ、ポン・カン・ロンは他の3人の捨て牌が対象。ロンが最優先です。',
    '待ち牌が自分の捨て牌にある時やロンを見送った直後は、ロンできません。',
    '25000点持ち・喰いタンあり・赤ドラなし・頭ハネ。親は和了または流局テンパイで連荘。',
    '王牌14枚・裏ドラあり・槓ドラあり。途中流局・流し満貫・責任払い・喰い替え制限は採用していません。',
    '東風は東4局、半荘は東南8局（連荘を除く）。西入・アガリ止めなし、持ち点マイナスで終了。',
    'リーチと門前ツモ、2〜8だけの断么九、白・發・中の刻子から覚えましょう。',
  ];
  const rogueCopy = ['16枚から順子・刻子・槓子を4組と、雀頭を1組選んで確定します。', '確定した牌は戻せません。残りは16枚まで補充。花牌は自動で抜いて加点します。', '交換は1回につき1〜5枚。道具は数牌1枚を同じ種類の次の数字へ（9→1）。', '基礎点×教本倍率×遺物倍率で得点。5組完成時に目標以上ならショップへ。', '通常のリーチ麻雀とは異なる、学習ローグ独自の1人用構築ルールです。'];
  const yakuGuide: [string, string][] = [['リーチ', '門前でテンパイし、1000点を供託する。'], ['門前清自摸和', '鳴かずに自分で引いて和了。'], ['断么九', '2〜8の数牌だけで構成。鳴いても成立。'], ['役牌・白', '白・發・中、場風、自風の刻子。'], ['平和', '門前・4順子・役牌でない雀頭・両面待ち。'], ['一盃口', '門前で同じ順子を2組。'], ['一気通貫', '1〜9の順子を同じ種類で3組。'], ['三色同順', '同じ連番の順子を萬・筒・索に1組ずつ。'], ['対々和', '4組すべて刻子または槓子。'], ['混一色', '字牌と1種類の数牌。清一色は字牌も使わない。'], ['七対子', '異なる対子を7組。同じ牌4枚は2組に数えない。'], ['国士無双', '1・9・字牌の13種と、そのどれかをもう1枚。']];
  const title = mode === 'rogue' ? tr('牌の旅・ローグライク') : tr('放課後麻雀');
  const canLeave = () => { setSelection([]); setMode('lobby'); };
  return <div className="mj-screen" data-mini-game-scope="mahjong" data-gamepad-navigation-root data-gamepad-initial-scope="mahjong" style={{ backgroundImage: `linear-gradient(135deg,#031913ee,#07141ee8),url("${assetUrl('sprites/backgrounds/mini-games/mahjong.png')}")` }}>
    <div className="mj-content">
      <header className="mj-header"><button type="button" data-gamepad-back="true" onClick={mode === 'lobby' ? onBack : canLeave}>{tr('戻る')}</button><div><small>LEARNING ROGUE · MAHJONG</small><h1>{title}</h1></div><button type="button" onClick={() => setHelp(true)}>{tr('ルールと役')}</button></header>
      {mode === 'lobby' ? <div className="mj-lobby">
        <div className="mj-hero"><div className="mj-hero-tiles">{[0, 1, 2, 12, 12, 12, 24, 25, 26, 31, 31, 31, 4, 4].map((type, i) => <span key={i}>{art({ id: `hero-${i}`, type })}</span>)}</div><p>{tr('4面子＋1雀頭。順子は同種の連番3枚、刻子は同じ牌3枚、雀頭は同じ牌2枚。')}</p></div>
        <div className="mj-mode-cards">{([
          ['learn', '四人打ちを学ぶ', '自分＋CPU3人。13枚からツモって14枚。東風戦で基本を学びます。', '01 / RIICHI BASICS'],
          ['full', '四人打ち・半荘', '東場・南場を通して対局。役・符・翻・リーチ・鳴き・点数精算を体験。', '02 / FULL MATCH'],
          ['rogue', '牌の旅・ローグライク', '面子を選んで得点化。教本・遺物・花牌・金箔牌を組み合わせ、8つの関門へ。', '03 / BUILD YOUR RUN'],
        ] as const).map(([next, title, description, badge]) => <article key={next}><small>{badge}</small><h2>{tr(title)}</h2><p>{tr(description)}</p><button type="button" className="mj-primary" data-gamepad-zone="mahjong-modes" onClick={() => openMode(next)}>{tr('開始')}</button>{next === 'rogue' && continueAvailable && <button type="button" onClick={() => openMode('rogue', true)}>{tr('続きから')}</button>}</article>)}</div>
      </div> : mode === 'rogue' ? <>
        {saveFailed && <p role="alert">{tr('保存できませんでした。端末の空き容量を確認してください。')}</p>}
        <div className="mj-run-stats"><b>{tr('関門')} {rogue.stage} / {rogue.stage > 8 ? '∞' : 8}</b><span>{tr('目標')} {rogueGoal(rogue.stage).toLocaleString()}</span><span>{tr('コイン')} {rogue.coins}</span><span>{tr('交換')} {rogue.exchanges}</span><span>{tr('道具')} {rogue.tools}</span></div>
        {bossRule(rogue.stage) && <p className="mj-seal">{tr(bossRule(rogue.stage))}</p>}
        <div className="mj-run-layout"><section className="mj-run-main">
          <h2>{tr('確定した組')} {rogue.banks.length}/5</h2><div className="mj-banks">{rogue.banks.map((b, i) => <div key={i}><small>{tr(GROUP_NAMES[b.kind])}</small><div>{b.tiles.map(t => <span key={t.id}>{art(t)}</span>)}</div></div>)}{Array.from({ length: 5 - rogue.banks.length }, (_, i) => <div className="mj-empty-bank" key={`empty-${i}`}>{i + rogue.banks.length + 1}</div>)}</div>
          <div className="mj-flower-row"><span>{tr('花牌')} {rogue.flowers.length}</span>{rogue.flowers.map(t => <span title={label(t)} key={t.id}>{art(t, true)}</span>)}</div>
          <h2>{tr('得点予測')}</h2>{scoreDetails(estimate)}
          {rogue.phase === 'play' && <><p className="mj-guide">{tr('16枚から順子・刻子・槓子を4組と、雀頭を1組選んで確定します。')}</p>{tileButtons(rogue.hand, true)}<div className="mj-actions"><button type="button" className="mj-primary" disabled={!canBank} onClick={() => runAct({ type: 'bank', ids: selection })}>{tr('組を確定')}{chosenKind ? ` · ${tr(GROUP_NAMES[chosenKind])}` : ''}</button><button type="button" disabled={!selection.length || selection.length > 5 || rogue.exchanges === 0} onClick={() => runAct({ type: 'exchange', ids: selection })}>{tr('選んだ牌を交換')}</button><button type="button" disabled={selection.length !== 1 || !rogue.tools || chosenTiles[0]?.type >= 27} onClick={() => runAct({ type: 'tool', ids: selection })}>{tr('数字を＋1')}</button><button type="button" onClick={() => setSelection(bankHint(rogue.hand, rogue.banks))}>{tr('形のヒント')}</button><button type="button" onClick={() => setSelection([])}>{tr('選択を解除')}</button></div><button type="button" className="mj-muted" onClick={() => runAct({ type: 'settle' })}>{tr('旅を終了して精算')}</button></>}
          {rogue.phase !== 'play' && <section className="mj-run-result" role="status"><h2>{tr(rogue.phase === 'lost' ? '冒険終了' : rogue.phase === 'won' ? '8関門踏破！' : '関門突破！')}</h2><p>{tr('今回の得点')} {rogue.score.toLocaleString()} / {rogueGoal(rogue.stage).toLocaleString()} · {tr('合計得点')} {rogue.total.toLocaleString()}</p>{rogue.phase === 'shop' ? <button type="button" className="mj-primary" onClick={() => runAct({ type: 'next' })}>{tr('次の関門へ')}</button> : rogue.phase === 'won' ? <button type="button" className="mj-primary" onClick={() => runAct({ type: 'next' })}>{tr('エンドレスへ')}</button> : <button type="button" onClick={() => openMode('rogue')}>{tr('新しい旅')}</button>}</section>}
        </section><aside className="mj-run-sidebar"><h2>{tr('教本')}</h2>{PATTERNS.map(p => <div key={p.id} className="mj-book"><b>{tr(p.name)} · Lv.{rogue.levels[p.id]}</b><small>{tr(p.description)}</small></div>)}<h2>{tr('遺物')} {rogue.relics.length}/8</h2>{rogue.relics.map(id => { const r = RELICS.find(r => r.id === id)!; return <div key={id} className="mj-book"><b>{tr(r.name)}</b><small>{tr(r.description)}</small></div>; })}</aside></div>
        {rogue.phase === 'shop' && <section className="mj-shop"><h2>{tr('旅のショップ')} · {tr('コイン')} {rogue.coins}</h2><label>{tr('対象の牌')} <select value={shopTarget} onChange={e => setShopTarget(e.target.value)}><option value="">—</option>{rogue.deck.filter(t => t.type < 34).map(t => <option value={t.id} key={t.id}>{label(t)}{t.foil ? ' ✦' : ''} · {t.id}</option>)}</select></label><div className="mj-shop-grid">{rogue.offers.map(o => {
          const content = o.kind === 'relic' ? RELICS.find(r => r.id === o.target) : o.kind === 'pattern' ? PATTERNS.find(p => p.id === o.target) : null;
          const name = content?.name || ({ foil: '金箔を付ける', copy: '牌を複製', remove: '牌を削除', tool: '道具を補充' } as Record<string, string>)[o.kind];
          const targeted = ['foil', 'copy', 'remove'].includes(o.kind);
          return <article key={o.id}><h3>{tr(name)}</h3>{content && <p>{tr(content.description)}</p>}<strong>{o.price} {tr('コイン')}</strong><button type="button" disabled={o.sold || rogue.coins < o.price || (targeted && !shopTarget) || (o.kind === 'relic' && rogue.relics.length >= 8)} onClick={() => runAct({ type: 'buy', id: o.id, targetId: shopTarget })}>{tr(o.sold ? '購入済み' : '購入')}</button></article>;
        })}</div></section>}
      </> : <>
        <div className="mj-toolbar"><strong>{tr(HONORS[Math.floor(table.round / 4)])} {table.round % 4 + 1} {tr('局')} · {table.honba} {tr('本場')}</strong><span>{tr('供託')} {table.sticks * 1000}</span><label><input type="checkbox" checked={guide} onChange={e => setGuide(e.target.checked)} /> {tr('ガイド表示')}</label></div>
        <div className="mj-table">{renderSeat(2, 'north')}{renderSeat(3, 'west')}<section className="mj-center"><b>{tr('残り山')} {table.wall.length}</b><small>{tr('ドラ表示牌')}</small><div>{indicators(table).map((type, i) => <span title={label({ id: '', type })} key={i}>{art({ id: `dora-${i}`, type }, true)}</span>)}</div><p>{tr(table.phase === 'reaction' ? '捨て牌への応答' : table.turn === 0 ? 'あなた' : 'CPUの手番')}</p>{table.pending && <span className="mj-last-discard" title={label(table.pending.tile)}>{art(table.pending.tile)}</span>}</section>{renderSeat(1, 'east')}{renderSeat(0, 'south')}</div>
        <section className="mj-player-area"><div className="mj-player-meta"><h2>{tr('手牌')} {player.hand.length} {tr('枚')} + {tr('固定面子')} {player.melds.length}</h2>{guide && <b>{distance < 0 ? tr('和了形') : distance === 0 ? tr('テンパイ') : `${tr('あと')} ${distance} ${tr('向聴')}`}</b>}{isFuriten(table, 0) && <em>{tr('フリテン：ロン不可・ツモ可')}</em>}</div>
          {guide && <p className="mj-guide">{tr(player.riichi ? 'リーチ後は原則ツモ切りです。和了できる時はツモ・ロンを選べます。' : myTurn && !table.drawn ? '鳴いた後はツモらずに1枚捨てます。副露を含めた枚数を確認しましょう。' : player.melds.length > 0 ? '固定面子を含めて4面子＋1雀頭を目指します。カン1組につき実際の牌は1枚増えます。' : '13枚から1枚ツモり、14枚の中から不要な1枚を選んで捨てます。')}</p>}
          {tileButtons(player.hand, false)}
          {guide && currentWaits.length > 0 && <div className="mj-waits"><span>{tr('待ち牌')}</span>{currentWaits.map(type => <span key={type} title={label({ id: '', type })}>{art({ id: `wait-${type}`, type }, true)}</span>)}</div>}
          {guide && myTurn && shapes(player.hand, player.melds).length > 0 && !legalTsumo && <p className="mj-warning">{tr('形は完成していますが、役がありません。リーチや役牌などの条件を確認しましょう。')}</p>}
          <div className="mj-actions" aria-live="polite">
            {table.turn === 0 && table.phase === 'draw' && <button type="button" className="mj-primary" onClick={() => act({ type: 'draw' })}>{tr('ツモる')}</button>}
            {myTurn && <><button type="button" className="mj-primary" disabled={selection.length !== 1} onClick={() => act({ type: 'discard', id: selection[0], riichi })}>{tr('捨てる')}</button>{legalTsumo && <button type="button" className="mj-win" onClick={() => act({ type: 'tsumo' })}>{tr('ツモ和了')}</button>}{legalRiichi.length > 0 && <button type="button" onClick={() => { setRiichi(!riichi); setSelection([]); }}>{tr(riichi ? 'リーチ取消' : 'リーチを宣言')}</button>}{kanTypes(table).map(type => <button type="button" key={type} onClick={() => act({ type: 'kan', tileType: type })}>{tr('カン')} {label({ id: '', type })}</button>)}{guide && !player.riichi && <button type="button" onClick={() => setSelection([player.hand[bestDiscard(player.hand, player.melds)].id])}>{tr('形のヒント')}</button>}</>}
            {calls.map((call, i) => <button key={i} type="button" className={call.kind === 'ron' ? 'mj-win' : ''} onClick={() => act({ type: 'react', call })}>{tr(({ ron: 'ロン', pon: 'ポン', chi: 'チー', kan: 'カン' })[call.kind])}<span className="mj-call-tiles">{call.ids.map(id => <span key={id}>{art(player.hand.find(t => t.id === id)!, true)}</span>)}</span></button>)}
            {calls.length > 0 && <button type="button" onClick={() => act({ type: 'react' })}>{tr('見送る')}</button>}
          </div>{riichi && <p role="status">{tr('リーチ宣言牌を選んでください')}</p>}
        </section><p className="mj-event" role="status">{tr(table.history.at(-1) || '')}</p>
        {(table.phase === 'result' || table.phase === 'finished') && <section className="mj-results" role="dialog" aria-modal="true" aria-labelledby="mj-result-title" data-gamepad-modal="true"><div><h2 id="mj-result-title">{tr(table.phase === 'finished' ? '対局結果' : '局の結果')}</h2>
          {table.phase === 'result' && table.result && <><h3>{table.result.winner === null ? tr('流局') : `${nameOf(table.result.winner)} · ${tr(table.result.from === null ? 'ツモ和了' : 'ロン')}`}</h3>{table.result.hand && <div className="mj-winning-hand">{[...table.result.hand, ...(table.result.melds || []).flatMap(m => m.tiles)].map((t, i) => <span title={label(t)} key={`${t.id}-${i}`}>{art(t)}</span>)}</div>}{table.result.score && <><strong>{table.result.score.fu} {tr('符')} · {table.result.score.han} {tr('翻')} · {tr(table.result.score.limit)} · {table.result.score.total.toLocaleString()} {tr('点')}</strong><div className="mj-yaku-list">{table.result.score.yaku.map((y, i) => <span key={i}>{tr(y.name)} {y.han}{tr('翻')}</span>)}{table.result.score.dora > 0 && <span>{tr('ドラ')} {table.result.score.dora}</span>}</div></>}</>}
          <ol className="mj-ranking">{table.players.map((p, seat) => ({ ...p, seat })).sort((a, b) => b.points - a.points || a.seat - b.seat).map((p, i) => <li key={p.seat}><b>{i + 1}. {nameOf(p.seat)}</b><span>{p.points.toLocaleString()} {tr('点')}</span>{table.phase === 'result' && <span>{table.result!.delta[p.seat] > 0 ? '+' : ''}{table.result!.delta[p.seat]} {table.result!.tenpai && tr(table.result!.tenpai[p.seat] ? 'テンパイ' : 'ノーテン')}</span>}</li>)}</ol>
          {table.phase === 'result' ? <button type="button" className="mj-primary" onClick={() => act({ type: 'next' })}>{tr('次の局へ')}</button> : <button type="button" className="mj-primary" onClick={() => openMode(mode)}>{tr('新しい対局')}</button>}<button type="button" onClick={canLeave}>{tr('モード選択へ')}</button>
        </div></section>}
      </>}
    </div>
    {help && <div className="mj-modal" data-gamepad-modal="true"><section role="dialog" aria-modal="true" aria-labelledby="mj-help-title"><h2 id="mj-help-title">{tr('ルールと役')}</h2><h3>{tr('四人打ちを学ぶ')}</h3>{guideCopy.map(s => <p key={s}>{tr(s)}</p>)}<h3>{tr('主な役と条件')}</h3>{yakuGuide.map(([name, condition]) => <p key={name}><b>{tr(name)}</b><br />{tr(condition)}</p>)}<h3>{tr('牌の旅・ローグライク')}</h3>{rogueCopy.map(s => <p key={s}>{tr(s)}</p>)}<button type="button" className="mj-primary" onClick={() => setHelp(false)}>{tr('閉じる')}</button></section></div>}
  </div>;
}

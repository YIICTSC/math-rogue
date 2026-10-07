import {useRpgMusic} from './music';
import React, { useEffect, useRef, useState } from 'react';
import TranslatedUiTree from '../components/TranslatedUiTree';
import type { LanguageMode } from '../types';
import type { Action, Adventurer } from './engine';
import { audioService } from '../services/audioService';
import './arcade.css';
import { arcadeArt } from './arcadeAssets';

type Game = 'FLIP' | 'ROULETTE' | 'SLOT';
const games: { id: Game; title: string; art: string; rules: string }[] = [
  { id: 'FLIP', title: 'カードめくり', art: 'cards', rules: '3枚から1枚を選ぼう。当たりでカードと20コイン！' },
  { id: 'ROULETTE', title: 'ルーレット', art: 'roulette', rules: '赤・青・緑から予想。当たりで20コインとHP20％回復！' },
  { id: 'SLOT', title: 'スロット', art: 'slots', rules: '星が3つそろえば大当たり！50コインを獲得！' },
];

export default function ArcadeModal({ me, siteId, ready, visible, languageMode, send, onClose }: {
  me: Adventurer; siteId: string; ready: boolean; visible: boolean; languageMode: LanguageMode;
  send: (action: Action) => void; onClose: () => void;
}) {
  const [game, setGame] = useState<Game | null>(null);
  const [choice, setChoice] = useState(0);
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [stops, setStops] = useState(0);
  const [tick, setTick] = useState(0);
  const baseline = useRef(me.arcadeOutcome?.token);
  const submitted = useRef(false);
  const dialog = useRef<HTMLDivElement>(null);
  const outcome = me.arcadeOutcome?.token !== baseline.current ? me.arcadeOutcome : undefined;
  useRpgMusic(visible?(outcome&&revealed?'catch':'arcade'):null,20,'arcade');
  const busy = waiting || !!me.arcadePending;
  const remaining = Math.max(0, 3 + Math.floor(me.completedBattles / 3) - (me.arcadeUses || 0));
  const canPlay = ready && !busy && !outcome && remaining > 0 && me.gold >= 10;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    return () => previous?.focus();
  }, []);
  useEffect(() => { if (visible) dialog.current?.focus(); }, [visible]);
  useEffect(() => {
    if (!waiting || me.arcadePending || outcome) return;
    const timeout = window.setTimeout(() => { submitted.current = false; setWaiting(false); setError(true); }, 8000);
    return () => window.clearTimeout(timeout);
  }, [waiting, me.arcadePending, outcome]);
  useEffect(() => {
    if (!outcome) return;
    setWaiting(false);
    submitted.current = false;
    setStops(0); setRevealed(false);
    if (outcome.game === 'SLOT') return;
    const timeout = window.setTimeout(() => setRevealed(true), 1800);
    return () => window.clearTimeout(timeout);
  }, [outcome?.token]);
  useEffect(() => {
    if (!outcome || revealed) return;
    const interval = window.setInterval(() => setTick(t => t + 1), 100);
    return () => window.clearInterval(interval);
  }, [outcome?.token, revealed]);
  useEffect(() => {
    if (revealed && outcome) audioService.playSound(outcome.win ? 'win' : 'select');
  }, [revealed]);
  const play = () => {
    if (!game || !canPlay || submitted.current) return;
    submitted.current = true; setWaiting(true); setError(false);
    audioService.playSound('select');
    send({ type: 'arcade-play', siteId, game, choice });
  };
  const again = () => {
    audioService.playBGM('shop');
    baseline.current = outcome?.token;
    setGame(null); setRevealed(false); setStops(0); setWaiting(false);
  };
  const stopReel = () => {
    audioService.playSound('select');
    setStops(n => { if (n >= 2) setRevealed(true); return Math.min(3, n + 1); });
  };
  const art = games.find(g => g.id === (outcome?.game || game));
  return <TranslatedUiTree mode={languageMode}>
    <div className="rpg-arcade-backdrop" onKeyDown={e => {
      e.stopPropagation();
      if (e.key === 'Escape' && !busy) onClose();
      if (e.key === 'Tab') {
        const buttons = Array.from(dialog.current?.querySelectorAll('button:not(:disabled)') || []) as HTMLButtonElement[];
        const first = buttons[0], last = buttons[buttons.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && (document.activeElement === last || document.activeElement === dialog.current)) { e.preventDefault(); first?.focus(); }
      }
    }}>
      <div ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="rpg-arcade-title" className="rpg-arcade-dialog">
        <header className="rpg-arcade-hero" style={{ backgroundImage: `url(${arcadeArt(art?.art || 'town')})` }}>
          <div><span>町のゲームセンター</span><h2 id="rpg-arcade-title">{art?.title || 'ひと息、わくわく。'}</h2></div>
          <button className="rpg-arcade-close" disabled={busy} onClick={onClose} aria-label="閉じる">×</button>
        </header>
        <div className="rpg-arcade-content">
          <div className="rpg-arcade-wallet"><span>所持コイン</span><strong>{me.gold}</strong><span>残り回数</span><strong>{remaining}</strong></div>
          {!outcome && <>
            <p>1回10コイン。問題に正解して景品に挑戦！3問以上正解で10コインの追加報酬。</p>
            <p className="rpg-arcade-muted">戦闘3勝で利用回数が1回増えます。</p>
            {!game ? <div className="rpg-arcade-games">{games.map(g => <button key={g.id} onClick={() => { setGame(g.id); setChoice(0); audioService.playSound('select'); }}>
              <img src={arcadeArt(g.art)} alt="" /><strong>{g.title}</strong><span>{g.rules}</span><b>遊ぶ →</b>
            </button>)}</div> : <>
              <p>{art?.rules}</p>
              {game === 'FLIP' && <div className="rpg-arcade-cards">{[0, 1, 2].map(i => <button key={i} aria-pressed={choice === i} disabled={busy} onClick={() => setChoice(i)}><span>✦</span><small>カード {i + 1}</small></button>)}</div>}
              {game === 'ROULETTE' && <div className="rpg-arcade-colors">{['赤', '青', '緑'].map((label, i) => <button key={i} aria-pressed={choice === i} disabled={busy} onClick={() => setChoice(i)} style={{ borderColor: ['#ff7b77', '#79c8ff', '#84e7b1'][i] }}>{label}</button>)}</div>}
              {game === 'SLOT' && <div className="rpg-arcade-reels"><span>★</span><span>◆</span><span>♬</span></div>}
              <p className="rpg-arcade-muted">問題なしで遊べます。当たりは抽選です。</p>
              <button className="rpg-arcade-primary" disabled={!canPlay} onClick={play}>{busy ? '抽選しています…' : '10コインで挑戦する'}</button>
              {!busy && <button className="rpg-arcade-secondary" onClick={() => setGame(null)}>ゲームを選び直す</button>}
            </>}
            {error && <p role="alert">開始できませんでした。接続と利用回数を確認してください。</p>}
            {!ready && <p role="status">町のデータを同期しています…</p>}
            {remaining === 0 && <p role="status">戦闘3勝でゲームセンターの利用回数が増えます。</p>}
            {me.gold < 10 && <p role="status">10コインが必要です。</p>}
          </>}
          {outcome && <>
            {outcome.game === 'SLOT' && <><div className="rpg-arcade-reels">{[0, 1, 2].map(i => <span key={i} className={i >= stops ? 'rolling' : ''}>{i < stops ? (outcome.roll === 0 ? '★' : ['★', '◆', '♬'][(outcome.roll + i) % 3]) : ['★', '◆', '♬'][tick % 3]}</span>)}</div>
              {!revealed && <><p>3つのリールを順に止めよう！</p><button className="rpg-arcade-primary" onClick={stopReel}>リールを止める</button></>}
            </>}
            {outcome.game === 'FLIP' && <div className={`rpg-arcade-cards ${revealed ? 'revealed' : ''}`}>{[0, 1, 2].map(i => <div key={i} className={outcome.choice === i ? 'picked' : ''}><span>{revealed ? (outcome.roll % 3 === i ? '★' : '◇') : '✦'}</span><small>カード {i + 1}</small></div>)}</div>}
            {outcome.game === 'ROULETTE' && <div className="rpg-arcade-wheel-wrap"><div className={`rpg-arcade-wheel ${revealed ? 'settled' : ''}`} style={{ transform: `rotate(${1080 + 300 - (outcome.roll % 3) * 120}deg)` }}>★</div><span className="rpg-arcade-pointer">▼</span>{revealed && <strong>{['赤', '青', '緑'][outcome.roll % 3]}</strong>}</div>}
            <div aria-live="polite" className={`rpg-arcade-result ${revealed && outcome.win ? 'jackpot' : ''}`}>
              {revealed ? <><h3>{outcome.win ? '当たり！ 景品を獲得しました。' : '今回はハズレ。次の探索へ！'}</h3>
                <div className="rpg-arcade-prizes"><span>獲得コイン</span><strong>+{outcome.gold}</strong>{outcome.heal > 0 && <><span>HP回復</span><strong>+{outcome.heal}</strong></>}{outcome.card && <strong>{outcome.card.name}</strong>}</div>
                {!outcome.win && outcome.correctCount === 0 && <p>景品獲得には問題の正解が必要です。</p>}
                <button className="rpg-arcade-primary" onClick={again}>もう一度遊ぶ</button><button className="rpg-arcade-secondary" onClick={onClose}>探索へ戻る</button>
              </> : <p>結果発表！</p>}
            </div>
          </>}
        </div>
      </div>
    </div>
  </TranslatedUiTree>;
}

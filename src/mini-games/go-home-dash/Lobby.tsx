import React, { useState } from 'react';
import { PROTAGONISTS } from '../../three/protagonistCatalog';
import { isProtagonistUnlocked, protagonistUnlockRequirement } from '../../utils/protagonistUnlocks';
import { assetUrl } from '../../utils/assetPaths';
import { trans } from '../../utils/textUtils';
import type { LanguageMode } from '../../types';
import { DASH_HERO_ART } from './heroes';
import './dash.css';

export const DASH_HEROES = PROTAGONISTS.filter(h => !h.id.startsWith('elementary-'));
export const DEFAULT_DASH_HERO = 'high-school-warrior';
export function DashLobby({ hero, onHero, onStart, onBack, languageMode, oneHit, exitEnabled }: {
  hero: string; onHero: (id: string) => void; onStart: () => void; onBack: () => void;
  languageMode: LanguageMode; oneHit: boolean; exitEnabled: boolean;
}) {
  const [picking, setPicking] = useState(false);
  const [chapter, setChapter] = useState('high-school');
  const L = (ja: string, en: string, hi: string) => languageMode === 'ENGLISH' ? en : languageMode === 'HIRAGANA' ? hi : ja;
  return <div className="dash-lobby" data-gamepad-modal data-gamepad-initial-scope="go-home-start" onPointerDown={e => e.stopPropagation()}>
    <img className="dash-title-art" src={assetUrl('sprites/go-home-dash/title.webp')} alt="" />
    <div className="dash-title-copy"><small>AFTER SCHOOL / FULL SPEED</small><h2>{L('帰宅ダッシュ！', 'HOME DASH!', 'きたくダッシュ！')}</h2>
      <p>{oneHit ? L('一発アウト・HP 1', 'ONE HIT · HP 1', 'いっぱつアウト・HP 1') : L('夕焼けを追い越せ。空まで、帰り道。', 'Outrun the sunset. Take the skyway home.', 'ゆうやけをおいこせ。そらまで、かえりみち。')}</p>
    </div>
    <section className="dash-boarding">
      <div className="dash-selected"><img src={assetUrl(DASH_HERO_ART[hero])} alt="" /><div><small>RUNNER / {hero.startsWith('magic-') ? 'MAGIC' : 'HIGH SCHOOL'}</small><strong>{trans(DASH_HEROES.find(h => h.id === hero)?.name ?? '', languageMode)}</strong><button onClick={() => setPicking(!picking)} aria-expanded={picking}>{L('主人公を選ぶ', 'Choose runner', 'しゅじんこうをえらぶ')} ↗</button></div></div>
      {picking && <div className="dash-picker" data-gamepad-navigation-root>
        <div role="tablist">{(['high-school', 'magic'] as const).map(id => <button key={id} role="tab" aria-selected={chapter === id} onClick={() => setChapter(id)}>{id === 'magic' ? L('マジック編', 'Magic academy', 'マジックへん') : L('高校編', 'High school', 'こうこうへん')}</button>)}</div>
        <div className="dash-roster">{DASH_HEROES.filter(h => h.id.startsWith(chapter)).map(h => {
          const unlocked = isProtagonistUnlocked(h.id), requirement = protagonistUnlockRequirement(h.id);
          return <button key={h.id} className="dash-hero" data-hero={h.id} aria-pressed={hero === h.id} disabled={!unlocked} onClick={() => { onHero(h.id); setPicking(false); }}>
            <img src={assetUrl(DASH_HERO_ART[h.id])} alt="" /><span>{trans(h.name, languageMode)}</span>{!unlocked && <small>🔒 {L('本編クリア', 'Chapter clears', 'ほんぺんクリア')} {requirement?.clears}</small>}
          </button>;
        })}</div>
      </div>}
      <p className="dash-instructions">{L('タップ・Space・A：ジャンプ ／ Shift：ダッシュ', 'Tap · Space · A: jump / Shift: dash', 'タップ・Space・A：ジャンプ ／ Shift：ダッシュ')}<br/>{L('長押しで高く。空ではタップで羽ばたき、隙間を通過。', 'Hold for height. In flight, tap to flap through gaps.', 'ながおしでたかく。そらではタップではばたき、すきまをつうか。')}</p>
      <button className="dash-depart" data-gamepad-initial-choice onClick={onStart}>START DASH <span>→</span></button>
      {exitEnabled && <button className="dash-back" onClick={onBack}>← {L('タイトルに戻る', 'Back to title', 'タイトルにもどる')}</button>}
    </section>
  </div>;
}

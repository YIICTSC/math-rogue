import React, { useState } from 'react';
import { PROTAGONISTS } from '../../three/protagonistCatalog';
import { isProtagonistUnlocked, protagonistUnlockRequirement } from '../../utils/protagonistUnlocks';
import { assetUrl } from '../../utils/assetPaths';
import { trans } from '../../utils/textUtils';
import type { RunMode, ArcadeProfile } from './arcade';
import type { LanguageMode } from '../../types';
import { DASH_HERO_ART } from './heroes';
import './dash.css';

export const DASH_HEROES = PROTAGONISTS.filter(h => !h.id.startsWith('elementary-'));
export const DEFAULT_DASH_HERO = 'high-school-warrior';
export function DashLobby({ hero, onHero, onStart, onBack, languageMode, oneHit, exitEnabled, runMode, onRunMode, profile }: {
  hero: string; onHero: (id: string) => void; onStart: () => void; onBack: () => void;
  languageMode: LanguageMode; oneHit: boolean; exitEnabled: boolean;
  runMode:RunMode; onRunMode:(mode:RunMode)=>void; profile:ArcadeProfile;
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
      <div className="dash-mode-picker" role="radiogroup" aria-label={L('走り方','Run mode','はしりかた')}>
        {(['classic','daily','practice'] as const).map(mode=><button key={mode} role="radio" aria-checked={runMode===mode} onClick={()=>onRunMode(mode)}>{mode==='classic'?L('通常','Classic','つうじょう'):mode==='daily'?L('デイリー','Daily','デイリー'):L('練習','Practice','れんしゅう')}</button>)}
      </div>
      <p className="dash-mode-description">{runMode==='daily'?L('今日の固定コースに挑戦。日付はUTC基準。','Today’s seeded course. Date uses UTC.','きょうのこていコースにちょうせん。ひづけはUTCきじゅん。'):runMode==='practice'?L('3000ごとに再開地点を保存。ランキング対象外。','Retry from each 3000m checkpoint. Not ranked.','3000ごとにさいかいちてんをほぞん。ランキングたいしょうがい。'):L('コイン・コンボ・変身で最高記録を目指せ！','Collect, chain combos and transform for a new best!','コイン・コンボ・へんしんでさいこうきろくをめざせ！')}</p>
      <div className="dash-career">◉ {profile.coins} · ✦ {profile.stars} · BEST {profile.bestCombo} COMBO{runMode==='daily'&&<span> · DAILY {profile.dailyDay===new Date().toISOString().slice(0,10)?profile.dailyBest:0}</span>}</div>
      <p className="dash-instructions">{L('タップ・Space・A：ジャンプ ／ Shift・X：ダッシュ', 'Tap · Space · A: jump / Shift · X: dash', 'タップ・Space・A：ジャンプ ／ Shift・X：ダッシュ')}<br/>{L('長押しで高く。空ではタップで羽ばたき、隙間を通過。', 'Hold for height. In flight, tap to flap through gaps.', 'ながおしでたかく。そらではタップではばたき、すきまをつうか。')}</p>
      <details className="dash-field-guide"><summary>{L('新しいアクションを見る','Field guide','あたらしいアクションをみる')}</summary><p>{L('↓・S・Bでスライド。空中なら急降下。光るオーブの近くでジャンプすると再跳躍！ 重力反転はタップ、ウェーブとロケットは長押しで上昇。コインと回避でフィーバー、ボスにはダッシュで反撃。100コイン・スター5個で軌跡の色が変化。Pで一時停止。','Down · S · B slides or dives. Tap near a glowing orb to jump again. Tap to flip gravity; hold to rise in wave or rocket mode. Coins and dodges fuel Fever. Dash to strike the boss. Trail colors unlock at 100 coins and 5 stars. P pauses.','↓・S・Bでスライド。くうちゅうならきゅうこうか。ひかるオーブのちかくでジャンプするとさいちょうやく！ じゅうりょくはんてんはタップ、ウェーブとロケットはながおしでじょうしょう。コインとかいひでフィーバー、ボスにはダッシュではんげき。100コイン・スター5こできせきのいろがへんか。Pでいちじていし。')}</p></details>
      <button className="dash-depart" data-gamepad-initial-choice onClick={onStart}>START DASH <span>→</span></button>
      {exitEnabled && <button className="dash-back" onClick={onBack}>← {L('タイトルに戻る', 'Back to title', 'タイトルにもどる')}</button>}
    </section>
  </div>;
}

import React, { useEffect, useRef, useState } from 'react';
import type { LanguageMode } from '../../types';
import { assetUrl } from '../../utils/assetPaths';
const SEEN_KEY='home-dash-guide-v1';
let seenThisSession=false;
export function hasSeenDashGuide(){try{return seenThisSession||localStorage.getItem(SEEN_KEY)==='seen';}catch{return seenThisSession;}}
export function rememberDashGuide(){seenThisSession=true;try{localStorage.setItem(SEEN_KEY,'seen');}catch{/* The session still remembers when storage is unavailable. */}}
type Copy=[string,string,string];
type Page={id:string;title:Copy;tips:Copy[]};
export const DASH_GUIDE_PAGES:Page[]=[
 {id:'jump',title:['ジャンプと操作','Jump and controls','ジャンプとそうさ'],tips:[
  ['画面タップ・Space・コントローラーAでジャンプ。長押しで高く飛ぶ。2段・3段ジャンプは強化カードで解放。','Tap the course, press Space or controller A to jump. Hold for height. Upgrade cards unlock double and triple jumps.','がめんタップ・Space・コントローラーAでジャンプ。ながおしでたかくとぶ。2だん・3だんジャンプはきょうかカードでかいほう。'],
  ['スマホは下の操作ボタンも使える。ジャンプを押したまま、別の指でダッシュできる。','On touchscreens, use the bottom buttons. Hold jump and dash with another finger.','スマホはしたのそうさボタンもつかえる。ジャンプをおしたまま、べつのゆびでダッシュできる。']]},
 {id:'dash',title:['5秒ターボ・ダッシュ','Five-second turbo dash','5びょうターボ・ダッシュ'],tips:[
  ['Shift・X・ダッシュボタンで5秒加速！ 加速中は敵や壊せる壁へ突進できる。','Press Shift, controller X or DASH for five seconds of speed. Charge through enemies and breakable walls.','Shift・X・ダッシュボタンで5びょうかそく！ かそくちゅうはてきやこわせるかべへとっしんできる。'],
  ['再充電が終わるとまた使える。電池アイテムは待ち時間をリセット。矢印の加速パッドも5秒間スピードアップ。','Use it again after recharging. A battery resets the cooldown. Arrow boost pads also give five seconds of speed.','さいじゅうでんがおわるとまたつかえる。でんちアイテムはまちじかんをリセット。やじるしのかそくパッドも5びょうかんスピードアップ。']]},
 {id:'slide',title:['スライド・急降下','Slide and dive','スライド・きゅうこうか'],tips:[
  ['↓・S・コントローラーB・スライドボタンで姿勢を低くし、低いトンネルをくぐろう。','Press Down, S, controller B or SLIDE to duck under low tunnels.','↓・S・コントローラーB・スライドボタンでしせいをひくくし、ひくいトンネルをくぐろう。'],
  ['空中では同じ操作で急降下。空を飛んでいる間はスライドできない。','The same action dives while jumping. Sliding is unavailable in flying stages.','くうちゅうではおなじそうさできゅうこうか。そらをとんでいるあいだはスライドできない。']]},
 {id:'routes',title:['帰り道と階段','Routes and stairs','かえりみちとかいだん'],tips:[
  ['画面右上のDISTANCEが3000増えるたびに次のマップへ。背景がゆっくり変わるのが合図。','The map changes every 3000 on the DISTANCE counter. Watch for the gradual background transition.','がめんみぎうえのDISTANCEが3000ふえるたびにつぎのマップへ。はいけいがゆっくりかわるのがあいず。'],
  ['階段は本物の足場。ジャンプで登ろう。壁と画面端に挟まれたり、穴に落ちたりするとHPが減る。','Stairs are solid platforms: jump onto them. Getting crushed against the screen edge or falling into a hole costs HP.','かいだんはほんもののあしば。ジャンプでのぼろう。かべとがめんはしにはさまれたり、あなにおちたりするとHPがへる。']]},
 {id:'flight',title:['空では羽ばたく','Flap through the sky','そらでははばたく'],tips:[
  ['空のステージでは自動で飛行。タップ・Space・Aを押すたびに羽ばたき、離すと落ちる。','Sky routes start flying automatically. Tap, Space or A flaps upward; release to descend.','そらのステージではじどうでひこう。タップ・Space・Aをおすたびにはばたき、はなすとおちる。'],
  ['上下のゲートの隙間を通過しよう。天井・地面・障害物にぶつからない高さを保つのがコツ。','Fly through gaps between the upper and lower gates. Keep clear of the ceiling, ground and obstacles.','じょうげのゲートのすきまをつうかしよう。てんじょう・じめん・しょうがいぶつにぶつからないたかさをたもつのがコツ。']]},
 {id:'collect',title:['コイン・コンボ・フィーバー','Coins, combos and Fever','コイン・コンボ・フィーバー'],tips:[
  ['コインとレアスターを集め、敵をかわしてコンボをつなごう。間が空くとコンボが切れる。','Collect coins and rare stars, and dodge enemies to chain combos. Long gaps break the chain.','コインとレアスターをあつめ、てきをかわしてコンボをつなごう。まがあくとコンボがきれる。'],
  ['FLOWが満タンになるとフィーバー！ 回収や回避で勢いを保とう。コイン25枚・回避8回・破壊3回のミッションにも挑戦。','Fill FLOW to enter Fever! Keep collecting and dodging. Missions reward 25 coins, eight dodges and three breaks.','FLOWがまんタンになるとフィーバー！ かいしゅうやかいひでいきおいをたもとう。コイン25まい・かいひ8かい・はかい3かいのミッションにもちょうせん。'],
  ['集めた記録は保存される。累計100コイン・スター5個で軌跡の色が変わる。','Your collection is saved. Trail colors unlock at 100 total coins and five stars.','あつめたきろくはほぞんされる。るいけい100コイン・スター5こできせきのいろがかわる。']]},
 {id:'powers',title:['お助けアイテム','Power-ups','おたすけアイテム'],tips:[
  ['磁石はコインを引き寄せ、2枚コインはスコア倍率アップ。シールドは被弾を防ぎ、ボードは1回の衝突を身代わりにする。','Magnets attract coins; double coins increase your score multiplier. Shields protect you and boards absorb one collision.','じしゃくはコインをひきよせ、2まいコインはスコアばいりつアップ。シールドはひだんをふせぎ、ボードは1かいのしょうとつをみがわりにする。'],
  ['羽付きシューズはジャンプ強化、羽のアイテムは低重力。効果中のアイテムは画面上部で確認できる。','Winged shoes strengthen jumps; the feather lowers gravity. Active effects appear at the top of the screen.','はねつきシューズはジャンプきょうか、はねのアイテムはていじゅうりょく。こうかちゅうのアイテムはがめんじょうぶでかくにんできる。']]},
 {id:'launch',title:['オーブ・バネ・リフト','Orbs, springs and lifts','オーブ・バネ・リフト'],tips:[
  ['光るオーブの近くでジャンプすると、空中でも再跳躍！ 足元のバネやジャンプパッドは自動で大きく弾む。','Press jump near a glowing orb to leap again in midair! Springs and jump pads launch you automatically.','ひかるオーブのちかくでジャンプすると、くうちゅうでもさいちょうやく！ あしもとのバネやジャンプパッドはじどうでおおきくはずむ。'],
  ['動くリフトには上から着地。高いコインの列や次の足場へ飛び移ろう。','Land on moving lifts from above. Use them to reach high coin trails and the next platform.','うごくリフトにはうえからちゃくち。たかいコインのれつやつぎのあしばへとびうつろう。']]},
 {id:'gravity',title:['重力反転','Gravity flip','じゅうりょくはんてん'],tips:[
  ['紫色のポータルで重力反転モードへ。タップ・Space・Aで重力の向きを切り替える。','A purple portal activates gravity mode. Tap, Space or A flips the direction of gravity.','むらさきいろのポータルでじゅうりょくはんてんモードへ。タップ・Space・Aでじゅうりょくのむきをきりかえる。'],
  ['天井側と地面側を行き来し、危険な場所を避けよう。時間が来ると通常の走り方に戻る。','Move between ceiling and ground to avoid hazards. The mode ends automatically when its timer expires.','てんじょうがわとじめんがわをいききし、きけんなばしょをさけよう。じかんがくるとつうじょうのはしりかたにもどる。']]},
 {id:'wave',title:['ウェーブ','Wave mode','ウェーブ'],tips:[
  ['水色のポータルでウェーブモード。ジャンプを長押しすると斜め上へ、離すと斜め下へ。','A cyan portal activates wave mode. Hold jump to travel diagonally upward; release to travel downward.','みずいろのポータルでウェーブモード。ジャンプをながおしするとななめうえへ、はなすとななめしたへ。'],
  ['短く押したり離したりしてジグザグに進み、連続ゲートの隙間を抜けよう。','Alternate short presses and releases to zigzag through consecutive gate gaps.','みじかくおしたりはなしたりしてジグザグにすすみ、れんぞくゲートのすきまをぬけよう。']]},
 {id:'rocket',title:['ロケット','Rocket mode','ロケット'],tips:[
  ['ロケットを取ると空へ！ ジャンプを長押しして上昇し、離して下降する。','Pick up a rocket to take off! Hold jump to rise and release to descend.','ロケットをとるとそらへ！ ジャンプをながおししてじょうしょうし、はなしてかこうする。'],
  ['ゲートや飛んでくる敵を避けよう。普通の空ステージの「押すたび羽ばたく」操作とは違い、押している間ずっと上昇する。','Avoid gates and flying enemies. Unlike normal flight, holding continuously adds upward thrust.','ゲートやとんでくるてきをさけよう。ふつうのそらステージの「おすたびはばたく」そうさとはちがい、おしているあいだずっとじょうしょうする。']]},
 {id:'rail',title:['レール滑走','Rail grinding','レールかっそう'],tips:[
  ['レールへ上から降りると滑走できる。コインの道を拾いながら、次のジャンプへつなごう。','Drop onto rails from above to grind. Follow the coin trail and jump toward the next platform.','レールへうえからおりるとかっそうできる。コインのみちをひろいながら、つぎのジャンプへつなごう。']]},
 {id:'hazards',title:['敵と危険なしかけ','Enemies and hazards','てきときけんなしかけ'],tips:[
  ['トゲ・回転ノコギリ・ミサイルは避けよう。レーザーは点線の予告を見て、光っている間は近づかない。','Avoid spikes, spinning saws and missiles. Watch laser warnings: keep clear when the beam lights up.','トゲ・かいてんノコギリ・ミサイルはさけよう。レーザーはてんせんのよこくをみて、ひかっているあいだはちかづかない。'],
  ['敵は跳ねたり、弾を飛ばしたりする。低いトンネルはスライド、壊せる壁はダッシュで突破。','Enemies may jump or shoot. Slide under low tunnels and dash through breakable walls.','てきははねたり、たまをとばしたりする。ひくいトンネルはスライド、こわせるかべはダッシュでとっぱ。']]},
 {id:'boss',title:['ボスへ反撃','Strike back at the boss','ボスへはんげき'],tips:[
  ['追撃ドローンが現れたらミサイルを避け、ダッシュで反撃！ 上のHPを削って撃退しよう。','When the pursuit drone appears, dodge its missiles and dash to strike back! Deplete its HP to defeat it.','ついげきドローンがあらわれたらミサイルをさけ、ダッシュではんげき！ うえのHPをけずってげきたいしよう。']]},
 {id:'learning',title:['学習とランクアップ','Learning and rank-ups','がくしゅうとランクアップ'],tips:[
  ['走って経験値がたまると学習チャレンジへ。正解してHP回復を狙おう。','Running earns experience and triggers learning challenges. Correct answers can restore HP.','はしってけいけんちがたまるとがくしゅうチャレンジへ。せいかいしてHPかいふくをねらおう。'],
  ['チャレンジ後は強化カードを選ぶ。攻撃やジャンプなどを伸ばして、もっと遠くへ。','After the challenge, pick an upgrade card. Strengthen attacks, jumps and more to go farther.','チャレンジごはきょうかカードをえらぶ。こうげきやジャンプなどをのばして、もっととおくへ。']]},
 {id:'modes',title:['モード・一時停止・再挑戦','Modes, pause and retry','モード・いちじていし・さいちょうせん'],tips:[
  ['通常は最高記録に挑戦。デイリーはUTC日付ごとの固定コース。練習はDISTANCE 3000ごとの地点から再開でき、ランキング対象外。','Classic chases your best. Daily uses a fixed course per UTC date. Practice retries from each 3000 DISTANCE checkpoint and is not ranked.','つうじょうはさいこうきろくにちょうせん。デイリーはUTCひづけごとのこていコース。れんしゅうはDISTANCE 3000ごとのちてんからさいかいでき、ランキングたいしょうがい。'],
  ['P・画面の一時停止ボタンでひと休み。HPがなくなったら再挑戦、または主人公を選び直せる。遊び方はタイトルからいつでも確認できる。','Press P or the pause button for a break. When HP runs out, retry or choose another runner. Reopen this guide from the title anytime.','P・がめんのいちじていしボタンでひとやすみ。HPがなくなったらさいちょうせん、またはしゅじんこうをえらびなおせる。あそびかたはタイトルからいつでもかくにんできる。']]},
];
export function DashGuide({languageMode,starting,onClose}:{languageMode:LanguageMode;starting:boolean;onClose:()=>void}){
 const [index,setIndex]=useState(0),[zoom,setZoom]=useState(false);
 const ref=useRef<HTMLDivElement>(null),heading=useRef<HTMLHeadingElement>(null);
 const lang=languageMode==='ENGLISH'?1:languageMode==='HIRAGANA'?2:0;
 const L=(ja:string,en:string,hi:string)=>[ja,en,hi][lang];
 const page=DASH_GUIDE_PAGES[index],last=index===DASH_GUIDE_PAGES.length-1;
 useEffect(()=>{const previous=document.activeElement as HTMLElement|null;heading.current?.focus();return()=>{if(previous?.isConnected)previous.focus();};},[]);
 useEffect(()=>{setZoom(false);ref.current?.querySelector('.dash-guide-content')?.scrollTo(0,0);},[index]);
 useEffect(()=>{
  const nav=ref.current?.querySelector('nav');if(!nav)return;
  const reveal=()=>{const active=nav.querySelector<HTMLButtonElement>('[aria-current=step]');if(!active)return;const a=active.getBoundingClientRect(),n=nav.getBoundingClientRect();if(nav.scrollWidth>nav.clientWidth)nav.scrollBy({left:a.left-n.left-(nav.clientWidth-a.width)/2});else nav.scrollBy({top:a.top-n.top-(nav.clientHeight-a.height)/2});};
  const observer=new ResizeObserver(reveal);observer.observe(nav);reveal();return()=>observer.disconnect();
 },[index]);
 return <div className="dash-guide-overlay" role="dialog" aria-modal="true" aria-labelledby="dash-guide-heading" data-gamepad-modal data-gamepad-initial-scope={`dash-guide-${index}`} ref={ref}
  onPointerDown={e=>e.stopPropagation()} onKeyDown={e=>{
   if(e.key==='Escape'){e.preventDefault();e.stopPropagation();if(zoom)setZoom(false);else onClose();}
   if(e.key==='Tab'){const buttons=Array.from(ref.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')??[]),first=buttons[0],last=buttons[buttons.length-1];if(e.shiftKey&&(document.activeElement===first||document.activeElement===heading.current)){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}
  }}>
  <section className="dash-guide-panel">
   <header><div><small>HOME DASH / FIELD GUIDE</small><h2 id="dash-guide-heading" ref={heading} tabIndex={-1}>{L('帰り道のアクション図鑑','Your guide to the run home','かえりみちのアクションずかん')}</h2></div><button className="dash-menu-secondary" onClick={onClose}>{starting?L('閉じて走る','Close and run','とじてはしる'):L('閉じる','Close','とじる')} ×</button></header>
   <div className="dash-guide-body">
    <nav aria-label={L('説明の項目','Guide topics','せつめいのこうもく')}>{DASH_GUIDE_PAGES.map((p,i)=><button key={p.id} aria-current={i===index?'step':undefined} onClick={()=>setIndex(i)}><small>{String(i+1).padStart(2,'0')}</small>{p.title[lang]}</button>)}</nav>
    <article className="dash-guide-content" aria-live="polite">
     <p className="dash-guide-count">{index+1} / {DASH_GUIDE_PAGES.length} · {L('実際のゲーム画面','Actual gameplay screenshot','じっさいのゲームがめん')}</p>
     <h3>{page.title[lang]}</h3>
     <button className={`dash-guide-shot${zoom?' is-zoomed':''}`} aria-expanded={zoom} aria-label={L('スクリーンショットを拡大・縮小','Enlarge or shrink screenshot','スクリーンショットをかくだい・しゅくしょう')} onClick={()=>setZoom(!zoom)}><img src={assetUrl(`sprites/go-home-dash/guide/${page.id}.webp`)} alt={page.title[lang]} width={960} height={600}/><span>{L('タップで拡大','Tap to enlarge','タップでかくだい')}</span></button>
     <ul>{page.tips.map((tip,i)=><li key={i}>{tip[lang]}</li>)}</ul>
    </article>
   </div>
   <footer><button className="dash-menu-secondary" disabled={index===0} onClick={()=>setIndex(index-1)}>← {L('前へ','Previous','まえへ')}</button><span>{index+1} / {DASH_GUIDE_PAGES.length}</span><button className="dash-depart" data-gamepad-initial-choice onClick={()=>last?onClose():setIndex(index+1)}>{last?(starting?L('走り出す','Start running','はしりだす'):L('確認できた','Done','かくにんできた')):L('次へ','Next','つぎへ')} →</button></footer>
  </section>
 </div>;
}

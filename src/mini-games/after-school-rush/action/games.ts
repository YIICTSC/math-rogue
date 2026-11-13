import type { ArtName } from '../art';
import type { Original, Local } from '../originals/model';
import type { Prop } from '../rules';
import { makeActionMechanic } from './physics';
import type { ActionSpec, Family } from './types';
const L = (ja: string, en: string, hira?: string): Local => [ja, en, hira];
const MOVE = L('移動', 'Move', 'いどう'), JUMP = L('ジャンプ', 'Jump'), DASH = L('ダッシュ', 'Dash');
const SETTINGS: Record<Family, Pick<ActionSpec, 'a' | 'b' | 'stick' | 'axis' | 'item' | 'hazard'> & { cue: Local; goal: number; seconds: number; icon: Prop }> = {
  run: { a: JUMP, b: DASH, stick: MOVE, axis: 'horizontal', item: 'door', hazard: 'cone', cue: L('ドアまで走れ！', 'Reach the door!', 'ドアまではしれ！'), goal: 1, seconds: 7.5, icon: 'wind' },
  hurdles: { a: JUMP, b: L('しゃがむ', 'Duck'), stick: MOVE, axis: 'horizontal', item: 'rope', hazard: 'cone', cue: L('跳んで、くぐれ！', 'Over and under!', 'とんで、くぐれ！'), goal: 1, seconds: 6.5, icon: 'shield' },
  climb: { a: JUMP, b: DASH, stick: MOVE, axis: 'horizontal', item: 'bell', hazard: 'wind', cue: L('てっぺんへ！', 'Reach the top!'), goal: 1, seconds: 8, icon: 'gem' },
  catch: { a: L('つかむ', 'Catch'), b: DASH, stick: MOVE, axis: 'horizontal', item: 'bell', hazard: 'mimic', cue: L('落ちる前につかめ！', 'Catch before it drops!', 'おちるまえにつかめ！'), goal: 2, seconds: 7.5, icon: 'gem' },
  collect: { a: L('ころがる', 'Roll'), b: L('ガード', 'Guard'), stick: MOVE, axis: 'free', item: 'coin', hazard: 'slime', cue: L('ぜんぶ集めろ！', 'Collect them all!', 'ぜんぶあつめろ！'), goal: 3, seconds: 8, icon: 'coin' },
  dodge: { a: L('ころがる', 'Roll'), b: L('ガード', 'Guard'), stick: MOVE, axis: 'free', item: 'shield', hazard: 'slime', cue: L('ぶつかるな！', 'Dodge everything!'), goal: 1, seconds: 6.5, icon: 'shield' },
  aim: { a: L('撃つ', 'Shoot', 'うつ'), b: L('ねらい補助', 'Steady aim', 'ねらいほじょ'), stick: L('ねらう', 'Aim'), axis: 'free', item: 'target', hazard: 'crystal', cue: L('まとを撃て！', 'Hit the target!', 'まとをうて！'), goal: 2, seconds: 7.5, icon: 'target' },
  timing: { a: L('キャッチ', 'Catch'), b: L('ゆっくり', 'Slow down'), stick: L('見きわめる', 'Watch', 'みきわめる'), axis: 'none', item: 'orange', hazard: 'wind', cue: L('重なったらつかめ！', 'Catch as they line up!', 'かさなったらつかめ！'), goal: 2, seconds: 6.5, icon: 'orange' },
  balance: { a: L('立て直す', 'Steady', 'たてなおす'), b: L('ふんばる', 'Brace'), stick: L('バランス', 'Balance'), axis: 'horizontal', item: 'books', hazard: 'wind', cue: L('たおすな！', 'Keep your balance!'), goal: 1, seconds: 6.5, icon: 'books' },
  push: { a: L('押す', 'Push', 'おす'), b: L('引く', 'Pull', 'ひく'), stick: MOVE, axis: 'horizontal', item: 'box', hazard: 'mimic', cue: L('箱を枠へ！', 'Push into the outline!', 'はこをわくへ！'), goal: 1, seconds: 7.5, icon: 'shield' },
  flap: { a: L('はばたく', 'Flap'), b: L('急降下', 'Dive', 'きゅうこうか'), stick: L('飛行', 'Fly', 'ひこう'), axis: 'free', item: 'glider', hazard: 'windsock', cue: L('すき間をぬけろ！', 'Fly through the gaps!', 'すきまをぬけろ！'), goal: 1, seconds: 6.5, icon: 'wind' },
  duel: { a: L('アタック', 'Attack'), b: L('ガード', 'Guard'), stick: MOVE, axis: 'horizontal', item: 'mimic', hazard: 'mimic', cue: L('近づいて倒せ！', 'Close in and strike!', 'ちかづいてたおせ！'), goal: 2, seconds: 8, icon: 'mimic' },
  throw: { a: L('投げる', 'Throw', 'なげる'), b: L('やり直す', 'Retry', 'やりなおす'), stick: L('角度・強さ', 'Angle / power', 'かくど・つよさ'), axis: 'aim', item: 'volleyball', hazard: 'hoop', cue: L('輪に入れろ！', 'Into the hoop!', 'わにいれろ！'), goal: 1, seconds: 7.5, icon: 'target' },
  rhythm: { a: L('左の太鼓', 'Left drum', 'ひだりのたいこ'), b: L('右の太鼓', 'Right drum', 'みぎのたいこ'), stick: L('リズム', 'Rhythm'), axis: 'none', item: 'mic', hazard: 'bell', cue: L('線でたたけ！', 'Hit on the line!', 'せんでたたけ！'), goal: 4, seconds: 6.5, icon: 'crystal' },
  chase: { a: L('つかまえる', 'Catch'), b: DASH, stick: MOVE, axis: 'free', item: 'ghost-cat', hazard: 'wind', cue: L('追いついてつかめ！', 'Chase and catch!', 'おいついてつかめ！'), goal: 1, seconds: 7.5, icon: 'ghost-cat' },
  brake: { a: L('アクセル', 'Accelerate'), b: L('ブレーキ', 'Brake'), stick: L('ハンドル', 'Steer'), axis: 'free', item: 'truck', hazard: 'cone', cue: L('緑の中で止まれ！', 'Stop in the green!', 'みどりのなかでとまれ！'), goal: 1, seconds: 7.5, icon: 'wind' },
  sweep: { a: L('はらう', 'Sweep'), b: L('吸いこむ', 'Vacuum', 'すいこむ'), stick: MOVE, axis: 'free', item: 'slime', hazard: 'egg', cue: L('よごれを消せ！', 'Clear the mess!', 'よごれをけせ！'), goal: 3, seconds: 8, icon: 'slime' },
  carry: { a: L('持つ・届ける', 'Pick up / Deliver', 'もつ・とどける'), b: L('そっと歩く', 'Tiptoe', 'そっとあるく'), stick: MOVE, axis: 'free', item: 'egg', hazard: 'slime', cue: L('大事に運べ！', 'Carry it safely!', 'だいじにはこべ！'), goal: 1, seconds: 8, icon: 'egg' },
};
type Design = readonly [title: string, english: string, family: Family, item?: ArtName, hazard?: ArtName];
// Every row is a playable physical challenge. The last in each chapter is its boss.
const CHAPTERS: readonly (readonly Design[])[] = [
  [ ['閉門ダッシュ','Closing-time dash','run'],['なわのトンネル','Rope tunnel','hurdles'],['チャイムをつかめ','Chime catch','catch'],['門前のおつり','Gate coins','collect'],['門柱のてっぺん','Gatepost climb','climb'],['カバンのシーソー','Bag seesaw','balance','satchel'],['通行証を追え','Runaway pass','chase','notebook'],['門の大きな荷物','Gate delivery','push'],['合図の鈴','Signal bell','timing','bell'],['門番ミミック','Gatekeeper Mimic','duel'] ],
  [ ['机から机へ','Desk hop','climb'],['消しゴムの雨','Eraser rain','dodge','shield','block'],['消しゴムシュート','Eraser toss','throw','block'],['プリント回収','Paper pickup','collect','notebook'],['そっと運ぶ花瓶','Careful vase','carry','vase'],['黒板クリーナー','Board cleaner','sweep'],['教室を飛び出せ','Classroom escape','run'],['飛んでくるノート','Flying notebooks','catch','notebook'],['教室の的あて','Classroom targets','aim'],['黒板の大あらし','Blackboard storm','dodge','shield','notebook'] ],
  [ ['焼きたてキャッチ','Fresh-baked catch','catch','toast'],['おやつを届けて','Snack delivery','carry','toast'],['おつり大回収','Pocket the change','collect'],['購買カート','Store cart','brake'],['大箱を動かせ','Moving day','push'],['パンの空中キャッチ','Bread in the air','timing','toast'],['フルーツシュート','Fruit toss','throw','orange'],['暴れるミミック','Snack thief','duel'],['棚の上まで','Shelf scramble','climb'],['閉店前の大注文','Last Call Orders','catch','toast'] ],
  [ ['放課後ハードル','After-school hurdles','hurdles'],['ボールの雨をよけて','Ball shower','dodge','shield','volleyball'],['校庭コインリレー','Yard coin relay','collect'],['空き缶シュート','Can shot','aim','cylinder'],['風の本タワー','Windy book tower','balance'],['草むらを追え','Grassland chase','chase'],['用具庫までダッシュ','Shed sprint','run'],['みどりに駐車','Green parking','brake'],['ボールを輪へ','Ball in the hoop','throw'],['つむじ風の通り道','Whirlwind Crossing','hurdles'] ],
  [ ['本棚アスレチック','Bookshelf scramble','climb'],['本をキャッチ','Book catch','catch','books'],['静かに運ぼう','Quiet delivery','carry','books'],['しおりを追え','Bookmark chase','chase','notebook'],['本の山をたおすな','Book balance','balance'],['図書ワゴン','Library wagon','push','books'],['ホコリ大そうじ','Dust patrol','sweep'],['本のすき間','Between the shelves','flap'],['返却のリズム','Return-desk rhythm','rhythm'],['屋根まで本棚登り','The Towering Library','climb'] ],
  [ ['実験室の電撃','Lab sparks','dodge','shield','crystal'],['フラスコのバランス','Flask balance','balance','flask'],['結晶をねらえ','Crystal targets','aim','crystal'],['泡をキャッチ','Bubble catch','timing','splash'],['試験管を運べ','Test-tube delivery','carry','flask'],['実験グライダー','Lab glider','flap'],['こぼれた液体','Spill patrol','sweep'],['実験室のミミック','Lab mimic','duel'],['装置の上へ','Machine climb','climb'],['暴走する回路盤','Runaway Circuit','aim'] ],
  [ ['バスケット・ワン','Basket one','throw'],['体育館ハードル','Gym hurdles','hurdles'],['ドッジの特訓','Dodge training','dodge','shield','volleyball'],['リバウンドキャッチ','Rebound catch','catch','volleyball'],['移動するまと','Moving targets','aim'],['ボールを追いかけろ','Loose ball','chase','volleyball'],['マット運び','Mat delivery','push','rug'],['平均台の風','Windy beam','balance'],['ホイッスルダッシュ','Whistle dash','run'],['三列ターゲット決戦','Three-Lane Showdown','aim'] ],
  [ ['左右の太鼓','Twin drums','rhythm'],['音符のキャッチ','Note catch','catch','crystal'],['指揮者の合図','Conductor timing','timing'],['楽器は大事に','Precious instrument','carry','mic'],['音符を追え','Runaway note','chase','crystal'],['ステージを駆けろ','Stage sprint','run'],['ゆれるマイクスタンド','Mic sway','balance','mic'],['ドラム缶ジャンプ','Drum hop','climb'],['光のスポット','Spotlight dodge','dodge','shield','lantern'],['消えかけの合奏','Fading Ensemble','rhythm'] ],
  [ ['屋上グライダー','Rooftop glider','flap'],['屋根づたい','Rooftop hop','run'],['風見計のリズム','Vane rhythm','rhythm'],['強風バランス','Gust balance','balance'],['風の小包','Windborne parcel','carry','satchel'],['アンテナの先へ','Antenna climb','climb'],['流れ星をキャッチ','Shooting-star catch','timing','gem'],['空飛ぶ猫を追え','Flying-cat chase','chase'],['屋上のまと','Rooftop targets','aim'],['風見計の大暴走','Storm Vane','flap'] ],
  [ ['開幕ダッシュ','Opening dash','run'],['屋台カーを止めろ','Festival cart','brake'],['景品をキャッチ','Prize catch','catch','gem'],['金色の紙ふぶき','Golden confetti','collect'],['おまつり太鼓','Festival drums','rhythm'],['お祭りの大そうじ','Festival cleanup','sweep'],['看板のてっぺん','Banner climb','climb'],['ミミック最終勝負','Mimic rematch','duel'],['空へシュート','Sky shot','throw'],['放課後の点灯式','Festival Lighting Ceremony','aim','lantern'] ],
];

export const ACTION_CHAPTERS: readonly Original[][] = CHAPTERS.map((games, chapter) => games.map(([ja, en, family, item, hazard], index): Original => {
  const settings = SETTINGS[family], boss = index === games.length - 1;
  const spec: ActionSpec = { ...settings, item: item ?? settings.item, hazard: hazard ?? settings.hazard, family, variant: chapter * 3 + index, boss,
    goal: boss ? family === 'rhythm' ? 6 : ['aim', 'catch', 'duel', 'collect', 'sweep'].includes(family) ? 4 : family === 'throw' || family === 'chase' ? 2 : 1 : settings.goal,
    seconds: boss ? 12 : settings.seconds };
  return { id: `action-${index + 1}`, title: L(ja, en), cue: settings.cue, genre: boss ? 'boss' : family === 'rhythm' ? 'rhythm' : 'motion',
    icon: settings.icon, seconds: spec.seconds, boss: boss || undefined, quick: true,
    action: spec, mechanic: makeActionMechanic(spec) };
}));

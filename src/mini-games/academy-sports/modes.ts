import type { Config, SportId, DrillId } from './core';
import type { Copy } from './copy';
export type SoloIntent='match'|'practice'|'watch';
export interface ModeCard {id:string;mode:Config['mode'];drill?:DrillId;name:Copy;description:Copy;art:number;}
const card=(id:string,name:Copy,description:Copy,art:number):ModeCard=>({id,mode:'practice',drill:id as DrillId,name,description,art});
export const PRACTICE_MODES:Record<SportId,ModeCard[]>={
 baseball:[
 {id:'batting',mode:'batting',name:['打撃練習','Batting','だげきれんしゅう'],description:['ミートと振るタイミングを磨く。','Train your aim and swing timing.','ミートとふるタイミングをみがこう。'],art:1},
 {id:'pitching',mode:'pitching',name:['投球練習','Pitching','とうきゅうれんしゅう'],description:['球種・コース・ゲージを練習。','Choose a pitch and master the meter.','きゅうしゅ・コース・ゲージをれんしゅう。'],art:2},
 {id:'fielding',mode:'fielding',name:['守備練習','Fielding','しゅびれんしゅう'],description:['捕球から各塁への送球まで。','Field the ball and throw to a base.','ほきゅうからるいへのそうきゅうまで。'],art:3},
 {id:'home-run',mode:'home-run',name:['ホームラン挑戦','Home-run challenge','ホームランちょうせん'],description:['10打席で大きな一発を狙おう。','Aim for the stands in ten at-bats.','10だせきでおおきないっぱつをねらおう。'],art:4}],
 soccer:[
 card('soccer-move',['移動・ダッシュ','Move & dash','いどう・ダッシュ'],['走って目標地点へ。','Dash to the target marker.','はしってもくひょうちてんへ。'],4),
 card('soccer-shot',['シュート','Shooting','シュート'],['ためて離し、ゴールを狙う。','Hold, release and aim for goal.','ためてはなし、ゴールをねらおう。'],1),
 card('soccer-pass',['パス','Passing','パス'],['味方へ確実につなごう。','Complete a pass to a teammate.','みかたへつなごう。'],2),
 card('soccer-lob',['ロングパス','Long passing','ロングパス'],['浮き球で味方へつなぐ。','Send a lofted pass to a teammate.','うきだまでみかたへつなごう。'],3),
 card('soccer-dribble',['切り返し','Dribble moves','きりかえし'],['相手を引きつけて突破。','Time a feint near the defender.','あいてをひきつけてとっぱ。'],4),
 card('soccer-tackle',['タックル','Tackling','タックル'],['正面からボールを奪おう。','Win the ball with a front tackle.','しょうめんからボールをうばおう。'],5),
 card('soccer-special',['必殺シュート','Signature shots','ひっさつシュート'],['必殺技でゴールを狙う。','Use a signature shot to score.','ひっさつわざでゴールをねらおう。'],6),
 card('soccer-switch',['選手交代','Player switching','せんしゅこうたい'],['ボールに近い味方へ切り替え。','Switch control to another teammate.','ちかいみかたへきりかえよう。'],2)],
 volleyball:[
 card('volley-serve',['サーブ','Serving','サーブ'],['トスして、よい高さで打つ。','Toss, then hit at the right height.','トスして、よいたかさでうとう。'],1),
 card('volley-receive',['レシーブ','Receiving','レシーブ'],['落下地点へ動いてつなぐ。','Move under the ball and receive.','らっかちてんへうごいてつなごう。'],2),
 card('volley-set',['トス','Setting','トス'],['仲間へ打ちやすいトスを。','Set the ball for your attacker.','なかまへうちやすいトスを。'],3),
 card('volley-spike',['スパイク','Spiking','スパイク'],['跳んで相手コートへ打つ。','Jump and spike across the net.','とんであいてコートへうとう。'],4),
 card('volley-block',['ブロック','Blocking','ブロック'],['ネット際で跳んで止める。','Jump at the net to block the ball.','ネットぎわでとんでとめよう。'],5),
 card('volley-dive',['飛び込み','Diving receives','とびこみ'],['低い球を飛び込みで拾う。','Dive to receive a low ball.','ひくいたまをとびこみでひろおう。'],2),
 card('volley-special',['必殺サーブ','Signature serves','ひっさつサーブ'],['必殺球を準備してサーブ。','Arm your signature ball, then serve.','ひっさつきゅうをじゅんびしてサーブ。'],6),
 card('volley-move',['移動・ジャンプ','Move & jump','いどう・ジャンプ'],['目標へ移動しジャンプ。','Reach the marker and jump.','もくひょうへうごいてジャンプ。'],5)],
 festival:[]
};
export const modeCard=(sport:SportId,c:Pick<Config,'mode'|'drill'>):ModeCard=>PRACTICE_MODES[sport].find(m=>c.drill?m.drill===c.drill:m.mode===c.mode)||({id:c.mode,mode:c.mode,name:c.mode==='watch'?['CPU観戦','CPU exhibition','CPUかんせん']:['CPUと対戦','Play the CPU','CPUとたいせん'],description:c.mode==='watch'?['選手の動きを観戦して学ぼう。','Watch the players and learn.','せんしゅのうごきをみてまなぼう。']:['チームを選んで試合へ。','Pick your team and play.','チームをえらんでしあいへ。'],art:c.mode==='watch'?(sport==='baseball'?5:7):0});

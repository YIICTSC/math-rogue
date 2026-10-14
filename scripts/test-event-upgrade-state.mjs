import fs from 'node:fs';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
fs.mkdirSync('tmp',{recursive:true});
await build({entryPoints:['src/services/eventService.ts'],outfile:'tmp/event-regression-bundle.mjs',bundle:true,platform:'node',format:'esm',packages:'external',define:{'import.meta.env':'{}'}});
const {generateEvent}=await import('../tmp/event-regression-bundle.mjs');
const cases=[
  {
    "title": "席替え",
    "label": "先生に相談する"
  },
  {
    "title": "プール開き",
    "label": "水中トレーニング"
  },
  {
    "title": "理科室の人体模型",
    "label": "解剖図で論破する"
  },
  {
    "title": "終わらない朝礼",
    "label": "メモを取り続ける"
  },
  {
    "title": "秘密基地のパスワード",
    "label": "暗号を解読する"
  },
  {
    "title": "不気味な音楽室",
    "label": "調律する"
  },
  {
    "title": "二宮金次郎の背負い物",
    "label": "読書を教わる"
  },
  {
    "title": "図書室の貸出カード",
    "label": "新しいメモを書き足す"
  },
  {
    "title": "学級文庫の漫画",
    "label": "続きの考察ノートを書く"
  },
  {
    "title": "音楽室の肖像画",
    "label": "楽譜を読む"
  },
  {
    "title": "階段の13段目",
    "label": "段数を数え直す"
  },
  {
    "title": "図書室の司書さん",
    "label": "司書さんに質問攻め"
  },
  {
    "title": "飼育室のウサギ",
    "label": "観察する"
  },
  {
    "title": "学校のゴミ捨て場",
    "label": "分別マスターになる"
  },
  {
    "title": "掲示板の100点答案",
    "label": "自分の答案を貼る"
  },
  {
    "title": "理科室の毒薬",
    "label": "解毒薬を調合する"
  },
  {
    "title": "放課後の決闘",
    "label": "言葉で和解する"
  },
  {
    "title": "理科室の爆発",
    "label": "原因を解析する"
  }
];
const makeCard=(id)=>({id,name:'ストライク',cost:1,type:'ATTACK',description:'6ダメージ。',damage:6});
const makePlayer=()=>({id:'WARRIOR',maxHp:80,currentHp:60,maxEnergy:3,currentEnergy:3,block:0,strength:0,gold:100,deck:[makeCard('original')],hand:[],discardPile:[],drawPile:[],relics:[],potions:[],imageData:'',powers:{},echoes:0,cardsPlayedThisTurn:0,attacksPlayedThisTurn:0,typesPlayedThisTurn:[],nextTurnEnergy:0,nextTurnDraw:0,relicCounters:{},turnFlags:{},floatingText:null});
const originalRandom=Math.random;
const originalError=console.error;
const errors=[];console.error=(...args)=>errors.push(args.join(' '));
try {
 for(const test of cases){
  let observedUpgrade=false;
  for(const roll of [.1,.5,.9]){
   let state={player:makePlayer(),map:[],screen:'EVENT',floor:1,currentFloor:1,currentAct:1};
   const setter=update=>{state=typeof update==='function'?update(state):update};
   let result;
   Math.random=()=>roll;
   const event=generateEvent(state.player,setter,()=>{},value=>result=value,'JAPANESE',[],test.title);
   assert.equal(event.title,test.title);
   const option=event.options.find(option=>option.label===test.label);assert(option,test.title);
   // Simulate a newer state arriving between event generation and its click.
   const cards=[makeCard('latest-1'),makeCard('latest-2')];state={...state,player:{...state.player,deck:cards}};
   const snapshot=JSON.stringify(cards);
   option.action();
   await new Promise(resolve => setTimeout(resolve, 80));
   if(state.player.deck.some(card=>card.upgraded)){
    observedUpgrade=true;assert(state.player.deck.every(card=>card.id.startsWith('latest-')));assert.equal(JSON.stringify(cards),snapshot,'Never mutate the previous deck');
   }
   assert(result,test.title+' has no result');
  }
  assert(observedUpgrade,test.title+' never upgraded the current deck');
 }
 assert.deepEqual(errors,[]);
 console.log('PASS: 18 event upgrade choices, all three outcome branches, latest-state deck and immutable updates.');
}finally{Math.random=originalRandom;console.error=originalError;}

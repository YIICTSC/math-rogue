import type {PokerSupporter,PokerConsumable,PokerPack,PokerCard,PokerScoringContext,PokerRunState} from '../../types';

export const EXPANSION_ENGLISH:Record<string,string>={};
export const EXPANSION_HIRAGANA:Record<string,string>={};
const text=(ja:string,en:string,hi:string)=>{EXPANSION_ENGLISH[ja]=en;EXPANSION_HIRAGANA[ja]=hi;return ja;};
export const EXPANSION_TIERS:Record<string,number>={};
const supporter=(key:string,name:[string,string,string],desc:[string,string,string],effect:PokerSupporter['effect'],icon:string,price=6):PokerSupporter=>({id:'EXP_'+key,name:text(...name),description:text(...desc),effect,icon,price,rarity:price>=9?'RARE':price>=7?'UNCOMMON':'COMMON',triggerOn:'HAND_PLAYED'});
const rankCount=(c:PokerScoringContext)=>new Set(c.cards.map(c=>c.rank)).size;
export const EXTRA_SUPPORTERS:PokerSupporter[]=[
 supporter('LOW',['低学年の応援団','Junior cheering squad','ていがくねんの おうえんだん'],['2〜5の得点カード1枚につき基礎点+35','Scoring cards ranked 2–5 each add 35 chips.','2〜5のカードで きそてん+35'],c=>{c.chips+=c.cards.filter(x=>x.rank<=5).length*35;},'SMILE|#ffbc66'),
 supporter('ODD',['奇数探偵','Odd detective','きすうたんてい'],['得点カードがすべて奇数なら倍率+12','All scoring ranks odd: +12 mult.','とくてんカードが ぜんぶきすうなら ばいりつ+12'],c=>{if(c.cards.length&&c.cards.every(x=>x.rank%2===1))c.mult+=12;},'EYE|#bb99ff'),
 supporter('EVEN',['偶数研究会','Even research club','ぐうすうけんきゅうかい'],['得点カードがすべて偶数なら基礎点+160','All scoring ranks even: +160 chips.','とくてんカードが ぜんぶぐうすうなら きそてん+160'],c=>{if(c.cards.length&&c.cards.every(x=>x.rank%2===0))c.chips+=160;},'ROBOT|#88ccff'),
 supporter('RAINBOW',['虹色の旗手','Rainbow flag bearer','にじいろの きしゅ'],['出したカードが4スートなら倍率x2.5','Play all four suits: x2.5 mult.','4スートを だすと ばいりつx2.5'],c=>{if(new Set(c.handCards.filter(x=>(c.playedCards||c.cards).some(s=>s.id===x.id)).map(x=>x.suit)).size===4)c.mult*=2.5;},'FLAG|#b5e88b',9),
 supporter('OPENING',['朝練キャプテン','Morning captain','あされんキャプテン'],['対戦の最初のプレイで倍率+15','First play of a match: +15 mult.','さいしょの プレイで ばいりつ+15'],c=>{if(c.handsPlayed===1)c.mult+=15;},'SUN|#ffd85e',7),
 supporter('FINALE',['逆転の応援歌','Comeback anthem','ぎゃくてんの おうえんか'],['残り手数1で倍率x3','Last remaining hand: x3 mult.','のこりてすう1で ばいりつx3'],c=>{if(c.handsRemaining===1)c.mult*=3;},'BELL|#ff8d99',9),
 supporter('RECYCLE',['リサイクル部長','Recycling captain','リサイクルぶちょう'],['残り捨て回数1につき倍率+3','Each remaining discard adds 3 mult.','のこりすてかいすう ごとに ばいりつ+3'],c=>{c.mult+=c.discardsRemaining*3;},'BACKPACK|#8ed5a9'),
 supporter('THRIFT',['節約上手','Thrifty friend','せつやくじょうず'],['部活ポイントが5以下なら基礎点+180','At 5 points or less: +180 chips.','ポイント5いかなら きそてん+180'],c=>{if(c.money<=5)c.chips+=180;},'GOLD_BAG|#e3bb73'),
 supporter('DISTINCT',['個性派カルテット','Distinct quartet','こせいはカルテット'],['得点カードの異なるランク1種類につき倍率+3','Each distinct scoring rank adds 3 mult.','ちがうランク ごとに ばいりつ+3'],c=>{c.mult+=rankCount(c)*3;},'SPARKLES|#f4abd6',7),
 supporter('DUO',['放課後デュオ','After-school duo','ほうかごデュオ'],['ワンペアなら倍率x2.5','A pair scores x2.5 mult.','ワンペアなら ばいりつx2.5'],c=>{if(c.handType==='PAIR')c.mult*=2.5;},'HUMANOID|#83c4e8',8),
 supporter('POCKET',['ポケット図書室','Pocket library','ポケットとしょしつ'],['手元に残すクラブ1枚につき倍率+4','Each unplayed club in hand adds 4 mult.','のこしたクラブ ごとに ばいりつ+4'],c=>{c.mult+=c.handCards.filter(x=>x.suit==='CLUB'&&!(c.playedCards||c.cards).some(s=>s.id===x.id)).length*4;},'LIBRARIAN|#a0d390',7),
 supporter('LIGHT',['身軽な冒険者','Light adventurer','みがるな ぼうけんしゃ'],['残り山札が25枚以下なら倍率x2','At 25 or fewer cards in the draw pile: x2 mult.','やまふだ25まいいかなら ばいりつx2'],c=>{if(c.deckState.length<=25)c.mult*=2;},'SHOE|#81d4ed',8),
 supporter('ECHO',['反響マイク','Echo microphone','はんきょうマイク'],['反響カード1枚につき倍率+8','Each echo scoring card adds 8 mult.','はんきょうカード ごとに ばいりつ+8'],c=>{c.mult+=c.cards.filter(x=>x.enhancement==='ECHO').length*8;},'BELL|#bdabff',7),
 supporter('EMBER',['焚き火当番','Campfire keeper','たきびとうばん'],['成長カード1枚につき基礎点+90','Each ember scoring card adds 90 chips.','せいちょうカード ごとに きそてん+90'],c=>{c.chips+=c.cards.filter(x=>x.enhancement==='EMBER').length*90;},'FLAME|#ffa674',7),
 supporter('PRISM',['プリズム工房','Prism workshop','プリズムこうぼう'],['異なるスート1種類につき基礎点+45','Each distinct scoring suit adds 45 chips.','ちがうスート ごとに きそてん+45'],c=>{c.chips+=new Set(c.cards.map(x=>x.suit)).size*45;},'GEM|#7fe0e4',7),
 supporter('INK',['書道の達人','Calligraphy master','しょどうの たつじん'],['手元に残す墨カード1枚につき倍率x1.5','Each unplayed ink card gives x1.5 mult.','のこしたすみカード ごとに ばいりつx1.5'],c=>{for(const x of c.handCards)if(x.enhancement==='INK'&&!(c.playedCards||c.cards).some(s=>s.id===x.id))c.mult*=1.5;},'NOTEBOOK|#8793bf',9),
 supporter('LUCKY',['幸運の郵便屋','Lucky mail carrier','こううんの ゆうびんや'],['幸運カードを得点に使うと部活ポイント+2','Score with a lucky card to earn 2 points.','こううんカードで とくてんすると ポイント+2'],c=>{if(c.cards.some(x=>x.enhancement==='LUCKY'))c.moneyDelta+=2;},'FLIER|#f6d175',7),
 supporter('ANCHOR',['錨の守り人','Anchor keeper','いかりの もりびと'],['錨カードを手元に残すと基礎点+120','Hold an unplayed anchor card: +120 chips.','いかりカードを のこすと きそてん+120'],c=>{if(c.handCards.some(x=>x.enhancement==='ANCHOR'&&!(c.playedCards||c.cards).some(s=>s.id===x.id)))c.chips+=120;},'SHIELD|#86c9da',7),
 supporter('ACE',['エースの相棒','Ace companion','エースの あいぼう'],['得点に使うA1枚につき倍率+10','Each scoring ace adds 10 mult.','エース ごとに ばいりつ+10'],c=>{c.mult+=c.cards.filter(x=>x.rank===14).length*10;},'FIST|#ffbc78',8),
 supporter('TEN',['十点満点の先生','Perfect-ten teacher','じゅってんまんてんの せんせい'],['10・J・Q・K1枚につき基礎点+60','Each scoring 10, J, Q or K adds 60 chips.','10・J・Q・K ごとに きそてん+60'],c=>{c.chips+=c.cards.filter(x=>x.rank>=10&&x.rank<=13).length*60;},'TEACHER|#f7a4a4',8),
 supporter('SMALL',['小さな切り札','Tiny trump','ちいさな きりふだ'],['1枚だけで得点すると倍率x3','Score with just one card: x3 mult.','1まいだけの とくてんで ばいりつx3'],c=>{if(c.cards.length===1)c.mult*=3;},'GEM|#9bd6ff',9),
 supporter('LESSON',['復習の鬼','Revision champion','ふくしゅうの おに'],['役レベルを上げた回数1につき倍率+2','Each hand-level increase adds 2 mult.','やくレベルを あげたかいすう ごとに ばいりつ+2'],c=>{c.mult+=(c.persistentCounters.EXP_LEVELS||0)*2;},'NOTEBOOK|#acb8f6',8),
 supporter('MARATHON',['放課後マラソン','After-school marathon','ほうかごマラソン'],['この挑戦のプレイ累計1回につき基礎点+18','Each hand played this run adds 18 chips.','このちょうせんの プレイかいすう ごとに きそてん+18'],c=>{c.chips+=(c.persistentCounters.HANDS_PLAYED||0)*18;},'SHOE|#b9e49a',8),
 supporter('CONSTELLATION',['星座の導き手','Constellation guide','せいざの みちびきて'],['得点カード5枚のランクがすべて異なると倍率x3','Five distinct scoring ranks: x3 mult.','とくてん5まいが ちがうランクなら ばいりつx3'],c=>{if(c.cards.length===5&&rankCount(c)===5)c.mult*=3;},'ALIEN|#b8a1f8',10),
];
EXTRA_SUPPORTERS.forEach((s,i)=>EXPANSION_TIERS[s.id]=Math.floor(i/3));

export const EXTRA_ENHANCEMENTS={
 ECHO:{name:text('反響','Echo','はんきょう'),desc:text('得点時、カード自身の基礎点をもう一度加算','Scores its own chip value twice.','カードじしんの きそてんを 2かいかさん')},
 EMBER:{name:text('成長','Ember','せいちょう'),desc:text('得点時、この挑戦のプレイ累計1回につき基礎点+12','Adds 12 chips per hand played this run.','プレイの るいけいかいすう ごとに きそてん+12')},
 PRISM:{name:text('虹光','Prism','にじひかり'),desc:text('得点時、異なる得点スート1種類につき倍率+2','Adds 2 mult per distinct scoring suit.','ちがう とくてんスート ごとに ばいりつ+2')},
 INK:{name:text('墨','Ink','すみ'),desc:text('出さずに手元に残すと基礎点+45','Hold unplayed for +45 chips.','ださずに のこすと きそてん+45')},
 LUCKY:{name:text('幸運','Lucky','こううん'),desc:text('得点時、必ず部活ポイント+1','Each scoring lucky card earns 1 point.','とくてんすると ポイント+1')},
 ANCHOR:{name:text('錨','Anchor','いかり'),desc:text('出さずに手元に残すと倍率+3','Hold unplayed for +3 mult.','ださずに のこすと ばいりつ+3')},
};
export type ExtraEnhancement=keyof typeof EXTRA_ENHANCEMENTS;
export const EXTRA_CONSUMABLES:PokerConsumable[]=[];
Object.entries(EXTRA_ENHANCEMENTS).forEach(([key,value],i)=>{const id='STA_EXP_'+key;EXTRA_CONSUMABLES.push({id,type:'TAROT',name:text(value.name+'のしおり',EXPANSION_ENGLISH[value.name]+' bookmark',EXPANSION_HIRAGANA[value.name]+'のしおり'),description:text('選んだカード1枚に「'+value.name+'」を付与','Apply '+EXPANSION_ENGLISH[value.name]+' to one selected card.','えらんだ1まいに '+EXPANSION_HIRAGANA[value.name]+'を つける'),price:4+i%3,icon:'NOTEBOOK|#b7a8f5'});EXPANSION_TIERS[id]=i+1;});
export const EXTRA_PLANETS:Record<string,{hand:string;levels:number}>={};
for(const [i,hand]of ['HIGH_CARD','PAIR','TWO_PAIR','THREE_OF_A_KIND','STRAIGHT','FLUSH'].entries()){const names=[['基礎演習ゼミ','Foundation seminar','きそえんしゅうゼミ'],['ペア研究ゼミ','Pair seminar','ペアけんきゅうゼミ'],['対の理論書','Twin-pair theory','ついの りろんしょ'],['三重奏の楽譜','Trio score','さんじゅうそうの がくふ'],['連続数の研究','Sequence study','れんぞくすうの けんきゅう'],['同色の画集','Suit artbook','どうしょくの がしゅう']][i];const jp=['ハイカード','ワンペア','ツーペア','スリーカード','ストレート','フラッシュ'][i],en=['High card','Pair','Two pair','Three of a kind','Straight','Flush'][i];const id='TXT_EXP_'+hand;EXTRA_CONSUMABLES.push({id,type:'PLANET',name:text(...names as [string,string,string]),description:text(jp+'を3レベル強化',en+' gains 3 levels.',jp+'を3レベル きょうか'),price:6,icon:'NOTEBOOK|#efc778'});EXTRA_PLANETS[id]={hand,levels:3};EXPANSION_TIERS[id]=Math.floor(i/2)+1;}
const spectralRows=[['TRAINING','特訓ノート','Training notebook','とっくんノート','手札全てに基礎点+20','All cards in hand gain 20 bonus chips.','てふだぜんぶに きそてん+20'],['STEEL','予備の定規','Spare ruler','よびの じょうぎ','手札の先頭1枚をスチールにする','Turns the first card in hand into steel.','てふだの さいしょを スチールにする'],['DRAW','追加プリント','Extra worksheets','ついかプリント','山札から2枚引く（手札上限12）','Draw 2 cards, up to 12 cards in hand.','やまふだから2まいひく（12まいまで）'],['RESET','気分転換','Fresh perspective','きぶんてんかん','捨て回数+2、直前の役の記録を消す','Gain 2 discards and clear the previous-hand restriction.','すてかいすう+2、まえのやくを リセット'],['LUNCH','臨時の活動費','Club grant','りんじの かつどうひ','部活ポイント+8','Gain 8 club points.','ポイント+8'],['REVIEW','総復習ノート','Revision notebook','そうふくしゅうノート','基本6役を全て1レベル強化','All six basic hands gain 1 level.','きほん6やくを 1レベルきょうか']];
spectralRows.forEach(([key,ja,en,hi,dj,de,dh],i)=>{const id='SPX_'+key;EXTRA_CONSUMABLES.push({id,type:'SPECTRAL',name:text(ja,en,hi),description:text(dj,de,dh),price:5+i%3,icon:['NOTEBOOK','SHIELD','FLIER','SPARKLES','GOLD_BAG','LIBRARIAN'][i]+'|#a9cdf0'});EXPANSION_TIERS[id]=i;});
export interface PackRecipe {suit?:PokerCard['suit'];black?:boolean;ranks?:PokerCard['rank'][];enhancement?:ExtraEnhancement;family?:'PLANET'|'TAROT'|'SPECTRAL'|'EXPANSION';}
export const PACK_RECIPES:Record<string,PackRecipe>={};
export const EXTRA_PACKS:PokerPack[]=[];
const packs:[string,string,string,string,PokerPack['type'],PackRecipe,number][]=[
 ['HEART','ハートの贈り物','Heart gift','ハートの おくりもの','STANDARD',{suit:'HEART'},1],['BLACK','黒札セレクション','Black-suit selection','くろふだセレクション','STANDARD',{black:true},1],['ACE','エースの切り札','Ace trump pack','エースの きりふだ','STANDARD',{ranks:[11,12,13,14]},3],
 ['STUDY','教科書セット','Textbook set','きょうかしょセット','BUFF',{family:'PLANET'},1],['CRAFT','工房の道具箱','Craft toolbox','こうぼうの どうぐばこ','BUFF',{family:'TAROT'},2],['CREW','新入部員パック','New club members','しんにゅうぶいんパック','SUPPORTER',{family:'EXPANSION'},2],
 ...(['ECHO','EMBER','PRISM','INK','LUCKY','ANCHOR'] as const).map((key,i):typeof packs[number]=>[key,EXTRA_ENHANCEMENTS[key].name+'パック',EXPANSION_ENGLISH[EXTRA_ENHANCEMENTS[key].name]+' pack',EXPANSION_HIRAGANA[EXTRA_ENHANCEMENTS[key].name]+'パック','STANDARD',{enhancement:key},i+1]),
];
packs.forEach(([key,ja,en,hi,type,recipe,tier])=>{const id='PACK_EXP_'+key;PACK_RECIPES[id]=recipe;EXTRA_PACKS.push({id,name:text(ja,en,hi),description:text((recipe.enhancement?EXTRA_ENHANCEMENTS[recipe.enhancement].name+'カード':ja)+'の候補3つから1つ選ぶ','Choose one of three '+en.toLowerCase()+' options.','3つのこうほから 1つえらぶ'),type,size:3,choose:1,price:type==='SUPPORTER'?8:recipe.enhancement?6:5,icon:(type==='STANDARD'?'BACKPACK':type==='SUPPORTER'?'SMILE':'NOTEBOOK')+'|#e2bf77'});EXPANSION_TIERS[id]=tier;});

export function extraCardEffect(card:PokerCard,ctx:PokerScoringContext,held=false){if(held){if(card.enhancement==='INK')ctx.chips+=45;if(card.enhancement==='ANCHOR')ctx.mult+=3;return;}if(card.enhancement==='ECHO')ctx.chips+=(card.rank===14?11:Math.min(10,card.rank))+card.bonusChips;if(card.enhancement==='EMBER')ctx.chips+=12*((ctx.persistentCounters.HANDS_PLAYED||0)+1);if(card.enhancement==='PRISM')ctx.mult+=2*new Set(ctx.cards.map(c=>c.suit)).size;if(card.enhancement==='LUCKY')ctx.moneyDelta+=1;}
export function applyExtraSpectral(state:PokerRunState,id:string):PokerRunState|null{
 if(!id.startsWith('SPX_'))return null;
 const next={...state,hand:state.hand.map(c=>({...c})),deck:[...state.deck],handLevels:{...state.handLevels},persistentCounters:{...state.persistentCounters}};
 if(['SPX_TRAINING','SPX_STEEL'].includes(id)&&!next.hand.length)return null;
 if(id==='SPX_TRAINING')next.hand=next.hand.map(c=>({...c,bonusChips:c.bonusChips+20}));
 else if(id==='SPX_STEEL')next.hand[0].enhancement='STEEL';
 else if(id==='SPX_DRAW'){const count=Math.min(2,12-next.hand.length,next.deck.length);if(count<=0)return null;next.hand.push(...next.deck.splice(0,count));}
 else if(id==='SPX_RESET'){next.discardsRemaining+=2;next.lastHandTypePlayed=undefined;}
 else if(id==='SPX_LUNCH')next.money+=8;
 else if(id==='SPX_REVIEW'){for(const {hand}of Object.values(EXTRA_PLANETS)){next.handLevels[hand]=(next.handLevels[hand]||1)+1;}next.persistentCounters.EXP_LEVELS=(next.persistentCounters.EXP_LEVELS||0)+6;}
 else return null;
 return next;
}

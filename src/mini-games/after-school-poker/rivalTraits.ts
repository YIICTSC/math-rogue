import type {PokerCard,PokerScoringContext} from '../../types';
export type RivalRuleKind='rank'|'suit'|'odd'|'even'|'face'|'low'|'high'|'minCards'|'maxCards'|'pair'|'straight'|'flush'|'repeat'|'noDiscard'|'needsDiscard'|'first'|'late'|'mono'|'mixed'|'chipCap';
export interface RivalTrait {id:string;name:string;englishName:string;hiraganaName:string;kind:RivalRuleKind;value:number;}
const rows:[string,string,string,string,RivalRuleKind,number][]=[
 ['rival_lucky_nanami','ラッキーセブン封じ','Seven-proof luck','ラッキーセブンふうじ','rank',7],
 ['rival_math_bancho','偶数の盾','Even shield','ぐうすうのたて','even',0],
 ['rival_stationery_leo','文具王の査定','Stationery appraisal','ぶんぐおうのさてい','maxCards',3],
 ['rival_lunch_misuzu','おかわり必須','Second helping','おかわりひっす','minCards',2],
 ['rival_iron_hayato','絵札の鉄壁','Face-card fortress','えふだのてっぺき','face',0],
 ['rival_music_sora','同じ旋律はお断り','No repeated melody','おなじせんりつは おことわり','repeat',0],
 ['rival_science_rika','ハート分解実験','Heart experiment','ハートぶんかいじっけん','suit',1],
 ['rival_library_ren','静かな読書会','Quiet reading club','しずかな どくしょかい','noDiscard',0],
 ['rival_discipline_ayame','五枚の校則','Five-card discipline','ごまいのこうそく','minCards',4],
 ['rival_art_momo','単色画のこだわり','Monochrome preference','たんしょくがの こだわり','mixed',2],
 ['rival_track_kakeru','先手ダッシュ','Opening sprint','せんてダッシュ','first',0],
 ['rival_occult_kurosaki','十三の呪い','Curse of thirteen','じゅうさんの のろい','rank',13],
 ['rival_president_karen','ペアの検閲','Pair inspection','ペアのけんえつ','pair',0],
 ['rival_baseball_takumi','三振勝負','Three-strike duel','さんしんしょうぶ','late',2],
 ['rival_twins_minato','対の逆襲','Twin counter','ついのぎゃくしゅう','odd',0],
 ['rival_tea_yui','一服の作法','Tea ceremony','いっぷくのさほう','maxCards',2],
 ['rival_alien_aru','スペード吸収','Spade absorption','スペードきゅうしゅう','suit',0],
 ['rival_principal_shion','校長式の上限','Principal ceiling','こうちょうしきの じょうげん','chipCap',450],
 ['rival_galaxy_mio','星列のゆがみ','Warped constellation','せいれつの ゆがみ','straight',0],
 ['rival_shop_goro','返品カウンター','Returns counter','へんぴんカウンター','needsDiscard',0],
 ['rival_maze_rin','同色の迷路','Same-suit maze','どうしょくの めいろ','flush',0],
 ['rival_raffle_hina','末吉の壁','Small-fortune wall','すえきちのかべ','low',5],
 ['rival_hidden_jin','エース狩り','Ace hunter','エースがり','rank',14],
 ['rival_graduate_akira','卒業試験','Graduation exam','そつぎょうしけん','minCards',5],
 ['endless_rival_principal_genda','校長の奇数規則','Odd school rule','こうちょうの きすうきそく','odd',0],
 ['endless_rival_nurse_makino','赤札の検温','Red-card check','あかふだの けんおん','suit',1],
 ['endless_rival_caretaker_iwata','四枚の修繕','Four-card repair','よまいの しゅうぜん','maxCards',4],
 ['endless_rival_librarian_sumire','読み返し禁止','No rereading','よみかえしきんし','repeat',0],
 ['endless_rival_cafeteria_tome','大盛り限定','Large portions only','おおもりげんてい','minCards',3],
 ['endless_rival_coach_goro','後半の追い込み','Late-match pressure','こうはんの おいこみ','late',1],
 ['endless_rival_crossing_guard_hana','止まれダイヤ','Diamond stop sign','とまれダイヤ','suit',2],
 ['endless_rival_stationer_matsui','二枚セット販売','Two-card bundles','にまいセットはんばい','minCards',2],
 ['endless_rival_bakery_mugi','焼きたての先制','Fresh-baked opening','やきたての せんせい','first',0],
 ['endless_rival_bus_driver_sabu','乗車定員三名','Three-seat bus','じょうしゃていいん さんめい','maxCards',3],
 ['endless_rival_flower_rika','色とりどりの花束','Colorful bouquet','いろとりどりの はなたば','mono',0],
 ['endless_rival_police_kondo','絵札の検問','Face-card checkpoint','えふだのけんもん','face',0],
 ['endless_rival_cat_mike','三毛の気まぐれ','Calico whim','みけのきまぐれ','rank',3],
 ['endless_rival_dog_pochi','おあずけペア','Pair on hold','おあずけペア','pair',0],
 ['endless_rival_rabbit_mochi','偶数ぴょんぴょん','Even bunny hop','ぐうすうぴょんぴょん','even',0],
 ['endless_rival_hamster_kurumi','小粒の防壁','Tiny-seed wall','こつぶのぼうへき','low',4],
 ['endless_rival_penguin_pen','氷上の直線','Icy straight','ひょうじょうの ちょくせん','straight',0],
 ['endless_rival_owl_fukuro','夜目のエース封じ','Night-owl ace guard','よめの エースふうじ','rank',14],
 ['endless_rival_art_teacher_daigo','三色までの課題','Three-color assignment','さんしょくまでの かだい','mixed',3],
 ['endless_rival_music_teacher_otoha','同音のハーモニー','Same-note harmony','どうおんの ハーモニー','flush',0],
 ['endless_rival_science_teacher_tsubaki','クラブの試薬','Club reagent','クラブのしやく','suit',3],
 ['endless_rival_math_teacher_sakuma','十進数の境界','Decimal boundary','じっしんすうの きょうかい','high',10],
 ['endless_rival_janitor_robot_jiro','不要札の回収','Card recycling','ふようふだの かいしゅう','needsDiscard',0],
 ['endless_rival_pta_madam_reiko','持ち物検査','Belongings inspection','もちものけんさ','chipCap',350],
 ['endless_rival_turtle_kamekichi','五枚の甲羅','Five-card shell','ごまいのこうら','minCards',5],
 ['endless_rival_sparrow_chun','小さな二枚勝負','Two-card sparrow','ちいさな にまいしょうぶ','maxCards',2],
 ['endless_rival_hedgehog_hari','七本のとげ','Seven spines','ななほんのとげ','rank',7],
 ['endless_rival_red_panda_maru','丸いダイヤの守り','Diamond panda guard','まるいダイヤの まもり','suit',2],
 ['endless_rival_alpaca_paca','ゆったりした礼儀','Gentle etiquette','ゆったりした れいぎ','noDiscard',0],
 ['endless_rival_fox_kon','九尾の封印','Nine-tail seal','きゅうびのふういん','rank',9],
 ['endless_rival_convenience_nana','深夜の七割営業','Late-night trade','しんやの ななわりえいぎょう','late',3],
 ['endless_rival_bookstore_honda','短編より長編','Long stories only','たんぺんより ちょうへん','minCards',4],
 ['endless_rival_dentist_shiro','白い歯の検査','White-tooth check','しろいはの けんさ','high',11],
 ['endless_rival_curry_master_kenta','スパイスの混色','Spice blend','スパイスの こんしょく','mono',0],
 ['endless_rival_mailman_hayashi','速達の一枚目','Express opening','そくたつの いちまいめ','first',0],
 ['endless_rival_mayor_sakura','町の得点条例','Town scoring ordinance','まちの とくてんじょうれい','chipCap',600],
];
export const RIVAL_TRAITS:Record<string,RivalTrait>=Object.fromEntries(rows.map(([id,name,englishName,hiraganaName,kind,value])=>[id,{id,name,englishName,hiraganaName,kind,value}]));
const suits=[['スペード','spades','スペード'],['ハート','hearts','ハート'],['ダイヤ','diamonds','ダイヤ'],['クラブ','clubs','クラブ']];
export function rivalTraitDescription(r:RivalTrait,language='JAPANESE'){
 const n=r.value,suit=suits[n]||suits[0],label=language==='ENGLISH'?1:language==='HIRAGANA'?2:0;
 const details:Record<RivalRuleKind,string[]>={
 rank:[`${n===14?'A':n}は役判定・得点から除外。`,`${n===14?'A':n} cards do not form hands or score.`,`${n===14?'A':n}は やくと とくてんから はずす。`],
 suit:[`${suit[0]}は役判定・得点から除外。`,`${suit[1]} do not form hands or score.`,`${suit[2]}は やくと とくてんから はずす。`],
 odd:['奇数は役判定・得点から除外。','Odd ranks do not form hands or score.','きすうは やくと とくてんから はずす。'],even:['偶数は役判定・得点から除外。','Even ranks do not form hands or score.','ぐうすうは やくと とくてんから はずす。'],
 face:['J・Q・Kは役判定・得点から除外。','J, Q and K do not form hands or score.','J・Q・Kは やくと とくてんから はずす。'],
 low:[`${n}以下は役判定・得点から除外。`,`Ranks ${n} and below do not form hands or score.`,`${n}いかは やくと とくてんから はずす。`],high:[`${n}以上は役判定・得点から除外。`,`Ranks ${n} and above do not form hands or score.`,`${n}いじょうは やくと とくてんから はずす。`],
 minCards:[`出す枚数が${n}枚未満だと得点0。`,`Play at least ${n} cards or score zero.`,`${n}まいいじょう ださないと とくてん0。`],maxCards:[`${n}枚を超えて出すと倍率が半分。`,`Playing more than ${n} cards halves mult.`,`${n}まいより おおいと ばいりつはんぶん。`],
 pair:['ペアを含む役は倍率が半分。','Pair-based hands halve mult.','ペアをふくむ やくは ばいりつはんぶん。'],straight:['ストレート系の役は倍率が半分。','Straight-based hands halve mult.','ストレートけいは ばいりつはんぶん。'],flush:['フラッシュ系の役は倍率が半分。','Flush-based hands halve mult.','フラッシュけいは ばいりつはんぶん。'],
 repeat:['直前と同じ役は得点0。','Repeating the previous hand type scores zero.','まえと おなじやくは とくてん0。'],noDiscard:['捨てた後のプレイは倍率が65%。','After any discard, mult is reduced to 65%.','すてたあとは ばいりつ65%。'],needsDiscard:['一度も捨てていないと倍率が65%。','Without using a discard, mult is reduced to 65%.','いちども すてていないと ばいりつ65%。'],first:['最初のプレイだけ倍率が60%。','The first play has 60% mult.','さいしょだけ ばいりつ60%。'],late:[`${n+1}回目以降のプレイは倍率が60%。`,`From play ${n+1}, mult is reduced to 60%.`,`${n+1}かいめから ばいりつ60%。`],mono:['得点カードが1スートだけだと倍率が55%。','One scoring suit reduces mult to 55%.','とくてんが1スートだけなら ばいりつ55%。'],mixed:[`得点カードが${n}スート超だと倍率が70%。`,`More than ${n} scoring suits reduces mult to 70%.`,`${n}スートよりおおいと ばいりつ70%。`],chipCap:[`基礎点の上限${n}。倍率で突破しよう。`,`Chips capped at ${n}; build mult to break through.`,`きそてんじょうげん${n}。ばいりつで とっぱしよう。`],
 };return details[r.kind][label];
}
export function rivalEligibleCards(r:RivalTrait|undefined,cards:PokerCard[]){if(!r)return cards;return cards.filter(c=>{switch(r.kind){case'rank':return c.rank!==r.value;case'suit':return c.suit!==['SPADE','HEART','DIAMOND','CLUB'][r.value];case'odd':return c.rank%2===0;case'even':return c.rank%2!==0;case'face':return c.rank<11||c.rank>13;case'low':return c.rank>r.value;case'high':return c.rank<r.value;default:return true;}});}
export function rivalDisallows(r:RivalTrait|undefined,played:PokerCard[],handType:string,previous?:string){return !!r&&(r.kind==='minCards'&&played.length<r.value||r.kind==='repeat'&&handType===previous);}
export function applyRivalTrait(r:RivalTrait|undefined,ctx:PokerScoringContext,played:PokerCard[]){if(!r)return;let factor=1;const suits=new Set(ctx.cards.map(c=>c.suit)).size;
 if(r.kind==='maxCards'&&played.length>r.value)factor=.5;
 if(r.kind==='pair'&&['PAIR','TWO_PAIR','THREE_OF_A_KIND','FULL_HOUSE','FOUR_OF_A_KIND','FIVE_OF_A_KIND','FLUSH_HOUSE','FLUSH_FIVE'].includes(ctx.handType))factor=.5;
 if(r.kind==='straight'&&['STRAIGHT','STRAIGHT_FLUSH','ROYAL_FLUSH'].includes(ctx.handType))factor=.5;
 if(r.kind==='flush'&&['FLUSH','STRAIGHT_FLUSH','ROYAL_FLUSH','FLUSH_HOUSE','FLUSH_FIVE'].includes(ctx.handType))factor=.5;
 if(r.kind==='noDiscard'&&ctx.discardsUsed>0||r.kind==='needsDiscard'&&ctx.discardsUsed===0)factor=.65;
 if(r.kind==='first'&&ctx.handsPlayed===1||r.kind==='late'&&ctx.handsPlayed>r.value)factor=.6;
 if(r.kind==='mono'&&suits===1)factor=.55;
 if(r.kind==='mixed'&&suits>r.value)factor=.7;
 if(r.kind==='chipCap')ctx.chips=Math.min(r.value,ctx.chips);
 ctx.mult*=factor;
}

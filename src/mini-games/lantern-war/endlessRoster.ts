import type {Campaign,Hero,Line} from './types';
export const ENDLESS_CAST:Hero[]=[
 {id:'end-vesper',name:'ヴェスパー',origin:'無窮航路',role:'帰還した敵将',weapon:'lance',skill:'贖いの城塞',motto:'守る相手を、今度は間違えない。',color:'#d898ae',join:99,hp:48,atk:18,def:15,speed:7,move:3,portrait:''},
 {id:'end-sable',name:'セーブル',origin:'無窮航路',role:'離反した狙撃手',weapon:'bow',skill:'夜明けの照準',motto:'この照準は、逃げる人を守るために。',color:'#8bc6a3',join:99,hp:30,atk:23,def:7,speed:15,move:4,portrait:''},
 {id:'end-hikari',name:'ミレア',origin:'珊瑚岬',role:'岬の灯術師',weapon:'magic',skill:'真夏の灯台',motto:'帰り道を照らす灯は、波にだって消せない。',color:'#eebc7b',join:99,hp:34,atk:22,def:8,speed:12,move:4,portrait:''},
 {id:'end-ren',name:'カイ',origin:'潮風の入江',role:'潮路の守護者',weapon:'staff',skill:'潮騒の祝福',motto:'どの海から来た人にも、帰る岸辺を残そう。',color:'#88cfd8',join:99,hp:42,atk:17,def:12,speed:11,move:4,portrait:''},
];
export function recruitLines(id:string):Line[]{
 const stories:Record<string,string[]>={
 'end-vesper':['王冠は砕けた。それでも、私に従った兵たちは帰り道を失った。','あなたが守った灯を、私は消そうとした。許してほしいとは言わない。','ならば、その盾で今ここにいる旅人を守ってくれ。','……命令ではなく、約束として引き受けよう。'],
 'end-sable':['砲声が止んでも、狙撃手は森に残れと命じられた。','けれど、標的の中に薬を運ぶ子がいた。俺は引き金を引けなかった。','その選択が、次の道をつないだ。一緒に来ないか。','この一発を、誰かが生きて帰る合図にしよう。'],
 'end-hikari':['私はミレア。珊瑚岬の灯台を守っているの。','灯台が消えたら、帰ってくる船が道を失う。ここからは退けない。','休む明日をあきらめない君の灯が、私たちには必要だ。','任せて！ この灯を、あなたたちの帰り道にも届けるから。'],
 'end-ren':['僕はカイ。この入江を守っている。どの海から来た人も、追い返したくない。','でも、沖の裂け目が大きくなる。守るだけでは、潮は変わらないんだ。','帰る場所を残して、潮の向こうへ進もう。','ああ。この日傘を旗にしよう。誰でも帰ってこられる旗に。'],
 };
 return (stories[id]||stories['end-vesper']).map((text,i)=>({who:i===2?'$hero':id,text,reaction:(['concern','concern','joy','resolve'] as const)[i]}));
}

/** Keep existing recruitment, levels and formations while updating cached old costume dialogue. */
export function migrateEndlessIdentity(s:Campaign){
 const replacements:Record<string,string>={
 'あかり・夏の灯':'ミレア','レン・潮風の誓い':'カイ',
 'やっと取れた休暇なのに、浜辺の灯台まで裂け目が来ちゃった。':'私はミレア。珊瑚岬の灯台を守っているの。',
 'この服は、みんなで海に行く約束のために選んだの。約束ごと、守りたい。':'灯台が消えたら、帰ってくる船が道を失う。ここからは退けない。',
 '決まり！ 戦いが終わったら、あなたたちの分の貝殻も探そうね。':'任せて！ この灯を、あなたたちの帰り道にも届けるから。',
 'この浜辺には、かつて敵だった者も休みに来る。誰も追い返したくない。':'僕はカイ。この入江を守っている。どの海から来た人も、追い返したくない。'
 };
 for(const battle of [s.battle,s.checkpoint])for(const line of battle?.endless?.story||[])if(['end-hikari','end-ren'].includes(line.who))line.text=replacements[line.text]||line.text;
 if(s.endless)s.endless.history=s.endless.history.map(text=>typeof text==='string'?text.replaceAll('あかり・夏の灯','ミレア').replaceAll('レン・潮風の誓い','カイ'):text);
 return s;
}

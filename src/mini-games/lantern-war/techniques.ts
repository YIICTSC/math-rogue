import type {Hero,RuleSkill,Tactic} from './types';
export type Effect='assault'|'pierce'|'sweep'|'snipe'|'stun'|'burn'|'mend'|'renew'|'guard'|'rally'|'cleanse'|'drain'|'sunder'|'flurry'|'execute'|'weaken';
export interface Technique{id:RuleSkill;name:string;level:number;cost:number;effect:Effect;description:string;}
export const EFFECTS:Record<Effect,{cost:number;description:string}>={
 assault:{cost:1,description:'単体へ強撃。威力125%。'},pierce:{cost:1,description:'単体へ防御75%無視の一撃。'},sweep:{cost:2,description:'敵の一列へ威力85%の攻撃。'},snipe:{cost:1,description:'前衛を越えて狙える威力115%の攻撃。'},stun:{cost:2,description:'単体を攻撃し、次の行動を中断させる。'},burn:{cost:1,description:'単体を攻撃し、行動後に継続ダメージを与える。'},mend:{cost:1,description:'傷ついた味方1人を回復する。'},renew:{cost:2,description:'傷ついた味方の一列を回復する。'},guard:{cost:1,description:'味方1人の交戦中防御+4、PPを1回復。防御上昇は最大8。'},rally:{cost:1,description:'味方1人の交戦中攻撃+3。最大6まで上昇。'},cleanse:{cost:1,description:'味方1人の状態異常を解除し、HPを少し回復。'},drain:{cost:1,description:'単体を攻撃し、与ダメージの半分を自分に回復。'},sunder:{cost:1,description:'単体を攻撃し、交戦中防御を3下げる。最大6まで低下。'},flurry:{cost:2,description:'同じ相手へ威力70%の2連撃。'},execute:{cost:2,description:'HP半分以下の相手に威力175%、それ以外は105%。'},weaken:{cost:1,description:'単体を攻撃し、交戦中攻撃を3下げる。最大6まで低下。'}
};
// Each hero has a distinct three-technique kit; the original ultimate remains available.
const kits:Record<string,[string,string,string,Effect,Effect,Effect]>={
 aster:['星灯の切先','隣人の号令','暁路の三日月','pierce','rally','sweep'],lyra:['帰郷の踏み込み','灯守の構え','王冠を解く剣','assault','guard','execute'],
 'high-school-warrior':['校門破り','放課後の檄','制服の二閃','sunder','rally','flurry'],
 'high-school-caretaker':['若葉の手当て','細胞の目覚め','命脈の花冠','mend','cleanse','renew'],
 'high-school-assassin':['消える足音','影縫いの針','名もなき残像','snipe','stun','flurry'],
 'high-school-mage':['触媒の火花','結合ほどき','臨界の波紋','burn','weaken','sweep'],
 'high-school-dodgeball':['リバウンド突き','勝利へのアシスト','決勝の速攻','assault','rally','flurry'],
 'high-school-bard':['音圧の矢','勇気のオンエア','夜明けの合唱','snipe','rally','renew'],
 'high-school-librarian':['余白の刃','封じの栞','終章の伏線','pierce','weaken','execute'],
 'high-school-chef':['鉄鍋くだき','まかないの湯気','満腹の大回転','sunder','mend','sweep'],
 'high-school-gardener':['芽吹きの一矢','蔓絡み','種まきの連弓','snipe','stun','flurry'],
 'magic-akari':['星火の粒','願いの応援','流星の花束','burn','rally','sweep'],
 'magic-shizuku':['水鏡の針','凪の抱擁','氷晶の結び目','pierce','cleanse','stun'],
 'magic-hiyori':['花びらの手当て','陽だまりの円','春告げの祝福','mend','guard','renew'],
 'magic-tsubasa':['焔翼の爪','火勢の鼓舞','紅蓮の旋回','burn','rally','sweep'],
 'magic-rei':['夜羽の突き','黒羽の目眩','月蝕の追い刃','pierce','weaken','execute'],
 'magic-madoka':['翠風の刃','結びのそよ風','若葉の輪舞','snipe','cleanse','sweep'],
 'magic-koharu':['風見の矢','追い風の歌','風渡りの連射','snipe','rally','flurry'],
 'magic-mirai':['紫電の粒','明日への予告','可能性の分岐','pierce','stun','sweep'],
 'magic-sera':['雪明かりの癒し','白峰の守り','銀雪の祈り','mend','guard','renew'],
 'magic-ren':['朝霧の槍先','雲間の号令','黎光の貫き','pierce','rally','execute'],
 'magic-soma':['影砕きの槍','静寂の盾','深影の追撃','sunder','guard','flurry'],
 'magic-minato':['波紋の手当て','潮騒の浄化','港灯の大円','mend','cleanse','renew'],
 'magic-riku':['共鳴の矢','調律の拍','交響の波動','snipe','rally','sweep'],
 'magic-yamato':['黒鉄の割撃','不屈の城壁','烈地の断罪','sunder','guard','execute'],
 'magic-leon':['陽炎の火種','獅子の咆哮','天陽の輪','burn','weaken','sweep'],
 'magic-elliot':['夜譜の針','忘却の余韻','星夜の終奏','drain','weaken','execute'],
 'magic-sakuya':['朔月の一閃','影留め','無月の双影','pierce','stun','flurry'],
 'dungeons2-lyria':['星剣の刺突','守星の構え','星冠の追閃','pierce','guard','flurry'],
 'dungeons2-celis':['霜花の針','氷封の印','冬明けの浄雪','pierce','stun','cleanse'],
 'dungeons2-flora':['花蕾の矢','根の抱擁','新緑の連弓','snipe','mend','flurry'],
 'dungeons2-noctia':['禁頁の吸光','黒書の封印','夜の終わり','drain','weaken','execute'],
 'dungeons2-aurene':['金灯の癒し','祈りの洗礼','黎明の聖環','mend','cleanse','renew'],
 'dungeons2-ignis':['熾火の斬撃','勇炎の檄','火山の旋斧','burn','rally','sweep'],
 'dungeons2-leon':['獅盾の槍打','不退の誓い','城壁割り','assault','guard','sunder'],
 'dungeons2-orion':['宵闇の吸刃','星狩りの威圧','夜道の道標','drain','weaken','snipe'],
 'dungeons2-leif':['足跡消しの矢','影蔓の罠','木漏れ日の連弓','snipe','stun','flurry'],
 nagi:['潮風の一矢','帆を張る号令','星海の散光','snipe','rally','sweep'],mio:['樹音の矢','木霊の手当て','森渡りの連射','snipe','mend','flurry'],sena:['歯車くだき','巻き戻しの手当て','時針の二連打','sunder','cleanse','flurry']
};
export const PERSONAL_TECHNIQUES:Record<string,Technique[]>=Object.fromEntries(Object.entries(kits).map(([id,k])=>[id,[0,1,2].map(i=>({id:('art'+(i+1)) as RuleSkill,name:k[i] as string,level:[3,6,12][i],effect:k[i+3] as Effect,...EFFECTS[k[i+3] as Effect]}))]));
export const SHARED_TECHNIQUES:Partial<Record<RuleSkill,Technique>>={
 guard:{id:'guard',name:'守りを固める',level:2,effect:'guard',...EFFECTS.guard},rally:{id:'rally',name:'戦意を高める',level:4,effect:'rally',...EFFECTS.rally},cleanse:{id:'cleanse',name:'状態を整える',level:5,effect:'cleanse',...EFFECTS.cleanse},break:{id:'break',name:'防具を崩す',level:7,effect:'sunder',...EFFECTS.sunder},quick:{id:'quick',name:'連続攻撃',level:10,effect:'flurry',...EFFECTS.flurry},execute:{id:'execute',name:'好機を仕留める',level:14,effect:'execute',...EFFECTS.execute}
};
export const techniqueFor=(hero:string,skill:RuleSkill)=>PERSONAL_TECHNIQUES[hero]?.find(t=>t.id===skill)||SHARED_TECHNIQUES[skill];
export const tacticCapacity=(lv:number)=>Math.min(8,3+Math.floor((lv-1)/3));
export const skillLevel=(hero:string,skill:RuleSkill)=>techniqueFor(hero,skill)?.level||1;
export function defaultHeroTactics(hero:string,lv:number):Tactic[]{
 const first=techniqueFor(hero,'art1'),second=techniqueFor(hero,'art2'),third=techniqueFor(hero,'art3');
 const rules:Tactic[]=[{skill:first?.effect==='mend'&&lv>=3?'art1':'heal',condition:'wounded',target:'lowest'},{skill:'ultimate',condition:'many',target:'healer'},{skill:first&&first.effect!=='mend'&&lv>=3?'art1':'strike',condition:'always',target:'front'}];
 if(second&&lv>=6)rules.unshift({skill:'art2',condition:second.effect==='cleanse'?'afflicted':second.effect==='mend'?'wounded':second.effect==='guard'?'selfwounded':'first',target:second.effect==='guard'?'self':'lowest'});
 if(third&&lv>=12)rules.splice(1,0,{skill:'art3',condition:third.effect==='renew'?'wounded':third.effect==='cleanse'?'afflicted':third.effect==='execute'?'enemywounded':'many',target:'lowest'});
 return rules;
}
export function tacticPreset(hero:Hero,lv:number,kind:string):Tactic[]{
 if(kind==='balanced')return defaultHeroTactics(hero.id,lv).map(r=>({...r}));
 const available=(PERSONAL_TECHNIQUES[hero.id]||[]).filter(t=>t.level<=lv),support=new Set(['mend','renew','cleanse','guard','rally']);
 const chosen=available.filter(t=>kind==='support'?support.has(t.effect):kind==='control'?['stun','burn','weaken','sunder'].includes(t.effect):!support.has(t.effect));
 if(kind==='finish')chosen.sort((a,b)=>Number(b.effect==='execute')-Number(a.effect==='execute')||b.cost-a.cost);
 else if(kind==='attack')chosen.sort((a,b)=>b.cost-a.cost);
 const rules:Tactic[]=chosen.map(t=>({skill:t.id,condition:t.effect==='mend'||t.effect==='renew'?'wounded':t.effect==='cleanse'?'afflicted':t.effect==='guard'?'selfwounded':t.effect==='rally'?'first':t.effect==='execute'?'enemywounded':t.effect==='sweep'?'many':'always',target:kind==='finish'?'lowest':t.effect==='guard'?'self':kind==='control'?'strongest':'front'}));
 const add=(skill:RuleSkill,condition:Tactic['condition'],target:Tactic['target'])=>{if(skillLevel(hero.id,skill)<=lv)rules.push({skill,condition,target});};
 if(kind==='support'){add('cleanse','afflicted','lowest');add('guard','selfwounded','self');add('rally','first','strongest');}
 if(kind==='control')add('break','armored','armored');
 if(kind==='finish'&&lv>=14&&!chosen.some(t=>t.effect==='execute'))rules.unshift({skill:'execute',condition:'enemywounded',target:'lowest'});
 return [...rules.slice(0,tacticCapacity(lv)-2),{skill:'ultimate',condition:'many',target:'healer'},{skill:'strike',condition:'always',target:'front'}] as Tactic[];
}

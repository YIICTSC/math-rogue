import type {Hero,RuleSkill,Tactic} from './types';
export type Effect='assault'|'pierce'|'sweep'|'snipe'|'stun'|'burn'|'mend'|'renew'|'guard'|'rally'|'cleanse'|'drain'|'sunder'|'flurry'|'execute'|'weaken';
export interface Technique{id:RuleSkill;name:string;level:number;cost:number;effect:Effect;description:string;}
export const EFFECTS:Record<Effect,{cost:number;description:string}>={
 assault:{cost:1,description:'単体へ強撃。威力125%。'},pierce:{cost:1,description:'単体へ防御75%無視の一撃。'},sweep:{cost:2,description:'敵の一列へ威力85%の攻撃。'},snipe:{cost:1,description:'前衛を越えて狙える威力115%の攻撃。'},stun:{cost:2,description:'単体を攻撃し、次の行動を中断させる。'},burn:{cost:1,description:'単体を攻撃し、行動後に継続ダメージを与える。'},mend:{cost:1,description:'傷ついた味方1人を回復する。'},renew:{cost:2,description:'傷ついた味方の一列を回復する。'},guard:{cost:1,description:'味方1人の交戦中防御+4、PPを1回復。防御上昇は最大8。'},rally:{cost:1,description:'味方1人の交戦中攻撃+3。最大6まで上昇。'},cleanse:{cost:1,description:'味方1人の状態異常を解除し、HPを少し回復。'},drain:{cost:1,description:'単体を攻撃し、与ダメージの半分を自分に回復。'},sunder:{cost:1,description:'単体を攻撃し、交戦中防御を3下げる。最大6まで低下。'},flurry:{cost:2,description:'同じ相手へ威力70%の2連撃。'},execute:{cost:2,description:'HP半分以下の相手に威力175%、それ以外は105%。'},weaken:{cost:1,description:'単体を攻撃し、交戦中攻撃を3下げる。最大6まで低下。'}
};
// Each hero has a distinct three-technique kit; the original ultimate remains available.
const kits:Record<string,[string,string,string,Effect,Effect,Effect]>={
 aster:['スターライト・ピアース','ネイバリー・ブレイブ','クレセント・ドーン','pierce','rally','sweep'],lyra:['ホームワード・ラッシュ','ランタン・イージス','クラウンブレイカー','assault','guard','execute'],
 'high-school-warrior':['ゲートクラッシャー','アフタースクール・ロア','ダブルリベリオン','sunder','rally','flurry'],
 'high-school-caretaker':['リーフリカバー','バイオ・リブート','ライフ・ガーデン','mend','cleanse','renew'],
 'high-school-assassin':['サイレントステップ','シャドウステッチ','ノーネーム・ミラージュ','snipe','stun','flurry'],
 'high-school-mage':['ケミカル・フレア','ボンドブレイク','クリティカルリップル','burn','weaken','sweep'],
 'high-school-dodgeball':['リバウンドドライブ','ビクトリーアシスト','ファイナルファスト','assault','rally','flurry'],
 'high-school-bard':['ソニックアロー','ブレイブオンエア','デイブレイクコーラス','snipe','rally','renew'],
 'high-school-librarian':['マージン・ブレード','サイレンスブックマーク','エピローグエンド','pierce','weaken','execute'],
 'high-school-chef':['アイアンパン・ブレイク','ヒーリングスチーム','フルコースサイクロン','sunder','mend','sweep'],
 'high-school-gardener':['スプラウトアロー','ヴァインバインド','シードレイン','snipe','stun','flurry'],
 'magic-akari':['スターフレア','ウィッシュエール','メテオブーケ','burn','rally','sweep'],
 'magic-shizuku':['アクアミラー','カームエンブレイス','クリスタルノット','pierce','cleanse','stun'],
 'magic-hiyori':['ペタルヒール','サニーサークル','スプリンググレイス','mend','guard','renew'],
 'magic-tsubasa':['ブレイズタロン','フレイムラリー','クリムゾンスパイラル','burn','rally','sweep'],
 'magic-rei':['ナイトフェザー','レイヴンヘイズ','エクリプスエッジ','pierce','weaken','execute'],
 'magic-madoka':['エメラルドガスト','リンクブリーズ','リーフロンド','snipe','cleanse','sweep'],
 'magic-koharu':['ウィンドヴェイン','テイルウィンドソング','スカイストライダー','snipe','rally','flurry'],
 'magic-mirai':['ヴァイオレットボルト','フューチャーサイン','パラレルバースト','pierce','stun','sweep'],
 'magic-sera':['スノウランタン','ホワイトピーク','シルバースノウプレイヤー','mend','guard','renew'],
 'magic-ren':['ミストランス','クラウドコール','ドーンペネトレイト','pierce','rally','execute'],
 'magic-soma':['シャドウシャッター','サイレントシールド','ディープチェイサー','sunder','guard','flurry'],
 'magic-minato':['リップルヒール','タイドピュリファイ','ハーバーライトヘイロー','mend','cleanse','renew'],
 'magic-riku':['レゾナンスアロー','チューニングビート','シンフォニックウェーブ','snipe','rally','sweep'],
 'magic-yamato':['ブラックアイアン','インドミタブルウォール','ガイアジャッジメント','sunder','guard','execute'],
 'magic-leon':['ヒートシード','レオンズロア','ソーラーホイール','burn','weaken','sweep'],
 'magic-elliot':['ノクターンニードル','オブリビオンエコー','スターリーフィナーレ','drain','weaken','execute'],
 'magic-sakuya':['ニュームーンフラッシュ','シャドウロック','ルナ・ミラージュ','pierce','stun','flurry'],
 'dungeons2-lyria':['アストラルスラスト','スターガーディアン','ステラツインレイ','pierce','guard','flurry'],
 'dungeons2-celis':['フロストフラワー','グレイシャルシール','ウィンタークレンズ','pierce','stun','cleanse'],
 'dungeons2-flora':['ブロッサムアロー','ルートエンブレイス','ヴァーダントレイン','snipe','mend','flurry'],
 'dungeons2-noctia':['フォビドゥンドレイン','ブラックグリモワール','ナイトフォールエンド','drain','weaken','execute'],
 'dungeons2-aurene':['ゴールデンヒール','セイクリッドバプテスマ','オーロラヘイロー','mend','cleanse','renew'],
 'dungeons2-ignis':['エンバースラッシュ','ブレイブイグニッション','ヴォルカニックサイクロン','burn','rally','sweep'],
 'dungeons2-leon':['レオシールドバッシュ','アンブロークンオース','ランパートブレイカー','assault','guard','sunder'],
 'dungeons2-orion':['ダスクドレイン','スターハンターヘイズ','ナイトパスアロー','drain','weaken','snipe'],
 'dungeons2-leif':['トレイルレスアロー','シャドウヴァイン','サンビームヴォレー','snipe','stun','flurry'],
 nagi:['シーブリーズアロー','セイルホイスト','アストラルオーシャン','snipe','rally','sweep'],mio:['シルヴァンアロー','エコーヒール','フォレストヴォレー','snipe','mend','flurry'],sena:['ギアクラッシャー','リワインドケア','クロノダブル','sunder','cleanse','flurry']
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

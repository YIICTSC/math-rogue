import React from 'react';
import {Building2, CheckCircle2, Ruler} from 'lucide-react';
import type {LanguageMode} from '../types';
import type {World} from './engine';
import {BUILDING_GOALS, buildingMeetsGoal, type BuildingMeasurement} from './buildingGoals';

export default function BuildingGoalsPanel({world,selfId,languageMode,onSurvey,disabled=false}:{world:World;selfId:string;languageMode?:LanguageMode;onSurvey:()=>void;disabled?:boolean}) {
 const t=(ja:string,hira:string,en:string)=>languageMode==='ENGLISH'?en:languageMode==='HIRAGANA'?hira:ja;
 const life=world.players[selfId]?.life, survey=life?.buildingSurvey, buildings=survey?.buildings||[];
 const best=buildings[0];
 const stale=!!survey&&survey.revision!==(world.voxels?.revision||0);
 const checks:(keyof BuildingMeasurement)[]=['floor','roof','walls','entrance','usable'];
 const names=[t('床','ゆか','Floor'),t('屋根','やね','Roof'),t('壁','かべ','Walls'),t('入口','いりぐち','Entrance'),t('歩ける室内','あるけるしつない','Usable interior')];
 return <section data-rpg-panel="goal" className="rpg-building-goals">
  <h2><Building2 size={22}/>{t('3D建築の任意目標','3Dけんちくのにんいもくひょう','Optional 3D building goals')}</h2>
  <p>{t('幅×奥行き×高さは外寸のブロック数です。3Dで床・壁・屋根とドアを作り、室内を歩ける建物に仕上げよう。','はば×おくゆき×たかさはがいすんのブロックすうです。3Dでゆか・かべ・やねとドアをつくり、しつないをあるけるたてものにしあげよう。','Dimensions are exterior block counts: width × depth × height. Build a floor, walls, roof and door in 3D, leaving a usable interior.')}</p>
  <small>{t('冒険のクリアには必須ではありません。直方体の建物が対象で、各寸法は目標以上でも達成できます。','ぼうけんのクリアにはひっすではありません。ちょくほうたいのたてものがたいしょうで、かくすんぽうはもくひょういじょうでもたっせいできます。','These goals are optional. Rectangular buildings qualify when each dimension meets or exceeds the target.')}</small>
  <ul>{BUILDING_GOALS.map(goal=>{
   const completed=life?.buildingGoals?.includes(goal.id)||buildings.some(m=>buildingMeetsGoal(m,goal));
   return <li key={goal.id} className={completed?'is-complete':''}><span>{completed?<CheckCircle2 size={18}/>:<Ruler size={18}/>}<b>{languageMode==='ENGLISH'?goal.en:languageMode==='HIRAGANA'?goal.hira:goal.ja}</b></span><strong>{goal.dimensions.join('×')}</strong><small>{completed?t('達成済み','たっせいずみ','Completed'):t('建築中・未達成','けんちくちゅう・みたっせい','Not completed')}</small></li>;
  })}</ul>
  {best&&<div className="rpg-building-measurement"><b>{t('計測した建物','けいそくしたたてもの','Measured building')}: {best.width}×{best.depth}×{best.height}</b><div>{checks.map((key,index)=><span key={key} className={best[key]?'is-complete':''}>{best[key]?'✓':'○'} {names[index]}</span>)}</div></div>}
  {!best&&survey&&<p>{t('対象の建築がまだ見つかりません。建材を配置してから計測してください。','たいしょうのけんちくがまだみつかりません。けんざいをはいちしてからけいそくしてください。','No qualifying construction found yet. Place construction blocks, then measure again.')}</p>}
  {stale&&<p role="status">{t('建築が更新されています。再計測で最新の進捗を確認できます。','けんちくがこうしんされています。さいけいそくでさいしんのしんちょくをかくにんできます。','Building data has changed. Measure again for current progress.')}</p>}
  <button type="button" disabled={disabled} onClick={onSurvey}><Ruler size={17}/>{t('建築を計測・達成を確認','けんちくをけいそく・たっせいをかくにん','Measure buildings and check goals')}</button>
  <small>{t('自分が建材を配置した建築と登録済み自宅を計測します。既存の建築は、入口近くで計測できます。達成後の記録は残ります。','じぶんがけんざいをはいちしたけんちくととうろくずみじたくをけいそくします。きそんのけんちくは、いりぐちちかくでけいそくできます。たっせいごのきろくはのこります。','Measures construction you contributed to and registered homes. Older buildings can be measured near their entrance. Completed goals remain recorded.')}</small>
 </section>;
}

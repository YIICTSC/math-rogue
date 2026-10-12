import React from 'react';
import type {LanguageMode} from '../types';
import {furnitureBenefit} from './furnitureBenefits';
import {MUSIC_FURNITURE} from './homeTracks';
export default function FurnitureBenefit({item,languageMode}:{item:string;languageMode:LanguageMode}){
 const benefit=furnitureBenefit(item);if(!benefit)return null;
 const copy=(ja:string,en:string,hi:string)=>languageMode==='ENGLISH'?en:languageMode==='HIRAGANA'?hi:ja;
 const effect={might:copy('筋力＋1','Strength +1','きんりょく＋1'),guard:copy('初期ブロック＋2','Starting block +2','しょきぶろっく＋2'),focus:copy('初期ドロー＋1','Starting draw +1','しょきどろー＋1'),comfort:copy('戦闘開始時HP2回復','Heal 2 HP at battle start','せんとうかいしじHP2かいふく')}[benefit];
 return <p className="rpg-furniture-benefit">{copy('自宅に飾ると：','Place at home: ','じたくにかざると：')}{effect}{MUSIC_FURNITURE.has(item)&&<> · {copy('自宅BGMを変更','Change home BGM','じたくBGMをへんこう')}</>}</p>;
}

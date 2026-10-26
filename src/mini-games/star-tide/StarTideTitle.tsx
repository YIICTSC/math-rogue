import {assetUrl} from '../../utils/assetPaths';
export function StarTideTitle({en,hasSave,chapter,beacons,onStart,onNew,onBack}:{en:boolean;hasSave:boolean;chapter:number;beacons:number;onStart:()=>void;onNew:()=>void;onBack:()=>void}){
 return <section className="st-title" aria-label={en?'Star Tide title screen':'星潮の航路 タイトル画面'}>
  <picture className="st-title-art"><source media="(orientation: portrait)" srcSet={assetUrl('sprites/star-tide/title-portrait.webp')}/><img src={assetUrl('sprites/star-tide/title-landscape.webp')} alt="" fetchPriority="high"/></picture>
  <div className="st-title-shade"/>
  <button className="st-title-back" onClick={onBack}>{en?'Back':'一覧へ'}</button>
  <div className="st-title-content"><p className="st-title-eyebrow">A VOYAGE BEYOND THE HORIZON</p><h1><span>{en?'STAR TIDE':'星潮の航路'}</span><small>{en?'WINDSAIL CHRONICLES':'STAR TIDE'}</small></h1><p className="st-title-tagline">{en?'Unfurl your sail. Discover a sky unknown.':'帆をひらき、まだ知らない空へ。'}</p>
   <nav className="st-title-menu" aria-label={en?'Voyage menu':'航海メニュー'}><button className="st-title-primary" autoFocus onClick={onStart}>{hasSave?(en?'Continue voyage':'航海を続ける'):(en?'Begin voyage':'航海をはじめる')}<span aria-hidden="true">→</span></button>{hasSave&&<button onClick={onNew}>{en?'New voyage':'新しい航海'}</button>}</nav>
   {hasSave&&<p className="st-title-save">{en?'ISLAND':'現在の島'} {chapter+1} / 12 · {en?'BEACONS':'星灯'} {beacons} / 12</p>}
  </div><p className="st-title-credit">LEARNING ROGUE · ORIGINAL ADVENTURE</p>
 </section>;
}

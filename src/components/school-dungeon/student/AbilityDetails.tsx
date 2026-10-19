import React from 'react';
import {magicForm} from './transformation';
import {preloadAbilityCutins} from './cutins';
import {abyssHero,signatureId} from '../dungeons2/roster';
import {abilityDescription,studentAbility} from './abilities';
import type {SchoolAdventure} from '../useSchoolAdventure';
import './ability-details.css';
/** Shared descriptions use the same data that resolves damage, status and cooldown. */
export function AbilityDetails({heroId,text,includeCard=true}:{heroId:string;text:SchoolAdventure['text'];includeCard?:boolean}){
 React.useEffect(()=>preloadAbilityCutins(heroId),[heroId]);
 const hero=abyssHero(heroId),english=text('日','EN')==='EN',skills=hero?.skills||[studentAbility(heroId)];
 return <section className="ability-reference" data-ability-hero={heroId} aria-label={text('必殺技の効果','Ultimate skill effects')}>
  <h3>{text('必殺技の効果','Ultimate skill effects')}</h3>
  {skills.map((skill,i)=><article className="ability-reference-card" key={skill.en} style={{'--skill-color':skill.color}as React.CSSProperties} data-ability-name={skill.en}>
   <h4><kbd>{['Q','E','F'][i]}</kbd>{text(skill.name,skill.en)}</h4>
   <ul>{abilityDescription(skill,english).split(' / ').map(part=><li key={part}>{part}</li>)}</ul>
  </article>)}
  {hero&&includeCard&&<article className="ability-reference-card signature abyss-signature" data-card={signatureId(hero.id)} data-ability-name={hero.card.en} style={{'--skill-color':hero.card.color}as React.CSSProperties}><h4>▣ {text('専用カード','Signature card')} · {text(hero.card.name,hero.card.en)}</h4><ul>{abilityDescription(hero.card,english).split(' / ').map(part=><li key={part}>{part}</li>)}</ul></article>}
  {magicForm(heroId)&&<p className="ability-reference-note">{text('変身中は与ダメージ・被ダメージ2倍。次の階で自動解除。','While transformed, deal and take double damage. Reverts on the next floor.')}</p>}
  <p className="ability-reference-note">{text('発動で1ターン消費。壁越しの敵や購買部員には当たりません。','Uses one turn. Cannot hit through walls or target shopkeepers.')}</p>
 </section>;
}

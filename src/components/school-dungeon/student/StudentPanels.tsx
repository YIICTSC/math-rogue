import ConversationStage,{type Reaction} from '../../dialogue/ConversationStage';
import {chronicleHero} from '../chronicles/story';
import {chronicleBackground} from '../chronicles/story';
import { isProtagonistUnlocked } from '../../../utils/protagonistUnlocks';
import {abyssHero} from '../dungeons2/roster';
import {classmateFor} from '../journey';
import {magicForm} from './transformation';
import React from 'react';
import {assetUrl} from '../../../utils/assetPaths';
import {CHAPTER_LABELS,PROTAGONISTS,STUDENT_STORIES,studentChapter,studentHero,type StudentChapter} from './content';
import type {SchoolAdventure} from '../useSchoolAdventure';
export function StudentPicker({adventure:a}:{adventure:SchoolAdventure}){const form=magicForm(a.selectedHero.id);const [chapter,setChapter]=React.useState<StudentChapter>(studentChapter(a.selectedHero.id));const l=a.text;return <section className="student-picker"><h3>{l('旅する主人公','Choose your traveler')}</h3><nav>{(Object.keys(CHAPTER_LABELS)as StudentChapter[]).map(id=><button key={id} aria-pressed={chapter===id} onClick={()=>setChapter(id)}>{l(CHAPTER_LABELS[id][0],CHAPTER_LABELS[id][1])}</button>)}</nav><div className="student-hero-grid">{(a.series===2?a.unlockedHeroes:PROTAGONISTS.filter(p=>studentChapter(p.id)===chapter)).map(hero=><button key={hero.id} disabled={a.series===1&&!isProtagonistUnlocked(hero.id)} aria-pressed={a.selectedHero.id===hero.id} onClick={()=>a.setHero(hero.id)}><img src={assetUrl(abyssHero(hero.id)?.portrait||`models/protagonists/${hero.id}.png`)} alt="" loading="lazy"/><span>{a.series===1&&!isProtagonistUnlocked(hero.id)&&"🔒 "}{l(hero.name,hero.name)}</span></button>)}</div><p>{l('主人公で物語と出発時の道具が変わります。能力値とゲームのルールは共通です。','Your traveler determines the story and starting supplies. Base stats and game rules are shared.')}</p><strong>{l(a.selectedHero.name,a.selectedHero.name)} · {l(STUDENT_STORIES[studentChapter(a.selectedHero.id)][0].title,STUDENT_STORIES[studentChapter(a.selectedHero.id)][0].englishTitle)}</strong>{form&&<div className="student-form-preview"><img src={assetUrl(form.portrait)} alt=""/><p><strong>{l(form.title,'Magical form')}</strong><br/>{l('変身：与えるダメージと受けるダメージが2倍。次の階で自動解除。','Transform: deal and take double damage. Automatically ends on the next floor.')}<br/>{l('変身には1ターン使います。','Transforming takes one turn.')}</p></div>}</section>}
export function StudentStory({adventure:a,onClose}:{adventure:SchoolAdventure;onClose?:()=>void}){
 const act=a.storyAct;if(!act)return null;
 const l=a.text,companion=act.floor===3,friend=classmateFor(a.hero.id);
 const heroName=l(a.hero.name,chronicleHero(a.hero.id).en),friendName=l(friend.name,chronicleHero(friend.id).en);
 const reaction:Reaction=act.floor===21?'joy':a.storyLine===act.lines.length-1?'resolve':'neutral';
 const [ja,en]=act.lines[a.storyLine];
 return <ConversationStage singleActor={!companion} className="dialogue-student" title={l(act.title,act.englishTitle)} eyebrow={l(CHAPTER_LABELS[studentChapter(a.hero.id)][0],CHAPTER_LABELS[studentChapter(a.hero.id)][1])} background={chronicleBackground(a.state.mode)} left={{id:a.hero.id,name:heroName,reaction}} right={{id:friend.id,name:friendName,reaction}} active={companion?'right':'narrator'} speaker={companion?friendName:l('街道の記録','Roadside chronicle')} text={l(ja,en)} lineKey={`${a.hero.id}:${act.floor}:${a.storyLine}`} progress={`${a.storyLine+1} / ${act.lines.length}`} onClose={onClose||a.resume} closeLabel={a.state.place==='HOME'||a.state.place==='RELAY'?l('町へ戻る','Back to town'):l('冒険に戻る','Resume')}>
 <button autoFocus data-gamepad-initial-choice className="conversation-primary" onClick={a.advanceStory}>{a.storyLine<act.lines.length-1?l('次のことば','Next'):act.floor===3?l('約束して仲間になる','Promise and join'):act.floor===21?l('エンディング・町へ帰る','Ending · Return to town'):l('旅を続ける','Continue journey')}</button>
 </ConversationStage>;
}

export function StudentJournal({adventure:a}:{adventure:SchoolAdventure}){const l=a.text;const seen=(floor:number,i:number)=>Boolean(a.state.storySeen?.includes(floor)||(a.base.studentStory?.[studentChapter(a.hero.id)]||0)>i);return <section><h3>{l('主人公の旅の記録','Traveler story journal')}</h3><p>{l(studentHero(a.hero.id).name,studentHero(a.hero.id).name)}</p>{STUDENT_STORIES[studentChapter(a.hero.id)].map((act,i)=><button key={act.floor} disabled={!seen(act.floor,i)} onClick={()=>a.openStory(i,true)}>{seen(act.floor,i)?'✓ ':'🔒 '}{l(act.title,act.englishTitle)}</button>)}</section>}

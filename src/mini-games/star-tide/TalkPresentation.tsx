import React from 'react';
import ConversationStage from '../../components/dialogue/ConversationStage';
import {starDialogue,conversationWords} from './conversation';
import {JOURNEY_TALKS,ROOM_TALKS} from './quests';
import {CHAPTERS} from './content';
export default function TalkPresentation({chapter,room,en,onReplay,onJournal,onClose}:{chapter:number;room:number;en:boolean;onReplay:()=>void;onJournal:()=>void;onClose:()=>void}){
 const id=`npc-${chapter}-${room===0?'journey':'room-'+(room===4?0:room===12?1:2)}`,actors=starDialogue(chapter,id,en),text=room===0?JOURNEY_TALKS[chapter][en?1:0]:ROOM_TALKS[chapter][room===4?0:room===12?1:2][en?1:0];
 return <ConversationStage className="st-talk-stage" theme="sea" title={en?CHAPTERS[chapter].en:CHAPTERS[chapter].name} eyebrow="STAR TIDE · ENCOUNTER" background={`sprites/star-tide/events/${chapter}.webp`} {...actors} speaker={actors.active==='narrator'?(en?'Narrator':'語り'):actors.active==='left'?actors.left.name:actors.right.name} text={conversationWords(text)} lineKey={id} onClose={onClose} closeLabel={en?'Resume voyage':'冒険へ戻る'}>
 <button onClick={onReplay}>{en?'Replay voice':'もう一度聞く'}</button><button onClick={onJournal}>{en?'Requests and routes':'依頼と航路を確認'}</button><button autoFocus data-gamepad-initial-choice className="conversation-primary" onClick={onClose}>{en?'Resume voyage':'冒険へ戻る'} →</button>
 </ConversationStage>;
}

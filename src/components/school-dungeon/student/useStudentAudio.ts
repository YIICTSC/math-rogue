import {useEffect,useRef} from 'react';
import {audioService} from '../../../services/audioService';
import {createStudentAudio,type StudentAudioAction} from './audio';

type Snapshot={heroId:string;active:boolean;runId?:string;floor:number;hp:number;gameOver:boolean;gameClear:boolean;transformed:boolean;inventory:{id:string}[];equipment:unknown;inDungeon:boolean};
export function useStudentAudio(snapshot:Snapshot){
 const current=useRef(snapshot);current.current=snapshot;
 const controller=useRef<ReturnType<typeof createStudentAudio>|null>(null);
 controller.current??=createStudentAudio(audioService);
 const play=(action:StudentAudioAction,finish=false)=>{if(current.current.active&&typeof document!=='undefined'&&!document.hidden)controller.current!.play(current.current.heroId,action,finish);};
 const previous=useRef(snapshot);
 const lastPlaying=useRef({runId:snapshot.runId,floor:snapshot.floor});
 useEffect(()=>{
  const before=previous.current;previous.current=snapshot;
  if(!snapshot.active)return;
  const last=lastPlaying.current;lastPlaying.current={runId:snapshot.runId,floor:snapshot.floor};
  if(last.runId===snapshot.runId&&last.floor!==snapshot.floor){play('stairs');return;}
  if(!before.active||before.runId!==snapshot.runId||before.heroId!==snapshot.heroId)return;
  if(snapshot.gameOver&&!before.gameOver)play('defeat');
  else if(snapshot.gameClear&&!before.gameClear)play('win',true);
  else if(snapshot.floor!==before.floor)play('stairs');
  else if(snapshot.transformed&&!before.transformed)play('transform');
  else if(snapshot.hp<before.hp)play('damage');
  else if(snapshot.hp-before.hp>=5)play('heal');
  else if(snapshot.inDungeon&&before.inDungeon&&snapshot.equipment!==before.equipment)play('equip');
  else if(snapshot.inDungeon&&before.inDungeon&&snapshot.inventory.length>before.inventory.length)play('pickup');
  else if(snapshot.inDungeon&&before.inDungeon&&snapshot.inventory.length<before.inventory.length)play('item');
 },[snapshot.heroId,snapshot.active,snapshot.runId,snapshot.floor,snapshot.hp,snapshot.gameOver,snapshot.gameClear,snapshot.transformed,snapshot.inventory,snapshot.equipment,snapshot.inDungeon]);
 return play;
}

import {useEffect,useRef} from 'react';
import {audioService} from '../../../services/audioService';
import {createStudentAudio,type StudentAudioAction,type StudentAudioProfile} from './audio';

type Snapshot={movement?:string;heroId:string;active:boolean;runId?:string;floor:number;hp:number;gameOver:boolean;gameClear:boolean;transformed:boolean;inventory:{id:string}[];equipment:unknown;inDungeon:boolean};
export function useStudentAudio(snapshot:Snapshot,profile:StudentAudioProfile='default'){
 const current=useRef(snapshot);current.current=snapshot;
 const controller=useRef<ReturnType<typeof createStudentAudio>|null>(null);
 controller.current??=createStudentAudio(audioService,undefined,undefined,profile);
 const play=(action:StudentAudioAction,finish=false,element='star',abilityName?:string)=>{if(current.current.active&&typeof document!=='undefined'&&!document.hidden)controller.current!.play(current.current.heroId,action,finish,element,abilityName);};
 useEffect(()=>()=>audioService.stopDungeonChronicleVoices(true),[]);
 useEffect(()=>{if(!snapshot.active)audioService.stopDungeonChronicleVoices(true);},[snapshot.active]);
 const equipmentKey=JSON.stringify(snapshot.equipment);
 const previous=useRef({...snapshot,equipmentKey});
 const lastPlaying=useRef({runId:snapshot.runId,floor:snapshot.floor});
 useEffect(()=>{
  const before=previous.current;previous.current={...snapshot,equipmentKey};
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
  else if(snapshot.inDungeon&&before.inDungeon&&equipmentKey!==before.equipmentKey)play('equip');
  else if(snapshot.inDungeon&&before.inDungeon&&snapshot.inventory.length>before.inventory.length)play('pickup');
  else if(snapshot.inDungeon&&before.inDungeon&&snapshot.inventory.length<before.inventory.length)play('item');
  else if(snapshot.movement&&before.movement&&snapshot.movement!==before.movement)play('walk');
 },[snapshot.movement,snapshot.heroId,snapshot.active,snapshot.runId,snapshot.floor,snapshot.hp,snapshot.gameOver,snapshot.gameClear,snapshot.transformed,snapshot.inventory,equipmentKey,snapshot.inDungeon]);
 return play;
}

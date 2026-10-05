import {useEffect,useRef,useState} from 'react';
import {readFishBook,saveFishBook,type FishCatch,type FishRecords} from './fishing';
export default function useFishingCollection(records:FishRecords|undefined,catching:FishCatch|undefined,session:string|undefined){
 const [result,setResult]=useState<FishCatch>();
 const seen=useRef<{session:string|undefined;at:number|undefined}>({session:undefined,at:undefined});
 useEffect(()=>{
  // The first snapshot is saved history, not a catch made during this session.
  if(session!==seen.current.session){seen.current={session,at:catching?.at};setResult(undefined);if(records)saveFishBook(records);return;}
  if(!session||!catching||catching.at===seen.current.at)return;
  seen.current.at=catching.at;
  const previous=readFishBook()[catching.id];
  setResult({...catching,record:!previous||catching.size>previous.best});
  if(records)saveFishBook(records);
 },[session,catching?.at]);
 return {result,close:()=>setResult(undefined)};
}

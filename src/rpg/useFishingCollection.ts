import {useEffect,useRef,useState} from 'react';
import {readFishBook,saveFishBook,type FishCatch,type FishRecords} from './fishing';
export default function useFishingCollection(records:FishRecords|undefined,catching:FishCatch|undefined){
 const [result,setResult]=useState<FishCatch>(),seen=useRef(0);
 useEffect(()=>{if(!catching){seen.current=0;setResult(undefined);return;}if(catching.at===seen.current)return;seen.current=catching.at;const previous=readFishBook()[catching.id];setResult({...catching,record:!previous||catching.size>previous.best});if(records)saveFishBook(records);},[catching?.at]);
 return {result,close:()=>setResult(undefined)};
}

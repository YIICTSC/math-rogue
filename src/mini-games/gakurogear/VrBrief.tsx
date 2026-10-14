import React,{useRef} from 'react';
export default function VrBrief({title,instructions,en,children}:{title:string;instructions:string;en:boolean;children?:React.ReactNode}) {
  const details=useRef<HTMLDetailsElement>(null);
  return <aside className="gear-mission-hud"><div className="gear-mission-status">{title}{children}</div><details ref={details}><summary>{en?'Controls & tips':'操作とヒント'}</summary><p>{instructions}</p><button type="button" onClick={()=>{if(details.current)details.current.open=false;}}>{en?'Close tips':'ヒントを閉じる'}</button></details></aside>;
}

import React from 'react';
export function FacingButton({active,onToggle,text}:{active:boolean;onToggle:()=>void;text:(ja:string,en:string)=>string}){
 return <button type="button" className="dungeon-facing-toggle" aria-label={text('向き変更','Face only')} aria-pressed={active} onClick={onToggle} style={{position:'absolute',top:'calc(100% + 5px)',left:'50%',transform:'translateX(-50%)',zIndex:5,minHeight:30,padding:'3px 10px',border:'1px solid '+(active?'#fff0a0':'#687c87'),borderRadius:6,background:active?'#345e6b':'#18252e',color:'#f3f2df',fontSize:11,whiteSpace:'nowrap',touchAction:'manipulation'}}>{active?'↻ ':''}{text('向き変更','Face only')}</button>;
}

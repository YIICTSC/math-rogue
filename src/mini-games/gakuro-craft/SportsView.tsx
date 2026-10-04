import React,{lazy,Suspense,useState} from 'react';
import type {SportsSceneProps} from './SportsScene3D';
const Scene=lazy(()=>import('./SportsScene3D'));
type BoundaryProps={onFailure:()=>void;children:React.ReactNode};
class SceneBoundary extends React.Component<BoundaryProps,{failed:boolean}>{
 declare readonly props:Readonly<BoundaryProps>;
 state={failed:false};static getDerivedStateFromError(){return {failed:true};}componentDidCatch(){this.props.onFailure();}render(){return this.state.failed?null:this.props.children;}
}
export default function SportsView({children,t,...props}:Omit<SportsSceneProps,'top'|'onUnavailable'> & {children:React.ReactNode}){
 const [three,setThree]=useState(true),[top,setTop]=useState(false),[unavailable,setUnavailable]=useState(false);
 const fail=()=>{setUnavailable(true);setThree(false);};
 return <div className={'gc-sports-view '+props.kind}>
 <div className="gc-sports-view-controls"><button aria-pressed={three} disabled={unavailable} onClick={()=>setThree(!three)}>{t(three?'2D表示':'3D表示')}</button>{three&&props.kind==='pool'&&<button aria-pressed={top} onClick={()=>setTop(!top)}>{t(top?'斜めから見る':'真上から見る')}</button>}</div>
 {unavailable&&<small>{t('3Dを利用できないため2Dで表示しています。')}</small>}
 {three?<SceneBoundary onFailure={fail}><Suspense fallback={children}><Scene {...props} t={t} top={top} onUnavailable={fail}/></Suspense></SceneBoundary>:children}
 </div>;
}

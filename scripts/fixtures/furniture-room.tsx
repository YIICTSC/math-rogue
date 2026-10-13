import {queueLearning} from '../../src/mini-games/gakuro-craft/furnitureLearning';
import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import HobbyGamesPanel from '../../src/mini-games/gakuro-craft/HobbyGamesPanel';
import {gameCommand,tickGames,gameKind,type HomeGameWorld,type GameCommand} from '../../src/mini-games/gakuro-craft/homeGames';
import {GAME_LABELS} from '../../src/mini-games/gakuro-craft/partyGames';
import {trans} from '../../src/utils/textUtils';
import '../../src/mini-games/gakuro-craft/craft.css';
function Fixture(){
 const query=new URLSearchParams(location.search),kind=query.get('kind')||'reversi',language=query.get('language')==='en'?'ENGLISH':query.get('language')==='hi'?'HIRAGANA':'JAPANESE';
 const [world]=useState(()=>{const home={tile:0,level:3,furniture:[{slot:0,item:gameKind(kind)?kind:'reversi'}]},w:HomeGameWorld={preview:true,tiles:[{homeOwner:'p'}],time:0,paused:false,games:{},players:{p:{id:'p',name:'Player',indoors:true,homeTile:0,progress:{home}}}};gameCommand(w,w.players.p,{type:'game_join',slot:0});const g=w.games['0:0'];if(kind==='skyadventure'&&(query.has('stage')||query.get('scenario')==='learning')){gameCommand(w,w.players.p,{type:'game_start',key:g.key});const r=g.sky!.runners.p;r.stage=Math.max(0,Math.min(29,Number(query.get('stage'))||0));if(query.get('scenario')==='learning'){r.stage=2;r.offers=['boots','wings','magnet'];r.quizQueued=true;queueLearning(w,'p','stages');}}return w;});
 const [,update]=useState(0),last=useRef(performance.now());
 useEffect(()=>{const timer=setInterval(()=>{const now=performance.now(),dt=Math.min(.1,(now-last.current)/1000);last.current=now;world.time+=dt;tickGames(world,dt);update(n=>n+1);},50);return()=>clearInterval(timer);},[world]);
 const send=(c:GameCommand)=>{gameCommand(world,world.players.p,c);update(n=>n+1);};
 return <><nav style={{display:'flex',flexWrap:'wrap',gap:12,padding:24}}>{Object.entries(GAME_LABELS).filter(([k])=>gameKind(k)).map(([k,label])=><a key={k} style={{color:'white'}} href={'?kind='+k}>{label}</a>)}</nav><HobbyGamesPanel world={world} me={world.players.p} home={world.players.p.progress.home} t={s=>trans(s,language as any)} send={send}/></>;
}
const root=createRoot(document.getElementById('root')!);root.render(<Fixture/>);
if(import.meta.hot)import.meta.hot.dispose(()=>root.unmount());

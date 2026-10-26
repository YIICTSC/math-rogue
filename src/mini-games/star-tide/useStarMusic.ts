import{useEffect,useRef}from'react';
import{audioService}from'../../services/audioService';
import type{World}from'./engine';
import{starMusicFor,type StarMusicContext}from'./music';
export function useStarMusic(w:World,page:StarMusicContext['page'],question:boolean,journalFromEnding:boolean){
 const memory=useRef({area:'',battleUntil:0,victoryUntil:0,boss:false});
 const area=`${w.s.chapter}:${w.s.realm}:${w.s.room}`,now=w.s.seconds,m=memory.current;
 if(m.area!==area){m.area=area;m.battleUntil=m.victoryUntil=0;m.boss=false;}
 const boss=w.enemies.some(e=>e.boss&&e.hp>0),threat=w.enemies.some(e=>e.hp>0&&Math.hypot(e.x-w.x,e.y-w.y)<5.5);
 if(page==='play'&&!question){if(threat)m.battleUntil=now+3;if(m.boss&&!boss)m.victoryUntil=now+3;m.boss=boss;}
 // Journals keep their surrounding track; narration and substantial scenes choose their own.
 const candidate=starMusicFor({page,chapter:w.s.chapter,room:w.s.room,question,sky:w.inSky,camp:w.atCamp,boss,battle:w.enemies.some(e=>e.hp>0)&&now<m.battleUntil,victory:now<m.victoryUntil,community:w.endingKind==='community',journalFromEnding});
 const scope=useRef<ReturnType<typeof audioService.acquireBgmScene>|null>(null),latest=useRef(candidate);
 const song=page==='journal'&&!journalFromEnding?latest.current:candidate;latest.current=song;
 useEffect(()=>{const s=latest.current;scope.current=audioService.acquireBgmScene(s.type,s.options,30);return()=>{scope.current?.();scope.current=null;};},[]);
 useEffect(()=>{scope.current?.update(song.type,song.options);},[song.type,song.options.mode,song.options.theme]);
}

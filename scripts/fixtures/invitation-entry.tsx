import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import GakuroKart from '../../src/mini-games/gakuro-kart/GakuroKart';
import GakuroGolf from '../../src/mini-games/gakuro-golf/GakuroGolf';
import VrTitle from '../../src/mini-games/gakurogear/VrTitle';
import RpgTitle from '../../src/rpg/RpgTitle';
import RpgOnline from '../../src/rpg/RpgOnline';
import {KartRoom} from '../../src/mini-games/gakuro-kart/network';
import {GolfRoom} from '../../src/mini-games/gakuro-golf/network';
import {VrRoom} from '../../src/mini-games/gakurogear/network';
import {RpgRoom} from '../../src/rpg/network';
import type {Player, LanguageMode} from '../../src/types';
import '../../src/styles.css';

// Keep the real title screens and entry handlers; replace only network I/O.
const qa = window as typeof window & {joins: {code:string;name:string}[]};
qa.joins=[];
const join=async(code:string,name:string)=>{qa.joins.push({code,name});throw new Error('QA connection failure');};
KartRoom.prototype.join=join;
GolfRoom.prototype.join=join;
VrRoom.prototype.join=async(name,code)=>join(code,name);
RpgRoom.prototype.prepareInviteJoin=join;
const params=new URLSearchParams(location.search), kind=params.get('kind'), invite=params.has('invite');
const languageMode=(params.get('language')||'JAPANESE') as LanguageMode;
const close=()=>{document.body.dataset.closed='true';};
const noop=()=>{};
const player={id:'WARRIOR',maxHp:80,currentHp:80,maxEnergy:3,currentEnergy:3,gold:99,deck:[],relics:[],hand:[],potions:[],powers:{},discardPile:[],drawPile:[],block:0,strength:0} as unknown as Player;
function App(){
 const [intent,setIntent]=useState<'solo'|'online'|'join'|null>(invite?'join':null);
 if(kind==='rpg')return intent?<RpgOnline player={player} active languageMode={languageMode} initialIntent={intent} autoJoinInvite={invite} onRoom={noop} onSnapshot={noop} onSetup={noop} onClose={close} onTitle={()=>setIntent(null)}/>:<RpgTitle languageMode={languageMode} onNew={setIntent} onContinue={noop} onClose={close}/>;
 if(kind==='kart')return <GakuroKart languageMode={languageMode} inviteCode={invite?'501234':''} onClose={close}/>;
 if(kind==='golf')return <GakuroGolf languageMode={languageMode} inviteCode={invite?'501234':''} onClose={close}/>;
 return <VrTitle languageMode={languageMode} inviteCode={invite?'501234':''} problemMode={'ADDITION' as any} onBack={close}/>;
}
createRoot(document.getElementById('root')!).render(<App/>);

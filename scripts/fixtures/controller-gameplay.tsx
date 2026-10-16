import React from 'react';
import {createRoot} from 'react-dom/client';
import {useXboxControllerNavigation} from '../../src/hooks/useXboxControllerNavigation';
import {GamepadSystemMenu} from '../../src/components/GamepadSystemMenu';
import Gear from '../../src/mini-games/gakurogear/GakuroGear';
import Kart from '../../src/mini-games/gakuro-kart/GakuroKart';
import Golf from '../../src/mini-games/gakuro-golf/GakuroGolf';
import Rpg from '../../src/rpg/RpgOnline';
import '../../src/styles.css';
const player={maxHp:80,currentHp:80,maxEnergy:3,currentEnergy:3,gold:99,deck:[],relics:[],hand:[],potions:[],powers:{},discardPile:[],drawPile:[],block:0,strength:0};
function App(){useXboxControllerNavigation();const mode=new URLSearchParams(location.search).get('mode');return <><GamepadSystemMenu enabled canQuit={false} languageMode="JAPANESE" onReturnToTitle={()=>{}} onQuit={()=>{}}/>{mode==='vr'?<Gear onBack={()=>{}} languageMode="JAPANESE"/>:mode==='race'?<Kart onClose={()=>{}} languageMode="JAPANESE"/>:mode==='golf'?<Golf onClose={()=>{}} languageMode="JAPANESE"/>:<Rpg player={player as any} active languageMode="JAPANESE" onRoom={()=>{}} onSnapshot={()=>{}} onSetup={()=>{}} onClose={()=>{}}/>}</>;}
createRoot(document.getElementById('root')!).render(<App/>);

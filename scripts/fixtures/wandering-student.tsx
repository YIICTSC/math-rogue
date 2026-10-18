import React from 'react';
import {createRoot} from 'react-dom/client';
import '../../src/styles.css';
import One from '../../src/components/SchoolDungeonRPG';
import Two from '../../src/components/SchoolDungeonRPG2';
const Game=new URLSearchParams(location.search).get('game')==='2'?Two:One;
createRoot(document.getElementById('root')!).render(<Game onBack={()=>{}} languageMode="JAPANESE"/>);

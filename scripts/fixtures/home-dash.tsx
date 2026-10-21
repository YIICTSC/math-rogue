import React from 'react';
import { createRoot } from 'react-dom/client';
import GoHomeDash from '../../src/components/GoHomeDash';
import { useXboxControllerNavigation } from '../../src/hooks/useXboxControllerNavigation';
import { audioService } from '../../src/services/audioService';
import '../../src/styles.css';
const params = new URLSearchParams(location.search);
if(params.has('unlocked')) localStorage.setItem('pixel_spire_theme_clear_counts_v1', JSON.stringify({'high-school':100,magic:100}));
const voices: unknown[]=[];
const play=audioService.playHomeDashVoice.bind(audioService);
audioService.playHomeDashVoice=(hero,event)=>{voices.push({hero,event});return play(hero,event);};
Object.assign(window,{__dashVoices:voices});
function Harness(){useXboxControllerNavigation();return <GoHomeDash onBack={()=>{document.body.dataset.exited='true';}} languageMode={params.get('lang') as any || 'JAPANESE'} compact={params.has('compact')} initialHp={params.has('compact')?1:3} initialMaxHp={params.has('compact')?1:3}/>;}
createRoot(document.getElementById('root')!).render(<Harness/>);

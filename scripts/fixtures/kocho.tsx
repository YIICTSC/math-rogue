import React from 'react';
import { createRoot } from 'react-dom/client';
import KochoShowdown from '../../src/components/KochoShowdown';
import { audioService } from '../../src/services/audioService';
import { useXboxControllerNavigation } from '../../src/hooks/useXboxControllerNavigation';
import '../../src/styles.css';
for(const key of ['playSound','playBGM','stopBGM','playAttackEffectSound','playStatusEffectSound']) (audioService as any)[key]=()=>{};
const params=new URLSearchParams(location.search);
function Harness() {
  useXboxControllerNavigation();
  return <KochoShowdown onBack={()=>{document.getElementById('root')!.dataset.exited='true';}} languageMode={params.get('lang')==='en'?'ENGLISH':params.get('lang')==='hi'?'HIRAGANA':'JAPANESE'} isUiPreview={params.has('preview')}/>;
}
createRoot(document.getElementById('root')!).render(<Harness/>);

import React from 'react';
import { createRoot } from 'react-dom/client';
import MahjongGame from '../../src/mini-games/mahjong/MahjongGame';
import { audioService } from '../../src/services/audioService';
import { useXboxControllerNavigation } from '../../src/hooks/useXboxControllerNavigation';
import '../../src/styles.css';
audioService.playSound = () => {};
const params = new URLSearchParams(location.search);
function Harness() {
  useXboxControllerNavigation();
  return <MahjongGame languageMode={params.get('lang') === 'en' ? 'ENGLISH' : params.get('lang') === 'hi' ? 'HIRAGANA' : 'JAPANESE'} onBack={() => { document.getElementById('root')!.dataset.exited = 'true'; }} onMissionClear={() => { document.getElementById('root')!.dataset.cleared = 'true'; }} />;
}
createRoot(document.getElementById('root')!).render(<Harness />);

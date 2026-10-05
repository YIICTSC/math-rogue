import {useLayoutEffect} from 'react';
import {audioService} from '../../services/audioService';
import type {HomeGame} from './homeGames';
import {GAME_BGM} from './gameBgm';

export default function useGameBgm(game: HomeGame | undefined, rpgMusic?:boolean) {
  const track = game?.phase === 'playing' ? GAME_BGM[game.kind] : null;
  useLayoutEffect(() => {
    if (!track || rpgMusic===false) return;
    if (rpgMusic) return audioService.acquireBgmScene(track,{mode:'NEW',theme:'elementary'},30);
    const previous = audioService.getCurrentBgmPlayback();
    void audioService.playBGM(track);
    return () => {
      // A newer scene (e.g. a study question) owns its own music.
      if (audioService.getCurrentBgmType() !== track) return;
      if (!previous) { audioService.stopBGM(); return; }
      void audioService.playBGM(previous.type as Parameters<typeof audioService.playBGM>[0], previous.loop, previous.options)
        .then(() => { if (previous.paused && audioService.getCurrentBgmType() === previous.type) void audioService.pauseBGM(); });
    };
  }, [track, game?.key,rpgMusic]);
}

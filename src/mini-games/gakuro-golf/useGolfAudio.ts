import { useEffect, useRef } from 'react';
import { audioService, type BgmPlaybackOptions } from '../../services/audioService';
import { HOLES } from './course';
import type { GolfView, PublicGolfer } from './engine';
type Track = { type: Parameters<typeof audioService.playBGM>[0]; options: BgmPlaybackOptions };
// Calm openers, brighter middle holes and a warm final stretch; existing game assets only.
export const GOLF_HOLE_BGM: Track[] = [
  {type:'map',options:{mode:'OLD',theme:'elementary'}},
  {type:'rest',options:{mode:'NEW',theme:'elementary'}},
  {type:'map',options:{mode:'NEW',theme:'high-school'}},
  {type:'event',options:{mode:'OLD',theme:'elementary'}},
  {type:'rest',options:{mode:'OLD',theme:'high-school'}},
  {type:'map',options:{mode:'NEW',theme:'magic-female'}},
  {type:'event',options:{mode:'NEW',theme:'elementary'}},
  {type:'rest',options:{mode:'NEW',theme:'magic-male'}},
  {type:'map',options:{mode:'OLD',theme:'high-school'}},
  {type:'map',options:{mode:'NEW',theme:'elementary'}},
  {type:'event',options:{mode:'OLD',theme:'magic-female'}},
  {type:'rest',options:{mode:'NEW',theme:'high-school'}},
  {type:'map',options:{mode:'OLD',theme:'magic-male'}},
  {type:'event',options:{mode:'NEW',theme:'high-school'}},
  {type:'rest',options:{mode:'OLD',theme:'elementary'}},
  {type:'event',options:{mode:'NEW',theme:'magic-female'}},
  {type:'rest',options:{mode:'NEW',theme:'magic-female'}},
  {type:'map',options:{mode:'OLD',theme:'magic-female'}},
];
const clubhouse: Track = {type:'paper_plane_setup',options:{mode:'NEW',theme:'elementary'}};
const results: Track = {type:'victory',options:{mode:'NEW',theme:'elementary'}};
export function golfAudioCues(before: PublicGolfer | undefined, next: PublicGolfer | undefined): Parameters<typeof audioService.playGolfSound>[0][] {
  if (!before || !next || before.id !== next.id || before.hole !== next.hole) return [];
  if (next.scores.length > before.scores.length && !next.capped) return [next.strokes < HOLES[next.hole].par ? 'birdie' : 'cup'];
  if (next.penalty && (!before.penalty || next.shotId !== before.shotId)) {
    return [next.penaltyKind === 'water' ? 'water' : 'ob'];
  }
  if (next.shotId > before.shotId && next.phase === 'moving') return [next.shotClub === 'putter' ? 'putt' : 'swing'];
  if (before.phase === 'moving' && ((next.phase === 'moving' && before.y > .1 && next.y <= .1) || next.phase === 'aim' || next.phase === 'ready')) return ['land'];
  return [];
}
export function useGolfAudio(view: GolfView | null, player: PublicGolfer | undefined) {
  const scope = useRef<ReturnType<typeof audioService.acquireBgmScene> | null>(null);
  const previous = useRef<PublicGolfer | undefined>(undefined);
  const previousPhase = useRef<GolfView['phase'] | undefined>(undefined);
  const index = view?.phase === 'playing' ? player?.hole ?? 0 : -1;
  const phase = view?.phase;
  useEffect(() => {
    scope.current = audioService.acquireBgmScene(clubhouse.type,clubhouse.options,15);
    const unlock = () => { audioService.init(); void audioService.resumeBGM(); };
    window.addEventListener('pointerdown',unlock,{once:true});
    void audioService.preloadSfx(['swing','putt','land','cup','birdie','water','ob','start'].map(c=>`golf/${c}`));
    return () => { window.removeEventListener('pointerdown',unlock); scope.current?.(); scope.current=null; };
  },[]);
  useEffect(() => {
    const track = phase === 'result' ? results : index >= 0 ? GOLF_HOLE_BGM[index] : clubhouse;
    scope.current?.update(track.type,track.options);
  },[phase === 'result',index]);
  useEffect(() => {
    if (previousPhase.current === 'lobby' && phase === 'playing') audioService.playGolfSound('start');
    for (const cue of golfAudioCues(previous.current,player)) audioService.playGolfSound(cue);
    previous.current=player; previousPhase.current=phase;
  },[player,phase]);
}

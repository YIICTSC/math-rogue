import {useLayoutEffect} from 'react';
import {audioService,type BgmPlaybackOptions} from '../services/audioService';
type Track = {type:Parameters<typeof audioService.playBGM>[0];options:BgmPlaybackOptions};
const track=(type:Track['type'],mode:'OLD'|'NEW',theme:BgmPlaybackOptions['theme']='elementary'):Track=>({type,options:{mode,theme}});
/** Every original scene chooses from the complete existing soundtrack, independently of the hero's chapter. */
export const RPG_MUSIC = {
 map:track('map','OLD'), title:track('menu','NEW','magic'), setup:track('paper_plane_setup','NEW'),
 settings:track('rest','OLD','high-school'), hero:track('relic_select','NEW','magic-female'),
 home:track('rest','OLD'), craft:track('shop','NEW','high-school'), social:track('event','NEW','magic-female'),
 farm:track('paper_plane_vacation','OLD'), city:track('map','NEW','high-school'),
 fishing:track('rest','OLD','magic-male'), catch:track('reward','NEW','magic-female'),
 gather:track('dungeon_science','NEW'), story:track('event','OLD','magic-male'),
 journal:track('dungeon_library','OLD'), team:track('kocho_setup','NEW'),
 event:track('event','NEW','high-school'), goal:track('dungeon_roof','NEW'),
 arcade:track('poker_shop','NEW'), clear:track('reward','NEW','magic-female'),
 ended:track('game_over','OLD','high-school'), games:track('dungeon_music','NEW'),
} satisfies Record<string,Track>;
export type RpgMusicScene=keyof typeof RPG_MUSIC;
export function useRpgMusic(scene:RpgMusicScene|null,priority=10){
 useLayoutEffect(()=>{if(!scene)return;const song=RPG_MUSIC[scene];return audioService.acquireBgmScene(song.type,song.options,priority);},[scene,priority]);
}

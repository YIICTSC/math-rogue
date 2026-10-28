import type{audioService,BgmPlaybackOptions}from'../../services/audioService';
import type{Campaign}from'./types';
import{mainSite,siteForLocation}from'./scenes';
type Track={type:Parameters<typeof audioService.playBGM>[0];options:BgmPlaybackOptions};
const song=(type:Track['type'],mode:'OLD'|'NEW'='NEW',theme:BgmPlaybackOptions['theme']='elementary'):Track=>({type,options:{mode,theme}});
const region={default:song('map','NEW','high-school'),snow:song('rest','OLD','magic-male'),drydock:song('paper_plane_vacation'),canal:song('event','NEW','high-school'),marsh:song('event','OLD','magic-male')};
export function lanternMusic(entered:boolean,s:Campaign|null):Track{
 if(!entered||!s)return song('menu','NEW','magic');
 if(s.studyPending)return song('math','NEW','magic-female');
 if(s.phase==='ending')return song('reward','NEW','magic-female');
 if(s.phase==='result')return s.battle?.result==='win'?song('victory','NEW','magic-female'):song('game_over','OLD');
 if(s.phase==='camp')return song('rest','OLD');
 const site=s.phase==='field'?siteForLocation(s.worldLocation||'main-'+s.chapter):s.phase==='story'&&s.storyKind==='side'&&s.fieldQuest?siteForLocation(s.fieldQuest):mainSite(s.battle?.chapter??s.chapter);
 if(s.phase==='story'){if(s.storyKind==='support')return song('event','OLD','magic-female');return site.climate==='snow'?song('event','OLD','magic-male'):site.climate==='marsh'?song('event','OLD','magic-male'):s.chapter>=16?song('event','NEW','magic-male'):song('event','NEW',s.chapter%2?'magic-female':'high-school');}
 if(s.phase==='battle'){const c=s.battle?.chapter??s.chapter;if(c===17)return song('final_boss','NEW','magic-male');if(c===4||c===10||c===16)return song('boss','NEW','magic-female');return c>=12?song('battle','NEW','magic-male'):c>=6?song('battle','NEW','magic-female'):song('battle','NEW','high-school');}
 return site.background.includes('library')?song('dungeon_library','OLD'):site.theme===3?song('map','NEW','magic-male'):region[site.climate];
}

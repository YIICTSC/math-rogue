import type{audioService,BgmPlaybackOptions}from'../../services/audioService';
export type StarMusicTrack={type:Parameters<typeof audioService.playBGM>[0];options:BgmPlaybackOptions};
const track=(type:StarMusicTrack['type'],mode:'OLD'|'NEW'='NEW',theme:BgmPlaybackOptions['theme']='elementary'):StarMusicTrack=>({type,options:{mode,theme}});
/** Selections span the full original/new, school, magic and minigame libraries. */
export const STAR_REGION_MUSIC=[
 track('map','NEW','high-school'),track('map','OLD','magic-female'),track('map','NEW','magic-female'),
 track('dungeon_music'),track('rest','OLD','magic-male'),track('battle','OLD','magic-male'),
 track('event','OLD','magic-male'),track('map','OLD'),track('event','NEW','high-school'),
 track('paper_plane_battle','OLD'),track('dungeon_library','OLD'),track('map','NEW','magic-male'),
] as const;
export const STAR_DUNGEON_MUSIC=[track('dungeon_music','OLD'),track('dungeon_library'),track('dungeon_science','OLD'),track('dungeon_science'),track('dungeon_library','OLD'),track('school_psyche'),track('event','OLD','magic-male'),track('dungeon_music','OLD'),track('dungeon_music'),track('dungeon_roof'),track('event','NEW','magic-male'),track('relic_select','NEW','magic-female')] as const;
export const STAR_STORY_MUSIC=[track('event','OLD'),track('event','NEW','magic-female'),track('event','NEW','high-school'),track('event','OLD','high-school'),track('rest','OLD','magic-male'),track('event','NEW','magic-male'),track('event','OLD','magic-male'),track('event','NEW','magic-female'),track('event','NEW','high-school'),track('event','NEW','magic-female'),track('event','OLD','magic-male'),track('relic_select','NEW','magic-female')] as const;
export const STAR_MUSIC={title:track('menu','NEW','magic'),opening:track('event','OLD','magic-male'),glider:track('paper_plane_battle'),sky:track('paper_plane_vacation'),camp:track('rest','OLD'),study:track('math','NEW','magic-female'),victory:track('victory','NEW','magic-female'),ending:track('reward','NEW','magic-female'),community:track('victory','NEW','magic-female'),finalBoss:track('final_boss','NEW','magic-male')} as const;
const battles=[track('battle','NEW','high-school'),track('battle','NEW','magic-female'),track('battle','OLD'),track('battle','NEW','magic-male')];
const bosses=[track('boss','NEW','magic-female'),track('boss','OLD','magic-male'),track('dungeon_boss'),track('boss','NEW','high-school')];
export type StarMusicContext={page:'title'|'play'|'journal'|'story'|'talk'|'ending'|'glider'|'opening';chapter:number;room:number;question?:boolean;sky?:boolean;camp?:boolean;battle?:boolean;boss?:boolean;victory?:boolean;community?:boolean;journalFromEnding?:boolean};
export function starMusicFor(c:StarMusicContext):StarMusicTrack{
 const chapter=Math.max(0,Math.min(11,Math.trunc(c.chapter)||0));
 if(c.page==='title')return STAR_MUSIC.title;
 if(c.page==='opening')return STAR_MUSIC.opening;
 if(c.page==='ending'||c.page==='journal'&&c.journalFromEnding)return c.community?STAR_MUSIC.community:STAR_MUSIC.ending;
 if(c.page==='glider')return STAR_MUSIC.glider;
 if(c.page==='story'||c.page==='talk')return STAR_STORY_MUSIC[chapter];
 if(c.question&&c.page==='play')return STAR_MUSIC.study;
 if(c.victory)return STAR_MUSIC.victory;
 if(c.boss)return chapter===11?STAR_MUSIC.finalBoss:bosses[chapter%bosses.length];
 if(c.battle)return battles[chapter%battles.length];
 if(c.sky)return STAR_MUSIC.sky;
 if(c.camp)return STAR_MUSIC.camp;
 return c.room>=8?STAR_DUNGEON_MUSIC[chapter]:STAR_REGION_MUSIC[chapter];
}

export const PIXEL_RPG_TRACKS = ['title','main','opening','world','village','city','castle','forest','cave','academy','sea','underwater','airship','sky','battle','strong','boss','final','victory','job','treasure','sorrow','reunion','ending','post'] as const;
export type PixelRpgTrack = `pixel-rpg-${typeof PIXEL_RPG_TRACKS[number]}`;

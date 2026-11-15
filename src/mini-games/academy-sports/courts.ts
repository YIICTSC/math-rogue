import dimensions from './courtDimensions.json';
/** Expand playable area, keeping athlete size, goal mouth and vertical physics unchanged. */
export const SOCCER_SCALE = Math.sqrt(dimensions.soccer.areaMultiplier);
export const VOLLEY_SCALE = Math.sqrt(dimensions.volleyball.areaMultiplier);
export const SOCCER_FIELD = {
 width: dimensions.soccer.baseHalfWidth * SOCCER_SCALE,
 length: dimensions.soccer.baseHalfLength * SOCCER_SCALE,
 goal: dimensions.soccer.goalHalfWidth,
 height: dimensions.soccer.goalHeight,
};
export const VOLLEY_FIELD = {
 width: dimensions.volleyball.baseHalfWidth * VOLLEY_SCALE,
 length: dimensions.volleyball.baseHalfLength * VOLLEY_SCALE,
 net: dimensions.volleyball.netHeight,
};
export const soccerPosition = (x=0,y=0,z=0) => ({x:x*SOCCER_SCALE,y,z:z*SOCCER_SCALE});
export const volleyPosition = (x=0,y=0,z=0) => ({x:x*VOLLEY_SCALE,y,z:z*VOLLEY_SCALE});

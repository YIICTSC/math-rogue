/** Optional aerial regions become reachable after the first story beacon. */
export const WIND_LAUNCH = {x:15.5,y:3.5};
export const SKY_RETURN = {x:2.5,y:7.5};
export const SKY_CHEST = {x:17.5,y:4.5};
export const SKY_UPDRAFTS = [{x:8.5,y:5.5},{x:12.5,y:10.5}];
export const SKY_NAMES = [
 ['潮風の空庭','Seabreeze sky garden'],['木霊の枝空','Echo canopy'],['硝子雲の回廊','Glasscloud passage'],
 ['時渡りの浮庭','Clockwind gardens'],['霜星の空峡','Froststar sky gorge'],['熾火の浮き炉','Ember sky forge'],
 ['夜凪の星棚','Nightshore star ledges'],['星砂の天壇','Starsand sky altar'],['雨雲の鐘楼','Raincloud belfry'],
 ['雲梯の天路','Cloudstep skyway'],['月鏡の浮宮','Moonmirror sky palace'],['暁星の空域','Dawnstar heavens'],
] as const;
export function skyPlatforms(chapter:number){
 const extra=[[5,2],[5,11],[12,2],[16,10]][chapter%4];
 return [[1,6,4,9],[7,4,10,7],[11,9,14,12],[16,3,18,6],[extra[0],extra[1],extra[0]+1,extra[1]+1]];
}
export function skyMap(chapter:number){
 const map:number[][]=Array.from({length:14},(_,y)=>Array.from({length:20},(_,x)=>x===0||y===0||x===19||y===13?3:7));
 for(const[left,top,right,bottom]of skyPlatforms(chapter))for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++)map[y][x]=0;
 return map;
}

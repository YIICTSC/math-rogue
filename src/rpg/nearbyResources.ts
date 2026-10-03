import {WIDTH,HEIGHT,type World,type Adventurer} from './engine';
import {isResourceTile,natureAt,resourceReady} from './life';
/** Use the same reach and boundary rules as the authoritative gather action. */
export function nearbyResources(world:World,me:Adventurer){
 const tiles:number[]=[];
 for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){
  const x=me.x+dx,y=me.y+dy,tile=y*WIDTH+x;
  if(x>0&&y>0&&x<WIDTH-1&&y<HEIGHT-1&&Math.abs(dx)+Math.abs(dy)<=2&&isResourceTile(world,tile)&&(world.tiles[tile]==='water'||natureAt(world,tile)&&resourceReady(world,tile)))tiles.push(tile);
 }
 return tiles.sort((a,b)=>Math.abs(a%WIDTH-me.x)+Math.abs(Math.floor(a/WIDTH)-me.y)-Math.abs(b%WIDTH-me.x)-Math.abs(Math.floor(b/WIDTH)-me.y)||a-b);
}

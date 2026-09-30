// A rectangular island with exactly six times the original 40×40 area.
export const MAP_WIDTH=120,MAP_HEIGHT=80,MAP_TILES=MAP_WIDTH*MAP_HEIGHT;
export const CENTER_X=MAP_WIDTH/2,CENTER_Z=MAP_HEIGHT/2;
export const LEGACY_SIZE=40,LEGACY_OFFSET_X=CENTER_X-LEGACY_SIZE/2,LEGACY_OFFSET_Z=CENTER_Z-LEGACY_SIZE/2;
export const tileAt=(x:number,z:number)=>Math.floor(z)*MAP_WIDTH+Math.floor(x);
export const mapInside=(x:number,z:number)=>x>=0&&z>=0&&x<MAP_WIDTH&&z<MAP_HEIGHT;

/** A single map for story, everyday life and voxel construction. */
export const MAP_WIDTH=256, MAP_HEIGHT=128;
export const ORIGINAL_WIDTH=192, ORIGINAL_HEIGHT=88;
export const originalRegion=(x:number,z:number)=>x>=0&&z>=0&&x<ORIGINAL_WIDTH&&z<ORIGINAL_HEIGHT;

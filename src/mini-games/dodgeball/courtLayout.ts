import {OrthographicCamera, Vector3} from 'three';

export type CourtArea = {x:number;y:number;width:number;height:number};

/** The scene fills the screen; only the playable court avoids the edge HUD. */
export function courtArea(canvas:HTMLElement, frame?:HTMLElement|null):CourtArea {
 const bounds=canvas.getBoundingClientRect(),safe=frame?.getBoundingClientRect();
 return safe?{x:safe.left-bounds.left,y:safe.top-bounds.top,width:Math.max(1,safe.width),height:Math.max(1,safe.height)}:{x:0,y:0,width:Math.max(1,bounds.width),height:Math.max(1,bounds.height)};
}

export function fitDodgeCourt(camera:OrthographicCamera,width:number,height:number,area:CourtArea) {
 // Include both outfields, the ball boundary, and a jumping hero's head.
 camera.updateMatrixWorld();
 let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
 for(const x of [-9,9])for(const y of [0,4.2])for(const z of [-12.7,12.7]) {
  const point=new Vector3(x,y,z).applyMatrix4(camera.matrixWorldInverse);
  minX=Math.min(minX,point.x);maxX=Math.max(maxX,point.x);
  minY=Math.min(minY,point.y);maxY=Math.max(maxY,point.y);
 }
 const scale=Math.min(area.width/(maxX-minX),area.height/(maxY-minY));
 camera.left=(minX+maxX)/2-(area.x+area.width/2)/scale;
 camera.right=camera.left+width/scale;
 camera.top=(minY+maxY)/2+(area.y+area.height/2)/scale;
 camera.bottom=camera.top-height/scale;
 camera.updateProjectionMatrix();
}

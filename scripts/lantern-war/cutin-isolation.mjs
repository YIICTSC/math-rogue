import assert from 'node:assert/strict';
// Find the widest genuinely empty gutter near the expected grid boundary.
// Separate row boundaries per column account for ImageGen's slightly uneven layout.
export function isolatedCutinRects(data,width,height,channels=4){
 const alpha=(x,y)=>data[(y*width+x)*channels+channels-1];
 function gutter(axis,start,end){
  const length=axis==='x'?width:height,lo=Math.floor(length*.36),hi=Math.ceil(length*.64);let run=-1,best=[0,0];
  for(let p=lo;p<=hi;p++){
   let occupied=false;
   if(p<hi)for(let q=start;q<end;q++){if((axis==='x'?alpha(p,q):alpha(q,p))>16){occupied=true;break;}}
   else occupied=true;
   if(!occupied&&run<0)run=p;
   if(occupied&&run>=0){if(p-run>best[1]-best[0])best=[run,p];run=-1;}
  }
  assert(best[1]-best[0]>=8,`No clear ${axis} gutter in ${width}x${height}: ${best}`);
  return {at:Math.floor((best[0]+best[1])/2),empty:best[1]-best[0]};
 }
 const vertical=gutter('x',0,height),left=gutter('y',0,vertical.at),right=gutter('y',vertical.at,width);
 return {gutters:{vertical:vertical.empty,left:left.empty,right:right.empty},rects:[
  {left:0,top:0,width:vertical.at,height:left.at},
  {left:vertical.at,top:0,width:width-vertical.at,height:right.at},
  {left:0,top:left.at,width:vertical.at,height:height-left.at},
  {left:vertical.at,top:right.at,width:width-vertical.at,height:height-right.at}
 ]};
}

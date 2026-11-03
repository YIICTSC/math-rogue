/** Soft volumetric light and embers; no outlined bubbles, ribbons or player-to-target lines. */
export function drawAura(ctx:CanvasRenderingContext2D,x:number,feet:number,color:string,power:number,frame:number,reduced=false){
 if(power<=0)return;
 ctx.save();ctx.globalCompositeOperation='screen';
 const breathe=reduced?1:1+Math.sin(frame*.075)*.06;
 ctx.translate(x,feet-38);ctx.scale(1,breathe*1.3);
 const glow=ctx.createRadialGradient(0,0,4,0,0,49);glow.addColorStop(0,color+'44');glow.addColorStop(.4,color+'24');glow.addColorStop(1,color+'00');
 ctx.globalAlpha=Math.min(.8,power);ctx.fillStyle=glow;ctx.fillRect(-50,-50,100,100);
 if(!reduced)for(let i=0;i<9;i++){
  const phase=(frame*.014+i*.137)%1,px=Math.sin(i*7.3+phase*3.5)*(12+phase*16),py=26-phase*73;
  ctx.globalAlpha=Math.sin(phase*Math.PI)*Math.min(.8,power);ctx.fillStyle=i%3?'#defff5':color;
  ctx.beginPath();ctx.ellipse(px,py,1.1+(1-phase)*.8,2.5,0,0,Math.PI*2);ctx.fill();
 }
 ctx.restore();
}

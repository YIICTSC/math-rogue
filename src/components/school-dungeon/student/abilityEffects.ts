/** Bounded, original particle effect shared by both 2D runtimes. No texture downloads. */
export function drawStudentAbilityEffect(ctx:CanvasRenderingContext2D,x:number,y:number,size:number,progress:number,color='#a9e8ff'){
 const p=Math.max(0,Math.min(1,progress)),radius=size*(.3+p*1.1);
 ctx.save();ctx.globalAlpha=1-p;ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=Math.max(1,size*.045);ctx.shadowColor=color;ctx.shadowBlur=Math.min(14,size*.3);
 ctx.beginPath();ctx.arc(x+size/2,y+size/2,radius,0,Math.PI*2);ctx.stroke();
 for(let i=0;i<8;i++){const angle=i*Math.PI/4+p*1.8,px=x+size/2+Math.cos(angle)*radius,py=y+size/2+Math.sin(angle)*radius;ctx.fillRect(px-2,py-2,4,4);ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px-Math.cos(angle)*size*.22,py-Math.sin(angle)*size*.22);ctx.stroke();}
 ctx.restore();
}

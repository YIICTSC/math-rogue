import type { Adventurer, World } from './engine';
import { watercraft } from './transport';

type Bounds = { minX:number; minY:number; maxX:number; maxY:number };

export function drawWatercraft(c:CanvasRenderingContext2D,w:World,tile:number,bounds:Bounds,time:number,height?:number) {
  for (const boat of watercraft(w)) {
    if (boat.x<bounds.minX||boat.x>bounds.maxX||boat.z<bounds.minY||boat.z>bounds.maxY||
      height!==undefined&&Math.abs(boat.y-height)>.55) continue;
    c.save();
    c.translate(boat.x*tile,boat.z*tile);
    c.rotate(boat.heading);
    c.scale(tile/16,tile/16);
    c.fillStyle='#c3ebd96b';
    if (boat.rider) for (const side of [-1,1]) c.fillRect(side*7-1,4+time/170%8,2,2);
    const raft=boat.item==='bamboo_raft'||boat.item==='cargo_raft';
    if (raft) {
      for (let i=-3;i<=3;i++) {
        c.fillStyle=i%2===0?'#b49d52':'#767f4b';
        c.fillRect(i*2-1,-10+Math.abs(i),2,20-2*Math.abs(i));
        c.fillStyle='#efcc75';
        c.fillRect(i*2-1,-4,1,8);
      }
      c.fillStyle='#a85d3c';
      c.fillRect(-7,-5,14,2);
      c.fillRect(-7,4,14,2);
    } else {
      c.beginPath();
      c.moveTo(0,-12);
      c.lineTo(6,-6);c.lineTo(7,5);c.lineTo(4,10);c.lineTo(-4,10);c.lineTo(-7,5);c.lineTo(-6,-6);c.closePath();
      c.fillStyle='#51382e';c.fill();
      c.lineWidth=1.6;c.strokeStyle='#e5aa68';c.stroke();
      c.fillStyle='#b17345';
      c.fillRect(-5,-4,10,2);c.fillRect(-5,3,10,2);
      c.strokeStyle='#c7a267';c.lineWidth=1;
      for (const side of [-1,1]) {c.beginPath();c.moveTo(side*3,-1);c.lineTo(side*9,4);c.stroke();}
    }
    if (boat.item==='cargo_boat'||boat.item==='cargo_raft') {
      c.fillStyle='#6e3c27';c.fillRect(-3,-7,6,6);
      c.strokeStyle='#ebc772';c.lineWidth=1;c.strokeRect(-3,-7,6,6);c.fillStyle='#f7d88b';c.fillRect(-.5,-3,1,2);
    }
    c.restore();
  }
}

export function drawGlider(c:CanvasRenderingContext2D,p:Adventurer,x:number,y:number) {
  if (!p.gliding) return;
  const angle=Math.atan2(p.gliding.dx,-p.gliding.dz);
  c.save();
  c.translate(x,y);
  c.rotate(angle);
  c.beginPath();
  c.moveTo(0,-10);c.lineTo(20,6);c.lineTo(6,1);c.lineTo(0,6);c.lineTo(-6,1);c.lineTo(-20,6);c.closePath();
  c.fillStyle='#4eb6ab';c.fill();
  c.lineWidth=1.35;c.strokeStyle='#fee1a2';c.stroke();
  for (const side of [-1,1]) {
    c.beginPath();c.moveTo(0,-8);c.lineTo(side*14,4);c.lineTo(side*6,0);c.closePath();
    c.fillStyle='#e4ddb6';c.fill();
  }
  c.restore();
}

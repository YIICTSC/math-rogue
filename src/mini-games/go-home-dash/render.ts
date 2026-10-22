import { drawArt, type ArtImages } from './art';
import { floorAt, routeAt, ROUTE_COLORS, routeTransition, type RouteId } from './routes';

export type ParallaxArt=Partial<Record<RouteId,Partial<Record<'architecture'|'foreground',HTMLImageElement>>>>;

// Alternate mirrored painted plates: identical edge pixels, no jump on wrapping.
export function drawScrollingLayer(ctx:CanvasRenderingContext2D,image:HTMLImageElement,distance:number,speed:number,width:number,opacity=1){
 const h=400,w=h*image.naturalWidth/image.naturalHeight;if(!Number.isFinite(w)||w<=0)return;
 const phase=distance*speed,first=Math.floor(phase/w),offset=phase-first*w;
 ctx.save();ctx.globalAlpha*=opacity;
 for(let i=-1;i<=Math.ceil(width/w)+1;i++){const x=i*w-offset;ctx.save();if((first+i)%2!==0){ctx.translate(x+w,0);ctx.scale(-1,1);ctx.drawImage(image,0,0,w,h);}else ctx.drawImage(image,x,0,w,h);ctx.restore();}
 ctx.restore();
}

function drawRouteLayer(ctx: CanvasRenderingContext2D, seed: number, distance: number, frame: number, id: RouteId, art: HTMLImageElement | undefined, width: number, height: number, layers: ParallaxArt) {
  const route = {...routeAt(seed, distance + 120), id}, colors = ROUTE_COLORS[id];
  if (!art?.complete || art.naturalWidth <= 0) {
    const sky = ctx.createLinearGradient(0, 0, 0, 400);
    sky.addColorStop(0, colors.sky); sky.addColorStop(.7, colors.glow); sky.addColorStop(1, colors.ground);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff1cbb3'; ctx.beginPath(); ctx.arc(610 - distance * .005 % 180, 102, 38, 0, Math.PI * 2); ctx.fill();
    for (let layer = 0; layer < 3; layer++) {
      const spacing = 170 - layer * 35, offset = distance * (.06 + layer * .1) % spacing;
      ctx.fillStyle = ['#14203b66', '#17253d99', '#132137cc'][layer];
      for (let x = -spacing; x < width + 100; x += spacing) {
        const bx = x - offset, height = 55 + Math.sin((x + spacing) * 7.3 + layer) * 30 + layer * 12, base = 305 + layer * 10;
        if (route.id === 'garden') {
          ctx.fillRect(bx + 20, base - height + 20, 10, height);
          ctx.beginPath(); ctx.arc(bx + 25, base - height, 45, 0, Math.PI * 2); ctx.fill();
        } else if (route.flight || route.id === 'skyway' || route.id === 'storm') {
          ctx.beginPath(); ctx.ellipse(bx, base - height, 80, 13, 0, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.moveTo(bx - 54, base - height); ctx.lineTo(bx + 15, base - height + 46); ctx.lineTo(bx + 62, base - height); ctx.fill();
        } else {
          ctx.fillRect(bx, base - height, spacing - 15, height);
          ctx.fillRect(bx + 18, base - height - 12, spacing - 50, 12);
          ctx.fillStyle = colors.glow + '99';
          for (let w = 12; w < spacing - 30; w += 22) ctx.fillRect(bx + w, base - height + 20, 6, 11);
          ctx.fillStyle = ['#14203b66', '#17253d99', '#132137cc'][layer];
        }
      }
    }
    if (route.id === 'canal') {
      ctx.fillStyle = '#72dce35c'; ctx.fillRect(0, 312, 800, 88);
      ctx.strokeStyle = '#b9faff70';
      for (let i = 0; i < 12; i++) { const x = (i * 83 - distance * .5) % 900; ctx.beginPath(); ctx.moveTo(x, 330 + i * 5); ctx.lineTo(x + 38, 330 + i * 5); ctx.stroke(); }
    }
  }
  if (art?.complete && art.naturalWidth > 0) {
    drawScrollingLayer(ctx,art,distance,.09,width);
    const scenery=layers[id];
    if(scenery?.architecture?.complete&&scenery.architecture.naturalWidth)drawScrollingLayer(ctx,scenery.architecture,distance,.28,width,1);
    if(scenery?.foreground?.complete&&scenery.foreground.naturalWidth)drawScrollingLayer(ctx,scenery.foreground,distance,.65,width,1);
    const shade = ctx.createLinearGradient(0, 0, 0, 400);
    shade.addColorStop(0, '#10182f22'); shade.addColorStop(.6, '#10182f00'); shade.addColorStop(1, '#10182f88');
    ctx.fillStyle = shade; ctx.fillRect(0, 0, width, height);
  }
  // Small drifting highlights complement the painted sky and Blender scenery.
  ctx.fillStyle = colors.glow;
  for (let i = 0; i < 12; i++) { const x = ((i * 79 - distance * .6) % 880 + 880) % 880; ctx.fillStyle = colors.glow + Math.round((.2 + .2 * Math.sin(frame * .03 + i)) * 255).toString(16).padStart(2, '0'); ctx.fillRect(x, 130 + i * 13 % 150, 2, 2); }
}


export function drawRoute(ctx: CanvasRenderingContext2D, seed: number, distance: number, frame: number, art: Partial<Record<RouteId, HTMLImageElement>>, width=800, height=400, layers:ParallaxArt={}) {
  const transition = routeTransition(seed, distance + 120);
  ctx.save();
  if (transition.mix < 1) drawRouteLayer(ctx, seed, distance, frame, transition.from, art[transition.from],width,height,layers);
  ctx.globalAlpha = transition.mix;
  drawRouteLayer(ctx, seed, distance, frame, transition.to, art[transition.to],width,height,layers);
  ctx.restore();
}

export function drawTerrain(ctx: CanvasRenderingContext2D, seed: number, distance: number, holes: {x: number; width: number}[], width=800, height=400) {
  const colors = ROUTE_COLORS[routeAt(seed, distance + 120).id];
  for (let x = 0; x < width; x += 4) {
    const y = floorAt(seed, distance + x);
    if (holes.some(h => Math.abs(x - h.x) < h.width / 2)){
      // A pit is a void in the world, not a window onto a slower-scrolling road.
      ctx.fillStyle='#060b16';ctx.fillRect(x,y,4,height-y);
      ctx.fillStyle='#b94c6838';ctx.fillRect(x,y,4,3);continue;
    }
    ctx.fillStyle = colors.ground; ctx.fillRect(x, y, 4, height - y);
    ctx.fillStyle = '#10182f77'; ctx.fillRect(x, y + 12, 4, height - 12 - y);
    ctx.fillStyle = colors.glow; ctx.fillRect(x, y, 4, 3);
    if (Math.floor((distance + x) / 56) % 2 === 0) {
      ctx.fillStyle = '#ffffff10'; ctx.fillRect(x, y + 22, 4, 5);
      ctx.fillRect(x, y + 53, 4, 4); ctx.fillRect(x, y + 84, 4, 4);
    }
    if (Math.floor((distance + x) / 24) % 4 === 0) { ctx.fillStyle = '#ffffff26'; ctx.fillRect(x, y + 5, 4, 3); }
  }
}

export function drawRunner(ctx: CanvasRenderingContext2D, sheet: HTMLImageElement | null, fallback: HTMLImageElement | null, p: {x:number;y:number;vy:number;isJumping:boolean;isFalling:boolean;animFrame:number;barrier:boolean;dashFrames:number;flying:boolean}, frame: number, art?: ArtImages) {
  ctx.save(); ctx.translate(p.x, p.y);
  if (p.dashFrames > 0) {
    const tail = ctx.createLinearGradient(-95, 0, 0, 0); tail.addColorStop(0, '#83f3eb00'); tail.addColorStop(1, '#83f3ebaa');
    ctx.fillStyle = tail; ctx.fillRect(-95, -37, 90, 27);
  }
  if (p.flying) {
    ctx.strokeStyle = '#effeff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-37, -77); ctx.lineTo(-8, -33); ctx.lineTo(38, -77); ctx.stroke();
    if(!drawArt(ctx,art,'glider',-64,-102,128,34,'stretch')){
    ctx.fillStyle = '#79e8ebdd'; ctx.beginPath(); ctx.moveTo(-64, -73); ctx.lineTo(0, -98); ctx.lineTo(64, -73); ctx.lineTo(0, -78); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#fef0ad'; ctx.stroke();
    }
    if (frame % 4 === 0) { ctx.fillStyle = '#fff5be'; ctx.fillRect(-64, -73, 3, 3); }
  }
  const airborne = p.isJumping || p.isFalling || p.flying;
  const f = airborne ? (p.vy < -4 ? 4 : Math.abs(p.vy) < 2 || p.flying ? 5 : p.vy > 6 ? 7 : 6) : p.animFrame % 4;
  if (sheet?.complete && sheet.naturalWidth > 0) {
    const w = sheet.naturalWidth / 4, h = sheet.naturalHeight / 2;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(sheet, f % 4 * w, Math.floor(f / 4) * h, w, h, -38, -90, 76, 95);
  } else if (fallback?.complete && fallback.naturalWidth > 0) {
    ctx.drawImage(fallback, -38, -84, 76, 84);
  }
  if (p.barrier) { ctx.strokeStyle = '#80ffff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, -35, 34, 46, 0, 0, Math.PI * 2); ctx.stroke(); }
  ctx.restore();
}

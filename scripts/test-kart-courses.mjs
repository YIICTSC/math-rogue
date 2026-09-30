import assert from 'node:assert/strict';
import { createServer } from 'vite';
const server=await createServer({configFile:false,optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,hmr:false},appType:'custom',logLevel:'error'});
try {
  const t=await server.ssrLoadModule('/src/mini-games/gakuro-kart/track.ts');
  const e=await server.ssrLoadModule('/src/mini-games/gakuro-kart/engine.ts');
  const n=await server.ssrLoadModule('/src/mini-games/gakuro-kart/protocol.ts');
  const m=await server.ssrLoadModule('/src/mini-games/gakuro-kart/minimap.ts');
  assert.equal(t.COURSES.length,8);
  const shapes=[];
  for(let course=0;course<8;course++) {
    const track=t.getTrack(course), map=m.minimapGeometry(course);
    assert(track.points.every(p=>Object.values(p).every(Number.isFinite)));
    shapes.push(JSON.stringify(track.points.map(p=>[p.x,p.y,p.z])));
    for(let distance=-50;distance<track.length*2;distance+=10) for(const lane of [-14,0,14]) {
      const pt=map.project(t.sampleTrack(distance,course,lane));
      assert(pt.x>=7&&pt.x<=115&&pt.y>=7&&pt.y<=133,`Course ${course} map cropped: ${JSON.stringify(pt)}`);
    }
    const start=map.project(t.sampleTrack(0,course));
    assert(map.path.startsWith(`M${start.x},${start.y}`),'Map line and car markers must use the same projection.');
    const w=e.createRace(course);e.addRacer(w,'self','Self');assert.equal(w.course,course);assert.equal(n.acceptRoster(n.roster(w),null).course,course);
  }
  assert.equal(new Set(shapes).size,8,'Courses must have distinct layouts.');
  const invalid=n.roster(e.createRace());invalid.course=8;assert.equal(n.acceptRoster(invalid,null),null);
  assert.equal(e.createRace(99).course,7);
  assert.deepEqual(Object.keys(e.ITEM_EFFECTS).sort(),Object.keys(e.ITEMS).sort());
  console.log('Eight distinct layouts, complete minimap bounds and shared marker projection, all course roster values, invalid course rejection and all item effect descriptions passed.');
} finally {await server.close();}

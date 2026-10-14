import assert from 'node:assert/strict';
import {createServer} from 'vite';
const vite = await createServer({cacheDir:'node_modules/.vite-beat-grid',optimizeDeps:{noDiscovery:true,entries:[]},server:{middlewareMode:true},appType:'custom',logLevel:'error'});
try {
  const {rhythmGridLines,rhythmBeatPhase} = await vite.ssrLoadModule('/src/rpg/rhythm/beatGrid.ts');
  const {RHYTHM_SONGS} = await vite.ssrLoadModule('/src/rpg/rhythm/catalog.generated.ts');
  let cases=0;
  for (const song of RHYTHM_SONGS) for (const speed of [1,3,6]) for(const height of [140,560,1000]) {
    const travel=3.1-speed*.35,hit=height-1,beat=60/song.bpm;
    for(const index of [0,1,8,64]) {
      const at=song.offset+index*beat;
      const lines=rhythmGridLines(song,at,travel,hit);
      assert.ok(Math.abs(lines[0].y-hit)<1e-6,'Beat must arrive exactly at the button edge');
      assert.ok(lines[0].beat===index);
      assert.ok(Math.abs(rhythmBeatPhase(song,at)-index)<1e-6);
      const ahead=rhythmGridLines(song,at-beat*.25,travel,hit).find(l=>l.beat===index);
      assert.ok(ahead && ahead.y<hit,'Before the beat the grid must be above the button');
      const later=rhythmGridLines(song,at+.01,travel,hit);
      assert.ok(later.every(l=>l.beat>index),'Passed beats must leave the playfield');
      for(let n=1;n<lines.length;n++) assert.ok(Math.abs(lines[n].time-lines[n-1].time-beat)<1e-6);
      cases++;
    }
  }
  console.log(`Beat grid passed: ${cases} arrivals across all 143 songs, three speeds and three screen heights.`);
} finally {await vite.close();}

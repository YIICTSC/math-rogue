import assert from 'node:assert/strict';
import {createServer} from 'vite';
const server=await createServer({server:{middlewareMode:true,watch:null,hmr:false},optimizeDeps:{noDiscovery:true,include:[]},appType:'custom'});
try {
 const {initialTutorialMissTracker,recordTutorialShot}=await server.ssrLoadModule('/src/mini-games/gakuro-golf/tutorialMisses.ts');
 let tracker=initialTutorialMissTracker();
 const snapshot=(id,quality)=>{const result=recordTutorialShot(tracker,id,quality);tracker=result.tracker;return result.restart;};
 assert.equal(snapshot(0,'nice'),false);
 for(let id=1;id<=4;id++){assert.equal(snapshot(id,'miss'),false);assert.equal(snapshot(id,'miss'),false,'repeated snapshots do not count twice');}
 assert.equal(snapshot(5,'good'),false);assert.equal(tracker.consecutive,0,'good shots break the streak');
 for(let id=6;id<10;id++)assert.equal(snapshot(id,'miss'),false);
 assert.equal(snapshot(10,'miss'),true,'the fifth consecutive miss requests the tutorial');
 assert.equal(snapshot(10,'miss'),false);assert.equal(tracker.consecutive,0);
 assert.equal(snapshot(11,'nice'),false);assert.equal(snapshot(12,'miss'),false);
 assert.equal(snapshot(0,'nice'),false);assert.equal(tracker.consecutive,0,'a new round resets the streak');
 assert.equal(snapshot(4,'miss'),false);assert.equal(tracker.consecutive,0,'missing snapshots do not fabricate a streak');
 console.log('PASS: confirmed local shots, repeated snapshots, success resets, five misses, new rounds and missing snapshots.');
} finally {await server.close();}

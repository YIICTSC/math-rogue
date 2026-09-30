import assert from "node:assert/strict";
import { createServer } from "vite";
import { chromium } from "playwright";
// Run the local PeerServer described in docs/rpg-online-development.md first.
const server = await createServer({
  cacheDir: "node_modules/.vite-rpg-activities-network",
  optimizeDeps: { noDiscovery:true, include:["peerjs"] },
  define: {
    "import.meta.env.VITE_RPG_PEER_HOST": '"127.0.0.1"',
    "import.meta.env.VITE_RPG_PEER_PORT": '"9000"',
    "import.meta.env.VITE_RPG_PEER_PATH": '"/rpg"',
    "import.meta.env.VITE_RPG_PEER_SECURE": '"false"',
  },
  server: { host: "127.0.0.1", port: 5198, strictPort: true },
  plugins: [
    {
      name: "network-fixture",
      configureServer(s) {
        s.middlewares.use("/__network", (req, res) => {
          res.setHeader("Content-Type", "text/html");
          res.end(
            '<html><body><script type="module">import{RpgRoom}from"/src/rpg/network.ts";window.RpgRoom=RpgRoom;</script></body></html>',
          );
        });
      },
    },
  ],
});
await server.listen();
const browser = await chromium.launch({ headless: true });
try {
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5198/__network',{waitUntil:'domcontentloaded',timeout:180000});await page.waitForFunction(()=>!!window.RpgRoom);
 await page.evaluate(async()=>{
  window.snapshots={};window.received={};window.rooms=[];
  const engine=await import('/src/rpg/engine.ts');window.engine=engine;
  const host=new window.RpgRoom(w=>window.snapshots.host=w,console.error);window.host=host;window.rooms.push(host);await host.create('Host');
  for(let i=1;i<=4;i++){const room=new window.RpgRoom(w=>window.snapshots[i]=w,console.error);window.rooms.push(room);await room.join(host.code,`Guest ${i}`);}
 });
 await page.waitForFunction(()=>Object.keys(window.host.world.players).length===5);
 await page.evaluate(()=>{
  const w=window.host.world;w.activities.nextEventAt=w.deadlineAt;
  for(const r of window.rooms){r.onDungeonEvent=(event,from)=>(window.received[r.selfId]||=[]).push({event,from});const p=w.players[r.selfId];p.profile={hp:80,maxHp:80,gold:100,deckSize:6,character:'WARRIOR',image:'',deck:Array.from({length:6},(_,j)=>({id:`${r.selfId}-${j}`,name:'Card',description:'Test',cost:1,rarity:'COMMON',type:'ATTACK'}))};p.gold=100;p.hp=80;p.maxHp=80;}
  const site=w.sites.find(s=>s.kind==='dungeon');window.site=site;
  for(const r of window.rooms){Object.assign(w.players[r.selfId],{x:site.x,y:site.y});}
  window.host.send({type:'dungeon-join',siteId:site.id});
  window.rooms[1].send({type:'dungeon-join',siteId:site.id});window.rooms[2].send({type:'dungeon-join',siteId:site.id});window.rooms[3].send({type:'dungeon-join',siteId:site.id});
 });
 await page.waitForFunction(()=>window.host.world.activities.dungeons[0]?.members.length===4);
 await page.evaluate(()=>{const d=window.host.world.activities.dungeons[0];window.dungeonId=d.id;for(const r of window.rooms.slice(0,4))r.send({type:'dungeon-ready',dungeonId:d.id});});
 await page.waitForFunction(()=>window.host.world.activities.dungeons[0].ready.length===4);
 await page.evaluate(()=>window.host.send({type:'dungeon-start',dungeonId:window.dungeonId}));
 await page.waitForFunction(()=>window.snapshots[3]?.activities.dungeons[0]?.status==='active');
 await page.evaluate(()=>window.rooms[1].sendDungeonEvent({type:'COOP_BATTLE_PLAY_CARD',cardId:'test-card'}));
 await page.waitForFunction(()=>window.received[window.host.selfId]?.length===1);
 assert.deepEqual(await page.evaluate(()=>window.received[window.host.selfId][0]),{event:{type:'COOP_BATTLE_PLAY_CARD',cardId:'test-card'},from:await page.evaluate(()=>window.rooms[1].selfId)});
 await page.evaluate(()=>window.host.sendDungeonEvent({type:'COOP_PARTICIPANTS',participants:[],decisionOwnerIndex:0}));
 await page.waitForFunction(()=>window.rooms.slice(1,4).every(r=>window.received[r.selfId]?.length===1));
 assert.equal(await page.evaluate(()=>window.received[window.rooms[4].selfId]?.length||0),0);
 await page.evaluate(()=>{window.rooms[4].sendDungeonEvent({type:'COOP_BATTLE_PLAY_CARD',cardId:'outsider'});window.rooms[1].sendDungeonEvent({type:'COOP_PARTICIPANTS',participants:[],decisionOwnerIndex:0});});
 await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>window.received[window.host.selfId].length),1);
 await page.evaluate(()=>window.rooms[2].close());await page.waitForFunction(()=>window.snapshots[1]?.activities.dungeons[0]?.status==='aborted');
 assert.deepEqual(errors,[]);await page.evaluate(()=>window.rooms.forEach(r=>r.close()));
 console.log('Five real WebRTC clients: 4-player dungeon relay, guest authority, party isolation and disconnect return passed.');
} finally {await browser.close();await server.close();}

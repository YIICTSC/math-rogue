import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createServer} from 'vite';
const server=await createServer({configFile:false,logLevel:'error',server:{middlewareMode:true,watch:null,hmr:false},optimizeDeps:{noDiscovery:true,entries:[]}});
let stored;globalThis.localStorage={getItem:()=>stored,setItem:(k,v)=>stored=v};
try{
 const B=await server.ssrLoadModule('/src/mini-games/lantern-war/banter.ts'),E=await server.ssrLoadModule('/src/mini-games/lantern-war/engine.ts'),I=await server.ssrLoadModule('/src/mini-games/lantern-war/endless.ts'),R=await server.ssrLoadModule('/src/mini-games/lantern-war/roster.ts');
 assert.equal(B.BANTERS.length,44*43/2);assert.deepEqual(new Set(B.BANTER_CAST),new Set(R.HEROES.map(h=>h.id)));
 const ids=new Set(),texts=new Set();for(const b of B.BANTERS){assert(!ids.has(b.id));ids.add(b.id);assert.notEqual(...b.actors);assert.equal(b.lines.length,2);for(const [i,line]of b.lines.entries()){assert.equal(line.who,b.actors[i]);assert.deepEqual(line.cast,b.actors);assert.equal(line.banterId,b.id);assert(line.text.length>=8&&line.text.length<=100,line.text);assert(!texts.has(line.text),'duplicate manuscript sentence: '+line.text);texts.add(line.text);assert(!/\$hero|\{\{|\$\{|TODO|仮台詞/.test(line.text));}}
 for(let a=0;a<44;a++)for(let b=a+1;b<44;b++)assert(ids.has([B.BANTER_CAST[a],B.BANTER_CAST[b]].join('|')));
 const s=E.newCampaign('aster');s.chapter=17;s.cleared=Array.from({length:18},(_,i)=>i);s.recruited=[...B.BANTER_CAST];s.formations=[{slots:['aster','magic-leon','dungeons2-leon','sena',null,null]},{slots:Array(6).fill(null)},{slots:Array(6).fill(null)}];I.startEndless(s,784);const seen=new Set();
 for(let i=0;i<6;i++){
  const before=E.clone(s),preview=I.makeEndlessBattle(s);assert.deepEqual(s,before,'preview mutates no read progress');assert.deepEqual(I.makeEndlessBattle(s),preview);
  assert(I.beginEndless(s));const m=s.battle.endless,b=B.banterById(m.banterId);assert(b&&b.actors.every(id=>s.formations[0].slots.includes(id)));assert(!seen.has(b.id),'eligible unread pair repeated');seen.add(b.id);
  assert(!B.markBanterRead(s),'reading is not counted before the final line');s.storyIndex=m.story.length-1;assert(B.markBanterRead(s));assert(!B.markBanterRead(s),'last click is idempotent');E.saveCampaign(s);const loaded=E.loadCampaign();assert(loaded);assert.equal(loaded.endless.banterSeen[b.id],1);assert.deepEqual(loaded.battle.endless.story,m.story);assert(E.retryBattle(s));assert.equal(s.endless.banterSeen[b.id],1);assert.equal(s.battle.endless.banterId,b.id);s.phase='field';s.battle=null;
 }
 const last=s.endless.banterLast;assert.notEqual(B.selectBanter(s).id,last);assert.equal(Math.min(...Object.values(s.endless.banterSeen)),1);
 s.formations=[{slots:['aster',null,null,null,null,null]},{slots:Array(6).fill(null)},{slots:Array(6).fill(null)}];assert.equal(B.selectBanter(s),undefined);assert(I.beginEndless(s));assert.equal(s.battle.endless.banterId,undefined);s.phase='field';s.formations=[{slots:['aster','lyra',null,null,null,null]},{slots:Array(6).fill(null)},{slots:Array(6).fill(null)}];assert(I.beginEndless(s,false));assert(!s.battle.endless.story.some(l=>l.banterId),'English expedition retains translated mission story');
 s.phase='field';assert(I.beginEndless(s));E.saveCampaign(s);const good=stored;
 for(const corrupt of [x=>{x.battle.endless.story[0].cast='broken';},x=>{x.endless.banterSeen={'unknown':1};},x=>{x.endless.banterSeen=[];},x=>{x.endless.banterLast='unknown';},x=>{x.battle.endless.story.at(-1).cast=['aster','unknown'];},x=>{x.battle.endless.banterId='unknown';}]){const broken=JSON.parse(good);corrupt(broken);stored=JSON.stringify(broken);assert.equal(E.loadCampaign(),null);}stored=good;
 const legacy=JSON.parse(good);delete legacy.endless.banterSeen;delete legacy.endless.banterLast;for(const battle of [legacy.battle,legacy.checkpoint]){delete battle.endless.banterId;delete battle.endless.banterRecorded;battle.endless.story=battle.endless.story.filter(l=>!l.banterId);}stored=JSON.stringify(legacy);assert(E.loadCampaign(),'existing saves remain readable');
 const book=await fs.readFile('docs/lantern-war/banter-manuscript.md','utf8');assert.equal((book.match(/^### /gm)||[]).length,946);assert.equal((book.match(/^\*\*/gm)||[]).length,1892);for(const b of B.BANTERS)for(const l of b.lines)assert(book.includes(`**${R.heroById(l.who).name}**「${l.text}」`),'manuscript export is stale: '+b.id);
 console.log('PASS 946 authored pairs / 1892 distinct lines, all 44 protagonists, deployment eligibility, unread-first cycle, deterministic previews, save/reload/retry, idempotent reading, English isolation and malformed/legacy saves.');
}finally{await server.close();}

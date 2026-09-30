import assert from 'node:assert/strict';
import {createServer} from 'vite';
import sharp from 'sharp';
import {createHash} from 'node:crypto';
const server=await createServer({configFile:false,optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,hmr:false},appType:'custom',logLevel:'error'});
try{
 const e=await server.ssrLoadModule('/src/mini-games/gakuro-craft/engine.ts'),p=await server.ssrLoadModule('/src/mini-games/gakuro-craft/progression.ts'),pets=await server.ssrLoadModule('/src/mini-games/gakuro-craft/pets.ts'),motion=await server.ssrLoadModule('/src/mini-games/gakuro-craft/petMotion.ts'),social=await server.ssrLoadModule('/src/mini-games/gakuro-craft/homeSocial.ts');
 assert.equal(pets.PET_KINDS.length,10);
 for(const kind of pets.PET_KINDS){
  const w=e.createWorld(2026);e.addPlayer(w,'a','Builder',0);const owner=w.players.a;owner.x=55.5;owner.z=40.5;owner.bag.wood=20;owner.bag.stone=20;Object.assign(w.tiles[4854],{nature:null,crop:null,blocks:[],ground:'grass'});
  const wood=owner.bag.wood;e.applyCommand(w,'a',{type:'home_claim',tile:4854,petKind:'__proto__',petName:'Bad'});assert.equal(owner.bag.wood,wood);assert.equal(owner.progress.home.level,0);
  e.applyCommand(w,'a',{type:'home_claim',tile:4854,petKind:kind,petName:'  なかよし  '});assert.equal(owner.progress.home.pet.kind,kind);assert.equal(owner.progress.home.pet.name,'なかよし');assert.equal(owner.progress.home.pet.affection,30);
  const home=p.migrateProgress(JSON.parse(JSON.stringify(owner.progress))).home;assert.equal(home.pet.kind,kind);assert.equal(home.pet.name,'なかよし');assert.equal(social.publicHome(home).pet.kind,kind);
  for(const affection of [0,30,95,99]){home.pet.affection=affection;home.pet.careAt=-100;for(let t=0;t<84;t+=.25)assert.notEqual(motion.petPose(home,t).frame,5,`${kind}: belly locked at ${affection}`);home.pet.careAt=40;assert.equal(motion.petPose(home,40.5).frame,4,'Care does not bypass bond gate');}
  home.pet.affection=100;home.pet.careAt=40;assert.equal(motion.petPose(home,40.5).frame,5,'Belly pose unlocked at100 after care');home.pet.careAt=-100;const frames=new Set(Array.from({length:168},(_,i)=>motion.petPose(home,i/4).frame));assert.equal(frames.size,6,'All six animation frames reachable');
  const file=`src/mini-games/gakuro-craft/assets/pet-${kind}.webp`,meta=await sharp(file).metadata();assert.equal(meta.width,480);assert.equal(meta.height,384);assert(meta.hasAlpha);const hashes=[];
  for(let i=0;i<6;i++){const data=await sharp(file).extract({left:i%3*160,top:Math.floor(i/3)*192,width:160,height:192}).ensureAlpha().raw().toBuffer();let filled=0;for(let y=0;y<192;y++)for(let x=0;x<160;x++){const alpha=data[(y*160+x)*4+3];if(alpha)filled++;if(x<16||x>=144||y<20||y>=172)assert.equal(alpha,0,`${kind}/${i}: padded whole frame`);}assert(filled>800,`${kind}/${i}: visible animal`);hashes.push(createHash('sha256').update(data).digest('hex'));}assert.equal(new Set(hashes).size,6,`${kind}: six distinct poses`);
 }
 const old=p.newProgress();old.home={tile:4854,level:1,furniture:[],pet:{name:'ミント',affection:99,careAt:20}};assert.deepEqual(p.migrateProgress(old).home.pet,{kind:'calico',name:'ミント',affection:99,careAt:20});old.home.pet.kind='bogus';assert.equal(p.migrateProgress(old).home.pet.kind,'calico');
 console.log('PASS ten pets: adoption, names, host validation, persistence, visitor sharing, legacy saves, strict bond100 belly gate, 60 distinct transparent padded frames');
}finally{await server.close();}

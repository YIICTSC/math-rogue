import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {assetUrl} from '../../../utils/assetPaths';
import type {AdventureState} from '../adventure';
import {DOJO_STAGES, type DojoRun} from '../dojo';
import {enemyModel, enemyPalette, enemyVisualRank, ENEMY_RANK_COLORS, gearSignature, itemModel, visualHash, type Gear, type VisualItem} from './appearance';

interface Entity {
  id?: number|string; x:number; y:number; type?:string; enemyType?:string; schoolKind?:string; visualTier?:number; schoolRank?:number; dead?:boolean;
  dir?:{x:number;y:number}; offset?:{x:number;y:number}; equipment?:Gear; itemData?:VisualItem;
  hp?:number; maxHp?:number; moving?:boolean; direction?:number; attackVisualAt?:number; status?:{sleep?:number;frozen?:number;poison?:number};
}
interface Effect {type:string;x:number;y:number;duration:number;maxDuration:number;value?:string;color?:string;startX?:number;startY?:number;targetX?:number;targetY?:number;dir?:{x:number;y:number};}
export interface DungeonFrame {
  map:string[][]; player:Entity; enemies:Entity[]; floorItems:Entity[]; traps:Entity[];
  visible:(x:number,y:number)=>boolean; sight:boolean; trapSight:boolean;
  adventure:AdventureState; dojo:DojoRun|null; floor:number; effects:Effect[];
  knownItem:(item:VisualItem)=>boolean;
}

/** A read-only presentation of the turn engine. No movement, damage or save state lives here. */
export async function createDungeonScene(host:HTMLElement, portrait=false) {
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.setClearColor('#182b35');
  renderer.domElement.dataset.schoolDungeon3d='loading';
  renderer.domElement.style.cssText='width:100%;height:100%;display:block;';
  let kit:THREE.Group;
    let heroAsset:Awaited<ReturnType<GLTFLoader['loadAsync']>>;
    let castAnimations:THREE.AnimationClip[]=[];
  try {
    const loader=new GLTFLoader();
    const assets=await Promise.all([loader.loadAsync(assetUrl('models/school-wanderer/cast-quality.glb')),loader.loadAsync(assetUrl('models/school-wanderer/hero-quality.glb'))]);
    kit=assets[0].scene;heroAsset=assets[1];castAnimations=assets[0].animations;
  }
  catch(error) {renderer.dispose();throw error;}
  host.appendChild(renderer.domElement);
  const scene=new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xe3f5ff,0x75614d,2.3));
  const sun=new THREE.DirectionalLight(0xffedcf,2.7);sun.position.set(-4,9,5);scene.add(sun);
  const fill=new THREE.DirectionalLight(0x96cbea,.8);fill.position.set(5,4,-5);scene.add(fill);
  const rim=new THREE.DirectionalLight(0xffd3b2,.65);rim.position.set(2,5,-4);scene.add(rim);
  const camera=new THREE.OrthographicCamera(-6,6,5,-5,.1,70);
  const world=new THREE.Group();scene.add(world);
  const geometries=new Set<THREE.BufferGeometry>();const materials=new Set<THREE.Material>();
  kit.traverse(o=>{if(o instanceof THREE.Mesh){geometries.add(o.geometry);for(const m of ([] as THREE.Material[]).concat(o.material))materials.add(m);}});
  const previousHero=kit.getObjectByName('hero');previousHero?.removeFromParent();
  const improvedHero=heroAsset.scene.getObjectByName('hero');
  if(!improvedHero){renderer.dispose();throw new Error('Missing quality hero');}
  kit.add(improvedHero);
  for(const name of ['pencil_adventure','shield_adventure']){const prop=heroAsset.scene.getObjectByName(name);if(prop){kit.add(prop);prop.traverse(o=>{if(o instanceof THREE.Mesh){geometries.add(o.geometry);for(const m of ([] as THREE.Material[]).concat(o.material))materials.add(m);}});}}
  improvedHero.traverse(o=>{if(o instanceof THREE.Mesh){geometries.add(o.geometry);for(const m of ([] as THREE.Material[]).concat(o.material))materials.add(m);}if(o.name.startsWith('hero_expression_')&&o instanceof THREE.Group)o.visible=o.name==='hero_expression_neutral';});
  heroAsset.scene.traverse(o=>{if(o instanceof THREE.Mesh){geometries.add(o.geometry);for(const m of ([] as THREE.Material[]).concat(o.material))materials.add(m);}});
  // Every quality-kit model is already batched in Blender; keep authored pivots intact.
  const cube=new THREE.BoxGeometry(1,1,1);geometries.add(cube);
  const disc=new THREE.CircleGeometry(.37,16);disc.rotateX(-Math.PI/2);geometries.add(disc);
  const ringGeo=new THREE.TorusGeometry(.34,.025,5,24);ringGeo.rotateX(Math.PI/2);geometries.add(ringGeo);
  const materialCache=new Map<string,THREE.MeshStandardMaterial>();
  function material(color:THREE.ColorRepresentation){const key=String(color);let m=materialCache.get(key);if(!m){m=new THREE.MeshStandardMaterial({color,roughness:.85});materialCache.set(key,m);materials.add(m);}return m;}
  function box(parent:THREE.Object3D,color:THREE.ColorRepresentation,x:number,y:number,z:number,w:number,h:number,d:number){const m=new THREE.Mesh(cube,material(color));m.position.set(x,y,z);m.scale.set(w,h,d);parent.add(m);return m;}
  const shadowMat=new THREE.MeshBasicMaterial({color:0x18282b,transparent:true,opacity:.20,depthWrite:false});materials.add(shadowMat);
  function shadow(parent:THREE.Object3D){const m=new THREE.Mesh(disc,shadowMat);m.position.y=.013;parent.add(m);}
  const variants=new Map<string,THREE.Object3D>();
  function model(name:string){const source=kit.getObjectByName(name);if(!source)throw new Error(`Missing School Wanderer model: ${name}`);return source.clone(true);}
  function item(item:VisualItem){
    const key=item.type+':'+(item.plus||0);let template=variants.get(key);
    if(!template){
      template=model(item.type==='PENCIL_SWORD'?'pencil_adventure':item.type==='PRINCIPAL_SHIELD'?'shield_adventure':itemModel(item));
      const hue=(visualHash(item.type)%360)/360;
      template.traverse(o=>{if(o instanceof THREE.Mesh){const wasArray=Array.isArray(o.material);const tinted=(wasArray?o.material as THREE.Material[]:[o.material as THREE.Material]).map(source=>{
        const m=(source as THREE.MeshStandardMaterial).clone();
        if(['red','blue','green','purple','mint','navy','orange','water'].includes(source.name.split('.')[0])||source.name==='white'&&itemModel(item)==='coat'&&!/LAB/.test(item.type))m.color.setHSL(hue,.48,.53);
        if((item.plus||0)>0){m.emissive.setHSL(.12,.65,.09);m.emissiveIntensity=Math.min(.7,(item.plus||0)*.06);}
        materials.add(m);return m;
      });o.material=wasArray?tinted:tinted[0];}});
      variants.set(key,template);
    }
    return template.clone(true);
  }
  function hero(gear:Gear={},base='hero'){
    const g=new THREE.Group();const character=model(base);g.add(character);
    for(const [slot,gearItem] of Object.entries(gear)){
      if(!gearItem)continue;
      const name=itemModel(gearItem),m=item(gearItem);m.name='equipped_'+slot+'_'+gearItem.type;
      if(slot==='weapon'){m.position.set(-.34,.47,.10);m.rotation.z=-.22;m.scale.setScalar(.77);}
      else if(slot==='ranged'){m.position.set(.27,.63,-.23);m.rotation.z=-.4;m.scale.setScalar(.45);}
      else if(slot==='accessory'){m.position.set(.30,.50,.015);m.scale.setScalar(.75);}
      else if(name==='shield'){m.position.set(.37,.61,.12);m.scale.setScalar(.8);}
      else if(name==='badge'){m.position.set(.095,.75,.185);}
      if(base==='hero'&&slot==='armor'){
        if(name==='shield'){m.position.set(.345,.49,.15);m.scale.setScalar(.85);}
        else if(['hood','helmet'].includes(name)){m.position.y=-.055;}
        else if(name==='backpack'){m.scale.y=.85;m.position.y=-.09;}
        else if(['coat','cape','apron'].includes(name)){m.scale.y=.72;m.position.y=.018;}
        else if(name==='badge'){m.position.set(.075,.595,.169);}
      }
      if(slot==='armor'&&name==='backpack')g.traverse(o=>{if(o.name.startsWith(base+'_backpack'))o.visible=false;});
      if(slot==='armor'&&['helmet','hood'].includes(name))g.traverse(o=>{if(o.name.startsWith(base+'_hair')||o.name.startsWith(base+'_tuft')||o.name.startsWith('hero_motion_head_hair_'))o.visible=false;});
      const socket=character.getObjectByName(slot==='weapon'?'hero_socket_weapon':slot==='accessory'?'hero_socket_accessory':'hero_motion_body');
      if(socket){
        if(slot==='weapon'){m.position.set(0,0,0);m.rotation.z=-.12;}
        else if(slot==='accessory'){m.position.set(0,.015,0);}
        socket.add(m);
      }else g.add(m);
    }
    return g;
  }
  const enemyVariants=new Map<string,THREE.Object3D>();
  function enemyBody(base:string,rank:number){
    const key=base+':'+Math.min(ENEMY_RANK_COLORS.length,rank);let template=enemyVariants.get(key);
      if(!template){template=model(base);const palette=enemyPalette(base);const level=Math.min(5,rank-1);
        const primary=new THREE.Color(palette[0]).offsetHSL([0,.015,-.025,.035,-.035,.02][level],level*.018,[0,-.11,.09,-.20,.16,-.27][level]);
        const accent=new THREE.Color(palette[1]).offsetHSL(0,0,[0,-.06,.04,-.10,.08,-.15][level]);
      if(!['principal','merchant'].includes(base))template.traverse(o=>{if(o instanceof THREE.Mesh){const wasArray=Array.isArray(o.material);const tinted=(wasArray?o.material as THREE.Material[]:[o.material as THREE.Material]).map(source=>{
        const m=(source as THREE.MeshStandardMaterial).clone();const name=source.name.split('.')[0];
          if(name.startsWith('enemy_primary')||['cloth','navy','leather','purple','orange','green'].includes(name))m.color.copy(primary);
          else if(name.startsWith('enemy_accent'))m.color.copy(accent);
          if(base==='metal_slime'&&name.startsWith('enemy_primary')){m.metalness=.8;m.roughness=.28;}
        materials.add(m);return m;
      });o.material=wasArray?tinted:tinted[0];}});
      enemyVariants.set(key,template);
    }
    return template.clone(true);
  }
  interface Node {signature:string; object:THREE.Object3D;}
  const nodes=new Map<string,Node>();let used=new Set<string>();
  const textTextures=new Set<THREE.Texture>();
  function label(text:string,color='#fff4c9'){
    const c=document.createElement('canvas');c.width=256;c.height=64;
    const ctx=c.getContext('2d')!;ctx.font='bold 35px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=7;ctx.strokeStyle='#182832';ctx.strokeText(text,128,32);ctx.fillStyle=color;ctx.fillText(text,128,32);
    const texture=new THREE.CanvasTexture(c);textTextures.add(texture);
    const mat=new THREE.SpriteMaterial({map:texture,depthTest:false});
    const sprite=new THREE.Sprite(mat);sprite.scale.set(1.6,.4,1);sprite.renderOrder=20;sprite.userData.textResource=true;return sprite;
  }
  function remove(object:THREE.Object3D){world.remove(object);object.traverse(o=>{if(o.userData.animationMixer){const mixer=o.userData.animationMixer as THREE.AnimationMixer;mixer.stopAllAction();mixer.uncacheRoot(mixer.getRoot());}if(o instanceof THREE.Sprite&&o.userData.textResource){const tex=o.material.map;if(tex){tex.dispose();textTextures.delete(tex);}o.material.dispose();}});}
  function node(key:string,signature:string,make:()=>THREE.Object3D){used.add(key);let n=nodes.get(key);if(n?.signature!==signature){if(n)remove(n.object);const object=make();world.add(object);n={signature,object};nodes.set(key,n);}return n.object;}
  function terrainNode(tile:string,terrain:string|undefined,x:number,y:number,frame:DungeonFrame){
    const g=new THREE.Group(),outdoor=frame.adventure.scene!==undefined,variant=frame.adventure.scene||0;
    const room=Math.min(6,frame.floor<4?0:frame.floor<7?1:frame.floor<10?2:frame.floor<13?3:frame.floor<16?4:frame.floor<20?5:6);
    const floors=['#c8b48a','#c99b62','#aac7be','#c9b0c3','#b29877','#a3b9cc','#c9b482'];
    const walls=['#a8b8a4','#9b774f','#87acb7','#a08aa9','#9b7751','#738ca2','#987853'];
    const river=outdoor&&!frame.adventure.town&&x===5&&y>=1&&y<=9;
    const water=terrain==='WATER'||tile==='WATER'||river&&tile==='WALL';
    const hole=terrain==='HOLE';
    const floor=water?'#438eaa':hole?'#13232d':terrain==='ICE'?'#a5d9e1':outdoor?(variant===5?'#dce6dc':variant===4?'#ae965b':'#8da671'):floors[room];
    box(g,floor,0,-.09,0,.985,.16,.985);
    if(water||terrain==='ICE'){for(let i=0;i<3;i++)box(g,water?'#90d2d6':'#e1f5f1',-.2+i*.17,.003,-.25+i*.23,.30,.012,.025);}
    if(terrain==='CRACK'){box(g,'#5c4b3c',0,.005,0,.045,.01,.8);box(g,'#5c4b3c',.14,.008,.1,.3,.01,.045);}
    if(tile==='WALL'&&!river){
      const low=.32;box(g,outdoor?'#637c58':walls[room],0,low/2,0,.97,low,.97);
      box(g,outdoor?'#97b573':'#e1d9bb',0,low+.025,0,.99,.05,.99);
      if((x*3+y*7)%5===0){const prop=model(outdoor?(variant===3?'bamboo':'tree'):room===4?'shelf':room===2?'locker':'desk');prop.scale.setScalar(outdoor?.65:.53);prop.position.y=low+.05;g.add(prop);}
      if(terrain==='SECRET'){const mark=label('?','#ffe49c');mark.position.set(0,.65,0);g.add(mark);}
    }
    if(river&&tile!=='WALL')g.add(model('bridge'));
    if(tile==='STAIRS'){g.add(model('stairs'));const arrow=label('▼','#ffe287');arrow.position.set(0,.8,0);g.add(arrow);}
    if(tile==='DOOR'){box(g,'#987049',0,.42,0,.84,.84,.13);box(g,'#efc86a',.25,.42,.09,.08,.08,.05);}
    return g;
  }
  let disposed=false;let lost=false;
  const onLost=(event:Event)=>{event.preventDefault();lost=true;host.dispatchEvent(new Event('school-3d-error'));};
  renderer.domElement.addEventListener('webglcontextlost',onLost);
  function draw(original:DungeonFrame){
    if(disposed||lost||!original.map.length)return;
    let f=original;
    const dojo=original.dojo;
    if(dojo){const stage=DOJO_STAGES[dojo.stage-1];f={...original,map:dojo.map,player:{...original.player,x:dojo.x,y:dojo.y,dir:dojo.dir,offset:{x:0,y:0},equipment:{}},enemies:dojo.enemies.map((e,i)=>({...e,id:i,enemyType:'SLIME',status:{sleep:e.sleep}})),floorItems:stage.key&&!dojo.key?[{...stage.key,id:'key',itemData:{type:'KEY',category:'CONSUMABLE'}}]:[],traps:dojo.revealed?dojo.traps:[],trapSight:dojo.revealed,visible:()=>true,adventure:{...original.adventure,scene:undefined,terrain:{},events:{},companion:null},sight:false,effects:[]};}
    const fixed=dojo||f.adventure.scene!==undefined;
    const startX=portrait?f.player.x-1:dojo?0:fixed?0:f.player.x-5,startY=portrait?f.player.y-1:dojo?0:fixed?1:f.player.y-4;
    const cols=portrait?3:dojo?9:11,rows=portrait?3:9;
    const inView=(x:number,y:number)=>x>=startX&&y>=startY&&x<startX+cols&&y<startY+rows;
    const visible=(x:number,y:number)=>inView(x,y)&&f.visible(x,y);
    used=new Set();
    for(let y=startY;y<startY+rows;y++)for(let x=startX;x<startX+cols;x++){
      if(!f.map[y]?.[x])continue;
      const shown=visible(x,y),tile=f.map[y][x],terrain=f.adventure.terrain[`${x},${y}`];
      const signature=[tile,terrain,shown,f.floor,f.adventure.scene,f.adventure.town].join(':');
      const o=node(`tile:${x}:${y}`,signature,()=>shown?terrainNode(tile,terrain,x,y,f):new THREE.Group());o.position.set(x,0,y);
      const event=f.adventure.events[`${x},${y}`];
      if(shown&&event&&!event.done){const o=node(`event:${x}:${y}`,event.kind,()=>{const g=new THREE.Group();const m=model(event.kind==='FRIEND'?'friend_fetch':['SHOP','TRADER','INN','SMITH','BANK','FESTIVAL'].includes(event.kind)?'stall':event.kind==='REST'||event.kind==='PICNIC'?'desk':'chest');m.scale.setScalar(.65);g.add(m);const t=label(event.kind==='FRIEND'?'!':event.kind==='REST'?'+':'◆','#ffe5a1');t.position.y=1.1;g.add(t);return g;});o.position.set(x,0,y);}
    }
    function actor(e:Entity,key:string,base:string,gear?:Gear){
      const isEnemy=key.startsWith('enemy:'),rank=isEnemy?enemyVisualRank(e):0;
      const signature=base+gearSignature(gear)+':'+rank+':'+Boolean(e.status?.sleep)+':'+Boolean(e.status?.frozen);
      const o=node(key,signature,()=>{const g=new THREE.Group();shadow(g);const body=gear?hero(gear,base):isEnemy?enemyBody(base,rank):model(base);body.name='actorBody';body.scale.setScalar(base==='principal'?1.0:base==='dragon'?.90:.80);g.add(body);if(isEnemy&&!['merchant','principal'].includes(base)){const badge=label('Lv'+rank,ENEMY_RANK_COLORS[Math.min(ENEMY_RANK_COLORS.length-1,rank-1)]);badge.name='enemyRank';badge.position.y=base==='dragon'?1.3:1.06;badge.scale.set(1.0,.25,1);g.add(badge);g.userData.enemyRank=rank;g.userData.rankColor=ENEMY_RANK_COLORS[Math.min(ENEMY_RANK_COLORS.length-1,rank-1)];}if(e.status?.sleep){const z=label('Zzz','#b6def7');z.position.y=1.5;g.add(z);}if(e.status?.frozen){box(g,'#9fdae5',0,.1,0,.64,.2,.6);}return g;});
      o.position.set(e.x+(e.offset?.x||0)/16,0,e.y+(e.offset?.y||0)/16);
      const body=o.getObjectByName('actorBody')!;
        {
          let state=body.userData.heroState as {x:number;y:number;hp?:number;time:number;movingUntil:number;hitUntil:number;attackUntil:number;action:string;expression:string}|undefined;
        const now=performance.now()/1000;
          if(!state){state={x:e.x,y:e.y,hp:e.hp,time:now,movingUntil:0,hitUntil:0,attackUntil:0,action:'',expression:''};body.userData.heroState=state;body.userData.animationMixer=new THREE.AnimationMixer(body);}
        if(state.x!==e.x||state.y!==e.y)state.movingUntil=now+.28;
        if(e.hp!==undefined&&state.hp!==undefined&&e.hp<state.hp)state.hitUntil=now+.40;
          // Enemy attack offsets belong to the attacker; nearby player effects do not.
          const offsetAttack=(Math.abs(e.offset?.x||0)+Math.abs(e.offset?.y||0)>0)&&now>=state.movingUntil;
          const attacking=base==='hero'?f.effects.some(fx=>['SLASH','PROJECTILE','MAGIC_PROJ'].includes(fx.type)&&Math.max(Math.abs(fx.x-e.x),Math.abs(fx.y-e.y))<=1):offsetAttack||Boolean(e.attackVisualAt&&Date.now()-e.attackVisualAt<150);
          if(attacking)state.attackUntil=now+.35;
          const paused=Boolean(e.status?.sleep||e.status?.frozen);
          const action=e.hp!==undefined&&e.hp<=0&&base==='hero'?'Defeat':dojo?.won&&base==='hero'?'Victory':now<state.hitUntil?'Hit':now<state.attackUntil?'Attack':now<state.movingUntil||e.moving?'Walk':'Idle';
          const mixer=body.userData.animationMixer as THREE.AnimationMixer;
          const clips=base==='hero'?heroAsset.animations:castAnimations;
          const clipName=(action:string)=>base==='hero'?action:base+'_'+action;
          if(state.action!==action){const clip=clips.find(c=>c.name===clipName(action));if(clip){const oldClip=clips.find(c=>c.name===clipName(state!.action));const old=oldClip?mixer.clipAction(oldClip):undefined;const next=mixer.clipAction(clip);next.reset().play();if(['Attack','Hit','Defeat'].includes(action)){next.setLoop(THREE.LoopOnce,1);next.clampWhenFinished=true;}else next.setLoop(THREE.LoopRepeat,Infinity);if(old&&old!==next){old.fadeOut(.10);next.fadeIn(.10);}state.action=action;}}
          if(!paused)mixer.update(Math.min(.1,Math.max(0,now-state.time)));
        const expression=action==='Hit'?'hit':action==='Defeat'?'sad':action==='Victory'?'victory':action==='Attack'?'anger':'neutral';
        if(state.expression!==expression){for(const name of ['neutral','smile','surprise','anger','sad','hit','victory']){const face=body.getObjectByName('hero_expression_'+name);if(face)face.visible=name===expression;}state.expression=expression;}
        state.x=e.x;state.y=e.y;state.hp=e.hp;state.time=now;
      }
        if(e.dir&&(e.dir.x||e.dir.y))body.rotation.y=Math.atan2(e.dir.x,e.dir.y);
        else if(e.direction!==undefined)body.rotation.y=-e.direction*Math.PI/4;
      body.position.y=e.status?.sleep?-.07:Math.sin(performance.now()/350+e.x)*.008;
    }
    for(const e of f.enemies)if(!e.dead&&inView(e.x,e.y)&&(visible(e.x,e.y)||f.sight))actor(e,'enemy:'+e.id,enemyModel(e.schoolKind||e.enemyType));
    for(const e of f.floorItems)if(inView(e.x,e.y)&&(visible(e.x,e.y)||f.sight)){
      const data=e.itemData&&f.knownItem(e.itemData)?e.itemData:{type:e.type==='GOLD'?'GOLD':'UNKNOWN_'+(e.itemData?.category||''),category:e.itemData?.category||'CONSUMABLE'};
      const o=node('item:'+e.id,data.type+':'+data.plus,()=>{const g=new THREE.Group();shadow(g);const m=item(data);m.name='pickup';m.scale.setScalar(.50);if(['coat','cape','apron','hood','helmet','backpack'].includes(itemModel(data)))m.position.y=-.25;g.add(m);return g;});o.position.set(e.x,.06+Math.sin(performance.now()/500)*.025,e.y);
    }
    for(const e of f.traps)if(visible(e.x,e.y)&&((e as Entity&{visible?:boolean}).visible||f.trapSight)){const o=node('trap:'+e.x+':'+e.y,'trap',()=>model('trap'));o.position.set(e.x,.008,e.y);}
    const companion=f.adventure.companion;
    if(companion&&companion.hp>0&&visible(companion.x,companion.y))actor(companion,'companion','friend_'+companion.role.toLowerCase(),{});
    actor(f.player,'player','hero',f.player.equipment||{});
    const selection=node('selection','selection',()=>new THREE.Mesh(ringGeo,material('#f8d876')));selection.position.set(f.player.x,.025,f.player.y);
    const facing=node('facing','facing',()=>{const g=new THREE.Group();box(g,'#fff0b5',0,.025,0,.12,.04,.12);return g;});facing.position.set(f.player.x+(f.player.dir?.x||0)*.47,.03,f.player.y+(f.player.dir?.y||0)*.47);
    f.effects.forEach((fx,i)=>{if(!inView(fx.x,fx.y))return;const progress=1-fx.duration/Math.max(1,fx.maxDuration);const key='fx:'+i;const o=node(key,fx.type+':'+fx.value+':'+fx.color,()=>fx.type==='TEXT'?label(fx.value||'',fx.color):new THREE.Mesh(ringGeo,material(fx.color||(['EXPLOSION','THUNDER'].includes(fx.type)?'#ffb655':'#9de9ed'))));
      const x=fx.startX!==undefined&&fx.targetX!==undefined?THREE.MathUtils.lerp(fx.startX,fx.targetX,progress):fx.x,y=fx.startY!==undefined&&fx.targetY!==undefined?THREE.MathUtils.lerp(fx.startY,fx.targetY,progress):fx.y;o.position.set(x,.55+progress*.65,y);if(fx.type!=='TEXT')o.scale.setScalar(.6+progress*1.3);
    });
    for(const [key,n]of nodes)if(!used.has(key)){remove(n.object);nodes.delete(key);}
    const width=host.clientWidth,height=host.clientHeight;if(width<1||height<1)return;
    if(renderer.domElement.width!==Math.floor(width*renderer.getPixelRatio())||renderer.domElement.height!==Math.floor(height*renderer.getPixelRatio()))renderer.setSize(width,height,false);
    const aspect=width/height,halfHeight=Math.max(4.35,(cols+.8)/aspect/2),halfWidth=halfHeight*aspect;
    camera.left=-halfWidth;camera.right=halfWidth;camera.top=halfHeight;camera.bottom=-halfHeight;camera.updateProjectionMatrix();
    const cx=startX+(cols-1)/2,cz=startY+(rows-1)/2;
    camera.position.set(cx,14,cz+8.5);camera.lookAt(cx,0,cz);
    if(portrait){const h=Math.max(.82,.9/aspect);camera.left=-h*aspect;camera.right=h*aspect;camera.top=h;camera.bottom=-h;camera.position.set(cx+2,1.65,cz+4);camera.lookAt(cx,.61,cz);camera.updateProjectionMatrix();}
    renderer.render(scene,camera);
    renderer.domElement.dataset.schoolDungeon3d='ready';
    renderer.domElement.dataset.equipment=gearSignature(f.player.equipment);
    renderer.domElement.dataset.scene=dojo?'dojo':f.adventure.scene!==undefined?'journey':'dungeon';
  }
  function dispose(){if(disposed)return;disposed=true;renderer.domElement.removeEventListener('webglcontextlost',onLost);for(const n of nodes.values())remove(n.object);nodes.clear();for(const t of textTextures)t.dispose();for(const g of geometries)g.dispose();for(const m of materials)m.dispose();renderer.dispose();renderer.domElement.remove();}
  return {draw,dispose};
}

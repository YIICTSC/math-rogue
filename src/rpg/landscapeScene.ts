import * as T from 'three';
import {WIDTH,HEIGHT,type World} from './engine';
import {WORLD_SCALE,STRUCTURES,landscapeRegion,legacyRegion,landscapeHeight,landscapeEnvironment,landscapeTree,landmarkBlock,landscapeHash,landscapeColor,waterProfile,mountainHeight} from './worldLandscape';
import {blockAt,solid,terrainHeight,VOXEL_COLORS,type TerrainBlock} from './voxel';
import {fullCube} from './voxelCatalog';

/** Bounded chunk cache, one construction job per frame, coarse distant terrain. */
export class LandscapeScene {
 readonly group=new T.Group();readonly buildings=new T.Group();
 private chunks=new Map<string,T.Group>();private queue:{x:number;z:number}[]=[];private center='';private revision=-1;private edits=new Map<string,string>();private pending=new Set<string>();
 private box=new T.BoxGeometry(1,1,1);private sphere=new T.SphereGeometry(1,8,6);private materials=new Map<string,T.MeshStandardMaterial>();private far?:T.Mesh;
 private sky=new T.Group();private clouds?:T.InstancedMesh;private cloudMaterial=new T.MeshBasicMaterial({color:'#edf1ec',transparent:true,opacity:.68,depthWrite:false});private precipitation?:T.Points;private animals:{object:T.Group;home:T.Vector3;phase:number;species:string;last:number;legs:T.Object3D[];wings:T.Object3D[];state:string}[]=[];
 private geometries:T.BufferGeometry[]=[];private animalCell='';private farTiles=new Map<string,number[]>();private coreView={x:0,z:0};
 constructor(parent:T.Scene,private quality:string,private construction?:{get:(block:string)=>T.BufferGeometry},private blockMaterial?:(block:TerrainBlock)=>T.Material){parent.add(this.group);this.group.name='ExplorationLandscape';this.group.add(this.buildings,this.sky);
  this.clouds=new T.InstancedMesh(this.sphere,this.cloudMaterial,36);const d=new T.Object3D();for(let i=0;i<36;i++){d.position.set(Math.sin(i*3.7)*570,155+(i%5)*18,Math.cos(i*2.3)*570);d.scale.set(28+i%3*7,4,13);d.updateMatrix();this.clouds.setMatrixAt(i,d.matrix);}this.clouds.computeBoundingSphere();this.sky.add(this.clouds);
  const p=new Float32Array((quality==='low'?90:220)*3);for(let i=0;i<p.length;i++)p[i]=Math.sin(i*3.123)*18;const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(p,3));this.precipitation=new T.Points(g,new T.PointsMaterial({color:'#d8e8f1',size:.065,transparent:true,opacity:.6,depthWrite:false}));this.precipitation.frustumCulled=false;this.sky.add(this.precipitation);
 }
 private material(color:string){let m=this.materials.get(color);if(!m){m=new T.MeshStandardMaterial({color,roughness:.82});this.materials.set(color,m);}return m;}
 private part(parent:T.Group,color:string,x:number,y:number,z:number,sx:number,sy:number,sz:number,round=false){
  const geometry:T.BufferGeometry=round?this.sphere:this.box;
  const o=new T.Mesh(geometry,this.material(color));o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;
 }
 private instances(parent:T.Group,points:number[][],color:string){if(!points.length)return;const mesh=new T.InstancedMesh(this.box,this.material(color),points.length),d=new T.Object3D();points.forEach(([x,y,z,sx,sy,sz],i)=>{d.position.set(x,y,z);d.scale.set(sx,sy,sz);d.updateMatrix();mesh.setMatrixAt(i,d.matrix);});mesh.computeBoundingSphere();mesh.receiveShadow=true;mesh.castShadow=this.quality==='high';parent.add(mesh);}
 private releaseChunk(group:T.Group){group.traverse(o=>{if(o instanceof T.InstancedMesh)o.dispose();if(o instanceof T.Mesh&&!o.userData.sharedGeometry&&o.geometry!==this.box)o.geometry.dispose();});group.removeFromParent();}
 private terrainMesh(w:World,x0:number,z0:number,size:number,step:number){
  const positions:number[]=[],tints:number[]=[],c=new T.Color();
  const face=(v:number[][],color:string)=>{c.set(color);for(const i of [0,1,2,0,2,3]){positions.push(...v[i]);tints.push(c.r,c.g,c.b);}};
  const ground=new Map<string,number>(),cache=new Map<string,TerrainBlock|null>();
  const height=(x:number,z:number)=>{const key=x+','+z;if(!ground.has(key))ground.set(key,terrainHeight(w,x,z));return ground.get(key)!;};
  const get=(x:number,y:number,z:number)=>{const key=[x,y,z].join(',');if(!cache.has(key))cache.set(key,blockAt(w,x,y,z));return cache.get(key)!;};
  const candidates=new Map<string,{x:number;y:number;z:number}>();
  const add=(x:number,y:number,z:number)=>{if(x>=x0&&x<x0+size&&z>=z0&&z<z0+size&&landscapeRegion(x,z)&&y<height(x,z)&&y>=-18)candidates.set([x,y,z].join(','),{x,y,z});};
  for(let z=z0;z<z0+size;z+=step)for(let x=x0;x<x0+size;x+=step){if(!(step>1?legacyRegion(x,z):landscapeRegion(x,z)))continue;
   const env=landscapeEnvironment(w.seed,x,z),h=height(x,z),color=env.road||env.trail?'#b8a77e':env.water?'#9c977e':landscapeColor(w.seed,x,z);
   if(step>1){
    // Coarse terrain stays under resident chunks until they have actually loaded.
    const start=positions.length/3;this.farTiles.set(Math.floor(x/16)+':'+Math.floor(z/16),[start,start+1,start+2,start+3,start+4,start+5]);
    face([[x,h,z],[x,height(x,z+step),z+step],[x+step,height(x+step,z+step),z+step],[x+step,height(x+step,z),z]],color);continue;
   }
   add(x,h-1,z);
   for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]])for(let y=height(x+dx,z+dz);y<h;y++)add(x,y,z);
   const cave=32+Math.floor(Math.sin(z/40)*3);
   if(Math.abs(x-(326+Math.sin(z/30)*7))<5&&h>cave)for(let y=cave-2;y<=cave+5;y++)add(x,y,z);
   if(env.water&&env.road){add(x,env.water.surface-env.water.depth-1,z);add(x,h-1,z);}
  }
  if(step===1)for(const key of Object.keys(w.voxels?.edits||{})){const [x,y,z]=key.split(',').map(Number);add(x,y,z);for(const [dx,dy,dz]of [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]])add(x+dx,y+dy,z+dz);}
  for(const {x,y,z}of candidates.values()){
   const b=get(x,y,z);if(!solid(b)||Object.hasOwn(w.voxels?.edits||{},[x,y,z].join(',')))continue;const env=landscapeEnvironment(w.seed,x,z),top=env.road||env.trail?'#b8a77e':env.water?'#9c977e':landscapeColor(w.seed,x,z),color=y===height(x,z)-1?top:VOXEL_COLORS[b!]||'#847e6d';
   if(!solid(get(x,y+1,z)))face([[x,y+1,z],[x,y+1,z+1],[x+1,y+1,z+1],[x+1,y+1,z]],color);
   if(!solid(get(x,y-1,z)))face([[x,y,z+1],[x,y,z],[x+1,y,z],[x+1,y,z+1]],'#6e716b');
   if(!solid(get(x+1,y,z)))face([[x+1,y,z],[x+1,y+1,z],[x+1,y+1,z+1],[x+1,y,z+1]],color);
   if(!solid(get(x-1,y,z)))face([[x,y,z+1],[x,y+1,z+1],[x,y+1,z],[x,y,z]],color);
   if(!solid(get(x,y,z+1)))face([[x+1,y,z+1],[x+1,y+1,z+1],[x,y+1,z+1],[x,y,z+1]],color);
   if(!solid(get(x,y,z-1)))face([[x,y,z],[x,y+1,z],[x+1,y+1,z],[x+1,y,z]],color);
  }
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new T.Float32BufferAttribute(tints,3));geometry.computeVertexNormals();geometry.computeBoundingSphere();if(step>1)geometry.setIndex(Array.from({length:positions.length/3},(_,i)=>i));
  const mesh=new T.Mesh(geometry,this.surface);mesh.receiveShadow=true;return mesh;
 }
 private refreshFar(){
  const index=this.far?.geometry.index;if(!index)return;
  for(const [key,indices]of this.farTiles){const [cx,cz]=key.split(':').map(Number),radius=this.quality==='low'?12:19;const loaded=this.chunks.has(key)||(Math.abs(cx*16+8-this.coreView.x)+8<=radius&&Math.abs(cz*16+8-this.coreView.z)+8<=radius);for(const i of indices)index.setX(i,loaded?indices[0]:i);}index.needsUpdate=true;
 }
 private surface=new T.MeshStandardMaterial({vertexColors:true,roughness:.95});
 private water=new T.MeshStandardMaterial({color:'#4da3b3',transparent:true,opacity:.42,roughness:.18,metalness:.15,depthWrite:false,side:T.DoubleSide});
 private chunk(w:World,cx:number,cz:number){const g=new T.Group(),x0=cx*16,z0=cz*16;g.add(this.terrainMesh(w,x0,z0,16,1));const wood:number[][]=[],leaves:number[][]=[],plants:number[][]=[],flowers:number[][]=[],shrubs:number[][]=[],water:number[][]=[];
  for(let z=z0;z<z0+16;z++)for(let x=x0;x<x0+16;x++){if(!landscapeRegion(x,z))continue;const e=landscapeEnvironment(w.seed,x,z),t=landscapeTree(w.seed,x,z);
   if(t){for(let y=t.base;y<t.base+t.height;y++)if(blockAt(w,x,y,z)==='wood')wood.push([x+.5,y+.5,z+.5,1,1,1]);for(let dy=-3;dy<=0;dy++)for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++){const y=t.base+t.height+dy;if(blockAt(w,x+dx,y,z+dz)==='leaves')leaves.push([x+dx+.5,y+.5,z+dz+.5,1,1,1]);}}
   if(e.water){water.push([x+.5,e.water.surface,z+.5,1,.035,1]);if(e.water.kind==='waterfall'){const next=waterProfile(x,z+1);if(next&&next.surface<e.water.surface)water.push([x+.5,(next.surface+e.water.surface)/2,z+1,1,e.water.surface-next.surface,.06]);}}
   if(!e.road&&!e.trail&&!t&&!e.water&&solid(blockAt(w,x,e.height-1,z))&&e.height<130&&landscapeHash(x,z,w.seed+17)<.10){const h=landscapeHash(x,z,w.seed+23);plants.push([x+.5,e.height+(e.biome==='wetland'?.55:.18),z+.5,.13,e.biome==='wetland'?1.1:.36,.13]);if(e.biome==='meadow'&&h<.3)flowers.push([x+.5,e.height+.4,z+.5,.27,.12,.27]);if(e.biome==='forest'&&h<.2)shrubs.push([x+.5,e.height+.35,z+.5,.8,.7,.8]);}
  }
  this.instances(g,wood,'#72513b');this.instances(g,leaves,'#396a4e');this.instances(g,plants,'#90a75a');this.instances(g,flowers,'#ebc482');this.instances(g,shrubs,'#567349');
  if(water.length){this.instances(g,water,'#4da3b3');const m=g.children[g.children.length-1] as T.Mesh;m.material=this.water;m.castShadow=false;}
  // Every placed material uses the same Blender shape, rotation and texture as the old map.
  const edits=new Map<TerrainBlock,{x:number;y:number;z:number}[]>();
  for(const [key,b]of Object.entries(w.voxels?.edits||{})){if(!b)continue;const [x,y,z]=key.split(',').map(Number);
   if(x<x0||x>=x0+16||z<z0||z>=z0+16||!landscapeRegion(x,z))continue;
   if(fullCube(b)&&[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]].every(([dx,dy,dz])=>!!blockAt(w,x+dx,y+dy,z+dz)&&fullCube(blockAt(w,x+dx,y+dy,z+dz)!)))continue;
   const list=edits.get(b)||[];list.push({x,y,z});edits.set(b,list);
   if(b==='door'&&blockAt(w,x,y+1,z)==='door-top'){const tops=edits.get('door-top')||[];tops.push({x,y:y+1,z});edits.set('door-top',tops);}
  }
  for(const [b,points]of edits){const mesh=new T.InstancedMesh(this.construction?.get(b)||this.box,this.blockMaterial?.(b)||this.material(VOXEL_COLORS[b]),points.length),matrix=new T.Matrix4();
   points.forEach(({x,y,z},i)=>{matrix.makeRotationY((w.voxels?.rotations?.[[x,b==='door-top'?y-1:y,z].join(',')]||0)*Math.PI/2);matrix.setPosition(x+.5,y+.5,z+.5);
    if(b==='door'||b==='door-top'){const base=b==='door-top'?y-1:y,alongX=solid(blockAt(w,x-1,base,z))||solid(blockAt(w,x+1,base,z));matrix.scale(new T.Vector3(alongX?1:.16,1,alongX?.16:1));}mesh.setMatrixAt(i,matrix);});
   mesh.userData.sharedGeometry=true;mesh.computeBoundingSphere();mesh.castShadow=this.quality==='high';mesh.receiveShadow=true;g.add(mesh);
  }
  return g;
 }
 private landmarks(w:World){
  for(const l of STRUCTURES){const base=l.kind==='tower'?Math.floor(mountainHeight(l.x,l.z)):0;const cells=new Map<string,number[][]>();
   for(let z=l.z-l.depth/2;z<l.z+l.depth/2;z++)for(let x=l.x-l.width/2;x<l.x+l.width/2;x++)for(let y=base;y<=base+l.height+8;y++){const b=landmarkBlock(x,y,z);if(!b)continue;const list=cells.get(b)||[];list.push([x+.5,y+.5,z+.5,1,1,1]);cells.set(b,list);}
   const facade=l.kind==='school'?'#dfbd92':l.kind==='temple'?'#b8d4c3':l.kind==='village'?'#c99168':'#cbd0dc';
   for(const [b,points] of cells)this.instances(this.buildings,points,b==='brick'?facade:b==='plank'?(l.kind==='school'?'#855b62':'#526d89'):b==='glass'?'#8fc4d2':'#8b9298');
   // Battlements and four distinct roof towers make the silhouette visible across regions.
   if(l.kind==='castle')for(const dx of [-1,1])for(const dz of [-1,1]){
    const roof=new T.ConeGeometry(2.8,6,4);this.geometries.push(roof);const cap=new T.Mesh(roof,this.material('#526d89'));cap.position.set(l.x+dx*(l.width/2-2),base+l.height+9,l.z+dz*(l.depth/2-2));this.buildings.add(cap);
   }
   for(const dx of [-5,5]){this.part(this.buildings,'#5c594c',l.x+dx,base+2,l.z+l.depth/2+5,.2,4,.2);this.part(this.buildings,'#ffe2a0',l.x+dx,base+4,l.z+l.depth/2+5,.7,.8,.7);}
   // Public square, benches, market stalls and a well beside each entrance.
   const front=l.z+l.depth/2+7;this.part(this.buildings,'#b4a381',l.x,base-.04,front,14,.08,8);
   this.part(this.buildings,'#858985',l.x-7,base+.5,front,2,1,2);this.part(this.buildings,'#5296ad',l.x-7,base+1.02,front,1.4,.05,1.4);
   for(const dx of [-10,10]){this.part(this.buildings,'#806143',l.x+dx,base+.65,front,3,.3,.8);this.part(this.buildings,'#bd775c',l.x+dx,base+2.7,front,3.6,.2,2.2);for(const sx of [-1.4,1.4])this.part(this.buildings,'#806143',l.x+dx+sx,base+1.3,front,.12,2.6,.12);}
  }
 }
 private spawnAnimals(w:World,x:number,z:number){
  for(const a of this.animals)a.object.removeFromParent();this.animals=[];
  // Shared simple rounded anatomy with species-specific ears, horns, wings and proportions.
  for(let i=0;i<(this.quality==='low'?12:30);i++){const ax=Math.floor(x)+(landscapeHash(Math.floor(i/3),5,w.seed)-.5)*100+(i%3)*2,az=Math.floor(z)+(landscapeHash(Math.floor(i/3),9,w.seed)-.5)*100;if(!legacyRegion(ax,az))continue;
   const e=landscapeEnvironment(w.seed,ax,az);if(e.road)continue;const species=e.water?(i%3?'fish':'duck'):e.height>130?'eagle':e.height>85?'goat':e.biome==='forest'?(i%3?'deer':'rabbit'):i%4===0?'owl':['sheep','cow','horse'][i%3];
   const group=new T.Group(),color=species==='fish'?'#deaf78':species==='sheep'?'#e8ddc7':species==='cow'?'#815647':species==='owl'?'#8b819c':'#ad8057';
   const small=['fish','duck','rabbit','owl','eagle'].includes(species),scale=small?.45:1;
   this.part(group,color,0,.8,0,.42,.45,.75,true);this.part(group,color,0,1.22,.52,.24,.3,.28,true);
   const legs:T.Object3D[]=[],wings:T.Object3D[]=[];
   if(!['fish','owl','eagle'].includes(species))for(const dx of [-.26,.26])for(const dz of [-.45,.45])legs.push(this.part(group,'#685642',dx,.35,dz,.12,.7,.12));
   if(['owl','eagle','fish'].includes(species))for(const side of [-1,1])wings.push(this.part(group,color,side*.55,.85,0,.8,.06,.4));
   if(['deer','goat','rabbit','horse'].includes(species))for(const side of [-1,1])this.part(group,color,side*.17,1.62,.5,.08,species==='rabbit'?.7:.35,.09);
   for(const side of [-1,1])this.part(group,'#20272a',side*.17,1.30,.75,.045,.05,.035,true);
   group.scale.setScalar(scale);const y=e.water?e.water.surface-(species==='duck'?.35:e.water.depth*.6):terrainHeight(w,ax,az);group.position.set(ax,y,az);this.group.add(group);this.animals.push({object:group,home:new T.Vector3(ax,y,az),phase:i*.7,species,last:0,legs,wings,state:'graze'});
  }
 }
 update(w:World,position:T.Vector3,time:number,night:boolean,reduced:boolean){
  this.coreView={x:position.x,z:position.z};
  const weather=Math.floor(w.life.time/90+w.seed)%5===0;this.precipitation!.visible=!reduced&&(weather||position.y>190);this.precipitation!.position.copy(position);if(this.precipitation!.visible){const p=this.precipitation!.geometry.getAttribute('position') as T.BufferAttribute;for(let i=0;i<p.count;i++){p.setY(i,18-((time*(position.y>190?1:8)+i*1.71)%36));p.setX(i,Math.sin(i*3.123+time*.1)*18);}p.needsUpdate=true;}
  this.cloudMaterial.color.set(night?'#65758a':weather?'#adb8bc':'#edf1ec');
  const cx=Math.floor(position.x/16),cz=Math.floor(position.z/16),radius=this.quality==='low'?2:3,center=cx+':'+cz,revision=w.voxels?.revision||0;
  if(!this.far){this.far=this.terrainMesh(w,0,0,WIDTH,16);this.far.position.y=-1.1;this.group.add(this.far);this.landmarks(w);}
  this.refreshFar();
  const dirty=new Set<string>();
  if(revision!==this.revision){
   const next=new Map(Object.entries(w.voxels?.edits||{}).map(([k,b])=>[k,String(b)+':'+(w.voxels?.rotations?.[k]||0)]));
   for(const key of new Set([...next.keys(),...this.edits.keys()]))if(next.get(key)!==this.edits.get(key)){const [x,,z]=key.split(',').map(Number);for(const [dx,dz]of [[0,0],[1,0],[-1,0],[0,1],[0,-1]])dirty.add(Math.floor((x+dx)/16)+':'+Math.floor((z+dz)/16));}
   this.edits=next;this.revision=revision;
  }
  if(center!==this.center||dirty.size){this.center=center;const wanted=new Set<string>();
   for(let dz=-radius;dz<=radius;dz++)for(let dx=-radius;dx<=radius;dx++){const x=cx+dx,z=cz+dz,k=x+':'+z;if(legacyRegion(x*16,z*16)&&legacyRegion(x*16+15,z*16+15))continue;if(x*16<-512||z*16<-512||x*16>=768||z*16>=768)continue;wanted.add(k);if(!this.chunks.has(k)||dirty.has(k))this.pending.add(k);}
   for(const [k,g]of this.chunks)if(!wanted.has(k)){this.releaseChunk(g);this.chunks.delete(k);}
   this.refreshFar();
   for(const k of this.pending)if(!wanted.has(k))this.pending.delete(k);
   this.queue=[...this.pending].map(k=>{const [x,z]=k.split(':').map(Number);return {x,z};}).sort((a,b)=>Math.hypot(a.x-cx,a.z-cz)-Math.hypot(b.x-cx,b.z-cz));
   // Keep old geometry while its replacement is queued; block edits never clear every chunk.

  }
  const job=this.queue.shift();if(job){const k=job.x+':'+job.z,g=this.chunk(w,job.x,job.z),old=this.chunks.get(k);if(old)this.releaseChunk(old);this.chunks.set(k,g);this.pending.delete(k);this.group.add(g);this.refreshFar();}
  const animalCell=Math.floor(position.x/64)+':'+Math.floor(position.z/64);if(animalCell!==this.animalCell){this.animalCell=animalCell;this.spawnAnimals(w,position.x,position.z);}
  for(const a of this.animals){if(time-a.last<.15||reduced)continue;const dt=Math.min(.3,time-a.last);a.last=time;const nocturnal=a.species==='owl';a.state=night!==nocturnal?'rest':Math.sin(time*.18+a.phase)>.1?'walk':'graze';
   if(['fish','duck','eagle'].includes(a.species))a.state='walk';const scared=a.object.position.distanceTo(position)<8;if(scared)a.state='flee';
   const moving=a.state==='walk'||a.state==='flee',angle=time*.08+a.phase,nx=a.home.x+Math.sin(angle)*7,nz=a.home.z+Math.cos(angle)*7;
   let dx=nx-a.object.position.x,dz=nz-a.object.position.z;if(scared){dx=a.object.position.x-position.x;dz=a.object.position.z-position.z;}
   const len=Math.hypot(dx,dz)||1,speed=a.state==='flee'?3:1.1,tx=a.object.position.x+dx/len*dt*speed,tz=a.object.position.z+dz/len*dt*speed;
   const env=landscapeEnvironment(w.seed,tx,tz),flying=['owl','eagle'].includes(a.species);
   if(moving&&legacyRegion(tx,tz)&&(['fish','duck'].includes(a.species)?!!env.water:flying||!env.water&&Math.abs(env.height-a.object.position.y)<1.5)&&!landmarkBlock(Math.floor(tx),env.height+1,Math.floor(tz))){a.object.position.x=tx;a.object.position.z=tz;a.object.rotation.y=Math.atan2(dx,dz);a.object.position.y=['fish','duck'].includes(a.species)?env.water!.surface-(a.species==='duck'?.35:Math.max(.5,env.water!.depth*.6)):env.height+(flying?9+Math.sin(time+a.phase):0);}
   a.legs.forEach((leg,i)=>leg.rotation.x=moving?Math.sin(time*(scared?12:6)+i%2*Math.PI)*.45:0);a.wings.forEach((wing,i)=>wing.rotation.z=Math.sin(time*5+a.phase)*(i?1:-1)*.45);
   a.object.userData.behavior=a.state;
  }
  this.group.userData.stats={chunks:this.chunks.size,queued:this.queue.length,animals:this.animals.length,weather:position.y>190?'snow':weather?'rain':'clear'};
 }
 dispose(){for(const g of this.chunks.values())this.releaseChunk(g);this.buildings.traverse(o=>{if(o instanceof T.InstancedMesh)o.dispose();});this.far?.geometry.dispose();this.clouds?.dispose();this.cloudMaterial.dispose();this.precipitation?.geometry.dispose();(this.precipitation?.material as T.Material)?.dispose();this.box.dispose();this.sphere.dispose();this.surface.dispose();this.water.dispose();this.materials.forEach(m=>m.dispose());this.geometries.forEach(g=>g.dispose());this.group.removeFromParent();}
}

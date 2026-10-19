"""Blender 4.3+: procedural 3D VFX, 27 editable scenes, baked transparent frames.
blender -b -t 1 --python scripts/dungeons2/render-ultimate-fx.py -- --output /workspace/d2-fx-render [--preview]
"""
import bpy,math,random,sys,argparse,json
from mathutils import Vector
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--output',required=True);p.add_argument('--preview',action='store_true');args=p.parse_args(sys.argv[sys.argv.index('--')+1:])
OUT=Path(args.output);OUT.mkdir(parents=True,exist_ok=True)
ROOT=Path(__file__).resolve().parents[2]
HEROES=[('lyria','star',(0.48,.42,1)),('celis','ice',(.12,.65,1)),('flora','leaf',(.28,.9,.25)),('noctia','shadow',(.52,.12,1)),('aurene','sun',(1,.62,.12)),('ignis','fire',(1,.15,.025)),('leon','sun',(1,.76,.24)),('orion','shadow',(.52,.24,1)),('leif','leaf',(.18,.8,.4))]
FRAMES=24
bpy.ops.wm.read_factory_settings(use_empty=True)
def material(name,color,strength):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True;nodes=m.node_tree.nodes;nodes.clear();out=nodes.new('ShaderNodeOutputMaterial');emit=nodes.new('ShaderNodeEmission');emit.inputs[0].default_value=(*color,1);emit.inputs[1].default_value=strength;transparent=nodes.new('ShaderNodeBsdfTransparent');mix=nodes.new('ShaderNodeMixShader');m.node_tree.links.new(transparent.outputs[0],mix.inputs[1]);m.node_tree.links.new(emit.outputs[0],mix.inputs[2]);m.node_tree.links.new(mix.outputs[0],out.inputs[0])
 for frame,value in [(1,0),(5,.8),(9,1),(17,.65),(24,0)]:mix.inputs[0].default_value=value;mix.inputs[0].keyframe_insert('default_value',frame=frame)
 return m
def mesh(name,verts,faces,mat):
 me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update();obj=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(obj);obj.data.materials.append(mat);return obj
def arc(name,radius,width,start,span,mat,z=0):
 verts=[];faces=[];n=52
 for i in range(n+1):
  a=start+span*i/n;w=width*max(.025,math.sin(math.pi*i/n))**.65
  verts.extend([(math.cos(a)*(radius-w),math.sin(a)*(radius-w),z),(math.cos(a)*(radius+w),math.sin(a)*(radius+w),z+.06)])
 for i in range(n):faces.append((i*2,i*2+1,i*2+3,i*2+2))
 return mesh(name,verts,faces,mat)
def ring(name,radius,width,mat):return arc(name,radius,width,0,math.tau,mat)
def key(obj,frame,loc=None,scale=None,rotation=None):
 if loc is not None:obj.location=loc;obj.keyframe_insert('location',frame=frame)
 if scale is not None:obj.scale=(scale,)*3 if isinstance(scale,(float,int)) else scale;obj.keyframe_insert('scale',frame=frame)
 if rotation is not None:obj.rotation_euler=rotation;obj.keyframe_insert('rotation_euler',frame=frame)
def envelope(obj,offset=0,peak=8,end=24):
 key(obj,1+offset,scale=.001);key(obj,peak+offset,scale=1.0);key(obj,end,scale=.001)
def make_scene(hero,element,color,slot):
 scene=bpy.data.scenes.new(f'{hero}_skill_{slot+1}');bpy.context.window.scene=scene;scene.render.engine='CYCLES';scene.cycles.samples=6;scene.cycles.use_denoising=False;scene.cycles.max_bounces=1;scene.render.threads_mode='FIXED';scene.render.threads=1
 scene.render.resolution_x=192;scene.render.resolution_y=192;scene.render.resolution_percentage=100;scene.render.film_transparent=True;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA';scene.render.image_settings.color_depth='8';scene.render.fps=20;scene.frame_start=1;scene.frame_end=FRAMES;scene.world=bpy.data.worlds.new(scene.name+'World');scene.world.color=(0,0,0);scene.view_settings.view_transform='Standard'
 cam_data=bpy.data.cameras.new(scene.name+'Camera');cam=bpy.data.objects.new('Camera',cam_data);scene.collection.objects.link(cam);cam.location=(4,-6,7);cam.rotation_euler=(Vector((0,0,0))-cam.location).to_track_quat('-Z','Y').to_euler();cam_data.type='ORTHO';cam_data.ortho_scale=8;scene.camera=cam
 scene.use_nodes=True;nodes=scene.node_tree.nodes;nodes.clear();rl=nodes.new('CompositorNodeRLayers');glow=nodes.new('CompositorNodeGlare');glow.glare_type='FOG_GLOW';glow.quality='MEDIUM';glow.threshold=1;glow.size=7;out=nodes.new('CompositorNodeComposite');scene.node_tree.links.new(rl.outputs['Image'],glow.inputs['Image']);scene.node_tree.links.new(glow.outputs['Image'],out.inputs['Image'])
 bright=material(scene.name+'Core',tuple(.35+.65*c for c in color),1.9);body=material(scene.name+'Ribbon',color,1.0);dim=material(scene.name+'Afterimage',tuple(c*.7 for c in color),.6)
 # Orbital crescents accelerate into an explosive impact; tilted planes provide depth.
 for i in range(3+slot):
  obj=arc('Sweeping blade ribbon',1.1+i*.25,.13+(slot*.025),i*1.4,math.pi*1.3,bright if i==0 else body,z=i*.08)
  envelope(obj,peak=6+i,end=23);key(obj,1,rotation=(.1*i,.25*slot,i*1.3));key(obj,24,rotation=(.5+i*.12,.2*slot,i*1.3+math.tau*(1.15+slot*.15)))
 for i in range(3):
  obj=ring('Expanding shock ring',1,.035,body if i else bright);key(obj,1+i*3,scale=.001);key(obj,11+i*2,scale=1.8+i*.35);key(obj,24,scale=3.2+i*.1);key(obj,24,loc=(0,0,-.2-i*.15))
  # Shrink the ring thickness as energy disperses using shape keys.
  obj.shape_key_add(name='Basis');thin=obj.shape_key_add(name='Dissipate')
  for k,v in enumerate(thin.data):
   angle=math.atan2(v.co.y,v.co.x);v.co.x=math.cos(angle);v.co.y=math.sin(angle)
  thin.value=0;thin.keyframe_insert('value',frame=11);thin.value=1;thin.keyframe_insert('value',frame=24)
 # Comets, ice lances, leaves and stars orbit then fly outward with finite lifetimes.
 rng=random.Random(hero+str(slot))
 for i in range(22+slot*7):
  angle=i*2.399963;radius=.55+rng.random()*1.6
  if element=='ice':
   bpy.ops.mesh.primitive_cone_add(vertices=6,radius1=.1,radius2=0,depth=.75)
  elif element in ('star','sun'):
   verts=[(math.cos(a*math.pi/5)*(.19 if a%2==0 else .07),math.sin(a*math.pi/5)*(.19 if a%2==0 else .07),0)for a in range(10)];obj=mesh('Star mote',verts,[tuple(range(10))],bright)
  elif element=='leaf':
   obj=mesh('Whirling leaf',[(0,-.23,0),(.1,0,.04),(0,.23,0),(-.1,0,-.04)],[(0,1,2,3)],body)
  else:bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=.09)
  if element not in ('star','sun','leaf'):
   obj=bpy.context.object;obj.name='Crystal lance' if element=='ice' else 'Energy spark';obj.data.materials.append(bright if i%3==0 else body)
  start=1+i%5;peak=7+i%5
  key(obj,start,loc=(math.cos(angle)*radius*.4,math.sin(angle)*radius*.4,-.2),scale=.001,rotation=(angle*.4,.5,angle))
  key(obj,peak,loc=(math.cos(angle+slot*.8)*radius,math.sin(angle+slot*.8)*radius,.3+slot*.15),scale=1.0)
  key(obj,24,loc=(math.cos(angle+1.4)*radius*2.4,math.sin(angle+1.4)*radius*2.4,.1+rng.random()*.7),scale=.001,rotation=(angle+2,1.5,angle+3))
 # Large elemental signatures provide a clear silhouette beyond the orbital ribbons.
 if element=='fire':
  for j in range(5+slot):
   verts=[];faces=[]
   for k in range(25):
    t=k/24;a=t*math.tau*1.4+j*math.tau/(5+slot);r=(1-t)*(.6+slot*.12);w=.12*math.sin(math.pi*t)+.025
    verts.extend([(math.cos(a-w)*r,math.sin(a-w)*r,t*2.6-.6),(math.cos(a+w)*r,math.sin(a+w)*r,t*2.6-.6)])
   for k in range(24):faces.append((k*2,k*2+1,k*2+3,k*2+2))
   obj=mesh('Rising helix of living flame',verts,faces,bright if j==0 else body);envelope(obj,peak=8+j%3);key(obj,1,rotation=(0,0,j));key(obj,24,rotation=(.3,0,j+math.tau*1.5))
 elif element=='ice':
  for j in range(5+slot):
   a=j*math.tau/(5+slot);bpy.ops.mesh.primitive_cone_add(vertices=6,radius1=.22,radius2=0,depth=1.7+slot*.3);obj=bpy.context.object;obj.name='Erupting great ice lance';obj.data.materials.append(body if j%2 else bright);obj.location=(math.cos(a)*.65,math.sin(a)*.65,.4);envelope(obj,offset=j%3,peak=8+j%3);key(obj,1,rotation=(.5*math.cos(a),.5*math.sin(a),a));key(obj,24,rotation=(1.1*math.cos(a),1.1*math.sin(a),a+1))
 elif element=='shadow':
  for j in range(2+slot):
   obj=arc('Dancing crescent of the eclipse',.8+j*.16,.24,j*2,math.pi*1.6,body,z=.2*j);envelope(obj,peak=8+j);key(obj,1,rotation=(.5,j*.25,-1));key(obj,24,rotation=(.9,j*.5,math.tau+1))
 elif element in ('star','sun'):
  rays=10 if element=='star' else 16;verts=[(math.cos(i*math.tau/rays)*(1 if i%2==0 else .35),math.sin(i*math.tau/rays)*(1 if i%2==0 else .35),.4)for i in range(rays)];obj=mesh('Celestial rotating seal',verts,[tuple(range(rays))],body);envelope(obj,peak=9);key(obj,1,rotation=(.5,0,-1));key(obj,24,rotation=(.5,.6,4))
 else:
  for j in range(5):
   a=j*math.tau/5;obj=mesh('Great leaves of the spirit tree',[(0,0,0),(.3,.8,.2),(0,1.7,.4),(-.3,.8,-.1)],[(0,1,2,3)],body);envelope(obj,peak=7+j);key(obj,1,rotation=(.35,0,a));key(obj,24,rotation=(1.0,.2,a+2))
 # Three skill silhouettes: a forward lance, a protective rising helix, a radial finisher.
 for i in range(8):
  angle=i*math.tau/8
  if slot==0:
   obj=arc('Forward piercing trail',1.25+i*.07,.06,0,math.pi*.8,bright);envelope(obj,peak=6+i//2);key(obj,1,loc=(-1.3,0,0),rotation=(0,.5,0));key(obj,18,loc=(1.8,0,.1),rotation=(0,.5,math.pi))
  elif slot==1:
   obj=ring('Ascending sanctuary halo',1.4,.035,bright if i%2==0 else dim);envelope(obj,offset=i//2,peak=6+i//2);key(obj,1,loc=(0,0,-1));key(obj,24,loc=(0,0,1.8),rotation=(0,0,i*.5))
  else:
   obj=mesh('Finisher ray',[(0,0,0),(-.07,1,0),(0,2.7,0),(.07,1,0)],[(0,1,2,3)],bright);envelope(obj,offset=3,peak=9);key(obj,1,rotation=(.15,0,angle));key(obj,24,rotation=(.15,0,angle+1.1))
 # Save keyframed source; interpolation stays smooth while the shipped atlas is bounded at 24 frames.
 for obj in scene.objects:
  if obj.animation_data and obj.animation_data.action:
   try:
    for curve in obj.animation_data.action.fcurves:
     for point in curve.keyframe_points:point.interpolation='BEZIER'
   except AttributeError:pass
 return scene
scenes=[make_scene(h,e,c,slot)for h,e,c in HEROES for slot in range(3)]
source=ROOT/'assets-source/dungeons2/ultimate-fx.blend';source.parent.mkdir(parents=True,exist_ok=True);bpy.data.scenes.remove(bpy.data.scenes['Scene']);bpy.context.window.scene=scenes[17];scenes[17].frame_set(10);bpy.ops.wm.save_as_mainfile(filepath=str(source),compress=True)
manifest=[]
for scene in scenes:
 bpy.context.window.scene=scene
 folder=OUT/scene.name;folder.mkdir(exist_ok=True);scene.render.filepath=str(folder/'frame-')
 if args.preview:
  if scene!=scenes[15]:continue
  scene.frame_set(10);scene.render.filepath=str(OUT/'preview.png');bpy.ops.render.render(write_still=True,scene=scene.name);break
 else:
  if len(list(folder.glob('frame-*.png')))==FRAMES:continue
  bpy.ops.render.render(animation=True,scene=scene.name)
 manifest.append({'scene':scene.name,'frames':FRAMES,'fps':20,'cell':192})
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2))

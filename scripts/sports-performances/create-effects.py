"""Blender-authored animated glTF effects and transparent rendered sprite strips."""
import bpy,math,json,sys
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'public/models/sports-effects';SOURCE=ROOT/'assets/sports-performances';OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=8;scene.cycles.use_denoising=False;
for layer in scene.view_layers:layer.cycles.use_denoising=False
scene.render.resolution_x=256;scene.render.resolution_y=256;scene.render.resolution_percentage=100;scene.render.film_transparent=True;scene.render.image_settings.file_format='PNG';scene.render.fps=30;scene.frame_start=1;scene.frame_end=45
scene.world.color=(0,0,0);scene.view_settings.view_transform='Standard';scene.render.threads_mode='FIXED';scene.render.threads=1
scene.use_nodes=True;n=scene.node_tree.nodes;n.clear();render=n.new('CompositorNodeRLayers');glow=n.new('CompositorNodeGlare');glow.glare_type='FOG_GLOW';glow.quality='MEDIUM';glow.threshold=.6;glow.size=7;comp=n.new('CompositorNodeComposite');scene.node_tree.links.new(render.outputs['Image'],glow.inputs['Image']);scene.node_tree.links.new(glow.outputs['Image'],comp.inputs['Image'])
bpy.ops.object.camera_add(location=(0,-8,4.7));camera=bpy.context.object;camera.name='SpriteCamera';camera.rotation_euler=(Vector((0,0,0))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=7;scene.camera=camera
colors={'golf':(1,.63,.08,1),'tennis':(.12,.85,1,1),'basketball':(1,.20,.025,1),'dodgeball':(.58,.13,1,1)}
record={'generator':'Blender '+bpy.app.version_string,'source':'assets/sports-performances/ultimate-effects.blend','units':'meters','pivot':'effect center, Z up in source / Y up in glTF','effect_seconds':1.5,'sprite_frames':16,'sprite_frame_size':256,'effects':{}}
def material(name,c,alpha=1):
 m=bpy.data.materials.new(name);m.use_nodes=True;m.diffuse_color=(*c[:3],alpha);nodes=m.node_tree.nodes;nodes.clear();out=nodes.new('ShaderNodeOutputMaterial');em=nodes.new('ShaderNodeEmission');em.inputs['Color'].default_value=c;em.inputs['Strength'].default_value=2.3;transparent=nodes.new('ShaderNodeBsdfTransparent');mix=nodes.new('ShaderNodeMixShader');mix.inputs[0].default_value=alpha;m.node_tree.links.new(transparent.outputs[0],mix.inputs[1]);m.node_tree.links.new(em.outputs[0],mix.inputs[2]);m.node_tree.links.new(mix.outputs[0],out.inputs[0]);m.surface_render_method='DITHERED';return m
roots=[]
for index,(sport,col) in enumerate(colors.items()):
 root=bpy.data.objects.new('Ultimate_'+sport,None);scene.collection.objects.link(root);roots.append(root);root['sport']=sport;root['duration']=1.5
 mats=[material(sport+'_core',(1,1,.85,1),.95),material(sport+'_energy',col,.8),material(sport+'_aura',col,.38)]
 def mesh(name,verts,faces,mat,parent=root):
  data=bpy.data.meshes.new(name);data.from_pydata(verts,[],faces);data.update();o=bpy.data.objects.new(name,data);scene.collection.objects.link(o);o.parent=parent;data.materials.append(mat);return o
 # One mesh per material: luminous star, ribbon arcs and outward spark rays.
 for layer in range(3):
  vs=[];fs=[]
  def quad(a,b,c,d):
   k=len(vs);vs.extend([a,b,c,d]);fs.append((k,k+1,k+2,k+3))
  if layer==0:
   for k in range(8):
    a=k*math.pi/4;b=a+math.pi/8;c=a+math.pi/4;quad((0,0,0),(math.cos(a)*.32,math.sin(a)*.32,0),(math.cos(b)*1.05,math.sin(b)*1.05,.08),(math.cos(c)*.32,math.sin(c)*.32,0))
  elif layer==1:
   for ring in range(3):
    radius=.9+ring*.6
    for k in range(64):
     a=k*2*math.pi/64;b=(k+1)*2*math.pi/64;gap=(k+ring*9)%21
     if gap>15:continue
     thick=.05 if sport=='golf'else .075
     def p(t,r):
      z=math.sin(t*(2 if sport=='dodgeball'else 1)+ring)*(.2+ring*.18)
      return(math.cos(t)*r,math.sin(t)*r,z)
     quad(p(a,radius),p(b,radius),p(b,radius+thick),p(a,radius+thick))
  else:
   for k in range(18):
    a=k*math.pi/9;radius=1.3+(k%4)*.22;end=radius+.45+(k%3)*.2;w=.025
    quad((math.cos(a)*radius,math.sin(a)*radius,-.03),(math.cos(a)*end-math.sin(a)*w,math.sin(a)*end+math.cos(a)*w,.05),(math.cos(a)*(end+.13),math.sin(a)*(end+.13),.1),(math.cos(a)*end+math.sin(a)*w,math.sin(a)*end-math.cos(a)*w,.05))
  if layer==1 and sport=='tennis':
   for ray in range(8):
    angle=ray*math.pi/4
    for k in range(5):
     r=1.1+k*.25;next_r=r+.28;side=(-1 if k%2 else 1)*.13
     a=(math.cos(angle)*r-math.sin(angle)*side,math.sin(angle)*r+math.cos(angle)*side,.25)
     b=(math.cos(angle)*next_r+math.sin(angle)*side,math.sin(angle)*next_r-math.cos(angle)*side,.25)
     quad(a,b,(b[0]+.05,b[1]+.03,b[2]),(a[0]+.05,a[1]+.03,a[2]))
  if layer==1 and sport=='basketball':
   for flame in range(14):
    a=flame*2*math.pi/14;r=.9+(flame%3)*.15
    quad((math.cos(a)*r,math.sin(a)*r,-.7),(math.cos(a+.13)*(r+.18),math.sin(a+.13)*(r+.18),.0),(math.cos(a+.07)*r*.45,math.sin(a+.07)*r*.45,1.3+(flame%4)*.22),(math.cos(a-.13)*(r-.18),math.sin(a-.13)*(r-.18),.1))
  if layer==1 and sport=='dodgeball':
   for strand in range(3):
    for k in range(54):
     a=k*.16+strand*math.pi*2/3;b=a+.16;z=-1.4+k*.05
     quad((math.cos(a)*1.3,math.sin(a)*1.3,z),(math.cos(b)*1.3,math.sin(b)*1.3,z+.05),(math.cos(b)*1.4,math.sin(b)*1.4,z+.08),(math.cos(a)*1.4,math.sin(a)*1.4,z+.03))
  obj=mesh(['Core','OrbitRibbons','SparkRays'][layer],vs,fs,mats[layer]);obj.rotation_euler.x=(.55 if sport=='tennis'else .18)*layer
  for f,scale in [(1,.05),(5,.65),(12,1),(28,1.18),(45,.025)]:
   obj.scale=(scale,scale,scale);obj.keyframe_insert(data_path='scale',frame=f);obj.rotation_euler.z=(f-1)*(.06 if layer==1 else -.025)*(index+1)/2;obj.keyframe_insert(data_path='rotation_euler',frame=f)
  if obj.animation_data and obj.animation_data.action:obj.animation_data.action.name=sport+'_'+obj.name+'_burst'
 bpy.ops.object.select_all(action='DESELECT');root.select_set(True)
 for obj in root.children:obj.select_set(True)
 scene.frame_set(1);path=OUT/(sport+'.raw.glb');bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,export_animations=True,export_frame_range=True,export_force_sampling=True,export_materials='EXPORT',export_extras=True)
 record['effects'][sport]={'glb':'models/sports-effects/'+sport+'.glb','strip':'sprites/sports-effects/'+sport+'.webp','objects':len(root.children),'triangles':sum(sum(len(p.vertices)-2 for p in o.data.polygons)for o in root.children)}
for root in roots:root.hide_render=True
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'ultimate-effects.blend'))
(SOURCE/'effect-build.json').write_text(json.dumps(record,indent=2)+'\n')
# The fallback and cut-in use the same authored effect, rendered with Cycles on CPU.
for root in roots:
 root.hide_render=False
 for other in roots:
  for o in other.children:o.hide_render=other!=root
 frames=ROOT/'tmp/sports-effect-frames'/root['sport'];frames.mkdir(parents=True,exist_ok=True)
 for i in range(16):
  scene.frame_set(1+int(i*44/15));scene.render.filepath=str(frames/f'{i:02}.png');bpy.ops.render.render(write_still=True)
 root.hide_render=True
print('SPORTS_EFFECTS_DONE',flush=True)

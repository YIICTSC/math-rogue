"""Blender CPU renderer for transparent, repeatable Home Dash scenery layers.
Run: blender -b --factory-startup --python scripts/build-home-dash-parallax.py
The original painted route plates remain the distant layer. All new geometry is decorative.
"""
import bpy, math, os, json, random
from mathutils import Vector
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT=os.path.join(ROOT,'tmp','home-dash-blender');os.makedirs(OUT,exist_ok=True)
THEMES={
 'school':('#d6a278','#6b435b','#b6c7ce','#efb77a','#c6768e'),
 'rooftops':('#9496bf','#42456e','#b4cad9','#e9bb89','#7878a8'),
 'canal':('#b2d7cf','#3d7e8d','#e1d9b1','#ffcf8b','#649e93'),
 'garden':('#b3c09a','#447062','#ddd1aa','#ffdda3','#b782ab'),
 'clockwork':('#bd9562','#494e62','#d8c2a2','#ffb760','#73999c'),
 'skyway':('#c7d9e8','#677eaa','#f3dcb5','#ffe6aa','#b5badf'),
 'storm':('#686e9b','#303b61','#9aaabd','#cfb2ff','#68619a'),
}
def rgba(h):return tuple(int(h[i:i+2],16)/255 for i in (1,3,5))+(1,)
def material(name,color,metal=0,emission=0):
 m=bpy.data.materials.new(name);m.diffuse_color=rgba(color);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=rgba(color);p.inputs['Roughness'].default_value=.65;p.inputs['Metallic'].default_value=metal
 if emission:p.inputs['Emission Color'].default_value=rgba(color);p.inputs['Emission Strength'].default_value=emission
 return m
def attach(o,mat,bevel=0):
 o.data.materials.append(mat)
 if bevel:
  mod=o.modifiers.new('Soft painted edges','BEVEL');mod.width=bevel;mod.segments=1;o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 return o
def box(name,x,y,z,w,d,h,mat,bevel=.025):
 bpy.ops.mesh.primitive_cube_add(size=1,location=(x,y,z+h/2));o=bpy.context.object;o.name=name;o.scale=(w,d,h);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);return attach(o,mat,bevel)
def orb(name,x,y,z,r,mat,scale=(1,1,1)):
 bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2,radius=r,location=(x,y,z));o=bpy.context.object;o.name=name;o.scale=scale;return attach(o,mat)
def roof(x,y,z,w,d,h,mat):
 verts=[(x-w/2,y-d/2,z),(x+w/2,y-d/2,z),(x,y-d/2,z+h),(x-w/2,y+d/2,z),(x+w/2,y+d/2,z),(x,y+d/2,z+h)]
 mesh=bpy.data.meshes.new('Gabled roof');mesh.from_pydata(verts,[],[(0,1,2),(3,5,4),(0,3,4,1),(0,2,5,3),(1,4,5,2)]);mesh.update();o=bpy.data.objects.new('Terracotta roof',mesh);bpy.context.collection.objects.link(o);attach(o,mat)
def arch(x,y,z,w,h,mat):
 box('Arch pillar',x-w/2,y,z,.18,.35,h,mat);box('Arch pillar',x+w/2,y,z,.18,.35,h,mat)
 bpy.ops.mesh.primitive_torus_add(major_radius=w/2,minor_radius=.10,major_segments=20,minor_segments=6,location=(x,y,z+h),rotation=(math.pi/2,0,0));attach(bpy.context.object,mat)
def tree(x,y,z,r,trunk,leaf,petal=False):
 box('Tree trunk',x,y,z,.16,.18,r*1.4,trunk,.02)
 for dx,dz,sz in [(-.45,1.1,.78),(.42,1.2,.74),(0,1.65,.90)]:orb('Blossom canopy' if petal else 'Tree canopy',x+dx*r,y,z+dz*r,r*sz,leaf,(1,.65,.85))
def building(x,y,z,w,h,m,kind):
 wall,roofmat,trim,glow,leaf=m
 box('Facade',x,y,z,w,1.3,h,wall,.07);box('Foundation',x,y-.03,z,w+.2,1.45,.2,trim)
 for level in range(max(1,int(h/1.2))):
  for col in range(max(2,int(w/.85))):
   xx=x-w/2+.42+col*.85
   if xx>x+w/2-.2:continue
   box('Window frame',xx,y-.67,z+.45+level*1.15,.44,.06,.7,trim,.01);box('Warm window',xx,y-.711,z+.52+level*1.15,.30,.04,.52,glow,0)
 box('Cornice',x,y,z+h,w+.25,1.6,.18,trim)
 if kind in ['school','canal','garden']:roof(x,y,z+h+.18,w+.5,1.7,.65,roofmat)
 else:box('Roof parapet',x,y-.65,z+h+.18,w+.25,.18,.38,roofmat)
 if kind=='school':
  box('School clock tower',x,y,z+h+.2,.9,1.0,1.5,trim);roof(x,y,z+h+1.7,1.1,1.2,.5,roofmat)
  orb('Clock face',x,y-.54,z+h+1.03,.29,glow,(1,.08,1))
 if kind=='clockwork':
  bpy.ops.mesh.primitive_torus_add(major_radius=.7,minor_radius=.15,major_segments=16,minor_segments=6,location=(x,y-.9,z+h-.4),rotation=(math.pi/2,0,0));attach(bpy.context.object,trim)
  for i in range(10):
   a=i*math.tau/10;o=box('Gear tooth',x+math.sin(a)*.86,y-.9,z+h-.4+math.cos(a)*.86,.24,.3,.27,trim);o.rotation_euler[1]=a

def scene(theme,palette):
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 for data in list(bpy.data.materials):bpy.data.materials.remove(data)
 random.seed(100+list(THEMES).index(theme))
 m=[material(theme+str(i),c,metal=.3 if theme=='clockwork' and i==2 else 0,emission=.5 if i==3 else 0) for i,c in enumerate(palette)]
 wall,roofmat,trim,glow,leaf=m
 sc=bpy.context.scene;sc.render.engine='CYCLES';sc.cycles.device='CPU';sc.cycles.samples=32;sc.cycles.use_denoising=False;sc.render.resolution_x=1280;sc.render.resolution_y=640;sc.render.resolution_percentage=100;sc.render.film_transparent=True;sc.render.image_settings.file_format='PNG';sc.render.image_settings.color_mode='RGBA';sc.render.threads_mode='FIXED';sc.render.threads=4
 sc.world.color=(.4,.4,.4);sc.view_settings.view_transform='AgX';sc.view_settings.look='AgX - Medium High Contrast'
 bpy.ops.object.camera_add(location=(0,-40,10));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,8))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=32;sc.camera=cam
 bpy.ops.object.light_add(type='AREA',location=(-12,-14,20));bpy.context.object.data.energy=2400;bpy.context.object.data.shape='DISK';bpy.context.object.data.size=12
 bpy.ops.object.light_add(type='SUN',location=(0,-5,10));bpy.context.object.rotation_euler=(math.radians(25),math.radians(-30),math.radians(-35));bpy.context.object.data.energy=2.0;bpy.context.object.data.angle=.3
 # Collect each depth layer independently; the transparent margins tile cleanly.
 layers=[]
 for depth in ['architecture','foreground']:
  before=set(bpy.data.objects)
  if depth=='architecture':
   if theme in ['skyway','storm']:
    for x,h in [(-10,5),(-1,8),(10,6)]:
     orb('Floating rock',x,0,3.0,2.3,roofmat,(1.7,.8,.45));box('Floating island rim',x,0,3.8,6,2,.25,trim)
     building(x,0,4.05,3.6,h,m,'rooftops');arch(x-2,0,4,1.1,2.6,trim)
   elif theme=='garden':
    for x,r in [(-11,2.0),(-5,2.5),(4,2.2),(10,2.8)]:tree(x,.7,2.7,r,roofmat,leaf,True)
    arch(0,0,2.7,3.1,3.8,trim);orb('Garden flowerbed',0,0,2.8,2,leaf,(1.8,.6,.3))
   else:
    for x,w,h in [(-10,6,4.4),(-1,6,6.5),(9,5,4.8)]:building(x,0,2.7,w,h,m,theme)
    if theme=='canal':arch(4,-.1,2.7,3.2,1.0,trim)
  else:
   # Props remain behind the gameplay ground and are deliberately sparse.
   for x in [-12,-4,5,12]:
    if theme in ['garden','school']:
     tree(x,0,2.55,.72,roofmat,leaf,theme=='school');box('Stone planter',x,-.2,2.45,1.2,.65,.42,trim)
    elif theme in ['skyway','storm']:
     arch(x,0,2.6,1.4,2.0,trim);orb('Aether lamp',x,0,4.8,.22,glow)
    else:
     box('Lamp post',x,0,2.55,.12,.15,3.2,roofmat);box('Lamp cap',x,-.02,5.75,.6,.45,.15,trim);box('Glowing lantern',x,-.02,5.3,.38,.32,.45,glow)
   for x in [-9,0,9]:
    box('Parapet',x,.3,2.6,4.4,.35,.5,wall);box('Parapet bevel',x,.3,3.1,4.6,.5,.14,trim)
    for dx in [-1.8,-.6,.6,1.8]:box('Stone joints',x+dx,.08,2.6,.035,.02,.5,roofmat,0)
  objects=set(bpy.data.objects)-before;layers.append((depth,objects))
  for o in objects:o.hide_render=True
 for depth,objects in layers:
  for o in objects:o.hide_render=False
  sc.render.filepath=os.path.join(OUT,theme+'-'+depth+'.png');bpy.ops.render.render(write_still=True)
  for o in objects:o.hide_render=True
 # Editable representative scene plus the generator recreates all seven routes.
 if theme=='school':
  for _,objects in layers:
   for o in objects:o.hide_render=False
  bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'school-parallax.blend'))
for theme,palette in THEMES.items():scene(theme,palette)
print('HOME_DASH_PARALLAX_RENDER_COMPLETE',len(THEMES)*2)

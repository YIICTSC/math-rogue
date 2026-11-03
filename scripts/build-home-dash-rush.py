"""Rebuild the portable, texture-free Home Dash rush scenery with Blender 4.3+."""
import bpy, math, os
from mathutils import Vector
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT=os.path.join(ROOT,'tmp/home-dash-rush');os.makedirs(OUT,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def mat(name,color,metal=0,emission=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=.4
 if emission:p.inputs['Emission Color'].default_value=(*color,1);p.inputs['Emission Strength'].default_value=emission
 return m
road=mat('Midnight ceramic',(.035,.09,.16),.35);edge=mat('Brushed champagne',(.82,.54,.18),.65);light=mat('Jade glow',(.08,.82,.72),.15,1.5);stone=mat('Ivory enamel',(.72,.83,.79),.2);leaf=mat('Emerald canopy',(.045,.34,.25));bark=mat('Cedar',(.2,.13,.12));red=mat('Coral warning',(.9,.18,.23),.1);gold=mat('Gold collectible',(.98,.66,.12),.65,.4)
parts=[]
def box(name,loc,scale,material,bevel=0):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.dimensions=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(material)
 if bevel:mod=o.modifiers.new('Soft manufactured corners','BEVEL');mod.width=bevel;mod.segments=2;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
 parts.append(o);return o
def sphere(loc,scale,material,sub=1):
 bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub,radius=1,location=loc);o=bpy.context.object;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(material);parts.append(o);return o
def finish(name):
 bpy.ops.object.select_all(action='DESELECT')
 for o in parts:o.select_set(True)
 bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();o=bpy.context.object;o.name=name;bpy.context.scene.cursor.location=(0,0,0);bpy.ops.object.origin_set(type='ORIGIN_CURSOR');bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);parts.clear();return o
# Blender Z is up; GLB exports Y up, with forward along runtime -Z.
box('Paved deck',(0,0,-.18),(10.6,24,.35),road,.10)
for x in [-5.25,5.25]:
 box('Gold shoulder',(x,0,.02),(.28,24,.22),edge,.06);box('Safety light',(x*.98,0,.16),(.07,24,.06),light)
for x in [-1.5,1.5]:
 for y in [-9,-3,3,9]:box('Lane inset',(x,y,.015),(.065,2.5,.035),stone)
for x in [-5.9,5.9]:box('Walkway',(x,0,-.1),(1.2,24,.25),stone,.08)
finish('RoadTile')
for x in [-5.8,5.8]:
 box('Arch footing',(x,0,.6),(1.2,1.8,1.2),road,.15);box('Arch column',(x,0,3.6),(.5,.8,6),stone,.08);box('Column light',(x,-.45,3.7),(.12,.08,4.5),light)
box('Arch lintel',(0,0,6.7),(12.6,1.1,.65),edge,.15);box('Lit sign',(0,-.6,6.7),(4.5,.08,.2),light);finish('SkyArch')
box('Tree trunk',(0,0,1.1),(.4,.4,2.2),bark);sphere((0,0,2.8),(1.8,1.5,1.9),leaf,2);sphere((.7,.3,3.7),(1.4,1.3,1.3),leaf);finish('Tree')
box('Highrise',(0,0,5),(4,4,10),road,.3);box('Roof',(0,0,10.1),(4.5,4.5,.4),edge,.1)
for z in [1.5,3.4,5.3,7.2,9.1]:
 for x in [-1.3,0,1.3]:box('Lit window',(x,-2.02,z),(.6,.035,.8),light)
finish('Tower')
sphere((0,0,-2),(6,5,2.2),road,1);box('Island terrace',(0,0,-.25),(9,8,.4),stone,.1);finish('FloatingIsland')
box('Crash barrier',(0,0,.65),(1.9,.8,1.3),red,.13)
for x in [-.6,0,.6]:box('Reflector',(x,-.42,.74),(.2,.04,.75),stone)
finish('Barrier')
for x in [-1.05,1.05]:box('Low bar post',(x,0,.75),(.22,.35,1.5),red,.06)
box('Low bar lintel',(0,0,1.5),(2.35,.45,.3),red,.09);box('Low bar light',(0,-.24,1.53),(1.9,.04,.10),light);finish('LowBar')
bpy.ops.mesh.primitive_torus_add(major_radius=.33,minor_radius=.075,major_segments=16,minor_segments=6,rotation=(math.pi/2,0,0),location=(0,0,.8));o=bpy.context.object;o.data.materials.append(gold);parts.append(o);finish('Coin')
sphere((0,0,1.1),(.55,.2,.7),gold,1);finish('Star')
# A true vertical 360-degree running lane, including an inward road surface and twin rails.
N=128;R=5.8
for a,b,material in [(R,R+.22,road),(R-.055,R+.24,edge)]:
 widths=[(-1.8,1.8)] if material==road else [(-2,-1.8),(1.8,2)]
 for lo,hi in widths:
  vertices=[];faces=[]
  for i in range(N+1):
   t=i/N*math.tau
   for r,z in [(a,lo),(a,hi),(b,hi),(b,lo)]:vertices.append((math.sin(t)*r,z,6-math.cos(t)*r))
  for i in range(N):
   for j in range(4):faces.append((i*4+j,i*4+(j+1)%4,(i+1)*4+(j+1)%4,(i+1)*4+j))
  mesh=bpy.data.meshes.new('Loop lane mesh');mesh.from_pydata(vertices,[],faces);mesh.materials.append(material);obj=bpy.data.objects.new('Loop lane',mesh);bpy.context.collection.objects.link(obj);parts.append(obj)
for x in [-14,14]:box('Runup road',(x,0,.05),(28,4,.3),road,.08)
for x in [-3.8,3.8]:box('Loop support',(x,1.3,3.4),(.35,.4,6.6),stone,.1)
finish('LoopTrack')
# Apply transforms and export only mesh prefabs; no lights/cameras or hidden DCC dependencies.
for o in bpy.context.scene.objects:
 o.select_set(True)
 bpy.context.view_layer.objects.active=o;bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,'assets/go-home-dash/rush/rush-course.blend'))
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'rush-course.glb'),export_format='GLB',export_yup=True,export_apply=True,export_animations=False,export_cameras=False,export_lights=False)
print('Exported Home Dash rush prefabs:',','.join(o.name for o in bpy.context.scene.objects))

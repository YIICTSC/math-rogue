"""Reproducible CPU-rendered orthographic props for the 2D Star Tide runtime."""
import bpy, math, sys
from mathutils import Vector
from pathlib import Path
root=Path(__file__).resolve().parents[2]
out=root/'assets/star-tide/arpg/blender'
out.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene
scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=48;scene.cycles.use_denoising=False
scene.render.resolution_x=512;scene.render.resolution_y=512;scene.render.resolution_percentage=100
scene.render.film_transparent=True;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA'
scene.world.color=(.12,.18,.24)
scene.view_settings.view_transform='AgX'
def mat(name,color,metal=0,glow=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=.32
 if glow:p.inputs['Emission Color'].default_value=(*color,1);p.inputs['Emission Strength'].default_value=glow
 return m
def cylinder(name,radius,depth,z,material,vertices=12):
 bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=depth,location=(0,0,z));o=bpy.context.object;o.name=name;o.data.materials.append(material);b=o.modifiers.new('Carved bevel','BEVEL');b.width=.07;b.segments=2;o.modifiers.new('Weighted highlights','WEIGHTED_NORMAL');return o
stone=mat('Deep sea carved stone',(.075,.14,.19),.3);gold=mat('Antique brass',(.72,.46,.16),.8)
crystal=mat('Living crystal',(.12,.8,.9),.35,1.4)
cylinder('Ground plinth',1.25,.23,.15,stone);cylinder('Gold inlay',1.12,.05,.30,gold);cylinder('Stepped foundation',1.02,.25,.44,stone);cylinder('Upper inlay',.93,.05,.59,gold)
for i in range(8):
 a=i*math.tau/8;bpy.ops.mesh.primitive_cube_add(size=1,location=(math.cos(a)*.87,math.sin(a)*.87,.64));o=bpy.context.object;o.name='Compass rune';o.scale=(.12,.055,.025);o.rotation_euler[2]=a+math.pi/4;o.data.materials.append(crystal)
verts=[(0,0,2.5),(0,0,.79),(.42,0,1.5),(0,.42,1.5),(-.42,0,1.5),(0,-.42,1.5)]
faces=[(0,2,3),(0,3,4),(0,4,5),(0,5,2),(1,3,2),(1,4,3),(1,5,4),(1,2,5)]
mesh=bpy.data.meshes.new('Faceted star crystal');mesh.from_pydata(verts,[],faces);obj=bpy.data.objects.new('Floating star crystal',mesh);scene.collection.objects.link(obj);obj.data.materials.append(crystal)
for i in range(2):
 bpy.ops.mesh.primitive_torus_add(major_radius=.72,minor_radius=.045,major_segments=48,minor_segments=6,location=(0,0,1.5),rotation=(math.radians(65),math.radians(30 if i else -30),math.radians(i*70)));bpy.context.object.data.materials.append(gold)
for name,location,power,size in [('Key',(4,-5,7),1000,5),('Rim',(-4,2,5),1300,4),('Fill',(2,4,3),500,3)]:
 bpy.ops.object.light_add(type='AREA',location=location);o=bpy.context.object;o.name=name;o.data.energy=power;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector((0,0,1))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(5,-7,8));camera=bpy.context.object;camera.rotation_euler=(Vector((0,0,1.1))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=4.8;scene.camera=camera
bpy.ops.wm.save_as_mainfile(filepath=str(out/'trial-altars.blend'))
for name,color in [('hunt',(.95,.14,.13)),('arena',(.1,.65,.95)),('voyage',(.95,.67,.16))]:
 shader=crystal.node_tree.nodes.get('Principled BSDF');shader.inputs['Base Color'].default_value=(*color,1);shader.inputs['Emission Color'].default_value=(*color,1);scene.render.filepath=str(out/(name+'.png'));bpy.ops.render.render(write_still=True)

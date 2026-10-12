import bpy, math, os
from mathutils import Vector
ROOT=os.environ.get('COIN_DOZER_ROOT',os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
OUT=os.path.join(ROOT,'public/models/rpg')
SOURCE=os.environ.get('COIN_DOZER_SOURCE',os.path.join(os.path.dirname(ROOT),'generated_models'))
os.makedirs(OUT,exist_ok=True);os.makedirs(SOURCE,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def mat(name,color,metal=0,rough=.35,emission=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True;n=m.node_tree.nodes.get('Principled BSDF');n.inputs['Base Color'].default_value=(*color,1);n.inputs['Metallic'].default_value=metal;n.inputs['Roughness'].default_value=rough
 if emission:n.inputs['Emission Color'].default_value=(*color,1);n.inputs['Emission Strength'].default_value=emission
 return m
gold=mat('Brushed Gold',(.83,.48,.07),.82);rim=mat('Coin Edge Gold',(1,.74,.22),.85);wood=mat('Dark Emerald Enamel',(.018,.16,.14),.28);red=mat('Ruby Enamel',(.48,.025,.06),.3);dark=mat('Charcoal Steel',(.025,.032,.044),.65);cream=mat('Ivory Lettering',(.97,.91,.71),.2);light=mat('Turquoise Lamps',(.08,.87,.79),.2,emission=2)
def cube(name,loc,size,material,bevel=.04):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.dimensions=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(material)
 if bevel:mod=o.modifiers.new('Soft machined edges','BEVEL');mod.width=bevel;mod.segments=3;mod=o.modifiers.new('Weighted surface normals','WEIGHTED_NORMAL')
 return o
def cyl(name,loc,radius,depth,material,vertices=48):
 bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=depth,location=loc);o=bpy.context.object;o.name=name;o.data.materials.append(material);mod=o.modifiers.new('Rounded rim','BEVEL');mod.width=.008;mod.segments=2;o.modifiers.new('Weighted normals','WEIGHTED_NORMAL');return o
def label(text,loc,size,material):
 bpy.ops.object.text_add(location=loc,rotation=(math.pi/2,0,0));o=bpy.context.object;o.name='Machine lettering '+text;o.data.body=text;o.data.align_x='CENTER';o.data.size=size;o.data.extrude=.006;o.data.materials.append(material);bpy.ops.object.convert(target='MESH');return bpy.context.object
cube('Cabinet base',(0,0,.47),(4,5.25,.85),wood,.1)
cube('Tray support',(0,0,1.02),(3.8,4.9,.28),dark)
cube('Playfield',(0,0,1.22),(3.5,4.6,.09),gold)
for x in [-1.84,1.84]:
 cube('Side rim',(x,0,1.48),(.22,4.9,.47),red)
 cube('Side gold trim',(x,0,1.74),(.25,5,.05),gold)
 cube('Side light strip',(x,-.3,1.78),(.07,3.8,.035),light,.01)
cube('Pusher',(0,1.72,1.29),(3.35,.48,.11),gold,.025)
cube('Pusher back',(0,2.28,1.66),(3.75,.25,1),wood)
cube('Header',(0,2.36,2.4),(4,.35,1),red,.12)
cube('Header gold border',(0,2.16,2.4),(3.8,.04,.76),gold)
cube('Header inset',(0,2.12,2.4),(3.64,.035,.6),wood)
label('COIN ROGUE',(0,2.08,2.36),.43,cream)
label('PUSH YOUR LUCK',(0,2.065,2.19),.13,gold)
for x in [-1.48,-.74,0,.74,1.48]:cyl('Header lamp',(x,2.15,2.96),.055,.04,light)
# Front collection ledge and three physical prize lanes.
cube('Collection tray',(0,-2.53,.79),(3.65,.75,.18),dark)
cube('Front fascia',(0,-2.78,.55),(3.9,.2,.82),red)
for x in [-1.13,0,1.13]:
 cube('Prize bay',(x,-2.88,.76),(.98,.05,.3),wood,.02)
 cube('Prize bay trim',(x,-2.93,.95),(.99,.055,.055),gold,.01)
for x in [-.57,.57]:cube('Prize lane divider',(x,-2.5,1.05),(.035,.55,.4),gold,.01)
label('LOOT',(0,-2.905,.4),.24,cream)
for x in [-1.72,1.72]:
 for y in [-2,1.9]:cube('Cabinet foot',(x,y,.08),(.27,.3,.22),dark)
# Decorative control rail / slots.
cube('Control console',(0,-2.52,1.35),(3.75,.4,.2),wood)
for x in [-1.2,0,1.2]:cyl('Control button',(x,-2.54,1.48),.12,.06,light)
# Export cabinet only, preserving Pusher node for animation.
bpy.ops.object.select_all(action='SELECT')
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(SOURCE,'coin-dozer.blend'))
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'coin-dozer.glb'),export_format='GLB',use_selection=True,export_apply=True)
# Render a transparent furniture icon from the actual Blender cabinet.
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=16;scene.cycles.use_denoising=False;scene.render.resolution_x=512;scene.render.resolution_y=512;scene.render.resolution_percentage=100;scene.render.film_transparent=True
bpy.ops.object.camera_add(location=(7,-9,7));camera=bpy.context.object;camera.rotation_euler=(Vector((0,0,1.25))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=8.5;scene.camera=camera
for loc,power,size in [((2,-5,8),1200,5),((-4,1,6),800,4),((4,4,5),900,3)]:
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector((0,0,1))-o.location).to_track_quat('-Z','Y').to_euler()
scene.world.color=(.25,.25,.25);scene.render.filepath=os.path.join(SOURCE,'coin-dozer.png');bpy.ops.render.render(write_still=True)
# Real Blender coin mesh; joined rim, face and embossed star into one instanced geometry.
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
parts=[cyl('Coin core',(0,0,0),.11,.026,gold),cyl('Coin upper rim',(0,0,.014),.112,.006,rim),cyl('Coin lower rim',(0,0,-.014),.112,.006,rim)]
for i in range(5):
 a=i*math.tau/5;part=cube('Embossed ray',(.028*math.sin(a),.028*math.cos(a),.019),(.014,.055,.004),rim,.001);part.rotation_euler.z=-a;parts.append(part)
bpy.ops.object.select_all(action='DESELECT')
for o in parts:o.select_set(True)
bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.convert(target='MESH');bpy.ops.object.join();o=bpy.context.object;o.name='CoinToken';bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'coin-token.glb'),export_format='GLB',use_selection=True,export_apply=True)
print('Generated Blender cabinet, furniture render, and coin GLB assets')

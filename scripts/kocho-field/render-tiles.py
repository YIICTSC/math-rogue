"""Render original dream-course surface textures with Blender, using CPU Cycles."""
import bpy,sys
from pathlib import Path
root=Path(__file__).resolve().parents[2];out=root/'public/sprites/kocho-field';out.mkdir(exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=8;scene.cycles.use_denoising=False
scene.render.resolution_x=256;scene.render.resolution_y=256;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.film_transparent=True
bpy.ops.mesh.primitive_plane_add(size=2);obj=bpy.context.object;obj.name='Dream kingdom course surface'
bpy.ops.object.camera_add(location=(0,0,4));cam=bpy.context.object;cam.rotation_euler=(0,0,0);cam.data.type='ORTHO';cam.data.ortho_scale=2;scene.camera=cam
bpy.ops.object.light_add(type='AREA',location=(-1,-1,3));bpy.context.object.data.energy=220;bpy.context.object.data.size=5
colors=[('meadow',(0.35,.76,.52,1),(.62,.9,.68,1)),('sugar',(.68,.34,.58,1),(.92,.61,.8,1)),('ice',(.25,.57,.76,1),(.72,.92,1,1)),('sand',(.75,.55,.24,1),(1,.87,.58,1))]
for name,a,b in colors:
 mat=bpy.data.materials.new('Dream '+name);mat.use_nodes=True;n=mat.node_tree.nodes;links=mat.node_tree.links;bs=n.get('Principled BSDF');bs.inputs['Roughness'].default_value=.75
 noise=n.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=16;noise.inputs['Detail'].default_value=2
 ramp=n.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].color=a;ramp.color_ramp.elements[1].color=b;links.new(noise.outputs['Fac'],ramp.inputs[0]);links.new(ramp.outputs['Color'],bs.inputs['Base Color'])
 bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.15;bump.inputs['Distance'].default_value=.05;links.new(noise.outputs['Fac'],bump.inputs['Height']);links.new(bump.outputs['Normal'],bs.inputs['Normal'])
 obj.data.materials.clear();obj.data.materials.append(mat);scene.render.filepath=str(out/('tile-'+name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(root/'assets/kocho/field-surfaces.blend'))

import bpy, os
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
bpy.ops.mesh.primitive_cube_add(size=1, location=(0,0,0))
cube=bpy.context.object; cube.name='VoxelBlock'
# Exact unit dimensions keep neighboring faces seamless.
root=os.path.abspath(os.path.join(os.path.dirname(__file__),'../..'))
os.makedirs(root+'/public/models/storybook',exist_ok=True)
bpy.ops.export_scene.gltf(filepath=root+'/public/models/storybook/voxel-block.glb',export_format='GLB',use_selection=True)
bpy.ops.wm.save_as_mainfile(filepath=root+'/assets/storybook/voxel-block.blend')

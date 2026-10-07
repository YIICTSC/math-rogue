"""Original modular construction shapes. Blender Z becomes runtime Y on export."""
import bpy, os
from math import pi
root=os.path.abspath(os.path.join(os.path.dirname(__file__),'../..'))
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
def build(name,boxes):
    parts=[]
    for x,y,z,sx,sy,sz in boxes:
        bpy.ops.mesh.primitive_cube_add(size=1, location=(x,-z,y))
        obj=bpy.context.object;obj.scale=(sx,sz,sy)
        bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);parts.append(obj)
    bpy.ops.object.select_all(action='DESELECT')
    for obj in parts:obj.select_set(True)
    bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();obj=parts[0];obj.name=name
    bpy.context.scene.cursor.location=(0,0,0);bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
build('slab',[(0,-.25,0,1,.5,1)])
build('stairs',[(0,-.25,0,1,.5,1),(0,.25,-.25,1,.5,.5)])
build('fence',[(0,0,0,.22,1,.22),(0,.23,0,1,.14,.13),(0,-.16,0,1,.14,.13)])
build('pane',[(0,0,0,1,1,.08)])
build('workbench',[(0,.35,0,1,.3,1)]+[(x,-.15,z,.18,.7,.18) for x in [-.36,.36] for z in [-.36,.36]]+[(0,-.25,0,.75,.1,.75)])
build('furnace',[(0,0,-.18,1,1,.64),(-.36,0,.32,.28,1,.36),(.36,0,.32,.28,1,.36),(0,.38,.32,.44,.24,.36),(0,-.4,.32,.44,.2,.36)])
build('chest',[(0,-.12,0,.91,.7,.84),(0,.3,0,.96,.16,.89),(0,.1,.45,.12,.22,.05)])
build('torch',[(0,-.22,0,.12,.56,.12),(0,.12,0,.19,.20,.19)])
build('lantern',[(0,-.05,0,.38,.5,.38),(0,-.34,0,.5,.09,.5),(0,.24,0,.5,.09,.5),(0,.37,0,.09,.2,.09)])
build('composter',[(0,-.44,0,1,.12,1),(-.44,0,0,.12,.88,1),(.44,0,0,.12,.88,1),(0,0,-.44,.76,.88,.12),(0,0,.44,.76,.88,.12)])
build('irrigator',[(0,-.06,0,.72,.88,.72),(0,.39,0,.85,.08,.85),(.4,.1,0,.22,.12,.12)])
bpy.ops.object.select_all(action='SELECT')
os.makedirs(root+'/public/models/storybook',exist_ok=True)
bpy.ops.export_scene.gltf(filepath=root+'/public/models/storybook/voxel-workshop-v1.glb',export_format='GLB',use_selection=True)
bpy.ops.wm.save_as_mainfile(filepath=root+'/assets/storybook/voxel-workshop.blend')
print('Exported 11 original construction and workshop meshes.')

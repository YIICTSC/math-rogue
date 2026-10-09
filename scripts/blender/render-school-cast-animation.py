"""Render authored cast motion poses without changing or exporting the game kit."""
import bpy, os, math
from mathutils import Vector
root=os.path.abspath(os.path.join(os.path.dirname(__file__),'../..'))
review=os.path.join(root,'assets/school-wanderer/cast-quality')
render_output=os.path.join(root,'tmp/school-wanderer-review/cast');os.makedirs(render_output,exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=os.path.join(review,'cast-quality.blend'))
scene=bpy.context.scene
names=['friend_heal','friend_guard','friend_fetch','slime','bat','dragon','thief','golem','mage']
actors={o.name:o for o in scene.objects if o.type=='EMPTY' and o.parent is None}
for i,o in enumerate(actors.values()):o.location=(100+i*3,0,0)
for i,name in enumerate(names):actors[name].location=((i%3-1)*1.8,-(i//3-1)*2,0)
camera=scene.camera;camera.data.ortho_scale=7.4;camera.location=(0,-8,7)
camera.rotation_euler=(Vector((0,0,.5))-camera.location).to_track_quat('-Z','Y').to_euler()
scene.render.resolution_x=1000;scene.render.resolution_y=1000
for action,frame in [('Walk',6),('Attack',9)]:
    for ob in scene.objects:
        if ob.animation_data:
            for track in ob.animation_data.nla_tracks:track.mute=not track.name.endswith('_'+action)
    scene.frame_set(frame)
    scene.render.filepath=os.path.join(render_output,'animation-'+action.lower()+'.png')
    bpy.ops.render.render(write_still=True)

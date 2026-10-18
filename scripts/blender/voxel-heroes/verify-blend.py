"""Reopen every deliverable, verify editable structure, and save a useful initial viewport."""
import bpy,json,sys,math
from pathlib import Path
from mathutils import Vector
root=Path(sys.argv[sys.argv.index('--')+1]);reports=[]
for folder in sorted(root.iterdir()):
 p=folder/(folder.name+'.blend')
 if not p.exists():continue
 bpy.ops.wm.open_mainfile(filepath=str(p));rig=bpy.data.objects.get('HeroRig');assert rig and rig.type=='ARMATURE'
 assert len(rig.data.bones)==12
 meshes=[o for o in bpy.data.objects if o.type=='MESH' and o.parent==rig];assert len(meshes)>15
 assert {t.name for t in rig.animation_data.nla_tracks}=={'Idle','Walk','Jump','Attack'}
 assert all(t.mute for t in rig.animation_data.nla_tracks)
 assert {a.name for a in bpy.data.actions}=={'Idle','Walk','Jump','Attack'}
 assert all(o.data.color_attributes.get('Color') for o in meshes)
 for o in meshes:
  assert any(m.type=='ARMATURE' and m.object==rig for m in o.modifiers)
  assert all(abs(sum(g.weight for g in v.groups)-1)<1e-5 for v in o.data.vertices)
 assert any(i.packed_file for i in bpy.data.images if i.name.startswith('REFERENCE'))
 for sc in bpy.data.screens:
  for area in sc.areas:
   if area.type=='VIEW_3D':
    space=area.spaces.active;space.shading.type='SOLID';space.shading.color_type='VERTEX';space.shading.light='STUDIO';space.shading.show_shadows=True;space.shading.show_cavity=True;space.overlay.show_floor=False
    space.region_3d.view_distance=3.4;space.region_3d.view_location=(0,0,.96);space.region_3d.view_rotation=bpy.context.scene.camera.rotation_euler.to_quaternion();space.region_3d.view_perspective='ORTHO'
 bpy.context.scene.unit_settings.system='METRIC';bpy.context.scene.unit_settings.scale_length=1.0;bpy.context.preferences.filepaths.save_version=0;bpy.ops.wm.save_as_mainfile(filepath=str(p))
 report=dict(id=folder.name,meshes=len(meshes),bones=12,actions=4,packedReference=True,weightsValid=True);reports.append(report);print('BLEND_VERIFIED',folder.name,flush=True)
(root/'blend-verification.json').write_text(json.dumps(reports,indent=2))

"""Original rounded storybook character components, shared by kart and golf."""
import bpy, math, pathlib, json
ROOT=pathlib.Path(__file__).resolve().parents[2]
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
mat=bpy.data.materials.new('Customizable cloth and clay');mat.diffuse_color=(.8,.7,.55,1);mat.use_nodes=True;mat.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=.8
models=[]
def finish(o,name):
 o.name=name;o.data.materials.clear();o.data.materials.append(mat)
 for p in o.data.polygons:p.use_smooth=True
 models.append(o)
def ball(name,deform=None):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=20,ring_count=12,radius=1);o=bpy.context.object
 if deform:
  for v in o.data.vertices:deform(v.co)
 finish(o,name)
def roundbox(name,width=1,height=1,depth=1,bevel=.13,taper=False):
 bpy.ops.mesh.primitive_cube_add(size=1);o=bpy.context.object;o.scale=(width,depth,height);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if taper:
  for v in o.data.vertices:
   if v.co.z<0:v.co.x*=.86;v.co.y*=.91
 m=o.modifiers.new('Soft stitched silhouette','BEVEL');m.width=bevel;m.segments=3;bpy.ops.object.modifier_apply(modifier=m.name)
 m=o.modifiers.new('Soft normals','WEIGHTED_NORMAL');m.keep_sharp=True;bpy.ops.object.modifier_apply(modifier=m.name);finish(o,name)
def head(v):
 # A broad cheek, small chin and a softly flattened forward face (+Z in glTF).
 t=v.z;v.x*=1.04 if -.45<t<.15 else .93 if t<-.45 else 1
 if v.y<-.35:v.y=-.35+(v.y+.35)*.8
 if t<-.5:v.z=-.5+(t+.5)*.82
ball('head',head)
ball('sleeve',lambda v:setattr(v,'z',v.z*(.94 if v.z<0 else 1)))
ball('mitten',lambda v:setattr(v,'y',v.y*.85))
ball('haircap',lambda v:setattr(v,'z',v.z*(.82 if v.z<0 else 1)))
ball('ear',lambda v:setattr(v,'y',v.y*.75))
roundbox('sweater',taper=True)
roundbox('shoe',depth=1,bevel=.16)
roundbox('hairlock',bevel=.16)
roundbox('robothead',bevel=.16)
bpy.ops.mesh.primitive_cone_add(vertices=16,radius1=1,radius2=.78,depth=1);o=bpy.context.object
m=o.modifiers.new('Rounded trouser hems','BEVEL');m.width=.09;m.segments=3;bpy.ops.object.modifier_apply(modifier=m.name);finish(o,'trouser')
bpy.ops.mesh.primitive_cone_add(vertices=12,radius1=1,radius2=.035,depth=1);o=bpy.context.object
m=o.modifiers.new('Soft ear tips','BEVEL');m.width=.06;m.segments=2;bpy.ops.object.modifier_apply(modifier=m.name);finish(o,'pointedear')
roundbox('collar',width=1,height=1,depth=.3,bevel=.08)
# Named origin-centred components are recolored and articulated by the existing game rigs.
out=ROOT/'public/models/storybook';out.mkdir(parents=True,exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(out/'characters-v1.glb'),export_format='GLB',export_yup=True,export_animations=False)
for i,o in enumerate(models):o.location=((i%4)*3,(i//4)*3,0)
source=ROOT/'assets/storybook';source.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(source/'characters.blend'))
(out/'characters-catalog.json').write_text(json.dumps({'version':1,'style':'storybook-fantasy','models':[o.name for o in models],'creator':'Original Blender character components for Learning Rogue'},indent=2)+'\n')
print('STORYBOOK_CHARACTER_COMPONENTS_READY',len(models))

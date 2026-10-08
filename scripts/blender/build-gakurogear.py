"""Original PS-era school training props; reproducible Blender -> glTF pipeline."""
import bpy, os
root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
materials = {}
for name, color in [('navy',(.09,.18,.25,1)),('skin',(.72,.51,.35,1)),('hair',(.08,.07,.06,1)),('wood',(.43,.26,.12,1)),('metal',(.22,.32,.34,1)),('book',(.15,.42,.4,1)),('leaf',(.13,.35,.2,1)),('white',(.7,.74,.64,1))]:
    mat=bpy.data.materials.new(name); mat.diffuse_color=color; materials[name]=mat
def model(name, parts):
    meshes=[]
    for x,y,z,w,h,d,color in parts:
        bpy.ops.mesh.primitive_cube_add(size=1,location=(x,-z,y))
        ob=bpy.context.object; ob.scale=(w,d,h); ob.data.materials.append(materials[color]); meshes.append(ob)
        bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    bpy.ops.object.select_all(action='DESELECT')
    for ob in meshes: ob.select_set(True)
    bpy.context.view_layer.objects.active=meshes[0]; bpy.ops.object.join(); ob=meshes[0]; ob.name=name
    bpy.context.scene.cursor.location=(0,0,0); bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
model('student',[(0,.85,0,.5,.6,.3,'navy'),(0,1.35,0,.38,.38,.35,'skin'),(0,1.55,-.025,.4,.13,.37,'hair'),(-.16,.3,0,.18,.6,.23,'navy'),(.16,.3,0,.18,.6,.23,'navy'),(-.34,.82,0,.16,.62,.18,'skin'),(.34,.82,0,.16,.62,.18,'skin'),(0,.95,-.22,.4,.4,.2,'book'),(-.1,1.39,.18,.04,.04,.02,'hair'),(.1,1.39,.18,.04,.04,.02,'hair')])
model('desk',[(0,.94,0,2,.12,1.2,'wood')]+[(x,.45,z,.09,.9,.09,'metal') for x in [-.85,.85] for z in [-.45,.45]])
model('shelf',[(x,1,0,.12,2,1,'wood') for x in [-.94,.94]]+[(0,y,0,2,.12,1,'wood') for y in [.08,.7,1.35,1.94]]+[(x,y,.04,.18,.45,.65,'book' if i%2 else 'white') for i,x in enumerate([-.7,-.45,-.2,.05,.3,.55,.8]) for y in [.38,1,1.65]])
model('planter',[(0,.35,0,2,.7,1.2,'wood'),(0,.82,0,1.8,.4,1,'leaf')])
out=root+'/public/models/gakurogear'; os.makedirs(out,exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=out+'/school-kit.glb',export_format='GLB',use_selection=True)
os.makedirs(root+'/assets/gakurogear',exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=root+'/assets/gakurogear/school-kit.blend')

"""Export original transport models. Blender Y points toward the bow."""
from pathlib import Path
from mathutils import Vector
import bpy

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / 'public/models/storybook/rpg-watercraft.glb'
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

PALETTE = {
    'tar': (.13, .080, .049), 'cedar': (.40, .20, .095), 'rim': (.68, .37, .16),
    'bamboo': (.54, .51, .20), 'jade': (.09, .30, .25), 'rope': (.67, .53, .33),
    'brass': (.59, .38, .13), 'ivory': (.89, .73, .48), 'sail': (.11, .58, .54),
}
MATERIALS = {}
for name, color in PALETTE.items():
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*color, 1)
    shader.inputs['Roughness'].default_value = .48 if name == 'brass' else .68
    shader.inputs['Metallic'].default_value = .57 if name == 'brass' else 0
    MATERIALS[name] = mat

root = None
def begin(name):
    global root
    root = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(root)

def material(obj, name):
    obj.data.materials.append(MATERIALS[name])
    obj.parent = root
    return obj

def box(x, y, z, width, length, height, name, edge=.012):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, z))
    obj = bpy.context.object
    obj.scale = (width, length, height)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if edge:
        bevel = obj.modifiers.new('Rounded hand-worked edge', 'BEVEL')
        bevel.width = edge
        bevel.segments = 2
        bpy.ops.object.modifier_apply(modifier=bevel.name)
    return material(obj, name)

def tube(start, end, radius, name):
    a, b = Vector(start), Vector(end)
    bpy.ops.mesh.primitive_cylinder_add(vertices=10, radius=radius, depth=(b-a).length, location=(a+b)/2)
    obj = bpy.context.object
    obj.rotation_euler = (b-a).to_track_quat('Z', 'Y').to_euler()
    return material(obj, name)

def surface(vertices, faces, name):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return material(obj, name)

def chest(x, y, z, scale=1):
    box(x,y,z+.095*scale,.37*scale,.34*scale,.19*scale,'cedar')
    box(x,y,z+.199*scale,.39*scale,.36*scale,.055*scale,'rim')
    for side in [-1,1]:
        box(x+side*.115*scale,y,z+.227*scale,.025*scale,.352*scale,.018*scale,'brass',.003)
    box(x,y-.173*scale,z+.16*scale,.062*scale,.019*scale,.08*scale,'brass',.005)

def boat(name, cargo):
    begin(name)
    outline = [(0,.72),(-.25,.54),(-.38,.22),(-.39,-.25),(-.26,-.59),
               (.26,-.59),(.39,-.25),(.38,.22),(.25,.54)]
    rings = [[(x*sx,y*sy,z + (.06 if y>.52 else 0)) for x,y in outline]
             for sx,sy,z in [(.68,.85,-.18),(.90,.956,-.02),(1,1,.18),(.865,.92,.18),(.69,.84,-.095)]]
    size = len(outline)
    for i,wood in enumerate(['tar','cedar','rim','cedar']):
        faces = [(j,(j+1)%size,(j+1)%size+size,j+size) for j in range(size)]
        surface(rings[i]+rings[i+1],faces,wood)
    surface(rings[4],[tuple(range(size))],'tar')
    for y,width in [(-.28,.63),(-.06,.64),(.25,.60)]:
        box(0,y,.05,width,.09,.043,'cedar')
    for side in [-1,1]:
        tube((side*.335,.23,.17),(side*.345,-.29,.17),.026,'rim')
        tube((side*.24,.40,.12),(side*.42,-.32,.18),.017,'rope')
        box(side*.42,-.33,.18,.102,.17,.031,'rim')
        box(side*.398,.021,.16,.029,.089,.04,'brass',.004)
    box(0,.56,.17,.12,.11,.045,'brass',.008)
    if cargo:
        chest(0,-.31,.10)

def raft(name,cargo):
    begin(name)
    for i in range(7):
        x=(i-3)*.116
        length=1.18 - abs(i-3)*.052
        tube((x,-.54,-.017),(x,length-.54,-.017),.072,'bamboo' if i%3 else 'jade')
        for node in [.01,.33]:
            tube((x,node-.01,-.017),(x,node+.010,-.017),.075,'rope')
    for y in [-.34,.34]:
        box(0,y,.077,.82,.083,.044,'cedar')
        for x in [-.30,-.20,.20,.30]:
            box(x,y,.104,.019,.108,.018,'rope',.004)
    box(0,-.03,.08,.39,.12,.068,'rim')
    tube((-.33,.44,.16),(-.43,-.40,.13),.019,'tar')
    box(-.44,-.44,.13,.1,.19,.03,'rim')
    if cargo:
        chest(.12,-.24,.12,.88)
        box(.23,.20,.15,.24,.28,.15,'cedar')
        box(.23,.20,.226,.049,.28,.022,'rope')

def glider():
    begin('glider_wing')
    nose=(0,.69,1.49)
    for side in [-1,1]:
        inner=(side*.52,.06,1.5)
        rib=(side*.95,-.24,1.46)
        tip=(side*1.56,-.43,1.32)
        trailing=(side*.35,-.60,1.26)
        center=(0,-.49,1.37)
        for verts,color in [([nose,inner,trailing,center],'sail'),([nose,rib,inner],'ivory'),
                            ([nose,tip,rib],'jade'),([inner,rib,tip,trailing],'sail')]:
            face=tuple(range(len(verts)))
            surface(verts,[face if side==1 else face[::-1]],color)
        tube(nose,tip,.021,'cedar')
        tube(tip,trailing,.016,'ivory')
        tube(inner,(side*.22,-.12,.72),.019,'cedar')
    tube((-.22,-.12,.72),(.22,-.12,.72),.032,'brass')

boat('rowboat',False)
boat('cargo_boat',True)
raft('bamboo_raft',False)
raft('cargo_raft',True)
glider()
bpy.ops.export_scene.gltf(filepath=str(OUTPUT),export_format='GLB',export_materials='EXPORT')

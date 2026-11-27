"""Original brass-and-crystal equipment. Export center-pivot, meter-scale geometry."""
import math
from pathlib import Path
import bpy

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public/models/storybook/sandbox-machinery.glb"
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)

COLORS = {
    "slate": (0.19, 0.26, 0.30, 1), "brass": (0.69, 0.38, 0.15, 1),
    "copper": (0.75, 0.30, 0.26, 1), "wood": (0.43, 0.25, 0.14, 1),
    "crystal": (0.88, 0.25, 0.48, 1), "light": (1.0, 0.67, 0.29, 1),
    "steel": (0.44, 0.52, 0.58, 1), "patina": (0.20, 0.53, 0.45, 1),
}
MATERIALS = {}
for name, rgba in COLORS.items():
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = rgba
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = rgba
    shader.inputs["Metallic"].default_value = 0.48 if name in {"brass", "copper", "steel", "patina"} else 0.12
    shader.inputs["Roughness"].default_value = 0.42
    MATERIALS[name] = mat

parts = []
def finish(obj, material, bevel):
    obj.data.materials.append(MATERIALS[material])
    if bevel:
        mod = obj.modifiers.new("Tool edge", "BEVEL")
        mod.width = bevel
        mod.segments = 1
        bpy.ops.object.modifier_apply(modifier=mod.name)
    parts.append(obj)
    return obj

def box(x, y, z, sx, sy, sz, material="slate", bevel=.025, angle=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, z))
    obj = bpy.context.object
    obj.scale = (sx, sy, sz)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.rotation_euler.x = angle
    return finish(obj, material, bevel)

def gem(x, y, z, sx, sy, sz, material="crystal"):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=.5, location=(x, y, z))
    obj = bpy.context.object
    obj.scale = (sx, sy, sz)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(obj, material, 0)

def chisel(name):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in parts:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join()
    obj = bpy.context.object
    bpy.context.scene.cursor.location = (0, 0, 0)
    bpy.ops.object.origin_set(type="ORIGIN_CURSOR")
    obj.name = "machine_" + name
    obj.data.name = obj.name
    parts.clear()

def base(width=.84, depth=.76):
    box(0,0,-.43,width,depth,.14,"slate")
    for x in (-width*.36, width*.36):
        for y in (-depth*.32, depth*.32):
            box(x,y,-.35,.085,.085,.034,"brass",.01)

base(.38,.38)
box(0,0,-.35,.26,.26,.08,"copper")
gem(0,0,-.29,.18,.18,.10)
chisel("trace")

base()
box(0,0,-.32,.38,.38,.10,"brass")
box(0,-.06,-.12,.13,.15,.44,"steel",.015,math.radians(-31))
box(0,-.17,.08,.22,.19,.16,"crystal")
chisel("lever")

base(.83,.83)
box(0,0,-.32,.66,.66,.13,"wood")
for x in (-.26,.26): box(x,0,-.23,.08,.57,.04,"brass")
chisel("plate")

base(.82,.84)
box(0,0,-.22,.55,.58,.35,"patina")
box(0,.28,-.17,.50,.095,.18,"steel")
gem(0,.34,-.15,.22,.10,.15)
box(0,-.31,-.15,.16,.1,.16,"brass")
chisel("sensor")

base(.42,.42)
box(0,0,-.24,.14,.14,.33,"copper",.02)
gem(0,0,-.035,.27,.27,.22)
chisel("torch")

base()
box(0,0,-.33,.69,.62,.07,"copper",.012)
for x,y in ((0,.24),(-.18,-.17),(.18,-.17)):
    box(x,y,-.25,.10,.10,.11,"brass",.012)
    gem(x,y,-.17,.15,.15,.13)
box(0,0,-.275,.06,.44,.03,"patina",.008)
chisel("circuit")

base(.89,.89)
for x in (-.36,.36):
    for y in (-.36,.36): box(x,y,-.05,.10,.10,.66,"brass")
box(0,0,-.08,.66,.66,.53,"light")
box(0,0,.24,.86,.86,.12,"brass")
gem(0,0,.39,.21,.21,.18,"steel")
chisel("lamp")

for x in (-.36,.36):
    box(x,0,0,.18,.28,1,"wood")
    box(x,0,.35,.23,.33,.13,"brass")
for z in (-.25,.15):
    box(0,0,z,.88,.16,.12,"steel")
box(0,.1,0,.16,.08,.24,"brass")
chisel("gate")

base()
box(0,-.13,-.04,.78,.60,.70,"wood")
for x in (-.25,.25):
    box(x,-.09,-.06,.09,.64,.60,"brass")
box(0,.19,-.05,.23,.54,.25,"steel")
box(0,.42,-.05,.74,.12,.63,"patina")
chisel("piston")

box(0,-.10,-.05,.22,.75,.23,"steel")
box(0,.22,-.05,.83,.17,.70,"patina")
for x in (-.27,.27): box(x,.32,-.08,.10,.09,.15,"brass")
chisel("head")

for y in (-.33,0,.33):
    box(0,y,-.455,.90,.13,.09,"wood",.016)
chisel("rail")

base(.85,.85)
for x in (-.35,.35): box(x,0,.19,.12,.81,.24,"copper")
for y in (-.35,.35): box(0,y,.19,.65,.12,.24,"copper")
box(0,0,-.06,.55,.58,.28,"steel")
box(0,.19,-.28,.23,.50,.17,"patina")
chisel("hopper")

base(.82,.82)
box(0,0,-.09,.70,.73,.53,"slate")
box(0,.35,-.05,.54,.22,.42,"copper")
box(0,.476,-.05,.35,.03,.26,"patina",.01)
for x in (-.26,.26): box(x,0,.22,.10,.62,.09,"brass")
gem(0,-.04,.208,.21,.27,.12,"light")
chisel("dispenser")

base(.60,.88)
for y in (-.40,.40):
    for x in (-.24,.24): box(x,y,.01,.12,.17,.62,"brass",.015)
    for z in (-.29,.31): box(0,y,z,.58,.17,.095,"brass",.015)
for x in (-.23,.23):
    for z in (-.23,.25): box(x,0,z,.083,.86,.097,"patina",.016)
box(0,0,-.22,.44,.84,.06,"steel",.012)
chisel("pipe")

box(0,0,-.454,.69,.99,.092,"slate",.014)
for y in (-.39,-.20,0,.20,.39): box(0,y,-.369,.58,.154,.066,"wood",.007)
for x in (-.36,.36): box(x,0,-.375,.081,1,.135,"steel",.012)
for x in (-.35,.35):
    for y in (-.38,.38): box(x,y,-.301,.048,.07,.021,"brass",.006)
chisel("conveyor")

base(.82,.82)
box(0,0,-.10,.67,.67,.54,"slate")
box(0,.35,-.15,.48,.22,.26,"patina")
box(.35,0,-.15,.22,.48,.26,"copper")
box(0,0,.22,.56,.56,.11,"steel")
gem(0,.09,.30,.20,.20,.11,"light")
chisel("sorter")

base(.9,.85)
box(0,-.02,-.04,.82,.74,.68,"slate")
box(0,.37,-.10,.52,.11,.37,"steel")
for x in (-.15,0,.15): box(x,.44,-.04,.045,.08,.25,"brass")
box(0,0,.32,.64,.61,.12,"copper")
gem(.24,.15,.43,.15,.16,.11,"light")
chisel("furnace")

base(.9,.9)
box(0,0,-.06,.76,.71,.62,"wood")
for x in (-.25,-.12,0,.12,.25):
    box(x,0,.28,.075,.57,.09,"brass" if x else "patina",.01)
box(0,.41,-.05,.54,.10,.22,"steel")
chisel("note")

base(.85,.85)
box(0,0,-.31,.75,.75,.13,"brass")
for x in (-.30,.30):
    for y in (-.30,.30): box(x,y,-.14,.115,.115,.41,"steel")
gem(0,0,-.04,.55,.55,.73)
chisel("crystal")

# Support braces leave a clear path through the travel aperture.
box(0,0,-.46,.91,.63,.075,"slate",.022)
for x in (-.37,.37):
    box(x,0,-.04,.13,.35,.87,"slate",.032)
    box(x,.19,.02,.05,.035,.66,"patina",.005)
    for z in (-.29,.28):
        box(x,0,z,.16,.39,.074,"brass",.018)
box(0,0,.38,.80,.32,.17,"slate",.03)
gem(0,.015,.38,.22,.27,.21,"crystal")
chisel("portal")

# Cart is anchored at wheel contact. Its open center remains visually readable.
box(0,0,.29,.73,.82,.18,"slate")
for y in (-.29,.29):
    for x in (-.41,.41):
        box(x,y,.17,.18,.22,.27,"steel",.03)
for x in (-.36,.36):
    box(x,0,.49,.12,.91,.33,"copper")
    box(x,0,.67,.16,.94,.08,"brass")
for y in (-.43,.43):
    box(0,y,.49,.67,.12,.33,"wood")
    box(0,y,.65,.73,.15,.08,"brass")
gem(0,.52,.45,.20,.15,.17,"light")
chisel("cart")

OUT.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(OUT), export_format="GLB",
                         export_cameras=False, export_lights=False,
                         export_animations=False, export_yup=True)
print("Machinery GLB", OUT.stat().st_size)

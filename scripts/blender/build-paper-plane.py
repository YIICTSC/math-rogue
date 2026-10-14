"""Blender 4.5: folded paper airframes + interchangeable, socket-local modules.
Run node scripts/export-paper-plane-catalog.mjs before this script.
Blender Z-up, nose +X. glTF converts to Y-up, nose remains +X.
"""
import bpy, math, json, os
from pathlib import Path
from mathutils import Vector
ROOT = Path(__file__).resolve().parents[2]
ART = ROOT / 'art/paper-plane'
OUT = ROOT / 'public/models/paper-plane'
OUT.mkdir(parents=True, exist_ok=True)
catalog = json.loads((ART / 'catalog.json').read_text(encoding='utf8'))
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
bpy.context.preferences.filepaths.save_version = 0

def material(name, color, metallic=0, rough=.4, emission=0):
    m = bpy.data.materials.new(name); m.diffuse_color = (*color, 1); m.use_nodes = True
    s = m.node_tree.nodes.get('Principled BSDF')
    s.inputs['Base Color'].default_value = (*color, 1)
    s.inputs['Metallic'].default_value = metallic; s.inputs['Roughness'].default_value = rough
    s.inputs['Emission Color'].default_value = (*color, 1); s.inputs['Emission Strength'].default_value = emission
    return m
paper = material('Paper ivory', (.94,.90,.76), rough=.62)
red = material('Flyer vermilion', (.7,.045,.025), rough=.4)
blue = material('Notebook blue', (.025,.21,.48), rough=.48)
tan = material('Card stock ochre', (.68,.40,.13), rough=.65)
dark = material('Graphite', (.025,.043,.064), .6, .33)
silver = material('Brushed alloy', (.46,.57,.66), .72, .3)
accent = material('ModuleAccent', (.04,.65,.85), .35, .3)
glow = material('EnergyCore', (.02,.58,1), .2, .25, 1.2)
gold = material('UpgradeGold', (.95,.51,.05), .7, .25)
assets = []

def bevel(o, width=.02):
    m = o.modifiers.new('Edge thickness and bevel', 'BEVEL'); m.width=width; m.segments=2
    o.modifiers.new('Weighted corner normals', 'WEIGHTED_NORMAL')
    return o
def mesh(name, vertices, faces, mat, thickness=0):
    # Mirroring a wing reverses its winding. Keep the top faces pointing up
    # so Solidify expands both wings inward and trim remains above the paper.
    faces=[tuple(reversed(f)) if (Vector(vertices[f[1]])-Vector(vertices[f[0]])).cross(Vector(vertices[f[2]])-Vector(vertices[f[0]])).z < 0 else f for f in faces]
    me=bpy.data.meshes.new(name); me.from_pydata(vertices, [], faces); me.update()
    o=bpy.data.objects.new(name, me); bpy.context.collection.objects.link(o); me.materials.append(mat)
    if thickness:
        m=o.modifiers.new('Folded paper thickness','SOLIDIFY'); m.thickness=thickness
    return bevel(o, .012)
def cube(name, loc, size, mat, edge=.025):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc); o=bpy.context.object; o.name=name; o.dimensions=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True); o.data.materials.append(mat)
    return bevel(o,edge)
def cylinder(name, loc, radius, depth, mat, axis='Z', vertices=12):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=depth,location=loc)
    o=bpy.context.object; o.name=name; o.data.materials.append(mat)
    if axis=='X': o.rotation_euler.y=math.pi/2
    for p in o.data.polygons: p.use_smooth=True
    return bevel(o,.012)
def finish(name, before):
    objects=[o for o in bpy.context.scene.objects if o not in before]
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects:o.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]
    bpy.ops.object.convert(target='MESH'); bpy.ops.object.join()
    o=bpy.context.object; o.name=name
    bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
    bpy.context.scene.cursor.location=(0,0,0); bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
    assets.append(o); return o

def hull(name, style, mat):
    before=set(bpy.context.scene.objects)
    span = 1.8 if style=='speed' else 2.35 if style in ['heavy','fortress'] else 2.05
    nose = 3.1 if style=='speed' else 2.7
    tail = -2.35
    # Each wing has folded upper/lower facets: actual paper sheets, not a solid wedge.
    for side in [-1,1]:
        v=[(nose,0,.1),(-.7,side*span,.03),(tail,side*span,.18),(tail,side*.35,.22),(-.9,side*.24,.44)]
        mesh('Main folded wing',v,[(0,1,4),(1,2,3,4)],mat,.045)
        mesh('Folded ivory underside',[(nose-.15,0,.025),(tail,side*.28,.14),(tail,side*(span-.12),.10),(-.8,side*(span-.12),-.025)],[(0,1,2,3)],paper,.025)
        mesh('Raised inner fold',[(nose,0,.11),(tail,0,.72),(tail,side*.38,.22)],[(0,1,2)],mat,.035)
        # Ivory wing-tip stripe follows the wing contour.
        mesh('Wing border',[(nose-.4,side*.18,.14),(-.78,side*(span-.12),.06),(tail+.05,side*(span-.12),.21),(tail+.05,side*(span-.26),.21),(-.78,side*(span-.26),.07)],[(0,1,2,3,4)],paper,.01)
        if style=='speed':
            for i in range(7):
                x=tail+.22+i*.35
                cube('Notebook ruling',(x,side*1.05,.255),(.025,1.2,.014),blue,.002)
        else:
            # Distinctive circular insignia (no borrowed logo).
            cylinder('Wing roundel',(-1.1,side*1.42,.26),.24,.015,paper,vertices=20)
            mesh('Flight chevron',[(-1.25,side*1.42-.12,.28),(-.92,side*1.42,.28),(-1.25,side*1.42+.12,.28),(-1.14,side*1.42,.28)],[(0,1,3),(1,2,3)],mat)
    if style in ['heavy','fortress']:
        for y in [-1.1,1.1]:cube('Reinforced binding',(-1.8,y,.31),(.14,1.6,.08),gold)
    if style in ['interceptor','fortress']:
        for y in [-1.8,1.8]:mesh('Vertical tail fin',[(tail,y,.2),(-1.25,y,.2),(tail,y,1)],[(0,1,2)],mat,.05)
    return finish(name,before)

hull('hull_flyer','standard',red)
hull('hull_notebook','speed',paper)
hull('hull_card','heavy',tan)
for style in ['scout','bomber','interceptor','fortress']:
    hull('enemy_'+style, {'scout':'standard','bomber':'heavy'}.get(style,style),accent)

def module(kind, variant):
    before=set(bpy.context.scene.objects)
    cube('Socket shoe',(0,0,.075),(.64,.58,.15),dark)
    cube('Ceramic housing',(-.06,0,.24),(.52,.49,.25),silver)
    if kind=='cannon':
        count=[1,2,3][variant]
        for i in range(count):
            y=(i-(count-1)/2)*.19
            cylinder('Breech',(.04,y,.4),.14,.3,accent,'X')
            cylinder('Barrel',(.36,y,.4),.085,.52,silver,'X')
            cylinder('Muzzle bore',(.626,y,.4),.060,.014,dark,'X')
        cube('Barrel sight',(-.15,0,.55),(.15,.2,.08),accent)
    elif kind=='missile':
        for y in ([-.16,.16] if variant else [0]):
            cylinder('Rocket body',(.03,y,.4),.115,.67,paper,'X')
            bpy.ops.mesh.primitive_cone_add(vertices=12,radius1=.115,radius2=0,depth=.26,location=(.49,y,.4),rotation=(0,math.pi/2,0))
            bpy.context.object.data.materials.append(accent)
            for s in [-1,1]:mesh('Rocket fin',[(-.3,y,.4),(-.34,y+s*.23,.23),(-.1,y,.4)],[(0,1,2)],accent,.025)
    elif kind=='shield':
        v=[(.12,-.37,.24),(.12,-.37,.7),(.12,0,.9),(.12,.37,.7),(.12,.37,.24),(.12,0,.09)]
        mesh('Shield rim',v,[tuple(range(6))],silver,.08)
        mesh('Shield face',[(x+.05,y*.82,.46+(z-.46)*.8) for x,y,z in v],[tuple(range(6))],glow if variant==0 else accent,.035)
        if variant==2:
            for y in [-.27,0,.27]:
                bpy.ops.mesh.primitive_cone_add(vertices=6,radius1=.07,depth=.2,location=(.3,y,.52),rotation=(0,math.pi/2,0));bpy.context.object.data.materials.append(gold)
    elif kind=='engine':
        for y in ([-.18,.18] if variant==1 else [0]):
            cylinder('Turbine',(-.1,y,.41),.21,.63,silver,'X')
            cylinder('Exhaust lip',(-.43,y,.41),.23,.12,dark,'X')
            cylinder('Energy exhaust',(-.497,y,.41),.16,.018,glow,'X')
            for i in range(3):cube('Cooling fin',(-.24+i*.15,y,.63),(.05,.3,.05),accent)
        if variant==2:mesh('Solar sail',[(-.25,-.38,.68),(.27,-.38,.9),(.27,.38,.9),(-.25,.38,.68)],[(0,1,2,3)],blue,.035)
    else:
        cylinder('Reactor core',(0,0,.46),.18,.58,glow)
        for z in [.22,.7]:cylinder('Reactor cap',(0,0,z),.27,.09,silver)
        for y in [-.22,.22]:cube('Reactor support',(0,y,.46),(.08,.07,.48),accent)
        if variant==1:
            for x in [-.2,.2]:cylinder('Capacitor',(x,0,.5),.08,.57,gold)
        if variant==2:
            cylinder('Antenna',(0,0,.9),.025,.3,silver)
            cylinder('Transmitter',(0,0,1.05),.14,.05,accent)
    return finish('module_'+kind+'_'+str(variant),before)
for kind in ['cannon','missile','shield','engine','amplifier']:
    for variant in range(2 if kind=='missile' else 3):module(kind,variant)

# Export shared meshes at local origin, one library / one request.
bpy.ops.object.select_all(action='DESELECT')
for o in assets:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'fleet.glb'),export_format='GLB',use_selection=True,export_apply=True)

# Editable asset board: move source meshes after export, retaining local socket origins.
for i,o in enumerate(assets):o.location=((i%5)*7,(i//5)*6,0)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24
scene.cycles.use_denoising=True;scene.render.resolution_x=1200;scene.render.resolution_y=800;scene.render.resolution_percentage=100
scene.world.color=(.16,.19,.23)
scene.view_settings.view_transform='AgX'
bpy.ops.object.camera_add(location=(9,-11,13));camera=bpy.context.object;scene.camera=camera;camera.data.type='ORTHO';camera.data.ortho_scale=9
for loc,power,size in [((1,-5,9),1400,7),((-5,0,5),950,6),((3,6,8),1800,5)]:
    bpy.ops.object.light_add(type='AREA',location=loc);light=bpy.context.object;light.data.energy=power;light.data.shape='DISK';light.data.size=size
    light.rotation_euler=(-light.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.wm.save_as_mainfile(filepath=str(ART/'paper-plane.blend'))

# Render the same modular assembly used in game; the library itself remains untouched.
for o in assets:o.hide_render=True
def copy_asset(name,loc=(0,0,0),scale=1):
    src=next(o for o in assets if o.name==name);o=src.copy();o.data=src.data;scene.collection.objects.link(o)
    o.location=loc;o.scale=(scale,)*3;o.hide_render=False;return o
copy_asset('hull_flyer')
for row,col,kind,variant in [(0,2,'cannon',0),(1,0,'engine',1),(1,2,'cannon',1),(2,2,'cannon',0)]:
    x=-1.65+col*.94
    z=.74-(x+2.35)/5.05*.61 if row==1 else .16
    copy_asset(f'module_{kind}_{variant}',(x,(1-row)*1.05,z),.8)
for name,loc in [('perspective',(7,-10,10)),('front',(8,-.1,3.5)),('back',(-8,-.1,4)),('top',(0,-.01,12))]:
    camera.location=loc;camera.rotation_euler=(Vector((-.3,0,.2))-camera.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ART/(name+'.png'));bpy.ops.render.render(write_still=True)
print('PAPER_PLANE_COMPLETE',len(assets),'library assets',os.path.getsize(OUT/'fleet.glb'),'bytes')

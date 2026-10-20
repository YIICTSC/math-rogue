"""Rebuild: blender -b -t 4 --python assets/schoolyard-survivor/generate_blender.py
All shipped weapon, monster, scenery and animated magic sprites are rendered from this scene.
"""
import bpy, math, os, json
from mathutils import Vector
ROOT=os.path.dirname(os.path.abspath(__file__))
OUT=os.path.join(ROOT,'renders'); os.makedirs(OUT,exist_ok=True)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene
scene.render.engine='BLENDER_WORKBENCH'
scene.display.shading.light='STUDIO'
scene.display.shading.studiolight_rotate_z=.5
scene.display.shading.color_type='MATERIAL'
scene.display.shading.show_shadows=True
scene.display.shading.show_cavity=True
scene.display.shading.cavity_type='BOTH'
scene.display.shading.show_specular_highlight=True
scene.render.film_transparent=True
scene.render.image_settings.file_format='PNG'
scene.render.resolution_percentage=100
scene.world.color=(.15,.15,.2)
scene.view_settings.view_transform='Standard'
scene.view_settings.look='None'
materials={}
def mat(color):
    if color not in materials:
        m=bpy.data.materials.new(color); h=color.lstrip('#'); m.diffuse_color=tuple((int(h[i:i+2],16)/255)**2.2 for i in (0,2,4))+(1,); materials[color]=m
    return materials[color]
current=None; origin=(0,0)
def finish(obj,color):
    obj.data.materials.append(mat(color))
    for c in list(obj.users_collection): c.objects.unlink(obj)
    current.objects.link(obj)
    obj.location.x+=origin[0]; obj.location.y+=origin[1]
    return obj
def box(x,y,w,h,color,z=.15,depth=.2,angle=0):
    bpy.ops.mesh.primitive_cube_add(size=1,location=(x,y,z)); o=bpy.context.object; o.scale=(w,h,depth); o.rotation_euler.z=angle
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    b=o.modifiers.new('Soft machined edges','BEVEL'); b.width=.06; b.segments=3
    o.modifiers.new('Weighted normals','WEIGHTED_NORMAL'); return finish(o,color)
def orb(x,y,r,color,z=.3):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,radius=r,location=(x,y,z)); return finish(bpy.context.object,color)
def ring(x,y,r,color,thick=.045,z=.2):
    bpy.ops.mesh.primitive_torus_add(major_segments=48,minor_segments=6,location=(x,y,z),major_radius=r,minor_radius=thick);return finish(bpy.context.object,color)
def line(points,color,width=.045,z=.35):
    c=bpy.data.curves.new('Forged ribbon','CURVE');c.dimensions='3D';c.bevel_depth=width;c.bevel_resolution=2
    s=c.splines.new('POLY');s.points.add(len(points)-1)
    for p,xy in zip(s.points,points):p.co=(xy[0],xy[1],z,1)
    o=bpy.data.objects.new('Ribbon',c);current.objects.link(o);o.data.materials.append(mat(color));o.location.x=origin[0];o.location.y=origin[1];return o
def poly(points,color,z=.3):
    mesh=bpy.data.meshes.new('Enchanted surface');mesh.from_pydata([(x,y,z) for x,y in points],[],[list(range(len(points)))]);mesh.update();o=bpy.data.objects.new('Surface',mesh);current.objects.link(o);o.data.materials.append(mat(color));o.location.x=origin[0];o.location.y=origin[1];return o
def star(x,y,r,color,z=.5):
    return poly([(x+math.cos(i*math.pi/5+math.pi/2)*r*(1 if i%2==0 else .43),y+math.sin(i*math.pi/5+math.pi/2)*r*(1 if i%2==0 else .43)) for i in range(10)],color,z)
WEAPONS='PENCIL ERASER RULER HIGHLIGHTER FLASK RECORDER SOCCER UWABAKI CURRY COMPASS MOP MAGNIFIER STAPLER CUTTER ART_BRUSH GLOBE PROTRACTOR_SWING CHALK_SMOKE SCISSORS TAPE DICTIONARY PAPER_PLANE_S GLUE_STICK HAND_BELL COMPASS_SPIKE WHISTLE_S MAGNET_U TRIANGLE_RULER_S STAPLE_REMOVER JUMP_ROPE PRISM TROWEL LUNCH_TRAY BASKETBALL DUSTER FOUNTAIN_PEN SCHOOL_CHIME TRUMPET CLAY BROADCAST_MIC'.split()
colors=['#ffd164','#78eced','#ff7198','#aa98ff','#77e8b2']
def weapon(k,i):
    c=colors[i%5]; dark='#263653'; white='#f0f6ff';gold='#f9b44e'
    if k in ['PENCIL','HIGHLIGHTER','CUTTER','ART_BRUSH','FOUNTAIN_PEN','GLUE_STICK','RECORDER','MOP','TROWEL','DUSTER','BROADCAST_MIC']:
        box(-.1,0,2.3,.38,c,angle=.55);box(.85,.52,.4,.48,dark,angle=.55)
        poly([(-1.08,-.7),(-1.5,-.95),(-1.32,-.35)],gold)
        if k=='BROADCAST_MIC':orb(.95,.58,.48,dark);ring(.95,.58,.39,c)
        if k in ['MOP','ART_BRUSH','DUSTER']:box(.95,.55,.8,.95,white,angle=.55)
        if k=='TROWEL':poly([(.6,.3),(1.6,.5),(1.4,1.3),(.8,.95)],white)
        if k=='RECORDER':
            for j in range(5):orb(-.7+j*.3,-.4+j*.18,.065,dark,.5)
    elif k in ['RULER','PROTRACTOR_SWING','TRIANGLE_RULER_S','LUNCH_TRAY']:
        if k=='TRIANGLE_RULER_S':poly([(-1.3,-1),(1.3,-1),(-1.3,1.3)],c);poly([(-.9,-.65),(.3,-.65),(-.9,.5)],dark,.35)
        elif k=='PROTRACTOR_SWING':
            line([(math.cos(t*math.pi/24)*1.3,math.sin(t*math.pi/24)*1.3-.5) for t in range(25)],c,.16);box(0,-.5,2.8,.25,c)
        else:
            box(0,0,2.8,.8 if k=='RULER' else 1.7,c)
            for j in range(9):box(-1.15+j*.28,.2,.035,.27,dark,z=.32,depth=.03)
    elif k in ['SOCCER','BASKETBALL','GLOBE','CLAY']:
        orb(0,0,1.1,'#fb9348' if k=='BASKETBALL' else c)
        ring(0,0,1.1,gold,.06,.65)
        if k=='SOCCER':star(0,0,.55,dark,1.45)
        else:
            line([(-1,-.4),(0,-.1),(.8,.6)],dark,.07,1.42);line([(-.6,.9),(-.15,0),(.2,-1)],dark,.06,1.42)
        if k=='GLOBE':box(0,-1.25,1,.16,gold)
    elif k in ['FLASK','CURRY','HAND_BELL','SCHOOL_CHIME','WHISTLE_S','TRUMPET']:
        if k=='FLASK':orb(0,-.25,.85,c);box(0,.75,.5,1,white);box(0,1.2,.8,.2,c);orb(-.35,-.1,.15,white,1)
        elif k in ['HAND_BELL','SCHOOL_CHIME']:
            poly([(-1,-.85),(1,-.85),(.6,.6),(-.6,.6)],gold);box(0,.9,.22,.7,dark);orb(0,-1,.18,c)
            if k=='SCHOOL_CHIME':ring(0,0,1.4,c)
        elif k=='TRUMPET':box(0,0,2,.35,gold);poly([(.7,-.2),(1.5,-.8),(1.5,.8),(.7,.2)],gold);ring(-.4,-.25,.5,gold,.12)
        else:orb(0,0,1,c);orb(.15,.15,.65,gold,.9);box(-1,0,.65,.25,white)
    elif k in ['DICTIONARY','ERASER','STAPLER','UWABAKI','STAPLE_REMOVER']:
        box(0,0,2.2,1.5,c,depth=.55);box(.1,0,1.8,1.2,white,z=.5)
        if k=='DICTIONARY':box(-.85,0,.3,1.55,gold,z=.65);star(.25,0,.38,gold,.7)
        elif k=='ERASER':box(-.6,0,.8,1.55,'#ff7da5',z=.65)
        else:box(.35,0,1.5,.65,dark,z=.68)
    elif k=='PAPER_PLANE_S':
        poly([(-1.4,-1),(1.5,.2),(-.7,1.1),(-.4,.1)],white);poly([(-.4,.1),(1.5,.2),(-.9,-.5)],c,.4)
    elif k in ['COMPASS','COMPASS_SPIKE','SCISSORS']:
        line([(-.9,-1.2),(0,1.1),(.95,-1.2)],white,.13)
        orb(0,.8,.17,gold,.6)
        if k=='SCISSORS':ring(-.65,-.8,.4,c,.14);ring(.65,-.8,.4,c,.14)
    elif k=='MAGNET_U':
        line([(-.8,1),(-.8,-.6),(0,-1),(.8,-.6),(.8,1)],'#ff5c83',.24);box(-.8,1,.5,.45,white);box(.8,1,.5,.45,white)
    elif k in ['TAPE','MAGNIFIER','JUMP_ROPE']:
        ring(0,.25,1,c,.17)
        if k=='MAGNIFIER':box(.9,-.9,1.25,.3,gold,angle=-.8)
        elif k=='JUMP_ROPE':box(-1,-.8,.3,1,gold);box(1,-.8,.3,1,gold)
    elif k=='PRISM':
        poly([(-1.2,-.9),(1.3,-.9),(0,1.4)],'#91edff');poly([(0,1.4),(0,-.9),(1.3,-.9)],'#b9a0ff',.35);line([(-1.2,-.9),(0,1.4),(1.3,-.9),(-1.2,-.9)],white,.04,.4)
    else:
        for j in range(3):box(-.7+j*.7,0,.35,2,c)
        star(0,0,1,gold,.6)
    # Tiny magical satellites establish a shared enchanted-school-tool style.
    star(-1.32,.95,.18,c,.6);star(1.35,-1,.13,gold,.6)

def collection(name):
    c=bpy.data.collections.new(name);scene.collection.children.link(c);return c
current=collection('01 • Forty enchanted school weapons')
for i,k in enumerate(WEAPONS):origin=((i%8)*4,-(i//8)*4);weapon(k,i)
weapon_coll=current
current=collection('02 • Monsters and physical scenery')
props=['BOOK_WISP','INK_EYE','CLOCK_SENTINEL','PRISM_KNIGHT','PLANT_MIMIC','BELL_COLOSSUS','BENCH','TREE','CRATES','CRYSTAL','LAB_PILLAR','VENT']
for i,k in enumerate(props):
    origin=((i%8)*4,-(i//8)*4);c=colors[i%5]
    if i<6:
        if i==0:box(0,0,2,1.4,'#a585ff');box(0,0,.1,1.5,'#ffd164',z=.4);poly([(-1,0),(-1.7,.9),(-1.5,-.6)],'#87f0ea');poly([(1,0),(1.7,.9),(1.5,-.6)],'#87f0ea')
        elif i==1:orb(0,0,1.05,'#38254d');orb(0,.1,.7,'#f081b7',1);orb(0,.1,.28,'#fff5c0',1.7);ring(0,0,1.35,c)
        elif i==2:orb(0,0,1.15,'#f5bf60');orb(0,0,.9,'#283553',.8);line([(0,.7),(0,0),(.5,-.3)],'#eaffff',.08,1.7)
        elif i==3:poly([(-1,-.8),(0,1.5),(1,-.8),(0,-1.3)],'#8ef2ec');poly([(0,-1.3),(0,1.5),(1,-.8)],'#9c80e9',.4);box(0,0,.9,.25,'#1f2847',z=.5)
        elif i==4:orb(0,-.4,.85,'#61a669');ring(0,.25,.95,'#f583a6',.25,.7);orb(0,.25,.65,'#30213e',.8)
        else:poly([(-1.3,-1),(1.3,-1),(.8,.8),(-.8,.8)],'#f5bc57');ring(0,0,1.5,'#ad85ff',.1);box(0,1,.3,.8,'#91e7ee')
        if i!=1:
            for x in [-.35,.35]:orb(x,.2,.14,'#fff6d0',1.3)
        star(1.25,1.1,.18,c)
    elif k=='BENCH':
        for y in [-.5,0,.5]:box(0,y,2.8,.35,'#c39873')
        for x in [-1,1]:box(x,-.9,.25,.8,'#37516a')
    elif k=='TREE':
        box(0,-.85,.45,1.1,'#907454');orb(0,.35,1.1,'#54ad92');orb(-.6,.2,.65,'#74c58b',.8);orb(.6,.5,.65,'#489a8c',.8)
    elif k=='CRATES':
        for x,y in [(-.6,-.5),(.6,-.3),(0,.7)]:box(x,y,1.1,1,'#b28869',depth=.7);line([(x-.4,y-.35),(x+.4,y+.35)],'#eed4a1',.06,.6)
    elif k=='CRYSTAL':
        for x,y,r in [(-.6,-.25,.65),(.5,0,.9),(0,.5,.65)]:poly([(x-r/2,y-r),(x-r/2,y+r/2),(x,y+r),(x+r/2,y+r/2),(x+r/2,y-r)],'#85e6f3');line([(x,y-r),(x,y+r)],'#ecfaff',.04,.5)
    elif k=='LAB_PILLAR':box(0,0,1.8,2.5,'#4a687e',depth=.6);box(0,0,1.3,2,'#74e4d2',z=.5);ring(0,0,.6,'#e3fff8',.08,.7)
    else:box(0,0,2.5,2.1,'#566b85');[box(0,-.75+j*.3,2,.1,'#1e314a',z=.4) for j in range(6)]
prop_coll=current
current=collection('03 • Eight-frame magic flipbooks')
FX=['NOVA','SLASH','RUNE','SPARK','LIGHTNING','PORTAL']
for row,k in enumerate(FX):
    for f in range(8):
        origin=(f*4,-row*4);t=(f+1)/8;r=.3+t*1.25;c=colors[row%5]
        if k in ['NOVA','RUNE','PORTAL']:
            ring(0,0,r,c,.06);ring(0,0,r*.7,'#fff3cf',.035)
            for j in range(8):
                a=j*math.pi/4+t;star(math.cos(a)*r,math.sin(a)*r,.12 if k=='RUNE' else .22,c)
            if k=='PORTAL':ring(0,0,r*.4,'#b8a3ff',.12)
        elif k=='SLASH':
            pts=[(math.cos(a*.15+t)*r,math.sin(a*.15+t)*r) for a in range(-12,10)];line(pts,c,.10);line([(x*.85,y*.85) for x,y in pts],'#fff4dc',.04)
        elif k=='SPARK':
            for j in range(8):
                a=j*math.pi/4;line([(math.cos(a)*r*.4,math.sin(a)*r*.4),(math.cos(a)*r,math.sin(a)*r)],c,.045)
            star(0,0,.5*(1-t)+.1,'#fff4d4')
        else:
            line([(-1.4,-.6),(-.8,.6),(-.2,-.2),(.2,.7),(.7,.1),(1.4,.9)],c,.09);line([(-1.4,-.6),(-.8,.6),(-.2,-.2),(.2,.7),(.7,.1),(1.4,.9)],'#f5ffff',.035,.5)
fx_coll=current
bpy.ops.object.camera_add(location=(0,0,80));camera=bpy.context.object;camera.data.type='ORTHO';scene.camera=camera
# Camera faces straight down. Each 4-unit cell becomes a 128px transparent tile.
def render(coll,rows,name):
    for c in [weapon_coll,prop_coll,fx_coll]:c.hide_render=c!=coll
    camera.location=(14,-(rows-1)*2,80);camera.rotation_euler=(0,0,0);camera.data.ortho_scale=32
    scene.render.resolution_x=1024;scene.render.resolution_y=rows*128;scene.render.filepath=os.path.join(OUT,name+'.png');bpy.ops.render.render(write_still=True)
render(weapon_coll,5,'weapons');render(prop_coll,2,'scenery');render(fx_coll,6,'effects')
for c in [weapon_coll,prop_coll,fx_coll]:c.hide_render=False
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,'schoolyard-survivor.blend'),compress=True)
with open(os.path.join(ROOT,'atlas.json'),'w') as f:json.dump({'cell':128,'columns':8,'weapons':WEAPONS,'scenery':props,'effects':FX,'effectFrames':8},f,indent=2)

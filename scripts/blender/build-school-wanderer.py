"""Original School Wanderer miniature kit. Run with Blender --background --python.
Coordinates below are Three.js Y-up; glTF performs the axis conversion on export.
"""
import bpy, math, os
from mathutils import Vector

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
COLORS = {
    'skin':'f5bc89', 'hair':'493024', 'white':'fff2d6', 'ink':'202738',
    'red':'dc514b', 'blue':'416b9c', 'gold':'eab84d', 'wood':'a97748',
    'green':'68966b', 'mint':'9dcbb2', 'metal':'a4b9be', 'purple':'997db7',
    'pink':'eda5b5', 'water':'51a8be', 'paper':'f5dba5', 'orange':'df8747',
}
MATS = {}
for name, hexcolor in COLORS.items():
    m = bpy.data.materials.new(name)
    rgb = [int(hexcolor[i:i+2],16)/255 for i in (0,2,4)]
    m.diffuse_color = (*[v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in rgb],1)
    m.use_nodes = True
    bsdf=m.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value=m.diffuse_color
    bsdf.inputs['Roughness'].default_value=.76
    MATS[name]=m

roots=[]
def model(name):
    root=bpy.data.objects.new(name,None); bpy.context.collection.objects.link(root)
    roots.append(root); return root

def shape(root, name, pos, size, mat, kind='box', bevel=0):
    x,y,z=pos; w,h,d=size
    if kind=='ball': bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=8,radius=.5,location=(x,-z,y))
    elif kind=='cone': bpy.ops.mesh.primitive_cone_add(vertices=12,radius1=.5,radius2=0,depth=1,location=(x,-z,y))
    elif kind=='cylinder': bpy.ops.mesh.primitive_cylinder_add(vertices=12,radius=.5,depth=1,location=(x,-z,y))
    elif kind=='ring': bpy.ops.mesh.primitive_torus_add(major_segments=16,minor_segments=6,major_radius=.4,minor_radius=.1,location=(x,-z,y))
    else: bpy.ops.mesh.primitive_cube_add(size=1,location=(x,-z,y))
    ob=bpy.context.object; ob.name=root.name+'_'+name; ob.scale=(w,d,h)
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        mod=ob.modifiers.new('Soft miniature edges','BEVEL'); mod.width=bevel; mod.segments=1
        bpy.ops.object.modifier_apply(modifier=mod.name)
    ob.data.materials.append(MATS[mat]); ob.parent=root
    return ob

def box(r,n,p,s,c): return shape(r,n,p,s,c,bevel=.025)
def ball(r,n,p,s,c): return shape(r,n,p,s,c,'ball')
def eyes(r,y,z,spread=.13):
    for x in [-spread,spread]:
        ball(r,'eye_white',(x,y,z),(.13,.17,.06),'white')
        ball(r,'eye',(x,y-.005,z+.025),(.065,.1,.035),'ink')
        ball(r,'glint',(x-.014,y+.025,z+.04),(.025,.03,.015),'white')

def student(name,shirt='white',scarf='red'):
    r=model(name)
    box(r,'body',(0,.68,0),(.43,.42,.27),shirt)
    box(r,'shorts',(0,.40,0),(.40,.19,.26),'blue')
    for x in [-.13,.13]:
        box(r,'leg',(x,.23,0),(.145,.26,.16),'skin')
        box(r,'sock',(x,.13,.01),(.15,.11,.18),'white')
        box(r,'shoe',(x,.065,.065),(.18,.115,.28),'red')
        box(r,'sole',(x,.025,.075),(.19,.04,.29),'white')
    for x in [-.29,.29]:
        ball(r,'sleeve',(x,.77,0),(.19,.22,.24),shirt)
        box(r,'arm',(x,.59,.01),(.13,.26,.15),'skin')
        ball(r,'hand',(x,.46,.02),(.16,.16,.17),'skin')
    ball(r,'head',(0,1.04,.025),(.61,.54,.49),'skin')
    for x in [-.30,.30]: ball(r,'ear',(x,1.04,.025),(.1,.16,.12),'skin')
    ball(r,'hair',(0,1.23,-.02),(.66,.27,.51),'hair')
    for i in range(7):
        x=(i-3)*.082
        tuft=shape(r,'tuft',(x,1.34+(.045 if i%2 else 0),-.005),(.17,.24,.28),'hair','cone')
        tuft.rotation_euler[1]=(i-3)*.12
    box(r,'band',(0,1.18,.215),(.56,.07,.035),scarf)
    eyes(r,1.035,.257)
    ball(r,'nose',(0,.995,.277),(.065,.055,.055),'skin')
    box(r,'smile',(0,.937,.255),(.085,.022,.014),'hair')
    for x in [-.21,.21]: ball(r,'cheek',(x,.96,.244),(.065,.025,.016),'pink')
    box(r,'collar',(0,.85,.15),(.30,.055,.035),scarf)
    shape(r,'scarf',(0,.72,.175),(.12,.25,.035),scarf,'cone')
    box(r,'backpack',(0,.69,-.225),(.38,.39,.20),'ink')
    box(r,'backpack_flap',(0,.79,-.338),(.36,.17,.04),'wood')
    for x in [-.16,.16]: box(r,'strap',(x,.71,.157),(.035,.35,.025),'wood')
    return r

student('hero'); student('friend_heal','mint','pink'); student('friend_guard','blue','gold'); student('friend_fetch','gold','green')
student('teacher','purple','gold'); student('ninja','ink','purple'); student('merchant','green','orange')

# Distinct enemy silhouettes, all with a friendly toy-like face.
for name,color in [('slime','water'),('metal_slime','gold'),('dust','paper')]:
    r=model(name); ball(r,'body',(0,.31,0),(.8,.58,.68),color)
    shape(r,'peak',(0,.57,0),(.29,.29,.28),color,'cone'); eyes(r,.34,.31)
for name,color in [('ghost','white'),('drain','purple'),('fire','orange')]:
    r=model(name); ball(r,'body',(0,.53,0),(.62,.77,.48),color)
    for x in [-.22,0,.22]: shape(r,'tail',(x,.15,0),(.22,.32,.32),color,'cone')
    eyes(r,.64,.235)
r=model('bat'); ball(r,'body',(0,.55,0),(.35,.47,.3),'purple'); eyes(r,.59,.15,.085)
for x in [-.38,.38]:
    wing=shape(r,'wing',(x,.60,0),(.65,.32,.10),'ink','cone'); wing.rotation_euler[1]=math.pi/2
    shape(r,'ear',(x/4,.86,0),(.14,.23,.14),'purple','cone')
r=model('dragon'); ball(r,'body',(0,.43,0),(.64,.67,.62),'green'); ball(r,'head',(0,.85,.15),(.53,.45,.46),'green'); eyes(r,.9,.365)
for x in [-.4,.4]:
    shape(r,'wing',(x,.66,-.13),(.5,.56,.15),'orange','cone')
    shape(r,'horn',(x/2,1.12,.13),(.12,.23,.12),'gold','cone')
shape(r,'tail',(0,.36,-.43),(.2,.65,.2),'green','cone').rotation_euler[0]=math.pi/2
r=model('plant'); shape(r,'pot',(0,.21,0),(.52,.4,.5),'orange','cylinder'); box(r,'stem',(0,.54,0),(.09,.5,.08),'green')
for x in [-.2,.2]: ball(r,'leaf',(x,.61,0),(.48,.16,.3),'green')
ball(r,'flower',(0,.9,0),(.57,.4,.32),'pink'); eyes(r,.91,.16)
r=model('golem'); box(r,'body',(0,.48,0),(.58,.57,.4),'metal'); box(r,'head',(0,.93,0),(.48,.4,.4),'metal'); eyes(r,.96,.21)
for x in [-.40,.40]: box(r,'arm',(x,.5,0),(.2,.62,.24),'wood')
for x in [-.19,.19]: box(r,'foot',(x,.11,.04),(.26,.21,.4),'metal')
for name,color in [('book_enemy','paper'),('test_enemy','white')]:
    r=model(name); box(r,'cover',(0,.5,0),(.6,.8,.22),color); box(r,'spine',(-.28,.5,0),(.06,.83,.25),'red'); eyes(r,.62,.12)
    for y in [.3,.39]: box(r,'line',(0,y,.12),(.36,.025,.012),'blue')
r=model('ball_enemy'); ball(r,'body',(0,.43,0),(.77,.77,.77),'orange'); eyes(r,.52,.35)
box(r,'seam',(0,.42,.38),(.045,.65,.02),'ink')
r=model('clock'); shape(r,'body',(0,.5,0),(.74,.24,.74),'gold','cylinder').rotation_euler[0]=math.pi/2
box(r,'hand',(0,.58,.14),(.035,.3,.035),'ink'); box(r,'hand2',(.10,.48,.14),(.23,.035,.035),'ink')
for name in ['chest','mimic']:
    r=model(name); box(r,'body',(0,.29,0),(.7,.47,.51),'wood'); box(r,'lid',(0,.55,0),(.75,.15,.54),'red')
    box(r,'lock',(0,.36,.27),(.12,.17,.03),'gold')
    if name=='mimic': eyes(r,.5,.28)

# Equipment roots have their origins at the grip / torso attachment point.
r=model('pencil'); shape(r,'shaft',(0,.32,0),(.10,.72,.10),'gold','cylinder'); shape(r,'point',(0,.76,0),(.1,.2,.1),'wood','cone'); shape(r,'lead',(0,.85,0),(.045,.06,.045),'ink','cone'); box(r,'eraser',(0,-.08,0),(.11,.12,.11),'pink')
r=model('ruler'); box(r,'ruler',(0,.34,0),(.16,.87,.05),'wood')
for i in range(10): box(r,'mark',(-.04,i*.075,.029),(.05,.012,.01),'ink')
r=model('bat_item'); shape(r,'grip',(0,.08,0),(.07,.27,.07),'wood','cylinder'); shape(r,'barrel',(0,.5,0),(.16,.6,.16),'metal','cylinder')
r=model('broom'); box(r,'handle',(0,.29,0),(.07,.8,.07),'wood'); box(r,'brush',(0,.76,0),(.35,.3,.12),'gold')
for x in [-.13,-.065,0,.065,.13]:box(r,'bristle',(x,.83,.07),(.015,.2,.01),'wood')
r=model('hammer'); box(r,'handle',(0,.27,0),(.08,.7,.08),'wood'); box(r,'head',(0,.65,0),(.42,.23,.22),'metal')
r=model('shears'); box(r,'blade1',(-.09,.43,0),(.07,.55,.035),'metal'); box(r,'blade2',(.09,.43,0),(.07,.55,.035),'metal')
for x in [-.1,.1]: shape(r,'grip',(x,.07,0),(.19,.04,.22),'red','ring').rotation_euler[0]=math.pi/2
r=model('ladle'); box(r,'handle',(0,.27,0),(.065,.62,.065),'metal'); ball(r,'bowl',(0,.67,.03),(.32,.12,.31),'metal')
r=model('umbrella'); box(r,'handle',(0,.34,0),(.055,.8,.055),'wood'); shape(r,'canopy',(0,.79,0),(.85,.29,.85),'water','cone')
r=model('triangle'); shape(r,'edge',(0,.44,0),(.46,.025,.46),'gold','ring').rotation_euler[0]=math.pi/2; box(r,'grip',(0,.08,0),(.07,.35,.07),'wood')
r=model('shield'); box(r,'plate',(0,.02,0),(.53,.63,.12),'blue'); box(r,'crest',(0,.02,.075),(.19,.27,.04),'gold')
r=model('coat'); box(r,'coat',(0,.62,0),(.48,.58,.32),'white'); box(r,'lapel',(0,.69,.174),(.075,.36,.025),'blue')
r=model('apron'); box(r,'apron',(0,.60,.17),(.44,.52,.04),'mint'); box(r,'pocket',(0,.49,.2),(.24,.16,.025),'white')
r=model('cape'); box(r,'cape',(0,.66,-.22),(.55,.62,.07),'purple')
r=model('helmet'); ball(r,'helmet',(0,1.27,0),(.72,.30,.57),'gold'); box(r,'brim',(0,1.19,.10),(.75,.06,.63),'gold')
r=model('hood'); ball(r,'hood',(0,1.18,-.07),(.74,.48,.63),'paper'); box(r,'hood_front',(0,1.28,.27),(.63,.12,.06),'paper')
r=model('backpack'); box(r,'pack',(0,.7,-.29),(.48,.5,.24),'red'); box(r,'flap',(0,.82,-.42),(.46,.21,.04),'red'); box(r,'buckle',(0,.62,-.445),(.13,.10,.025),'gold')
r=model('badge'); shape(r,'medal',(0,0,0),(.22,.035,.22),'gold','cylinder').rotation_euler[0]=math.pi/2
r=model('ring'); shape(r,'ring',(0,0,0),(.24,.08,.24),'gold','ring'); ball(r,'gem',(0,.065,0),(.11,.11,.12),'water')
r=model('rice'); shape(r,'rice',(0,.20,0),(.5,.45,.4),'white','cone'); box(r,'seaweed',(0,.15,.16),(.19,.24,.07),'ink')
r=model('bottle'); shape(r,'bottle',(0,.25,0),(.34,.44,.34),'mint','cylinder'); box(r,'label',(0,.25,.18),(.22,.20,.025),'paper'); shape(r,'lid',(0,.51,0),(.20,.13,.20),'red','cylinder')
r=model('scroll'); box(r,'paper',(0,.19,0),(.44,.035,.48),'paper')
for z in [-.24,.24]: shape(r,'roll',(0,.20,z),(.10,.52,.10),'wood','cylinder').rotation_euler[1]=math.pi/2
for z in [-.12,0,.12]:box(r,'ink',(0,.215,z),(.26,.01,.02),'red')
r=model('card'); box(r,'card',(0,.28,0),(.38,.52,.045),'purple'); box(r,'face',(0,.28,.03),(.28,.40,.014),'paper'); ball(r,'sigil',(0,.28,.05),(.18,.18,.03),'gold')
r=model('bag'); ball(r,'sack',(0,.28,0),(.5,.49,.4),'paper'); box(r,'tie',(0,.49,0),(.27,.07,.25),'red')
r=model('coin'); shape(r,'coin',(0,.20,0),(.37,.065,.37),'gold','cylinder').rotation_euler[0]=math.pi/2
r=model('key'); box(r,'shaft',(0,.25,0),(.07,.45,.07),'gold'); shape(r,'loop',(0,.54,0),(.26,.05,.26),'gold','ring').rotation_euler[0]=math.pi/2; box(r,'tooth',(.085,.08,0),(.17,.07,.07),'gold')
r=model('trap'); shape(r,'base',(0,.045,0),(.65,.06,.65),'metal','cylinder'); box(r,'red_cross',(0,.09,0),(.44,.025,.09),'red'); box(r,'red_cross2',(0,.09,0),(.09,.025,.44),'red')
r=model('stairs')
for i in range(4): box(r,'step',(0,.06+i*.065,.3-i*.2),(.8,.12+i*.13,.2),'paper')
r=model('desk'); box(r,'top',(0,.64,0),(.82,.09,.56),'wood')
for x in [-.33,.33]:
    for z in [-.20,.20]:box(r,'leg',(x,.3,z),(.06,.6,.06),'metal')
r=model('shelf')
for x in [-.43,.43]:box(r,'side',(x,.6,0),(.08,1.2,.37),'wood')
for y in [.06,.46,.87,1.16]:box(r,'shelf',(0,y,0),(.92,.06,.4),'wood')
for i in range(6):
    for y in [.25,.66,1.04]:box(r,'book',(-.32+i*.13,y,0),(.09,.3,.28),['red','green','blue'][i%3])
r=model('locker');box(r,'body',(0,.65,0),(.78,1.3,.45),'mint');box(r,'door',(0,.65,.24),(.69,1.17,.035),'metal');box(r,'handle',(.23,.6,.275),(.05,.17,.04),'ink')
r=model('tree');shape(r,'trunk',(0,.38,0),(.18,.76,.18),'wood','cylinder');ball(r,'crown',(0,1.03,0),(.9,.88,.8),'green')
r=model('bamboo')
for x in [-.2,.06,.25]:
    shape(r,'stem',(x,.65,0),(.095,1.3,.095),'green','cylinder')
    for y in [.3,.65,1]:shape(r,'joint',(x,y,0),(.115,.045,.115),'mint','cylinder')
ball(r,'leaves',(0,1.25,0),(.9,.23,.4),'green')
r=model('stall'); box(r,'counter',(0,.38,0),(.84,.65,.58),'wood');box(r,'awning',(0,1.12,0),(.98,.12,.85),'red')
for x in [-.4,.4]:box(r,'post',(x,.75,0),(.06,.9,.06),'wood')
r=model('bridge')
for z in [-.4,-.2,0,.2,.4]:box(r,'plank',(0,.055,z),(.96,.11,.18),'wood')

out=os.path.join(ROOT,'public/models/school-wanderer');os.makedirs(out,exist_ok=True)
bpy.ops.export_scene.gltf(filepath=os.path.join(out,'school-wanderer.glb'),export_format='GLB')
# Lay out the editable source as a labeled asset gallery after exporting origin-centered roots.
for i,r in enumerate(roots):r.location=((i%10)*2,(i//10)*2,0)
bpy.context.scene.world.color=(.2,.2,.2)
out=os.path.join(ROOT,'assets/school-wanderer');os.makedirs(out,exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out,'school-wanderer.blend'))
print('SCHOOL_WANDERER_MODELS',len(roots))

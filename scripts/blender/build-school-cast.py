"""Expand the approved compact hero style to the full School Wanderer visual kit.
Preserves hero-quality.glb/.blend. Exports a separate cast/item kit and review galleries.
"""
import bpy, math, os, json
from mathutils import Vector
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'../..'))
# Keep the earlier map props and compatible item attachment origins, then replace actors.
legacy=open(os.path.join(ROOT,'scripts/blender/build-school-wanderer.py'),encoding='utf8').read()
exec(legacy[:legacy.index("out=os.path.join(ROOT,'public/models")],globals())
old_roots={o.name:o for o in bpy.context.scene.objects if o.parent is None and o.type=='EMPTY'}
# Reuse the approved model's PBR/custom-mesh tools without regenerating its outputs.
source=open(os.path.join(ROOT,'scripts/blender/build-school-hero.py'),encoding='utf8').read()
scope={'__file__':os.path.join(ROOT,'scripts/blender/build-school-hero.py')}
prefix=source[:source.index('# Redesign:')].replace("bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)",'')
prefix=prefix.replace("if (CYCLE>=2 or TOY) and (name.startswith('hero_hair') or TOY and ('mouth' in name or 'brow' in name or 'lid' in name)):","if len(points)>2 and name!='triangle_frame':")
exec(prefix,scope)
for ob in [scope['hero']]+list(scope['hero'].children_recursive):bpy.data.objects.remove(ob,do_unlink=True)
group,mesh,box,oval,tube,material= [scope[n] for n in ['group','mesh','box','oval','tube','material']]
M=scope['M']
for n,color in [('enemy_primary','438FD9'),('enemy_accent','73CBCD'),('green','56A783'),('purple','9D70CE'),('paper','F7DBA3'),('wood','AD7444'),('orange','EC9850'),('pink','E790B4'),('water','51B5D0')]:
    M[n]=material(n,color,.45,.55 if n=='enemy_accent' else 0)
# Tools capture the material table in their own globals.
scope['M']=M
def discard(name):
    old=old_roots.pop(name,None)
    if old:
        for ob in list(old.children_recursive):bpy.data.objects.remove(ob,do_unlink=True)
        bpy.data.objects.remove(old,do_unlink=True)
def root(name):discard(name);o=group(name);old_roots[name]=o;return o
for n in ['hero','friend_heal','friend_guard','friend_fetch','teacher','merchant','ninja']:discard(n)

before=set(bpy.context.scene.objects)
bpy.ops.import_scene.gltf(filepath=os.path.join(ROOT,'public/models/school-wanderer/hero-quality.glb'))
imported=set(bpy.context.scene.objects)-before
base=next(o for o in imported if o.name=='hero')
def copy_tree(src,parent=None,prefix=''):
    ob=src.copy()
    if src.type=='MESH':ob.data=src.data.copy()
    ob.name=prefix+src.name;ob.animation_data_clear();bpy.context.collection.objects.link(ob);ob.parent=parent
    for child in src.children:copy_tree(child,ob,prefix)
    return ob
def remove_tree(ob):
    for c in list(ob.children_recursive):bpy.data.objects.remove(c,do_unlink=True)
    bpy.data.objects.remove(ob,do_unlink=True)
def character(name,color,hair):
    r=copy_tree(base,None,name+'_');r.name=name;old_roots[name]=r
    for ob in [o for o in r.children_recursive if o.type=='EMPTY' and '_expression_' in o.name and not o.name.endswith('_neutral')]:remove_tree(ob)
    for ob in list(r.children_recursive):
        if ob.type=='MESH' and '_hair_' in ob.name:remove_tree(ob)
        elif ob.type=='MESH':
            for i,m in enumerate(ob.data.materials):
                key=m.name.split('.')[0]
                if key in ['cloth','red']:
                    cm=M[color] if key=='cloth' else M['gold' if color in ['navy','green'] else 'red']
                    ob.data.materials[i]=cm
    h=next(o for o in r.children_recursive if o.type=='EMPTY' and o.name.endswith('hero_motion_head'))
    for i in range(3):
        x=(i-1)*.15
        tube(name+'_fringe',h,[(x-.02,.21,-.08),(x,.285,.03),(x+.045,.22,.20),(x+.065,.105,.235)],[.097,.108,.086,.003],'hair',12,.58)
    if hair=='bob':
        for side in [-1,1]:tube(name+'_bob',h,[(side*.18,.21,-.08),(side*.30,.1,-.11),(side*.31,-.13,-.07),(side*.25,-.25,-.015)],[.10,.105,.096,.015],'hair',12,.55)
    elif hair=='sport':
        for i in range(3):tube(name+'_crest',h,[((i-1)*.13,.22,-.10),((i-1)*.13+.03,.30,-.05),((i-1)*.13+.12,.32,.02)],[.09,.08,.002],'hair',12,.58)
    else:
        for side in [-1,1]:tube(name+'_side',h,[(side*.17,.2,-.09),(side*.28,.10,-.14),(side*.28,-.10,-.10)],[.10,.10,.015],'hair',12,.58)
    for i in range(4):
        x=(i-1.5)*.12;tube(name+'_backhair',h,[(x*.8,.2,-.11),(x,.1,-.25),(x,-.15,-.20)],[.095,.105,.009],'hair',12,.55)
    return r,h
heal,h=character('friend_heal','green','bob')
box('heal_pouch',heal,(.23,.49,.15),(.16,.16,.09),'cloth',.025)
box('heal_cross',heal,(.23,.49,.204),(.08,.025,.015),'red',.004);box('heal_cross2',heal,(.23,.49,.204),(.025,.08,.015),'red',.004)
guard,h=character('friend_guard','navy','sport')
for x in [-.29,.29]:box('sports_wristband',guard,(x,.435,.05),(.12,.065,.12),'gold',.018)
fetch,h=character('friend_fetch','paper','part')
box('librarian_book',fetch,(.25,.47,.12),(.14,.21,.06),'navy',.012)
box('librarian_pages',fetch,(.25,.47,.157),(.11,.18,.016),'cloth',.006)
teacher,h=character('teacher','navy','part')
for side in [-1,1]:
    tube('teacher_glasses',h,[(side*.094+.057*math.cos(a),.002+.075*math.sin(a),.274)for a in [i*math.pi/8 for i in range(17)]],[.005]*17,'metal',8)
box('teacher_bridge',h,(0,.008,.274),(.08,.013,.017),'metal',.003)
merchant,h=character('merchant','green','part')
box('merchant_apron',merchant,(0,.49,.157),(.27,.24,.02),'paper',.018)
oval('merchant_cap',h,(0,.26,-.01),(.67,.19,.51),'green',24,12)
principal,h=character('principal','purple','part')
principal.scale=(1.12,1.12,1.12)
for ob in principal.children_recursive:
    if ob.type=='MESH' and 'backhair' in ob.name:
        for i in range(len(ob.data.materials)):ob.data.materials[i]=M['metal']
for side in [-1,1]:tube('principal_moustache',h,[(0,-.09,.285),(side*.068,-.096,.278),(side*.11,-.06,.267)],[.021,.022,.002],'metal',10)
box('principal_medal',principal,(0,.61,.171),(.14,.09,.027),'gold',.019)
ninja,h=character('ninja','leather','sport')
box('ninja_mask',h,(0,-.125,.226),(.42,.13,.05),'navy',.03)
mage,h=character('mage','purple','part')
tube('mage_hat',h,[(0,.23,0),(0,.32,0),(.04,.46,0),(.16,.52,.015)],[.29,.22,.12,.008],'purple',16)
bully,h=character('school_bully','orange','sport');bully.scale=(1.10,1.1,1.1)
for ob in list(imported):
    if ob.name in bpy.data.objects:bpy.data.objects.remove(ob,do_unlink=True)

def eyes(r,y,z,spread=.13,angry=False):
    for side in [-1,1]:
        oval(r.name+'_eye',r,(side*spread,y,z),(.052,.11,.026),'ink',16,10)
        tube(r.name+'_brow',r,[(side*spread-.036,y+.09,z-.005),(side*spread,y+.105,z+.01),(side*spread+.036,y+.09,z-.005)],[.004,.007,.004],'ink',8)
def mouth(r,y,z):tube(r.name+'_smile',r,[(-.047,y+.008,z),(0,y,z+.008),(.047,y+.008,z)],[.004,.005,.004],'mouth',8)
P='enemy_primary';A='enemy_accent'
# Each monster family has its own closed custom body and limb silhouette.
for name in ['slime','metal_slime']:
    r=root(name);oval('slime_body',r,(0,.28,0),(.69,.44,.59),P,24,16)
    tube('slime_droplet',r,[(0,.36,0),(-.035,.53,0),(.03,.64,.015)],[.16,.094,.002],P,12)
    for side in [-1,1]:oval('slime_foot',r,(side*.245,.09,.10),(.22,.11,.25),A,20,12)
    eyes(r,.32,.282);mouth(r,.218,.298)
    if name=='metal_slime':box('metal_crest',r,(0,.21,.305),(.13,.08,.025),'metal',.018)
for name in ['ghost','detention_ghost']:
    r=root(name);oval('ghost_body',r,(0,.57,0),(.57,.58,.43),P,24,16)
    for i in range(4):tube('ghost_tail',r,[((i-1.5)*.10,.37,.00),((i-1.5)*.12,.24,.03),((i-1.5)*.12,.15,.08)],[.075,.07,.002],P,10)
    for side in [-1,1]:tube('ghost_arm',r,[(side*.20,.56,0),(side*.35,.52,.02),(side*.39,.63,.04)],[.08,.066,.005],A,12)
    eyes(r,.60,.22);mouth(r,.49,.223)
    if name=='detention_ghost':box('detention_note',r,(0,.35,.17),(.26,.17,.025),'paper',.009)
r=root('bat');oval('bat_body',r,(0,.48,0),(.33,.39,.28),P,24,16);eyes(r,.52,.145,.08)
for side in [-1,1]:
    tube('bat_ear',r,[(side*.094,.59,-.02),(side*.108,.73,0),(side*.145,.80,.02)],[.073,.058,.002],P,12)
    vv=[(side*.12,.50,0),(side*.27,.72,0),(side*.64,.62,0),(side*.52,.40,0),(side*.34,.44,0),(side*.23,.32,0)]
    ob=mesh('bat_wing',r,vv,[(0,1,2,3,4,5)],A);mod=ob.modifiers.new('Wing membrane','SOLIDIFY');mod.thickness=.024;bpy.context.view_layer.objects.active=ob;bpy.ops.object.modifier_apply(modifier=mod.name)
    for i in [1,2,4]:tube('wing_finger',r,[vv[0],vv[i]],[.014,.006],P,8)
r=root('dragon');oval('dragon_belly',r,(0,.40,0),(.66,.61,.54),P,24,16);oval('dragon_muzzle',r,(0,.85,.15),(.48,.35,.42),P,24,16)
oval('dragon_chest',r,(0,.40,.237),(.32,.38,.064),A,20,12);eyes(r,.90,.348,.11);mouth(r,.78,.36)
for side in [-1,1]:
    oval('dragon_foot',r,(side*.24,.10,.15),(.27,.15,.30),A)
    tube('dragon_horn',r,[(side*.17,1.00,.13),(side*.19,1.13,.12),(side*.15,1.20,.14)],[.055,.031,.002],'gold',12)
    ob=mesh('dragon_wing',r,[(side*.24,.57,-.1),(side*.50,.91,-.15),(side*.70,.63,-.10),(side*.52,.42,-.09)],[(0,1,2,3)],A);mod=ob.modifiers.new('Wing thickness','SOLIDIFY');mod.thickness=.035;bpy.context.view_layer.objects.active=ob;bpy.ops.object.modifier_apply(modifier=mod.name)
tube('dragon_tail',r,[(0,.34,-.21),(0,.23,-.43),(.13,.29,-.61),(.18,.41,-.69)],[.16,.12,.065,.005],P,12)
r=root('plant');oval('plant_body',r,(0,.42,0),(.56,.66,.42),P,24,16)
for side in [-1,1]:tube('plant_leaf',r,[(side*.14,.53,0),(side*.39,.65,0),(side*.47,.56,.01)],[.07,.12,.002],A,12,.38)
for i in range(5):a=i*math.pi*2/5;oval('plant_petal',r,(.21*math.cos(a),.96+.18*math.sin(a),0),(.27,.25,.09),A)
oval('plant_face',r,(0,.96,.07),(.35,.33,.13),P);eyes(r,.98,.136,.08)
r=root('sprout');oval('sprout_seed',r,(0,.25,0),(.40,.40,.36),P,24,16);eyes(r,.29,.179,.083)
tube('sprout_stem',r,[(0,.4,0),(0,.6,0),(.02,.75,0)],[.033,.031,.008],A,10)
for side in [-1,1]:tube('sprout_leaf',r,[(0,.65,0),(side*.22,.75,0),(side*.31,.67,0)],[.025,.10,.003],A,12,.32)
r=root('thief');oval('walrus_body',r,(0,.35,0),(.68,.62,.57),P,24,16);oval('walrus_muzzle',r,(0,.47,.244),(.42,.20,.16),A,24,12);eyes(r,.59,.262,.12)
for side in [-1,1]:
    oval('walrus_flipper',r,(side*.31,.11,.035),(.23,.11,.39),P)
    tube('walrus_tusk',r,[(side*.10,.47,.324),(side*.10,.31,.34),(side*.074,.23,.33)],[.025,.023,.003],'cloth',12)
r=root('drain');oval('zombie_head',r,(0,.75,0),(.50,.43,.39),P,24,16);box('zombie_body',r,(0,.40,0),(.42,.42,.28),A,.065);eyes(r,.77,.198,.106)
for side in [-1,1]:
    tube('zombie_arm',r,[(side*.2,.52,0),(side*.31,.43,.03),(side*.37,.42,.14)],[.067,.067,.034],P,12)
    box('zombie_foot',r,(side*.14,.10,.05),(.17,.20,.27),P,.035)
box('zombie_patch',r,(.13,.38,.154),(.12,.13,.035),'paper',.012)
r=root('golem');oval('anatomy_skull',r,(0,.92,0),(.48,.40,.38),P,24,16);box('anatomy_torso',r,(0,.55,0),(.45,.48,.30),P,.065);eyes(r,.95,.198,.106)
for y in [.42,.51,.60,.69]:tube('anatomy_rib',r,[(-.16,y,.16),(0,y-.036,.199),(.16,y,.16)],[.014,.014,.014],A,10)
for side in [-1,1]:
    tube('anatomy_arm',r,[(side*.25,.70,0),(side*.32,.48,0),(side*.32,.35,.06)],[.063,.052,.045],P,12)
    tube('anatomy_leg',r,[(side*.13,.33,0),(side*.13,.18,0),(side*.16,.05,.06)],[.060,.052,.045],P,12)
for name in ['book_enemy','test_enemy','paper_enemy','seal_enemy']:
    r=root(name);box('book_cover',r,(0,.49,0),(.57,.65,.21),P,.05);box('book_pages',r,(0,.49,.119),(.48,.55,.036),'paper',.02)
    if name=='seal_enemy':oval('seal_badge',r,(0,.25,.16),(.18,.16,.03),A)
    for side in [-1,1]:oval('book_foot',r,(side*.18,.10,.05),(.20,.13,.28),A)
    eyes(r,.57,.158,.102);mouth(r,.44,.16)
    if name=='paper_enemy':tube('paper_fold',r,[(-.20,.82,0),(-.06,.94,.03),(.08,.83,0)],[.055,.033,.008],A,10)
for name in ['mimic','pencil_case_enemy']:
    r=root(name);box('chest_body',r,(0,.28,0),(.65,.44,.44),P,.06);box('chest_lid',r,(0,.54,-.025),(.70,.14,.48),A,.035)
    eyes(r,.42,.233,.14)
    for x in [-.22,-.11,0,.11,.22]:box('chest_tooth',r,(x,.53,.22),(.058,.055,.025),'cloth',.008)
    box('chest_lock',r,(0,.20,.233),(.11,.11,.03),'gold',.014)
    if name=='pencil_case_enemy':box('pencil_case_zip',r,(0,.63,0),(.56,.026,.04),'metal',.008)
r=root('eraser_enemy');box('eraser_body',r,(0,.42,0),(.57,.54,.34),P,.08);box('eraser_sleeve',r,(0,.38,0),(.61,.27,.365),A,.035);eyes(r,.59,.176,.12)
for side in [-1,1]:oval('eraser_foot',r,(side*.18,.08,.07),(.22,.12,.23),P)
r=root('rice_enemy')
v=[];profiles=[(.05,.12,.08),(.10,.29,.14),(.24,.30,.17),(.43,.20,.16),(.57,.09,.10),(.62,.02,.03)]
for y,w,d in profiles:
    for i in range(16):a=i*math.pi/8;v.append((w*math.cos(a),y,d*math.sin(a)))
f=[(j*16+i,j*16+(i+1)%16,(j+1)*16+(i+1)%16,(j+1)*16+i)for j in range(5)for i in range(16)]+[tuple(range(15,-1,-1)),tuple(range(80,96))]
mesh('rice_triangle',r,v,f,P,1);box('rice_seaweed',r,(0,.22,.177),(.19,.23,.03),A,.023);eyes(r,.44,.185,.09)
r=root('ball_enemy');oval('ball_body',r,(0,.40,0),(.68,.68,.68),P,24,16);eyes(r,.49,.31,.13)
for x in [-.21,0,.21]:tube('ball_seam',r,[(x,.14,.20),(x,.39,.335),(x,.65,.19)],[.006]*3,A,8)
r=root('clock');oval('clock_frame',r,(0,.50,0),(.74,.74,.20),P,24,16);oval('clock_face',r,(0,.50,.105),(.61,.61,.015),'paper',24,16)
box('clock_hand',r,(0,.58,.12),(.025,.22,.014),'ink',.004);box('clock_hand2',r,(.08,.48,.12),(.16,.025,.014),'ink',.004)
for side in [-1,1]:oval('clock_bell',r,(side*.24,.87,0),(.24,.14,.22),A)
r=root('dust');
for i in range(7):a=i*math.pi*2/7;oval('dust_lobe',r,(.19*math.cos(a),.28+.11*math.sin(a),.04*math.sin(a)),(.34,.33,.32),P)
eyes(r,.34,.20,.11)
r=root('fire');
for i in range(4):x=(i-1.5)*.105;tube('flame',r,[(x,.18,0),(x,.40,.01),(x+.07,.65+(i%2)*.10,.0)],[.12,.11,.002],P,12)
oval('flame_core',r,(0,.31,.14),(.35,.33,.20),A);eyes(r,.35,.244,.08)
r=root('umbrella_enemy');tube('umbrella_ghost_pole',r,[(0,.13,0),(0,.42,0),(0,.73,0)],[.041,.040,.03],A,12)
vv=[(0,.96,0)]+[(.42*math.cos(i*math.pi/6),.71,.42*math.sin(i*math.pi/6))for i in range(12)]
mesh('umbrella_ghost_canopy',r,vv,[(0,1+i,1+(i+1)%12)for i in range(12)],P,1);oval('umbrella_ghost_face',r,(0,.79,.29),(.29,.17,.14),P,20,12);eyes(r,.81,.365,.09)
r=root('mud_boot');box('boot_toe',r,(0,.13,.12),(.46,.25,.61),P,.09);box('boot_shaft',r,(0,.44,-.05),(.36,.54,.35),P,.06);box('boot_cuff',r,(0,.70,-.05),(.40,.08,.40),A,.025);eyes(r,.47,.135,.10)

# Upgrade every retained item/map mesh: stable normals, rounded silhouettes and PBR.
for r in old_roots.values():
    for ob in r.children_recursive:
        if ob.type!='MESH':continue
        if ob.name.startswith(('friend_','teacher_','principal_','merchant_','ninja_','mage_','school_bully_')):continue
        for p in ob.data.polygons:p.use_smooth=True
        for i,mat in enumerate(ob.data.materials):
            key=mat.name.split('.')[0]
            if key in M:ob.data.materials[i]=M[key]
        if ob.name.startswith(('ruler_','bat_item_','hammer_','broom_','shears_','ladle_','backpack_','shield_','coat_','apron_','cape_','helmet_','hood_','scroll_','card_','bottle_','key_')):
            mod=ob.modifiers.new('Item soft edge','BEVEL');mod.width=.009;mod.segments=2;mod.affect='EDGES'
            bpy.context.view_layer.objects.active=ob;bpy.ops.object.modifier_apply(modifier=mod.name)
            mod=ob.modifiers.new('Item normal weighting','WEIGHTED_NORMAL');bpy.ops.object.modifier_apply(modifier=mod.name)
# Correct the ruler/compass family to a triangular outline instead of a torus.
r=root('triangle')
for pts in [[(-.23,.23,0),(.23,.23,0),(.23,.66,0),(-.23,.23,0)]]:tube('triangle_frame',r,pts,[.028]*4,'gold',10)
for y in [.3,.4,.5,.6]:box('triangle_mark',r,(.224,y,.034),(.035,.013,.014),'ink',.004)
# Rounded rice silhouette and a clearly rolled scroll; retain established grip origins.
r=root('rice');mesh('rice_body',r,[(-.25,0,-.12),(.25,0,-.12),(0,.47,-.12),(-.25,0,.12),(.25,0,.12),(0,.47,.12)],[(0,2,1),(3,4,5),(0,1,4,3),(1,2,5,4),(2,0,3,5)],'cloth',2);box('rice_wrap',r,(0,.13,.15),(.17,.18,.035),'leather',.015)
r=root('bottle');tube('bottle_body',r,[(0,.04,0),(0,.13,0),(0,.32,0),(0,.39,0),(0,.48,0)],[.10,.15,.15,.075,.073],'water',20);box('bottle_lid',r,(0,.49,0),(.17,.08,.17),'gold',.025);box('bottle_label',r,(0,.24,.145),(.20,.15,.016),'paper',.018)

# School supplies retain meaningful silhouettes instead of sharing one bottle/sword.
r=root('compass');
for side in [-1,1]:tube('compass_leg',r,[(0,.66,0),(side*.12,.36,0),(side*.22,.045,0)],[.026,.024,.007],'metal',10)
oval('compass_hinge',r,(0,.66,0),(.105,.105,.065),'gold');box('compass_handle',r,(0,.77,0),(.05,.16,.05),'navy',.012)
r=root('protractor');tube('protractor_arc',r,[(.24*math.cos(i*math.pi/16),.28+.24*math.sin(i*math.pi/16),0)for i in range(17)],[.028]*17,'gold',10);box('protractor_base',r,(0,.28,0),(.53,.04,.045),'gold',.009);box('protractor_grip',r,(0,.09,0),(.055,.32,.055),'navy',.012)
r=root('extinguisher');tube('extinguisher_tank',r,[(0,.06,0),(0,.20,0),(0,.42,0),(0,.51,0)],[.08,.13,.13,.07],'red',16);box('extinguisher_handle',r,(0,.58,0),(.21,.065,.06),'metal',.014);tube('extinguisher_hose',r,[(.08,.56,0),(.22,.47,0),(.24,.25,.05)],[.023]*3,'leather',10)
r=root('pickaxe');box('pick_handle',r,(0,.25,0),(.07,.66,.07),'wood',.016);tube('pick_head',r,[(-.27,.57,0),(-.15,.65,0),(.10,.65,0),(.29,.58,0)],[.01,.059,.059,.01],'metal',12)
r=root('blade');box('blade_grip',r,(0,.07,0),(.085,.23,.08),'red',.02);box('blade_guard',r,(0,.21,0),(.23,.055,.1),'metal',.014);ob=mesh('blade_edge',r,[(-.06,.23,-.025),(.06,.23,-.025),(.04,.69,-.025),(0,.81,-.025),(-.06,.23,.025),(.06,.23,.025),(.04,.69,.025),(0,.81,.025)],[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],'metal');mod=ob.modifiers.new('Blade bevel','BEVEL');mod.width=.008;mod.segments=2;bpy.context.view_layer.objects.active=ob;bpy.ops.object.modifier_apply(modifier=mod.name)
r=root('watch');oval('watch_case',r,(0,.33,0),(.31,.36,.12),'gold',24,16);oval('watch_face',r,(0,.33,.07),(.25,.30,.02),'paper',24,16);box('watch_hand',r,(0,.37,.09),(.013,.11,.015),'ink',.003);box('watch_strap',r,(0,.33,-.03),(.15,.72,.055),'leather',.025)
r=root('grass');
for i in range(3):x=(i-1)*.10;tube('grass_leaf',r,[(0,.04,0),(x,.25,0),(x*1.8,.48-(i%2)*.08,.025)],[.031,.075,.002],'green',12,.36)
r=root('meat');oval('meat_roast',r,(0,.22,0),(.41,.32,.32),'orange',24,16);box('meat_bone',r,(0,.16,0),(.65,.07,.07),'cloth',.017)
r=root('bomb');oval('bomb_shell',r,(0,.23,0),(.40,.40,.40),'leather',24,16);tube('bomb_fuse',r,[(0,.4,0),(0,.52,0),(.07,.57,0)],[.022]*3,'wood',10);oval('bomb_tip',r,(.08,.57,0),(.055,.055,.055),'gold')
r=root('chalk');
for i in range(3):tube('chalk_stick',r,[((i-1)*.09,.035,0),((i-1)*.10,.37,.03)],[.028,.028],'cloth',12)
r=root('stone');oval('smooth_stone',r,(0,.13,0),(.35,.25,.31),'metal',24,16)
r=root('paper_plane');ob=mesh('folded_plane',r,[(0,.12,.30),(-.32,.02,-.18),(0,.08,-.10),(.32,.02,-.18),(0,.24,-.18)],[(0,1,2),(0,2,3),(0,4,2)],'paper');mod=ob.modifiers.new('Paper thickness','SOLIDIFY');mod.thickness=.012;bpy.context.view_layer.objects.active=ob;bpy.ops.object.modifier_apply(modifier=mod.name)
r=root('pot');tube('pot_body',r,[(0,.03,0),(0,.16,0),(0,.36,0),(0,.45,0)],[.12,.19,.18,.10],'orange',24);tube('pot_rim',r,[(.11*math.cos(i*math.pi/12),.455,.11*math.sin(i*math.pi/12))for i in range(25)],[.016]*25,'gold',10)
r=root('magnifier');tube('lens_ring',r,[(.13*math.cos(i*math.pi/12),.42+.13*math.sin(i*math.pi/12),0)for i in range(25)],[.023]*25,'gold',10);oval('lens_glass',r,(0,.42,0),(.24,.24,.018),'water',24,12);box('lens_handle',r,(0,.15,0),(.055,.33,.055),'wood',.016)
r=root('whistle');box('whistle_body',r,(0,.20,0),(.22,.17,.23),'gold',.04);box('whistle_spout',r,(0,.2,.17),(.10,.06,.19),'gold',.013);box('whistle_slot',r,(0,.29,.05),(.065,.012,.04),'ink',.003)
r=root('float');tube('float_ring',r,[(.25*math.cos(i*math.pi/12),.1,.25*math.sin(i*math.pi/12))for i in range(25)],[.065]*25,'orange',12)
r=root('toolbox');box('toolbox_case',r,(0,.2,0),(.43,.30,.28),'navy',.035);box('toolbox_lid',r,(0,.36,0),(.45,.065,.30),'red',.018);tube('toolbox_handle',r,[(-.07,.39,0),(-.07,.46,0),(.07,.46,0),(.07,.39,0)],[.018]*4,'metal',10)

# Retain rigid animation pivots; batch only within a pivot/material pair.
palettes=json.load(open(os.path.join(ROOT,'src/components/school-dungeon/three/enemy-palettes.json')))
actors=set(palettes)|{'friend_heal','friend_guard','friend_fetch'}
rigs={}
bpy.context.view_layer.update()
for r in old_roots.values():
    if r.name in palettes:
        colors=palettes[r.name]
        primary=material('enemy_primary_'+r.name,colors[0][1:],.32,.8 if r.name=='metal_slime' else 0)
        accent=material('enemy_accent_'+r.name,colors[1][1:],.40,0)
        for ob in r.children_recursive:
            if ob.type=='MESH':
                for i,m in enumerate(ob.data.materials):
                    if m.name.split('.')[0]=='enemy_primary':ob.data.materials[i]=primary
                    elif m.name.split('.')[0]=='enemy_accent':ob.data.materials[i]=accent
    if r.name in actors:
        # Characters retain the approved hero's shoulder/knee/head pivots.
        pivots=[o for o in r.children_recursive if o.type=='EMPTY' and '_motion_' in o.name]
        if not pivots:
            body=group(r.name+'_motion_body',r);pivots=[body]
            for ob in list(r.children):
                if ob.type!='MESH':continue
                original=ob.matrix_world.copy();name=ob.name
                part=next((p for p in ['wing','arm','foot','flipper','tail','leaf'] if p in name),None)
                if part or name.startswith('wing_finger'):
                    part=part or 'wing';center=sum((v.co for v in ob.data.vertices),Vector())/len(ob.data.vertices)
                    side='left' if center.x<0 else 'right'
                    pname=r.name+'_motion_'+part+'_'+side
                    pivot=next((p for p in pivots if p.name==pname),None)
                    if pivot is None:
                        pivot=group(pname,body);pivot.location=scope['xyz'](((-.16 if side=='left' else .16) if part!='tail' else 0,.12 if part in ['foot','flipper'] else .48,-.2 if part=='tail' else 0));pivots.append(pivot)
                    ob.parent=pivot
                else:ob.parent=body
                bpy.context.view_layer.update();ob.matrix_world=original
        else:
            body=next(o for o in pivots if o.name.endswith('_motion_body'))
            # Role props must follow the torso instead of remaining static.
            for ob in list(r.children):
                if ob.type=='MESH':original=ob.matrix_world.copy();ob.parent=body;ob.matrix_world=original
        rigs[r.name]=pivots
    meshes=[o for o in r.children_recursive if o.type=='MESH'];groups={}
    for ob in meshes:
        parent=ob.parent if r.name in actors else r
        transform=parent.matrix_world.inverted()@ob.matrix_world;ob.data.transform(transform);ob.parent=parent;ob.matrix_basis.identity()
        groups.setdefault((parent,ob.data.materials[0]),[]).append(ob)
    for (parent,mat),obs in groups.items():
        bpy.ops.object.select_all(action='DESELECT')
        for ob in obs:ob.select_set(True)
        bpy.context.view_layer.objects.active=obs[0];bpy.ops.object.join();obs[0].name=parent.name+'_'+mat.name.split('.')[0]
    for ob in list(r.children_recursive):
        if ob.type=='EMPTY' and r.name not in actors:bpy.data.objects.remove(ob,do_unlink=True)
    r.location=(0,0,0);r.rotation_euler=(0,0,0);r.scale=(1,1,1)

# Named glTF clips use independent rigid parts: feet stride, wings flap, tails sway.
bpy.context.scene.render.fps=30
for name,pivots in rigs.items():
    for ob in pivots:
        rotation=ob.matrix_basis.to_euler('XYZ');ob.rotation_mode='XYZ';ob.rotation_euler=rotation
    rest={o:(o.location.copy(),o.rotation_euler.copy())for o in pivots}
    for action,length in [('Idle',60),('Walk',24),('Attack',18),('Hit',15)]:
        clip=name+'_'+action
        for frame in range(0,length+1,3):
            t=frame/length;wave=math.sin(t*math.pi*2);pulse=math.sin(t*math.pi)
            for ob in pivots:
                loc,rot=rest[ob];ob.location=loc;ob.rotation_euler=rot
                part=ob.name.split('_motion_')[-1];side=-1 if ('left' in part or part.endswith('_l')) else 1
                if part=='body':
                    ob.location.z+=abs(wave)*(.025 if action=='Walk' else .007) if action in ['Idle','Walk'] else pulse*(.04 if action=='Attack' else -.035)
                    if action=='Attack':ob.location.y-=pulse*.15;ob.rotation_euler.x=pulse*.16
                    if action=='Hit':ob.location.y+=pulse*.08;ob.rotation_euler.x=-pulse*.2
                elif any(p in part for p in ['arm','leg','foot','flipper','wing','tail','leaf']):
                    if 'wing' in part:ob.rotation_euler.y=side*wave*(.32 if action=='Idle' else .65)
                    elif 'tail' in part or 'leaf' in part:ob.rotation_euler.z=wave*.18
                    elif action=='Walk':ob.rotation_euler.x=side*wave*.50
                    elif action=='Attack' and 'arm' in part:ob.rotation_euler.x=-pulse*1.05
                ob.keyframe_insert(data_path='location',frame=frame);ob.keyframe_insert(data_path='rotation_euler',frame=frame)
        for ob in pivots:
            data=ob.animation_data;data.action.name=clip+'_'+ob.name
            track=data.nla_tracks.new();track.name=clip;track.strips.new(clip,0,data.action);data.action=None
    for ob,(loc,rot)in rest.items():ob.location=loc;ob.rotation_euler=rot
out=os.path.join(ROOT,'public/models/school-wanderer/cast-quality.glb')
bpy.ops.object.select_all(action='SELECT');bpy.ops.export_scene.gltf(filepath=out,export_format='GLB',export_animations=True,export_animation_mode='NLA_TRACKS',export_force_sampling=True)
for pivots in rigs.values():
    for ob in pivots:
        for track in ob.animation_data.nla_tracks:track.mute=True

# Render a consistent asset gallery; four level palettes are also demonstrated.
scene=bpy.context.scene;scene.render.engine='BLENDER_EEVEE_NEXT';scene.render.resolution_x=1400;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.world.color=(.06,.07,.08);scene.view_settings.view_transform='AgX'
for i,r in enumerate(old_roots.values()):r.location=(100+i*3,0,0)
def light(name,pos,power,size):
    data=bpy.data.lights.new(name,'AREA');data.energy=power;data.size=size;ob=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(ob);ob.location=scope['xyz'](pos);ob.rotation_euler=(Vector(scope['xyz']((0,.5,0)))-ob.location).to_track_quat('-Z','Y').to_euler()
light('Gallery key',(-4,6,5),700,5);light('Gallery fill',(4,3,3),350,4);light('Gallery rim',(2,5,-4),500,4)
data=bpy.data.cameras.new('Gallery');camera=bpy.data.objects.new('Gallery',data);bpy.context.collection.objects.link(camera);scene.camera=camera;data.type='ORTHO'
review=os.path.join(ROOT,'assets/school-wanderer/cast-quality');os.makedirs(review,exist_ok=True)
def gallery(name,names,cols=5):
    for i,r in enumerate(old_roots.values()):r.location=(100+i*3,0,0)
    rows=math.ceil(len(names)/cols)
    for i,n in enumerate(names):old_roots[n].location=scope['xyz'](((i%cols-(cols-1)/2)*1.7,0,(i//cols-(rows-1)/2)*2))
    data.ortho_scale=max(cols*1.7,rows*2.35);camera.location=scope['xyz']((0,7,8));camera.rotation_euler=(Vector(scope['xyz']((0,.45,0)))-camera.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=os.path.join(review,name+'.png');bpy.ops.render.render(write_still=True)
gallery('characters',['friend_heal','friend_guard','friend_fetch','merchant','teacher','principal','ninja','mage','school_bully'],5)
enemies=['slime','bat','ghost','thief','drain','dragon','plant','golem','book_enemy','mimic','eraser_enemy','rice_enemy','fire','dust','clock','paper_enemy','seal_enemy','pencil_case_enemy','detention_ghost','mud_boot','umbrella_enemy','sprout','metal_slime','test_enemy','ball_enemy']
gallery('enemies',enemies,6)
items=[n for n in old_roots if n not in enemies and n not in ['friend_heal','friend_guard','friend_fetch','merchant','teacher','principal','ninja','mage','school_bully']]
gallery('items',items,7)
for i,r in enumerate(old_roots.values()):r.location=((i%9)*2.3,(i//9)*2.3,0)
stats={'models':sorted(old_roots),'count':len(old_roots),'glb_bytes':os.path.getsize(out),'enemy_models':enemies,'item_and_map_models':items,'animated_models':sorted(rigs),'clips_per_actor':['Idle','Walk','Attack','Hit'],'palettes':palettes}
with open(os.path.join(review,'manifest.json'),'w')as f:json.dump(stats,f,indent=2)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(review,'cast-quality.blend'))
print('SCHOOL_CAST_QUALITY',len(old_roots),os.path.getsize(out))

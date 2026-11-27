"""Original jointed voxel fauna for the ranch and home. Units are world meters."""
import math
import os
from pathlib import Path
import sys
import bmesh
import bpy
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = Path(os.environ.get("RPG_CREATURE_GLB", ROOT / "public/models/storybook/rpg-creatures.glb"))
SHEETS = Path(os.environ.get("RPG_CREATURE_SHEETS", "/dev/shm/rpg-creature-renders"))
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)

# The colors are the authored palette. Vertex colors share one material across the library.
def linear(value):
    return value / 12.92 if value < .04045 else ((value + .055) / 1.055) ** 2.4

def rgba(hex_color):
    return tuple(linear(int(hex_color[i:i + 2], 16) / 255) for i in (0, 2, 4)) + (1,)

material = bpy.data.materials.new("Creature palette")
material.use_nodes = True
nodes = material.node_tree.nodes
color = nodes.new("ShaderNodeVertexColor")
color.layer_name = "Fur"
bsdf = nodes.get("Principled BSDF")
bsdf.inputs["Roughness"].default_value = .83
material.node_tree.links.new(color.outputs["Color"], bsdf.inputs["Base Color"])

def group(name, owner=None, center=(0, 0, 0)):
    obj = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(obj)
    obj.parent = owner
    obj.location = center
    return obj

def paint(mesh, colors):
    mesh.materials.append(material)
    attr = mesh.color_attributes.new(name="Fur", type="FLOAT_COLOR", domain="POINT")
    attr.data.foreach_set("color", colors)
    mesh.color_attributes.active_color = attr


def finish(bm, name, parent, tone, position, rotation=(0, 0, 0)):
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    paint(mesh, rgba(tone) * len(mesh.vertices))
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.parent = parent
    obj.location = position
    obj.rotation_euler = rotation
    return obj


def block(parent, name, p, size, tone, edge=.045, rot=(0, 0, 0)):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1, matrix=Matrix.Diagonal((*size, 1)))
    if edge:
        bmesh.ops.bevel(bm, geom=list(bm.edges), offset=edge, segments=1, affect="EDGES", clamp_overlap=True)
    return finish(bm, name, parent, tone, p, rot)


def wedge(parent, name, p, size, tone, rot=(0, 0, 0), sides=4, tip=.10):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=sides, radius1=.5, radius2=tip,
                          depth=1, matrix=Matrix.Diagonal((*size, 1)))
    return finish(bm, name, parent, tone, p, rot)


def facet(parent, name, p, size, tone):
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=1, radius=.5, matrix=Matrix.Diagonal((*size, 1)))
    return finish(bm, name, parent, tone, p)


def merge_group(parent):
    meshes = [obj for obj in parent.children if obj.type == "MESH"]
    if len(meshes) < 2:
        return
    verts, faces, colors = [], [], []
    for obj in meshes:
        transform = Matrix.LocRotScale(obj.location, obj.rotation_euler.to_quaternion(), obj.scale)
        start = len(verts)
        mesh = obj.data
        verts.extend(transform @ vertex.co for vertex in mesh.vertices)
        faces.extend([start + index for index in face.vertices] for face in mesh.polygons)
        for entry in mesh.color_attributes["Fur"].data:
            colors.extend(entry.color)
        bpy.data.objects.remove(obj, do_unlink=True)
        bpy.data.meshes.remove(mesh)
    mesh = bpy.data.meshes.new(parent.name + "-mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    paint(mesh, colors)
    obj = bpy.data.objects.new(parent.name + "-mesh", mesh)
    obj.parent = parent
    bpy.context.collection.objects.link(obj)

INK = "2d2731"
IVORY = "fff0ce"
ROSE = "eb9690"
GOLD = "e6b365"

# body width, depth, height, leg height, head width, head depth, fur, underside, back, paws
MAMMALS = {
    "cow": (.77,1.12,.76,.43,.69,.68,"f2d9ad","e7c295","9e633e","6e463b"),
    "sheep": (.67,.92,.68,.30,.56,.57,"f1e0bc","b9936e","dfcba5","745448"),
    "goat": (.56,.85,.60,.43,.46,.46,"c8b49c","e9dbc1","978274","62514b"),
    "alpaca": (.55,.82,.66,.42,.47,.53,"e5c191","fae0ac","c49c6e","907057"),
    "pig": (.70,.94,.61,.25,.60,.59,"ecaa9d","fbd0b1","d7857d","9a5a63"),
    "shiba": (.51,.69,.52,.30,.58,.49,"ca8143","f8d8a8","ad602f","e9bf90"),
    "corgi": (.54,.80,.48,.17,.58,.49,"d39750","ffdfaa","b4723c","f5d6a3"),
    "poodle": (.50,.58,.46,.32,.49,.43,"b98667","eac0a0","97654b","855740"),
    "husky": (.59,.84,.52,.36,.59,.52,"687784","e1e8dd","414e64","ced7d0"),
    "retriever": (.62,.91,.56,.34,.66,.56,"d2a060","f4cc85","af753d","d9a66a"),
    "calico": (.42,.58,.45,.24,.52,.42,"f1ddbf","ffe6cc","ae7652","e6c9aa"),
    "tabby": (.42,.61,.44,.26,.50,.41,"cb824b","ffd1a1","995431","bd6a37"),
    "blackcat": (.40,.61,.43,.26,.51,.41,"414253","696070","292836","4e4557"),
    "whitecat": (.45,.59,.47,.24,.54,.44,"e6e5dc","fff3df","c7ced2","eddfca"),
    "graytabby": (.41,.61,.43,.26,.50,.41,"8d969a","dce1dc","56616b","aab0af"),
    "rabbit": (.40,.58,.43,.18,.55,.47,"e2cbbc","f8dfd1","b5a093","f0d5c5"),
    "hamster": (.45,.50,.41,.10,.49,.44,"d09968","f9dda9","ad724a","e9b990"),
    "hedgehog": (.48,.57,.36,.12,.36,.37,"87604b","e7bc94","5e413d","aa735f"),
    "fox": (.44,.76,.43,.29,.56,.47,"d16b35","ffd9b0","a54a34","6c3e3e"),
    "otter": (.43,.76,.41,.20,.49,.48,"775846","d4a982","5d473e","91715b"),
    "dragon": (.53,.78,.49,.27,.59,.52,"79ab88","efcd92","527e71","689880"),
    "horse": (.70,1.27,.62,.63,.55,.66,"a56e4f","e7b783","4c3b3e","584248"),
    "donkey": (.62,1.05,.58,.49,.53,.60,"9b8c80","d4c7ac","5c5557","5a4b4d"),
    "deer": (.52,1.0,.50,.55,.46,.49,"b77651","e6bc95","83554c","574e4d"),
    "wolf": (.57,.93,.51,.43,.58,.58,"7c8692","cdd8d4","4b5b65","626971"),
    "bear": (.88,1.20,.79,.31,.69,.65,"996949","cf9e70","724d43","60433a"),
    "panda": (.82,1.07,.75,.28,.75,.62,"eee0cd","fff2d9","4c4e58","3f424c"),
    "squirrel": (.32,.44,.39,.10,.43,.38,"b97850","ebbb83","895d49","7c5247"),
    "boar": (.59,.86,.54,.30,.55,.55,"8b6657","b7856e","614942","59464b"),
    "snowfox": (.44,.73,.45,.27,.56,.47,"dbe3e5","fff4e0","97a7b7","929cb1"),
    "camel": (.64,1.21,.74,.69,.49,.56,"c99762","f0cf8d","976039","955e44"),
}

def tail(owner, style, width, depth, height, fur, light, shade):
    pivot = group("tail", owner, (0, -depth*.43, height))
    if style == "curl":
        for i in range(5):
            angle = (i*36-49)*math.pi/180
            block(pivot, "Curl", (0,-.10+math.sin(angle)*.14,.10+math.cos(angle)*.15),
                  (.17,.15,.13),light if i>=3 else fur,.023,(angle,0,0))
    elif style == "brush":
        block(pivot,"Brush", (0,-.19,.05),(.29,.43,.29),fur,.075,(-.27,0,0))
        wedge(pivot,"Tip",(0,-.37,.11),(.25,.24,.29),light,(math.pi/2+.4,0,0),sides=5)
    elif style == "tuft":
        block(pivot,"Stem",(0,-.12,-.13),(.052,.23,.06),fur,.014,(.75,0,0))
        facet(pivot,"Tuft",(0,-.21,-.23),(.15,.18,.15),shade)
    elif style == "stump":
        facet(pivot,"Pom",(0,-.065,.015),(.21,.20,.20),light)
    else:
        block(pivot,"Tail",(0,-.16,.04),(.10,.36,.10),fur,.026,(-.20,0,0))
        block(pivot,"Tail end",(0,-.30,.13),(.08,.24,.09),shade,.02,(-.65,0,0))
    return pivot

def eyes(head, width, depth, height, iris, cheek=True):
    for side in [-1, 1]:
        x = side*width*.27
        block(head,"Eye socket",(x,depth*.47,height),(.166,.064,.177),INK,.039)
        block(head,"Warm iris",(x,depth*.519,height-.016),(.112,.04,.129),iris,.026)
        block(head,"Pupil",(x,depth*.548,height+.005),(.064,.024,.072),INK,.018)
        block(head,"Catchlight",(x-.027,depth*.568,height+.039),(.035,.012,.037),"fff6de",.008)
        if cheek:
            block(head,"Cheek accent",(side*width*.36,depth*.477,height-.12),(.12,.045,.049),ROSE,.012)

def ears(head, kind, width, depth, h, fur, pale, shade):
    for s in [-1, 1]:
        ear = group("ear_left" if s<0 else "ear_right", head, (s*width*.40,-depth*.10,h*.38))
        if kind in {"poodle","retriever","cow","sheep","goat","alpaca","otter"}:
            length = .36 if kind in {"poodle","retriever"} else .24 if kind in {"cow","sheep","goat","alpaca"} else .13
            block(ear,"Ear", (s*.08,-.02,-length*.34),(.175,.15,length),fur,.035,(.06,-s*.61,0))
            block(ear,"Ear inset",(s*.09,.051,-length*.31),(.115,.052,length*.65),pale,.019,(.06,-s*.61,0))
        elif kind in {"rabbit","hamster","horse","donkey","bear","panda"}:
            length={"rabbit":.51,"donkey":.43,"horse":.25}.get(kind,.19)
            block(ear,"Ear", (s*.025,0,length*.42),(.14,.135,length),fur,.037,(-.10,s*.15,0))
            block(ear,"Ear inset",(s*.025,.067,length*.40),(.074,.022,length*.75),ROSE,.015,(-.10,s*.15,0))
        else:
            length=.36 if kind in {"fox","corgi","husky","wolf","snowfox"} else .25
            wedge(ear,"Pointed ear",(0,0,length*.40),(.25,.20,length),shade,(0,s*.20,math.pi/4),sides=4)
            wedge(ear,"Ear inset",(0,.08,length*.37),(.13,.085,length*.71),ROSE,(0,s*.20,math.pi/4),sides=4)

def model_name(kind, stage, rare=False):
    return kind + ("" if stage == "adult" else "-" + stage) + ("-rare" if rare else "")

def mammal(kind, dims, stage="adult", rare=False):
    w,d,h,leg,hw,hd,fur,light,shade,paw = dims
    young = stage == "young"
    growing = stage == "growing"
    if young or growing:
        w,d,h,leg = (w*.64,d*.62,h*.67,leg*.51) if young else (w*.82,d*.82,h*.84,leg*.77)
        hw,hd = (hw*.87,hd*.83) if young else (hw*.95,hd*.95)
    if rare:
        fur,light,shade,paw={
            "cow":("be9b77","ffe1c2","58413c","58413c"),
            "sheep":("77708c","b1a1ae","58576f","413a49"),
            "pig":("f5d5b0","ffdeb9","514447","5b4350"),
        }[kind]
    root=group(model_name(kind,stage,rare))
    body=group("body",root,(0,0,leg))
    block(body,"Torso",(0,-.03,h*.45),(w,d,h),fur,min(.13,h*.22))
    block(body,"Chest ruff",(0,d*.37,h*.49),(w*.82,d*.29,h*.86),light,.065)
    block(body,"Spine",(0,-d*.04,h*.79),(w*.77,d*.73,h*.32),shade,.048)
    if kind in {"sheep","alpaca","poodle","hedgehog"}:
        for i in range(13):
            x=(i%3-1)*w*.28
            y=((i//3)%4-1.5)*d*.19
            z=h*.84 + .028*(i%2)
            if kind=="hedgehog":
                wedge(body,"Quill",(x,y,z),(.13,.14,.19),shade,(0,0,i*.7),sides=4)
            else:
                block(body,"Wool lock",(x,y,z),(.22,.25,.18),light if i%4==0 else fur,.039)
    if kind in {"cow","calico","tabby","graytabby","husky"} or (kind=="pig" and rare):
        for i in range(4 if young else 6):
            s=(-1)**i
            block(body,"Coat markings",(s*w*.44,-d*.29+(i//2)*d*.24,h*(.50+(i%3)*.10)),
                  (.116,d*(.17 if kind in {"cow","calico"} else .10),h*.30),
                  shade if i!=3 or kind!="calico" else "52414b",.026,(.13,0,s*.14))
    for side in [-1,1]:
        for front in [-1,1]:
            leg_joint=group("leg_"+("front" if front>0 else "rear")+("_left" if side<0 else "_right"),
                     root,(side*w*.29,front*d*.30,leg+.05))
            length=leg+.04
            size=(.16 if kind not in {"cow","pig","sheep","bear","panda"} else .23) * (.70 if young else .86 if growing else 1)
            block(leg_joint,"Leg",(0,0,-length*.45),(size,size,length),fur,.026)
            block(leg_joint,"Paw",(0,.036,-length+.059),(size*1.11,size*1.33,.12),paw,.025)
    head_base=leg+h*(1.51 if kind in {"horse","donkey","deer"} else 1.31 if kind=="alpaca" else .99)
    if kind in {"alpaca","goat","dragon","horse","donkey","deer"}:
        block(body,"Neck",(0,d*.39,(head_base-leg)*.60),(w*.56,.32,(head_base-leg)*.93),fur,.065,(-.16,0,0))
    if kind in {"horse","donkey"}:
        for i in range(4):
            block(body,"Mane lock",(0,d*.25-i*.045,h*.97+i*.071),(.14,.29,.17),shade,.03,(-.41,0,0))
    if kind=="camel":
        facet(body,"Hump",(0,-d*.11,h*.83),(w*.98,d*.63,.69),fur)
        block(body,"Long neck",(0,d*.45,h*.98),(w*.47,.36,.94),light,.095,(-.30,0,0))
    hh=hw*.83
    head=group("head",root,(0,d*.53,leg+h*1.52) if kind=="camel" else (0,d*.43,head_base))
    block(head,"Crown",(0,0,0),(hw,hd,hh),fur,min(.113,hw*.18))
    if kind=="panda":
        for s in [-1,1]:
            block(head,"Eye patch",(s*hw*.27,hd*.43,hh*.12),(.27,.14,.27),shade,.066,(0,s*.17,0))
    if kind=="deer":
        for s in [-1,1]:
            block(head,"Antler",(s*.17,-.08,.32),(.073,.078,.34),IVORY,.019,(.17,s*.35,0))
            block(head,"Antler tine",(s*.24,-.115,.40),(.055,.072,.20),IVORY,.014,(-.54,s*.4,0))
    block(head,"Lower face",(0,hd*.46,-hh*.19),(hw*.76,hd*.32,hh*.40),light,.055)
    if kind in {"cow","pig","dragon","boar","horse","donkey"}:
        tone=ROSE if kind!="dragon" else light
        if kind in {"horse","donkey","boar"}: tone=shade
        block(head,"Rounded snout",(0,hd*.58,-hh*.22),(hw*.80,hd*.29,hh*.41),tone,.068)
        for s in [-1,1]:
            block(head,"Nostril",(s*hw*.18,hd*.735,-hh*.15),(.056,.027,.045),"a96561" if kind!="dragon" else shade,.009)
    else:
        block(head,"Nose",(0,hd*.66,-hh*.09),(hw*.21,.074,.07),INK,.023)
    block(head,"Smile",(0,hd*.62,-hh*.30),(hw*.29,.031,.024),"874c46",.012)
    iris="718397" if rare else "668c73" if kind in {"dragon","whitecat","graytabby","husky"} else "9a5e3f"
    eyes(head,hw,hd,hh*.12,iris,kind not in {"blackcat","hedgehog"})
    ears(head,kind,hw,hd,hh,fur,light,shade)
    if kind in {"cow","goat","dragon"}:
        for s in [-1,1]:
            horn_height=.105 if young else .185 if growing else .33 if kind=="dragon" else .29
            wedge(head,"Horn",(s*hw*.33,-.06,hh*.62),(.17,.17,horn_height),IVORY,(.23,s*.32,.15),sides=5)
    if kind in {"shiba","fox","retriever","cow"}:
        block(body,"Bandana",(0,d*.51,h*.68),(w*.74,.095,.14),
              "ad5241" if kind in {"shiba","cow"} else "367d80",.022)
        facet(body,"Name charm",(0,d*.57,h*.59),(.16,.07,.17),GOLD)
    if kind in {"sheep","poodle","alpaca"}:
        for i in [-1,0,1]:
            block(head,"Bangs",(i*hw*.26,hd*.24,hh*.47),(.23,.23,.17),IVORY,.039)
    style = "curl" if kind in {"shiba","husky","pig","boar"} else "brush" if kind in {"fox","dragon","snowfox","squirrel","wolf"} else "tuft" if kind in {"cow","goat","horse","donkey"} else "stump" if kind in {"rabbit","corgi","hamster","sheep","hedgehog","bear","panda","deer"} else "long"
    tail_joint=tail(root,style,w,d,leg+h*.60,fur,light,shade)
    if kind=="squirrel":
        tail_joint.rotation_euler.x=-1.22
        tail_joint.scale=(.81,1.11,1)
    if kind=="dragon":
        for s in [-1,1]:
            wing=group("wing_left" if s < 0 else "wing_right",body,(s*w*.44,-d*.10,h*.69))
            block(wing,"Wing edge",(s*.23,-.045,.14),(.46,.12,.12),GOLD,.022,(0,-s*.29,.13))
            wedge(wing,"Wing fabric",(s*.22,-.15,-.01),(.40,.10,.40),shade,(math.pi*.23,0,math.pi/4),sides=4)
        for y in [-.31,-.10,.11]:
            wedge(body,"Spine scale",(0,y,h*1.02),(.13,.16,.22),IVORY,sides=4)
    return root

def bird(kind, stage="adult"):
    defs={
        "chicken":(.42,.47,.47,.16,"f0dcca","fcf0d6","a85549",.21),
        "duck":(.47,.56,.40,.15,"e6dcaf","f9ecd2","8caa8e",.28),
        "parrot":(.33,.40,.40,.14,"65ab86","f1cf75","487e86",.17),
        "tit":(.37,.43,.41,.13,"e5e6da","fbefdf","645663",.12),
        "owl":(.53,.52,.54,.12,"a88b7c","e5cfb5","554652",.13),
        "eagle":(.57,.73,.61,.18,"98704c","eed9a3","534034",.24),
    }
    w,d,h,leg,fur,light,shade,beak=defs[kind]
    if stage!="adult":
        young=stage=="young"
        w,d,h,leg,beak=(w*.71,d*.67,h*.66,leg*.64,beak*.75) if young else (w*.86,d*.87,h*.82,leg*.84,beak*.85)
        fur,light,shade=("e3ba67","f8dd98","b88c43") if young else ("f2d59a","fff1bf","ab8861")
    root=group(model_name(kind,stage))
    body=group("body",root,(0,0,leg))
    block(body,"Feather body",(0,-.08,h*.44),(w,d,h),fur,.096)
    block(body,"Bib",(0,d*.24,h*.44),(w*.78,.22,h*.83),light,.062)
    head=group("head",root,(0,d*.35,leg+h*.94))
    block(head,"Head",(0,0,0),(w*.93,d*.71,h*.72),fur,.069)
    eyes(head,w*.94,d*.67,.019,"a0795a",kind=="tit")
    block(head,"Bill",(0,d*.36+beak*.35,-.078),(w*.49,beak,.08 if kind=="tit" else .10),"c77e42" if kind!="tit" else "80504d",.025)
    if kind=="chicken" and stage=="adult":
        for i in range(3):
            block(head,"Comb",(0,-.078+i*.068,.18+.038*(i==1)),(.085,.093,.14),shade,.022)
    if kind=="owl":
        for s in [-1,1]:
            block(head,"Ear tuft",(s*.178,-.02,.23),(.115,.171,.23),shade,.028,(0,s*.34,0))
    if kind=="eagle":
        wedge(head,"Hooked bill",(0,.33,-.11),(.14,.14,.19),"dda154",(2.8,0,0),sides=5)
    for s in [-1,1]:
        wing=group("wing_left" if s<0 else "wing_right",body,(s*w*.36,-.05,h*.58))
        block(wing,"Wing",(s*.047,-.09,-.055),(.13,d*.70,h*.55),shade,.034)
        if kind in {"owl","eagle"}:
            for i in range(4):
                block(wing,"Flight feather",(s*(.10+i*.075),-.05-i*.045,-.018),(.21,.27,.09),fur if i%2 else shade,.022,(0,0,s*.28))
        for i in range(2):
            block(wing,"Wing edging",(s*.094,-.16+i*.09,-.081),(.043,.10,.11),light,.018)
        foot=group("leg_front_left" if s<0 else "leg_front_right",root,(s*w*.21,0,leg))
        block(foot,"Shin",(0,0,-leg*.38),(.06,.068,leg*.73),"b98a5c",.012)
        block(foot,"Toes",(0,.052,-leg+.04),(.13,.20,.078),"ce985d",.019)
    tail_group=group("tail",root,(0,-d*.53,leg+h*.37))
    block(tail_group,"Tail feathers",(0,-(.16 if kind=="tit" else .10),.05),
          (w*.36,.43 if kind in {"tit","parrot"} else .24,.13),shade,.029,(-.32,0,0))
    return root

def bee(stage="adult"):
    root=group(model_name("bees",stage))
    if stage!="adult":
        body=group("body",root,(0,0,.13))
        for i in range(5):
            block(body,"Larval segment",(0,(i-2)*.073,0),(.24-.016*abs(i-2),.092,.23),"f4e3b4" if i%2 else "e4ca95",.04)
        head=group("head",root,(0,.18,.15))
        block(head,"Head",(0,0,0),(.175,.134,.17),"ebcc96",.034)
        if stage=="growing":
            for s in [-1,1]: block(body,"Folded wing",(s*.06,-.045,.092),(.081,.25,.047),"ccbaa4",.021)
        return root
    body=group("body",root,(0,0,.25))
    block(body,"Honey body",(0,-.04,0),(.45,.59,.40),"edbc60",.089)
    for y in [-.18,-.01]:
        block(body,"Stripe",(0,y,0),(.46,.079,.405),"604843",.054)
    head=group("head",root,(0,.25,.26))
    block(head,"Bee face",(0,0,0),(.34,.22,.30),"f5cf79",.055)
    eyes(head,.31,.22,.015,"9b633e")
    for s in [-1,1]:
        block(head,"Feelers",(s*.10,.005,.17),(.037,.032,.138),"644b47",.008,(.1,s*.22,0))
        wing=group("wing_left" if s<0 else "wing_right",body,(s*.13,-.08,.16))
        block(wing,"Wing membrane",(s*.146,-.018,.01),(.32,.24,.052),"c7e3db",.022)
    return root

def bank_creature(kind):
    frog=kind=="frog"
    fur,shade,light=("8bae6c","658944","f4db9f") if frog else ("a4a272","6b8273","ddc290")
    root=group(kind)
    body=group("body",root,(0,-.03,.16))
    block(body,"Body",(0,0,.055),(.59,.75,.32),fur,.09)
    head=group("head",root,(0,.32,.20))
    block(head,"Head",(0,0,0),(.55 if frog else .30,.33,.25),light,.06)
    if frog:
        for s in [-1,1]:
            facet(head,"Eye crown",(s*.19,.08,.143),(.21,.23,.22),fur)
        eyes(head,.62,.37,.14,"6c6144",False)
    else:
        facet(body,"Shell",(0,-.07,.21),(.72,.81,.46),shade)
        for i in range(5):
            facet(body,"Shell plate",(.19*(i%2*2-1),.13*(i//2-1),.34),(.29,.22,.13),fur)
        eyes(head,.26,.30,.026,"625d43",False)
    for s in [-1,1]:
        for dir in [-1,1]:
            leg=group("leg_"+("front" if dir>0 else "rear")+("_left" if s<0 else "_right"),root,(s*.22,dir*.23,.11))
            block(leg,"Foot",(s*.085,.033,-.048),(.24,.25,.118),fur,.038)
    return root

def fish(kind):
    reef=kind=="reef-fish"
    tropical=kind=="tropical-fish"
    fur,light,shade=("ea9c63","ffe5ab","648cb0") if reef else ("d3a06b","f8dd83","544f79") if tropical else ("829d83","d2c4a2","5e807f")
    root=group(kind)
    body=group("body",root,(0,-.05,.32))
    block(body,"Flanks",(0,0,0),(.28,.61,.34),fur,.075)
    block(body,"Belly",(0,.035,-.121),(.265,.51,.139),light,.046)
    head=group("head",root,(0,.27,.33))
    block(head,"Head",(0,0,0),(.25,.26,.23),fur,.073)
    for s in [-1,1]:
        block(head,"Eye",(s*.124,.064,.039),(.033,.078,.077),INK,.012)
        block(head,"Glint",(s*.143,.083,.055),(.020,.023,.025),IVORY,.006)
        for i in range(3):
            block(body,"Scales",(s*.136,-.22+i*.15,.04),(.034,.070,.095),shade,.015)
        if tropical:
            for y in [-.17,.07]:
                block(body,"Banded flank",(s*.136,y,.017),(.04,.085,.275),shade,.023,(-.30,0,0))
    tail_group=group("tail",root,(0,-.30,.32))
    wedge(tail_group,"Tail fin",(0,-.12,.02),(.09,.36,.38),shade,(-math.pi/2,0,0),sides=4)
    wedge(body,"Dorsal fin",(0,-.09,.199),(.075,.32,.18),shade,sides=4)
    return root

def dolphin():
    root=group('dolphin')
    body=group('body',root,(0,-.18,.40))
    block(body,'Rounded back',(0,0,.045),(.61,1.29,.55),'6b8d9e',.14)
    block(body,'Lower flank',(0,.12,-.18),(.56,.86,.24),'abc1bd',.081)
    wedge(body,'Dorsal fin',(0,-.07,.36),(.16,.32,.37),'4a657b',(.37,0,0),sides=5)
    head=group('head',root,(0,.47,.47))
    block(head,'Round head',(0,0,0),(.53,.48,.46),'7ea0ac',.113)
    block(head,'Beak',(0,.28,-.12),(.30,.43,.16),'94afae',.05)
    for side in [-1,1]:
        block(head,'Eye',(side*.26,.12,.04),(.041,.082,.084),INK,.017)
        fin=group('wing_left' if side<0 else 'wing_right',body,(side*.25,.23,-.15))
        wedge(fin,'Flipper',(side*.16,0,-.026),(.37,.15,.26),'4a657b',(0,side*1.2,.2),sides=5)
    tail_joint=group('tail',root,(0,-.73,.38))
    block(tail_joint,'Tail shaft',(0,-.21,0),(.29,.61,.24),'6b8d9e',.063)
    for side in [-1,1]:
        wedge(tail_joint,'Fluke',(side*.17,-.51,.01),(.56,.27,.095),'4a657b',(0,0,side*.24),sides=4)
    return root


def tide_creature(kind):
    crab=kind=='shore-crab'
    squid=kind=='reef-squid'
    fur,light,edge=('b66351','f0a478','803c47') if crab else ('a87988','ecc2aa','5f6088') if squid else ('bd725e','f1b49a','8d536a')
    root=group(kind)
    body=group('body',root,(0,0,.20))
    block(body,'Carapace' if crab else 'Mantle',(0,-.12,.10),(.70,.57,.33) if crab else (.42,.76,.36) if squid else (.59,.55,.53),fur,.105)
    if squid:
        for side in [-1,1]:
            wedge(body,'Mantle fin',(side*.23,-.33,.095),(.42,.38,.085),light,(0,0,side*.29),sides=4)
    head=group('head',root,(0,.20,.31))
    block(head,'Face',(0,0,0),(.43,.22,.24),light,.053)
    eyes(head,.45,.24,.069,'ad7256',False)
    for side in [-1,1]:
        for i in range(4):
            limb=group(f'tentacle_{side}_{i}',root,(side*.23,-.22+i*.118,.15))
            block(limb,'Bent limb',(side*.132,.02,-.042),(.33,.086,.10),fur,.027,(0,side*.25,.15*i))
            block(limb,'Limb tip',(side*(.26+i*.037),.07,-.081),(.16,.096,.096),edge,.021,(0,side*.45,side*-.40))
        if crab:
            pivot=group('wing_left' if side<0 else 'wing_right',root,(side*.29,.25,.19))
            block(pivot,'Pincer',(side*.15,.09,.025),(.27,.20,.19),edge,.045)
            for finger in [-1,1]:
                wedge(pivot,'Pincer finger',(side*.19+finger*.052,.21,.032),(.105,.175,.117),light,(-1.36,0,finger*.26),sides=4)
    return root


def magic_creature(kind):
    root=group(kind)
    body=group('body',root,(0,0,0))
    head=group('head',root,(0,.22,.52 if kind=='crystal-slime' else .96))
    if kind=='crystal-slime':
        shell=group('gel',body)
        gel=material.copy()
        gel.name='Crystal jelly'
        gel.node_tree.nodes.get('Principled BSDF').inputs['Alpha'].default_value=.63
        gel.surface_render_method='BLENDED'
        mesh=block(shell,'Glossy jelly',(0,0,.27),(.80,.73,.54),'91ba9e',.145)
        mesh.data.materials[0]=gel
        for x,y,z in [(-.20,.015,.18),(.20,-.12,.25),(-.10,-.18,.22)]:
            wedge(body,'Embedded crystal',(x,y,z),(.19,.143,.29),'d9f1be',(0,.22,.18),sides=5)
        block(head,'Mouth',(0,.17,-.17),(.147,.029,.046),'467466',.018)
        eyes(head,.57,.32,-.045,'665574')
    elif kind=='stone-golem':
        block(body,'Tiered stone chest',(0,0,.55),(.81,.51,.65),'8b8e87',.071)
        block(head,'Stone mask',(0,0,0),(.55,.36,.42),'a8a599',.066)
        eyes(head,.55,.39,.027,'78b2ab',False)
        for side in [-1,1]:
            block(body,'Joint stones',(side*.44,0,.52),(.31,.36,.57),'6c7777',.062)
            foot=group('leg_front_left' if side<0 else 'leg_front_right',body,(side*.19,0,.23))
            block(foot,'Stone footing',(0,.05,-.12),(.30,.34,.23),'606d68',.057)
        facet(body,'Heart crystal',(0,.285,.57),(.25,.14,.29),'73ae9e')
    else:
        head.location.z=.64
        facet(body,'Faceted light',(0,0,.52),(.49,.48,.67),'e8cf95')
        for side in [-1,1]:
            wing=group('wing_left' if side<0 else 'wing_right',body,(side*.13,0,.52))
            wedge(wing,'Sail',(side*.23,-.034,-.09),(.64,.26,.16),'a5c9bc',(0,0,side*.39),sides=4)
            facet(wing,'Pearl',(side*.16,.015,.075),(.22,.18,.16),'f4e1b2')
        eyes(head,.32,.21,-.022,'a2745f',False)
    return root


def flying(kind):
    bat=kind=="cave-bat"
    fur,shade,light=("655b76","8c7f9b","c998a6") if bat else ("ebad67","9e6292","ffcf82")
    root=group(kind)
    body=group("body",root,(0,0,.30))
    block(body,"Body",(0,-.07,0),(.34 if bat else .12,.45,.28 if bat else .13),fur,.052)
    head=group("head",root,(0,.17,.33))
    block(head,"Head",(0,0,0),(.36 if bat else .18,.235,.27 if bat else .15),fur,.052)
    if bat:
        ears(head,"bat",.35,.23,.22,fur,light,shade)
        eyes(head,.32,.24,-.026,"bb895f",False)
    for s in [-1,1]:
        wing=group("wing_left" if s<0 else "wing_right",body,(s*.10,0,.06))
        wedge(wing,"Wing silhouette",(s*.22,-.04,.005),(.52,.47,.06),shade,(0,0,s*.56),sides=4)
        facet(wing,"Wing marking",(s*.26,.012,.026),(.32,.28,.10),fur)
        if not bat: facet(wing,"Wing eye",(s*.37,.02,.047),(.14,.14,.06),light)
    return root

models = [mammal(kind, dims) for kind, dims in MAMMALS.items()]
models.extend(bird(kind) for kind in ["chicken","duck","parrot","tit","owl","eagle"])
models.append(bee())
models.extend([bank_creature("frog"),bank_creature("turtle"),fish("trout"),fish("reef-fish"),
               flying("cave-bat"),flying("butterfly"),fish('tropical-fish')])
models.append(dolphin())
models.extend(tide_creature(kind) for kind in ['shore-crab','reef-squid','octopus'])
models.extend(magic_creature(kind) for kind in ['crystal-slime','stone-golem','cloud-spirit'])
for stage in ["young","growing"]:
    models.extend(mammal(kind,MAMMALS[kind],stage) for kind in ["cow","sheep","goat","alpaca","pig"])
    models.extend(bird(kind,stage) for kind in ["chicken","duck"])
    models.append(bee(stage))
for kind in ["cow","sheep","pig"]:
    models.extend(mammal(kind,MAMMALS[kind],stage,True) for stage in ["adult","young","growing"])
for model in models:
    for joint in list(model.children) + [o for o in model.children_recursive if o.type == "EMPTY" and o.parent != model]:
        merge_group(joint)
    model["role"] = "rpg-creature"
    # Save distinct rig names even when Blender appends an index.
    for joint in model.children_recursive:
        if joint.type == "EMPTY":
            joint["part"] = joint.name.split(".")[0]
    for mesh in [obj for obj in model.children_recursive if obj.type=="MESH"]:
        mesh.data.name = mesh.name

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(OUTPUT), export_format="GLB", export_extras=True,
                         export_cameras=False, export_lights=False,
                         export_animations=False, export_yup=True)
print("Creatures GLB", len(models), OUTPUT.stat().st_size, flush=True)

if "--render" not in sys.argv:
    raise SystemExit(0)

SHEETS.mkdir(parents=True, exist_ok=True)
scene=bpy.context.scene
scene.render.engine="BLENDER_WORKBENCH"
scene.render.resolution_x=112
scene.render.resolution_y=112
scene.render.resolution_percentage=100
scene.render.image_settings.color_mode="RGBA"
scene.render.film_transparent=True
scene.display.shading.light="STUDIO"
scene.display.shading.studiolight_rotate_z=.47
scene.display.shading.color_type="VERTEX"
scene.display.shading.show_shadows=False
scene.display.shading.show_cavity=True
scene.display.shading.cavity_type="WORLD"
scene.display.shading.cavity_ridge_factor=1.2
scene.display.shading.cavity_valley_factor=.75
scene.view_settings.view_transform="Standard"
scene.display.render_aa="5"
bpy.ops.object.camera_add()
camera=bpy.context.object
scene.camera=camera
camera.data.type="ORTHO"

for model in models:
    directions="--directions" in sys.argv
    last=f"{model.name}-right-7.png" if directions else f"{model.name}-3.png"
    if (SHEETS/last).exists() and "--missing-only" in sys.argv:
        continue
    for animal in models:
        hide=animal!=model
        for obj in animal.children_recursive:
            if obj.type=="MESH": obj.hide_render=hide
    bounds=[obj.matrix_world @ Vector(v) for obj in model.children_recursive if obj.type=="MESH" for v in obj.bound_box]
    max_height=max(v.z for v in bounds)
    plan_width=max(max(abs(v.x),abs(v.y)) for v in bounds)*2.1
    camera.data.ortho_scale=max(1.36,max_height*1.43,plan_width if directions else 0)
    head=next((o for o in model.children if o.get("part")=="head"),None)
    tail_joint=next((o for o in model.children if o.get("part")=="tail"),None)
    if directions:
        legs=[obj for obj in model.children_recursive if obj.get('part','').startswith('leg_')]
        wings=[obj for obj in model.children_recursive if obj.get('part','').startswith('wing_')]
        angles={'front':(2.85,3.9,2.1),'back':(-2.4,-4.18,2.1),'left':(-4.4,.28,1.9),'right':(4.4,.28,1.9)}
        target=Vector((0,0,max_height*.5))
        for direction,angle in angles.items():
            camera.location=target+Vector(angle)
            camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler()
            for frame in range(8):
                if head: head.rotation_euler.x=[-.06,.09,.30,-.20,-.01,-.01,-.12,-.47][frame]
                if tail_joint: tail_joint.rotation_euler.z=[.11,-.39,.17,-.24,.27,-.27,.33,.04][frame]
                model.location.z=.11 if frame==3 else .055 if frame==6 else 0
                model.scale.z=.82 if frame==2 else 1
                for leg in legs:
                    left='left' in leg.get('part','')
                    rear='rear' in leg.get('part','')
                    phase=1 if left!=rear else -1
                    leg.rotation_euler.x=phase*{4:.27,5:-.27,6:.46}.get(frame,0)
                for wing in wings:
                    side=1 if 'left' in wing.get('part','') else -1
                    wing.rotation_euler.y=side*{2:.31,3:-.50,4:-.26,5:.24,6:-.48}.get(frame,0)
                scene.render.filepath=str(SHEETS/f'{model.name}-{direction}-{frame}.png')
                bpy.ops.render.render(write_still=True)
        model.location.z=0
        model.scale.z=1
        print('Rendered directions',model.name,flush=True)
        continue
    for i in range(4):
        if head:head.rotation_euler.x=[-.08,.12,.33,-.16][i]
        if tail_joint:tail_joint.rotation_euler.z=[.12,-.42,.25,-.25][i]
        model.location.z = .11 if i==3 else 0
        model.scale.z = .83 if i==2 else 1
        target=Vector((0,.04,max_height*.49))
        camera.location=target+Vector((2.85,3.9,2.1))
        camera.rotation_euler=(target-camera.location).to_track_quat("-Z","Y").to_euler()
        scene.render.filepath=str(SHEETS/f"{model.name}-{i}.png")
        bpy.ops.render.render(write_still=True)
    model.location.z=0
    model.scale.z=1
    if head:head.rotation_euler.x=0
    if tail_joint:tail_joint.rotation_euler.z=0
    print("Rendered",model.name,flush=True)

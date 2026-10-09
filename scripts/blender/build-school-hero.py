"""School Wanderer hero quality prototype, Blender 4.5. Y-up author coordinates.
Set SCHOOL_HERO_CYCLE=1|2|3, then run --background --python this-file.
Separate outputs preserve the earlier miniature kit and all uncommitted work.
"""
import bpy, bmesh, math, os, sys, json
from mathutils import Vector
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'../..'))
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
CYCLE=int(os.environ.get('SCHOOL_HERO_CYCLE','3'))
TOY=os.environ.get('SCHOOL_HERO_STYLE','toy')=='toy'
OUT=os.path.join(ROOT,'assets/school-wanderer/hero-quality');os.makedirs(OUT,exist_ok=True)
PUBLIC=os.path.join(ROOT,'public/models/school-wanderer');os.makedirs(PUBLIC,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)

def linear(v):return v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4
def material(name,color,rough=.6,metal=0):
    m=bpy.data.materials.new(name);m.use_nodes=True
    rgb=tuple(linear(int(color[i:i+2],16)/255) for i in (0,2,4))
    m.diffuse_color=(*rgb,1);p=m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=(*rgb,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal
    if name=='skin':p.inputs['Subsurface Weight'].default_value=.075
    if name in ['hair','leather']:p.inputs['Coat Weight'].default_value=.18
    if name in ['skin','hair','cloth','leather']:p.inputs['Specular IOR Level'].default_value=.38
    return m
M={
 'skin':material('skin','F6C398',.43), 'hair':material('hair','613E25',.42),
 'hair_light':material('hair_light','75482B',.38), 'cloth':material('cloth','FFF1DC',.57),
 'navy':material('navy','254B7C',.52), 'red':material('red','D63F37',.43),
 'leather':material('leather','283F52',.44), 'trim':material('trim','AC7550',.64),
 'metal':material('metal','C6CCCA',.29,.72), 'gold':material('gold','CBA65A',.30,.7),
 'eye_white':material('eye_white','FFF9ED',.25), 'iris':material('iris','684624',.30),
 'ink':material('ink','241E23',.53), 'blush':material('blush','E59C8D',.8),
 'mouth':material('mouth','A25D59',.75), 'sole':material('sole','DDD4BE',.82),
}
def xyz(p):return (p[0],-p[2],p[1])
def group(name,parent=None,pos=(0,0,0)):
    o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);o.location=xyz(pos);o.parent=parent;return o
hero=group('hero');hero['quality']='School Wanderer hero v3 compact adventurer';hero['height']=1.45;hero['head_ratio']=2.68
body=group('hero_motion_body',hero)
head=group('hero_motion_head',body,(0,1.035,0))
armR=group('hero_motion_arm_r',body,(-.235,.629,0));armL=group('hero_motion_arm_l',body,(.235,.629,0))
legR=group('hero_motion_leg_r',body,(-.112,.25,0));legL=group('hero_motion_leg_l',body,(.112,.25,0))

def finish(o,name,parent,mat,smooth=True):
    o.name=name;o.parent=parent;o.data.materials.append(M[mat]);
    for p in o.data.polygons:p.use_smooth=smooth
    return o
def mesh(name,parent,verts,faces,mat,sub=0):
    data=bpy.data.meshes.new(name);data.from_pydata([xyz(v) for v in verts],[],faces);data.update()
    bm=bmesh.new();bm.from_mesh(data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(data);bm.free()
    o=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(o);finish(o,name,parent,mat)
    if sub:
        mod=o.modifiers.new('Silhouette subdivision','SUBSURF');mod.levels=sub;mod.render_levels=sub
        bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
    return o
def box(name,parent,pos,size,mat,bevel=.02):
    bpy.ops.mesh.primitive_cube_add(size=1,location=xyz(pos));o=bpy.context.object;o.scale=(size[0],size[2],size[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    mod=o.modifiers.new('Tailored soft edges','BEVEL');mod.width=min(bevel,min(size)*.35);mod.segments=2
    bpy.ops.object.modifier_apply(modifier=mod.name)
    mod=o.modifiers.new('Weighted corner normals','WEIGHTED_NORMAL');mod.keep_sharp=True;bpy.ops.object.modifier_apply(modifier=mod.name)
    return finish(o,name,parent,mat)
def oval(name,parent,pos,size,mat,segments=16,rings=10):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,radius=.5,location=xyz(pos));o=bpy.context.object;o.scale=(size[0],size[2],size[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);return finish(o,name,parent,mat)
def tube(name,parent,points,radii,mat,sides=8,flatten=1):
    if (CYCLE>=2 or TOY) and (name.startswith('hero_hair') or TOY and ('mouth' in name or 'brow' in name or 'lid' in name)):
        old=points;rr=radii;points=[];radii=[]
        for i in range(len(old)-1):
            p0=Vector(old[max(0,i-1)]);p1=Vector(old[i]);p2=Vector(old[i+1]);p3=Vector(old[min(len(old)-1,i+2)])
            for j in range(3):
                t=j/3;v=.5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t*t+(-p0+3*p1-3*p2+p3)*t*t*t)
                points.append(tuple(v));radii.append(rr[i]*(1-t)+rr[i+1]*t)
        points.append(old[-1]);radii.append(rr[-1]);sides=10
    verts=[];frames=[];previous_u=None
    for i,p in enumerate(points):
        tangent=Vector(points[min(i+1,len(points)-1)])-Vector(points[max(i-1,0)])
        tangent.normalize();ref=Vector((0,0,1))
        if abs(tangent.dot(ref))>.92:ref=Vector((1,0,0))
        if TOY:
            seed=previous_u if previous_u is not None else Vector((1,0,0))
            u=seed-tangent*seed.dot(tangent)
            if u.length<.001:u=tangent.cross(ref)
            u.normalize();previous_u=u.copy()
        else:u=tangent.cross(ref).normalized()
        v=tangent.cross(u).normalized();frames.append((u,v))
        for j in range(sides):
            a=2*math.pi*j/sides;offset=(u*math.cos(a)+v*math.sin(a)*flatten)*radii[i]
            verts.append(tuple(Vector(p)+offset))
    faces=[]
    for i in range(len(points)-1):
        for j in range(sides):faces.append((i*sides+j,i*sides+(j+1)%sides,(i+1)*sides+(j+1)%sides,(i+1)*sides+j))
    faces.extend([tuple(range(sides-1,-1,-1)),tuple((len(points)-1)*sides+j for j in range(sides))])
    return mesh(name,parent,verts,faces,mat,1 if name in ['hero_sleeve','hero_forearm','hero_leg'] else 0)

# Redesign: a deliberately compact 2.5-head adventurer, not a dressed anatomy study.
# Geometry coordinates are the production socket coordinate system used by Three.js.
levels=[(-.26,.095,.13,.00),(-.225,.185,.20,.006),(-.15,.263,.236,.018),(-.045,.293,.253,.014),(.065,.294,.25,.002),(.165,.254,.225,-.006),(.245,.177,.168,-.012),(.283,.06,.058,-.012)]
verts=[];N=24
for y,w,d,z in levels:
    for i in range(N):
        a=2*math.pi*i/N;verts.append((w*math.cos(a),y,z+d*math.sin(a)))
faces=[]
for row in range(len(levels)-1):
    for i in range(N):faces.append((row*N+i,row*N+(i+1)%N,(row+1)*N+(i+1)%N,(row+1)*N+i))
faces.extend([tuple(range(N-1,-1,-1)),tuple((len(levels)-1)*N+i for i in range(N))])
mesh('hero_face_contour',head,verts,faces,'skin',2)
for side in [-1,1]:
    oval('hero_ear',head,(side*.285,-.028,.002),(.075,.105,.07),'skin',20,12)
# Almost invisible nose, plain dark ovals, no whites / iris illustration / blush spots.
oval('hero_nose',head,(0,-.075,.271),(.025,.033,.015),'skin',16,10)
expressions={}
for expression in ['neutral','smile','surprise','anger','sad','hit','victory']:
    face=group('hero_expression_'+expression,head);expressions[expression]=face
    for side in [-1,1]:
        x=side*.096;y=.004;z=.256
        if expression in ['smile','victory','hit']:
            points=[(x-.032,y-.008,z+.006),(x,y+.024,z+.016),(x+.032,y-.008,z+.006)]
            if expression=='hit':points=[(x-.028,y+.025,z+.006),(x+.015,y,z+.016),(x-.025,y-.025,z+.006)]
            tube('hero_lid_'+expression,face,points,[.0065]*3,'ink',8)
        else:
            oval('hero_eye_'+expression,face,(x,y,z+.008),(.050,.118 if expression!='surprise' else .133,.013),'ink',20,12)
        by=.112 if expression!='surprise' else .146
        slope=side*(.014 if expression=='anger' else -.013 if expression=='sad' else .002)
        tube('hero_brow_'+expression,face,[(x-.032,by-slope,.24),(x,by+.010,.255),(x+.032,by+slope,.24)],[.004,.006,.003],'hair',8)
    if expression=='surprise':oval('hero_mouth_'+expression,face,(0,-.14,.241),(.033,.043,.009),'mouth',16,10)
    elif expression in ['smile','victory']:
        oval('hero_mouth_'+expression,face,(0,-.143,.245),(.065,.043,.01),'mouth',20,12)
    else:
        cy=-.146;lift=-.009 if expression in ['sad','hit'] else .005
        tube('hero_mouth_'+expression,face,[(-.028,cy+lift,.237),(0,cy-lift,.247),(.028,cy+lift,.237)],[.003,.004,.003],'mouth',8)
# Directional fantasy-adventure spikes: wide roots, curved sweeps and clean sharp tips.
# The original brown hair and red headband remain the identity; no named-character copy.
for i in range(3):
    x=(i-1)*.139
    tube('hero_hair_fringe',head,[(x-.08,.214,-.06),(x-.012,.288,.055),(x+.042,.239,.214),(x+.077,.103-(i%2)*.026,.247)],[.086,.105,.081,.003],'hair',12,.57)
for side in [-1,1]:
    tube('hero_hair_side',head,[(side*.19,.22,-.095),(side*.291,.132,-.113),(side*.319,.028,-.06),(side*.341,-.081,-.055)],[.084,.091,.066,.003],'hair',12,.53)
for i in range(4):
    x=(i-1.5)*.119
    tube('hero_hair_back',head,[(x*.75,.249,-.105),(x,.195,-.251),(x*1.12,.039,-.274),(x*1.24,-.094-(i%2)*.021,-.241)],[.091,.107,.082,.003],'hair',12,.57)
for i in range(4):
    x=(i-1.5)*.102
    height=.402-(i%2)*.026
    tube('hero_hair_crown',head,[(x-.032,.17,-.179),(x-.013,.293,-.101),(x+.061,height-.020,.017),(x+.162,height,.083)],[.097,.099,.066,.002],'hair',12,.54)
bandPoints=[]
for i in range(33):
    a=2*math.pi*i/32;bandPoints.append((.293*math.cos(a),.074,.015+.252*math.sin(a)))
tube('hero_headband',head,bandPoints,[.023]*33,'red',8,.65)
oval('hero_headband_knot',head,(.035,.052,-.246),(.075,.055,.063),'red')
for side in [-1,1]:tube('hero_headband_tie',head,[(.04,.05,-.257),(.04+side*.055,-.005,-.292),(.04+side*.125,-.077,-.268)],[.026,.033,.005],'red',8,.42)
# One compact, smooth torso; no breast pockets, buttons or miniature seams.
verts=[];rows=[(.31,.165,.12),(.38,.195,.143),(.54,.207,.148),(.67,.18,.127),(.74,.115,.093)]
for y,w,d in rows:
    for i in range(16):
        a=i*math.pi/8;verts.append((w*math.cos(a),y,d*math.sin(a)))
faces=[]
for r in range(4):
    for i in range(16):faces.append((r*16+i,r*16+(i+1)%16,(r+1)*16+(i+1)%16,(r+1)*16+i))
faces.extend([tuple(range(15,-1,-1)),tuple(64+i for i in range(16))])
mesh('hero_shirt',body,verts,faces,'cloth',2)
oval('hero_neck',body,(0,.746,0),(.13,.075,.13),'skin')
for side in [-1,1]:
    collar=box('hero_collar',body,(side*.055,.697,.12),(.115,.062,.027),'cloth',.018);collar.rotation_euler[1]=side*.35
scarf=mesh('hero_red_scarf',body,[(-.043,.688,.154),(.043,.688,.154),(.025,.568,.166),(0,.548,.174),(-.025,.568,.166)],[(0,1,2,3,4)],'red')
mod=scarf.modifiers.new('Scarf thickness','SOLIDIFY');mod.thickness=.010;bpy.context.view_layer.objects.active=scarf;bpy.ops.object.modifier_apply(modifier=mod.name)
box('hero_shorts',body,(0,.322,0),(.352,.143,.249),'navy',.044)
box('hero_belt',body,(0,.363,0),(.356,.038,.26),'trim',.012)
box('hero_buckle',body,(0,.364,.139),(.058,.037,.018),'gold',.007)
for side in [-1,1]:
    arm=armR if side<0 else armL
    # Short tapered sleeve and forearm are designed as curved masses, not rods.
    tube('hero_sleeve',arm,[(0,.013,0),(side*.012,-.040,.008),(side*.023,-.085,.013)],[.083,.089,.077],'cloth',16)
    tube('hero_forearm',arm,[(side*.020,-.068,.013),(side*.039,-.129,.034),(side*.047,-.183,.046)],[.074,.078,.066],'skin',16)
    oval('hero_hand',arm,(side*.047,-.209,.057),(.142,.114,.109),'skin',20,12)
    oval('hero_thumb',arm,(-side*.012,-.206,.083),(.055,.061,.049),'skin',16,10)
    group('hero_socket_'+('weapon' if side<0 else 'accessory'),arm,(side*.047,-.212,.083))
    leg=legR if side<0 else legL
    tube('hero_leg',leg,[(0,-.012,0),(0,-.053,.005),(0,-.101,.014)],[.085,.091,.078],'skin',16)
    box('hero_sock',leg,(0,-.110,.023),(.153,.055,.174),'cloth',.02)
    box('hero_shoe',leg,(0,-.172,.062),(.211,.139,.296),'red',.050)
    box('hero_toecap',leg,(0,-.178,.159),(.204,.089,.127),'cloth',.037)
    box('hero_sole',leg,(0,-.232,.065),(.216,.034,.303),'sole',.015)
# Larger pack and straps: the unmistakable school-adventure emblem from all views.
backpack=group('hero_backpack',body)
box('hero_backpack_shell',backpack,(0,.508,-.217),(.377,.369,.22),'leather',.054)
box('hero_backpack_flap',backpack,(0,.566,-.345),(.365,.238,.045),'leather',.046)
box('hero_backpack_lock',backpack,(0,.439,-.379),(.061,.054,.022),'gold',.008)
for side in [-1,1]:
    tube('hero_strap',body,[(side*.128,.725,-.105),(side*.155,.695,.119),(side*.177,.53,.157),(side*.155,.363,.104),(side*.112,.349,-.11)],[.022]*5,'trim',8,.40)
    box('hero_backpack_side',backpack,(side*.195,.512,-.237),(.029,.147,.123),'trim',.012)
tube('hero_backpack_handle',backpack,[(-.061,.693,-.215),(-.061,.742,-.215),(.061,.742,-.215),(.061,.693,-.215)],[.014]*4,'leather',10)
# The two signature equipment pieces use unique school-tool silhouettes.
pencil=group('pencil_adventure');shield=group('shield_adventure')
# Thick hexagonal pencil blade, graphite point, metal ferrule and a red rubber grip.
def prism(root,name,y0,y1,r,mat):
    vv=[(r*math.cos(i*math.pi/3),y,r*math.sin(i*math.pi/3)) for y in [y0,y1] for i in range(6)]
    ff=[(i,(i+1)%6,6+(i+1)%6,6+i) for i in range(6)]+[tuple(range(5,-1,-1)),tuple(range(6,12))]
    return mesh(name,root,vv,ff,mat)
prism(pencil,'pencil_blade',.13,.60,.073,'gold')
prism(pencil,'pencil_grip',-.12,.12,.057,'red')
box('pencil_guard',pencil,(0,.12,0),(.28,.055,.11),'metal',.017)
prism(pencil,'pencil_ferrule',-.15,-.11,.063,'metal')
mesh('pencil_wood_tip',pencil,[(.073*math.cos(i*math.pi/3),.60,.073*math.sin(i*math.pi/3)) for i in range(6)]+[(0,.77,0)],[(i,(i+1)%6,6)for i in range(6)]+[tuple(range(5,-1,-1))],'trim')
mesh('pencil_graphite_tip',pencil,[(.022*math.cos(i*math.pi/3),.725,.022*math.sin(i*math.pi/3)) for i in range(6)]+[(0,.78,0)],[(i,(i+1)%6,6)for i in range(6)],'ink')
# Shield with thick silver bevel and a blue school-emblem inset, no borrowed insignia.
outline=[(-.23,.28),(.23,.28),(.275,.18),(.22,-.18),(0,-.31),(-.22,-.18),(-.275,.18)]
def plate(name,root,scale,back,front,mat):
    vv=[(x*scale,y*scale,z) for z in [back,front]for x,y in outline];n=len(outline)
    ff=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n)for i in range(n)]
    ob=mesh(name,root,vv,ff,mat);mod=ob.modifiers.new('Shield bevel','BEVEL');mod.width=.022;mod.segments=3;bpy.context.view_layer.objects.active=ob;bpy.ops.object.modifier_apply(modifier=mod.name)
    mod=ob.modifiers.new('Shield corner normals','WEIGHTED_NORMAL');bpy.ops.object.modifier_apply(modifier=mod.name);return ob
plate('shield_rim',shield,1,-.045,.045,'metal');plate('shield_panel',shield,.83,.035,.065,'navy')
box('shield_badge',shield,(0,.031,.088),(.16,.18,.025),'gold',.025)
box('shield_crest',shield,(0,.03,.108),(.043,.14,.015),'red',.009)
for x in [-.183,.183]:oval('shield_rivet',shield,(x,.197,.070),(.036,.036,.025),'gold',16,10)
box('shield_back_grip',shield,(0,0,-.099),(.18,.07,.11),'trim',.022)

# Batch by material within each rigid pivot, keeping face states/hair/backpack removable.
def batch(parent):
    for child in list(parent.children):
        if child.type=='EMPTY':batch(child)
    buckets={}
    for child in list(parent.children):
        if child.type!='MESH':continue
        category='hair' if child.name.startswith('hero_hair') else 'body'
        key=(category,child.data.materials[0].name);buckets.setdefault(key,[]).append(child)
    for (category,mat),objs in buckets.items():
        bpy.ops.object.select_all(action='DESELECT')
        for ob in objs:ob.select_set(True)
        bpy.context.view_layer.objects.active=objs[0];bpy.ops.object.join()
        ob=objs[0];ob.name=parent.name+'_'+category+'_'+mat
        # Bake local geometry into pivot space so pivot animation stays predictable.
        transform=ob.matrix_basis.copy();ob.data.transform(transform);ob.matrix_basis.identity()
batch(hero);batch(pencil);batch(shield)

# Export named rigid-part animations; sockets move with forearms and held equipment.
bpy.context.scene.render.fps=30
def animate(name,length,kind):
    for ob in [body,head,armR,armL,legR,legL]:
        ob.rotation_euler=(0,0,0)
    body.location=(0,0,0)
    for f in range(0,length+1,5):
        t=f/max(1,length);phase=t*math.pi*2
        for ob in [body,head,armR,armL,legR,legL]:ob.rotation_euler=(0,0,0)
        body.location=(0,0,0)
        if kind in ['Walk','Run']:
            amplitude=.45 if kind=='Walk' else .68
            armR.rotation_euler[0]=math.sin(phase)*amplitude;armL.rotation_euler[0]=-math.sin(phase)*amplitude
            legR.rotation_euler[0]=-math.sin(phase)*amplitude;legL.rotation_euler[0]=math.sin(phase)*amplitude
            body.location.z=abs(math.sin(phase))*(.018 if kind=='Walk' else .035)
        elif kind=='Idle':body.location.z=math.sin(phase)*.007;head.rotation_euler[2]=math.sin(phase)*.02
        elif kind=='Attack':armR.rotation_euler[0]=-math.sin(t*math.pi)*1.1;armR.rotation_euler[1]=math.sin(t*math.pi)*-.5;body.rotation_euler[2]=math.sin(phase)*.13
        elif kind=='Hit':body.rotation_euler[0]=math.sin(t*math.pi)*-.17;head.rotation_euler[0]=math.sin(t*math.pi)*-.12
        elif kind=='Victory':armR.rotation_euler[1]=-abs(math.sin(t*math.pi))*1.8;armL.rotation_euler[1]=abs(math.sin(t*math.pi))*1.8;body.location.z=math.sin(t*math.pi)*.09
        elif kind=='Defeat':body.rotation_euler[0]=t*.25;head.rotation_euler[0]=t*.2;body.location.z=-t*.06
        for ob in [body,head,armR,armL,legR,legL]:ob.keyframe_insert(data_path='rotation_euler',frame=f);ob.keyframe_insert(data_path='location',frame=f)
    for ob in [body,head,armR,armL,legR,legL]:
        action=ob.animation_data.action;action.name=name+'_'+ob.name
        track=ob.animation_data.nla_tracks.new();track.name=name;track.strips.new(name,0,action);ob.animation_data.action=None
for name,length in [('Idle',60),('Walk',30),('Run',20),('Attack',20),('Hit',20),('Victory',40),('Defeat',30)]:animate(name,length,name)
for ob in [body,head,armR,armL,legR,legL]:ob.rotation_euler=(0,0,0)
body.location=(0,0,0)

# Export model only, keeping every expression in the file for runtime switching.
bpy.ops.object.select_all(action='DESELECT')
for root in [hero,pencil,shield]:
    for ob in [root]+list(root.children_recursive):ob.select_set(True)
glb=os.path.join(PUBLIC if CYCLE>=2 or TOY else OUT,'hero-quality.glb' if CYCLE>=2 or TOY else 'hero-prototype.glb')
bpy.ops.export_scene.gltf(filepath=glb,export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_force_sampling=True)
for ob in [body,head,armR,armL,legR,legL]:
    if ob.animation_data:
        for track in ob.animation_data.nla_tracks:track.mute=True
def expression_visible(active):
    for key,ob in expressions.items():
        for part in [ob]+list(ob.children_recursive):part.hide_render=key!=active;part.hide_viewport=key!=active
expression_visible('neutral')

# Keep standalone gear offstage in unarmed views; export above keeps root origins at zero.
pencil.location=xyz((5,0,0));shield.location=xyz((-5,0,0))
# A three-light turntable using the same axis/front convention as the game.
scene=bpy.context.scene;scene.render.engine='BLENDER_EEVEE_NEXT';scene.render.resolution_x=640;scene.render.resolution_y=720;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.film_transparent=False
scene.world.color=(.055,.065,.075);scene.view_settings.view_transform='AgX'
groundmat=material('studio_ground','CED7D7',.9)
bpy.ops.mesh.primitive_plane_add(size=200);ground=bpy.context.object;ground.name='Studio ground';ground.data.materials.append(groundmat)
def light(name,pos,power,size):
    data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='DISK';data.size=size
    ob=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(ob);ob.location=xyz(pos);ob.rotation_euler=(Vector(xyz((0,.8,0)))-ob.location).to_track_quat('-Z','Y').to_euler()
light('Key',(-3,4,4),350,4);light('Fill',(3,2,2),180,3);light('Rim',(1,3,-3),320,3)
data=bpy.data.cameras.new('Quality turntable');camera=bpy.data.objects.new('Quality turntable',data);bpy.context.collection.objects.link(camera);scene.camera=camera;data.type='ORTHO';data.ortho_scale=1.92
renderdir=os.path.join(OUT,('compact-' if TOY else 'cycle-')+str(CYCLE));os.makedirs(renderdir,exist_ok=True)
def render(name,pos,target=(0,.73,0)):
    camera.location=xyz(pos);camera.rotation_euler=(Vector(xyz(target))-camera.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=os.path.join(renderdir,name+'.png');bpy.ops.render.render(write_still=True)
for name,pos in [('front',(0,1.25,4)),('angle',(3,1.6,3)),('side',(4,1.3,0)),('back',(0,1.4,-4)),('game',(0,5,3))]:render(name,pos)
for expr in ['smile','surprise','anger','sad','hit','victory']:
    expression_visible(expr)
    render('expression-'+expr,(0,1.25,4))
expression_visible('neutral')
# Equipped showcase uses the same grip sockets and placements as the runtime.
pencil.parent=bpy.data.objects.get('hero_socket_weapon');pencil.location=(0,0,0)
shield.parent=body;shield.location=xyz((.345,.49,.15));shield.scale=(.85,.85,.85)
render('equipped-angle',(3,1.6,3));render('equipped-front',(0,1.25,4))
# Store optional showcase gear separately in .blend; runtime equips from game state.
triangles=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in hero.children_recursive if o.type=='MESH')
stats={'cycle':CYCLE,'style':'compact school adventurer with original swept spikes','triangles_all_expressions':triangles,'meshes':sum(o.type=='MESH' for o in hero.children_recursive),'materials':len(M),'animation_tracks':sorted(set(t.name for o in hero.children_recursive if o.animation_data for t in o.animation_data.nla_tracks)),'expressions':list(expressions),'head_ratio':2.68,'glb_bytes':os.path.getsize(glb)}
with open(os.path.join(renderdir,'structure.json'),'w')as f:json.dump(stats,f,indent=2)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'hero-quality.blend' if CYCLE>=2 or TOY else 'hero-prototype.blend'))
print('HERO_QUALITY',json.dumps(stats))

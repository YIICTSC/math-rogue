"""Original GAKURO sport/VR avatar kit. Blender 4.5; game coordinates: Y up, Z front.
Meshes are authored here, while colors, expressions and rigs remain editable in Three.js.
Run: blender --background --factory-startup --python scripts/blender/build-avatar-studio.py
"""
import bpy, math, json, pathlib
from mathutils import Vector
ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / 'public/models/storybook'
ART = ROOT / 'assets/avatar-studio'
OUT.mkdir(parents=True, exist_ok=True); ART.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
assets = []
def xyz(p): return (p[0], -p[2], p[1])
def material(name, color, rough=.35, metal=0):
    m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF'); p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Roughness'].default_value=rough; p.inputs['Metallic'].default_value=metal
    return m
mats={'skin':material('warm porcelain skin',(.86,.52,.30),.38),
      'hair':material('chestnut satin hair',(.12,.045,.025),.40),
      'outfit':material('teal sport fabric',(.018,.38,.36),.48),
      'ink':material('midnight enamel',(.025,.035,.065),.28),
      'gold':material('champagne metal',(.94,.60,.16),.23,.72),
      'pink':material('coral satin',(.86,.12,.26),.3),
      'white':material('ivory trim',(.92,.88,.75),.4),
      'green':material('jade accent',(.035,.48,.28),.25),
      'lens':material('smoky blue glass',(.025,.12,.19),.16,.35)}
def mesh(name, verts, faces, mat='hair', sub=0):
    d=bpy.data.meshes.new(name); d.from_pydata([xyz(v) for v in verts],[],faces); d.update()
    o=bpy.data.objects.new(name,d); bpy.context.collection.objects.link(o); o.data.materials.append(mats[mat])
    for p in d.polygons:p.use_smooth=True
    if sub:
        mod=o.modifiers.new('Silhouette subdivision','SUBSURF');mod.levels=sub
        bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
    return o
def ellipsoid(p,s,mat='hair',name='volume'):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=20,ring_count=12,location=xyz(p));o=bpy.context.object;o.name=name
    o.scale=(s[0],s[2],s[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.data.materials.append(mats[mat])
    for poly in o.data.polygons:poly.use_smooth=True
    return o
def box(p,s,mat='outfit',bevel=.08):
    bpy.ops.mesh.primitive_cube_add(size=1,location=xyz(p));o=bpy.context.object;o.scale=(s[0],s[2],s[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    b=o.modifiers.new('Soft machined edges','BEVEL');b.width=bevel;b.segments=3;bpy.ops.object.modifier_apply(modifier=b.name)
    n=o.modifiers.new('Weighted corner normals','WEIGHTED_NORMAL');bpy.ops.object.modifier_apply(modifier=n.name)
    o.data.materials.append(mats[mat]);return o
def tube(points,radius,mat='gold'):
    c=bpy.data.curves.new('polished piping','CURVE');c.dimensions='3D';c.resolution_u=8;c.bevel_depth=radius;c.bevel_resolution=2
    s=c.splines.new('BEZIER');s.bezier_points.add(len(points)-1)
    for b,p in zip(s.bezier_points,points):b.co=xyz(p);b.handle_left_type=b.handle_right_type='AUTO'
    o=bpy.data.objects.new('piping',c);bpy.context.collection.objects.link(o);c.materials.append(mats[mat])
    bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.convert(target='MESH');o.select_set(False);return o
def lock(points,width,depth,mat='hair',root=True):
    # Swept oval section, broad root, smooth blade taper and bent pointed tip.
    points=[Vector(p) for p in points];verts=[];faces=[];rings=10;sides=10
    for j in range(rings+1):
        t=j/rings;q=(1-t)**2*points[0]+2*t*(1-t)*points[1]+t*t*points[2]
        tangent=(2*(1-t)*(points[1]-points[0])+2*t*(points[2]-points[1])).normalized()
        u=tangent.cross(Vector((0,0,1)))
        if u.length<.1:u=tangent.cross(Vector((0,1,0)))
        u.normalize();v=tangent.cross(u).normalized()
        taper=max(.012,(1-t)**.65)*(.72+.42*math.sin(t*math.pi)) if root else max(.012,math.sin(t*math.pi)**.65)
        for k in range(sides):
            a=k*math.tau/sides;verts.append(tuple(q+u*math.cos(a)*width*taper+v*math.sin(a)*depth*taper))
    for j in range(rings):
        for k in range(sides):
            a=j*sides+k;b=j*sides+(k+1)%sides;faces.append((a,b,b+sides,a+sides))
    faces.extend([tuple(reversed(range(sides))),tuple(rings*sides+k for k in range(sides))])
    return mesh('sculpted lock',verts,faces,mat,1)
def join(objects,name):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects:o.select_set(True)
    bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();o=bpy.context.object;o.name=name
    # Bake transform so origin is the shared game rig origin.
    bpy.ops.object.transform_apply(location=True,rotation=True,scale=True);assets.append(o);return o
def capture(name,fn):
    before=set(bpy.data.objects);fn();return join([o for o in bpy.data.objects if o not in before],name)
def profile(name,rows,mat='outfit',segments=24):
    verts=[];faces=[]
    for y,rx,rz,zc in rows:
        for i in range(segments):
            a=i*math.tau/segments;verts.append((rx*math.cos(a),y,zc+rz*math.sin(a)))
    for j in range(len(rows)-1):
        for i in range(segments):
            a=j*segments+i;b=j*segments+(i+1)%segments;faces.append((a,a+segments,b+segments,b))
    faces.extend([tuple(range(segments)),tuple((len(rows)-1)*segments+i for i in range(segments-1,-1,-1))])
    o=mesh(name,verts,faces,mat,1);assets.append(o);return o
# Sculpted cheek/chin planes, tailored torso, boot toe and glove/thumb silhouettes.
profile('humanhead',[(-1,.08,.12,0),(-.87,.47,.52,.02),(-.56,.82,.78,.02),(-.15,1,.91,0),(.35,.98,.94,-.02),(.72,.76,.72,-.05),(1,.08,.09,-.07)],'skin')
profile('head',[(-1,.12,.12,0),(-.65,.8,.8,0),(0,1,1,0),(.65,.8,.8,0),(1,.1,.1,0)],'skin')
profile('sweater',[(-.5,.39,.31,0),(-.44,.43,.34,0),(-.10,.41,.32,0),(.28,.48,.32,0),(.42,.39,.28,0),(.5,.25,.23,0)],'outfit')
profile('trouser',[(-.5,.8,.8,0),(-.43,.84,.84,0),(.16,1,.94,0),(.5,.88,.86,0)],'ink')
capture('sleeve',lambda:ellipsoid((0,0,0),(.9,1,.9),'outfit'))
capture('mitten',lambda:(ellipsoid((0,0,0),(.78,1,.62),'skin'),ellipsoid((.65,-.18,.17),(.36,.48,.4),'skin')))
profile('shoe',[(-.5,.40,.39,.05),(-.36,.5,.48,.05),(-.02,.48,.5,.08),(.23,.39,.43,.03),(.5,.3,.3,-.13)],'ink')
capture('ear',lambda:ellipsoid((0,0,0),(.76,1,.65),'skin'))
profile('pointedear',[(-.5,.8,.6,0),(-.2,1,.65,0),(.25,.55,.4,0),(.5,.025,.025,0)],'skin')
capture('robothead',lambda:box((0,0,0),(1,1,.85),'ink',.18))
capture('collar',lambda:box((0,0,0),(1,1,.25),'white',.10))
capture('haircap',lambda:ellipsoid((0,0,0),(1,1,1)))
profile('muzzle',[(-1,.12,.1,0),(-.5,.8,.7,.08),(.12,1,.9,.04),(.65,.7,.7,0),(1,.1,.1,-.05)],'white')
capture('floppyear',lambda:lock([(0,.9,0),(.15,0,.25),(.2,-1,-.02)],.6,.3,'hair'))
capture('tail',lambda:lock([(0,-1,0),(.6,0,0),(.25,1,.05)],.45,.38,'skin'))
capture('hairlock',lambda:lock([(0,.5,0),(.18,0,.1),(-.1,-.5,0)],.3,.2))
capture('hairstrand',lambda:lock([(0,.5,0),(.16,0,.08),(-.06,-.5,.03)],.28,.16))
def scalp():
    verts=[];faces=[];n=32;r=10
    for j in range(r+1):
        for i in range(n):
            a=i*math.tau/n;front=max(0,math.cos(a));end=1.94-.76*front
            t=.015+(end-.015)*j/r
            verts.append((.535*math.sin(t)*math.sin(a),1.88+.61*math.cos(t),-.16+.535*math.sin(t)*math.cos(a)))
    for j in range(r):
        for i in range(n):
            a=j*n+i;b=j*n+(i+1)%n;faces.append((a,b,b+n,a+n))
    o=mesh('fitted open hair shell',verts,faces);mod=o.modifiers.new('Hair shell thickness','SOLIDIFY');mod.thickness=.035
    bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
def hair(style):
    if style not in [6,7]:scalp()
    if style in [0,1,2,3,4,5,9,10]:
        lock([(-.42,2.24,-.05),(-.13,2.43,.42),(.38,2.10,.34)],.18,.045,root=False)
        lock([(-.45,2.17,-.02),(-.32,2.32,.40),(-.02,2.08,.38)],.10,.04,root=False)
        for side in [-1,1]:
            lock([(side*.43,2.29,-.05),(side*.56,2.03,.02),(side*.46,1.81,.06)],.13,.12)
    if style in [1,2]:
        for i in range(7):
            a=(i/6*1.5+.25)*math.pi;x=math.cos(a)*.45;z=math.sin(a)*.27-.36
            end=1.57 if style==1 else 1.06
            lock([(x,2.17,z),(x*1.2,1.65,z-.08),(x*.9,end,z+.05)],.16,.14)
    if style==3:
        for i in range(3):lock([((i-1)*.1,2.3,-.58),(.13,1.94,-.93),((i-1)*.14,1.38,-.62)],.17,.14)
    if style==4:
        for s in [-1,1]:
            for i in range(3):lock([(s*.48,2.24,-.3),(s*(.8+i*.05),1.9,-.4),(s*(.62+i*.07),1.41+i*.08,-.3)],.17,.12)
    if style==5:
        ellipsoid((0,2.52,-.38),(.28,.25,.25))
        for i in range(3):lock([(-.22+i*.13,2.55,-.22),(-.12+i*.12,2.77,-.37),(.02+i*.09,2.49,-.57)],.1,.09)
    if style==6:
        ellipsoid((0,2.15,-.2),(.61,.51,.54))
        for j in range(3):
            for i in range(9):
                a=i*math.tau/9+j*.25;ellipsoid((math.sin(a)*(.48-j*.08),2.12+j*.2,-.2+math.cos(a)*(.44-j*.07)),(.20,.19,.19))
    if style==7:
        for i in range(4):lock([(0,2.32,.2-i*.2),(.03,2.67,.1-i*.2),(.15,2.74-i*.04,-i*.22)],.12,.15)
    if style==8:
        for i in range(7):
            a=i*math.tau/7;lock([(math.sin(a)*.24,2.26,-.15+math.cos(a)*.24),(math.sin(a)*.43,2.54,-.15+math.cos(a)*.42),(math.sin(a)*.62,2.65-abs(math.sin(a))*.13,-.15+math.cos(a)*.52)],.19,.12)
        for i in range(3):lock([(-.33+i*.25,2.4,.25),(-.23+i*.24,2.3,.48),(-.20+i*.23,2.08,.36)],.16,.08)
    if style==9:lock([(-.4,2.32,.17),(.18,2.63,.32),(.49,2.18,.28)],.22,.12)
    if style==10:
        for i in range(6):
            s=1 if i%2 else -1;lock([(s*.09,2.09-i*.12,-.61),(-s*.15,1.99-i*.12,-.72),(-s*.04,1.87-i*.12,-.62)],.1,.1)
for style in range(11):
    o=capture('hairdo_'+str(style),lambda s=style:hair(s))
    # Fuse intersecting roots and crown into a continuous sculpt, then simplify.
    bpy.context.view_layer.objects.active=o
    remesh=o.modifiers.new('Fused sculpted hair roots','REMESH');remesh.mode='VOXEL';remesh.voxel_size=.018
    bpy.ops.object.modifier_apply(modifier=remesh.name)
    smooth=o.modifiers.new('Polished hair transitions','SMOOTH');smooth.factor=.7;smooth.iterations=3
    bpy.ops.object.modifier_apply(modifier=smooth.name)
    dec=o.modifiers.new('Game silhouette budget','DECIMATE');dec.ratio=.16
    bpy.ops.object.modifier_apply(modifier=dec.name)
    for poly in o.data.polygons:poly.use_smooth=True

def ring(cx,cy,cz,rx,ry,r,mat):tube([(cx+rx*math.cos(i*math.tau/24),cy+ry*math.sin(i*math.tau/24),cz) for i in range(25)],r,mat)
def accessories(id):
    if id in [1,4,5,6]:
        for side in [-1,1]:
            if id in [1,4]:ring(side*.20,1.97,.44,.155,.125,.028 if id==1 else .015,'gold')
            else:tube([(side*.20+x,1.97+y,.45) for x,y in [(-.15,-.08),(-.15,.08),(.15,.08),(.15,-.08),(-.15,-.08)]],.021,'ink')
            if id in [1,6]:ellipsoid((side*.20,1.97,.432),(.14,.095,.021),'lens')
            tube([(side*.33,1.99,.43),(side*.52,1.99,.13),(side*.52,1.91,-.13)],.018,'ink')
        box((0,1.99,.45),(.12,.026,.028),'gold',.01)
    if id==2:
        ellipsoid((0,2.20,-.20),(.61,.41,.54),'outfit')
        box((0,2.12,.34),(.85,.20,.11),'lens',.06)
        for s in [-1,1]:ellipsoid((s*.55,2.09,-.12),(.07,.13,.14),'gold')
        tube([(-.02,2.58,-.44),(-.02,2.62,-.17),(-.02,2.56,.12)],.035,'white')
    if id==3:
        ring(0,2.43,-.15,.43,.09,.048,'gold')
        for i in range(5):
            x=(i-2)*.17;lock([(x,2.42,-.04),(x,2.65,.01),(x,2.71+(i%2)*.06,-.02)],.10,.045,'gold')
        ellipsoid((0,2.52,.065),(.065,.08,.035),'green')
    if id==7:
        for s in [-1,1]:lock([(.34,2.30,.30),(.34+s*.20,2.45,.32),(.34+s*.17,2.22,.26)],.11,.045,'pink')
        ellipsoid((.34,2.31,.33),(.052,.055,.04),'gold')
    if id==8:
        for i in range(5):
            a=i*math.tau/5;ellipsoid((-.39+math.cos(a)*.08,2.25+math.sin(a)*.08,.29),(.065,.058,.026),'pink')
        ellipsoid((-.39,2.25,.32),(.04,.04,.023),'gold')
        lock([(-.43,2.16,.25),(-.57,2.16,.26),(-.55,2.28,.25)],.045,.02,'green')
    if id==9:
        tube([(-.57,1.91,-.12),(-.5,2.37,-.12),(0,2.56,-.12),(.5,2.37,-.12),(.57,1.91,-.12)],.05,'ink')
        for s in [-1,1]:
            box((s*.57,1.92,-.12),(.17,.34,.28),'ink',.07)
            ellipsoid((s*.66,1.92,-.1),(.023,.11,.09),'gold')
    if id==10:
        tube([(-.5,2.16,-.10),(0,2.53,-.10),(.5,2.16,-.10)],.028,'pink')
        for s in [-1,1]:
            lock([(s*.33,2.39,-.12),(s*.42,2.58,-.12),(s*.43,2.69,-.12)],.14,.065,'ink')
            lock([(s*.34,2.43,-.045),(s*.41,2.56,-.045),(s*.43,2.64,-.045)],.075,.015,'pink')
    if id==11:
        ellipsoid((.08,2.43,-.19),(.57,.19,.48),'outfit')
        lock([(.2,2.57,-.15),(.2,2.65,-.15),(.27,2.65,-.15)],.025,.025,'ink')
        box((-.26,2.42,.19),(.10,.06,.04),'gold',.02)
    if id==12:
        for s in [-1,1]:
            ring(s*.55,1.73,.03,.028,.037,.009,'gold')
            verts=[]
            for z in [.04,.08]:
                for i in range(10):
                    a=math.pi/2+i*math.pi/5;r=.085 if i%2==0 else .04;verts.append((s*.55+math.cos(a)*r,1.63+math.sin(a)*r,z))
            faces=[tuple(range(9,-1,-1)),tuple(range(10,20))]+[(i,(i+1)%10,(i+1)%10+10,i+10) for i in range(10)]
            mesh('star charm',verts,faces,'gold')
    if id==13:
        tube([(-.51,2.21,-.12),(-.38,2.21,.16),(0,2.21,.32),(.38,2.21,.16),(.51,2.21,-.12)],.045,'outfit')
        ellipsoid((0,2.20,.42),(.50,.028,.28),'white')
catalog={}
for id in range(1,14):
    before=set(bpy.data.objects);accessories(id);pieces=[o for o in bpy.data.objects if o not in before];catalog[str(id)]=[]
    material_groups={key:[o for o in pieces if o.data.materials[0]==m] for key,m in mats.items()}
    for key,group in material_groups.items():
        if group:join(group,f'acc_{id}_{key}');catalog[str(id)].append(key)

bpy.ops.object.select_all(action='DESELECT')
for o in assets:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'characters-v3.glb'),export_format='GLB',use_selection=True,export_animations=False)
(OUT/'characters-v3-catalog.json').write_text(json.dumps({'version':3,'models':[o.name for o in assets],'accessories':catalog},indent=2)+'\n')

# Review assembly uses the same component normalization/transforms as the game.
scene=bpy.context.scene
for o in assets:o.hide_render=True;o.hide_set(True)
def instance(name,p=(0,0,0),s=(1,1,1),mat=None,normalized=False):
    src=next(o for o in assets if o.name==name);o=src.copy();o.data=src.data.copy();scene.collection.objects.link(o);o.hide_render=False;o.hide_set(False)
    if normalized:
        coords=[v.co for v in o.data.vertices];low=Vector([min(v[i] for v in coords) for i in range(3)]);high=Vector([max(v[i] for v in coords) for i in range(3)])
        for v in o.data.vertices:
            for i in range(3):v.co[i]=(v.co[i]-(low[i]+high[i])/2)/(high[i]-low[i])
    o.location=xyz(p);o.scale=(s[0],s[2],s[1])
    if mat:o.data.materials.clear();o.data.materials.append(mats[mat])
    return o
instance('humanhead',(0,1.87,-.13),(.98,1.14,1.02),'skin',True)
instance('hairdo_0');instance('sweater',(0,1.2,-.13),(.86,.80,.6),'outfit',True)
for side in [-1,1]:
    instance('trouser',(side*.25,.5,-.13),(.32,.85,.32),'ink',True)
    instance('shoe',(side*.29,.1,.04),(.35,.18,.55),'ink',True)
    instance('sleeve',(side*.5,1.14,-.10),(.30,.60,.32),'outfit',True)
    instance('mitten',(side*.53,.84,-.02),(.26,.28,.26),'skin',True)
    ellipsoid((side*.19,1.965,.36),(.077,.107,.032),'ink')
    ellipsoid((side*.19-.021,2.005,.392),(.023,.028,.008),'white')
    tube([(side*.19-.06,2.12,.30),(side*.19,2.135,.32),(side*.19+.06,2.12,.30)],.012,'hair')
tube([(-.06,1.73,.398),(0,1.717,.409),(.06,1.73,.398)],.01,'ink')
scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True
scene.render.resolution_x=768;scene.render.resolution_y=768;scene.render.resolution_percentage=100
scene.world.color=(.2,.2,.2);scene.view_settings.view_transform='AgX'
box((0,-.07,0),(200,.08,200),'white',.01)
for p,power,size in [((-3,5,5),550,5),((4,3,2),400,4),((0,4,-4),700,3)]:
    bpy.ops.object.light_add(type='AREA',location=xyz(p));o=bpy.context.object;o.data.energy=power;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector(xyz((0,1.3,0)))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add();camera=bpy.context.object;camera.data.type='ORTHO';camera.data.ortho_scale=3.2;scene.camera=camera
camera.location=xyz((4,2.6,6));camera.rotation_euler=(Vector(xyz((0,1.30,0)))-camera.location).to_track_quat('-Z','Y').to_euler()
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(ART/'avatar-studio.blend'))
for name,p in [('front',(0,2,7)),('angle',(4,2.6,6)),('side',(7,2,0)),('back',(0,2,-7))]:
    camera.location=xyz(p);camera.rotation_euler=(Vector(xyz((0,1.30,0)))-camera.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(ART/(name+'.png'));bpy.ops.render.render(write_still=True)
print('AVATAR_STUDIO_COMPLETE',len(assets),'components', (OUT/'characters-v3.glb').stat().st_size,'bytes')

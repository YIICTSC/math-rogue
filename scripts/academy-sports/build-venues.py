"""Original academy sports venues and equipment. Blender 4+, metres, +Y up in GLB.
Reproduce: blender -b -t 2 --python scripts/academy-sports/build-venues.py
No character or existing sports file is overwritten.
"""
import bpy, math, json, sys, argparse
from mathutils import Vector, Matrix
from pathlib import Path
OUT=Path('public/models/academy-sports');OUT.mkdir(parents=True,exist_ok=True)
PALETTE={'grass':'427868','grass2':'508674','soil':'b78b64','line':'f8edd1','navy':'193c52','teal':'35b9b0','gold':'efbd5c','rose':'d77e73','steel':'668b94','concrete':'ccd2bd','wood':'c79362','glass':'91c6ca','dark':'173039','white':'f2f2e5','red':'d44f55','blue':'4088af','cloth':'44b6b3'}
M={};groups={}
def xyz(p):return(p[0],-p[2],p[1])
def reset():
 bpy.ops.wm.read_factory_settings(use_empty=True);M.clear();groups.clear()
def mat(c):
 if c not in M:
  m=bpy.data.materials.new('TeamCloth' if c=='cloth' else c);h=PALETTE.get(c,c);m.diffuse_color=tuple((int(h[i:i+2],16)/255/12.92 if int(h[i:i+2],16)/255<=.04045 else ((int(h[i:i+2],16)/255+.055)/1.055)**2.4) for i in (0,2,4))+(1,);m.roughness=.7;m.use_nodes=True;m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=m.diffuse_color;m.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=.68;M[c]=m
 return M[c]
def obj(o,name,c):
 o.name=name;o.data.materials.append(mat(c));groups.setdefault(name,[]).append(o);return o
def box(name,p,size,c,bevel=0):
 bpy.ops.mesh.primitive_cube_add(size=1,location=xyz(p));o=bpy.context.object;o.scale=(size[0],size[2],size[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if bevel:
  m=o.modifiers.new('Rounded edges','BEVEL');m.width=bevel;m.segments=2;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=m.name)
 return obj(o,name,c)
def sphere(name,p,scale,c,seg=12):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=seg,ring_count=8,radius=1,location=xyz(p));o=bpy.context.object;o.scale=(scale[0],scale[2],scale[1]);return obj(o,name,c)
def cylinder(name,p,radius,height,c,vertices=12):
 bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=height,location=xyz(p));return obj(bpy.context.object,name,c)
def rod(name,a,b,r,c):
 a,b=Vector(xyz(a)),Vector(xyz(b));d=b-a;bpy.ops.mesh.primitive_cylinder_add(vertices=8,radius=r,depth=d.length,location=(a+b)/2);o=bpy.context.object;o.rotation_euler=d.to_track_quat('Z','Y').to_euler();return obj(o,name,c)
def arc(name,p,r,start,end,c,width=.04,n=48):
 points=[(p[0]+math.sin(start+(end-start)*i/n)*r,p[1],p[2]+math.cos(start+(end-start)*i/n)*r)for i in range(n+1)]
 for a,b in zip(points,points[1:]):rod(name,a,b,width,c)
def poly(name,verts,faces,c):
 m=bpy.data.meshes.new(name);m.from_pydata([xyz(p)for p in verts],[],faces);m.update();o=bpy.data.objects.new(name,m);bpy.context.collection.objects.link(o);return obj(o,name,c)
def label(text,p,size=1):
 curve=bpy.data.curves.new('Academy lettering','FONT');curve.body=text;curve.size=size;curve.align_x='CENTER';curve.extrude=.012;o=bpy.data.objects.new('Lettering',curve);bpy.context.collection.objects.link(o);o.location=xyz(p);o.rotation_euler=(math.pi/2,0,0);o.data.materials.append(mat('line'));bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.convert(target='MESH');groups.setdefault('Venue',[]).append(bpy.context.object);o.select_set(False)
def export(file):
 for name,objects in groups.items():
  bpy.ops.object.select_all(action='DESELECT')
  for o in objects:o.select_set(True)
  bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();joined=bpy.context.object;joined.name=name
  bpy.context.scene.cursor.location=(0,0,0);bpy.ops.object.origin_set(type='ORIGIN_CURSOR');bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 bpy.ops.object.select_all(action='SELECT');bpy.ops.export_scene.gltf(filepath=str((OUT/(file+'.glb')).resolve()),export_format='GLB',use_selection=True,export_animations=False,export_yup=True,export_materials='EXPORT')
 print('ACADEMY_ASSET '+file,flush=True)
def lamps(x,z):
 rod('Venue',(x,0,z),(x,14,z),.16,'steel');box('Venue',(x,14,z),(4,.5,1.2),'navy',.12)
 for i in range(5):sphere('Venue',(x-1.5+i*.75,13.9,z+.65),(.25,.15,.1),'gold')
def bench(p,yaw=0,name='Venue'):
 # The seat faces local +Z; rotate the entire assembly toward the court.
 before=len(groups.get(name,[]))
 box(name,(p[0],.8,p[2]),(4,.18,1),'teal',.08);box(name,(p[0],1.3,p[2]-.5),(4,.9,.15),'navy',.08)
 for x in[-1.4,1.4]:rod(name,(p[0]+x,0,p[2]),(p[0]+x,.8,p[2]),.06,'steel')
 rotation=Matrix.Rotation(yaw,4,'Z');center=Vector(xyz(p))
 for o in groups[name][before:]:
  o.location=center+rotation@(o.location-center)
  o.rotation_euler=(rotation.to_3x3()@o.rotation_euler.to_matrix()).to_euler()
def tree(x,z):
 cylinder('Venue',(x,1.4,z),.23,2.8,'soil');sphere('Venue',(x,3,z),(1.5,1.9,1.5),'grass2')
def fence(a,b,h=3):
 rod('Venue',(a[0],h,a[1]),(b[0],h,b[1]),.07,'steel');rod('Venue',(a[0],.4,a[1]),(b[0],.4,b[1]),.05,'steel');d=math.hypot(b[0]-a[0],b[1]-a[1]);n=int(d/.7)
 for i in range(n+1):
  t=i/max(1,n);x=a[0]+(b[0]-a[0])*t;z=a[1]+(b[1]-a[1])*t;rod('Venue',(x,0,z),(x,h,z),.025,'steel')
def seats(x,z,rows=4,count=14,dx=1.5,dz=-1.4):
 front=-1 if dz>0 else 1
 for row in range(rows):
  box('Venue',(x,1+row*.7,z+row*dz),(count*dx+2,.6,1.8),'concrete',.1)
  for i in range(count):
   xx=x+(i-(count-1)/2)*dx;zz=z+row*dz;box('Venue',(xx,1.5+row*.7,zz),(.85,.18,.8),'teal' if(i+row)%3 else 'gold',.08);box('Venue',(xx,1.85+row*.7,zz-front*.35),(.85,.65,.14),'navy',.06)
  rod('Venue',(x-count*dx/2,2+row*.7,z+row*dz+front*.8),(x+count*dx/2,2+row*.7,z+row*dz+front*.8),.035,'steel')
def football():
 # Keep the terrace below the turf: coplanar top faces flicker on mobile GPUs.
 reset();box('Venue',(0,-.31,0),(65,.5,92),'concrete',.5)
 for i in range(12):box('Venue',(0,-.025,-30.25+i*5.5),(42,.05,5.5),'grass' if i%2 else 'grass2')
 for x in[-21,21]:box('Venue',(x,.015,0),(.08,.025,66),'line')
 for z in[-33,0,33]:box('Venue',(0,.02,z),(42,.03,.08),'line')
 arc('Venue',(0,.035,0),6,0,math.pi*2,'line',.035)
 for sign in[-1,1]:
  for width,depth in[(20,11),(10,4)]:
   for x in[-width/2,width/2]:box('Venue',(x,.03,sign*(33-depth/2)),(.07,.025,depth),'line')
   box('Venue',(0,.03,sign*(33-depth)),(width,.025,.07),'line')
  for x in[-4.2,4.2]:rod('GoalFrame',(x,0,sign*33),(x,2.8,sign*33),.1,'white');rod('GoalFrame',(x,2.8,sign*33),(x,2.2,sign*35),.06,'white')
  rod('GoalFrame',(-4.2,2.8,sign*33),(4.2,2.8,sign*33),.1,'white')
  # Nets are rendered separately and deform on goals.
  for x in[-20.7,20.7]:
   rod('Venue',(x,0,sign*32.7),(x,1.5,sign*32.7),.04,'steel');poly('Venue',[(x,1.5,sign*32.7),(x+.8,1.2,sign*32.7),(x,1,sign*32.7)],[(0,1,2)],'gold')
  seats(0,sign*39,4,26,dz=sign*1.4)
 for x in[-28,28]:
  bench((x,0,0),-math.copysign(math.pi/2,x),'BenchLeft' if x<0 else 'BenchRight');lamps(x,-30);lamps(x,30)
 box('Venue',(0,10,-42),(17,4,.8),'navy',.2);label('GAKURO  STADIUM',(0,10,-41.5),1.1)
 export('soccer-stadium')
def baseball():
 reset();box('Venue',(0,-.3,-12),(150,.5,130),'grass',1)
 center=(0,.01,18);verts=[center]+[(math.sin(a)*66,.01,18-math.cos(a)*66)for a in[-math.pi/4+i*math.pi/64 for i in range(33)]];poly('Venue',verts,[(0,i,i+1)for i in range(1,33)],'grass2')
 poly('Venue',[(0,.035,21),(18,.035,5),(0,.035,-13),(-18,.035,5)],[(0,1,2,3)],'soil')
 for x,z in[(0,18),(13,5),(0,-8),(-13,5)]:box('Venue',(x,.09,z),(.65,.16,.65),'line',.07)
 cylinder('Venue',(0,.09,0),1.5,.17,'soil',32);box('Venue',(0,.19,0),(.65,.03,.2),'line')
 for sign in[-1,1]:rod('Venue',(0,.07,18),(sign*47,.07,-29),.045,'line');box('Venue',(sign*1,.04,18),(1,.025,2),'line')
 prev=None
 for i in range(33):
  a=-math.pi/4+i*math.pi/64;x,z=math.sin(a)*66,18-math.cos(a)*66
  if prev:fence(prev,(x,z),3)
  prev=(x,z)
 for sign in[-1,1]:
  rod('Venue',(sign*46.7,0,-28.7),(sign*46.7,15,-28.7),.1,'gold');bench((sign*22,0,20));box('Venue',(sign*22,2.5,21),(11,.3,4),'navy',.1);seats(sign*33,29,4,14,dz=1.5);lamps(sign*45,-15);lamps(sign*33,29)
 fence((-8,23),(8,23),5);box('Venue',(0,8,-53),(19,5,1),'navy',.3);label('ACADEMY  BALLPARK',(0,8,-52.4),1)
 for x in range(-65,66,15):tree(x,-61)
 export('baseball-stadium')
def gym():
 reset();box('Venue',(0,-.2,0),(29,.4,33),'wood',.2)
 for i in range(30):box('Venue',(0,.015,-14.5+i),(27,.025,.94),'wood' if i%2 else 'e1b77a')
 box('Venue',(0,.04,0),(9,.04,18),'teal')
 for x in[-4.5,4.5]:box('Venue',(x,.075,0),(.07,.02,18),'line')
 for z in[-9,-3,0,3,9]:box('Venue',(0,.075,z),(9,.02,.07),'line')
 for x in[-5,5]:cylinder('Venue',(x,1.3,0),.12,2.6,'steel');cylinder('Venue',(x,.8,0),.2,1.6,'blue');rod('Venue',(x,2.43,-.08),(x,3.05,-.08),.025,'red')
 for row in range(15):rod('Venue',(-5,1.4+row*.07,0),(5,1.4+row*.07,0),.008,'white')
 for col in range(121):x=-5+col/12;rod('Venue',(x,1.4,0),(x,2.43,0),.008,'white')
 rod('Venue',(-5,2.43,0),(5,2.43,0),.035,'white');box('Venue',(6,1.2,0),(1,.15,1),'navy',.05)
 for x in[-6.4,-5.6]:rod('Venue',(x,0,-.4),(x,1.2,-.4),.045,'steel')
 for sign in[-1,1]:bench((sign*10,0,0),-sign*math.pi/2,'BenchLeft' if sign<0 else 'BenchRight');seats(sign*8,-12,3,7);box('Venue',(sign*14,5,0),(.4,10,33),'concrete',.1)
 box('Venue',(0,5,-16),(29,10,.35),'concrete');box('Venue',(0,6,-15.7),(11,2,.2),'navy',.1);label('THE ACADEMY  /  VOLLEY',(0,6,-15.5),.65)
 for z in[-12,-6,0,6,12]:
  rod('Venue',(-13,10,z),(0,12,z),.12,'steel');rod('Venue',(0,12,z),(13,10,z),.12,'steel');box('Venue',(0,10.5,z),(5,.15,.45),'white',.03)
 export('volleyball-gym')
def race():
 reset();box('Venue',(0,-.3,-110),(48,.5,248),'grass');box('Venue',(0,-.01,-110),(12,.1,238),'concrete')
 for z in range(0,-231,-10):
  box('Venue',(0,.06,z),(.12,.015,3),'line')
  for sign in[-1,1]:
   x=sign*(12+(abs(z)//10)%3*2);h=5+(abs(z)//10)%4*2
   if -140<z<-90:tree(x,z)
   else:
    box('Venue',(x,h/2,z),(8,h,8),'navy' if z%30==0 else 'soil',.2);box('Venue',(x,h+.3,z),(8.7,.7,8.7),'rose',.1)
    for yy in range(2,h,2):
     for xx in[-2,0,2]:box('Venue',(x+xx,yy,z+4.05),(1.2,1.2,.1),'glass')
 for z in[4,-222]:
  for x in[-6,6]:cylinder('Venue',(x,2.6,z),.24,5.2,'navy')
  box('Venue',(0,5.2,z),(13,.8,1),'teal',.12);label('START' if z>0 else 'FINISH',(0,5,z+.6),.6)
 # The bridge and steps use the same heights as the race collision surface.
 verts=[(x,max(0,2.1-abs(d-118)*.19),-d)for d in[107,118,129]for x in[-6,6]]
 poly('Venue',verts,[(0,1,3,2),(2,3,5,4)],'wood')
 for sign in[-1,1]:
  for a,b in[(107,118),(118,129)]:rod('Venue',(sign*5.8,1+max(0,2.1-abs(a-118)*.19),-a),(sign*5.8,1+max(0,2.1-abs(b-118)*.19),-b),.055,'teal')
 for i in range(1,6):
  start=153+i*2;end=min(164,start+2)
  if end>start:box('Venue',(0,i*.09,-(start+end)/2),(12,i*.18,end-start),'wood')
 export('festival-campus')
def rooms():
 reset();box('Venue',(0,-.25,-73),(20,.5,176),'navy')
 for i in range(8):
  z=-8-i*18;c=['teal','blue','gold','rose'][i%4];box('Venue',(0,0,z),(11,.14,17),'wood',.08)
  for sign in[-1,1]:box('Venue',(sign*6,1.5,z),(1,3,17),'concrete',.1);rod('Venue',(sign*5.2,3,z-8),(sign*5.2,3,z+8),.07,c)
  for x in[-5,5]:cylinder('Venue',(x,2.3,z-8),.16,4.6,c)
  box('Venue',(0,4.6,z-8),(10,.3,.5),c,.08);label('ROOM  '+str(i+1),(0,4.8,z-7.6),.6)
 export('festival-rooms')
def arena(name,roof=False,awards=False):
 reset();box('Venue',(0,-.25,0),(24,.5,24),'concrete',.4)
 if roof:
  box('Venue',(0,.02,0),(18,.04,18),'wood',.1)
  for x in[-9,9]:box('Venue',(x,.08,0),(.12,.03,18),'gold')
  for z in[-9,9]:box('Venue',(0,.08,z),(18,.03,.12),'gold')
  for x,z in[(-11,-11),(11,-11),(-11,11),(11,11)]:cylinder('Venue',(x,2,z),.17,4,'steel')
  for x in[-22,22]:box('Venue',(x,1,-7),(12,8,12),'navy',.2)
 elif awards:
  for team,height in[(0,1.3),(1,.8),(2,.5)]:box('Venue',((team-1)*3,height/2,0),(2.8,height,2.8),'teal' if team==0 else 'blue',.15)
  arc('Venue',(0,.12,0),9,0,math.pi*2,'gold',.07)
 else:
  cylinder('Venue',(0,2.4,0),1.5,4.8,'navy',16)
  for i in range(8):
   a=i*math.pi/4;x,z=math.sin(a)*4.1,math.cos(a)*4.1;h=2.4+(i%3)*.6;cylinder('TargetPlatform'+str(i),(x,h/2,z),1.28,h,'teal' if i%2 else 'gold',12)
 for sign in[-1,1]:seats(0,sign*14,3,14,dz=sign*1.2)
 box('Venue',(0,5,-13),(14,2,.3),'navy',.15);label('ACADEMY  FESTIVAL',(0,5,-12.8),.8);export(name)
def equipment():
 reset()
 sphere('Baseball',(0,0,0),(.12,.12,.12),'white',16)
 for i in range(24):
  a=i*math.pi/12;rod('Baseball',(.095*math.sin(a),.08*math.cos(a),.04),(.105*math.sin(a+.08),.09*math.cos(a+.08),.05),.006,'red')
 sphere('SoccerBall',(0,0,0),(.23,.23,.23),'white',16)
 for i in range(12):
  a=i*math.pi/6;sphere('SoccerBall',(math.sin(a)*.205,math.cos(a)*.16,math.sin(a*3)*.12),(.075,.06,.075),'navy',8)
 sphere('VolleyBall',(0,0,0),(.23,.23,.23),'white',16)
 for i in range(3):
  a=i*math.pi/3
  for j in range(10):
   t=j*math.pi/10;sphere('VolleyBall',(.225*math.cos(t)*math.cos(a),.225*math.sin(t),.225*math.cos(t)*math.sin(a)),(.028,.028,.028),'gold' if i%2 else 'blue',8)
 rod('Bat',(0,0,0),(0,.95,0),.035,'wood');sphere('Bat',(0,.82,0),(.065,.22,.065),'wood');cylinder('Bat',(0,.03,0),.055,.05,'navy')
 sphere('Glove',(0,0,0),(.16,.20,.09),'soil');sphere('Glove',(0,.04,.055),(.10,.13,.025),'dark')
 for i in range(4):rod('Glove',(-.1+i*.065,.08,.065),(-.1+i*.065,.22,.055),.025,'wood')
 sphere('Helmet',(0,0,0),(.33,.25,.29),'cloth');box('Helmet',(0,-.04,.27),(.44,.035,.32),'navy',.02)
 box('CatcherGear',(0,0,0),(.44,.42,.09),'navy',.05)
 for y in[-.12,0,.12]:box('CatcherGear',(0,y,.065),(.40,.035,.06),'gold',.015)
 for name,style in [('BaseballJersey',0),('SoccerJersey',1),('VolleyJersey',2),('FestivalJersey',3)]:
  box(name,(0,0,0),(.49,.42,.32),'white' if style==0 else 'cloth',.035)
  if style==0:
   for x in[-.16,-.08,0,.08,.16]:box(name,(x,0,.167),(.009,.38,.012),'cloth')
  else:
   for x in[-.22,.22]:box(name,(x,0,.025),(.045,.4,.31),'white',.015)
  box(name,(-.12,.09,.173),(.06,.065,.015),'gold',.008);box(name,(.07,.02,.173),(.035,.12,.012),'white');box(name,(.13,.02,.173),(.035,.12,.012),'white')
 box('KneePad',(0,0,0),(.18,.16,.21),'navy',.04)
 for x in[-1,1]:cylinder('Hurdle',(x,.6,0),.06,1.2,'steel');box('Hurdle',(x,.07,0),(.7,.1,.5),'navy',.03)
 box('Hurdle',(0,1.2,0),(2.2,.2,.18),'rose',.04)
 box('MovingGate',(0,1.4,0),(7,2.8,.5),'teal',.12)
 box('FloorTile',(0,0,0),(3,.24,2),'gold',.08)
 sphere('RollingBall',(0,0,0),(1,1,1),'rose',16)
 sphere('Target',(0,0,0),(1.2,1.2,1.2),'cloth',20);arc('Target',(0,0,0),1.22,0,math.pi*2,'gold',.065)
 cylinder('Trophy',(0,.1,0),.32,.2,'navy');cylinder('Trophy',(0,.55,0),.1,.8,'gold');sphere('Trophy',(0,1,0),(.5,.4,.5),'gold',16)
 for sign in[-1,1]:arc('Trophy',(sign*.35,1,0),.35,0,math.pi*2,'gold',.055,20)
 sphere('Boost',(0,0,0),(.3,.3,.3),'teal');box('Medkit',(0,0,0),(.5,.4,.25),'white',.05);box('Medkit',(0,0,.14),(.1,.3,.04),'red');box('Medkit',(0,0,.14),(.3,.1,.04),'red');sphere('ThrowBall',(0,0,0),(.25,.25,.25),'gold')
 verts=[(math.sin(i*math.pi/5)*(.35 if i%2==0 else .15),math.cos(i*math.pi/5)*(.35 if i%2==0 else .15),0)for i in range(10)];poly('ShockStar',[(0,0,0)]+verts,[(0,i+1,(i+1)%10+1)for i in range(10)],'gold')
 export('equipment')
parser=argparse.ArgumentParser();parser.add_argument('--only',default='');args=parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
builders={'baseball-stadium':baseball,'soccer-stadium':football,'volleyball-gym':gym,'festival-campus':race,'festival-rooms':rooms,'festival-target':lambda:arena('festival-target'),'festival-roof':lambda:arena('festival-roof',True),'festival-awards':lambda:arena('festival-awards',awards=True),'equipment':equipment}
if args.only and args.only not in builders:raise ValueError('Unknown venue: '+args.only)
for name,builder in builders.items():
 if not args.only or args.only==name:builder()
Path('assets/academy-sports/asset-build.json').write_text(json.dumps({'generator':'scripts/academy-sports/build-venues.py','units':'metres','up':'+Y','front':'+Z','files':sorted(p.name for p in OUT.glob('*.glb'))},indent=2)+'\n')

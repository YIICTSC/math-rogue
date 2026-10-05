export const ROAD_WIDTH = 24;
export const COURSES = [
  { name: 'NEON CAMPUS', subtitle: 'ネオン・キャンパス', sky: '#111735', fog: '#22284c', ground: '#151d35', accent: '#43f5df', second: '#ff65bc', difficulty: 'BALANCED', elevation: 1 },
  { name: 'CLOUD GARDEN', subtitle: 'クラウド・ガーデン', sky: '#8ccce8', fog: '#c2e6ee', ground: '#478886', accent: '#f7ce59', second: '#ffffff', difficulty: 'FLOW', elevation: 1.6 },
  { name: 'SOLAR WORKS', subtitle: 'ソーラー・ワークス', sky: '#493246', fog: '#c97665', ground: '#392d40', accent: '#ffae58', second: '#aa99ff', difficulty: 'TECHNICAL', elevation: .7 },
  { name: 'LIBRARY LOOP', subtitle: '図書館ループ', sky: '#283044', fog: '#536277', ground: '#313c40', accent: '#ffc985', second: '#c6d8ff', difficulty: 'TECHNICAL', elevation: .4 },
  { name: 'FOREST CLASSROOM', subtitle: '森の教室', sky: '#b7e3cb', fog: '#b1d2c1', ground: '#426d4d', accent: '#bbff68', second: '#ffe6a0', difficulty: 'FLOW', elevation: 1 },
  { name: 'HARBOR SCHOOL', subtitle: '海辺の学校', sky: '#9fdaef', fog: '#c7e7ee', ground: '#397e98', accent: '#66e5ff', second: '#fff1ad', difficulty: 'BALANCED', elevation: .2 },
  { name: 'AURORA LAB', subtitle: 'オーロラ研究所', sky: '#152a43', fog: '#344d68', ground: '#1e354b', accent: '#72ffc9', second: '#c697ff', difficulty: 'TECHNICAL', elevation: 1.2 },
  { name: 'STADIUM SPRINT', subtitle: '放課後スタジアム', sky: '#5a354a', fog: '#a56d7a', ground: '#463a54', accent: '#ffeb73', second: '#ff8bbb', difficulty: 'BALANCED', elevation: .35 },
];
export type Point = { x: number; y: number; z: number };
export type TrackPoint = Point & { tx: number; ty: number; tz: number; curve: number };
export type Track = { points: TrackPoint[]; length: number };
const cache = new Map<string, Track>();
const mod = (n: number, m: number) => ((n % m) + m) % m;
function spline(a: number, b: number, c: number, d: number, t: number) {
  return .5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
}
export function getTrack(course: number, custom?: CustomCourse): Track {
  course = Math.max(0, Math.min(COURSES.length - 1, Math.floor(course) || 0));
  const key = custom ? JSON.stringify(custom) : String(course);
  if (cache.has(key)) return cache.get(key)!;
  const controls = custom?.points ?? courseControls(course);
  const raw: Point[] = [], lengths = [0];
  for (let i = 0; i <= 2400; i++) {
    const u = i / 2400 * controls.length, j = Math.floor(u), t = u - j;
    const p = [0, 1, 2].map(axis => spline(...([-1, 0, 1, 2].map(k => controls[mod(j + k, controls.length)][axis]) as [number, number, number, number]), t));
    const point = { x: p[0], y: p[1], z: p[2] };
    if (i) lengths.push(lengths[i - 1] + Math.hypot(point.x - raw[i - 1].x, point.y - raw[i - 1].y, point.z - raw[i - 1].z));
    raw.push(point);
  }
  const length = lengths[lengths.length - 1], points: TrackPoint[] = [];
  let cursor = 0;
  for (let i = 0; i < 1024; i++) {
    const d = i / 1024 * length;
    while (cursor < lengths.length - 2 && lengths[cursor + 1] < d) cursor++;
    const t = (d - lengths[cursor]) / (lengths[cursor + 1] - lengths[cursor]);
    const a = raw[cursor], b = raw[cursor + 1];
    points.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t, tx: 0, ty: 0, tz: 1, curve: 0 });
  }
  points.forEach((p, i) => {
    const a = points[mod(i - 1, 1024)], b = points[(i + 1) % 1024], len = Math.hypot(b.x - a.x, b.z - a.z);
    p.tx = (b.x - a.x) / len; p.tz = (b.z - a.z) / len; p.ty = (b.y - a.y) / len;
  });
  points.forEach((p, i) => {
    const a = points[mod(i - 2, 1024)], b = points[(i + 2) % 1024];
    p.curve = Math.atan2(a.tz * b.tx - a.tx * b.tz, a.tx * b.tx + a.tz * b.tz) / (4 * length / 1024);
  });
  const track = { points, length }; if(cache.size>=32)cache.delete(cache.keys().next().value!); cache.set(key, track); return track;
}
export function sampleTrack(distance: number, course: number, lane = 0, custom?: CustomCourse): TrackPoint {
  const track = getTrack(course, custom), u = mod(distance, track.length) / track.length * 1024, i = Math.floor(u), t = u - i;
  const a = track.points[i], b = track.points[(i + 1) % 1024];
  const tx = a.tx + (b.tx - a.tx) * t, tz = a.tz + (b.tz - a.tz) * t;
  return { x: a.x + (b.x - a.x) * t + tz * lane, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t - tx * lane, tx, tz, ty: a.ty + (b.ty - a.ty) * t, curve: a.curve + (b.curve - a.curve) * t };
}
export const FEATURES = [
  { at: .10, lane: -6, type: 'box' }, { at: .10, lane: 0, type: 'box' }, { at: .10, lane: 6, type: 'box' },
  { at: .18, lane: -5, type: 'boost' }, { at: .26, lane: 0, type: 'jump' },
  { at: .38, lane: -6, type: 'box' }, { at: .38, lane: 0, type: 'box' }, { at: .38, lane: 6, type: 'box' },
  { at: .52, lane: 5, type: 'boost' },
  { at: .66, lane: -6, type: 'box' }, { at: .66, lane: 0, type: 'box' }, { at: .66, lane: 6, type: 'box' },
  { at: .74, lane: -4, type: 'jump' }, { at: .89, lane: 0, type: 'boost' },
] as const;

export function courseControls(course:number):number[][] {
  const controls = [
    [0, 0, -180], [0, 0, 60], [0, 0, 300], [0, 0, 540], [0, 0, 780], [0, 0, 1020],
    [85, 15, 1140], [260, 25, 1140], [360, 32, 1030], [330, 18, 890], [430, 5, 770],
    [380, 0, 620], [235, 16, 560], [250, 8, 300], [280, 0, -150], [180, 0, -380], [0, 0, -420], [0, 0, -300],
  ];
  if (course === 1) { controls[9] = [410, 36, 890]; controls[12] = [200, 28, 530]; }
  if (course === 2) { controls[8] = [325, 24, 1015]; controls[9] = [240, 12, 910]; controls[10] = [430, 4, 805]; }
  const variants: Record<number, number[][]> = {
    3: [[100,3,1140],[350,6,1160],[490,4,1000],[420,2,830],[510,1,650],[420,0,430],[230,3,430],[230,2,220],[320,0,-100],[200,0,-380]],
    4: [[80,14,1160],[260,28,1240],[410,36,1120],[370,20,940],[500,4,850],[450,5,650],[260,24,570],[210,15,320],[260,0,-130],[180,0,-380]],
    5: [[120,3,1180],[370,4,1140],[500,4,1000],[510,2,800],[430,1,650],[430,0,440],[300,3,480],[320,2,250],[400,0,-120],[230,0,-400]],
    6: [[100,12,1160],[300,24,1200],[390,38,1070],[440,34,920],[340,18,790],[480,8,630],[250,26,560],[300,10,300],[340,0,-150],[180,0,-380]],
    7: [[120,4,1180],[360,6,1160],[470,5,1020],[470,3,800],[470,2,600],[470,0,400],[460,0,150],[430,0,-100],[370,0,-300],[180,0,-420]],
  };
  variants[course]?.forEach((point, i) => { controls[i + 6] = point; });
  return controls.map(p=>[p[0],p[1]*COURSES[course].elevation,p[2]]);
}

export type TrackFeature = {at:number;lane:number;type:'boost'|'jump'|'box'};
export interface CustomCourse {version:1;name:string;theme:number;points:number[][];features:TrackFeature[]}
export const LOCKED_POINTS=[0,1,2,3,16,17];
export function customCourseError(value:unknown):string|null {
 const c=value as CustomCourse;
 if(!c||c.version!==1||typeof c.name!=='string'||!c.name.trim()||c.name.length>32||!Number.isInteger(c.theme)||c.theme<0||c.theme>=COURSES.length||!Array.isArray(c.points)||c.points.length!==18||!Array.isArray(c.features)||c.features.length>48)return 'コースデータが不正です。';
 const fixed=courseControls(c.theme);
 for(let i=0;i<18;i++){
  const p=c.points[i];if(!Array.isArray(p)||p.length!==3||p.some(v=>typeof v!=='number'||!Number.isFinite(v))||p[0]<-800||p[0]>1600||p[1]<-20||p[1]>100||p[2]<-1000||p[2]>1600)return 'コースの範囲を超えています。';
  if(LOCKED_POINTS.includes(i)&&p.some((v,j)=>v!==fixed[i][j]))return '問題のストレートと接続部分は変更できません。';
  const next=c.points[(i+1)%18];if(!Array.isArray(next)||Math.hypot(p[0]-next[0],p[2]-next[2])<60)return 'コースの点を60m以上離してください。';
 }
 for(const f of c.features)if(!f||!['boost','jump','box'].includes(f.type)||!Number.isFinite(f.at)||f.at<0||f.at>=1||!Number.isFinite(f.lane)||Math.abs(f.lane)>9)return '配置物が不正です。';
 const track=getTrack(c.theme,c);
 if(!Number.isFinite(track.length)||track.length<1600||track.length>9000||track.points.some(p=>![p.x,p.y,p.z,p.tx,p.ty,p.tz,p.curve].every(Number.isFinite)))return '走行できるコースに調整してください。';
 if(c.features.some(f=>f.at*track.length<490))return '配置物は問題のストレートの後に置いてください。';
 return null;
}
export function validCustomCourse(c:unknown):c is CustomCourse{return customCourseError(c)===null;}
export function makeCustomCourse(theme=0):CustomCourse{
 const c:CustomCourse={version:1,name:'MY GRAND PRIX',theme,points:courseControls(theme),features:[]};
 const length=getTrack(theme,c).length;c.features=FEATURES.filter(f=>f.at*length>=490).map(f=>({...f}));return c;
}
export function trackFeatures(custom?:CustomCourse):readonly TrackFeature[]{return custom?.features??FEATURES;}

import { avatarOf, FURS, HAIR, PANTS, SHIRTS, SKINS, type Avatar } from './avatar';
/** One original sprite definition for both the creator and island renderer. */
export function avatarSvg(raw:Avatar):string {
  const a=avatarOf(raw),skin=a.kind?FURS[a.fur]:SKINS[a.skin],hair=HAIR[a.hair],shirt=SHIRTS[a.shirt],pants=PANTS[a.pants];
  const path=(d:string,fill:string,stroke='')=>`<path d="${d}" fill="${fill}"${stroke?` stroke="${stroke}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"`:''}/>`;
  const rect=(x:number,y:number,w:number,h:number,c:string,r=3)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${c}"/>`;
  const circle=(x:number,y:number,r:number,c:string)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`;
  let back='',head='',face='',clothes='',hat='',accessory='';
  // Hair behind the shoulders; each cut retains its silhouette under a hat.
  if(!a.kind){
    if([2,3,4,7].includes(a.hairstyle))back+=rect(36,41,57,68,hair,16);
    if(a.hairstyle===3)back+=path('M87 40Q119 55 103 92L91 81Q104 57 83 55Z',hair);
    if(a.hairstyle===4)back+=path('M40 40Q12 49 24 93L39 73ZM88 40Q116 49 104 93L89 73Z',hair);
    if(a.hairstyle===7)for(const x of [32,96])for(let j=0;j<5;j++)back+=circle(x,60+j*8,6,hair);
  }else{
    if([1,4].includes(a.kind))back+=path('M84 127Q123 113 109 85Q105 106 79 111Z',skin);
    if(a.kind===2)back+=path('M82 126Q105 134 112 108', 'none',skin);
    if(a.kind===3)back+=circle(88,120,9,'#fff8e7');
  }
  if(a.accessory===4)back+=rect(27,88,73,40,'#986541',12);
  // Outfit construction: twelve distinct silhouettes and trim patterns.
  clothes+=rect(44,119,17,25,pants,5)+rect(67,119,17,25,pants,5)+rect(40,139,22,9,'#39434c',4)+rect(66,139,22,9,'#39434c',4);
  clothes+=rect(31,88,15,32,shirt,7)+rect(82,88,15,32,shirt,7)+circle(38,120,6,skin)+circle(90,120,6,skin);
  clothes+=rect(42,84,44,42,shirt,9);
  if(a.style===1)clothes+=path('M48 86V115H80V86M48 101H80','none',pants)+rect(47,108,34,20,pants,3)+circle(50,103,2,'#e4cf89')+circle(78,103,2,'#e4cf89');
  if(a.style===2)clothes+=path('M44 88Q64 107 84 88','none','#fff8')+rect(51,110,26,9,'#0002',4)+path('M58 96V108M70 96V108','none','#fff9');
  if(a.style===3)clothes+=path('M44 85L63 99 84 85 78 110 64 120 50 110Z','#355474')+path('M49 86L64 97 79 86','none','#fff3d9')+path('M64 97L59 107 64 114 69 107Z','#d88282');
  if(a.style===4)clothes+=path('M43 92L33 134Q64 147 95 134L85 92Z',shirt)+path('M38 130Q64 143 90 130','none','#fff6')+path('M46 107H82','none','#efd98f');
  if(a.style===5)clothes+=path('M44 86L36 135H62V88H67V135H92L84 86Z',shirt)+path('M49 87L59 104 64 90 70 104 80 87','none','#fff7')+circle(71,113,2,'#e3cd84')+circle(71,123,2,'#e3cd84');
  if(a.style===6)clothes+=rect(44,96,16,15,'#ddc492')+rect(68,96,16,15,'#ddc492')+path('M46 122H82','none','#786044')+rect(62,117,6,9,'#e8d5a4');
  if(a.style===7)clothes+=rect(47,88,34,43,'#fff3df',4)+path('M49 93L76 121M77 94L49 120','none','#d1c5ac')+circle(59,109,2,'#6f7d81')+circle(69,109,2,'#6f7d81');
  if(a.style===8)clothes+=path('M44 85L28 136Q64 151 100 136L84 85Z',shirt)+path('M65 90L60 97 69 97Z','#f6dd87')+path('M46 117L49 124 56 124 50 129 51 136 46 132 40 135 41 128 36 123 43 123Z','#f6dd87');
  if(a.style===9)clothes+=path('M44 87L82 124M82 88L44 124','none','#333e55')+path('M45 119H83','none','#e4c38a');
  if(a.style===10)clothes+=path('M45 87L64 80 83 87 79 116 64 128 49 116Z','#bccbd2','#6e8799')+path('M64 88V116M53 101H76','none','#e5edf0')+rect(28,90,17,13,'#bccbd2')+rect(83,90,17,13,'#bccbd2');
  if(a.style===11)clothes+=path('M45 87L34 134H94L83 87Z',shirt)+path('M64 94V132','none','#eaf0cf')+rect(43,109,16,11,'#fff4')+rect(70,109,16,11,'#fff4');
  // Distinct species: ears, muzzle, markings and beak, rather than a color swap.
  if(a.kind===1||a.kind===4)head+=path('M38 47L31 14 54 32ZM75 31L99 14 91 48Z',skin)+path('M38 36L36 25 49 35ZM82 35L94 25 89 37Z','#df9c9c');
  if(a.kind===2)head+=path('M42 34Q17 30 24 73L39 74 48 45ZM81 33Q110 30 104 74L89 74 79 44Z','#694f43');
  if(a.kind===3)head+=`<ellipse cx="45" cy="25" rx="10" ry="23" fill="${skin}"/><ellipse cx="83" cy="25" rx="10" ry="23" fill="${skin}"/><ellipse cx="45" cy="25" rx="4" ry="17" fill="#e6a5b0"/><ellipse cx="83" cy="25" rx="4" ry="17" fill="#e6a5b0"/>`;
  if(a.kind===5||a.kind===6)head+=circle(40,34,13,a.kind===6?'#34404a':skin)+circle(88,34,13,a.kind===6?'#34404a':skin);
  head+=rect(35,32,58,55,a.kind===6?'#f3efdf':skin,20);
  if(a.kind===4)head+=path('M36 65Q64 88 92 65L82 82Q64 94 46 82Z','#fff0d2');
  if(a.kind===6)head+=`<ellipse cx="51" cy="58" rx="11" ry="14" fill="#39444e"/><ellipse cx="77" cy="58" rx="11" ry="14" fill="#39444e"/>`;
  if(a.kind===7)head+=path('M49 36Q63 15 78 34L63 28Z',shirt);
  if(a.kind===8)head+=circle(45,37,13,skin)+circle(83,37,13,skin);
  if(!a.kind){
    const cuts=[ 'M35 54V40Q64 11 93 40V53L78 41 65 47 52 39Z','M34 63V42Q64 11 94 42V73L83 65V44L61 52 46 43V67Z','M35 53V40Q64 12 93 40V55L76 40 54 48Z','M35 51V40Q64 14 93 40L84 52 67 37 49 46Z','M35 49V40Q64 13 93 40V50L75 39 54 47Z','M34 48L28 34 43 35 45 17 60 28 70 15 78 30 96 26 92 49 76 40 54 46Z','','M36 48V38Q64 16 92 38V49L77 40 64 45 51 40Z','M35 56V41Q64 14 93 40V50L78 36 41 59Z','M35 43Q64 15 93 43L85 40Q64 30 43 40Z'];
    head+=path(cuts[a.hairstyle],hair);
    if(a.hairstyle===6)for(let i=0;i<7;i++)head+=circle(37+i*9,36+(i%2)*5,10,hair);
  }
  const ink=a.kind===6?'#f3eddd':'#35404a';
  const eyes=(left=true,right=true)=>`${left?circle(51,59,3,ink):path('M47 59L54 61','none',ink)}${right?circle(77,59,3,ink):path('M73 61L80 58','none',ink)}`;
  face+=a.expression===2||a.expression===3||a.expression===7?path('M47 59Q51 55 55 59M73 59Q77 55 81 59','none',ink):eyes(true,a.expression!==4);
  if(a.expression===1)face+=circle(52,58,1,'#fff')+circle(78,58,1,'#fff');
  if(a.expression===5)face+=`<ellipse cx="64" cy="76" rx="5" ry="7" fill="#714c4b"/>`;
  else if(a.expression===3)face+=path('M53 71Q64 94 75 71Z','#864f53')+path('M56 75H72','none','#fff1df');
  else if(a.expression===9)face+=path('M57 78Q64 72 71 78','none','#785253');
  else if(a.expression===6)face+=path('M46 50L55 54M73 54L82 50M57 76H71','none',ink);
  else face+=path('M56 73Q64 81 72 73','none','#86585a');
  if(a.expression===8)face+=circle(43,69,5,'#eb929780')+circle(85,69,5,'#eb929780');
  if(a.expression===7)face+=path('M87 63L90 72 84 72Z','#b4d8e6');
  if(a.kind&&a.kind!==7&&a.kind!==8)face+=path('M59 65L69 65 64 70Z','#79584f');
  if(a.kind===7)face+=path('M57 65L64 75 72 65Z','#ebbe64');
  if(a.kind===1)face+=path('M39 65L25 62M40 71L25 73M89 65L103 62M88 71L103 73','none','#887465');
  const hatColor=a.hat===1?'#e8cd8b':shirt;
  if(a.hat===1||a.hat===2)hat+=rect(27,32,74,7,hatColor)+rect(40,19,48,17,hatColor,7)+rect(40,30,48,4,'#aa815c');
  if(a.hat===3)hat+=path('M34 37Q34 7 64 7Q94 7 94 37Z',shirt)+rect(32,32,64,9,shirt)+circle(64,7,7,'#f7e8cb');
  if(a.hat===4)hat+=path('M31 34Q30 14 61 15Q93 14 96 33L83 40H44Z',shirt)+rect(58,12,7,7,shirt);
  if(a.hat===5)hat+=path('M54 32L32 19 32 44ZM68 32L91 19 91 44Z',shirt)+circle(61,32,6,'#f8d6ba');
  if(a.hat===6)hat+=path('M39 33L32 14 49 25 63 8 78 25 96 14 89 33Z','#e8c25d')+circle(64,25,4,'#eb929e');
  if(a.hat===7)for(let i=0;i<5;i++)hat+=circle(37+i*13,32,6,i%2?shirt:'#f9db96')+circle(37+i*13,32,2,'#fff5d9');
  if(a.hat===8)hat+=path('M32 34Q35 6 64 6Q93 6 96 34Z','#e9bd61')+rect(27,31,74,7,'#d7a951')+rect(60,9,8,25,'#ffe6a5');
  if(a.accessory===1)accessory+=`<g fill="none" stroke="#364757" stroke-width="3"><rect x="40" y="52" width="22" height="16" rx="3"/><rect x="66" y="52" width="22" height="16" rx="3"/><path d="M62 59h4"/></g>`;
  if(a.accessory===2)accessory+=`<g fill="none" stroke="#705a4a" stroke-width="3"><circle cx="51" cy="60" r="11"/><circle cx="77" cy="60" r="11"/><path d="M62 60h4"/></g>`;
  if(a.accessory===3)accessory+=rect(38,81,52,12,'#deb66a',6)+path('M72 85L76 114 88 111 83 84Z','#deb66a');
  if(a.accessory===4)accessory+=path('M44 89L50 124M84 89L78 124','none','#a87852');
  if(a.accessory===5)accessory+=path('M29 57V46Q64 10 99 46V57','none','#51647f')+rect(25,48,12,25,'#647e9b',5)+rect(91,48,12,25,'#647e9b',5);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 160"><ellipse cx="64" cy="150" rx="34" ry="7" fill="#27463924"/>${back}${clothes}${head}${face}${hat}${accessory}</svg>`;
}

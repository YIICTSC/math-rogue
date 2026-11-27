// Original pixel silhouettes. Each garment has a distinct pattern and a tool.
const costumes: Record<string, readonly [string, string, string]> = {
  adventurer:['#238c75','#f9c843','pack'],
  swordsman:['#d63f42','#ffe379','blade'],
  guardian:['#2862bc','#adeaff','shield'],
  monk:['#e27422','#fff0a7','fists'],
  mage:['#5747cf','#f2d74a','wand'],
  medic:['#fff1d9','#ea648a','flower'],
  archer:['#42993e','#d5ec78','bow'],
  scout:['#236b69','#6bf4cc','knife'],
  scholar:['#354eb0','#aed7ff','book'],
  alchemist:['#369879','#f3edba','flask'],
  spellblade:['#a13998','#ff9666','flame'],
  spirit:['#3ba777','#bbffd8','lantern'],
  chronist:['#226ca1','#ffda79','clock'],
  tactician:['#9e4935','#feca60','banner'],
  cantor:['#cb4682','#ffcaec','lyre'],
  beast:['#b27830','#f2d890','paw'],
  summoner:['#7945cb','#89fff0','horn'],
  runes:['#664382','#fff398','seal'],
  astral:['#334cbb','#fff089','star'],
  sage:['#f2d18e','#fff9e6','scroll'],
  phantom:['#342c61','#b796fd','twin'],
  skymage:['#4c9bdb','#e6f9ff','wing'],
  drake:['#bf542f','#f9d14c','lance'],
  omni:['#6546a3','#ffef90','prism'],
  cardmaster:['#773db9','#ffba49','cards'],
  seeker:['#26776a','#ffe9a5','compass'],
};

const tools: Record<string, readonly string[]> = {
  pack:['.####.','#MMMM#','#MAAM#','#MAAM#','#MHMM#','#MMMM#','.####.'],
  blade:['....##','...#H#','..#H#.','.#H#..','##A#..','##A...','#M....'],
  shield:['.####.','#AMMA#','#AHHA#','#AMMA#','.#MM#.','..##..'],
  fists:['.#..#.','#AH#HA#','#AM#MA#','.##.##.'],
  wand:['..#H#.','.#HMH#','..#H#.','...#..','...#..','...#..','...#..'],
  flower:['..#A#.', '.#AHA#','..#A#.','..#M..','.#MM..','..#...'],
  bow:['..###.','.#..A#','.#...#','.#...#','.#..A#','..###.'],
  knife:['....##','...#H#','..#H#.','.#A#..','#M#...','.##...'],
  book:['.##.##.','#AH#HA#','#AM#MA#','#AH#HA#','.##.##.'],
  flask:['..##..','..AH..','..##..','.#HH#.','#AMMA#','#AMHA#','.####.'],
  flame:['...#..','..#H#.','.#HA#.','.#HMA#','..#A#.','.#M#..','##....'],
  lantern:['..##..','.#AA#.','#AHHA#','#AHHA#','#AMMA#','.####.'],
  clock:['.####.','#AHHA#','#AHMA#','#AMHA#','.####.','..##..'],
  banner:['######','#AHAA#','#AHM#.','#A##..','#.....','#.....','#.....'],
  lyre:['#...#','#A.A#','#A#A#','#AHA#','.###.'],
  paw:['.#.#.#.','#A#A#A#','.#.#.#.','..###..','.#AHA#.','..###..'],
  horn:['##....','#AH...','.#AH#.','..#AH#','...###'],
  seal:['.#####','#AHAA#','#AHHA#','#AMHA#','#A#A##','.##...'],
  star:['...#...','..#H#..','##AHA##','.#AHA#.','.#A#A#.','.##.##.'],
  scroll:['.#####','#AHHA#','.#AMA#','.#AHM#','.#####','..###.'],
  twin:['##..##','#H##H#','.#HH#.','..##..','.#MA#.','##..##'],
  wing:['....##','...#H#','..#HA#','.#HA#.','#HA#..','.##...'],
  lance:['....##','...#H#','..#H#.','..##..','..#...','..#...','..#...'],
  prism:['...#...','..#H#..','.#HAH#.','#AHAHA#','.#MAM#.','..###..'],
  cards:['..####','.#AHH#','#####.','#HAH#.','#HAH#.','#####.'],
  compass:['.#####','#AHMHA#','#MMHMM#','#AHMHA#','.#####.'],
};

const headgear: Record<string, readonly string[]> = {
  swordsman:['..##....','.##AH...','##AHH#..','##AA##..','.###....'],
  guardian:['.######.','#HAAAAH#','#AAAMM##','##.....#'],
  mage:['.....##.','....#H#.','...#AA#.','..#MAA#.','.#MMAA#.','#####A##','..####..'],
  medic:['.######.','#HHAAHH#','#HHAAHH#','###HH###'],
  archer:['..###H..','.##AH#..','##AAM###','#####...'],
  scout:['.######.','#HMMMMH#','#MM...##'],
  scholar:['...###..','..#HHH#.','####A###','.####...'],
  alchemist:['.##..##.','#AH##HA#','.######.'],
  spirit:['..H...H.','.#AH.HA#','.#A###A#','..####..'],
  summoner:['##....##','#A#..#A#','#AH##HA#','.######.'],
  astral:['#..H..#','#AHHAH#','.##A##.','..###..'],
  sage:['..####..','.#HHHH#.','#HAAAHH#','########'],
  phantom:['#.....#','#A...A#','.#AMA#.','..###..'],
  skymage:['.....H#.','...#H##.','.#HHA#..','######..'],
  drake:['#....##.','#A#..HA#','.HA##AA#','..#####.'],
  omni:['...H....','..#AH...','.#AMA#..','##AHAA##','.######.'],
  cardmaster:['..#####.','.#HMMMM#','.#AAAAA#','#######.'],
};

export function jobPixelColors(id:string):readonly [string,string] {
  return [costumes[id][0],costumes[id][1]];
}

export function drawJobPixels(c:CanvasRenderingContext2D,id:string,x:number,y:number,center:number,back:boolean,active:boolean,head=false){
  const [cloth,trim,tool]=costumes[id];
  const pixels=tools[tool];
  const colors:Record<string,string>={'#':'#171426',M:cloth,A:trim,H:'#fff4ce'};
  function stamp(rows:readonly string[],left:number,top:number){
    for(const [r,row] of rows.entries())for(const [col,symbol] of [...row].entries()){
      if(!colors[symbol])continue;
      c.fillStyle=colors[symbol];c.fillRect(left+col,top+r,1,1);
    }
  }
  if(head){
    const hat=headgear[id];
    if(hat)stamp(hat,center-5,Math.max(0,y+1));
    return;
  }
  const emblem=tool==='pack'||back ? ['.AAA.','AMHMA','AMMMA','.AAA.'] : pixels;
  stamp(emblem,center-3,y+23);
  // Keep the face and the character's hair accessory clear in every job.
  if(!active)stamp(pixels,x+(back?-4:-2),y+26);
  if(['astral','drake','phantom','guardian','tactician'].includes(id)){
    stamp(['.AH.','#AHA','##AM'],center-10,y+19);
    stamp(['.HA.','AHA#','MA##'],center+6,y+19);
  }
  if(['mage','medic','summoner','sage','runes','skymage','omni'].includes(id)){
    stamp(['AH..HA','AA..AA','H....H','A....A'],center-3,y+33);
  }
}

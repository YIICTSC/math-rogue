const WOODS={
  birch:['白樺','Birch','しらかば','birchplank','#dfc993'],
  frost:['霜木','Frostwood','しもき','frostplank','#adccce'],
  acacia:['アカシア','Acacia','アカシア','acaciaplank','#cb885e'],
  dark:['黒樫','Dark oak','くろがし','darkplank','#72513a'],
  bamboo:['竹','Bamboo','たけ','bambooplank','#c8bd75'],
} as const;
const STONES={
  granite:['花崗岩','Granite','かこうがん','granite','#b48273'],
  diorite:['閃緑岩','Diorite','せんりょくがん','diorite','#c8c8bf'],
  andesite:['安山岩','Andesite','あんざんがん','andesite','#919798'],
  basalt:['玄武岩','Basalt','げんぶがん','basalt','#4f565f'],
  deepslate:['深層岩','Deepslate','しんそうがん','deepslate','#50515c'],
  mossy:['苔石','Mossy stone','こけいし','mossybrick','#73846a'],
  sandstone:['砂岩','Sandstone','さがん','sandstone','#d6b777'],
  red_sandstone:['赤砂岩','Red sandstone','あかさがん','red_sandstone','#bc704b'],
  polished:['磨いた石','Polished stone','みがいたいし','polishedstone','#aab6be'],
} as const;

type Suffix='slab'|'stairs'|'fence';
export type ArchitecturalBlock=`${keyof typeof WOODS}_${Suffix}`|`${keyof typeof STONES}_${Exclude<Suffix,'fence'>}`;

export interface ArchitecturalMaterial {
  name: readonly [string,string,string];
  color:string;
  group:'stone'|'wood';
  pattern:'stone'|'plank';
  shape:Suffix;
  recipe:readonly [string,number,number];
}

const details={
  slab:['の薄板',' slab','のうすいた',3,6],
  stairs:['の階段',' stairs','のかいだん',6,4],
  fence:['の柵',' fence','のさく',4,4],
} as const;

const materials: [ArchitecturalBlock, ArchitecturalMaterial][]=[];
for(const [group,families,kinds] of [
  ['wood',WOODS,['slab','stairs','fence']], ['stone',STONES,['slab','stairs']],
] as const) {
  for(const [family,[ja,en,hi,stock,color]] of Object.entries(families))for(const shape of kinds) {
    const [suffix,english,kana,count,output]=details[shape];
    materials.push([`${family}_${shape}` as ArchitecturalBlock,{
      name:[ja+suffix,en+english,hi+kana],color,group,pattern:group==='wood'?'plank':'stone',shape,
      recipe:[stock,count,output],
    }]);
  }
}

export const ARCHITECTURAL_MATERIALS=Object.fromEntries(materials) as Record<ArchitecturalBlock,ArchitecturalMaterial>;

export const DETAIL_BLOCKS={
  ladder:{name:['はしご','Ladder','はしご'],color:'#bd915a',group:'wood',pattern:'plank',shape:'ladder',cost:{stick:7},count:4},
  hanging_rope:{name:['登り綱','Climbing rope','のぼりづな'],color:'#bfa474',group:'wood',pattern:'woven',shape:'rope',cost:{thread:5},count:3},
  scaffold:{name:['竹の足場','Bamboo scaffolding','たけのあしば'],color:'#bab074',group:'wood',pattern:'plank',shape:'scaffold',cost:{bamboo:6,thread:1},count:6},
  carpet:{name:['織り絨毯','Woven carpet','おりじゅうたん'],color:'#b45462',group:'color',pattern:'woven',shape:'carpet',cost:{redwool:2},count:3},
  signboard:{name:['木の看板','Wooden sign','きのかんばん'],color:'#bc986b',group:'wood',pattern:'plank',shape:'sign',cost:{plank:4,stick:1},count:2},
  hanging_sign:{name:['吊り看板','Hanging sign','つりかんばん'],color:'#b58b5f',group:'wood',pattern:'plank',shape:'hanging-sign',cost:{darkplank:4,chain:1},count:2},
  display_frame:{name:['額縁','Display frame','がくぶち'],color:'#bd904d',group:'wood',pattern:'plank',shape:'frame',cost:{stick:8,plank:1},count:1},
  field_banner:{name:['隊旗','Company banner','たいき'],color:'#547ab2',group:'color',pattern:'woven',shape:'banner',cost:{bluewool:5,stick:2},count:1},
  chain:{name:['鎖','Chain','くさり'],color:'#8498a2',group:'workshop',pattern:'metal',shape:'chain',cost:{iron_ingot:2},count:4},
  flowerpot:{name:['植木鉢','Flowerpot','うえきばち'],color:'#c28658',group:'farm',pattern:'brick',shape:'flowerpot',cost:{brick:3},count:1},
  garden_bed:{name:['花壇','Flower bed','かだん'],color:'#89a46d',group:'farm',pattern:'leaf',shape:'garden',cost:{stonebrick:3,dirt:2,herb:1},count:1},
  hydroponic_bed:{name:['水耕槽','Hydroponic bed','すいこうそう'],color:'#62b5ad',group:'farm',pattern:'metal',shape:'hydroponic',cost:{copper_ingot:2,glass:2,clay:1},count:1},
  brew_cauldron:{name:['醸造の大釜','Brewing cauldron','じょうぞうのおおがま'],color:'#789e87',group:'alchemy',pattern:'metal',shape:'cauldron',cost:{iron_ingot:5,copper_ingot:2,brew_table:1},count:1},
  summoning_altar:{name:['使い魔の祭壇','Familiar altar','つかいまのさいだん'],color:'#a88fbd',group:'alchemy',pattern:'ore',shape:'altar',cost:{amethyststone:4,echostone:2,crystal_powder:4},count:1},
  candle:{name:['ろうそく','Candle','ろうそく'],color:'#e9d59a',group:'workshop',pattern:'smooth',shape:'candle',cost:{thread:1,fruit:2},count:2,light:true},
  bronze_bell:{name:['青銅の鐘','Bronze bell','せいどうのかね'],color:'#cb964e',group:'workshop',pattern:'metal',shape:'bell',cost:{copper_ingot:4,iron_ingot:1},count:1},
  glowcap:{name:['光るキノコ','Glowcap','ひかるキノコ'],color:'#8cd8c6',group:'farm',pattern:'leaf',shape:'flowerpot',cost:{herb:2,crystal_powder:1},count:2,light:true},
  luminous_tile:{name:['光晶タイル','Luminous crystal tile','こうしょうタイル'],color:'#84d1c7',group:'stone',pattern:'ore',shape:'slab',cost:{quartz:2,crystal_powder:1},count:3,light:true},
  copper_block:{name:['銅のブロック','Copper block','どうのブロック'],color:'#b87057',group:'stone',pattern:'metal',shape:'cube',cost:{copper_ingot:6},count:1},
  iron_block:{name:['鉄のブロック','Iron block','てつのブロック'],color:'#a3b9c5',group:'stone',pattern:'metal',shape:'cube',cost:{iron_ingot:6},count:1},
  gold_block:{name:['金のブロック','Gold block','きんのブロック'],color:'#d8ab53',group:'stone',pattern:'metal',shape:'cube',cost:{gold_ingot:6},count:1},
  diamond_block:{name:['ダイヤのブロック','Diamond block','ダイヤのブロック'],color:'#74ccd3',group:'stone',pattern:'ore',shape:'cube',cost:{diamond:4},count:1},
  patina_copper:{name:['緑青の銅','Patinated copper','ろくしょうのどう'],color:'#508d80',group:'stone',pattern:'metal',shape:'cube',cost:{copper_block:1,fruit:1},count:1},
  metal_lattice:{name:['鉄格子','Iron lattice','てつごうし'],color:'#9398a3',group:'stone',pattern:'metal',shape:'fence',cost:{iron_ingot:3},count:4},
  amberglass:{name:['琥珀色のガラス','Amber glass','こはくいろのガラス'],color:'#d3a257',group:'glass',pattern:'glass',shape:'cube',cost:{glass:4,copper_ingot:1},count:4,transparent:true},
  violetglass:{name:['紫のガラス','Violet glass','むらさきのガラス'],color:'#ab8adb',group:'glass',pattern:'glass',shape:'cube',cost:{glass:4,crystal_powder:1},count:4,transparent:true},
  bluepane:{name:['青いガラス板','Blue glass pane','あおいガラスいた'],color:'#77b6de',group:'glass',pattern:'glass',shape:'pane',cost:{blueglass:4},count:8,transparent:true},
  pinkpane:{name:['桃色のガラス板','Pink glass pane','ももいろのガラスいた'],color:'#e8a7c6',group:'glass',pattern:'glass',shape:'pane',cost:{pinkglass:4},count:8,transparent:true},
  amberpane:{name:['琥珀色のガラス板','Amber glass pane','こはくいろのガラスいた'],color:'#d3a257',group:'glass',pattern:'glass',shape:'pane',cost:{amberglass:4},count:8,transparent:true},
  violetpane:{name:['紫のガラス板','Violet glass pane','むらさきのガラスいた'],color:'#ab8adb',group:'glass',pattern:'glass',shape:'pane',cost:{violetglass:4},count:8,transparent:true},
  violetwool:{name:['紫の羊毛','Violet wool','むらさきのようもう'],color:'#9670b5',group:'color',pattern:'woven',shape:'cube',cost:{wool:4,crystal_powder:1},count:4},
  orangewool:{name:['橙の羊毛','Orange wool','だいだいのようもう'],color:'#d29450',group:'color',pattern:'woven',shape:'cube',cost:{wool:4,fruit:2},count:4},
  redconcrete:{name:['赤いコンクリート','Red concrete','あかいコンクリート'],color:'#b55e60',group:'color',pattern:'smooth',shape:'cube',cost:{whiteconcrete:8,redwool:1},count:8},
  violetconcrete:{name:['紫のコンクリート','Violet concrete','むらさきのコンクリート'],color:'#8171ad',group:'color',pattern:'smooth',shape:'cube',cost:{whiteconcrete:8,violetwool:1},count:8},
  concrete_powder:{name:['コンクリート粉末','Concrete powder','コンクリートふんまつ'],color:'#cbc5aa',group:'color',pattern:'gravel',shape:'cube',cost:{sand:2,gravel:2,clay:1},count:5},
  packed_ice:{name:['滑る氷床','Packed ice','すべるこおりゆか'],color:'#9dd6ec',group:'stone',pattern:'glass',shape:'cube',cost:{snow:5,glass:1},count:2,transparent:true},
  slime_floor:{name:['スライム床','Slime floor','スライムゆか'],color:'#81b77f',group:'color',pattern:'glass',shape:'cube',cost:{cactus:4,fruit:2},count:2,transparent:true},
  honey_floor:{name:['ハチミツ床','Honey floor','ハチミツゆか'],color:'#d09246',group:'color',pattern:'glass',shape:'cube',cost:{wool:2,bottled_honey:1},count:2,transparent:true},
  rebound_floor:{name:['反発床','Spring floor','はんぱつゆか'],color:'#d38f74',group:'machines',pattern:'metal',shape:'slab',cost:{slime_floor:1,iron_ingot:2},count:1},
} as const;

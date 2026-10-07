/** Shared by the authoritative simulation, recipes and the Three.js palette. */
export type BlockShape='cube'|'slab'|'stairs'|'fence'|'pane'|'workbench'|'furnace'|'chest'|'torch'|'lantern'|'composter'|'irrigator';
export type BlockGroup='natural'|'wood'|'stone'|'color'|'glass'|'workshop'|'farm';
type Definition={name:string;color:string;group:BlockGroup;shape:BlockShape;pattern:string;transparent?:boolean;light?:boolean};
const b=(name:string,color:string,group:BlockGroup,pattern='grain',shape:BlockShape='cube',extra:Partial<Definition>={}):Definition=>({name,color,group,pattern,shape,...extra});
export const VOXEL_CATALOG={
 wood:b('木材','#98704a','wood','log'),stone:b('石材','#829096','stone','stone'),plank:b('木の板','#c39a63','wood','plank'),brick:b('レンガ','#ae6550','stone','brick'),
 frostwood:b('霜木','#c5dee0','wood','log'),ore:b('鉄鉱石','#a99177','natural','ore'),crystal:b('魔晶石','#9e75ce','natural','ore','cube',{light:true}),dirt:b('土','#89734e','natural'),sand:b('砂','#d7ba79','natural'),snow:b('雪','#dbe9ef','natural'),steel:b('鋼材','#648c9a','stone','metal'),
 leaves:b('木の葉','#508741','natural','leaf'),frostleaves:b('雪積もる葉','#bad5c7','natural','leaf'),fruit:b('果実','#729443','natural','fruit'),bush:b('茂み','#639943','natural','leaf'),reed:b('葦','#88a85b','farm','log'),herb:b('薬草','#72aa66','farm','leaf'),cactus:b('サボテン','#438754','farm','log'),door:b('ドア','#b38958','wood','door'),
 birchwood:b('白樺の原木','#ddd1ad','wood','log'),acaciawood:b('アカシアの原木','#9a6648','wood','log'),darkwood:b('黒樫の原木','#54402f','wood','log'),bamboo:b('竹材','#a4ad5b','wood','log'),
 birchplank:b('白樺の板','#dfc993','wood','plank'),frostplank:b('霜木の板','#adccce','wood','plank'),acaciaplank:b('アカシアの板','#cb885e','wood','plank'),darkplank:b('黒樫の板','#72513a','wood','plank'),bambooplank:b('竹の板','#c8bd75','wood','plank'),
 cobble:b('丸石','#7e8587','stone','cobble'),stonebrick:b('石レンガ','#929ca3','stone','brick'),mossybrick:b('苔石レンガ','#73846a','stone','brick'),granite:b('花崗岩','#b48273','stone','stone'),diorite:b('閃緑岩','#c8c8bf','stone','stone'),andesite:b('安山岩','#919798','stone','stone'),basalt:b('玄武岩','#4f565f','stone','log'),deepslate:b('深層岩','#50515c','stone','brick'),sandstone:b('砂岩ブロック','#d6b777','stone','brick'),red_sandstone:b('赤砂岩','#bc704b','stone','brick'),polishedstone:b('磨いた石','#aab6be','stone','metal'),obsidian:b('黒曜石','#373144','stone','stone'),
 gravel:b('砂利','#aaa39a','natural','cobble'),clay:b('粘土','#a8b1b8','natural'),coal_ore:b('石炭鉱石','#45484b','natural','ore'),copper_ore:b('銅鉱石','#bc8b62','natural','ore'),gold_ore:b('金鉱石','#dfc36b','natural','ore'),diamond_ore:b('ダイヤ鉱石','#66d9d4','natural','ore'),lapis_ore:b('青金石鉱石','#5874ba','natural','ore'),quartz_ore:b('水晶鉱石','#ded8d1','natural','ore'),
 glass:b('ガラス','#b9e2e6','glass','glass','cube',{transparent:true}),blueglass:b('青いガラス','#77b6de','glass','glass','cube',{transparent:true}),pinkglass:b('桃色ガラス','#e8a7c6','glass','glass','cube',{transparent:true}),glasspane:b('ガラス板','#b9e2e6','glass','glass','pane',{transparent:true}),
 wool:b('白い羊毛','#f0eadc','color','woven'),redwool:b('赤い羊毛','#be5554','color','woven'),bluewool:b('青い羊毛','#557ba7','color','woven'),greenwool:b('緑の羊毛','#6c8b55','color','woven'),yellowwool:b('黄色い羊毛','#dbc36a','color','woven'),pinkwool:b('桃色の羊毛','#d78ca5','color','woven'),blackwool:b('黒い羊毛','#424652','color','woven'),
 terracotta:b('テラコッタ','#bd8165','color','brick'),whiteconcrete:b('白いコンクリート','#e2e3d9','color','smooth'),blueconcrete:b('青いコンクリート','#6486b9','color','smooth'),greenconcrete:b('緑のコンクリート','#709b7b','color','smooth'),
 woodslab:b('木のハーフブロック','#c39a63','wood','plank','slab'),stoneslab:b('石のハーフブロック','#929ca3','stone','brick','slab'),woodstairs:b('木の階段','#c39a63','wood','plank','stairs'),stonestairs:b('石の階段','#929ca3','stone','brick','stairs'),fence:b('木のフェンス','#b18b56','wood','plank','fence'),stonewall:b('石のフェンス','#929ca3','stone','brick','fence'),
 workbench:b('作業台','#b98c58','workshop','workbench','workbench'),furnace:b('かまど','#7b848d','workshop','furnace','furnace'),chest:b('共有チェスト','#b58548','workshop','chest','chest'),bookshelf:b('本棚','#ac8557','workshop','bookshelf'),torch:b('たいまつ','#efc17a','workshop','plank','torch',{light:true}),lantern:b('ランタン','#e5bb70','workshop','metal','lantern',{light:true}),
 composter:b('堆肥箱','#997248','farm','plank','composter'),irrigator:b('灌漑タンク','#619ca6','farm','metal','irrigator'),hay:b('干し草ブロック','#c9b563','farm','woven'),
} as const;
export type CatalogBlock=keyof typeof VOXEL_CATALOG;
export const CATALOG_BLOCKS=Object.keys(VOXEL_CATALOG) as CatalogBlock[];
export const RESOURCE_NAMES={fish:'魚',housekit:'家の建築キット',stick:'棒',coal:'石炭',charcoal:'木炭',iron_ingot:'鉄インゴット',copper_ingot:'銅インゴット',gold_ingot:'金インゴット',diamond:'ダイヤ',lapis:'青金石',quartz:'水晶',paper:'紙',thread:'糸',fertilizer:'有機肥料'} as const;
export type VoxelItem=CatalogBlock|keyof typeof RESOURCE_NAMES;
export const ALL_MATERIAL_NAMES={...Object.fromEntries(CATALOG_BLOCKS.map(k=>[k,VOXEL_CATALOG[k].name])) as Record<CatalogBlock,string>,...RESOURCE_NAMES};
export const BLOCK_GROUPS:Record<BlockGroup,string>={natural:'天然素材',wood:'木材・建具',stone:'石材・鉱物',color:'色付き素材',glass:'ガラス',workshop:'作業設備',farm:'農業資材'};
export type ToolKind='pickaxe'|'axe'|'shovel';
export type ToolTier='stone'|'iron'|'steel'|'diamond';
export type WorkshopRecipe={id:string;name:string;output:VoxelItem|ToolKind|'hoe';count:number;cost:Partial<Record<VoxelItem,number>>;station:'hand'|'workbench'|'furnace'|'composter';tier?:ToolTier};
const r=(output:VoxelItem,count:number,cost:WorkshopRecipe['cost'],station:WorkshopRecipe['station']='workbench',id:string=output):WorkshopRecipe=>({id,name:ALL_MATERIAL_NAMES[output],output,count,cost,station});
export const WORKSHOP_RECIPES:WorkshopRecipe[]=[
 ...(['wood','birchwood','frostwood','acaciawood','darkwood','bamboo'] as const).map((wood,i)=>r((['plank','birchplank','frostplank','acaciaplank','darkplank','bambooplank'] as const)[i],4,{[wood]:1},'hand')),
 r('stick',4,{plank:2},'hand'),r('workbench',1,{plank:4},'hand'),r('furnace',1,{stone:8}),r('chest',1,{plank:8}),r('composter',1,{plank:5}),
 r('charcoal',4,{wood:4},'furnace'),r('iron_ingot',4,{ore:4},'furnace'),r('copper_ingot',4,{copper_ore:4},'furnace'),r('gold_ingot',4,{gold_ore:4},'furnace'),r('glass',4,{sand:4},'furnace'),r('terracotta',4,{clay:4},'furnace'),r('stone',4,{cobble:4},'furnace','smooth-stone'),
 r('stonebrick',4,{stone:4}),r('mossybrick',4,{stonebrick:4,leaves:2}),r('brick',4,{clay:4},'furnace'),r('sandstone',4,{sand:4}),r('red_sandstone',4,{sandstone:4,clay:1}),r('polishedstone',4,{stone:4,quartz:1}),
 r('blueglass',4,{glass:4,lapis:1}),r('pinkglass',4,{glass:4,fruit:1}),r('glasspane',12,{glass:6}),
 r('thread',4,{reed:2},'hand'),r('wool',2,{thread:4}),r('redwool',2,{wool:2,fruit:1}),r('bluewool',2,{wool:2,lapis:1}),r('greenwool',2,{wool:2,cactus:1}),r('yellowwool',2,{wool:2,herb:1}),r('pinkwool',2,{wool:2,fruit:1,quartz:1}),r('blackwool',2,{wool:2,coal:1}),
 r('whiteconcrete',8,{sand:4,gravel:4,clay:1}),r('blueconcrete',8,{whiteconcrete:8,lapis:1}),r('greenconcrete',8,{whiteconcrete:8,cactus:1}),
 r('woodslab',6,{plank:3}),r('stoneslab',6,{stonebrick:3}),r('woodstairs',4,{plank:6}),r('stonestairs',4,{stonebrick:6}),r('fence',4,{plank:4,stick:2}),r('stonewall',4,{stonebrick:4}),r('door',2,{plank:6}),
 r('paper',3,{reed:3},'hand'),r('bookshelf',1,{plank:6,paper:3}),r('torch',4,{stick:1,coal:1},'hand'),r('torch',4,{stick:1,charcoal:1},'hand','charcoal-torch'),r('lantern',2,{torch:2,iron_ingot:2}),
 r('irrigator',1,{copper_ingot:3,iron_ingot:1,glass:2}),r('fertilizer',3,{leaves:4,herb:2},'composter'),r('fertilizer',3,{fruit:3,bush:2},'composter','fruit-compost'),r('hay',4,{reed:4}),
 {id:'workshop-hoe',name:'クワ',output:'hoe',count:1,cost:{stick:2,stone:2},station:'workbench'},
 ...(['pickaxe','axe','shovel'] as const).flatMap(tool=>(['stone','iron','steel','diamond'] as const).map((tier,i):WorkshopRecipe=>({id:`${tool}-${tier}`,name:`${['石','鉄','鋼','ダイヤ'][i]}の${{pickaxe:'ツルハシ',axe:'斧',shovel:'シャベル'}[tool]}`,output:tool,count:1,cost:{stick:2,[['stone','iron_ingot','steel','diamond'][i]]:tool==='shovel'?1:3},station:'workbench',tier}))),
];
export const TOOL_RANK:ToolTier[]=['stone','iron','steel','diamond'];
export const BLOCK_DROPS:Partial<Record<CatalogBlock,VoxelItem>>={coal_ore:'coal',diamond_ore:'diamond',lapis_ore:'lapis',quartz_ore:'quartz'};
export const shapeOf=(b:string):BlockShape=>VOXEL_CATALOG[b as CatalogBlock]?.shape??'cube';
export const fullCube=(b:string)=>!['door','door-top','oasis-water'].includes(b)&&shapeOf(b)==='cube'&&!VOXEL_CATALOG[b as CatalogBlock]?.transparent;

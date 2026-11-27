import type { Adventurer, World } from './engine';
import type { Copy } from './town/catalog';
import { lifePlayer } from './life';
import { inspectMachine, machineCarts, machineSignal, type MachineCell } from './machinery';
import { playerHeight, protectedVoxel, terrainHeight, voxelKey } from './voxel';
import { fluidAt, placedWater } from './placedFluids';
import type { CatalogBlock, VoxelItem } from './voxelCatalog';
import { normalizeBlueprint } from './blueprints';

type Part = MachineCell & { block: CatalogBlock; rotation: number };
type Plan = {
  id:string; title:Copy; directions:Copy; parts:Part[];
  supplies?:Partial<Record<VoxelItem,number>>;
  result:(w:World,at:(x:number,z?:number,y?:number)=>MachineCell,p:Adventurer)=>boolean;
};
export type ResearchAction = MachineCell & { type:'voxel-research'; plan:string };
const copy=(ja:string,en:string,hi:string):Copy=>({ja,en,hi});
const part=(block:CatalogBlock,x:number,z=0,y=0,rotation=0):Part=>({block,x,y,z,rotation});
const signal=(w:World,p:MachineCell)=>machineSignal(w,p.x,p.y,p.z);
const read=(w:World,p:MachineCell)=>inspectMachine(w,p.x,p.y,p.z).device;
const key=({x,y,z}:MachineCell)=>voxelKey(x,y,z);

export const TECH_PLANS:Plan[]=[
  {id:'lever-lamp',title:copy('レバーで点灯','Switch on a lamp','レバーでてんとう'),
    directions:copy('レバーとランプの間をケーブルでつなぎ、レバーを入れる。魔晶回路の数値はゲーム内の信号の強さです。実際の電圧や電流とは異なります。','Connect the lever to the lamp with a cable and switch it on. Crystal signal levels measure in-game strength. Real circuits have separate voltage and current.','レバーとランプをケーブルでつなぎ、レバーをいれよう。ましょうかいろのすうちはゲームのしんごうのつよさです。ほんものの でんあつやでんりゅうとはちがいます。'),
    parts:[part('crystal_lever',0),part('crystal_wire',1),part('crystal_lamp',2)],result:(w,at)=>signal(w,at(2))>0},
  {id:'pressure-door',title:copy('踏むと開く玄関','A pressure-plate entrance','ふむとひらくげんかん'),
    directions:copy('入口の手前に感圧板を置く。板の上に立ってゲートの開閉を見る。','Place the plate in front of the gate. Stand on it to see the gate open.','いりぐちのてまえにかんあつばんをおこう。いたのうえにたち、ゲートがひらくのをみよう。'),
    parts:[part('pressure_plate',0),part('signal_gate',1)],result:(w,at)=>!!read(w,at(1))?.opened},
  {id:'double-lock',title:copy('ふたつの鍵','Two-key gate','ふたつのかぎ'),
    directions:copy('コンパレーターを減算に設定。横から来る反転信号を引くため、両方のレバーが入ったときだけ開く。','Set the comparator to subtract. It subtracts the inverted side input, so the gate opens only when both levers are on.','コンパレーターをげんざんにしよう。よこからくるはんてんしんごうをひくので、ふたつのレバーをいれたときだけひらくよ。'),
    parts:[part('crystal_lever',0,1),part('crystal_lever',1,-1),part('crystal_inverter',1,0,0,2),part('crystal_comparator',1,1,0,1),part('signal_gate',2,1)],
    result:(w,at)=>read(w,at(1,1))?.mode==='subtract'&&!!read(w,at(2,1))?.opened&&signal(w,at(0,1))>0&&signal(w,at(1,-1))>0},
  {id:'clock',title:copy('点滅する照明','A blinking lamp','てんめつするしょうめい'),
    directions:copy('反転するトーチの出力をケーブルで裏側へ戻す。信号は一拍ずつ反転し、ランプが点滅する。','Loop the inverter output into its input. The signal flips with each delay, making the lamp blink.','トーチのしゅつりょくをうらがわへもどすようにつなごう。しんごうがかわり、ランプがてんめつするよ。'),
    parts:[part('crystal_inverter',1,0,0,1),...[[2,0],[2,1],[1,1],[0,1],[0,0]].map(([x,z])=>part('crystal_wire',x,z)),
      part('crystal_lamp',2,2)],
    result:(w,at)=>(read(w,at(1))?.signalChanges??0)>=3},
  {id:'night-light',title:copy('暗くなると点く街灯','Night streetlight','くらくなるとつくがいとう'),
    directions:copy('日照センサーの信号をトーチで反転。昼に消え、夜に点くかを観察する。','Invert the daylight sensor output. Watch the lamp switch off in daylight and turn on at night.','にっしょうセンサーのしんごうをトーチではんてん。ひるはきえ、よるにつくかみてみよう。'),
    parts:[part('daylight_sensor',0),part('crystal_inverter',1,0,0,1),part('crystal_lamp',2)],result:(w,at)=>signal(w,at(0))===0&&signal(w,at(2))>0},
  {id:'piston-door',title:copy('押し板の隠し扉','Hidden piston door','おしいたのかくしとびら'),
    directions:copy('粘着ピストンを東向きに置き、自分で置いた石を前に置く。レバーの入切で石を押し戻す。','Face the sticky piston east and place your own stone in front. Toggle the lever to push and pull the stone.','ねんちゃくピストンをひがしむきにおき、じぶんでおいたいしをまえにおこう。レバーでいしをおしたりひいたりできるよ。'),
    parts:[part('crystal_lever',0),part('sticky_piston',1,0,0,1),part('stone',2)],
    result:(w,at)=>!!read(w,at(1))?.opened&&w.voxels?.edits[key(at(3))]==='stone'},
  {id:'rail-trip',title:copy('はじめてのトロッコ','First cart ride','はじめてのトロッコ'),
    directions:copy('レールと停車レールをつなぐ。トロッコを置き、乗ってから発車し、終点まで移動する。','Connect the rails to a station. Place a cart, board it and ride to the end.','レールとていしゃレールをつなごう。トロッコをおいてのりこみ、しゅうてんまでいこう。'),
    parts:[part('rail',0,0,0,1),part('rail',1,0,0,1),part('station_rail',2,0,0,1)],supplies:{minecart:1},
    result:(w,at,p)=>machineCarts(w).some(cart=>cart.rider===p.id&&cart.cell===key(at(2))&&!cart.moving)},
  {id:'piston-lift',title:copy('ピストンで昇降','Piston lift','ピストンでしょうこう'),
    directions:copy('粘着ピストンの向きを上向きに切り替え、真上に昇降床を置く。天井まで余裕を取り、レバーで床を持ち上げる。','Set a sticky piston to face upward and place a lift platform directly above it. Leave enough overhead clearance and raise it with the lever.','ねんちゃくピストンをうえむきにかえ、まうえにしょうこうゆかをおこう。てんじょうにゆとりをつくり、レバーでゆかをもちあげよう。'),
    parts:[part('crystal_lever',0),part('sticky_piston',1),part('lift_platform',1,0,1)],
    result:(w,at)=>!!read(w,at(1))?.vertical&&w.voxels?.edits[key(at(1,0,2))]==='lift_platform'},
  {id:'rail-signal',title:copy('列車の到着を知らせるランプ','Rail detection signal','れっしゃのとうちゃくをしらせるランプ'),
    directions:copy('検知レールの隣にランプを置く。トロッコが検知レールに乗ると点灯する。','Put a lamp next to a detector rail. A cart sitting on the detector lights the lamp.','けんちレールのとなりにランプをおこう。トロッコがのるとランプがつくよ。'),
    parts:[part('detector_rail',0,0,0,1),part('crystal_lamp',0,1)],supplies:{minecart:1},
    result:(w,at)=>signal(w,at(0))>0&&signal(w,at(0,1))>0},
  {id:'rail-loop',title:copy('自動で一周する列車','A railway loop','じどうでいっしゅうするれっしゃ'),
    directions:copy('レールをつないで環状線を作る。レバーで駅と加速レールに信号を送り、トロッコを一周させる。','Build a closed loop. Power its station and booster rail from the lever and let a cart complete a circuit.','レールをつないでぐるっとまわるせんろをつくろう。レバーでえきとかそくレールにしんごうをおくり、トロッコをいっしゅうさせよう。'),
    parts:[part('station_rail',0,0,0,1),part('powered_rail',1,0,0,1),part('crystal_lever',1,-1),
      part('crystal_wire',0,-1),...[[2,0],[2,1],[2,2],[1,2],[0,2],[0,1]].map(([x,z])=>part('rail',x,z))],
    supplies:{minecart:1},
    result:(w,at)=>read(w,at(0))?.arrivedFrom===key(at(0,1))},
  {id:'sorter',title:copy('鉄鉱石の仕分け','Sorting iron ore','てっこうせきのしわけ'),
    directions:copy('ホッパーを東向きにして、選別で鉄鉱石を指定。上の箱に鉱石と石材を入れ、東の箱を確認する。','Point the hopper east and set its filter to iron ore. Put ore and stone in the upper chest and check the east chest.','ホッパーをひがしむきにして、せんべつをてっこうせきに。うえのはこにこうせきといしをいれて、ひがしのはこをみよう。'),
    parts:[part('hopper',0,0,0,1),part('chest',1),part('chest',0,0,1)],supplies:{ore:1,stone:1},
    result:(w,at)=>read(w,at(0))?.filter==='ore'&&!!w.voxels?.containers?.[key(at(1))]?.items.ore},
  {id:'smelter',title:copy('自動精錬工場','Automatic smelter','じどうせいれんこうじょう'),
    directions:copy('上の箱に鉄鉱石4個と燃料を入れる。東向きの自動かまどから東の箱に鉄が入る。','Put four iron ore and one fuel in the upper chest. The east-facing furnace sends ingots to the east chest.','うえのはこにてっこうせき4ことねんりょうをいれよう。ひがしむきのかまどから、ひがしのはこにてつがとどくよ。'),
    parts:[part('auto_furnace',0,0,0,1),part('chest',1),part('chest',0,0,1)],supplies:{ore:4,coal:1},
    result:(w,at)=>(w.voxels?.containers?.[key(at(1))]?.items.iron_ingot??0)>=4},
  {id:'crafter',title:copy('板を作る小さな工場','Automatic sawmill','いたをつくるちいさなこうじょう'),
    directions:copy('自動クラフターを東向きにして木の板を登録。上から木材を供給し、石製ボタンを押して東の箱を確認する。','Set the east-facing crafter to planks. Feed wood from above, press the stone button and check the east chest.','じどうクラフターをひがしむきにしてきのいたをとうろく。うえからきざいをいれ、ボタンをおしてひがしのはこをみよう。'),
    parts:[part('crystal_button',-1),part('auto_crafter',0,0,0,1),part('chest',1),part('chest',0,0,1)],supplies:{wood:1},
    result:(w,at)=>(w.voxels?.containers?.[key(at(1))]?.items.plank??0)>=4},
  {id:'pump',title:copy('水路の給水ポンプ','Pumping into a channel','すいろのきゅうすいポンプ'),
    directions:copy('東向きのポンプの西側に水源を置く。レバーを入れ、東側に新しい流れが出るか確認する。','Place a water source to the west of an east-facing pump. Switch it on and look for a new flow at the east outlet.','ひがしむきのポンプのにしがわにすいげんをおこう。レバーをいれてひがしがわにみずがながれるかみてみよう。'),
    parts:[part('water_pump',0,0,0,1),part('crystal_lever',0,1)],supplies:{water_bucket:1},
    result:(w,at)=>{const {x,y,z}=at(1);return fluidAt(w,x,y,z)?.source===key(at(1))&&signal(w,at(0))>0;}},
  {id:'water-lift',title:copy('泡で上がる水路','Bubble elevator','あわであがるすいろ'),
    directions:copy('泡の石の真上に水が流れ落ちるように水源を置く。柱の中に入り、上昇する泡の流れを試す。','Place a source above the bubble stone so water flows down. Enter the column to feel the upward current.','あわのいしのうえにみずがながれおちるように、すいげんをおこう。みずのなかでうえむきのながれをためそう。'),
    parts:[part('bubbling_stone',0,0,-1)],supplies:{water_bucket:1},
    result:(w,at)=>{const {x,y,z}=at(0);const column=placedWater(w,x,z,y);return !!column&&column.depth>=2&&column.lift>0;}},
  {id:'harvester',title:copy('作物の自動収穫','Automatic harvest','さくもつのじどうしゅうかく'),
    directions:copy('農園作業機の東側に自分の畑を用意する。作物が育ったら信号を送り、食材庫に届いたことを確認する。','Till your plot east of the farm machine. When the crop is ripe, send a signal and check the pantry.','のうえんさぎょうきのひがしにじぶんのはたけをつくろう。さくもつがそだったらしんごうをおくり、しょくざいこをみよう。'),
    parts:[part('farm_machine',0,0,0,1),part('crystal_lever',0,1)],
    result:(w,at)=>{const machine=read(w,at(0));return machine?.workTick!==undefined&&(!machine.farmJob||machine.farmJob==='harvest');}},
  {id:'beacon',title:copy('魔晶ビーコンの土台','Build a beacon pyramid','ましょうビーコンのどだい'),
    directions:copy('鋼材を3×3に敷き、中央の上にビーコンを置く。頭上を開けてダイヤを1個使う。','Make a 3×3 steel base and place the beacon in the center above it. Leave open sky and activate it with one diamond.','こうざいを3×3にしき、まんなかのうえにビーコンをおこう。そらまであけてダイヤをひとつつかおう。'),
    parts:[...[-1,0,1].flatMap(z=>[-1,0,1].map(x=>part('steel',x,z,-1))),part('crystal_beacon',0)],supplies:{diamond:1},
    result:(w,at)=>(read(w,at(0))?.tier??0)>0},
  {id:'notes',title:copy('ふたつの音でチャイム','Two-note chime','ふたつのおとでチャイム'),
    directions:copy('手前の音符ブロックはすぐに鳴る。東向きのリピーターの遅延を変え、奥の音が追いかけるようにする。','The near note plays immediately. Change the delay of the east-facing repeater to make the second note follow it.','てまえのおんぷブロックはすぐになるよ。ひがしむきのリピーターのおくれをかえて、つぎのおとがあとからなるようにしよう。'),
    parts:[part('crystal_button',0),part('note_block',0,1),part('crystal_repeater',1,0,0,1),part('note_block',2)],
    result:(w,at)=>{const first=read(w,at(0,1))?.played,second=read(w,at(2))?.played;return first!==undefined&&second!==undefined&&second>first;}},
  {id:'street-grid',title:copy('通りを照らす三つの灯り','Lighting a whole street','とおりをてらすみっつのあかり'),
    directions:copy('通りにケーブルを引き、三つのランプを分岐でつなぐ。レバーを入れて、離れたランプも光るか確かめよう。','Run a cable along the street and branch it to three lamps. Switch on the lever and check the furthest lamp.','とおりにケーブルをひき、みっつのランプをつなごう。レバーをいれて、とおくのランプもひかるかみよう。'),
    parts:[part('crystal_lever',0,1),...Array.from({length:5},(_,x)=>part('crystal_wire',x)),...[0,2,4].map(x=>part('crystal_lamp',x,-1))],
    result:(w,at)=>[0,2,4].every(x=>signal(w,at(x,-1))>0)},
  {id:'castle-gate',title:copy('衛兵の城門','The guardhouse gate','えいへいのじょうもん'),
    directions:copy('石レンガの柱の間に二枚のゲートを並べる。感圧板を踏むとケーブルで両方が開く。','Place two gates between the stone columns. Stepping on the plate sends a signal to both through the cable.','いしレンガのはしらのあいだにゲートをふたつならべよう。かんあつばんをふむとふたつがひらくよ。'),
    parts:[part('stonebrick',-1),part('stonebrick',2),part('stonebrick',-1,0,1),part('stonebrick',2,0,1),
      part('pressure_plate',0,2),part('crystal_wire',0,1),part('crystal_wire',1,1),part('signal_gate',0),part('signal_gate',1)],
    result:(w,at)=>!!read(w,at(0))?.opened&&!!read(w,at(1))?.opened},
  {id:'metro',title:copy('地下に駅を造る','Underground station','ちかにえきをつくる'),
    directions:copy('地表から3段以上掘り、乗車用に高さ2段の空間を確保する。地下の停車レールまで乗ってみよう。','Dig at least three blocks below the surface and clear two blocks of headroom. Ride a cart to the underground station.','ちひょうから3だんいじょうほり、あたまのうえを2だんあけよう。ちかのえきまでトロッコにのろう。'),
    parts:[part('rail',0,0,0,1),part('rail',1,0,0,1),part('station_rail',2,0,0,1)],supplies:{minecart:1},
    result:(w,at,p)=>{const end=at(2);return end.y<=terrainHeight(w,end.x,end.z)-3&&machineCarts(w).some(cart=>cart.rider===p.id&&cart.cell===key(end));}},
  {id:'viaduct',title:copy('坂道で高架へ','Up to a railway viaduct','さかみちでこうかへ'),
    directions:copy('石の土台で一段ずつ高くなるレールを支える。低い方から出発し、上の駅に着いたら高架から地面を見比べる。','Support the stepped rails with stone. Depart from the lower track and compare the viaduct with the ground below when you arrive.','いしでせんろをささえて、ひくいほうからいちだんずつのぼろう。えきについたら、したのじめんをみくらべよう。'),
    parts:[part('rail',0,0,0,1),part('stone',1),part('rail',1,0,1,1),part('stone',2),part('stone',2,0,1),part('station_rail',2,0,2,1)],
    supplies:{minecart:1},result:(w,at,p)=>machineCarts(w).some(cart=>cart.rider===p.id&&cart.cell===key(at(2,0,2)))},
  {id:'freight',title:copy('鉱石の貨物線','Deliver ore by rail','こうせきのかもつせん'),
    directions:copy('貨物トロッコに鉄鉱石を積み込む。到着駅を選んで発車し、積み荷を確認する。','Load iron ore into a cargo cart. Select the destination station, depart and check that the cargo arrives.','かもつトロッコにてっこうせきをつもう。えきをえらんではっしゃし、つみにがとどくかたしかめよう。'),
    parts:[part('station_rail',0,0,0,1),part('rail',1,0,0,1),part('station_rail',2,0,0,1)],supplies:{minecart_chest:1,ore:1},
    result:(w,at,p)=>machineCarts(w).some(cart=>cart.owner===p.id&&cart.kind==='minecart_chest'&&cart.cell===key(at(2))&&!!cart.cargo?.ore)},
  {id:'ranch-care',title:copy('牧場の自動給餌','Automatic ranch feeding','ぼくじょうのじどうきゅうじ'),
    directions:copy('農園作業機を牧場の端へ向けて置き、給餌と集荷に設定する。飼料を用意して信号を送り、動物の状態を確かめる。','Point the farm machine at the edge of your ranch and set it to feed and collect. Stock feed, switch it on and check the animals.','のうえんさぎょうきをぼくじょうのはしへむけ、えさやりとしゅうかにしよう。しりょうをよういしてうごかそう。'),
    parts:[part('farm_machine',0,0,0,1),part('crystal_lever',0,1)],
    result:(w,at)=>{const farmMachine=read(w,at(0));return farmMachine?.farmJob==='ranch'&&farmMachine.workTick!==undefined;}},
  {id:'fountain',title:copy('広場の自動噴水','A switched fountain','ひろばのじどうふんすい'),
    directions:copy('台座の上から水の入ったディスペンサーを動かす。受け皿の石を置き、横に出た水が一段落ちることを確かめる。','Load a water bucket into the dispenser on the pedestal. Make a stone basin and send a signal so the released water falls one block.','だいざにみずのはいったディスペンサーをおこう。うけざらのいしをおいて、みずがいちだんおちるかみよう。'),
    parts:[part('stone',0,0,-1),part('stone',0),part('stone',1,0,-1),part('dispenser',0,0,1,1),part('crystal_button',0,1,1)],supplies:{water_bucket:1},
    result:(w,at)=>{const top=at(1,0,1),below=at(1);return fluidAt(w,below.x,below.y,below.z)?.source===key(top);}},
  {id:'logic-subtract',title:copy('二進数のひき算','Subtract with two switches','にしんすうのひきざん'),
    directions:copy('レバーの切を0、入を1とする。コンパレーターを減算にすると、左の入力1から横の入力を引ける。横を0と1に変えてランプを観察する。','Off represents 0 and on represents 1. Set the comparator to subtract and try changing the side input from 0 to 1. Watch how the lamp represents the result.','レバーのきるを0、いれるを1にしよう。げんざんにして、よこのしんごうを0から1にかえ、ランプをみよう。'),
    parts:[part('crystal_lever',-1),part('crystal_lever',0,1),part('crystal_comparator',0,0,0,1),part('crystal_lamp',1)],
    result:(w,at)=>read(w,at(0))?.mode==='subtract'&&signal(w,at(-1))===15&&signal(w,at(1))===(signal(w,at(0,1))?0:15)},
  {id:'rail-attraction',title:copy('音と灯りの遊園地','An amusement ride with lights and sound','おととあかりのゆうえんち'),
    directions:copy('レールを右へ曲げて坂を上るコースを作る。折り返しの検知レールで音と灯りを鳴らし、停車レールまで乗り切る。','Build a ride that turns right and runs up a slope. Use a detector to light a lamp and play a note, then ride to the station.','みぎへまがってさかをのぼるコースをつくろう。けんちレールでおととひかりをだし、えきまでのろう。'),
    parts:[part('rail',0,0,0,1),part('rail',1),part('detector_rail',1,1),part('crystal_lamp',2,1),part('note_block',0,1),
      part('stone',1,2),part('station_rail',1,2,1)],supplies:{minecart:1},
    result:(w,at,p)=>read(w,at(0,1))?.played!==undefined&&machineCarts(w).some(cart=>cart.rider===p.id&&cart.cell===key(at(1,2,1)))},
];

export function earnedBlueprint(plan:Plan,name:string) {
  const left=Math.min(...plan.parts.map(cell=>cell.x)), bottom=Math.min(...plan.parts.map(cell=>cell.y)), front=Math.min(...plan.parts.map(cell=>cell.z));
  const cells=plan.parts.map(cell=>({...cell,x:cell.x-left,y:cell.y-bottom,z:cell.z-front}));
  return normalizeBlueprint({version:1,name:name.slice(0,32),cells});
}

export function researchStatus(w:World,p:Adventurer,plan:Plan,origin:MachineCell) {
  const at=(x:number,z=0,y=0)=>({x:origin.x+x,z:origin.z+z,y:origin.y+y});
  const near=Math.hypot(origin.x+.5-(p.position3D?.x??p.x+.5),origin.y-playerHeight(w,p),origin.z+.5-(p.position3D?.z??p.y+.5))<6;
  const found=plan.parts.filter(part=>{
    const cell=at(part.x,part.z,part.y), first=key(cell);
    if (protectedVoxel(w,cell.x,cell.z)) return false;
    if (w.voxels?.edits[first]===part.block && w.voxels.placedBy?.[first]===p.id) return true;
    const displaced=plan.id==='piston-door'&&part.block==='stone' ? at(part.x+1,part.z,part.y)
      : plan.id==='piston-lift'&&part.block==='lift_platform' ? at(part.x,part.z,part.y+1) : null;
    const destination=displaced&&key(displaced);
    return !!destination&&w.voxels?.edits[destination]===part.block&&w.voxels.placedBy?.[destination]===p.id;
  }).length;
  return { found, ready:near&&found===plan.parts.length&&plan.result(w,at,p) };
}

export function applyResearch(w:World,p:Adventurer,action:ResearchAction) {
  if (![action.x,action.y,action.z].every(Number.isSafeInteger)) return false;
  const plan=TECH_PLANS.find(entry=>entry.id===action.plan);
  if (!plan || p.life?.research?.includes(plan.id) || !researchStatus(w,p,plan,action).ready) return false;
  (lifePlayer(p).research??=[]).push(plan.id);
  w.revision++;
  return true;
}

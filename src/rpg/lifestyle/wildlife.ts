import type { Adventurer, World } from '../engine';
import type { RealmId } from '../realmTerrain';
import { WIDTH, HEIGHT } from '../engine';
import { biomeAt, type BiomeId } from '../biomes';
import { blockAt, naturalVoxelWater, protectedVoxel, solid, terrainHeight } from '../voxel';
import { calendar, hash } from '../town/model';
import type { Copy } from '../town/catalog';
import type { AnimalMoment } from './animalMotion';
import { legacyRegion } from '../worldLandscape';
import type { CreatureFacing } from './creatureArt';

const copy = (ja:string,en:string,hi:string):Copy=>({ja,en,hi});
type Habitat = BiomeId | 'river' | 'cave' | 'sky' | 'coast';
type WildlifeProfile = {
  name: Copy; habitat: Habitat; food: Copy; fact: Copy;
  art: 'mammal' | 'flying' | 'aquatic'; nocturnal?: true;
};
export const WILDLIFE: Record<string, WildlifeProfile> = {
  horse: { name:copy('野生馬','Wild horse','やせいば'),habitat:'meadow',art:'mammal',food:copy('草','Grass','くさ'),
    fact:copy('ウマは群れで暮らし、耳の向きを変えて周囲の音を聞きます。','Horses live in herds and turn their ears to listen in different directions.','ウマはむれでくらし、みみのむきをかえてまわりのおとをききます。') },
  donkey: { name:copy('ロバ','Donkey','ロバ'),habitat:'desert',art:'mammal',food:copy('乾いた草','Dry grass','かわいたくさ'),
    fact:copy('ロバの長い耳は遠くの音を聞くのに役立ちます。','A donkey’s long ears help it hear distant sounds.','ロバのながいみみはとおくのおとをきくのにやくだちます。') },
  deer: { name:copy('シカ','Deer','シカ'),habitat:'forest',art:'mammal',food:copy('若葉','Young leaves','わかば'),
    fact:copy('多くのシカでは、オスの角が毎年生え変わります。','In many deer species, males grow and shed their antlers each year.','おおくのシカでは、オスのつのがまいとしはえかわります。') },
  wolf: { name:copy('オオカミ','Wolf','オオカミ'),habitat:'snow',art:'mammal',food:copy('小動物やシカ','Small animals and deer','しょうどうぶつやシカ'),
    fact:copy('オオカミは遠ぼえで離れた仲間と連絡を取ります。','Wolves howl to communicate with pack members over long distances.','オオカミはとおぼえではなれたなかまとれんらくをとります。') },
  bear: { name:copy('クマ','Bear','クマ'),habitat:'forest',art:'mammal',food:copy('木の実や昆虫','Nuts and insects','きのみやこんちゅう'),
    fact:copy('クマには季節ごとに食べるものを変える種類がいます。','Some bears change what they eat as the seasons change.','クマにはきせつごとにたべるものをかえるしゅるいがいます。') },
  panda: { name:copy('パンダ','Giant panda','パンダ'),habitat:'ruins',art:'mammal',food:copy('竹','Bamboo','たけ'),
    fact:copy('ジャイアントパンダには、竹をつかむのを助ける手首の骨があります。','Giant pandas have a wrist bone that helps them grip bamboo.','ジャイアントパンダには、たけをつかむのをたすけるてくびのほねがあります。') },
  squirrel: { name:copy('リス','Squirrel','リス'),habitat:'forest',art:'mammal',food:copy('木の実','Nuts','きのみ'),
    fact:copy('リスの仲間には、木の実をいくつもの場所に隠すものがいます。','Some squirrels hide nuts in many different places.','リスのなかまには、きのみをいくつものばしょにかくすものがいます。') },
  boar: { name:copy('イノシシ','Wild boar','イノシシ'),habitat:'forest',art:'mammal',food:copy('根や木の実','Roots and nuts','ねやきのみ'),
    fact:copy('イノシシは丈夫な鼻で土を掘り、食べ物を探します。','Wild boars dig with their strong snouts to find food.','イノシシはじょうぶなはなでつちをほり、たべものをさがします。') },
  snowfox: { name:copy('ホッキョクギツネ','Arctic fox','ホッキョクギツネ'),habitat:'snow',art:'mammal',food:copy('小動物','Small animals','しょうどうぶつ'),
    fact:copy('白い冬毛は雪の中で身を隠すのに役立ちます。','A white winter coat helps the Arctic fox blend into snow.','しろいふゆげはゆきのなかでみをかくすのにやくだちます。') },
  frog: { name:copy('カエル','Frog','カエル'),habitat:'wetland',art:'mammal',food:copy('小さな昆虫','Small insects','ちいさなこんちゅう'),
    fact:copy('多くのカエルは水辺で卵を産み、オタマジャクシから姿を変えます。','Many frogs lay eggs in water and develop from tadpoles.','おおくのカエルはみずべでたまごをうみ、オタマジャクシからすがたをかえます。') },
  turtle: { name:copy('淡水のカメ','Freshwater turtle','たんすいのカメ'),habitat:'wetland',art:'mammal',food:copy('水草や小動物','Water plants and small animals','みずくさやしょうどうぶつ'),
    fact:copy('カメの甲羅の一部は背骨や肋骨とつながっています。','Part of a turtle’s shell is fused with its spine and ribs.','カメのこうらのいちぶはせぼねやろっこつとつながっています。') },
  trout: { name:copy('マス','Trout','マス'),habitat:'river',art:'aquatic',food:copy('水生昆虫','Aquatic insects','すいせいこんちゅう'),
    fact:copy('マスの仲間は流れのある冷たい水を好む種類が多いです。','Many trout species favor cool, flowing water.','マスのなかまはながれのあるつめたいみずをこのむしゅるいがおおいです。') },
  'reef-fish': { name:copy('琥珀魚','Amberfin','こはくぎょ'),habitat:'river',art:'aquatic',food:copy('小エビ','Small shrimp','こエビ'),
    fact:copy('架空の生き物。遺跡の水路では、夕方に橙色のうろこが光ります。','Fictional. Its orange scales glint at dusk in the waterways near the ruins.','かくうのいきもの。いせきのすいろでは、ゆうがたにだいだいいろのうろこがひかります。') },
  'cave-bat': { name:copy('コウモリ','Bat','コウモリ'),habitat:'cave',art:'flying',nocturnal:true,food:copy('飛ぶ昆虫','Flying insects','とぶこんちゅう'),
    fact:copy('多くのコウモリは音の反響を使って周囲を知ります。','Many bats navigate by listening to returning echoes.','おおくのコウモリはおとのひびきをつかってまわりをしります。') },
  butterfly: { name:copy('チョウ','Butterfly','チョウ'),habitat:'meadow',art:'flying',food:copy('花の蜜','Nectar','はなのみつ'),
    fact:copy('チョウは幼虫、さなぎを経て、羽を持つ成虫になります。','A butterfly becomes a winged adult after its caterpillar and pupal stages.','チョウはようちゅう、さなぎをへて、はねをもつせいちゅうになります。') },
  camel: { name:copy('ラクダ','Camel','ラクダ'),habitat:'desert',art:'mammal',food:copy('砂漠の草や葉','Desert plants','さばくのくさやは'),
    fact:copy('ラクダのこぶには脂肪が蓄えられています。','Camel humps store fat.','ラクダのこぶにはしぼうがたくわえられています。') },
  owl: { name:copy('ミミズク','Horned owl','ミミズク'),habitat:'forest',art:'flying',nocturnal:true,food:copy('ネズミや昆虫','Mice and insects','ネズミやこんちゅう'),
    fact:copy('頭の耳のような房は羽毛です。音を聞く耳は羽毛の下にあります。','The ear-like tufts are feathers. An owl’s ears are under the facial feathers.','あたまのみみのようなふさはうもうです。おとをきくみみは、うもうのしたにあります。') },
  eagle: { name:copy('ワシ','Eagle','ワシ'),habitat:'sky',art:'flying',food:copy('小動物や魚','Small animals and fish','しょうどうぶつやさかな'),
    fact:copy('ワシは上昇気流を使い、羽ばたく回数を減らして飛びます。','Eagles can soar on rising air to fly with fewer wingbeats.','ワシはうえにのぼるくうきのながれをつかい、はばたくかいすうをへらします。') },
  'tropical-fish': { name:copy('縞模様の熱帯魚','Banded reef fish','しまもようのねったいぎょ'),habitat:'coast',art:'aquatic',food:copy('小さな甲殻類','Small crustaceans','ちいさなこうかくるい'),
    fact:copy('サンゴ礁の魚には、岩やサンゴの隙間に逃げ込む種類がいます。','Some reef fish shelter in gaps between rocks and corals.','サンゴしょうのさかなには、いわやサンゴのすきまににげこむしゅるいがいます。') },
  'shore-crab': { name:copy('磯のカニ','Shore crab','いそのカニ'),habitat:'coast',art:'aquatic',food:copy('海藻や小さな貝','Seaweed and small shellfish','かいそうやちいさなかい'),
    fact:copy('カニは成長すると、古い殻を脱いで新しい殻を作ります。','Crabs shed their outer shells as they grow.','カニはせいちょうすると、ふるいからをぬいであたらしいからをつくります。') },
  'reef-squid': { name:copy('礁のイカ','Reef squid','しょうのイカ'),habitat:'coast',art:'aquatic',food:copy('小魚','Small fish','こざかな'),
    fact:copy('イカは水を勢いよく押し出し、その力で泳ぐことができます。','Squid can swim by forcing water out of the body in a jet.','イカはみずをいきおいよくおしだしておよげます。') },
  octopus: { name:copy('タコ','Octopus','タコ'),habitat:'coast',art:'aquatic',food:copy('貝やカニ','Shellfish and crabs','かいやカニ'),
    fact:copy('タコは腕の吸盤で物をつかみ、触れたものの化学物質も感じ取ります。','An octopus can grip with its suckers and sense chemicals through them.','タコはうでのきゅうばんでものをつかみ、ふれたもののかがくぶっしつもかんじとれます。') },
  dolphin: { name:copy('イルカ','Dolphin','イルカ'),habitat:'coast',art:'aquatic',food:copy('魚やイカ','Fish and squid','さかなやイカ'),
    fact:copy('イルカは肺で呼吸するため、ときどき水面に上がります。','Dolphins breathe with lungs and come up to the surface for air.','イルカははいでこきゅうするので、ときどきすいめんにあがります。') },
  'crystal-slime': { name:copy('晶珠スライム','Crystal jelly','しょうじゅスライム'),habitat:'cave',art:'mammal',food:copy('光る鉱物のかけら','Glowing mineral flakes','ひかるこうぶつのかけら'),
    fact:copy('架空の生き物。地下水に溶けた魔晶粉を集め、体の中で小さな結晶にします。','Fictional. It gathers crystal powder dissolved in groundwater and grows tiny crystals inside its body.','かくうのいきもの。ちかのみずにとけたましょうこをあつめ、からだのなかでちいさなけっしょうにします。') },
  'stone-golem': { name:copy('苔むすゴーレム','Mossy golem','こけむすゴーレム'),habitat:'ruins',art:'mammal',food:copy('魔晶石','Crystal','ましょうせき'),
    fact:copy('架空の生き物。胸の魔晶が日中にたまった熱で光り、夜の遺跡を巡ります。','Fictional. The crystal in its chest glows with warmth gathered by day as it patrols the ruins at night.','かくうのいきもの。むねのましょうがひるにたまったねつでひかり、よるのいせきをめぐります。') },
  'cloud-spirit': { name:copy('雲羽の精霊','Cloudwing spirit','くもばねのせいれい'),habitat:'sky',art:'flying',food:copy('雲のしずく','Cloud droplets','くものしずく'),
    fact:copy('架空の生き物。翼で霧を集めながら、空の島から島へ渡ります。','Fictional. Its wings gather mist as it glides from island to island.','かくうのいきもの。つばさできりをあつめながら、そらのしまからしまへわたります。') },
};

export type WildAnimal = { id:string;kind:string;x:number;y:number;z:number;bond:0;moment:AnimalMoment;facing:CreatureFacing };
const realmFauna:Record<RealmId,readonly string[]>={
  embers:['stone-golem','cave-bat'],sky:['eagle','cloud-spirit'],geode:['crystal-slime','cave-bat'],
  echo:['owl','stone-golem'],tidal:['tropical-fish','reef-squid','octopus','shore-crab'],
};
const REGION = 12;
const roamingOffsets=[[0,0],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1]] as const;
const habitats = new Map<Habitat,string[]>();
for (const [kind, profile] of Object.entries(WILDLIFE)) {
  const list=habitats.get(profile.habitat) ?? [];
  list.push(kind);
  habitats.set(profile.habitat,list);
}

function safeTile(w:World,x:number,z:number) {
  if (!legacyRegion(x,z)) return x>=-12&&x<WIDTH+12&&z>=-12&&z<HEIGHT+12;
  return x>0 && z>0 && x<WIDTH-1 && z<HEIGHT-1 && !protectedVoxel(w,x,z) && w.tiles[z*WIDTH+x]!=='road';
}

/** A bounded set of deterministic animals. The local and remote views share the same clock and tiles. */
export function visibleWildlife(w:World, x:number, z:number, radius:number, height=0):WildAnimal[] {
  if (!w.started || w.gameMode==='BATTLE_ROYALE' || !Number.isFinite(x) || !Number.isFinite(z)) return [];
  const clock=calendar(w),phase=w.dimensionId==='echo'?3:clock.phase,season=clock.season,fauna:WildAnimal[]=[];
  const underground=legacyRegion(x,z)&&height<terrainHeight(w,Math.floor(x),Math.floor(z))-3;
  const highSky=!underground&&(height>=30||w.dimensionId==='sky');
  const motion=Math.floor(w.life.time/3.5);
  for (let cz=Math.max(-1,Math.floor((z-radius)/REGION));cz<=Math.min(Math.floor(HEIGHT/REGION)+1,Math.floor((z+radius)/REGION));cz++) {
    for (let cx=Math.max(-1,Math.floor((x-radius)/REGION));cx<=Math.min(Math.floor(WIDTH/REGION)+1,Math.floor((x+radius)/REGION));cx++) {
      const id=`wild-${cx}-${cz}`, n=hash(id,w.seed);
      const ax=cx*REGION+3+(n%5), az=cz*REGION+3+((n>>>4)%5);
      if (Math.hypot(ax-x,az-z)>radius+6 || n%4===0) continue;
      const biome=biomeAt(ax,az).id;
      const coast=!legacyRegion(ax,az);
      const aquatic=!underground&&!highSky&&(coast||!!naturalVoxelWater(w,ax,az));
      const list=w.dimensionId?realmFauna[w.dimensionId]:habitats.get(underground?'cave':highSky?'sky':coast?'coast':aquatic?'river':biome);
      if (!list?.length) continue;
      const kind=aquatic&&!coast&&!w.dimensionId ? biome==='ruins'?'reef-fish':'trout' : list[(n>>>8)%list.length];
      if (w.packAnimals?.[`${id}:${kind}`]) continue;
      if (kind==='butterfly' && (phase===3 || season===3)) continue;
      const habitatType=WILDLIFE[kind];
      const activity=(Math.floor(w.life.time/12)+(n>>>5))%6;
      const pose:AnimalMoment['pose']=habitatType.nocturnal&&phase!==3 || phase===3&&!habitatType.nocturnal&&habitatType.art==='mammal' ? 'sleep'
        : kind==='crystal-slime'||kind==='frog' ? 'hop' : habitatType.art==='aquatic'||habitatType.art==='flying' ? 'walk'
        : activity===0?'run':activity===1?'eat':activity===2?'greet':'walk';
      const moment={pose,until:w.life.time+4};
      const walkingOffset=pose==='sleep'||pose==='eat' ? 0 : motion;
      const tries=roamingOffsets.map((_,i)=>roamingOffsets[(i+walkingOffset+n)%roamingOffsets.length]);
      for (const [dx,dz] of tries) {
        const nx=ax+dx,nz=az+dz;
        if (!safeTile(w,nx,nz)) continue;
        if (coast===legacyRegion(nx,nz) || coast&&(underground||highSky)) continue;
        const water=coast ? {surface:-.12,depth:2} : naturalVoxelWater(w,nx,nz);
        const altitude=underground ? Math.floor(height) : terrainHeight(w,nx,nz);
        if (!underground && !highSky && aquatic!==!!water) continue;
        if (underground && (!solid(blockAt(w,nx,altitude-1,nz)) || solid(blockAt(w,nx,altitude,nz)))) continue;
        if (!underground && !highSky && !water && solid(blockAt(w,nx,altitude,nz))) continue;
        if(w.dimensionId&&(habitatType.art==='aquatic'&&!water||blockAt(w,nx,altitude,nz)==='cave-lava'))continue;
        const ny=highSky ? Math.max(altitude+1,height+.8) : water ? water.surface-(kind==='dolphin'?.35:.48) : altitude+(WILDLIFE[kind].art==='flying'?.25:0);
        const facing:CreatureFacing=dx<0?'left':dx>0?'right':dz<0?'back':'front';
        if (Math.hypot(nx+.5-x,nz+.5-z)<=radius) fauna.push({id:id+':'+kind,kind,x:nx+.5,y:ny,z:nz+.5,bond:0,moment,facing});
        break;
      }
    }
  }
  return fauna;
}

const scanTime = new WeakMap<World,number>();
export function advanceWildlife(w:World,now:number) {
  if (!w.started || w.ended || w.gameMode==='BATTLE_ROYALE' || (scanTime.get(w) ?? 0)>now-2000) return;
  scanTime.set(w,now);
  for (const p of Object.values(w.players)) {
    if (p.spectator || p.nativeScene || p.life?.indoors) continue;
    const y=p.position3D?.y ?? terrainHeight(w,p.x,p.y);
    for (const a of visibleWildlife(w,p.position3D?.x??p.x+.5,p.position3D?.z??p.y+.5,4,y)) {
      if (Math.abs(a.y-y)>2.5) continue;
      const seen=p.wildlifeSeen ??= {};
      if (!Object.hasOwn(seen,a.kind)) { seen[a.kind]=calendar(w).day; w.revision++; }
    }
  }
}

export function restoreWildlife(player:Adventurer) {
  if (!player.wildlifeSeen) return;
  player.wildlifeSeen=Object.fromEntries(Object.entries(player.wildlifeSeen)
    .filter(([id,day])=>Object.hasOwn(WILDLIFE,id) && Number.isSafeInteger(day) && day>=0));
}

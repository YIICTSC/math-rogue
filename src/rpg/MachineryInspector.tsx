import React from 'react';
import { CornerDownLeft, Play, RotateCw, Square, TrainFront } from 'lucide-react';
import type { LanguageMode } from '../types';
import type { World } from './engine';
import { canAutomate, canStore, cargoCart, circuitConnections, connectedStations, inspectMachine, machineCarts, machineStorage, NOTE_REPEATS, railConnections, storageLimits, type MachineCell, type MachineCommand } from './machinery';
import { validFarmMachineJob } from './farm/model';
import { CROPS } from './farm/catalog';
import { copy } from './town/catalog';
import { isFilteredPart, isMachinePart, isProcessor, isRail, MACHINE_PARTS, PROCESSOR } from './machineryParts';
import { ALL_MATERIAL_NAMES, CART_NAMES, WORKSHOP_RECIPES, type CartItem, type VoxelItem } from './voxelCatalog';
import { blockAt, voxelKey } from './voxel';
import { trans } from '../utils/textUtils';
import { isWatercraftItem, WATERCRAFT } from './transportCatalog';

const extraNames = {
  crystal_powder: ['魔晶回路粉', 'Crystal powder', 'ましょうかいろこ'],
  red_crystal_ore: ['赤魔晶石鉱石', 'Red crystal ore', 'あかましょうせきこうせき'],
  minecart: ['トロッコ', 'Minecart', 'トロッコ'],
  minecart_chest: ['貨物トロッコ','Cargo cart','かもつトロッコ'],
  minecart_hopper: ['集荷トロッコ','Hopper cart','しゅうかトロッコ'],
  minecart_engine: ['動力トロッコ','Powered cart','どうりょくトロッコ'],
  minecart_work: ['作業トロッコ','Workshop cart','さぎょうトロッコ'],
  bucket: ['バケツ','Bucket','バケツ'],
  water_bucket: ['水入りバケツ','Water bucket','みずいりバケツ'],
  lava_bucket: ['溶岩入りバケツ','Lava bucket','ようがんいりバケツ'],
  piston_head: ['ピストンの押し板', 'Piston head', 'ピストンのおしいた'],
  lift_platform: ['昇降床','Lift platform','しょうこうゆか'],
  bubbling_stone: ['泡の石','Bubble stone','あわのいし'],
  magma_block: ['マグマブロック','Magma block','マグマブロック'],
  'cave-lava': ['地底の溶岩','Cavern lava','ちていのようがん'],
  warehouse_chest: ['大型チェスト','Warehouse chest','おおがたチェスト'],
  anvil: ['金床','Anvil','かなとこ'],
  whetstone: ['砥石','Grindstone','といし'],
  imprint_table: ['魔刻台','Imprinting table','まこくだい'],
  imprint_book: ['魔刻の書','Imprint book','まこくのしょ'],
  brew_table: ['醸造台','Brewing stand','じょうぞうだい'],
  air_draught: ['水肺のしずく','Waterbreath draught','すいはいのしずく'],
  stride_draught: ['風脚のしずく','Windstep draught','かぜあしのしずく'],
  miner_draught: ['石砕きのしずく','Stonebreaker draught','いしくだきのしずく'],
  smoked_fish: ['魚の燻製','Smoked fish','さかなのくんせい'],
  glider_wing: ['滑空翼','Glider wing','かっくうよく'],
  glider_boost: ['風の加速筒','Glider booster','かぜのかそくとう'],
} as const;

const buckets: VoxelItem[] = ['bucket','water_bucket','lava_bucket'];

export const sandboxText = (lang: LanguageMode | undefined, ja: string, en: string, hi: string) =>
  lang === 'ENGLISH' ? en : lang === 'HIRAGANA' ? hi : ja;

export const hasSandboxItemName = (id: string) => isMachinePart(id) || isWatercraftItem(id) || Object.hasOwn(extraNames,id);

export function sandboxItemName(id: string, lang: LanguageMode | undefined) {
  const name = isMachinePart(id) ? MACHINE_PARTS[id] : isWatercraftItem(id) ? WATERCRAFT[id].name : extraNames[id as keyof typeof extraNames];
  if (name) return sandboxText(lang, name[0], name[1], name[2]);
  if (lang === 'ENGLISH') return id.replaceAll('_', ' ');
  return trans(ALL_MATERIAL_NAMES[id as VoxelItem] || id, lang || 'JAPANESE');
}

type Props = {
  world: World;
  selfId: string;
  position: MachineCell;
  languageMode?: LanguageMode;
  send: (a: MachineCommand | { type: 'voxel-storage'; x: number; y: number; z: number; item: VoxelItem; amount: number; direction: 'deposit' | 'withdraw' }) => void;
};

type Operation = MachineCommand extends infer Action ? Action extends MachineCommand ? Omit<Action, 'type' | 'x' | 'y' | 'z'> : never : never;

type TimetableValue = Extract<Operation,{command:'cart-timetable'}>['value'];
type Station = ReturnType<typeof connectedStations>['stations'][number];

function TimetableEditor({stations,value,onSubmit,L}:{stations:Station[];value?:TimetableValue;onSubmit:(value:TimetableValue)=>void;
  L:(ja:string,en:string,hi:string)=>string}) {
  const [stops,setStops]=React.useState(value?.stops ?? []);
  const [dwellSeconds,setDwellSeconds]=React.useState(value?.dwellSeconds ?? 4);
  const stationName=(key:string)=>stations.find(station=>station.key===key)?.name || key;
  const remaining=stations.filter(station=>!stops.includes(station.key));
  return <details>
    <summary>{L('時刻表','Timetable','じこくひょう')}{value ? ' ✓' : ''}</summary>
    <ol className="rpg-device-inventory">{stops.map((stop,index)=><li key={stop}>
      <span>{index+1}. {stationName(stop)}</span>
      <button onClick={()=>setStops(stops.filter(key=>key!==stop))} aria-label={L(`${stationName(stop)}を外す`,`Remove ${stationName(stop)}`,`${stationName(stop)}をはずす`)}>×</button>
    </li>)}</ol>
    <label>{L('停車駅を追加','Add a stop','ていしゃえきをついか')}
      <select value="" disabled={stops.length>=6 || !remaining.length} onChange={e=>setStops([...stops,e.target.value])}>
        <option value="" disabled>{L('駅を選ぶ','Choose a station','えきをえらぶ')}</option>
        {remaining.map(station=><option key={station.key} value={station.key}>{station.name || station.key}</option>)}
      </select>
    </label>
    <label>{L('停車時間（秒）','Dwell time (seconds)','ていしゃじかん（びょう）')}
      <input type="number" min={2} max={60} value={dwellSeconds} onChange={e=>setDwellSeconds(e.target.valueAsNumber || 2)} />
    </label>
    <div className="rpg-device-actions">
      <button disabled={stops.length<2 || !stops.every(stop=>stations.some(station=>station.key===stop)) || !Number.isInteger(dwellSeconds) || dwellSeconds<2 || dwellSeconds>60}
        onClick={()=>onSubmit({stops,dwellSeconds})}>{L('時刻表を登録','Save timetable','じこくひょうをとうろく')}</button>
      {value&&<button onClick={()=>{setStops([]);onSubmit(null);}}>{L('時刻表を解除','Clear timetable','じこくひょうをかいじょ')}</button>}
    </div>
  </details>;
}

export default function MachineryInspector({ world, selfId, position, languageMode, send }: Props) {
  const L = (ja: string, en: string, hi: string) => sandboxText(languageMode, ja, en, hi);
  const { x, y, z } = position;
  const block = blockAt(world, x, y, z);
  const { device, cart, cartId, trailer, locomotive, owner, rotation } = inspectMachine(world, x, y, z);
  const owned = owner === selfId, mine = cart?.rider === selfId || !cart?.rider && cart?.owner === selfId;
  const bag = world.players[selfId]?.life?.bag ?? {};
  const inventory = world.voxels?.containers?.[voxelKey(x, y, z)]?.items ?? {};
  const consignments = cart?.cargo ?? {};
  const carried = (Object.keys(CART_NAMES) as CartItem[]).filter(kind => (bag[kind]||0)>0);
  const routeStations=cart && !locomotive && mine && !cart.moving ? connectedStations(world,position,trailer?.cell).stations : [];
  const timetableStations=block==='station_rail' ? [{key:voxelKey(x,y,z),name:device?.stationName},...routeStations] : routeStations;
  const canCouple=cart?.owner===selfId && !cart.moving && !cart.waiting && !locomotive?.moving && !locomotive?.waiting;
  const neighbors=canCouple && !trailer && !locomotive ? new Set(railConnections(world,position).map(next=>voxelKey(next.x,next.y,next.z))) : null;
  const carts=neighbors ? machineCarts(world) : [];
  const candidates=carts.filter(candidate=>candidate.id!==cartId && candidate.owner===selfId && neighbors?.has(candidate.cell) &&
    !candidate.rider && !candidate.moving && !candidate.waiting && !candidate.coupledTo && !carts.some(other=>other.coupledTo===candidate.id));
  const wiring=device ? circuitConnections(world,position) : [];
  const dispatch = (op: Operation) => send({ type: 'voxel-device', ...position, ...op } as MachineCommand);
  if (!device && !cart && !machineStorage(block)) return null;
  return <section className="rpg-device-inspector" aria-label={L('装置の調査', 'Inspect device', 'そうちのちょうさ')}>
    <header><strong>{block ? sandboxItemName(block, languageMode) : sandboxItemName('minecart', languageMode)}</strong>
      {device && <b data-signal={device.signal}>◆ {device.signal} / 15 · {['↑', '→', '↓', '←'][rotation]}</b>}
    </header>
    {device && block && <div className="rpg-device-actions">
      {['crystal_lever', 'crystal_button', 'wooden_button', 'crystal_beacon'].includes(block) &&
        <button onClick={() => dispatch({ command: 'use' })} disabled={block === 'crystal_beacon' && !owned}>{device.enabled ? L('切る', 'Switch off', 'きる') : L('起動', 'Activate', 'きどう')}</button>}
      {owned && <button onClick={() => dispatch({ command: 'rotate' })} aria-label={L('装置を回転', 'Rotate device', 'そうちをかいてん')}><RotateCw size={15} /></button>}
      {owned && (block==='piston' || block==='sticky_piston') && <button disabled={device.opened} onClick={()=>dispatch({command:'piston-axis'})}>
        {device.vertical ? L('↑ 上向き','↑ Upward','↑ うえむき') : L('→ 横向き','→ Horizontal','→ よこむき')}
      </button>}
      {owned && block === 'crystal_repeater' && <label>{L('遅延', 'Delay', 'ちえん')} <select value={device.delay || 1} onChange={e => dispatch({ command: 'delay', value: Number(e.target.value) })}>
        {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n * 0.25} s</option>)}
      </select></label>}
      {owned && block==='vibration_sensor' && <label>{L('振動を拾う距離','Vibration range','しんどうをひろうきょり')}
        <select value={device.sensorRange ?? 4} onChange={e=>dispatch({command:'sensor-range',value:Number(e.target.value)})}>
          {[2,4,6].map(range=><option key={range} value={range}>{range} m</option>)}
        </select>
      </label>}
      {owned && block === 'crystal_comparator' && <label>{L('方式', 'Mode', 'ほうしき')} <select value={device.mode || 'compare'} onChange={e => dispatch({ command: 'mode', value: e.target.value === 'subtract' ? 'subtract' : 'compare' })}>
        <option value="compare">{L('比較', 'Compare', 'ひかく')}</option><option value="subtract">{L('減算', 'Subtract', 'げんざん')}</option>
      </select></label>}
      {owned && isFilteredPart(block) && <label>{L('選別', 'Filter', 'せんべつ')} <select value={device.filter || ''} onChange={e => dispatch({ command: 'filter', value: e.target.value })}>
        <option value="">{L('すべて', 'All items', 'すべて')}</option>
        {(block==='dispenser' ? buckets : Object.keys(ALL_MATERIAL_NAMES)).map(item => <option key={item} value={item}>{sandboxItemName(item, languageMode)}</option>)}
      </select></label>}
      {owned && isProcessor(block) && <label>{L('加工品', 'Recipe', 'かこうひん')} <select value={device.recipe || PROCESSOR[block].recipe} onChange={e => dispatch({ command: 'recipe', value: e.target.value })}>
        {WORKSHOP_RECIPES.filter(r => canAutomate(block, r.id)).map(r => <option key={r.id} value={r.id}>{sandboxItemName(r.output, languageMode)} ×{r.count}</option>)}
      </select><progress max={PROCESSOR[block].ticks} value={device.progress || 0} /></label>}
      {owned && block === 'note_block' && <><label>{L('音程', 'Pitch', 'おんてい')} <select value={device.note ?? 12} onChange={e => dispatch({ command: 'note', value: Number(e.target.value) })}>
        {Array.from({ length: 25 }, (_, n) => <option key={n} value={n}>{n - 12}</option>)}
      </select></label>
      <select aria-label={L('楽器', 'Instrument', 'がっき')} value={device.instrument || 'bell'} onChange={e=>dispatch({command:'instrument',value:e.target.value})}>
        <option value="bell">{L('ベル','Bell','ベル')}</option>
        <option value="wood">{L('木琴','Wood bar','もっきん')}</option>
        <option value="reed">{L('リード','Reed','リード')}</option>
      </select><label>{L('音量','Volume','おんりょう')}
        <select value={device.noteGain ?? 100} onChange={e=>dispatch({command:'note-volume',value:Number(e.target.value)})}>
          {[...new Set([0,25,50,75,100,device.noteGain ?? 100])].sort((a,b)=>a-b).map(n=><option key={n} value={n}>{n}%</option>)}
        </select>
      </label><label>{L('演奏間隔','Play interval','えんそうかんかく')}
        <select value={device.notePeriod ?? 0} onChange={e=>dispatch({command:'note-repeat',value:Number(e.target.value)})}>
          {NOTE_REPEATS.map(n=><option key={n} value={n}>{n ? `${n*.25} s` : L('信号が入ったとき','On a new signal','しんごうがはいったとき')}</option>)}
        </select>
      </label></>}
      {owned && block==='farm_machine' && <label>{L('作業','Operation','さぎょう')}
        <select value={device.farmJob ?? 'harvest'} onChange={e=>{const value=e.target.value;if(validFarmMachineJob(value))dispatch({command:'farm-job',value});}}>
          <option value="harvest">{L('収穫','Harvest','しゅうかく')}</option>
          <option value="water">{L('給水','Irrigate','きゅうすい')}</option>
          <option value="fertilize">{L('施肥','Fertilize','せひ')}</option>
          <option value="ranch">{L('給餌と集荷','Feed and collect','えさやりとしゅうか')}</option>
          <optgroup label={L('種まき','Sow','たねまき')}>{CROPS.map(crop=><option key={crop.id} value={`plant:${crop.id}`}>{copy(crop.name,languageMode || 'JAPANESE')}</option>)}</optgroup>
        </select>
      </label>}
      {owned && block==='station_rail' && <button aria-pressed={!!device.stationSignal} onClick={()=>dispatch({command:'station-signal'})}>
        {L('時刻表でも発車信号が必要','Require departure signal for timetable','じこくひょうでもはっしゃしんごうがひつよう')}
      </button>}
    </div>}
    {device && wiring.length>0 && <details>
      <summary>{L('信号の入出力','Signal inputs and outputs','しんごうのにゅうしゅつりょく')}</summary>
      <ul className="rpg-research-supplies">{wiring.map(cell=><li key={voxelKey(cell.x,cell.y,cell.z)}>
        {sandboxItemName(cell.block,languageMode)} · {cell.x}, {cell.y}, {cell.z} · ← {cell.input} / → {cell.output}
      </li>)}</ul>
    </details>}
    {device && world.voxels?.machinery?.overloaded && <small role="status">
      {L('更新上限に達し、残りの回路を順に処理しています。','Circuit update limit reached. Pending changes are being processed.','こうしんのじょうげんにたっしたので、のこりのかいろをじゅんにこうしんしています。')}
    </small>}
    {device?.blocked && <small>{L('前方に障害物があります', 'The piston path is blocked', 'まえにしょうがいぶつがあります')}</small>}
    {block==='dispenser' && <small>{L('信号が入ったときに、正面の水源を置くか、バケツでくみます。','On a new signal, place or scoop a source at the outlet.','しんごうがはいったときに、まえにみずをおくか、バケツでくみます。')}</small>}
    {block==='item_sorter' && <small>{L('指定した品物は正面へ、ほかの品物は右へ送ります。','Send matching items forward and the other items to the right.','えらんだしなものはまえへ、ほかはみぎへおくります。')}</small>}
    {block==='station_rail' && (owned
      ? <form className="rpg-device-actions" key={voxelKey(x,y,z)} onSubmit={e=>{e.preventDefault();dispatch({command:'station-name',value:String(new FormData(e.currentTarget).get('name'))});}}>
        <input name="name" maxLength={24} defaultValue={device?.stationName} placeholder={L('駅名','Station name','えきめい')} aria-label={L('駅名','Station name','えきめい')} required />
        <button type="submit">{L('登録','Save','とうろく')}</button>
      </form> : device?.stationName && <small>{device.stationName}</small>)}
    {block === 'crystal_beacon' && <small>{device?.tier
      ? L(`段階 ${device.tier} · 半径 ${6 + device.tier * 4} m`, `Tier ${device.tier} · radius ${6 + device.tier * 4} m`, `${device.tier}だん · はんけい ${6 + device.tier * 4} m`)
      : L('専用土台・空への通り道・ダイヤが必要', 'Needs a mineral pyramid, open sky and one diamond', 'どだい・そらへのとおりみち・ダイヤがひつよう')}</small>}
    {(cart || isRail(block)) && <div className="rpg-device-actions">
      {!cart && owned && carried.map(value=><button key={value} onClick={() => dispatch({ command: 'cart-place',value })}><TrainFront size={16} /> {sandboxItemName(value,languageMode)} {L('を置く','· Place','をおく')}</button>)}
      {cart && !locomotive?.moving && (!cart.rider || cart.rider === selfId) && <button onClick={() => dispatch({ command: 'cart-ride' })}><CornerDownLeft size={16} /> {cart.rider ? L('降りる', 'Dismount', 'おりる') : L('乗る', 'Board', 'のる')}</button>}
      {cart && !locomotive && mine && <button onClick={() => dispatch({ command: cart.moving || cart.waiting && cart.timetable ? 'cart-stop' : 'cart-drive' })}>
        {cart.moving || cart.waiting && cart.timetable ? <><Square size={15} /> {L('停止', 'Stop', 'ていし')}</> : <><Play size={15} /> {L('発車', 'Depart', 'はっしゃ')}</>}
      </button>}
      {cart?.owner === selfId && !cart.rider && !cart.moving && !trailer && !locomotive && <button disabled={Object.values(consignments).some(Boolean)} onClick={() => dispatch({ command: 'cart-remove' })}>{L('回収', 'Pick up', 'かいしゅう')}</button>}
      {canCouple && (trailer || locomotive) && <button onClick={()=>dispatch({command:'cart-couple',value:''})}>{L('連結を外す','Uncouple','れんけつをはずす')}</button>}
    </div>}
    {!!candidates.length && <label>{L('後ろに車両を連結','Couple a following cart','うしろにしゃりょうをれんけつ')}
      <select value="" onChange={event=>dispatch({command:'cart-couple',value:event.target.value})}>
        <option value="" disabled>{L('車両を選ぶ','Choose a cart','しゃりょうをえらぶ')}</option>
        {candidates.map(candidate=><option key={candidate.id} value={candidate.id}>{sandboxItemName(candidate.kind??'minecart',languageMode)} · {candidate.cell}</option>)}
      </select>
    </label>}
    {cart && <small>{sandboxItemName(cart.kind ?? 'minecart',languageMode)}{cart.waiting ? ` · ${cart.timetable && !device?.stationSignal
      ? L('時刻表に沿って停車中','Scheduled station stop','じこくひょうにそってていしゃちゅう') : L('発車信号を待機中','Waiting for signal','はっしゃしんごうをまっています')}` : ''}</small>}
    {cart?.timetable && cart.destination && <small>{L('次の駅','Next station','つぎのえき')} · {world.voxels?.machinery?.devices[cart.destination]?.stationName || cart.destination}</small>}
    {cart && !locomotive && mine && !cart.timetable && !cart.moving && (routeStations.length>0 || cart.destination) && <label>
      {L('行き先','Destination','いきさき')}
      <select value={cart.destination ?? ''} onChange={e=>dispatch({command:'cart-route',value:e.target.value})}>
        <option value="">{L('線路に沿って走る','Follow the rail','せんろにそってはしる')}</option>
        {routeStations.map(station=><option key={station.key} value={station.key}>{station.name || `${L('停車レール','Station rail','ていしゃレール')} · ${station.key}`}</option>)}
        {cart.destination&&!routeStations.some(station=>station.key===cart.destination)&&<option value={cart.destination} disabled>
          {L('経路がありません','Route unavailable','けいろがありません')} · {cart.destination}
        </option>}
      </select>
    </label>}
    {cart?.owner===selfId && !locomotive && mine && !cart.moving && !cart.waiting && (timetableStations.length>=2 || cart.timetable) &&
      <TimetableEditor key={voxelKey(x,y,z)} stations={timetableStations} value={cart.timetable} L={L}
        onSubmit={value=>dispatch({command:'cart-timetable',value})} />}
    {cart?.owner===selfId && !cart.moving && !locomotive?.moving && cargoCart(cart.kind) && <details>
      <summary>{L('積み荷','Cargo','つみに')} · {Object.values(consignments).filter(Boolean).length}/24</summary>
      <div className="rpg-device-inventory">
        {([...new Set([...Object.keys(consignments),...Object.keys(bag)])] as VoxelItem[]).filter(item=>consignments[item]||bag[item]).map(item=>
          <div key={item}><span>{sandboxItemName(item,languageMode)} · {consignments[item]||0}</span>
            <button disabled={!bag[item] || consignments[item]===64} onClick={()=>dispatch({command:'cart-cargo',item,amount:1,direction:'load'})}>{L('積む','Load','つむ')}</button>
            <button disabled={!consignments[item]} onClick={()=>dispatch({command:'cart-cargo',item,amount:1,direction:'unload'})}>{L('降ろす','Unload','おろす')}</button>
          </div>)}
      </div>
    </details>}
    {machineStorage(block) && (block === 'chest' || owned) &&
      <details><summary>{L('収納', 'Storage', 'しゅうのう')} · {Object.values(inventory).filter(Boolean).length}/{storageLimits(block).slots}</summary>
        <div className="rpg-device-inventory">
          {([...new Set([...Object.keys(inventory), ...Object.keys(bag)])] as VoxelItem[])
            .filter(item => inventory[item] || bag[item] && (block!=='dispenser' || buckets.includes(item))).map(item =>
            <div key={item}><span>{sandboxItemName(item, languageMode)} · {inventory[item] || 0}</span><button disabled={!bag[item]||!canStore(inventory,item,1,block)} onClick={() => send({ type: 'voxel-storage', ...position, item, amount: 1, direction: 'deposit' })}>{L('入れる', 'Deposit', 'いれる')}</button><button disabled={!inventory[item]} onClick={() => send({ type: 'voxel-storage', ...position, item, amount: 1, direction: 'withdraw' })}>{L('出す', 'Withdraw', 'だす')}</button></div>)}
        </div>
      </details>}
  </section>;
}

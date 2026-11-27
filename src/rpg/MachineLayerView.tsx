import React, { useEffect, useState } from 'react';
import { sandboxAllows } from './sandboxAccess';
import { Axe, Droplet, Layers3, RotateCw, Wrench, X } from 'lucide-react';
import WorldCanvas from './WorldCanvas';
import { WORLD_SCALE } from './worldLandscape';
import { energyOf } from './energy';
import { machineCarts } from './machinery';
import MachineryInspector, { sandboxItemName, sandboxText } from './MachineryInspector';
import type { MachineLayerView as LayerFilter } from './machineLayer';
import { fluidAt, fluidCanScoop } from './placedFluids';
import type { BlueprintPreview } from './blueprints';
import { blockAt, MAX_HEIGHT, MIN_DEPTH, miningCost, playerHeight, protectedVoxel, type Block, type VoxelAction } from './voxel';
import { VoxelWorkshopPanel } from './VoxelWorkshopPanel';
import { currentCavern } from './subsurface';

type Props = React.ComponentProps<typeof WorldCanvas> & {
  onEnergyRequest?: () => void;
  onVoxelAction?: (action: VoxelAction) => void;
  inputBlocked?: boolean;
};

export default function MachineLayerView(props: Props) {
  const { world, selfId, languageMode, onVoxelAction, inputBlocked, overview } = props;
  const player = world.players[selfId];
  const [chosenHeight, setHeight] = useState<number | null>(null);
  const [filter, setFilter] = useState<LayerFilter>('slice');
  const [position, setPosition] = useState<{ x: number; z: number } | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<Block>('wood');
  const [rotation, setRotation] = useState(0);
  const [workshop, setWorkshop] = useState(false);
  const [inspecting, setInspecting] = useState(false);
  const [blueprint,setBlueprint]=useState<BlueprintPreview|null>(null);
  const L = (ja: string, en: string, hi: string) => sandboxText(languageMode, ja, en, hi);
  const inside=player&&currentCavern(world,player);
  useEffect(()=>{setHeight(null);setPosition(null);setInspecting(false);},[inside?.id]);
  if (!player || overview || !onVoxelAction) return <WorldCanvas {...props} />;
  const feet = playerHeight(world, player);
  const playerX = player.position3D?.x ?? player.x + .5;
  const playerZ = player.position3D?.z ?? player.y + .5;
  const ground = Math.floor(feet);
  const height=chosenHeight??(inside?ground:null);
  const limit = (y: number) => Math.min(MAX_HEIGHT, Math.max(MIN_DEPTH + 1, y));
  const select = (x: number, z: number) => setPosition({ x, z });
  const layer = height === null ? undefined : { height, view: filter, selected: position, blueprint, onSelect: select,
    onNudge: (dx: number, dz: number) => {
      const x = (position?.x ?? Math.floor(playerX)) + dx;
      const z = (position?.z ?? Math.floor(playerZ)) + dz;
      if (x >= WORLD_SCALE.min && x < WORLD_SCALE.max && z >= WORLD_SCALE.min && z < WORLD_SCALE.max) select(x, z);
    } };
  const target = position && height !== null ? { ...position, y: height } : null;
  const existing = target ? blockAt(world, target.x, target.y, target.z) : null;
  const fluid = target && fluidAt(world,target.x,target.y,target.z);
  const far = !target || Math.hypot(target.x + .5 - playerX, target.y + .5 - (feet + WORLD_SCALE.eyeHeight), target.z + .5 - playerZ) > 4.5;
  const locked = far || !!target && protectedVoxel(world, target.x, target.z);
  const canPlace=!!target&&sandboxAllows(world,selfId,target,'build');
  const canBreak=!!target&&sandboxAllows(world,selfId,target,'break');
  const bag = player.life?.bag || {};
  const cart = machineCarts(world).find(cart => cart.rider === selfId);
  const send = (action: VoxelAction) => {
    if (!inputBlocked) onVoxelAction(action);
  };
  const change = (kind: 'voxel-place' | 'voxel-break') => {
    if (!target || locked || !(kind==='voxel-place'?canPlace:canBreak)) return;
    const cost = kind === 'voxel-break' && existing ? miningCost(existing, player, world) : .1;
    if (energyOf(player.life) < cost && Number.isFinite(cost)) { props.onEnergyRequest?.(); return; }
    send({ type: kind, ...target, block: selectedBlock, rotation });
  };
  function toggleLayer() {
    if (height === null) {
      setHeight(limit(ground));
      setPosition(null);
      setInspecting(false);
    } else { setHeight(null); setWorkshop(false); }
  }
  return <>
    <WorldCanvas {...props} machineLayer={layer} />
    <div className="rpg-layer-dock" aria-label={L('建築の高さ', 'Building layers', 'けんちくのたかさ')}>
      <div className="rpg-layer-toolbar">
        <button aria-expanded={height !== null} disabled={inputBlocked} onClick={toggleLayer}><Layers3 size={17} /> {inside
          ? L('地下断面','Underground layers','ちかだんめん') : height === null
            ? L('高さ断面', 'Layers', 'たかさだんめん') : L('地表に戻る', 'Surface view', 'ちひょうにもどる')}</button>
        {height !== null && <>
          <button aria-label={L('高さを下げる', 'Lower layer', 'たかさをさげる')} disabled={height <= MIN_DEPTH + 1} onClick={() => setHeight(limit(height - 1))}>−</button>
          <output aria-live="polite">Y {height}</output>
          <button aria-label={L('高さを上げる', 'Raise layer', 'たかさをあげる')} disabled={height >= MAX_HEIGHT} onClick={() => setHeight(limit(height + 1))}>＋</button>
          <button onClick={() => setHeight(limit(ground))}>{L('現在地', 'My level', 'げんざいち')}</button>
        </>}
      </div>
      {height !== null && !inputBlocked && <>
        {blueprint && <div className="rpg-layer-toolbar rpg-blueprint-tools"><span>{blueprint.pattern.name}</span>
          <button onClick={()=>send({type:'voxel-blueprint',command:'place',...blueprint.origin,pattern:blueprint.pattern})}>{L('まとめて建築','Build blueprint','まとめてけんちく')}</button>
          <button aria-label={L('仮表示を閉じる','Close preview','かりひょうじをとじる')} onClick={()=>setBlueprint(null)}><X size={15}/></button>
        </div>}
        <div className="rpg-layer-toolbar">
          <select aria-label={L('表示レイヤー', 'Layer display', 'ひょうじレイヤー')} value={filter} onChange={e => setFilter(e.target.value as LayerFilter)}>
            <option value="slice">{L('断面', 'Cross section', 'だんめん')}</option>
            <option value="circuit">{L('回路', 'Circuits', 'かいろ')}</option>
            <option value="rail">{L('鉄道', 'Railway', 'てつどう')}</option>
            <option value="logistics">{L('物流', 'Logistics', 'ぶつりゅう')}</option>
            <option value="fluids">{L('水流と溶岩', 'Water and lava', 'すいりゅうとようがん')}</option>
          </select>
          <button onClick={() => setWorkshop(true)}><Wrench size={15} /> {L('建築工房', 'Workshop', 'けんちくこうぼう')}</button>
        </div>
        {target && <div className="rpg-layer-selection">
          <header><span>{existing ? sandboxItemName(existing, languageMode) : fluid
            ? fluid.kind === 'water' ? L('水流','Water flow','すいりゅう') : L('溶岩流','Lava flow','ようがんりゅう')
            : `${sandboxItemName(selectedBlock, languageMode)} ×${bag[selectedBlock] || 0}`}</span>
            <small>{target.x}, {height}, {target.z}</small><button aria-label={L('選択を解除', 'Clear selection', 'せんたくをかいじょ')} onClick={() => setPosition(null)}><X size={15} /></button>
          </header>
          {locked ? <small>{L('ここには手が届かないか、保護されています', 'Out of reach or protected', 'ここにはてがとどかないか、ほごされています')}</small> :
            <div className="rpg-device-actions">
              <button disabled={!!existing || !bag[selectedBlock] || !canPlace} onClick={() => change('voxel-place')}>＋ {L('置く', 'Place', 'おく')}</button>
              <button disabled={!existing || !canBreak} onClick={() => change('voxel-break')}><Axe size={14} /> {L('壊す', 'Break', 'こわす')}</button>
              <button aria-label={L('建材を回転', 'Rotate placement', 'けんざいをかいてん')} onClick={() => setRotation((rotation + 1) % 4)}><RotateCw size={14} /> {rotation * 90}°</button>
              <button aria-expanded={inspecting} onClick={() => setInspecting(!inspecting)}>{L('調べる', 'Inspect', 'しらべる')}</button>
              {bag.bucket>0 && fluidCanScoop(world,target,selfId) && <button onClick={() => send({type:'voxel-fluid',...target,command:'scoop'})}><Droplet size={14} /> {L('くむ','Fill bucket','くむ')}</button>}
              {!existing && bag.water_bucket>0 && <button onClick={() => send({type:'voxel-fluid',...target,command:'water'})}>{L('水を置く','Place water','みずをおく')}</button>}
              {!existing && bag.lava_bucket>0 && <button onClick={() => send({type:'voxel-fluid',...target,command:'lava'})}>{L('溶岩を置く','Place lava','ようがんをおく')}</button>}
            </div>}
          {inspecting && !locked && <MachineryInspector world={world} selfId={selfId} position={target} languageMode={languageMode} send={send} />}
        </div>}
      </>}
      {cart && !inputBlocked && (!target || cart.x !== target.x || cart.y !== target.y || cart.z !== target.z || !inspecting) &&
        <MachineryInspector world={world} selfId={selfId} position={cart} languageMode={languageMode} send={send} />}
    </div>
    {workshop && !inputBlocked && <VoxelWorkshopPanel world={world} selfId={selfId} languageMode={languageMode || 'JAPANESE'}
      send={send} onChoose={setSelectedBlock} onClose={() => setWorkshop(false)} onBlueprintPreview={value=>{
        setBlueprint(value);setHeight(limit(value.origin.y));setPosition(null);
      }} />}
  </>;
}

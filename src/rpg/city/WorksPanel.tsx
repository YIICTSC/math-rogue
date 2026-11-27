import { useState } from 'react';
import type { LanguageMode } from '../../types';
import type { World } from '../engine';
import { sandboxItemName, sandboxText } from '../MachineryInspector';
import { copy } from '../town/catalog';
import { cityBuilding } from './catalog';
import { CITY_WORKS, cityWorkHardware, cityWorkHomes, cityWorkKind, type CityWorksAction } from './works';
import type { CityLot } from './model';

const coordinates=(x:number,z:number)=>`(${x}, ${z})`;

function LotWorks({world,lot,selfId,language,send}:{world:World;lot:CityLot;selfId:string;
  language:LanguageMode;send:(action:CityWorksAction)=>void}) {
  const [show,setShow]=useState(false);
  const L=(ja:string,en:string,hi:string)=>sandboxText(language,ja,en,hi);
  const kind=cityWorkKind(lot)!;
  const link=world.city?.works?.links[lot.id];
  const status=link?.units
    ? L(`${link.lastMonth}月に稼働 · 実績 ${link.units}`,`Active in month ${link.lastMonth} · ${link.units} units`,`${link.lastMonth}がつにさどう · じっせき ${link.units}`)
    : link ? L('設備または住民の稼働待ち','Waiting for equipment or residents','せつびやじゅうみんのさどうまち')
    : L('設備未連携','Equipment unlinked','せつびみれんけい');
  return <section className="rpg-city-work-entry">
    <div><strong>{copy(cityBuilding(lot.kind)!.name,language)} {coordinates(lot.x,lot.y)}</strong>
      <span>{copy(CITY_WORKS[kind].job,language)} · {status}</span>
      {link&&<small>{sandboxItemName(world.voxels?.edits[link.cell]??'',language)} ({link.cell})</small>}
    </div>
    {lot.owner===selfId&&<button aria-expanded={show} onClick={()=>setShow(value=>!value)}>{L('連携設定','Configure link','れんけいせってい')}</button>}
    {show&&<form key={link?.cell} onSubmit={event=>{
      event.preventDefault();const form=new FormData(event.currentTarget);
      send({type:'city-works-link',lot:lot.id,cell:String(form.get('equipment')??''),home:String(form.get('home')??'')});
    }}>
      <label>{L('連携設備','Equipment','れんけいせつび')}
        <select name="equipment" required defaultValue={link?.cell??''}>
          <option value="">{L('近くの設備を選択','Select nearby equipment','ちかくのせつびをえらぶ')}</option>
          {cityWorkHardware(world,lot).map(cell=><option key={cell} value={cell}>{sandboxItemName(world.voxels!.edits[cell]!,language)} ({cell})</option>)}
        </select>
      </label>
      <label>{L('担当する住民の家','Worker residence','たんとうするじゅうみんのいえ')}
        <select name="home" required defaultValue={link?.home??''}>
          <option value="">{L('道路につながった住宅を選択','Select a road-connected home','どうろにつながったいえをえらぶ')}</option>
          {cityWorkHomes(world,lot).map(home=><option key={home.id} value={home.id}>{coordinates(home.x,home.y)} · {home.people} {L('人','residents','にん')}</option>)}
        </select>
      </label>
      <button type="submit">{L('連携する','Link equipment','れんけいする')}</button>
      {link&&<button type="button" onClick={()=>send({type:'city-works-unlink',lot:lot.id})}>{L('連携解除','Unlink','れんけいかいじょ')}</button>}
      <small>{L('対応設備','Compatible equipment','たいおうせつび')}　{CITY_WORKS[kind].blocks.map(block=>sandboxItemName(block,language)).join(' / ')}</small>
    </form>}
  </section>;
}

export default function WorksPanel({world,selfId,languageMode,send}:{world:World;selfId:string;
  languageMode:LanguageMode;send:(action:CityWorksAction)=>void}) {
  const L=(ja:string,en:string,hi:string)=>sandboxText(languageMode,ja,en,hi);
  const lots=world.city!.lots.filter(cityWorkKind);
  return <div className="rpg-city-works">
    <p>{L('街の建物を周辺の設備と道路沿いの住宅につなぐと、住民が毎月の仕事を担当します。商店は果物・燻製、工房と守護ゴーレムは加工品を連携した設備から使います。',
      'Link a city building to nearby equipment and a road-connected home to staff it each month. Markets use fruit or smoked fish, and workshops and guardian golems use processed supplies from linked equipment.',
      'まちのたてものをちかくのせつびとどうろぞいのいえにつなぐと、じゅうみんがまいつきのしごとをたんとうします。しょうてんはくだものやくんせい、こうぼうとしゅごゴーレムはかこうひんをつかいます。')}</p>
    {lots.length ? lots.map(lot=><LotWorks key={lot.id} world={world} lot={lot} selfId={selfId} language={languageMode} send={send}/>)
      :<p>{L('まず商店、工房、農場などを建設しましょう。','Build a market, workshop, or farm to get started.','まずしょうてん、こうぼう、のうじょうなどをたてましょう。')}</p>}
  </div>;
}

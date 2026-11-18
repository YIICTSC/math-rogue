import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Backpack } from 'lucide-react';
import { InspectSlot } from '../item-menu/InspectSlot';
import { sortDungeonItems } from './sortItems';
import { SchoolSupplyIcon } from './sprites';
import './inventory-menu.css';

type Palette = { background: string; border: string; selection: string; text: string };
type Props = {
  inventory: any[];
  equipment: Record<string, any>;
  selectedIndex: number;
  selectedSlot: string | null;
  listRef: React.RefObject<HTMLDivElement | null>;
  name: (item: any) => string;
  description: (item: any) => string;
  known: (item: any) => boolean;
  text: (value: string) => string;
  select: (index: number) => void;
  selectSlot: (slot: any) => void;
  close: () => void;
  primary: (index: number) => void;
  unequip: (slot: any) => void;
  throwItem: (index: number) => void;
  drop: (index: number) => void;
  switchDiff: (item: any) => string | null | undefined;
  synth: any;
  blankItems: any[];
  blankIndex: number;
  selectBlank: (index: number) => void;
  max: number;
  shop?: 'BUY' | 'SELL';
  shopAction?: (index: number) => void;
  extra?: React.ReactNode;
  coins?: number;
  spaceAvailable?: boolean;
  activeAction?: number;
  selectAction?: (index: number) => void;
  sortInventory?: (items: any[]) => void;
  classicPalette?: Palette;
};

const layoutKey = 'learning-rogue:dungeons-inventory-layout';

function readClassicPreference() {
  try { return localStorage.getItem(layoutKey) === 'classic'; }
  catch { return false; }
}

export function DungeonInventoryMenu(p: Props) {
  const { inventory, equipment, selectedIndex, selectedSlot, listRef, name, description, known, text: t, synth, shop } = p;
  const [preferClassic, setPreferClassic] = useState(readClassicPreference);
  const classic = Boolean(p.classicPalette && preferClassic);
  const focus = useRef(document.activeElement as HTMLElement | null);
  useEffect(() => () => {
    // The container dialog can take focus on the same render that closes this menu.
    if (document.activeElement === document.body) focus.current?.focus();
  }, []);
  const switchLayout = () => {
    const showClassic = !classic;
    setPreferClassic(showClassic);
    try { localStorage.setItem(layoutKey, showClassic ? 'classic' : 'standard'); } catch { /* Keep the current view usable. */ }
  };

  const blank = synth.mode === 'BLANK' && synth.step === 'SELECT_EFFECT';
  const rows = blank ? p.blankItems : inventory;
  const heading = shop ? (shop === 'BUY' ? '買う' : '売る')
    : synth.active ? (blank ? '書き込む内容を選択'
      : synth.step === 'SELECT_BASE' ? (synth.mode === 'CHANGE' ? '変化させる物' : 'ベースを選択')
      : (synth.mode === 'CHANGE' ? '変化' : '素材を選択'))
    : '持ち物';
  const empty = shop === 'BUY' ? '売り切れ' : blank ? '識別済みのノートがありません' : '持ち物なし';
  const current = selectedSlot ? equipment[selectedSlot] : rows[blank ? p.blankIndex : selectedIndex];
  const blocked = (i: number) => synth.active && (
    (synth.step === 'SELECT_BASE' && synth.mode === 'SYNTH' && !['WEAPON', 'ARMOR'].includes(inventory[i]?.category))
    || (synth.step === 'SELECT_MAT' && synth.baseIndex === i)
  );
  const inspect = (i: number) => {
    p.selectSlot(null);
    if (blank) p.selectBlank(i);
    else p.select(i);
  };
  const itemCount = (item: any) => {
    if (shop) return `${shop === 'BUY' ? item.price : Math.floor((item.price || item.value || 100) / 2)} G`;
    if (item.count) return `×${item.count}`;
    if (item.charges !== undefined) return classic ? `[${item.charges}]` : item.charges;
    return item.plus ? `+${item.plus}` : '';
  };
  const palette = p.classicPalette;
  const classicStyle = classic && palette ? {
    '--classic-bg': palette.background, '--classic-border': palette.border,
    '--classic-selection': palette.selection, '--classic-text': palette.text,
  } as React.CSSProperties : undefined;
  const menu = <section
    className={classic ? 'dungeon-pouch dungeon-pouch-classic' : 'dungeon-pouch'}
    style={classicStyle}
    role="dialog" aria-modal="true" aria-label={t(shop ? heading : '持ち物')}
    data-gamepad-modal data-gamepad-navigation-root
    onPointerDown={e => e.stopPropagation()}
    onKeyDown={e => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        p.close();
      }
      if (e.key === 'Tab') {
        const nodes = [...e.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
        const first = nodes[0], last = nodes.at(-1);
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    }}>
    <header>
      <div>{!classic && <small>DUNGEONS · POUCH</small>}<h2>{t(heading)} <span>{rows.length}/{p.max}</span></h2></div>
      <div className="dungeon-pouch-header-actions">
        {palette && <button type="button" onClick={switchLayout}>{t(classic ? '標準表示' : 'ゲームボーイ風')}</button>}
        <button type="button" autoFocus data-gamepad-back onClick={p.close} aria-label={t('閉じる')}><X size={classic ? 15 : 22}/></button>
      </div>
    </header>
    {p.extra}
    <div className="dungeon-pouch-body">
      <section className="dungeon-pouch-collection">
        {!synth.active && !shop && Object.values(equipment).some(Boolean) && <>
          <h3>{t('装備中')}</h3>
          <div className="item-menu-grid dungeon-equipped-grid">
            {Object.entries(equipment).filter(([, item]) => item).map(([slot, item]) => <InspectSlot
              key={slot} className="item-menu-slot" aria-label={name(item)} aria-pressed={selectedSlot === slot}
              onInspect={() => p.selectSlot(slot)}>
              {!classic && <SchoolSupplyIcon type={known(item) ? item.type : 'UNKNOWN'} size={38}/>}
              <span className="item-menu-label">{name(item)}</span><small className="item-menu-badge">✓</small>
            </InspectSlot>)}
          </div>
        </>}
        <div className="dungeon-sort-heading">
          {(!classic || synth.active) && <h3>{t(synth.active ? heading : '持ち物')}</h3>}
          {!synth.active && !shop && p.sortInventory && <div className="dungeon-sort-buttons" role="group" aria-label={t('並び替え')}>
            <button onClick={() => p.sortInventory?.(sortDungeonItems(inventory, 'type', name, known))}>{t('種類順')}</button>
            <button onClick={() => p.sortInventory?.(sortDungeonItems(inventory, 'name', name, known))}>{t('名前順')}</button>
          </div>}
        </div>
        <div className="item-menu-grid dungeon-inventory-grid" ref={listRef}>
          {rows.map((item, i) => <InspectSlot key={item.id || item.type}
            className={`item-menu-slot${blocked(i) ? ' dungeon-slot-unavailable' : ''}`}
            data-menu-item={i} aria-label={name(item)} aria-pressed={!selectedSlot && (blank ? p.blankIndex : selectedIndex) === i}
            onInspect={() => inspect(i)}>
            {!classic && <SchoolSupplyIcon type={known(item) ? item.type : 'UNKNOWN'} size={38}/>}
            <span className="item-menu-label">{name(item)}</span>
            <small className="item-menu-count">{itemCount(item)}</small>
          </InspectSlot>)}
          {!rows.length && <p className="dungeon-pouch-empty">{!classic && <Backpack size={30}/>} {t(empty)}</p>}
        </div>
      </section>
      <aside className="dungeon-pouch-detail" aria-live="polite">
        {current ? <>
          {!classic && <SchoolSupplyIcon type={known(current) ? current.type : 'UNKNOWN'} size={72}/>}
          <h3>{name(current)}</h3>
          <p>{description(current)}</p>
          {known(current) && <p>{current.power !== undefined && `${t(current.category === 'ARMOR' ? '防御' : '威力')}: ${current.power + (current.plus || 0)}`} {current.charges !== undefined && `[${current.charges}]`}</p>}
          {!selectedSlot && known(current) && p.switchDiff(current) && <p>{p.switchDiff(current)}</p>}
          <div className="item-menu-actions">
            {shop ? <button disabled={shop === 'SELL' ? !!(current.shopOwner || current.cursed) : (current.price || 0) > (p.coins ?? Infinity) || p.spaceAvailable === false}
              onClick={() => p.shopAction?.(selectedIndex)}>{t(shop === 'BUY' ? '買う' : '売る')}</button>
            : selectedSlot ? <button onClick={() => p.unequip(selectedSlot)}>{t('外す')}</button>
            : <>
              <button data-menu-action={p.activeAction === 0} onFocus={() => p.selectAction?.(0)}
                disabled={blocked(selectedIndex)} onClick={() => p.primary(selectedIndex)}>
                {t(synth.active ? '選択' : ['WEAPON', 'ARMOR', 'RANGED', 'ACCESSORY'].includes(current.category)
                  ? '装備' : current.category === 'STAFF' ? '振る' : '使う')}
              </button>
              {!synth.active && <>
                <button data-menu-action={p.activeAction === 1} onFocus={() => p.selectAction?.(1)} onClick={() => p.throwItem(selectedIndex)}>{t('投げる')}</button>
                <button data-menu-action={p.activeAction === 2} onFocus={() => p.selectAction?.(2)} onClick={() => p.drop(selectedIndex)}>{t('足元に置く')}</button>
              </>}
            </>}
          </div>
        </> : <p>{t(empty)}</p>}
      </aside>
    </div>
  </section>;
  return classic ? menu : createPortal(<div className="dungeon-pouch-backdrop" onPointerDown={e => e.stopPropagation()}>{menu}</div>, document.body);
}

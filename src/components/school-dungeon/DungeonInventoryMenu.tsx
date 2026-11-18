import React, { useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Backpack } from 'lucide-react';
import { audioService } from '../../services/audioService';
import { InspectSlot } from '../item-menu/InspectSlot';
import { sortDungeonItems } from './sortItems';
import { SchoolSupplyIcon } from './sprites';
import './inventory-menu.css';

type Palette = { background: string; border: string; selection: string; text: string };
export type DungeonInventoryInput = {
  move: (dx: number, dy: number) => void;
  confirm: () => void;
};

type Props = {
  inventory: any[];
  equipment: Record<string, any>;
  selectedIndex: number;
  selectedSlot: string | null;
  inputRef: React.Ref<DungeonInventoryInput>;
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
  sortInventory?: (items: any[]) => void;
  classicPalette?: Palette;
};

const layoutKey = 'learning-rogue:dungeons-inventory-layout';

function readClassicPreference() {
  try { return localStorage.getItem(layoutKey) === 'classic'; }
  catch { return false; }
}

export function DungeonInventoryMenu(p: Props) {
  const { inventory, equipment, selectedIndex, selectedSlot, name, description, known, text: t, synth, shop } = p;
  const [preferClassic, setPreferClassic] = useState(readClassicPreference);
  const classic = Boolean(p.classicPalette && preferClassic);
  const dialogRef = useRef<HTMLElement>(null);
  const collectionRef = useRef<HTMLElement>(null);
  const lastMenuFocus = useRef<HTMLButtonElement>(null);
  const restoreLayoutButton = useRef(false);
  const focus = useRef(document.activeElement as HTMLElement | null);
  useEffect(() => () => {
    // The container dialog can take focus on the same render that closes this menu.
    if (document.activeElement === document.body) focus.current?.focus();
  }, []);
  const switchLayout = () => {
    const showClassic = !classic;
    restoreLayoutButton.current = true;
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
  const selectedRow = () => collectionRef.current?.querySelector<HTMLButtonElement>('[data-menu-row][aria-pressed=true]');
  const revealRow = (row: HTMLElement) => {
    const collection = row.closest<HTMLElement>('.dungeon-pouch-collection, .dungeon-pouch-detail');
    if (!collection) return;
    const viewport = collection.getBoundingClientRect();
    const bounds = row.getBoundingClientRect();
    if (bounds.top < viewport.top) collection.scrollTop += bounds.top - viewport.top;
    else if (bounds.bottom > viewport.bottom) collection.scrollTop += bounds.bottom - viewport.bottom;
  };
  const focusButton = (button?: HTMLButtonElement | null) => {
    button?.focus({ preventScroll: true });
    if (button) revealRow(button);
  };
  const focusedMenuButton = () => {
    const active = document.activeElement;
    const inside = (button: Element | null): button is HTMLButtonElement =>
      button instanceof HTMLButtonElement && Boolean(dialogRef.current?.contains(button));
    // Tapping the external D-pad or A button may temporarily move DOM focus out of the menu.
    return inside(active) ? active : inside(lastMenuFocus.current) ? lastMenuFocus.current : null;
  };
  const buttons = (selector: string) => Array.from(dialogRef.current?.querySelectorAll<HTMLButtonElement>(selector) ?? [])
    .filter(button => !button.disabled);

  useLayoutEffect(() => {
    const revealSelected = () => {
      const row = selectedRow();
      if (row) revealRow(row);
    };
    revealSelected();
    const collection = collectionRef.current;
    if (!collection || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(revealSelected);
    observer.observe(collection);
    return () => observer.disconnect();
  }, [selectedIndex, selectedSlot, p.blankIndex, classic, shop, rows.length]);

  useLayoutEffect(() => {
    const target = restoreLayoutButton.current
      ? buttons('[data-menu-layout]')[0]
      : selectedRow() ?? buttons('[data-menu-row], [data-menu-tool]')[0];
    restoreLayoutButton.current = false;
    focusButton(target);
  }, [classic]);

  useImperativeHandle(p.inputRef, () => ({
    move(dx, dy) {
      if (!dx && !dy) return;
      audioService.playSound('select');
      const itemRows = buttons('[data-menu-row]');
      const tools = buttons('[data-menu-tool]');
      const shopTabs = buttons('.dungeon-pouch-shop-tabs button');
      const detail = buttons('.item-menu-actions button');
      const firstRow = selectedRow() ?? itemRows[0];
      const active = focusedMenuButton();
      const moveIn = (group: HTMLButtonElement[], offset: number) => {
        const current = active ? group.indexOf(active) : -1;
        focusButton(group[current + offset]);
      };

      if (active && tools.includes(active)) {
        if (dy > 0) focusButton(shopTabs.find(tab => tab.getAttribute('aria-pressed') === 'true') ?? firstRow ?? detail[0]);
        else if (dy < 0) focusButton(buttons('[data-gamepad-back]')[0]);
        else if (dx) moveIn(tools, dx);
        return;
      }
      if (active && shopTabs.includes(active)) {
        if (dy < 0) focusButton(tools[0]);
        else if (dy > 0) focusButton(firstRow ?? detail[0]);
        else if (dx) moveIn(shopTabs, dx);
        return;
      }
      if (active?.hasAttribute('data-gamepad-back') && dialogRef.current?.contains(active)) {
        if (dy > 0) focusButton(tools[0] ?? shopTabs[0] ?? firstRow);
        return;
      }
      if (active && detail.includes(active) && !dy) {
        if (dx) {
          const next = (detail.indexOf(active) + dx + detail.length) % detail.length;
          focusButton(detail[next]);
        }
        return;
      }

      const row = active && itemRows.includes(active) ? active : firstRow;
      const index = row ? itemRows.indexOf(row) : -1;
      if (dy < 0 && index <= 0) {
        focusButton(shopTabs.find(tab => tab.getAttribute('aria-pressed') === 'true') ?? tools[0]);
      } else if (dy) {
        focusButton(itemRows[index + dy] ?? row);
      } else if (dx) {
        focusButton(dx > 0 ? detail[0] : detail.at(-1));
      }
    },
    confirm() {
      const active = focusedMenuButton();
      if (active && !active.hasAttribute('data-menu-row')) {
        active.click();
      } else {
        // Confirm on a row uses the primary action for its current selection.
        dialogRef.current?.querySelector<HTMLButtonElement>('.item-menu-actions button')?.click();
      }
    },
  }));
  const menu = <section ref={dialogRef}
    className={classic ? 'dungeon-pouch dungeon-pouch-classic' : 'dungeon-pouch'}
    style={classicStyle}
    role="dialog" aria-modal="true" aria-label={t(shop ? heading : '持ち物')}
    data-gamepad-modal data-gamepad-navigation-root data-gamepad-keyboard-navigation
    onPointerDown={e => e.stopPropagation()}
    onFocusCapture={event => {
      if (event.target instanceof HTMLButtonElement) lastMenuFocus.current = event.target;
    }}
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
      {(palette || (!synth.active && p.sortInventory)) && <div className="dungeon-pouch-tools">
        {palette && <button type="button" data-menu-tool data-menu-layout onClick={switchLayout}>{t(classic ? '標準表示' : 'レトロ')}</button>}
        {!synth.active && p.sortInventory && <>
          <button type="button" data-menu-tool onClick={() => p.sortInventory?.(sortDungeonItems(inventory, 'type', name, known))}>{t('種類順')}</button>
          <button type="button" data-menu-tool onClick={() => p.sortInventory?.(sortDungeonItems(inventory, 'name', name, known))}>{t('名前順')}</button>
        </>}
      </div>}
      <button type="button" data-gamepad-back onClick={p.close} aria-label={t('閉じる')}><X size={classic ? 15 : 22}/></button>
    </header>
    {p.extra}
    <div className="dungeon-pouch-body">
      <section className="dungeon-pouch-collection" ref={collectionRef}>
        {!synth.active && !shop && Object.values(equipment).some(Boolean) && <>
          <h3>{t('装備中')}</h3>
          <div className="item-menu-grid dungeon-equipped-grid">
            {Object.entries(equipment).filter(([, item]) => item).map(([slot, item]) => <InspectSlot
              key={slot} data-menu-row className="item-menu-slot" aria-label={name(item)} aria-pressed={selectedSlot === slot}
              data-menu-equipped={slot} onFocus={() => p.selectSlot(slot)}
              onInspect={() => {
                p.selectSlot(slot);
                focusButton(buttons(`[data-menu-equipped="${slot}"]`)[0]);
              }}>
              {!classic && <SchoolSupplyIcon type={known(item) ? item.type : 'UNKNOWN'} size={38}/>}
              <span className="item-menu-label">{name(item)}</span><small className="item-menu-badge">✓</small>
            </InspectSlot>)}
          </div>
        </>}
        {(!classic || synth.active) && !shop && <h3>{t(synth.active ? heading : '持ち物')}</h3>}
        <div className="item-menu-grid dungeon-inventory-grid">
          {rows.map((item, i) => <InspectSlot key={item.id || item.type}
            className={`item-menu-slot${blocked(i) ? ' dungeon-slot-unavailable' : ''}`}
            data-menu-row data-menu-item={i} aria-label={name(item)} aria-pressed={!selectedSlot && (blank ? p.blankIndex : selectedIndex) === i}
            onFocus={() => inspect(i)} onInspect={() => {
              inspect(i);
              focusButton(buttons(`[data-menu-item="${i}"]`)[0]);
            }}>
            {!classic && <SchoolSupplyIcon type={known(item) ? item.type : 'UNKNOWN'} size={38}/>}
            <span className="item-menu-label">{name(item)}</span>
            <small className="item-menu-count">{itemCount(item)}</small>
          </InspectSlot>)}
          {!rows.length && <p className="dungeon-pouch-empty">{!classic && <Backpack size={30}/>} {t(empty)}</p>}
        </div>
      </section>
      <aside className="dungeon-pouch-detail" aria-live="polite">
        {current ? <>
          <div className="dungeon-pouch-info">
            {!classic && <SchoolSupplyIcon type={known(current) ? current.type : 'UNKNOWN'} size={72}/>}
            <h3>{name(current)}</h3>
            <p>{description(current)}</p>
            {known(current) && <p>{current.power !== undefined && `${t(current.category === 'ARMOR' ? '防御' : '威力')}: ${current.power + (current.plus || 0)}`} {current.charges !== undefined && `[${current.charges}]`}</p>}
            {!selectedSlot && known(current) && p.switchDiff(current) && <p>{p.switchDiff(current)}</p>}
          </div>
          <div className="item-menu-actions">
            {shop ? <button disabled={shop === 'SELL' ? !!(current.shopOwner || current.cursed) : (current.price || 0) > (p.coins ?? Infinity) || p.spaceAvailable === false}
              onClick={() => p.shopAction?.(selectedIndex)}>{t(shop === 'BUY' ? '買う' : '売る')}</button>
            : selectedSlot ? <button onClick={() => p.unequip(selectedSlot)}>{t('外す')}</button>
            : <>
              <button
                disabled={blocked(selectedIndex)} onClick={() => p.primary(selectedIndex)}>
                {t(synth.active ? '選択' : ['WEAPON', 'ARMOR', 'RANGED', 'ACCESSORY'].includes(current.category)
                  ? '装備' : current.category === 'STAFF' ? '振る' : '使う')}
              </button>
              {!synth.active && <>
                <button onClick={() => p.throwItem(selectedIndex)}>{t('投げる')}</button>
                <button onClick={() => p.drop(selectedIndex)}>{t('足元に置く')}</button>
              </>}
            </>}
          </div>
        </> : <p>{t(empty)}</p>}
      </aside>
    </div>
  </section>;
  return classic ? menu : createPortal(<div className="dungeon-pouch-backdrop" onPointerDown={e => e.stopPropagation()}>{menu}</div>, document.body);
}

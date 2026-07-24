import { useEffect, useRef } from 'react';

type GamepadButtonName =
  | 'A'
  | 'B'
  | 'X'
  | 'Y'
  | 'LB'
  | 'RB'
  | 'RT'
  | 'BACK'
  | 'START'
  | 'DPAD_UP'
  | 'DPAD_DOWN'
  | 'DPAD_LEFT'
  | 'DPAD_RIGHT';

type NavigationAction = 'up' | 'down' | 'left' | 'right' | 'confirm' | 'cancel' | 'tabPrev' | 'tabNext';
type ShortcutButtonName = 'X' | 'Y' | 'LB' | 'RB' | 'RT';

const BUTTON_TO_ACTION: Partial<Record<GamepadButtonName, NavigationAction>> = {
  A: 'confirm',
  B: 'cancel',
  LB: 'tabPrev',
  RB: 'tabNext',
  BACK: 'cancel',
  START: 'confirm',
  DPAD_UP: 'up',
  DPAD_DOWN: 'down',
  DPAD_LEFT: 'left',
  DPAD_RIGHT: 'right',
};

const SHORTCUT_BUTTONS: ShortcutButtonName[] = ['X', 'Y', 'LB', 'RB', 'RT'];

const BUTTON_INDEX: Record<GamepadButtonName, number> = {
  A: 0,
  B: 1,
  X: 2,
  Y: 3,
  LB: 4,
  RB: 5,
  RT: 7,
  BACK: 8,
  START: 9,
  DPAD_UP: 12,
  DPAD_DOWN: 13,
  DPAD_LEFT: 14,
  DPAD_RIGHT: 15,
};

const ACTION_TO_KEY: Record<NavigationAction, string> = {
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
  confirm: 'Enter',
  cancel: 'Escape',
  tabPrev: 'PageUp',
  tabNext: 'PageDown',
};

const AXIS_THRESHOLD = 0.55;
const INITIAL_REPEAT_DELAY_MS = 280;
const REPEAT_INTERVAL_MS = 110;
const RIGHT_STICK_SCROLL_THRESHOLD = 0.55;
const RIGHT_STICK_SCROLL_STEP = 56;
const OPEN_GAMEPAD_KEYBOARD_EVENT = 'learning-rogue:open-gamepad-keyboard';
const OPEN_GAMEPAD_SYSTEM_MENU_EVENT = 'learning-rogue:open-gamepad-system-menu';
const FOCUSABLE_SELECTOR = [
  'button:not(:disabled)',
  'a[href]',
  'input:not(:disabled)',
  'select:not(:disabled)',
  'textarea:not(:disabled)',
  '[tabindex]:not([tabindex="-1"])',
].join(',');
const INITIAL_CHOICE_SCOPE_SELECTOR = '[data-gamepad-initial-scope]';
const INITIAL_CHOICE_SELECTOR = '[data-gamepad-initial-choice]';
const GAMEPAD_MODAL_SELECTOR = [
  '[data-gamepad-modal]',
  '[role="dialog"][aria-modal="true"]',
  '.app-modal-overlay',
].join(',');

const BATTLE_ZONE_ORDER = [
  'battle-top',
  'battle-coop',
  'battle-enemies',
  'battle-items',
  'battle-actions',
  'battle-cards',
  'battle-race-items',
] as const;

type BattleZone = typeof BATTLE_ZONE_ORDER[number];

const KEYBOARD_GAMEPLAY_SURFACE_SELECTOR = [
  '.mini-game-dungeon-screen',
  '.mini-game-survivor-screen',
  '.dodgeball-shooting-screen',
  '.mini-game-go-home-screen',
].join(',');

const isHTMLElement = (value: EventTarget | null): value is HTMLElement =>
  value instanceof HTMLElement;

const isTextEditingElement = (element: Element | null): boolean => {
  if (!(element instanceof HTMLElement)) return false;
  if (element.isContentEditable) return true;
  const tag = element.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select';
};

const getTopmostVisibleGamepadModal = (): HTMLElement | null =>
  Array.from(document.querySelectorAll<HTMLElement>(GAMEPAD_MODAL_SELECTOR))
    .map((element, domIndex) => {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      const parsedZIndex = Number.parseInt(style.zIndex, 10);
      return {
        element,
        domIndex,
        visible: style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0,
        zIndex: Number.isFinite(parsedZIndex) ? parsedZIndex : 0,
      };
    })
    .filter(candidate => candidate.visible)
    .sort((a, b) => b.zIndex - a.zIndex || b.domIndex - a.domIndex)[0]?.element ?? null;

const getFocusableElements = (): HTMLElement[] => {
  const modal = getTopmostVisibleGamepadModal();
  return Array.from(document.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    .filter(element => {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.visibility !== 'hidden'
        && style.display !== 'none'
        && rect.width > 0
        && rect.height > 0
        && !element.closest('[aria-hidden="true"]')
        && !element.closest('[data-gamepad-ignore]')
        && (!modal || modal.contains(element));
    });
};

const isVisibleAndEnabled = (element: HTMLElement): boolean => {
  if (element instanceof HTMLButtonElement && element.disabled) return false;
  if (element.getAttribute('aria-disabled') === 'true') return false;
  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return style.visibility !== 'hidden'
    && style.display !== 'none'
    && rect.width > 0
    && rect.height > 0
    && !element.closest('[aria-hidden="true"]')
    && !element.closest('[data-gamepad-ignore]');
};

const getTopLeftInitialChoice = (scope: HTMLElement): HTMLElement | null =>
  Array.from(scope.querySelectorAll<HTMLElement>(INITIAL_CHOICE_SELECTOR))
    .filter(isVisibleAndEnabled)
    .sort((a, b) => {
      const rectA = a.getBoundingClientRect();
      const rectB = b.getBoundingClientRect();
      if (Math.abs(rectA.top - rectB.top) > 8) return rectA.top - rectB.top;
      return rectA.left - rectB.left;
    })[0] ?? null;

const getTopLeftFocusable = (scope: HTMLElement): HTMLElement | null =>
  Array.from(scope.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    .filter(isVisibleAndEnabled)
    .sort((a, b) => {
      const rectA = a.getBoundingClientRect();
      const rectB = b.getBoundingClientRect();
      if (Math.abs(rectA.top - rectB.top) > 8) return rectA.top - rectB.top;
      return rectA.left - rectB.left;
    })[0] ?? null;

const getBattleRoot = (): HTMLElement | null =>
  document.querySelector<HTMLElement>('.battle-scene-root');

const getBattleZoneElements = (zone: BattleZone): HTMLElement[] => {
  const root = getBattleRoot();
  if (!root) return [];
  return Array.from(root.querySelectorAll<HTMLElement>(`[data-gamepad-zone="${zone}"]`))
    .filter(isVisibleAndEnabled)
    .sort((a, b) => {
      const orderA = Number(a.dataset.gamepadOrder ?? 0);
      const orderB = Number(b.dataset.gamepadOrder ?? 0);
      if (orderA !== orderB) return orderA - orderB;
      const rectA = a.getBoundingClientRect();
      const rectB = b.getBoundingClientRect();
      if (Math.abs(rectA.top - rectB.top) > 8) return rectA.top - rectB.top;
      return rectA.left - rectB.left;
    });
};

const getBattleActiveZone = (): BattleZone | null => {
  const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const zone = active?.dataset.gamepadZone;
  return BATTLE_ZONE_ORDER.includes(zone as BattleZone) ? zone as BattleZone : null;
};

const focusBattleElement = (element: HTMLElement | null): boolean => {
  if (!element) return false;
  element.focus({ preventScroll: true });
  element.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  return true;
};

const focusFirstBattleZoneElement = (zone: BattleZone, preferRightEdge = false): boolean => {
  const elements = getBattleZoneElements(zone);
  if (elements.length === 0) return false;
  return focusBattleElement(preferRightEdge ? elements[elements.length - 1] : elements[0]);
};

const focusFirstAvailableBattleZone = (zones: BattleZone[], preferRightEdge = false): boolean => {
  for (const zone of zones) {
    if (focusFirstBattleZoneElement(zone, preferRightEdge)) return true;
  }
  return false;
};

const getBattleZoneIndex = (zone: BattleZone): number => BATTLE_ZONE_ORDER.indexOf(zone);

const getNextAvailableBattleZone = (zone: BattleZone, direction: 'up' | 'down'): BattleZone | null => {
  if (zone === 'battle-top' && direction === 'up') return getBattleZoneElements('battle-cards').length > 0 ? 'battle-cards' : null;
  if (zone === 'battle-cards' && direction === 'down') return getBattleZoneElements('battle-race-items').length > 0 ? 'battle-race-items' : null;
  if (zone === 'battle-race-items' && direction === 'up') return getBattleZoneElements('battle-cards').length > 0 ? 'battle-cards' : null;

  const step = direction === 'up' ? -1 : 1;
  let index = getBattleZoneIndex(zone) + step;
  while (index >= 0 && index < BATTLE_ZONE_ORDER.length) {
    const nextZone = BATTLE_ZONE_ORDER[index];
    if (getBattleZoneElements(nextZone).length > 0) return nextZone;
    index += step;
  }
  return null;
};

const moveWithinBattleZone = (zone: BattleZone, delta: number): boolean => {
  const elements = getBattleZoneElements(zone);
  if (elements.length === 0) return false;
  const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const activeIndex = active ? elements.indexOf(active) : -1;
  const nextIndex = activeIndex < 0
    ? (delta > 0 ? 0 : elements.length - 1)
    : Math.max(0, Math.min(elements.length - 1, activeIndex + delta));
  return focusBattleElement(elements[nextIndex]);
};

const clickBattleElement = (element: HTMLElement | null): boolean => {
  if (!element) return false;
  focusBattleElement(element);
  element.click();
  return true;
};

const triggerBattleShortcut = (buttonName: ShortcutButtonName): boolean => {
  const root = getBattleRoot();
  if (!root) return false;

  if (buttonName === 'X') {
    const controllerItems = root.querySelector<HTMLElement>('[data-gamepad-controller-items]');
    if (controllerItems && isVisibleAndEnabled(controllerItems)) return clickBattleElement(controllerItems);
    const activeZone = getBattleActiveZone();
    const hasCoop = getBattleZoneElements('battle-coop').length > 0;
    const hasItems = getBattleZoneElements('battle-items').length > 0;
    if (activeZone === 'battle-items' && hasCoop) return focusFirstBattleZoneElement('battle-coop');
    if (activeZone === 'battle-coop' && hasItems) return focusFirstBattleZoneElement('battle-items');
    return focusFirstAvailableBattleZone(hasCoop ? ['battle-coop', 'battle-items'] : ['battle-items']);
  }

  if (buttonName === 'RT') {
    const enemies = getBattleZoneElements('battle-enemies');
    if (enemies.length === 0) return false;
    const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const activeIndex = active ? enemies.indexOf(active) : -1;
    const next = enemies[(activeIndex + 1 + enemies.length) % enemies.length];
    return clickBattleElement(next);
  }

  const targets = Array.from(root.querySelectorAll<HTMLElement>(`[data-gamepad-shortcut~="${buttonName}"]`))
    .filter(isVisibleAndEnabled);
  return clickBattleElement(targets[0] ?? null);
};

const handleBattleAction = (action: NavigationAction): boolean => {
  if (!getBattleRoot()) return false;
  if (isTextEditingElement(document.activeElement)) return false;

  const activeZone = getBattleActiveZone();
  if (!activeZone) {
    if (action === 'confirm') return clickBattleElement(getBattleZoneElements('battle-cards')[0] ?? null);
    if (action === 'up') return focusFirstAvailableBattleZone(['battle-actions', 'battle-items', 'battle-enemies', 'battle-top']);
    return focusFirstAvailableBattleZone(['battle-cards', 'battle-actions', 'battle-items', 'battle-enemies', 'battle-top']);
  }

  if (action === 'confirm') {
    const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    return clickBattleElement(active);
  }

  if (action === 'left' || action === 'right') {
    if (activeZone === 'battle-items' && action === 'right') {
      const items = getBattleZoneElements('battle-items');
      const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      if (active && items.indexOf(active) === items.length - 1 && getBattleZoneElements('battle-enemies').length > 0) {
        return focusFirstBattleZoneElement('battle-enemies');
      }
    }
    if (activeZone === 'battle-enemies' && action === 'left' && getBattleZoneElements('battle-items').length > 0) {
      return focusFirstBattleZoneElement('battle-items', true);
    }
    return moveWithinBattleZone(activeZone, action === 'right' ? 1 : -1);
  }

  if (action === 'up' || action === 'down') {
    const nextZone = getNextAvailableBattleZone(activeZone, action);
    return nextZone ? focusFirstBattleZoneElement(nextZone) : true;
  }

  if (action === 'tabPrev') return triggerBattleShortcut('LB');
  if (action === 'tabNext') return triggerBattleShortcut('RB');
  return false;
};

const getInitialFocusableElement = (): HTMLElement | null => {
  const focusables = getFocusableElements();
  if (focusables.length === 0) return null;
  const explicitChoices = focusables
    .filter(element => element.hasAttribute('data-gamepad-initial-choice'))
    .sort((a, b) => {
      const rectA = a.getBoundingClientRect();
      const rectB = b.getBoundingClientRect();
      if (Math.abs(rectA.top - rectB.top) > 8) return rectA.top - rectB.top;
      return rectA.left - rectB.left;
    });
  if (explicitChoices[0]) return explicitChoices[0];
  const viewportCx = window.innerWidth / 2;
  const viewportCy = window.innerHeight / 2;
  return focusables.reduce<{ element: HTMLElement; score: number } | null>((best, element) => {
    const rect = element.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const distance = Math.hypot(cx - viewportCx, cy - viewportCy);
    const areaBonus = Math.min(rect.width * rect.height / 800, 220);
    const score = distance - areaBonus;
    return !best || score < best.score ? { element, score } : best;
  }, null)?.element ?? null;
};

const getNearestFocusableByDirection = (direction: 'up' | 'down' | 'left' | 'right'): HTMLElement | null => {
  const focusables = getFocusableElements();
  if (focusables.length === 0) return null;

  const active = document.activeElement instanceof HTMLElement && focusables.includes(document.activeElement)
    ? document.activeElement
    : null;

  if (!active) return getInitialFocusableElement();

  const activeRect = active.getBoundingClientRect();
  const activeCx = activeRect.left + activeRect.width / 2;
  const activeCy = activeRect.top + activeRect.height / 2;

  let best: { element: HTMLElement; score: number } | null = null;

  for (const element of focusables) {
    if (element === active) continue;
    const rect = element.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = cx - activeCx;
    const dy = cy - activeCy;

    if (direction === 'up' && dy >= -4) continue;
    if (direction === 'down' && dy <= 4) continue;
    if (direction === 'left' || direction === 'right') {
      if (direction === 'left' && dx >= -4) continue;
      if (direction === 'right' && dx <= 4) continue;

      // Horizontal movement must stay in the same visual row. This prevents a
      // card-row edge from jumping diagonally into help/settings controls.
      const overlapTop = Math.max(activeRect.top, rect.top);
      const overlapBottom = Math.min(activeRect.bottom, rect.bottom);
      const verticalOverlap = Math.max(0, overlapBottom - overlapTop);
      const minimumOverlap = Math.min(activeRect.height, rect.height) * 0.25;
      const centerTolerance = Math.max(activeRect.height, rect.height) * 0.6;
      if (verticalOverlap < minimumOverlap && Math.abs(dy) > centerTolerance) continue;
    }

    const primary = direction === 'up' || direction === 'down' ? Math.abs(dy) : Math.abs(dx);
    const secondary = direction === 'up' || direction === 'down' ? Math.abs(dx) : Math.abs(dy);
    const score = primary * 2 + secondary;

    if (!best || score < best.score) best = { element, score };
  }

  return best?.element ?? null;
};

const focusRelative = (delta: number) => {
  const focusables = getFocusableElements();
  if (focusables.length === 0) return;
  const activeIndex = document.activeElement instanceof HTMLElement
    ? focusables.indexOf(document.activeElement)
    : -1;
  const nextIndex = activeIndex < 0
    ? 0
    : (activeIndex + delta + focusables.length) % focusables.length;
  focusables[nextIndex]?.focus({ preventScroll: true });
};

const activateFocusedElement = () => {
  const active = document.activeElement;
  if (!isHTMLElement(active) || active === document.body || active === document.documentElement) {
    const first = getInitialFocusableElement();
    first?.focus({ preventScroll: true });
    if (first?.matches('button:not(:disabled), a[href], [role="button"]')) first.click();
    return;
  }
  if (
    (active instanceof HTMLInputElement && !['button', 'checkbox', 'radio', 'range', 'submit', 'reset'].includes(active.type))
    || active instanceof HTMLTextAreaElement
  ) {
    window.dispatchEvent(new CustomEvent(OPEN_GAMEPAD_KEYBOARD_EVENT, {
      detail: { target: active },
    }));
    return;
  }
  if (active.matches('button:not(:disabled), a[href], [role="button"], [tabindex]')) {
    active.click();
  }
};

const dispatchFormValueEvents = (element: HTMLInputElement | HTMLSelectElement) => {
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
};

const adjustFocusedFormControl = (action: NavigationAction): boolean => {
  const active = document.activeElement;
  if (active instanceof HTMLInputElement && active.type === 'range') {
    if (!['left', 'right', 'up', 'down'].includes(action)) return false;
    const parsedMin = Number(active.min);
    const parsedMax = Number(active.max);
    const min = Number.isFinite(parsedMin) ? parsedMin : 0;
    const max = Number.isFinite(parsedMax) ? parsedMax : 100;
    const step = active.step === 'any' ? 1 : Number(active.step || 1);
    const direction = action === 'right' || action === 'up' ? 1 : -1;
    active.valueAsNumber = Math.max(min, Math.min(max, active.valueAsNumber + step * direction));
    dispatchFormValueEvents(active);
    return true;
  }

  if (active instanceof HTMLSelectElement) {
    if (!['left', 'right', 'up', 'down'].includes(action)) return false;
    const direction = action === 'right' || action === 'down' ? 1 : -1;
    let nextIndex = active.selectedIndex;
    do {
      nextIndex += direction;
    } while (active.options[nextIndex]?.disabled);
    if (nextIndex < 0 || nextIndex >= active.options.length) return true;
    active.selectedIndex = nextIndex;
    dispatchFormValueEvents(active);
    return true;
  }

  return false;
};

const getScrollableAncestor = (element: Element | null): HTMLElement | null => {
  let current = element instanceof HTMLElement ? element : null;
  while (current && current !== document.body) {
    const style = window.getComputedStyle(current);
    if (
      /(auto|scroll)/.test(`${style.overflowY}${style.overflow}`)
      && current.scrollHeight > current.clientHeight + 2
    ) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
};

const getLargestVisibleScrollable = (scope: ParentNode = document): HTMLElement | null =>
  Array.from(scope.querySelectorAll<HTMLElement>('*'))
    .filter(element => {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return /(auto|scroll)/.test(`${style.overflowY}${style.overflow}`)
        && element.scrollHeight > element.clientHeight + 2
        && rect.width > 0
        && rect.height > 0
        && style.display !== 'none'
        && style.visibility !== 'hidden';
    })
    .sort((a, b) => {
      const rectA = a.getBoundingClientRect();
      const rectB = b.getBoundingClientRect();
      return rectB.width * rectB.height - rectA.width * rectA.height;
    })[0] ?? null;

const scrollWithRightStick = (amount: number) => {
  const modal = getTopmostVisibleGamepadModal();
  const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const centerElement = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
  const container = getScrollableAncestor(active)
    ?? getScrollableAncestor(modal)
    ?? getScrollableAncestor(centerElement)
    ?? getLargestVisibleScrollable(modal ?? document);
  if (container) {
    container.scrollTop += amount;
    return;
  }
  window.scrollBy({ top: amount, behavior: 'auto' });
};

const triggerShortcutButton = (buttonName: ShortcutButtonName): boolean => {
  const modal = getTopmostVisibleGamepadModal();
  if (!modal && triggerBattleShortcut(buttonName)) return true;
  const shortcutRoot: ParentNode = modal ?? document;
  const targets = Array.from(shortcutRoot.querySelectorAll<HTMLElement>(`[data-gamepad-shortcut~="${buttonName}"]`))
    .filter(isVisibleAndEnabled);
  const target = targets[0];
  // Do not leak a modal shortcut to controls behind the modal.
  if (!target) return Boolean(modal);
  target.focus({ preventScroll: true });
  target.click();
  return true;
};

const clickBackLikeControl = () => {
  const modal = getTopmostVisibleGamepadModal();
  const candidates = getFocusableElements().filter(element => !modal || modal.contains(element));
  const explicitTarget = candidates.find(element => element.hasAttribute('data-gamepad-back'));
  if (explicitTarget) {
    explicitTarget.click();
    return;
  }
  const labels = [
    '戻る',
    '閉じる',
    'キャンセル',
    'あとで',
    'あとで決める',
    '終了',
    'メニューへ',
    'Close',
    'Cancel',
    'Later',
    'Decide Later',
    'EXIT',
    'Exit',
    'Quit',
    'Back',
  ];
  const target = candidates.find(element => {
    const text = `${element.textContent ?? ''} ${element.getAttribute('aria-label') ?? ''} ${element.getAttribute('title') ?? ''}`;
    return labels.some(label => text.includes(label));
  });
  if (target) {
    target.click();
    return;
  }
  // Many existing overlays close when their backdrop is clicked.
  modal?.click();
};

const handleZonedNavigation = (action: NavigationAction): boolean => {
  if (action !== 'up' && action !== 'down' && action !== 'left' && action !== 'right' && action !== 'confirm') return false;
  const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const root = active?.closest<HTMLElement>('[data-gamepad-navigation-root]');
  const activeZone = active?.dataset.gamepadZone;
  if (!root || !activeZone || !active) return false;

  if (action === 'confirm') {
    active.click();
    return true;
  }

  const zoneElements = Array.from(root.querySelectorAll<HTMLElement>(`[data-gamepad-zone="${activeZone}"]`))
    .filter(isVisibleAndEnabled)
    .sort((a, b) => {
      const orderA = Number(a.dataset.gamepadOrder ?? 0);
      const orderB = Number(b.dataset.gamepadOrder ?? 0);
      if (orderA !== orderB) return orderA - orderB;
      return a.getBoundingClientRect().left - b.getBoundingClientRect().left;
    });

  if (action === 'left' || action === 'right') {
    const currentIndex = zoneElements.indexOf(active);
    if (currentIndex < 0) return true;
    const nextIndex = Math.max(0, Math.min(zoneElements.length - 1, currentIndex + (action === 'right' ? 1 : -1)));
    const next = zoneElements[nextIndex];
    if (next && next !== active) {
      next.focus({ preventScroll: true });
      next.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
    // Horizontal input is always consumed at the edge of a zone.
    return true;
  }

  const activeRect = active.getBoundingClientRect();
  const activeCx = activeRect.left + activeRect.width / 2;
  const activeCy = activeRect.top + activeRect.height / 2;
  const candidates = Array.from(root.querySelectorAll<HTMLElement>('[data-gamepad-zone]'))
    .filter(element => element.dataset.gamepadZone !== activeZone && isVisibleAndEnabled(element));

  let best: { element: HTMLElement; score: number } | null = null;
  for (const element of candidates) {
    const rect = element.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = Math.abs(cx - activeCx);
    const dy = cy - activeCy;
    if (action === 'up' && dy >= -4) continue;
    if (action === 'down' && dy <= 4) continue;
    const score = Math.abs(dy) * 2 + dx;
    if (!best || score < best.score) best = { element, score };
  }
  if (best) {
    best.element.focus({ preventScroll: true });
    best.element.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
  return true;
};

const dispatchKeyboardEvent = (key: string): boolean => {
  const target = isHTMLElement(document.activeElement) ? document.activeElement : document.body;
  const event = new KeyboardEvent('keydown', {
    key,
    code: key.startsWith('Arrow') ? key : key === 'Escape' ? 'Escape' : key === 'Enter' ? 'Enter' : key,
    bubbles: true,
    cancelable: true,
  });
  target.dispatchEvent(event);
  // Real-time mini games track keydown/keyup state. Release synthetic inputs
  // after a short pulse so a direction never remains stuck after the stick is released.
  window.setTimeout(() => {
    target.dispatchEvent(new KeyboardEvent('keyup', {
      key,
      code: key.startsWith('Arrow') ? key : key === 'Escape' ? 'Escape' : key === 'Enter' ? 'Enter' : key === ' ' ? 'Space' : key,
      bubbles: true,
      cancelable: true,
    }));
  }, 70);
  return event.defaultPrevented;
};

const getKeyboardActionKey = (action: NavigationAction): string => {
  if (action === 'confirm' && document.querySelector('.mini-game-go-home-screen')) return ' ';
  return ACTION_TO_KEY[action];
};

const handleActionFallback = (action: NavigationAction) => {
  const modal = getTopmostVisibleGamepadModal();
  if (!modal && handleBattleAction(action)) return;
  if (!modal && handleZonedNavigation(action)) return;
  if (adjustFocusedFormControl(action)) return;

  const keyboardGameplaySurface = document.querySelector(KEYBOARD_GAMEPLAY_SURFACE_SELECTOR);
  if (keyboardGameplaySurface && action !== 'cancel' && !isTextEditingElement(document.activeElement)) {
    return;
  }

  // Keep horizontal input available for caret/select changes, but let vertical
  // controller navigation leave form fields and return to the surrounding UI.
  if (isTextEditingElement(document.activeElement) && (action === 'left' || action === 'right')) return;

  if (action === 'up' || action === 'down' || action === 'left' || action === 'right') {
    const next = getNearestFocusableByDirection(action);
    next?.focus({ preventScroll: true });
    return;
  }

  if (action === 'tabPrev') {
    focusRelative(-1);
    return;
  }

  if (action === 'tabNext') {
    focusRelative(1);
    return;
  }

  if (action === 'confirm') {
    activateFocusedElement();
    return;
  }

  if (action === 'cancel') {
    clickBackLikeControl();
  }
};

const getAxisAction = (gamepad: Gamepad): NavigationAction | null => {
  const x = gamepad.axes[0] ?? 0;
  const y = gamepad.axes[1] ?? 0;
  if (Math.abs(x) < AXIS_THRESHOLD && Math.abs(y) < AXIS_THRESHOLD) return null;
  if (Math.abs(x) > Math.abs(y)) return x > 0 ? 'right' : 'left';
  return y > 0 ? 'down' : 'up';
};

const getDungeonDirectionKey = (gamepad: Gamepad): string | null => {
  const axisX = gamepad.axes[0] ?? 0;
  const axisY = gamepad.axes[1] ?? 0;
  let dx = Math.abs(axisX) >= AXIS_THRESHOLD ? (axisX > 0 ? 1 : -1) : 0;
  let dy = Math.abs(axisY) >= AXIS_THRESHOLD ? (axisY > 0 ? 1 : -1) : 0;

  if (gamepad.buttons[BUTTON_INDEX.DPAD_LEFT]?.pressed) dx = -1;
  if (gamepad.buttons[BUTTON_INDEX.DPAD_RIGHT]?.pressed) dx = 1;
  if (gamepad.buttons[BUTTON_INDEX.DPAD_UP]?.pressed) dy = -1;
  if (gamepad.buttons[BUTTON_INDEX.DPAD_DOWN]?.pressed) dy = 1;

  if (dx === -1 && dy === -1) return 'Home';
  if (dx === 1 && dy === -1) return 'PageUp';
  if (dx === -1 && dy === 1) return 'End';
  if (dx === 1 && dy === 1) return 'PageDown';
  if (dx === -1) return 'ArrowLeft';
  if (dx === 1) return 'ArrowRight';
  if (dy === -1) return 'ArrowUp';
  if (dy === 1) return 'ArrowDown';
  return null;
};

export const useXboxControllerNavigation = () => {
  const pressedRef = useRef<Record<string, boolean>>({});
  const heldActionRef = useRef<{ action: NavigationAction | null; firstAt: number; lastAt: number }>({
    action: null,
    firstAt: 0,
    lastAt: 0,
  });
  const rightStickScrollRef = useRef<{ direction: -1 | 0 | 1; lastAt: number }>({
    direction: 0,
    lastAt: 0,
  });
  const dungeonDirectionRef = useRef<{ key: string | null; firstAt: number; lastAt: number }>({
    key: null,
    firstAt: 0,
    lastAt: 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !('getGamepads' in navigator)) return;

    let frameId = 0;
    let initialChoiceFrameId = 0;
    const initializedChoiceScopes = new WeakMap<HTMLElement, string>();

    const focusPendingInitialChoice = () => {
      initialChoiceFrameId = 0;
      if (!document.body.classList.contains('gamepad-connected')) return;

      const modal = getTopmostVisibleGamepadModal();
      if (modal) {
        const modalKey = modal.dataset.gamepadInitialScope ?? 'automatic-modal';
        if (initializedChoiceScopes.get(modal) !== modalKey) {
          const modalChoice = getTopLeftInitialChoice(modal) ?? getTopLeftFocusable(modal);
          if (modalChoice) {
            modalChoice.focus({ preventScroll: true });
            modalChoice.scrollIntoView({ block: 'nearest', inline: 'nearest' });
            initializedChoiceScopes.set(modal, modalKey);
          }
        }
        return;
      }

      const scopes = Array.from(document.querySelectorAll<HTMLElement>(INITIAL_CHOICE_SCOPE_SELECTOR))
        .filter(isVisibleAndEnabled);
      // A newly opened modal should win over its underlying screen.
      for (const scope of scopes.reverse()) {
        const scopeKey = scope.dataset.gamepadInitialScope ?? '';
        if (initializedChoiceScopes.get(scope) === scopeKey) continue;
        const choice = getTopLeftInitialChoice(scope);
        if (!choice) continue;
        choice.focus({ preventScroll: true });
        choice.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        initializedChoiceScopes.set(scope, scopeKey);
        break;
      }
    };

    const scheduleInitialChoiceFocus = () => {
      if (initialChoiceFrameId) return;
      initialChoiceFrameId = window.requestAnimationFrame(focusPendingInitialChoice);
    };

    const initialChoiceObserver = new MutationObserver(scheduleInitialChoiceFocus);
    initialChoiceObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-gamepad-initial-scope'],
      childList: true,
      subtree: true,
    });
    const markGamepadNavigation = () => document.body.classList.add('gamepad-navigation-active');
    const clearGamepadNavigation = (event?: Event) => {
      if (event instanceof KeyboardEvent && !event.isTrusted) return;
      document.body.classList.remove('gamepad-navigation-active');
    };

    const runAction = (action: NavigationAction) => {
      markGamepadNavigation();
      if (
        action === 'confirm'
        && (
          (document.activeElement instanceof HTMLInputElement
            && !['button', 'checkbox', 'radio', 'range', 'submit', 'reset'].includes(document.activeElement.type))
          || document.activeElement instanceof HTMLTextAreaElement
        )
      ) {
        activateFocusedElement();
        return;
      }
      // A focused text field or screen-level key handler may consume the
      // synthetic Escape event without closing the visible overlay. When a
      // modal is open, B must always operate the topmost modal directly.
      if (action === 'cancel' && getTopmostVisibleGamepadModal()) {
        clickBackLikeControl();
        return;
      }
      const handled = dispatchKeyboardEvent(getKeyboardActionKey(action));
      if (!handled) handleActionFallback(action);
    };

    const handleKeyboardEmulation = (event: KeyboardEvent) => {
      const debugPreviewActive = Boolean(document.querySelector('.app-shell.gamepad-shortcuts-debug'));
      if (!debugPreviewActive || !event.isTrusted) return;
      if (isTextEditingElement(event.target instanceof Element ? event.target : document.activeElement)) return;

      const key = event.key.toLowerCase();
      const actionByKey: Record<string, NavigationAction | undefined> = {
        arrowup: 'up',
        w: 'up',
        arrowdown: 'down',
        s: 'down',
        arrowleft: 'left',
        a: 'left',
        arrowright: 'right',
        d: 'right',
        enter: 'confirm',
        ' ': 'confirm',
        z: 'confirm',
        escape: 'cancel',
        backspace: 'cancel',
        q: 'tabPrev',
        e: 'tabNext',
      };
      const shortcutByKey: Record<string, ShortcutButtonName | undefined> = {
        q: 'LB',
        e: 'RB',
        r: 'RT',
        x: 'X',
        y: 'Y',
      };
      const shortcut = shortcutByKey[key];
      if (shortcut) {
        event.preventDefault();
        markGamepadNavigation();
        triggerShortcutButton(shortcut);
        return;
      }
      const action = actionByKey[key];
      if (!action) return;
      event.preventDefault();
      runAction(action);
    };

    const tick = () => {
      const gamepads = navigator.getGamepads();
      const gamepad = Array.from(gamepads).find(Boolean);
      const wasConnected = document.body.classList.contains('gamepad-connected');
      document.body.classList.toggle('gamepad-connected', Boolean(gamepad));
      if (gamepad && !wasConnected) scheduleInitialChoiceFocus();

      if (gamepad) {
        const dungeonGameplayActive = Boolean(document.querySelector('.mini-game-dungeon-screen'));
        for (const [name, index] of Object.entries(BUTTON_INDEX) as [GamepadButtonName, number][]) {
          const action = BUTTON_TO_ACTION[name];
          const pressed = Boolean(gamepad.buttons[index]?.pressed);
          const key = `button:${index}`;
          if (pressed && !pressedRef.current[key]) {
            if (name === 'BACK') {
              markGamepadNavigation();
              window.dispatchEvent(new CustomEvent(OPEN_GAMEPAD_SYSTEM_MENU_EVENT));
            } else if (dungeonGameplayActive && name.startsWith('DPAD_')) {
              // Dungeon movement is processed once below so simultaneous
              // horizontal/vertical input becomes one diagonal turn.
            } else if (SHORTCUT_BUTTONS.includes(name as ShortcutButtonName)) {
              markGamepadNavigation();
              if (!triggerShortcutButton(name as ShortcutButtonName) && action) runAction(action);
            } else if (action) {
              runAction(action);
            }
          }
          pressedRef.current[key] = pressed;
        }

        const now = performance.now();
        if (dungeonGameplayActive) {
          const directionKey = getDungeonDirectionKey(gamepad);
          const heldDungeon = dungeonDirectionRef.current;
          if (!directionKey) {
            dungeonDirectionRef.current = { key: null, firstAt: 0, lastAt: 0 };
          } else if (heldDungeon.key !== directionKey) {
            dungeonDirectionRef.current = { key: directionKey, firstAt: now, lastAt: now };
            markGamepadNavigation();
            dispatchKeyboardEvent(directionKey);
          } else if (
            now - heldDungeon.firstAt >= INITIAL_REPEAT_DELAY_MS
            && now - heldDungeon.lastAt >= REPEAT_INTERVAL_MS
          ) {
            dungeonDirectionRef.current = { ...heldDungeon, lastAt: now };
            dispatchKeyboardEvent(directionKey);
          }
          heldActionRef.current = { action: null, firstAt: 0, lastAt: 0 };
        } else {
          const axisAction = getAxisAction(gamepad);
          const held = heldActionRef.current;
          if (!axisAction) {
            heldActionRef.current = { action: null, firstAt: 0, lastAt: 0 };
          } else if (held.action !== axisAction) {
            heldActionRef.current = { action: axisAction, firstAt: now, lastAt: now };
            runAction(axisAction);
          } else if (
            now - held.firstAt >= INITIAL_REPEAT_DELAY_MS
            && now - held.lastAt >= REPEAT_INTERVAL_MS
          ) {
            heldActionRef.current = { ...held, lastAt: now };
            runAction(axisAction);
          }
        }

        const rightStickY = gamepad.axes[3] ?? 0;
        const scrollDirection: -1 | 0 | 1 = Math.abs(rightStickY) >= RIGHT_STICK_SCROLL_THRESHOLD
          ? rightStickY > 0 ? 1 : -1
          : 0;
        const scrollState = rightStickScrollRef.current;
        if (scrollDirection === 0) {
          rightStickScrollRef.current = { direction: 0, lastAt: 0 };
        } else if (
          scrollState.direction !== scrollDirection
          || now - scrollState.lastAt >= REPEAT_INTERVAL_MS
        ) {
          markGamepadNavigation();
          scrollWithRightStick(scrollDirection * RIGHT_STICK_SCROLL_STEP);
          rightStickScrollRef.current = { direction: scrollDirection, lastAt: now };
        }
      }

      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    window.addEventListener('pointerdown', clearGamepadNavigation);
    window.addEventListener('keydown', clearGamepadNavigation);
    window.addEventListener('keydown', handleKeyboardEmulation);
    return () => {
      window.cancelAnimationFrame(frameId);
      if (initialChoiceFrameId) window.cancelAnimationFrame(initialChoiceFrameId);
      initialChoiceObserver.disconnect();
      window.removeEventListener('pointerdown', clearGamepadNavigation);
      window.removeEventListener('keydown', clearGamepadNavigation);
      window.removeEventListener('keydown', handleKeyboardEmulation);
      document.body.classList.remove('gamepad-connected');
      clearGamepadNavigation();
    };
  }, []);
};

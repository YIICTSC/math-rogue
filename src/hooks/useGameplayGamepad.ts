import { useEffect, useRef } from 'react';

export type GameplayMode = 'rpg' | 'rpg-home' | 'vr' | 'vr-online' | 'vr-bomb' | 'race' | 'golf';
export const PAD = { A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, LT: 6, RT: 7, VIEW: 8, MENU: 9, LS: 10, RS: 11 } as const;
export type GameplayPad = { active: boolean; x: number; y: number; lookX: number; lookY: number; buttons: boolean[]; pressed: boolean[]; dt: number };
const visible = (el: Element) => !!el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden';

/** Gameplay owns the sticks only while no dialog or text editor covers it. */
export function liveGamepadSurface(): HTMLElement | null {
  if (document.hidden || !document.hasFocus()) return null;
  const surface = Array.from(document.querySelectorAll<HTMLElement>('[data-gamepad-live]')).find(visible) ?? null;
  if (Array.from(document.querySelectorAll('[data-gamepad-modal], [data-gamepad-question-screen], [role="dialog"], .app-modal-overlay')).some(el=>visible(el)&&!(surface?.dataset.gamepadLive==='rpg-home'&&el.contains(surface)))) return null;
  if (document.activeElement?.matches('input:not([type="range"]), textarea, select, [contenteditable="true"]')) return null;
  return surface;
}

export const neutralPad = (): GameplayPad => ({ active: false, x: 0, y: 0, lookX: 0, lookY: 0, buttons: Array(17).fill(false), pressed: Array(17).fill(false), dt: 0 });

export function readGameplayPad(pad: Gamepad, before: boolean[], dt: number): GameplayPad {
  const buttons = Array.from({ length: 17 }, (_, i) => !!pad.buttons[i]?.pressed);
  const axis = (index: number) => { const value = pad.axes[index] ?? 0; return Math.abs(value) <= .18 ? 0 : Math.sign(value) * Math.min(1, (Math.abs(value) - .18) / .82); };
  const x = axis(0) || Number(buttons[15]) - Number(buttons[14]);
  const y = axis(1) || Number(buttons[13]) - Number(buttons[12]);
  const length = Math.max(1, Math.hypot(x, y));
  return { active: true, x: x / length, y: y / length, lookX: axis(2), lookY: axis(3), buttons, pressed: buttons.map((value, i) => value && !before[i]), dt: Math.max(0, Math.min(.05, dt)) };
}

export function useGameplayGamepad(mode: GameplayMode, onFrame: (pad: GameplayPad) => void) {
  const latest = useRef(onFrame); latest.current = onFrame;
  useEffect(() => {
    let frame = 0, last = performance.now(), active = false, before: boolean[] = [];
    const release = () => { if (active) latest.current(neutralPad()); active = false; };
    const tick = (now: number) => {
      const pad = Array.from(navigator.getGamepads?.() ?? []).find(p => p?.connected && p.mapping === 'standard');
      const surface = liveGamepadSurface();
      if (pad && surface?.dataset.gamepadLive === mode) {
        latest.current(readGameplayPad(pad, before, (now - last) / 1000)); active = true;
      } else release();
      // Update even behind menus: a held confirm must not retrigger on resume.
      before = pad ? Array.from({length:17}, (_, i) => !!pad.buttons[i]?.pressed) : [];
      last = now; frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    window.addEventListener('blur', release); document.addEventListener('visibilitychange', release);
    return () => { cancelAnimationFrame(frame); release(); window.removeEventListener('blur', release); document.removeEventListener('visibilitychange', release); };
  }, [mode]);
}

export const openControllerMenu = () => window.dispatchEvent(new CustomEvent('learning-rogue:open-gamepad-system-menu'));

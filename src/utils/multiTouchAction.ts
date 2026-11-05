import type { KeyboardEvent as ReactKeyboardEvent, MouseEvent, PointerEvent } from "react";

const lastTouch = new WeakMap<HTMLElement, number>();
const keyboardClickArmed = new WeakSet<HTMLButtonElement>();
const heldPointers = new WeakMap<HTMLElement, Set<number>>();
const activeHolds = new Map<HTMLButtonElement, (held: boolean) => void>();
const resetHolds = () => {
  for (const [button, change] of activeHolds) {
    const pointers = heldPointers.get(button);
    for (const id of pointers ?? []) {
      try {
        if (button.hasPointerCapture(id)) button.releasePointerCapture(id);
      } catch {
        /* The browser may already have cancelled a backgrounded touch. */
      }
    }
    pointers?.clear();
    change(false);
  }
  activeHolds.clear();
};
if (typeof window !== "undefined") {
  window.addEventListener("blur", resetHolds);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) resetHolds();
  });
}

/** Action buttons must not wait for a synthetic click: browsers often omit it
 * while another finger owns the movement stick. Keyboard clicks remain usable. */
export function multiTouchAction(action: () => void) {
  return {
    onPointerDown(event: PointerEvent<HTMLButtonElement>) {
      if (
        event.pointerType === "mouse" ||
        event.button !== 0 ||
        event.currentTarget.disabled
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      lastTouch.set(event.currentTarget, performance.now());
      keyboardClickArmed.delete(event.currentTarget);
      action();
    },
    onPointerUp(event: PointerEvent<HTMLButtonElement>) {
      if (event.pointerType !== 'mouse') lastTouch.set(event.currentTarget, performance.now());
    },
    onKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const button = event.currentTarget;
      keyboardClickArmed.add(button);
      window.setTimeout(() => keyboardClickArmed.delete(button), 500);
    },
    onClick(event: MouseEvent<HTMLButtonElement>) {
      event.stopPropagation();
      if (event.currentTarget.disabled) return;
      const now = performance.now();
      const recentlyTouched = now - (lastTouch.get(event.currentTarget) ?? -Infinity) <= 800;
      const physicalMouse =
        "pointerType" in event.nativeEvent &&
        event.nativeEvent.pointerType === "mouse";
      const keyboardActivation = event.detail === 0 && keyboardClickArmed.has(event.currentTarget);
      keyboardClickArmed.delete(event.currentTarget);
      if (physicalMouse || keyboardActivation || !recentlyTouched) action();
    },
    style: { touchAction: "none" as const },
  };
}

/** Releasing an unrelated finger must not release a held action. */
export function multiTouchHold(change: (held: boolean) => void) {
  const release = (event: PointerEvent<HTMLButtonElement>) => {
    const pointers = heldPointers.get(event.currentTarget);
    if (!pointers?.delete(event.pointerId)) return;
    if (!pointers.size) {
      activeHolds.delete(event.currentTarget);
      change(false);
    }
  };
  return {
    style: { touchAction: "none" as const },
    onPointerDown(event: PointerEvent<HTMLButtonElement>) {
      if (event.button !== 0 || event.currentTarget.disabled) return;
      event.preventDefault();
      event.stopPropagation();
      let pointers = heldPointers.get(event.currentTarget);
      if (!pointers) {
        pointers = new Set();
        heldPointers.set(event.currentTarget, pointers);
      }
      pointers.add(event.pointerId);
      activeHolds.set(event.currentTarget, change);
      event.currentTarget.setPointerCapture(event.pointerId);
      change(true);
    },
    onPointerUp: release,
    onPointerCancel: release,
    onLostPointerCapture: release,
  };
}

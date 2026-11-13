import { useEffect, useRef, useState } from 'react';
import type { LanguageMode } from '../../types';
import type { Entry } from './catalog';
import { gameText, PROP_NAMES } from './copy';
import { controlsFor, DIRECTION_SYMBOLS, repeatsDirection, stickDirection, type Direction, type RushControl } from './controls';
import type { State } from './originals/model';

export function VirtualControls({ entry, state, elapsed, mode, cursor, canUndo, enabled, onControl, onSteer }: {
  entry: Entry; state: State; elapsed: number; mode: LanguageMode; cursor: number; canUndo: boolean;
  enabled: boolean; onControl: (command: RushControl) => void;
  onSteer?: (x: number, y: number) => void;
}) {
  const profile = controlsFor(entry), scene = entry.game.mechanic.display(state, { now: elapsed, before: elapsed, dt: 0 });
  const latest = useRef({ onControl, onSteer, enabled, profile }); latest.current = { onControl, onSteer, enabled, profile };
  const held = useRef<{ pointer: number; direction?: Direction; next: number } | undefined>(undefined);
  const stick = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const local = (ja: string, en: string, hira?: string) => gameText(mode, [ja, en, hira]);
  const label = (index: number) => {
    const piece = scene.buttons[index];
    return piece?.text ? gameText(mode, piece.text) : piece?.art ? gameText(mode, PROP_NAMES[piece.art]) : local('操作', 'Act', 'そうさ');
  };
  const aIndex = profile.a ?? (profile.scheme === 'select' || profile.scheme === 'direction' ? cursor : 0);
  const aLabel = label(aIndex), bIndex = profile.scheme === 'dual' ? 1 : profile.b;
  const bAvailable = profile.scheme === 'select' ? canUndo : bIndex !== undefined && bIndex !== null;
  const bLabel = profile.scheme === 'select' ? local('ひとつ戻す', 'Undo', 'ひとつもどす') : bAvailable ? label(bIndex!) : '—';
  const stickAvailable = profile.scheme === 'select' || profile.scheme === 'direction' || profile.scheme === 'action' && entry.game.action?.axis !== 'none';
  const release = () => {
    const id = held.current?.pointer; held.current = undefined;
    if (id !== undefined) latest.current.onSteer?.(0, 0);
    if (id !== undefined && stick.current?.hasPointerCapture(id)) stick.current.releasePointerCapture(id);
    setOffset({ x: 0, y: 0 });
  };
  useEffect(() => {
    if (!enabled) release();
  }, [enabled]);
  useEffect(() => {
    let raf = 0;
    const tick = (now: number) => {
      const press = held.current, current = latest.current;
      if (current.enabled && press?.direction && now >= press.next && repeatsDirection(current.profile)) {
        current.onControl(press.direction); press.next = now + 180;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    window.addEventListener('blur', release);
    window.addEventListener('resize', release);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('blur', release); window.removeEventListener('resize', release); };
  }, []);
  function move(clientX: number, clientY: number) {
    const rect = stick.current?.getBoundingClientRect(), press = held.current;
    if (!rect || !press) return;
    const x = (clientX - rect.x - rect.width / 2) / (rect.width / 2), y = (clientY - rect.y - rect.height / 2) / (rect.height / 2);
    const magnitude = Math.max(1, Math.hypot(x, y));
    setOffset({ x: x / magnitude, y: y / magnitude });
    const direction = stickDirection(x, y);
    if (profile.scheme === 'action') {
      latest.current.onSteer?.(direction ? x / magnitude : 0, direction ? y / magnitude : 0);
      return;
    }
    if (direction !== press.direction) {
      press.direction = direction; press.next = performance.now() + 350;
      if (direction) latest.current.onControl(direction);
    }
  }
  return <div className="asr-controller" data-asr-controller data-scheme={profile.scheme}>
    <div className="asr-stick" ref={stick} data-active={enabled && stickAvailable}
      role="group" aria-label={local('バーチャルスティック', 'Virtual stick', 'バーチャルスティック')}
      onPointerDown={event => {
        if (!enabled || !stickAvailable || event.button !== 0 || held.current) return;
        event.preventDefault(); held.current = { pointer: event.pointerId, next: 0 };
        event.currentTarget.setPointerCapture(event.pointerId); move(event.clientX, event.clientY);
      }}
      onPointerMove={event => { if (held.current?.pointer === event.pointerId) move(event.clientX, event.clientY); }}
      onPointerUp={event => { if (held.current?.pointer === event.pointerId) release(); }}
      onPointerCancel={release} onLostPointerCapture={() => { held.current = undefined; setOffset({ x: 0, y: 0 }); }}>
      {(['up', 'right', 'down', 'left'] as const).map(direction => <button type="button" key={direction} data-asr-direction={direction}
        tabIndex={enabled && stickAvailable ? 0 : -1} disabled={!enabled || !stickAvailable}
        aria-label={local({ up: '上', right: '右', down: '下', left: '左' }[direction], direction, { up: 'うえ', right: 'みぎ', down: 'した', left: 'ひだり' }[direction])}
        onClick={event => { if (event.detail === 0 && enabled) { onControl(direction); if (profile.scheme === 'action') setTimeout(() => latest.current.onSteer?.(0, 0), 180); } }}>{DIRECTION_SYMBOLS[direction]}</button>)}
      <i className="asr-stick-thumb" aria-hidden="true" style={{ transform: `translate(${offset.x * 25}%,${offset.y * 25}%)` }} />
    </div>
    <div className="asr-control-hint">
      <span>{entry.game.action ? gameText(mode, entry.game.action.stick) : profile.scheme === 'select' ? local('えらんで A', 'Choose, then A', 'えらんで A')
        : profile.scheme === 'direction' ? local('方向で操作', 'Move with the stick', 'ほうこうでそうさ') : local('タイミングよく！', 'Time your action!', 'タイミングよく！')}</span>
      <small>{profile.scheme === 'select' ? local('B でひとつ戻す', 'B undoes a step', 'B でひとつもどす')
        : local('矢印キー ／ Z・X', 'Arrow keys / Z · X', 'やじるしキー ／ Z・X')}</small>
    </div>
    <div className="asr-ab-buttons">
      {(['b', 'a'] as const).map(command => <button type="button" key={command} data-asr-button={command}
        disabled={!enabled || command === 'b' && !bAvailable}
        aria-label={`${command.toUpperCase()}: ${command === 'a' ? aLabel : bLabel}`}
        onPointerDown={event => { if (event.button === 0) { event.preventDefault(); onControl(command); } }}
        onClick={event => { if (event.detail === 0) onControl(command); }}>
        <b>{command.toUpperCase()}</b><span>{command === 'a' ? aLabel : bLabel}</span>
      </button>)}
    </div>
  </div>;
}

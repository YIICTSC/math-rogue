import React, { useEffect, useMemo, useState } from 'react';
import { Delete, Space, X } from 'lucide-react';
import { LanguageMode } from '../types';
import { trans } from '../utils/textUtils';

export const OPEN_GAMEPAD_KEYBOARD_EVENT = 'learning-rogue:open-gamepad-keyboard';

type EditableElement = HTMLInputElement | HTMLTextAreaElement;
type KeyboardLayout = 'LATIN' | 'HIRAGANA' | 'NUMBER';

interface OpenKeyboardDetail {
  target: EditableElement;
}

const LATIN_KEYS = [
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
  ...'0123456789'.split(''),
  '-', '_', '.', '@', '#', '/', ':',
];

const HIRAGANA_KEYS = [
  ...'あいうえお'.split(''), ...'かきくけこ'.split(''), ...'さしすせそ'.split(''),
  ...'たちつてと'.split(''), ...'なにぬねの'.split(''), ...'はひふへほ'.split(''),
  ...'まみむめも'.split(''), ...'やゆよ'.split(''), ...'らりるれろ'.split(''),
  ...'わをん'.split(''), 'ー', '゛', '゜',
];

const NUMBER_KEYS = [...'1234567890'.split(''), '-', '/', ':', '.', 'T'];

const setNativeValue = (target: EditableElement, value: string) => {
  const prototype = target instanceof HTMLTextAreaElement
    ? HTMLTextAreaElement.prototype
    : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
  setter?.call(target, value);
  target.dispatchEvent(new Event('input', { bubbles: true }));
  target.dispatchEvent(new Event('change', { bubbles: true }));
};

const getInitialLayout = (target: EditableElement): KeyboardLayout => {
  if (
    target.inputMode === 'numeric'
    || target.inputMode === 'decimal'
    || (target instanceof HTMLInputElement && ['number', 'date', 'time', 'datetime-local'].includes(target.type))
  ) {
    return 'NUMBER';
  }
  return 'LATIN';
};

export const GamepadVirtualKeyboard: React.FC<{ languageMode: LanguageMode }> = ({ languageMode }) => {
  const [target, setTarget] = useState<EditableElement | null>(null);
  const [originalValue, setOriginalValue] = useState('');
  const [value, setValue] = useState('');
  const [layout, setLayout] = useState<KeyboardLayout>('LATIN');

  useEffect(() => {
    const open = (event: Event) => {
      const detail = (event as CustomEvent<OpenKeyboardDetail>).detail;
      if (!detail?.target || detail.target.disabled || detail.target.readOnly) return;
      setTarget(detail.target);
      setOriginalValue(detail.target.value);
      setValue(detail.target.value);
      setLayout(getInitialLayout(detail.target));
    };
    window.addEventListener(OPEN_GAMEPAD_KEYBOARD_EVENT, open);
    return () => window.removeEventListener(OPEN_GAMEPAD_KEYBOARD_EVENT, open);
  }, []);

  const keys = useMemo(
    () => layout === 'HIRAGANA' ? HIRAGANA_KEYS : layout === 'NUMBER' ? NUMBER_KEYS : LATIN_KEYS,
    [layout],
  );

  if (!target) return null;

  const maxLength = target.maxLength > 0 ? target.maxLength : Number.POSITIVE_INFINITY;
  const append = (text: string) => setValue(current => `${current}${text}`.slice(0, maxLength));
  const close = () => {
    target.focus({ preventScroll: true });
    setTarget(null);
  };
  const confirm = () => {
    setNativeValue(target, value);
    close();
  };
  const cancel = () => {
    setNativeValue(target, originalValue);
    close();
  };
  const switchLayout = () => {
    if (getInitialLayout(target) === 'NUMBER') {
      setLayout('NUMBER');
      return;
    }
    setLayout(current => current === 'LATIN' ? 'HIRAGANA' : 'LATIN');
  };

  return (
    <div
      className="app-modal-overlay fixed inset-0 z-[2147483647] flex items-center justify-center bg-black/90 p-3 text-white"
      data-gamepad-modal
      data-gamepad-initial-scope={`gamepad-keyboard-${layout}`}
      role="dialog"
      aria-modal="true"
      aria-label={trans('画面キーボード', languageMode)}
    >
      <div className="app-modal-panel flex max-h-[94dvh] w-full max-w-4xl flex-col rounded-2xl border-2 border-cyan-300 bg-slate-950 p-3 shadow-[0_0_40px_rgba(34,211,238,0.32)] sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-black tracking-[0.25em] text-cyan-300">CONTROLLER KEYBOARD</div>
            <div className="text-sm font-black text-white">{target.placeholder || trans('文字を入力', languageMode)}</div>
          </div>
          <button
            type="button"
            data-gamepad-back
            onClick={cancel}
            className="rounded-lg border border-slate-500 bg-slate-800 p-2 text-slate-100 hover:bg-slate-700"
            aria-label={trans('キャンセル', languageMode)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-3 min-h-14 break-all rounded-xl border-2 border-cyan-500/60 bg-black px-4 py-3 text-lg font-black text-cyan-50">
          {value || <span className="text-slate-600">{trans('未入力', languageMode)}</span>}
        </div>

        <div className="grid flex-1 grid-cols-7 gap-1 overflow-y-auto pr-1 sm:grid-cols-10 sm:gap-2">
          {keys.map((key, index) => (
            <button
              key={`${layout}-${key}-${index}`}
              type="button"
              data-gamepad-initial-choice={index === 0 ? true : undefined}
              onClick={() => append(key)}
              className="min-h-11 rounded-lg border border-slate-600 bg-slate-800 px-2 py-2 text-base font-black hover:border-cyan-300 hover:bg-cyan-950 focus-visible:border-yellow-300"
            >
              {key}
            </button>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
          <button
            type="button"
            data-gamepad-shortcut="X"
            aria-keyshortcuts="X"
            onClick={() => setValue(current => Array.from(current).slice(0, -1).join(''))}
            className="flex items-center justify-center gap-2 rounded-lg border border-rose-400 bg-rose-950 px-3 py-3 font-black text-rose-100"
          >
            <Delete size={18} /> X {trans('1文字消す', languageMode)}
          </button>
          <button
            type="button"
            data-gamepad-shortcut="Y"
            aria-keyshortcuts="Y"
            onClick={() => append(' ')}
            className="flex items-center justify-center gap-2 rounded-lg border border-indigo-400 bg-indigo-950 px-3 py-3 font-black text-indigo-100"
          >
            <Space size={18} /> Y {trans('空白', languageMode)}
          </button>
          <button
            type="button"
            data-gamepad-shortcut="LB RB"
            aria-keyshortcuts="LB RB"
            onClick={switchLayout}
            disabled={getInitialLayout(target) === 'NUMBER'}
            className="rounded-lg border border-amber-400 bg-amber-950 px-3 py-3 font-black text-amber-100 disabled:opacity-40"
          >
            LB/RB {layout === 'LATIN' ? 'かな' : layout === 'HIRAGANA' ? 'ABC' : '123'}
          </button>
          <button
            type="button"
            onClick={cancel}
            className="rounded-lg border border-slate-500 bg-slate-800 px-3 py-3 font-black text-slate-100"
          >
            B {trans('キャンセル', languageMode)}
          </button>
          <button
            type="button"
            onClick={confirm}
            className="rounded-lg border border-emerald-200 bg-emerald-500 px-3 py-3 font-black text-slate-950"
          >
            {trans('入力を決定', languageMode)}
          </button>
        </div>
      </div>
    </div>
  );
};

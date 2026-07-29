import React, { useEffect, useRef, useState } from 'react';
import { DoorOpen, LogOut, Play, X } from 'lucide-react';
import { LanguageMode } from '../types';
import { trans } from '../utils/textUtils';

export const OPEN_GAMEPAD_SYSTEM_MENU_EVENT = 'learning-rogue:open-gamepad-system-menu';

type Props = {
  enabled: boolean;
  canQuit: boolean;
  languageMode: LanguageMode;
  onReturnToTitle: () => void;
  onQuit: () => void;
};

export const GamepadSystemMenu: React.FC<Props> = ({
  enabled,
  canQuit,
  languageMode,
  onReturnToTitle,
  onQuit,
}) => {
  const [open, setOpen] = useState(false);
  const continueButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleOpen = () => {
      if (enabled) setOpen(true);
    };
    window.addEventListener(OPEN_GAMEPAD_SYSTEM_MENU_EVENT, handleOpen);
    return () => window.removeEventListener(OPEN_GAMEPAD_SYSTEM_MENU_EVENT, handleOpen);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) setOpen(false);
  }, [enabled]);

  useEffect(() => {
    if (!open) return;
    const frameId = window.requestAnimationFrame(() => {
      continueButtonRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [open]);

  if (!open) return null;

  return (
    <div
      data-gamepad-modal
      data-gamepad-navigation-root
      data-gamepad-initial-scope="gamepad-system-menu"
      className="app-modal-overlay fixed inset-0 z-[2147483646] flex items-center justify-center bg-black/85 p-4 text-white"
      role="dialog"
      aria-modal="true"
      aria-label={trans('ゲームメニュー', languageMode)}
    >
      <div className="app-modal-panel w-full max-w-md rounded-2xl border-2 border-slate-300 bg-slate-950 p-5 shadow-2xl">
        <div className="mb-5 flex items-center justify-between border-b border-slate-700 pb-3">
          <div>
            <div className="text-[10px] font-black tracking-[0.25em] text-cyan-300">VIEW MENU</div>
            <h2 className="text-xl font-black">{trans('ゲームメニュー', languageMode)}</h2>
          </div>
          <button
            type="button"
            data-gamepad-back
            onClick={() => setOpen(false)}
            className="rounded-lg border border-slate-600 bg-slate-800 p-2"
            aria-label={trans('閉じる', languageMode)}
          >
            <X size={20} />
          </button>
        </div>
        <div className="grid gap-3">
          <button
            ref={continueButtonRef}
            type="button"
            data-gamepad-initial-choice
            data-gamepad-zone="system-menu-actions"
            data-gamepad-order={0}
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-2 rounded-xl border border-cyan-300 bg-cyan-500 px-4 py-3 font-black text-slate-950"
          >
            <Play size={18} /> {trans('ゲームを続ける', languageMode)}
          </button>
          <button
            type="button"
            data-gamepad-zone="system-menu-actions"
            data-gamepad-order={1}
            onClick={() => {
              setOpen(false);
              onReturnToTitle();
            }}
            className="flex items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-950 px-4 py-3 font-black text-amber-100"
          >
            <LogOut size={18} /> {trans('タイトル画面へ戻る', languageMode)}
          </button>
          <button
            type="button"
            data-gamepad-zone="system-menu-actions"
            data-gamepad-order={2}
            disabled={!canQuit}
            onClick={() => {
              setOpen(false);
              onQuit();
            }}
            className="flex items-center justify-center gap-2 rounded-xl border border-rose-400 bg-rose-950 px-4 py-3 font-black text-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <DoorOpen size={18} /> {trans('ゲームを閉じる', languageMode)}
          </button>
        </div>
        {!canQuit && (
          <p className="mt-3 text-center text-xs text-slate-500">
            {trans('ゲームを閉じる操作はSteam版で利用できます。', languageMode)}
          </p>
        )}
      </div>
    </div>
  );
};

import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { copy } from './copy';
import type { LanguageMode } from '../types';

/** A bounded, keyboard-accessible workspace for settings and long lists. */
export default function Overlay({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null), id = useId();
  const language = (document.querySelector('[data-quiz-show]')?.getAttribute('data-language') || 'JAPANESE') as LanguageMode;
  useEffect(() => {
    const dialog = ref.current!, previous = document.activeElement as HTMLElement | null;
    dialog.showModal();
    return () => { dialog.close(); if (previous?.isConnected) previous.focus(); };
  }, []);
  return <dialog ref={ref} className="qs-workspace" aria-labelledby={id} onCancel={e => { e.preventDefault(); onClose(); }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}><div className="qs-workspace-card"><header><h2 id={id}>{title}</h2><button autoFocus aria-label={copy(language)('閉じる', 'Close', 'とじる')} onClick={onClose}><X size={20}/></button></header><div className="qs-workspace-body">{children}</div></div></dialog>;
}

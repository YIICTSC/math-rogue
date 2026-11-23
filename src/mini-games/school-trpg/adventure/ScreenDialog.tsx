import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import type { Local } from './ui';

export default function ScreenDialog({
  title,
  t,
  close,
  children,
}: {
  title: string;
  t: Local;
  close: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const heading = useId();
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={ref}
      className="sa-dialog sa-screen-dialog"
      aria-labelledby={heading}
      data-gamepad-navigation-root
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.currentTarget === event.target) close();
      }}
    >
      <div className="sa-screen-dialog-frame">
        <header>
          <h2 id={heading}>{title}</h2>
          <button
            type="button"
            data-gamepad-back
            onClick={close}
            aria-label={t(['閉じる', 'Close', 'とじる'])}
          >
            <X size={19} />
          </button>
        </header>
        <div className="sa-screen-dialog-body">{children}</div>
      </div>
    </dialog>
  );
}

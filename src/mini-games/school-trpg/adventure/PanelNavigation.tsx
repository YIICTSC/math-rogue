import React from 'react';
import type { Text } from './content';
import type { Local } from './ui';

export default function PanelNavigation<Labels extends Record<string, Text>>({
  labels,
  current,
  select,
  name,
  t,
}: {
  labels: Labels;
  current: keyof Labels & string;
  select: (id: keyof Labels & string) => void;
  name: Text;
  t: Local;
}) {
  return (
    <nav className="sa-panel-navigation" aria-label={t(name)}>
      {(Object.keys(labels) as Array<keyof Labels & string>).map((id) => (
        <button key={id} type="button" aria-pressed={id === current} onClick={() => select(id)}>
          {t(labels[id])}
        </button>
      ))}
    </nav>
  );
}

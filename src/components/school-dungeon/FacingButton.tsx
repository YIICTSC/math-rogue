import './facing-controls.css';

export function FacingButton({ active, onToggle, text }: {
  active: boolean;
  onToggle: () => void;
  text: (ja: string, en: string) => string;
}) {
  const label = text('向き変更', 'Face only');
  return <button type="button" className="dungeon-facing-toggle" aria-label={label} aria-pressed={active}
    onClick={onToggle}>{active ? '↻ ' : ''}{label}</button>;
}

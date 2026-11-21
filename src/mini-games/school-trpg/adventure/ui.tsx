import React from 'react';
import { Dice5 } from 'lucide-react';
import type { LanguageMode } from '../../../types';
import { assetUrl } from '../../../utils/assetPaths';
import { STATS, text, type Text } from './content';
import type { Action, Check } from './state';

export type Local = (copy: Text) => string;
export const copyFor =
  (language: LanguageMode): Local =>
  (copy) =>
    text(language, copy);
export type Send = (action: Action) => boolean;
export const art = (asset: string) => assetUrl('sprites/school-adventure/' + asset + '.webp');

const OUTCOMES = {
  critical: ['大成功', 'Critical success', 'だいせいこう'],
  success: ['成功', 'Success', 'せいこう'],
  partial: ['惜しい', 'Partial', 'おしい'],
  fail: ['失敗', 'Setback', 'しっぱい'],
} satisfies Record<Check['outcome'], Text>;
export function DiceResult({ check, t }: { check: Check; t: Local }) {
  const sign = check.bonus < 0 ? '−' : '+';
  return (
    <span className="sa-roll" data-outcome={check.outcome}>
      <Dice5 size={16} aria-hidden="true" />
      <b>{t(OUTCOMES[check.outcome])}</b>
      <span>
        {check.faces.join(' / ')} {sign} {Math.abs(check.bonus)} = {check.total} / {check.target}
      </span>
      <small>
        {t(STATS[check.stat])}
        {check.inspiration ? ' · ' + t(['ひらめき', 'Inspiration']) : ''}
      </small>
    </span>
  );
}

export function Portrait({
  id,
  className = '',
  alt = '',
  lazy = false,
}: {
  id: string;
  className?: string;
  alt?: string;
  lazy?: boolean;
}) {
  return (
    <img
      className={'sa-portrait ' + className}
      src={art(id)}
      alt={alt}
      decoding="async"
      loading={lazy ? 'lazy' : 'eager'}
    />
  );
}

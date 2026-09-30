import React from 'react';
import { MAX_LAPS, MIN_LAPS } from './engine';
import TranslatedUiTree from '../../components/TranslatedUiTree';
import type { LanguageMode } from '../../types';

export default function LapCountPicker({ value, onChange, disabled, languageMode = 'JAPANESE' }: { value: number; onChange: (laps: number) => void; disabled: boolean; languageMode?: LanguageMode }) {
  return <TranslatedUiTree mode={languageMode}><div className="gk-next-course"><label>周回数<select aria-label="1コース当たりの周回数" value={value} onChange={e => onChange(Number(e.target.value))} disabled={disabled}>{Array.from({ length: MAX_LAPS - MIN_LAPS + 1 }, (_, i) => i + MIN_LAPS).map(laps => <option key={laps} value={laps}>{`${laps}周`}</option>)}</select></label><small>{disabled ? 'ホストが設定した周回数です。' : 'このレースで走る周回数を設定します（1〜5周）。'}</small></div></TranslatedUiTree>;
}

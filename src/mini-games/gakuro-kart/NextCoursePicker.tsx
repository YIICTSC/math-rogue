import React from 'react';
import { COURSES } from './track';
import TranslatedUiTree from '../../components/TranslatedUiTree';
import type { LanguageMode } from '../../types';

export default function NextCoursePicker({ value, onChange, disabled, languageMode = 'JAPANESE' }: { value: number; onChange: (course: number) => void; disabled: boolean; languageMode?: LanguageMode }) {
  return <TranslatedUiTree mode={languageMode}><div className="gk-next-course"><label>次のコース<select value={value} onChange={e => onChange(Number(e.target.value))} disabled={disabled}>{COURSES.map((c, i) => <option key={c.name} value={i}>{String(i + 1).padStart(2, '0')} / {c.name} · {c.subtitle}</option>)}</select></label><small>参加者とキャラクターを引き継いで走れます。</small></div></TranslatedUiTree>;
}

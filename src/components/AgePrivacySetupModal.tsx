import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { AgeBand, childSafetyService } from '../services/childSafetyService';
import { LanguageMode } from '../types';

type Props = {
  open: boolean;
  languageMode: LanguageMode;
  onComplete: () => void;
};

const labels: Array<{ id: AgeBand; ja: string; en: string }> = [
  { id: '9_12', ja: '9〜12歳', en: 'Ages 9–12' },
  { id: '13_15', ja: '13〜15歳', en: 'Ages 13–15' },
  { id: '16_17', ja: '16〜17歳', en: 'Ages 16–17' },
  { id: '18_PLUS', ja: '18歳以上', en: 'Age 18 or older' },
];

export default function AgePrivacySetupModal({ open, languageMode, onComplete }: Props) {
  const [selected, setSelected] = useState<AgeBand | null>(null);
  if (!open) return null;
  const english = languageMode === 'ENGLISH';
  const save = () => {
    if (!selected) return;
    childSafetyService.setAgeBand(selected);
    onComplete();
  };

  return <div className="fixed inset-0 z-[10100] flex items-center justify-center bg-black/95 p-3" role="dialog" aria-modal="true" aria-labelledby="age-privacy-title">
    <section className="max-h-[calc(100dvh-1.5rem)] w-full max-w-xl overflow-y-auto rounded-2xl border-4 border-cyan-300 bg-slate-950 p-5 text-white shadow-[0_0_55px_rgba(34,211,238,0.28)] sm:p-7">
      <ShieldCheck className="mx-auto text-cyan-300" size={42} />
      <div className="mt-2 text-center text-[10px] font-black tracking-[.25em] text-cyan-300">PRIVACY SETUP</div>
      <h2 id="age-privacy-title" className="mt-2 text-center text-2xl font-black">{english ? 'Select the player’s age group' : 'プレイヤーの年齢区分を選択'}</h2>
      <p className="mt-3 text-sm font-bold leading-6 text-slate-300">
        {english
          ? 'This neutral age screen controls which online features and data protections are used. The exact birth date is not stored.'
          : 'オンライン機能とデータ保護を正しく切り替えるための確認です。生年月日は保存しません。'}
      </p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        {labels.map((item) => <button
          key={item.id}
          type="button"
          onClick={() => setSelected(item.id)}
          className={`rounded-xl border-2 px-3 py-4 text-base font-black ${selected === item.id ? 'border-cyan-200 bg-cyan-300 text-slate-950' : 'border-slate-600 bg-slate-900 text-slate-100'}`}
        >{english ? item.en : item.ja}</button>)}
      </div>
      {selected === '9_12' && <div className="mt-5 rounded-xl border border-amber-500/70 bg-amber-950/45 p-4 text-xs font-bold leading-5 text-amber-100">
        {english
          ? 'For ages 9–12, learning summaries are sent only after linking with a code issued by a guardian or school. Ranking submission requires separate verified guardian permission.'
          : '9〜12歳では、保護者または学校が発行したコードで連携した場合だけ学習集計を送信します。ランキング投稿には、別途、確認済みの保護者許可が必要です。'}
      </div>}
      <button type="button" disabled={!selected} onClick={save} className="mt-5 w-full rounded-xl bg-cyan-300 px-4 py-3 font-black text-slate-950 disabled:opacity-40">
        {english ? 'Save and continue' : '保存して続ける'}
      </button>
      <p className="mt-3 text-center text-[10px] leading-4 text-slate-500">
        {english ? 'You can review privacy controls and deletion options later in the game.' : 'プライバシー設定と削除方法は、あとからゲーム内で確認できます。'}
      </p>
    </section>
  </div>;
}

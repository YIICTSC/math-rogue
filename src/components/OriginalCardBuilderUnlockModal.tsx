import React from 'react';
import { Camera, CheckCircle2, RefreshCw, Sparkles } from 'lucide-react';
import type { LanguageMode } from '../types';

const modalText = (languageMode: LanguageMode, japanese: string, english: string, hiragana: string = japanese) => {
  if (languageMode === 'ENGLISH') return english;
  if (languageMode === 'HIRAGANA') return hiragana;
  return japanese;
};

interface OriginalCardBuilderUnlockModalProps {
  languageMode: LanguageMode;
  onClose: () => void;
}

const OriginalCardBuilderUnlockModal: React.FC<OriginalCardBuilderUnlockModalProps> = ({ languageMode, onClose }) => {
  const features = [
    {
      icon: <Sparkles size={19} />,
      title: modalText(languageMode, '自分だけのカード', 'Your own card', 'じぶんだけのかーど'),
      body: modalText(languageMode, '名前・属性・キラを自由に設定', 'Choose the name, type, and holographic style', 'なまえ・ぞくせい・きらをじゆうにせってい'),
      className: 'border-violet-200/40 bg-violet-400/15 text-violet-100',
    },
    {
      icon: <RefreshCw size={19} />,
      title: modalText(languageMode, '効果スロット', 'Effect slots', 'こうかすろっと'),
      body: modalText(languageMode, '良い効果3つを何度でもリロール', 'Reroll 3 good effects as many times as you like', 'よいこうか3つをなんどでもりろーる'),
      className: 'border-emerald-200/40 bg-emerald-400/15 text-emerald-100',
    },
    {
      icon: <CheckCircle2 size={19} />,
      title: modalText(languageMode, '悪い効果も1つ', 'One drawback too', 'わるいこうかも1つ'),
      body: modalText(languageMode, '強さと工夫のバランスを考えよう', 'Balance power with a little risk', 'つよさとくふうのばらんすをかんがえよう'),
      className: 'border-rose-200/40 bg-rose-400/15 text-rose-100',
    },
    {
      icon: <Camera size={19} />,
      title: modalText(languageMode, '写真をカードに', 'Photo cards', 'しゃしんをかーどに'),
      body: modalText(languageMode, 'カメラ撮影や画像ファイルを取り込み', 'Use a camera photo or an image file', 'かめらさつえいやがぞうふぁいるをとりこみ'),
      className: 'border-cyan-200/40 bg-cyan-400/15 text-cyan-100',
    },
  ];

  return (
    <div data-gamepad-modal data-gamepad-initial-scope="original-card-builder-unlock" className="app-modal-overlay original-card-builder-unlock-modal-overlay fixed inset-0 z-[2147483647] flex items-center justify-center overflow-y-auto bg-slate-950/90 p-3 sm:p-6" onClick={onClose}>
      <div
        data-gamepad-navigation-root
        role="dialog"
        aria-modal="true"
        aria-labelledby="original-card-builder-unlock-title"
        className="relative w-full max-w-3xl overflow-hidden rounded-[1.75rem] border-2 border-violet-200/70 bg-[radial-gradient(circle_at_top,#4c1d95_0%,#172554_48%,#020617_100%)] p-5 text-center shadow-[0_0_70px_rgba(167,139,250,0.45)] sm:p-8 original-card-builder-unlock-modal-panel"
        onClick={event => event.stopPropagation()}
      >
        <div className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-fuchsia-300/20 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-28 -right-16 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" aria-hidden="true" />
        <div className="relative z-10 mb-3 flex items-center justify-center gap-2 text-xs font-black tracking-[0.24em] text-yellow-200 sm:text-sm original-card-builder-unlock-eyebrow">
          <Sparkles className="animate-pulse" size={18} />
          {modalText(languageMode, '新モード解禁', 'NEW MODE UNLOCKED', 'あたらしいもーどかいきん')}
          <Sparkles className="animate-pulse" size={18} />
        </div>
        <h2 id="original-card-builder-unlock-title" className="relative z-10 text-3xl font-black leading-tight text-white drop-shadow-[0_3px_0_rgba(0,0,0,0.45)] sm:text-5xl original-card-builder-unlock-title">
          {modalText(languageMode, 'オリジナルカードビルダー解禁！', 'ORIGINAL CARD BUILDER UNLOCKED!', 'おりじなるかーどびるだーかいきん！')}
        </h2>
        <p className="relative z-10 mx-auto mt-3 max-w-2xl text-sm font-bold leading-relaxed text-violet-100 sm:text-base original-card-builder-unlock-description">
          {modalText(languageMode, 'エンドレスモードのクリアを記念して、学習ローグで使える自分だけのカードを作れるようになりました。', 'To celebrate your Endless Mode clear, you can now create cards of your own and use them in Learning Rogue.', 'えんどれすもーどのくりあをきねんして、がくしゅうろーぐでつかえるじぶんだけのかーどをつくれるようになりました。')}
        </p>

        <div className="relative z-10 mt-6 grid gap-3 text-left sm:grid-cols-2 original-card-builder-unlock-features">
          {features.map(feature => (
            <div key={feature.title} className={`rounded-2xl border p-3 ${feature.className} original-card-builder-unlock-feature`}>
              <div className="mb-1 flex items-center gap-2 text-sm font-black">
                {feature.icon}
                {feature.title}
              </div>
              <div className="text-xs font-bold text-white/80">{feature.body}</div>
            </div>
          ))}
        </div>

        <div className="relative z-10 mt-6 flex justify-center original-card-builder-unlock-actions">
          <button type="button" data-gamepad-initial-choice onClick={onClose} className="w-full rounded-xl border-2 border-yellow-100 bg-gradient-to-r from-yellow-300 via-fuchsia-300 to-cyan-300 px-6 py-3 text-base font-black text-slate-950 shadow-[0_0_28px_rgba(253,224,71,0.35)] transition hover:brightness-110 active:scale-[0.98] sm:max-w-md sm:text-lg">
            {modalText(languageMode, 'このお知らせをとじる', 'Close this notice', 'このおしらせを とじる')}
          </button>
        </div>
        <div className="relative z-10 mt-3 text-[10px] font-bold text-white/60 sm:text-xs original-card-builder-unlock-footer">
          {modalText(languageMode, '作成したカードはご褒美カード帳から冒険に持っていけます。', 'Saved cards can be taken on your next adventure from the reward card album.', 'さくせいしたかーどはごほうびかーどちょうからぼうけんにもっていけます。')}
        </div>
      </div>
    </div>
  );
};

export default OriginalCardBuilderUnlockModal;

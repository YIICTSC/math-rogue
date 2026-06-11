import React, { useState } from 'react';
import { ArrowLeft, Sparkles, Trash2 } from 'lucide-react';
import { Card as ICard, LanguageMode } from '../types';
import Card from './Card';
import CardInspectionModal from './CardInspectionModal';
import { trans } from '../utils/textUtils';
import { assetUrl } from '../utils/assetPaths';

interface RewardCardAlbumScreenProps {
  cards: ICard[];
  onBack: () => void;
  onSelect?: (card: ICard | null) => void;
  onDelete: (cardId: string) => void;
  languageMode: LanguageMode;
}

const RewardCardAlbumScreen: React.FC<RewardCardAlbumScreenProps> = ({
  cards,
  onBack,
  onSelect,
  onDelete,
  languageMode,
}) => {
  const [inspectedCard, setInspectedCard] = useState<ICard | null>(null);
  const [deleteTargetCard, setDeleteTargetCard] = useState<ICard | null>(null);
  const isStartSelection = !!onSelect;

  const confirmDelete = () => {
    if (!deleteTargetCard) return;
    onDelete(deleteTargetCard.id);
    setDeleteTargetCard(null);
  };

  return (
    <div
      className="main-reward-card-album-screen h-full w-full overflow-y-auto bg-slate-950 bg-cover bg-center text-white custom-scrollbar"
      style={{ backgroundImage: `url(${assetUrl('banners/reward-card-album-background.png')})` }}
    >
      <div className="min-h-full bg-slate-950/58 p-4">
        {inspectedCard && (
          <CardInspectionModal
            card={inspectedCard}
            languageMode={languageMode}
            onClose={() => setInspectedCard(null)}
          />
        )}
        {deleteTargetCard && (
          <div
            className="app-modal-overlay fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4"
            onClick={() => setDeleteTargetCard(null)}
          >
            <div
              className="app-modal-panel w-full max-w-sm rounded-xl border-2 border-red-500 bg-slate-950 p-5 text-center shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-red-400/70 bg-red-950 text-red-100">
                <Trash2 size={24} />
              </div>
              <h3 className="mb-2 text-xl font-black text-white">ご褒美カードを削除しますか？</h3>
              <p className="mb-4 text-sm font-bold leading-relaxed text-slate-300">
                「{trans(deleteTargetCard.name, languageMode)}」をカード帳から削除します。削除すると元に戻せません。
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setDeleteTargetCard(null)}
                  className="rounded-lg border border-slate-500 bg-slate-800 px-3 py-2 text-sm font-black text-slate-100 hover:bg-slate-700"
                >
                  やめる
                </button>
                <button
                  onClick={confirmDelete}
                  className="rounded-lg border border-red-400 bg-red-700 px-3 py-2 text-sm font-black text-white hover:bg-red-600"
                >
                  削除する
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={onBack}
              className="flex items-center rounded-lg border border-slate-600 bg-slate-900/90 px-3 py-2 text-sm font-black text-slate-100 hover:bg-slate-800"
            >
              <ArrowLeft className="mr-1.5" size={18} /> {trans('戻る', languageMode)}
            </button>
            <div className="text-right">
              <div className="flex items-center justify-end text-2xl font-black text-cyan-100 drop-shadow-[0_0_12px_rgba(34,211,238,0.8)]">
                <Sparkles className="mr-2 text-yellow-200" size={28} /> ご褒美カード帳
              </div>
              <div className="text-xs font-bold text-slate-300">
                {isStartSelection ? '旅に持っていくカードを1枚選べます' : `${cards.length}枚保存中`}
              </div>
            </div>
          </div>

          {isStartSelection && (
            <button
              onClick={() => onSelect?.(null)}
              className="self-center rounded-xl border-2 border-slate-500 bg-slate-900/90 px-6 py-3 text-sm font-black text-slate-100 hover:bg-slate-800"
            >
              今回は使わない
            </button>
          )}

          {cards.length === 0 ? (
            <div className="mx-auto mt-12 max-w-md rounded-2xl border border-slate-600 bg-slate-900/85 p-6 text-center text-sm font-bold text-slate-200">
              課題を達成すると、ご褒美カードがここに保存されます。
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 pb-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {cards.map((card) => (
                <div key={card.id} className="flex flex-col items-center gap-3 rounded-xl border border-cyan-400/30 bg-slate-950/70 p-3">
                  <div className="scale-105">
                    <Card
                      card={card}
                      onClick={() => isStartSelection ? onSelect?.(card) : setInspectedCard(card)}
                      disabled={false}
                      onInspect={setInspectedCard}
                      languageMode={languageMode}
                    />
                  </div>
                  <div className="grid w-full grid-cols-1 gap-2">
                    {isStartSelection && (
                      <button
                        onClick={() => onSelect?.(card)}
                        className="rounded-lg bg-cyan-300 px-3 py-2 text-xs font-black text-slate-950 hover:bg-cyan-200"
                      >
                        このカードで始める
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteTargetCard(card)}
                      className="flex items-center justify-center rounded-lg border border-red-500/60 bg-red-950/70 px-3 py-2 text-xs font-black text-red-100 hover:bg-red-900"
                    >
                      <Trash2 className="mr-1" size={14} /> 削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RewardCardAlbumScreen;

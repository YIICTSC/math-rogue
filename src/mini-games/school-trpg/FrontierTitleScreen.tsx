import React, { useState } from 'react';
import { ArrowLeft, BookOpen, ChevronRight, Compass, FolderOpen, Plus, Trash2 } from 'lucide-react';
import { FRONTIER_TITLE } from './frontierTitle';
import ScreenDialog from './adventure/ScreenDialog';
import { CALLINGS } from './adventure/content';
import { ADVENTURE_SLOTS } from './adventure/save';
import type { Adventure } from './adventure/state';
import { art, Portrait, type Local } from './adventure/ui';
import { dayAt, townAt } from './adventure/world';

type Props = {
  t: Local;
  slots: Adventure[];
  hasStory: boolean;
  back: () => void;
  create: () => void;
  story: () => void;
  resume: (slot: Adventure) => void;
  remove: (id: string) => boolean;
};

export default function FrontierTitleScreen({
  t,
  slots,
  hasStory,
  back,
  create,
  story,
  resume,
  remove,
}: Props) {
  const [showRecords, setShowRecords] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState(false);
  const latest = slots[0];
  const recordsLabel = t(['冒険の記録', 'Adventure saves', 'ぼうけんの きろく']);

  return (
    <main className="sa-frontier-title" aria-label={t(FRONTIER_TITLE)}>
      <picture className="sa-frontier-art">
        <source media="(orientation: portrait)" srcSet={art('frontier-title-portrait')} />
        <img src={art('frontier-title-wide')} alt="" fetchPriority="high" />
      </picture>
      <button className="sa-frontier-back" type="button" onClick={back} data-gamepad-back>
        <ArrowLeft size={17} />
        {t(['ゲーム一覧', 'Minigames', 'ゲームいちらん'])}
      </button>
      <section className="sa-frontier-menu">
        <h1>{t(FRONTIER_TITLE)}</h1>
        <div className="sa-frontier-journeys">
          {latest && (
            <button
              className="sa-primary"
              type="button"
              onClick={() => resume(latest)}
              data-gamepad-initial-choice
            >
              <Compass size={20} />
              <span>
                {latest.fallenAt === null
                  ? t(['続きから', 'Continue', 'つづきから'])
                  : t(['最後の冒険を見る', 'Last adventure record', 'さいごの ぼうけんを みる'])}
                <small>
                  {latest.character.name} · Lv. {latest.level}
                </small>
              </span>
              <ChevronRight size={17} className="sa-frontier-chevron" />
            </button>
          )}
          <button
            className={latest ? undefined : 'sa-primary'}
            type="button"
            disabled={slots.length >= ADVENTURE_SLOTS}
            onClick={create}
            data-gamepad-initial-choice={latest ? undefined : true}
          >
            <Plus size={19} />
            {t(['新しい主人公', 'New character', 'あたらしい しゅじんこう'])}
          </button>
          {latest && (
            <button type="button" onClick={() => setShowRecords(true)}>
              <FolderOpen size={18} />
              {recordsLabel}
              <small>
                {slots.length}/{ADVENTURE_SLOTS}
              </small>
            </button>
          )}
        </div>
        <button type="button" className="sa-frontier-campaign" onClick={story}>
          <BookOpen size={19} />
          <span>
            {t(['物語キャンペーン', 'Story campaign', 'ものがたり キャンペーン'])}
            <small>
              {t(['放課後スクールTRPG', 'After-School TRPG', 'ほうかごスクールTRPG'])}
              {hasStory && ' · ' + t(['記録あり', 'Saved', 'きろくあり'])}
            </small>
          </span>
          <ChevronRight size={17} className="sa-frontier-chevron" />
        </button>
      </section>
      {showRecords && (
        <ScreenDialog
          title={recordsLabel}
          t={t}
          close={() => {
            setShowRecords(false);
            setPending(null);
            setDeleteError(false);
          }}
        >
          {deleteError && (
            <p role="alert">{t(['記録を削除できませんでした。', 'Could not remove the save.'])}</p>
          )}
          {!slots.length && (
            <p>
              {t([
                '冒険の記録はありません。',
                'There are no adventure saves.',
                'ぼうけんの きろくは ありません。',
              ])}
            </p>
          )}
          <div className="sa-slot-list">
            {slots.map((slot) => (
              <div className="sa-slot" key={slot.id}>
                <button type="button" onClick={() => resume(slot)}>
                  <Portrait id={slot.character.portrait} lazy />
                  <span>
                    <strong>{slot.character.name}</strong>
                    <small>
                      Lv. {slot.level} · {t(CALLINGS[slot.character.calling].name)}
                    </small>
                    <small>
                      {t(townAt(slot.location).name)} · {t(['日', 'Day', 'にち'])}{' '}
                      {dayAt(slot.time)}
                      {slot.fallenAt !== null &&
                        ' · ' + t(['旅を終えた', 'Journey ended', 'たびを おえた'])}
                    </small>
                  </span>
                </button>
                {pending === slot.id ? (
                  <div className="sa-confirm-delete">
                    <span>
                      {t(['この冒険の記録を削除しますか？', 'Delete this adventure save?'])}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteError(!remove(slot.id));
                        setPending(null);
                      }}
                    >
                      {t(['削除する', 'Delete', 'さくじょする'])}
                    </button>
                    <button type="button" onClick={() => setPending(null)}>
                      {t(['取り消す', 'Cancel', 'とりけす'])}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    aria-label={
                      t(['記録を削除', 'Delete save', 'きろくを さくじょ']) +
                      ' · ' +
                      slot.character.name
                    }
                    onClick={() => {
                      setPending(slot.id);
                      setDeleteError(false);
                    }}
                  >
                    <Trash2 size={17} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </ScreenDialog>
      )}
    </main>
  );
}

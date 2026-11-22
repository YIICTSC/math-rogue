import React, { lazy, useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, Compass, Plus, Trash2 } from 'lucide-react';
import { audioService } from '../../services/audioService';
import type { MiniGameComponentProps } from '../../components/MiniGameRouter';
import { loadSchoolTrpgCampaign } from './schoolTrpgSave';
import Creator from './adventure/Creator';
import AdventurePlay from './adventure/Play';
import { adventureTransition } from './adventure/engine';
import { CALLINGS } from './adventure/content';
import {
  ADVENTURE_SLOTS,
  deleteAdventure,
  loadAdventures,
  saveAdventure,
  type SaveResult,
} from './adventure/save';
import { startAdventure, type Action, type Adventure, type Character } from './adventure/state';
import { art, copyFor, Portrait } from './adventure/ui';
import { dayAt, townAt } from './adventure/world';
import './adventure/adventure.css';

const LegacyCampaign = lazy(() => import('./SchoolTrpgGame'));

export default function SchoolTrpgEntry(props: MiniGameComponentProps) {
  const {
    languageMode = 'JAPANESE',
    onBack,
    problemMode,
    problemModePool,
    answerMode,
    assignment,
    onAnswerResult,
  } = props;
  const t = copyFor(languageMode);
  const [mode, setMode] = useState<'title' | 'create' | 'play' | 'story'>('title');
  const [slots, setSlots] = useState(loadAdventures);
  const [campaign, setCampaign] = useState<Adventure | null>(null);
  const [deletePending, setDeletePending] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState(false);
  const [saveResult, setSaveResult] = useState<SaveResult>('saved');
  const current = useRef<Adventure | null>(null);
  const savedRevision = useRef<number | null>(null);
  const [hasStory, setHasStory] = useState(() => Boolean(loadSchoolTrpgCampaign()));
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mode === 'title' || mode === 'create')
      return audioService.acquireBgmScene('menu', undefined, 20);
  }, [mode]);
  useEffect(() => {
    root.current?.scrollTo({ top: 0 });
  }, [mode]);

  const persist = useCallback((next: Adventure) => {
    const result = saveAdventure(next, savedRevision.current);
    if (result === 'saved') savedRevision.current = next.revision;
    setSaveResult(result);
  }, []);

  const send = useCallback(
    (action: Action) => {
      const prior = current.current;
      if (!prior) return false;
      const next = adventureTransition(prior, action);
      if (next === prior) return false;
      current.current = next;
      persist(next);
      setCampaign(next);
      const top = next.journal[0];
      if (action.type === 'auto-combat') {
        if (!next.delve?.encounter) audioService.playSound(top?.tone === 'risk' ? 'wrong' : 'correct');
      } else if (action.type === 'declare' || action.type === 'combat' || top?.check) {
        audioService.playSound(
          top?.tone === 'risk' ? 'wrong' : top?.tone === 'good' ? 'correct' : 'select',
        );
      } else if (action.type !== 'move') audioService.playSound('select');
      return true;
    },
    [persist],
  );

  function goToTitle() {
    current.current = null;
    setCampaign(null);
    setSlots(loadAdventures());
    setHasStory(Boolean(loadSchoolTrpgCampaign()));
    setMode('title');
  }
  function open(slot: Adventure, saved: boolean) {
    current.current = slot;
    setCampaign(slot);
    savedRevision.current = saved ? slot.revision : null;
    if (saved) setSaveResult('saved');
    else persist(slot);
    audioService.playSound('select');
    setMode('play');
  }
  function begin(character: Character) {
    const id =
      globalThis.crypto?.randomUUID?.() ??
      Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
    const slot = startAdventure(character, id);
    if (slot) open(slot, false);
  }

  if (mode === 'story') {
    return (
      <React.Suspense
        fallback={
          <div className="sa-app sa-loading">
            {t(['読み込み中…', 'Loading…', 'よみこみちゅう…'])}
          </div>
        }
      >
        <LegacyCampaign {...props} onBack={goToTitle} />
      </React.Suspense>
    );
  }
  return (
    <div
      ref={root}
      className={'sa-app' + (mode === 'play' ? ' sa-playing' : '')}
      data-mini-game-scope="school-adventure"
      data-gamepad-navigation-root
    >
      {mode === 'create' ? (
        <Creator t={t} onBack={goToTitle} onBegin={begin} />
      ) : mode === 'play' && campaign ? (
        <AdventurePlay
          state={campaign}
          send={send}
          t={t}
          language={languageMode}
          mode={problemMode}
          modePool={problemModePool}
          answerMode={answerMode}
          assignment={assignment}
          onAnswerResult={onAnswerResult}
          back={goToTitle}
          saveResult={saveResult}
          retrySave={() => {
            if (current.current) persist(current.current);
          }}
        />
      ) : (
        <>
          <header className="sa-top sa-top-simple">
            <button type="button" onClick={onBack}>
              <ArrowLeft size={18} />
              {t(['ミニゲーム一覧', 'Minigames', 'ミニゲームいちらん'])}
            </button>
          </header>
          <main className="sa-title">
            <section className="sa-title-hero">
              <img src={art('cover')} alt="" fetchPriority="high" />
              <div className="sa-title-copy">
                <span>
                  {t(['放課後スクールTRPG', 'After-School TRPG', 'ほうかご スクールTRPG'])}
                </span>
                <h1>
                  {t(['鐘灯の自由冒険', 'Roads of Bellreach', 'しょうとうの じゆうぼうけん'])}
                </h1>
                <p>
                  {t([
                    '主人公をつくり、街道へ。町で暮らし、仲間を見つけ、灯りを手に遺跡へ潜ろう。',
                    'Create your hero and take the road. Make a home, find companions, or carry a lamp into the ruins.',
                  ])}
                </p>
                <div className="sa-inline">
                  {slots[0] && (
                    <button
                      className="sa-primary"
                      type="button"
                      onClick={() => open(slots[0], true)}
                    >
                      <Compass size={19} />
                      {slots[0].fallenAt === null
                        ? t(['続きから', 'Continue', 'つづきから'])
                        : t(['最後の旅の記録', 'Last adventure record', 'さいごの たびの きろく'])}
                    </button>
                  )}
                  <button
                    className={slots[0] ? undefined : 'sa-primary'}
                    type="button"
                    disabled={slots.length >= ADVENTURE_SLOTS}
                    onClick={() => setMode('create')}
                  >
                    <Plus size={19} />
                    {t(['新しい主人公', 'New character', 'あたらしい しゅじんこう'])}
                  </button>
                </div>
              </div>
            </section>
            <div className="sa-title-bottom">
              {slots.length > 0 && (
                <section className="sa-panel">
                  <div className="sa-section-row">
                    <h2>{t(['冒険の記録', 'Adventurers', 'ぼうけんの きろく'])}</h2>
                    <span>
                      {slots.length}/{ADVENTURE_SLOTS}
                    </span>
                  </div>
                  {deleteError && (
                    <p role="alert">
                      {t(['記録を削除できませんでした。', 'Could not remove the save.'])}
                    </p>
                  )}
                  <div className="sa-slot-list">
                    {slots.map((slot) => (
                      <div className="sa-slot" key={slot.id}>
                        <button type="button" onClick={() => open(slot, true)}>
                          <Portrait id={slot.character.portrait} lazy />
                          <span>
                            <strong>{slot.character.name}</strong>
                            <small>
                              Lv. {slot.level} · {t(CALLINGS[slot.character.calling].name)}
                            </small>
                            <small>
                              {t(townAt(slot.location).name)} · {t(['日', 'Day'])}{' '}
                              {dayAt(slot.time)}
                              {slot.fallenAt !== null && ' · ' + t(['旅を終えた', 'Journey ended', 'たびを おえた'])}
                            </small>
                          </span>
                        </button>
                        {deletePending === slot.id ? (
                          <div className="sa-confirm-delete">
                            <span>
                              {t(['この冒険の記録を削除しますか？', 'Delete this adventure save?'])}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const deleted = deleteAdventure(slot.id);
                                setDeleteError(!deleted);
                                if (deleted) setSlots(loadAdventures());
                                setDeletePending(null);
                              }}
                            >
                              {t(['削除する', 'Delete'])}
                            </button>
                            <button type="button" onClick={() => setDeletePending(null)}>
                              {t(['取り消す', 'Cancel'])}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            aria-label={
                              t(['記録を削除', 'Delete save']) + ' · ' + slot.character.name
                            }
                            onClick={() => {
                              setDeletePending(slot.id);
                              setDeleteError(false);
                            }}
                          >
                            <Trash2 size={17} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}
              <section className="sa-panel sa-story-entry">
                <div>
                  <h2>
                    <BookOpen size={19} />
                    {t(['物語キャンペーン', 'Story campaign', 'ものがたり キャンペーン'])}
                  </h2>
                  <p>
                    {t(
                      hasStory
                        ? ['以前の物語の続きから遊べます。', 'Continue your existing story save.']
                        : [
                            '仲間と一緒に章をたどる、放課後の物語。',
                            'Follow a chapter-based after-school story with your companions.',
                          ],
                    )}
                  </p>
                </div>
                <button type="button" onClick={() => setMode('story')}>
                  {t(['物語を開く', 'Open story', 'ものがたりを ひらく'])}
                </button>
              </section>
            </div>
          </main>
        </>
      )}
    </div>
  );
}

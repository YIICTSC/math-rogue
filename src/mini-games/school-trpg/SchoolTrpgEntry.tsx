import React, { lazy, useCallback, useEffect, useRef, useState } from 'react';
import { audioService } from '../../services/audioService';
import type { MiniGameComponentProps } from '../../components/MiniGameRouter';
import { loadSchoolTrpgCampaign } from './schoolTrpgSave';
import FrontierTitleScreen from './FrontierTitleScreen';
import { BATTLE_CUE_MS, useBattleSound } from './adventure/BattleEffects';
import { finalBattleFrame, type BattleCue, type BattleEvent } from './adventure/battleFeedback';
import Creator from './adventure/Creator';
import AdventurePlay from './adventure/Play';
import { adventureTransition } from './adventure/engine';
import { deleteAdventure, loadAdventures, saveAdventure, type SaveResult } from './adventure/save';
import { startAdventure, type Action, type Adventure, type Character } from './adventure/state';
import { copyFor } from './adventure/ui';
import './adventure/adventure.css';
import './adventure/frontierLayout.css';
import './adventure/frontierCombat.css';

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
  const [battleCue, setBattleCue] = useState<BattleCue | null>(null);
  const [saveResult, setSaveResult] = useState<SaveResult>('saved');
  const current = useRef<Adventure | null>(null);
  const savedRevision = useRef<number | null>(null);
  const [hasStory, setHasStory] = useState(() => Boolean(loadSchoolTrpgCampaign()));

  useEffect(() => {
    if (mode === 'title' || mode === 'create')
      return audioService.acquireBgmScene('menu', undefined, 20);
  }, [mode]);
  useBattleSound(battleCue);
  useEffect(() => {
    if (!battleCue) return;
    const timer = window.setTimeout(() => setBattleCue(null), BATTLE_CUE_MS);
    return () => window.clearTimeout(timer);
  }, [battleCue]);

  const persist = useCallback((next: Adventure) => {
    const result = saveAdventure(next, savedRevision.current);
    if (result === 'saved') savedRevision.current = next.revision;
    setSaveResult(result);
  }, []);

  const send = useCallback(
    (action: Action) => {
      const prior = current.current;
      if (!prior) return false;
      const events: BattleEvent[] = [];
      const next = adventureTransition(prior, action, events);
      if (next === prior) return false;
      current.current = next;
      persist(next);
      setCampaign(next);
      setBattleCue(events.length ? {
        revision: next.revision,
        events,
        ending: prior.delve?.encounter && !next.delve?.encounter
          ? finalBattleFrame(prior, events) : undefined,
      } : null);
      if (events.length) return true;
      const top = next.journal[0];
      if (action.type === 'auto-combat') {
        if (!next.delve?.encounter)
          audioService.playSound(top?.tone === 'risk' ? 'wrong' : 'correct');
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
    setBattleCue(null);
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
      className={'sa-app' + (mode === 'play' ? ' sa-playing' : '')}
      data-frontier-screen={mode}
      data-mini-game-scope="school-adventure"
      data-gamepad-navigation-root
    >
      {mode === 'create' ? (
        <Creator t={t} onBack={goToTitle} onBegin={begin} />
      ) : mode === 'play' && campaign ? (
        <AdventurePlay
          state={campaign}
          battleCue={battleCue}
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
        <FrontierTitleScreen
          t={t}
          slots={slots}
          hasStory={hasStory}
          back={onBack}
          create={() => setMode('create')}
          story={() => setMode('story')}
          resume={(slot) => open(slot, true)}
          remove={(id) => {
            if (!deleteAdventure(id)) return false;
            setSlots(loadAdventures());
            return true;
          }}
        />
      )}
    </div>
  );
}

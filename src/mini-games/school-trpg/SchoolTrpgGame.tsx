import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Brain,
  ChevronRight,
  Clock3,
  Compass,
  Footprints,
  HeartHandshake,
  LockKeyhole,
  MapPinned,
  RotateCcw,
  Search,
  Shield,
  Sparkles,
  Swords,
} from 'lucide-react';
import type { AnswerMode, AssignmentAnswerResult, AssignmentPayload, GameMode, LanguageMode } from '../../types';
import MiniGameProblemChallenge from '../../components/MiniGameProblemChallenge';
import EnemyIllustration from '../../components/EnemyIllustration';
import ResilientAssetImage from '../../components/ResilientAssetImage';
import { audioService } from '../../services/audioService';
import { assetUrl } from '../../utils/assetPaths';
import { getCardIllustrationPaths } from '../../utils/cardIllustration';
import {
  SCHOOL_TRPG_COPY,
  SCHOOL_TRPG_EVENTS,
  SCHOOL_TRPG_LOCATIONS,
  SCHOOL_TRPG_REWARDS,
  TRPG_STAT_COPY,
  getTrpgChapterLocations,
  getTrpgChapterRewards,
  getTrpgEnding,
  getTrpgEvent,
  getTrpgLocation,
  validateSchoolTrpgData,
} from './schoolTrpgData';
import {
  beginSchoolTrpgEvent,
  chooseSchoolTrpgReward,
  completeSchoolTrpgQuestion,
  continueSchoolTrpgResult,
  createSchoolTrpgCampaign,
  getQuestionGateCopy,
  getQuestionGateTitleCopy,
  getSchoolTrpgCombatResolutionCopy,
  getSchoolTrpgDataErrors,
  getSchoolTrpgProgress,
  performSchoolTrpgCombatAction,
  resolveSchoolTrpgChoice,
  startNextSchoolTrpgChapter,
} from './schoolTrpgEngine';
import { clearSchoolTrpgCampaign, loadSchoolTrpgCampaign, saveSchoolTrpgCampaign } from './schoolTrpgSave';
import {
  localizeTrpgCopy,
  trpgCopy,
  type TrpgCampaignState,
  type TrpgCombatActionId,
  type TrpgCopy,
  type TrpgLocation,
} from './schoolTrpgTypes';

interface SchoolTrpgGameProps {
  onBack: () => void;
  onFinish?: (result: 'WIN' | 'LOSE') => void;
  problemMode: GameMode;
  problemModePool?: string[];
  answerMode?: AnswerMode;
  assignment?: AssignmentPayload | null;
  onAnswerResult?: (result: AssignmentAnswerResult) => void;
  languageMode?: LanguageMode;
}

const GUARDIAN_NAME = trpgCopy('思い出の残滓', 'おもいでのざんし', 'MEMORY REMNANT');
const CLOCK_GUARDIAN_NAME = trpgCopy('時計塔の番人', 'とけいとうのばんにん', 'CLOCK TOWER GUARDIAN');

const UI_COPY = {
  prologue: trpgCopy('導入章', 'どうにゅうしょう', 'PROLOGUE'),
  chapterTwoLabel: trpgCopy('第2章', 'だいにしょう', 'CHAPTER 2'),
  route: trpgCopy('航路', 'こうろ', 'ROUTE'),
  location: trpgCopy('現在地', 'げんざいち', 'LOCATION'),
  clues: trpgCopy('手がかり', 'てがかり', 'CLUES'),
  stress: trpgCopy('疲労', 'ひろう', 'STRESS'),
  fate: trpgCopy('運命', 'うんめい', 'FATE'),
  stats: trpgCopy('能力', 'のうりょく', 'STATS'),
  log: trpgCopy('発見ログ', 'はっけんログ', 'DISCOVERY LOG'),
  danger: trpgCopy('危険度', 'きけんど', 'DANGER'),
  travelTime: trpgCopy('必要時間', 'ひつようじかん', 'TRAVEL TIME'),
  hour: trpgCopy('時間', 'じかん', 'TIME'),
  completed: trpgCopy('調査完了', 'ちょうさかんりょう', 'COMPLETE'),
  available: trpgCopy('移動可能', 'いどうかのう', 'AVAILABLE'),
  current: trpgCopy('選択中', 'せんたくちゅう', 'SELECTED'),
  check: trpgCopy('判定', 'はんてい', 'CHECK'),
  target: trpgCopy('目標', 'もくひょう', 'TARGET'),
  roll: trpgCopy('出目', 'でめ', 'ROLL'),
  success: trpgCopy('成功', 'せいこう', 'SUCCESS'),
  failure: trpgCopy('別ルートへ移行', 'べつルートへいこう', 'ALTERNATE ROUTE'),
  enemyIntent: trpgCopy('次の脅威', 'つぎのきょうい', 'NEXT THREAT'),
  enemyHp: trpgCopy('脅威', 'きょうい', 'THREAT'),
  insight: trpgCopy('調査', 'ちょうさ', 'INSIGHT'),
  resolve: trpgCopy('対話', 'たいわ', 'DIALOGUE'),
  turn: trpgCopy('ターン', 'ターン', 'TURN'),
  battleHint: trpgCopy('調査3以上で説得が安定します。3ターン目以降は安全に退避できます。', 'ちょうさ3いじょうでせっとくがあんていします。3ターンめいこうはあんぜんにたいひできます。', 'At 3 Insight, persuasion becomes reliable. Safe escape opens from turn 3.'),
  noSave: trpgCopy('続きの記録はありません。', 'つづきのきろくはありません。', 'No expedition save found.'),
  dataError: trpgCopy('TRPGデータの検証に失敗しました。', 'TRPGデータのけんしょうにしっぱいしました。', 'TRPG data validation failed.'),
};

const COMBAT_ACTIONS: Array<{
  id: TrpgCombatActionId;
  label: TrpgCopy;
  detail: TrpgCopy;
  icon: React.ComponentType<{ size?: number }>;
}> = [
  {
    id: 'STRIKE', icon: Swords,
    label: trpgCopy('封印攻撃', 'ふういんこうげき', 'SEAL STRIKE'),
    detail: trpgCopy('勇気とダイスで脅威を減らす。', 'ゆうきとダイスできょういをへらす。', 'Reduce Threat with Courage and a die roll.'),
  },
  {
    id: 'INVESTIGATE', icon: Search,
    label: trpgCopy('正体を調べる', 'しょうたいをしらべる', 'INVESTIGATE'),
    detail: trpgCopy('調査を3以上にして説得を開く。', 'ちょうさを3いじょうにしてせっとくをひらく。', 'Reach 3 Insight to open persuasion.'),
  },
  {
    id: 'PERSUADE', icon: HeartHandshake,
    label: trpgCopy('記憶へ呼びかける', 'きおくへよびかける', 'PERSUADE'),
    detail: trpgCopy('調査または合言葉を使って対話する。', 'ちょうさまたはあいことばをつかってたいわする。', 'Use Insight or the passphrase to build Dialogue.'),
  },
  {
    id: 'GUARD', icon: Shield,
    label: trpgCopy('仲間を守る', 'なかまをまもる', 'GUARD'),
    detail: trpgCopy('体力に応じて次の脅威を防ぐ。', 'たいりょくにおうじてつぎのきょういをふせぐ。', 'Block the next threat using Energy.'),
  },
  {
    id: 'ESCAPE', icon: Footprints,
    label: trpgCopy('記録を持って退避', 'きろくをもってたいひ', 'ESCAPE WITH NOTES'),
    detail: trpgCopy('3ターン目、調査4、手がかり5のいずれかで成功。', '3ターンめ、ちょうさ4、てがかり5のいずれかでせいこう。', 'Succeeds on turn 3, at 4 Insight, or with 5 Clues.'),
  },
];

const text = (copy: TrpgCopy, languageMode?: LanguageMode) => localizeTrpgCopy(copy, languageMode);

const SchoolTrpgBackdrop: React.FC<{ asset: string; className?: string }> = ({ asset, className = '' }) => (
  <ResilientAssetImage
    sources={[
      assetUrl(asset),
      assetUrl('sprites/backgrounds/learning-rogue/map-campus.webp'),
      assetUrl('sprites/backgrounds/mini-games/school-trpg.png'),
    ]}
    alt=""
    aria-hidden="true"
    className={`school-trpg-campaign-backdrop ${className}`}
  />
);

const StatStrip: React.FC<{ state: TrpgCampaignState; languageMode?: LanguageMode }> = ({ state, languageMode }) => (
  <div className="school-trpg-campaign-stats" aria-label={text(UI_COPY.stats, languageMode)}>
    {(Object.keys(state.stats) as Array<keyof typeof state.stats>).map(stat => (
      <div key={stat}>
        <span>{text(TRPG_STAT_COPY[stat], languageMode)}</span>
        <b>{state.stats[stat]}</b>
      </div>
    ))}
  </div>
);

const StatusBar: React.FC<{ state: TrpgCampaignState; languageMode?: LanguageMode }> = ({ state, languageMode }) => {
  const location = getTrpgLocation(state.currentLocationId);
  const progress = getSchoolTrpgProgress(state);
  return (
    <div className="school-trpg-campaign-statusbar">
      <div><span>{text(state.chapter === 1 ? UI_COPY.chapterTwoLabel : UI_COPY.prologue, languageMode)}</span><b>{progress.completed} / {progress.total}</b></div>
      <div><Clock3 size={15} /><span>{text(UI_COPY.hour, languageMode)}</span><b>{state.time}</b></div>
      <div><Brain size={15} /><span>{text(UI_COPY.clues, languageMode)}</span><b>{state.clues}</b></div>
      <div className={state.stress >= 5 ? 'is-danger' : ''}><span>{text(UI_COPY.stress, languageMode)}</span><b>{state.stress} / 6</b></div>
      <div><Sparkles size={15} /><span>{text(UI_COPY.fate, languageMode)}</span><b>{state.fate}</b></div>
      <div className="is-location"><MapPinned size={15} /><span>{text(UI_COPY.location, languageMode)}</span><b>{location ? text(location.shortName, languageMode) : '—'}</b></div>
      <div className="is-saved"><span>{text(SCHOOL_TRPG_COPY.saved, languageMode)}</span></div>
    </div>
  );
};

const MapScreen: React.FC<{
  state: TrpgCampaignState;
  selected: string;
  languageMode?: LanguageMode;
  onSelect: (locationId: string) => void;
  onTravel: (locationId: string) => void;
}> = ({ state, selected, languageMode, onSelect, onTravel }) => {
  const chapterLocations = getTrpgChapterLocations(state.chapter);
  const selectedLocation = chapterLocations.find(location => location.id === selected) || chapterLocations[0] || SCHOOL_TRPG_LOCATIONS[0];
  const unlocked = state.unlockedLocationIds.includes(selectedLocation.id);
  const completed = state.completedEventIds.includes(selectedLocation.eventId);
  return (
    <div className="school-trpg-campaign-layout map-mode">
      <section className="school-trpg-map-panel">
        <SchoolTrpgBackdrop asset="sprites/backgrounds/learning-rogue/map-campus.webp" />
        <div className="school-trpg-map-grid" aria-hidden="true" />
        <svg className="school-trpg-map-routes" viewBox="0 0 100 100" aria-hidden="true">
          <line x1="16" y1="66" x2="36" y2="42" />
          <line x1="36" y1="42" x2="54" y2="72" />
          <line x1="36" y1="42" x2="58" y2="24" />
          <line x1="54" y1="72" x2="76" y2="52" />
          <line x1="58" y1="24" x2="76" y2="52" />
          <line x1="76" y1="52" x2="88" y2="18" />
        </svg>
        <div className="school-trpg-map-heading">
          <span>ROUTE // {String(state.chapter).padStart(2, '0')}</span>
          <b>{text(SCHOOL_TRPG_COPY.map, languageMode)}</b>
        </div>
        {chapterLocations.map(location => {
          const isUnlocked = state.unlockedLocationIds.includes(location.id);
          const isCompleted = state.completedEventIds.includes(location.eventId);
          const isSelected = location.id === selected;
          return (
            <button
              key={location.id}
              type="button"
              className={[
                'school-trpg-map-node',
                isUnlocked ? 'is-unlocked' : 'is-locked',
                isCompleted ? 'is-completed' : '',
                isSelected ? 'is-selected' : '',
              ].filter(Boolean).join(' ')}
              style={{ left: `${location.x * 100}%`, top: `${location.y * 100}%` }}
              onClick={() => onSelect(location.id)}
              aria-label={`${text(location.name, languageMode)} / ${isUnlocked ? text(UI_COPY.available, languageMode) : text(SCHOOL_TRPG_COPY.locked, languageMode)}`}
            >
              <span className="school-trpg-map-node-icon">
                {isUnlocked
                  ? <img src={assetUrl(location.iconAsset)} alt="" aria-hidden="true" />
                  : <LockKeyhole size={18} />}
              </span>
              <b>{text(location.shortName, languageMode)}</b>
              <small>{isCompleted ? text(UI_COPY.completed, languageMode) : isUnlocked ? text(UI_COPY.available, languageMode) : 'LOCKED'}</small>
            </button>
          );
        })}
      </section>
      <aside className="school-trpg-command-panel">
        <div className="school-trpg-panel-eyebrow">LOCATION BRIEF</div>
        <h2>{text(selectedLocation.name, languageMode)}</h2>
        <p>{text(selectedLocation.description, languageMode)}</p>
        <div className="school-trpg-location-metrics">
          <span>{text(UI_COPY.danger, languageMode)} <b>{'◆'.repeat(selectedLocation.danger) || '—'}</b></span>
          <span>{text(UI_COPY.travelTime, languageMode)} <b>+{selectedLocation.travelCost}</b></span>
        </div>
        <div className="school-trpg-location-state">
          {completed ? text(SCHOOL_TRPG_COPY.revisit, languageMode) : unlocked ? text(UI_COPY.available, languageMode) : text(SCHOOL_TRPG_COPY.locked, languageMode)}
        </div>
        <button
          type="button"
          className="school-trpg-primary-button"
          disabled={!unlocked || completed}
          onClick={() => onTravel(selectedLocation.id)}
        >
          <Compass size={18} />
          {completed ? text(SCHOOL_TRPG_COPY.revisit, languageMode) : text(SCHOOL_TRPG_COPY.travel, languageMode)}
          <ChevronRight size={18} />
        </button>
        <div className="school-trpg-command-hint">{text(SCHOOL_TRPG_COPY.selectLocation, languageMode)}</div>
        <StatStrip state={state} languageMode={languageMode} />
      </aside>
    </div>
  );
};

const EventScreen: React.FC<{
  state: TrpgCampaignState;
  languageMode?: LanguageMode;
  useFate: boolean;
  onUseFate: () => void;
  onChoice: (choiceId: string) => void;
}> = ({ state, languageMode, useFate, onUseFate, onChoice }) => {
  const event = getTrpgEvent(state.currentEventId || '') || SCHOOL_TRPG_EVENTS[0];
  return (
    <div className="school-trpg-campaign-layout event-mode">
      <section className="school-trpg-scene-panel">
        <SchoolTrpgBackdrop asset={event.backgroundAsset} />
        <div className="school-trpg-scene-vignette" />
        {event.foregroundAsset && (
          <img className="school-trpg-scene-foreground" src={assetUrl(event.foregroundAsset)} alt="" aria-hidden="true" />
        )}
        <div className="school-trpg-scene-caption">
          <span>{text(event.eyebrow, languageMode)}</span>
          <b>{text(event.title, languageMode)}</b>
        </div>
      </section>
      <aside className="school-trpg-command-panel event-copy">
        <div className="school-trpg-panel-eyebrow">STORY EVENT // {event.id}</div>
        <h2>{text(event.title, languageMode)}</h2>
        <p>{text(event.body, languageMode)}</p>
        <button
          type="button"
          className={`school-trpg-fate-button ${useFate ? 'is-active' : ''}`}
          disabled={state.fate <= 0}
          onClick={onUseFate}
        >
          <Sparkles size={17} />
          {text(useFate ? SCHOOL_TRPG_COPY.fateReady : SCHOOL_TRPG_COPY.useFate, languageMode)}
          <b>{state.fate}</b>
        </button>
        <div className="school-trpg-choice-list">
          {event.choices.map((choice, index) => (
            <button key={choice.id} type="button" onClick={() => onChoice(choice.id)}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div><b>{text(choice.label, languageMode)}</b><small>{text(choice.detail, languageMode)}</small></div>
              <em>{text(TRPG_STAT_COPY[choice.stat], languageMode)} {choice.difficulty}</em>
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
};

const ResultScreen: React.FC<{
  state: TrpgCampaignState;
  languageMode?: LanguageMode;
  onContinue: () => void;
}> = ({ state, languageMode, onContinue }) => {
  const event = getTrpgEvent(state.currentEventId || '') || SCHOOL_TRPG_EVENTS[0];
  const result = state.result!;
  return (
    <div className="school-trpg-campaign-layout result-mode">
      <section className="school-trpg-scene-panel">
        <SchoolTrpgBackdrop asset={event.backgroundAsset} />
        <div className={`school-trpg-result-signal ${result.success ? 'is-success' : 'is-alternate'}`}>
          <span>{text(result.success ? UI_COPY.success : UI_COPY.failure, languageMode)}</span>
          <b>{result.total}</b>
          <small>{text(UI_COPY.target, languageMode)} {result.difficulty}</small>
        </div>
      </section>
      <aside className="school-trpg-command-panel result-copy">
        <div className="school-trpg-panel-eyebrow">CHECK RESOLUTION</div>
        <h2>{text(result.success ? UI_COPY.success : UI_COPY.failure, languageMode)}</h2>
        <p>{text(result.copy, languageMode)}</p>
        <div className="school-trpg-roll-formula">
          <span>{text(UI_COPY.roll, languageMode)} <b>{result.roll}</b></span>
          <span>{text(TRPG_STAT_COPY[result.stat], languageMode)} <b>+{result.statValue}</b></span>
          {result.fateBonus > 0 && <span>{text(UI_COPY.fate, languageMode)} <b>+{result.fateBonus}</b></span>}
          <strong>= {result.total}</strong>
        </div>
        <button type="button" className="school-trpg-primary-button" onClick={onContinue}>
          {text(SCHOOL_TRPG_COPY.continue, languageMode)} <ChevronRight size={18} />
        </button>
      </aside>
    </div>
  );
};

const CombatScreen: React.FC<{
  state: TrpgCampaignState;
  languageMode?: LanguageMode;
  cue: TrpgCombatActionId | null;
  onAction: (action: TrpgCombatActionId) => void;
}> = ({ state, languageMode, cue, onAction }) => {
  const combat = state.combat!;
  const canPersuade = combat.insight >= 3 || Boolean(state.flags.knowsPassphrase);
  const guardianName = state.chapter === 1 ? CLOCK_GUARDIAN_NAME : GUARDIAN_NAME;
  return (
    <div className="school-trpg-campaign-layout combat-mode">
      <section className={`school-trpg-combat-panel ${cue ? `cue-${cue.toLowerCase()}` : ''}`}>
        <SchoolTrpgBackdrop asset="sprites/backgrounds/learning-rogue/battle-hallway.webp" />
        <div className="school-trpg-combat-grid" />
        <div className="school-trpg-enemy-intent">
          <span>{text(UI_COPY.enemyIntent, languageMode)}</span>
          <b>{combat.enemyIntent}</b>
        </div>
        <EnemyIllustration
          name={text(guardianName, languageMode)}
          seed={`school-trpg-${state.seed}`}
          altText={text(guardianName, languageMode)}
          className="school-trpg-guardian"
          size={18}
        />
        <div className="school-trpg-enemy-name"><span>{state.chapter === 1 ? 'CLOCKWORK ENTITY' : 'MEMORY ENTITY'}</span><b>{text(guardianName, languageMode)}</b></div>
        <div className="school-trpg-combat-meters">
          <div><span>{text(UI_COPY.enemyHp, languageMode)}</span><i><em style={{ width: `${(combat.enemyHp / combat.enemyMaxHp) * 100}%` }} /></i><b>{combat.enemyHp}/{combat.enemyMaxHp}</b></div>
          <div><span>{text(UI_COPY.insight, languageMode)}</span><i><em className="insight" style={{ width: `${(combat.insight / 6) * 100}%` }} /></i><b>{combat.insight}/6</b></div>
          <div><span>{text(UI_COPY.resolve, languageMode)}</span><i><em className="resolve" style={{ width: `${(combat.resolve / 8) * 100}%` }} /></i><b>{combat.resolve}/8</b></div>
        </div>
        <div className="school-trpg-combat-cue" aria-hidden="true"><span /><i /><b /></div>
      </section>
      <aside className="school-trpg-command-panel combat-copy">
        <div className="school-trpg-panel-eyebrow">{text(UI_COPY.turn, languageMode)} {String(combat.turn).padStart(2, '0')}</div>
        <h2>{text(state.chapter === 1 ? SCHOOL_TRPG_COPY.chapterBattle : SCHOOL_TRPG_COPY.battle, languageMode)}</h2>
        <p>{text(UI_COPY.battleHint, languageMode)}</p>
        <div className="school-trpg-combat-actions">
          {COMBAT_ACTIONS.map(action => {
            const Icon = action.icon;
            const disabled = action.id === 'PERSUADE' && !canPersuade;
            return (
              <button key={action.id} type="button" disabled={disabled} onClick={() => onAction(action.id)}>
                <Icon size={18} />
                <span><b>{text(action.label, languageMode)}</b><small>{text(action.detail, languageMode)}</small></span>
              </button>
            );
          })}
        </div>
        <div className="school-trpg-combat-log">
          {combat.logs.slice(-3).reverse().map((entry, index) => <p key={`${entry.turn}-${index}`}><b>{String(entry.turn).padStart(2, '0')}</b>{text(entry.copy, languageMode)}</p>)}
        </div>
      </aside>
    </div>
  );
};

const RewardScreen: React.FC<{
  state: TrpgCampaignState;
  languageMode?: LanguageMode;
  onReward: (rewardId: string) => void;
}> = ({ state, languageMode, onReward }) => (
  <div className="school-trpg-reward-screen">
    <SchoolTrpgBackdrop asset="sprites/backgrounds/learning-rogue/reward-rooftop.webp" />
    <div className="school-trpg-reward-heading">
      <span>MISSION COMPLETE // {text(getSchoolTrpgCombatResolutionCopy(state.combat?.resolution || null), languageMode)}</span>
      <h2>{text(SCHOOL_TRPG_COPY.reward, languageMode)}</h2>
    </div>
    <div className="school-trpg-reward-cards">
      {getTrpgChapterRewards(state.chapter).map((reward, index) => (
        <button key={reward.id} type="button" onClick={() => onReward(reward.id)}>
          <div className="school-trpg-reward-art">
            <ResilientAssetImage
              sources={getCardIllustrationPaths(reward.id, reward.artName, [reward.artName])}
              alt={text(reward.name, languageMode)}
              fallback={<img src={assetUrl('sprites/backgrounds/mini-games/badges/school-trpg.png')} alt="" />}
            />
            <span>0{index + 1}</span>
          </div>
          <b>{text(reward.name, languageMode)}</b>
          <p>{text(reward.description, languageMode)}</p>
          <em>SELECT DISCOVERY</em>
        </button>
      ))}
    </div>
  </div>
);

const EndingScreen: React.FC<{
  state: TrpgCampaignState;
  languageMode?: LanguageMode;
  onFinish: () => void;
  onNextChapter: () => void;
  onReplay: () => void;
}> = ({ state, languageMode, onFinish, onNextChapter, onReplay }) => {
  const ending = getTrpgEnding(state.endingId) || getTrpgEnding('unfinished-map')!;
  const reward = getTrpgChapterRewards(state.chapter).find(candidate => candidate.id === state.selectedRewardId)
    || SCHOOL_TRPG_REWARDS.find(candidate => candidate.id === state.selectedRewardId);
  const chapterProgress = getSchoolTrpgProgress(state);
  return (
    <div className={`school-trpg-ending-screen tone-${ending.tone.toLowerCase()}`}>
      <SchoolTrpgBackdrop asset="sprites/backgrounds/learning-rogue/reward-rooftop.webp" />
      <div className="school-trpg-ending-seal"><span>ENDING</span><b>{String(Math.max(1, chapterProgress.total)).padStart(2, '0')}</b></div>
      <section>
        <div className="school-trpg-panel-eyebrow">{state.chapter === 1 ? 'CHAPTER 2 RESULT' : 'PROLOGUE RESULT'} // {text(getSchoolTrpgCombatResolutionCopy(state.combat?.resolution || null), languageMode)}</div>
        <h2>{text(ending.title, languageMode)}</h2>
        <h3>{text(ending.subtitle, languageMode)}</h3>
        <p>{text(ending.body, languageMode)}</p>
        {reward && <div className="school-trpg-ending-reward"><Sparkles size={18} /><span>{text(reward.name, languageMode)}</span></div>}
        <div className="school-trpg-ending-actions">
          {state.chapter === 0 && <button type="button" className="school-trpg-primary-button" onClick={onNextChapter}>{text(SCHOOL_TRPG_COPY.nextChapter, languageMode)}<ChevronRight size={18} /></button>}
          <button type="button" className="school-trpg-primary-button" onClick={onFinish}>{text(SCHOOL_TRPG_COPY.finish, languageMode)}<ChevronRight size={18} /></button>
          <button type="button" className="school-trpg-secondary-button" onClick={onReplay}><RotateCcw size={17} />{text(SCHOOL_TRPG_COPY.replay, languageMode)}</button>
        </div>
      </section>
    </div>
  );
};

const StartScreen: React.FC<{
  saved: TrpgCampaignState | null;
  languageMode?: LanguageMode;
  onBack: () => void;
  onNew: () => void;
  onContinue: () => void;
  dataErrors: string[];
}> = ({ saved, languageMode, onBack, onNew, onContinue, dataErrors }) => (
  <main className="school-trpg-campaign-shell is-start">
    <SchoolTrpgBackdrop asset="sprites/backgrounds/mini-games/school-trpg.png" />
    <header className="school-trpg-campaign-header">
      <button type="button" onClick={onBack} aria-label={text(SCHOOL_TRPG_COPY.exit, languageMode)}><ArrowLeft size={20} /><span>{text(SCHOOL_TRPG_COPY.exit, languageMode)}</span></button>
      <div><small>LEARNING ROGUE // STORY EXPEDITION</small><b>{text(SCHOOL_TRPG_COPY.title, languageMode)}</b></div>
      <span>CAMPAIGN 00</span>
    </header>
    <div className="school-trpg-start-layout">
      <section className="school-trpg-start-art">
        <img src={assetUrl('sprites/backgrounds/mini-games/foreground/school-trpg.png')} alt="" aria-hidden="true" />
        <div><span>OPEN CAMPUS ADVENTURE</span><b>{text(SCHOOL_TRPG_COPY.campaign, languageMode)}</b></div>
      </section>
      <section className="school-trpg-start-copy">
        <div className="school-trpg-panel-eyebrow">CAMPAIGN BRIEFING</div>
        <h1>{text(SCHOOL_TRPG_COPY.campaign, languageMode)}</h1>
        <p>{text(SCHOOL_TRPG_COPY.intro, languageMode)}</p>
        <div className="school-trpg-start-specs"><span>6 LOCATIONS</span><span>2 QUIZ GATES</span><span>4 ENDINGS</span></div>
        {dataErrors.length > 0 && <div className="school-trpg-data-error"><b>{text(UI_COPY.dataError, languageMode)}</b>{dataErrors.map(error => <span key={error}>{error}</span>)}</div>}
        <div className="school-trpg-start-actions">
          {saved && <button type="button" className="school-trpg-primary-button" disabled={dataErrors.length > 0} onClick={onContinue}><MapPinned size={18} />{text(SCHOOL_TRPG_COPY.continueCampaign, languageMode)}<ChevronRight size={18} /></button>}
          <button type="button" className={saved ? 'school-trpg-secondary-button' : 'school-trpg-primary-button'} disabled={dataErrors.length > 0} onClick={onNew}><Compass size={18} />{text(SCHOOL_TRPG_COPY.newCampaign, languageMode)}</button>
        </div>
        {!saved && <small>{text(UI_COPY.noSave, languageMode)}</small>}
      </section>
    </div>
  </main>
);

const SchoolTrpgGame = ({
  onBack,
  onFinish,
  problemMode,
  problemModePool,
  answerMode = 'CHOICE',
  assignment,
  onAnswerResult,
  languageMode = 'JAPANESE',
}: SchoolTrpgGameProps) => {
  const [savedAtOpen, setSavedAtOpen] = useState<TrpgCampaignState | null>(() => loadSchoolTrpgCampaign());
  const [state, setState] = useState<TrpgCampaignState | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState(savedAtOpen?.currentLocationId || 'classroom');
  const [useFate, setUseFate] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [combatCue, setCombatCue] = useState<TrpgCombatActionId | null>(null);
  const cueTimer = useRef<number | null>(null);
  const dataErrors = useMemo(() => [...validateSchoolTrpgData(), ...getSchoolTrpgDataErrors()], []);

  useEffect(() => {
    if (!state) return;
    saveSchoolTrpgCampaign(state);
  }, [state]);

  useEffect(() => {
    if (!state) {
      void audioService.playBGM('menu');
      return;
    }
    const bgm = state.phase === 'MAP'
      ? 'map'
      : state.phase === 'COMBAT'
        ? 'battle'
        : state.phase === 'QUESTION'
          ? 'math'
          : state.phase === 'REWARD'
            ? 'reward'
            : state.phase === 'ENDING'
              ? state.combat?.result === 'LOSE' ? 'game_over' : 'victory'
              : 'event';
    void audioService.playBGM(bgm);
  }, [state?.phase, state?.combat?.result]);

  useEffect(() => () => {
    if (cueTimer.current !== null) window.clearTimeout(cueTimer.current);
  }, []);

  const startNew = () => {
    clearSchoolTrpgCampaign();
    const campaign = createSchoolTrpgCampaign(Date.now());
    setSavedAtOpen(null);
    setSelectedLocationId('classroom');
    setUseFate(false);
    setState(campaign);
    audioService.playSound('select');
  };

  const continueSaved = () => {
    if (!savedAtOpen) return;
    setState(savedAtOpen);
    setSelectedLocationId(savedAtOpen.currentLocationId);
    audioService.playSound('select');
  };

  const showCombatCue = (action: TrpgCombatActionId) => {
    if (cueTimer.current !== null) window.clearTimeout(cueTimer.current);
    setCombatCue(action);
    cueTimer.current = window.setTimeout(() => {
      setCombatCue(null);
      cueTimer.current = null;
    }, action === 'STRIKE' ? 850 : 650);
  };

  const combatAction = (action: TrpgCombatActionId) => {
    if (!state) return;
    if (action === 'STRIKE') audioService.playAttackEffectSound('impact', 1);
    else if (action === 'GUARD') audioService.playBattleSound('block');
    else if (action === 'PERSUADE') audioService.playBattleSound('buff');
    else audioService.playBattleSound('select');
    showCombatCue(action);
    setState(performSchoolTrpgCombatAction(state, action));
  };

  const resetCampaign = () => {
    clearSchoolTrpgCampaign();
    setState(null);
    setSavedAtOpen(null);
    setShowReset(false);
    setSelectedLocationId('classroom');
  };

  if (!state) return <StartScreen saved={savedAtOpen} languageMode={languageMode} onBack={onBack} onNew={startNew} onContinue={continueSaved} dataErrors={dataErrors} />;

  const finishResult = state.combat?.result === 'LOSE' ? 'LOSE' : 'WIN';
  const finishCampaign = () => {
    if (onFinish) onFinish(finishResult);
    else onBack();
  };

  return (
    <main className="school-trpg-campaign-shell is-playing" data-gamepad-navigation-root data-gamepad-initial-scope="school-trpg-campaign">
      <SchoolTrpgBackdrop asset="sprites/backgrounds/mini-games/school-trpg.png" className="shell-background" />
      <header className="school-trpg-campaign-header">
        <button type="button" onClick={onBack} aria-label={text(SCHOOL_TRPG_COPY.exit, languageMode)}><ArrowLeft size={20} /><span>{text(SCHOOL_TRPG_COPY.exit, languageMode)}</span></button>
        <div><small>LEARNING ROGUE // STORY EXPEDITION</small><b>{text(SCHOOL_TRPG_COPY.title, languageMode)}</b></div>
        <span>{text(state.chapter === 1 ? SCHOOL_TRPG_COPY.chapterTwo : UI_COPY.prologue, languageMode)} // {String(state.chapter).padStart(2, '0')}</span>
        <button type="button" className="is-reset" onClick={() => setShowReset(true)} aria-label={text(SCHOOL_TRPG_COPY.abandon, languageMode)}><RotateCcw size={18} /></button>
      </header>
      <StatusBar state={state} languageMode={languageMode} />
      <div className="school-trpg-campaign-main">
        {state.phase === 'MAP' && (
          <MapScreen
            state={state}
            selected={selectedLocationId}
            languageMode={languageMode}
            onSelect={locationId => { setSelectedLocationId(locationId); audioService.playSound('select'); }}
            onTravel={locationId => {
              setState(beginSchoolTrpgEvent(state, locationId));
              setUseFate(false);
              audioService.playSound('select');
            }}
          />
        )}
        {state.phase === 'EVENT' && <EventScreen state={state} languageMode={languageMode} useFate={useFate} onUseFate={() => setUseFate(current => !current)} onChoice={choiceId => {
          const nextState = resolveSchoolTrpgChoice(state, choiceId, useFate);
          audioService.playSound(nextState.result?.success ? 'correct' : 'wrong');
          setUseFate(false);
          setState(nextState);
        }} />}
        {state.phase === 'RESULT' && <ResultScreen state={state} languageMode={languageMode} onContinue={() => setState(continueSchoolTrpgResult(state))} />}
        {state.phase === 'COMBAT' && <CombatScreen state={state} languageMode={languageMode} cue={combatCue} onAction={combatAction} />}
        {state.phase === 'REWARD' && <RewardScreen state={state} languageMode={languageMode} onReward={rewardId => {
          audioService.playSound('buff');
          setState(chooseSchoolTrpgReward(state, rewardId));
        }} />}
        {state.phase === 'ENDING' && <EndingScreen
          state={state}
          languageMode={languageMode}
          onFinish={finishCampaign}
          onNextChapter={() => {
            const nextState = startNextSchoolTrpgChapter(state);
            setSelectedLocationId(nextState.currentLocationId);
            setState(nextState);
            audioService.playSound('select');
          }}
          onReplay={startNew}
        />}
      </div>
      <footer className="school-trpg-campaign-footer">
        <div><BookOpen size={15} /><span>{text(UI_COPY.log, languageMode)}</span><p>{state.discoveryLog.length ? text(state.discoveryLog[state.discoveryLog.length - 1], languageMode) : '—'}</p></div>
        <div className="school-trpg-footer-route"><span>{text(UI_COPY.route, languageMode)}</span><b>{getSchoolTrpgProgress(state).percent}%</b></div>
      </footer>
      {state.phase === 'QUESTION' && state.pendingQuestionGate && (
        <div className="school-trpg-question-overlay" role="dialog" aria-modal="true" data-gamepad-modal="true">
          <div className="school-trpg-question-brand">
            <span>{text(getQuestionGateCopy(state.pendingQuestionGate), languageMode)}</span>
            <b>{text(getQuestionGateTitleCopy(state.pendingQuestionGate), languageMode)}</b>
            <small>{text(SCHOOL_TRPG_COPY.questionHint, languageMode)}</small>
          </div>
          <div className="school-trpg-question-content">
            <MiniGameProblemChallenge
              mode={problemMode}
              modePool={problemModePool}
              answerMode={answerMode}
              assignment={assignment}
              onAnswerResult={onAnswerResult}
              languageMode={languageMode}
              onComplete={correctCount => setState(current => current ? completeSchoolTrpgQuestion(current, correctCount) : current)}
              rewardHint={text(getQuestionGateCopy(state.pendingQuestionGate), languageMode)}
            />
          </div>
        </div>
      )}
      {showReset && (
        <div className="school-trpg-confirm-overlay" role="dialog" aria-modal="true" data-gamepad-modal="true">
          <section>
            <RotateCcw size={30} />
            <h2>{text(SCHOOL_TRPG_COPY.abandon, languageMode)}</h2>
            <p>{text(SCHOOL_TRPG_COPY.abandonConfirm, languageMode)}</p>
            <div>
              <button type="button" className="school-trpg-danger-button" onClick={resetCampaign}>{text(SCHOOL_TRPG_COPY.abandon, languageMode)}</button>
              <button type="button" className="school-trpg-secondary-button" onClick={() => setShowReset(false)}>{text(SCHOOL_TRPG_COPY.cancel, languageMode)}</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
};

export default SchoolTrpgGame;

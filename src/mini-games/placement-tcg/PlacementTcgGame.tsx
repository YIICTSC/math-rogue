import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { LanguageMode } from '../../types';
import type { AnswerMode, AssignmentAnswerResult, AssignmentPayload, AttackEffectKey, GameMode } from '../../types';
import ResilientAssetImage from '../../components/ResilientAssetImage';
import MiniGameProblemChallenge from '../../components/MiniGameProblemChallenge';
import { assetUrl } from '../../utils/assetPaths';
import { getCardIllustrationPaths } from '../../utils/cardIllustration';
import { trans } from '../../utils/textUtils';
import { audioService } from '../../services/audioService';
import {
  PLACEMENT_TCG_CARD_MAP,
  type PlacementCardDefinition,
} from './placementTcgCards';
import {
  addRewardAndAdvance,
  attackPlacementLane,
  clearPlacementRun,
  createNewPlacementRun,
  createPlacementBattle,
  createRewardChoices,
  endPlayerTurn,
  getCurrentOpponent,
  getUnitAttack,
  getUnitMaxHealth,
  loadPlacementRun,
  playPlacementCard,
  runCpuTurn,
  savePlacementRun,
  type PlacementBattle,
  type PlacementActionCue,
  type PlacementLane,
  type PlacementRun,
  type PlacementSideKey,
} from './placementTcgEngine';
import {
  getPlacementOpponentPortraitStyle,
  type PlacementTcgOpponent,
} from './placementTcgOpponents';

interface PlacementTcgGameProps {
  onBack: () => void;
  onFinish?: (result: 'WIN' | 'LOSE') => void;
  languageMode?: LanguageMode;
  problemMode?: GameMode;
  problemModePool?: string[];
  answerMode?: AnswerMode;
  assignment?: AssignmentPayload | null;
  onAnswerResult?: (result: AssignmentAnswerResult) => void;
}

const KIND_LABEL: Record<PlacementCardDefinition['kind'], string> = {
  UNIT: 'UNIT',
  SUPPORT: 'SUPPORT',
  EVENT: 'EVENT',
};

const LANE_NAMES = ['LEFT', 'CENTER', 'RIGHT'];

const copy = (languageMode: LanguageMode | undefined, jp: string, hira: string, en: string) =>
  languageMode === 'ENGLISH' ? en : languageMode === 'HIRAGANA' ? hira : jp;

const localizedTcgText = (value: string, languageMode?: LanguageMode) => {
  if (!languageMode || languageMode === 'JAPANESE') return value;
  if (languageMode === 'ENGLISH') return trans(value, 'ENGLISH');
  return trans(value, 'HIRAGANA')
    .replace(/退場/g, 'たいじょう')
    .replace(/各ターン/g, 'かくターン')
    .replace(/相手/g, 'あいて')
    .replace(/各/g, 'かく')
    .replace(/同じ/g, 'おなじ')
    .replace(/最初/g, 'さいしょ')
    .replace(/受ける/g, 'うける')
    .replace(/選び/g, 'えらび')
    .replace(/選ん/g, 'えらん')
    .replace(/直接/g, 'ちょくせつ')
    .replace(/最大/g, 'さいだい')
    .replace(/増え/g, 'ふえ')
    .replace(/消費/g, 'しょうひ')
    .replace(/必要/g, 'ひつよう')
    .replace(/対象/g, 'たいしょう')
    .replace(/効果/g, 'こうか')
    .replace(/発動/g, 'はつどう')
    .replace(/手札/g, 'てふだ')
    .replace(/配置先/g, 'はいちさき')
    .replace(/選択/g, 'せんたく')
    .replace(/開始/g, 'かいし')
    .replace(/終了/g, 'しゅうりょう')
    .replace(/勝利/g, 'しょうり')
    .replace(/敗北/g, 'はいぼく')
    .replace(/対戦/g, 'たいせん')
    .replace(/戦/g, 'せん')
    .replace(/枚/g, 'まい')
    .replace(/体/g, 'たい')
    .replace(/点/g, 'てん')
    .replace(/数/g, 'すう')
    .replace(/取る/g, 'とる')
    .replace(/使う/g, 'つかう')
    .replace(/選ぶ/g, 'えらぶ')
    .replace(/戻す/g, 'もどす')
    .replace(/与える/g, 'あたえる')
    .replace(/減らす/g, 'へらす');
};

const localizedCardName = (card: PlacementCardDefinition, languageMode?: LanguageMode) =>
  trans(card.name, languageMode || 'JAPANESE');

const getCard = (cardId: string): PlacementCardDefinition | null =>
  PLACEMENT_TCG_CARD_MAP.get(cardId) || null;

const attackSoundForCard = (card: PlacementCardDefinition | null): AttackEffectKey => {
  switch (card?.effect) {
    case 'PIERCE': return 'projectile';
    case 'THORNS': return 'shockwave';
    case 'RUSH': return 'slash';
    default: return 'impact';
  }
};

const playPlacementEffectSound = (card: PlacementCardDefinition | null) => {
  if (!card) {
    audioService.playBattleSound('select');
    return;
  }
  switch (card.effect) {
    case 'DEPLOY_DAMAGE':
    case 'EVENT_DAMAGE':
      audioService.playAttackEffectSound('fire');
      break;
    case 'EVENT_STUN':
    case 'EVENT_BREAK':
    case 'EVENT_BOUNCE':
      audioService.playBattleSound('debuff');
      break;
    case 'EVENT_MOVE':
      audioService.playAttackEffectSound('wind');
      break;
    case 'EVENT_HEAL':
    case 'EVENT_BUFF':
    case 'EVENT_ENERGY':
    case 'EVENT_SHIELD':
    case 'DEPLOY_HEAL':
      audioService.playBattleSound('buff');
      break;
    case 'EVENT_DRAW':
      audioService.playBattleSound('select');
      break;
    default:
      audioService.playBattleSound('select');
  }
};

const CardArt: React.FC<{ card: PlacementCardDefinition; compact?: boolean; languageMode?: LanguageMode }> = ({ card, compact, languageMode }) => (
  <div className={'placement-tcg-card-art ' + (compact ? 'is-compact' : '')}>
    <ResilientAssetImage
      sources={getCardIllustrationPaths(card.sourceCardId, card.name, [card.name])}
      alt={localizedCardName(card, languageMode)}
      className="placement-tcg-card-sprite"
      fallback={<div className="placement-tcg-card-art-fallback">{localizedCardName(card, languageMode).slice(0, 1)}</div>}
    />
    <div className="placement-tcg-art-scan" />
  </div>
);

const CardFace: React.FC<{
  card: PlacementCardDefinition;
  selected?: boolean;
  disabled?: boolean;
  languageMode?: LanguageMode;
  onSelect?: () => void;
  onInspect?: () => void;
  reward?: boolean;
}> = ({ card, selected, disabled, languageMode, onSelect, onInspect, reward }) => {
  const cardName = localizedCardName(card, languageMode);
  return (
  <div
    className={[
      'placement-tcg-card',
      'kind-' + card.kind.toLowerCase(),
      'tier-' + card.tier.toLowerCase(),
      selected ? 'is-selected' : '',
      disabled ? 'is-disabled' : '',
      reward ? 'is-reward' : '',
    ].join(' ')}
    role={onSelect ? 'button' : undefined}
    tabIndex={onSelect ? 0 : undefined}
    onClick={onSelect}
    onKeyDown={event => {
      if (onSelect && (event.key === 'Enter' || event.key === ' ')) onSelect();
    }}
  >
    <div className="placement-tcg-card-topline">
      <span className="placement-tcg-card-cost">{card.spCost}</span>
      <span className="placement-tcg-card-kind">{KIND_LABEL[card.kind]}</span>
      {onInspect && (
        <button
          type="button"
          className="placement-tcg-inspect-button"
          aria-label={copy(languageMode, cardName + 'の詳細', cardName + 'のしょうさい', cardName + ' details')}
          onClick={event => {
            event.stopPropagation();
            onInspect();
          }}
        >
          i
        </button>
      )}
    </div>
    <CardArt card={card} languageMode={languageMode} />
    <div className="placement-tcg-card-name">{cardName}</div>
    <div className="placement-tcg-card-rules">
      {languageMode === 'ENGLISH' ? card.rulesText.en : localizedTcgText(card.rulesText.jp, languageMode)}
    </div>
    <div className="placement-tcg-card-stats">
      {card.kind === 'UNIT' && <><span>ATK {card.attack}</span><span>HP {card.health}</span></>}
      {card.kind === 'SUPPORT' && <span>DUR {card.durability}</span>}
      {card.kind === 'EVENT' && <span>ONE SHOT</span>}
    </div>
  </div>
  );
};

const UnitChip: React.FC<{
  lane: PlacementLane;
  laneIndex: number;
  owner: PlacementSideKey;
  languageMode?: LanguageMode;
  canAttack?: boolean;
  onClick?: () => void;
  onInspect: (card: PlacementCardDefinition) => void;
}> = ({ lane, laneIndex, owner, languageMode, canAttack, onClick, onInspect }) => {
  const card = lane.unit ? getCard(lane.unit.cardId) : null;
  if (!lane.unit || !card) {
    return <div className="placement-tcg-empty-unit"><span>UNIT SLOT</span></div>;
  }
  const maxHealth = getUnitMaxHealth(lane, laneIndex);
  const attack = getUnitAttack(lane, laneIndex);
  return (
    <button
      type="button"
      className={[
        'placement-tcg-unit-chip',
        owner,
        canAttack ? 'can-attack' : '',
        lane.unit.stunned ? 'is-stunned' : '',
      ].join(' ')}
      onClick={onClick}
      onContextMenu={event => {
        event.preventDefault();
        onInspect(card);
      }}
      aria-label={localizedCardName(card, languageMode) + (canAttack ? copy(languageMode, 'で攻撃', 'でこうげき', ' attack') : '')}
    >
      <CardArt card={card} compact languageMode={languageMode} />
      <div className="placement-tcg-unit-copy">
        <strong>{localizedCardName(card, languageMode)}</strong>
        <span>{lane.unit.stunned ? 'STUN' : lane.unit.ready ? 'READY' : 'REST'}</span>
      </div>
      <div className="placement-tcg-unit-stats">
        <span className="attack">⚔ {attack}</span>
        <span className="health">♥ {Math.max(0, lane.unit.health)}/{maxHealth}</span>
        {lane.unit.shield > 0 && <span className="shield">◆ {lane.unit.shield}</span>}
      </div>
    </button>
  );
};

const SupportChip: React.FC<{
  lane: PlacementLane;
  languageMode?: LanguageMode;
  onInspect: (card: PlacementCardDefinition) => void;
}> = ({ lane, languageMode, onInspect }) => {
  const card = lane.support ? getCard(lane.support.cardId) : null;
  if (!lane.support || !card) return <div className="placement-tcg-empty-support">SUPPORT</div>;
  return (
    <button
      type="button"
      className="placement-tcg-support-chip"
      onClick={() => onInspect(card)}
    >
      <span>{localizedCardName(card, languageMode)}</span>
      <b>DUR {lane.support.durability}</b>
    </button>
  );
};

const LifeGauge: React.FC<{ label: string; life: number; tone: 'cyan' | 'red' }> = ({ label, life, tone }) => (
  <div className={'placement-tcg-life ' + tone}>
    <div><span>{label}</span><b>{Math.max(0, life)} / 20</b></div>
    <div className="placement-tcg-life-track">
      <i style={{ width: Math.max(0, Math.min(100, life * 5)) + '%' }} />
    </div>
  </div>
);

const RulesPanel: React.FC<{ languageMode?: LanguageMode; onClose: () => void }> = ({ languageMode, onClose }) => (
  <div className="placement-tcg-modal-backdrop" role="dialog" aria-modal="true">
    <section className="placement-tcg-modal placement-tcg-rules-modal">
      <button type="button" className="placement-tcg-modal-close" onClick={onClose}>×</button>
      <p className="placement-tcg-eyebrow">TACTICAL FIELD MANUAL</p>
      <h2>{copy(languageMode, '配置型TCG ルール', 'はいちがたTCG ルール', 'Placement TCG Rules')}</h2>
      <div className="placement-tcg-rule-grid">
        <article><b>{copy(languageMode, '01 / 配置', '01 / はいち', '01 / DEPLOY')}</b><p>{copy(languageMode, '手札を選択し、3レーンのいずれかを選択。ユニットとサポートは各レーン1枚ずつです。', 'てふだをえらび、3レーンのどれかをえらびます。ユニットとサポートはそれぞれ1まいです。', 'Choose a card, then choose one of three lanes. Each lane holds one unit and one support.')}</p></article>
        <article><b>{copy(languageMode, '02 / 攻撃', '02 / こうげき', '02 / ATTACK')}</b><p>{copy(languageMode, 'READYの味方ユニットを押すと正面へ攻撃。敵がいなければ相手ライフへ直接攻撃します。', 'READYのなかまユニットをおすとまえへこうげき。てきがいなければあいてのライフへちょくせつこうげきします。', 'Click a READY unit to attack forward. If no enemy is present, hit the opponent life directly.')}</p></article>
        <article><b>{copy(languageMode, '03 / SP', '03 / SP', '03 / SP')}</b><p>{copy(languageMode, 'カード使用でSPを消費。最大SPはターンごとに増え、開始時に全回復します。', 'カードをつかうとSPをつかいます。さいだいSPはターンごとにふえ、はじめにぜんかいふくします。', 'Cards spend SP. Maximum SP increases each turn and fully refreshes at the start.')}</p></article>
        <article><b>{copy(languageMode, '04 / 勝ち抜き', '04 / かちぬき', '04 / GAUNTLET')}</b><p>{copy(languageMode, 'ランダムなライバル9人を倒し、10戦目の校長を撃破。勝利ごとに新カードを1枚獲得します。', 'ランダムなライバル9にんをたおし、10せんめのこうちょうをげきは。かちごとにあたらしいカードを1まいえらびます。', 'Defeat nine random rivals, then the principal in battle ten. Each win lets you add one new card.')}</p></article>
      </div>
      <button type="button" className="placement-tcg-primary-button" onClick={onClose}>{copy(languageMode, 'DUELへ戻る', 'DUELへもどる', 'RETURN TO DUEL')}</button>
    </section>
  </div>
);

const InspectPanel: React.FC<{
  card: PlacementCardDefinition;
  languageMode?: LanguageMode;
  onClose: () => void;
}> = ({ card, languageMode, onClose }) => (
  <div className="placement-tcg-modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
    <section className="placement-tcg-modal placement-tcg-inspect-modal" onClick={event => event.stopPropagation()}>
      <button type="button" className="placement-tcg-modal-close" onClick={onClose}>×</button>
      <CardFace card={card} languageMode={languageMode} />
      <div className="placement-tcg-inspect-copy">
        <p className="placement-tcg-eyebrow">{card.tier} // {card.kind}</p>
        <h2>{card.name}</h2>
        <p>{languageMode === 'ENGLISH' ? card.rulesText.en : languageMode === 'HIRAGANA' ? trans(card.rulesText.jp, 'HIRAGANA') : card.rulesText.jp}</p>
        <dl>
          <div><dt>COST</dt><dd>{card.spCost} SP</dd></div>
          <div><dt>SOURCE</dt><dd>{card.sourceCardId}</dd></div>
          <div><dt>CARD ID</dt><dd>{card.id}</dd></div>
        </dl>
      </div>
    </section>
  </div>
);

const LaneFxOverlay: React.FC<{
  cue: PlacementActionCue | null;
  owner: PlacementSideKey;
  laneIndex: number;
  languageMode?: LanguageMode;
}> = ({ cue, owner, laneIndex, languageMode }) => {
  if (!cue || cue.laneIndex !== laneIndex) return null;
  const card = getCard(cue.cardId);
  const isActor = cue.side === owner;
  const isAttack = cue.type === 'ATTACK';
  const tone = isAttack ? (isActor ? 'attack' : 'impact') : 'deploy';
  const label = isAttack
    ? isActor
      ? copy(languageMode, '攻撃', 'こうげき', 'ATTACK')
      : cue.direct
        ? copy(languageMode, '直撃', 'ちょくげき', 'DIRECT HIT')
        : copy(languageMode, '被ダメージ', 'ひダメージ', 'IMPACT')
    : copy(languageMode, '効果発動', 'こうかはつどう', 'EFFECT');
  const amount = isAttack
    ? (isActor ? String(cue.amount) : `−${cue.amount}`)
    : (card ? localizedCardName(card, languageMode) : '');
  return (
    <div className={'placement-tcg-lane-fx ' + tone} aria-hidden="true">
      <i />
      <b>{label}</b>
      <span>{amount}</span>
    </div>
  );
};

const DuelBoard: React.FC<{
  battle: PlacementBattle;
  languageMode?: LanguageMode;
  selectedCard: PlacementCardDefinition | null;
  activeCue: PlacementActionCue | null;
  onLane: (laneIndex: number) => void;
  onAttack: (laneIndex: number) => void;
  onInspect: (card: PlacementCardDefinition) => void;
}> = ({ battle, languageMode, selectedCard, activeCue, onLane, onAttack, onInspect }) => (
  <div className="placement-tcg-board">
    <div className="placement-tcg-lane-labels">
      {LANE_NAMES.map((name, index) => <span key={name}>0{index + 1} // {name}</span>)}
    </div>
    <div className="placement-tcg-board-half enemy">
      {battle.cpu.lanes.map((lane, laneIndex) => (
        <div className="placement-tcg-lane" key={'enemy-' + laneIndex}>
          <SupportChip lane={lane} languageMode={languageMode} onInspect={onInspect} />
          <UnitChip lane={lane} laneIndex={laneIndex} owner="cpu" languageMode={languageMode} onInspect={onInspect} />
          <LaneFxOverlay cue={activeCue} owner="cpu" laneIndex={laneIndex} languageMode={languageMode} />
        </div>
      ))}
    </div>
    <div className="placement-tcg-midline">
      <span>ENEMY TERRITORY</span><i /><b>TACTICAL LINK</b><i /><span>YOUR TERRITORY</span>
    </div>
    <div className="placement-tcg-board-half player">
      {battle.player.lanes.map((lane, laneIndex) => {
        const canAttack = battle.turn === 'PLAYER' && Boolean(lane.unit?.ready && !lane.unit?.stunned);
        return (
          <div
            className={'placement-tcg-lane ' + (selectedCard ? 'is-targetable' : '')}
            key={'player-' + laneIndex}
            onClick={() => {
              if (selectedCard) onLane(laneIndex);
            }}
          >
              <UnitChip
                lane={lane}
                laneIndex={laneIndex}
                owner="player"
                languageMode={languageMode}
              canAttack={canAttack}
              onClick={() => {
                if (!selectedCard) onAttack(laneIndex);
              }}
              onInspect={onInspect}
            />
            <SupportChip lane={lane} languageMode={languageMode} onInspect={onInspect} />
            {selectedCard && <div className="placement-tcg-target-overlay">DEPLOY 0{laneIndex + 1}</div>}
            <LaneFxOverlay cue={activeCue} owner="player" laneIndex={laneIndex} languageMode={languageMode} />
          </div>
        );
      })}
    </div>
  </div>
);

const StartOverlay: React.FC<{
  savedRun: PlacementRun | null;
  languageMode?: LanguageMode;
  onStart: (continueSaved: boolean) => void;
  onBack: () => void;
}> = ({ savedRun, languageMode, onStart, onBack }) => (
  <div className="placement-tcg-start-overlay">
    <div className="placement-tcg-start-mark">LR // TCG</div>
    <p className="placement-tcg-eyebrow">AFTER SCHOOL CARD PROTOCOL</p>
    <h1>TACTICAL<br /><em>CLASSROOM</em></h1>
    <p className="placement-tcg-start-lead">
      {copy(languageMode, '3つのレーンを制圧し、9人のライバルと最後に待つ校長を撃破せよ。\n      学習ローグのカードイラストを使った、独立ルールの配置型TCG。', '3つのレーンをせいあつし、9にんのライバルとさいごにまつこうちょうをげきはせよ。\n      がくしゅうローグのカードイラストをつかった、どくりつルールのはいちがたTCG。', 'Control three lanes, defeat nine rivals, and take down the principal waiting at the end.\n      A standalone placement TCG using Learning Rogue card art.')}
    </p>
    <div className="placement-tcg-start-specs">
      <span><b>200</b> CARDS</span>
      <span><b>10</b> BATTLES</span>
      <span><b>3</b> LANES</span>
    </div>
    <div className="placement-tcg-start-actions">
      {savedRun && savedRun.battleIndex < 10 && (
        <button type="button" className="placement-tcg-primary-button" onClick={() => onStart(true)}>
          {copy(languageMode, `CONTINUE // 第${savedRun.battleIndex + 1}戦`, `つづける // ${savedRun.battleIndex + 1}せんめ`, `CONTINUE // BATTLE ${savedRun.battleIndex + 1}`)}
        </button>
      )}
      <button type="button" className="placement-tcg-secondary-button" onClick={() => onStart(false)}>
        NEW RUN
      </button>
      <button type="button" className="placement-tcg-text-button" onClick={onBack}>{copy(languageMode, 'ミニゲーム選択へ戻る', 'ミニゲームせんたくへもどる', 'BACK TO MINI-GAMES')}</button>
    </div>
  </div>
);

const RewardOverlay: React.FC<{
  choices: string[];
  languageMode?: LanguageMode;
  onChoose: (cardId: string) => void;
}> = ({ choices, languageMode, onChoose }) => (
  <div className="placement-tcg-modal-backdrop reward" role="dialog" aria-modal="true">
    <section className="placement-tcg-reward-panel">
      <p className="placement-tcg-eyebrow">BATTLE CLEAR // DECK UPGRADE</p>
      <h2>{copy(languageMode, '新しいカードを1枚選択', 'あたらしいカードを1まいせんたく', 'Choose one new card')}</h2>
      <p>{copy(languageMode, '選んだカードはデッキに追加され、次の対戦から使用できます。', 'えらんだカードはデッキについかされ、つぎのたいせんからつかえます。', 'The selected card joins your deck for the next battle.')}</p>
      <div className="placement-tcg-reward-cards">
        {choices.map(cardId => {
          const card = getCard(cardId);
          return card ? (
            <CardFace
              key={cardId}
              card={card}
              languageMode={languageMode}
              reward
              onSelect={() => onChoose(cardId)}
            />
          ) : null;
        })}
      </div>
    </section>
  </div>
);

const CompletionOverlay: React.FC<{
  languageMode?: LanguageMode;
  onFinish: () => void;
  onNewRun: () => void;
}> = ({ languageMode, onFinish, onNewRun }) => (
  <div className="placement-tcg-modal-backdrop reward" role="dialog" aria-modal="true">
    <section className="placement-tcg-completion-panel">
      <div className="placement-tcg-completion-seal">10 / 10</div>
      <p className="placement-tcg-eyebrow">ALL RIVALS DEFEATED</p>
      <h2>{copy(languageMode, '校長撃破', 'こうちょうげきは', 'PRINCIPAL DEFEATED')}<br /><em>TACTICAL MASTER</em></h2>
      <p>{copy(languageMode, '全10戦を制覇しました。新しいRUNでは、別の9人が対戦相手として選ばれます。', 'ぜん10せんをせいはしました。あたらしいRUNでは、べつの9にんがたいせんあいてとしてえらばれます。', 'You cleared all ten battles. A new run selects nine different rivals.')}</p>
      <button type="button" className="placement-tcg-primary-button" onClick={onFinish}>{copy(languageMode, '結果へ進む', 'けっかへすすむ', 'CONTINUE TO RESULTS')}</button>
      <button type="button" className="placement-tcg-secondary-button" onClick={onNewRun}>{copy(languageMode, '別のライバルで再挑戦', 'べつのライバルでさいちょうせん', 'RETRY WITH NEW RIVALS')}</button>
    </section>
  </div>
);

const PlacementTcgGame: React.FC<PlacementTcgGameProps> = ({ onBack, onFinish, languageMode, problemMode = 'MIXED' as GameMode, problemModePool, answerMode = 'CHOICE', assignment, onAnswerResult }) => {
  const [savedRunAtOpen] = useState<PlacementRun | null>(() => loadPlacementRun());
  const [run, setRun] = useState<PlacementRun | null>(null);
  const [battle, setBattle] = useState<PlacementBattle | null>(null);
  const [selectedHandIndex, setSelectedHandIndex] = useState<number | null>(null);
  const [inspectCard, setInspectCard] = useState<PlacementCardDefinition | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [notice, setNotice] = useState('');
  const [rewardChoices, setRewardChoices] = useState<string[]>([]);
  const [complete, setComplete] = useState(false);
  const [showMissionQuiz, setShowMissionQuiz] = useState(false);
  const [activeCue, setActiveCue] = useState<PlacementActionCue | null>(null);
  const cueTimerRef = useRef<number | null>(null);
  const seenCueRef = useRef<number | null>(null);
  const seenWinnerRef = useRef<PlacementSideKey | null>(null);

  const placementBgmType = !run || !battle
    ? 'menu'
    : complete
      ? 'victory'
      : rewardChoices.length > 0
        ? 'reward'
        : run.battleIndex === 9
          ? 'boss'
          : 'battle';

  useEffect(() => {
    void audioService.playBGM(placementBgmType);
  }, [placementBgmType]);

  const opponent: PlacementTcgOpponent | null = useMemo(
    () => run && run.battleIndex < 10 ? getCurrentOpponent(run) : null,
    [run],
  );

  const selectedCard = battle && selectedHandIndex !== null
    ? getCard(battle.player.hand[selectedHandIndex])
    : null;

  const showCue = (cue: PlacementActionCue) => {
    if (cueTimerRef.current !== null) window.clearTimeout(cueTimerRef.current);
    setActiveCue(cue);
    cueTimerRef.current = window.setTimeout(() => {
      setActiveCue(current => current?.id === cue.id ? null : current);
      cueTimerRef.current = null;
    }, cue.type === 'ATTACK' ? 900 : 760);
  };

  useEffect(() => () => {
    if (cueTimerRef.current !== null) window.clearTimeout(cueTimerRef.current);
  }, []);

  useEffect(() => {
    const cue = battle?.lastAction;
    if (!cue || seenCueRef.current === cue.id) return;
    seenCueRef.current = cue.id;
    const card = getCard(cue.cardId);
    if (cue.type === 'ATTACK') {
      audioService.playAttackEffectSound(attackSoundForCard(card), cue.direct ? 1 : 2);
    } else {
      playPlacementEffectSound(card);
    }
    showCue(cue);
  }, [battle?.lastAction]);

  useEffect(() => {
    if (!battle?.winner) {
      seenWinnerRef.current = null;
      return;
    }
    if (seenWinnerRef.current === battle.winner) return;
    seenWinnerRef.current = battle.winner;
    audioService.playBattleSound(battle.winner === 'player' ? 'win' : 'lose');
  }, [battle?.winner]);

  const beginBattle = (nextRun: PlacementRun) => {
    setRun(nextRun);
    setBattle(createPlacementBattle(nextRun.deck, nextRun.battleIndex, nextRun.seed + nextRun.battleIndex * 313));
    setActiveCue(null);
    seenCueRef.current = null;
    seenWinnerRef.current = null;
    setSelectedHandIndex(null);
    setRewardChoices([]);
    setComplete(false);
    savePlacementRun(nextRun);
  };

  const startRun = (continueSaved: boolean) => {
    const nextRun = continueSaved && savedRunAtOpen ? savedRunAtOpen : createNewPlacementRun();
    if (!continueSaved) clearPlacementRun();
    beginBattle(nextRun);
  };

  useEffect(() => {
    if (!battle || battle.turn !== 'CPU' || battle.winner) return;
    const timer = window.setTimeout(() => setBattle(current => current ? runCpuTurn(current) : current), 650);
    return () => window.clearTimeout(timer);
  }, [battle?.turn, battle?.winner, battle?.turnNumber]);

  useEffect(() => {
    if (!battle?.winner || !run) return;
    setSelectedHandIndex(null);
    setShowMissionQuiz(false);
    if (battle.winner === 'player') {
      setShowMissionQuiz(true);
      if (run.battleIndex >= 9) {
        clearPlacementRun();
        setComplete(true);
      } else {
        setRewardChoices(createRewardChoices(run));
      }
    }
  }, [battle?.winner, run]);

  const deploySelected = (laneIndex: number) => {
    if (!battle || selectedHandIndex === null) return;
    const result = playPlacementCard(battle, 'player', selectedHandIndex, laneIndex);
    if (!result.ok) {
      setNotice(result.message || copy(languageMode, '配置できません。', 'はいちできません。', 'Cannot deploy that card.'));
      return;
    }
    setBattle(result.battle);
    setSelectedHandIndex(null);
    setNotice('');
  };

  const attack = (laneIndex: number) => {
    if (!battle) return;
    const result = attackPlacementLane(battle, 'player', laneIndex);
    if (!result.ok) {
      setNotice(result.message || copy(languageMode, '攻撃できません。', 'こうげきできません。', 'Cannot attack.'));
      return;
    }
    setBattle(result.battle);
    setNotice('');
  };

  const takeReward = (cardId: string) => {
    if (!run) return;
    const nextRun = addRewardAndAdvance(run, cardId);
    beginBattle(nextRun);
  };

  const retry = () => {
    if (run) beginBattle(run);
  };

  if (!run || !battle || !opponent) {
    return (
    <main className="placement-tcg-shell is-start">
        <div className="placement-tcg-bg" style={{ backgroundImage: 'url("' + assetUrl('sprites/backgrounds/mini-games/learning-tcg.png') + '")' }} />
        <StartOverlay savedRun={savedRunAtOpen} languageMode={languageMode} onStart={startRun} onBack={onBack} />
      </main>
    );
  }

  const expression: 0 | 1 | 2 = battle.winner === 'player' ? 2 : battle.cpu.life <= 8 ? 1 : 0;

  return (
    <main className="placement-tcg-shell">
      <div className="placement-tcg-bg" style={{ backgroundImage: 'url("' + assetUrl('sprites/backgrounds/mini-games/learning-tcg.png') + '")' }} />
      <header className="placement-tcg-header">
        <button type="button" className="placement-tcg-back" onClick={onBack}>← EXIT</button>
        <div className="placement-tcg-title">
          <span>LEARNING ROGUE // MINI GAME</span>
          <b>TACTICAL CLASSROOM</b>
        </div>
        <div className="placement-tcg-progress">
          <span>BATTLE</span>
          <b>{String(run.battleIndex + 1).padStart(2, '0')} / 10</b>
        </div>
        <button type="button" className="placement-tcg-rules-button" onClick={() => setShowRules(true)}>RULES</button>
      </header>

      <div className="placement-tcg-layout">
        <aside className="placement-tcg-opponent-panel">
          <p className="placement-tcg-eyebrow">{run.battleIndex === 9 ? 'FINAL BOSS' : 'RIVAL ' + String(run.battleIndex + 1).padStart(2, '0')}</p>
          <div className="placement-tcg-portrait-frame">
            <div className="placement-tcg-portrait" style={getPlacementOpponentPortraitStyle(opponent, expression)} />
            <div className="placement-tcg-portrait-scan" />
          </div>
          <h2>{localizedTcgText(opponent.name, languageMode)}</h2>
          <LifeGauge label="CPU LIFE" life={battle.cpu.life} tone="red" />
          <div className="placement-tcg-resource-row">
            <span>CPU SP</span><b>{battle.cpu.sp} / {battle.cpu.maxSp}</b>
          </div>
          <div className="placement-tcg-resource-row">
            <span>HAND / DECK</span><b>{battle.cpu.hand.length} / {battle.cpu.deck.length}</b>
          </div>
          <div className="placement-tcg-turn-indicator">
            <i className={battle.turn === 'CPU' ? 'active red' : ''} />
            {battle.turn === 'CPU' ? 'CPU THINKING...' : 'STANDBY'}
          </div>
        </aside>

        <section className="placement-tcg-field">
          <div className="placement-tcg-field-status">
            <span>TURN {String(battle.turnNumber).padStart(2, '0')}</span>
            <b className={battle.turn === 'PLAYER' ? 'player' : 'cpu'}>{battle.turn} PHASE</b>
            <span>{selectedCard ? `${localizedCardName(selectedCard, languageMode)} // ${copy(languageMode, '配置先を選択', 'はいちさきをせんたく', 'SELECT DEPLOY LANE')}` : copy(languageMode, 'カードを選択、またはREADYユニットで攻撃', 'カードをえらぶか、READYユニットでこうげき', 'SELECT A CARD OR ATTACK WITH A READY UNIT')}</span>
          </div>
          <DuelBoard
            battle={battle}
            languageMode={languageMode}
            selectedCard={selectedCard}
            activeCue={activeCue}
            onLane={deploySelected}
            onAttack={attack}
            onInspect={setInspectCard}
          />
          <div className="placement-tcg-mobile-actions">
            <span>LIFE <b>{battle.player.life}</b></span>
            <span>SP <b>{battle.player.sp}</b> / {battle.player.maxSp}</span>
            <button
              type="button"
              disabled={battle.turn !== 'PLAYER' || Boolean(battle.winner)}
              onClick={() => {
                setSelectedHandIndex(null);
                setBattle(endPlayerTurn(battle));
              }}
            >
              END TURN →
            </button>
          </div>
          {notice && <button type="button" className="placement-tcg-notice" onClick={() => setNotice('')}>{notice}</button>}
        </section>

        <aside className="placement-tcg-player-panel">
          <p className="placement-tcg-eyebrow">STUDENT DUELIST</p>
          <LifeGauge label="YOUR LIFE" life={battle.player.life} tone="cyan" />
          <div className="placement-tcg-sp-display">
            <span>SKILL POINT</span>
            <b>{battle.player.sp}</b>
            <small>/ {battle.player.maxSp} SP</small>
          </div>
          <div className="placement-tcg-resource-row">
            <span>DECK / DISCARD</span><b>{battle.player.deck.length} / {battle.player.discard.length}</b>
          </div>
          <button
            type="button"
            className="placement-tcg-end-button"
            disabled={battle.turn !== 'PLAYER' || Boolean(battle.winner)}
            onClick={() => {
              setSelectedHandIndex(null);
              setBattle(endPlayerTurn(battle));
            }}
          >
            END TURN <span>→</span>
          </button>
          <div className="placement-tcg-log">
            <b>ACTION LOG</b>
            {battle.log.map((entry, index) => <p key={index}>{localizedTcgText(entry, languageMode)}</p>)}
          </div>
        </aside>
      </div>

      <section className="placement-tcg-hand-zone">
        <div className="placement-tcg-hand-meta">
          <span>YOUR HAND</span>
          <b>{battle.player.hand.length} / 9</b>
        </div>
        <div className="placement-tcg-hand">
          {battle.player.hand.map((cardId, index) => {
            const card = getCard(cardId);
            if (!card) return null;
            return (
              <CardFace
                key={cardId + '-' + index}
                card={card}
                languageMode={languageMode}
                selected={selectedHandIndex === index}
                disabled={battle.turn !== 'PLAYER' || card.spCost > battle.player.sp}
                onSelect={() => {
                  if (battle.turn !== 'PLAYER') return;
                  audioService.playBattleSound('select');
                  setSelectedHandIndex(current => current === index ? null : index);
                  setNotice('');
                }}
                onInspect={() => setInspectCard(card)}
              />
            );
          })}
        </div>
      </section>

      {battle.winner === 'cpu' && (
        <div className="placement-tcg-modal-backdrop" role="dialog" aria-modal="true">
          <section className="placement-tcg-defeat-panel">
            <p className="placement-tcg-eyebrow">DUEL LOST // RETRY AVAILABLE</p>
            <h2>DEFEAT</h2>
            <p>{copy(languageMode, 'デッキと対戦順は維持されます。盤面を組み直して再挑戦できます。', 'デッキとたいせんじゅんはそのままです。はいちをくみなおしてさいちょうせんできます。', 'Your deck and battle order stay the same. Rebuild the field and try again.')}</p>
            <button type="button" className="placement-tcg-primary-button" onClick={retry}>RETRY BATTLE</button>
            <button type="button" className="placement-tcg-text-button" onClick={onBack}>{copy(languageMode, 'ミニゲーム選択へ戻る', 'ミニゲームせんたくへもどる', 'BACK TO MINI-GAMES')}</button>
          </section>
        </div>
      )}
      {rewardChoices.length > 0 && (
        <RewardOverlay choices={rewardChoices} languageMode={languageMode} onChoose={takeReward} />
      )}
      {showMissionQuiz && (
        <div className="fixed inset-0 z-[120] overflow-y-auto bg-slate-950/95 p-2 sm:p-4" data-gamepad-modal="true">
          <MiniGameProblemChallenge
            mode={problemMode}
            modePool={problemModePool}
            answerMode={answerMode}
            assignment={assignment}
            onAnswerResult={onAnswerResult}
            onComplete={() => setShowMissionQuiz(false)}
            languageMode={languageMode}
            rewardHint={languageMode === 'ENGLISH' ? 'Mission clear quiz complete' : 'ミッションクリア問題を完了しました'}
          />
        </div>
      )}
      {complete && (
          <CompletionOverlay
            languageMode={languageMode}
          onFinish={() => onFinish ? onFinish('WIN') : onBack()}
          onNewRun={() => beginBattle(createNewPlacementRun())}
        />
      )}
      {showRules && <RulesPanel languageMode={languageMode} onClose={() => setShowRules(false)} />}
      {inspectCard && <InspectPanel card={inspectCard} languageMode={languageMode} onClose={() => setInspectCard(null)} />}
    </main>
  );
};

export default PlacementTcgGame;

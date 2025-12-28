
import { Enemy, Player, Card as ICard, CardType, SelectionState, Potion, FloatingText, EnemyIntentType, LanguageMode, ParryState, VisualEffectInstance } from '../types';
import Card, { KEYWORD_DEFINITIONS } from './Card';
import { Heart, Shield, Zap, Skull, Layers, X, Sword, AlertCircle, TrendingDown, Droplets, Hexagon, Gem, FlaskConical, Info, FileText, MoreHorizontal, Users, Sparkles, MessageCircle, Mic, ArrowRight, MousePointer2, ChevronsRight, Flame } from 'lucide-react';
import PixelSprite from './PixelSprite';
import { audioService } from '../services/audioService';
import { trans } from '../utils/textUtils';
import { HERO_IMAGE_DATA, CARDS_LIBRARY, STATUS_CARDS } from '../constants';
import { getUpgradedCard, synthesizeCards } from '../utils/cardUtils';
import React, { useEffect, useState, useRef } from 'react';
import { storageService } from '../services/storageService';

const POWER_DEFINITIONS: Record<string, {name: string, desc: string}> = {
    WEAK: { name: "へろへろ", desc: "攻撃で与えるダメージが25%減っちゃう。" },
    VULNERABLE: { name: "びくびく", desc: "攻撃から受けるダメージが50%増えちゃう。" },
    POISON: { name: "ドクドク", desc: "ターン終了時にHPダメージを受け、数値が1減る。" },
    STRENGTH: { name: "ムキムキ", desc: "攻撃ダメージがその数値分アップ！" },
    DEXTERITY: { name: "カチカチ", desc: "ブロックを得るカードの効果がその数値分アップ！" },
    ARTIFACT: { name: "キラキラ", desc: "次に受ける悪い効果（デバフ）を無効化する。" },
    INTANGIBLE: { name: "スケスケ", desc: "受けるダメージとHP減少が1になる。" },
    THORNS: { name: "トゲトゲ", desc: "攻撃を受けた時、相手にその数値分のダメージを返す。" },
    THORNS_DESC: { name: "トゲトゲ", desc: "攻撃を受けた時、相手にその数値分のダメージを返す。" },
    METALLICIZE: { name: "金属化", desc: "ターン終了時、その数値分のブロックを得る。" },
    REGEN: { name: "じわじわ回復", desc: "ターン終了時、その数値分HPを回復し、数値が1減る。" },
    STRENGTH_DOWN: { name: "ムキムキダウン", desc: "ターン終了時、ムキムキが通常の値に戻る。" },
    CONFUSED: { name: "混乱", desc: "カードのコストがランダムに変化する。" },
    LOSE_STRENGTH: { name: "反動", desc: "ターン終了時、ムキムキを失う。" },
    
    // Renamed Powers
    DEMON_FORM: { name: "反抗期", desc: "ターン開始時、ムキムキになる。" },
    ECHO_FORM: { name: "予習復習", desc: "各ターン、最初にプレイしたカードを2回使用する。" },
    BARRICADE: { name: "秘密基地", desc: "ターン開始時にブロックが消えなくなる。" },
    NOXIOUS_FUMES: { name: "異臭騒ぎ", desc: "ターン開始時、敵全体をドクドクにする。" },
    INFINITE_BLADES: { name: '鉛筆削り', desc: 'ターン開始時、手札にえんぴつの削りかすを加える。' },
    AFTER_IMAGE: { name: '反復横跳び', desc: 'カードを使用する度、ブロック1を得る。' },
    THOUSAND_CUTS: { name: '千本ノック', desc: 'カードを使用する度、敵全体にダメージを与える。' },
    TOOLS_OF_THE_TRADE: { name: '整理整頓', desc: 'ターン開始時、1枚引いて1枚捨てる。' },
    ENVENOM: { name: '悪口', desc: '攻撃でダメージを与えた時、ドクドク1を与える。' },
    STATIC_DISCHARGE: { name: '摩擦熱', desc: '攻撃を受けた時、ランダムな敵にダメージを与える。' },
    BUFFER: { name: '心の壁', desc: '次に受ける HPダメージを0にする。' },
    CREATIVE_AI: { name: '自由研究', desc: 'ターン開始時、ランダムなパワーカードを加える。' },
    DEVA_FORM: { name: '受験勉強', desc: 'ターン開始時、エネルギーを得る。' },
    MASTER_REALITY: { name: '模範解答', desc: 'カードが生成された時、それをアップグレードする。' },
    BURST: { name: 'バースト', desc: '次にプレイするスキルカードが2回発動する。' },
    DOUBLE_POISON: { name: '化学反応', desc: 'ドクドクの効果を増幅させる。' },
    CORRUPTION: { name: '賞味期限', desc: 'スキルカードのコストが0になり、使用時に廃棄される。' },
    FEEL_NO_PAIN: { name: '我慢大会', desc: 'カードが廃棄される度、ブロックを得る。' },
    RUPTURE: { name: '成長痛', desc: 'HPを失った時、ムキムキを得る。' },
    EVOLVE: { name: '進級', desc: '状態異常カードを引いた時、カードを引く。' },
    APOTHEOSIS: { name: '覚醒', desc: 'デッキの全てのカードがアップグレードされる。' },
    ACCURACY: { name: '精度上昇', desc: 'えんぴつの削りかすのダメージが増加する。' },
    STRATEGIST: { name: 'カンニングペーパー', desc: 'このカードが捨てられた時、エネルギーを得る。' },
    INFLAME: { name: 'やる気スイッチ', desc: 'ムキムキを得る。' },
};

// Component for handling floating damage/heal numbers
const FloatingTextOverlay: React.FC<{ data: FloatingText | null, languageMode: LanguageMode, offset?: string }> = ({ data, languageMode, offset = "-top-4 -left-4" }) => {
    if (!data) return null;

    return (
        <div 
            key={data.id} // Forces re-mount to restart animation on new ID
            className={`absolute ${offset} z-50 font-bold text-xl drop-shadow-[0_2px_4px_rgba(0,0,0,1)] pointer-events-none ${data.color} flex items-center bg-black/40 rounded-lg px-2 py-0.5 backdrop-blur-[2px] border border-white/10`}
            style={{ 
                animation: 'float-pop-fade 0.9s cubic-bezier(0.17, 0.67, 0.83, 0.67) forwards'
            }}
        >
            <style>
                {`
                    @keyframes float-pop-fade {
                        0% { transform: translateY(0) scale(0.5); opacity: 0; }
                        15% { transform: translateY(-15px) scale(1.4); opacity: 1; }
                        30% { transform: translateY(-10px) scale(1.1); opacity: 1; }
                        100% { transform: translateY(-40px) scale(1); opacity: 0; }
                    }
                `}
            </style>
            {data.iconType === 'zap' && <Zap size={16} className="mr-1 fill-current" />}
            {data.iconType === 'sword' && <Sword size={16} className="mr-1 fill-current" />}
            {data.iconType === 'shield' && <Shield size={16} className="mr-1 fill-current" />}
            {data.iconType === 'heart' && <Heart size={16} className="mr-1 fill-current" />}
            {data.iconType === 'poison' && <Droplets size={16} className="mr-1 fill-current" />}
            {data.iconType === 'skull' && <Skull size={16} className="mr-1 fill-current" />}
            {trans(data.text, languageMode)}
        </div>
    );
};

// Component for handling visual effects like slashes
const VFXOverlay: React.FC<{ effects: VisualEffectInstance[], targetId: string }> = ({ effects, targetId }) => {
    const activeOnThisTarget = effects.filter(e => e.targetId === targetId);
    if (activeOnThisTarget.length === 0) return null;

    return (
        <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none overflow-visible">
            {activeOnThisTarget.map(vfx => (
                <div key={vfx.id} className="absolute inset-0 flex items-center justify-center">
                    {vfx.type === 'SLASH' && (
                        <div className="w-48 h-2 bg-gradient-to-r from-transparent via-white to-transparent rotate-45 animate-slash-vfx shadow-[0_0_20px_rgba(255,255,255,0.8)]"></div>
                    )}
                    {vfx.type === 'BLOCK' && (
                        <div className="relative flex items-center justify-center">
                            <div className="absolute w-32 h-32 border-4 border-blue-400 rounded-full animate-pulse-expand opacity-0"></div>
                            <div className="animate-block-vfx p-4 bg-blue-500/30 border-2 border-blue-300 rounded-lg shadow-[0_0_20px_rgba(59,130,246,0.6)]">
                                <Shield size={48} className="text-blue-100 fill-blue-500/50" />
                            </div>
                        </div>
                    )}
                    {vfx.type === 'BUFF' && (
                        <div className="animate-buff-vfx p-2">
                            <Sparkles size={56} className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]" />
                        </div>
                    )}
                    {vfx.type === 'DEBUFF' && (
                         <div className="animate-debuff-vfx p-2">
                             <Skull size={56} className="text-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]" />
                         </div>
                    )}
                    {vfx.type === 'HEAL' && (
                        <div className="animate-heal-vfx">
                            <Heart size={56} className="text-green-300 fill-green-500/50 drop-shadow-[0_0_15px_rgba(34,197,94,0.8)]" />
                        </div>
                    )}
                    {vfx.type === 'FIRE' && (
                        <div className="relative flex items-center justify-center">
                            <div className="absolute w-24 h-24 bg-orange-500/40 blur-xl animate-ping rounded-full"></div>
                            <div className="animate-fire-vfx">
                                <Flame size={64} className="text-orange-400 fill-orange-600/50 drop-shadow-[0_0_20px_rgba(249,115,22,0.8)]" />
                            </div>
                        </div>
                    )}
                </div>
            ))}
            <style>
                {`
                    @keyframes slash-vfx {
                        0% { transform: rotate(45deg) scaleX(0) translateX(-100%); opacity: 0; }
                        20% { transform: rotate(45deg) scaleX(1.8) translateX(0); opacity: 1; }
                        100% { transform: rotate(45deg) scaleX(2.5) translateX(100%); opacity: 0; }
                    }
                    @keyframes block-vfx {
                        0% { transform: scale(0.4); opacity: 0; }
                        20% { transform: scale(1.3); opacity: 1; }
                        30% { transform: scale(1); opacity: 1; }
                        100% { transform: scale(0.9); opacity: 0; }
                    }
                    @keyframes pulse-expand {
                        0% { transform: scale(0.5); opacity: 0.8; border-width: 8px; }
                        100% { transform: scale(1.5); opacity: 0; border-width: 1px; }
                    }
                    @keyframes buff-vfx {
                        0% { transform: translateY(30px) scale(0.5) rotate(0deg); opacity: 0; }
                        50% { transform: translateY(-10px) scale(1.2) rotate(180deg); opacity: 1; }
                        100% { transform: translateY(-50px) scale(0.8) rotate(360deg); opacity: 0; }
                    }
                    @keyframes debuff-vfx {
                         0% { transform: scale(2); filter: brightness(3) blur(5px); opacity: 0; }
                         20% { transform: scale(1); filter: brightness(1) blur(0); opacity: 1; }
                         80% { transform: scale(0.95); opacity: 1; }
                         100% { transform: scale(0.7); filter: blur(2px); opacity: 0; }
                    }
                    @keyframes heal-vfx {
                        0% { transform: scale(0.3) translateY(20px); opacity: 0; }
                        40% { transform: scale(1.4) translateY(-10px); opacity: 1; }
                        100% { transform: scale(1.8) translateY(-40px); opacity: 0; }
                    }
                    @keyframes fire-vfx {
                         0% { transform: scale(0.4) translateY(20px); opacity: 0; }
                         30% { transform: scale(1.4) translateY(-10px); filter: brightness(1.5); opacity: 1; }
                         100% { transform: scale(2) translateY(-60px); filter: blur(4px); opacity: 0; }
                    }
                    @keyframes screen-shake {
                        0% { transform: translate(0, 0); }
                        10% { transform: translate(-4px, -4px); }
                        20% { transform: translate(4px, 4px); }
                        30% { transform: translate(-4px, 4px); }
                        40% { transform: translate(4px, -4px); }
                        50% { transform: translate(-2px, -2px); }
                        60% { transform: translate(2px, 2px); }
                        70% { transform: translate(-2px, 2px); }
                        80% { transform: translate(2px, -2px); }
                        100% { transform: translate(0, 0); }
                    }
                    .animate-screen-shake {
                        animation: screen-shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
                    }
                `}
            </style>
        </div>
    );
};

interface BattleSceneProps {
  player: Player;
  enemies: Enemy[];
  selectedEnemyId: string | null;
  onSelectEnemy: (id: string) => void;
  onPlayCard: (card: ICard) => void;
  onPlaySynthesizedCard: (card: ICard) => void;
  onEndTurn: () => void;
  turnLog: string;
  narrative: string;
  lastActionTime: number;
  lastActionType: CardType | null;
  actingEnemyId: string | null;
  selectionState: SelectionState;
  onHandSelection: (card: ICard) => void;
  onUsePotion: (potion: Potion) => void;
  combatLog: string[];
  languageMode: LanguageMode;
  codexOptions?: ICard[];
  onCodexSelect: (card: ICard | null) => void;
  parryState?: ParryState;
  onParry: () => void;
  activeEffects: VisualEffectInstance[];
}

const BattleScene: React.FC<BattleSceneProps> = ({ 
  player, enemies, selectedEnemyId, onSelectEnemy, onPlayCard, onPlaySynthesizedCard, onEndTurn, turnLog, narrative, lastActionTime, lastActionType, actingEnemyId,
  selectionState, onHandSelection, onUsePotion, combatLog, languageMode, codexOptions, onCodexSelect, parryState, onParry, activeEffects
}) => {
  
  const playerHpPercent = (player.currentHp / player.maxHp) * 100;
  
  const [isActing, setIsActing] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [showDeck, setShowDeck] = useState(false);
  const [showRelicList, setShowRelicList] = useState(false);
  const [tooltip, setTooltip] = useState<{title: string, msg: string} | null>(null); 
  const [potionConfirmation, setPotionConfirmation] = useState<Potion | null>(null);
  const [inspectedCard, setInspectedCard] = useState<ICard | null>(null);
  const [showLog, setShowLog] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);
  
  // --- BATTLE TUTORIAL STATE ---
  const [tutorialStep, setTutorialStep] = useState<number | null>(null);

  useEffect(() => {
      if (!storageService.getSeenBattleTutorial()) {
          setTutorialStep(1);
      }
  }, []);

  const closeTutorial = () => {
      setTutorialStep(null);
      storageService.saveSeenBattleTutorial();
  };

  const nextTutorialStep = () => {
      if (tutorialStep === null) return;
      if (tutorialStep >= 5) {
          closeTutorial();
      } else {
          setTutorialStep(tutorialStep + 1);
          audioService.playSound('select');
      }
  };

  // Screen shake on action or damage
  useEffect(() => {
    if (activeEffects.length > 0) {
        // Only shake for specific high-impact effects
        const hasImpact = activeEffects.some(e => e.type === 'SLASH' || e.type === 'FIRE' || e.type === 'BLOCK');
        if (hasImpact) {
            setIsShaking(true);
            const timer = setTimeout(() => setIsShaking(false), 400);
            return () => clearTimeout(timer);
        }
    }
  }, [activeEffects]);

  // Dual Protagonist States
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [isComboing, setIsComboing] = useState(false);
  const [synthesizedCard, setSynthesizedCard] = useState<ICard | null>(null);

  // Check if dual mode is active
  const isDualMode = !!player.partner && player.partner.currentHp > 0;
  
  // Get latest 2 logs
  const latestLogs = [...combatLog].reverse().slice(0, 2);

  useEffect(() => {
    if (lastActionTime > 0) {
      setIsActing(true);
      const timer = setTimeout(() => {
        setIsActing(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [lastActionTime]);

  // Reset local selection when turn ends or player state changes drastically
  useEffect(() => {
      if (actingEnemyId) {
          setSelectedCardIds([]);
          setSynthesizedCard(null);
      }
  }, [actingEnemyId]);

  // Auto-scroll log
  useEffect(() => {
      if (showLog && logContainerRef.current) {
          logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
      }
  }, [combatLog, showLog]);

  const getActionClass = () => {
    if (!isActing) return '';
    switch (lastActionType) {
        case CardType.ATTACK: return '-translate-y-12 scale-105 z-30'; 
        case CardType.SKILL: return '-translate-x-2 scale-95 brightness-150 sepia-0';
        case CardType.POWER: return 'scale-110 -translate-y-2 brightness-125 drop-shadow-[0_0_10px_rgba(255,255,0,0.8)]';
        default: return '';
    }
  };

  const getEnemyActionClass = (enemy: Enemy) => {
      if (actingEnemyId !== enemy.id) return '';
      if (enemy.nextIntent.type === 'ATTACK' || enemy.nextIntent.type === 'ATTACK_DEBUFF' || enemy.nextIntent.type === 'ATTACK_DEFEND') {
          return 'translate-y-16 z-50'; 
      } else if (enemy.nextIntent.type === 'DEFEND') {
          return 'scale-90 brightness-150'; 
      } else {
          return 'scale-125 -translate-y-4 brightness-125'; 
      }
  };

  const showInfo = (title: string, desc: string) => {
      setTooltip({ title, msg: desc });
  };

  const getProcessedDescription = (card: ICard) => {
      let desc = trans(card.description, languageMode);
      desc = desc.replace(/自傷/g, trans("自分にダメージ", languageMode));
      if (card.damage !== undefined) desc = desc.replace(/(\d+)ダメージ/g, `${card.damage}${trans("ダメージ", languageMode)}`);
      if (card.block !== undefined) desc = desc.replace(/ブロック(\d+)/g, `${trans("ブロック", languageMode)}${card.block}`);
      return desc;
  };

  const getCardKeywords = (card: ICard) => {
      const keywords = [];
      if (card.exhaust) keywords.push(KEYWORD_DEFINITIONS.EXHAUST);
      if (card.strength || card.description.includes('ムキムキ')) keywords.push(KEYWORD_DEFINITIONS.STRENGTH);
      if (card.vulnerable || card.description.includes('びくびく')) keywords.push(KEYWORD_DEFINITIONS.VULNERABLE);
      if (card.weak || card.description.includes('へろへろ')) keywords.push(KEYWORD_DEFINITIONS.WEAK);
      if (card.block || card.description.includes('ブロック')) keywords.push(KEYWORD_DEFINITIONS.BLOCK);
      if (card.draw || card.description.includes('引く')) keywords.push(KEYWORD_DEFINITIONS.DRAW);
      return keywords;
  };

  const hasChoker = !!player.relics.find(r => r.id === 'VELVET_CHOKER');
  
  const hasNormality = player.hand.some(c => c.name === '退屈' || c.name === 'NORMALITY');
  const normalityRestricted = hasNormality && player.cardsPlayedThisTurn >= 3;

  const sortedDeck = [...player.deck].sort((a, b) => {
    if (a.type !== b.type) return a.type.localeCompare(b.type);
    if (a.cost !== b.cost) return a.cost - b.cost;
    return a.name.localeCompare(b.name);
  });
  
  const getRelicCounter = (relicId: string) => {
      if (relicId === 'KUNAI' || relicId === 'SHURIKEN' || relicId === 'ORNAMENTAL_FAN') {
          return player.relicCounters['ATTACK_COUNT'];
      }
      return player.relicCounters[relicId];
  };

  const displayedRelics = [...player.relics].sort((a, b) => {
      const countA = getRelicCounter(a.id) || 0;
      const countB = getRelicCounter(b.id) || 0;
      if (countA > 0 && countB <= 0) return -1;
      if (countA <= 0 && countB > 0) return 1;
      return 0;
  });

  const handleCardClickDual = (card: ICard, disabled: boolean) => {
      if (disabled) {
           if (isDualMode && (hasChoker || normalityRestricted)) audioService.playSound('wrong');
           return;
      }
      
      if (selectionState.active) {
          onHandSelection(card);
          return;
      }

      if (selectedCardIds.includes(card.id)) {
          setSelectedCardIds(prev => prev.filter(id => id !== card.id));
          audioService.playSound('select');
      } else {
          if (selectedCardIds.length < 2) {
              setSelectedCardIds(prev => [...prev, card.id]);
              audioService.playSound('select');
          }
      }
  };

  const executeDualTurn = async () => {
      if (selectedCardIds.length === 0) return;
      
      if (selectedCardIds.length === 1) {
           const c1 = player.hand.find(c => c.id === selectedCardIds[0]);
           if (c1) {
               if (player.currentEnergy < c1.cost) {
                   audioService.playSound('wrong');
                   return;
               }
               onPlayCard(c1);
               setSelectedCardIds([]);
           }
           return;
      }

      const c1 = player.hand.find(c => c.id === selectedCardIds[0]);
      const c2 = player.hand.find(c => c.id === selectedCardIds[1]);
      
      if (!c1 || !c2) return;

      const isCombo = c1.type === c2.type;
      const comboCost = Math.max(c1.cost, c2.cost);
      const totalCost = c1.cost + c2.cost;
      const requiredCost = isCombo ? comboCost : totalCost;
      
      if (player.currentEnergy < requiredCost) {
          audioService.playSound('wrong');
          return;
      }

      if (isCombo) {
          setIsComboing(true);
          const fused = synthesizeCards(c1, c2);
          setSynthesizedCard(fused);
          audioService.playSound('buff');
          
          await new Promise(r => setTimeout(r, 1000)); 
          const comboPayload = { ...fused, _consumedIds: [c1.id, c2.id] };
          onPlaySynthesizedCard(comboPayload);
          
      } else {
          onPlayCard(c1);
          await new Promise(r => setTimeout(r, 500));
          onPlayCard(c2);
      }
      
      setSelectedCardIds([]);
      setIsComboing(false);
      setSynthesizedCard(null);
  };

  const onInspect = (card: ICard) => {
    setInspectedCard(card);
    audioService.playSound('select');
  };

  return (
    <div className={`flex flex-col h-full w-full bg-gray-900 text-white relative overflow-hidden ${isShaking ? 'animate-screen-shake' : ''}`}>
      
      {/* --- BATTLE TUTORIAL OVERLAY --- */}
      {tutorialStep !== null && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
              <div className="relative w-full h-full max-w-4xl max-h-[600px] flex flex-col pointer-events-none">
                  
                  {/* Step 1: HP & Block */}
                  {tutorialStep === 1 && (
                      <div className="absolute top-[160px] left-1/2 -translate-x-1/2 w-full max-w-xl bg-slate-800 border-2 border-green-500 p-4 rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.5)] animate-in zoom-in-95 pointer-events-auto">
                          <div className="flex items-center gap-2 text-green-400 font-bold mb-2">
                              <Heart size={20} className="fill-current"/> じぶんの ステータス
                          </div>
                          <p className="text-white text-sm leading-relaxed mb-4 text-center">
                              <span className="text-red-400 font-bold">HP</span>が 0になると まけてしまいます。<br/>
                              <span className="text-blue-400 font-bold">ブロック</span>を つかえば、てきの こうげきを ふせげます！<br/>
                              <span className="text-blue-400 font-bold">ブロック</span>は ターンがおわると 0になります。
                          </p>
                          <div className="flex justify-between items-center">
                              <div className="text-[10px] text-gray-400">Step 1/5</div>
                              <button onClick={nextTutorialStep} className="bg-green-600 hover:bg-green-500 text-white px-4 py-1 rounded font-bold text-sm flex items-center gap-1">つぎへ <ArrowRight size={14}/></button>
                          </div>
                          <div className="absolute -bottom-4 left-20 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[15px] border-t-green-500"></div>
                      </div>
                  )}

                  {/* Step 2: Enemy Intent */}
                  {tutorialStep === 2 && (
                      <div className="absolute top-[160px] left-1/2 -translate-x-1/2 w-full max-w-xl bg-slate-800 border-2 border-red-500 p-4 rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-in zoom-in-95 pointer-events-auto">
                          <div className="flex items-center gap-2 text-red-400 font-bold mb-2">
                              <Skull size={20} className="fill-current"/> てきの こうどう
                          </div>
                          <p className="text-white text-sm leading-relaxed mb-4 text-center">
                              てきの あたまのうえに マークが でます。<br/>
                              <span className="text-red-400 font-bold">ドクロ</span>は こうげき、<span className="text-blue-400 font-bold">たて</span>は ぼうぎょの しるしです。
                          </p>
                          <div className="flex justify-between items-center">
                              <div className="text-[10px] text-gray-400">Step 2/5</div>
                              <button onClick={nextTutorialStep} className="bg-red-600 hover:bg-red-500 text-white px-4 py-1 rounded font-bold text-sm flex items-center gap-1">なるほど <ArrowRight size={14}/></button>
                          </div>
                          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[15px] border-b-red-500"></div>
                      </div>
                  )}

                  {/* Step 3: Energy & Deck */}
                  {tutorialStep === 3 && (
                      <div className="absolute top-[160px] left-1/2 -translate-x-1/2 w-full max-w-xl bg-slate-800 border-2 border-yellow-500 p-4 rounded-xl shadow-[0_0_20px_rgba(234,179,8,0.5)] animate-in zoom-in-95 pointer-events-auto">
                          <div className="flex items-center gap-2 text-yellow-400 font-bold mb-2">
                              <Zap size={20} className="fill-current"/> エナジーと カード
                          </div>
                          <p className="text-white text-sm leading-relaxed mb-4 text-center">
                              カードを つかうには <span className="text-yellow-400 font-bold">エナジー</span>が ひつようです。<br/>
                              やまふだが なくなると、すてふだが シャッフルされて もどってきます。
                          </p>
                          <div className="flex justify-between items-center">
                              <div className="text-[10px] text-gray-400">Step 3/5</div>
                              <button onClick={nextTutorialStep} className="bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-1 rounded font-bold text-sm flex items-center gap-1">つぎへ <ArrowRight size={14}/></button>
                          </div>
                          <div className="absolute -bottom-4 left-12 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[15px] border-t-yellow-500"></div>
                      </div>
                  )}

                  {/* Step 4: Card Play */}
                  {tutorialStep === 4 && (
                      <div className="absolute top-[160px] left-1/2 -translate-x-1/2 w-full max-w-xl bg-slate-800 border-2 border-blue-500 p-4 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.5)] animate-in zoom-in-95 pointer-events-auto">
                          <div className="flex items-center gap-2 text-blue-400 font-bold mb-2">
                              <MousePointer2 size={20} className="fill-current"/> カードを つかおう
                          </div>
                          <p className="text-white text-sm leading-relaxed mb-4 text-center">
                              てふだを タップすると カードを つかえます。<br/>
                              ながおしで、カードの くわしい せつめいを よめるよ！
                          </p>
                          <div className="flex justify-between items-center">
                              <div className="text-[10px] text-gray-400">Step 4/5</div>
                              <button onClick={nextTutorialStep} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1 rounded font-bold text-sm flex items-center gap-1">わかった <ArrowRight size={14}/></button>
                          </div>
                          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[15px] border-t-blue-500"></div>
                      </div>
                  )}

                  {/* Step 5: End Turn */}
                  {tutorialStep === 5 && (
                      <div className="absolute top-[160px] left-1/2 -translate-x-1/2 w-full max-w-xl bg-slate-800 border-2 border-red-400 p-4 rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-in zoom-in-95 pointer-events-auto">
                          <div className="flex items-center gap-2 text-red-400 font-bold mb-2">
                              <ChevronsRight size={20}/> ターンを おわらせる
                          </div>
                          <p className="text-white text-sm leading-relaxed mb-4 text-center">
                              エナジーを つかいきったら、<span className="text-red-400 font-bold">ターンしゅうりょう</span> ボタンを おしましょう。<br/>
                              さあ、ぼうけんを はじめよう！
                          </p>
                          <div className="flex justify-between items-center">
                              <div className="text-[10px] text-gray-400">Final Step</div>
                              <button onClick={closeTutorial} className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded font-bold text-sm animate-pulse">ぼうけんを はじめる！</button>
                          </div>
                          <div className="absolute -bottom-4 right-8 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[15px] border-t-red-400"></div>
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* 1. Top Bar: Narrative & Logs */}
      <div className="shrink-0 bg-black border-b-2 border-gray-700 p-2 z-30 relative min-h-[4rem] flex flex-col justify-center shadow-md">
        <div className="flex flex-col w-full pr-24 overflow-hidden">
            <div className="text-xs text-green-400 truncate leading-snug mb-0.5 font-bold shadow-black drop-shadow-md">
                <span className="animate-pulse mr-2">&gt;&gt;</span> {trans(narrative, languageMode)}
            </div>
            {latestLogs.length > 0 ? (
                <>
                    <div className="text-[10px] text-gray-200 truncate leading-snug">
                        {trans(latestLogs[0], languageMode)}
                    </div>
                    {latestLogs.length > 1 && (
                        <div className="text-[10px] text-gray-500 truncate leading-snug">
                            {trans(latestLogs[1], languageMode)}
                        </div>
                    )}
                </>
            ) : (
                <div className="text-[10px] text-gray-600 italic leading-snug">...</div>
            )}
        </div>

        <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
            <div className="text-yellow-400 text-[10px] font-bold bg-gray-900/80 px-2 py-0.5 rounded border border-yellow-700 shadow-sm">
                {trans(turnLog, languageMode)}
            </div>
            <button 
                onClick={() => setShowLog(!showLog)}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold border transition-colors ${showLog ? 'bg-gray-700 border-gray-500 text-white' : 'bg-black/50 border-gray-600 text-gray-400 hover:text-white hover:border-gray-400'}`}
            >
                <FileText size={10}/> LOG
            </button>
        </div>
      </div>

      {/* 2. Battle Viewport */}
      <div className="flex-1 relative overflow-y-auto custom-scrollbar flex flex-col justify-between p-2 bg-gray-800/50 gap-4">
        
        {/* Parry UI Overlay (Bard Special) */}
        {parryState?.active && !parryState.success && (
            <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none translate-y-32">
                <button 
                    onClick={(e) => { e.stopPropagation(); onParry(); }}
                    className="bg-black/80 border-4 border-cyan-400 p-6 rounded-full shadow-[0_0_30px_rgba(34,211,238,0.6)] animate-bounce pointer-events-auto group transition-transform active:scale-90"
                >
                    <div className="flex flex-col items-center">
                        <Mic size={48} className="text-cyan-400 mb-2 group-hover:scale-110" />
                        <span className="text-white font-black text-xl tracking-widest">
                            {trans("インタビューではねかえせ！", languageMode)}
                        </span>
                        <div className="mt-2 w-16 h-1 bg-cyan-900 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-cyan-400 animate-shrink-width"
                                style={{ animation: 'shrink 300ms linear forwards' }}
                            />
                        </div>
                    </div>
                </button>
                <style>{`
                    @keyframes shrink {
                        from { width: 100%; }
                        to { width: 0%; }
                    }
                `}</style>
            </div>
        )}

        {/* Codex Selection Modal */}
        {codexOptions && (
            <div className="fixed inset-0 z-[100] bg-black/80 flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
                <h3 className="text-2xl font-bold text-yellow-400 mb-4 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">秘密の攻略本</h3>
                <p className="text-gray-300 mb-6 text-sm">手札に加えるカードを1枚選んでください</p>
                <div className="flex flex-wrap justify-center gap-4 mb-8">
                    {codexOptions.map((card) => (
                        <div key={card.id} className="scale-100 hover:scale-105 transition-transform cursor-pointer" onClick={() => onCodexSelect(card)}>
                            <Card card={card} onClick={() => onCodexSelect(card)} disabled={false} languageMode={languageMode} onInspect={onInspect}/>
                        </div>
                    ))}
                </div>
                <button 
                    onClick={() => onCodexSelect(null)} 
                    className="bg-gray-600 hover:bg-green-500 text-white px-8 py-2 rounded font-bold border border-gray-400"
                >
                    スキップ
                </button>
            </div>
        )}

        {/* Combat Log Overlay */}
        {showLog && (
            <div 
                ref={logContainerRef}
                className="absolute top-2 right-2 z-[45] w-64 max-h-48 bg-black/80 border border-gray-600 rounded p-2 text-xs text-gray-300 font-mono overflow-y-auto custom-scrollbar shadow-xl backdrop-blur-sm pointer-events-auto overscroll-contain"
            >
                <div className="text-center text-gray-500 border-b border-gray-700 pb-1 mb-1 font-bold sticky top-0 bg-black/90 w-full">Battle Log</div>
                {combatLog.length === 0 ? (
                    <div className="text-center italic opacity-50">No actions yet</div>
                ) : (
                    <div className="flex flex-col gap-1">
                        {combatLog.map((log, i) => (
                            <div key={i} className="border-b border-gray-800 pb-0.5 last:border-0 leading-tight break-words">
                                {trans(log, languageMode)}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}
        
        {/* Combo Animation Overlay */}
        {isComboing && synthesizedCard && (
            <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
                <div className="bg-black/90 border-4 border-yellow-400 p-8 rounded-xl shadow-[0_0_50px_rgba(250,204,21,0.5)] animate-in zoom-in duration-300 flex flex-col items-center">
                    <Sparkles className="text-yellow-400 mb-4 animate-spin" size={48}/>
                    <h2 className="text-3xl font-black text-yellow-100 mb-6 tracking-widest text-shadow-lg">友情コンボ！</h2>
                    <div className="scale-125">
                         <Card card={synthesizedCard} onClick={()=>{}} disabled={false} languageMode={languageMode} onInspect={onInspect}/>
                    </div>
                </div>
            </div>
        )}

        {/* Selection Overlay */}
        {selectionState.active && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/80 z-40 text-center py-2 px-6 border-b-2 border-yellow-500 animate-pulse rounded shadow-xl pointer-events-none">
                <span className="text-yellow-400 font-bold text-sm">
                    {selectionState.type === 'DISCARD' && `${trans("捨てる", languageMode)} (${selectionState.amount})`}
                    {selectionState.type === 'COPY' && `コピー (${selectionState.amount})`}
                    {selectionState.type === 'EXHAUST' && `${trans("廃棄", languageMode)} (${selectionState.amount})`}
                </span>
            </div>
        )}

        {/* Card Inspection Modal */}
        {inspectedCard && (
            <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setInspectedCard(null)}>
                <div className="scale-110 md:scale-150 mb-8 transform transition-transform" onClick={(e) => e.stopPropagation()}>
                     <Card card={inspectedCard} onClick={() => {}} disabled={false} languageMode={languageMode}/>
                </div>
                <div className="bg-gray-800 border-2 border-white p-4 md:p-6 rounded-lg max-w-sm w-full shadow-2xl relative max-h-[50vh] overflow-y-auto custom-scrollbar" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => setInspectedCard(null)} className="absolute top-2 right-2 text-gray-400 hover:text-white p-2">
                        <X size={24} />
                    </button>
                    <h3 className="text-2xl font-bold text-yellow-400 mb-2 border-b border-gray-600 pb-2">{trans(inspectedCard.name, languageMode)}</h3>
                    <div className="flex gap-2 mb-4 text-xs text-gray-400 font-mono">
                        <span className="bg-blue-900/50 px-2 py-1 rounded border border-blue-500/30">{trans("コスト", languageMode)}: {inspectedCard.cost}</span>
                        <span className="bg-purple-900/50 px-2 py-1 rounded border border-purple-500/30">{trans(inspectedCard.type, languageMode)}</span>
                    </div>
                    <p className="text-lg text-white mb-6 leading-relaxed whitespace-pre-wrap font-bold bg-black/30 p-3 rounded">
                        {getProcessedDescription(inspectedCard)}
                    </p>
                    
                    <div className="space-y-2">
                        {getCardKeywords(inspectedCard).map((k, idx) => (
                            <div key={idx} className="flex flex-col text-left text-sm bg-gray-700/50 p-2 rounded border border-gray-600">
                                <span className="font-bold text-yellow-300 mb-0.5">{trans(k.title, languageMode)}</span>
                                <span className="text-gray-300 text-xs">{trans(k.desc, languageMode)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* Relic List Modal */}
        {showRelicList && (
            <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowRelicList(false)}>
                <div className="bg-gray-800 border-2 border-white rounded-lg p-4 w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4 border-b border-gray-600 pb-2">
                        <h3 className="text-xl font-bold text-yellow-400 flex items-center">
                            <Gem className="mr-2"/> {trans("所持レリック一覧", languageMode)} ({player.relics.length})
                        </h3>
                        <button onClick={() => setShowRelicList(false)} className="text-gray-400 hover:text-white p-1">
                            <X size={24} />
                        </button>
                    </div>
                    <div className="overflow-y-auto custom-scrollbar flex-grow space-y-2 pr-1">
                        {player.relics.length === 0 ? (
                            <div className="text-center text-gray-500 py-8">レリックを持っていません</div>
                        ) : (
                            player.relics.map(r => {
                                const counter = getRelicCounter(r.id);
                                return (
                                    <div key={r.id} className="bg-black/40 p-3 rounded border border-gray-600 flex items-start gap-3">
                                        <div className="bg-gray-700 p-2 rounded-full border border-yellow-600 shrink-0 relative">
                                            <Gem size={20} className="text-yellow-400" />
                                            {counter !== undefined && counter > 0 && (
                                                <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold border border-white shadow-md">
                                                    {counter}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-bold text-yellow-100 text-sm mb-1">{trans(r.name, languageMode)}</div>
                                            <div className="text-xs text-gray-400 leading-tight">{trans(r.description, languageMode)}</div>
                                            {counter !== undefined && counter > 0 && (
                                                <div className="text-[10px] text-blue-300 mt-1">
                                                    Counter: {counter}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                    <button 
                        onClick={() => setShowRelicList(false)} 
                        className="mt-4 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded text-sm font-bold border border-gray-500"
                    >
                        {trans("閉じる", languageMode)}
                    </button>
                </div>
            </div>
        )}

        {/* Tooltip Modal Overlay */}
        {tooltip && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onClick={() => setTooltip(null)}>
                <div className="bg-black border-2 border-white p-4 rounded max-w-xs shadow-2xl animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                    <h3 className="text-yellow-400 font-bold mb-2 text-lg border-b border-gray-600 pb-1">{trans(tooltip.title, languageMode)}</h3>
                    <p className="text-white text-sm whitespace-pre-wrap">{trans(tooltip.msg, languageMode)}</p>
                    <button onClick={() => setTooltip(null)} className="mt-4 w-full bg-gray-700 hover:bg-gray-600 text-white text-xs py-2 rounded">{trans("閉じる", languageMode)}</button>
                </div>
            </div>
        )}

        {/* Potion Confirmation Modal */}
        {potionConfirmation && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" onClick={() => setPotionConfirmation(null)}>
                <div className="bg-gray-900 border-2 border-white p-6 rounded shadow-2xl max-w-xs w-full text-center animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                    <div className="mb-4 flex justify-center">
                        <div className="w-16 h-16 bg-gray-800 rounded-full border-2 border-white flex items-center justify-center">
                            <FlaskConical size={32} style={{color: potionConfirmation.color}} />
                        </div>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{trans(potionConfirmation.name, languageMode)}</h3>
                    <p className="text-gray-300 mb-6 text-sm whitespace-pre-wrap">{trans(potionConfirmation.description, languageMode)}</p>
                    <div className="flex gap-4 justify-center">
                        <button 
                            onClick={() => { onUsePotion(potionConfirmation); setPotionConfirmation(null); }} 
                            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-bold border border-white transition-colors"
                        >
                            {trans("決定", languageMode)}
                        </button>
                        <button 
                            onClick={() => setPotionConfirmation(null)} 
                            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded border border-gray-500 transition-colors"
                        >
                            {trans("やめる", languageMode)}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Enemies Area */}
        <div className="flex justify-center items-start pt-8 md:pt-14 gap-2 min-h-[180px] shrink-0">
            {enemies.map((enemy) => {
                const enemyHpPercent = (enemy.currentHp / enemy.maxHp) * 100;
                const isSelected = selectedEnemyId === enemy.id;
                const actionClass = getEnemyActionClass(enemy);
                const enemyName = trans(enemy.name, languageMode);
                const enemyNameNeedsScroll = enemyName.length > 5;
                const isTrueBossPhase2 = enemy.enemyType === 'THE_HEART' && enemy.phase === 2;

                return (
                    <div 
                        key={enemy.id} 
                        onClick={() => onSelectEnemy(enemy.id)}
                        className={`flex flex-col items-center z-10 transition-all duration-200 cursor-pointer relative ${isSelected && !actionClass ? 'scale-105 z-20' : ''} ${!isSelected && !actionClass ? 'hover:scale-105' : ''} ${actionClass} ${isTrueBossPhase2 ? 'sinister-aura' : ''} ${tutorialStep === 2 ? 'ring-4 ring-red-500 ring-offset-4 ring-offset-transparent animate-pulse rounded-lg' : ''}`}
                    >
                        {isTrueBossPhase2 && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-900/20 blur-3xl rounded-full void-backglow pointer-events-none z-0"></div>
                        )}

                        <div 
                            className="absolute -top-6 left-1/2 -translate-x-1/2 z-30 bg-white text-black text-xs font-extrabold px-1.5 py-0.5 rounded border-2 border-red-600 animate-bounce whitespace-nowrap shadow-xl flex items-center justify-center min-w-[40px]"
                            onClick={(e) => { e.stopPropagation(); showInfo(trans("敵", languageMode), trans("敵の次の行動です。", languageMode)); }}
                        >
                            {(enemy.nextIntent.type === 'ATTACK' || enemy.nextIntent.type === 'ATTACK_DEBUFF' || enemy.nextIntent.type === 'ATTACK_DEFEND') && (
                                <><Skull size={12} className="mr-1 text-red-600"/> {enemy.nextIntent.value}</>
                            )}
                            {enemy.nextIntent.type === 'DEFEND' && (
                                <><Shield size={12} className="mr-1 text-blue-600"/> {enemy.nextIntent.value}</>
                            )}
                            {(enemy.nextIntent.type === 'BUFF' || enemy.nextIntent.type === 'DEBUFF' || enemy.nextIntent.type === 'SLEEP') && (
                                <><Zap size={12} className="mr-1 text-yellow-500 fill-yellow-500"/> !</>
                            )}
                            {enemy.nextIntent.type === 'UNKNOWN' && <span className="text-gray-600">?</span>}
                        </div>

                        <div className={`relative mb-1 transition-all duration-700 ${isTrueBossPhase2 ? 'w-32 h-32 md:w-48 md:h-48' : 'w-16 h-16 md:w-20 md:h-20'}`}>
                            <PixelSprite seed={enemy.id} name={enemy.name} className="w-full h-full drop-shadow-lg relative z-10" />
                            <FloatingTextOverlay data={enemy.floatingText} languageMode={languageMode} />
                            <VFXOverlay effects={activeEffects} targetId={enemy.id} />
                        </div>

                        <div className={`${isTrueBossPhase2 ? 'w-32 md:w-40 scale-110' : 'w-24 md:w-28'} bg-black/90 border-2 px-1 py-0.5 text-white text-[9px] md:text-[10px] transition-all shadow-md rounded relative z-10 ${isSelected ? 'border-yellow-400 ring-1 ring-yellow-400/50' : 'border-gray-600'} ${isTrueBossPhase2 ? 'border-purple-500' : ''}`}>
                            <div className="flex items-center justify-between mb-0.5 h-4 w-full overflow-hidden">
                                <div className="flex-1 min-w-0 overflow-hidden relative h-full">
                                    {enemyNameNeedsScroll ? (
                                         <div className="flex w-max animate-marquee-scroll text-red-200 font-bold">
                                             <span className="pr-4">{enemyName}</span>
                                             <span className="pr-4">{enemyName}</span>
                                         </div>
                                    ) : (
                                         <div className={`${isTrueBossPhase2 ? 'text-purple-400' : 'text-red-200'} font-bold truncate`}>{enemyName}</div>
                                    )}
                                </div>
                                {enemy.block > 0 && <span className="text-blue-300 flex items-center bg-blue-900/80 px-1 rounded text-[8px] font-bold ml-1 shrink-0" onClick={(e)=>{e.stopPropagation(); showInfo(trans("ブロック", languageMode), trans("次のターン開始時までダメージを防ぐ。", languageMode));}}><Shield size={8} className="mr-0.5"/> {enemy.block}</span>}
                            </div>
                            
                            <div className="relative w-full h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-600 mb-0.5" onClick={(e) => { e.stopPropagation(); showInfo("HP", `現在: ${enemy.currentHp} / 最大: ${enemy.maxHp}`); }}>
                                <div className={`h-full ${isTrueBossPhase2 ? 'bg-gradient-to-r from-purple-800 to-red-600' : 'bg-gradient-to-r from-red-600 to-red-500'} transition-all duration-500`} style={{width: `${enemyHpPercent}%`}}></div>
                                <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white shadow-black drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] leading-none">
                                    {enemy.currentHp}/{enemy.maxHp}
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-0.5 justify-center min-h-[14px]">
                                {enemy.vulnerable > 0 && (
                                    <div className="flex items-center bg-pink-900/80 rounded px-0.5 border border-pink-500/50 cursor-pointer" onClick={(e)=>{e.stopPropagation(); showInfo(trans("脆弱", languageMode), trans("攻撃から受けるダメージが50%増加。", languageMode));}}>
                                        <AlertCircle size={8} className="text-pink-300"/> <span className="text-[8px] ml-0.5 font-bold">{enemy.vulnerable}</span>
                                    </div>
                                )}
                                {enemy.weak > 0 && (
                                    <div className="flex items-center bg-gray-700/80 rounded px-0.5 border border-gray-500/50 cursor-pointer" onClick={(e)=>{e.stopPropagation(); showInfo(trans("弱体", languageMode), trans("攻撃で与えるダメージが25%減少。", languageMode));}}>
                                        <TrendingDown size={8} className="text-gray-300"/> <span className="text-[8px] ml-0.5 font-bold">{enemy.weak}</span>
                                    </div>
                                )}
                                {enemy.poison > 0 && (
                                    <div className="flex items-center bg-green-900/80 rounded px-0.5 border border-green-500/50 cursor-pointer" onClick={(e)=>{e.stopPropagation(); showInfo(trans("ドクドク", languageMode), trans("ターン終了時にHPダメージを受け、数値が1減る。", languageMode));}}>
                                        <Droplets size={8} className="text-green-300"/> <span className="text-[8px] ml-0.5 font-bold">{enemy.poison}</span>
                                    </div>
                                )}
                                {enemy.artifact > 0 && (
                                    <div className="flex items-center bg-yellow-900/80 rounded px-0.5 border border-yellow-500/50 cursor-pointer" onClick={(e)=>{e.stopPropagation(); showInfo(trans("キラキラ", languageMode), trans("デバフを無効化する。", languageMode));}}>
                                        <Hexagon size={8} className="text-yellow-200"/> <span className="text-[8px] ml-0.5 font-bold">{enemy.artifact}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>

        {/* Player Area */}
        <div className="flex items-end pl-2 pb-2 shrink-0 mt-auto">
            <div className="flex items-end relative">
                
                <div className={`w-20 h-20 md:w-24 md:h-24 relative transition-all duration-150 ease-out mr-2 ${getActionClass()}`} onClick={() => showInfo(trans("自分", languageMode), trans("あなたのキャラクター。\nHPが0になるとゲームオーバー。", languageMode))}>
                     <img 
                        src={player.imageData} 
                        alt="Hero" 
                        className="w-full h-full pixel-art" 
                        style={{ imageRendering: 'pixelated' }}
                     />
                     <FloatingTextOverlay data={player.floatingText} languageMode={languageMode} />
                     <VFXOverlay effects={activeEffects} targetId="player" />
                </div>
                
                {player.partner && player.partner.currentHp > 0 && (
                    <div className={`w-16 h-16 md:w-20 md:h-20 relative transition-all duration-150 ease-out mr-2 -ml-6 z-0 ${getActionClass()}`} onClick={() => showInfo(trans(player.partner!.name, languageMode), trans("パートナー。\n倒れるとデッキが1枚しか使えなくなります。", languageMode))}>
                         <img 
                            src={player.partner.imageData} 
                            alt="Partner" 
                            className="w-full h-full pixel-art grayscale-[0.2]" 
                            style={{ imageRendering: 'pixelated' }}
                         />
                         <FloatingTextOverlay data={player.partner.floatingText} languageMode={languageMode} offset="-top-2 -right-2" />
                         
                         <div className="absolute -bottom-2 left-0 w-full h-1 bg-gray-700 rounded-full border border-gray-500 overflow-hidden">
                             <div className="h-full bg-green-500 transition-all duration-500" style={{width: `${(player.partner.currentHp / player.partner.maxHp) * 100}%`}}></div>
                         </div>
                    </div>
                )}

                <div className={`bg-black/80 border-2 border-white p-1 text-white text-xs w-36 md:w-40 mb-2 shadow-lg rounded z-20 ${tutorialStep === 1 ? 'ring-4 ring-green-500 ring-offset-4 ring-offset-transparent animate-pulse' : ''}`}>
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-red-400 flex items-center font-bold" onClick={() => showInfo("HP", trans("ヒットポイント。0になると死亡する。", languageMode))}><Heart size={12} className="mr-1"/> {player.currentHp}/{player.maxHp}</span>
                        <span className="text-blue-400 flex items-center font-bold" onClick={() => showInfo(trans("ブロック", languageMode), trans("次のターン開始時までダメージを防ぐ。", languageMode))}><Shield size={12} className="mr-1"/> {player.block}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-700 rounded-full border border-gray-500 overflow-hidden mb-1">
                        <div className="h-full bg-green-500 transition-all duration-500" style={{width: `${playerHpPercent}%`}}></div>
                    </div>
                    
                    <div className="flex items-center justify-between border-t border-gray-700 pt-1" onClick={() => setShowRelicList(true)}>
                        <div className="flex -space-x-1 overflow-hidden w-20 cursor-pointer hover:bg-white/10 rounded px-1 transition-colors">
                            {displayedRelics.slice(0, 5).map(r => {
                                const counter = getRelicCounter(r.id);
                                return (
                                    <div key={r.id} className="w-4 h-4 md:w-5 md:h-5 bg-gray-700 rounded-full border border-yellow-600 flex items-center justify-center shrink-0 relative group">
                                        <Gem size={10} className="text-yellow-400" />
                                        {counter !== undefined && counter > 0 && (
                                            <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold border border-white shadow-md z-10 pointer-events-none scale-125">
                                                {counter}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {player.relics.length > 5 && (
                                <div className="w-4 h-4 md:w-5 md:h-5 bg-gray-800 rounded-full border border-gray-500 flex items-center justify-center shrink-0 text-[8px] font-bold text-white z-10">
                                    +{player.relics.length - 5}
                                </div>
                            )}
                            {player.relics.length === 0 && <span className="text-[9px] text-gray-500">No Relics</span>}
                        </div>
                        
                        <div className="flex gap-0.5">
                            {player.potions.map(p => (
                                 <div 
                                    key={p.id} 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (!actingEnemyId && !selectionState.active) {
                                            setPotionConfirmation(p);
                                        }
                                    }}
                                    className="w-4 h-4 md:w-5 md:h-5 bg-gray-800 rounded border border-white flex items-center justify-center cursor-pointer hover:scale-110"
                                 >
                                    <FlaskConical size={10} style={{ color: p.color }} />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-0.5 mt-1">
                        {player.strength !== 0 && (
                            <span 
                                className={`flex items-center ${player.strength > 0 ? 'text-red-400' : 'text-gray-400'} text-[9px] font-bold border border-gray-700 px-1 rounded bg-black cursor-pointer`}
                                onClick={() => showInfo(trans("筋力", languageMode), trans("攻撃カードのダメージを増加させる。", languageMode))}
                            >
                                <Sword size={8} className="mr-0.5"/> {player.strength}
                            </span>
                        )}
                        {Object.entries(player.powers).map(([key, val]) => {
                            if ((val as number) <= 0) return null;
                            const def = POWER_DEFINITIONS[key] || { name: key, desc: "効果不明" };
                            return (
                                <span key={key} className="text-yellow-400 text-[8px] border border-yellow-600 px-0.5 rounded bg-black/50 cursor-pointer" onClick={() => showInfo(trans(def.name, languageMode), trans(def.desc, languageMode))}>
                                    {trans(def.name, languageMode)}:{val as number}
                                </span>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* 3. Control Bar */}
      <div className="h-12 bg-gray-800 border-t-2 border-white flex items-center justify-between px-2 shrink-0 z-20 shadow-lg">
          <div className="flex items-center">
              <div className={`bg-black border-2 border-yellow-500 text-yellow-400 px-2 py-0.5 rounded-full flex items-center shadow-lg mr-2 ${tutorialStep === 3 ? 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-transparent animate-pulse' : ''}`} onClick={() => showInfo(trans("エネルギー", languageMode), trans("カードを使用するために必要。ターン毎に回復する。", languageMode))}>
                  <Zap size={14} className="mr-1 fill-yellow-400"/>
                  <span className="text-lg font-bold">{player.currentEnergy}/{player.maxEnergy}</span>
              </div>
              <div className="text-[9px] text-gray-400 flex flex-col leading-tight">
                  <span onClick={() => setShowDeck(true)} className="cursor-pointer hover:text-white flex items-center"><Layers size={10} className="mr-1"/> {player.drawPile.length}</span>
                  <span className="flex items-center" onClick={() => showInfo(trans("捨て札", languageMode), trans("使用済みカード。山札が切れるとリシャッフルされる。", languageMode))}><X size={10} className="mr-1"/> {player.discardPile.length}</span>
              </div>
          </div>
          
          {isDualMode && (
              <button 
                  onClick={executeDualTurn}
                  disabled={!!actingEnemyId || selectionState.active || selectedCardIds.length === 0}
                  className={`
                    bg-indigo-600 border-2 border-indigo-300 px-4 py-1.5 text-xs font-bold shadow-lg transition-all rounded flex items-center gap-1 mx-2
                    ${!actingEnemyId && !selectionState.active && selectedCardIds.length > 0 ? 'hover:bg-indigo-500 animate-pulse cursor-pointer' : 'opacity-50 cursor-not-allowed grayscale'}
                  `}
              >
                  <Users size={12}/> {trans("GO!", languageMode)}
              </button>
          )}

          <button 
              onClick={!actingEnemyId && !selectionState.active ? onEndTurn : undefined}
              disabled={!!actingEnemyId || selectionState.active}
              className={`
                bg-red-600 border-2 border-white px-4 py-1.5 text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all rounded
                ${!actingEnemyId && !selectionState.active ? 'hover:bg-red-500 active:shadow-none active:translate-x-[2px] active:translate-y-[2px] cursor-pointer' : 'opacity-50 cursor-not-allowed grayscale'}
                ${tutorialStep === 5 ? 'ring-4 ring-red-400 ring-offset-2 ring-offset-transparent animate-pulse' : ''}
              `}
          >
              {selectionState.active ? trans("選択", languageMode) : trans("ターン終了", languageMode)}
          </button>
      </div>

      {/* 4. Hand Area */}
      <div className={`h-52 md:h-64 bg-gray-900 border-t border-gray-700 relative z-10 ${selectionState.active ? 'bg-blue-900/20' : ''}`}>
        <div className="group/hand w-full h-full overflow-x-auto px-10 flex items-end justify-start md:justify-center pb-8 custom-scrollbar touch-pan-x" style={{ overflowY: 'visible' }}>
            {player.hand.map((card, i) => {
                const isClashDisabled = card.playCondition === 'HAND_ONLY_ATTACKS' && player.hand.some(c => c.type !== CardType.ATTACK && c.id !== card.id);
                const isGrandFinaleDisabled = card.playCondition === 'DRAW_PILE_EMPTY' && player.drawPile.length > 0;
                const isChokerDisabled = player.relics.some(r => r.id === 'VELVET_CHOKER') && player.cardsPlayedThisTurn >= 6;
                const isNormalityDisabled = player.hand.some(c => c.name === '退屈' || c.name === 'NORMALITY') && player.cardsPlayedThisTurn >= 3;
                
                const isSelectedDual = isDualMode && selectedCardIds.includes(card.id);
                const isSelectedActive = selectionState.active;
                
                const specialDisabled = isClashDisabled || isGrandFinaleDisabled || isChokerDisabled || isNormalityDisabled;
                
                const displayCard = { ...card };
                if (player.powers['CORRUPTION'] && card.type === CardType.SKILL) {
                    displayCard.cost = 0;
                }

                const mid = (player.hand.length - 1) / 2;
                const dist = i - mid;
                const rotation = dist * 2.5; 
                const translateY = Math.abs(dist) * 4; 

                return (
                    <div 
                        key={card.id} 
                        className={`inline-block align-middle transition-all duration-500 ease-out w-28 h-40 md:w-32 md:h-48 shrink-0 relative 
                            -ml-20 first:ml-0 md:ml-0 
                            group-hover/hand:-ml-2 group-active/hand:-ml-2 
                            ${isSelectedActive || isSelectedDual ? 'cursor-pointer -translate-y-8 z-30 scale-110' : 'hover:-translate-y-4 hover:z-20'}
                            ${tutorialStep === 4 ? 'ring-4 ring-blue-500 ring-offset-2 ring-offset-transparent animate-pulse rounded-lg' : ''}
                        `}
                        style={{
                            transform: isSelectedActive || isSelectedDual ? 'translateY(-32px) scale(1.1)' : `rotate(${rotation}deg) translateY(${translateY}px)`,
                            zIndex: isSelectedActive || isSelectedDual ? 40 : 10 + i
                        }}
                    >
                        {isDualMode && isSelectedDual && (
                             <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white shadow-lg z-30 animate-bounce">
                                 {selectedCardIds.indexOf(card.id) === 0 ? "1" : "2"}
                             </div>
                        )}
                        
                        <div className="absolute top-0 left-0 origin-top-left scale-[0.8] md:scale-100">
                            <Card 
                                card={displayCard} 
                                onClick={() => {
                                    if (selectionState.active) {
                                        onHandSelection(card);
                                    } else {
                                        if (isDualMode) {
                                            handleCardClickDual(card, specialDisabled);
                                        } else {
                                            if (!specialDisabled) onPlayCard(card);
                                            else if (isChokerDisabled || isNormalityDisabled) audioService.playSound('wrong');
                                        }
                                    }
                                }} 
                                onInspect={onInspect}
                                disabled={
                                    selectionState.active 
                                    ? false 
                                    : (isDualMode 
                                        ? (!!actingEnemyId || card.unplayable || specialDisabled) 
                                        : (player.currentEnergy < displayCard.cost || !!actingEnemyId || card.unplayable || specialDisabled)
                                      )
                                }
                                languageMode={languageMode}
                            />
                        </div>
                    </div>
                );
            })}
            <div className="w-20 shrink-0"></div>
        </div>
      </div>

      {showDeck && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowDeck(false)}>
            <div className="bg-gray-800 border-4 border-white w-full max-w-md h-[80vh] flex flex-col relative shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="bg-black border-b-2 border-gray-600 p-4 flex justify-between items-center">
                    <h2 className="text-white text-xl font-bold flex items-center">
                        <Layers className="mr-2"/> {trans("山札", languageMode)} ({trans("残り", languageMode)}{player.drawPile.length}{trans("枚", languageMode)})
                    </h2>
                    <button onClick={() => setShowDeck(false)} className="text-gray-400 hover:text-white p-1">
                        <X size={24} />
                    </button>
                </div>
                <div className="p-4 overflow-y-auto flex-grow bg-gray-900/90">
                    <div className="grid grid-cols-3 gap-2 justify-items-center">
                        {[...player.deck].sort((a, b) => a.type.localeCompare(b.type)).map((card) => (
                            <div key={card.id} className="scale-75 origin-top-left w-24 h-36">
                                <Card card={card} onClick={() => {}} disabled={false} languageMode={languageMode} onInspect={onInspect}/>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default BattleScene;

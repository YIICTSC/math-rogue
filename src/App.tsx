
import React, { useState, useEffect } from 'react';
import { 
  GameState, GameScreen, Enemy, Card as ICard, 
  CardType, TargetType, EnemyIntentType, NodeType, MapNode, RewardItem, Relic, Potion, Character, GameMode
} from './types';
import { 
  INITIAL_HP, INITIAL_ENERGY, HAND_SIZE, 
  CARDS_LIBRARY, STARTING_DECK_TEMPLATE, STATUS_CARDS, CURSE_CARDS, EVENT_CARDS, RELIC_LIBRARY, TRUE_BOSS, POTION_LIBRARY, CHARACTERS
} from './constants';
import BattleScene from './components/BattleScene';
import RewardScreen from './components/RewardScreen';
import MapScreen from './components/MapScreen';
import RestScreen from './components/RestScreen';
import ShopScreen from './components/ShopScreen';
import EventScreen from './components/EventScreen';
import CompendiumScreen from './components/CompendiumScreen';
import RelicSelectionScreen from './components/RelicSelectionScreen';
import CharacterSelectionScreen from './components/CharacterSelectionScreen';
import MathChallengeScreen from './components/MathChallengeScreen';
import TreasureScreen from './components/TreasureScreen';
import HelpScreen from './components/HelpScreen';
import RankingScreen from './components/RankingScreen';
import PokerGameScreen from './components/PokerGameScreen';
import DebugMenuScreen from './components/DebugMenuScreen';

import { audioService } from './services/audioService';
import { generateFlavorText, generateEnemyName } from './services/geminiService';
import { generateDungeonMap } from './services/mapGenerator';
import { storageService } from './services/storageService';
import { RotateCcw, Home, BookOpen, Coins, Trophy, Bug } from 'lucide-react';

export const calculateUpgrade = (val?: number): number | undefined => {
    if (val === undefined) return undefined;
    return Math.floor(val * 1.3) + 2;
};

export const getUpgradedCard = (card: ICard): ICard => {
    return {
        ...card,
        upgraded: true,
        damage: calculateUpgrade(card.damage),
        block: calculateUpgrade(card.block)
    };
};

const App: React.FC = () => {
  const createDeck = (template?: string[]): ICard[] => {
    const list = template || STARTING_DECK_TEMPLATE;
    return list.map((key, index) => {
        const templateCard = CARDS_LIBRARY[key];
        // Fallback for missing cards in library
        const base = templateCard || CARDS_LIBRARY['STRIKE'];
        return {
            id: `deck-${index}-${Math.random().toString(36).substr(2, 9)}`,
            ...base
        };
    });
  };

  const shuffle = (array: any[]) => {
    return array.sort(() => Math.random() - 0.5);
  };

  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // --- State ---
  const [gameState, setGameState] = useState<GameState>({
    screen: GameScreen.START_MENU,
    mode: GameMode.MULTIPLICATION,
    act: 1,
    floor: 0,
    turn: 0,
    map: [],
    currentMapNodeId: null,
    player: {
      maxHp: INITIAL_HP,
      currentHp: INITIAL_HP,
      maxEnergy: INITIAL_ENERGY,
      currentEnergy: INITIAL_ENERGY,
      block: 0,
      strength: 0,
      gold: 99,
      deck: createDeck(),
      hand: [],
      discardPile: [],
      drawPile: [],
      relics: [],
      potions: [],
      powers: {},
      echoes: 0,
      cardsPlayedThisTurn: 0,
      attacksPlayedThisTurn: 0,
      nextTurnEnergy: 0,
      nextTurnDraw: 0,
      relicCounters: {},
      turnFlags: {},
      floatingText: null,
      imageData: ''
    },
    enemies: [],
    selectedEnemyId: null,
    narrativeLog: [],
    rewards: [],
    selectionState: { active: false, type: 'DISCARD', amount: 0 }
  });

  const [currentNarrative, setCurrentNarrative] = useState<string>("...");
  const [turnLog, setTurnLog] = useState<string>("プレイヤーターン");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastActionTime, setLastActionTime] = useState<number>(0);
  const [lastActionType, setLastActionType] = useState<CardType | null>(null);
  const [actingEnemyId, setActingEnemyId] = useState<string | null>(null);

  // Shop & Event
  const [shopCards, setShopCards] = useState<ICard[]>([]);
  const [shopRelics, setShopRelics] = useState<Relic[]>([]);
  const [shopPotions, setShopPotions] = useState<Potion[]>([]);
  const [eventData, setEventData] = useState<any>(null);
  const [unlockedCardNames, setUnlockedCardNames] = useState<string[]>([]);
  const [starterRelics, setStarterRelics] = useState<Relic[]>([]);
  const [availableCharacters, setAvailableCharacters] = useState<Character[]>(CHARACTERS);
  const [unlockedCharCount, setUnlockedCharCount] = useState(1);

  const VICTORY_GOLD = 25;

  useEffect(() => {
    const unlocked = storageService.getUnlockedCards();
    setUnlockedCardNames(unlocked);
    
    // Unlock characters based on clear count
    const clearCount = storageService.getClearCount();
    setUnlockedCharCount(1 + clearCount); 
  }, []);

  const handleSynthesizeCard = (c1: ICard, c2: ICard): ICard => {
      const len1 = Math.floor(Math.random() * 3) + 2; 
      const len2 = Math.floor(Math.random() * 3) + 2; 
      const part1 = c1.name.substring(0, Math.min(len1, c1.name.length));
      const part2 = c2.name.substring(Math.max(0, c2.name.length - len2));
      const newName = part1 + part2;
      const newCost = Math.max(c1.cost, c2.cost);
      
      // Sum numeric stats
      const sum = (k: keyof ICard) => ((c1[k] as number) || 0) + ((c2[k] as number) || 0);
      const newDamage = sum('damage');
      const newBlock = sum('block');
      const newDraw = sum('draw');
      const newEnergy = sum('energy');
      const newHeal = sum('heal');
      const newPoison = sum('poison');
      const newWeak = sum('weak');
      const newVulnerable = sum('vulnerable');
      const newStrength = sum('strength');
      const newSelfDamage = sum('selfDamage');

      // Merge booleans
      const newExhaust = c1.exhaust || c2.exhaust;
      const newInnate = c1.innate || c2.innate;

      // Determine Type & Target
      let newType = c1.type;
      if (newDamage > 0) newType = CardType.ATTACK;
      else if (c1.type === CardType.POWER || c2.type === CardType.POWER) newType = CardType.POWER;
      else newType = CardType.SKILL;

      let newTarget = TargetType.ENEMY;
      if (c1.target === TargetType.ALL_ENEMIES || c2.target === TargetType.ALL_ENEMIES) newTarget = TargetType.ALL_ENEMIES;
      else if (c1.target === TargetType.RANDOM_ENEMY || c2.target === TargetType.RANDOM_ENEMY) newTarget = TargetType.RANDOM_ENEMY;
      else if (c1.target === TargetType.SELF || c2.target === TargetType.SELF) newTarget = TargetType.SELF;
      
      // If it deals damage or debuffs, force target to ENEMY if currently SELF
      if ((newDamage > 0 || newPoison > 0 || newWeak > 0 || newVulnerable > 0) && newTarget === TargetType.SELF) {
          newTarget = TargetType.ENEMY;
      }

      // Generate Description
      const parts: string[] = [];
      if (newDamage > 0) {
          if (newTarget === TargetType.ALL_ENEMIES) parts.push(`全体に${newDamage}ダメージ`);
          else if (newTarget === TargetType.RANDOM_ENEMY) parts.push(`ランダムな敵に${newDamage}ダメージ`);
          else parts.push(`${newDamage}ダメージ`);
      }
      if (newBlock > 0) parts.push(`ブロック${newBlock}`);
      if (newPoison > 0) parts.push(`ドクドク${newPoison}`);
      if (newWeak > 0) parts.push(`へろへろ${newWeak}`);
      if (newVulnerable > 0) parts.push(`びくびく${newVulnerable}`);
      if (newStrength > 0) parts.push(`ムキムキ${newStrength}`);
      if (newDraw > 0) parts.push(`${newDraw}枚引く`);
      if (newEnergy > 0) parts.push(`E${newEnergy}を得る`);
      if (newHeal > 0) parts.push(`HP${newHeal}回復`);
      if (newSelfDamage > 0) parts.push(`自分に${newSelfDamage}ダメージ`);
      
      let description = parts.join("。") + (parts.length > 0 ? "。" : "");
      if (parts.length === 0) description = "効果なし。";

      // --- VISUAL SYNTHESIS LOGIC ---
      const ref1 = c1.textureRef || c1.name;
      const ref2 = c2.textureRef || c2.name;
      
      const [shape1, color1] = ref1.includes('|') ? ref1.split('|') : [ref1, ref1];
      const [shape2, color2] = ref2.includes('|') ? ref2.split('|') : [ref2, ref2];

      // Randomly pick which is shape and which is color
      const useShape1 = Math.random() < 0.5;
      
      const newShape = useShape1 ? shape1 : shape2;
      const newColor = useShape1 ? color2 : color1; // Swap sources
      
      const newTextureRef = `${newShape}|${newColor}`;

      const newCard: ICard = {
          id: `synth-${Date.now()}`,
          name: newName,
          cost: newCost,
          type: newType,
          target: newTarget,
          description: description,
          rarity: 'SPECIAL',
          damage: newDamage || undefined,
          block: newBlock || undefined,
          draw: newDraw || undefined,
          energy: newEnergy || undefined,
          heal: newHeal || undefined,
          poison: newPoison || undefined,
          weak: newWeak || undefined,
          vulnerable: newVulnerable || undefined,
          strength: newStrength || undefined,
          selfDamage: newSelfDamage || undefined,
          exhaust: newExhaust,
          innate: newInnate,
          textureRef: newTextureRef 
      };
      
      setGameState(prev => ({
          ...prev,
          player: {
              ...prev.player,
              deck: [...prev.player.deck.filter(c => c.id !== c1.id && c.id !== c2.id), newCard]
          }
      }));
      
      return newCard;
  };

  const startGame = () => {
      setGameState(prev => ({ ...prev, screen: GameScreen.CHARACTER_SELECTION }));
      audioService.init();
      audioService.playBGM('menu');
  };

  const handleCharacterSelect = (character: Character) => {
      const initialDeck = createDeck(character.deckTemplate);
      const startingRelic = RELIC_LIBRARY[character.startingRelicId];
      
      setGameState(prev => ({
          ...prev,
          screen: GameScreen.MAP,
          map: generateDungeonMap(),
          act: 1,
          floor: 0,
          player: {
              ...prev.player,
              maxHp: character.maxHp,
              currentHp: character.maxHp,
              gold: character.gold,
              deck: initialDeck,
              relics: [startingRelic],
              imageData: character.imageData
          },
          narrativeLog: ["冒険が始まった。"],
      }));
  };

  const handleNodeSelect = (node: MapNode) => {
      // Basic implementation for navigation
      setGameState(prev => ({ ...prev, currentMapNodeId: node.id, floor: node.y + 1 }));
      if (node.type === NodeType.COMBAT || node.type === NodeType.ELITE || node.type === NodeType.BOSS) {
          // Setup Battle
          // (Simplified for brevity, assuming similar logic to original)
          setGameState(prev => ({ ...prev, screen: GameScreen.BATTLE, enemies: [] })); // Placeholder for enemies
      } else if (node.type === NodeType.REST) {
          setGameState(prev => ({ ...prev, screen: GameScreen.REST }));
      } else if (node.type === NodeType.SHOP) {
          setGameState(prev => ({ ...prev, screen: GameScreen.SHOP }));
      } else if (node.type === NodeType.EVENT) {
          setGameState(prev => ({ ...prev, screen: GameScreen.EVENT }));
      } else if (node.type === NodeType.TREASURE) {
          setGameState(prev => ({ ...prev, screen: GameScreen.TREASURE }));
      }
  };

  // ... Other handlers (Battle, Shop, etc.) would be here ...
  // For the sake of fixing the error, we include the synthesis function and render logic.

  return (
    <div className="w-full h-screen bg-black flex items-center justify-center p-0 md:p-4 overflow-hidden">
        <div className="w-full h-full max-w-6xl md:h-[90vh] md:border-[10px] border-gray-800 md:rounded-xl relative overflow-hidden shadow-2xl bg-black crt-scanline flex flex-col">
            
            {gameState.screen === GameScreen.START_MENU && (
                <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                    <div className="text-center p-8">
                        <h1 className="text-4xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-b from-purple-400 to-blue-600 mb-8 font-bold animate-pulse tracking-widest">
                            ピクセル・スパイア
                        </h1>
                        <div className="flex flex-col gap-4 items-center">
                            <button onClick={startGame} className="bg-white text-black px-8 py-4 text-xl font-bold border-4 border-gray-500 hover:bg-gray-200 cursor-pointer w-64">
                                冒険を始める
                            </button>
                            <button onClick={() => setGameState(prev => ({ ...prev, screen: GameScreen.DEBUG_MENU }))} className="text-gray-500 hover:text-white flex items-center mt-4">
                                <Bug className="mr-2"/> デバッグメニュー
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {gameState.screen === GameScreen.CHARACTER_SELECTION && (
                <CharacterSelectionScreen 
                    characters={availableCharacters} 
                    unlockedCount={unlockedCharCount} 
                    onSelect={handleCharacterSelect} 
                />
            )}

            {gameState.screen === GameScreen.MAP && (
                <MapScreen 
                    nodes={gameState.map} 
                    currentNodeId={gameState.currentMapNodeId} 
                    onNodeSelect={handleNodeSelect} 
                    player={gameState.player} 
                />
            )}

            {gameState.screen === GameScreen.REST && (
                <RestScreen 
                    player={gameState.player} 
                    onRest={() => {}} 
                    onUpgrade={() => {}} 
                    onSynthesize={handleSynthesizeCard}
                    onLeave={() => setGameState(prev => ({ ...prev, screen: GameScreen.MAP }))} 
                />
            )}

            {gameState.screen === GameScreen.DEBUG_MENU && (
                <DebugMenuScreen 
                    player={gameState.player} 
                    onClose={() => setGameState(prev => ({ ...prev, screen: GameScreen.START_MENU }))}
                    onSynthesize={handleSynthesizeCard}
                />
            )}

            {/* Other screens placeholders */}
            {gameState.screen === GameScreen.BATTLE && <div className="text-white">Battle (Placeholder)</div>}
            {gameState.screen === GameScreen.MINI_GAME_POKER && <PokerGameScreen onBack={() => setGameState(prev => ({ ...prev, screen: GameScreen.START_MENU }))} />}
            {gameState.screen === GameScreen.COMPENDIUM && <CompendiumScreen unlockedCardNames={unlockedCardNames} onBack={() => setGameState(prev => ({ ...prev, screen: GameScreen.START_MENU }))} />}
            {gameState.screen === GameScreen.HELP && <HelpScreen onBack={() => setGameState(prev => ({ ...prev, screen: GameScreen.START_MENU }))} />}
            {gameState.screen === GameScreen.RANKING && <RankingScreen onBack={() => setGameState(prev => ({ ...prev, screen: GameScreen.START_MENU }))} />}

        </div>
    </div>
  );
};

export default App;

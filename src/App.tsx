
import React, { useState, useEffect } from 'react';
import { 
  GameState, GameScreen, Enemy, Card as ICard, 
  CardType, TargetType, EnemyIntentType, NodeType, MapNode, RewardItem, Relic, Potion, GameMode, Character
} from './types';
import { 
  INITIAL_HP, INITIAL_ENERGY, HAND_SIZE, 
  CARDS_LIBRARY, STARTING_DECK_TEMPLATE, STATUS_CARDS, CURSE_CARDS, EVENT_CARDS, RELIC_LIBRARY, TRUE_BOSS, POTION_LIBRARY, HERO_IMAGE_DATA
} from './constants';
import BattleScene from './components/BattleScene';
import RewardScreen from './components/RewardScreen';
import MapScreen from './components/MapScreen';
import RestScreen from './components/RestScreen';
import ShopScreen from './components/ShopScreen';
import EventScreen from './components/EventScreen';
import CompendiumScreen from './components/CompendiumScreen';
import RelicSelectionScreen from './components/RelicSelectionScreen';
import MathChallengeScreen from './components/MathChallengeScreen';
import RankingScreen from './components/RankingScreen';
import CharacterSelectionScreen from './components/CharacterSelectionScreen';
import HelpScreen from './components/HelpScreen';
import TreasureScreen from './components/TreasureScreen';
import { audioService } from './services/audioService';
import { generateFlavorText, generateEnemyName } from './services/geminiService';
import { generateDungeonMap } from './services/mapGenerator';
import { storageService } from './services/storageService';
import { RotateCcw, Home, BookOpen, Trophy, HelpCircle, Archive } from 'lucide-react';

export const calculateUpgrade = (val?: number): number | undefined => {
    if (val === undefined) return undefined;
    return Math.floor(val * 1.3) + 2;
};

export const getUpgradedCard = (card: ICard): ICard => {
    return {
        ...card,
        upgraded: true,
        damage: calculateUpgrade(card.damage),
        block: calculateUpgrade(card.block),
        // Simple heuristic for synthesis/upgrade power
        strength: card.strength ? card.strength + 1 : undefined,
        draw: card.draw ? card.draw + 1 : undefined,
    };
};

const CHARACTERS: Character[] = [
    {
        id: 'WARRIOR',
        name: '勇者',
        description: 'バランスの取れた戦士。HPが高く、回復手段を持つ。',
        maxHp: 80,
        gold: 99,
        startingRelicId: 'BURNING_BLOOD',
        deckTemplate: ['STRIKE', 'STRIKE', 'STRIKE', 'STRIKE', 'DEFEND', 'DEFEND', 'DEFEND', 'DEFEND', 'BASH', 'IRON_WAVE'],
        color: 'red',
        imageData: HERO_IMAGE_DATA // Default
    },
    {
        id: 'ROGUE',
        name: '盗賊',
        description: '手数で攻めるスピードタイプ。毒とナイフを操る。',
        maxHp: 70,
        gold: 99,
        startingRelicId: 'SNAKE_RING',
        deckTemplate: ['STRIKE', 'STRIKE', 'STRIKE', 'STRIKE', 'DEFEND', 'DEFEND', 'DEFEND', 'DEFEND', 'NEUTRALIZE', 'SURVIVOR'],
        color: 'green',
        imageData: HERO_IMAGE_DATA 
    },
    {
        id: 'WIZARD',
        name: '魔導師',
        description: 'オーブを生成して戦う特殊なスタイル。',
        maxHp: 75,
        gold: 99,
        startingRelicId: 'HOLY_WATER', // Placeholder for now
        deckTemplate: ['STRIKE', 'STRIKE', 'STRIKE', 'STRIKE', 'DEFEND', 'DEFEND', 'DEFEND', 'DEFEND', 'ZAP', 'DUALCAST'],
        color: 'blue',
        imageData: HERO_IMAGE_DATA
    }
];

const App: React.FC = () => {
  const createDeck = (template: string[]): ICard[] => {
    return template.map((key, index) => {
        const card = CARDS_LIBRARY[key];
        if (!card) return { ...CARDS_LIBRARY['STRIKE'], id: `fallback-${index}` }; // Fallback
        return {
            id: `deck-${index}-${Math.random().toString(36).substr(2, 9)}`,
            ...card
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
    mode: GameMode.ADDITION,
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
      deck: [],
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
      imageData: HERO_IMAGE_DATA
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
  const [eventResultLog, setEventResultLog] = useState<string | null>(null);
  
  // Unlocks & Meta
  const [unlockedCardNames, setUnlockedCardNames] = useState<string[]>([]);
  const [starterRelics, setStarterRelics] = useState<Relic[]>([]);
  const [clearCount, setClearCount] = useState<number>(0);
  const [selectedCharacter, setSelectedCharacter] = useState<Character>(CHARACTERS[0]);

  const VICTORY_GOLD = 25;

  useEffect(() => {
    setUnlockedCardNames(storageService.getUnlockedCards());
    setClearCount(storageService.getClearCount());
  }, []);

  const unlockCards = (cards: ICard[]) => {
      let updated = false;
      const currentUnlocked = [...storageService.getUnlockedCards()]; 
      cards.forEach(card => {
          if (!currentUnlocked.includes(card.name)) {
              currentUnlocked.push(card.name);
              storageService.saveUnlockedCard(card.name);
              updated = true;
          }
      });
      if (updated) setUnlockedCardNames(currentUnlocked);
  };

  const startGameSequence = () => {
      audioService.init();
      audioService.playSound('select');
      setGameState(prev => ({ ...prev, screen: GameScreen.CHARACTER_SELECTION }));
  };

  const handleCharacterSelect = (char: Character) => {
      setSelectedCharacter(char);
      // Pick 3 random starter relics (for the relic selection screen, though character usually has fixed one. 
      // Let's adapt: The character choice sets the "default", but we can let them pick a bonus or swap.)
      // For simplicity, let's just use the character's starting relic logic or skip relic selection if fixed.
      // Slay the Spire has fixed relic. Let's stick to that for character flavor.
      // BUT, we have a Relic Selection screen in the flow. Let's make it a "Neow's Blessing" style choice.
      
      const starters = [RELIC_LIBRARY[char.startingRelicId], RELIC_LIBRARY.SNAKE_RING, RELIC_LIBRARY.HOLY_WATER];
      // Dedup
      const uniqueStarters = Array.from(new Set(starters.filter(r => r))); 
      setStarterRelics(uniqueStarters);

      setGameState(prev => ({ ...prev, screen: GameScreen.RELIC_SELECTION }));
  };

  const initGame = (relic: Relic) => {
      const initialDeck = createDeck(selectedCharacter.deckTemplate);
      unlockCards(initialDeck);
      const map = generateDungeonMap();

      setGameState({
            screen: GameScreen.MAP,
            mode: GameMode.ADDITION, // Default, maybe add mode select later
            act: 1,
            floor: 0,
            turn: 0,
            map: map,
            currentMapNodeId: null, 
            player: {
                maxHp: selectedCharacter.maxHp,
                currentHp: selectedCharacter.maxHp,
                maxEnergy: INITIAL_ENERGY,
                currentEnergy: INITIAL_ENERGY,
                block: 0,
                strength: 0,
                gold: selectedCharacter.gold,
                deck: initialDeck,
                hand: [],
                discardPile: [],
                drawPile: [],
                relics: [relic],
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
                imageData: selectedCharacter.imageData
            },
            enemies: [],
            selectedEnemyId: null,
            narrativeLog: ["冒険が始まった。"],
            rewards: [],
            selectionState: { active: false, type: 'DISCARD', amount: 0 }
      });
      audioService.playBGM('menu');
  };

  const advanceAct = () => {
      if (gameState.act >= 3) {
          // Go to Final Boss
          const bossNode: MapNode = { id: 'true-boss', x: 3, y: 0, type: NodeType.BOSS, nextNodes: [], completed: false };
          setGameState(prev => ({
              ...prev,
              act: 4,
              floor: 0,
              map: [bossNode],
              currentMapNodeId: null,
              screen: GameScreen.MAP,
              narrativeLog: [...prev.narrativeLog, "深淵のさらに奥底へ..."]
          }));
          return;
      }

      const nextAct = gameState.act + 1;
      const newMap = generateDungeonMap();
      setGameState(prev => ({
          ...prev,
          act: nextAct,
          floor: 0,
          map: newMap,
          currentMapNodeId: null,
          screen: GameScreen.MAP,
          narrativeLog: [...prev.narrativeLog, `第${nextAct}章へ進んだ。`]
      }));
  };

  const returnToTitle = () => {
    audioService.stopBGM();
    setShopCards([]);
    setEventData(null);
    setGameState(prev => ({ ...prev, screen: GameScreen.START_MENU }));
  };

  const generateEvent = (player: any) => {
      // Simplified event generation for brevity - ideally use the library
      const events = [
          {
              title: "大きな魚",
              description: "巨大な魚が吊るされている。「バナナ」「ドーナツ」「箱」、どれか一つを持って行けと書いてある。",
              options: [
                  { label: "バナナ", text: "HPを20回復。", action: () => { setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 20) } })); setEventResultLog("HPが回復した！"); } },
                  { label: "ドーナツ", text: "最大HP+5。", action: () => { setGameState(prev => ({ ...prev, player: { ...prev.player, maxHp: prev.player.maxHp + 5, currentHp: prev.player.currentHp + 5 } })); setEventResultLog("最大HPが増えた！"); } },
              ]
          },
          {
              title: "黄金の偶像",
              description: "古代の祭壇に黄金の偶像が祀られている。罠の気配がする。",
              options: [
                  { label: "奪う", text: "「黄金の偶像」を得る。呪い「怪我」を受ける。", action: () => { 
                      setGameState(prev => ({ ...prev, player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.GOLDEN_IDOL], deck: [...prev.player.deck, { ...CURSE_CARDS.INJURY, id: `curse-${Date.now()}` }] } })); 
                      setEventResultLog("偶像を手に入れたが、呪われた気がする..."); 
                  }},
                  { label: "無視する", text: "何もせず立ち去る。", action: () => { setEventResultLog("賢明な判断だ。"); } }
              ]
          },
      ];
      return events[Math.floor(Math.random() * events.length)];
  };

  const handleNodeSelect = async (node: MapNode) => {
      setIsLoading(true);
      audioService.playSound('select');
      
      const nextState = { ...gameState, currentMapNodeId: node.id, floor: node.y + 1 };
      
      try {
        if (node.type === NodeType.COMBAT || node.type === NodeType.ELITE || node.type === NodeType.BOSS || node.type === NodeType.START) {
            
            const actMultiplier = gameState.act; 
            const floorDifficulty = node.y * (1 + (actMultiplier * 0.5));
            
            let enemies: Enemy[] = [];
            
            if (gameState.act === 4 && node.type === NodeType.BOSS) {
                enemies.push({
                    id: 'true-boss',
                    enemyType: 'BOSS',
                    name: TRUE_BOSS.name,
                    maxHp: TRUE_BOSS.maxHp,
                    currentHp: TRUE_BOSS.maxHp,
                    block: 0,
                    strength: 0,
                    nextIntent: { type: EnemyIntentType.BUFF, value: 0 },
                    vulnerable: 0, weak: 0, poison: 0, artifact: 2, corpseExplosion: false, floatingText: null
                });
                audioService.playBGM('battle');
            } else {
                const numEnemies = node.type === NodeType.BOSS ? 1 : Math.floor(Math.random() * Math.min(3, 1 + Math.floor(node.y / 3))) + 1;
                for (let i = 0; i < numEnemies; i++) {
                    const baseHp = (node.type === NodeType.BOSS ? 100 : 15) * actMultiplier + floorDifficulty + (node.type === NodeType.ELITE ? 20 : 0);
                    const name = await generateEnemyName(node.y);
                    enemies.push({
                        id: `enemy-${node.y}-${i}-${Date.now()}`,
                        enemyType: 'NORMAL',
                        name: node.type === NodeType.BOSS ? `ボス: ${name}` : name,
                        maxHp: Math.floor(baseHp),
                        currentHp: Math.floor(baseHp),
                        block: 0,
                        strength: 0,
                        nextIntent: { type: EnemyIntentType.ATTACK, value: Math.floor((5 + node.y) * actMultiplier) },
                        vulnerable: 0, weak: 0, poison: 0, artifact: 0, corpseExplosion: false, floatingText: null
                    });
                }
            }
            
            // Record Enemies
            enemies.forEach(e => storageService.saveDefeatedEnemy(e.name));

            const flavor = await generateFlavorText(node.type === NodeType.BOSS ? "ボスが現れた！" : "敵と遭遇した。");
            
            const p = { ...nextState.player };
            p.drawPile = shuffle([...p.deck]);
            p.hand = [];
            p.discardPile = [];
            p.currentEnergy = p.maxEnergy;
            p.block = 0;
            p.strength = 0;
            if (p.relics.find(r => r.id === 'MUTAGENIC_STRENGTH')) p.strength += 3;
            p.powers = {};
            p.echoes = 0;
            p.cardsPlayedThisTurn = 0;
            p.attacksPlayedThisTurn = 0;
            p.nextTurnEnergy = 0;
            p.nextTurnDraw = 0;

            if (p.relics.find(r => r.id === 'VAJRA')) p.strength += 1;
            let drawCount = HAND_SIZE;
            if (p.relics.find(r => r.id === 'BAG_OF_PREP')) drawCount += 2;
            if (p.relics.find(r => r.id === 'SNAKE_RING')) drawCount += 2;
            if (p.relics.find(r => r.id === 'BLOOD_VIAL')) p.currentHp = Math.min(p.maxHp, p.currentHp + 2);
            if (node.type === NodeType.BOSS && p.relics.find(r => r.id === 'PENTOGRAPH')) p.currentHp = Math.min(p.maxHp, p.currentHp + 25);
            if (p.relics.find(r => r.id === 'ANCHOR')) p.block += 10;
            if (p.relics.find(r => r.id === 'BRONZE_SCALES')) p.powers['THORNS'] = 3; 

            for(let i=0; i<drawCount; i++) {
                const c = p.drawPile.pop();
                if(c) p.hand.push(c);
            }
            
            // Innate
            const innateCards = p.drawPile.filter(c => c.innate);
            innateCards.forEach(c => {
                 p.drawPile = p.drawPile.filter(dc => dc.id !== c.id);
                 p.hand.push(c);
            });

            setGameState({
                ...nextState,
                screen: GameScreen.BATTLE,
                player: p,
                enemies: enemies,
                selectedEnemyId: enemies[0].id,
                narrativeLog: [...nextState.narrativeLog, flavor]
            });
            setCurrentNarrative(flavor);
            audioService.playBGM('battle');
            setTurnLog("あなたのターン");

        } else if (node.type === NodeType.REST) {
            setGameState({ ...nextState, screen: GameScreen.REST });
            audioService.playBGM('menu');

        } else if (node.type === NodeType.SHOP) {
            // Generate Shop
            const keys = Object.keys(CARDS_LIBRARY).filter(k => !STATUS_CARDS[k] && !CURSE_CARDS[k] && !EVENT_CARDS[k]);
            const cards: ICard[] = [];
            for(let i=0; i<5; i++) {
                const k = keys[Math.floor(Math.random() * keys.length)];
                const c = { ...CARDS_LIBRARY[k] };
                let price = 40 + Math.floor(Math.random() * 60);
                if (c.rarity === 'RARE') price += 50;
                if (c.rarity === 'LEGENDARY') price += 100;
                cards.push({ id: `shop-${i}-${Date.now()}`, ...c, price });
            }
            setShopCards(cards);

            const allRelics = Object.values(RELIC_LIBRARY).filter(r => r.rarity === 'SHOP' || r.rarity === 'COMMON' || r.rarity === 'RARE');
            setShopRelics(shuffle(allRelics).slice(0, 2));

            const allPotions = Object.values(POTION_LIBRARY);
            setShopPotions(shuffle(allPotions).slice(0, 3).map(p => ({ ...p, id: `shop-pot-${Date.now()}-${Math.random()}` })));

            setGameState({ ...nextState, screen: GameScreen.SHOP });
            audioService.playBGM('menu');

        } else if (node.type === NodeType.EVENT) {
            const ev = generateEvent(nextState.player);
            setEventData(ev);
            setEventResultLog(null);
            setGameState({ ...nextState, screen: GameScreen.EVENT });
            audioService.playBGM('menu');
        } else if (node.type === NodeType.TREASURE) {
             // Generate Reward immediately
             const rewards: RewardItem[] = [];
             const relicPool = Object.values(RELIC_LIBRARY).filter(r => r.rarity !== 'BOSS' && r.rarity !== 'STARTER' && r.rarity !== 'SPECIAL');
             const relic = relicPool[Math.floor(Math.random() * relicPool.length)];
             rewards.push({ type: 'RELIC', value: relic, id: `rew-relic-${Date.now()}` });
             rewards.push({ type: 'GOLD', value: getRandomInt(50, 100), id: `rew-gold-${Date.now()}` });
             
             setGameState(prev => ({ ...prev, screen: GameScreen.TREASURE, rewards: rewards }));
             audioService.playBGM('menu');
        }

      } catch (e) {
          console.error(e);
      } finally {
          setIsLoading(false);
      }
  };

  const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

  const handleNodeComplete = () => {
      setGameState(prev => {
          const newMap = prev.map.map(n => {
              if (n.id === prev.currentMapNodeId) return { ...n, completed: true };
              return n;
          });
          return {
              ...prev,
              map: newMap,
              screen: GameScreen.MAP
          };
      });
      audioService.playBGM('menu');
  };

  const startPlayerTurn = () => {
    setTurnLog("あなたのターン");
    setGameState(prev => {
      const p = { ...prev.player };
      
      if (p.powers['DEMON_FORM']) p.strength += p.powers['DEMON_FORM'];
      if (p.powers['ECHO_FORM']) p.echoes = p.powers['ECHO_FORM'];
      if (p.powers['DEVA_FORM']) p.maxEnergy += p.powers['DEVA_FORM']; 
      if (p.relics.find(r => r.id === 'MUTAGENIC_STRENGTH')) p.strength -= 3;
      if (p.relics.find(r => r.id === 'WARPED_TONGS') && p.hand.length > 0) {
          const c = p.hand[Math.floor(Math.random() * p.hand.length)];
          c.upgraded = true; c.damage = calculateUpgrade(c.damage); c.block = calculateUpgrade(c.block);
      }

      // Draw
      const drawCount = HAND_SIZE + (p.powers['TOOLS_OF_THE_TRADE'] ? 1 : 0) + p.nextTurnDraw;
      p.nextTurnDraw = 0;

      let newDrawPile = [...p.drawPile];
      let newDiscardPile = [...p.discardPile];
      let newHand: ICard[] = [];
      
      for (let i = 0; i < drawCount; i++) {
        if (newDrawPile.length === 0) {
          if (newDiscardPile.length === 0) break;
          newDrawPile = shuffle(newDiscardPile);
          newDiscardPile = [];
        }
        const card = newDrawPile.pop();
        if (card) {
            if (card.name === 'VOID') p.currentEnergy = Math.max(0, p.currentEnergy - 1);
            newHand.push(card);
        }
      }
      
      p.currentEnergy = p.maxEnergy + p.nextTurnEnergy;
      p.nextTurnEnergy = 0;

      if (!p.powers['BARRICADE']) p.block = 0;
      p.hand = newHand;
      p.drawPile = newDrawPile;
      p.discardPile = newDiscardPile;
      p.cardsPlayedThisTurn = 0;
      p.attacksPlayedThisTurn = 0;

      return { ...prev, player: p };
    });
  };

  const handlePlayCard = (card: ICard) => {
    if (gameState.player.currentEnergy < card.cost) return;
    if (gameState.enemies.length === 0) return;
    if (actingEnemyId) return; 
    if (gameState.selectionState.active) return;
    if (card.unplayable) return; 

    audioService.playSound(card.type === CardType.ATTACK ? 'attack' : 'block');
    setLastActionType(card.type);
    setLastActionTime(Date.now());

    setGameState(prev => {
      const p = { ...prev.player, hand: [...prev.player.hand], drawPile: [...prev.player.drawPile], discardPile: [...prev.player.discardPile], deck: [...prev.player.deck], powers: { ...prev.player.powers } };
      let enemies = prev.enemies.map(e => ({ ...e }));
      
      p.currentEnergy -= card.cost;
      p.cardsPlayedThisTurn++;
      if (card.type === CardType.ATTACK) p.attacksPlayedThisTurn++;

      if (p.powers['AFTER_IMAGE']) p.block += p.powers['AFTER_IMAGE'];
      if (p.powers['THOUSAND_CUTS']) enemies.forEach(e => e.currentHp -= p.powers['THOUSAND_CUTS']);

      let activations = 1;
      if (p.echoes > 0) { activations++; p.echoes--; }
      if (card.type === CardType.SKILL && p.powers['BURST'] > 0) { activations++; p.powers['BURST']--; }

      for (let act = 0; act < activations; act++) {
          let hits = 1;
          if (card.playCopies) hits += card.playCopies;

          for (let h = 0; h < hits; h++) {
              let targets: Enemy[] = [];
              if (card.target === TargetType.ALL_ENEMIES) targets = enemies;
              else if (card.target === TargetType.RANDOM_ENEMY) targets = [enemies[Math.floor(Math.random() * enemies.length)]];
              else {
                  const target = enemies.find(e => e.id === prev.selectedEnemyId) || enemies[0];
                  if (target) targets = [target];
              }

              if (card.damage || card.damageBasedOnBlock || card.damagePerCardInHand || card.damagePerAttackPlayed || card.damagePerStrike) {
                targets.forEach(e => {
                    const strengthBonus = p.strength * (card.strengthScaling || 1);
                    let baseDamage = (card.damage || 0);
                    if (card.damageBasedOnBlock) baseDamage += p.block;
                    if (card.damagePerCardInHand) baseDamage += (p.hand.filter(c => c.id !== card.id).length) * card.damagePerCardInHand!;
                    if (card.damagePerAttackPlayed) baseDamage += (p.attacksPlayedThisTurn - 1) * card.damagePerAttackPlayed!;
                    if (card.damagePerStrike) baseDamage += (p.deck.filter(c => c.name.includes('ストライク')).length) * card.damagePerStrike!;

                    let damage = baseDamage + strengthBonus;
                    if (e.vulnerable > 0) damage = Math.floor(damage * 1.5);
                    if (p.powers['ENVENOM']) { e.poison += p.powers['ENVENOM']; }
                    
                    if (e.block >= damage) { e.block -= damage; damage = 0; }
                    else { damage -= e.block; e.block = 0; }
                    
                    e.currentHp -= damage;
                    // Floating text for damage
                    e.floatingText = { id: Date.now().toString(), text: `-${damage}`, color: 'text-red-500', iconType: 'sword' };

                    if (card.lifesteal && damage > 0) p.currentHp = Math.min(p.currentHp + damage, p.maxHp);
                    if (e.currentHp <= 0) {
                         if (card.fatalEnergy) p.currentEnergy += card.fatalEnergy;
                         if (card.fatalPermanentDamage) {
                             const deckCard = p.deck.find(c => c.id === card.id);
                             if (deckCard) deckCard.damage = (deckCard.damage || 0) + card.fatalPermanentDamage!;
                         }
                         if (card.fatalMaxHp) { p.maxHp += card.fatalMaxHp!; p.currentHp += card.fatalMaxHp!; }
                         if (e.corpseExplosion) enemies.forEach(other => { if (other.id !== e.id) other.currentHp -= e.maxHp; });
                    }
                });
              }

              if (card.block) { p.block += card.block; p.floatingText = { id: Date.now().toString(), text: `+${card.block}`, color: 'text-blue-400', iconType: 'shield' }; }
              if (card.doubleBlock) p.block *= 2;
              if (card.heal) p.currentHp = Math.min(p.currentHp + card.heal, p.maxHp);
              if (card.energy) p.currentEnergy += card.energy;
              if (card.selfDamage) { p.currentHp -= card.selfDamage; if (p.powers['RUPTURE']) p.strength += p.powers['RUPTURE']; }
              if (card.strength) p.strength += card.strength;
              if (card.vulnerable) targets.forEach(e => { if(e.artifact>0) e.artifact--; else e.vulnerable += card.vulnerable!; });
              if (card.weak) targets.forEach(e => { if(e.artifact>0) e.artifact--; else e.weak += card.weak!; });
              if (card.poison) targets.forEach(e => { if(e.artifact>0) e.artifact--; else e.poison += card.poison!; });
              if (card.poisonMultiplier && targets.length > 0) targets[0].poison *= card.poisonMultiplier;

              if (card.upgradeHand) {
                  p.hand = p.hand.map(c => getUpgradedCard(c));
              }
              if (card.upgradeDeck) {
                  p.deck = p.deck.map(c => getUpgradedCard(c));
                  p.hand = p.hand.map(c => getUpgradedCard(c));
                  p.drawPile = p.drawPile.map(c => getUpgradedCard(c));
                  p.discardPile = p.discardPile.map(c => getUpgradedCard(c));
              }
              if (card.doubleStrength) p.strength *= 2;
              if (card.shuffleHandToDraw) { p.drawPile = shuffle([...p.drawPile, ...p.hand]); p.hand = []; }
              if (card.applyPower) p.powers[card.applyPower.id] = (p.powers[card.applyPower.id] || 0) + card.applyPower.amount;
              if (card.draw) {
                for (let j = 0; j < card.draw; j++) {
                  if (p.drawPile.length === 0) {
                    if (p.discardPile.length === 0) break;
                    p.drawPile = shuffle(p.discardPile);
                    p.discardPile = [];
                  }
                  const newCard = p.drawPile.pop();
                  if (newCard) { if (newCard.name === 'VOID') p.currentEnergy = Math.max(0, p.currentEnergy - 1); p.hand.push(newCard); }
                }
              }
              if (card.addCardToHand) {
                  for (let c=0; c<card.addCardToHand.count; c++) {
                      let newC = { ...CARDS_LIBRARY[card.addCardToHand.cardName], id: `gen-${Date.now()}-${c}` };
                      if (card.addCardToHand.cost0) newC.cost = 0;
                      if (p.powers['MASTER_REALITY']) newC = getUpgradedCard(newC);
                      p.hand.push(newC);
                  }
              }
              if (card.addCardToDraw) {
                   for (let c=0; c<card.addCardToDraw.count; c++) { p.drawPile.push({ ...CARDS_LIBRARY[card.addCardToDraw.cardName], id: `gen-${Date.now()}-${c}` }); }
                   p.drawPile = shuffle(p.drawPile);
              }
              if (card.addCardToDiscard) {
                   for (let c=0; c<card.addCardToDiscard.count; c++) {
                       let newC = { ...CARDS_LIBRARY[card.addCardToDiscard.cardName], id: `gen-${Date.now()}-${c}` };
                       if (p.powers['MASTER_REALITY']) newC = getUpgradedCard(newC);
                       p.discardPile.push(newC);
                   }
              }
              if (card.nextTurnEnergy) p.nextTurnEnergy += card.nextTurnEnergy;
              if (card.nextTurnDraw) p.nextTurnDraw += card.nextTurnDraw;

              enemies = enemies.filter(e => e.currentHp > 0);
          }
      }

      p.hand = p.hand.filter(c => c.id !== card.id);
      if (!card.exhaust && !(card.type === CardType.POWER) && !(card.promptsExhaust === 99)) {
          if (p.powers['CORRUPTION'] && card.type === CardType.SKILL) {
              // Corruption exhaust
          } else {
              p.discardPile.push(card);
          }
      } 
      
      if (card.exhaust || (p.powers['CORRUPTION'] && card.type === CardType.SKILL)) {
          if (p.powers['FEEL_NO_PAIN']) p.block += p.powers['FEEL_NO_PAIN'];
      }

      let nextSelectionState = { ...prev.selectionState };
      if (card.promptsDiscard) nextSelectionState = { active: true, type: 'DISCARD', amount: card.promptsDiscard };
      if (card.promptsCopy) nextSelectionState = { active: true, type: 'COPY', amount: card.promptsCopy };
      if (card.promptsExhaust === 99) {
          if (card.name === '魂の切断' || card.name === 'SEVER_SOUL') {
              const cardsToExhaust = p.hand.filter(c => c.type !== CardType.ATTACK);
              if (p.powers['FEEL_NO_PAIN']) p.block += p.powers['FEEL_NO_PAIN'] * cardsToExhaust.length;
              p.hand = p.hand.filter(c => c.type === CardType.ATTACK);
          } else if (card.name === '鬼火' || card.name === 'FIEND_FIRE') {
               if (p.powers['FEEL_NO_PAIN']) p.block += p.powers['FEEL_NO_PAIN'] * p.hand.length;
               p.hand = [];
          }
      }

      let nextSelectedId = prev.selectedEnemyId;
      if (!enemies.find(e => e.id === nextSelectedId) && enemies.length > 0) nextSelectedId = enemies[0].id;

      return { ...prev, player: p, enemies: enemies, selectedEnemyId: nextSelectedId, selectionState: nextSelectionState };
    });
  };

  const handleEndTurn = async () => {
    audioService.playSound('select');
    setTurnLog("敵のターン...");
    setLastActionType(null);
    await wait(500);

    const enemies = [...gameState.enemies];
    for (const enemy of enemies) {
        if (gameState.player.currentHp <= 0) break;
        if (enemy.poison > 0) {
            enemy.currentHp -= enemy.poison;
            enemy.poison--;
            setGameState(prev => ({ ...prev, enemies: prev.enemies.map(e => e.id === enemy.id ? { ...e, currentHp: enemy.currentHp, poison: enemy.poison } : e) }));
            if (enemy.currentHp <= 0) continue;
        }

        setActingEnemyId(enemy.id);
        await wait(300); 

        if (enemy.nextIntent.type === EnemyIntentType.ATTACK) audioService.playSound('attack');
        else if (enemy.nextIntent.type === EnemyIntentType.DEFEND) audioService.playSound('block');
        else audioService.playSound('select');

        setGameState(prev => {
            const currentEnemyIndex = prev.enemies.findIndex(e => e.id === enemy.id);
            if (currentEnemyIndex === -1) return prev;
            const p = { ...prev.player };
            const newEnemies = [...prev.enemies];
            const e = { ...newEnemies[currentEnemyIndex] };
            newEnemies[currentEnemyIndex] = e;
            e.block = 0; 

            if (e.nextIntent.type === EnemyIntentType.ATTACK) {
                let damage = e.nextIntent.value + (e.strength || 0);
                if (e.weak > 0) damage = Math.floor(damage * 0.75);
                if (p.powers['INTANGIBLE'] > 0) damage = 1;
                if (p.powers['STATIC_DISCHARGE']) e.currentHp -= p.powers['STATIC_DISCHARGE'];
                if (p.powers['BUFFER'] > 0) { p.powers['BUFFER']--; damage = 0; }
                if (p.block >= damage) { p.block -= damage; damage = 0; }
                else { damage -= p.block; p.block = 0; }
                p.currentHp -= damage;
                // Thorns
                if (p.powers['THORNS']) e.currentHp -= p.powers['THORNS'];
            } else if (e.nextIntent.type === EnemyIntentType.DEFEND) e.block = e.nextIntent.value;
            else if (e.nextIntent.type === EnemyIntentType.BUFF) e.strength += 2; 
            
            if (e.vulnerable > 0) e.vulnerable--;
            if (e.weak > 0) e.weak--;

            // New Intent
            const isAttack = Math.random() > 0.4;
            const scaling = Math.floor(prev.floor * 1.5);
            e.nextIntent = { type: isAttack ? EnemyIntentType.ATTACK : EnemyIntentType.DEFEND, value: 5 + scaling };
            
            return { ...prev, player: p, enemies: newEnemies };
        });
        await wait(600);
    }
    setActingEnemyId(null);
    
    setGameState(prev => {
        const p = { ...prev.player };
        if (p.powers['INTANGIBLE'] > 0) p.powers['INTANGIBLE']--;
        
        p.hand.forEach(c => {
            if (c.name === '火傷') p.currentHp -= 2;
            if (c.name === '腐敗') p.currentHp -= 2;
            if (c.name === '後悔') p.currentHp -= p.hand.length;
        });

        p.discardPile = [...p.discardPile, ...p.hand];
        p.hand = [];
        return { ...prev, player: p };
    });
    startPlayerTurn();
  };

  useEffect(() => {
    if (gameState.screen === GameScreen.BATTLE) {
        if (gameState.enemies.length === 0) {
            audioService.playSound('win');
            audioService.stopBGM();
            
            let hpRegen = 0;
            if (gameState.player.relics.find(r => r.id === 'BURNING_BLOOD')) hpRegen = 6;
            
            setGameState(prev => ({ 
                ...prev, 
                player: { ...prev.player, gold: prev.player.gold + VICTORY_GOLD, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + hpRegen) },
                screen: GameScreen.MATH_CHALLENGE // Go to math challenge first
            }));
            
        } else if (gameState.player.currentHp <= 0) {
            audioService.playSound('lose');
            audioService.stopBGM();
            storageService.saveScore({
                id: Date.now().toString(),
                playerName: 'Player',
                characterName: selectedCharacter.name,
                score: gameState.floor * 100 + gameState.player.gold,
                act: gameState.act,
                floor: gameState.floor,
                victory: false,
                date: Date.now()
            });
            setGameState(prev => ({ ...prev, screen: GameScreen.GAME_OVER }));
        }
    }
  }, [gameState.enemies, gameState.player.currentHp, gameState.screen]);

  const handleMathComplete = (correctCount: number) => {
      audioService.stopBGM();
      const bonusGold = correctCount * 10;
      setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + bonusGold } }));
      
      // Go to Rewards
      goToRewardPhase();
  };

  const goToRewardPhase = () => {
    const rewards: RewardItem[] = [];
    
    const allCards = Object.values(CARDS_LIBRARY).filter(c => c.type !== CardType.STATUS && c.type !== CardType.CURSE && c.rarity !== 'SPECIAL');
    while(rewards.length < 3) {
        const roll = Math.random() * 100;
        let targetRarity = 'COMMON';
        if (roll > 93) targetRarity = 'LEGENDARY'; else if (roll > 60) targetRarity = 'RARE';
        const pool = allCards.filter(c => c.rarity === targetRarity).length > 0 ? allCards.filter(c => c.rarity === targetRarity) : allCards;
        const candidate = pool[Math.floor(Math.random() * pool.length)];
        if (!rewards.some(r => r.value.name === candidate.name)) {
            rewards.push({ type: 'CARD', value: { ...candidate, id: `reward-${Date.now()}-${rewards.length}` }, id: `rew-${Date.now()}-${rewards.length}` });
        }
    }

    const currentNode = gameState.map.find(n => n.id === gameState.currentMapNodeId);
    if (currentNode && currentNode.type === NodeType.BOSS) {
        const bossRelics = Object.values(RELIC_LIBRARY).filter(r => r.rarity === 'BOSS');
        const relic = bossRelics[Math.floor(Math.random() * bossRelics.length)];
        rewards.push({ type: 'RELIC', value: relic, id: `rew-relic-${Date.now()}` });
        rewards.push({ type: 'GOLD', value: 100, id: `rew-gold-${Date.now()}` });
    }

    if (Math.random() < 0.4 && !gameState.player.relics.find(r => r.id === 'SOZU')) {
        const allPotions = Object.values(POTION_LIBRARY);
        const potion = allPotions[Math.floor(Math.random() * allPotions.length)];
        rewards.push({ type: 'POTION', value: { ...potion, id: `rew-pot-${Date.now()}` }, id: `rew-pot-${Date.now()}` });
    }

    setGameState(prev => ({ ...prev, screen: GameScreen.REWARD, rewards: rewards }));
    audioService.playSound('select');
  };

  const handleRewardSelection = (item: RewardItem) => {
      audioService.playSound('select');
      setGameState(prev => {
          let p = { ...prev.player };
          let nextRewards = [...prev.rewards];

          if (item.type === 'CARD') {
              p.deck = [...p.deck, item.value];
              p.discardPile = [...p.discardPile, item.value];
              unlockCards([item.value]);
              nextRewards = nextRewards.filter(r => r.type !== 'CARD');
          } else if (item.type === 'RELIC') {
              p.relics = [...p.relics, item.value];
              if (item.value.id === 'SOZU') p.maxEnergy += 1;
              if (item.value.id === 'CURSED_KEY') p.maxEnergy += 1;
              if (item.value.id === 'PHILOSOPHER_STONE') p.maxEnergy += 1;
              if (item.value.id === 'WAFFLE') { p.maxHp += 7; p.currentHp = p.maxHp; }
              nextRewards = nextRewards.filter(r => r.id !== item.id);
          } else if (item.type === 'GOLD') {
              p.gold += item.value;
              nextRewards = nextRewards.filter(r => r.id !== item.id);
          } else if (item.type === 'POTION') {
              if (p.potions.length < 3) {
                  p.potions = [...p.potions, item.value];
                  nextRewards = nextRewards.filter(r => r.id !== item.id);
              }
          }
          
          if (nextRewards.length === 0) setTimeout(finishRewardPhase, 500);
          return { ...prev, player: p, rewards: nextRewards };
      });
  };

  const finishRewardPhase = () => {
      const currentNode = gameState.map.find(n => n.id === gameState.currentMapNodeId);
      if (currentNode && (currentNode.type === NodeType.BOSS || currentNode.type === NodeType.TREASURE)) {
          if (currentNode.type === NodeType.BOSS) advanceAct();
          else handleNodeComplete();
      } else {
          handleNodeComplete();
      }
  };

  const handleRestAction = () => {
      setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.currentHp + Math.floor(prev.player.maxHp * 0.3), prev.player.maxHp) } }));
  };
  const handleUpgradeCard = (card: ICard) => {
      setGameState(prev => ({ ...prev, player: { ...prev.player, deck: prev.player.deck.map(c => c.id === card.id ? getUpgradedCard(c) : c) } }));
  };
  const handleSynthesize = (c1: ICard, c2: ICard): ICard => {
      // Create a chimera card
      const newCard: ICard = {
          ...c1,
          id: `synth-${Date.now()}`,
          name: `${c1.name.slice(0, c1.name.length/2)}${c2.name.slice(c2.name.length/2)}`,
          cost: Math.min(3, Math.floor((c1.cost + c2.cost) / 1.5)),
          damage: (c1.damage || 0) + (c2.damage || 0),
          block: (c1.block || 0) + (c2.block || 0),
          description: `${c1.description} & ${c2.description}`,
          rarity: 'SPECIAL'
      };
      // Remove originals, add new
      setGameState(prev => ({
          ...prev,
          player: {
              ...prev.player,
              deck: [...prev.player.deck.filter(c => c.id !== c1.id && c.id !== c2.id), newCard]
          }
      }));
      return newCard;
  };

  return (
    <div className="w-full h-screen bg-black flex items-center justify-center p-0 md:p-4 overflow-hidden">
        <div className="w-full max-w-6xl h-full md:h-[90vh] md:border-[10px] border-gray-800 rounded-xl relative overflow-hidden shadow-2xl bg-black crt-scanline flex flex-col">
            
            {gameState.screen === GameScreen.START_MENU && (
                <div className="w-full h-full bg-gray-900 flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-[url('https://picsum.photos/1200/800?grayscale&blur=2')] opacity-30"></div>
                    <div className="text-center p-8 z-10">
                        <h1 className="text-5xl md:text-8xl text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-red-600 mb-8 font-bold animate-pulse tracking-widest drop-shadow-lg">
                            PIXEL SPIRE
                        </h1>
                        <p className="text-gray-400 mb-12 text-lg">Act {gameState.act} / Floor {gameState.floor}</p>
                        <div className="flex flex-col gap-4 items-center">
                            <button onClick={startGameSequence} disabled={isLoading} className="bg-white text-black px-8 py-4 text-xl font-bold border-4 border-gray-500 hover:bg-gray-200 cursor-pointer w-72 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.5)] active:shadow-none active:translate-y-1">
                                {isLoading ? "生成中..." : "冒険を始める"}
                            </button>
                            <button onClick={() => setGameState(prev => ({ ...prev, screen: GameScreen.COMPENDIUM }))} className="bg-gray-800 text-amber-500 px-8 py-3 text-lg font-bold border-4 border-amber-600 hover:bg-gray-700 cursor-pointer w-72 flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(217,119,6,0.5)]">
                                <BookOpen className="mr-2"/> 図鑑
                            </button>
                            <button onClick={() => setGameState(prev => ({ ...prev, screen: GameScreen.RANKING }))} className="bg-gray-800 text-blue-400 px-8 py-3 text-lg font-bold border-4 border-blue-600 hover:bg-gray-700 cursor-pointer w-72 flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(37,99,235,0.5)]">
                                <Trophy className="mr-2"/> ランキング
                            </button>
                            <button onClick={() => setGameState(prev => ({ ...prev, screen: GameScreen.HELP }))} className="bg-gray-800 text-green-400 px-8 py-3 text-lg font-bold border-4 border-green-600 hover:bg-gray-700 cursor-pointer w-72 flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(22,163,74,0.5)]">
                                <HelpCircle className="mr-2"/> 遊び方
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {gameState.screen === GameScreen.CHARACTER_SELECTION && (
                <CharacterSelectionScreen characters={CHARACTERS} unlockedCount={clearCount + 1} onSelect={handleCharacterSelect} />
            )}

            {gameState.screen === GameScreen.RELIC_SELECTION && (
                <RelicSelectionScreen relics={starterRelics} onSelect={initGame} />
            )}

            {gameState.screen === GameScreen.COMPENDIUM && (
                <CompendiumScreen unlockedCardNames={unlockedCardNames} onBack={returnToTitle} />
            )}

            {gameState.screen === GameScreen.RANKING && (
                <RankingScreen onBack={returnToTitle} />
            )}
            
            {gameState.screen === GameScreen.HELP && (
                <HelpScreen onBack={returnToTitle} />
            )}

            {gameState.screen === GameScreen.MAP && (
                <MapScreen nodes={gameState.map} currentNodeId={gameState.currentMapNodeId} onNodeSelect={handleNodeSelect} player={gameState.player} />
            )}

            {gameState.screen === GameScreen.BATTLE && (
                <BattleScene 
                    player={gameState.player} enemies={gameState.enemies} selectedEnemyId={gameState.selectedEnemyId} onSelectEnemy={(id) => setGameState(prev => ({...prev, selectedEnemyId: id}))} 
                    onPlayCard={handlePlayCard} onEndTurn={handleEndTurn} turnLog={turnLog} narrative={currentNarrative} lastActionTime={lastActionTime} lastActionType={lastActionType} actingEnemyId={actingEnemyId} 
                    selectionState={gameState.selectionState} 
                    onHandSelection={(card) => {
                         // Similar logic to playCard but just for selection resolving
                         setGameState(prev => {
                              const p = { ...prev.player };
                              const mode = prev.selectionState;
                              if (mode.type === 'DISCARD' || mode.type === 'EXHAUST') {
                                  p.hand = p.hand.filter(c => c.id !== card.id);
                                  if (mode.type === 'DISCARD') p.discardPile.push(card);
                                  if (mode.type === 'EXHAUST' && p.powers['FEEL_NO_PAIN']) p.block += p.powers['FEEL_NO_PAIN'];
                                  const newAmount = mode.amount - 1;
                                  return { ...prev, player: p, selectionState: { ...mode, active: newAmount > 0, amount: newAmount } };
                              }
                              if (mode.type === 'COPY') {
                                 const copy = { ...card, id: `copy-${Date.now()}` };
                                 p.hand.push(copy);
                                 const newAmount = mode.amount - 1;
                                 return { ...prev, player: p, selectionState: { ...mode, active: newAmount > 0, amount: newAmount } };
                              }
                              return prev;
                         });
                    }}
                    onUsePotion={(potion) => {
                         // Potion logic (use directly)
                         audioService.playSound('select');
                         setGameState(prev => {
                             const p = { ...prev.player };
                             const enemies = [...prev.enemies];
                             p.potions = p.potions.filter(pt => pt.id !== potion.id);
                             const target = enemies.find(e => e.id === prev.selectedEnemyId) || enemies[0];

                             if (potion.templateId === 'FIRE_POTION' && target) target.currentHp -= 20;
                             if (potion.templateId === 'BLOCK_POTION') p.block += 12;
                             if (potion.templateId === 'STRENGTH_POTION') p.strength += 2;
                             if (potion.templateId === 'ENERGY_POTION') p.currentEnergy += 2;
                             if (potion.templateId === 'WEAK_POTION' && target) target.weak += 3;
                             if (potion.templateId === 'HEALTH_POTION') p.currentHp = Math.min(p.maxHp, p.currentHp + 15);

                             return { ...prev, player: p, enemies: enemies.filter(e => e.currentHp > 0) };
                         });
                    }}
                />
            )}

            {gameState.screen === GameScreen.MATH_CHALLENGE && (
                <MathChallengeScreen mode={gameState.mode} onComplete={handleMathComplete} />
            )}

            {gameState.screen === GameScreen.REWARD && (
                <RewardScreen rewards={gameState.rewards} onSelectReward={handleRewardSelection} onSkip={finishRewardPhase} isLoading={isLoading} currentPotions={gameState.player.potions} />
            )}

            {gameState.screen === GameScreen.REST && (
                <RestScreen player={gameState.player} onRest={handleRestAction} onUpgrade={handleUpgradeCard} onSynthesize={handleSynthesize} onLeave={handleNodeComplete} />
            )}

            {gameState.screen === GameScreen.SHOP && (
                <ShopScreen 
                    player={gameState.player}
                    shopCards={shopCards}
                    shopRelics={shopRelics}
                    shopPotions={shopPotions}
                    onBuyCard={(card) => {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold - (prev.player.relics.find(r=>r.id==='MEMBERSHIP_CARD') ? Math.floor((card.price||50)*0.5) : (card.price||50)), deck: [...prev.player.deck, { ...card, id: `buy-${Date.now()}` }], discardPile: [...prev.player.discardPile, { ...card, id: `buy-${Date.now()}` }] } }));
                    }}
                    onBuyRelic={(relic) => {
                         setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold - (prev.player.relics.find(r=>r.id==='MEMBERSHIP_CARD') ? Math.floor((relic.price||150)*0.5) : (relic.price||150)), relics: [...prev.player.relics, relic] } }));
                    }}
                    onBuyPotion={(potion, replaceId) => {
                        setGameState(prev => {
                             const p = { ...prev.player };
                             p.gold -= (p.relics.find(r=>r.id==='MEMBERSHIP_CARD') ? Math.floor((potion.price||50)*0.5) : (potion.price||50));
                             if (replaceId) p.potions = p.potions.filter(pt => pt.id !== replaceId);
                             p.potions.push({ ...potion, id: `buy-pot-${Date.now()}` });
                             return { ...prev, player: p };
                        });
                    }}
                    onRemoveCard={(cardId, cost) => {
                         setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold - cost, deck: prev.player.deck.filter(c => c.id !== cardId) } }));
                    }}
                    onLeave={handleNodeComplete}
                />
            )}

            {gameState.screen === GameScreen.EVENT && eventData && (
                <EventScreen title={eventData.title} description={eventData.description} options={eventData.options} resultLog={eventResultLog} onContinue={handleNodeComplete} />
            )}

            {gameState.screen === GameScreen.TREASURE && (
                <TreasureScreen 
                    rewards={gameState.rewards} 
                    hasCursedKey={!!gameState.player.relics.find(r => r.id === 'CURSED_KEY')}
                    onOpen={() => {
                        // Check for Cursed Key
                        if (gameState.player.relics.find(r => r.id === 'CURSED_KEY')) {
                            // Add two random curses
                            const curses = Object.values(CURSE_CARDS);
                            const c1 = { ...curses[Math.floor(Math.random() * curses.length)], id: `curse-${Date.now()}-1` };
                            const c2 = { ...curses[Math.floor(Math.random() * curses.length)], id: `curse-${Date.now()}-2` };
                            setGameState(prev => ({ ...prev, player: { ...prev.player, deck: [...prev.player.deck, c1, c2] } }));
                        }
                    }} 
                    onLeave={() => {
                         // Collect Rewards
                         setGameState(prev => {
                             const p = { ...prev.player };
                             prev.rewards.forEach(r => {
                                 if (r.type === 'GOLD') p.gold += r.value;
                                 if (r.type === 'RELIC') p.relics.push(r.value);
                             });
                             return { ...prev, player: p };
                         });
                         handleNodeComplete();
                    }} 
                />
            )}

            {gameState.screen === GameScreen.GAME_OVER && (
                 <div className="w-full h-full bg-red-900 flex items-center justify-center text-center text-white relative">
                    <div className="absolute inset-0 bg-black/50"></div>
                    <div className="z-10 bg-black/80 p-12 rounded-xl border-4 border-red-600 shadow-2xl">
                        <h1 className="text-6xl mb-4 font-bold text-red-500 animate-pulse">DEFEATED</h1>
                        <p className="mb-8 text-2xl text-gray-300">Act {gameState.act} - Floor {gameState.floor}</p>
                        <div className="flex flex-col gap-4 items-center">
                            <button onClick={startGameSequence} className="bg-white text-black font-bold border-2 border-gray-400 px-8 py-3 cursor-pointer w-64 hover:bg-gray-200 flex items-center justify-center"><RotateCcw className="mr-2" size={20} /> 再挑戦</button>
                            <button onClick={returnToTitle} className="bg-gray-700 border-2 border-white px-8 py-3 cursor-pointer w-64 hover:bg-gray-600 flex items-center justify-center"><Home className="mr-2" size={20} /> タイトルへ戻る</button>
                        </div>
                    </div>
                </div>
            )}

            {gameState.screen === GameScreen.ENDING && (
                 <div className="w-full h-full bg-yellow-900 flex items-center justify-center text-center text-white relative">
                    <div className="absolute inset-0 bg-[url('https://picsum.photos/1200/800?blur=10')] opacity-50 mix-blend-overlay"></div>
                    <div className="z-10 p-12 bg-black/80 rounded-xl border-4 border-yellow-400 shadow-[0_0_50px_rgba(250,204,21,0.5)]">
                        <Trophy size={100} className="text-yellow-400 mx-auto mb-6 animate-bounce" />
                        <h1 className="text-6xl mb-4 font-bold text-yellow-200">VICTORY!</h1>
                        <p className="mb-8 text-xl">
                            あなたは深淵の最奥に到達し、<br/>
                            伝説の「堕落の心臓」を打ち砕きました。<br/>
                            <br/>
                            クリア回数: {clearCount + 1}
                        </p>
                        <button onClick={() => {
                            storageService.incrementClearCount();
                            storageService.saveScore({
                                id: Date.now().toString(),
                                playerName: 'Player',
                                characterName: selectedCharacter.name,
                                score: (gameState.floor * 100 + gameState.player.gold) * 2, // Bonus for win
                                act: 4,
                                floor: gameState.floor,
                                victory: true,
                                date: Date.now()
                            });
                            returnToTitle();
                        }} className="bg-blue-600 border-2 border-white px-12 py-4 cursor-pointer text-xl hover:bg-blue-500 font-bold shadow-lg animate-pulse">
                            伝説となる
                        </button>
                    </div>
                </div>
            )}

        </div>
    </div>
  );
};

export default App;

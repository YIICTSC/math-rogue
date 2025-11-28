
import React, { useState, useEffect, useCallback } from 'react';
import { 
  GameState, GameScreen, Enemy, Card as ICard, 
  CardType, TargetType, EnemyIntentType, NodeType, MapNode, RewardItem, Relic, Potion
} from './types';
import { 
  INITIAL_HP, INITIAL_ENERGY, HAND_SIZE, 
  CARDS_LIBRARY, STARTING_DECK_TEMPLATE, STATUS_CARDS, CURSE_CARDS, EVENT_CARDS, RELIC_LIBRARY, TRUE_BOSS, POTION_LIBRARY
} from './constants';
import BattleScene from './components/BattleScene';
import RewardScreen from './components/RewardScreen';
import MapScreen from './components/MapScreen';
import RestScreen from './components/RestScreen';
import ShopScreen from './components/ShopScreen';
import EventScreen from './components/EventScreen';
import CompendiumScreen from './components/CompendiumScreen';
import RelicSelectionScreen from './components/RelicSelectionScreen';
import { audioService } from './services/audioService';
import { generateFlavorText, generateEnemyName } from './services/geminiService';
import { generateDungeonMap } from './services/mapGenerator';
import { storageService } from './services/storageService';
import { RotateCcw, Home, BookOpen, Coins, Trophy } from 'lucide-react';

export const calculateUpgrade = (val?: number): number | undefined => {
    if (val === undefined) return undefined;
    return Math.floor(val * 1.3) + 2;
};

const App: React.FC = () => {
  const createDeck = (): ICard[] => {
    return STARTING_DECK_TEMPLATE.map((key, index) => ({
      id: `deck-${index}-${Math.random().toString(36).substr(2, 9)}`,
      ...CARDS_LIBRARY[key]
    }));
  };

  const shuffle = (array: any[]) => {
    return array.sort(() => Math.random() - 0.5);
  };

  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // --- State ---
  const [gameState, setGameState] = useState<GameState>({
    screen: GameScreen.START_MENU,
    act: 1,
    floor: 0,
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
      attacksPlayedThisTurn: 0
    },
    enemies: [],
    selectedEnemyId: null,
    narrativeLog: [],
    rewards: [],
    selectionState: { active: false, type: 'DISCARD', amount: 0 }
  });

  const [currentNarrative, setCurrentNarrative] = useState<string>("...");
  const [turnLog, setTurnLog] = useState<string>("プレイヤーターン");
  const [errorMessage, setErrorMessage] = useState<string>("");
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

  const VICTORY_GOLD = 25;

  useEffect(() => {
    const unlocked = storageService.getUnlockedCards();
    setUnlockedCardNames(unlocked);
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

  // --- Start Game Logic ---
  const startGame = async () => {
    try {
        setErrorMessage("");
        setIsLoading(true);
        audioService.init();
        audioService.playSound('select');
        audioService.playBGM('menu');
        
        const initialDeck = createDeck();
        unlockCards(initialDeck);

        // Pick 3 random starter relics
        const starters = [RELIC_LIBRARY.BURNING_BLOOD, RELIC_LIBRARY.SNAKE_RING, RELIC_LIBRARY.HOLY_WATER];
        setStarterRelics(starters);

        setGameState({
            screen: GameScreen.RELIC_SELECTION, // Go to relic select first
            act: 1,
            floor: 0,
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
                deck: initialDeck,
                hand: [],
                discardPile: [],
                drawPile: [],
                relics: [],
                potions: [],
                powers: {},
                echoes: 0,
                cardsPlayedThisTurn: 0,
                attacksPlayedThisTurn: 0
            },
            enemies: [],
            selectedEnemyId: null,
            narrativeLog: ["冒険が始まった。"],
            rewards: [],
            selectionState: { active: false, type: 'DISCARD', amount: 0 }
        });

    } catch (e) {
        console.error("Start Game Error:", e);
        setErrorMessage("エラーが発生しました。");
    } finally {
        setIsLoading(false);
    }
  };

  const handleRelicSelect = (relic: Relic) => {
      const map = generateDungeonMap();
      setGameState(prev => ({
          ...prev,
          screen: GameScreen.MAP,
          map: map,
          player: {
              ...prev.player,
              relics: [relic],
              maxEnergy: relic.id === 'HOLY_WATER' ? prev.player.maxEnergy + 1 : prev.player.maxEnergy
          }
      }));
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
      const random = Math.random();
      const events = [
          {
              title: "大きな魚",
              description: "巨大な魚が吊るされている。「バナナ」「ドーナツ」「箱」、どれか一つを持って行けと書いてある。",
              options: [
                  { label: "バナナ", text: "HPを20回復。", action: () => { setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 20) } })); handleNodeComplete(); } },
                  { label: "ドーナツ", text: "最大HP+5。", action: () => { setGameState(prev => ({ ...prev, player: { ...prev.player, maxHp: prev.player.maxHp + 5, currentHp: prev.player.currentHp + 5 } })); handleNodeComplete(); } },
                  { label: "箱", text: "レリックを得る。呪いを受ける。", action: () => { setGameState(prev => ({ ...prev, player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.WARPED_TONGS], deck: [...prev.player.deck, { ...CURSE_CARDS.REGRET, id: `curse-${Date.now()}` }] } })); handleNodeComplete(); } }
              ]
          },
          {
              title: "聖職者",
              description: "青いローブを着た男が立っている。「不浄なものを浄化しましょうか？」",
              options: [
                  { label: "浄化", text: "カードを1枚削除 (50G)", action: () => { if(player.gold >= 50) { setGameState(prev => ({...prev, screen: GameScreen.SHOP, player: {...prev.player, gold: prev.player.gold - 50 }})); } else { handleNodeComplete(); } } },
                  { label: "治療", text: "HP全回復 (35G)", action: () => { if(player.gold >= 35) { setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold - 35, currentHp: prev.player.maxHp } })); handleNodeComplete(); } else handleNodeComplete(); } },
                  { label: "立ち去る", text: "", action: () => handleNodeComplete() }
              ]
          },
          {
              title: "黄金の偶像",
              description: "古代の祭壇に黄金の偶像が祀られている。罠の気配がする。",
              options: [
                  { label: "奪う", text: "「黄金の偶像」を得る。呪い「怪我」を受ける。", action: () => { setGameState(prev => ({ ...prev, player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.GOLDEN_IDOL], deck: [...prev.player.deck, { ...CURSE_CARDS.INJURY, id: `curse-${Date.now()}` }] } })); handleNodeComplete(); } },
                  { label: "無視する", text: "", action: () => handleNodeComplete() }
              ]
          },
          {
              title: "生ける壁",
              description: "顔のようなものが埋まった壁がある。言葉を話しているようだ。",
              options: [
                  { label: "忘れる", text: "カードを1枚削除。", action: () => { setGameState(prev => ({ ...prev, screen: GameScreen.SHOP })); /* Reuse shop remove UI logic slightly differently in real impl, simplistic here */ } },
                  { label: "変化", text: "カードを1枚変化させる。", action: () => { 
                      const deck = [...player.deck];
                      const idx = Math.floor(Math.random() * deck.length);
                      const keys = Object.keys(CARDS_LIBRARY).filter(k => !STATUS_CARDS[k]);
                      const newCard = CARDS_LIBRARY[keys[Math.floor(Math.random() * keys.length)]];
                      deck[idx] = { ...newCard, id: `trans-${Date.now()}` };
                      setGameState(prev => ({ ...prev, player: { ...prev.player, deck } }));
                      handleNodeComplete();
                  }},
                  { label: "成長", text: "カードを1枚強化。", action: () => { 
                       // Simplify to random upgrade for now
                       const deck = [...player.deck];
                       const upgradeable = deck.filter(c => !c.upgraded);
                       if (upgradeable.length > 0) {
                           const c = upgradeable[Math.floor(Math.random() * upgradeable.length)];
                           c.upgraded = true;
                           c.damage = calculateUpgrade(c.damage);
                           c.block = calculateUpgrade(c.block);
                           setGameState(prev => ({ ...prev, player: { ...prev.player, deck } }));
                       }
                       handleNodeComplete();
                  }}
              ]
          },
          {
              title: "吸血鬼",
              description: "フードを被った集団がいる。「我々の仲間になれば、不死の力を授けよう」",
              options: [
                  { label: "受け入れる", text: "最大HPの30%を失う。ストライクを全て「噛みつき」に変化。", action: () => {
                      const newMax = Math.floor(player.maxHp * 0.7);
                      const newDeck = player.deck.map((c: ICard) => c.name.includes('ストライク') ? { ...EVENT_CARDS.BITE, id: `bite-${Math.random()}` } : c);
                      setGameState(prev => ({ ...prev, player: { ...prev.player, maxHp: newMax, currentHp: Math.min(prev.player.currentHp, newMax), deck: newDeck } }));
                      handleNodeComplete();
                  }},
                  { label: "拒否", text: "", action: () => handleNodeComplete() }
              ]
          },
          {
              title: "亡霊",
              description: "霧の中から亡霊たちが現れた。「肉体を捨てれば、痛みも消える...」",
              options: [
                  { label: "受け入れる", text: "最大HPが半減。「霊体化」を3枚得る。", action: () => {
                       const newMax = Math.floor(player.maxHp * 0.5);
                       const appCards = Array(3).fill(null).map((_, i) => ({ ...EVENT_CARDS.APPARITION, id: `app-${Date.now()}-${i}` }));
                       setGameState(prev => ({ ...prev, player: { ...prev.player, maxHp: newMax, currentHp: Math.min(prev.player.currentHp, newMax), deck: [...prev.player.deck, ...appCards] } }));
                       handleNodeComplete();
                  }},
                  { label: "拒否", text: "", action: () => handleNodeComplete() }
              ]
          },
          {
              title: "呪われた書物",
              description: "古びた祭壇に一冊の本が置かれている。不吉な気配がする。",
              options: [
                  { label: "読む", text: "HPを10失う。特別な本(レリック)を得る。", action: () => {
                      const books = [RELIC_LIBRARY.NECRONOMICON, RELIC_LIBRARY.ENCHIRIDION, RELIC_LIBRARY.NILRYS_CODEX];
                      const book = books[Math.floor(Math.random() * books.length)];
                      setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: prev.player.currentHp - 10, relics: [...prev.player.relics, book] } }));
                      handleNodeComplete();
                  }},
                  { label: "立ち去る", text: "", action: () => handleNodeComplete() }
              ]
          },
          {
              title: "変化の輪",
              description: "グレムリンが巨大なルーレットを回している。「さあ、運試しだ！」",
              options: [
                  { label: "回す", text: "ランダムな結果。", action: () => {
                      const r = Math.random();
                      if (r < 0.2) { // Heal
                          setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: prev.player.maxHp } }));
                      } else if (r < 0.4) { // Damage
                          setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 10) } }));
                      } else if (r < 0.6) { // Gold
                          setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 100 } }));
                      } else if (r < 0.8) { // Curse
                          setGameState(prev => ({ ...prev, player: { ...prev.player, deck: [...prev.player.deck, { ...CURSE_CARDS.DECAY, id: `curse-${Date.now()}` }] } }));
                      } else { // Remove
                          // Simplify to just removing random card
                          const deck = [...player.deck];
                          deck.splice(Math.floor(Math.random()*deck.length), 1);
                          setGameState(prev => ({ ...prev, player: { ...prev.player, deck } }));
                      }
                      handleNodeComplete();
                  }}
              ]
          },
          {
              title: "怪しい薬売り",
              description: "路地裏で男が声をかけてきた。「とびきりの薬、あるよ」",
              options: [
                  { label: "買う", text: "20G支払ってポーションを得る。", action: () => {
                      if (player.gold >= 20) {
                          const pots = Object.values(POTION_LIBRARY);
                          const pot = { ...pots[Math.floor(Math.random() * pots.length)], id: `pot-${Date.now()}` };
                          setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold - 20, potions: [...prev.player.potions, pot].slice(0, 3) } }));
                      }
                      handleNodeComplete();
                  }},
                  { label: "無視", text: "", action: () => handleNodeComplete() }
              ]
          },
          {
              title: "キノコ",
              description: "奇妙なキノコが生い茂る洞窟だ。幻覚が見える...",
              options: [
                  { label: "食べる", text: "HPを20回復。呪い「寄生」を受ける。", action: () => {
                      setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 20), deck: [...prev.player.deck, { ...CURSE_CARDS.PARASITE, id: `curse-${Date.now()}` }] } }));
                      handleNodeComplete();
                  }},
                  { label: "踏み潰す", text: "敵(マッドゴーレム)と戦闘。", action: () => {
                       // Trigger elite fight logic manually or map node change
                       handleNodeComplete(); // Placeholder
                  }}
              ]
          },
          {
              title: "増強者",
              description: "怪しげな装置がある。「力を...欲するか？」",
              options: [
                  { label: "試す", text: "「J.A.X.」を得る。", action: () => {
                      setGameState(prev => ({ ...prev, player: { ...prev.player, deck: [...prev.player.deck, { ...EVENT_CARDS.J_A_X, id: `jax-${Date.now()}` }] } }));
                      handleNodeComplete();
                  }},
                  { label: "変異", text: "「変異性筋力」を得る。", action: () => {
                      setGameState(prev => ({ ...prev, player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.MUTAGENIC_STRENGTH] } }));
                      handleNodeComplete();
                  }}
              ]
          },
          {
             title: "精神開花",
             description: "美しい花が咲いている。頭の中に声が響く。",
             options: [
                 { label: "私は戦う", text: "ボスと戦闘(レアレリック)。", action: () => handleNodeComplete() }, // Simplified
                 { label: "私は富む", text: "999ゴールドを得る。呪い「凡庸」を2枚受ける。", action: () => {
                      setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 999, deck: [...prev.player.deck, { ...CURSE_CARDS.NORMALITY, id: `c1-${Date.now()}` }, { ...CURSE_CARDS.NORMALITY, id: `c2-${Date.now()}` }] } }));
                      handleNodeComplete();
                 }},
                 { label: "私は癒える", text: "HP全回復。", action: () => {
                      setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: prev.player.maxHp } }));
                      handleNodeComplete();
                 }}
             ]
          },
          { title: "古の筆跡", description: "壁に文字が刻まれている。「削除...」", options: [{ label: "消す", text: "カードを1枚削除。", action: () => { setGameState(prev=>({...prev, screen: GameScreen.SHOP})); } }] },
          { title: "落下", description: "足場が崩れた！", options: [{ label: "着地", text: "ダメージを受ける。", action: () => { setGameState(prev=>({...prev, player: {...prev.player, currentHp: Math.max(1, prev.player.currentHp - 10)}})); handleNodeComplete(); } }] },
          { title: "デザイナー", description: "奇抜な服を着た男がいる。", options: [{ label: "調整", text: "HPを失い、カードを削除。", action: () => handleNodeComplete() }] },
          { title: "競技場", description: "観客の歓声が聞こえる。", options: [{ label: "参加", text: "戦闘開始。", action: () => handleNodeComplete() }] },
          { title: "墓場", description: "荒らされた墓がある。", options: [{ label: "探す", text: "レリックを得るかも？", action: () => handleNodeComplete() }] },
          { title: "秘密のポータル", description: "異空間への入り口だ。", options: [{ label: "入る", text: "即座にボスへ。", action: () => handleNodeComplete() }] },
          { title: "鏡", description: "自分の姿が映っている。", options: [{ label: "覗く", text: "カードをコピー。", action: () => handleNodeComplete() }] },
          { title: "顔商人", description: "顔を変えないか？", options: [{ label: "変える", text: "レリック(お面)を得る。", action: () => handleNodeComplete() }] },
          { title: "ネズミ", description: "巨大なネズミだ。", options: [{ label: "遊ぶ", text: "ゴールドを得る。", action: () => handleNodeComplete() }] },
          { title: "焚き火の精霊", description: "精霊が踊っている。", options: [{ label: "捧げる", text: "カードを渡す。", action: () => handleNodeComplete() }] },
          { title: "浄化の泉", description: "清らかな水だ。", options: [{ label: "浴びる", text: "呪いを全て消す。", action: () => { setGameState(prev => ({...prev, player: {...prev.player, deck: prev.player.deck.filter(c => c.type !== CardType.CURSE)}})); handleNodeComplete(); } }] },
          { title: "図書館", description: "静かな場所だ。", options: [{ label: "読む", text: "カードを選ぶ。", action: () => handleNodeComplete() }, { label: "寝る", text: "HP回復。", action: () => { setGameState(prev => ({...prev, player: {...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 20)}})); handleNodeComplete(); } }] },
          { title: "スクラップ", description: "ガラクタの山。", options: [{ label: "掘る", text: "レリックを探す(ダメージ)。", action: () => handleNodeComplete() }] },
          { title: "謎の球体", description: "青く光る球体。", options: [{ label: "触れる", text: "レリックを得る(ダメージ)。", action: () => handleNodeComplete() }] },
          { title: "鍛冶屋", description: "主のいない鍛冶場。", options: [{ label: "鍛える", text: "強化。", action: () => handleNodeComplete() }] },
          { title: "賭博師", description: "賭けをしないか？", options: [{ label: "乗る", text: "ゴールドを得るか失う。", action: () => handleNodeComplete() }] },
          { title: "乞食", description: "金貨をくれ...", options: [{ label: "恵む", text: "75G払い、カード削除。", action: () => handleNodeComplete() }] },
          { title: "狂気の男", description: "ブツブツ言っている。", options: [{ label: "話す", text: "「狂気」を2枚得る。", action: () => { setGameState(prev => ({...prev, player: {...prev.player, deck: [...prev.player.deck, {...EVENT_CARDS.MADNESS, id: `m1-${Date.now()}`}, {...EVENT_CARDS.MADNESS, id: `m2-${Date.now()}`}]}})); handleNodeComplete(); } }] }
      ];

      return events[Math.floor(random * events.length)];
  };

  const handleNodeSelect = async (node: MapNode) => {
      setIsLoading(true);
      audioService.playSound('select');
      
      const nextState = { ...gameState, currentMapNodeId: node.id, floor: node.y + 1 };
      
      try {
        if (node.type === NodeType.COMBAT || node.type === NodeType.ELITE || node.type === NodeType.BOSS || node.type === NodeType.START) {
            
            // Scaling logic based on Act and Floor
            const actMultiplier = gameState.act; 
            const floorDifficulty = node.y * (1 + (actMultiplier * 0.5));
            
            let enemies: Enemy[] = [];
            
            if (gameState.act === 4 && node.type === NodeType.BOSS) {
                // TRUE BOSS
                enemies.push({
                    id: 'true-boss',
                    name: TRUE_BOSS.name,
                    maxHp: TRUE_BOSS.maxHp,
                    currentHp: TRUE_BOSS.maxHp,
                    block: 0,
                    strength: 0,
                    nextIntent: { type: EnemyIntentType.BUFF, value: 0 },
                    vulnerable: 0, weak: 0, poison: 0, artifact: 2, corpseExplosion: false
                });
                audioService.playBGM('battle'); // Use epic bgm ideally
            } else {
                const numEnemies = node.type === NodeType.BOSS ? 1 : Math.floor(Math.random() * Math.min(3, 1 + Math.floor(node.y / 3))) + 1;
                for (let i = 0; i < numEnemies; i++) {
                    const baseHp = (node.type === NodeType.BOSS ? 100 : 15) * actMultiplier + floorDifficulty + (node.type === NodeType.ELITE ? 20 : 0);
                    const name = await generateEnemyName(node.y);
                    enemies.push({
                        id: `enemy-${node.y}-${i}-${Date.now()}`,
                        name: node.type === NodeType.BOSS ? `ボス: ${name}` : name,
                        maxHp: Math.floor(baseHp),
                        currentHp: Math.floor(baseHp),
                        block: 0,
                        strength: 0,
                        nextIntent: { type: EnemyIntentType.ATTACK, value: Math.floor((5 + node.y) * actMultiplier) },
                        vulnerable: 0, weak: 0, poison: 0, artifact: 0, corpseExplosion: false
                    });
                }
            }

            const flavor = await generateFlavorText(node.type === NodeType.BOSS ? "ボスが現れた！" : "敵と遭遇した。");
            
            const p = { ...nextState.player };
            p.drawPile = shuffle([...p.deck]);
            p.hand = [];
            p.discardPile = [];
            p.currentEnergy = p.maxEnergy;
            p.block = 0;
            p.strength = 0;
            // Relic: Mutagenic Strength
            if (p.relics.find(r => r.id === 'MUTAGENIC_STRENGTH')) p.strength += 3;

            p.powers = {};
            // Relic: Enchiridion
            if (p.relics.find(r => r.id === 'ENCHIRIDION')) {
                const powers = Object.values(CARDS_LIBRARY).filter(c => c.type === CardType.POWER);
                const power = powers[Math.floor(Math.random() * powers.length)];
                p.hand.push({ ...power, id: `ench-${Date.now()}`, cost: 0 }); // Free first time
            }
            if (p.relics.find(r => r.id === 'RED_MASK')) enemies.forEach(e => e.weak += 1);

            p.echoes = 0;
            p.cardsPlayedThisTurn = 0;
            p.attacksPlayedThisTurn = 0;

            // Relic: Vajra
            if (p.relics.find(r => r.id === 'VAJRA')) p.strength += 1;
            // Relic: Bag of Prep / Snake Ring (Starter)
            let drawCount = HAND_SIZE;
            if (p.relics.find(r => r.id === 'BAG_OF_PREP')) drawCount += 2;
            if (p.relics.find(r => r.id === 'SNAKE_RING')) drawCount += 2;
            if (p.relics.find(r => r.id === 'BLOOD_VIAL')) p.currentHp = Math.min(p.maxHp, p.currentHp + 2);
            if (node.type === NodeType.BOSS && p.relics.find(r => r.id === 'PENTOGRAPH')) p.currentHp = Math.min(p.maxHp, p.currentHp + 25);
            // Relic: Anchor
            if (p.relics.find(r => r.id === 'ANCHOR')) p.block += 10;
            if (p.relics.find(r => r.id === 'BRONZE_SCALES')) p.powers['THORNS'] = 3; 

            for(let i=0; i<drawCount; i++) {
                const c = p.drawPile.pop();
                if(c) p.hand.push(c);
            }
            
            // Innate Cards
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
            // Generate Shop Cards
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

            // Generate Shop Relics
            const allRelics = Object.values(RELIC_LIBRARY).filter(r => r.rarity === 'SHOP' || r.rarity === 'COMMON' || r.rarity === 'RARE');
            const relicOptions = shuffle(allRelics).slice(0, 2);
            setShopRelics(relicOptions);

            // Generate Shop Potions
            const allPotions = Object.values(POTION_LIBRARY);
            const potionOptions: Potion[] = shuffle(allPotions).slice(0, 3).map(p => ({ ...p, id: `shop-pot-${Date.now()}-${Math.random()}` }));
            setShopPotions(potionOptions);

            setGameState({ ...nextState, screen: GameScreen.SHOP });
            audioService.playBGM('menu');

        } else if (node.type === NodeType.EVENT) {
            const ev = generateEvent(nextState.player);
            setEventData(ev);
            setGameState({ ...nextState, screen: GameScreen.EVENT });
            audioService.playBGM('menu');
        }

      } catch (e) {
          console.error(e);
      } finally {
          setIsLoading(false);
      }
  };

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

  // --- Battle Logic ---
  const startPlayerTurn = () => {
    setTurnLog("あなたのターン");
    setGameState(prev => {
      const p = { ...prev.player };
      
      // Powers
      if (p.powers['DEMON_FORM']) p.strength += p.powers['DEMON_FORM'];
      if (p.powers['ECHO_FORM']) p.echoes = p.powers['ECHO_FORM'];
      if (p.powers['DEVA_FORM']) p.maxEnergy += p.powers['DEVA_FORM']; 
      // Relic: Mutagenic Strength (Lose)
      if (p.relics.find(r => r.id === 'MUTAGENIC_STRENGTH')) p.strength -= 3;
      // Relic: Warped Tongs
      if (p.relics.find(r => r.id === 'WARPED_TONGS') && p.hand.length > 0) {
          const c = p.hand[Math.floor(Math.random() * p.hand.length)];
          c.upgraded = true; c.damage = calculateUpgrade(c.damage); c.block = calculateUpgrade(c.block);
      }

      // Draw
      const drawCount = HAND_SIZE + (p.powers['TOOLS_OF_THE_TRADE'] ? 1 : 0);
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
      
      p.currentEnergy = p.maxEnergy;
      if (!p.powers['BARRICADE']) p.block = 0;
      p.hand = newHand;
      p.drawPile = newDrawPile;
      p.discardPile = newDiscardPile;
      p.cardsPlayedThisTurn = 0;
      p.attacksPlayedThisTurn = 0;

      return { ...prev, player: p };
    });
  };

  const handleSelectEnemy = (id: string) => {
    setGameState(prev => ({ ...prev, selectedEnemyId: id }));
  };

  const applyDebuff = (enemy: Enemy, type: 'WEAK' | 'VULNERABLE' | 'POISON', amount: number) => {
      if (enemy.artifact > 0) {
          enemy.artifact--;
          return;
      }
      if (type === 'WEAK') enemy.weak += amount;
      if (type === 'VULNERABLE') enemy.vulnerable += amount;
      if (type === 'POISON') enemy.poison += amount;
  };

  const handleHandSelection = (card: ICard) => {
      setGameState(prev => {
          const p = { ...prev.player };
          const mode = prev.selectionState;
          
          if (mode.type === 'DISCARD' || mode.type === 'EXHAUST') {
              p.hand = p.hand.filter(c => c.id !== card.id);
              if (mode.type === 'DISCARD') {
                 p.discardPile.push(card);
              } else if (mode.type === 'EXHAUST') {
                 if (p.powers['FEEL_NO_PAIN']) p.block += p.powers['FEEL_NO_PAIN'];
              }
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
  };

  const handleUsePotion = (potion: Potion) => {
      if (gameState.screen !== GameScreen.BATTLE) return;
      audioService.playSound('select');
      
      setGameState(prev => {
          const p = { ...prev.player };
          const enemies = [...prev.enemies];
          
          // Remove potion
          p.potions = p.potions.filter(pt => pt.id !== potion.id);

          // Apply Effect
          const target = enemies.find(e => e.id === prev.selectedEnemyId) || enemies[0];

          if (potion.templateId === 'FIRE_POTION' && target) {
              target.currentHp -= 20;
          } else if (potion.templateId === 'BLOCK_POTION') {
              p.block += 12;
          } else if (potion.templateId === 'STRENGTH_POTION') {
              p.strength += 2;
          } else if (potion.templateId === 'ENERGY_POTION') {
              p.currentEnergy += 2;
          } else if (potion.templateId === 'WEAK_POTION' && target) {
              applyDebuff(target, 'WEAK', 3);
          } else if (potion.templateId === 'HEALTH_POTION') {
              p.currentHp = Math.min(p.maxHp, p.currentHp + 15);
          }

          // Clean up dead enemies (simple check)
          const remainingEnemies = enemies.filter(e => e.currentHp > 0);

          return { ...prev, player: p, enemies: remainingEnemies };
      });
  };

  const handlePlayCard = (card: ICard) => {
    if (gameState.player.currentEnergy < card.cost) return;
    if (gameState.enemies.length === 0) return;
    if (actingEnemyId) return; 
    if (gameState.selectionState.active) return;
    if (card.unplayable) return; // Curse check

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

      // --- Activations Loop (Echo Form, Burst) ---
      let activations = 1;
      if (p.echoes > 0) { activations++; p.echoes--; }
      if (card.type === CardType.SKILL && p.powers['BURST'] > 0) { activations++; p.powers['BURST']--; }

      for (let act = 0; act < activations; act++) {
          
          // --- Multi-hit Loop (Twin Strike, Whirlwind, etc.) ---
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
                    if (p.powers['ENVENOM']) applyDebuff(e, 'POISON', p.powers['ENVENOM']);
                    
                    if (e.block >= damage) { e.block -= damage; damage = 0; }
                    else { damage -= e.block; e.block = 0; }
                    
                    e.currentHp -= damage;
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

              if (card.block) p.block += card.block;
              if (card.doubleBlock) p.block *= 2;
              if (card.heal) p.currentHp = Math.min(p.currentHp + card.heal, p.maxHp);
              if (card.energy) p.currentEnergy += card.energy;
              if (card.selfDamage) { p.currentHp -= card.selfDamage; if (p.powers['RUPTURE']) p.strength += p.powers['RUPTURE']; }
              if (card.strength) p.strength += card.strength;
              if (card.vulnerable) targets.forEach(e => applyDebuff(e, 'VULNERABLE', card.vulnerable!));
              if (card.weak) targets.forEach(e => applyDebuff(e, 'WEAK', card.weak!));
              if (card.poison) targets.forEach(e => applyDebuff(e, 'POISON', card.poison!));
              
              if (card.upgradeHand) {
                  p.hand = p.hand.map(c => ({ ...c, upgraded: true, damage: calculateUpgrade(c.damage), block: calculateUpgrade(c.block) }));
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
                      if (p.powers['MASTER_REALITY']) { newC.upgraded = true; newC.damage = calculateUpgrade(newC.damage); newC.block = calculateUpgrade(newC.block); }
                      p.hand.push(newC);
                  }
              }
              if (card.addCardToDraw) {
                   for (let c=0; c<card.addCardToDraw.count; c++) { p.drawPile.push({ ...CARDS_LIBRARY[card.addCardToDraw.cardName], id: `gen-${Date.now()}-${c}` }); }
                   p.drawPile = shuffle(p.drawPile);
              }
              enemies = enemies.filter(e => e.currentHp > 0);
          }
      }

      p.hand = p.hand.filter(c => c.id !== card.id);
      if (!card.exhaust && !(card.type === CardType.POWER) && !(card.promptsExhaust === 99)) {
          p.discardPile.push(card);
      } else if (p.powers['FEEL_NO_PAIN']) {
           p.block += p.powers['FEEL_NO_PAIN'];
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
                // Thorns logic
                if (p.powers['THORNS']) e.currentHp -= p.powers['THORNS'];
            } else if (e.nextIntent.type === EnemyIntentType.DEFEND) e.block = e.nextIntent.value;
            else if (e.nextIntent.type === EnemyIntentType.BUFF) e.strength += 2; // Simple buff logic
            
            if (e.vulnerable > 0) e.vulnerable--;
            if (e.weak > 0) e.weak--;

            // New Intent
            if (e.id === 'true-boss') {
                 // Simple Heart Logic
                 const moves = ['ATTACK', 'BUFF', 'ATTACK', 'DEBUFF'];
                 const move = moves[Math.floor(Math.random() * moves.length)];
                 e.nextIntent = { type: move as any, value: move === 'ATTACK' ? 2 * 15 : 0 }; // Multi-hit simulation
            } else {
                const isAttack = Math.random() > 0.4;
                const scaling = Math.floor(prev.floor * 1.5);
                e.nextIntent = { type: isAttack ? EnemyIntentType.ATTACK : EnemyIntentType.DEFEND, value: 5 + scaling };
            }
            return { ...prev, player: p, enemies: newEnemies };
        });
        await wait(600);
    }
    setActingEnemyId(null);
    
    // Process End of Turn Curses/Statuses
    setGameState(prev => {
        const p = { ...prev.player };
        if (p.powers['INTANGIBLE'] > 0) p.powers['INTANGIBLE']--;
        
        // Curse Logic
        p.hand.forEach(c => {
            if (c.name === '火傷') p.currentHp -= 2;
            if (c.name === '腐敗') p.currentHp -= 2;
            if (c.name === '疑念') applyDebuff({ ...p } as any, 'WEAK', 1); // Helper issue types
            if (c.name === '恥辱') applyDebuff({ ...p } as any, 'VULNERABLE', 1);
            if (c.name === '後悔') p.currentHp -= p.hand.length;
        });

        p.discardPile = [...p.discardPile, ...p.hand];
        p.hand = [];
        return { ...prev, player: p };
    });
    startPlayerTurn();
  };

  // --- Battle End Check ---
  useEffect(() => {
    if (gameState.screen === GameScreen.BATTLE) {
        if (gameState.enemies.length === 0) {
            audioService.playSound('win');
            audioService.stopBGM();
            
            // Relic: Burning Blood
            let hpRegen = 0;
            if (gameState.player.relics.find(r => r.id === 'BURNING_BLOOD')) hpRegen = 6;
            
            if (gameState.act === 4) {
                 // TRUE ENDING
                 setGameState(prev => ({ ...prev, screen: GameScreen.ENDING }));
            } else {
                 setGameState(prev => ({ 
                    ...prev, 
                    player: { ...prev.player, gold: prev.player.gold + VICTORY_GOLD, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + hpRegen) },
                    screen: GameScreen.VICTORY
                }));
            }
        } else if (gameState.player.currentHp <= 0) {
            audioService.playSound('lose');
            audioService.stopBGM();
            setGameState(prev => ({ ...prev, screen: GameScreen.GAME_OVER }));
        }
    }
  }, [gameState.enemies, gameState.player.currentHp, gameState.screen]);

  // --- Reward Logic ---
  const goToRewardPhase = () => {
    const rewards: RewardItem[] = [];
    
    // 1. Card Reward
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

    // 2. Boss Relic Reward (If boss node)
    const currentNode = gameState.map.find(n => n.id === gameState.currentMapNodeId);
    if (currentNode && currentNode.type === NodeType.BOSS) {
        const bossRelics = Object.values(RELIC_LIBRARY).filter(r => r.rarity === 'BOSS');
        const relic = bossRelics[Math.floor(Math.random() * bossRelics.length)];
        rewards.push({ type: 'RELIC', value: relic, id: `rew-relic-${Date.now()}` });
        rewards.push({ type: 'GOLD', value: 100, id: `rew-gold-${Date.now()}` });
    }

    // 3. Potion Reward (Chance)
    if (Math.random() < 0.4 && !gameState.player.relics.find(r => r.id === 'SOZU')) {
        const allPotions = Object.values(POTION_LIBRARY);
        const potion = allPotions[Math.floor(Math.random() * allPotions.length)];
        rewards.push({ type: 'POTION', value: { ...potion, id: `rew-pot-${Date.now()}` }, id: `rew-pot-${Date.now()}` });
    }

    setGameState(prev => ({ ...prev, screen: GameScreen.REWARD, rewards: rewards }));
    audioService.playSound('select');
  };

  const handleRewardSelection = (item: RewardItem) => {
      if (isLoading) return;
      audioService.playSound('select');

      setGameState(prev => {
          let p = { ...prev.player };
          let nextRewards = [...prev.rewards];

          if (item.type === 'CARD') {
              p.deck = [...p.deck, item.value];
              p.discardPile = [...p.discardPile, item.value];
              unlockCards([item.value]);
              // Remove ALL card rewards to enforce "Pick 1"
              nextRewards = nextRewards.filter(r => r.type !== 'CARD');
          } else if (item.type === 'RELIC') {
              p.relics = [...p.relics, item.value];
              if (item.value.id === 'SOZU') p.maxEnergy += 1; // Immediate effect
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
          
          if (nextRewards.length === 0) {
              setTimeout(finishRewardPhase, 500);
          }

          return { ...prev, player: p, rewards: nextRewards };
      });
  };

  const finishRewardPhase = () => {
      const currentNode = gameState.map.find(n => n.id === gameState.currentMapNodeId);
      if (currentNode && currentNode.type === NodeType.BOSS) {
          advanceAct();
      } else {
          handleNodeComplete();
      }
  };

  // --- Rest & Shop ---
  const handleRestAction = () => {
      setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.currentHp + Math.floor(prev.player.maxHp * 0.3), prev.player.maxHp) } }));
  };
  const handleUpgradeCard = (card: ICard) => {
      setGameState(prev => ({ ...prev, player: { ...prev.player, deck: prev.player.deck.map(c => c.id === card.id ? { ...c, upgraded: true, damage: calculateUpgrade(c.damage), block: calculateUpgrade(c.block) } : c) } }));
  };

  // --- Render ---
  return (
    <div className="w-full h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-4xl h-[600px] border-[10px] md:border-[20px] border-gray-800 rounded-xl relative overflow-hidden shadow-2xl bg-black crt-scanline">
            
            {gameState.screen === GameScreen.START_MENU && (
                <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                    <div className="text-center p-8">
                        <h1 className="text-6xl text-transparent bg-clip-text bg-gradient-to-b from-purple-400 to-blue-600 mb-8 font-bold animate-pulse tracking-widest">
                            ピクセル・スパイア
                        </h1>
                        <p className="text-gray-400 mb-12 text-sm">Act {gameState.act} / Floor {gameState.floor}</p>
                        <div className="flex flex-col gap-4 items-center">
                            <button onClick={startGame} disabled={isLoading} className="bg-white text-black px-8 py-4 text-xl font-bold border-4 border-gray-500 hover:bg-gray-200 cursor-pointer w-64">
                                {isLoading ? "生成中..." : "冒険を始める"}
                            </button>
                            <button onClick={() => setGameState(prev => ({ ...prev, screen: GameScreen.COMPENDIUM }))} className="bg-gray-800 text-amber-500 px-8 py-3 text-lg font-bold border-4 border-amber-600 hover:bg-gray-700 cursor-pointer w-64 flex items-center justify-center">
                                <BookOpen className="mr-2"/> カード図鑑
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {gameState.screen === GameScreen.RELIC_SELECTION && (
                <RelicSelectionScreen relics={starterRelics} onSelect={handleRelicSelect} />
            )}

            {gameState.screen === GameScreen.COMPENDIUM && (
                <CompendiumScreen unlockedCardNames={unlockedCardNames} onBack={returnToTitle} />
            )}

            {gameState.screen === GameScreen.MAP && (
                <MapScreen nodes={gameState.map} currentNodeId={gameState.currentMapNodeId} onNodeSelect={handleNodeSelect} player={gameState.player} />
            )}

            {gameState.screen === GameScreen.BATTLE && (
                <BattleScene 
                    player={gameState.player} enemies={gameState.enemies} selectedEnemyId={gameState.selectedEnemyId} onSelectEnemy={handleSelectEnemy} onPlayCard={handlePlayCard} onEndTurn={handleEndTurn} turnLog={turnLog} narrative={currentNarrative} lastActionTime={lastActionTime} lastActionType={lastActionType} actingEnemyId={actingEnemyId} selectionState={gameState.selectionState} onHandSelection={handleHandSelection}
                    onUsePotion={handleUsePotion}
                />
            )}

            {gameState.screen === GameScreen.VICTORY && (
                 <div className="w-full h-full bg-green-900 flex items-center justify-center text-center text-white">
                    <div>
                        <h1 className="text-4xl mb-4 text-yellow-400 font-bold">勝利！</h1>
                        <div className="text-yellow-400 text-2xl font-bold mb-4 flex items-center justify-center"><Coins className="mr-2"/> +{VICTORY_GOLD} G</div>
                        <button onClick={goToRewardPhase} className="bg-blue-600 px-8 py-4 border-2 border-white font-bold animate-bounce cursor-pointer">報酬を確認</button>
                    </div>
                 </div>
            )}

            {gameState.screen === GameScreen.REWARD && (
                <RewardScreen rewards={gameState.rewards} onSelectReward={handleRewardSelection} onSkip={finishRewardPhase} isLoading={isLoading} />
            )}

            {gameState.screen === GameScreen.REST && (
                <RestScreen player={gameState.player} onRest={handleRestAction} onUpgrade={handleUpgradeCard} onLeave={handleNodeComplete} />
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
                    onBuyPotion={(potion) => {
                        if (gameState.player.potions.length < 3) {
                             setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold - (prev.player.relics.find(r=>r.id==='MEMBERSHIP_CARD') ? Math.floor((potion.price||50)*0.5) : (potion.price||50)), potions: [...prev.player.potions, { ...potion, id: `buy-pot-${Date.now()}` }] } }));
                        }
                    }}
                    onRemoveCard={(cardId, cost) => {
                         setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold - cost, deck: prev.player.deck.filter(c => c.id !== cardId) } }));
                    }}
                    onLeave={handleNodeComplete}
                />
            )}

            {gameState.screen === GameScreen.EVENT && eventData && (
                <EventScreen title={eventData.title} description={eventData.description} options={eventData.options} />
            )}

            {gameState.screen === GameScreen.GAME_OVER && (
                 <div className="w-full h-full bg-red-900 flex items-center justify-center text-center text-white">
                    <div>
                        <h1 className="text-6xl mb-4 font-bold">死亡</h1>
                        <p className="mb-8 text-2xl">Act {gameState.act} - Floor {gameState.floor}</p>
                        <div className="flex flex-col gap-4 items-center">
                            <button onClick={startGame} className="bg-black border-2 border-white px-8 py-3 cursor-pointer w-64 hover:bg-gray-800 flex items-center justify-center"><RotateCcw className="mr-2" size={20} /> 再挑戦</button>
                            <button onClick={returnToTitle} className="bg-gray-700 border-2 border-white px-8 py-3 cursor-pointer w-64 hover:bg-gray-600 flex items-center justify-center"><Home className="mr-2" size={20} /> タイトルへ戻る</button>
                        </div>
                    </div>
                </div>
            )}

            {gameState.screen === GameScreen.ENDING && (
                 <div className="w-full h-full bg-yellow-900 flex items-center justify-center text-center text-white">
                    <div>
                        <Trophy size={80} className="text-yellow-400 mx-auto mb-6 animate-pulse" />
                        <h1 className="text-6xl mb-4 font-bold text-yellow-200">ゲームクリア！</h1>
                        <p className="mb-8 text-xl">あなたは堕落の心臓を打ち砕き、<br/>ピクセル・スパイアの頂点に到達しました。</p>
                        <button onClick={returnToTitle} className="bg-blue-600 border-2 border-white px-8 py-4 cursor-pointer text-xl hover:bg-blue-500 font-bold">伝説となる</button>
                    </div>
                </div>
            )}

        </div>
    </div>
  );
};

export default App;

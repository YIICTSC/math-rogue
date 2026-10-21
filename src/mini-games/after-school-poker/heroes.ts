import type { PokerSupporter } from "../../types";
import { PROTAGONISTS } from "../../three/protagonistCatalog";

export const POKER_HEROES = PROTAGONISTS.filter(
  (hero) => !hero.id.startsWith("elementary-"),
);
export const DEFAULT_POKER_HERO = "high-school-warrior";
// Personal keepsakes occupy one regular supporter slot and can be sold. They
// never enter the random shop pool; their effect is restored from this catalog.
const keepsakes = [
  [
    "high-school-warrior",
    "反逆の校章",
    "Rebel crest",
    "FIST",
    "常に倍率 +4。最後の手数ではさらに +4。",
    "Always +4 Mult; another +4 on the last hand.",
    (c: C) => {
      c.mult += c.handsRemaining === 1 ? 8 : 4;
    },
  ],
  [
    "high-school-caretaker",
    "応援うさぎ",
    "Cheering rabbit",
    "SMILE",
    "ハートのカード1枚につき基礎点 +18。",
    "+18 Chips for every played Heart.",
    (c: C) => {
      c.chips += c.cards.filter((x) => x.suit === "HEART").length * 18;
    },
  ],
  [
    "high-school-assassin",
    "転校生の秘密",
    "Transfer secret",
    "GHOST",
    "3枚以下の役で倍率 +7。",
    "+7 Mult when playing at most 3 cards.",
    (c: C) => {
      if (c.cards.length <= 3) c.mult += 7;
    },
  ],
  [
    "high-school-mage",
    "虹色の試験管",
    "Prismatic vial",
    "POTION",
    "異なるスートの数 ×20 基礎点。",
    "+20 Chips per distinct played suit.",
    (c: C) => {
      c.chips += new Set(c.cards.map((x) => x.suit)).size * 20;
    },
  ],
  [
    "high-school-dodgeball",
    "エースのリストバンド",
    "Ace wristband",
    "SHOE",
    "最初のハンドは倍率 ×1.8。",
    "First hand: ×1.8 Mult.",
    (c: C) => {
      if (c.handsPlayed === 1) c.mult *= 1.8;
    },
  ],
  [
    "high-school-bard",
    "放送部のマイク",
    "Broadcast microphone",
    "BELL",
    "プレイしたカード1枚につき倍率 +1。",
    "+1 Mult for every played card.",
    (c: C) => {
      c.mult += c.cards.length;
    },
  ],
  [
    "high-school-librarian",
    "物語のしおり",
    "Story bookmark",
    "NOTEBOOK",
    "手元に残したカード1枚につき基礎点 +12。",
    "+12 Chips for each card held in hand.",
    (c: C) => {
      c.chips += c.handCards.length * 12;
    },
  ],
  [
    "high-school-chef",
    "料理長のお弁当",
    "Chef lunchbox",
    "CHEF",
    "5枚のカードで役を出すと基礎点 +80。",
    "+80 Chips when playing 5 cards.",
    (c: C) => {
      if (c.cards.length === 5) c.chips += 80;
    },
  ],
  [
    "high-school-gardener",
    "成長する小さな鉢",
    "Growing flowerpot",
    "PLANT",
    "ハンドを出すたび基礎点 +8ずつ成長。",
    "Gains +8 Chips each time a hand is played.",
    (c: C) => {
      const key = "keepsake-garden";
      c.persistentCounters[key] = (c.persistentCounters[key] || 0) + 8;
      c.chips += c.persistentCounters[key];
    },
  ],
  [
    "magic-akari",
    "星の応援団",
    "Star companions",
    "SPARKLES",
    "常に倍率 +3。ペアを含む役ならさらに +3。",
    "+3 Mult; another +3 for a pair-based hand.",
    (c: C) => {
      c.mult += /PAIR|KIND|HOUSE/.test(c.handType) ? 6 : 3;
    },
  ],
  [
    "magic-shizuku",
    "月鏡の使い魔",
    "Moon mirror familiar",
    "MOON",
    "スペード1枚につき基礎点 +20。",
    "+20 Chips per played Spade.",
    (c: C) => {
      c.chips += c.cards.filter((x) => x.suit === "SPADE").length * 20;
    },
  ],
  [
    "magic-hiyori",
    "花の精霊",
    "Blossom spirit",
    "PLANT",
    "ハート1枚につき倍率 +2。",
    "+2 Mult per played Heart.",
    (c: C) => {
      c.mult += c.cards.filter((x) => x.suit === "HEART").length * 2;
    },
  ],
  [
    "magic-tsubasa",
    "炎のサラマンダー",
    "Flame salamander",
    "FLAME",
    "残り手数が少ないほど倍率上昇。+2〜+8。",
    "+2 to +8 Mult as remaining hands decrease.",
    (c: C) => {
      c.mult += Math.max(2, 10 - c.handsRemaining * 2);
    },
  ],
  [
    "magic-rei",
    "影札の黒猫",
    "Shadow cat",
    "GHOST",
    "スペード・クラブを3枚以上出すと倍率 ×1.7。",
    "×1.7 Mult with 3 or more black-suit cards.",
    (c: C) => {
      if (c.cards.filter((x) => ["SPADE", "CLUB"].includes(x.suit)).length >= 3)
        c.mult *= 1.7;
    },
  ],
  [
    "magic-madoka",
    "時を刻む歯車",
    "Clockwork companion",
    "CLOCK",
    "捨札を使わず役を出すと基礎点 +70。",
    "+70 Chips if no discards have been used.",
    (c: C) => {
      if (c.discardsUsed === 0) c.chips += 70;
    },
  ],
  [
    "magic-koharu",
    "風の小鳥",
    "Wind songbird",
    "FLIER",
    "ストレート系の役で倍率 ×2。",
    "×2 Mult for a Straight-based hand.",
    (c: C) => {
      if (c.handType.includes("STRAIGHT") || c.handType === "ROYAL_FLUSH")
        c.mult *= 2;
    },
  ],
  [
    "magic-mirai",
    "夢の舞台うさぎ",
    "Dream stage rabbit",
    "WIZARD",
    "絵札1枚につき倍率 +2。",
    "+2 Mult for every played face card.",
    (c: C) => {
      c.mult += c.cards.filter((x) => x.rank >= 11 && x.rank <= 13).length * 2;
    },
  ],
  [
    "magic-sera",
    "光の星図",
    "Celestial chart",
    "SUN",
    "ダイヤ1枚につき基礎点 +22。",
    "+22 Chips per played Diamond.",
    (c: C) => {
      c.chips += c.cards.filter((x) => x.suit === "DIAMOND").length * 22;
    },
  ],
  [
    "magic-ren",
    "蒼風の護符",
    "Azure wind charm",
    "SHIELD",
    "手元のカードが4枚以上なら倍率 +6。",
    "+6 Mult with at least 4 cards held in hand.",
    (c: C) => {
      if (c.handCards.length >= 4) c.mult += 6;
    },
  ],
  [
    "magic-soma",
    "氷律のチェス駒",
    "Ice order chessman",
    "GEM",
    "フルハウス・フォーカード系の役で倍率 ×2。",
    "×2 Mult for Full House or Four/Five of a Kind.",
    (c: C) => {
      if (/HOUSE|FOUR|FIVE/.test(c.handType)) c.mult *= 2;
    },
  ],
  [
    "magic-minato",
    "清流のしずく",
    "Healing water droplet",
    "POTION",
    "捨札の残り回数 ×18 基礎点。",
    "+18 Chips per remaining discard.",
    (c: C) => {
      c.chips += c.discardsRemaining * 18;
    },
  ],
  [
    "magic-riku",
    "観測者の懐中時計",
    "Observer pocket watch",
    "CLOCK",
    "2回目以降のハンドで倍率 +6。",
    "+6 Mult after the first hand.",
    (c: C) => {
      if (c.handsPlayed > 1) c.mult += 6;
    },
  ],
  [
    "magic-yamato",
    "紅蓮の相棒",
    "Crimson companion",
    "FIST",
    "最後のハンドで倍率 ×2.5。",
    "×2.5 Mult on the last hand.",
    (c: C) => {
      if (c.handsRemaining === 1) c.mult *= 2.5;
    },
  ],
  [
    "magic-leon",
    "幻奏の音符",
    "Illusion melody",
    "BELL",
    "フラッシュ系の役で倍率 ×1.8。",
    "×1.8 Mult for a Flush-based hand.",
    (c: C) => {
      if (c.handType.includes("FLUSH")) c.mult *= 1.8;
    },
  ],
  [
    "magic-elliot",
    "星界の記録書",
    "Astral record keeper",
    "NOTEBOOK",
    "Aを出すと1枚につき基礎点 +45。",
    "+45 Chips per played Ace.",
    (c: C) => {
      c.chips += c.cards.filter((x) => x.rank === 14).length * 45;
    },
  ],
  [
    "magic-sakuya",
    "宵闇の封印札",
    "Dusk sealing talisman",
    "EYE",
    "1枚だけ出すと倍率 ×2.2。",
    "×2.2 Mult when playing a single card.",
    (c: C) => {
      if (c.cards.length === 1) c.mult *= 2.2;
    },
  ],
] as const;
type C = Parameters<PokerSupporter["effect"]>[0];
export const POKER_SIGNATURE_SUPPORTERS: PokerSupporter[] = keepsakes.map(
  ([hero, name, , icon, description, , effect]) => ({
    id: `SIGNATURE_${hero}`,
    name,
    description,
    icon,
    effect,
    rarity: "RARE",
    price: 6,
    triggerOn: "HAND_PLAYED",
  }),
);
export const signatureSupporter = (hero: string) =>
  POKER_SIGNATURE_SUPPORTERS.find((s) => s.id === `SIGNATURE_${hero}`)!;
export const keepsakeEnglish = (hero: string) => {
  const row = keepsakes.find((r) => r[0] === hero)!;
  return { name: row[2], description: row[5] };
};
export const POKER_HERO_ENGLISH: Record<string, string> = Object.fromEntries(
  keepsakes.flatMap((row) => [
    [row[1], row[2]],
    [row[4], row[5]],
  ]),
);
const hiraNames = [
  "はんぎゃくの こうしょう",
  "おうえんうさぎ",
  "てんこうせいの ひみつ",
  "にじいろの しけんかん",
  "エースの リストバンド",
  "ほうそうぶの マイク",
  "ものがたりの しおり",
  "りょうりちょうの おべんとう",
  "せいちょうする ちいさな はち",
  "ほしの おうえんだん",
  "つきかがみの つかいま",
  "はなの せいれい",
  "ほのおの サラマンダー",
  "かげふだの くろねこ",
  "ときを きざむ はぐるま",
  "かぜの ことり",
  "ゆめの ぶたいうさぎ",
  "ひかりの せいず",
  "そうふうの ごふ",
  "ひょうりつの チェスごま",
  "せいりゅうの しずく",
  "かんそくしゃの かいちゅうどけい",
  "ぐれんの あいぼう",
  "げんそうの おんぷ",
  "せいかいの きろくしょ",
  "よいやみの ふういんふだ",
];
const hiraEffects = [
  "つねに ばいりつ +4。さいごの てかずでは さらに +4。",
  "ハートの カード1まいにつき きそてん +18。",
  "3まいいかの やくで ばいりつ +7。",
  "ちがう スートの かず ×20 きそてん。",
  "さいしょの ハンドは ばいりつ ×1.8。",
  "プレイした カード1まいにつき ばいりつ +1。",
  "てもとに のこした カード1まいにつき きそてん +12。",
  "5まいの カードで やくを だすと きそてん +80。",
  "ハンドを だすたび きそてん +8ずつ せいちょう。",
  "つねに ばいりつ +3。ペアを ふくむ やくなら さらに +3。",
  "スペード1まいにつき きそてん +20。",
  "ハート1まいにつき ばいりつ +2。",
  "のこり てかずが すくないほど ばいりつ じょうしょう。+2〜+8。",
  "スペード・クラブを 3まいいじょう だすと ばいりつ ×1.7。",
  "すてふだを つかわず やくを だすと きそてん +70。",
  "ストレートけいの やくで ばいりつ ×2。",
  "えふだ1まいにつき ばいりつ +2。",
  "ダイヤ1まいにつき きそてん +22。",
  "てもとの カードが 4まいいじょうなら ばいりつ +6。",
  "フルハウス・フォーカードけいの やくで ばいりつ ×2。",
  "すてふだの のこり かいすう ×18 きそてん。",
  "2かいめいこうの ハンドで ばいりつ +6。",
  "さいごの ハンドで ばいりつ ×2.5。",
  "フラッシュけいの やくで ばいりつ ×1.8。",
  "Aを だすと 1まいにつき きそてん +45。",
  "1まいだけ だすと ばいりつ ×2.2。",
];
export const POKER_HERO_HIRAGANA: Record<string, string> = Object.fromEntries(
  keepsakes.flatMap((row, i) => [
    [row[1], hiraNames[i]],
    [row[4], hiraEffects[i]],
  ]),
);

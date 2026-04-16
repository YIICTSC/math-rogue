import { RaceTrickCard } from './types';

export const RACE_TRICK_LIBRARY: RaceTrickCard[] = [
  { id: 'late_damage', effectId: 'LATE_DAMAGE', name: '遅刻ダメージ', description: '相手全員に 5 ダメージを与える。', rarity: 'COMMON' },
  { id: 'retest_damage', effectId: 'RETEST_DAMAGE', name: '追試ダメージ', description: '相手全員は次の戦闘開始時に 8 ダメージを受ける。', rarity: 'COMMON' },
  { id: 'wallet_swap', effectId: 'WALLET_SWAP', name: 'お財布交換', description: '相手と自分の所持ゴールドを丸ごと交換する。', rarity: 'RARE' },
  { id: 'gold_siphon', effectId: 'GOLD_SIPHON', name: 'おつりミス', description: '相手全員のゴールド 15% を奪う。', rarity: 'UNCOMMON' },
  { id: 'shop_markup', effectId: 'SHOP_MARKUP', name: '購買部値上げ', description: '12 秒間、相手全員のショップ価格が 25% 上がる。', rarity: 'UNCOMMON' },
  { id: 'paper_storm', effectId: 'PAPER_STORM', name: 'プリント散乱', description: '8 秒間、相手全員の画面を紙吹雪で見づらくする。', rarity: 'COMMON' },
  { id: 'chalk_dust', effectId: 'CHALK_DUST', name: 'チョークの粉', description: '8 秒間、相手全員の画面を白い粉で曇らせる。', rarity: 'COMMON' },
  { id: 'desk_shake', effectId: 'DESK_SHAKE', name: 'ぐらぐら机', description: '5 秒間、相手全員の画面を小刻みに揺らす。', rarity: 'COMMON' },
  { id: 'upside_down_notes', effectId: 'UPSIDE_DOWN_NOTES', name: 'さかさノート', description: '6 秒間、相手全員の画面を左右反転させる。', rarity: 'UNCOMMON' },
  { id: 'sleepy_vignette', effectId: 'SLEEPY_VIGNETTE', name: '居眠りフィルタ', description: '10 秒間、相手全員の視界の周辺を暗くする。', rarity: 'COMMON' },
  { id: 'slow_bell', effectId: 'SLOW_BELL', name: 'のろのろチャイム', description: '2.5 秒間、相手全員の操作を止める。', rarity: 'UNCOMMON' },
  { id: 'score_mist', effectId: 'SCORE_MIST', name: 'スコア減衰ミスト', description: '12 秒間、相手全員のレーススコア加算が 80% になる。', rarity: 'UNCOMMON' },
  { id: 'fake_signboard', effectId: 'FAKE_SIGNBOARD', name: 'にせ案内板', description: '8 秒間、相手全員の画面にまぎらわしい誘導表示を重ねる。', rarity: 'COMMON' },
  { id: 'detention_tax', effectId: 'DETENTION_TAX', name: '居残りペナルティ', description: '12 秒間、相手全員は報酬画面にいる間 1 秒ごとに 1 ダメージを受ける。', rarity: 'UNCOMMON' },
  { id: 'sleep_glasses', effectId: 'SLEEP_GLASSES', name: 'ねむけメガネ', description: '相手全員は次の戦闘で手札が 1 枚減る。', rarity: 'COMMON' },
  { id: 'blackboard_smoke', effectId: 'BLACKBOARD_SMOKE', name: '黒板けむり', description: '相手全員は次の戦闘で敵の行動表示を隠される。', rarity: 'UNCOMMON' },
  { id: 'pop_quiz_hurry', effectId: 'POP_QUIZ_HURRY', name: '抜き打ち小テスト', description: '相手全員は次の問題画面の開始時に 2.5 秒の足止めを受ける。', rarity: 'COMMON' },
  { id: 'print_avalanche', effectId: 'PRINT_AVALANCHE', name: 'プリント雪崩', description: '相手全員の次の報酬画面に状態異常報酬を 2 枚まぜる。', rarity: 'UNCOMMON' },
  { id: 'shoe_lace', effectId: 'SHOE_LACE', name: 'くつひもトラップ', description: '12 秒間、相手全員のマップ選択が長押しになる。', rarity: 'COMMON' },
  { id: 'forgotten_homework', effectId: 'FORGOTTEN_HOMEWORK', name: '忘れもの通知', description: '相手全員は次の戦闘で状態異常カードを 1 枚、捨て札に追加される。', rarity: 'COMMON' },
];

export const getRaceTrickCard = (id: string): RaceTrickCard | undefined =>
  RACE_TRICK_LIBRARY.find(card => card.id === id);

export const getRandomRaceTrickCard = (): RaceTrickCard => {
  const roll = Math.random() * 100;
  const rarity =
    roll > 94 ? 'RARE'
      : roll > 68 ? 'UNCOMMON'
        : 'COMMON';
  const pool = RACE_TRICK_LIBRARY.filter(card => card.rarity === rarity);
  return { ...(pool[Math.floor(Math.random() * pool.length)] || RACE_TRICK_LIBRARY[0]) };
};

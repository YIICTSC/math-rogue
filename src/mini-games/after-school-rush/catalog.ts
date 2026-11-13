import { STORY_KEY, type Copy } from './rules';
import { ACTION_CHAPTERS } from './action/games';
import type { Original } from './originals/model';

const BG = 'sprites/backgrounds/learning-rogue/';

type Theme = {
  id: string;
  name: Copy;
  story: Copy;
  clear: Copy;
  boss: Copy;
  art: string;
  color: string;
};

export const THEMES: readonly Theme[] = [
  {
    id: 'gate', name: ['校門', 'School Gate', 'こうもん'],
    story: ['放課後、校門の鐘が割れて文化祭の合図が消えた。叛逆の高校生と一緒に、飛び散った鐘の音を探そう。',
      'The gate bell broke after school, scattering the festival signal. Join the rebellious high schooler and gather the missing notes.',
      'ほうかご、こうもんの かねが われて ぶんかさいの あいずが きえた。はんぎゃくの こうこうせいと おとを さがそう。'],
    clear: ['最初の音は見つかった。次は教室で、残されたメモを解読しよう。',
      'The first note is safe. A message in the classroom points to the next one.',
      'さいしょの おとを みつけた。つぎは きょうしつで メモを よもう。'],
    boss: ['門番ミミック', 'Gatekeeper Mimic', 'もんばんミミック'],
    art: 'sprites/go-home-dash/routes/school.webp', color: '#ffcf51',
  },
  {
    id: 'classroom', name: ['教室', 'Classroom', 'きょうしつ'],
    story: ['チョークやノートが教室じゅうを飛び回る！ 机を跳び渡り、二つ目の音を取り戻そう。',
      'Chalk and notebooks are flying everywhere! Leap between desks and recover the second note.',
      'チョークや ノートが きょうしつじゅうを とびまわる！ つくえを とびわたり、ふたつめの おとを とりもどそう。'],
    clear: ['メモの裏に購買部のスタンプがあった。おやつの時間に間に合うかな。',
      'There’s a school store stamp on the back. Hurry over before snack time ends.',
      'メモの うらに こうばいぶの スタンプが あった。おやつの じかんに まにあうかな。'],
    boss: ['黒板の大あらし', 'Blackboard Storm', 'こくばんの おおあらし'],
    art: BG + 'battle-classroom.webp', color: '#ffdba4',
  },
  {
    id: 'store', name: ['購買部', 'School Store', 'こうばいぶ'],
    story: ['おやつ係の準備が追いつかない。注文どおりに品物を仕分けて、レジに響く音を受け取ろう。',
      'The snack stall is swamped. Sort the orders and catch the note ringing from the till.',
      'おやつが たりない。ちゅうもんどおりに しなものを わけて、レジの おとを うけとろう。'],
    clear: ['焼きたてのおやつを持って校庭へ。風が次の音を運んでいった。',
      'Take a fresh snack to the schoolyard. The wind carried the next note outside.',
      'やきたての おやつを もって こうていへ。かぜが つぎの おとを はこんだ。'],
    boss: ['閉店前の大注文', 'Last Call Orders', 'へいてんまえの おおちゅうもん'],
    art: BG + 'shop-store.webp', color: '#f6a6bd',
  },
  {
    id: 'yard', name: ['校庭', 'Schoolyard', 'こうてい'],
    story: ['突風で道具が校庭じゅうに散らばった。走って集め、通り道を作ろう。',
      'A gust scattered equipment across the yard. Gather it and clear a route.',
      'とっぷうで どうぐが こうていに ちらばった。はしって あつめ、みちを つくろう。'],
    clear: ['風の中から鐘の音が返ってきた。続きは図書室の案内図にありそうだ。',
      'A note floats back on the breeze. The library map might show where it came from.',
      'かぜの なかから かねの おとが もどった。つぎは としょしつへ。'],
    boss: ['つむじ風の通り道', 'Whirlwind Crossing', 'つむじかぜの とおりみち'],
    art: BG + 'map-campus.webp', color: '#80e5b9',
  },
  {
    id: 'library', name: ['図書室', 'Library', 'としょしつ'],
    story: ['本棚が空へとのび、本がはばたき始めた。落ちる本を受け止め、棚の上に隠れた音を探そう。',
      'The shelves tower skyward and books take flight. Catch them and climb toward the hidden note.',
      'ほんだなが そらへとのび、ほんが はばたきはじめた。おちる ほんを うけとめ、たなの うえの おとを さがそう。'],
    clear: ['音は古い実験ノートに挟まっていた。ノートを理科室に届けよう。',
      'The note was tucked into an old lab journal. Take it back to the science lab.',
      'おとは ふるい じっけんノートに はさまっていた。りかしつに とどけよう。'],
    boss: ['屋根まで本棚登り', 'The Towering Library', 'やねまで ほんだなのぼり'],
    art: BG + 'battle-library.webp', color: '#d3bbff',
  },
  {
    id: 'lab', name: ['理科室', 'Science Lab', 'りかしつ'],
    story: ['音を集める装置が故障した。回路とスイッチを直し、合図のランプを点けよう。',
      'The note collector is broken. Repair its circuits and light the signal lamp.',
      'おとを あつめる そうちが こわれた。かいろと スイッチを なおして、ランプを つけよう。'],
    clear: ['装置が起動し、体育館から強い反応が出た。急いで向かおう。',
      'The collector wakes up and detects a strong signal in the gym. Head there now.',
      'そうちが うごき、たいいくかんから つよい はんのうが でた。いそごう。'],
    boss: ['暴走する回路盤', 'Runaway Circuit', 'ぼうそうする かいろばん'],
    art: BG + 'battle-science-lab.webp', color: '#93d9ff',
  },
  {
    id: 'gym', name: ['体育館', 'Gymnasium', 'たいいくかん'],
    story: ['体育館では的当て大会の練習中。投げる、受ける、かわす。試合の合図が最後まで鳴れば音をもらえる。',
      'The gym is practicing for the target tournament. Throw, catch, and dodge to earn the match signal.',
      'たいいくかんで まとあての れんしゅうちゅう。なげて、うけて、よけて、しあいの おとを もらおう。'],
    clear: ['試合終了の合図を回収。音楽室で残りの音と合わせよう。',
      'You collected the final whistle. Take it to the music room and fit the notes together.',
      'しあいの おわりの あいずを あつめた。おんがくしつで おとを あわせよう。'],
    boss: ['三列ターゲット決戦', 'Three-Lane Showdown', 'さんれつターゲットけっせん'],
    art: BG + 'battle-gym.webp', color: '#f8b599',
  },
  {
    id: 'music', name: ['音楽室', 'Music Room', 'おんがくしつ'],
    story: ['集めた音はまだバラバラ。指揮に合わせて打ち、音の並びを完成させよう。',
      'The notes are still out of order. Follow the conductor and rebuild the tune.',
      'あつめた おとは まだ バラバラ。しきに あわせて ならし、おとの ならびを つくろう。'],
    clear: ['曲はできた。屋上なら遠くまで届くはずだ。',
      'The tune is ready. From the roof, the whole school will hear it.',
      'きょくが できた。おくじょうなら とおくまで とどくはずだ。'],
    boss: ['消えかけの合奏', 'Fading Ensemble', 'きえかけの がっそう'],
    art: BG + 'battle-music-room.webp', color: '#f4a8e0',
  },
  {
    id: 'roof', name: ['屋上', 'Rooftop', 'おくじょう'],
    story: ['屋上の風見計が回り続けている。風向きを読んで装置を安定させ、鐘の音を校内へ届けよう。',
      'The rooftop vane won’t settle. Read the gusts, steady the machine, and send the chime across the school.',
      'おくじょうの かざみが まわりつづける。かぜを よんで そうちを ととのえ、かねの おとを とどけよう。'],
    clear: ['鐘が鳴って、文化祭の明かりがついた。最後はみんなのところへ。',
      'The bell rings and the festival lights come on. Meet everyone for the finale.',
      'かねが なって、ぶんかさいの あかりが ついた。さいごは みんなの ところへ。'],
    boss: ['風見計の大暴走', 'Storm Vane', 'かざみの だいぼうそう'],
    art: 'sprites/go-home-dash/routes/rooftops.webp', color: '#bfea87',
  },
  {
    id: 'festival', name: ['文化祭', 'School Festival', 'ぶんかさい'],
    story: ['準備完了まであと一息。これまでの力を合わせて、最後の点灯式を成功させよう。',
      'One last rehearsal. Bring everything you learned together and light up the festival.',
      'じゅんびかんりょうまで あとすこし。いままでの ちからを あわせ、さいごの てんとうしきを せいこうさせよう。'],
    clear: ['集めた音が一つになり、放課後の校舎に響いた。文化祭、開幕！',
      'The notes become one chime that rings through the school. The festival is open!',
      'あつめた おとが ひとつになり、ほうかごの こうしゃに ひびいた。ぶんかさい、かいまく！'],
    boss: ['放課後の点灯式', 'Festival Lighting Ceremony', 'ほうかごの てんとうしき'],
    art: BG + 'map-festival.webp', color: '#ffe39b',
  },
];

export const CHAPTER_ROUNDS = 8;
export type Entry = { key: string; chapter: number; game: Original };

export const CATALOG = THEMES.flatMap((theme, chapter): Entry[] =>
  ACTION_CHAPTERS[chapter].map(game => ({ key: `${theme.id}/${game.id}`, chapter, game })),
);

export function chapterEntries(chapter: number) {
  return CATALOG.filter(entry => entry.chapter === chapter);
}

export function readStory() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORY_KEY) || '[]');
    if (Array.isArray(parsed)) return Array.from({ length: THEMES.length }, (_, i) =>
      Number.isSafeInteger(parsed[i]) && parsed[i] > 0 ? parsed[i] as number : 0);
  } catch { /* A new story can start without saved data. */ }
  return THEMES.map(() => 0);
}

export function canPlayChapter(chapter: number, scores: number[]) {
  return chapter === 0 || scores.slice(0, chapter).every(score => score > 0);
}

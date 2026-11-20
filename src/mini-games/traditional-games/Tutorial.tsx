import React, { useState } from 'react';
import { ArrowLeft, BookOpen, CheckCircle2, RotateCcw } from 'lucide-react';
import type { LanguageMode } from '../../types';
import { audioService } from '../../services/audioService';
import { applyTableAction, createTable, tableViewFor, type TableState } from './engine';
import { seatsFor, type TableAction, type TableGame, type TableMember } from './model';
import { dominoTile, type DominoLine } from './domino';
import { TableBoard } from './Boards';
import { say, TABLE_GAMES, type Copy } from './catalog';

const practiceCopy: Record<TableGame, Copy> = {
  competitive: [
    '2–5を、2の端につないでください。',
    'Connect 2–5 to the end showing 2.',
    '2–5を、2のはじにつないでください。',
  ],
  cyprus: [
    '9の根元が空いています。0–9を空いている方向のひとつにつなぎましょう。',
    'The roots still need tiles. Place 0–9 on any empty arm.',
    '9のこんげんがあいています。0–9をあいているほうこうのひとつにつなぎましょう。',
  ],
  chicken: [
    'ダブル5の三本足が優先です。5–6を光っている枝のひとつに置きます。',
    'Double five needs its three toes first. Place 5–6 on a highlighted branch.',
    'ダブル5のさんぼんあしがゆうせんです。5–6をひかっているえだのひとつにおきます。',
  ],
  mexican: [
    '隣の列車が開放されています。5–6を、端が5の相手の列に置きましょう。',
    'The other train is open. Connect 5–6 to its end showing 5.',
    'となりのれっしゃがかいほうされています。5–6を、はじが5のあいてのつらにおきましょう。',
  ],
  'five-up': [
    '右端の1に1–3を置くと、端の合計が2＋3で5になります。',
    'Connect 1–3 to the right end to make the exposed total 2 + 3 = 5.',
    'みぎはしの1に1–3をおくと、はじのごうけいが2＋3で5になります。',
  ],
  sniff: [
    '右端の1に1–3を置くと、端の合計5がそのまま得点になります。',
    'Connect 1–3 to the right end to score all five of the exposed pips.',
    'みぎはしの1に1–3をおくと、はじのごうけい5がそのままとくてんになります。',
  ],
  'seven-rocks': [
    '右端の1に1–3を置くと、端の合計5がそのまま得点になります。',
    'Connect 1–3 to the right end to score all five of the exposed pips.',
    'みぎはしの1に1–3をおくと、はじのごうけい5がそのままとくてんになります。',
  ],
  bergen: [
    '3–4で右端を4にすると、左も右も4。2点入ります。',
    'Connect 3–4 to the right, making both ends 4 for two points.',
    '3–4でみぎはしを4にすると、ひだりもみぎも4。2てんいりります。',
  ],
  'fives-threes': [
    '1–4を右の1につなぎ、端を2＋4＝6にします。3で割れて2点です。',
    'Connect 1–4 to the right to make 2 + 4 = 6. Dividing by three scores two points.',
    '1–4をみぎの1につなぎ、はじを2＋446にします。3でわれて2てんです。',
  ],
  'forty-two': [
    '相棒と取れそうな点を宣言します。まず30〜42点から選んでビッドしてみましょう。',
    'Choose a bid of 30 to 42 points that you can collect with your partner.',
    'あいぼうととれそうなてんをせんげんします。まず30〜42つからえらんでビッドしてみましょう。',
  ],
  peeper: [
    '場には7が1枚。4を3枚選んで出し、ボムで場を取りましょう。',
    'The table shows a single 7. Select three 4s and play your bomb.',
    'ばには7が1まい。4を3まいえらんでだし、ボムでばをとりましょう。',
  ],
  crokinole: [
    '自分の円盤を後ろへ引いて指を離しましょう。中央の20点の穴に入るまで、引く向きと強さを変えて試せます。',
    'Pull your disc back and release toward the center. Adjust the pull direction and distance until you sink a twenty.',
    'ばんのちゅうおうをねらい、つよさをちょうせいしてひきましょう。20てんのあなにいるまでためせます。',
  ],
  goita: [
    '相手が銀で攻めています。銀で受けてから、攻める駒を1枚選びましょう。',
    'An opponent has attacked with Silver. Cover with Silver and choose your attack.',
    'あいてがぎんでせめています。ぎんでうけてから、せめるこまを1まいえらびましょう。',
  ],
};
const extra: Partial<Record<TableGame, Copy[]>> = {
  competitive: [
    [
      'どちらの端にも置ける牌がありません。山札を使わないのでパスします。',
      'Neither end matches your hand. With no draw pile, pass.',
      'どちらのはじにもおけるぱいがありません。やまふだをつかわないのでパスします。',
    ],
  ],
  cyprus: [
    [
      '八方向の根元が埋まりました。2–8を、端が2の列につなげます。',
      'All eight roots are full. Extend the arm that shows 2 with 2–8.',
      'はっぽうこうのこんげんがうまりました。2–8を、はじが2のつらにつなげます。',
    ],
  ],
  chicken: [
    [
      '三本足が埋まるまで、別の列は使えません。5が手にないので山から1枚引きます。',
      'The three toes must be filled. You have no 5, so draw a tile.',
      'さんぼんあしがうまるまで、べつのれつはつかえません。5がてにないのでやまから1まいひきます。',
    ],
  ],
  mexican: [
    [
      '閉じた列車でも、先端がダブルなら優先します。5–6でダブル5を処理してください。',
      'A double takes priority even on a closed train. Cover double five with 5–6.',
      'とじたれっしゃでも、せんたんがダブルならゆうせんします。5–6でダブル5をしょりしてください。',
    ],
  ],
  'five-up': [
    [
      'ダブル3の両側が埋まると脇に伸ばせます。3–4を空いた脇に置きましょう。',
      'Double three has both sides filled. Branch from it with 3–4.',
      'ダブル3のりょうがわがうまるとわきにのばせます。3–4をあいたわきにおきましょう。',
    ],
  ],
  sniff: [
    [
      '空いた脇の3も数えます。3–0を置くと残った脇が3、他の端が0・2・5で10点です。',
      'The unused arm still counts as 3. Place 3–0 so the exposed total becomes 0 + 3 + 2 + 5 = 10.',
      'あいたわきの3もかぞえます。3–0をおくとのこったわきが3、ほかのはじが0・2・5で10てんです。',
    ],
  ],
  'seven-rocks': [
    [
      '脇の空きは得点に数えません。1–3を枝に置くと端は4・5・1で10点になります。',
      'Unused side arms do not count. Branch with 1–3 to expose 4 + 5 + 1 = 10.',
      'わきのあきはとくてんにかぞえません。1–3をえだにおくとはじは4・5・1で10てんになります。',
    ],
  ],
  bergen: [
    [
      '片端がダブル3です。反対側に1–3をつなげると、両端が3で3点になります。',
      'With double three on one end, connect 1–3 to the other end for three points.',
      'かたはしがダブル3です。はんたいがわに1–3をつなげると、りょうたんが3で3てんになります。',
    ],
  ],
  'fives-threes': [
    [
      'いま60点です。1–3で端を合計5にすると1点。61点ちょうどにしてください。',
      'You have 60 points. Make the exposed total 5 with 1–3 to earn exactly one point.',
      'いま60てんです。1–3ではじをごうけい5にすると1てん。61てんちょうどにしてください。',
    ],
  ],
  'forty-two': [
    [
      'ビッドに勝ちました。切り札にする目をひとつ選んでください。',
      'You won the bid. Choose one number as trump.',
      'ビッドにかちました。きりふだにするめをひとつえらんでください。',
    ],
    [
      '切り札は6、場のリードは4です。4を受けられる2–4を出しましょう。',
      'Trump is 6 and the lead is 4. Follow with 2–4.',
      'きりふだは6、ばのリードは4です。4をうけられる2–4をだしましょう。',
    ],
  ],
  crokinole: [
    [
      '相手の赤い円盤があるので、最初に赤に触れます。中央方向の照準で赤を狙って弾いてください。',
      'An opposing red disc is in play. Aim down the center to hit the red disc.',
      'あいてのあかいえんばんがあるので、さいしょにあかにふれます。ちゅうおうほうこうのしょうじゅんであかをねらってひいてください。',
    ],
  ],
  peeper: [
    [
      '手番外でも、7を2枚持っていればマインを宣言できます。マインを押しましょう。',
      'You can interrupt with two 7s. Press Mine, even though it is another seat’s turn.',
      'てつがいそとでも、7を2まいもっていればマインをせんげんできます。マインをおしましょう。',
    ],
    [
      '相手のマインに残りの7を重ねましょう。リターンを押します。',
      'Play the last 7 on your opponent’s Mine by pressing Return.',
      'あいてのマインにのこりの7をおもねましょう。リターンをおします。',
    ],
  ],
  goita: [
    [
      '最後の2枚は金です。全員がパスして自分に戻りました。金を伏せ、もう一枚の金で攻めると60点です。',
      'Everyone passed. Hide one of your last two Golds and attack with the other for 60.',
      'さいごの2まいはきんです。ぜんいんがパスしてじぶんにもどりました。きんをふせ、もういちまいのきんでせめると60てんです。',
    ],
    [
      '向かいの味方が五しを公開しました。この手で続行するか、配り直すかを選びます。',
      'Your partner showed five pawns. Decide whether to keep the deal or redeal.',
      'むかいのみかたがごしをこうかいしました。このてでぞっこうするか、くばりなおすかをえらびます。',
    ],
  ],
};

function drill(game: TableGame, hero: string, step: number): TableState {
  const player = (i: number): TableMember => ({
    id: String(i),
    name: i === 0 ? '1P' : `CPU ${i}`,
    hero,
    cpu: i > 0,
  });
  const s = createTable(
    game,
    Array.from({ length: seatsFor(game)[0] }, (_, i) => player(i)),
    64732,
  );
  s.phase = 'play';
  s.turn = 0;
  s.scores.fill(0);
  s.winners = [];
  s.event = null;
  const tile = dominoTile;
  if (s.kind === 'domino') {
    const line = (pip: number, tiles: number[] = [], isPublic = false): DominoLine => ({
      pip,
      tiles,
      public: isPublic,
      parent: -1,
      anchor: -1,
    });
    s.hub = tile(2, 1);
    s.lines = [line(2), line(1)];
    s.opening = null;
    s.forced = [];
    s.spinners = [];
    s.hands[0] = [tile(1, 3), tile(5, 6)];
    if (game === 'competitive') s.hands[0] = [tile(2, 5), tile(5, 6)];
    if (game === 'cyprus') {
      s.hub = tile(9, 9);
      s.lines = Array.from({ length: 8 }, () => line(9));
      s.forced = s.lines.map((_, i) => i);
      s.hands[0] = [tile(0, 9), tile(1, 4)];
    }
    if (game === 'chicken') {
      s.hub = tile(5, 5);
      s.lines = [line(5), line(5), line(5)];
      s.forced = [0, 1, 2];
      s.hands[0] = [tile(5, 6), tile(3, 4)];
    }
    if (game === 'mexican') {
      s.hub = tile(2, 2);
      s.lines = [line(2), line(5, [tile(2, 5)], true), line(4, [tile(2, 4)], true)];
      s.trainOpening.fill(false);
      s.hands[0] = [tile(5, 6), tile(3, 6)];
    }
    if (game === 'bergen') {
      s.hub = tile(2, 3);
      s.lines = [line(4, [tile(2, 4)]), line(3)];
      s.hands[0] = [tile(3, 4), tile(5, 6)];
    }
    if (game === 'fives-threes') s.hands[0] = [tile(1, 4), tile(1, 2)];
    if (step === 1) {
      switch (game) {
        case 'competitive':
          s.hands[0] = [tile(0, 0), tile(4, 5)];
          break;
        case 'cyprus':
          s.lines = Array.from({ length: 8 }, (_, i) => line(i, [tile(9, i)]));
          s.forced = [];
          s.hands[0] = [tile(2, 8), tile(8, 8)];
          break;
        case 'chicken':
          s.lines.push(line(4, [tile(5, 4)]));
          s.hands[0] = [tile(3, 4), tile(4, 6)];
          break;
        case 'mexican':
          s.lines[1] = line(5, [tile(2, 5), tile(5, 5)]);
          break;
        case 'five-up':
        case 'sniff':
        case 'seven-rocks': {
          const left = game === 'seven-rocks' ? 4 : 2;
          s.hub = tile(3, 3);
          s.lines = [line(left, [tile(3, left)]), line(5, [tile(3, 5)]), line(3), line(3)];
          s.spinners = [{ tile: s.hub, directions: [0, 1], line: -1, at: -1, expanded: true }];
          s.hands[0] = [
            game === 'sniff' ? tile(0, 3) : game === 'seven-rocks' ? tile(1, 3) : tile(3, 4),
            tile(0, 1),
          ];
          break;
        }
        case 'bergen':
          s.hub = tile(1, 2);
          s.lines = [line(1), line(3, [tile(2, 3), tile(3, 3)])];
          s.hands[0] = [tile(1, 3), tile(5, 6)];
          break;
        case 'fives-threes':
          s.scores[0] = 60;
          s.hands[0] = [tile(1, 3), tile(1, 4)];
          break;
      }
    }
  } else if (s.kind === 'forty-two' && step > 0) {
    s.stage = step === 1 ? 'trump' : 'trick';
    s.bid = 34;
    s.bidder = 0;
    if (step === 2) {
      s.trump = 6;
      s.trick = [{ seat: 3, tile: tile(1, 4) }];
      s.hands[0] = [tile(2, 4), tile(0, 6), tile(0, 0)];
    }
  } else if (s.kind === 'crokinole' && step === 1) {
    s.discs = [{ id: -1, seat: 1, x: 0, y: 0.42 }];
    s.remaining[1]--;
    s.boardPoints[1] = 10;
  } else if (s.kind === 'peeper') {
    s.pile = { seat: 1, kind: 'single', rank: 7, tiles: [24] };
    s.hands[0] = [4, 12, 13, 14, 40, 60];
    if (step === 1) {
      s.hands[0] = [25, 26, 31, 43];
      s.turn = 1;
    }
    if (step === 2) {
      s.pile = { seat: 1, kind: 'mine', rank: 7, tiles: [25, 26] };
      s.hands[0] = [27, 31, 43];
      s.turn = 1;
    }
  } else if (s.kind === 'goita') {
    s.five = [];
    s.votes = [];
    s.award = null;
    s.rows = s.players.map(() => []);
    s.attack = { seat: 3, tile: 18 };
    s.rows[3] = [{ cover: null, attack: 18 }];
    s.hands[0] = [0, 1, 10, 14, 19, 22, 26, 30];
    if (step === 1) {
      s.hands[0] = [22, 23];
      s.attack = { seat: 0, tile: 10 };
    }
    if (step === 2) {
      s.five = [2];
      s.attack = null;
    }
  }
  return s;
}
function passed(game: TableGame, step: number, action: TableAction, s: TableState) {
  if (step > 0) {
    if (game === 'competitive') return action.type === 'pass';
    if (game === 'chicken') return action.type === 'draw';
    if (game === 'five-up') return action.type === 'place' && action.end >= 2;
    if (game === 'forty-two') return action.type === (step === 1 ? 'trump' : 'place');
    if (game === 'crokinole') return s.event?.key === 'shot' || s.event?.key === 'twenty';
  }
  if (
    game === 'fives-threes' ||
    game === 'bergen' ||
    game === 'five-up' ||
    game === 'sniff' ||
    game === 'seven-rocks'
  )
    return (s.event?.amount ?? 0) > 0;
  if (game === 'forty-two') return action.type === 'bid' && action.value <= 42;
  if (game === 'peeper')
    return s.event?.key === (step === 0 ? 'bomb' : step === 1 ? 'mine' : 'return');
  if (game === 'crokinole') return s.event?.key === 'twenty';
  if (game === 'goita')
    return step === 0
      ? action.type === 'goita'
      : step === 1
        ? s.event?.amount === 60
        : action.type === 'five';
  return action.type === 'place';
}

export function RulesText({ game, language }: { game: TableGame; language: LanguageMode }) {
  const rules = TABLE_GAMES[game];
  return (
    <>
      <ol className="tt-instructions">
        {rules.instructions.map((line, i) => (
          <li key={i}>{say(language, line)}</li>
        ))}
      </ol>
      <a href={rules.source} target="_blank" rel="noreferrer">
        {say(language, ['ルール参照元', 'Rule reference', 'ルールの さんこう'])} ↗
      </a>
    </>
  );
}

export function Tutorial({
  game,
  hero,
  language,
  back,
  play,
}: {
  game: TableGame;
  hero: string;
  language: LanguageMode;
  back: () => void;
  play: () => void;
}) {
  const [step, setStep] = useState(0);
  const [s, setState] = useState(() => drill(game, hero, 0));
  const [result, setResult] = useState<'pending' | 'done' | 'retry'>('pending');
  const cases = [practiceCopy[game], ...(extra[game] ?? [])];
  const l = (ja: string, en: string, kana?: string) => say(language, [ja, en, kana]);
  const reset = (i: number) => {
    setStep(i);
    setState(drill(game, hero, i));
    setResult('pending');
  };
  const act = (action: TableAction) => {
    if (result !== 'pending') return;
    const trial = structuredClone(s);
    if (!applyTableAction(trial, 0, action)) return;
    const done = passed(game, step, action, trial);
    setState(trial);
    setResult(done ? 'done' : 'retry');
    audioService.playSound(done ? 'correct' : 'select');
  };
  return (
    <div className="tt-tutorial">
      <header className="tt-nav">
        <button onClick={back}>
          <ArrowLeft size={18} />
          {l('戻る', 'Back', 'もどる')}
        </button>
        <h1>
          <BookOpen size={22} />
          {say(language, TABLE_GAMES[game].title)}
        </h1>
      </header>
      <section className="tt-lesson">
        <strong>
          {l('一手ずつ練習', 'Practice a move', 'ひとてずつ れんしゅう')} {step + 1} /{' '}
          {cases.length}
        </strong>
        <p>{say(language, cases[step])}</p>
        {result !== 'pending' && (
          <div className="tt-lesson-result" role="status">
            {result === 'done' ? (
              <>
                <CheckCircle2 size={20} />
                {l('できました！', 'Well played!', 'できました！')}
                <button
                  className="tt-primary"
                  onClick={() => (step + 1 < cases.length ? reset(step + 1) : play())}
                >
                  {step + 1 < cases.length
                    ? l('次の練習', 'Next exercise', 'つぎの れんしゅう')
                    : l('CPUと対戦', 'Play against CPU', 'CPUと たいせん')}
                </button>
              </>
            ) : (
              <button onClick={() => reset(step)}>
                <RotateCcw size={16} />
                {l('もう一度試す', 'Try again', 'もういちど ためす')}
              </button>
            )}
          </div>
        )}
      </section>
      <TableBoard
        view={tableViewFor(s, 0)}
        language={language}
        send={act}
        disabled={result !== 'pending'}
      />
      <details className="tt-rules">
        <summary>{l('すべてのルール', 'Full rules', 'すべての ルール')}</summary>
        <RulesText game={game} language={language} />
      </details>
    </div>
  );
}

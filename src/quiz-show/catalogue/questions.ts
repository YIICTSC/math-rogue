import type { LanguageMode } from '../../types';
import { PARTY_CATEGORIES, supportsLearningUnits, type ShowMode, type ShowQuestion } from '../types';
import subjects from './subjects.json';
import frames from './frames.json';
import drawingMotifs from './drawingMotifs.json';

export const VARIETY_LEVELS = ['EASY', 'NORMAL', 'HARD'] as const;
type Level = typeof VARIETY_LEVELS[number];
type Category = Exclude<typeof PARTY_CATEGORIES[number], 'ALL'>;
type QuestionLocale = 0 | 1 | 2;
type Localized = readonly string[];
type Term = readonly [name: Localized, clue: Localized];
type Topic = readonly [label: Localized, terms: readonly Term[]];
type Frame = readonly [pattern: Localized, options?: readonly Localized[]];
type Format = 'CONSENSUS' | 'MAJORITY' | 'NEAREST' | 'DRAW' | 'VOTE' | 'WOLF';
const topics = subjects as unknown as Record<Category, readonly Topic[]>;
const frameSets = frames as unknown as Partial<Record<`${Format}:${Level}`, readonly Frame[]>>;
const drawings: Record<Category, readonly Localized[]> = drawingMotifs;

function localeIndex(language: LanguageMode): QuestionLocale {
  return language === 'ENGLISH' ? 1 : language === 'HIRAGANA' ? 2 : 0;
}

function questionText(text: Localized, locale: QuestionLocale, words: Record<string,string>) {
  return text[locale].replace(/[\^*~]/g, token => words[token]);
}

function objective(prompt: string, options: string[], correct: number) {
  return { prompt, options, answer: options[correct] };
}

function directQuestion(terms: readonly Term[], index: number, locale: QuestionLocale) {
  const clue = terms[index][1][locale];
  const prompt = locale === 1 ? `What fits this clue? “${clue}”` : `「${clue}」。${locale === 0 ? '何のこと？' : 'なんのこと？'}`;
  return objective(prompt, terms.map(([name]) => name[locale]), index);
}

function topicQuestion(current: Topic, other: Topic, contrasts: string[], index: number, locale: QuestionLocale) {
  const [topic, terms] = current, [otherTopic, otherTerms] = other;
  const own = terms.map(([name]) => name[locale]);
  const adjacent = otherTerms.map(([name]) => name[locale]);
  const label = topic[locale], contrast = otherTopic[locale];
  const phrase = [
    [`「${own[0]}」と同じ区分「${label}」に置く札は？`, `Which entry goes beside “${own[0]}” in the section “${label}”?`, `「${own[0]}」とおなじなかま「${label}」におくふだは？`],
    [`「${label}」の棚に、別の種類の札が紛れた。取り出すのは？`, `One label doesn't belong on the shelf for ${label}. Which one should come out?`, `「${label}」のたなに、べつのなかまのふだがまざった。とりだすのは？`],
    [`展示の左を「${label}」、右を「${contrast}」にする。左から順に並ぶ正しい組は？`, `An exhibit puts ${label} on the left and ${contrast} on the right. Which pair follows that order?`, `てんじのひだりを「${label}」、みぎを「${contrast}」にする。ひだりからただしいくみは？`],
    [`「${own[0]}」「${own[2]}」「${own[3]}」をひとまとめにした。内容に合う見出しは？`, `Which heading fits all three: ${own[0]}, ${own[2]}, and ${own[3]}?`, `「${own[0]}」「${own[2]}」「${own[3]}」をひとまとめにした。どんなみだしがあう？`],
  ][index][locale];
  if (index === 0) return objective(phrase, [adjacent[0], own[1], adjacent[2], adjacent[3]], 1);
  if (index === 1) return objective(phrase, [own[1], own[2], adjacent[1], own[3]], 2);
  if (index === 2) {
    const pair = (first: string, second: string) => `${first} → ${second}`;
    return objective(phrase, [pair(adjacent[0], own[1]), pair(own[0], own[3]), pair(adjacent[1], adjacent[3]), pair(own[2], adjacent[2])], 3);
  }
  return objective(phrase, [label, contrast, ...contrasts], 0);
}

function deductionQuestion(choices: readonly Term[], variant: number, scene: string, locale: QuestionLocale) {
  const options = choices.map(([name]) => name[locale]);
  const [a, b, c, d] = ['{A}', '{B}', '{C}', '{D}'];
  // Each case describes a different constraint. The four names are always the only possible answers.
  const rules: [Localized, number][] = [
    [[`「${scene}」の札を横一列に並べた。「${b}」は「${a}」のすぐ左。「${d}」は「${a}」のすぐ右。「${c}」は一番左。左から三番目は？`, `Four cards about ${scene} are in a row. ${b} is immediately left of ${a}. ${d} is immediately right of ${a}. ${c} is leftmost. Which is third from the left?`, `「${scene}」のふだがよこいちれつ。「${b}」は「${a}」のすぐひだり。「${d}」は「${a}」のすぐみぎ。「${c}」はいちばんひだり。ひだりから3ばんめは？`], 0],
    [[`「${scene}」の札を二箱に二枚ずつ入れた。「${d}」が入る箱に「${b}」もある。「${c}」がない箱は赤い。青い箱に「${c}」と入る札は？`, `Two of four cards about ${scene} go in each of two boxes. ${d} shares a box with ${b}. The red box doesn't hold ${c}. Which card shares the blue box with ${c}?`, `「${scene}」のふだを、はこに2まいずついれた。「${d}」と「${b}」はおなじはこ。「${c}」がないはこはあかい。あおいはこで「${c}」といっしょなのは？`], 0],
    [[`「${scene}」の札を一周させる。一手で「${a}」から「${c}」、「${c}」から「${b}」、「${b}」から「${d}」、「${d}」から「${a}」。今「${a}」なら六手後は？`, `A marker moves around the ${scene} cards, one arrow at a time: ${a} → ${c} → ${b} → ${d} → ${a}. Where is it six moves after leaving ${a}?`, `「${scene}」のふだを、やじるしのとおりにすすむ。「${a}」→「${c}」→「${b}」→「${d}」→「${a}」。はじめが「${a}」なら6てごは？`], 1],
    [[`「${scene}」の札の重さ比べ。「${a}」より「${b}」が重い。「${c}」は「${d}」より軽く、「${b}」より重い。最も重いのは？`, `Cards about ${scene} have different weights. ${b} is heavier than ${a}. ${c} is lighter than ${d} but heavier than ${b}. Which is heaviest?`, `「${scene}」のふだはおもさがちがう。「${a}」より「${b}」がおもい。「${c}」は「${d}」よりかるく、「${b}」よりおもい。いちばんおもいのは？`], 3],
    [[`「${scene}」の四枚の札のうち、裏に星があるのは一枚。係は「${a}」と「${b}」のどちらにも星がないと言った。さらに「${d}」は丸印だけ。星がある札は？`, `Exactly one of four cards for ${scene} has a star on the back. Neither ${a} nor ${b} has one. ${d} has only a circle. Which card has the star?`, `「${scene}」のふだ4まいのうち、うらにほしがあるのは1まい。「${a}」も「${b}」もほしはない。「${d}」にはまるだけ。ほしがあるのは？`], 2],
    [[`「${scene}」の札で暗号を作る。「${a}」=2、「${b}」=4、「${c}」=7、「${d}」=9。最初の札は「${c}」。二枚の数を足して11にするなら、二枚目は？`, `Codes on the ${scene} cards are ${a} = 2, ${b} = 4, ${c} = 7, and ${d} = 9. What second card brings the total to 11 if the first is ${c}?`, `「${scene}」のふだのあんごう。「${a}」=2、「${b}」=4、「${c}」=7、「${d}」=9。1まいめは「${c}」。2まいをたして11にするには？`], 1],
    [[`「${scene}」の札を二段に二枚ずつ置く。「${a}」は「${c}」の真下。「${d}」は「${c}」の右上ではなく真横で、右側にある。「${d}」の真下は？`, `Four cards about ${scene} fill a two-by-two display. ${a} is directly below ${c}. ${d} is directly to the right of ${c}. Which is directly below ${d}?`, `「${scene}」のふだを2だんに2まいずつおく。「${a}」は「${c}」のました。「${d}」は「${c}」のすぐみぎ。「${d}」のましたは？`], 1],
    [[`「${scene}」の四枚で得票を競う。「${a}」は3票。「${d}」はその2倍。「${b}」は「${d}」より1票少ない。「${c}」は「${b}」より3票多い。最多は？`, `Four cards are in a vote about ${scene}. ${a} gets 3 votes. ${d} gets twice as many. ${b} gets 1 fewer than ${d}. ${c} gets 3 more than ${b}. Which card wins?`, `「${scene}」のふだ4まいでとうひょう。「${a}」は3ひょう。「${d}」はその2ばい。「${b}」は「${d}」より1ひょうすくない。「${c}」は「${b}」より3ひょうおおい。かつのは？`], 2],
    [[`「${scene}」の札から二枚を選ぶ。「${a}」を選ぶなら「${b}」も必ず選ぶ。「${d}」と「${b}」は同時に選べない。すでに「${d}」があるとき、追加できる札は？`, `Choose two cards about ${scene}. Taking ${a} requires taking ${b}, and ${d} cannot share a pair with ${b}. You already have ${d}. Which new card is possible?`, `「${scene}」のふだから2まいえらぶ。「${a}」をえらぶなら「${b}」もえらぶ。「${d}」と「${b}」はいっしょにえらべない。「${d}」があるとき、あと1まいは？`], 2],
    [[`「${scene}」を発表する四班。10時から15分おきに一班ずつ発表する。「${d}」が最後。「${b}」は「${c}」の直後。「${a}」は10時。10時15分の発表は？`, `Four groups present on ${scene} every 15 minutes starting at 10. ${d} is last, ${b} follows ${c} directly, and ${a} is at 10. Who presents at 10:15?`, `「${scene}」を4はんがはっぴょうする。10じから15ふんおき。「${d}」はさいご。「${b}」は「${c}」のすぐあと。「${a}」は10じ。10じ15ふんは？`], 2],
    [[`「${scene}」の札が上から「${c}」「${a}」「${d}」「${b}」の順に積んである。一番上を底へ移し、次に上から二枚を順序を保って底へ移す。最後に一番上は？`, `A stack of ${scene} cards from top down is ${c}, ${a}, ${d}, ${b}. Move the top card to the bottom. Then move the top two together to the bottom, preserving their order. What card ends up on top?`, `「${scene}」のふだはうえから「${c}」「${a}」「${d}」「${b}」。いちばんうえをしたへうつす。そのあと、うえから2まいをじゅんばんをかえずにしたへうつす。さいごにうえにくるのは？`], 1],
    [[`「${scene}」の札を引く袋に「${a}」が1枚、「${b}」が2枚、「${c}」が2枚、「${d}」が3枚ある。「${d}」を全部取り除く。その後「${b}」を1枚増やす。一番出やすいのは？`, `A bag of ${scene} cards contains 1 ${a}, 2 ${b}, 2 ${c}, and 3 ${d}. Remove every ${d}, then add one ${b}. Which card is now most likely to be drawn?`, `「${scene}」のふくろに「${a}」が1まい、「${b}」が2まい、「${c}」が2まい、「${d}」が3まい。「${d}」をぜんぶとり、あとで「${b}」を1まいいれる。どれがもっともでやすい？`], 1],
  ];
  const [text, correct] = rules[variant % rules.length];
  const alternate = (correct + 1 + (variant % 3)) % options.length;
  const [x, y] = variant % 2 ? [correct, alternate] : [alternate, correct];
  const clueX = choices[x][1][locale], clueY = choices[y][1][locale];
  const intro = [
    `Xは「${clueX}」、Yは「${clueY}」に当てはまる札。`,
    `Two cards use clues for names. X: “${clueX}.” Y: “${clueY}.” `,
    `Xは「${clueX}」、Yは「${clueY}」にあてはまるふだ。`,
  ][locale];
  const puzzle = text[locale].replace(/{([A-D])}/g, (_, token: string) => {
    const position = 'ABCD'.indexOf(token);
    return position === x ? 'X' : position === y ? 'Y' : options[position];
  });
  return objective(intro + puzzle, options, correct);
}

function drawingQuestions(category: Category, level: Level, locale: QuestionLocale): ShowQuestion[] {
  const motifs = drawings[category];
  const patterns = frameSets[`DRAW:${level}`];
  return motifs.map((motif, i) => {
    const other = motifs[(i + (level === 'NORMAL' ? 9 : 13)) % motifs.length];
    const subject = motif[locale], partner = other[locale];
    const frame = patterns?.[i % patterns.length];
    const answer = frame ? questionText(frame[0], locale, { '*':subject, '~':partner }) : subject;
    const join = locale === 1 ? ' and ' : 'と';
    const aliases = frame ? [subject + join + partner, partner + join + subject] : [...new Set(motif.filter(a => a !== answer))];
    return {
      id: `catalogue-DRAW-${category}-${level}-${i}`,
      prompt: [`絵で伝えよう：${answer}`, `Draw: ${answer}`, `えでつたえよう：${answer}`][locale],
      answer, aliases, options: [], category, difficulty: level, party: true, format: 'FLIP', points: 100, seconds: 90,
    };
  });
}

export function generatedQuestions(mode: ShowMode, language: LanguageMode, category: Category, level: Level): ShowQuestion[] {
  const locale = localeIndex(language);
  if (mode === 'DRAW') return drawingQuestions(category, level, locale);
  const groups = topics[category];
  const fact = supportsLearningUnits(mode);
  const levelIndex = VARIETY_LEVELS.indexOf(level);
  const patterns = fact ? undefined : frameSets[`${mode as Format}:${level}`];
  return groups.flatMap(([topic, terms], groupIndex) => terms.map(([name], termIndex) => {
    const serial = groupIndex * terms.length + termIndex;
    const groupAt = (offset: number) => groups[(groupIndex + offset) % groups.length];
    let prompt: string;
    let answer = '';
    let options: string[] = [];
    let aliases: string[] = [];
    if (fact) {
      const nextGroup = groupAt(1);
      const quartet = terms.slice(termIndex).concat(terms.slice(0, termIndex));
      ({ prompt, answer, options } = level === 'EASY' ? directQuestion(terms, termIndex, locale)
        : level === 'NORMAL' ? topicQuestion(groups[groupIndex], nextGroup, [groupAt(3)[0][locale],groupAt(5)[0][locale]], termIndex, locale)
          : deductionQuestion(quartet, serial, topic[locale], locale));
      if (level === 'EASY') aliases = [...new Set(name.filter(a => a !== answer))];
      if (answer.includes(' → ')) aliases = ['、', 'と', ' and ', ', '].map(join => answer.replace(' → ', join));
    } else {
      const frame = patterns?.[(serial + levelIndex * 3) % patterns.length];
      const partner = groupAt(3)[1][(termIndex + 1) % terms.length][0][locale];
      let subject = name[locale];
      if (level === 'EASY' && (mode === 'NEAREST' || mode === 'VOTE')) subject = drawings[category][serial][locale];
      if (level === 'HARD' && mode === 'NEAREST') subject += (locale === 1 ? ' and ' : 'と') + partner;
      const words = { '*': subject, '^': topic[locale], '~': partner };
      prompt = frame ? questionText(frame[0], locale, words) : name[locale];
      if (mode !== 'NEAREST') options = frame?.[1]?.map(option => questionText(option, locale, words)) ?? terms.map(([label]) => label[locale]);
    }
    const offset = (groupIndex + termIndex * 2) % Math.max(1, options.length);
    options = options.slice(offset).concat(options.slice(0, offset));
    return {
      id: `catalogue-${mode}-${category}-${level}-${serial}`,
      prompt, answer, options, aliases, category, difficulty: level, opinion: !fact,
      party: true, format: 'TEXT', points: 100,
      seconds: mode === 'VOTE' ? 90 : mode === 'NEAREST' ? 60 : fact && level === 'HARD' ? 65 : mode === 'BUZZER' ? 25 : 40,
    };
  }));
}

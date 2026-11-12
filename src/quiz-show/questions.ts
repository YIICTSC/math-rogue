import type { LanguageMode } from '../types';
import type { ShowMode, ShowQuestion } from './types';
import { copy } from './copy';
export function starterQuestions(mode: ShowMode, language: LanguageMode): ShowQuestion[] {
  const t = copy(language);
  const source: [string, string, string[]?][] = mode === 'DRAW' ? [
    [t('このお題を絵で伝えよう', 'Draw this secret word', 'このおだいをえでつたえよう'), t('ペンギン', 'penguin')],
    [t('このお題を絵で伝えよう', 'Draw this secret word', 'このおだいをえでつたえよう'), t('宇宙船', 'spaceship', 'うちゅうせん')],
    [t('このお題を絵で伝えよう', 'Draw this secret word', 'このおだいをえでつたえよう'), t('たこ焼き', 'octopus dumpling', 'たこやき')],
  ] : mode === 'CONSENSUS' || mode === 'MAJORITY' || mode === 'WOLF' ? [
    [t('赤い食べ物といえば？', 'Name a red food.', 'あかいたべものといえば？'), ''],
    [t('冒険に持っていきたい物を1つ！', 'Name one thing you would bring on an adventure.', 'ぼうけんにもっていきたいものを1つ！'), ''],
    [t('夏の楽しみといえば？', 'What is the best thing about summer?', 'なつのたのしみといえば？'), ''],
  ] : mode === 'VOTE' ? [
    [t('寝坊した魔王。勇者に送った言い訳は？', 'The dark lord overslept. What excuse did they send the hero?', 'ねぼうしたまおう。ゆうしゃにおくったいいわけは？'), ''],
    [t('こんな宝箱は開けたくない！どんな宝箱？', 'A treasure chest you would never want to open. What is it like?', 'こんなたからばこはあけたくない！どんなたからばこ？'), ''],
    [t('新しい学校の教科、その驚きの名前は？', 'Invent a surprising new school subject.', 'あたらしいがっこうのきょうか、そのおどろきのなまえは？'), ''],
  ] : mode === 'NEAREST' ? [
    [t('日本の都道府県はいくつ？', 'How many prefectures are there in Japan?', 'にほんのとどうふけんはいくつ？'), '47'],
    [t('1週間は何分？', 'How many minutes are in a week?', '1しゅうかんはなんぷん？'), '10080'],
    [t('正八角形の内角の合計は何度？', 'What is the sum of the interior angles of an octagon?', 'せいはっかくけいのないかくのごうけいはなんど？'), '1080'],
  ] : [
    [t('虹は、日本では一般に何色と数える？', 'How many colors are traditionally counted in a rainbow?', 'にじは、にほんではいっぱんになんしょくとかぞえる？'), '7', ['7色', '七色', 'seven']],
    [t('12 × 8 = ?', '12 × 8 = ?'), '96'],
    [t('地球の周りを回る、自然の衛星は？', 'What natural satellite orbits the Earth?', 'ちきゅうのまわりをまわる、しぜんのえいせいは？'), t('月', 'moon', 'つき'), ['つき', 'the moon']],
    [t('水が氷になる温度は、1気圧で何℃？', 'At one atmosphere, at what temperature (°C) does water freeze?', 'みずがこおりになるおんどは、1きあつでなん℃？'), '0', ['0℃', '0度', '零度']],
    [t('英語の「library」は日本語で何？', 'What is a place where you borrow books called?', 'えいごの「library」はにほんごでなに？'), t('図書館', 'library', 'としょかん'), ['としょかん']],
    [t('三角形の内角の和は何度？', 'What is the sum of a triangle’s interior angles?', 'さんかくけいのないかくのわはなんど？'), '180', ['180度', '180°']],
  ];
  return source.map(([prompt, answer, aliases = []], i) => ({ id: `starter-${mode}-${i}`, prompt, answer, aliases, options: [], format: mode === 'DRAW' ? 'FLIP' : 'TEXT', seconds: mode === 'DRAW' || mode === 'VOTE' ? 90 : 40, points: 100 }));
}

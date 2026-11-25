import type { QuizAudience, RecommendedAudience, ShowQuestion } from '../types';

export const AUDIENCE_COPY: Record<QuizAudience, [string, string, string]> = {
  ALL: ['すべての年代', 'All ages', 'すべての ねんだい'],
  ELEMENTARY: ['小学生向け', 'Elementary school', 'しょうがくせいむけ'],
  MIDDLE: ['中学生向け', 'Middle school', 'ちゅうがくせいむけ'],
  HIGH: ['高校生向け', 'High school', 'こうこうせいむけ'],
  ADULT: ['社会人向け', 'Adults', 'しゃかいじんむけ'],
};

const everyone: readonly RecommendedAudience[] = ['ELEMENTARY', 'MIDDLE', 'HIGH', 'ADULT'];
const schoolKids: readonly RecommendedAudience[] = ['ELEMENTARY', 'MIDDLE'];
const schoolAge: readonly RecommendedAudience[] = ['ELEMENTARY', 'MIDDLE', 'HIGH'];
const teenagers: readonly RecommendedAudience[] = ['MIDDLE', 'HIGH'];
const older: readonly RecommendedAudience[] = ['MIDDLE', 'HIGH', 'ADULT'];
const highAndAdult: readonly RecommendedAudience[] = ['HIGH', 'ADULT'];
const highSchool: readonly RecommendedAudience[] = ['HIGH'];
const adults: readonly RecommendedAudience[] = ['ADULT'];

const adultLife = /飲酒|ビール|ワイン|カクテル|日本酒|たばこ|ギャンブル|同窓会|残業|上司|部下|社内|同僚|勤務先|職場|通勤|給与|給料|雇用契約|商談|稟議|見積書|請求書|社会保険|住宅ローン|住宅の契約|家賃|賃貸契約|確定申告|所得税|年金|ふるさと納税|クレジットカードの明細/u;
const highSchoolLife = /高校生|高校の|大学受験|模試|進路相談|アルバイト/u;
const laterKnowledge = /大学生|就活|投資|株式|為替|複利|暗号資産|著作権|インフレ|プライバシー|人工知能|半導体|暗号化|素粒子|量子|放射性|相対性|ゲノム|電磁誘導|細胞分裂|対数|三角関数|大気圏|世界遺産条約|条約|参議院/u;
const youngerLife = /小学生|小学校|ランドセル|おこづかい|お小遣い|朝の読書|給食当番|給食の配膳|なわとび|自由研究|上履き|九九|運動会のみんな/u;
const teenLife = /中学生|中学校|部活動|部活|期末テスト|定期テスト|修学旅行|文化祭|委員会活動|放課後の教室|校則/u;
const growingKnowledge = /標準時|都道府県庁|光合成|水溶液|化学式|化石|電流|地層|偏西風|地震計|成層圏|気圧|血液型|元素|周期表|道管|食物連鎖|歴史資料|条里|江戸幕府|信用金庫|銀行の|物価|製本|金継ぎ|業務|配当|ハザードマップ/u;
const familiar = /教室|教科|学校|黒板|絵本|鉛筆|色えんぴつ|消しゴム|おやつ|プリン|ラーメン|絵の具|ごはん|自転車|電車|カブトムシ|どうぶつ|犬|猫|ネコ|ペンギン|手紙|友達|おもちゃ|帰り道|家族|遊び|お店|買い物|貯金箱|百円玉|十円玉|値引き札|おつり|お釣り|財布|お年玉|自動販売機|消防車|ウサギ|星座|月の形|歯みがき|手洗い|ロボット|信号|工作|手品/u;
const lightTopics = ['ANIMALS', 'FOOD', 'DAILY', 'FANTASY', 'GAMES'];
const studyTopics = ['HISTORY', 'TECH', 'SPACE', 'CULTURE', 'WORLD', 'MYSTERY'];

/** Recommend audiences by topic first, then apply level within the broader categories. */
export function recommendedAudiences(question: ShowQuestion, level: NonNullable<ShowQuestion['difficulty']>): readonly RecommendedAudience[] {
  const topic = `${question.prompt} ${question.answer}`;
  const category = question.category ?? '';
  if (adultLife.test(`${topic} ${question.options.join(' ')}`)) return adults;
  if (highSchoolLife.test(topic)) return highSchool;
  if (laterKnowledge.test(topic)) return highAndAdult;
  if (youngerLife.test(topic)) return schoolKids;
  if (teenLife.test(topic)) return teenagers;
  if (growingKnowledge.test(topic)) return level === 'HARD' ? highAndAdult : older;
  if (familiar.test(topic)) {
    if (category === 'SCHOOL' || level === 'EASY') return schoolKids;
    return level === 'NORMAL' ? everyone : schoolAge;
  }
  if (category === 'SCHOOL') return level === 'EASY' ? schoolKids : teenagers;
  if (category === 'LOVE') return level === 'EASY' ? teenagers : older;
  if (category === 'WORK' || category === 'MONEY') return level === 'EASY' ? older : highAndAdult;
  if (lightTopics.includes(category)) return level === 'EASY' ? everyone : level === 'NORMAL' ? schoolAge : older;
  if (studyTopics.includes(category)) return level === 'EASY' ? schoolKids : level === 'NORMAL' ? older : highAndAdult;
  return level === 'EASY' ? everyone : level === 'NORMAL' ? teenagers : highAndAdult;
}

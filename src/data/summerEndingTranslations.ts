import { HIGH_SCHOOL_VACATION_TRUE_ENDINGS, type SummerText } from './vacationEndlessEndings';
import { MAGIC_VACATION_TRUE_ENDINGS } from './magicVacationTrueEndings';
import { MAGIC_SUMMER_FRIENDSHIP_ENDINGS } from './magicSummerFriendshipEndings';
import { MAGIC_SUMMER_EPILOGUES } from './magicSummerEpilogues';

const lines: SummerText[] = [
  ['夏の友情エンド', 'なつの ゆうじょうえんど', 'Summer Friendship Ending'],
  ['夏の後日談', 'なつの ごじつだん', 'Summer Epilogue'],
  ...Object.values(HIGH_SCHOOL_VACATION_TRUE_ENDINGS).flatMap(story => story.flatMap(p => [p.title, p.text, p.dialogue])),
  ...Object.values(MAGIC_VACATION_TRUE_ENDINGS).flatMap(story => story.flatMap(p => [p.title, p.text, p.dialogue])),
  ...Object.values(MAGIC_SUMMER_FRIENDSHIP_ENDINGS).flatMap(p => [p.title, p.description, ...p.lines]),
  ...Object.values(MAGIC_SUMMER_EPILOGUES).flatMap(story => story.flatMap(p => [p.title, p.text, p.dialogue])),
];
export const SUMMER_ENDING_ENGLISH: Record<string, string> = Object.fromEntries(lines.map(([ja, , en]) => [ja, en]));
export const SUMMER_ENDING_HIRAGANA: Record<string, string> = Object.fromEntries(lines.map(([ja, hira]) => [ja, hira]));

import type { LanguageMode } from '../types';

export type TypingLessonId =
  | 'HOME_ROW'
  | 'ALPHABET'
  | 'NUMBERS_SYMBOLS'
  | 'ROMAJI_VOWELS'
  | 'ROMAJI_KA'
  | 'ROMAJI_SA'
  | 'ROMAJI_TA'
  | 'ROMAJI_NA_HA'
  | 'ROMAJI_MA_YA_RA_WA'
  | 'ROMAJI_BASIC'
  | 'ROMAJI_ADVANCED'
  | 'WORDS'
  | 'SENTENCES'
  | 'ENGLISH'
  | 'MIXED';

export type TypingTier = 'BEGINNER' | 'BASIC' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';

export interface TypingLessonDefinition {
  id: TypingLessonId;
  title: string;
  shortTitle: string;
  category: TypingTier;
  description: string;
  stages: string[];
}

export const TYPING_LESSON_DEFINITIONS: TypingLessonDefinition[] = [
  {
    id: 'HOME_ROW',
    title: 'ホームポジション',
    shortTitle: 'ホーム',
    category: 'BEGINNER',
    description: 'F と J から始めて、左右の基本指だけで確実に打つ。',
    stages: ['1文字', '2文字', 'ホーム列連続', '左右交互', '短い並び']
  },
  {
    id: 'ALPHABET',
    title: 'アルファベット',
    shortTitle: 'ABC',
    category: 'BASIC',
    description: 'a-z を段階的に広げ、単語の形でも打てるようにする。',
    stages: ['ホーム周辺', '上段追加', '下段追加', '短単語', '長単語']
  },
  {
    id: 'NUMBERS_SYMBOLS',
    title: '数字・記号',
    shortTitle: '数字記号',
    category: 'BASIC',
    description: '数字列、時刻、簡単な記号入力まで扱う。',
    stages: ['1-5', '0-9', '時刻', '記号まじり', '数字記号連続']
  },
  {
    id: 'ROMAJI_VOWELS',
    title: 'ローマ字 母音',
    shortTitle: '母音',
    category: 'INTERMEDIATE',
    description: 'あいうえお と、母音をふく短い語から始める。',
    stages: ['母音1字', '母音2字', '母音語', '母音混合', '短語']
  },
  {
    id: 'ROMAJI_KA',
    title: 'ローマ字 か行',
    shortTitle: 'か行',
    category: 'INTERMEDIATE',
    description: 'かきくけこ と、その語を繰り返し打つ。',
    stages: ['1字', '2字', '基本語', '語混合', '短語']
  },
  {
    id: 'ROMAJI_SA',
    title: 'ローマ字 さ行',
    shortTitle: 'さ行',
    category: 'INTERMEDIATE',
    description: 'さしすせそ を中心に、shi などの形に慣れる。',
    stages: ['1字', '2字', '基本語', '語混合', '短語']
  },
  {
    id: 'ROMAJI_TA',
    title: 'ローマ字 た行',
    shortTitle: 'た行',
    category: 'INTERMEDIATE',
    description: 'たちつてと を中心に、chi / tsu の入力を固める。',
    stages: ['1字', '2字', '基本語', '語混合', '短語']
  },
  {
    id: 'ROMAJI_NA_HA',
    title: 'ローマ字 な行・は行',
    shortTitle: 'な/は行',
    category: 'INTERMEDIATE',
    description: 'な行・は行をまとまりで練習し、fu も扱う。',
    stages: ['な行', 'は行', '語', '混合語', '短語']
  },
  {
    id: 'ROMAJI_MA_YA_RA_WA',
    title: 'ローマ字 ま行以降',
    shortTitle: 'ま行以降',
    category: 'INTERMEDIATE',
    description: 'ま行・や行・ら行・わ行・ん をまとめて練習する。',
    stages: ['ま行', 'や/ら行', 'わ/ん', '混合語', '短語']
  },
  {
    id: 'ROMAJI_BASIC',
    title: 'ローマ字基礎',
    shortTitle: 'ローマ字基礎',
    category: 'INTERMEDIATE',
    description: 'あいうえお から、か行・さ行・た行などの基本ローマ字。',
    stages: ['母音', 'か行', 'さ行', 'た行', '2-3語']
  },
  {
    id: 'ROMAJI_ADVANCED',
    title: 'ローマ字発展',
    shortTitle: 'ローマ字発展',
    category: 'ADVANCED',
    description: '拗音・促音・長音・ん を含む、日本語入力の要所を鍛える。',
    stages: ['きゃ/しゃ', 'っ', 'ん', '長音', '難語']
  },
  {
    id: 'WORDS',
    title: '学校ことば',
    shortTitle: 'ことば',
    category: 'INTERMEDIATE',
    description: '学校や日常でよく使う語を、かなとローマ字の両面で打つ。',
    stages: ['身近な語', '教室語', '行動語', '複合語', '長めの語']
  },
  {
    id: 'SENTENCES',
    title: '短文タイピング',
    shortTitle: '短文',
    category: 'ADVANCED',
    description: '短い日本語文を、読みながらリズムよく入力する。',
    stages: ['あいさつ', '学校文', '生活文', '説明文', '長めの文']
  },
  {
    id: 'ENGLISH',
    title: 'English Typing',
    shortTitle: 'English',
    category: 'ADVANCED',
    description: '英単語と短文を打ち、英語キー配置にも慣れる。',
    stages: ['短語', '学校語', '文型', '会話文', '長めの英文']
  },
  {
    id: 'MIXED',
    title: '総合タイピング',
    shortTitle: '総合',
    category: 'EXPERT',
    description: 'かな・ローマ字・英語・数字記号を混ぜ、幅広く対応する。',
    stages: ['基礎混合', '語混合', '文混合', '記号混合', '高密度']
  }
];

export const ENGLISH_TYPING_LESSON_DEFINITIONS: TypingLessonDefinition[] = [
  {
    id: 'HOME_ROW',
    title: 'Home Row',
    shortTitle: 'Home Row',
    category: 'BEGINNER',
    description: 'Start with F and J, then build steady left-and-right hand control.',
    stages: ['F and J', 'Home keys', 'Left and right', 'Short patterns', 'Home-row words']
  },
  {
    id: 'ALPHABET',
    title: 'Alphabet Keys',
    shortTitle: 'Alphabet',
    category: 'BASIC',
    description: 'Find every letter key and type common letter patterns.',
    stages: ['A–F', 'G–L', 'M–R', 'S–Z', 'Whole alphabet']
  },
  {
    id: 'NUMBERS_SYMBOLS',
    title: 'Numbers and Symbols',
    shortTitle: 'Numbers',
    category: 'BASIC',
    description: 'Practice number keys, time, dates and classroom punctuation.',
    stages: ['1–5', '0–9', 'Time', 'Math symbols', 'Mixed symbols']
  },
  {
    id: 'ROMAJI_VOWELS',
    title: 'Short Vowels',
    shortTitle: 'Vowels',
    category: 'INTERMEDIATE',
    description: 'Type short words with a, e, i, o and u vowel sounds.',
    stages: ['Short a', 'Short e', 'Short i', 'Short o', 'Short u']
  },
  {
    id: 'ROMAJI_KA',
    title: 'CVC Words',
    shortTitle: 'CVC',
    category: 'INTERMEDIATE',
    description: 'Build accuracy with consonant-vowel-consonant words.',
    stages: ['-at words', '-en words', '-ig words', '-op words', 'Mixed CVC']
  },
  {
    id: 'ROMAJI_SA',
    title: 'Digraphs',
    shortTitle: 'Digraphs',
    category: 'INTERMEDIATE',
    description: 'Practice common two-letter sounds such as sh, ch, th and wh.',
    stages: ['sh', 'ch', 'th', 'wh', 'Mixed digraphs']
  },
  {
    id: 'ROMAJI_TA',
    title: 'Consonant Blends',
    shortTitle: 'Blends',
    category: 'INTERMEDIATE',
    description: 'Keep both consonants clear in blends such as bl, st and cr.',
    stages: ['L blends', 'R blends', 'S blends', 'Ending blends', 'Mixed blends']
  },
  {
    id: 'ROMAJI_NA_HA',
    title: 'Sight Words',
    shortTitle: 'Sight Words',
    category: 'INTERMEDIATE',
    description: 'Type high-frequency words that young readers meet every day.',
    stages: ['Starter words', 'Question words', 'Action words', 'School words', 'Longer sight words']
  },
  {
    id: 'ROMAJI_MA_YA_RA_WA',
    title: 'Word Families',
    shortTitle: 'Families',
    category: 'INTERMEDIATE',
    description: 'Recognize spelling patterns shared by related word families.',
    stages: ['-ake / -ame', '-ight', '-ound', '-tion', 'Mixed families']
  },
  {
    id: 'ROMAJI_BASIC',
    title: 'School Words',
    shortTitle: 'School',
    category: 'INTERMEDIATE',
    description: 'Practice useful words for classrooms, subjects and school life.',
    stages: ['Supplies', 'People', 'Places', 'Subjects', 'School day']
  },
  {
    id: 'ROMAJI_ADVANCED',
    title: 'Spelling Patterns',
    shortTitle: 'Spelling',
    category: 'ADVANCED',
    description: 'Practice silent letters, vowel teams and common suffixes.',
    stages: ['Vowel teams', 'Silent e', 'Silent letters', 'Suffixes', 'Mixed spelling']
  },
  {
    id: 'WORDS',
    title: 'Academic Words',
    shortTitle: 'Academic',
    category: 'INTERMEDIATE',
    description: 'Type words used in reading, mathematics, science and projects.',
    stages: ['Reading', 'Math', 'Science', 'Projects', 'Longer words']
  },
  {
    id: 'SENTENCES',
    title: 'Sentence Typing',
    shortTitle: 'Sentences',
    category: 'ADVANCED',
    description: 'Type complete child-friendly sentences with spaces and capitals.',
    stages: ['Short sentences', 'School sentences', 'Questions', 'Directions', 'Longer sentences']
  },
  {
    id: 'ENGLISH',
    title: 'Conversation Typing',
    shortTitle: 'Conversation',
    category: 'ADVANCED',
    description: 'Practice friendly questions and answers used by children at school.',
    stages: ['Greetings', 'Requests', 'Questions', 'Class discussion', 'Long responses']
  },
  {
    id: 'MIXED',
    title: 'English Typing Challenge',
    shortTitle: 'Challenge',
    category: 'EXPERT',
    description: 'Combine words, capitals, numbers and punctuation in one challenge.',
    stages: ['Words and numbers', 'Capitals', 'Punctuation', 'Dates and time', 'Full challenge']
  }
];

export const getTypingLessonDefinitions = (languageMode: LanguageMode): TypingLessonDefinition[] =>
  languageMode === 'ENGLISH' ? ENGLISH_TYPING_LESSON_DEFINITIONS : TYPING_LESSON_DEFINITIONS;

export const getTypingLessonDefinition = (
  lessonId?: string,
  languageMode: LanguageMode = 'JAPANESE'
): TypingLessonDefinition => {
  const definitions = getTypingLessonDefinitions(languageMode);
  return definitions.find((lesson) => lesson.id === lessonId) ?? definitions[0];
};

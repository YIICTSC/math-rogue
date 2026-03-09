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

export const getTypingLessonDefinition = (lessonId?: string): TypingLessonDefinition =>
  TYPING_LESSON_DEFINITIONS.find((lesson) => lesson.id === lessonId) ?? TYPING_LESSON_DEFINITIONS[0];

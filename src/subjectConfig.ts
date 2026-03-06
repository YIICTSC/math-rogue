
import { GameMode, GameScreen } from './types';

export type SubjectCategoryType = 'MATH' | 'MATH_GRADES' | 'KOKUGO_GRADES' | 'KANJI' | 'SCIENCE' | 'SOCIAL' | 'ENGLISH' | 'MAP_PREF' | 'IT_INFO';

export interface SubModeConfig {
    id: string;
    name: string;
    mode: GameMode;
}

export interface SubjectCategoryConfig {
    id: SubjectCategoryType;
    name: string;
    color: string;
    // 選択UIのタイプ: 
    // 'grid': 単純なグリッド一覧
    // 'grade_term': 学年と学期を選択するタイプ
    // 'english_mixed': 英語専用（単語と会話）
    uiType: 'grid' | 'grade_term' | 'english_mixed';
    subModes: SubModeConfig[];
}

// どのGameModeがどのチャレンジ画面を表示すべきかのマッピング
const MODE_TO_SCREEN: Record<string, GameScreen> = {
    // 算数系（動的生成）
    [GameMode.ADDITION]: GameScreen.MATH_CHALLENGE,
    [GameMode.SUBTRACTION]: GameScreen.MATH_CHALLENGE,
    [GameMode.MULTIPLICATION]: GameScreen.MATH_CHALLENGE,
    [GameMode.DIVISION]: GameScreen.MATH_CHALLENGE,
    [GameMode.MIXED]: GameScreen.MATH_CHALLENGE,
    [GameMode.ADD_1DIGIT]: GameScreen.MATH_CHALLENGE,
    [GameMode.ADD_1DIGIT_CARRY]: GameScreen.MATH_CHALLENGE,
    [GameMode.SUB_1DIGIT]: GameScreen.MATH_CHALLENGE,
    [GameMode.SUB_1DIGIT_BORROW]: GameScreen.MATH_CHALLENGE,
    
    // 算数・数学系（静的データ）
    [GameMode.MATH_G1_1]: GameScreen.GENERAL_CHALLENGE,
    [GameMode.MATH_G1_2]: GameScreen.GENERAL_CHALLENGE,
    [GameMode.MATH_G1_3]: GameScreen.GENERAL_CHALLENGE,
    [GameMode.MATH_G2_1]: GameScreen.GENERAL_CHALLENGE,
    [GameMode.MATH_G2_2]: GameScreen.GENERAL_CHALLENGE,
    [GameMode.MATH_G2_3]: GameScreen.GENERAL_CHALLENGE,
    [GameMode.MATH_G3_1]: GameScreen.GENERAL_CHALLENGE,
    [GameMode.MATH_G3_2]: GameScreen.GENERAL_CHALLENGE,
    [GameMode.MATH_G3_3]: GameScreen.GENERAL_CHALLENGE,
    [GameMode.MATH_G4_1]: GameScreen.GENERAL_CHALLENGE,
    [GameMode.MATH_G4_2]: GameScreen.GENERAL_CHALLENGE,
    [GameMode.MATH_G4_3]: GameScreen.GENERAL_CHALLENGE,
    [GameMode.MATH_G5_1]: GameScreen.GENERAL_CHALLENGE,
    [GameMode.MATH_G5_2]: GameScreen.GENERAL_CHALLENGE,
    [GameMode.MATH_G5_3]: GameScreen.GENERAL_CHALLENGE,
    [GameMode.MATH_G6_1]: GameScreen.GENERAL_CHALLENGE,
    [GameMode.MATH_G6_2]: GameScreen.GENERAL_CHALLENGE,
    [GameMode.MATH_G6_3]: GameScreen.GENERAL_CHALLENGE,
    [GameMode.MATH_G7_1]: GameScreen.GENERAL_CHALLENGE,
    [GameMode.MATH_G7_2]: GameScreen.GENERAL_CHALLENGE,
    [GameMode.MATH_G7_3]: GameScreen.GENERAL_CHALLENGE,
    [GameMode.MATH_G8_1]: GameScreen.GENERAL_CHALLENGE,
    [GameMode.MATH_G8_2]: GameScreen.GENERAL_CHALLENGE,
    [GameMode.MATH_G8_3]: GameScreen.GENERAL_CHALLENGE,
    [GameMode.MATH_G9_1]: GameScreen.GENERAL_CHALLENGE,
    [GameMode.MATH_G9_2]: GameScreen.GENERAL_CHALLENGE,
    [GameMode.MATH_G9_3]: GameScreen.GENERAL_CHALLENGE,
    [GameMode.KOKUGO_G1_1]: GameScreen.GENERAL_CHALLENGE,
    [GameMode.KOKUGO_G2_1]: GameScreen.GENERAL_CHALLENGE,
    [GameMode.KOKUGO_G3_1]: GameScreen.GENERAL_CHALLENGE,
    [GameMode.KOKUGO_G4_1]: GameScreen.GENERAL_CHALLENGE,
    [GameMode.KOKUGO_G5_1]: GameScreen.GENERAL_CHALLENGE,
    [GameMode.KOKUGO_G6_1]: GameScreen.GENERAL_CHALLENGE,
    [GameMode.KOKUGO_G7_1]: GameScreen.GENERAL_CHALLENGE,
    [GameMode.KOKUGO_G8_1]: GameScreen.GENERAL_CHALLENGE,
    [GameMode.KOKUGO_G9_1]: GameScreen.GENERAL_CHALLENGE,

    // 漢字系
    [GameMode.KANJI_1]: GameScreen.KANJI_CHALLENGE,
    [GameMode.KANJI_2]: GameScreen.KANJI_CHALLENGE,
    [GameMode.KANJI_3]: GameScreen.KANJI_CHALLENGE,
    [GameMode.KANJI_4]: GameScreen.KANJI_CHALLENGE,
    [GameMode.KANJI_5]: GameScreen.KANJI_CHALLENGE,
    [GameMode.KANJI_6]: GameScreen.KANJI_CHALLENGE,
    [GameMode.KANJI_7]: GameScreen.KANJI_CHALLENGE,
    [GameMode.KANJI_8]: GameScreen.KANJI_CHALLENGE,
    [GameMode.KANJI_9]: GameScreen.KANJI_CHALLENGE,
    [GameMode.KANJI_MIXED]: GameScreen.KANJI_CHALLENGE,
    
    // 英語系
    [GameMode.ENGLISH_ES]: GameScreen.ENGLISH_CHALLENGE,
    [GameMode.ENGLISH_J1]: GameScreen.ENGLISH_CHALLENGE,
    [GameMode.ENGLISH_J2]: GameScreen.ENGLISH_CHALLENGE,
    [GameMode.ENGLISH_J3]: GameScreen.ENGLISH_CHALLENGE,
    [GameMode.ENGLISH_MIXED]: GameScreen.ENGLISH_CHALLENGE,
    [GameMode.ENGLISH_CONV_1]: GameScreen.ENGLISH_CHALLENGE,
    [GameMode.ENGLISH_CONV_2]: GameScreen.ENGLISH_CHALLENGE,
    [GameMode.ENGLISH_CONV_3]: GameScreen.ENGLISH_CHALLENGE,
    [GameMode.ENGLISH_CONV_4]: GameScreen.ENGLISH_CHALLENGE,
    [GameMode.ENGLISH_CONV_5]: GameScreen.ENGLISH_CHALLENGE,
};

// 指定されたモードに対応するチャレンジ画面を取得する（デフォルトは汎用チャレンジ）
export const getChallengeScreenForMode = (mode: GameMode): GameScreen => {
    return MODE_TO_SCREEN[mode] || GameScreen.GENERAL_CHALLENGE;
};

export const SUBJECT_CATEGORIES: SubjectCategoryConfig[] = [
  { 
    id: 'MATH', 
    name: 'けいさん', 
    color: 'emerald',
    uiType: 'grid',
    subModes: [
        { id: 'ADD_1DIGIT', name: '1ケタのたし算', mode: GameMode.ADD_1DIGIT },
        { id: 'ADD_1DIGIT_CARRY', name: 'たし算（くりあがり）', mode: GameMode.ADD_1DIGIT_CARRY },
        { id: 'SUB_1DIGIT', name: '1ケタのひき算', mode: GameMode.SUB_1DIGIT },
        { id: 'SUB_1DIGIT_BORROW', name: 'ひき算（くりさがり）', mode: GameMode.SUB_1DIGIT_BORROW },
        { id: 'ADDITION', name: '2ケタのたし算', mode: GameMode.ADDITION },
        { id: 'SUBTRACTION', name: '2ケタのひき算', mode: GameMode.SUBTRACTION },
        { id: 'MULTIPLICATION', name: 'かけ算九九', mode: GameMode.MULTIPLICATION },
        { id: 'DIVISION', name: 'わり算', mode: GameMode.DIVISION },
        { id: 'MIXED', name: 'ミックス', mode: GameMode.MIXED },
    ]
  },
  { 
    id: 'MATH_GRADES', 
    name: 'さんすう・数学', 
    color: 'emerald',
    uiType: 'grade_term',
    subModes: [
        { id: 'M1_1', name: '算 小1 1学期', mode: GameMode.MATH_G1_1 },
        { id: 'M1_2', name: '算 小1 2学期', mode: GameMode.MATH_G1_2 },
        { id: 'M1_3', name: '算 小1 3学期', mode: GameMode.MATH_G1_3 },
        { id: 'M2_1', name: '算 小2 1学期', mode: GameMode.MATH_G2_1 },
        { id: 'M2_2', name: '算 小2 2学期', mode: GameMode.MATH_G2_2 },
        { id: 'M2_3', name: '算 小2 3学期', mode: GameMode.MATH_G2_3 },
        { id: 'M3_1', name: '算 小3 1学期', mode: GameMode.MATH_G3_1 },
        { id: 'M3_2', name: '算 小3 2学期', mode: GameMode.MATH_G3_2 },
        { id: 'M3_3', name: '算 小3 3学期', mode: GameMode.MATH_G3_3 },
        { id: 'M4_1', name: '算 小4 1学期', mode: GameMode.MATH_G4_1 },
        { id: 'M4_2', name: '算 小4 2学期', mode: GameMode.MATH_G4_2 },
        { id: 'M4_3', name: '算 小4 3学期', mode: GameMode.MATH_G4_3 },
        { id: 'M5_1', name: '算 小5 1学期', mode: GameMode.MATH_G5_1 },
        { id: 'M5_2', name: '算 小5 2学期', mode: GameMode.MATH_G5_2 },
        { id: 'M5_3', name: '算 小5 3学期', mode: GameMode.MATH_G5_3 },
        { id: 'M6_1', name: '算 小6 1学期', mode: GameMode.MATH_G6_1 },
        { id: 'M6_2', name: '算 小6 2学期', mode: GameMode.MATH_G6_2 },
        { id: 'M6_3', name: '算 小6 3学期', mode: GameMode.MATH_G6_3 },
        { id: 'M7_1', name: '数 中1 1学期', mode: GameMode.MATH_G7_1 },
        { id: 'M7_2', name: '数 中1 2学期', mode: GameMode.MATH_G7_2 },
        { id: 'M7_3', name: '数 中1 3学期', mode: GameMode.MATH_G7_3 },
        { id: 'M8_1', name: '数 中2 1学期', mode: GameMode.MATH_G8_1 },
        { id: 'M8_2', name: '数 中2 2学期', mode: GameMode.MATH_G8_2 },
        { id: 'M8_3', name: '数 中2 3学期', mode: GameMode.MATH_G8_3 },
        { id: 'M9_1', name: '数 中3 1学期', mode: GameMode.MATH_G9_1 },
        { id: 'M9_2', name: '数 中3 2学期', mode: GameMode.MATH_G9_2 },
        { id: 'M9_3', name: '数 中3 3学期', mode: GameMode.MATH_G9_3 },
    ]
  },
  { 
    id: 'KOKUGO_GRADES',
    name: 'こくご',
    color: 'cyan',
    uiType: 'grade_term',
    subModes: [
        { id: 'J1_1', name: '国 小1', mode: GameMode.KOKUGO_G1_1 },
        { id: 'J2_1', name: '国 小2', mode: GameMode.KOKUGO_G2_1 },
        { id: 'J3_1', name: '国 小3', mode: GameMode.KOKUGO_G3_1 },
        { id: 'J4_1', name: '国 小4', mode: GameMode.KOKUGO_G4_1 },
        { id: 'J5_1', name: '国 小5', mode: GameMode.KOKUGO_G5_1 },
        { id: 'J6_1', name: '国 小6', mode: GameMode.KOKUGO_G6_1 },
        { id: 'J7_1', name: '国 中1', mode: GameMode.KOKUGO_G7_1 },
        { id: 'J8_1', name: '国 中2', mode: GameMode.KOKUGO_G8_1 },
        { id: 'J9_1', name: '国 中3', mode: GameMode.KOKUGO_G9_1 },
    ]
  },
  { 
    id: 'KANJI', 
    name: 'かんじ', 
    color: 'cyan',
    uiType: 'grid',
    subModes: [
        { id: 'K1', name: '小学1年', mode: GameMode.KANJI_1 },
        { id: 'K2', name: '小学2年', mode: GameMode.KANJI_2 },
        { id: 'K3', name: '小学3年', mode: GameMode.KANJI_3 },
        { id: 'K4', name: '小学4年', mode: GameMode.KANJI_4 },
        { id: 'K5', name: '小学5年', mode: GameMode.KANJI_5 },
        { id: 'K6', name: '小学6年', mode: GameMode.KANJI_6 },
        { id: 'K7', name: '中学1年', mode: GameMode.KANJI_7 },
        { id: 'K8', name: '中学2年', mode: GameMode.KANJI_8 },
        { id: 'K9', name: '中学3年', mode: GameMode.KANJI_9 },
        { id: 'K_MIXED', name: 'ミックス', mode: GameMode.KANJI_MIXED },
    ]
  },
  { 
    id: 'ENGLISH', 
    name: 'えいご', 
    color: 'indigo',
    uiType: 'english_mixed',
    subModes: [
        { id: 'E_ES', name: '小学校単語', mode: GameMode.ENGLISH_ES },
        { id: 'E_J1', name: '中1単語', mode: GameMode.ENGLISH_J1 },
        { id: 'E_J2', name: '中2単語', mode: GameMode.ENGLISH_J2 },
        { id: 'E_J3', name: '中3単語', mode: GameMode.ENGLISH_J3 },
        { id: 'C1', name: '会話 Lv1', mode: GameMode.ENGLISH_CONV_1 },
        { id: 'C2', name: '会話 Lv2', mode: GameMode.ENGLISH_CONV_2 },
        { id: 'C3', name: '会話 Lv3', mode: GameMode.ENGLISH_CONV_3 },
        { id: 'C4', name: '会話 Lv4', mode: GameMode.ENGLISH_CONV_4 },
        { id: 'C5', name: '会話 Lv5', mode: GameMode.ENGLISH_CONV_5 },
        { id: 'E_MIXED', name: 'ミックス', mode: GameMode.ENGLISH_MIXED },
    ]
  },
  { 
    id: 'SCIENCE', 
    name: 'せいかつ・理科', 
    color: 'amber',
    uiType: 'grade_term',
    subModes: [
        { id: 'L1_1', name: '生 小1 1学期', mode: GameMode.LIFE_1_1 },
        { id: 'L1_2', name: '生 小1 2学期', mode: GameMode.LIFE_1_2 },
        { id: 'L1_3', name: '生 小1 3学期', mode: GameMode.LIFE_1_3 },
        { id: 'L2_1', name: '生 小2 1学期', mode: GameMode.LIFE_2_1 },
        { id: 'L2_2', name: '生 小2 2学期', mode: GameMode.LIFE_2_2 },
        { id: 'L2_3', name: '生 小2 3学期', mode: GameMode.LIFE_2_3 },
        { id: 'S3_1', name: '理 小3 1学期', mode: GameMode.SCIENCE_3_1 },
        { id: 'S3_2', name: '理 小3 2学期', mode: GameMode.SCIENCE_3_2 },
        { id: 'S3_3', name: '理 小3 3学期', mode: GameMode.SCIENCE_3_3 },
        { id: 'S4_1', name: '理 小4 1学期', mode: GameMode.SCIENCE_4_1 },
        { id: 'S4_2', name: '理 小4 2学期', mode: GameMode.SCIENCE_4_2 },
        { id: 'S4_3', name: '理 小4 3学期', mode: GameMode.SCIENCE_4_3 },
        { id: 'S5_1', name: '理 小5 1学期', mode: GameMode.SCIENCE_5_1 },
        { id: 'S5_2', name: '理 小5 2学期', mode: GameMode.SCIENCE_5_2 },
        { id: 'S5_3', name: '理 小5 3学期', mode: GameMode.SCIENCE_5_3 },
        { id: 'S6_1', name: '理 小6 1学期', mode: GameMode.SCIENCE_6_1 },
        { id: 'S6_2', name: '理 小6 2学期', mode: GameMode.SCIENCE_6_2 },
        { id: 'S6_3', name: '理 小6 3学期', mode: GameMode.SCIENCE_6_3 },
        { id: 'S7_1', name: '理 中1 1学期', mode: GameMode.SCIENCE_7_1 },
        { id: 'S7_2', name: '理 中1 2学期', mode: GameMode.SCIENCE_7_2 },
        { id: 'S7_3', name: '理 中1 3学期', mode: GameMode.SCIENCE_7_3 },
        { id: 'S8_1', name: '理 中2 1学期', mode: GameMode.SCIENCE_8_1 },
        { id: 'S8_2', name: '理 中2 2学期', mode: GameMode.SCIENCE_8_2 },
        { id: 'S8_3', name: '理 中2 3学期', mode: GameMode.SCIENCE_8_3 },
        { id: 'S9_1', name: '理 中3 1学期', mode: GameMode.SCIENCE_9_1 },
        { id: 'S9_2', name: '理 中3 2学期', mode: GameMode.SCIENCE_9_2 },
        { id: 'S9_3', name: '理 中3 3学期', mode: GameMode.SCIENCE_9_3 },
    ]
  },
  { 
    id: 'SOCIAL', 
    name: 'しゃかい', 
    color: 'orange',
    uiType: 'grade_term',
    subModes: [
        { id: 'SO3_1', name: '社 小3 1学期', mode: GameMode.SOCIAL_3_1 },
        { id: 'SO3_2', name: '社 小3 2学期', mode: GameMode.SOCIAL_3_2 },
        { id: 'SO3_3', name: '社 小3 3学期', mode: GameMode.SOCIAL_3_3 },
        { id: 'SO4_1', name: '社 小4 1学期', mode: GameMode.SOCIAL_4_1 },
        { id: 'SO4_2', name: '社 小4 2学期', mode: GameMode.SOCIAL_4_2 },
        { id: 'SO4_3', name: '社 小4 3学期', mode: GameMode.SOCIAL_4_3 },
        { id: 'SO5_1', name: '社 小5 1学期', mode: GameMode.SOCIAL_5_1 },
        { id: 'SO5_2', name: '社 小5 2学期', mode: GameMode.SOCIAL_5_2 },
        { id: 'SO5_3', name: '社 小5 3学期', mode: GameMode.SOCIAL_5_3 },
        { id: 'SO6_1', name: '社 小6 1学期', mode: GameMode.SOCIAL_6_1 },
        { id: 'SO6_2', name: '社 小6 2学期', mode: GameMode.SOCIAL_6_2 },
        { id: 'SO6_3', name: '社 小6 3学期', mode: GameMode.SOCIAL_6_3 },
        { id: 'SO7_1', name: '社 中1 1学期', mode: GameMode.SOCIAL_7_1 },
        { id: 'SO7_2', name: '社 中1 2学期', mode: GameMode.SOCIAL_7_2 },
        { id: 'SO7_3', name: '社 中1 3学期', mode: GameMode.SOCIAL_7_3 },
        { id: 'SO8_1', name: '社 中2 1学期', mode: GameMode.SOCIAL_8_1 },
        { id: 'SO8_2', name: '社 中2 2学期', mode: GameMode.SOCIAL_8_2 },
        { id: 'SO8_3', name: '社 中2 3学期', mode: GameMode.SOCIAL_8_3 },
        { id: 'SO9_1', name: '社 中3 1学期', mode: GameMode.SOCIAL_9_1 },
        { id: 'SO9_2', name: '社 中3 2学期', mode: GameMode.SOCIAL_9_2 },
        { id: 'SO9_3', name: '社 中3 3学期', mode: GameMode.SOCIAL_9_3 },
    ]
  },
  { 
    id: 'MAP_PREF', 
    name: '地図・日本', 
    color: 'rose',
    uiType: 'grid',
    subModes: [
        { id: 'MS', name: '地図記号', mode: GameMode.MAP_SYMBOLS },
        { id: 'PF', name: '都道府県', mode: GameMode.PREFECTURES },
        { id: 'PC', name: '県庁所在地', mode: GameMode.PREF_CAPITALS },
    ]
  },
  {
    id: 'IT_INFO',
    name: 'ICT・情報',
    color: 'indigo',
    uiType: 'grid',
    subModes: [
        { id: 'IT_WIN', name: 'Windows', mode: GameMode.IT_WINDOWS },
        { id: 'IT_IPAD', name: 'iPad', mode: GameMode.IT_IPAD },
        { id: 'IT_CHROME', name: 'Chromebook', mode: GameMode.IT_CHROMEBOOK },
        { id: 'IT_NET', name: 'スマホ・ネット', mode: GameMode.IT_INTERNET },
        { id: 'IT_LIT', name: '情報リテラシー', mode: GameMode.IT_LITERACY },
        { id: 'IT_PROG', name: 'プログラミング', mode: GameMode.IT_PROGRAMMING },
        { id: 'IT_SEC', name: 'モラル・セキュリティ', mode: GameMode.IT_SECURITY },
    ]
  }
];

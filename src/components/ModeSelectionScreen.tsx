import React, { useEffect, useMemo, useState } from 'react';
import { AnswerMode, GameMode, LanguageMode } from '../types';
import {
  Brain, Book, Languages, FlaskConical, Globe, MapPin,
  Home, ArrowLeft, GraduationCap
} from 'lucide-react';
import { audioService } from '../services/audioService';
import { SUBJECT_CATEGORIES, SubjectCategoryConfig, SubjectCategoryType } from '../subjectConfig';
import { ENGLISH_GRADE_UNITS } from '../englishUnitConfig';
import { SCIENCE_GRADE_UNITS, getScienceGradeMode } from '../scienceUnitConfig';
import { SOCIAL_GRADE_UNITS, getSocialGradeMode } from '../socialUnitConfig';
import { trans, transProblemSubjectName } from '../utils/textUtils';
import { assetUrl } from '../utils/assetPaths';
import { saveAnswerModePreference } from '../utils/answerMode';

interface ModeSelectionScreenProps {
  onSelectMode: (mode: GameMode, modePool?: string[], answerMode?: AnswerMode) => void;
  onBack: () => void;
  languageMode: LanguageMode;
  modeMasteryMap?: Record<string, boolean>;
  modeCorrectCounts?: Record<string, number>;
}

interface MathUnitOption {
  id: string;
  name: string;
  mode?: string;
  modes?: string[];
}

interface SelectableUnitOption {
  id: string;
  name: string;
  mode?: string;
  modes?: string[];
}

const UNIT_MASTERY_TARGET = 100;
const UPPER_KANJI_SUB_MODE_IDS = new Set(['K10', 'K11', 'K12']);
const UPPER_PROBLEM_CATEGORIES: SubjectCategoryConfig[] = [
  {
    id: 'UPPER_MODERN',
    name: '現代文・語彙',
    color: 'cyan',
    uiType: 'grid',
    subModes: [{ id: 'UPPER_MODERN_VOCAB', name: '評論語彙・読解語', mode: GameMode.UPPER_MODERN_VOCAB }],
  },
  {
    id: 'UPPER_CLASSICS',
    name: '古典',
    color: 'amber',
    uiType: 'grid',
    subModes: [{ id: 'UPPER_CLASSICS', name: '古文・漢文基礎', mode: GameMode.UPPER_CLASSICS }],
  },
  {
    id: 'UPPER_ENGLISH',
    name: '英語',
    color: 'indigo',
    uiType: 'grid',
    subModes: [{ id: 'UPPER_ENGLISH', name: '高校英語基礎', mode: GameMode.UPPER_ENGLISH }],
  },
  {
    id: 'UPPER_INFORMATION',
    name: '情報',
    color: 'emerald',
    uiType: 'grid',
    subModes: [{ id: 'UPPER_INFORMATION', name: '情報I・ネット活用', mode: GameMode.UPPER_INFORMATION }],
  },
  {
    id: 'UPPER_TRIVIA',
    name: '雑学',
    color: 'rose',
    uiType: 'grid',
    subModes: [{ id: 'UPPER_TRIVIA', name: '一般常識・科学雑学', mode: GameMode.UPPER_TRIVIA }],
  },
  {
    id: 'UPPER_MATH',
    name: '数学',
    color: 'cyan',
    uiType: 'grid',
    subModes: [
      { id: 'UPPER_MATH_NUM_EXPR', name: '数と式', mode: GameMode.UPPER_MATH_NUM_EXPR },
      { id: 'UPPER_MATH_QUADRATIC', name: '二次関数', mode: GameMode.UPPER_MATH_QUADRATIC },
      { id: 'UPPER_MATH_GEOMETRY', name: '図形と計量', mode: GameMode.UPPER_MATH_GEOMETRY },
      { id: 'UPPER_MATH_PROB_STATS', name: '確率・統計', mode: GameMode.UPPER_MATH_PROB_STATS },
      { id: 'UPPER_MATH_TRIGONOMETRY', name: '三角関数', mode: GameMode.UPPER_MATH_TRIGONOMETRY },
      { id: 'UPPER_MATH_SEQUENCE', name: '数列', mode: GameMode.UPPER_MATH_SEQUENCE },
      { id: 'UPPER_MATH_VECTOR', name: 'ベクトル', mode: GameMode.UPPER_MATH_VECTOR },
      { id: 'UPPER_MATH_CALCULUS', name: '微分・積分基礎', mode: GameMode.UPPER_MATH_CALCULUS },
      { id: 'UPPER_MATH_EXP_LOG', name: '指数・対数', mode: GameMode.UPPER_MATH_EXP_LOG },
      { id: 'UPPER_MATH_COMPLEX', name: '複素数平面', mode: GameMode.UPPER_MATH_COMPLEX },
      { id: 'UPPER_MATH_ADV_PROB', name: '場合の数発展', mode: GameMode.UPPER_MATH_ADV_PROB },
      { id: 'UPPER_MATH_STAT_INFERENCE', name: '統計的推測', mode: GameMode.UPPER_MATH_STAT_INFERENCE },
      { id: 'UPPER_MATH_MATH_HISTORY', name: '数学史・活用', mode: GameMode.UPPER_MATH_MATH_HISTORY },
      { id: 'UPPER_MATH_LINEAR_ALGEBRA', name: '線形代数入門', mode: GameMode.UPPER_MATH_LINEAR_ALGEBRA },
      { id: 'UPPER_MATH_ANALYTIC_GEOMETRY', name: '解析幾何', mode: GameMode.UPPER_MATH_ANALYTIC_GEOMETRY },
      { id: 'UPPER_MATH_OPTIMIZATION', name: '最適化', mode: GameMode.UPPER_MATH_OPTIMIZATION },
      { id: 'UPPER_MATH_DISCRETE', name: '離散数学', mode: GameMode.UPPER_MATH_DISCRETE },
      { id: 'UPPER_MATH_FINANCE', name: '金融数学', mode: GameMode.UPPER_MATH_FINANCE },
      { id: 'UPPER_MATH_DERIVATIVE_APP', name: '微分応用', mode: GameMode.UPPER_MATH_DERIVATIVE_APP },
      { id: 'UPPER_MATH_INTEGRAL_APP', name: '積分応用', mode: GameMode.UPPER_MATH_INTEGRAL_APP },
      { id: 'UPPER_MATH_PROOF_ADV', name: '証明発展', mode: GameMode.UPPER_MATH_PROOF_ADV },
      { id: 'UPPER_MATH_FUNCTION_MIX', name: '関数総合', mode: GameMode.UPPER_MATH_FUNCTION_MIX },
      { id: 'UPPER_MATH_DATA_SCIENCE', name: 'データサイエンス基礎', mode: GameMode.UPPER_MATH_DATA_SCIENCE },
    ],
  },
  {
    id: 'UPPER_SCIENCE',
    name: '理科',
    color: 'emerald',
    uiType: 'grid',
    subModes: [
      { id: 'UPPER_SCIENCE_PHYSICS', name: '物理基礎', mode: GameMode.UPPER_SCIENCE_PHYSICS },
      { id: 'UPPER_SCIENCE_CHEMISTRY', name: '化学基礎', mode: GameMode.UPPER_SCIENCE_CHEMISTRY },
      { id: 'UPPER_SCIENCE_BIOLOGY', name: '生物基礎', mode: GameMode.UPPER_SCIENCE_BIOLOGY },
      { id: 'UPPER_SCIENCE_EARTH', name: '地学基礎', mode: GameMode.UPPER_SCIENCE_EARTH },
      { id: 'UPPER_SCIENCE_MECHANICS', name: '力学演習', mode: GameMode.UPPER_SCIENCE_MECHANICS },
      { id: 'UPPER_SCIENCE_ELECTROMAGNETISM', name: '電磁気', mode: GameMode.UPPER_SCIENCE_ELECTROMAGNETISM },
      { id: 'UPPER_SCIENCE_ORGANIC', name: '有機化学', mode: GameMode.UPPER_SCIENCE_ORGANIC },
      { id: 'UPPER_SCIENCE_GENETICS', name: '遺伝・進化', mode: GameMode.UPPER_SCIENCE_GENETICS },
      { id: 'UPPER_SCIENCE_ENVIRONMENT', name: '環境科学', mode: GameMode.UPPER_SCIENCE_ENVIRONMENT },
      { id: 'UPPER_SCIENCE_ASTRONOMY', name: '天文・宇宙', mode: GameMode.UPPER_SCIENCE_ASTRONOMY },
      { id: 'UPPER_SCIENCE_LAB', name: '実験・探究', mode: GameMode.UPPER_SCIENCE_LAB },
      { id: 'UPPER_SCIENCE_MEDICAL', name: '医療・生命科学', mode: GameMode.UPPER_SCIENCE_MEDICAL },
      { id: 'UPPER_SCIENCE_ENGINEERING', name: '科学技術', mode: GameMode.UPPER_SCIENCE_ENGINEERING },
      { id: 'UPPER_SCIENCE_THERMODYNAMICS', name: '熱とエネルギー', mode: GameMode.UPPER_SCIENCE_THERMODYNAMICS },
      { id: 'UPPER_SCIENCE_WAVES_OPTICS', name: '波動・光学', mode: GameMode.UPPER_SCIENCE_WAVES_OPTICS },
      { id: 'UPPER_SCIENCE_INORGANIC', name: '無機化学', mode: GameMode.UPPER_SCIENCE_INORGANIC },
      { id: 'UPPER_SCIENCE_ECOLOGY_ADV', name: '生態・進化発展', mode: GameMode.UPPER_SCIENCE_ECOLOGY_ADV },
      { id: 'UPPER_SCIENCE_GEO_WEATHER', name: '地質・気象発展', mode: GameMode.UPPER_SCIENCE_GEO_WEATHER },
      { id: 'UPPER_SCIENCE_ATOMIC_QUANTUM', name: '原子・量子', mode: GameMode.UPPER_SCIENCE_ATOMIC_QUANTUM },
      { id: 'UPPER_SCIENCE_MATERIALS', name: '材料科学', mode: GameMode.UPPER_SCIENCE_MATERIALS },
      { id: 'UPPER_SCIENCE_FOOD', name: '食品科学', mode: GameMode.UPPER_SCIENCE_FOOD },
      { id: 'UPPER_SCIENCE_OCEAN', name: '海洋科学', mode: GameMode.UPPER_SCIENCE_OCEAN },
      { id: 'UPPER_SCIENCE_DISASTER', name: '防災科学', mode: GameMode.UPPER_SCIENCE_DISASTER },
    ],
  },
  {
    id: 'UPPER_SOCIETY',
    name: '地歴・公民',
    color: 'amber',
    uiType: 'grid',
    subModes: [
      { id: 'UPPER_SOCIETY_JAPAN_HISTORY', name: '日本史基礎', mode: GameMode.UPPER_SOCIETY_JAPAN_HISTORY },
      { id: 'UPPER_SOCIETY_WORLD_HISTORY', name: '世界史基礎', mode: GameMode.UPPER_SOCIETY_WORLD_HISTORY },
      { id: 'UPPER_SOCIETY_GEOGRAPHY', name: '地理基礎', mode: GameMode.UPPER_SOCIETY_GEOGRAPHY },
      { id: 'UPPER_SOCIETY_CIVICS', name: '公民・政治経済', mode: GameMode.UPPER_SOCIETY_CIVICS },
      { id: 'UPPER_SOCIETY_MODERN_JAPAN', name: '近現代日本史', mode: GameMode.UPPER_SOCIETY_MODERN_JAPAN },
      { id: 'UPPER_SOCIETY_MODERN_WORLD', name: '近現代世界史', mode: GameMode.UPPER_SOCIETY_MODERN_WORLD },
      { id: 'UPPER_SOCIETY_GIS_MAP', name: '地図・GIS', mode: GameMode.UPPER_SOCIETY_GIS_MAP },
      { id: 'UPPER_SOCIETY_ETHICS_PUBLIC', name: '倫理・公共', mode: GameMode.UPPER_SOCIETY_ETHICS_PUBLIC },
      { id: 'UPPER_SOCIETY_LAW_RIGHTS', name: '法と人権', mode: GameMode.UPPER_SOCIETY_LAW_RIGHTS },
      { id: 'UPPER_SOCIETY_ECONOMICS_ADV', name: '経済発展', mode: GameMode.UPPER_SOCIETY_ECONOMICS_ADV },
      { id: 'UPPER_SOCIETY_INTL_RELATIONS', name: '国際関係', mode: GameMode.UPPER_SOCIETY_INTL_RELATIONS },
      { id: 'UPPER_SOCIETY_REGIONAL_STUDIES', name: '地域研究', mode: GameMode.UPPER_SOCIETY_REGIONAL_STUDIES },
      { id: 'UPPER_SOCIETY_CURRENT_AFFAIRS', name: '現代社会課題', mode: GameMode.UPPER_SOCIETY_CURRENT_AFFAIRS },
      { id: 'UPPER_SOCIETY_ANCIENT_WORLD', name: '古代文明', mode: GameMode.UPPER_SOCIETY_ANCIENT_WORLD },
      { id: 'UPPER_SOCIETY_MEDIEVAL_WORLD', name: '中世世界', mode: GameMode.UPPER_SOCIETY_MEDIEVAL_WORLD },
      { id: 'UPPER_SOCIETY_CULTURE_HISTORY', name: '文化史', mode: GameMode.UPPER_SOCIETY_CULTURE_HISTORY },
      { id: 'UPPER_SOCIETY_POLITICAL_THOUGHT', name: '政治思想', mode: GameMode.UPPER_SOCIETY_POLITICAL_THOUGHT },
      { id: 'UPPER_SOCIETY_JAPAN_GEOGRAPHY', name: '日本地理', mode: GameMode.UPPER_SOCIETY_JAPAN_GEOGRAPHY },
      { id: 'UPPER_SOCIETY_WORLD_GEO_ADV', name: '世界地理発展', mode: GameMode.UPPER_SOCIETY_WORLD_GEO_ADV },
      { id: 'UPPER_SOCIETY_JAPAN_POLITICS', name: '日本政治', mode: GameMode.UPPER_SOCIETY_JAPAN_POLITICS },
      { id: 'UPPER_SOCIETY_LOCAL_GOV', name: '地方自治', mode: GameMode.UPPER_SOCIETY_LOCAL_GOV },
      { id: 'UPPER_SOCIETY_MEDIA_SOCIAL', name: 'メディア社会', mode: GameMode.UPPER_SOCIETY_MEDIA_SOCIAL },
      { id: 'UPPER_SOCIETY_ENV_POLICY', name: '環境政策', mode: GameMode.UPPER_SOCIETY_ENV_POLICY },
    ],
  },
  {
    id: 'UPPER_ESSAY',
    name: '小論文・探究',
    color: 'indigo',
    uiType: 'grid',
    subModes: [
      { id: 'UPPER_ESSAY_VOCAB', name: '小論文語彙', mode: GameMode.UPPER_ESSAY_VOCAB },
      { id: 'UPPER_ESSAY_LOGIC', name: '論点整理', mode: GameMode.UPPER_ESSAY_LOGIC },
      { id: 'UPPER_ESSAY_DATA_READING', name: '資料読解', mode: GameMode.UPPER_ESSAY_DATA_READING },
      { id: 'UPPER_ESSAY_RESEARCH', name: '探究・研究法', mode: GameMode.UPPER_ESSAY_RESEARCH },
      { id: 'UPPER_ESSAY_ISSUE_FINDING', name: '課題発見', mode: GameMode.UPPER_ESSAY_ISSUE_FINDING },
      { id: 'UPPER_ESSAY_DATA_ANALYSIS', name: 'データ分析', mode: GameMode.UPPER_ESSAY_DATA_ANALYSIS },
      { id: 'UPPER_ESSAY_PRESENTATION', name: 'プレゼン・発表', mode: GameMode.UPPER_ESSAY_PRESENTATION },
      { id: 'UPPER_ESSAY_REPORT_WRITING', name: 'レポート作法', mode: GameMode.UPPER_ESSAY_REPORT_WRITING },
      { id: 'UPPER_ESSAY_DEBATE', name: 'ディベート', mode: GameMode.UPPER_ESSAY_DEBATE },
      { id: 'UPPER_ESSAY_DESIGN_THINKING', name: 'デザイン思考', mode: GameMode.UPPER_ESSAY_DESIGN_THINKING },
      { id: 'UPPER_ESSAY_MEDIA_LITERACY', name: 'メディア読解', mode: GameMode.UPPER_ESSAY_MEDIA_LITERACY },
      { id: 'UPPER_ESSAY_ACADEMIC_WORDS', name: '学術語彙', mode: GameMode.UPPER_ESSAY_ACADEMIC_WORDS },
      { id: 'UPPER_ESSAY_INTERVIEW_FIELD', name: '聞き取り調査', mode: GameMode.UPPER_ESSAY_INTERVIEW_FIELD },
      { id: 'UPPER_ESSAY_CREATIVE_WRITING', name: '表現技法', mode: GameMode.UPPER_ESSAY_CREATIVE_WRITING },
      { id: 'UPPER_ESSAY_POLICY_PROPOSAL', name: '政策提案', mode: GameMode.UPPER_ESSAY_POLICY_PROPOSAL },
      { id: 'UPPER_ESSAY_SOURCE_CRITIQUE', name: '資料批判', mode: GameMode.UPPER_ESSAY_SOURCE_CRITIQUE },
      { id: 'UPPER_ESSAY_CAREER_ADMISSION', name: '志望理由・面接', mode: GameMode.UPPER_ESSAY_CAREER_ADMISSION },
      { id: 'UPPER_ESSAY_STATEMENT_LOGIC', name: '文章論理', mode: GameMode.UPPER_ESSAY_STATEMENT_LOGIC },
      { id: 'UPPER_ESSAY_LOGIC_PUZZLE', name: '論理パズル', mode: GameMode.UPPER_ESSAY_LOGIC_PUZZLE },
      { id: 'UPPER_ESSAY_BOOK_READING', name: '課題図書読解', mode: GameMode.UPPER_ESSAY_BOOK_READING },
      { id: 'UPPER_ESSAY_SUMMARY', name: '要約トレーニング', mode: GameMode.UPPER_ESSAY_SUMMARY },
      { id: 'UPPER_ESSAY_COMPARATIVE_CULTURE', name: '比較文化論', mode: GameMode.UPPER_ESSAY_COMPARATIVE_CULTURE },
      { id: 'UPPER_ESSAY_PROJECT_MANAGEMENT', name: 'プロジェクト管理', mode: GameMode.UPPER_ESSAY_PROJECT_MANAGEMENT },
    ],
  },
  {
    id: 'UPPER_PRACTICAL',
    name: '生活実用',
    color: 'rose',
    uiType: 'grid',
    subModes: [
      { id: 'UPPER_PRACTICAL_MONEY', name: 'お金・金融', mode: GameMode.UPPER_PRACTICAL_MONEY },
      { id: 'UPPER_PRACTICAL_LAW', name: '法律・契約', mode: GameMode.UPPER_PRACTICAL_LAW },
      { id: 'UPPER_PRACTICAL_HEALTH', name: '健康・医療リテラシー', mode: GameMode.UPPER_PRACTICAL_HEALTH },
      { id: 'UPPER_PRACTICAL_SAFETY', name: '防災・安全', mode: GameMode.UPPER_PRACTICAL_SAFETY },
      { id: 'UPPER_PRACTICAL_TAX_SOCIAL', name: '税金・社会保険', mode: GameMode.UPPER_PRACTICAL_TAX_SOCIAL },
      { id: 'UPPER_PRACTICAL_WORK_CAREER', name: '労働・進路', mode: GameMode.UPPER_PRACTICAL_WORK_CAREER },
      { id: 'UPPER_PRACTICAL_HOUSING_CONTRACT', name: '住まい・契約', mode: GameMode.UPPER_PRACTICAL_HOUSING_CONTRACT },
      { id: 'UPPER_PRACTICAL_NET_SAFETY', name: 'ネット生活安全', mode: GameMode.UPPER_PRACTICAL_NET_SAFETY },
      { id: 'UPPER_PRACTICAL_COOK_NUTRITION', name: '料理・栄養', mode: GameMode.UPPER_PRACTICAL_COOK_NUTRITION },
      { id: 'UPPER_PRACTICAL_COMMUNICATION', name: 'コミュニケーション', mode: GameMode.UPPER_PRACTICAL_COMMUNICATION },
      { id: 'UPPER_PRACTICAL_DIGITAL_PRODUCTIVITY', name: 'デジタル効率化', mode: GameMode.UPPER_PRACTICAL_DIGITAL_PRODUCTIVITY },
      { id: 'UPPER_PRACTICAL_CHILD_WELFARE', name: '福祉・子育て', mode: GameMode.UPPER_PRACTICAL_CHILD_WELFARE },
      { id: 'UPPER_PRACTICAL_ENTREPRENEURSHIP', name: '起業・企画', mode: GameMode.UPPER_PRACTICAL_ENTREPRENEURSHIP },
      { id: 'UPPER_PRACTICAL_TIME_MANAGEMENT', name: '時間管理', mode: GameMode.UPPER_PRACTICAL_TIME_MANAGEMENT },
      { id: 'UPPER_PRACTICAL_EMERGENCY_FIRSTAID', name: '応急手当', mode: GameMode.UPPER_PRACTICAL_EMERGENCY_FIRSTAID },
      { id: 'UPPER_PRACTICAL_CONSUMER_TROUBLE', name: '消費者トラブル', mode: GameMode.UPPER_PRACTICAL_CONSUMER_TROUBLE },
      { id: 'UPPER_PRACTICAL_PUBLIC_SERVICES', name: '公共サービス', mode: GameMode.UPPER_PRACTICAL_PUBLIC_SERVICES },
      { id: 'UPPER_PRACTICAL_RELATIONSHIP', name: '人間関係・メンタル', mode: GameMode.UPPER_PRACTICAL_RELATIONSHIP },
      { id: 'UPPER_PRACTICAL_BUDGET_ADV', name: '家計管理発展', mode: GameMode.UPPER_PRACTICAL_BUDGET_ADV },
      { id: 'UPPER_PRACTICAL_INVESTMENT', name: '投資リテラシー', mode: GameMode.UPPER_PRACTICAL_INVESTMENT },
      { id: 'UPPER_PRACTICAL_TRAVEL_TRANSPORT', name: '交通・旅行', mode: GameMode.UPPER_PRACTICAL_TRAVEL_TRANSPORT },
      { id: 'UPPER_PRACTICAL_CEREMONY_MANNERS', name: '冠婚葬祭マナー', mode: GameMode.UPPER_PRACTICAL_CEREMONY_MANNERS },
      { id: 'UPPER_PRACTICAL_CARE_NURSING', name: '介護・看護入門', mode: GameMode.UPPER_PRACTICAL_CARE_NURSING },
    ],
  },
];

const KOKUGO_GRADE_UNITS: Record<number, MathUnitOption[]> = {
  1: [
    { id: 'J1_U01', name: 'ひらがな', mode: 'KOKUGO_G1_U01' },
    { id: 'J1_U02', name: 'ことばあつめ', mode: 'KOKUGO_G1_U02' },
    { id: 'J1_U03', name: 'のばすおん（ー）', mode: 'KOKUGO_G1_U03' },
    { id: 'J1_U04', name: 'ちいさい「っ」', mode: 'KOKUGO_G1_U04' },
    { id: 'J1_U05', name: '「は・を・へ」のつかいかた', mode: 'KOKUGO_G1_U05' },
    { id: 'J1_U06', name: 'かたかな', mode: 'KOKUGO_G1_U06' },
    { id: 'J1_U07', name: 'おはなしをよむ', mode: 'KOKUGO_G1_U07' },
    { id: 'J1_U08', name: 'せつめいぶんをよむ', mode: 'KOKUGO_G1_U08' },
    { id: 'J1_U09', name: 'ばめんをそうぞうしてよむ', mode: 'KOKUGO_G1_U09' },
    { id: 'J1_U10', name: 'たいせつなところをみつけてよむ', mode: 'KOKUGO_G1_U10' },
    { id: 'J1_U11', name: 'ぶんをかく', mode: 'KOKUGO_G1_U11' },
    { id: 'J1_U12', name: 'かんたんなにっき', mode: 'KOKUGO_G1_U12' },
    { id: 'J1_U13', name: 'おはなしをつくる', mode: 'KOKUGO_G1_U13' },
    { id: 'J1_U14', name: 'はなしをきく', mode: 'KOKUGO_G1_U14' },
    { id: 'J1_U15', name: 'じぶんのことをはなす', mode: 'KOKUGO_G1_U15' },
    { id: 'J1_U16', name: 'みんなのまえではなす', mode: 'KOKUGO_G1_U16' },
  ],
  2: [
    { id: 'J2_U01', name: 'かたかなのことば', mode: 'KOKUGO_G2_U01' },
    { id: 'J2_U02', name: '主語 と 述語', mode: 'KOKUGO_G2_U02' },
    { id: 'J2_U03', name: '文のきまり', mode: 'KOKUGO_G2_U03' },
    { id: 'J2_U04', name: '日記を書く', mode: 'KOKUGO_G2_U04' },
    { id: 'J2_U05', name: 'せつめい文を読む', mode: 'KOKUGO_G2_U05' },
    { id: 'J2_U06', name: '物語を読む', mode: 'KOKUGO_G2_U06' },
    { id: 'J2_U07', name: '大事なことを見つける', mode: 'KOKUGO_G2_U07' },
    { id: 'J2_U08', name: '手紙を書く', mode: 'KOKUGO_G2_U08' },
    { id: 'J2_U09', name: '作文を書く', mode: 'KOKUGO_G2_U09' },
    { id: 'J2_U10', name: '話を聞く', mode: 'KOKUGO_G2_U10' },
    { id: 'J2_U11', name: '順序よく話す', mode: 'KOKUGO_G2_U11' },
  ],
  3: [
    { id: 'J3_U01', name: '漢字の読み書き', mode: 'KOKUGO_G3_U01' },
    { id: 'J3_U02', name: '国語辞典の使い方', mode: 'KOKUGO_G3_U02' },
    { id: 'J3_U03', name: '段落', mode: 'KOKUGO_G3_U03' },
    { id: 'J3_U04', name: '物語文の読み取り', mode: 'KOKUGO_G3_U04' },
    { id: 'J3_U05', name: '説明文の読み取り', mode: 'KOKUGO_G3_U05' },
    { id: 'J3_U06', name: '要点をまとめる', mode: 'KOKUGO_G3_U06' },
    { id: 'J3_U07', name: '日記・作文', mode: 'KOKUGO_G3_U07' },
    { id: 'J3_U08', name: '手紙の書き方', mode: 'KOKUGO_G3_U08' },
    { id: 'J3_U09', name: '話し合い', mode: 'KOKUGO_G3_U09' },
  ],
  4: [
    { id: 'J4_U01', name: '漢字の使い方', mode: 'KOKUGO_G4_U01' },
    { id: 'J4_U02', name: '熟語', mode: 'KOKUGO_G4_U02' },
    { id: 'J4_U03', name: '国語辞典・漢字辞典', mode: 'KOKUGO_G4_U03' },
    { id: 'J4_U04', name: '段落と要旨', mode: 'KOKUGO_G4_U04' },
    { id: 'J4_U05', name: '物語文の読み取り', mode: 'KOKUGO_G4_U05' },
    { id: 'J4_U06', name: '説明文の読み取り', mode: 'KOKUGO_G4_U06' },
    { id: 'J4_U07', name: '要約', mode: 'KOKUGO_G4_U07' },
    { id: 'J4_U08', name: '意見文を書く', mode: 'KOKUGO_G4_U08' },
    { id: 'J4_U09', name: '話し合いと発表', mode: 'KOKUGO_G4_U09' },
  ],
  5: [
    { id: 'J5_U01', name: '漢字の意味と使い分け', mode: 'KOKUGO_G5_U01' },
    { id: 'J5_U02', name: '敬語', mode: 'KOKUGO_G5_U02' },
    { id: 'J5_U03', name: '物語文の読み取り', mode: 'KOKUGO_G5_U03' },
    { id: 'J5_U04', name: '説明文の読み取り', mode: 'KOKUGO_G5_U04' },
    { id: 'J5_U05', name: '要約と要旨', mode: 'KOKUGO_G5_U05' },
    { id: 'J5_U06', name: '意見文を書く', mode: 'KOKUGO_G5_U06' },
    { id: 'J5_U07', name: '報告文を書く', mode: 'KOKUGO_G5_U07' },
    { id: 'J5_U08', name: '討論', mode: 'KOKUGO_G5_U08' },
    { id: 'J5_U09', name: 'スピーチ', mode: 'KOKUGO_G5_U09' },
  ],
  6: [
    { id: 'J6_U01', name: '漢字のまとめ', mode: 'KOKUGO_G6_U01' },
    { id: 'J6_U02', name: '熟語と語句', mode: 'KOKUGO_G6_U02' },
    { id: 'J6_U03', name: '物語文の読み取り', mode: 'KOKUGO_G6_U03' },
    { id: 'J6_U04', name: '説明文の読み取り', mode: 'KOKUGO_G6_U04' },
    { id: 'J6_U05', name: '要旨と要約', mode: 'KOKUGO_G6_U05' },
    { id: 'J6_U06', name: '意見文を書く', mode: 'KOKUGO_G6_U06' },
    { id: 'J6_U07', name: '提案文を書く', mode: 'KOKUGO_G6_U07' },
    { id: 'J6_U08', name: '討論', mode: 'KOKUGO_G6_U08' },
    { id: 'J6_U09', name: 'スピーチ', mode: 'KOKUGO_G6_U09' },
    { id: 'J6_U10', name: '卒業文集', mode: 'KOKUGO_G6_U10' },
  ],
  7: [
    { id: 'J7_U01', name: '物語文の読み取り', mode: 'KOKUGO_G7_U01' },
    { id: 'J7_U02', name: '説明文の読み取り', mode: 'KOKUGO_G7_U02' },
    { id: 'J7_U03', name: '詩の読み取り', mode: 'KOKUGO_G7_U03' },
    { id: 'J7_U04', name: '古典（古文の基礎）', mode: 'KOKUGO_G7_U04' },
    { id: 'J7_U05', name: '漢文の基礎', mode: 'KOKUGO_G7_U05' },
    { id: 'J7_U06', name: '文の成分（主語・述語など）', mode: 'KOKUGO_G7_U06' },
    { id: 'J7_U07', name: '品詞', mode: 'KOKUGO_G7_U07' },
    { id: 'J7_U08', name: '漢字の読み書き', mode: 'KOKUGO_G7_U08' },
    { id: 'J7_U09', name: '要約', mode: 'KOKUGO_G7_U09' },
    { id: 'J7_U10', name: '意見文', mode: 'KOKUGO_G7_U10' },
    { id: 'J7_U11', name: 'スピーチ', mode: 'KOKUGO_G7_U11' },
    { id: 'J7_U12', name: '話し合い', mode: 'KOKUGO_G7_U12' },
  ],
  8: [
    { id: 'J8_U01', name: '物語文の読み取り', mode: 'KOKUGO_G8_U01' },
    { id: 'J8_U02', name: '説明文の読み取り', mode: 'KOKUGO_G8_U02' },
    { id: 'J8_U03', name: '詩・短歌・俳句', mode: 'KOKUGO_G8_U03' },
    { id: 'J8_U04', name: '古文（物語・随筆）', mode: 'KOKUGO_G8_U04' },
    { id: 'J8_U05', name: '漢文（訓読・故事成語）', mode: 'KOKUGO_G8_U05' },
    { id: 'J8_U06', name: '文法（品詞・活用）', mode: 'KOKUGO_G8_U06' },
    { id: 'J8_U07', name: '漢字の読み書き', mode: 'KOKUGO_G8_U07' },
    { id: 'J8_U08', name: '要約', mode: 'KOKUGO_G8_U08' },
    { id: 'J8_U09', name: '意見文', mode: 'KOKUGO_G8_U09' },
    { id: 'J8_U10', name: '発表', mode: 'KOKUGO_G8_U10' },
    { id: 'J8_U11', name: '討論', mode: 'KOKUGO_G8_U11' },
  ],
  9: [
    { id: 'J9_U01', name: '物語文の読み取り', mode: 'KOKUGO_G9_U01' },
    { id: 'J9_U02', name: '説明文の読み取り', mode: 'KOKUGO_G9_U02' },
    { id: 'J9_U03', name: '詩・短歌・俳句', mode: 'KOKUGO_G9_U03' },
    { id: 'J9_U04', name: '古文（古典文学）', mode: 'KOKUGO_G9_U04' },
    { id: 'J9_U05', name: '漢文（名文・思想）', mode: 'KOKUGO_G9_U05' },
    { id: 'J9_U06', name: '文法（文の構造）', mode: 'KOKUGO_G9_U06' },
    { id: 'J9_U07', name: '漢字の読み書き', mode: 'KOKUGO_G9_U07' },
    { id: 'J9_U08', name: '要約', mode: 'KOKUGO_G9_U08' },
    { id: 'J9_U09', name: '論説文を書く', mode: 'KOKUGO_G9_U09' },
    { id: 'J9_U10', name: 'スピーチ', mode: 'KOKUGO_G9_U10' },
    { id: 'J9_U11', name: '討論', mode: 'KOKUGO_G9_U11' },
    { id: 'J9_U12', name: '卒業論文・発表', mode: 'KOKUGO_G9_U12' },
  ],
};

const MATH_GRADE_UNITS: Record<number, MathUnitOption[]> = {
  1: [
    { id: 'G1_U01', name: 'かずとすうじ（10までの かず）', mode: 'MATH_G1_U01' },
    { id: 'G1_U02', name: 'いくつといくつ', mode: 'MATH_G1_U02' },
    { id: 'G1_U03', name: 'かたちあそび', mode: 'MATH_G1_U03' },
    { id: 'G1_U04', name: 'なんばんめ', mode: 'MATH_G1_U04' },
    { id: 'G1_U05', name: 'あわせていくつ（たしざん）', mode: 'MATH_G1_U05' },
    { id: 'G1_U06', name: 'ふえるといくつ（たしざん）', mode: 'MATH_G1_U06' },
    { id: 'G1_U07', name: 'のこりはいくつ（ひきざん）', mode: 'MATH_G1_U07' },
    { id: 'G1_U08', name: 'ちがいはいくつ（ひきざん）', mode: 'MATH_G1_U08' },
    { id: 'G1_U09', name: '20までのかず', mode: 'MATH_G1_U09' },
    { id: 'G1_U10', name: 'なんじ（とけい）', mode: 'MATH_G1_U10' },
    { id: 'G1_U11', name: 'ながさくらべ', mode: 'MATH_G1_U11' },
    { id: 'G1_U12', name: 'かさくらべ', mode: 'MATH_G1_U12' },
    { id: 'G1_U13', name: 'えぐらふ', mode: 'MATH_G1_U13' },
    { id: 'G1_U14', name: 'ひょう', mode: 'MATH_G1_U14' },
    { id: 'G1_U15', name: 'さんかくとしかく', mode: 'MATH_G1_U15' },
    { id: 'G1_U16', name: 'かたちづくり', mode: 'MATH_G1_U16' },
    { id: 'G1_U17', name: '3つのかずのけいさん', mode: 'MATH_G1_U17' },
    { id: 'G1_U18', name: 'ぶんしょうだい', mode: 'MATH_G1_U18' },
  ],
  2: [
    { id: 'G2_U01', name: '表 と グラフ', mode: 'MATH_G2_U01' },
    { id: 'G2_U02', name: 'たし算（2けた＋2けた）', mode: 'MATH_G2_U02' },
    { id: 'G2_U03', name: 'ひき算（2けた−2けた）', mode: 'MATH_G2_U03' },
    { id: 'G2_U04', name: '長さ（ものさし）', mode: 'MATH_G2_U04' },
    { id: 'G2_U05', name: '100までの 数', mode: 'MATH_G2_U05' },
    { id: 'G2_U06', name: 'かさ（リットル・デシリットル）', mode: 'MATH_G2_U06' },
    { id: 'G2_U07', name: '時こく と 時かん', mode: 'MATH_G2_U07' },
    { id: 'G2_U08', name: '3けたの 数', mode: 'MATH_G2_U08' },
    { id: 'G2_U09', name: 'かけ算（かけ算のいみ）', mode: 'MATH_G2_U09' },
    { id: 'G2_U10', name: 'かけ算（九九）', mode: 'MATH_G2_U10' },
    { id: 'G2_U11', name: 'はこの 形', mode: 'MATH_G2_U11' },
    { id: 'G2_U12', name: 'ぶんしょうだい', mode: 'MATH_G2_U12' },
  ],
  3: [
    { id: 'G3_U01', name: '表 と グラフ', mode: 'MATH_G3_U01' },
    { id: 'G3_U02', name: '大きい 数（1000より大きい数）', mode: 'MATH_G3_U02' },
    { id: 'G3_U03', name: 'たし算（3けた・4けた）', mode: 'MATH_G3_U03' },
    { id: 'G3_U04', name: 'ひき算（3けた・4けた）', mode: 'MATH_G3_U04' },
    { id: 'G3_U05', name: '時こく と 時かん', mode: 'MATH_G3_U05' },
    { id: 'G3_U06', name: '長さ（km と m）', mode: 'MATH_G3_U06' },
    { id: 'G3_U07', name: 'かけ算（2けた×1けた など）', mode: 'MATH_G3_U07' },
    { id: 'G3_U08', name: '円 と きゅう', mode: 'MATH_G3_U08' },
    { id: 'G3_U09', name: 'わり算（わり算のいみ）', mode: 'MATH_G3_U09' },
    { id: 'G3_U10', name: 'わり算（あまりのある計算）', mode: 'MATH_G3_U10' },
    { id: 'G3_U11', name: '重さ（g と kg）', mode: 'MATH_G3_U11' },
    { id: 'G3_U12', name: '小数', mode: 'MATH_G3_U12' },
    { id: 'G3_U13', name: '分数', mode: 'MATH_G3_U13' },
    { id: 'G3_U14', name: '□をつかった 式', mode: 'MATH_G3_U14' },
  ],
  4: [
    { id: 'G4_U01', name: '大きい 数（1おくまでの数）', mode: 'MATH_G4_U01' },
    { id: 'G4_U02', name: 'わり算（2けたでわる計算）', mode: 'MATH_G4_U02' },
    { id: 'G4_U03', name: '折れ線グラフ', mode: 'MATH_G4_U03' },
    { id: 'G4_U04', name: '角', mode: 'MATH_G4_U04' },
    { id: 'G4_U05', name: 'そろばん', mode: 'MATH_G4_U05' },
    { id: 'G4_U06', name: '小数', mode: 'MATH_G4_U06' },
    { id: 'G4_U07', name: '小数の たし算 と ひき算', mode: 'MATH_G4_U07' },
    { id: 'G4_U08', name: '面せき', mode: 'MATH_G4_U08' },
    { id: 'G4_U09', name: 'がい数', mode: 'MATH_G4_U09' },
    { id: 'G4_U10', name: '式 と 計算の じゅんじょ', mode: 'MATH_G4_U10' },
    { id: 'G4_U11', name: '分数', mode: 'MATH_G4_U11' },
    { id: 'G4_U12', name: '分数の たし算 と ひき算', mode: 'MATH_G4_U12' },
    { id: 'G4_U13', name: '直方体 と 立方体', mode: 'MATH_G4_U13' },
    { id: 'G4_U14', name: '変わり方', mode: 'MATH_G4_U14' },
    { id: 'G4_U15', name: '調べたことを 表 や グラフ にまとめる', mode: 'MATH_G4_U15' },
  ],
  5: [
    { id: 'G5_U01', name: '整数 と 小数', mode: 'MATH_G5_U01' },
    { id: 'G5_U02', name: '体積', mode: 'MATH_G5_U02' },
    { id: 'G5_U03', name: '小数の かけ算', mode: 'MATH_G5_U03' },
    { id: 'G5_U04', name: '小数の わり算', mode: 'MATH_G5_U04' },
    { id: 'G5_U05', name: '合同な 図形', mode: 'MATH_G5_U05' },
    { id: 'G5_U06', name: '分数 と 小数・整数', mode: 'MATH_G5_U06' },
    { id: 'G5_U07', name: '分数の たし算 と ひき算', mode: 'MATH_G5_U07' },
    { id: 'G5_U08', name: '平均', mode: 'MATH_G5_U08' },
    { id: 'G5_U09', name: '単位量あたりの 大きさ', mode: 'MATH_G5_U09' },
    { id: 'G5_U10', name: '速さ', mode: 'MATH_G5_U10' },
    { id: 'G5_U11', name: '比例', mode: 'MATH_G5_U11' },
    { id: 'G5_U12', name: '円 と 正多角形', mode: 'MATH_G5_U12' },
    { id: 'G5_U13', name: '角柱 と 円柱', mode: 'MATH_G5_U13' },
    { id: 'G5_U14', name: '割合', mode: 'MATH_G5_U14' },
    { id: 'G5_U15', name: '帯グラフ と 円グラフ', mode: 'MATH_G5_U15' },
  ],
  6: [
    { id: 'G6_U01', name: '対称な 図形', mode: 'MATH_G6_U01' },
    { id: 'G6_U02', name: '文字 と 式', mode: 'MATH_G6_U02' },
    { id: 'G6_U03', name: '分数の かけ算', mode: 'MATH_G6_U03' },
    { id: 'G6_U04', name: '分数の わり算', mode: 'MATH_G6_U04' },
    { id: 'G6_U05', name: '比 と その 利用', mode: 'MATH_G6_U05' },
    { id: 'G6_U06', name: '比例 と 反比例', mode: 'MATH_G6_U06' },
    { id: 'G6_U07', name: '拡大図 と 縮図', mode: 'MATH_G6_U07' },
    { id: 'G6_U08', name: '円の 面積', mode: 'MATH_G6_U08' },
    { id: 'G6_U09', name: '角柱 と 円柱の 体積', mode: 'MATH_G6_U09' },
    { id: 'G6_U10', name: 'およその 面積 と 体積', mode: 'MATH_G6_U10' },
    { id: 'G6_U11', name: '場合の 数', mode: 'MATH_G6_U11' },
    { id: 'G6_U12', name: '資料の 調べ方', mode: 'MATH_G6_U12' },
    { id: 'G6_U13', name: '算数の まとめ', mode: 'MATH_G6_U13' },
  ],
  7: [
    { id: 'G7_U01', name: '正の数 と 負の数', mode: 'MATH_G7_U01' },
    { id: 'G7_U02', name: '正負の数の 加法 と 減法', mode: 'MATH_G7_U02' },
    { id: 'G7_U03', name: '正負の数の 乗法 と 除法', mode: 'MATH_G7_U03' },
    { id: 'G7_U04', name: '文字式', mode: 'MATH_G7_U04' },
    { id: 'G7_U05', name: '文字式の 計算', mode: 'MATH_G7_U05' },
    { id: 'G7_U06', name: '一次方程式', mode: 'MATH_G7_U06' },
    { id: 'G7_U07', name: '一次方程式の 利用', mode: 'MATH_G7_U07' },
    { id: 'G7_U08', name: '比例 と 反比例', mode: 'MATH_G7_U08' },
    { id: 'G7_U09', name: '平面図形', mode: 'MATH_G7_U09' },
    { id: 'G7_U10', name: '空間図形', mode: 'MATH_G7_U10' },
    { id: 'G7_U11', name: '資料の 整理 と 活用', mode: 'MATH_G7_U11' },
  ],
  8: [
    { id: 'G8_U01', name: '式の計算', mode: 'MATH_G8_U01' },
    { id: 'G8_U02', name: '連立方程式', mode: 'MATH_G8_U02' },
    { id: 'G8_U03', name: '連立方程式の 利用', mode: 'MATH_G8_U03' },
    { id: 'G8_U04', name: '一次関数', mode: 'MATH_G8_U04' },
    { id: 'G8_U05', name: '図形の 性質', mode: 'MATH_G8_U05' },
    { id: 'G8_U06', name: '図形の 合同', mode: 'MATH_G8_U06' },
    { id: 'G8_U07', name: '三角形 と 四角形', mode: 'MATH_G8_U07' },
    { id: 'G8_U08', name: '確率', mode: 'MATH_G8_U08' },
    { id: 'G8_U09', name: 'データの 分析', mode: 'MATH_G8_U09' },
  ],
  9: [
    { id: 'G9_U01', name: '式の 展開 と 因数分解', mode: 'MATH_G9_U01' },
    { id: 'G9_U02', name: '平方根', mode: 'MATH_G9_U02' },
    { id: 'G9_U03', name: '二次方程式', mode: 'MATH_G9_U03' },
    { id: 'G9_U04', name: '二次方程式の 利用', mode: 'MATH_G9_U04' },
    { id: 'G9_U05', name: '関数 y=ax²', mode: 'MATH_G9_U05' },
    { id: 'G9_U06', name: '相似な 図形', mode: 'MATH_G9_U06' },
    { id: 'G9_U07', name: '三平方の 定理', mode: 'MATH_G9_U07' },
    { id: 'G9_U08', name: '円の 性質', mode: 'MATH_G9_U08' },
    { id: 'G9_U09', name: '標本調査', mode: 'MATH_G9_U09' },
  ],
};

const CATEGORY_LABELS: Record<SubjectCategoryType, string> = {
  MATH: '計算',
  MATH_GRADES: '算数・数学',
  KOKUGO_GRADES: '国語',
  KANJI: '漢字',
  KANKEN: '漢検',
  HARD_KANJI: '難読漢字',
  LIFE: '生活',
  SCIENCE: '理科',
  SOCIAL: '社会',
  ENGLISH: '英語',
  SUMMARY: 'まとめ',
  MAP_PREF: '地図・日本',
  IT_INFO: 'ICT・情報',
  UPPER_MODERN: '現代文・語彙',
  UPPER_CLASSICS: '古典',
  UPPER_ENGLISH: '英語',
  UPPER_INFORMATION: '情報',
  UPPER_TRIVIA: '雑学',
  UPPER_MATH: '数学',
  UPPER_SCIENCE: '理科',
  UPPER_SOCIETY: '地歴・公民',
  UPPER_ESSAY: '小論文・探究',
  UPPER_PRACTICAL: '生活実用',
};

const SUBMODE_LABELS: Record<string, string> = {
  ADD_1DIGIT: '1けたのたし算',
  ADD_1DIGIT_CARRY: 'たし算（くりあがり）',
  SUB_1DIGIT: '1けたのひき算',
  SUB_1DIGIT_BORROW: 'ひき算（くりさがり）',
  ADDITION: '2けたのたし算',
  SUBTRACTION: '2けたのひき算',
  MULTIPLICATION: 'かけ算',
  DIVISION: 'わり算',
  MIXED: 'ミックス',
  K1: '小1漢字',
  K2: '小2漢字',
  K3: '小3漢字',
  K4: '小4漢字',
  K5: '小5漢字',
  K6: '小6漢字',
  K7: '中1漢字',
  K8: '中2漢字',
  K9: '中3漢字',
  K10: '高校基礎',
  K11: '高校標準',
  K12: '高校発展',
  K_MIXED: 'ミックス',
  KK10: '漢検10級',
  KK9: '漢検9級',
  KK8: '漢検8級',
  KK7: '漢検7級',
  KK6: '漢検6級',
  KK5: '漢検5級',
  KK4: '漢検4級',
  KK3: '漢検3級',
  KK_PRE2: '漢検準2級',
  KK2: '漢検2級',
  KK_PRE1: '漢検準1級',
  KK1: '漢検1級',
  KK_MIXED: 'ミックス',
  HK_JUKUJIKUN: '超難読 熟字訓',
  HK_FLORA: '動植物 極',
  HK_ATEJI: '当て字・外来語 極',
  HK_PLACE: '地名・国名 難読',
  HK_KOKUJI: '国字・和製漢字',
  HK_CLASSICS: '仏教・神道・古典語',
  HK_YOJI: '四字熟語 極',
  HK_HISTORY: '古典表記・歴史語彙',
  HK_MIXED: 'ミックス',
  E_ES: '小学校英語',
  E_J1: '中1英語',
  E_J2: '中2英語',
  E_J3: '中3英語',
  E_MIXED: 'ミックス',
  C1: '会話 Lv1',
  C2: '会話 Lv2',
  C3: '会話 Lv3',
  C4: '会話 Lv4',
  C5: '会話 Lv5',
  MS: '地図記号',
  PF: '都道府県',
  PC: '県庁所在地',
  IT_WIN: 'Windows',
  IT_IPAD: 'iPad',
  IT_CHROME: 'Chromebook',
  IT_NET: 'スマホ・ネット',
  IT_LIT: '情報リテラシー',
  IT_PROG: 'プログラミング',
  IT_SEC: 'モラル・セキュリティ',
  UPPER_MODERN_VOCAB: '評論語彙・読解語',
  UPPER_CLASSICS: '古文・漢文基礎',
  UPPER_ENGLISH: '高校英語基礎',
  UPPER_INFORMATION: '情報I・ネット活用',
  UPPER_TRIVIA: '一般常識・科学雑学',
  UPPER_MATH_NUM_EXPR: '数と式',
  UPPER_MATH_QUADRATIC: '二次関数',
  UPPER_MATH_GEOMETRY: '図形と計量',
  UPPER_MATH_PROB_STATS: '確率・統計',
  UPPER_MATH_TRIGONOMETRY: '三角関数',
  UPPER_MATH_SEQUENCE: '数列',
  UPPER_MATH_VECTOR: 'ベクトル',
  UPPER_MATH_CALCULUS: '微分・積分基礎',
  UPPER_SCIENCE_PHYSICS: '物理基礎',
  UPPER_SCIENCE_CHEMISTRY: '化学基礎',
  UPPER_SCIENCE_BIOLOGY: '生物基礎',
  UPPER_SCIENCE_EARTH: '地学基礎',
  UPPER_SCIENCE_MECHANICS: '力学演習',
  UPPER_SCIENCE_ELECTROMAGNETISM: '電磁気',
  UPPER_SCIENCE_ORGANIC: '有機化学',
  UPPER_SCIENCE_GENETICS: '遺伝・進化',
  UPPER_SOCIETY_JAPAN_HISTORY: '日本史基礎',
  UPPER_SOCIETY_WORLD_HISTORY: '世界史基礎',
  UPPER_SOCIETY_GEOGRAPHY: '地理基礎',
  UPPER_SOCIETY_CIVICS: '公民・政治経済',
  UPPER_SOCIETY_MODERN_JAPAN: '近現代日本史',
  UPPER_SOCIETY_MODERN_WORLD: '近現代世界史',
  UPPER_SOCIETY_GIS_MAP: '地図・GIS',
  UPPER_SOCIETY_ETHICS_PUBLIC: '倫理・公共',
  UPPER_ESSAY_VOCAB: '小論文語彙',
  UPPER_ESSAY_LOGIC: '論点整理',
  UPPER_ESSAY_DATA_READING: '資料読解',
  UPPER_ESSAY_RESEARCH: '探究・研究法',
  UPPER_ESSAY_ISSUE_FINDING: '課題発見',
  UPPER_ESSAY_DATA_ANALYSIS: 'データ分析',
  UPPER_ESSAY_PRESENTATION: 'プレゼン・発表',
  UPPER_ESSAY_REPORT_WRITING: 'レポート作法',
  UPPER_PRACTICAL_MONEY: 'お金・金融',
  UPPER_PRACTICAL_LAW: '法律・契約',
  UPPER_PRACTICAL_HEALTH: '健康・医療リテラシー',
  UPPER_PRACTICAL_SAFETY: '防災・安全',
  UPPER_PRACTICAL_TAX_SOCIAL: '税金・社会保険',
  UPPER_PRACTICAL_WORK_CAREER: '労働・進路',
  UPPER_PRACTICAL_HOUSING_CONTRACT: '住まい・契約',
  UPPER_PRACTICAL_NET_SAFETY: 'ネット生活安全',
  UPPER_MATH_EXP_LOG: '指数・対数',
  UPPER_MATH_COMPLEX: '複素数平面',
  UPPER_MATH_ADV_PROB: '場合の数発展',
  UPPER_MATH_STAT_INFERENCE: '統計的推測',
  UPPER_MATH_MATH_HISTORY: '数学史・活用',
  UPPER_SCIENCE_ENVIRONMENT: '環境科学',
  UPPER_SCIENCE_ASTRONOMY: '天文・宇宙',
  UPPER_SCIENCE_LAB: '実験・探究',
  UPPER_SCIENCE_MEDICAL: '医療・生命科学',
  UPPER_SCIENCE_ENGINEERING: '科学技術',
  UPPER_SOCIETY_LAW_RIGHTS: '法と人権',
  UPPER_SOCIETY_ECONOMICS_ADV: '経済発展',
  UPPER_SOCIETY_INTL_RELATIONS: '国際関係',
  UPPER_SOCIETY_REGIONAL_STUDIES: '地域研究',
  UPPER_SOCIETY_CURRENT_AFFAIRS: '現代社会課題',
  UPPER_ESSAY_DEBATE: 'ディベート',
  UPPER_ESSAY_DESIGN_THINKING: 'デザイン思考',
  UPPER_ESSAY_MEDIA_LITERACY: 'メディア読解',
  UPPER_ESSAY_ACADEMIC_WORDS: '学術語彙',
  UPPER_ESSAY_INTERVIEW_FIELD: '聞き取り調査',
  UPPER_PRACTICAL_COOK_NUTRITION: '料理・栄養',
  UPPER_PRACTICAL_COMMUNICATION: 'コミュニケーション',
  UPPER_PRACTICAL_DIGITAL_PRODUCTIVITY: 'デジタル効率化',
  UPPER_PRACTICAL_CHILD_WELFARE: '福祉・子育て',
  UPPER_PRACTICAL_ENTREPRENEURSHIP: '起業・企画',
  UPPER_MATH_LINEAR_ALGEBRA: '線形代数入門',
  UPPER_MATH_ANALYTIC_GEOMETRY: '解析幾何',
  UPPER_MATH_OPTIMIZATION: '最適化',
  UPPER_MATH_DISCRETE: '離散数学',
  UPPER_MATH_FINANCE: '金融数学',
  UPPER_SCIENCE_THERMODYNAMICS: '熱とエネルギー',
  UPPER_SCIENCE_WAVES_OPTICS: '波動・光学',
  UPPER_SCIENCE_INORGANIC: '無機化学',
  UPPER_SCIENCE_ECOLOGY_ADV: '生態・進化発展',
  UPPER_SCIENCE_GEO_WEATHER: '地質・気象発展',
  UPPER_SOCIETY_ANCIENT_WORLD: '古代文明',
  UPPER_SOCIETY_MEDIEVAL_WORLD: '中世世界',
  UPPER_SOCIETY_CULTURE_HISTORY: '文化史',
  UPPER_SOCIETY_POLITICAL_THOUGHT: '政治思想',
  UPPER_SOCIETY_JAPAN_GEOGRAPHY: '日本地理',
  UPPER_ESSAY_CREATIVE_WRITING: '表現技法',
  UPPER_ESSAY_POLICY_PROPOSAL: '政策提案',
  UPPER_ESSAY_SOURCE_CRITIQUE: '資料批判',
  UPPER_ESSAY_CAREER_ADMISSION: '志望理由・面接',
  UPPER_ESSAY_STATEMENT_LOGIC: '文章論理',
  UPPER_PRACTICAL_TIME_MANAGEMENT: '時間管理',
  UPPER_PRACTICAL_EMERGENCY_FIRSTAID: '応急手当',
  UPPER_PRACTICAL_CONSUMER_TROUBLE: '消費者トラブル',
  UPPER_PRACTICAL_PUBLIC_SERVICES: '公共サービス',
  UPPER_PRACTICAL_RELATIONSHIP: '人間関係・メンタル',
  UPPER_MATH_DERIVATIVE_APP: '微分応用',
  UPPER_MATH_INTEGRAL_APP: '積分応用',
  UPPER_MATH_PROOF_ADV: '証明発展',
  UPPER_MATH_FUNCTION_MIX: '関数総合',
  UPPER_MATH_DATA_SCIENCE: 'データサイエンス基礎',
  UPPER_SCIENCE_ATOMIC_QUANTUM: '原子・量子',
  UPPER_SCIENCE_MATERIALS: '材料科学',
  UPPER_SCIENCE_FOOD: '食品科学',
  UPPER_SCIENCE_OCEAN: '海洋科学',
  UPPER_SCIENCE_DISASTER: '防災科学',
  UPPER_SOCIETY_WORLD_GEO_ADV: '世界地理発展',
  UPPER_SOCIETY_JAPAN_POLITICS: '日本政治',
  UPPER_SOCIETY_LOCAL_GOV: '地方自治',
  UPPER_SOCIETY_MEDIA_SOCIAL: 'メディア社会',
  UPPER_SOCIETY_ENV_POLICY: '環境政策',
  UPPER_ESSAY_LOGIC_PUZZLE: '論理パズル',
  UPPER_ESSAY_BOOK_READING: '課題図書読解',
  UPPER_ESSAY_SUMMARY: '要約トレーニング',
  UPPER_ESSAY_COMPARATIVE_CULTURE: '比較文化論',
  UPPER_ESSAY_PROJECT_MANAGEMENT: 'プロジェクト管理',
  UPPER_PRACTICAL_BUDGET_ADV: '家計管理発展',
  UPPER_PRACTICAL_INVESTMENT: '投資リテラシー',
  UPPER_PRACTICAL_TRAVEL_TRANSPORT: '交通・旅行',
  UPPER_PRACTICAL_CEREMONY_MANNERS: '冠婚葬祭マナー',
  UPPER_PRACTICAL_CARE_NURSING: '介護・看護入門',
};

const getCategoryIcon = (id: SubjectCategoryType) => {
  switch (id) {
    case 'MATH': return <Brain size={20} />;
    case 'KOKUGO_GRADES': return <Book size={20} />;
    case 'KANJI': return <Book size={20} />;
    case 'KANKEN': return <Book size={20} />;
    case 'HARD_KANJI': return <Book size={20} />;
    case 'ENGLISH': return <Languages size={20} />;
    case 'UPPER_ENGLISH': return <Languages size={20} />;
    case 'UPPER_MODERN': return <Book size={20} />;
    case 'UPPER_CLASSICS': return <Book size={20} />;
    case 'UPPER_INFORMATION': return <Brain size={20} />;
    case 'UPPER_TRIVIA': return <GraduationCap size={20} />;
    case 'UPPER_MATH': return <Brain size={20} />;
    case 'UPPER_SCIENCE': return <FlaskConical size={20} />;
    case 'UPPER_SOCIETY': return <Globe size={20} />;
    case 'UPPER_ESSAY': return <Book size={20} />;
    case 'UPPER_PRACTICAL': return <Home size={20} />;
    case 'LIFE': return <Home size={20} />;
    case 'SCIENCE': return <FlaskConical size={20} />;
    case 'SOCIAL': return <Globe size={20} />;
    case 'SUMMARY': return <GraduationCap size={20} />;
    case 'MAP_PREF': return <MapPin size={20} />;
    default: return <Home size={20} />;
  }
};

const getCategoryClasses = (color: string) => {
  switch (color) {
    case 'emerald': return { bg: 'bg-emerald-600', hover: 'hover:bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-900' };
    case 'cyan': return { bg: 'bg-cyan-600', hover: 'hover:bg-cyan-500', text: 'text-cyan-400', border: 'border-cyan-900' };
    case 'indigo': return { bg: 'bg-indigo-600', hover: 'hover:bg-indigo-500', text: 'text-indigo-400', border: 'border-indigo-900' };
    case 'amber': return { bg: 'bg-amber-600', hover: 'hover:bg-amber-500', text: 'text-amber-400', border: 'border-amber-900' };
    case 'orange': return { bg: 'bg-orange-600', hover: 'hover:bg-orange-500', text: 'text-orange-400', border: 'border-orange-900' };
    case 'rose': return { bg: 'bg-rose-600', hover: 'hover:bg-rose-500', text: 'text-rose-400', border: 'border-rose-900' };
    default: return { bg: 'bg-slate-600', hover: 'hover:bg-slate-500', text: 'text-slate-400', border: 'border-slate-900' };
  }
};

const getDisplayGradeLabel = (grade: number, languageMode: LanguageMode) =>
  languageMode === 'ENGLISH'
    ? (grade <= 6 ? `Grade ${grade}` : `JH ${grade - 6}`)
    : languageMode === 'JAPANESE'
      ? (grade <= 6 ? `${grade}年` : `中${grade - 6}`)
      : (grade <= 6 ? `${grade}ねん` : `ちゅう${grade - 6}`);

const getDisplayTermLabel = (term: number, languageMode: LanguageMode) =>
  languageMode === 'ENGLISH' ? `Term ${term}` : languageMode === 'JAPANESE' ? `${term}学期` : `${term}がっき`;

const getKanjiGradeMode = (grade: number): string => `KANJI_${grade}`;

const getGradeSummaryModes = (grade: number): string[] => {
  const modes = [
    ...(MATH_GRADE_UNITS[grade] || []).flatMap((unit) => unit.modes || (unit.mode ? [unit.mode] : [])),
    ...(KOKUGO_GRADE_UNITS[grade] || []).flatMap((unit) => unit.modes || (unit.mode ? [unit.mode] : [])),
    getKanjiGradeMode(grade),
    ...(ENGLISH_GRADE_UNITS[grade] || []).map((unit) => unit.mode),
    ...(SCIENCE_GRADE_UNITS[grade] || []).map((unit) => unit.mode),
    ...(SOCIAL_GRADE_UNITS[grade] || []).map((unit) => unit.mode),
  ];

  return Array.from(new Set(modes.filter(Boolean)));
};

const getGradeSummaryUnit = (grade: number): SelectableUnitOption => ({
  id: `GRADE_SUMMARY_${grade}`,
  name: '総まとめ（全教科+漢字）',
  modes: getGradeSummaryModes(grade),
});

const getCurrentUnitsForCategory = (categoryId: SubjectCategoryType, grade: number): SelectableUnitOption[] => {
  if (categoryId === 'SUMMARY') {
    const summaryUnit = getGradeSummaryUnit(grade);
    return summaryUnit.modes && summaryUnit.modes.length > 0 ? [summaryUnit] : [];
  }
  if (categoryId === 'ENGLISH') return (ENGLISH_GRADE_UNITS[grade] || []).map((unit) => ({ ...unit, modes: [unit.mode] }));
  if (categoryId === 'LIFE') return (SCIENCE_GRADE_UNITS[grade] || []).filter((unit) => unit.mode.startsWith('LIFE_')).map((unit) => ({ ...unit, modes: [unit.mode] }));
  if (categoryId === 'SCIENCE') return (SCIENCE_GRADE_UNITS[grade] || []).filter((unit) => unit.mode.startsWith('SCIENCE_')).map((unit) => ({ ...unit, modes: [unit.mode] }));
  if (categoryId === 'SOCIAL') return (SOCIAL_GRADE_UNITS[grade] || []).map((unit) => ({ ...unit, modes: [unit.mode] }));
  if (categoryId === 'KOKUGO_GRADES') return (KOKUGO_GRADE_UNITS[grade] || []).map((unit) => ({ ...unit, modes: unit.modes || (unit.mode ? [unit.mode] : []) }));
  if (categoryId === 'MATH_GRADES') return (MATH_GRADE_UNITS[grade] || []).map((unit) => ({ ...unit, modes: unit.modes || (unit.mode ? [unit.mode] : []) }));
  return [];
};

const getAllSelectableUnits = (): SelectableUnitOption[] => [
  ...Array.from({ length: 9 }, (_, index) => getGradeSummaryUnit(index + 1)),
  ...Object.values(ENGLISH_GRADE_UNITS).flat().map((unit) => ({ ...unit, modes: [unit.mode] })),
  ...Object.values(SCIENCE_GRADE_UNITS).flat().map((unit) => ({ ...unit, modes: [unit.mode] })),
  ...Object.values(SOCIAL_GRADE_UNITS).flat().map((unit) => ({ ...unit, modes: [unit.mode] })),
  ...Object.values(KOKUGO_GRADE_UNITS).flat().map((unit) => ({ ...unit, modes: unit.modes || (unit.mode ? [unit.mode] : []) })),
  ...Object.values(MATH_GRADE_UNITS).flat().map((unit) => ({ ...unit, modes: unit.modes || (unit.mode ? [unit.mode] : []) })),
];

const getSelectableGrades = (categoryId: SubjectCategoryType): number[] => {
  if (categoryId === 'LIFE') return [1, 2];
  if (categoryId === 'SCIENCE') return [3, 4, 5, 6, 7, 8, 9];
  if (categoryId === 'ENGLISH' || categoryId === 'SOCIAL') return [3, 4, 5, 6, 7, 8, 9];
  return [1, 2, 3, 4, 5, 6, 7, 8, 9];
};

const ModeSelectionScreen: React.FC<ModeSelectionScreenProps> = ({
  onSelectMode,
  onBack,
  languageMode,
  modeMasteryMap = {},
  modeCorrectCounts = {},
}) => {
  const [selectedCategory, setSelectedCategory] = useState<SubjectCategoryConfig>(SUBJECT_CATEGORIES[0]);
  const [selectedSubModeId, setSelectedSubModeId] = useState<string>(SUBJECT_CATEGORIES[0].subModes[0]?.id || '');
  const [selectedGrade, setSelectedGrade] = useState<number>(3);
  const [selectedTerm, setSelectedTerm] = useState<number>(1);
  const [selectedMathGrade, setSelectedMathGrade] = useState<number>(1);
  const [selectedMathUnitIds, setSelectedMathUnitIds] = useState<string[]>([]);
  const [showUpperProblems, setShowUpperProblems] = useState(false);
  const displayedCategories = useMemo<SubjectCategoryConfig[]>(() => {
    const kanjiCategory = SUBJECT_CATEGORIES.find((cat) => cat.id === 'KANJI');
    if (showUpperProblems) {
      return kanjiCategory
        ? [
            { ...kanjiCategory, subModes: kanjiCategory.subModes.filter((sub) => UPPER_KANJI_SUB_MODE_IDS.has(sub.id)) },
            ...UPPER_PROBLEM_CATEGORIES,
          ]
        : UPPER_PROBLEM_CATEGORIES;
    }
    return SUBJECT_CATEGORIES.map((cat) => (
      cat.id === 'KANJI'
        ? { ...cat, subModes: cat.subModes.filter((sub) => !UPPER_KANJI_SUB_MODE_IDS.has(sub.id)) }
        : cat
    ));
  }, [showUpperProblems]);
  const defaultDisplayedCategory = displayedCategories[0] || SUBJECT_CATEGORIES[0];
  const isUnitCategory = selectedCategory.id === 'MATH_GRADES' || selectedCategory.id === 'KOKUGO_GRADES' || selectedCategory.id === 'ENGLISH' || selectedCategory.id === 'LIFE' || selectedCategory.id === 'SCIENCE' || selectedCategory.id === 'SOCIAL' || selectedCategory.id === 'SUMMARY';
  const [answerMode, setAnswerMode] = useState<AnswerMode>('CHOICE');
  const canSelectAnswerMode = selectedCategory.id === 'MATH' || selectedCategory.id === 'KANJI' || selectedCategory.id === 'KANKEN' || selectedCategory.id === 'HARD_KANJI';

  useEffect(() => {
    const nextCategory = displayedCategories.find((cat) => cat.id === selectedCategory.id) || defaultDisplayedCategory;
    if (nextCategory !== selectedCategory) {
      setSelectedCategory(nextCategory);
      setSelectedSubModeId(nextCategory.subModes[0]?.id || '');
      return;
    }
    if (!nextCategory.subModes.some((sub) => sub.id === selectedSubModeId)) {
      setSelectedSubModeId(nextCategory.subModes[0]?.id || '');
    }
  }, [defaultDisplayedCategory, displayedCategories, selectedCategory, selectedSubModeId]);

  const handleSelect = (mode: string, modePool?: string[]) => {
    audioService.playSound('select');
    const selectedAnswerMode = canSelectAnswerMode ? answerMode : 'CHOICE';
    saveAnswerModePreference(selectedAnswerMode);
    onSelectMode(mode as GameMode, modePool, selectedAnswerMode);
  };

  const isMastered = (mode: string) => !!modeMasteryMap[mode];
  const getCategoryLabel = (id: SubjectCategoryType) => transProblemSubjectName(CATEGORY_LABELS[id] || id, languageMode);
  const getSubLabel = (_id: string, fallback: string) => fallback;
  const getUnitCorrectCount = (unit: { mode?: string; modes?: string[] }) => {
    if (unit.modes && unit.modes.length > 0) {
      return unit.modes.reduce((total, mode) => total + (modeCorrectCounts[mode] || 0), 0);
    }
    if (unit.mode) return modeCorrectCounts[unit.mode] || 0;
    return 0;
  };

  const clearSelectedUnits = () => {
    setSelectedMathUnitIds([]);
    audioService.playSound('select');
  };

  const renderMasteryPrefix = (mode: string) => {
    if (!isMastered(mode)) return null;
    return <span className="text-red-500 font-black font-sans mr-1">◎</span>;
  };

  const handleCategorySelect = (cat: SubjectCategoryConfig) => {
    setSelectedCategory(cat);
    setSelectedSubModeId(cat.subModes[0]?.id || '');
    if (cat.id === 'ENGLISH' && selectedMathGrade < 3) {
      setSelectedMathGrade(3);
    }
    audioService.playSound('select');
  };

  const renderAnswerModeSelector = () => {
    if (!canSelectAnswerMode) return null;

    return (
      <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-2">
        <div className="mb-1 text-[10px] font-bold text-slate-400">答え方</div>
        <div className="grid grid-cols-2 gap-1.5">
          {([
            ['CHOICE', '4択'],
            ['INPUT', '入力'],
          ] as const).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              onClick={() => {
                setAnswerMode(mode);
                saveAnswerModePreference(mode);
                audioService.playSound('select');
              }}
              className={`rounded border px-2 py-1.5 text-xs font-black transition-colors ${answerMode === mode ? 'border-yellow-300 bg-yellow-500 text-slate-950' : 'border-slate-600 bg-slate-800 text-slate-200 hover:border-slate-400'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const selectedSubMode = selectedCategory.subModes.find((sub) => sub.id === selectedSubModeId) || selectedCategory.subModes[0];

  const getModeSelectionPreview = () => {
    if (isUnitCategory) {
      const allUnitsAcrossAllCategories = getAllSelectableUnits();
      const selectedUnits = allUnitsAcrossAllCategories.filter((u) => selectedMathUnitIds.includes(u.id));

      const modePool = Array.from(new Set(selectedUnits.flatMap((u) => u.modes || (u.mode ? [u.mode] : []))));
      const representativeMode = (selectedUnits[0]?.modes?.[0] || selectedUnits[0]?.mode || GameMode.MATH_G1_1) as string;
      const detailLabel = selectedUnits.length === 1
        ? selectedUnits[0].name
        : selectedUnits.length > 0
        ? `${trans('ミックス選択', languageMode)} (${selectedUnits.length}${trans('単元', languageMode)})`
        : trans('単元未選択', languageMode);

      return {
        mode: representativeMode,
        modePool,
        canStart: selectedUnits.length > 0,
        label: `${getCategoryLabel(selectedCategory.id)} / ${detailLabel}`,
      };
    }

    if (selectedCategory.uiType === 'english_mixed') {
      if (selectedSubModeId === 'ENGLISH_MIXED') {
        return {
          mode: GameMode.ENGLISH_MIXED as string,
          canStart: true,
          label: `${getCategoryLabel(selectedCategory.id)} / ミックス`,
        };
      }
    }

    if (selectedCategory.uiType === 'grade_term') {
      const mode = (() => {
        if (selectedCategory.id === 'LIFE') return `LIFE_${selectedGrade}_${selectedTerm}`;
        if (selectedCategory.id === 'SCIENCE') return `SCIENCE_${selectedGrade}_${selectedTerm}`;
        if (selectedCategory.id === 'SOCIAL') return `SOCIAL_${selectedGrade}_${selectedTerm}`;
        return selectedSubMode?.mode || selectedCategory.subModes[0]?.mode;
      })() as string;

      return {
        mode,
        canStart: !!mode,
        label: `${getCategoryLabel(selectedCategory.id)} / ${getDisplayGradeLabel(selectedGrade, languageMode)} / ${getDisplayTermLabel(selectedTerm, languageMode)}`,
      };
    }

    if (selectedSubMode) {
      return {
        mode: selectedSubMode.mode as string,
        canStart: true,
        label: `${getCategoryLabel(selectedCategory.id)} / ${getSubLabel(selectedSubMode.id, selectedSubMode.name)}`,
      };
    }

    return {
      mode: '',
      canStart: false,
      label: `${getCategoryLabel(selectedCategory.id)} / ${trans('未選択', languageMode)}`,
    };
  };

  const selectionPreview = getModeSelectionPreview();

  const renderModeSelectionPanel = () => {
    const theme = getCategoryClasses(selectedCategory.color);

    if (isUnitCategory) {
      const gradeUnits = getCurrentUnitsForCategory(selectedCategory.id, selectedMathGrade);
      const grades = getSelectableGrades(selectedCategory.id);

      return (
        <div className="space-y-3">
          <div>
            <div className="text-[10px] text-gray-400 mb-1">{trans('学年', languageMode)}</div>
            <div className="grid grid-cols-9 sm:grid-cols-5 gap-1">
              {grades.map((grade) => (
                <button
                  key={grade}
                  onClick={() => {
                    setSelectedMathGrade(grade);
                    // Do not clear selected units when switching grades to allow cross-grade mix
                    audioService.playSound('select');
                  }}
                  className={`px-0.5 py-1 rounded border text-[9px] sm:text-[10px] font-bold leading-none transition-colors ${selectedMathGrade === grade ? `${theme.bg} border-white text-white` : 'bg-slate-700 border-slate-600 text-gray-300 hover:bg-slate-600'}`}
                >
                  {getDisplayGradeLabel(grade, languageMode)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <div className="text-[10px] text-gray-400">{trans('単元', languageMode)}</div>
              <button
                type="button"
                onClick={clearSelectedUnits}
                disabled={selectedMathUnitIds.length === 0}
                className={`rounded border px-2 py-0.5 text-[9px] font-bold transition-colors ${selectedMathUnitIds.length > 0 ? 'border-slate-500 text-slate-200 hover:bg-slate-700' : 'border-slate-700 text-slate-500 cursor-not-allowed opacity-60'}`}
              >
                {trans('選択解除', languageMode)}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2 max-h-[48vh] overflow-y-auto custom-scrollbar pr-1">
              {gradeUnits.map((unit) => {
                const isSelected = selectedMathUnitIds.includes(unit.id);
                const correctCount = getUnitCorrectCount(unit);
                const progressPercent = Math.min(100, Math.max(0, (correctCount / UNIT_MASTERY_TARGET) * 100));
                return (
                  <button
                    key={unit.id}
                    onClick={() => {
                      setSelectedMathUnitIds((prev) => prev.includes(unit.id)
                        ? prev.filter((id) => id !== unit.id)
                        : [...prev, unit.id]);
                      audioService.playSound('select');
                    }}
                    className={`group relative min-h-[3.1rem] w-full overflow-hidden rounded-lg border px-2 py-1.5 pr-14 text-left text-[10px] font-bold leading-snug transition-colors sm:min-h-[3.4rem] sm:px-2.5 sm:py-2 sm:pr-16 sm:text-xs ${isSelected ? `${theme.bg} border-white text-white` : 'bg-slate-800 border-slate-600 text-gray-200 hover:border-slate-400'}`}
                  >
                    <span
                      className={`absolute inset-y-0 left-0 transition-[width] duration-300 ${isSelected ? 'bg-white/18' : 'bg-emerald-500/30 group-hover:bg-emerald-400/35'}`}
                      style={{ width: `${progressPercent}%` }}
                      aria-hidden="true"
                    />
                    <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.08),transparent_36%,rgba(0,0,0,0.22))]" aria-hidden="true" />
                    <span className="relative z-10 block pr-1" data-allow-japanese="true">{unit.name}</span>
                    <span className="absolute bottom-1.5 left-2 z-10 h-1 w-[calc(100%-4.5rem)] overflow-hidden rounded-full bg-black/45 sm:left-2.5 sm:w-[calc(100%-5rem)]">
                      <span
                        className={`block h-full rounded-full ${progressPercent >= 100 ? 'bg-yellow-300' : 'bg-emerald-300'}`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </span>
                    <span className="absolute right-1 top-1 z-10 rounded-full bg-black/55 border border-white/15 px-1 py-0.5 text-[7px] sm:right-1.5 sm:top-1.5 sm:px-1.5 sm:text-[8px] font-mono leading-none text-white/90">
                      {correctCount}/{UNIT_MASTERY_TARGET}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    if (selectedCategory.uiType === 'grade_term') {
      const grades = selectedCategory.id === 'LIFE' ? [1, 2] : [3, 4, 5, 6, 7, 8, 9];

      return (
        <div className="space-y-3">
          <div>
            <div className="text-[10px] text-gray-400 mb-1">{trans('学年', languageMode)}</div>
            <div className="grid grid-cols-5 gap-1.5">
              {grades.map((grade) => (
                <button
                  key={grade}
                  onClick={() => { setSelectedGrade(grade); audioService.playSound('select'); }}
                  className={`p-1.5 rounded border text-[10px] font-bold transition-colors ${selectedGrade === grade ? `${theme.bg} border-white text-white` : 'bg-slate-700 border-slate-600 text-gray-300 hover:bg-slate-600'}`}
                >
                  {getDisplayGradeLabel(grade, languageMode)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-gray-400 mb-1">{trans('学期', languageMode)}</div>
            <div className="grid grid-cols-3 gap-1.5">
              {[1, 2, 3].map((term) => (
                <button
                  key={term}
                  onClick={() => { setSelectedTerm(term); audioService.playSound('select'); }}
                  className={`p-1.5 rounded border text-[10px] font-bold transition-colors ${selectedTerm === term ? `${theme.bg} border-white text-white` : 'bg-slate-700 border-slate-600 text-gray-300 hover:bg-slate-600'}`}
                >
                  {getDisplayTermLabel(term, languageMode)}
                </button>
              ))}
            </div>
          </div>
          {selectedCategory.id === 'SOCIAL' && (
            <div>
              <div className="text-[10px] text-gray-400 mb-1">{trans('単独モード', languageMode)}</div>
              <div className="grid grid-cols-3 gap-1.5">
                {selectedCategory.subModes.filter((sub) => !sub.id.includes('SO')).map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => {
                      setSelectedSubModeId(sub.id);
                      audioService.playSound('select');
                    }}
                    className={`p-1.5 rounded border text-[10px] font-bold transition-colors ${selectedSubModeId === sub.id ? `${theme.bg} border-white text-white` : 'bg-slate-700 border-slate-600 text-gray-300 hover:bg-slate-600'}`}
                  >
                    <span data-allow-japanese="true">{getSubLabel(sub.id, sub.name)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (selectedCategory.uiType === 'english_mixed') {
      const words = selectedCategory.subModes.filter((sub) => sub.id.startsWith('E_'));
      const convs = selectedCategory.subModes.filter((sub) => sub.id.startsWith('C'));
      return (
        <div className="space-y-3">
          <div>
            <div className="text-[10px] text-gray-400 mb-1">{trans('単語', languageMode)}</div>
            <div className="grid grid-cols-2 gap-1.5">
              {words.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => { setSelectedSubModeId(sub.id); audioService.playSound('select'); }}
                  className={`p-2 rounded-lg border text-[10px] font-bold transition-colors ${selectedSubModeId === sub.id ? `${theme.bg} border-white text-white` : 'bg-slate-700 border-slate-600 text-gray-300 hover:bg-slate-600'}`}
                >
                  <span data-allow-japanese="true">{getSubLabel(sub.id, sub.name)}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-gray-400 mb-1">{trans('会話', languageMode)}</div>
            <div className="grid grid-cols-3 gap-1.5">
              {convs.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => { setSelectedSubModeId(sub.id); audioService.playSound('select'); }}
                  className={`p-2 rounded-lg border text-[10px] font-bold transition-colors ${selectedSubModeId === sub.id ? `${theme.bg} border-white text-white` : 'bg-slate-700 border-slate-600 text-gray-300 hover:bg-slate-600'}`}
                >
                  <span data-allow-japanese="true">{getSubLabel(sub.id, sub.name)}</span>
                </button>
              ))}
              <button
                onClick={() => { setSelectedSubModeId('ENGLISH_MIXED'); audioService.playSound('select'); }}
                className={`p-2 rounded-lg border text-[10px] font-bold transition-colors ${selectedSubModeId === 'ENGLISH_MIXED' ? `${theme.bg} border-white text-white` : 'bg-slate-700 border-slate-600 text-gray-300 hover:bg-slate-600'}`}
              >
                <span data-allow-japanese="true">ミックス</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {renderAnswerModeSelector()}
        <div className={`grid ${selectedCategory.id === 'KANJI' || selectedCategory.id === 'KANKEN' || selectedCategory.id === 'HARD_KANJI' ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
          {selectedCategory.subModes.map((sub) => (
            <button
              key={sub.id}
              onClick={() => {
                setSelectedSubModeId(sub.id);
                audioService.playSound('select');
              }}
              className={`p-2 rounded-lg border text-left text-[10px] md:text-xs font-bold transition-colors ${selectedSubModeId === sub.id ? `${theme.bg} border-white text-white` : 'bg-slate-700 border-slate-600 text-gray-300 hover:bg-slate-600'}`}
            >
              {renderMasteryPrefix(sub.mode)}
              <span data-allow-japanese="true">{getSubLabel(sub.id, sub.name)}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderCategoryContent = (cat: SubjectCategoryConfig) => {
    const theme = getCategoryClasses(cat.color);

    if (cat.uiType === 'grid') {
      return (
        <div className="space-y-3">
          {renderAnswerModeSelector()}
          <div className={`grid ${cat.id === 'KANJI' || cat.id === 'KANKEN' || cat.id === 'HARD_KANJI' ? 'grid-cols-3' : 'grid-cols-2'} gap-1.5`}>
            {cat.subModes.map(sub => (
              <button
                key={sub.id}
                onClick={() => handleSelect(sub.mode)}
                className="bg-slate-800 border border-slate-600 p-1.5 rounded hover:border-white transition-colors text-[10px] md:text-xs font-bold truncate"
              >
                {renderMasteryPrefix(sub.mode)}
                <span data-allow-japanese="true">{getSubLabel(sub.id, sub.name)}</span>
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (cat.uiType === 'grade_term') {
      if (cat.id === 'MATH_GRADES' || cat.id === 'KOKUGO_GRADES' || cat.id === 'ENGLISH' || cat.id === 'LIFE' || cat.id === 'SCIENCE' || cat.id === 'SOCIAL') {
        const isKokugo = cat.id === 'KOKUGO_GRADES';
        const isEnglish = cat.id === 'ENGLISH';
        const isLife = cat.id === 'LIFE';
        const isScience = cat.id === 'SCIENCE';
        const isSocial = cat.id === 'SOCIAL';
        const gradeUnits = isEnglish
          ? (ENGLISH_GRADE_UNITS[selectedMathGrade] || [])
          : (isLife || isScience)
          ? (isLife
            ? (SCIENCE_GRADE_UNITS[selectedMathGrade] || []).filter((unit) => unit.mode.startsWith('LIFE_'))
            : (SCIENCE_GRADE_UNITS[selectedMathGrade] || []).filter((unit) => unit.mode.startsWith('SCIENCE_')))
          : isSocial
          ? (SOCIAL_GRADE_UNITS[selectedMathGrade] || [])
          : isKokugo
          ? (KOKUGO_GRADE_UNITS[selectedMathGrade] || [])
          : (MATH_GRADE_UNITS[selectedMathGrade] || []);
        const allUnitsAcrossGrades = [
          ...Object.values(ENGLISH_GRADE_UNITS).flat(),
          ...Object.values(SCIENCE_GRADE_UNITS).flat().filter((unit) => isLife ? unit.mode.startsWith('LIFE_') : unit.mode.startsWith('SCIENCE_')),
          ...Object.values(SOCIAL_GRADE_UNITS).flat(),
          ...Object.values(KOKUGO_GRADE_UNITS).flat(),
          ...Object.values(MATH_GRADE_UNITS).flat()
        ];

        const selectedUnits = allUnitsAcrossGrades.filter((u) => selectedMathUnitIds.includes(u.id));
        const defaultMode = GameMode.MATH_G1_1;
        const selectedMode = (selectedUnits[0] && ('mode' in selectedUnits[0] ? selectedUnits[0].mode : ('modes' in selectedUnits[0] && selectedUnits[0].modes ? selectedUnits[0].modes[0] : defaultMode))) as string;
        const modePool = [...new Set(selectedUnits.flatMap((u) => {
          const modes: string[] = [];
          if ('mode' in u && u.mode) modes.push(u.mode as string);
          if ('modes' in u && u.modes && Array.isArray(u.modes)) modes.push(...u.modes);
          return modes;
        }))];
        const canStartUnits = selectedUnits.length > 0;
        return (
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <span className="text-[10px] text-gray-500 whitespace-nowrap mt-1">{trans('学年', languageMode)}</span>
              <div className="flex-1 grid grid-cols-9 sm:grid-cols-5 gap-1">
                {(isEnglish ? [3, 4, 5, 6, 7, 8, 9] : isSocial ? [3, 4, 5, 6, 7, 8, 9] : [1, 2, 3, 4, 5, 6, 7, 8, 9]).map(g => (
                  <button
                    key={g}
                    onClick={() => {
                      setSelectedMathGrade(g);
                      // Do not clear.
                    }}
                    className={`px-0.5 py-1 rounded text-[9px] md:text-[10px] font-bold leading-none border transition-colors ${selectedMathGrade === g ? `${theme.bg} border-white text-white` : 'bg-slate-700 border-slate-600 text-gray-400'}`}
                  >
                    {getDisplayGradeLabel(g, languageMode)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between gap-2">
                <div className="text-[10px] text-gray-500 whitespace-nowrap">{trans('単元', languageMode)}</div>
                <button
                  type="button"
                  onClick={clearSelectedUnits}
                  disabled={selectedMathUnitIds.length === 0}
                  className={`rounded border px-2 py-0.5 text-[9px] font-bold transition-colors ${selectedMathUnitIds.length > 0 ? 'border-slate-500 text-slate-200 hover:bg-slate-700' : 'border-slate-700 text-slate-500 cursor-not-allowed opacity-60'}`}
                >
                  {trans('選択解除', languageMode)}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto custom-scrollbar pr-1">
                {gradeUnits.map(unit => {
                  const isSelected = selectedMathUnitIds.includes(unit.id);
                  const correctCount = getUnitCorrectCount(unit);
                  const progressPercent = Math.min(100, Math.max(0, (correctCount / UNIT_MASTERY_TARGET) * 100));
                  return (
                    <button
                      key={unit.id}
                      onClick={() => {
                        setSelectedMathUnitIds((prev) => {
                          if (prev.includes(unit.id)) {
                            return prev.filter((id) => id !== unit.id);
                          }
                          return [...prev, unit.id];
                        });
                      }}
                      className={`group relative min-h-[3.1rem] w-full overflow-hidden rounded border px-2 py-1.5 pr-14 text-left text-[10px] font-bold leading-snug transition-colors md:text-xs sm:pr-16 ${isSelected ? `${theme.bg} border-white text-white` : 'bg-slate-800 border-slate-600 text-gray-300 hover:border-slate-400'}`}
                    >
                      <span
                        className={`absolute inset-y-0 left-0 transition-[width] duration-300 ${isSelected ? 'bg-white/18' : 'bg-emerald-500/30 group-hover:bg-emerald-400/35'}`}
                        style={{ width: `${progressPercent}%` }}
                        aria-hidden="true"
                      />
                      <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.08),transparent_36%,rgba(0,0,0,0.22))]" aria-hidden="true" />
                      <span className="relative z-10 block pr-1" data-allow-japanese="true">{unit.name}</span>
                      <span className="absolute bottom-1.5 left-2 z-10 h-1 w-[calc(100%-4.5rem)] overflow-hidden rounded-full bg-black/45 sm:w-[calc(100%-5rem)]">
                        <span
                          className={`block h-full rounded-full ${progressPercent >= 100 ? 'bg-yellow-300' : 'bg-emerald-300'}`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </span>
                      <span className="absolute right-1 top-1 z-10 rounded-full bg-black/55 border border-white/15 px-1 py-0.5 text-[7px] sm:right-1.5 sm:top-1.5 sm:px-1.5 sm:text-[8px] md:text-[9px] font-mono leading-none text-white/90">
                        {correctCount}/{UNIT_MASTERY_TARGET}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <button
              onClick={() => {
                if (!canStartUnits) return;
                handleSelect(selectedMode, modePool.length > 0 ? modePool : undefined);
              }}
              disabled={!canStartUnits}
              className={`w-full p-2 rounded font-bold text-xs shadow-lg transition-all text-white ${canStartUnits ? `${theme.bg} ${theme.hover}` : 'bg-slate-700 cursor-not-allowed opacity-50'}`}
            >
              {renderMasteryPrefix(selectedMode)}
              {trans('この単元ミックスで開始', languageMode)}
            </button>
            {!canStartUnits && (
              <div className="text-[10px] text-amber-300">
                {gradeUnits.length > 0 ? trans('単元を1つ以上選ぶと開始できます', languageMode) : trans('この学年の単元はまだ未実装です', languageMode)}
              </div>
            )}
          </div>
        );
      }
    }

    if (cat.uiType === 'english_mixed') {
      const words = cat.subModes.filter(s => s.id.startsWith('E_'));
      const convs = cat.subModes.filter(s => s.id.startsWith('C'));
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-1.5">
            {words.map(sub => (
              <button key={sub.id} onClick={() => handleSelect(sub.mode)} className="bg-slate-800 border border-slate-600 p-1.5 rounded hover:border-indigo-400 text-[10px] font-bold">
                {renderMasteryPrefix(sub.mode)}
                <span data-allow-japanese="true">{getSubLabel(sub.id, sub.name)}</span>
              </button>
            ))}
          </div>
          <div className="h-px bg-slate-700 my-1"></div>
          <div className="grid grid-cols-3 gap-1.5">
            {convs.map(sub => (
              <button key={sub.id} onClick={() => handleSelect(sub.mode)} className="bg-pink-900/40 border border-pink-500/50 p-1 rounded hover:bg-pink-800 text-[10px] font-bold">
                {renderMasteryPrefix(sub.mode)}
                <span data-allow-japanese="true">{getSubLabel(sub.id, sub.name)}</span>
              </button>
            ))}
            <button onClick={() => handleSelect(GameMode.ENGLISH_MIXED)} className="bg-indigo-900/60 border border-indigo-500 p-1 rounded hover:bg-indigo-800 text-[10px] font-bold">
              {renderMasteryPrefix(GameMode.ENGLISH_MIXED)}
              <span data-allow-japanese="true">ミックス</span>
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div
      className="w-full h-full bg-slate-950 bg-cover bg-center flex flex-col text-white overflow-hidden relative"
      style={{ backgroundImage: `url(${assetUrl('sprites/backgrounds/learning-rogue/selection-entrance.webp')})` }}
    >
      <div className="absolute inset-0 bg-slate-950/65 pointer-events-none" />
      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col flex-1 min-h-0 overflow-hidden">
        <button
          type="button"
          onClick={() => {
            setShowUpperProblems((prev) => !prev);
            audioService.playSound('select');
          }}
          className={`absolute left-3 top-3 z-20 flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-black shadow-lg transition-colors sm:left-4 sm:top-4 sm:text-xs ${
            showUpperProblems
              ? 'border-yellow-300 bg-yellow-500 text-slate-950 hover:bg-yellow-400'
              : 'border-cyan-300/60 bg-slate-900/85 text-cyan-100 hover:border-cyan-200 hover:bg-cyan-950'
          }`}
        >
          <GraduationCap size={14} />
          {showUpperProblems ? '通常問題へ' : '高校生以上'}
        </button>
        <div className="text-center border-b border-slate-800 p-4 shrink-0">
          <h2 className="text-2xl md:text-3xl font-bold text-yellow-400 tracking-widest">{trans('モード選択', languageMode)}</h2>
          {showUpperProblems && (
            <div className="mt-1 text-[10px] font-bold text-cyan-200">高校生以上の問題</div>
          )}
        </div>

        <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 overflow-hidden min-h-0">
          <div className="lg:col-span-2 grid grid-cols-3 sm:grid-cols-5 lg:flex lg:flex-col gap-1 lg:gap-1.5 pb-1 lg:pb-0 overflow-y-auto lg:overflow-x-visible custom-scrollbar shrink-0">
            {displayedCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat)}
                className={`flex items-center justify-center lg:justify-start gap-2 px-2 py-1.5 sm:p-2.5 lg:p-3 rounded-lg lg:rounded-xl border-2 transition-all shrink-0 min-h-[2.5rem] sm:min-h-[3rem] lg:min-h-0 ${selectedCategory.id === cat.id ? 'bg-yellow-900/35 border-yellow-400 text-white shadow-[0_0_10px_rgba(250,204,21,0.18)]' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}
              >
                <div className={`${selectedCategory.id === cat.id ? 'text-yellow-300' : 'text-slate-500'} scale-75 lg:scale-100 hidden lg:flex items-center justify-center h-4 lg:h-auto`}>
                  {getCategoryIcon(cat.id)}
                </div>
                <span className="font-bold text-sm sm:text-base lg:text-sm text-center lg:text-left leading-tight w-full whitespace-normal break-words">
                  {getCategoryLabel(cat.id)}
                </span>
              </button>
            ))}
          </div>

          <div className="lg:col-span-7 flex flex-col min-h-0">
            <h3 className="text-[10px] md:text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-tight shrink-0">
              {trans('単元', languageMode)} / {trans('種目', languageMode)}
            </h3>
            <div className="bg-black/40 p-3 rounded-xl border border-slate-800 flex-grow overflow-y-auto custom-scrollbar shadow-inner min-h-[160px]">
              {renderModeSelectionPanel()}
            </div>
          </div>

          <div className="lg:col-span-3 flex flex-col gap-3 overflow-y-auto custom-scrollbar shrink-0">
            <div className="bg-black/40 rounded-xl border border-slate-800 p-3">
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2">{trans('選択中', languageMode)}</div>
              <div className="text-sm font-bold text-yellow-300" data-allow-japanese="true">{selectionPreview.label}</div>
            </div>
            {isUnitCategory && (
              <div className="bg-black/40 rounded-xl border border-slate-800 p-3 text-xs text-slate-300">
                {trans('学年', languageMode)}: {getDisplayGradeLabel(selectedMathGrade, languageMode)}
                <br />
                {trans('選択単元数', languageMode)}: {selectedMathUnitIds.length}
              </div>
            )}
            {canSelectAnswerMode && (
              <div className="bg-black/40 rounded-xl border border-slate-800 p-3 text-xs text-slate-300">
                答え方: <span className="font-bold text-white">{answerMode === 'CHOICE' ? '4択' : '入力'}</span>
              </div>
            )}
            {selectedCategory.uiType === 'grade_term' && !isUnitCategory && (
              <div className="bg-black/40 rounded-xl border border-slate-800 p-3 text-xs text-slate-300">
                {trans('学年', languageMode)}: {getDisplayGradeLabel(selectedGrade, languageMode)}
                <br />
                {trans('学期', languageMode)}: {getDisplayTermLabel(selectedTerm, languageMode)}
              </div>
            )}
            <button
              onClick={() => {
                if (!selectionPreview.canStart || !selectionPreview.mode) return;
                handleSelect(selectionPreview.mode, selectionPreview.modePool);
              }}
              disabled={!selectionPreview.canStart}
              className={`w-full py-3 rounded-xl font-bold text-base transition-all ${selectionPreview.canStart ? 'bg-yellow-500 hover:bg-yellow-400 text-slate-950 shadow-[0_4px_0_rgb(161,98,7)] active:translate-y-1 active:shadow-none' : 'bg-slate-700 text-slate-400 opacity-60 cursor-not-allowed'}`}
            >
              {selectionPreview.canStart ? trans('この条件で開始', languageMode) : trans('単元を選択してください', languageMode)}
            </button>
            {!selectionPreview.canStart && (
              <div className="text-[10px] text-amber-300">
                {isUnitCategory
                  ? trans('単元を1つ以上選ぶと開始できます', languageMode)
                  : trans('開始条件を確認してください', languageMode)}
              </div>
            )}
            <button onClick={onBack} className="mt-auto text-slate-400 hover:text-white flex items-center gap-2 transition-colors py-1 text-xs">
              <ArrowLeft size={14} /> もどる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModeSelectionScreen;

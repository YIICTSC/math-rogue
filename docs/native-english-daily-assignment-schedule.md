# 英語圏児童向けデイリー課題 週別出題表と拡充計画

このドキュメントは、英語圏児童向け Grade 1-8 のデイリー課題で、現状どの週にどの単元が固定枠として出題されるかを確認するための資料です。

参照実装:

- `src/utils/dailyAssignmentUtils.ts`
- `src/nativeEnglishUnitConfig.ts`
- `src/data/subjects/native_english_units.ts`

## 現行仕様

- 対象は `Grade 1` から `Grade 8`。
- デイリー課題は2枠構成。
  - 固定枠: 30問正解目標。
  - Challenge枠: 20問正解目標。
- 年度週は4月1日を起点に `W01` から `W52` として扱う。
- 英語圏児童向けの固定枠は、`src/data/nativeEnglishDailyCurriculumPlan.ts` の専用週別計画を優先する。
- 専用週別計画に該当単元がない場合だけ、学年ごとの単元配列を `weekIndex % unitCount` で順番に回す。
- Challenge枠は完全固定ではない。学習進捗がある場合は「着手済みで50問未満」の単元を優先し、進捗がない場合は固定枠以外の単元から選ばれる。

このため、専用週別計画の表は「固定枠」に出る単元の週別表として扱う。Challenge枠の厳密な出題単元はユーザーごとの正答数に依存する。

## 実装状況

- Phase 1: 完了。専用計画導入前のローテーション確認用の週別表を作成済み。
- Phase 2: 完了。`src/data/nativeEnglishDailyCurriculumPlan.ts` を追加し、Grade 1-8 の52週計画を生成。
- Phase 3: 完了。英語Gradeのデイリー課題固定枠を専用週別計画参照へ接続。
- Phase 4: 完了。ELA / Math を全Gradeで4単元以上に拡充。
- Phase 5: 完了。Science / Social Studies / Japanese を全Gradeで3単元以上に拡充。
- Phase 6: 完了。Life Skills / Digital Literacy は新教科化せず、Social Studies 配下に各Grade1単元ずつ追加。
- Phase 7: 完了。追加54単元をすべて42問相当の明示概念問題へ移行。
- Phase 8以降: 未着手。UI表示・翻訳確認と検証が次工程。

## 専用週別計画パターン

専用週別計画は13週パターンを4回繰り返して52週分を生成する。Quarter Review を13週ごとに置き、ELA / Math の頻度を高める。

Grade 1-2:

| 13週内の週 | 教科 | ラベル |
| :--- | :--- | :--- |
| 1 | ELA | ELA Skill |
| 2 | Math | Math Fluency |
| 3 | Science | Science Discovery |
| 4 | ELA | ELA Reading |
| 5 | Math | Review: Math |
| 6 | Math | Math Practice |
| 7 | ELA | ELA Vocabulary |
| 8 | Social Studies | Social Studies |
| 9 | Math | Math Word Problems |
| 10 | ELA | Review: ELA |
| 11 | Science | Science Lab |
| 12 | Japanese | Japanese |
| 13 | Math | Quarter Review |

Grade 3-8:

| 13週内の週 | 教科 | ラベル |
| :--- | :--- | :--- |
| 1 | ELA | ELA Analysis |
| 2 | Math | Math Practice |
| 3 | Science | Science Concepts |
| 4 | Math | Math Word Problems |
| 5 | ELA | Review: ELA |
| 6 | Social Studies | Social Studies |
| 7 | Math | Math Fluency |
| 8 | ELA | Writing and Evidence |
| 9 | Science | Science Data |
| 10 | Math | Review: Math |
| 11 | Social Studies | Civics and Geography |
| 12 | Japanese | Japanese |
| 13 | ELA | Quarter Review |

## Challenge枠の選ばれ方

Challenge枠は次の優先順で決まる。

1. その日の固定枠と同じ単元は除外する。
2. 正答数が1以上かつ50未満の単元があれば、それを優先する。
3. 複数ある場合は正答数が多い単元を優先する。
4. 着手中の単元がない場合は、正答数が少ない単元を優先する。
5. すべて同条件なら、学年内の単元配列順に近いものが選ばれる。

## Phase 1時点のローテーション確認表

以下の Grade 別表は、専用週別計画を入れる前の単純ローテーション確認表である。現在の固定枠は `src/data/nativeEnglishDailyCurriculumPlan.ts` の13週パターンを優先し、この表はフォールバック時の単元配列確認に使う。

## Grade 1

| No. | 出題週 | 教科 | 固定枠の単元 |
| :--- | :--- | :--- | :--- |
| 1 | W01, W16, W31, W46 | ELA | ELA G1: Phonics and Sight Words |
| 2 | W02, W17, W32, W47 | ELA | ELA G1: Long Vowels |
| 3 | W03, W18, W33, W48 | ELA | ELA G1: Sight Words in Sentences |
| 4 | W04, W19, W34, W49 | ELA | ELA G1: Sentences and Story Details |
| 5 | W05, W20, W35, W50 | Math | Math G1: Number Sense |
| 6 | W06, W21, W36, W51 | Math | Math G1: Addition and Subtraction within 20 |
| 7 | W07, W22, W37, W52 | Math | Math G1: Shapes, Time, and Money |
| 8 | W08, W23, W38 | Science | Science G1: Weather and Living Things |
| 9 | W09, W24, W39 | Science | Science G1: Weather and Seasons |
| 10 | W10, W25, W40 | Science | Science G1: Light, Sound, and Materials |
| 11 | W11, W26, W41 | Social Studies | Social Studies G1: Community |
| 12 | W12, W27, W42 | Social Studies | Social Studies G1: Needs, Wants, and Jobs |
| 13 | W13, W28, W43 | Social Studies | Social Studies G1: Rules and Citizenship |
| 14 | W14, W29, W44 | Japanese | Japanese G1: Hiragana and First Words |
| 15 | W15, W30, W45 | Japanese | Japanese G1: Greetings and Classroom Phrases |

## Grade 2

| No. | 出題週 | 教科 | 固定枠の単元 |
| :--- | :--- | :--- | :--- |
| 1 | W01, W15, W29, W43 | ELA | ELA G2: Sentences and Main Idea |
| 2 | W02, W16, W30, W44 | ELA | ELA G2: Prefixes and Suffixes |
| 3 | W03, W17, W31, W45 | ELA | ELA G2: Reading Details and Vocabulary |
| 4 | W04, W18, W32, W46 | Math | Math G2: Word Problems |
| 5 | W05, W19, W33, W47 | Math | Math G2: Place Value |
| 6 | W06, W20, W34, W48 | Math | Math G2: Place Value and Measurement |
| 7 | W07, W21, W35, W49 | Science | Science G2: Plants, Animals, and Matter |
| 8 | W08, W22, W36, W50 | Science | Science G2: Solids, Liquids, and Changes |
| 9 | W09, W23, W37, W51 | Science | Science G2: Land, Water, and Weather |
| 10 | W10, W24, W38, W52 | Social Studies | Social Studies G2: Maps and Citizenship |
| 11 | W11, W25, W39 | Social Studies | Social Studies G2: Map Skills |
| 12 | W12, W26, W40 | Social Studies | Social Studies G2: Culture and History Sources |
| 13 | W13, W27, W41 | Japanese | Japanese G2: Katakana and Loanwords |
| 14 | W14, W28, W42 | Japanese | Japanese G2: Simple Sentences |

## Grade 3

| No. | 出題週 | 教科 | 固定枠の単元 |
| :--- | :--- | :--- | :--- |
| 1 | W01, W12, W23, W34, W45 | ELA | ELA G3: Reading and Grammar |
| 2 | W02, W13, W24, W35, W46 | ELA | ELA G3: Paragraphs and Word Study |
| 3 | W03, W14, W25, W36, W47 | Math | Math G3: Multiplication and Fractions |
| 4 | W04, W15, W26, W37, W48 | Math | Math G3: Fractions on Shapes and Number Lines |
| 5 | W05, W16, W27, W38, W49 | Math | Math G3: Geometry and Data |
| 6 | W06, W17, W28, W39, W50 | Science | Science G3: Habitats and Forces |
| 7 | W07, W18, W29, W40, W51 | Science | Science G3: Life Cycles and Earth Systems |
| 8 | W08, W19, W30, W41, W52 | Social Studies | Social Studies G3: Regions and History |
| 9 | W09, W20, W31, W42 | Social Studies | Social Studies G3: Government and Economy |
| 10 | W10, W21, W32, W43 | Japanese | Japanese G3: Particles and Questions |
| 11 | W11, W22, W33, W44 | Japanese | Japanese G3: First Kanji and Radicals |

## Grade 4

| No. | 出題週 | 教科 | 固定枠の単元 |
| :--- | :--- | :--- | :--- |
| 1 | W01, W11, W21, W31, W41, W51 | ELA | ELA G4: Inference and Theme |
| 2 | W02, W12, W22, W32, W42, W52 | ELA | ELA G4: Text Structure and Vocabulary |
| 3 | W03, W13, W23, W33, W43 | Math | Math G4: Multi-Digit Operations |
| 4 | W04, W14, W24, W34, W44 | Math | Math G4: Fractions and Decimals |
| 5 | W05, W15, W25, W35, W45 | Science | Science G4: Energy and Waves |
| 6 | W06, W16, W26, W36, W46 | Science | Science G4: Earth Changes |
| 7 | W07, W17, W27, W37, W47 | Social Studies | Social Studies G4: Geography and Regions |
| 8 | W08, W18, W28, W38, W48 | Social Studies | Social Studies G4: State and Local History |
| 9 | W09, W19, W29, W39, W49 | Japanese | Japanese G4: Verbs and Polite Forms |
| 10 | W10, W20, W30, W40, W50 | Japanese | Japanese G4: Short Reading Passages |

## Grade 5

| No. | 出題週 | 教科 | 固定枠の単元 |
| :--- | :--- | :--- | :--- |
| 1 | W01, W11, W21, W31, W41, W51 | ELA | ELA G5: Text Analysis |
| 2 | W02, W12, W22, W32, W42, W52 | ELA | ELA G5: Opinion and Informative Writing |
| 3 | W03, W13, W23, W33, W43 | Math | Math G5: Decimals and Volume |
| 4 | W04, W14, W24, W34, W44 | Math | Math G5: Fraction Operations |
| 5 | W05, W15, W25, W35, W45 | Science | Science G5: Matter and Mixtures |
| 6 | W06, W16, W26, W36, W46 | Science | Science G5: Ecosystems and Space |
| 7 | W07, W17, W27, W37, W47 | Social Studies | Social Studies G5: U.S. History Foundations |
| 8 | W08, W18, W28, W38, W48 | Social Studies | Social Studies G5: Civics and Economics |
| 9 | W09, W19, W29, W39, W49 | Japanese | Japanese G5: Adjectives and Descriptions |
| 10 | W10, W20, W30, W40, W50 | Japanese | Japanese G5: Daily Life Communication |

## Grade 6

| No. | 出題週 | 教科 | 固定枠の単元 |
| :--- | :--- | :--- | :--- |
| 1 | W01, W11, W21, W31, W41, W51 | ELA | ELA G6: Argument and Evidence |
| 2 | W02, W12, W22, W32, W42, W52 | ELA | ELA G6: Literature and Figurative Language |
| 3 | W03, W13, W23, W33, W43 | Math | Math G6: Ratios and Rates |
| 4 | W04, W14, W24, W34, W44 | Math | Math G6: Expressions and Equations |
| 5 | W05, W15, W25, W35, W45 | Science | Science G6: Cells and Body Systems |
| 6 | W06, W16, W26, W36, W46 | Science | Science G6: Earth Science |
| 7 | W07, W17, W27, W37, W47 | Social Studies | Social Studies G6: World Geography |
| 8 | W08, W18, W28, W38, W48 | Social Studies | Social Studies G6: Ancient Civilizations |
| 9 | W09, W19, W29, W39, W49 | Japanese | Japanese G6: Connectors and Longer Sentences |
| 10 | W10, W20, W30, W40, W50 | Japanese | Japanese G6: Culture and Practical Reading |

## Grade 7

| No. | 出題週 | 教科 | 固定枠の単元 |
| :--- | :--- | :--- | :--- |
| 1 | W01, W11, W21, W31, W41, W51 | ELA | ELA G7: Literary Analysis |
| 2 | W02, W12, W22, W32, W42, W52 | ELA | ELA G7: Research and Media Literacy |
| 3 | W03, W13, W23, W33, W43 | Math | Math G7: Proportional Relationships |
| 4 | W04, W14, W24, W34, W44 | Math | Math G7: Statistics and Probability |
| 5 | W05, W15, W25, W35, W45 | Science | Science G7: Genetics and Ecology |
| 6 | W06, W16, W26, W36, W46 | Science | Science G7: Physical Science |
| 7 | W07, W17, W27, W37, W47 | Social Studies | Social Studies G7: Medieval and Early Modern World |
| 8 | W08, W18, W28, W38, W48 | Social Studies | Social Studies G7: Civics and Global Issues |
| 9 | W09, W19, W29, W39, W49 | Japanese | Japanese G7: Conversation and Opinions |
| 10 | W10, W20, W30, W40, W50 | Japanese | Japanese G7: Reading with Kanji |

## Grade 8

| No. | 出題週 | 教科 | 固定枠の単元 |
| :--- | :--- | :--- | :--- |
| 1 | W01, W11, W21, W31, W41, W51 | ELA | ELA G8: Rhetoric and Author Craft |
| 2 | W02, W12, W22, W32, W42, W52 | ELA | ELA G8: Argument Writing and Source Use |
| 3 | W03, W13, W23, W33, W43 | Math | Math G8: Linear Equations |
| 4 | W04, W14, W24, W34, W44 | Math | Math G8: Geometry and Functions |
| 5 | W05, W15, W25, W35, W45 | Science | Science G8: Chemistry Foundations |
| 6 | W06, W16, W26, W36, W46 | Science | Science G8: Space and Earth History |
| 7 | W07, W17, W27, W37, W47 | Social Studies | Social Studies G8: U.S. History and Constitution |
| 8 | W08, W18, W28, W38, W48 | Social Studies | Social Studies G8: Government, Rights, and Media |
| 9 | W09, W19, W29, W39, W49 | Japanese | Japanese G8: Grammar Review and Nuance |
| 10 | W10, W20, W30, W40, W50 | Japanese | Japanese G8: Media, Signs, and Everyday Texts |

## 現状の課題

- 英語圏児童向けデイリー課題は「年度に沿った単元計画」ではなく、単元配列の単純ローテーションである。
- Grade 4-8 は各学年10単元のため、同じ単元が約5週ごとに再登場する。
- ELA / Math / Science / Social Studies / Japanese の比率は均等に近いが、英語圏の実学習では ELA と Math の頻度を高めた方が自然。
- 夏休み、学期末、年度末の復習週がまだない。
- Challenge枠は個別最適化としては有効だが、保護者や教師が「今週の出題」を事前確認しづらい。

## 追加教科・単元案

英語圏児童が継続学習する用途では、既存の5教科に加えて次の領域を拡充すると効果が高い。

### Priority A: ELA強化

- Vocabulary Workshop
  - Grade 1-2: sight words, categories, synonyms and antonyms
  - Grade 3-5: context clues, prefixes, suffixes, roots
  - Grade 6-8: academic vocabulary, tone, connotation
- Reading Comprehension
  - fiction details, nonfiction main idea, inference, theme
  - evidence-based answers
- Writing Skills
  - sentence combining, paragraph order, topic sentence
  - opinion, informative, narrative, argument writing
- Grammar and Usage
  - punctuation, capitalization, verb tense, pronoun reference
  - commonly confused words

### Priority A: Math強化

- Fluency Practice
  - Grade 1-2: addition/subtraction facts
  - Grade 3-5: multiplication, division, fractions, decimals
  - Grade 6-8: integers, equations, proportional reasoning
- Word Problems
  - bar models, multi-step problems, real-world measurement
- Data and Financial Literacy
  - charts, tables, mean/median/range
  - money, budgeting, unit price, simple interest
- Pre-Algebra Bridge
  - expressions, equations, functions, slope, systems preview

### Priority B: Science強化

- Science Vocabulary
  - observation, classify, compare, evidence, model
- Inquiry and Data
  - reading tables, interpreting experiment results
- Engineering Design
  - constraints, testing, improving a design
- Earth and Environmental Science
  - weather, climate, ecosystems, resources

### Priority B: Social Studies強化

- Geography Skills
  - maps, coordinates, regions, physical features
- Civics and Media Literacy
  - rights, responsibilities, branches of government
  - fact vs opinion, reliable sources
- Economics
  - needs/wants, goods/services, supply/demand
- World Cultures
  - holidays, daily life, historical sources

### Priority B: Japanese for English-Speaking Students強化

- Survival Japanese
  - greetings, classroom phrases, numbers, time
- Kana Mastery
  - hiragana, katakana, common words
- Everyday Reading
  - signs, menus, labels, schedules
- Culture and Communication
  - school life, seasonal events, polite expressions

### Priority C: Life Skills / Digital Literacy

- Digital Safety
  - passwords, privacy, scams, respectful communication
- Study Skills
  - planning, note-taking, test review, goal setting
- Health and SEL
  - emotions, choices, routines, conflict resolution
- Career Awareness
  - jobs, tools, workplace vocabulary, problem solving

## 推奨デイリー課題設計

次の設計に変えると、英語圏児童向けとして自然な学習リズムになる。

- 週固定枠は年度計画テーブル化する。
- ELA と Math を毎週または隔週で必ず出す。
- Science / Social Studies / Japanese は週替わりで組み込む。
- 5週ごとに Review Week を置く。
- 13週ごとに Quarter Review を置く。
- Challenge枠は現状通り個別最適化に残す。

推奨比率:

| 学年 | ELA | Math | Science | Social Studies | Japanese | Review |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Grade 1-2 | 30% | 30% | 15% | 10% | 10% | 5% |
| Grade 3-5 | 25% | 30% | 15% | 15% | 10% | 5% |
| Grade 6-8 | 25% | 30% | 15% | 15% | 10% | 5% |

## 作業工程表

| Phase | 作業 | 対象ファイル | 完了条件 |
| :--- | :--- | :--- | :--- |
| 1 | 現行ローテーションの文書化 | `docs/native-english-daily-assignment-schedule.md` | Grade 1-8の固定枠出題週を確認できる |
| 2 | 英語圏デイリー課題専用の週別計画データを作成 | `src/data/nativeEnglishDailyCurriculumPlan.ts` | Grade 1-8、W01-W52の固定枠計画が定義される |
| 3 | `createDailyAssignment` を専用計画データ参照へ変更 | `src/utils/dailyAssignmentUtils.ts` | 英語Gradeでは単純ローテーションではなく週別計画を使う |
| 4 | ELA / Math の不足単元を追加 | `src/nativeEnglishUnitConfig.ts`, `src/data/subjects/native_english_units.ts` | 各GradeでELA 4-6単元、Math 4-6単元になる |
| 5 | Science / Social Studies / Japanese を拡充 | 同上 | 各Gradeで各教科3-4単元になる |
| 6 | Life Skills / Digital Literacy を追加検討 | `src/nativeEnglishUnitConfig.ts`, subject config関連 | 新教科として出すか既存教科配下に入れるか決定 |
| 7 | 問題数を各単元40問以上へ拡充 | `src/data/subjects/native_english_units.ts` | 追加単元も40問相当を満たす |
| 8 | UI表示・翻訳確認 | `src/utils/textUtils.ts`, 各画面 | 初回確認、問題選択、問題チャレンジ、デイリー課題で英語表示が自然 |
| 9 | 検証 | build / ブラウザ確認 | Grade 1-8でデイリー課題が生成され、対象モードに遷移できる |

## Phase 2で作る週別計画の案

専用計画データを作る場合は、次のような構造にする。

```ts
export const NATIVE_ENGLISH_DAILY_WEEKLY_PLANS = {
  1: [
    { week: 1, subjectId: 'NATIVE_ELA', unitId: 'NE_ELA_G1_PHONICS', label: 'ELA: Phonics' },
    { week: 2, subjectId: 'NATIVE_MATH', unitId: 'NE_MATH_G1_NUMBERS', label: 'Math: Number Sense' },
  ],
};
```

`dailyAssignmentUtils.ts` 側では、英語Gradeの場合だけこの計画を参照する。計画に該当単元がない場合は、現在の単純ローテーションにフォールバックすると安全。

## 次の実装優先順位

1. `NATIVE_ENGLISH_DAILY_WEEKLY_PLANS` を作成する。
2. Grade 1-2 の52週計画を先に実装する。
3. Grade 3-5 を追加する。
4. Grade 6-8 を追加する。
5. ELA / Math の単元数を増やし、週別計画に反映する。
6. 追加単元の問題を40問相当に拡充する。
7. Challenge枠に「今週の復習」「苦手補強」「新単元予習」の種別表示を追加する。

# 英語圏児童・生徒向け 教科・単元拡充計画

## 目的

英語圏設定のユーザーが、初回から違和感なく `English-Speaking Students` 向けの問題に入れるように、教科・学年・単元・問題文を英語圏の学校カリキュラムに寄せて拡充する。

対象は Grade 1-8。現行の日本式教科を単純翻訳するのではなく、英語圏で一般的な教科構成として `ELA / Math / Science / Social Studies` を中心に整理する。加えて、日本文化・日本語学習に関心がある英語圏児童向けに `Japanese` も別教科として扱う。

## 現状

実装済みの入口:

- `src/nativeEnglishUnitConfig.ts`
  - `NATIVE_ELA`
  - `NATIVE_MATH`
  - `NATIVE_SCIENCE`
  - `NATIVE_SOCIAL`
  - `NATIVE_JAPANESE`
  - Grade 1-8
  - 各教科・各学年 2単元

- `src/data/subjects/native_english_units.ts`
  - 全90単元に明示的な問題定義を収録済み。
  - `toProblems` 形式の52単元は全単元40問化済み。
  - `conceptUnit` 形式の38単元は各15概念以上、1概念につき2問展開。
  - 現在の明示問題バリエーションは合計3220問相当。
  - `fillToFifty` により各単元は最終的に50問相当に整形される。
  - 未定義単元向けの `fallbackConceptsFor(mode)` は残しているが、現時点で設定済み90単元に未定義フォールバックはない。
  - 各モードは最終的に50問相当に整形される。

- UI
  - 問題選択画面と問題チャレンジ画面に `English-Speaking Students` 切替あり。
  - 英語圏ロケールでは、保存済み手動設定がなければ英語UI + 英語圏問題を初期選択。

## 拡充方針

優先順位は次の順にする。

1. 単元表をGrade 1-8の標準的な範囲に広げる。
2. 各単元を最低10問の手書き問題で開始する。
3. 使用頻度の高い単元から20問、30問、50問へ増やす。
4. 自動補完問題は初期版の穴埋めに留め、主要単元は手書き問題へ置き換える。
5. 音声読み上げに向く短い英文を優先し、Grade 1-3は特に文を短くする。

## 教科別の拡充案

### ELA

Grade 1:

- Phonics: short vowels, long vowels, blends, digraphs
- Sight Words: high-frequency words, sentence completion
- Sentences: capitals, punctuation, complete sentences
- Reading Details: who, what, where, sequence

Grade 2:

- Grammar: nouns, verbs, adjectives, pronouns
- Main Idea and Details
- Prefixes and Suffixes
- Contractions and Plurals

Grade 3:

- Paragraph Structure
- Inference
- Theme and Moral
- Root Words and Context Clues

Grade 4:

- Text Structure
- Point of View
- Figurative Language
- Academic Vocabulary

Grade 5:

- Text Evidence
- Compare and Contrast
- Opinion Writing
- Informative Writing

Grade 6:

- Argument and Claims
- Evidence and Reasoning
- Literature Analysis
- Figurative Language and Tone

Grade 7:

- Literary Analysis
- Research Skills
- Media Literacy
- Source Reliability

Grade 8:

- Rhetoric
- Author's Craft
- Argument Writing
- Source Integration

### Math

Grade 1:

- Number Sense to 120
- Addition and Subtraction within 20
- Shapes
- Time and Money

Grade 2:

- Place Value
- Addition and Subtraction within 100
- Measurement
- Arrays and Equal Groups

Grade 3:

- Multiplication and Division
- Fractions
- Area and Perimeter
- Data and Graphs

Grade 4:

- Multi-Digit Operations
- Fraction Equivalence
- Decimals
- Angles and Lines

Grade 5:

- Fraction Operations
- Decimal Operations
- Volume
- Coordinate Plane

Grade 6:

- Ratios and Rates
- Expressions
- Equations
- Statistics

Grade 7:

- Proportional Relationships
- Integers and Rational Numbers
- Probability
- Scale Drawings

Grade 8:

- Linear Equations
- Functions
- Pythagorean Theorem
- Transformations

### Science

Grade 1:

- Weather
- Living and Nonliving Things
- Light and Sound
- Materials

Grade 2:

- Plant and Animal Needs
- Matter
- Land and Water
- Weather Patterns

Grade 3:

- Life Cycles
- Habitats
- Forces and Motion
- Earth Systems

Grade 4:

- Energy
- Waves
- Earth Changes
- Organisms and Environments

Grade 5:

- Matter and Mixtures
- Ecosystems
- Space Systems
- Engineering Design

Grade 6:

- Cells
- Body Systems
- Earth Science
- Weather and Climate

Grade 7:

- Genetics
- Ecology
- Physical Science
- Energy Transfer

Grade 8:

- Chemistry Foundations
- Space Science
- Earth History
- Forces and Motion

### Social Studies

Grade 1:

- Community
- Rules and Responsibilities
- Citizenship
- Needs and Wants

Grade 2:

- Maps and Globes
- Culture
- Historical Sources
- Local Government

Grade 3:

- Regions
- Communities Over Time
- Government
- Economy

Grade 4:

- Geography
- State and Local History
- Resources and Regions
- Civic Participation

Grade 5:

- U.S. History Foundations
- Native Peoples and Early Colonies
- Civics
- Economics

Grade 6:

- World Geography
- Ancient Civilizations
- Culture and Trade
- Human-Environment Interaction

Grade 7:

- Medieval and Early Modern World
- Global Issues
- Civics
- Comparative Government

Grade 8:

- U.S. History and Constitution
- Rights and Responsibilities
- Government Structure
- Media and Civic Life

### Japanese

英語圏児童向けの日本語学習は、日本語母語児童向けの国語とは分ける。目的は、ひらがな・カタカナ・基本語彙・基礎文法・初歩漢字を、英語UI上で学べるようにすること。

Grade 1:

- Hiragana
- First Words
- Greetings
- Classroom Phrases

Grade 2:

- Katakana
- Loanwords
- Simple Sentences
- Basic Topic Sentences

Grade 3:

- Particles
- Question Words
- First Kanji
- Radicals

Grade 4:

- Verbs
- Polite Forms
- Short Reading Passages
- Daily Actions

Grade 5:

- Adjectives
- Descriptions
- Daily Life Communication
- Preferences and Reasons

Grade 6:

- Connectors
- Longer Sentences
- Culture Notes
- Practical Reading

Grade 7:

- Conversation
- Opinions
- Reading with Kanji
- Everyday Writing

Grade 8:

- Grammar Review
- Nuance
- Media Texts
- Signs and Instructions

## 単元ID設計

既存形式に合わせる。

```ts
u('NE_ELA_G4_STRUCTURE', 'ELA G4: Text Structure and Vocabulary', 'NATIVE_ELA_G4_STRUCTURE')
```

命名ルール:

- unit id: `NE_{SUBJECT}_G{grade}_{TOPIC}`
- mode: `NATIVE_{SUBJECT}_G{grade}_{TOPIC}`
- 表示名: `{Subject} G{grade}: {Readable Topic}`

例:

- `NE_MATH_G6_RATIOS`
- `NATIVE_MATH_G6_RATIOS`
- `Math G6: Ratios and Rates`
- `NATIVE_JAPANESE_G3_KANJI`
- `Japanese G3: First Kanji and Radicals`

## 問題作成ルール

基本形式:

- 4択
- 正解は1つ
- Grade 1-3は短文中心
- Grade 4-8は説明文、推論、資料読解を少しずつ増やす
- ELAは音声読み上げ向けに `audioPrompt` を付けやすい文にする
- Mathは暗算だけでなく、文章題・単位・図形概念を混ぜる
- Scienceは事実暗記だけでなく、観察・分類・原因結果を入れる
- Social Studiesは地域差が強すぎる問題を避け、汎用的な市民・地理・歴史概念を優先する
- Japaneseは英語話者の初学者向けに、問題文・ヒントは英語、答えは必要に応じて日本語文字を使う

避けるもの:

- 国や州に依存しすぎる細かい制度問題
- 宗教・政治的に偏る表現
- 暴力・災害を過度に具体化した問題
- Grade 1-3に長すぎる複文
- ELL向けの翻訳英語っぽい不自然な英文
- 日本語母語児童向けの国語問題をそのまま流用すること

## 問題数の目標

段階的に増やす。

- Phase 1: 各単元 10問（完了）
- Phase 2: 主要単元 20問（完了）
- Phase 3: 全単元 30問（完了）
- Phase 4: 全単元 50問を手書き化

当面は `fillToFifty` による補完を残し、UI上の出題量を確保する。補完された `Review n:` 問題が目立つ単元から優先して手書き問題を増やす。

## 実装済み到達点

2026-07-08時点の到達点:

- 教科: `ELA / Math / Science / Social Studies / Japanese`
- 学年: Grade 1-8
- 単元数: 90単元
- 直接作問単元: 52単元、2080問
  - 40問化済み: 52単元
  - 30問維持: 0単元
- 概念展開単元: 38単元、570概念、1140問バリエーション
- 合計: 3220問バリエーション
- 全単元が30問以上の明示問題バリエーションを持つ
- UI上は `fillToFifty` により各単元50問相当まで補完

Phase 4では、`fillToFifty` のReview補完を減らすため、全90単元を50問相当の完全手書きへ近づける。

## Phase 4進捗

30問から40問へ拡充済みの直接作問単元:

ELA:

- `NATIVE_ELA_G1`
- `NATIVE_ELA_G2`
- `NATIVE_ELA_G3`
- `NATIVE_ELA_G1_LONG_VOWELS`
- `NATIVE_ELA_G1_SIGHT_WORDS`
- `NATIVE_ELA_G2_PREFIX_SUFFIX`

Math:

- `NATIVE_MATH_G1`
- `NATIVE_MATH_G2`
- `NATIVE_MATH_G3`
- `NATIVE_MATH_G1_ADD_SUB_20`
- `NATIVE_MATH_G2_PLACE_VALUE`
- `NATIVE_MATH_G3_FRACTIONS`

Science:

- `NATIVE_SCIENCE_G1`
- `NATIVE_SCIENCE_G2`
- `NATIVE_SCIENCE_G3`
- `NATIVE_SCIENCE_G1_WEATHER`
- `NATIVE_SCIENCE_G2_MATTER`
- `NATIVE_SCIENCE_G1_MATERIALS`
- `NATIVE_SCIENCE_G2_EARTH`
- `NATIVE_SCIENCE_G3_SYSTEMS`
- `NATIVE_SCIENCE_G4_ENERGY`
- `NATIVE_SCIENCE_G4_EARTH`
- `NATIVE_SCIENCE_G5_MATTER`
- `NATIVE_SCIENCE_G5_ECOSYSTEMS`

Social Studies:

- `NATIVE_SOCIAL_G1`
- `NATIVE_SOCIAL_G2`
- `NATIVE_SOCIAL_G3`
- `NATIVE_SOCIAL_G1_NEEDS_WANTS`
- `NATIVE_SOCIAL_G2_MAP_SKILLS`
- `NATIVE_SOCIAL_G1_CITIZENSHIP`
- `NATIVE_SOCIAL_G2_HISTORY`
- `NATIVE_SOCIAL_G3_GOVERNMENT`
- `NATIVE_SOCIAL_G4_GEOGRAPHY`
- `NATIVE_SOCIAL_G4_HISTORY`
- `NATIVE_SOCIAL_G5_US_HISTORY`
- `NATIVE_SOCIAL_G5_CIVICS`

Japanese:

- `NATIVE_JAPANESE_G1`
- `NATIVE_JAPANESE_G1_GREETINGS`
- `NATIVE_JAPANESE_G2`
- `NATIVE_JAPANESE_G2_SENTENCES`
- `NATIVE_JAPANESE_G3`
- `NATIVE_JAPANESE_G3_KANJI`
- `NATIVE_JAPANESE_G4_VERBS`
- `NATIVE_JAPANESE_G4_READING`
- `NATIVE_JAPANESE_G5_ADJECTIVES`
- `NATIVE_JAPANESE_G5_DAILY_LIFE`
- `NATIVE_JAPANESE_G6_CONNECTORS`
- `NATIVE_JAPANESE_G6_CULTURE`
- `NATIVE_JAPANESE_G7_CONVERSATION`
- `NATIVE_JAPANESE_G7_READING`
- `NATIVE_JAPANESE_G8_GRAMMAR`
- `NATIVE_JAPANESE_G8_MEDIA`

Phase 4で追加済みの問題数:

- ELA: 6単元 x 10問 = 60問
- Math: 6単元 x 10問 = 60問
- Science: 12単元 x 10問 = 120問
- Social Studies: 12単元 x 10問 = 120問
- Japanese: 16単元 x 10問 = 160問
- 合計: 520問

## 優先実装順

1. ELA Grade 1-3
2. Math Grade 1-3
3. Science Grade 1-3
4. Social Studies Grade 1-3
5. Japanese Grade 1-3
6. ELA Grade 4-5
7. Math Grade 4-5
8. Science / Social Studies / Japanese Grade 4-5
9. Grade 6-8全教科

理由:

- 低学年は英語圏児童向けUIの第一印象に直結する。
- ELAとMathは利用頻度が高い。
- Grade 6-8は単元語彙が難しく、問題品質チェックに時間がかかる。

## 検収チェックリスト

単元追加時:

- `src/nativeEnglishUnitConfig.ts` に単元がある。
- `src/data/subjects/native_english_units.ts` に対応モードの問題がある。
- `npm run build` が通る。
- 問題選択画面で対象教科・学年・単元が表示される。
- 問題チャレンジ画面で同じ単元が選べる。
- 英語モード時に追加UIが英語表示される。
- 日本語ロケール時に通常問題が初期表示される。
- 英語ロケール時に英語圏問題が初期表示される。

問題品質:

- 正解が1つだけ。
- 選択肢の長さが極端に偏らない。
- ヒントが答えをそのまま言いすぎない。
- Grade相応の語彙。
- Mathの計算結果に誤りがない。
- ScienceとSocial Studiesの事実が一般的で安定している。

## 次に進めるとよい作業

Phase 4の優先順:

1. `toProblems` 形式の直接作問単元を30問から40問へ増やす。（完了）
2. `conceptUnit` 形式の単元を15概念/30問バリエーションから20概念/40問バリエーションへ増やす。
3. 40問化が済んだ単元から、必要に応じて品質レビューと重複調整を行う。
4. 将来50問化へ進める場合は、`fillToFifty` によるReview補完の影響をさらに減らす。

完了済みの短期候補:

- `NATIVE_ELA_G1`
- `NATIVE_ELA_G2`
- `NATIVE_ELA_G3`
- `NATIVE_MATH_G1`
- `NATIVE_MATH_G2`
- `NATIVE_MATH_G3`
- `NATIVE_SCIENCE_G1`
- `NATIVE_SCIENCE_G2`
- `NATIVE_SCIENCE_G3`

次に効果が大きいPhase 4候補:

- `conceptUnit` 形式のELA単元
- `conceptUnit` 形式のMath単元
- `conceptUnit` 形式のScience / Social Studies単元

直接作問単元は40問化が完了したため、次は概念展開単元を40問バリエーションへそろえる。

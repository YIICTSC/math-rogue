# バカンスモード残要素・世界観切替実装仕様

## 1. 目的

高校編・マジック編の `VACATION` 周回を、すでに実装済みの「主人公衣装・マップ背景・戦闘背景・イベントイラスト・イベント/恋愛ボイス」だけで終わらせず、ゲーム全体が最初から最後まで一貫して「夏休み／海辺のバカンス世界」に見える状態へ仕上げる。

本書では、現時点で**追加対応が必要な残要素**を整理する。

### 1.1 本書の対象外（実装済み）

- 高校編・マジック編の主人公Vacation衣装
- マップ背景のVacation切替
- 戦闘背景のVacation切替
- 高校編Vacationイベント90件＋イベントCG
- マジック編Vacation恋愛R1〜R6＋恋愛CG
- Vacationイベント／恋愛ボイス
- Vacation用戦闘背景flavor log

これらは既存実装を維持し、本書では再設計しない。

### 1.2 素材生成方式（改訂）

本書で扱う**すべてのVacation画像素材は、OpenAIの組み込みimagegenで新規生成する**。既存のSTANDARD素材を加工してVacation差分を作る方式は採用しない。

必須ルール：

- 背景、通常敵、humanoidのidle／attack／skill、特殊ボス、エンディングCG、エンドレスCGを含め、各納品画像にimagegenの生成実績を持たせる。
- STANDARD画像を色替え、彩度変更、色調オーバーレイ、合成、トレース、輪郭抽出、単純なリサイズ、既存画像のコピーでVacation画像を作らない。
- STANDARD素材は、必要な場合に限り「キャラクター識別性・構図・シルエットを理解するための参照画像」としてimagegenへ渡す。生成画像の画素を流用する編集ターゲットにはしない。
- 各ファイルに対応するプロンプト、生成日時、生成元ファイル、検査結果を `docs/vacation-imagegen-manifest.json` に記録する。生成元は `imagegen` と明記し、標準素材からの派生処理を生成元にしない。
- 敵スプライトは透明背景をimagegenへ明示し、生成後に背景を抜く加工はしない。PNGからWebPへ変換する場合は、画素内容を変えない納品形式変換としてのみ許可する。
- コンタクトシートは確認用の閲覧資料であり、ゲーム内素材の生成元・納品素材にはしない。
- 既存の色調加工スクリプトで作られたVacation画像は暫定扱いとし、imagegen生成物で順次置換するまで本計画を完了扱いにしない。

したがって、`scripts/generate-vacation-world-assets.mjs` のようにSTANDARD画像を読み込み、色調・波紋・オーバーレイを加えて出力する処理は、最終素材の作成経路として使用禁止とする。

なお、1.1で「対象外」とした既存のイベント／恋愛素材は、切替ロジックの再設計対象外という意味であり、画像の生成方式を例外扱いするものではない。今回のimagegen方針は、それらを含むVacation画像の納品物全体に適用する。

---

## 2. 共通判定

残要素もすべて既存の `player.appearanceMode` を基準にする。

```ts
const isVacationRun =
  player.appearanceMode === 'VACATION'
  && (visualTheme === 'high-school' || visualTheme === 'magic');
```

原則：

- `STANDARD` の見た目・文章・敵画像は一切変更しない。
- `VACATION` のときだけ専用素材／専用文章を選択する。
- 能力値、カード性能、敵HP、敵AI、報酬量、恋愛進行値などゲームバランスは変更しない。
- セーブ再開時も `appearanceMode` だけで同じVacation世界へ復元できる構造にする。
- 小学生編には適用しない。
- 専用素材欠損時は必ずSTANDARD素材へフォールバックし、画像欠損で画面を壊さない。

---

## 3. 残対応の全体一覧

| 優先度 | 要素 | 現状 | Vacation対応方針 |
|---|---|---|---|
| P0 | 店背景・店内文章 | 通常テーマ固定 | 海の家／リゾート売店／魔法露店へ差替え |
| P0 | 宝背景・宝文章 | 通常テーマ固定 | 漂着宝箱／海底宝庫／星砂宝珠へ差替え |
| P0 | 休憩背景・休憩文章 | 保健室固定 | 海辺の休憩所／ホテル／魔法リゾート休息所へ差替え |
| P0 | 報酬画面背景 | 通常報酬背景固定 | 海辺の戦利品受取／魔法リゾート報酬所へ差替え |
| P0 | 敵イラスト | 通常制服・通常魔物 | 全通常敵・人型敵・主要ボスをVacation外見へ差替え |
| P0 | 高校編エンディングCG | 通常学校世界 | Vacation専用エンディングCGへ差替え |
| P0 | マジック編通常エンディングCG | 一部恋愛R6のみVacation済み | 非恋愛／共通終幕もVacation専用へ差替え |
| P0 | 章クリアストーリー文章 | 通常ストーリー | 同じ進行構造のVacation専用ストーリーへ差替え |
| P0 | 最終決戦前後の文章 | 通常校舎・学園基準 | 海辺／旅行／夏の終わり基準へ差替え |
| P1 | イベント画面の背面背景 | CGはVacationだが背面は通常廊下 | Vacationイベント用ベース背景へ差替え |
| P1 | 章クリア画面背景 | 通常／magic-act-clear | Vacation章クリア背景へ差替え |
| P1 | Final Bridge背景 | 通常最終通路 | Vacation最終決戦入口へ差替え |
| P1 | 問題チャレンジ背景 | 通常図書館／選択入口 | 海辺学習スペース／魔法リゾート学習所へ差替え |
| P1 | 初期レリック選択背景・文言 | 通常旅立ち | Vacation出発準備へ差替え |
| P1 | Game Over／クリア後総括文 | 通常の学校冒険 | Vacation周回向け文へ差替え |
| P2 | エンドレスOPENING／TRUE ENDING | 通常深層探索世界 | Vacation版を別シーケンス化 |
| P2 | 図鑑・ギャラリー表示 | 通常敵アート中心 | Vacation取得済み差分を閲覧可能にする |

---

## 4. 店（SHOP）

### 4.1 現状

`src/components/ShopScreen.tsx` は以下を直接参照している。

```text
高校編: sprites/backgrounds/learning-rogue/shop-store.webp
マジック編: sprites/backgrounds/learning-rogue/magic-shop-store.webp
```

また表示文も通常世界のまま。

- 高校編: 「購買部」「いいもの揃ってるよ...」
- マジック編: 「魔法購買部」「結界遠征向けの護符と魔法薬、揃ってるよ」

### 4.2 Vacation案

高校編：

- 海の家を改装した臨時ショップ
- 海辺のコンビニ／売店
- 旅行用品、冷たい飲み物、浮き輪、日焼け止めなどの背景小物
- カードやレリック自体の機能は変更しない

マジック編：

- 星砂の護符を扱う海辺の魔法露店
- リゾートホテル併設の魔法売店
- 貝殻、魔晶、瓶詰めの潮光、魔法薬を環境小物にする

### 4.3 imagegen納品素材

```text
public/sprites/backgrounds/learning-rogue/
  high-school-vacation-shop.webp
  magic-vacation-shop.webp
```

### 4.4 文章差替え例

高校編：

```text
購買部 -> 海辺の臨時売店
「いいもの揃ってるよ...」
-> 「旅先で必要なもの、だいたい揃ってるよ！」
```

マジック編：

```text
魔法購買部 -> 星砂の魔法露店
「結界遠征向けの護符と魔法薬、揃ってるよ」
-> 「海辺用の護符も、星砂の魔法薬も揃ってるよ」
```

---

## 5. 宝（TREASURE）

### 5.1 現状

`src/components/TreasureScreen.tsx` は以下を直接参照している。

```text
高校編: sprites/backgrounds/learning-rogue/treasure-storage.webp
マジック編: sprites/backgrounds/learning-rogue/magic-treasure-vault.webp
```

### 5.2 Vacation案

高校編：

- 砂浜に流れ着いた古い宝箱
- 岩場の洞窟で見つけた旅行者の置き箱
- 海の家の裏に隠された夏祭り景品箱

マジック編：

- 星砂に半分埋まった封印宝珠
- 魔法珊瑚の洞窟に浮く宝珠
- 月光を受けて開く潮汐宝庫

### 5.3 推奨素材

```text
public/sprites/backgrounds/learning-rogue/
  high-school-vacation-treasure.webp
  magic-vacation-treasure.webp
```

### 5.4 文言

機能は変えず、導入文のみVacation化する。

```text
高校編:
「宝箱を発見！」
-> 「浜辺に流れ着いた宝箱を発見！」

マジック編:
「封印宝珠を発見！」
-> 「星砂に眠る封印宝珠を発見！」
```

---

## 6. 休憩（REST）

### 6.1 現状

`src/components/RestScreen.tsx`

```text
高校編: rest-infirmary.webp
マジック編: magic-rest-infirmary.webp
```

### 6.2 Vacation案

高校編：海の見える宿の休憩室、ビーチベンチ、海の家の畳スペース。

マジック編：月光が入るリゾート客室、治癒魔法の浜辺テント、星砂の休息結界。

### 6.3 推奨素材

```text
high-school-vacation-rest.webp
magic-vacation-rest.webp
```

休憩ログも「保健室」「校内」表現を避ける。

---

## 7. 報酬（REWARD）

### 7.1 現状

`src/components/RewardScreen.tsx`

```text
高校編: reward-rooftop.webp
マジック編: magic-reward-sanctuary.webp
```

### 7.2 Vacation案

```text
high-school-vacation-reward.webp
  -> 海辺の展望デッキ／夕方の浜辺で戦利品を確認

magic-vacation-reward.webp
  -> 星砂の祭壇／波打ち際の魔法陣で報酬を受け取る
```

報酬カード、レリック、ゴールド／魔晶の中身は共通。

---

## 8. イベント画面の「背面背景」

イベント**イラスト自体はVacation実装済み**だが、`src/components/EventScreen.tsx` の画面背面は現在も以下の通常素材。

```text
高校編: event-hallway.webp
マジック編: magic-event-hallway.webp
```

イベントCGの外側まで海辺世界に統一するため、以下を追加する。

```text
high-school-vacation-event-base.webp
magic-vacation-event-base.webp
```

高校編は宿／海辺遊歩道、マジック編は夜の魔法海岸をベースにする。

---

## 9. 問題チャレンジ・学習画面背景

`src/components/ProblemChallengeScreen.tsx` には通常テーマの以下背景が残る。

```text
selection-entrance.webp
magic-selection-entrance.webp
compendium-library.webp
magic-compendium-library.webp
```

Vacation周回中に開く学習チャレンジについては、世界観を切らさないため差し替える。

```text
high-school-vacation-challenge-select.webp
high-school-vacation-challenge.webp
magic-vacation-challenge-select.webp
magic-vacation-challenge.webp
```

背景テーマ：

- 高校編：海辺の自習スペース、ホテルのラウンジ、日陰のテラス
- マジック編：星砂の学習テラス、魔法水族館の静かな学習室

---

## 10. 初期レリック選択

`src/components/RelicSelectionScreen.tsx` は現在、通常の `selection-entrance` 系背景を使用している。

Vacation周回開始直後から旅行感を出すため、可能なら `appearanceMode` をpropsへ渡して切り替える。

```text
high-school-vacation-start.webp
magic-vacation-start.webp
```

文言例：

```text
旅の始まり -> 夏休みの旅支度
契約の始まり -> 星海バカンスの旅支度
```

---

## 11. 章クリア画面・ストーリー背景

### 11.1 現状

`src/components/FloorResultScreen.tsx` は、マジック編のみ `magic-act-clear.webp`、高校編は黒ベースUIで進行する。

### 11.2 Vacation対応

```text
high-school-vacation-act-clear.webp
magic-vacation-act-clear.webp
```

Actごとの時間帯を反映する。

```text
Act 1: 昼
Act 2: 午後
Act 3: 夕焼け
Act 4: 夜／花火後
```

必要ならAct別4枚へ拡張してよい。

---

## 12. ストーリー文章のVacation化

### 12.1 現状のストーリー経路

章クリア画面は `FloorResultScreen.tsx` から以下を使用する。

```text
高校編: src/data/highSchoolStories.ts
マジック編: src/data/magicStories.ts
小学生編: src/data/stories.ts
```

現在の高校編ストーリーは30セット、マジック編も30セット存在する。

### 12.2 方針

既存ストーリーID、選択済み `storyIndex`、Act進行は変えず、Vacation時だけ同じ位置のVacation文章を読む。

推奨新規ファイル：

```text
src/data/highSchoolVacationStories.ts
src/data/magicVacationStories.ts
```

構造は既存と同じにする。

```ts
{
  id: 'HS_BLACK_MARKET',
  parts: [
    { title: '...', content: '...' }, // Act1
    { title: '...', content: '...' }, // Act2
    { title: '...', content: '...' }, // Act3
  ]
}
```

### 12.3 高校編ストーリー変換ルール

通常版の「校舎事件」を、その物語の核を残して夏休み旅行中の事件へ置き換える。

例：

```text
通常: 夜の購買部で答案データが売られている
Vacation: 海辺の臨時売店で旅行参加者の成績データが景品交換券として流通している

通常: 文化祭前夜
Vacation: 海辺の夏祭り前夜

通常: 進路室
Vacation: 合宿所の進路相談スペース／旅行先の臨時相談室

通常: 屋上花火
Vacation: 海岸の本物の夏祭り花火。ただし暴走事件としてストーリー化
```

重要：単語置換だけにしない。Vacation版は「学校から離れたからこそ見える人間関係」「旅行の終わり」「夏休みの一日を守る」方向へ意味ごと再構築する。

### 12.4 マジック編ストーリー変換ルール

魔法学園の主筋は残し、舞台を臨海研修／魔法リゾート／星界の海へ移す。

Vacation版の大筋：

```text
Act1: 夏季臨海研修として海辺へ到着。小さな魔力異常が起きる。
Act2: 港町、水族館、夏祭り、灯台などで結界の乱れを追う。
Act3: 夜祭・月光海岸で願いと感情が魔力に干渉し始める。
Act4: 海そのものが星界化。大魔女校長／最終敵との決着へ。
```

恋愛R1〜R6はすでにVacation専用化されているため、章ストーリー側は恋愛イベントの内容を上書きせず、世界の危機と旅行進行を担う。

### 12.5 文章切替実装

`FloorResultScreen.tsx` に `appearanceMode` を渡し、storyPoolを以下のように切り替える。

```ts
if (visualTheme === 'high-school') {
  return appearanceMode === 'VACATION'
    ? HIGH_SCHOOL_VACATION_STORIES
    : HIGH_SCHOOL_STORIES;
}

if (visualTheme === 'magic') {
  return appearanceMode === 'VACATION'
    ? MAGIC_VACATION_STORIES
    : MAGIC_STORIES;
}
```

---

## 13. 敵イラストのVacation化

### 13.1 現状

敵画像は `src/data/visualThemes.ts` の以下関数から解決される。

```text
getThemedHumanoidEnemySpritePath()
getThemedMonsterEnemySpritePath()
```

現在は `visualTheme` のみを見ており、`appearanceMode` は見ていない。

### 13.2 対象数

通常のテーマ敵定義：

```text
高校編 monster: 50
高校編 humanoid: 53
マジック編 monster: 45
マジック編 humanoid: 22
```

人型敵は現在3アクションを持つ。

```text
idle
attack
skill
```

完全にVacation差分を作る場合の基本枚数：

```text
高校編: monster 50 + humanoid 53×3 = 209
マジック編: monster 45 + humanoid 22×3 = 111
合計: 320枚
```

これに特殊ボス差分を追加する。

### 13.3 推奨保存先

```text
public/sprites/high-school/vacation-enemies/{0..49}.webp
public/sprites/high-school/vacation-humanoid-enemies/{0..52}.webp
public/sprites/high-school/vacation-humanoid-enemies-attack/{0..52}.webp
public/sprites/high-school/vacation-humanoid-enemies-skill/{0..52}.webp

public/sprites/magic/vacation-enemies/{0..44}.webp
public/sprites/magic/vacation-humanoid-enemies/{0..21}.webp
public/sprites/magic/vacation-humanoid-enemies-attack/{0..21}.webp
public/sprites/magic/vacation-humanoid-enemies-skill/{0..21}.webp
```

### 13.4 imagegenデザインルール

敵の**識別性・役割・シルエットは参照として維持**しつつ、Vacation世界の衣装・装備・小物・背景をimagegenで新規に描き起こす。単純な色替え、フィルター、既存画像への小物合成は禁止する。

高校編人型敵例：

- 制服 → アロハシャツ、水着＋ラッシュガード、夏合宿ジャージ、祭り法被
- 竹刀 → ビーチパラソル／スイカ割り棒の意匠
- 赤ペン → 旅行チェック表／スタンプ
- 生徒会系 → リゾート運営委員、夏祭り実行委員風
- 校長／真・校長 → リゾート支配人風。ただし威圧感・ボスシルエットは維持

マジック編人型敵例：

- 魔法学園ローブ → サマーローブ、星砂アクセサリ、薄手のマント
- 杖 → 貝殻、珊瑚、灯台、花火、月光をモチーフに改造
- 大魔女校長 → 「星海リゾートを永遠の夏に封じる支配者」風
- 星災の女王 → 星界化した夜の海・月・潮汐魔力を強調

monster例：

- スライム → 波泡／ラムネ／浮き輪モチーフ
- ミミック → クーラーボックス／旅行鞄／浜辺の宝箱
- コウモリ → 夕暮れの浜・花火火花モチーフ
- ゴーレム → 砂像／珊瑚／防波堤石
- 幽霊 → 海霧／肝試し／夜祭りモチーフ

### 13.5 特殊ボス

通常の配列以外に専用描画があるため、別途Vacation差分を用意する。

```text
高校編:
- あずき
- ドドメデス
- ゲンゾー
- 校長
- 真・校長

マジック編:
- 大魔女校長
- 星災の女王
```

特に `EnemyIllustration.tsx` と `App.tsx` では、あずき／ドドメデス／ゲンゾーを通常パスへ直接分岐しているため、ここも `appearanceMode` を渡す必要がある。

### 13.6 実装関数案

```ts
getThemedHumanoidEnemySpritePath(enemy, theme, action, appearanceMode)
getThemedMonsterEnemySpritePath(enemy, theme, appearanceMode)
```

Vacation画像が存在しない場合：

```text
Vacation -> Standard同index -> 最終fallback
```

とする。

---

## 14. 高校編エンディングCGのVacation化

### 14.1 現状

高校編の通常エンディングは `src/data/themedEndingSequences.ts` から、主人公ごとに5トーン×3ページを参照する。

```text
sprites/endings/high-school/{characterId}/ending-{1..5}-{1..3}.webp
```

高校編9主人公の場合、最大：

```text
9人 × 5 ending tone × 3 pages = 135枚
```

### 14.2 Vacation保存先案

```text
public/sprites/endings/high-school-vacation/{characterId}/
  ending-1-1.webp
  ...
  ending-5-3.webp
```

### 14.3 シーン方向性

3ページを次の役割で統一する。

```text
Page1: 最終決戦直後の夜の海岸
Page2: 仲間／旅の記憶／主人公らしい行動
Page3: 夏の朝、帰路または次の旅へ
```

5トーンは既存と同じ `serious / funny / cool / cute / heartfelt` を維持し、セーブ・ギャラリーIDを増やさず見た目と文章だけVacation差分にする。

### 14.4 高校編エンディング文章

通常版の「校門」「校舎」「卒業」の比重を減らし、以下を軸にする。

- 楽しかった夏休みが終わること
- 旅行から日常へ戻ること
- 旅先で得た気づき
- 仲間との夏の思い出
- 「終わるから次へ進める」という締め

---

## 15. マジック編エンディングの残差分

マジック編の恋愛R6 Vacation CG／台詞は実装済み。

ただし以下は別経路なので確認・差替え対象とする。

- 恋愛が成立しなかった通常エンディング
- 共通クリア画面
- Final Bridge前後
- エンドレスOPENING
- エンドレスTRUE ENDING
- 最終総括画面

Vacation版の軸：

```text
夏の海に発生した星界異常を収束
-> 夜明けとともに海が通常世界へ戻る
-> 臨海研修／旅行の最終日
-> 主人公が魔法と人間関係の変化を持ち帰る
```

恋愛成立時は、既存Vacation R6を最優先し、共通終幕が恋愛R6の内容と矛盾しないようにする。

---

## 16. Final Bridge／最終決戦前演出

`src/components/FinalBridgeScreen.tsx` はマジック編で `magic-final-bridge.webp` を固定使用している。

Vacationでは：

```text
high-school-vacation-final-approach.webp
magic-vacation-final-bridge.webp
```

へ切り替える。

高校編：花火の終わった夜の浜から最終会場へ向かう。

マジック編：星界化した海の上に光の道が伸び、巨大な月／最終結界へ続く。

最終決戦前の文章も「校舎最深部」「学園の奥」ではなく、Vacation世界の目的地に書き換える。

---

## 17. Game Over／最終総括文章

Vacation周回中に通常文へ戻ると没入感が切れるため、最低限以下を専用化する。

```text
開始ログ
章移動ログ
大ボス撃破ログ
最終決戦前ログ
クリア総括
Game Over総括
エンドレス移行ログ
```

例：

```text
通常: 冒険が始まった。
Vacation: 夏休みの特別な旅が始まった。

通常: 第2章へ進んだ。体力が全回復した！
Vacation: 海辺の旅は次の目的地へ。第2章へ進んだ。体力が全回復した！
```

`narrativeLog` のゲーム機能上必要な情報（章番号、回復、獲得物）は削らず、前後の世界観文だけ変える。

---

## 18. エンドレスモード

通常周回のVacation完成を優先し、エンドレスは第2段階とする。

### Phase 1

- 既存Vacation map/battle背景を章帯で再利用
- 敵Vacation画像をそのまま使用
- SHOP/REST/TREASURE/REWARDもVacation差分を使用
- 通常のエンドレス文章を最低限Vacation語彙へ変換

### Phase 2

- `EndlessEndingSequenceScreen.tsx`
- `src/data/endlessEndingSequences.ts`
- `src/data/endlessEndingCopyRevision.ts`

にVacation専用OPENING／TRUE ENDINGコピーとCGを追加する。

---

## 19. 実装対象ファイル候補

### 画像・画面切替

```text
src/components/ShopScreen.tsx
src/components/TreasureScreen.tsx
src/components/RestScreen.tsx
src/components/RewardScreen.tsx
src/components/EventScreen.tsx
src/components/FloorResultScreen.tsx
src/components/FinalBridgeScreen.tsx
src/components/ProblemChallengeScreen.tsx
src/components/RelicSelectionScreen.tsx
src/components/EnemyIllustration.tsx
src/components/ThemedEndingSequenceScreen.tsx
src/components/EndlessEndingSequenceScreen.tsx
```

### データ・解決関数

```text
src/App.tsx
src/data/visualThemes.ts
src/data/themedEndingSequences.ts
src/data/highSchoolStories.ts
src/data/magicStories.ts
src/data/endlessEndingSequences.ts
src/data/endlessEndingCopyRevision.ts
src/services/magicEndingService.ts
src/services/assetPreloadService.ts
src/data/magicAssetManifest.ts
```

### 新規推奨

```text
src/data/highSchoolVacationStories.ts
src/data/magicVacationStories.ts
src/data/vacationEnvironmentAssets.ts
```

`vacationEnvironmentAssets.ts` に画面種別→背景パスをまとめると、各React componentへ三項演算子を増やしすぎずに済む。

---

## 20. imagegen素材作成チェックリスト

以下の各項目は、ファイルが存在するだけでは完了としない。imagegenの生成記録、プロンプト、透明背景／画角の検査結果がmanifestに揃っていることを完了条件とする。

### 背景 P0/P1

- [x] high-school-vacation-shop.webp
- [x] magic-vacation-shop.webp
- [x] high-school-vacation-treasure.webp
- [x] magic-vacation-treasure.webp
- [x] high-school-vacation-rest.webp
- [x] magic-vacation-rest.webp
- [x] high-school-vacation-reward.webp
- [x] magic-vacation-reward.webp
- [x] high-school-vacation-event-base.webp
- [x] magic-vacation-event-base.webp
- [x] high-school-vacation-act-clear.webp
- [x] magic-vacation-act-clear.webp
- [x] high-school-vacation-final-approach.webp
- [x] magic-vacation-final-bridge.webp
- [x] high-school-vacation-challenge-select.webp
- [x] high-school-vacation-challenge.webp
- [x] magic-vacation-challenge-select.webp
- [x] magic-vacation-challenge.webp
- [x] high-school-vacation-start.webp
- [x] magic-vacation-start.webp

### 敵

- [x] 高校編 monster 50枚
- [x] 高校編 humanoid idle 53枚
- [x] 高校編 humanoid attack 53枚
- [x] 高校編 humanoid skill 53枚
- [x] マジック編 monster 45枚
- [x] マジック編 humanoid idle 22枚
- [x] マジック編 humanoid attack 22枚
- [x] マジック編 humanoid skill 22枚
- [x] あずきVacation差分
- [x] ドドメデスVacation差分
- [x] ゲンゾーVacation差分
- [x] 校長／真・校長Vacation差分
- [x] 大魔女校長／星災の女王Vacation差分

### エンディング

- [ ] 高校編9主人公×5トーン×3ページ = 最大135枚
- [ ] マジック編非恋愛・共通終幕CG
- [ ] Final Bridge／最終決戦前CG
- [ ] エンドレスOPENING CG（必要ならPhase2）
- [ ] エンドレスTRUE ENDING CG（必要ならPhase2）

### 文章

- [ ] 高校編Vacationストーリー30セット
- [ ] マジック編Vacationストーリー30セット
- [ ] SHOP文言
- [ ] TREASURE文言
- [ ] REST文言
- [ ] REWARD補助文
- [ ] Final Bridge文章
- [ ] 章移動ログ
- [ ] 最終決戦ログ
- [ ] クリア総括
- [ ] Game Over総括
- [ ] エンドレス導入／終幕文（Phase2）

---

## 21. 実装順

### Phase A：世界の穴を塞ぐ

1. SHOP / TREASURE / REST / REWARD 背景
2. EventScreen背面
3. FloorResult / FinalBridge背景
4. 各画面の短い文言

この段階で「Vacationなのに突然校舎へ戻る」箇所をなくす。

### Phase B：imagegenで敵をVacation化

1. imagegenでmonster通常敵を新規生成
2. imagegenでhumanoid idleを新規生成
3. imagegenでhumanoid attack／skillを新規生成
4. imagegenで校長系ボスを新規生成
5. imagegenであずき／ドドメデス／ゲンゾーを新規生成

画像不足時のSTANDARD fallbackを先に実装し、素材を途中追加できるようにする。

### Phase C：ストーリー

1. 高校編30ストーリー
2. マジック編30ストーリー
3. 章移動・最終決戦ログ
4. FloorResultへの `appearanceMode` 接続

### Phase D：エンディング

1. 高校編Vacation ending 135枚＋文章
2. マジック編共通終幕
3. Game Over／クリア総括
4. エンドレス版

---

## 22. 完了条件

Vacation周回について、以下をすべて満たした時点を完成とする。

- [ ] マップからSHOPへ入っても通常校舎背景へ戻らない
- [ ] TREASUREへ入っても通常倉庫／通常宝庫へ戻らない
- [ ] RESTへ入っても通常保健室へ戻らない
- [ ] REWARDへ入っても通常屋上／通常聖域へ戻らない
- [ ] イベントCG周囲の背景もVacation
- [ ] 全通常敵がVacation差分を表示
- [ ] 人型敵のidle/attack/skillがすべてVacation
- [ ] 主要ボスもVacation
- [ ] 高校編章ストーリーがVacation専用
- [ ] マジック編章ストーリーがVacation専用
- [ ] 最終決戦前文章がVacation専用
- [ ] 高校編エンディングCG・文章がVacation専用
- [ ] マジック編の恋愛以外の終幕もVacation専用
- [ ] STANDARD周回へVacation素材・文章が混ざらない
- [ ] セーブ再開後も同じappearanceModeで復元
- [ ] 素材欠損時はSTANDARDへ安全にfallback
- [ ] Web/native preload・asset manifestへ必要素材を追加
- [ ] 専用監査でSTANDARD/VACATIONのパス混在が0件
- [ ] 全Vacation画像の生成元が `imagegen` としてmanifestに記録されている
- [ ] 色調加工・オーバーレイ・STANDARD画像の画素流用を生成工程から排除している
- [ ] imagegen生成物だけでコンタクトシートを再生成できる

---

## 23. 最終的なVacation体験の流れ

```text
主人公選択（Vacation衣装）
  ↓
Vacation出発準備／レリック選択
  ↓
Vacation専用マップ
  ↓
Vacation敵＋Vacation戦闘背景
  ↓
Vacationイベント＋CG＋ボイス
  ↓
Vacation店／休憩／宝／報酬
  ↓
Vacation章ストーリー
  ↓
夏の終わりに近づくマップ／文章
  ↓
Vacation最終決戦入口
  ↓
Vacationボス
  ↓
VacationエンディングCG・文章
  ↓
日常へ帰る／次の夏へつながる余韻
```

目標は、`VACATION` を単なる衣装スキンではなく、**同じゲームシステムを使いながら世界・敵・文章・終幕まで丸ごと夏休み版へ切り替わる「別周回」**として成立させること。

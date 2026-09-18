# バカンスモード専用背景・イベント実装仕様書

## 1. 目的

高校編・マジック編で主人公選択時に `VACATION` を選んだ周回を、衣装差分だけではなく「専用の旅」として成立させる。

対象は次の4点。

1. 高校編・マジック編のマップ背景を、各編オリジナルのビーチ／海辺リゾート背景へ切り替える。
2. 戦闘背景も各編専用のバカンス背景へ切り替え、戦闘開始時などのログ文を夏休み・旅行・海辺の空気に合わせる。
3. 高校編の `?` マス用に、バカンス専用イベントを90件用意する。
4. マジック編の恋愛イベントR1〜R6を、進行値を維持したままバカンス専用シーン・専用CG・専用セリフへ差し替える。

この仕様は `docs/vacation-mode-protagonist-visual-plan.md` の「バカンスモードは見た目のみ」という初期仕様を拡張する。能力値、初期デッキ、カード性能、敵の強さ、報酬倍率、恋愛好感度の計算式は変更せず、**背景・イベント内容・ログ・演出素材をバカンス専用へ切り替える**。

## 2. 発動条件

実装上の共通判定は、既存の周回状態をそのまま利用する。

```ts
const isVacationRun =
  player.appearanceMode === 'VACATION'
  && (visualTheme === 'high-school' || visualTheme === 'magic');
```

- 高校編の `VACATION` は高校編専用背景・高校編バカンス90イベントを使用する。
- マジック編の `VACATION` はマジック編専用背景・バカンス恋愛イベントを使用する。
- セーブ再開時も `player.appearanceMode` に従い、同じ背景・イベント体系へ戻る。
- 古いセーブで `appearanceMode` がない場合は既存どおり `STANDARD` として扱う。
- 小学生編には適用しない。

### 2.1 既存実装との接続点

| 役割 | 現行ファイル | バカンス対応 |
|---|---|---|
| 周回の衣装モード保存 | `src/App.tsx`, `src/types.ts` | 既存 `player.appearanceMode` をそのまま利用 |
| マップ背景 | `src/components/MapScreen.tsx` | `player.appearanceMode` を見てVacation mapを優先 |
| 戦闘背景・戦闘開始ログ | `src/data/battleBackgrounds.ts` | HS/MagicそれぞれVacation scene配列を追加 |
| 戦闘背景決定 | `src/App.tsx` | `chooseBattleBackgroundScene` に `appearanceMode` を渡す |
| 戦闘背景表示 | `BattleScene.tsx`, `TypingBattleScene.tsx` | `getBattleBackgroundSceneById` に `appearanceMode` を渡す |
| 高校編通常イベント | `src/data/visualThemes.ts`, `src/services/eventService.ts` | Vacation時は専用90件のpoolを選択 |
| イベントCG表示 | `src/components/EventScreen.tsx` | Vacation用 `imageKey` と保存先を解決 |
| マジック恋愛 | `src/services/magicRomanceEventService.ts` | 進行値共通のままVacation dialogue/image/voiceへ差替え |
| マジック恋愛台詞 | `src/data/magicRomanceDialogue.ts` | 通常版は保持し、新規Vacationデータを分離 |
| マジックイベント音声 | `src/services/audioService.ts` | 既存 `playMagicEventVoiceSequence` を再利用 |
| 高校編音声 | `src/services/audioService.ts` | 既存 `playHighSchoolVoiceFile` を再利用 |
| 先読み | `src/services/assetPreloadService.ts`, `src/data/magicAssetManifest.ts` | Vacation map/battle/event/romance素材を追加 |

## 3. 素材ID・保存先

### 3.1 マップ背景

```text
public/sprites/backgrounds/learning-rogue/
  high-school-vacation-map-act1.webp
  high-school-vacation-map-act2.webp
  high-school-vacation-map-act3.webp
  high-school-vacation-map-act4.webp
  magic-vacation-map-act1.webp
  magic-vacation-map-act2.webp
  magic-vacation-map-act3.webp
  magic-vacation-map-act4.webp
```

現行map画像は縦長（例: `864x1821`）。生成時は**9:19前後の縦長**を基準にし、最終書き出しは `864x1821 WebP` を目安とする。

### 3.2 戦闘背景

```text
public/sprites/backgrounds/learning-rogue/
  high-school-vacation-battle-beach.webp
  high-school-vacation-battle-boardwalk.webp
  high-school-vacation-battle-beach-house.webp
  high-school-vacation-battle-seaside-station.webp
  high-school-vacation-battle-lookout.webp
  high-school-vacation-battle-resort-pool.webp
  high-school-vacation-battle-tide-cave.webp
  high-school-vacation-battle-night-stage.webp

  magic-vacation-battle-beach.webp
  magic-vacation-battle-aquarium.webp
  magic-vacation-battle-tidepool.webp
  magic-vacation-battle-boardwalk.webp
  magic-vacation-battle-lighthouse.webp
  magic-vacation-battle-summer-shrine.webp
  magic-vacation-battle-resort-stage.webp
  magic-vacation-battle-astral-shore.webp
```

現行戦闘背景に合わせて `1536x864`、16:9、WebPを基準とする。

### 3.3 高校編VacationイベントCG

```text
public/sprites/high-school/events/vacation/000.webp
...
public/sprites/high-school/events/vacation/089.webp
```

- `HSV001 -> 000.webp`
- `HSV090 -> 089.webp`
- `imageKey: high-school-vacation-event-{0..89}`
- 生成マスターは正方形 `768x768` 以上を推奨。既存高校イベントCGも正方形なので、EventScreenのレイアウトを維持する。

### 3.4 マジック編Vacation恋愛CG

```text
public/sprites/magic/events/romance/vacation/{heroineId}/{maleTargetId}/r1.webp
...
public/sprites/magic/events/romance/vacation/{heroineId}/{maleTargetId}/r5.webp
public/sprites/magic/events/romance/vacation/{heroineId}/{maleTargetId}/r6-bond.webp
public/sprites/magic/events/romance/vacation/{heroineId}/{maleTargetId}/r6-special.webp
public/sprites/magic/events/romance/vacation/{heroineId}/{maleTargetId}/r6.webp
public/sprites/magic/events/romance/vacation/{heroineId}/{maleTargetId}/r6-true.webp
```

正規のペア順は**女性キャラクターIDを先、男性キャラクターIDを後**とする。

- R1〜R5: 9ヒロイン × 8男性 × 5段階 = **360枚**
- R6: 72ペア × `BOND / SPECIAL / ROMANCE / TRUE_ROMANCE` 4種 = **288枚**
- 完全差し替え時の最大合計は **648枚**
- 男性主人公から女性を選ぶ場合も、同じ正規ペアCGを再利用する。男女の視点を反転しただけの重複CGは作らない。
- R1〜R5 `imageKey: magic-romance-vacation:{heroineId}:{maleTargetId}:r{1..5}`
- R6は `getMagicRomanceEndingText` / `magicEndingService.ts` 側でVacationパスを解決する。
- R6の `ROMANCE` は `r6.webp`、それ以外は現行命名に合わせ `r6-bond.webp` / `r6-special.webp` / `r6-true.webp`。

## 4. マップ背景仕様

### 4.1 高校編

高校編は「高校生たちの夏休み旅行」。現実寄りの日本の海辺を軸にし、部活・友人・旅先の高校生らしい空気を残す。

| Act | ファイル | 内容 |
|---|---|---|
| 1 | `high-school-vacation-map-act1.webp` | 朝〜昼の明るい海岸。砂浜、海の家、遊歩道、海沿い駅、宿への道 |
| 2 | `high-school-vacation-map-act2.webp` | 真夏のリゾート海岸。ホテル、プール、水族館、港、商店街へ枝分かれ |
| 3 | `high-school-vacation-map-act3.webp` | 夕焼けの海辺。夏祭り、提灯、桟橋、灯台、花火会場へ続く道 |
| 4 | `high-school-vacation-map-act4.webp` | 星が見える夜の海岸。岬、夜の浜、消えかけた祭り灯り、最終決戦へ向かう一本道 |

**高校編map共通生成プロンプト**

```text
Japanese anime game map background for a high-school summer vacation adventure.
Vertical 9:19 composition, designed behind a roguelike node map.
Japanese seaside resort, bright beach, coastal paths, small station, beach house, hotel and summer travel atmosphere.
No people, no characters, no text, no logo, no UI, no watermark.
Keep the center and main route areas readable behind map nodes; avoid tiny high-contrast clutter.
Clear foreground, middle ground and distant sea/sky layers.
Healthy, nostalgic, cheerful high-school summer vacation mood.
```

各Actの「内容」を最後に追加して生成する。

### 4.2 マジック編

マジック編は「魔法学園の夏休み」。海・リゾートを土台に、星、月、結界、魔法珊瑚、星界の海など既存属性を自然に混ぜる。

| Act | ファイル | 内容 |
|---|---|---|
| 1 | `magic-vacation-map-act1.webp` | 海沿いリゾート到着。魔法学園の臨海施設、昼の浜、駅、宿、星砂の遊歩道 |
| 2 | `magic-vacation-map-act2.webp` | 港町から魔法水族館、夏の神社、灯台へ分岐する夕暮れの海辺 |
| 3 | `magic-vacation-map-act3.webp` | 夜祭と花火。月光海岸の沖に薄い魔力亀裂が見え、恋と危機が同居する |
| 4 | `magic-vacation-map-act4.webp` | 星界化した海。水上の光路、岬、巨大な月、最終結界へ続くクライマックス |

**マジック編map共通生成プロンプト**

```text
Japanese anime magical academy game map background for Magic Vacation Mode.
Vertical 9:19 composition, designed behind a roguelike node map.
Magical Japanese seaside summer vacation resort, luminous sea, star sand, moonlight, subtle elemental magic and protective barriers.
No people, no characters, no text, no logo, no UI, no watermark.
Keep playable node areas readable; avoid excessive small bright particles behind UI.
Polished cel-shaded fantasy background, strong depth separation, warm summer adventure with gentle magical wonder.
```

### 4.3 エンドレス時

Vacation周回ではエンドレス用の通常校舎背景へ戻さない。専用の深度背景を追加するまでは、章帯に応じてVacation Act背景を段階的に切り替える。

```text
01-10 -> act1
11-20 -> act2
21-30 -> act3
31-40 -> act4
41+   -> act4
```

## 5. 戦闘背景仕様

### 5.1 高校編 Vacation battle scenes

既存の8 scene枠に対応させ、選出ロジックを大きく変えずに画像とflavor textだけVacation配列から取得できるようにする。

| scene ID | 画像 | 戦場 |
|---|---|---|
| `classroom` | `high-school-vacation-battle-beach.webp` | 昼の砂浜。波打ち際と遠いパラソル |
| `library` | `high-school-vacation-battle-boardwalk.webp` | 海沿いボードウォーク |
| `science-lab` | `high-school-vacation-battle-beach-house.webp` | 海の家横の広場 |
| `hallway` | `high-school-vacation-battle-seaside-station.webp` | 海沿いの小さな駅前 |
| `rooftop` | `high-school-vacation-battle-lookout.webp` | 灯台へ続く岬の展望台 |
| `courtyard` | `high-school-vacation-battle-resort-pool.webp` | リゾートプール脇のデッキ |
| `music-room` | `high-school-vacation-battle-tide-cave.webp` | 潮だまりと浅い海食洞 |
| `gym` | `high-school-vacation-battle-night-stage.webp` | 夜の浜辺・花火跡の特設広場。BOSS優先 |

**高校編戦闘背景共通プロンプト**

```text
Polished Japanese anime RPG battle background, high-school summer vacation at a Japanese seaside resort.
16:9, 1536x864, no people, no characters, no text, no UI, no watermark.
Wide unobstructed combat floor in the lower center for player and enemies.
Clear foreground/midground/background separation, readable silhouettes, bright but not overexposed.
Healthy youthful vacation atmosphere; beach, resort, travel and summer-festival details only as environment.
```

### 5.2 高校編 battle flavor texts

各sceneからseedで1文選ぶ。

| scene | flavorTexts |
|---|---|
| beach | 「潮風が制服の代わりに夏の匂いを運び、砂浜の空気が一気に張りつめた。」 / 「波が引いた瞬間、足元の砂に戦いの間合いができた。」 / 「遠くの海の家から聞こえる声を背に、夏休みらしくない勝負が始まる。」 |
| boardwalk | 「海沿いの木道に足音が響き、潮騒の向こうから敵の気配が近づく。」 / 「アイスの看板が揺れる横で、のんびりした遊歩道が戦場へ変わった。」 / 「夕日に光る手すりの先で、逃げずに向き合う相手が待っている。」 |
| beach-house | 「焼きそばの香りが残る広場で、椅子を避けながら身構えた。」 / 「冷たい飲み物の氷が鳴り、休憩の空気が一瞬で消える。」 / 「海の家ののれんが風に跳ね、次の一手を急かしている。」 |
| seaside-station | 「ホームの向こうに海が見える。次の電車より先に、この勝負を終わらせる。」 / 「発車ベルの余韻の中、駅前の静けさが妙に緊張している。」 / 「旅行鞄を置き、潮風の吹く駅前で戦う準備を整えた。」 |
| lookout | 「岬を渡る強い風が、疲れも迷いもまとめて吹き飛ばそうとする。」 / 「水平線まで見える場所で、背後にはもう逃げ道がない。」 / 「灯台の白い壁を背に、夏空の下で正面から向き合った。」 |
| resort-pool | 「水面の反射が揺れ、プールサイドの明るさとは裏腹に空気が鋭くなる。」 / 「デッキに残った水滴を踏まないよう、足場を確かめて構えた。」 / 「休暇の歓声が遠のき、聞こえるのは水音と互いの呼吸だけになった。」 |
| tide-cave | 「潮だまりの青い光が洞の天井へ反射し、影が大きく揺れる。」 / 「足元を流れる浅い水を避けながら、相手との距離を測った。」 / 「涼しい洞窟の奥で、波音が戦いの合図のように響いた。」 |
| night-stage | 「祭りの灯りが消えかけた浜で、最後の花火より大きな勝負が始まる。」 / 「夜の海が真っ黒に広がり、足元の砂だけが月明かりに白い。」 / 「楽しかった一日の終わりを守るため、浜辺の中央へ一歩踏み出した。」 |

### 5.3 マジック編 Vacation battle scenes

| scene ID | 画像 | 戦場 |
|---|---|---|
| `classroom` | `magic-vacation-battle-beach.webp` | 星砂と薄い魔法陣が浮かぶ昼の浜 |
| `library` | `magic-vacation-battle-aquarium.webp` | 巨大水槽の前。青い魔力が水中を流れる |
| `science-lab` | `magic-vacation-battle-tidepool.webp` | 結晶化した潮だまり |
| `hallway` | `magic-vacation-battle-boardwalk.webp` | 夕暮れの魔法遊歩道 |
| `rooftop` | `magic-vacation-battle-lighthouse.webp` | 月光の灯台・強い海風 |
| `courtyard` | `magic-vacation-battle-summer-shrine.webp` | 提灯と結界のある夏の神社 |
| `music-room` | `magic-vacation-battle-resort-stage.webp` | 海辺の野外ステージ・幻奏光 |
| `gym` | `magic-vacation-battle-astral-shore.webp` | 星界化した海岸。Act4/BOSS優先 |

**マジック編戦闘背景共通プロンプト**

```text
Polished anime magical RPG battle background, Japanese seaside summer vacation, Magic Vacation Mode.
16:9, 1536x864, no people, no characters, no text, no UI, no watermark.
Wide readable combat floor, strong foreground/midground/background separation.
Subtle magical barrier integrated with ocean, moonlight, stars and elemental motifs.
Vacation atmosphere remains visible even in dangerous scenes; cinematic but UI-friendly.
```

### 5.4 マジック編 battle flavor texts

| scene | flavorTexts |
|---|---|
| beach | 「星砂が足元で淡く光り、潮風に揺れた結界が戦いの形へ組み上がる。」 / 「明るい浜辺に魔力の輪が走り、楽しいだけでは終わらない夏が始まった。」 / 「波打ち際の光粒が杖へ集まり、海と魔法が同時に息をする。」 |
| aquarium | 「大水槽の青い光が床へ揺れ、魚影の向こうで魔力が膨らんだ。」 / 「静かな水族館に結界音が響き、展示室が一瞬で戦場へ変わる。」 / 「クラゲの光と魔法陣が重なり、青い影の中で互いの位置を確かめた。」 |
| tidepool | 「潮だまりの水が結晶へ変わり、足元に小さな魔法陣がいくつも開く。」 / 「貝殻の間を走る光が一本につながり、封じられた魔力を目覚めさせた。」 / 「波が引くたび結晶の色が変わり、次の術式を知らせている。」 |
| boardwalk | 「夕焼けの遊歩道に光の線が伸び、海側の結界だけが不自然に揺れた。」 / 「潮風がリボンのように魔力を運び、木道の先で敵意が形になる。」 / 「旅のざわめきが遠のき、夕暮れの海と魔法の足音だけが残った。」 |
| lighthouse | 「灯台の光が月を横切り、風の中に巨大な術式が浮かび上がる。」 / 「岬を叩く潮風の中、杖の光だけがまっすぐ相手を指した。」 / 「眼下の海が銀色に光り、逃げ場のない空の下で結界が閉じる。」 |
| summer-shrine | 「提灯の灯りに紛れて封印札が舞い、祭りの境内が静かに閉ざされた。」 / 「鈴の音が一度鳴ると、石畳へ星と月の紋様が広がった。」 / 「屋台の灯りの向こうで結界が軋み、楽しい夜を守る戦いが始まる。」 |
| resort-stage | 「無人のステージに幻奏の光が走り、海風が幕の代わりに揺れた。」 / 「照明が一つずつ灯り、誰もいない客席へ魔力の音が広がっていく。」 / 「波音と旋律が重なり、夏の舞台が決闘のステージへ変わった。」 |
| astral-shore | 「星界の海が夜空とつながり、水平線そのものが巨大な結界になった。」 / 「祭りの灯りが消え、海上に立ち上がる光の壁だけが世界を照らす。」 / 「ここまでの夏を終わらせないため、星の波打ち際で最後の魔力を解放する。」 |

## 6. マップ・戦闘ログの文体

数値、カード名、敵名、状態異常名などゲーム上の機械情報は変えない。周囲の情景、導入、余韻だけをVacation文体へ切り替える。

### 6.1 高校編ログ例

- 周回開始: 「荷物を肩に掛け、いつもの校門ではなく海へ続く夏休みの道へ踏み出した。」
- マップ移動: 「潮風に背中を押され、次の寄り道へ向かった。」
- 通常戦: 「砂浜の向こうで、のんびりした空気に似合わない相手が道を塞いだ。」
- ELITE: 「にぎやかな海辺の音が遠のく。簡単には通してくれない相手が待っている。」
- BOSS: 「楽しかった一日の景色を背に、夏休み最大の勝負が始まる。」
- 勝利: 「張りつめていた空気がほどけ、潮騒がまた夏休みの音へ戻った。」
- REST: 「日陰に腰を下ろし、冷たい飲み物と波音で息を整えた。」
- EVENT: 「予定表にはない寄り道が、いちばん夏休みらしい気がした。」

### 6.2 マジック編ログ例

- 周回開始: 「魔法具を旅行鞄へ詰め、星砂の浜へ続く臨海遠征に出発した。」
- マップ移動: 「潮風に混じる魔力をたどり、次の海辺の結界へ進んだ。」
- 通常戦: 「潮風が結界を揺らす。楽しいだけでは終わらない夏が始まる。」
- 変身: 「変身完了。夏空の下で魔法核がきらめいた！」
- ターン終了: 「潮騒の向こうで、結界反動が静かに返ってくる。」
- REST: 「木陰と波音に身を預け、乱れた魔力を整えた。」
- SHOP: 「海辺の魔法雑貨店が、今日だけの品を並べている。」
- EVENT: 「予定を少し外れると、潮風の中から誰かの声が聞こえた。」
- ELITE: 「潮風が止まった。浜辺を塞ぐ強い魔力が近い。」
- BOSS: 「祭りの灯りが消え、海上に巨大な結界が立ち上がった。」

トーン目安は、高校編「明るい旅8：小さなトラブル2」、マジック編「明るい夏7：魔法の不穏3」。マジックAct4と朔夜関連のみ不穏を強める。

## 7. 高校編Vacationイベント共通仕様

### 7.1 データ構造案

```ts
type HighSchoolVacationEvent = {
  id: `HSV${string}`;       // HSV001..HSV090
  title: string;
  description: string;
  imageIndex: number;         // 0..89
  category: string;
  voiceCue: VacationVoiceCue;
  choices: Array<{
    label: string;
    effectIntent: string;     // 企画上の意図
    resultLog: string;
  }>;
};
```

下表にある `Bond`、`Mood`、`Focus` 等は新しい永続ステータス名ではなく**効果意図**。実装時は既存 `HighSchoolEffect` に割り当てる。

| 効果意図 | 既存効果への主な割当 |
|---|---|
| Mood / Rest / Safety | `heal` |
| Focus / Knowledge / Skill | `upgrade` / `skillCard` |
| Trust / Help / Work reward | `gold` / `potion` |
| Challenge / High reward | `strength` / `momentum` / `maxHp` |
| Item / Collection | `potion` または既存イベント報酬 |
| Bond / Romance / Memory | 数値化せず、回復・強化・Gなど既存報酬＋専用resultLogで表現 |

高校編に恋愛進行値を新設しない。相合傘、半分こ、夜の会話などは年齢相応の夏休み描写として扱う。

### 7.2 高校編イベントCG共通プロンプト

```text
Square Japanese anime event CG for 学習ローグ 高校編 Vacation Mode.
High-school students on a wholesome Japanese summer vacation at a beach, seaside resort, local trip or summer festival.
Use the event row's location, premise and action as the central storytelling beat.
Age-appropriate, healthy, non-sexualized. No body-emphasis, no suggestive pose.
Keep established protagonist designs when a protagonist appears; otherwise use generic classmates without resembling a specific copyrighted character.
Bright readable composition, strong facial expression and hand/action storytelling.
No text, no speech balloons, no logo, no UI, no watermark.
Square composition, production master 1024x1024 or larger, WebP delivery.
```

カテゴリ別に追加する語:

- Beach: `sunny beach, waves, beach house, sea breeze, bright cyan sky`
- Resort: `Japanese seaside hotel, pool deck, lounge, travel luggage, relaxed summer light`
- Travel: `coastal train, local shopping street, bus, bridge, station, travel atmosphere`
- Festival: `yukata, lanterns, stalls, local summer festival, warm evening light`
- Marine: `aquarium, tide pool, harbor, kayak, lighthouse, marine blue lighting`
- Summer Night: `fireworks, stars, fireflies, rooftop terrace, gentle night breeze`
- Rainy Day: `summer rain, hotel lobby, cafe window, museum, wet street reflections`
- Rest: `quiet hotel room, travel notebook, postcards, relaxed indoor summer afternoon`
- Mixed Vacation: `mountain resort, orchard, craft studio, ferry, morning market, wind chimes`

## 8. 高校編Vacationボイス

90イベントそれぞれに長い専用会話を作るのではなく、9主人公×6反応キュー=54本のVacation反応ボイスを用意し、イベントの内容に合わせて呼び分ける。これにより全90イベントで主人公の声を出しつつ、生成・容量・管理を抑える。

保存先:

```text
public/sfx/high-school-voices/{HERO_ID}/vacation-relax.ogg
public/sfx/high-school-voices/{HERO_ID}/vacation-cheer.ogg
public/sfx/high-school-voices/{HERO_ID}/vacation-discovery.ogg
public/sfx/high-school-voices/{HERO_ID}/vacation-help.ogg
public/sfx/high-school-voices/{HERO_ID}/vacation-challenge.ogg
public/sfx/high-school-voices/{HERO_ID}/vacation-night.ogg
```

既存 `docs/high-school-voice-lines.md` の声質・話速・年齢感を必ず維持する。

| ID | relax | cheer | discovery | help | challenge | night |
|---|---|---|---|---|---|---|
| WARRIOR | 「たまには、こういう寄り道も悪くないな。」 | 「よし、夏休みらしく派手に楽しもうぜ！」 | 「お、なんだこれ。面白そうじゃん。」 | 「困ってるなら放っとけない。行くぞ。」 | 「勝負なら受けて立つ。海でも負けねえ！」 | 「昼とは別の場所みたいだな。少しだけ見ていこうぜ。」 |
| CARETAKER | 「波の音を聞いてると、ゆっくりできるね。」 | 「せっかくだし、みんなで楽しもう。」 | 「見て。ここにも小さな生き物がいるよ。」 | 「大丈夫？　一緒にやればすぐ終わるよ。」 | 「観察してから動けば、きっとうまくいく。」 | 「夜の海って、生き物の気配まで違って聞こえるね。」 |
| ASSASSIN | 「静かね。波の音なら、考えも隠してくれる。」 | 「こういう賑やかさも……嫌いじゃないわ。」 | 「面白いものを見つけた。少し調べましょう。」 | 「手を貸すわ。見過ごす方が面倒だもの。」 | 「勝負？　いいわ。油断しないことね。」 | 「夜風が涼しい。もう少しだけ、ここにいましょう。」 |
| MAGE | 「休息も実験の再現性には必要だよ。」 | 「夏限定の反応、試してみたくなるね。」 | 「これは興味深い。条件を記録しておこう。」 | 「手順を分ければ解決できる。私もやるよ。」 | 「比較条件は同じ。なら、結果で勝負しよう。」 | 「夜は温度も湿度も変わる。観測にはちょうどいい。」 |
| DODGEBALL | 「休む時は休む。後半も走るからな！」 | 「来た来た、夏休みって感じだ！」 | 「お、あれ面白そうじゃん。見に行こうぜ！」 | 「荷物なら持つ。こういうのはチームプレーだろ。」 | 「一本勝負だ！　砂浜でも全力で行くぜ！」 | 「夜の海もいいな。クールダウンにちょうどいい。」 |
| BARD | 「ただいま休憩時間です。波音をお楽しみください。」 | 「本日のバカンス、ただいま最高記録を更新中です！」 | 「現場で新しい発見です。確認に向かいます！」 | 「困っている人を確認。サポートへ入ります。」 | 「それでは夏の特別企画、勝負スタートです！」 | 「夜の海からお送りします。音量は少し控えめで。」 |
| LIBRARIAN | 「この景色、栞に挟んで持ち帰れたらいいのに。」 | 「楽しい章になりそうです。続きを見に行きましょう。」 | 「知らない頁を開くみたいで、少しわくわくします。」 | 「手伝います。物語は一人で進めなくてもいいですから。」 | 「勝負の結末、最後まで読ませてもらいます。」 | 「夜の海は静かな短編みたいですね。」 |
| CHEF | 「海で食う飯は二割増しでうまい。まずは休め！」 | 「よし、夏のメニュー全部楽しむぞ！」 | 「おっ、うまそうな匂い……じゃなくて、面白そうだな！」 | 「人手が要るなら任せろ。手早く片付けるぞ！」 | 「勝負なら火力全開だ。いい夏にしようぜ！」 | 「夜風が気持ちいいな。締めの一品が欲しくなる。」 |
| GARDENER | 「潮風に当たりながら休むのも、いい時間だね。」 | 「夏の花みたいに、今日は思いきり楽しもう。」 | 「見て、この土地ならではの植物が育ってる。」 | 「一緒にやろう。少しずつなら大丈夫だよ。」 | 「じっくり育てた力で勝負しよう。」 | 「夜に咲く花もあるんだ。静かに見ていこうか。」 |

**音声生成共通指示**

```text
Japanese high-school game character voice.
Keep the established voice identity from docs/high-school-voice-lines.md.
Age 16-18 impression, clear game-ready delivery, natural Japanese, one short line.
Vacation mood: relaxed and bright, but do not turn the character into a different personality.
No sensual acting, whispering for intimacy, exaggerated adult seduction or alcohol-like mood.
Clean dry voice, no BGM, no environmental sound, no reverb tail.
```

## 9. 高校編Vacationイベント90件

凡例: `I/V` はイラスト/短い反応ボイスの制作優先度。 `○` は専用素材推奨、`△` はカテゴリ共通CGや汎用Vacationキューでも成立する。最終版で全90CGを作る場合も、下表の場面・前提をそのまま個別生成指示に使える。

### 9.1 Beach — HSV001〜HSV010

| ID | タイトル | 場面・前提 | 選択肢フック / 効果意図 | バカンスログ | I/V |
|---|---|---|---|---|---|
| HSV001 | 朝いちばんの砂浜 | 早朝の浜で漂着した小瓶を見つける。中は旅行者のメモ。 | 読む→Focus / 管理所へ→Trust / 皆で返事を書く→Bond | 「潮風の中で、小さな物語を拾った。」 | ○/△ |
| HSV002 | 砂の城コンテスト | 海辺の即席チーム戦。制限時間内に砂の城を作る。 | 設計役→Focus / 装飾役→Bond / 勝負に徹する→Reward | 「波が来る前に、最高の城を。」 | ○/△ |
| HSV003 | なくしたビーチボール | 子どものボールが沖寄りへ流れ、監視員が回収を始める。 | 監視員を手伝う→Trust / 子どもを励ます→Bond / 代替遊びを提案→Mood | 「戻ってきたボールに、笑顔もついてきた。」 | △/△ |
| HSV004 | 日焼け止め貸して | 仲間が日焼け止めを忘れ、売店も混雑。 | 貸す→Bond / 一緒に買う→Gold消費＋Bond / 日陰の遊びへ→Safety | 「夏を楽しむ準備も、立派な作戦だ。」 | △/○ |
| HSV005 | 貝がらの合図 | 珍しい貝を見つけ、集めるか自然に残すか迷う。 | 写真だけ撮る→Insight / 1個だけ記念→Item / 図鑑で調べる→Knowledge | 「持ち帰らなくても、思い出は残せる。」 | ○/△ |
| HSV006 | 海の家の助っ人 | 昼時、海の家が急に忙しくなり短時間の手伝いを頼まれる。 | 配膳→Gold＋Trust / 呼び込み→Mood / 片付け→Reward | 「焼きそばの香りまで、夏の記憶になった。」 | ○/△ |
| HSV007 | 砂浜の落とし物 | 防水ポーチを拾う。中に交通ICと連絡先カード。 | 交番へ→Trust / 放送依頼→Bond / 周囲を探す→追加結果 | 「誰かの夏休みを、ちゃんと持ち主へ返した。」 | △/△ |
| HSV008 | 波打ち際の写真 | 夕方、仲間が集合写真を撮ろうと誘う。 | 中央で写る→Bond / 撮影役→Trust / 変顔案→Mood | 「一枚の写真に、今日の全部が詰まった。」 | ○/○ |
| HSV009 | ビーチフラッグ勝負 | 軽い運動イベントに参加。勝敗より盛り上がり重視。 | 全力疾走→High reward / 応援役→Bond / 作戦立案→Focus | 「砂を蹴って、夏の一瞬を奪い取った。」 | ○/△ |
| HSV010 | 夕潮の帰り道 | 帰る時間、潮でサンダルが片方流される。 | 探す→Item維持 / 裸足で戻る→Mood / 友人と交代で探す→Bond | 「最後まで少しだけ、海に引き止められた。」 | ○/○ |

### 9.2 Resort — HSV011〜HSV020

| ID | タイトル | 場面・前提 | 選択肢フック / 効果意図 | バカンスログ | I/V |
|---|---|---|---|---|---|
| HSV011 | ホテルの朝食ビュッフェ | 宿の朝食で欲張るか体調を整えるか。 | 好きな物中心→Mood / 栄養重視→Heal / 仲間におすすめ→Bond | 「朝の一皿で、今日の元気が決まる。」 | ○/△ |
| HSV012 | プールサイドの読書 | リゾートプール脇に静かな読書スペース。 | 読書→Focus / 仲間を誘う→Bond / ひと眠り→Heal | 「水音だけがページをめくっていた。」 | ○/△ |
| HSV013 | レンタサイクル散策 | 宿の自転車で周辺を巡れるが時間は限られる。 | 景色優先→Mood / 名所優先→Knowledge / 仲間に合わせる→Bond | 「知らない道ほど、夏休みらしかった。」 | ○/△ |
| HSV014 | 部屋の鍵が見つからない | 外出前にルームキーが行方不明。 | 部屋を整理して探す→Focus / フロント相談→Trust / 仲間と分担→Bond | 「出発前の小騒ぎも、旅の一部になった。」 | △/○ |
| HSV015 | 売店限定アイス | 数量限定のご当地アイスが残り1個。 | 買う→Gold消費＋Mood / 仲間と半分→Bond / 見送る→Focus | 「最後の一本を前に、妙に真剣になった。」 | ○/○ |
| HSV016 | 温泉卓球トーナメント | 館内卓球台で即席勝負。 | 攻める→Reward / ラリー重視→Bond / 観戦と応援→Mood | 「浴衣の袖まで、勝負に巻き込まれた。」 | ○/△ |
| HSV017 | 展望ラウンジの夕焼け | 日没直前、宿の高層ラウンジが空いている。 | 一人で眺める→Focus / 仲間を呼ぶ→Bond / 写真を撮る→Memory | 「空の色が変わるたび、会話もゆっくりになった。」 | ○/○ |
| HSV018 | ルームサービスの相談 | 全員少し疲れ、外食か部屋食かで意見が分かれる。 | 外へ出る→Reward chance / 部屋食→Heal / 多数決をまとめる→Trust | 「休むのも、旅を続けるための予定だ。」 | △/△ |
| HSV019 | ロビーのミニ演奏会 | 地元学生の小さな演奏会に遭遇。 | 最後まで聴く→Mood / 感想を伝える→Trust / 仲間と曲を話す→Bond | 「知らない曲なのに、夏の曲に聞こえた。」 | ○/○ |
| HSV020 | チェックアウト前の忘れ物確認 | 出発直前、机に誰かの土産袋。 | 持ち主を確認→Trust / 走って届ける→Bond / フロントに預ける→Safe reward | 「旅立つ前に、忘れ物だけは置いていかない。」 | △/△ |

### 9.3 Travel — HSV021〜HSV030

| ID | タイトル | 場面・前提 | 選択肢フック / 効果意図 | バカンスログ | I/V |
|---|---|---|---|---|---|
| HSV021 | ローカル線の窓際 | 観光列車で窓側が1席だけ空く。 | 譲る→Bond / 座る→Mood / 交代制を提案→Trust | 「流れる景色を、順番に夏の記憶へ入れた。」 | ○/△ |
| HSV022 | 乗り換え5分 | 駅で乗換時間が短く、仲間の荷物が多い。 | 荷物を持つ→Bond / 先導する→Focus / 次便を選ぶ→Safety | 「旅では、急ぐ判断も休む判断も思い出になる。」 | ○/△ |
| HSV023 | 道の駅スタンプ | 旅先スタンプラリーの台紙を発見。 | 参加→Collection / 1個だけ押す→Mood / 情報だけ見る→Knowledge | 「紙の上に、寄り道の跡が増えていく。」 | △/△ |
| HSV024 | 商店街の食べ歩き | 小さな商店街で予算内の食べ歩き。 | 名物優先→Gold消費＋Mood / 仲間とシェア→Bond / 店員におすすめを聞く→Trust | 「一口ずつ、町の味を覚えた。」 | ○/○ |
| HSV025 | 迷子になった観光客 | 地図を見て困る旅行者から道を聞かれる。 | 一緒に案内→Trust / 地図で説明→Focus / 案内所へ誘導→Safe reward | 「旅先でも、道を教える側になる日がある。」 | △/△ |
| HSV026 | 展望バス最後列 | 周遊バスの最後列で景色か会話かを選ぶ。 | 景色に集中→Insight / 仲間と雑談→Bond / 次の目的地を調べる→Focus | 「窓の外も車内も、見逃せない夏だった。」 | ○/△ |
| HSV027 | 旅先の文房具店 | ご当地柄のノートを見つける。 | 買う→Item / 友人分も選ぶ→Bond / 写真だけ→Gold維持 | 「新しいノートは、旅の続きを書けと言っていた。」 | ○/△ |
| HSV028 | 橋の上の強風 | 景勝地の橋で帽子が飛びそうになる。 | 帽子を押さえて進む→Focus / 引き返す→Safety / 仲間とゆっくり進む→Bond | 「風の強さまで、景色の一部だった。」 | ○/△ |
| HSV029 | ご当地クイズ案内板 | 観光地の案内板にミニクイズ。 | 即答→Reward chance / 調べて答える→Knowledge / 仲間と相談→Bond | 「旅先の豆知識が、ひとつ増えた。」 | △/△ |
| HSV030 | 帰りの駅弁会議 | 帰路の駅で弁当を選ぶ時間。 | 定番→Heal / 限定品→Mood / 仲間と交換前提で選ぶ→Bond | 「帰り道まで、旅の味は続いていた。」 | ○/○ |

### 9.4 Festival — HSV031〜HSV040

| ID | タイトル | 場面・前提 | 選択肢フック / 効果意図 | バカンスログ | I/V |
|---|---|---|---|---|---|
| HSV031 | 屋台の射的 | 縁日の射的で景品を狙う。 | 大物狙い→High risk/reward / 小物狙い→Item / 仲間に譲る→Bond | 「一発のコルクに、夏の勝負を込めた。」 | ○/△ |
| HSV032 | ラムネのビー玉 | 屋台でラムネを買い、ビー玉の仕組みが話題に。 | 観察する→Knowledge / 一気に飲む→Mood / 仲間と雑談→Bond | 「涼しい音が、瓶の中で鳴った。」 | ○/△ |
| HSV033 | 盆踊りの輪 | 見よう見まねで地域の踊りに参加できる。 | 輪に入る→Mood＋Bond / 手本を見る→Focus / 仲間を誘う→Bond | 「知らない振りでも、拍子はすぐ友達になった。」 | ○/○ |
| HSV034 | 金魚すくいの作戦 | 破れやすいポイで一匹を狙う。 | 慎重→Small reward / 攻める→High reward chance / 見守る→Mood | 「水面の一瞬に、みんなで息を止めた。」 | ○/△ |
| HSV035 | 迷子アナウンス | 会場で小学生が保護者とはぐれている。 | 本部へ付き添う→Trust / 近くを一緒に探す→Bond / 係員を呼ぶ→Safe reward | 「にぎやかな祭りで、ひとつ安心を届けた。」 | △/○ |
| HSV036 | おみくじ屋台 | 簡易おみくじを引ける。 | 引く→Random reward / 仲間に譲る→Bond / 引かずに目標を決める→Focus | 「運勢より先に、自分の気分が決まった。」 | ○/△ |
| HSV037 | 団扇づくり体験 | 無料の手作り団扇コーナー。 | 絵を描く→Mood / 仲間への一言を書く→Bond / 実用重視→Safety | 「風を送るたび、自分の絵が揺れた。」 | ○/△ |
| HSV038 | 祭りの片付け手伝い | 終了前、実行委員が軽い片付け協力を募集。 | 机運び→Reward / ゴミ分別→Trust / 案内札回収→Focus | 「祭りの終わりにも、ちゃんと役目があった。」 | △/△ |
| HSV039 | 地元高校の模擬店 | 旅先の高校生が地域祭で出店している。 | 買って応援→Mood / 会話する→Knowledge / 手伝い案を聞く→Trust | 「同じ高校生でも、夏の過ごし方は少し違った。」 | ○/○ |
| HSV040 | 祭り写真の一枚 | 提灯通りで仲間から記念撮影を頼まれる。 | 全員写真→Bond / 風景中心→Memory / お互いを撮る→Bond | 「提灯の光が、今日だけの表情を残した。」 | ○/○ |

### 9.5 Marine — HSV041〜HSV050

| ID | タイトル | 場面・前提 | 選択肢フック / 効果意図 | バカンスログ | I/V |
|---|---|---|---|---|---|
| HSV041 | 磯の小さな水族館 | 潮だまりで小魚やヤドカリを観察。 | 観察記録→Knowledge / 写真→Memory / 仲間に解説→Bond | 「足元だけで、海は十分に広かった。」 | ○/△ |
| HSV042 | 遊覧船のデッキ | 短いクルーズで船首側が混雑。 | デッキへ→Mood / 船内で休む→Heal / 仲間と席を譲り合う→Bond | 「海の上では、風まで景色になる。」 | ○/△ |
| HSV043 | 水族館のクラゲホール | 薄暗い展示室で静かな時間。 | じっくり見る→Focus / 仲間と感想→Bond / スケッチ→Creativity | 「青い光の中で、時間まで漂っていた。」 | ○/○ |
| HSV044 | イルカショーの水しぶき | 前方席は濡れる可能性あり。 | 前列→Mood / 後方→Safety / 仲間に席を選ばせる→Bond | 「濡れた分だけ、笑い声も大きくなった。」 | ○/○ |
| HSV045 | 海辺の清掃ボランティア | 30分だけ参加できるビーチクリーン。 | 参加→Trust＋Reward / 分別担当→Focus / 呼びかけ担当→Trust | 「拾った分だけ、砂浜が少し明るく見えた。」 | △/△ |
| HSV046 | シーカヤック体験 | 二人乗り体験で息を合わせる必要。 | 前で漕ぐ→Focus / 後ろで舵→Skill / 相手のペース優先→Bond | 「同じ方向へ漕ぐと、会話まで合ってきた。」 | ○/○ |
| HSV047 | 灯台までの階段 | 海沿いの灯台展望台まで長い階段。 | 一気に上る→High reward / 休憩しつつ→Safety / 仲間を励ます→Bond | 「最後の一段の先に、水平線が待っていた。」 | ○/△ |
| HSV048 | 真珠アクセサリー体験 | 海辺工房で小さなストラップ作り。 | 自分用→Item / 仲間用→Bond / 色選びを相談→Bond | 「小さな光を、旅のお守りにした。」 | ○/○ |
| HSV049 | 海の生き物クイズ | 水族館出口の学習端末で全問正解賞。 | 即挑戦→Reward chance / 展示を見直す→Knowledge / 仲間と協力→Bond | 「遊んだあとに、少しだけ海に詳しくなった。」 | △/△ |
| HSV050 | 港の帰港ベル | 夕方の港で船が戻り、見送りの人々が手を振る。 | 一緒に手を振る→Mood / 写真→Memory / 静かに眺める→Focus | 「港のベルが、今日の終わりを教えた。」 | ○/○ |

### 9.6 Summer Night — HSV051〜HSV060

| ID | タイトル | 場面・前提 | 選択肢フック / 効果意図 | バカンスログ | I/V |
|---|---|---|---|---|---|
| HSV051 | 星座を探す夜 | 宿の外で星座早見を借りられる。 | 星座探し→Knowledge / 願い事→Mood / 仲間と教え合う→Bond | 「見上げた分だけ、夜空が近くなった。」 | ○/○ |
| HSV052 | 花火の場所取り | 打上花火前、見やすい場所は残りわずか。 | 早めに確保→View reward / 人の少ない場所へ→Safety / 仲間に任せる→Bond | 「待った時間まで、花火の一部だった。」 | ○/△ |
| HSV053 | 線香花火の最後 | 手持ち花火の締めに線香花火が数本。 | 長持ち勝負→Focus / 同時点火→Bond / 一本譲る→Bond | 「小さな火ほど、みんな静かになった。」 | ○/○ |
| HSV054 | 夜の自販機まで | 飲み物を買いに宿の外へ短い散歩。 | 一人で行く→Focus / 仲間を誘う→Bond / 皆の分も買う→Trust | 「夜風だけで、昼とは違う町に見えた。」 | ○/○ |
| HSV055 | 蛍の小径 | 観賞エリアで静かに歩くルール。 | 無言で見る→Mood / 解説を読む→Knowledge / 仲間と距離を合わせる→Bond | 「光を追わずにいると、向こうから近づいてきた。」 | ○/○ |
| HSV056 | 夜店のかき氷 | 閉店前、味を一つ選ぶ。 | 定番味→Heal＋Mood / 変わり味→Random / 仲間と違う味で交換→Bond | 「夜のかき氷は、昼より少し特別だった。」 | ○/△ |
| HSV057 | 宿の屋上開放 | 一時間だけ屋上テラスが開く。 | 夜景を見る→Mood / 写真→Memory / 進路の話をする→Bond | 「遠い灯りを見ながら、少し先の話をした。」 | ○/○ |
| HSV058 | 虫の声クイズ | スタッフの夜散歩企画で鳴き声当て。 | 直感→Reward chance / 図鑑確認→Knowledge / 仲間と相談→Bond | 「暗闇の向こうに、夏の音が何種類もいた。」 | △/△ |
| HSV059 | 流れ星の一瞬 | 散歩中に流星が見える。 | 願い事をする→Mood / 仲間に教える→Bond / 方角と時間を記録→Knowledge | 「願いは間に合わなくても、笑顔は間に合った。」 | ○/○ |
| HSV060 | 消灯前の廊下 | 消灯直前、飲み物を取りに出た仲間とばったり会う。 | 少し話す→Bond / 早く寝ようと促す→Trust / 明日の予定を確認→Focus | 「おやすみの前に、明日の楽しみが一つ増えた。」 | △/○ |

### 9.7 Rainy Day — HSV061〜HSV070

| ID | タイトル | 場面・前提 | 選択肢フック / 効果意図 | バカンスログ | I/V |
|---|---|---|---|---|---|
| HSV061 | 突然の通り雨 | 観光中、軒下へ避難。 | 雨宿り→Safety / 傘を買う→Gold消費 / 相合傘で移動→Bond | 「予定外の雨が、予定外の会話をくれた。」 | ○/○ |
| HSV062 | ホテルのボードゲーム棚 | 雨で外出中止、ロビーに貸出ゲーム。 | 対戦→Mood＋Reward / 協力→Bond / ルール説明役→Trust | 「雨音の代わりに、駒の音が響いた。」 | ○/△ |
| HSV063 | 雨の日ミュージアム | 予定変更で地域資料館へ。 | 常設展→Knowledge / 企画展→Insight / 仲間の興味に合わせる→Bond | 「雨のおかげで、知らなかった町を知った。」 | ○/△ |
| HSV064 | 濡れたスニーカー | 靴が濡れ、乾燥機は順番待ち。 | 乾燥機を待つ→Heal / 新聞紙で対処→Focus / 仲間の分も手伝う→Trust | 「靴が乾くまで、旅も少し休憩した。」 | △/△ |
| HSV065 | 窓際カフェの雨粒 | 喫茶店で雨待ち。 | 温かい飲み物→Heal / デザート→Mood / 旅ノートを書く→Focus | 「窓の雨粒まで、休暇の景色になった。」 | ○/△ |
| HSV066 | 貸し傘はあと一本 | 宿の貸し傘が最後の一本。 | 仲間に譲る→Bond / 一緒に使う→Bond / 雨が弱まるまで待つ→Safety | 「一本の傘が、距離まで決めてしまった。」 | ○/○ |
| HSV067 | 雨音プレイリスト | 部屋で音楽を流しながら休む案が出る。 | 自分の曲→Mood / 仲間に選んでもらう→Bond / 無音で休む→Heal | 「雨と音楽で、部屋が小さな避暑地になった。」 | △/△ |
| HSV068 | コインランドリー作戦 | 濡れた服をまとめて洗う。 | 自分の分だけ→Time save / 皆の分を整理→Trust / 待ち時間に勉強→Knowledge | 「回る洗濯機を見ながら、夏休みを整えた。」 | △/△ |
| HSV069 | 雨上がりの水たまり | 雨が止み、空に薄い虹。 | 写真→Memory / 虹を追って散歩→Mood / 予定へ直行→Focus | 「雨上がりは、町の色まで洗い直していた。」 | ○/○ |
| HSV070 | 予定表の作り直し | 雨で半日の予定が崩れる。 | 屋内中心に再編→Focus / 全員で決める→Bond / 完全休養日にする→Heal | 「予定が変わっても、休暇はちゃんと続いていく。」 | △/△ |

### 9.8 Rest / Slow Vacation — HSV071〜HSV080

| ID | タイトル | 場面・前提 | 選択肢フック / 効果意図 | バカンスログ | I/V |
|---|---|---|---|---|---|
| HSV071 | 昼寝の誘惑 | 午後の自由時間、冷房の効いた部屋で眠気。 | 昼寝→Heal / 少しだけ休む→Heal / 散歩へ→Mood | 「何もしない時間も、夏休みの予定に入った。」 | △/△ |
| HSV072 | 旅ノートの空白 | ここまでの旅をノートに残す。 | 文章で書く→Focus / 絵を描く→Creativity / 仲間の一言も集める→Bond | 「書き残すと、今日が少し長く続く気がした。」 | ○/△ |
| HSV073 | おみやげ仕分け会議 | 買った土産が増え、誰に何を渡すか整理。 | 家族優先→Trust / 友人向けも追加→Bond / 自分用を確保→Mood | 「袋の数だけ、思い浮かぶ顔があった。」 | △/△ |
| HSV074 | ストレッチタイム | 歩き疲れた夜、仲間が軽いストレッチを提案。 | 一緒にやる→Heal＋Bond / 念入りに→Heal / 先に休む→Time save | 「伸ばした分だけ、明日の足取りが軽くなった。」 | △/○ |
| HSV075 | ポストカードを書く | 宿の売店でご当地はがきを見つける。 | 家族へ→Trust / 友人へ→Bond / 自分宛て→Memory | 「旅先から、未来の自分へ一枚送った。」 | ○/△ |
| HSV076 | 冷蔵庫の最後のプリン | 部屋の共有冷蔵庫に人数より一つ少ないデザート。 | 譲る→Bond / じゃんけん→Mood＋Random / 半分こ→Bond | 「最後の一個ほど、決め方が難しい。」 | ○/○ |
| HSV077 | 朝寝坊しかけた日 | アラームを止め、集合まで少ししかない。 | 急いで準備→Focus / 仲間に連絡→Trust / 朝食を簡単に→Safety | 「寝坊しかけても、旅は待ってくれない。」 | △/○ |
| HSV078 | マッサージチェアの5分 | 休憩所に空いたマッサージチェア。 | 使う→Heal / 仲間に譲る→Bond / コイン節約→Gold維持 | 「五分だけ、体が旅から戻ってきた。」 | △/△ |
| HSV079 | 写真フォルダ整理 | 撮影枚数が増え、端末容量が少ない。 | 厳選削除→Focus / お気に入り共有→Bond / バックアップ→Safety | 「写真を選ぶだけで、一日をもう一度歩けた。」 | △/△ |
| HSV080 | 明日の予定は白紙 | 夜、翌日の自由時間をどうするか相談。 | 早起き案→Reward chance / のんびり案→Heal / 相手の希望を聞く→Bond | 「白紙の予定表が、いちばん楽しそうに見えた。」 | △/○ |

### 9.9 Mixed Vacation — HSV081〜HSV090

| ID | タイトル | 場面・前提 | 選択肢フック / 効果意図 | バカンスログ | I/V |
|---|---|---|---|---|---|
| HSV081 | 高原ロープウェイ | 山の展望地へ上るが、少し風が強い。 | 乗る→Mood＋Reward / 下で散策→Safety / 仲間を安心させる→Bond | 「海とは違う夏の青さが、山の上にあった。」 | ○/○ |
| HSV082 | 果樹園の収穫体験 | 短時間のフルーツ狩り。 | 丁寧に選ぶ→Item / 量を楽しむ→Heal＋Mood / 仲間に良い実を譲る→Bond | 「太陽の味を、その場でかじった。」 | ○/△ |
| HSV083 | 陶芸の夏模様 | 旅先工房で小皿に絵付け。 | 夏景色→Creativity / 名前入り→Memory / 仲間と対になる柄→Bond | 「旅が終わっても残る夏を、皿に描いた。」 | ○/○ |
| HSV084 | フェリー欠航の知らせ | 天候で短距離フェリーが欠航し、予定変更が必要。 | 陸路へ→Gold消費 / 町を再探索→Reward chance / 宿で休む→Heal | 「行けない場所より、今いる場所を楽しむことにした。」 | △/△ |
| HSV085 | 展望台の記念スタンプ | 山頂施設の期間限定スタンプ。 | 押す→Collection / 仲間の台紙も手伝う→Bond / 景色優先→Mood | 「一押しで、旅のページに山が増えた。」 | △/△ |
| HSV086 | 朝市の値札相談 | 朝市で予算ぎりぎりの名産品を発見。 | 買う→Item / 試食だけ→Heal / 店の人に食べ方を聞く→Knowledge＋Trust | 「朝の市場は、会話まで新鮮だった。」 | ○/○ |
| HSV087 | レンタルカメラ一台 | 観光案内所で高性能カメラを一台だけ借りられる。 | 自分が撮影→Memory / 仲間に任せる→Bond / 交代制→Trust | 「レンズを替えると、同じ夏が違って見えた。」 | ○/△ |
| HSV088 | 足湯で作戦会議 | 移動の合間に無料足湯。 | ゆっくり浸かる→Heal / 次ルート相談→Focus / 近況を話す→Bond | 「足元が温まると、話までゆっくりになった。」 | ○/○ |
| HSV089 | 丘の風鈴回廊 | 観光地の風鈴イベントで願い札を書ける。 | 目標を書く→Focus / 仲間の幸運を書く→Bond / 無記名で飾る→Mood | 「風が吹くたび、誰かの願いが鳴った。」 | ○/○ |
| HSV090 | 夏休み最後の分かれ道 | 帰路前、自由時間の使い方を最後に選ぶ。 | もう一か所巡る→Mood / 土産を整える→Trust / 仲間と静かに過ごす→Bond | 「終わるからこそ、この時間を覚えていたいと思った。」 | ○/○ |

### 9.10 高校編イベント実装ルール

- Vacation時の高校編 `?` マスは、この90件から選ぶ。通常の `HIGH_SCHOOL_EVENT_THEMES` 114件を混ぜない。
- 90件は全Actで利用可能。前半はBeach/Resort/Travel、後半はFestival/Marine/Nightの重みを上げてもよいが、欠番やAct専用化はしない。
- 同一周回で直前2件と同じIDを引かない簡易除外を入れると体験が安定する。
- `description` は「場面・前提」を2〜3文へ展開し、選択肢は2〜3個。
- `resultLog` は上表のバカンスログを核にし、実際の獲得効果を後ろへ付ける。
- 例: `潮風の中で、小さな物語を拾った。HPが10回復した。`
- `EventScreen.tsx` に `^high-school-vacation-event-(\d+)$` のresolverを追加し、`sprites/high-school/events/vacation/{index3}.webp` を参照する。
- `index3` は `String(index).padStart(3, '0')` とし、`0 -> 000.webp`、`89 -> 089.webp` で解決する。

## 10. マジック編Vacation恋愛

### 10.1 進行データは通常版と共有

Vacation恋愛は別ルートを新設しない。既存の次の値をそのまま使う。

```text
magicRomance.affection[targetId]
magicRomance.stages[targetId]
magicRomance.selectedCounts[targetId]
magicRomance.completedEventIds
```

- `REQUIRED_ACT_BY_STAGE = [1, 1, 2, 3, 3]` を維持。
- R1〜R5の発生段階、選択肢効果、好感度増減、学習補正を維持。
- R6の `BOND / SPECIAL / ROMANCE / TRUE_ROMANCE` 判定も現行好感度を利用。
- `VACATION` のときだけ、場面説明、CG、会話、voice lineをVacationデータへ切り替える。
- 選択画面タイトルは `放課後、誰と過ごす？` から `バカンス、誰と過ごす？` へ変更。
- 通常版 `magicRomanceDialogue.ts` を上書きせず、`src/data/magicVacationRomanceDialogue.ts` を新設する。

### 10.2 8対象 × R1〜R6 シチュエーション軸

| 対象 | R1 出会い | R2 信頼 | R3 接近 | R4 危機 | R5 告白/約束 | R6 その先 |
|---|---|---|---|---|---|---|
| 朝霧 蓮 | 海辺の駅で待ち合わせ。荷物を自然に持つ | ビーチパラソル設営＋旅のしおり | 夕暮れのボードウォーク、かき氷を分ける | 突然のスコール。風の防護結界で共闘 | 花火の見える岬で「来年も一緒に」 | 帰路の朝。日常へ戻っても隣にいる約束 |
| 御影 颯真 | リゾート受付で完璧な旅程表 | 交通費・時間・予約を一緒に確認 | 予定外のプールサイドカフェで初めて寄り道 | 嵐で崩れた避難導線を氷の秩序結界で再構築 | 夜の桟橋で「予定表にない気持ち」を認める | 旅行手帳に二人で決める空白の予定を残す |
| 白石 湊 | 海辺の救護テントで擦り傷を手当て | 潮だまり観察、生物記録と治癒補助 | 水族館／海中展望室で自分から案内 | 海の魔法生物を救うため治癒を使い切りかける | 夕浜で「今度はぼくを頼って」と手を差し出す | 海辺のボランティア後、並んで休日を楽しむ |
| 天音 理玖 | 港の時計前、到着時刻を言い当てる | 潮汐表・船便・写真時刻を一緒に観測 | 夜市と星空。未来予測をせず行き先を任せる | 花火直前に時間の歪み。同じ数分を二人で突破 | 灯台で「君との先は見ない」と宣言 | 帰りの船で未確定の次の旅先を決める |
| 黒瀬 大和 | ビーチコートで荷物をぶつけ口げんか | BBQの火加減と炎制御。文句を言いながら助ける | 夏祭りの屋台勝負。夜道で歩幅を合わせる | 暴走する炎結界／熱波から観光客を共闘で守る | 防波堤でぶっきらぼうに「また来いよ」 | 帰り道の食堂で肩肘張らず笑える関係へ |
| 神代 レオン | リゾート野外ステージで即席ライバル宣言 | 音響調整と幻術リハーサル | ナイトクルーズの小さなライブ、二人だけのアンコール | 幻術嵐で舞台と観客の避難路が崩れる | 終演後の静かな砂浜で演技を外して本音を渡す | 夜明けの無人ステージで次の共演を約束 |
| エリオット・ノクス | フェリーターミナルで日本の夏休み習慣に戸惑う | 土地の案内文／英語・星界文字を一緒に読む | 灯台で星見。記録ではなく思い出の写真を残す | 海上に星界裂け目。帰還信号と救助を同時に選ぶ | 星明かりの岸辺で「記録ではなく私の希望」 | 二つの世界をつなぐ航路を、また会う道として残す |
| 九条 朔夜 | 人の少ない入り江で停戦中に遭遇 | 海辺の古社跡で封印調査。互いに背中を預ける | 夜の浜辺、祭りの喧騒から離れて少し本音を話す | 海底封印が破れ、敵味方を越えて共闘 | 崖上で赦しを求めず「今の行動を見てほしい」 | 夜明けの海岸を、自分の意志で隣を歩く |

### 10.3 対象本人のVacation代表台詞

既存 `magicRomanceDialogue.ts` の人物像・口調を固定し、Vacationだから急に軽薄な性格へ変えない。下記48本を各段階の中心台詞として使い、主人公側の返答とナレーションを組み合わせる。

| 対象 | R1 | R2 | R3 | R4 | R5 | R6 |
|---|---|---|---|---|---|---|
| 蓮 | 「遅い。……いや、俺が早く来すぎただけ。荷物、半分持つよ」 | 「風向きが変わる。パラソル押さえて。終わったら旅のしおりも直そう」 | 「昔もこうして並んだよな。でも今は、少しだけ意味が違う気がする」 | 「俺の後ろに入って。守るだけじゃない、二人でここを抜けるぞ」 | 「来年も、その次も……おまえとこの景色を見たい」 | 「帰っても迎えに行くよ。今度は幼なじみじゃなく、恋人として」 |
| 颯真 | 「集合時刻の七分前です。予定通りですね。まず行程を確認しましょう」 | 「移動時間と予算は合っています。君の案を入れる余白も確保しました」 | 「予定外の休憩ですが……悪くありません。もう少しここにいましょう」 | 「避難経路を固定します。君は私の隣へ。二人で最後まで確認する」 | 「感情は予定表に収まりません。だからこそ、今ここで伝えます」 | 「次の旅行手帳には空白を残します。君と決めるための予定です」 |
| 湊 | 「先輩、そこ座ってください。小さな傷でも、海ではちゃんと手当てします」 | 「この潮だまり、昨日と生き物が違います。一緒に記録してみませんか？」 | 「今日はぼくが案内します。先輩に頼ってもらえるところ、見せたいです」 | 「まだ助けられます。でも……先輩が一緒なら、無茶せず最後までやれます」 | 「守られる後輩のままじゃ嫌です。これからは、ぼくのことも頼ってください」 | 「次の休日も、ぼくが誘っていいですか？ 今度は普通のデートとして」 |
| 理玖 | 「三分前に来ると思ってた。ほら、港の時計も僕の予想どおりだ」 | 「潮の満ち引きは読める。でも君がどこへ寄り道するかは読めないな」 | 「今日は未来予報を切ってきた。君の選ぶ道で驚く方が面白いからね」 | 「この三分、また繰り返してる。次は僕じゃなく、君の判断を信じよう」 | 「君との未来は見ないことにした。知らないまま隣にいる方を選ぶよ」 | 「次の行き先は、船に乗ってから決めよう。答え合わせはそのあとで」 |
| 大和 | 「おい、そこ危ねえぞ。……荷物よこせ。転ばれる方が面倒なんだよ」 | 「火は俺が見る。おまえは焦がすなよ。せっかくの休みなんだからな」 | 「次の屋台、勝負な。負けた方が飲み物おごり。手ぇ抜くんじゃねえぞ」 | 「下がるな。俺も行く。二人で止めりゃ、こんな熱波どうってことねえ」 | 「……また来いよ。来年も、その次も。俺はここで待ってるから」 | 「戦いがなくても一緒にいろよ。おまえと食う飯、結構うまいんだ」 |
| レオン | 「ようこそ夏の特設舞台へ。今日のライバル役は、もちろん君だよ」 | 「その音、いいね。僕の幻術より先に、君のリズムが景色を変えた」 | 「アンコールは二人だけでどう？ 観客が海と星なら、最高の夜だ」 | 「幕は下ろさない。君を安全な場所へ送り届けるまでが僕の公演だ」 | 「今は演技じゃない。舞台の外でも、君の隣を僕に選ばせてほしい」 | 「次の公演も相手役は君だ。休暇が終わっても、僕らの幕は続くよ」 |
| エリオット | 「この国の夏休みは不思議ですね。よろしければ、作法を教えてください」 | 「この土地の言葉と星界文字は似ています。あなたと読むと、なお興味深い」 | 「今日は記録ではなく、思い出として残したいのです。ご一緒に写真を？」 | 「帰還信号は後回しにします。今は、あなたとこの海を守る方が大切です」 | 「これは任務でも記録でもありません。私自身の希望として、あなたを選びます」 | 「世界が隔たっても、この航路は閉じません。必ずあなたの隣へ戻ります」 |
| 朔夜 | 「停戦中だ。敵意はない。……君も一人なら、ここを離れた方がいい」 | 「封印が古い。私が解く。君は無理に信じなくていい、ただ見ていてくれ」 | 「祭りの音は遠い方がいい。ここなら、余計なことまで話してしまいそうだ」 | 「命令は無視する。この封印は私が止める。君まで巻き込ませはしない」 | 「赦しはいらない。過去ではなく、今の私を見て、それから選んでほしい」 | 「誰の命令でもない。私は自分の意志で、君の隣を歩く」 |

### 10.4 対象別の声の方向

| 対象 | Vacation時の演技 |
|---|---|
| 蓮 | 幼なじみの近さ。世話を焼く台詞は短く自然。R5だけ少し言葉を選ぶ。 |
| 颯真 | 丁寧・論理的・規律的。予定や数値を口にし、R3以降は「予定外」を肯定する。 |
| 湊 | 後輩らしい素直さと敬語。「先輩」を活かし、守られる側から頼られる側へ成長。 |
| 理玖 | 飄々とした先輩口調。時間・予測の比喩を挟む。核心では茶化さない。 |
| 大和 | 短文、ぶっきらぼう、照れ隠し。優しさは台詞より行動を先に見せる。 |
| レオン | 舞台用語と華やかな自信。R5だけ観客のいない場所で演技を外す。 |
| エリオット | 丁寧語、静かな気品、星・記録・境界の語彙。R3から「記録」より「思い出」を選ぶ。 |
| 朔夜 | 冷静で短く、感情説明を避ける。R5でも赦しを要求せず、相手の選択を尊重。 |

共通比率は、R1〜R2「日常7：恋3」、R3「日常5：恋5」、R4「危機7：恋3」、R5「恋7：使命3」、R6「穏やかな未来8：魔法2」。水着・夏服について身体を評価する台詞は入れず、視線、距離、手元、行動、言いよどみで親密さを描く。

### 10.5 9ヒロインのVacation返答台詞

各対象の代表台詞と組み合わせる主人公側の核台詞。女性主人公ルートでは主人公台詞、男性主人公ルートでは恋愛対象側の台詞として同じ人物性を維持できる。

| ID | R1 | R2 | R3 | R4 | R5 | R6 |
|---|---|---|---|---|---|---|
| AKARI | 「海だ！　せっかく来たんだから、今日は一緒に全部楽しもう！」 | 「困ったことがあっても二人なら何とかなるよ。次、どこ行く？」 | 「こうして隣を歩くの、思ってたよりずっと嬉しいかも。」 | 「危ない時こそ一人で走らない。今度は一緒に行こう！」 | 「来年も、その次の夏も一緒に笑っていたい。……これ、私の本音だよ。」 | 「帰る場所が変わっても、次の夏はまた隣で始めよう。」 |
| SHIZUKU | 「海辺の気温、湿度、風向き……データは十分です。あとはあなたの予定を教えてください。」 | 「予定外が多いですね。でも、あなたとなら修正するのも悪くありません。」 | 「計算に入れていなかった時間ほど、記憶に残るものですね。」 | 「一人で解決する必要はありません。私も同じ結論を選びます。」 | 「この気持ちは誤差ではありません。来年もあなたの隣を希望します。」 | 「予測できない未来を、あなたと一緒に観測していきたいです。」 |
| HIYORI | 「潮風、気持ちいいね。疲れたらすぐ言って。一緒にゆっくり回ろう？」 | 「無理に予定を詰めなくていいよ。元気な顔で帰ることも大事だから。」 | 「こういう何でもない時間が、いちばん大切な思い出になるのかも。」 | 「今度は私だけが支えるんじゃなくて、一緒に支え合おう。」 | 「あなたが帰ってこられる場所に、私もなれたら嬉しいな。」 | 「次の夏も、疲れた時に一緒に休める場所を作ろうね。」 |
| TSUBASA | 「海に来たなら全力で遊ぶぞ！　まず何から勝負する？」 | 「よし、次はあっち！　立ち止まるのは全部やってからだ！」 | 「隣で走るの、悪くないな。置いてくなよ！」 | 「危ないならなおさら一緒に行く！　一人で格好つけるな！」 | 「来年も勝負しよう。……いや、勝負がなくても一緒に来たい。」 | 「休みが終わっても競争は続く！　ずっと隣でな！」 |
| REI | 「人が多いな。はぐれるな。……私も、今日は少し楽しむつもりだ。」 | 「無理をする必要はない。休む時は、私がここにいる。」 | 「静かな海も悪くない。君となら、沈黙まで落ち着く。」 | 「過去のことは後だ。今は君を守り、この場を切り抜ける。」 | 「来年も隣にいてほしい。命令ではない。私の願いだ。」 | 「平穏を選び直せるなら、私は何度でも君とこの道を歩く。」 |
| MADOKA | 「この旅行、時間ごと記録してもいいですか？　忘れたくないので。」 | 「予定が少しずれても大丈夫です。失敗も含めて残しておきたいです。」 | 「巻き戻したくない時間って、本当にあるんですね。今がそうです。」 | 「やり直す前提で考えません。今、この瞬間の私たちで助けます。」 | 「来年の同じ日、空けておきます。あなたと過ごす予定として。」 | 「未観測の時間を、これから一緒に増やしていきたいです。」 |
| KOHARU | 「海の風、森とは違うね。でも、あなたの隣なら落ち着くよ。」 | 「急がなくて大丈夫。風の向きが変わるまで、ここで少し休もう。」 | 「守るだけじゃなくて、一緒に楽しむのも大事なんだね。」 | 「私も同じ場所に立つよ。遠くから守るだけにはしない。」 | 「来年も同じ風を感じたいな。できれば、あなたの隣で。」 | 「帰りたい場所を、季節ごとに二人で増やしていこう。」 |
| MIRAI | 「さあ、夏の特別公演を始めましょう！　今日の共演者はあなたです！」 | 「笑顔の練習は得意よ。でも今日は、本当に楽しいからそのままでいいみたい。」 | 「舞台裏みたいな静かな時間も、あなたとなら好きになれそう。」 | 「怖い時ほど笑ってごまかさない。今日はちゃんと頼らせて。」 | 「幕が下りても隣にいて。次の季節も、あなたと続けたいの。」 | 「アンコールは終わらないわ。二人の次の夏へ、そのまま続演よ。」 |
| SERA | 「海という場所を、こんなふうに楽しむのですね。あなたと学べて嬉しいです。」 | 「知らない習慣がまた一つ増えました。次も、あなたに教えてほしいです。」 | 「記録だけでは足りません。この景色を、あなたとの思い出にしたいです。」 | 「どちらの世界も諦めません。あなたも、この海も守ります。」 | 「帰る世界が違っても、また会いたいです。これは私自身の願いです。」 | 「境界を越えても帰ってこられる場所を、二人で作りましょう。」 |

### 10.6 Vacation恋愛会話の組み立て

R1〜R5は、対象別シチュエーションと上記2つの人物台詞を中心に、ナレーションを1〜3文追加する。

```text
1. 場所と行動のナレーション
2. 主人公側のVacation核台詞
3. 対象側のVacation代表台詞
4. 既存選択肢3つ
```

男女どちらを主人公にしても、CGと音声IDは正規ペア順 `{heroineId}:{maleId}` へ正規化する。会話表示順だけ現在の主人公視点に合わせる。

### 10.7 R6ランク差分

R6は現行4ランクを必ず残す。上表のR6台詞は `ROMANCE` の基準文。ほか3ランクは次の方向で同じ人物口調を保って書き分ける。

| Rank | Vacation R6の関係 | CG差分 | 台詞の方向 |
|---|---|---|---|
| BOND | 恋人未満だが大切な相手 | `r6-bond.webp` | 「次の休みも一緒に」「戦いのない日に続きを」など、恋人断定をしない |
| SPECIAL | 互いを特別と認識 | `r6-special.webp` | 「一番近くで答えを探す」「来年も特別な相手として」 |
| ROMANCE | 恋人として次の夏へ | `r6.webp` | 上表R6を核に、恋人としての約束を明言 |
| TRUE_ROMANCE | 恋と使命の両方を選ぶ | `r6-true.webp` | 星界・封印・時間など各人物モチーフを加え、世界を越えても再会する約束 |

R6は `getMagicRomanceEndingText` が返す `lines` をVacation専用データへ差し替える。具体的な全台詞は次節を正本とする。

### 10.8 R6 Vacation ending 全台詞

現行ending画面と同じく、各人物が各ランクで2行を持つ。男女ペアのendingでは、女性側2行＋男性側2行を交互に並べて計4行とする。17キャラ×4ランク×2行=**136行**。

#### 9ヒロイン

| Character | Rank | Line 1 | Line 2 |
|---|---|---|---|
| AKARI | BOND | あかり「次は任務じゃなくて、海で遊ぶ約束にしようよ！」 | あかり「夏が終わっても、楽しい思い出はもっと増やせるよ！」 |
| AKARI | SPECIAL | あかり「あなたと見た夕焼け、私の中で特別な星になったんだ」 | あかり「来年の夏も、その先も、一緒に願いを増やしていこう！」 |
| AKARI | ROMANCE | あかり「恋人として、次の海もあなたの隣まで走っていきたい！」 | あかり「デートも勉強も任務も、二人なら全部楽しくできるよ！」 |
| AKARI | TRUE_ROMANCE | あかり「海の向こうが闇に包まれても、私があなたを照らす星になる！」 | あかり「魔法も使命も二人で背負って、最高の未来まで走ろう！」 |
| SHIZUKU | BOND | しずく「帰る前に、次に海へ来る予定を決めておきましょう」 | しずく「あなたと過ごしたこの夏は、記録以上の価値があります」 |
| SHIZUKU | SPECIAL | しずく「この夕暮れを特別だと感じる理由は、もう分析する必要がなさそうです」 | しずく「結論を急がず、次の季節も二人で確かめましょう」 |
| SHIZUKU | ROMANCE | しずく「恋人として隣にいる。それが、この夏に私が選んだ答えです」 | しずく「予定外の寄り道も、あなたとなら今後の計画に入れたいです」 |
| SHIZUKU | TRUE_ROMANCE | しずく「海も世界も条件を変えてくるでしょう。それでも私はあなたを選びます」 | しずく「月の魔法と私の使命を使って、二人の帰る未来を守ります」 |
| HIYORI | BOND | ひより「今度は海で見つけた好きなもの、もっとたくさん教えてね」 | ひより「また一緒に夏を過ごせるって思うと、心があたたかいよ」 |
| HIYORI | SPECIAL | ひより「あなたと歩いた砂浜を思い出すと、胸に特別な花が咲くみたい」 | ひより「この気持ち、潮風みたいに急がず大切に育てたいな」 |
| HIYORI | ROMANCE | ひより「恋人として、嬉しい日も疲れた日も一緒に海を見たいの」 | ひより「二人が帰ってこられる場所を、これからも優しく育てようね」 |
| HIYORI | TRUE_ROMANCE | ひより「どんな魔法の傷も、あなたとなら希望の花に変えてみせるよ」 | ひより「この海もみんなの未来も守って、二人の明日を何度でも咲かせよう」 |
| TSUBASA | BOND | つばさ「次の夏も絶対来ようぜ！ 今度こそのんびりするからさ！」 | つばさ「約束忘れたら、海まで引っぱってくるからな！」 |
| TSUBASA | SPECIAL | つばさ「おまえと見る花火って、勝ち負けよりずっと胸が熱くなるんだ」 | つばさ「この特別な気持ちも、逃げずに二人で確かめようぜ！」 |
| TSUBASA | ROMANCE | つばさ「恋人になっても遠慮すんなよ。次の夏も隣で全力勝負だ！」 | つばさ「海でも学園でも、どっちが相手を笑わせるか勝負だからな！」 |
| TSUBASA | TRUE_ROMANCE | つばさ「魔法の嵐だろうが世界の危機だろうが、二人で正面突破だ！」 | つばさ「この炎で海も仲間も守って、おまえとの未来まで勝ち取るぞ！」 |
| REI | BOND | れい「次の夏の約束を忘れるな。私も必ず時間を作る」 | れい「波音の中でおまえと黙って過ごす時間は、嫌いではない」 |
| REI | SPECIAL | れい「この海辺で気を抜ける相手は少ない。おまえは、もう特別だ」 | れい「答えを急ぐ必要はない。次の季節も私が隣にいる」 |
| REI | ROMANCE | れい「恋人として、おまえの帰る場所を最も近くで守る」 | れい「穏やかな海も戦いの夜も、この手を離さず歩こう」 |
| REI | TRUE_ROMANCE | れい「禁術も運命も、私たちの未来を封じる理由にはならない」 | れい「闇の魔法も使命も背負って、おまえと選んだ海と世界を守り抜く」 |
| MADOKA | BOND | まどか「つ、次の海水浴の日……今から予定表に入れてもいいですか？」 | まどか「今日の夕焼けは巻き戻さず、大切な記録として保存します」 |
| MADOKA | SPECIAL | まどか「この夏のデータ、何度見てもあなたとの時間だけ特別なんです」 | まどか「次の季節も、一緒に新しい答えを作ってください」 |
| MADOKA | ROMANCE | まどか「恋人として過ごす時間、海辺でも学園でも毎日増やしたいです」 | まどか「予定が失敗しても、二人で直せる旅なら怖くありません」 |
| MADOKA | TRUE_ROMANCE | まどか「時間が乱れても、私は必ずあなたのいる瞬間を見つけます」 | まどか「この時計の魔法で使命を果たして、二人の夏を未来まで守ります」 |
| KOHARU | BOND | こはる「また風のやさしい日に、一緒に海沿いを歩こうね」 | こはる「次の約束があると、帰りの潮風も少し寂しくないね」 |
| KOHARU | SPECIAL | こはる「あなたの隣だと、海の風みたいに自然な私でいられるの」 | こはる「この特別な想いも、次の季節までゆっくり育てたいな」 |
| KOHARU | ROMANCE | こはる「恋人として、あなたが帰りたくなる海辺も日常も守りたい」 | こはる「春も夏も、その先の季節も、手をつないで歩こうね」 |
| KOHARU | TRUE_ROMANCE | こはる「世界中の風向きが変わっても、私はあなたを見失わないよ」 | こはる「精霊の力で海とみんなを守って、二人の居場所を未来まで育てよう」 |
| MIRAI | BOND | みらい「次の夏のステージにも来てね。今度は客席で一番に見つけるわ」 | みらい「あなたと続ける次の場面、もう楽しみにしているの」 |
| MIRAI | SPECIAL | みらい「夕暮れの海では、演技じゃない私まで見つかっちゃうのね」 | みらい「そんなあなたは特別よ。次の幕も、焦らず二人で進みましょう」 |
| MIRAI | ROMANCE | みらい「舞台の外でも、恋人として私の相手役でいてくれる？」 | みらい「海辺のデートも普通の毎日も、二人だけのアンコールにしましょう」 |
| MIRAI | TRUE_ROMANCE | みらい「悪夢の魔法が世界を覆っても、あなたとなら最高の幕へ変えられるわ」 | みらい「使命の舞台が続く限り、二人の夢で海も未来も照らしましょう！」 |
| SERA | BOND | セラ「この世界の夏を、また一緒に教えてください」 | セラ「今日の海辺の記憶も、光の記録へ大切に残します」 |
| SERA | SPECIAL | セラ「あなたと見た水平線は、星界のどの景色より特別です」 | セラ「この想いの名前を、次の季節も二人で探したいです」 |
| SERA | ROMANCE | セラ「恋人として、あなたのいる海にも街にも何度でも帰ります」 | セラ「二つの世界に、二人だけの幸せな夏を増やしていきましょう」 |
| SERA | TRUE_ROMANCE | セラ「世界の境界が閉じても、私の星界光はあなたまで届きます」 | セラ「使命を果たしながら、二つの世界と私たちの未来を必ずつなぎます」 |

#### 8男性キャラクター

| Character | Rank | Line 1 | Line 2 |
|---|---|---|---|
| REN | BOND | 蓮「次は俺から海に誘うよ。戦い抜きで、朝からゆっくり遊ぼう」 | 蓮「困った時だけじゃなく、楽しかった時も最初に呼んでくれ」 |
| REN | SPECIAL | 蓮「昔から一緒なのに、この夏は君がいつもより特別に見えた」 | 蓮「答えは急がせない。でも次の海でも、隣は俺に残してほしい」 |
| REN | ROMANCE | 蓮「恋人として、次の夏も朝から迎えに行く」 | 蓮「守るだけじゃなく、海でも日常でも君と一緒に幸せになりたい」 |
| REN | TRUE_ROMANCE | 蓮「魔法の嵐で道が消えても、俺が君までの道を風で開く」 | 蓮「この海も学園も守って、使命の先の未来まで君と帰るよ」 |
| SOMA | BOND | 颯真「次の海辺での予定は確保しました。変更案は当日受け付けます」 | 颯真「君との休暇は、予定表に残す価値のある時間でした」 |
| SOMA | SPECIAL | 颯真「予定外の夕焼けを、君となら特別だと認められます」 | 颯真「この感情も含めて、次の夏まで丁寧に確かめましょう」 |
| SOMA | ROMANCE | 颯真「恋人である君との約束を、どの予定より先に守りたい」 | 颯真「完璧でない旅も未来も、君と修正しながら進みます」 |
| SOMA | TRUE_ROMANCE | 颯真「学園の規律も魔法の異変も、君を諦める理由にはなりません」 | 颯真「氷の秩序と私の責任で、この海と君との未来を守り抜きます」 |
| MINATO | BOND | 湊「次の海はぼくが誘います。今度は先輩を待たせません！」 | 湊「もっと頼ってもらえるように、次の夏までに成長します」 |
| MINATO | SPECIAL | 湊「海を見てるだけなのに、先輩と一緒だと特別な時間になるんです」 | 湊「憧れだけじゃないこの気持ち、少しずつ受け取ってください」 |
| MINATO | ROMANCE | 湊「恋人として、今度はぼくが先輩の手を引いて海へ連れていきます」 | 湊「守られた分よりもっと、一緒に笑える夏を増やしたいです」 |
| MINATO | TRUE_ROMANCE | 湊「どんな魔法の海でも、先輩へ続く流れをぼくが見つけます」 | 湊「治癒の力でみんなを守って、使命の先でもあなたと並んで歩きます」 |
| RIKU | BOND | 理玖「次の海の予定は観測してないよ。誘う瞬間くらい、自分で選びたいから」 | 理玖「また予想外の寄り道を、隣で見せてくれる？」 |
| RIKU | SPECIAL | 理玖「どの未来を覗いても、この夏の君だけは特別に見えるんだ」 | 理玖「結末は見ないで、次の季節も二人で一日ずつ確かめよう」 |
| RIKU | ROMANCE | 理玖「恋人になった未来は見てない。海辺で今、僕自身が選んだから」 | 理玖「君が選ぶ次の旅を、一番近くで驚きながら楽しみたい」 |
| RIKU | TRUE_ROMANCE | 理玖「時間の分岐が海の数ほどあっても、僕は毎回君の手を取る」 | 理玖「時間魔法も使命も使って、二人が選べる未来を守り続けよう」 |
| YAMATO | BOND | 大和「次も海行くなら呼べ。荷物くらい持ってやる」 | 大和「おまえとだらだら波見てんのも、まあ悪くねえ」 |
| YAMATO | SPECIAL | 大和「他のやつと同じ夏だったとか思うなよ。おまえとの時間は別だ」 | 大和「……特別だって言ってんだ。二回も言わせんな」 |
| YAMATO | ROMANCE | 大和「恋人なら次の夏も勝手に隣にいろ。俺も勝手に守る」 | 大和「海でも帰り道でも、腹減ったら一緒に飯食おうぜ」 |
| YAMATO | TRUE_ROMANCE | 大和「魔法の炎で海が荒れても、おまえの帰る場所だけは絶対守る」 | 大和「使命だろうが敵だろうがぶっ飛ばして、最後は一緒に帰るぞ」 |
| LEON | BOND | レオン「次の海辺の公演も、君の特等席は空けておくよ」 | レオン「観客じゃなく、僕を高める大切な相手として感想を聞かせて」 |
| LEON | SPECIAL | レオン「夕暮れの浜辺でまで演技を忘れるなんて、君は本当に特別だね」 | レオン「この幕は急いで閉じず、二人でゆっくり続きを作ろう」 |
| LEON | ROMANCE | レオン「舞台の外でも、恋人という僕の最高の相手役でいて」 | レオン「次の夏も君の笑顔に、誰より派手なアンコールを贈るよ」 |
| LEON | TRUE_ROMANCE | レオン「魔法が世界の幕を下ろそうとしても、君となら新しい開演へ変えられる」 | レオン「幻奏の力も使命もすべて使って、二人の未来を最高の舞台にするよ」 |
| ELLIOT | BOND | エリオット「次の記録には、あなたと過ごす穏やかな海辺の一日を残したいです」 | エリオット「任務ではなく、私自身の希望としてまたお誘いします」 |
| ELLIOT | SPECIAL | エリオット「この世界の夏が特別なのは、あなたと見た景色があるからでしょう」 | エリオット「星界の言葉でも足りないこの想いを、次の季節も共に確かめたいです」 |
| ELLIOT | ROMANCE | エリオット「恋人として、どの世界からでもこの海辺のあなたへ帰ります」 | エリオット「記録ではなく、二人の思い出として次の夏を綴りましょう」 |
| ELLIOT | TRUE_ROMANCE | エリオット「星界の門が閉じても、あなたへ続く光だけは決して失いません」 | エリオット「使命を果たし、二つの世界と私たちの未来を必ずつなぎます」 |
| SAKUYA | BOND | 朔夜「次の夏の約束を私から求めるとは、以前なら考えられなかった」 | 朔夜「波音だけの平穏を、君ともう一度過ごしたい」 |
| SAKUYA | SPECIAL | 朔夜「過去を知ってなお隣にいる君は、私にとって既に特別だ」 | 朔夜「赦しは求めない。ただ次の季節も、今の私を見ていてほしい」 |
| SAKUYA | ROMANCE | 朔夜「恋人として君の隣を歩く。誰の命令でもなく、私自身の選択だ」 | 朔夜「静かな海辺も戦いの夜も、この手を離さず共に越えよう」 |
| SAKUYA | TRUE_ROMANCE | 朔夜「世界の敵意も古い封印も、君への道だけは閉ざさせない」 | 朔夜「闇の力と私の使命を背負い、この海も君との未来も守り抜く」 |

R6の `lines` は、正規ペアの女性・男性それぞれから同じrankの2行を取得し、現行画面と同じ4行構成へ組み立てる。これにより男性主人公でも女性主人公でも台詞資産を重複させない。

## 11. マジック編Vacation CG生成指示

### 11.1 共通プロンプト

```text
Japanese anime romance event CG for 学習ローグ マジック編, Magic Vacation Mode.
Use the established Vacation Mode designs of the selected heroine and male character.
Preserve face, hairstyle, hair color, eye color, age impression, accessories, height relationship, character colors and magic motifs.
Magical summer vacation at a Japanese seaside resort; tell the emotion through eye contact, distance, hands, shared actions and environment.
Age-appropriate high-school romance, gentle and non-sexualized.
Modest established vacation outfit; no body emphasis, no suggestive pose, no underwear-like styling.
R1-R3 are mostly untransformed. R4 may use transformed forms when the crisis requires magic. R5 returns to a quieter emotional scene. R6 follows the ending rank.
Cinematic 16:9 composition, polished cel shading, summer light and readable silhouettes.
No text, no speech balloons, no logo, no UI, no watermark.
```

### 11.2 対象別追加プロンプト

| 対象 | 追加語 |
|---|---|
| REN | `seaside wind, blue-green breeze magic, familiar easy distance, protective gesture, childhood-friend warmth` |
| SOMA | `resort itinerary, cool blue ice geometry, precise posture gradually softening, orderly travel details` |
| MINATO | `tide pools or aquarium blue light, healing water motif, earnest junior taking initiative, first-aid details` |
| RIKU | `harbor clock, lighthouse, star field, subtle time-ring particles, relaxed observant smile` |
| YAMATO | `summer festival or breakwater, warm fire motif, rough gesture hiding concern, energetic composition` |
| LEON | `open-air resort stage, violet illusion notes, theatrical framing becoming quiet and sincere` |
| ELLIOT | `ferry, lighthouse, astral stars over the sea, elegant restrained emotion, memory-photo motif` |
| SAKUYA | `isolated cove or shrine ruins, black-red sealing papers, restrained distance, dawn after darkness` |

### 11.3 段階別の画面構成

| Stage | 構図 |
|---|---|
| R1 | 二人の距離はやや広め。旅行先で偶然／待ち合わせした瞬間。場所が分かる引き気味の画角 |
| R2 | 同じ作業をする手元を入れる。パラソル、地図、記録、BBQ、音響など対象固有の共同作業 |
| R3 | 二人の距離を一段近づける。夕方〜夜、歩く／座る／写真を撮る等の静かな時間 |
| R4 | 魔法危機。安全なアクション構図。共闘が主で、恋愛ポーズにしない |
| R5 | 危機後の静けさ。岬、桟橋、防波堤、砂浜など、背景に海と夏の光。表情を最優先 |
| R6 BOND | 少し距離を残しながら次の約束。友人以上を匂わせるが恋人ポーズにしない |
| R6 SPECIAL | 隣に座る／同じ景色を見る。互いを特別と意識した穏やかな距離 |
| R6 ROMANCE | 恋人として並ぶ。手をつなぐ程度の年齢相応の親密さ |
| R6 TRUE | 恋人として並び、各キャラの魔法モチーフと海・星界の奇跡を大きく見せる |

### 11.4 生成時の人物固定

人物参照は次を優先する。

1. `docs/vacation-mode-protagonist-visual-plan.md` のVacation衣装
2. `MAGIC_EVENT_CHARACTER_GUIDE.md` の顔・髪・装飾・身長差
3. `src/data/magicRomanceDialogue.ts` の人物性とモチーフ
4. 本仕様書の対象別Vacation場面

CGごとに衣装色、髪飾り、眼鏡、武器、魔法属性を勝手に変更しない。

## 12. マジック編Vacationボイス

### 12.1 R1〜R5

本仕様書では、各キャラクターの段階別核台詞を共通化しているため、同じ人物の同じR段階の音声はペアごとに複製せず再利用できる。

```text
public/sfx/magic-event-voices/{CHARACTER_ID}/vacation-romance-r1.ogg
public/sfx/magic-event-voices/{CHARACTER_ID}/vacation-romance-r2.ogg
public/sfx/magic-event-voices/{CHARACTER_ID}/vacation-romance-r3.ogg
public/sfx/magic-event-voices/{CHARACTER_ID}/vacation-romance-r4.ogg
public/sfx/magic-event-voices/{CHARACTER_ID}/vacation-romance-r5.ogg
```

9ヒロイン＋8男性=17人 × R1〜R5 = **85本**。

`MagicRomanceGameEvent.voiceLines` は、表示される二人の `vacation-romance-rN` を順に渡す。ナレーションは音声化しない。

### 12.2 R6

R6は10.8の136行を正本とし、`getMagicEndingVoiceLine` と同じハッシュ規則でmanifestを作って生成する。

```text
public/sfx/magic-event-voices/{SPEAKER_ID}/ending-{hash}.ogg
```

R6 Vacation台詞は通常版と本文が異なるため、通常版の音声ファイルを流用しない。

- 17キャラ × 4ランク × 2行 = **136本**
- 各ペア・各rankのending画面では4本を再生するが、同じ人物・同じrankの台詞はペア間で再利用する。

### 12.3 音声生成共通指示

```text
Japanese anime game character voice for 学習ローグ Magic Vacation Mode.
Preserve the exact established character voice direction from src/data/magicRomanceDialogue.ts and docs/magic-voice-lines.md.
High-school age impression; natural, clean and emotionally restrained enough to remain age-appropriate.
Summer vacation warmth without changing personality.
Romance is conveyed through hesitation, relief, sincerity and gentle excitement, never sensual acting.
No whispery seduction, no mature erotic delivery, no kissing sounds.
Clean dry voice only. No BGM, no ocean sound, no room reverb, no sound effects.
```

## 13. 実装データ案

### 13.1 高校編

新規:

```text
src/data/highSchoolVacationEvents.ts
```

想定export:

```ts
export const HIGH_SCHOOL_VACATION_EVENTS: HighSchoolVacationEvent[] = [...90件];
export const getHighSchoolVacationEvent = (seed: string, act: number, recentIds?: string[]) => ...;
```

`eventService.ts` では `visualTheme === 'high-school' && player.appearanceMode === 'VACATION'` を先に判定し、通常高校イベントpoolの代わりにこの90件を使用する。

### 13.2 マジック編

新規:

```text
src/data/magicVacationRomanceDialogue.ts
```

想定export:

```ts
export const getMagicVacationRomanceDialogue = (
  heroId: string,
  targetId: string,
  stageIndex: number,
) => ...;

export const getMagicVacationRomanceEndingText = (
  heroId: string,
  targetId: string,
  affection: number,
) => ...;
```

`magicRomanceEventService.ts` で `appearanceMode` を受け取り、次だけresolverで切り替える。

- `dialogue`
- `description`
- `imageKey`
- `voiceLines`
- 選択画面のタイトル・導入文

次は共有する。

- affection
- stages
- selectedCounts
- completedEventIds
- reward
- REQUIRED_ACT_BY_STAGE
- 選択候補の重み

### 13.3 EventScreen resolver

```ts
// 高校編
high-school-vacation-event-0
  -> sprites/high-school/events/vacation/000.webp

// マジック恋愛 R1-R5
magic-romance-vacation:AKARI:REN:r1
  -> sprites/magic/events/romance/vacation/AKARI/REN/r1.webp
```

R6はEventScreenではなく `getMagicRomanceEndingText` / `magicEndingService.ts` の `imagePath` でVacation variantを返す。

### 13.4 MapScreen

`MapScreen.tsx` の背景選択に `appearanceMode` を含める。優先順位:

```text
1. high-school + VACATION -> high-school-vacation-map-actN
2. magic + VACATION      -> magic-vacation-map-actN
3. endless + STANDARD    -> 現行endless背景
4. high-school STANDARD  -> 現行high-school-map
5. magic STANDARD        -> 現行magic-map
6. elementary            -> 現行map
```

Vacation endlessは通常のendless背景resolverへ戻さず、4枚のVacation mapを上記の章帯割当で使う。

### 13.5 battleBackgrounds

`battleBackgrounds.ts` に次を追加。

```ts
HIGH_SCHOOL_VACATION_BATTLE_BACKGROUND_SCENES
MAGIC_VACATION_BATTLE_BACKGROUND_SCENES
```

`chooseBattleBackgroundScene` と `getBattleBackgroundSceneById` に `appearanceMode` を追加し、Vacation配列を先に選ぶ。scene IDは既存8種を維持し、保存済み `battleBackgroundId` との互換性を保つ。

### 13.6 バカンスモード説明文

旧表示:

```text
能力は変わらず、見た目だけが夏休み仕様になります。
```

新表示:

```text
能力は変わらず、衣装・マップ・戦闘背景・イベントが夏休み仕様になります。
```

解禁条件と能力差がない点は現行どおり維持する。

## 14. 素材制作数

### 14.1 背景・イベントCG

| 種別 | 数 |
|---|---:|
| 高校編Vacation map | 4 |
| マジック編Vacation map | 4 |
| 高校編Vacation battle | 8 |
| マジック編Vacation battle | 8 |
| 高校編VacationイベントCG | 90 |
| マジックR1〜R5 Vacation恋愛CG | 360 |
| マジックR6 Vacation ending CG（4ランク） | 288 |
| **合計** | **762** |

主人公Vacation立ち絵・戦闘シートは `docs/vacation-mode-protagonist-visual-plan.md` の別管理で、この762枚には含めない。

### 14.2 ボイス

| 種別 | 数 |
|---|---:|
| 高校編Vacation反応キュー | 9人×6 = 54 |
| マジックR1〜R5核台詞 | 17人×5 = 85 |
| マジックR6 ending voice | 17人×4ランク×2行 = 136 |
| **合計** | **275** |

## 15. 制作・実装順

1. 高校編4枚＋マジック編4枚のVacation mapを生成し、MapScreen切替を実装。
2. 高校編8枚＋マジック編8枚のVacation battle背景を生成し、flavor logと一緒に実装。
3. 高校編90イベントデータを `HSV001..HSV090` で実装し、CGなしでもカテゴリfallbackで動作確認。
4. 高校編90CGを生成し、`000..089.webp` に割り当てる。
5. 高校編54本のVacation短ボイスを生成。
6. `magicVacationRomanceDialogue.ts` を作成し、R1〜R5の場面・核台詞・既存選択効果を接続。
7. マジックR1〜R5 CG 360枚を生成。
8. マジックR1〜R5用85本の核台詞ボイスを生成。
9. 10.8のR6全136行をVacation endingデータへ実装し、4ランクCG 288枚を生成。
10. R6台詞からending voice manifestを生成し、136本の音声を作成。
11. `assetPreloadService.ts` / `magicAssetManifest.ts` へ新素材を追加。
12. デバッグ画面から、STANDARD/VACATION両方で全背景・全イベント・全恋愛段階・全音声を確認。

## 16. 完了条件

- 高校編 `VACATION` でマップが通常校舎へ戻らず、4Actすべて海辺Vacation背景になる。
- マジック編 `VACATION` で4ActすべてMagic Vacation背景になる。
- 両編の通常戦・ELITE・BOSSでVacation戦闘背景が選ばれ、ログもVacation文体になる。
- 高校編 `VACATION` の `?` マスはHSV001〜HSV090の90件だけから選ばれる。
- HSV001〜HSV090に欠番・重複IDがない。
- 高校編の効果は既存 `HighSchoolEffect` で処理し、Vacation専用の不要な永続パラメータを増やさない。
- マジック編恋愛のaffection/stages等はSTANDARDと共有され、Vacationへ切り替えても進行が分裂しない。
- マジックR1〜R5でVacation専用CG・セリフ・voice lineが出る。
- R6はBOND/SPECIAL/ROMANCE/TRUE_ROMANCEの4ランクすべてVacation CGへ切り替わる。
- R6は10.8の136台詞から生成したVacation ending voiceを再生する。
- 男性主人公／女性主人公のどちらから開始しても、同一男女ペアは正規化された同じCGを参照する。
- STANDARDでは既存背景・既存イベント・既存恋愛CG/台詞が一切変わらない。
- セーブ再開後も `appearanceMode === 'VACATION'` が維持され、途中で通常背景へ戻らない。
- 素材不足時は画面を空白にせず、同カテゴリVacation fallback、最後に既存共通fallbackの順で安全に表示する。

## 17. 関連資料

- `docs/vacation-mode-protagonist-visual-plan.md` — Vacation主人公衣装・戦闘シート
- `MAGIC_ROMANCE_EVENT_MATRIX.md` — 通常版R1〜R6構造の原典
- `ROMANCE_SYSTEM.md` — 好感度・恋愛進行の基本
- `MAGIC_EVENT_CHARACTER_GUIDE.md` — マジック人物外見固定
- `BACKGROUND_LIST.md` — 通常マジック背景
- `docs/high-school-voice-lines.md` — 高校編9人の声質
- `docs/magic-voice-lines.md` — マジック編の声質
- `src/data/magicRomanceDialogue.ts` — 現行人物口調・通常恋愛台詞
- `src/services/magicRomanceEventService.ts` — R1〜R5恋愛イベント実装
- `src/services/magicEndingService.ts` — R6 ending/voice実装
- `src/data/battleBackgrounds.ts` — 現行戦闘背景とflavor log
- `src/components/MapScreen.tsx` — 現行map背景resolver
- `src/components/EventScreen.tsx` — event CG resolver

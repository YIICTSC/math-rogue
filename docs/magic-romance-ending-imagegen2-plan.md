# マジック恋愛エンド ImageGen2 生成計画

## 目的

現在の `r6.webp` は恋愛エンド用イラストとして維持する。  
不足している以下のランク別イラストを全恋愛組み合わせ分作成する。

- 絆エンド
- 特別な関係エンド
- 真恋愛エンド

## 対象数

| 主人公側 | 組み合わせ数 | 追加ランク数 | 追加画像数 |
|---|---:|---:|---:|
| 女性主人公9人 × 男性対象8人 | 72 | 3 | 216 |

男性主人公側の恋愛エンド画像追加は、現行実装では未対象。必要になった場合は別途同じ規則で追加する。

## ファイル命名規則

既存:

```text
public/sprites/magic/events/romance/{HERO_ID}/{TARGET_ID}/r6.webp
```

追加:

```text
public/sprites/magic/events/romance/{HERO_ID}/{TARGET_ID}/r6-bond.webp
public/sprites/magic/events/romance/{HERO_ID}/{TARGET_ID}/r6-special.webp
public/sprites/magic/events/romance/{HERO_ID}/{TARGET_ID}/r6-true.webp
```

## ランク別の絵作り

### 絆エンド

- 距離感：恋愛未満、信頼と再会の約束
- 表情：穏やか、少し照れ、前向き
- 構図：並んで歩く、少し離れて同じ景色を見る、放課後の帰り道など
- 避ける：明確な告白、抱擁、キス、強い恋愛演出

### 特別な関係エンド

- 距離感：友達以上、恋人未満
- 表情：互いを特別に意識している
- 構図：手が触れそう、同じ傘、秘密の場所で向き合う、共同作業
- 避ける：真恋愛ほどの劇的演出

### 真恋愛エンド

- 距離感：恋と使命を共に選ぶ確定ルート
- 表情：強い信頼、幸福、決意
- 構図：手を取り合う、魔法の光の中で誓う、世界境界や星空を背負う
- 避ける：過度に暗い敗北感、片方だけが主役の構図

## 共通スタイル制約

- 既存の `r1.webp`〜`r6.webp` と同じビジュアル文脈に合わせる。
- キャラクターの髪色、衣装、属性色、性格印象を崩さない。
- 16:9 横長のイベントCGとして使える構図にする。
- UI上で文字パネルが乗るため、中央〜下部に過密な重要情報を置きすぎない。
- 文字、ロゴ、透かしは入れない。
- 同一ペア内でも、絆・特別・真恋愛でシチュエーションを明確に変える。

## 実装切り替え方針

画像生成が完了してから `getMagicRomanceEndingText` の `imagePath` を以下に切り替える。

```ts
BOND: `sprites/magic/events/romance/${hero.id}/${target.id}/r6-bond.webp`
SPECIAL: `sprites/magic/events/romance/${hero.id}/${target.id}/r6-special.webp`
ROMANCE: `sprites/magic/events/romance/${hero.id}/${target.id}/r6.webp`
TRUE_ROMANCE: `sprites/magic/events/romance/${hero.id}/${target.id}/r6-true.webp`
```

## 現在のブロッカー

この環境では `OPENAI_API_KEY` が未設定のため、ImageGen2 API経由の一括生成は未実行。  
キー設定後に生成を実行し、出力を上記パスへ配置する。

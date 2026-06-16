# マジック編 男性主人公化 実装段取り

## 目的

マジック編の主人公選択画面で、女性主人公9人と恋愛対象男性8人を切り替えて選べるようにする。
男性主人公選択時は、既存の恋愛対象キャラクターを主人公として扱い、?マスでは女性主人公側とのイベント画像を流用する。

## 対象キャラクター

- 朝霧 蓮
- 御影 颯真
- 白石 湊
- 天音 理玖
- 黒瀬 大和
- 神代 レオン
- エリオット・ノクス
- 九条 朔夜

## 必要アセット

各キャラクターごとに以下を作成する。

- 通常立ち絵
- 変身後立ち絵
- 通常アクション
- 変身後アクション
- 通常スキル
- 変身後スキル

保存予定:

- `public/sprites/magic/male-characters/{target-id}-before.png`
- `public/sprites/magic/male-characters/{target-id}-after.png`
- `public/sprites/magic/male-characters-attack/{target-id}-before.png`
- `public/sprites/magic/male-characters-attack/{target-id}-after.png`
- `public/sprites/magic/male-characters-skill/{target-id}-before.png`
- `public/sprites/magic/male-characters-skill/{target-id}-after.png`

## 実装順

1. ImageGen2で男性8人の3x1シートを通常/変身後それぞれ作成
2. 既存の高精度切り抜き方式で、立ち絵/アクション/スキルを個別PNG化
3. `magicHeroes.ts` に男性主人公定義を追加、または `magicPlayableCharacters.ts` を新設
4. 主人公選択画面に `女子 / 男子` のセグメント切替を追加
5. `getThemedCharacterSpritePath` に男性主人公用パス解決を追加
6. ?マスイベント生成時、男性主人公なら女性主人公側を相手候補として選出
7. セリフ生成を男性主体に切替
8. 男性主人公の友情/恋愛エンド分岐を追加

## 画像流用方針

男性主人公時の?マスイベント画像は、既存の女性主人公イベント画像を優先して流用する。
不足する場合のみ、男性主人公用イベント画像を追加生成する。

## 注意点

- 既存の女性主人公9人の選択・進行を壊さない
- `GameState.player.id` とマジック主人公IDの対応を明確に分離する
- 恋愛対象男性を主人公として使う場合、同じキャラクターが恋愛対象候補に出ないよう除外する
- 男性主人公時の会話は、男性側が能動的に話を進める文体にする

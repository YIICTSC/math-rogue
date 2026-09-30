# 学ロカート 8コース別BGM候補

各コースの雰囲気に合わせ、学習ローグ本編のエリア曲・各編の戦闘曲・既存ミニゲーム曲から選ぶためのメモです。以下の曲を採用し、曲名や割当は後から書き換えられます。

**新旧の指定:** 曲名に `（旧）` が付く場合は旧版を再生します。指定がない曲は新曲を再生します。このルールはタイトル画面のBGM設定に関係なく適用します。

## コース別候補

| # | コース | 第一候補 | 代替候補 | 選定メモ | 採用曲・変更メモ |
|---:|---|---|---|---|---|
| 1 | NEON CAMPUS（ネオン・キャンパス） | `high-school/battle` | `school_psyche` | 高校編の戦闘曲を軸に、学校らしい雰囲気なら一般教室の曲へ。 | `high-school/battle` |
| 2 | CLOUD GARDEN（クラウド・ガーデン） | `paper_plane_battle（旧）` | `paper_plane_battle` | 空や雲の開放感を優先。レースの勢いを強めたい場合は紙飛行機バトル曲へ。 | `paper_plane_battle（旧）` |
| 3 | SOLAR WORKS（ソーラー・ワークス） | `survivor_metal（旧）` | `survivor_metal` | 理科室エリア曲を工業・技術系の景色に合わせる。より激しい印象ならサバイバー曲へ。 | `survivor_metal（旧）` |
| 4 | LIBRARY LOOP（図書館ループ） | `paper_plane_battle` | `paper_plane_battle` | 図書室エリア曲がコースの題材に直結。曲調が穏やかすぎる場合はレース向け候補へ。 | `paper_plane_battle` |
| 5 | FOREST CLASSROOM（森の教室） | `paper_plane_vacation` | `paper_plane_vacation` | 屋上エリア曲の開放感を屋外コースに活用。より明るい雰囲気なら休暇曲へ。 | `paper_plane_vacation` |
| 6 | HARBOR SCHOOL（海辺の学校） | `high-school/map` | `paper_plane_vacation` | 探索・移動曲で海辺を走る印象に。爽やかさを強める場合は休暇曲へ。 | `high-school/map` |
| 7 | AURORA LAB（オーロラ研究所） | `magic-female/battle（旧）` | `dungeon_science` / `kocho_battle` | 魔法編・女性主人公の旧版戦闘曲を採用。研究所らしさなら理科室曲、決戦感を出すなら校長戦曲。 | `magic-female/battle（旧）` |
| 8 | STADIUM SPRINT（放課後スタジアム） | `magic-male/final_boss（旧）` | `survivor_metal` | 体育館エリア曲をスポーツ会場に。大会の盛り上がりを強めたい場合はサバイバー曲へ。 | `magic-male/final_boss（旧）` |

## 共通シーン候補

| シーン | 候補 | メモ |
|---|---|---|
| ロビー・コース選択 | `paper_plane_setup` / `menu` | レース開始前の準備用。 |
| カウントダウン・走行 | 各コースの採用曲 | カウントダウンから走行へ曲を途切れさせずにつなぐ。 |
| 問題表示・選択レーン | 走行中の曲を継続 | 曲を切り替えず、問題表示中だけBGMを少し下げて問題文とSEを聞きやすくする。 |
| 全員の順位確定後 | `victory` | リザルト・表彰用。 |
| 次コース選択 | `paper_plane_setup` | 次のレースへの準備に戻す。 |

## 既存素材の場所

- 標準曲: `public/web-audio/bgm-new/<曲名>.ogg`（旧版は `public/web-audio/bgm/<曲名>.ogg`）
- 高校編の曲: `public/web-audio/bgm-new/high-school/`
- 魔法編の曲: `public/web-audio/bgm-new/magic-female/`、`public/web-audio/bgm-new/magic-male/`

各編のテーマに対応した曲は、利用可能な主人公・ビジュアルテーマに合わせて選ぶ想定です。コース曲として確定する前に、レース効果音と重ねてテンポ・音量・ループのつながりを試聴してください。

# 星潮の航路のBGM選定

選定対象は `public/bgm` と `public/bgm-new` の全143 MP3ファイル（新旧・小学生編・高校編・魔法編男女・共通ミニゲーム曲）。Web用Opusは同曲の配信形式違いとして扱う。曲の用途と物語・地形の対応から選び、割当は `src/mini-games/star-tide/music.ts` に集約する。下表は採用意図であり、全曲の試聴記録ではない。

| 島 | 探索曲 | 選定意図 |
|---|---|---|
| 漂着の入江 | `NEW high-school/map` | 海辺から航海へ踏み出す場面 |
| 木霊の樹海 | `OLD magic-female/map` | 森と失われた名前の探索 |
| 硝子の干潟 | `NEW magic-female/map` | 硝子と星灯の幻想的な景観 |
| 時計の丘 | `NEW dungeon_music` | 時計と仕掛けをめぐる探索 |
| 白銀の峡谷 | `OLD magic-male/rest` | 雪と手紙の静かな旅 |
| 熾火の火山 | `OLD magic-male/battle` | 火山と鍛冶の緊張感 |
| 夜凪の海岸 | `OLD magic-male/event` | 影の船と喪失の記憶 |
| 星砂の砂漠 | `OLD map` | 道を探す長い旅 |
| 雨音の都 | `NEW high-school/event` | 雨と町の声を拾う場面 |
| 雲梯の浮島 | `OLD paper_plane_battle` | 空と風の開放感 |
| 月鏡の廃都 | `OLD dungeon_library` | 廃都で明らかになる記録 |
| 暁星の灯台 | `NEW magic-male/map` | 最後の灯台へ向かう旅 |

| 場面 | 採用曲・方針 |
|---|---|
| タイトル | NEW magic/menu |
| 導入 | OLD magic-male/event |
| 各島のストーリー・会話 | 島の感情に合わせたevent/rest/relic_select曲。セリフごとの再始動はしない |
| 地下・仕掛けの部屋 | 島別にdungeon_music/library/science、school_psyche、event、relic_select |
| 空域 | NEW paper_plane_vacation |
| 帆の入手 | NEW paper_plane_battle |
| キャンプ | OLD rest |
| 通常戦闘 | NEW high-school/battle、NEW magic-female/battle、OLD battle、NEW magic-male/battle |
| 島のボス | NEW magic-female/boss、OLD magic-male/boss、NEW dungeon_boss、NEW high-school/boss |
| 最終ボス | NEW magic-male/final_boss |
| 学習 | NEW magic-female/math |
| ボス撃破 | NEW magic-female/victoryを3秒後に探索曲へ戻す |
| 通常エンディング | NEW magic-female/reward |
| 共生エンディング | NEW magic-female/victory |

通常戦闘は敵が5.5マス以内に入った時に切り替え、離れても敵が残る間は3秒の猶予を置く。画面更新や冒険手帳で音源を再生成せず、退場時は外側の画面の曲へ復帰する。保存済みのBGMモード・テーマ・音量設定を書き換えない。ボイスは既存の独立音声チャンネルを維持する。

検証: `pnpm run test:star-tide:music`。全12島の場面解決、採用音源の存在、ブラウザ上の実再生URL・再生時間、手帳とHUDでの継続、戦闘猶予、ボス撃破、設定保持、退場時復帰を確認する。

<details><summary>検討対象の全ライブラリ一覧</summary>

### bgm（72曲）

- `bgm/battle.mp3`
- `bgm/boss.mp3`
- `bgm/dungeon_boss.mp3`
- `bgm/dungeon_gym.mp3`
- `bgm/dungeon_library.mp3`
- `bgm/dungeon_music.mp3`
- `bgm/dungeon_roof.mp3`
- `bgm/dungeon_science.mp3`
- `bgm/event.mp3`
- `bgm/final_boss.mp3`
- `bgm/game_over.mp3`
- `bgm/high-school/battle.mp3`
- `bgm/high-school/boss.mp3`
- `bgm/high-school/event.mp3`
- `bgm/high-school/final_boss.mp3`
- `bgm/high-school/game_over.mp3`
- `bgm/high-school/map.mp3`
- `bgm/high-school/math.mp3`
- `bgm/high-school/menu.mp3`
- `bgm/high-school/mid_boss.mp3`
- `bgm/high-school/relic_select.mp3`
- `bgm/high-school/rest.mp3`
- `bgm/high-school/reward.mp3`
- `bgm/high-school/shop.mp3`
- `bgm/high-school/victory.mp3`
- `bgm/kocho_battle.mp3`
- `bgm/kocho_boss.mp3`
- `bgm/kocho_setup.mp3`
- `bgm/magic/menu.mp3`
- `bgm/magic-female/battle.mp3`
- `bgm/magic-female/boss.mp3`
- `bgm/magic-female/event.mp3`
- `bgm/magic-female/final_boss.mp3`
- `bgm/magic-female/game_over.mp3`
- `bgm/magic-female/map.mp3`
- `bgm/magic-female/math.mp3`
- `bgm/magic-female/menu.mp3`
- `bgm/magic-female/mid_boss.mp3`
- `bgm/magic-female/relic_select.mp3`
- `bgm/magic-female/rest.mp3`
- `bgm/magic-female/reward.mp3`
- `bgm/magic-female/shop.mp3`
- `bgm/magic-female/victory.mp3`
- `bgm/magic-male/battle.mp3`
- `bgm/magic-male/boss.mp3`
- `bgm/magic-male/event.mp3`
- `bgm/magic-male/final_boss.mp3`
- `bgm/magic-male/game_over.mp3`
- `bgm/magic-male/map.mp3`
- `bgm/magic-male/math.mp3`
- `bgm/magic-male/mid_boss.mp3`
- `bgm/magic-male/relic_select.mp3`
- `bgm/magic-male/rest.mp3`
- `bgm/magic-male/reward.mp3`
- `bgm/magic-male/shop.mp3`
- `bgm/magic-male/victory.mp3`
- `bgm/map.mp3`
- `bgm/math.mp3`
- `bgm/menu.mp3`
- `bgm/mid_boss.mp3`
- `bgm/paper_plane_battle.mp3`
- `bgm/paper_plane_setup.mp3`
- `bgm/paper_plane_vacation.mp3`
- `bgm/poker_play.mp3`
- `bgm/poker_shop.mp3`
- `bgm/relic_select.mp3`
- `bgm/rest.mp3`
- `bgm/reward.mp3`
- `bgm/school_psyche.mp3`
- `bgm/shop.mp3`
- `bgm/survivor_metal.mp3`
- `bgm/victory.mp3`

### bgm-new（71曲）

- `bgm-new/battle.mp3`
- `bgm-new/boss.mp3`
- `bgm-new/dungeon_boss.mp3`
- `bgm-new/dungeon_gym.mp3`
- `bgm-new/dungeon_library.mp3`
- `bgm-new/dungeon_music.mp3`
- `bgm-new/dungeon_roof.mp3`
- `bgm-new/dungeon_science.mp3`
- `bgm-new/event.mp3`
- `bgm-new/final_boss.mp3`
- `bgm-new/game_over.mp3`
- `bgm-new/high-school/battle.mp3`
- `bgm-new/high-school/boss.mp3`
- `bgm-new/high-school/event.mp3`
- `bgm-new/high-school/final_boss.mp3`
- `bgm-new/high-school/game_over.mp3`
- `bgm-new/high-school/map.mp3`
- `bgm-new/high-school/math.mp3`
- `bgm-new/high-school/menu.mp3`
- `bgm-new/high-school/mid_boss.mp3`
- `bgm-new/high-school/relic_select.mp3`
- `bgm-new/high-school/rest.mp3`
- `bgm-new/high-school/reward.mp3`
- `bgm-new/high-school/shop.mp3`
- `bgm-new/high-school/victory.mp3`
- `bgm-new/kocho_battle.mp3`
- `bgm-new/kocho_boss.mp3`
- `bgm-new/kocho_setup.mp3`
- `bgm-new/magic/menu.mp3`
- `bgm-new/magic-female/battle.mp3`
- `bgm-new/magic-female/boss.mp3`
- `bgm-new/magic-female/event.mp3`
- `bgm-new/magic-female/final_boss.mp3`
- `bgm-new/magic-female/game_over.mp3`
- `bgm-new/magic-female/map.mp3`
- `bgm-new/magic-female/math.mp3`
- `bgm-new/magic-female/mid_boss.mp3`
- `bgm-new/magic-female/relic_select.mp3`
- `bgm-new/magic-female/rest.mp3`
- `bgm-new/magic-female/reward.mp3`
- `bgm-new/magic-female/shop.mp3`
- `bgm-new/magic-female/victory.mp3`
- `bgm-new/magic-male/battle.mp3`
- `bgm-new/magic-male/boss.mp3`
- `bgm-new/magic-male/event.mp3`
- `bgm-new/magic-male/final_boss.mp3`
- `bgm-new/magic-male/game_over.mp3`
- `bgm-new/magic-male/map.mp3`
- `bgm-new/magic-male/math.mp3`
- `bgm-new/magic-male/mid_boss.mp3`
- `bgm-new/magic-male/relic_select.mp3`
- `bgm-new/magic-male/rest.mp3`
- `bgm-new/magic-male/reward.mp3`
- `bgm-new/magic-male/shop.mp3`
- `bgm-new/magic-male/victory.mp3`
- `bgm-new/map.mp3`
- `bgm-new/math.mp3`
- `bgm-new/menu.mp3`
- `bgm-new/mid_boss.mp3`
- `bgm-new/paper_plane_battle.mp3`
- `bgm-new/paper_plane_setup.mp3`
- `bgm-new/paper_plane_vacation.mp3`
- `bgm-new/poker_play.mp3`
- `bgm-new/poker_shop.mp3`
- `bgm-new/relic_select.mp3`
- `bgm-new/rest.mp3`
- `bgm-new/reward.mp3`
- `bgm-new/school_psyche.mp3`
- `bgm-new/shop.mp3`
- `bgm-new/survivor_metal.mp3`
- `bgm-new/victory.mp3`

</details>

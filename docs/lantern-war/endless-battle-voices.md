# 無窮航路の新主人公・戦闘音声

最新main `7dd4373e` のエンドレス追加キャラクター4人を対象とする。既存キャラクターの音声・本編台本・ナレーション・戦闘素材は維持し、専用フォルダに戦闘音声だけを追加する。

| 主人公 | 人物・声の設計 | 固有必殺 |
| --- | --- | --- |
| ヴェスパー | 銀髪の女将軍。成人女性の落ち着いた中低音、威厳と守る決意。 | 贖いの城塞 |
| セーブル | 離反した狙撃手。成人男性の低めの声、静かな確信と仲間への温かさ。 | 夜明けの照準 |
| ミレア | 珊瑚岬の灯台守。成人女性の澄んだ中音域、親しみやすさと芯の強さ。 | 真夏の灯台 |
| カイ | 潮風の入江の守護者。成人男性の穏やかな中低音、柔らかさと揺るがぬ決意。 | 潮騒の祝福 |

各7本（攻撃・被弾・回復・必殺・援護・勝利・敗北）、計28本。台詞は `endlessBattleVoiceLines.json` を再生処理と生成計画で共有する。新しい個人技・戦闘ルール・解放条件は追加しない。

ミレアとカイはあかり・レンの衣装差分ではなく、別の主人公としてプロフィール、加入会話、声を独立させる。4人とも立ち絵に基づく新しい参照音声を作り、別の主人公の声は流用しない。既存セーブの加入・経験値・編成・素材参照を維持するため、内部ID `end-hikari` / `end-ren` は保持する。読込時に旧会話が保存された戦場・再戦用チェックポイントと旧名の記録を更新する。

## 生成・検証

- 公式Irodori-TTSの現行コードとモデルを確認し、v4.1-Small-MFを使用。モデル・codecともCPU固定、bf16、2 threads。
- 参照設計8 steps、通常戦闘4 steps、必殺8 steps。種別ごとの演技と固有技の読みを計画に記録する。
- モデル・コードrevision、seed、参照hash、音声hash、尺を `assets/lantern-war/endless/voice-build.json` に保存。
- 元の681再生エントリの基準を `baseline.json` に記録。新規28本は既存manifestへ加算し、元の再生エントリを保持する。
- ASR・波形検査を行い、疑わしい発音は強いASRまたは再生成で解決する。検査未解決の音源は公開しない。
- TTSとASRは `cpu-audio-heavy.lock` で排他制御する。重複生成を避け、記録済みの音声から再開できる。

```sh
node scripts/lantern-war/prepare-endless-voices.mjs
/workspace/Irodori-TTS/.venv/bin/python scripts/lantern-war/generate-endless-voices.py --batch-size 1
/workspace/Irodori-TTS/.venv/bin/python scripts/lantern-war/review-endless-voices.py
# 検査結果と同じ音源hashの採用記録を確認してから実行
node scripts/lantern-war/finalize-endless-voices.mjs
node scripts/test-lantern-endless-identity.mjs
node scripts/test-lantern-endless-voices.mjs
```

元の本編用 `prepare-story-techniques.mjs` をこの追加生成に使わない。本編の全台詞や参照音声を作り直さないため、追加専用の計画・生成記録・レビューを使う。既存の本編finalize処理を実行した場合も、検証済みのエンドレス音声を最後に加算する。

## 台詞・試聴

主人公名のリンクは声を統一するための参照音声、各台詞のリンクは実際に戦闘で再生する音源です。

| 主人公 | 攻撃 | 被弾 | 回復 | 必殺 | 援護 | 勝利 | 敗北 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [ヴェスパー](../../assets/lantern-war/endless/references/end-vesper.ogg) | [道を開ける！](../../public/sfx/lantern-war/endless/end-vesper/38161a2b6ba26ad2ae1b.ogg) | [まだ倒れぬ！](../../public/sfx/lantern-war/endless/end-vesper/c1cafef79394d3b0e63b.ogg) | [感謝する。](../../public/sfx/lantern-war/endless/end-vesper/fc272b0dec3b3635cc51.ogg) | [贖いの城塞！](../../public/sfx/lantern-war/endless/end-vesper/4a80313bfc607a803ba9.ogg) | [背中は私が守る！](../../public/sfx/lantern-war/endless/end-vesper/0e7227e6e3fff4deb260.ogg) | [今度こそ、守り抜いた。](../../public/sfx/lantern-war/endless/end-vesper/5fccec8eb955ca97c53c.ogg) | [皆を、頼む。](../../public/sfx/lantern-war/endless/end-vesper/2d01897b9c6376b522c3.ogg) |
| [セーブル](../../assets/lantern-war/endless/references/end-sable.ogg) | [そこだ！](../../public/sfx/lantern-war/endless/end-sable/b0a2d75cf38c93f5e54e.ogg) | [まだ、撃てる！](../../public/sfx/lantern-war/endless/end-sable/caec86a33a152b0cf8a0.ogg) | [助かった。](../../public/sfx/lantern-war/endless/end-sable/868f922b990ad1afe0bf.ogg) | [夜明けの照準！](../../public/sfx/lantern-war/endless/end-sable/48320ba9a5396e21da71.ogg) | [援護する！](../../public/sfx/lantern-war/endless/end-sable/80591dd18a32ee0bad79.ogg) | [全員、無事だな。](../../public/sfx/lantern-war/endless/end-sable/f14b0cb4351784fe9d37.ogg) | [先に、行け。](../../public/sfx/lantern-war/endless/end-sable/5198363a387ff4b34066.ogg) |
| [ミレア](../../assets/lantern-war/endless/references/end-hikari.ogg) | [いくよ！](../../public/sfx/lantern-war/endless/end-hikari/03cc1383672222f57851.ogg) | [まだ平気！](../../public/sfx/lantern-war/endless/end-hikari/c04e5fc24080c4871464.ogg) | [ありがとう！](../../public/sfx/lantern-war/endless/end-hikari/33483456949ec66ba259.ogg) | [真夏の灯台！](../../public/sfx/lantern-war/endless/end-hikari/73aaa35ed074f6d3fd92.ogg) | [一緒に帰ろう！](../../public/sfx/lantern-war/endless/end-hikari/691f52449c232f98957e.ogg) | [みんな、おつかれさま！](../../public/sfx/lantern-war/endless/end-hikari/739ba12c34f738d681ba.ogg) | [ごめんね……あとは、お願い。](../../public/sfx/lantern-war/endless/end-hikari/85629dbb5e2f479bc7ea.ogg) |
| [カイ](../../assets/lantern-war/endless/references/end-ren.ogg) | [そこまでだ！](../../public/sfx/lantern-war/endless/end-ren/02bf92999839508160b9.ogg) | [まだ、守れる！](../../public/sfx/lantern-war/endless/end-ren/9d3bc642ecafd777b7c9.ogg) | [ありがとう。助かった。](../../public/sfx/lantern-war/endless/end-ren/1fa9f534ea257a8b8478.ogg) | [潮騒の祝福！](../../public/sfx/lantern-war/endless/end-ren/30ec63236086ce0d1c52.ogg) | [君は僕が守る！](../../public/sfx/lantern-war/endless/end-ren/9c70c794ca3ae12c3608.ogg) | [さあ、みんなで帰ろう。](../../public/sfx/lantern-war/endless/end-ren/04c6e215f2a7e05fbe8a.ogg) | [帰る場所を、頼む。](../../public/sfx/lantern-war/endless/end-ren/e020ae6cf99dcdfc5361.ogg) |

発音を再調整した4本は `voice-corrections.json` に読み・尺・seedを記録。退けた音源のhashと不採用理由は `rejected-takes.json`、固有技の辞書補助検査は `voice-review-dictionary.json` に記録しています。既存の681件の再生設定の保持と、新規28本のCPU生成・音源hash・発音・波形を検証しています。

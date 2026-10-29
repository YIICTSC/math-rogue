# 戦記のボイス再設計

ユーザー指示により、追加120技向けの試作カットイン、12フレーム素材、Blender生成元、専用音声を破棄。戦記専用に生成した音声はストーリー・ナレーション・戦闘・支援を含めてすべて破棄し、再生一覧から除去した。技の習得や作戦機能は保持する。他ゲームの元音声、共用カットイン、元アニメーションは保持する。

アステル・リュラの旧参照音声と旧戦記音声も破棄。画像 `public/sprites/lantern-war/heroes/{aster,lyra}-ready.webp` を確認し、次の新規声質を設計する。

- アステル：青髪・白金の鎧の若い剣士に合う、爽やかで芯のある青年男性。誠実で勇敢、会話では温かく、決意はまっすぐに。
- リュラ：赤い編み髪の女剣士に合う、凛とした若い女性。透明感と気品、優しさ、戦闘での力強さを両立。

`assets/lantern-war/voice-policy.json` でストーリー音声の再生成を停止し、2人を見本生成中として扱う。`catalog.mjs` / `prepare-voices.py` はこの方針を尊重する。

見本は `audition-plan.json` と `generate-auditions.py` で生成する。会話・戦闘の各2本を、同じ新規参照音声から生成。参照設計16 steps、見本12 steps、モデルとcodecはCPU・bf16。Irodori-TTSとモデルのrevision・seed・参照音声のhashは `audition-build.json` に記録する。見本を本編の全台詞としては登録しない。

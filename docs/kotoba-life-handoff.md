# ことば日和 — 引継ぎ

2026-10-29: 実装・最終検証完了。`bb3c77fc` のmainを取り込み、競合を統合した。仕様・構成は [kotoba-life.md](./kotoba-life.md)。

5種類のリアルタイム3D動物、8つの実写風の部屋、3人の町の住人、語彙学習・エネルギー・学習問題チャージ、無料の会話・お世話・外出、成長と保存、レスポンシブUIを実装。会話は144話題と各キャラ専用の返答、部屋・時間帯・学んだ言葉等を組み合わせる。RPGの独自かな合成エンジンを共用し、8人に個別の声を割り当てる。

通過した確認:

- `node scripts/test-kotoba-life.mjs`: エネルギー・重複語・読み・600回会話・5キャラ全話題のかな対応・保存・8声のPCM。
- `node scripts/test-kotoba-life-browser.mjs`: 5キャラ・8部屋・町3箇所・実問題チャージ・キャンセル・保存復元・320/390/844/1280幅・英語・WebGLフォールバック。画像は `tmp/kotoba-life-browser/`。
- `node scripts/test-rpg-resident-voice.mjs`: 実Web Audio再生・停止・ミュート。
- `pnpm run build`: 型チェックと英語UI gateを含む。
- `pnpm run server:build`。

ユーザーの指示による5時間間隔の再開予約: 「ことば日和の実装を再開」、内部ID `6ae19f8cb0f48191896f1fdbeeb4b121`。mainへのpush成功を確認したら停止する。すでにmainへこの実装が反映されている場合は再実装しない。Actions/Renderは監視・デプロイしない。

元からのstash `star-tide-story-in-progress` は変更していない。今回のmain同期用に作った `kotoba-main-sync` はコミット前のバックアップであり、再適用は不要。

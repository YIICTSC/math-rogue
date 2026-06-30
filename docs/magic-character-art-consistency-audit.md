# Magic Character Art Consistency Audit

## Scope

マジック編の主人公・恋愛対象について、変身前後の立ち絵、アクション、スキル、専用カード、基本カード、恋愛イベント画像を比較し、髪型・髪色・服装の大きな不一致を最小限の差し替えで補正した。

確認用シートは `tmp/magic-art-audit/` に作成した。

## Updated Assets

### Protagonist Standing / Action / Skill

- `public/sprites/magic/heroines/heroine-05-before-sheet.webp`
- `public/sprites/magic/heroines/heroine-06-before-sheet.webp`
- `public/sprites/magic/heroines/heroine-07-before-sheet.webp`
- `public/sprites/magic/heroines/heroine-07-after-sheet.webp`
- `public/sprites/magic/heroines/heroine-09-before-sheet.webp`
- `public/sprites/magic/heroines/heroine-09-after-sheet.webp`
- `public/sprites/magic/generated-sources/male-protagonist-sheets/yamato-before-3x1-source.webp`
- `public/sprites/magic/generated-sources/male-protagonist-sheets/yamato-after-3x1-source.webp`

上記から、対応する `characters`、`characters-attack`、`characters-skill` の切り出し画像も再生成した。

### Basic Card Images

以下の主人公は、修正後の立ち絵に合わせて基本カード `strike`、`guard`、`focus` を再生成した。

- `REI`
- `MADOKA`
- `KOHARU`
- `SERA`
- `YAMATO`

### Romance Event Images

颯真と朔夜のイベント画像で、対象男性の特徴が入れ替わっていた箇所を補正した。

- `MADOKA/SOMA` と `MADOKA/SAKUYA` の `r1-r6`
- `MIRAI/SOMA` と `MIRAI/SAKUYA` の `r1-r6`
- `SERA/SOMA` と `SERA/SAKUYA` の `r1-r6`
- `AKARI/SOMA` と `AKARI/SAKUYA` の `r6`
- `HIYORI/SOMA` と `HIYORI/SAKUYA` の `r6`
- `KOHARU/SOMA` と `KOHARU/SAKUYA` の `r6`
- `REI/SOMA` と `REI/SAKUYA` の `r6`
- `SHIZUKU/SOMA` と `SHIZUKU/SAKUYA` の `r6`
- `TSUBASA/SOMA` と `TSUBASA/SAKUYA` の `r6`

追加で、`KOHARU/SOMA` の `r1-r5` は構図を維持したまま颯真の髪色を銀灰色へ補正した。

朔夜側で短髪男子になっていた以下は、新規生成したシートから差し替えた。

- `MADOKA/SAKUYA/r1-r6`
- `MIRAI/SAKUYA/r1-r6`
- `SERA/SAKUYA/r1-r6`
- `AKARI/SAKUYA/r6`
- `HIYORI/SAKUYA/r6`
- `KOHARU/SAKUYA/r6`
- `REI/SAKUYA/r6`
- `SHIZUKU/SAKUYA/r6`
- `TSUBASA/SAKUYA/r6`

## Retained Differences

- 変身後の髪型変化は、変身演出として成立する範囲では残した。
- 静玖の眼鏡有無など、髪型・服装より影響が小さい差分は今回の最小差し替え対象から外した。
- イベント絵は再生成枚数を抑える方針のため、構図や塗りの完全一致ではなく、キャラクター識別の一致を優先した。

## Review Contact Sheets

- `tmp/magic-art-audit/SOMA-events-all.jpg`
- `tmp/magic-art-audit/SAKUYA-events-all.jpg`
- `tmp/magic-art-audit/*.jpg`

## Local Network Test URL

開発サーバーは `0.0.0.0:5173` で待ち受けているため、同一Wi-Fi内の端末から以下で確認できる。

```text
http://192.168.0.13:5173/
```

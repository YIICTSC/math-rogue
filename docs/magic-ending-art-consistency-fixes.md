# Magic Ending Art Consistency Fixes

ImageGenで3x3スプライトシートを3枚生成し、各セルを切り出して導入した。火神つばさは短い橙髪、九条朔夜は長い黒髪に深紅差し色を固定し、場所と行動がルートごとに変わるようにした。

## ImageGen Sprite Sheets

- `public/sprites/magic/events/romance/generated-sheets/sakuya-ending-variants-01.png`
- `public/sprites/magic/events/romance/generated-sheets/sakuya-ending-variants-02.png`
- `public/sprites/magic/events/romance/generated-sheets/tsubasa-ending-variants-01.png`

## Imported Cells

- `SHIZUKU/SAKUYA/r6-true.webp` <= `sakuya-ending-variants-01.png` cell 1
- `SHIZUKU/SAKUYA/r6-special.webp` <= `sakuya-ending-variants-01.png` cell 2
- `SHIZUKU/SAKUYA/r6-bond.webp` <= `sakuya-ending-variants-01.png` cell 3
- `HIYORI/SAKUYA/r6-true.webp` <= `sakuya-ending-variants-01.png` cell 4
- `HIYORI/SAKUYA/r6-special.webp` <= `sakuya-ending-variants-01.png` cell 5
- `HIYORI/SAKUYA/r6-bond.webp` <= `sakuya-ending-variants-01.png` cell 6
- `MADOKA/SAKUYA/r6-true.webp` <= `sakuya-ending-variants-01.png` cell 7
- `MADOKA/SAKUYA/r6-special.webp` <= `sakuya-ending-variants-01.png` cell 8
- `MADOKA/SAKUYA/r6-bond.webp` <= `sakuya-ending-variants-01.png` cell 9
- `SERA/SAKUYA/r6-true.webp` <= `sakuya-ending-variants-02.png` cell 1
- `SERA/SAKUYA/r6-special.webp` <= `sakuya-ending-variants-02.png` cell 2
- `SERA/SAKUYA/r6-bond.webp` <= `sakuya-ending-variants-02.png` cell 3
- `MIRAI/SAKUYA/r6-true.webp` <= `sakuya-ending-variants-02.png` cell 4
- `MIRAI/SAKUYA/r6-special.webp` <= `sakuya-ending-variants-02.png` cell 5
- `MIRAI/SAKUYA/r6-bond.webp` <= `sakuya-ending-variants-02.png` cell 6
- `KOHARU/SAKUYA/r6-true.webp` <= `sakuya-ending-variants-02.png` cell 7
- `KOHARU/SAKUYA/r6-special.webp` <= `sakuya-ending-variants-02.png` cell 8
- `KOHARU/SAKUYA/r6-bond.webp` <= `sakuya-ending-variants-02.png` cell 9
- `TSUBASA/MINATO/r6.webp` <= `tsubasa-ending-variants-01.png` cell 1
- `TSUBASA/REN/r6.webp` <= `tsubasa-ending-variants-01.png` cell 2
- `TSUBASA/RIKU/r6.webp` <= `tsubasa-ending-variants-01.png` cell 3
- `TSUBASA/SOMA/r6.webp` <= `tsubasa-ending-variants-01.png` cell 4

## Backup

- Previous files: `.codex-logs/magic-ending-art-pre-imagegen-backup/`

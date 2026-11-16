# 校長対決フィールドの確認

- `node scripts/kocho-field/test-engine.mjs`：4方向の移動、範囲、敵の局所行動、合成の順序とCD、全章のゴール、12コースの物理クリア、景品の重複防止。
- `node scripts/kocho-field/test-browser.mjs`：解禁、学校・商店・ゲームセンター、合成の実行、初コースの実ショット、景品、本編から独立した保存、4画面サイズ。
- `node scripts/kocho-field/test-delivery-browser.mjs`：本編への景品配達と二重受け取り防止、タイトルの画面サイズ。
- `CHROMIUM_PATH=/usr/bin/chromium node scripts/test-kocho-browser.mjs`：通常の7マス戦闘・全主人公の固有カードの回帰確認。
- `blender -b -t 2 --python scripts/kocho-field/render-tiles.py`：CPUで4種類の床材を再制作。

ImageGenの生成元と配置は `install-art.py`、素材記録は `docs/kocho-field/art-sources.json`。元画像の絶対パスは制作環境の記録であり、ゲームの実行には使用しない。

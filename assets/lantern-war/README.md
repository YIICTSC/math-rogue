# 無窮航路の夏衣装素材

`vacation-individual-actions.json` と `vacation-individual-portraits.json` が採用したImageGen生成元の一覧。生成元PNGは作業環境の `generated_images` に保持し、ゲームには `public/sprites/lantern-war/vacation/` のWebPを配信する。

既存の主人公の実際の6行動を `scripts/build-lantern-action-reference.mjs aster` / `lyra` で合成し、元のキャラクターと衣装の参照に使用した。戦闘絵は新規生成16人、既存夏衣装26人、既存の航路限定夏衣装2人の計44人を描画する。

イベント用は44人すべてに専用の4表情を新規生成した。ユーザーが提示したヴェスパーの会話絵を、描き込み・顔の大きさ・頭から太ももまでの構図の基準とする。高校編・マジック編は各主人公の既存バカンス画像を衣装・配色・小物の参照に、通常衣装の会話絵を顔・髪型・人物像の参照にした。全身ドット絵の拡大や小さなデフォルメ絵の転用ではなく、自然な頭身の会話用イラストに描き直す。化学研究会長の会話衣装は青白の夏シャツと紺のショートパンツ。

ヴェスパー・セーブルは通常衣装の `endless/dialogue-end-vesper.png` / `dialogue-end-sable.png` を顔・年齢感・頭身・肩幅・体格の基準に再生成。ヴェスパーは成人女性、セーブルは成人男性として元の人物像を維持する。夏衣装を子供体型にした候補は不採用。ミレア・カイ（内部ID `end-hikari` / `end-ren`）もそれぞれの既存デザインから会話絵を生成する。

複数キャラクターを詰めた初期シートも不採用。1人につき戦闘6差分、会話4表情を別々に生成し直した。アステルの必殺時の鎧への戻り、セナの頭上のハンマーの欠け、ヴェスパーの隣セルへの槍の混入もImageGenで修正した。

```sh
node scripts/normalize-lantern-vacation-art.mjs <generated-image-directory>
node scripts/build-lantern-vacation-metrics.mjs
pnpm run test:lantern-war:vacation
```

透明な隙間を検出してから切り出し、同一人物の縮尺を共通にする。戦闘シートは3列×2行、1セル512×640、四辺に60px以上の空きを持つ。元画像で戦闘絵が境界に接触していれば正規化を中止する。会話は1セル448×704、全員が頭頂約32px、太もも側約592pxの基準。会話セルには主たる人物と近傍の細部を残し、隣の表情から入る孤立した小片は切り出し時に除外する。元の描画内容を塗り直す処理はしない。`vacation-facing.json` は個別の向きの補正。

出航の一枚絵の採用生成元は `vacation-art.json` に記録。出航画面は挿絵の全体を表示し、文章・操作は絵の下に置く。

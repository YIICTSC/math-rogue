# カード効果文と実効果の差異候補

作成日: 2026-07-04

`docs/card-list-effect-code-reference.md` を元に、効果文の数値・キーワードと実効果コードを照合した結果。パワー効果、召喚効果、マジック専用ルールなど別ロジックで成立しているものは除外した。

## 要修正候補

|ID|カード名|効果文|実効果コード|差異|修正案|
|---|---|---|---|---|---|
|TRIP|足払い|敵全体にびくびく2を与える。ブロック3。|vulnerable=2|ブロック3が実装されていない。|`block: 3` を追加する。|
|SYAKAI_COIN|小銭入れ|20ゴールドを得る。廃棄。|gold=20|廃棄が実装されていない。|`exhaust: true` を追加する。|
|OSAMU_NIGHT|人間失格|使用不可。手札にある限り、毎ターン自分に3ダメージ。|unplayable=true|毎ターン3ダメージの処理が見つからない。|ターン終了時の手札状態異常処理に `OSAMU_NIGHT` / `人間失格` の3ダメージを追加する。|

## 除外した主な誤検出

- マジック編の専用ルール文にある追加ブロック/回復は `src/services/magicRuleService.ts` で処理済み。
- `THOUSAND_CUTS`、`AFTER_IMAGE`、`EVOLVE`、`NOXIOUS_FUMES`、`RUPTURE`、`TOOLS_OF_THE_TRADE` などは `applyPower` のIDで後続処理される。
- 高校編の召喚カードは `familiarSummon.effect.kind` と `amount` で処理される。`CHAOS_SURGE` は表示文上のドロー/ムキムキ/次ターンエナジーを複合効果として表す。
- `BOYS_OVERLOAD` の「次のターン、エナジー0」は `energy=3; nextTurnEnergy=-3` で表現され、通常の基礎エナジー3を相殺する意図と一致する。
- `CORRUPTION` の「使用時廃棄」は、カード自体ではなくスキルカードを使用時に廃棄させるパワー効果として `App.tsx` 側で処理される。

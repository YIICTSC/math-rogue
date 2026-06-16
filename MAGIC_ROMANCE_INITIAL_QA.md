# マジック編 初期恋愛イベント画像QA

## 完了範囲

- 推奨相性18ルート
- `r1` から `r5`
- 合計90枚

出力先:

```text
public/sprites/magic/events/romance/{heroId}/{targetId}/r1.webp
...
public/sprites/magic/events/romance/{heroId}/{targetId}/r5.webp
```

生成元:

```text
public/sprites/magic/events/romance-sheets/magic-romance-initial-sheet-01.png
...
public/sprites/magic/events/romance-sheets/magic-romance-initial-sheet-10.png
```

確認用:

```text
public/sprites/magic/events/romance-review/magic-romance-initial-90-contact-trimmed.png
```

## QA結果

### 使用可能

- 90枚すべて `768x768` のWebPとして保存済み。
- 主要人物の大きな見切れはなし。
- 共通のクロマキー線は再トリム済み。
- 主人公側の識別性はおおむね維持できている。

### リテイク対応済み

| 優先 | 対象 | 理由 |
| --- | --- | --- |
| 高 | `REI/SAKUYA/r1-r5` | 対応済み。黒赤軍装・長黒髪・封印札を強めて再生成。 |
| 高 | `KOHARU/SAKUYA/r1-r5` | 対応済み。敵幹部らしさを強めて再生成。 |
| 中 | `MIRAI/RIKU/r1-r5` | 対応済み。低いラベンダーグレー結び髪と懐中時計を強めて再生成。 |
| 中 | `MADOKA/ELLIOT/r1-r5` | 対応済み。白制服、紺の星界マント、本、金目を強めて再生成。 |
| 低 | 一部セル下端 | コンタクトシート上で細い緑が残る箇所がある。ゲーム内表示で目立つ場合のみ追加トリム。 |

## 次工程

1. 恋愛イベント抽選用データを作る。
2. `?` マスイベントで、共通イベントと恋愛イベントを条件分岐させる。
3. 好感度状態に応じて `r1` から `r5` の次イベントを出す。
4. 推奨相性18ルートの `r6` エンド画像18枚を制作する。

## リテイク生成元

```text
public/sprites/magic/events/romance-sheets/magic-romance-retake-rei-sakuya.png
public/sprites/magic/events/romance-sheets/magic-romance-retake-koharu-sakuya.png
public/sprites/magic/events/romance-sheets/magic-romance-retake-mirai-riku.png
public/sprites/magic/events/romance-sheets/magic-romance-retake-madoka-elliot.png
```

更新後確認用:

```text
public/sprites/magic/events/romance-review/magic-romance-initial-90-contact-retake.png
```

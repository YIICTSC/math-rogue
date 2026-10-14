# RPG：3D視点操作設定（2026-10-14）

RPGタイトルまたはゲーム中の「RPG設定」→「3D視点操作」から変更する。

- 操作方法：画面ドラッグ、視点スティック、両方。既存ユーザーの既定値は画面ドラッグを維持。
- 左右・上下反転：ドラッグとスティックに適用。
- 感度：50 / 75 / 100 / 150 / 200%。
- 視点スティックの遊び：15 / 22 / 35%。移動スティックとは独立。
- 視点設定のみを標準に戻すボタン。移動・読み上げ・画質などは保持。
- 3D画面に視点を水平に戻すボタン。視点スティックは選択時に表示。
- 端末内の既存設定キーへ追加保存。旧保存データやゲーム進行データの変更は不要。
- 視点の指を追跡し、他の指の解放・キャンセルで視点操作を止めない。視点スティックは指を離す／ウィンドウを離れると停止。
- 設定を変えても3Dシーンは作り直さない。会話・ダイアログ中は視点操作を抑止。

## ファイル

`src/rpg/preferences.ts`、`RpgSettings.tsx`、`CameraControls.tsx`、`cameraInput.ts`、`WorldScene3D.tsx`、`settings.css`、`world3d.css`。

## 検証

- `node scripts/test-rpg-camera-input.mjs`：反転、感度、遊び、フレーム時間、旧設定互換、保存／復元が成功。
- `node scripts/test-rpg-settings-browser.mjs`：スマホ設定画面、全項目の保存・復元、視点設定リセット、従来の移動設定保持が成功。
- `node scripts/test-rpg-camera-browser.mjs`：実際のRPG 3Dでドラッグ、反転、スティック専用時のドラッグ無効、タッチ旋回、解放時の停止、水平リセット、2本指で移動と旋回、視点指だけの解放時にも移動継続が成功。
- `tmp/rpg-camera-settings-mobile.png` と `tmp/rpg-camera-stick-world.png` を実際に開いて表示を確認。
- 型チェック：467件の既存エラーが残る。今回の視点関連変更ファイルではエラーなし（`tmp/rpg-camera-typecheck.log`）。
- ブラウザには既存のRpgOnlineリストkey警告が出るが、pageerrorはなし。

既存の未コミット変更は保持。commit・push・デプロイは行わない。
最終結果：pnpm run build 成功。英語UI監査も成功。既存の大きなチャンク警告あり。

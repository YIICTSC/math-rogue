# 学習ローグ 各OSリリース作業 引き継ぎ

更新日: 2026-08-05 JST  
対象: iOS / Android / Steam (Windows) / 共通Webソース

## 0. 次のチャットで最初に読むこと

このファイルは、現在のリリース状態、ローカル成果物、ストア側で実施済みの作業、残作業を一つにまとめた引き継ぎ資料である。

次の作業者は、まず以下を守ること。

1. 未コミットの作業ツリーを破棄しない。
2. iOS Build 33は、GitHubの最新コミットだけではなく、現在の未コミット変更も含む作業ツリーから作成されている。
3. ストアへの再アップロード前に、各プラットフォームのバージョン番号を必ず増やす。
4. パスワード、OTP、Steam Guardコード、p8秘密鍵本体、キーストアの秘密情報はMarkdown、Git、VDF、シェル履歴に保存しない。
5. 新しい画像やアイコンを作る場合はImageGenを使用する。

## 1. リポジトリとソース状態

### リポジトリ

- ローカル: `/Users/admin/Documents/Codex/学習ローグ`
- GitHub: `https://github.com/YIICTSC/math-rogue`
- パッケージ名: `learning-rogue`
- 表示バージョン: `1.0.0`
- 共通Bundle / Application ID: `jp.yusukeishige.learningrogue`
- 現在の作業ブランチ: `agent/prevent-english-translation-leaks`
- 作業ブランチHEAD: `394fb90` (`Fix cross-platform CI asset audits`)
- `origin/main` も同じ `394fb90`

### GitHub Actionsの最後の確認状態

`394fb90` に対して以下は成功済み。

| Workflow | Run | 状態 |
| --- | ---: | --- |
| Build Android App Bundle | `30867183130` | success |
| Deploy To GitHub Pages | `30867183205` | success |

AndroidのCI artifact名は `learning-rogue-android-aab`。Run `30867183130`のartifactは有効期限内で、ソースの`versionCode` 13で生成されたものである。

### 重要: 未コミット変更あり

2026-08-05時点で以下の変更が未コミット。これらはユーザーの作業であり、破棄しない。

```text
M  capacitor.config.ts
M  ios/App/App.xcodeproj/project.pbxproj
M  ios/App/App/AppDelegate.swift
M  package.json
M  pnpm-lock.yaml
M  public/privacy.html
M  scripts/test-assignment-notifications.mjs
M  scripts/verify-management-integration.mjs
M  src/App.tsx
M  src/components/BattleScene.tsx
M  src/data/themedEndingSequences.ts
M  src/services/assignmentNotificationService.ts
M  src/services/managementPortalService.ts
M  src/styles.css
?? docs/ending-image-text-review.md
?? scripts/verify-themed-ending-copy.mjs
```

主な内容:

- iOS Push Notificationsとバッジ管理のCapacitor設定
- iOS entitlements / Push capability / Build 33設定
- アプリを開いていない時の課題通知、バッジ解除、最優先課題の受信・強制表示改善
- カード効果で「捨てる」などの選択を強制された時も、手札を横スクロールできる修正
- 小学生編・高校編のキャラクター別エンディング台詞改善
- プライバシー表示と管理ポータル連携の改善

### 次チャットの最初のGit作業

1. `git status --short` と `git diff --stat` を確認。
2. 未コミット変更のテストを再実行。
3. 意図した変更だけをコミットし、`main` へpush。
4. GitHub ActionsのAndroid AABとGitHub Pagesが再度successになることを確認。

## 2. 共通製品仕様

| 配布先 | `VITE_APP_PLATFORM` | `VITE_PAID_EDITION` | 1日のプレイ制限 |
| --- | --- | --- | --- |
| Web | `web` | 未設定 | あり |
| Steam | `steam` | `true` | なし |
| iOS | `ios` | `true` | なし |
| Android | `android` | `true` | なし |

共通方針:

- Steam / iOS / Androidは買い切り500円を基準とする。
- 広告なし、初版はアプリ内課金なし。
- 有料版ではマスター達成時の時間延長の代わりに、課題クリアと同ルールのカード報酬を付与する。
- 本番ビルドはWebを含めデバッグ導線を無効化する。`npm run dev:debug` だけがローカルデバッグ用。
- ランキングは任意参加。「ランキングに参加しない」を選ぶとタイトルで再表示せず、後からランキング画面で登録できる。
- 問題選択画面と問題チャレンジの単元名は、英語表示でも日本語を維持する。
- オンラインランキング、課題連携、協力・レース、追加素材取得には通信が必要。
- メインゲームの基本セーブは端末内。OS間の自動共有は未対応。

関連資料:

- [Steam・iOS・Android同時展開方針](./cross-platform-distribution.md)
- [年齢評価9+変更履歴](./age-rating-9plus-change-inventory-and-reassessment.md)
- [翻訳完了条件](./translation-completion-contract.md)

## 3. iOSリリース

### 識別情報と開発環境

| 項目 | 値 |
| --- | --- |
| App Store Connect App ID | `6793312973` |
| Bundle ID | `jp.yusukeishige.learningrogue` |
| Apple Developer Team | `STVR67YH4M` |
| Version | `1.0.0` |
| 最新Build | `33` |
| Deployment Target | iOS 15.0 |
| Xcode | 26.3 |
| Build SDK | iOS 26.2 |
| 対応 | iPhone / iPad |
| 公開方法 | App Review承認後の手動リリース |

### Build 33の内容

- カード効果で手札からカード選択が強制される時でも、横スクロールを維持。
- 最優先課題の受信・強制表示を改善。
- 課題達成時にアプリアイコンのバッジを更新・解除。
- Push Notificationsとバッジ機能を有効化。
- 本番デバッグ導線は無効。

### ビルドと署名

- Release archive:
  - `build/ios/LearningRogue-1.0.0-33.xcarchive`
- App Store向けIPA:
  - `build/ios/ipa-33/LearningRogue-1.0.0-33.ipa`
  - 約965MB
- 署名: `Apple Distribution: YUSUKE ISHIGE (STVR67YH4M)`
- App Store用プロビジョニングプロファイル:
  - 名称: `Learning Rogue App Store Push 1.0.0`
  - Profile ID: `NNV6MPX43H`
  - UUID: `92d7000e-8dd8-4a47-a725-6db89fb4d7d0`
  - Push Notifications / In-App Purchase capabilityあり
  - Distributionの`aps-environment` は `production`

### App Store Connectの最後の確認状態

2026-08-04 17:13 JSTに確認。これ以降の変化はApp Store Connectで再確認すること。

- TransporterでBuild 33をデリバリ済み。
- TestFlightでBuild 33は「テスト中」。
- 内部グループ: `学習ローグ テストプレイ`
- 外部グループ: `学習ローグ 外部テスト`
- 外部グループ: `学習ローグ 外部テスト24`
- 上記3グループすべてにBuild 33を割り当て済み。
- App Store本番提出はBuild 30を取り下げ、Build 33へ差し替えて再提出済み。
- App Reviewステータス: `審査待ち`
- App Review Submission ID: `e465a807-5e84-4f53-a45a-837b8755d297`
- リリース設定: 手動リリースを維持。

### iOSアップロード時の注意

Xcodeの`-exportArchive` / Organizerで `No provider associated with App Store Connect user` が発生した。Build 33は次の手順で回避した。

1. XcodeでRelease archiveを生成。
2. App Store用プロビジョニングプロファイルとDistribution証明書で署名。
3. IPAのZIP直下が必ず`Payload/`になるようパッケージ。
4. Apple TransporterからIPAをデリバリ。

IPA内に`Payload` directoryがないと `The IPA is invalid. It does not include a Payload directory.` で拒否される。

### Transporter GUIでのアップロード成功手順（2026-08-15 / Build 36）

CLIの通常パスワード認証やXcodeの直接アップロードでは完了できなかったため、App Store Connectにログイン済みのTransporter GUIからデリバリした。次回も次の流れを基準にする。

1. `/Applications/Transporter.app`を起動し、App Store Connectの対象プロバイダとアカウントが表示されていることを確認。
2. `パッケージを追加`からIPAを追加する。今回のIPAは `build/ios/ipa-36/LearningRogue-1.0.2-36.ipa`。
3. 同じバージョン・ビルドが既に一覧にある場合は、置き換え確認で`置き換える`を選択。
4. 対象行の`デリバリ`を押し、パッケージ分析、App Store Connectの分析応答待ち、アップロード完了まで待つ。
5. 行が緑色の`デリバリ済み`になったことを確認し、App Store ConnectのTestFlightで`1.0.2 (36)`が表示されることを確認する。処理中の間はテストグループに追加できない場合があるため、処理完了後に内部テストグループへ割り当てる。

確認コード・パスワード・APIキーなどの認証情報は引き継ぎ資料に記録しない。

### iOS再ビルドの基本コマンド

```bash
pnpm run test:production-debug-lock
pnpm run test:management
pnpm run test:assignment-notifications
pnpm run audit:english:gate
pnpm run build:ios
pnpm exec cap sync ios
```

Archive前に`CURRENT_PROJECT_VERSION`をBuild 34以上へ増やす。

### iOS残作業

- [ ] App Reviewの最新状態を確認。
- [ ] 審査中の質問やリジェクトがあればBuild 33の内容を基準に対応。
- [ ] 承認後はすぐ公開せず、他OSの準備と発売日を確認してから手動リリース。
- [ ] Build 33を生成した未コミット変更をGitHubに保全。

詳細: [iOSアプリ化準備](./ios-app-preparation.md)

## 4. Android / Google Playリリース

### 識別情報

| 項目 | 値 |
| --- | --- |
| Google Play Console App ID | `4972358097362152488` |
| Package name | `jp.yusukeishige.learningrogue` |
| Version name | `1.0.0` |
| ソース上のversionCode | `13` |
| 価格 | 500円 |
| 広告 / IAP | なし / なし |
| 現在の対象年齢方針 | Google Playは13歳以上 |
| テストトラック | Alphaクローズドテスト |

### ビルド状態

- `android/app/build.gradle` は `versionCode 13`, `versionName "1.0.0"`。
- GitHub Actions run `30867183130` でversionCode 13の署名済みAAB生成がsuccess。
- CI artifact: `learning-rogue-android-aab`
- ローカルで保持している最新AAB:
  - `build/android-release-v12-b623eb8/app-release.aab`
  - SHA-256: `ae235794dcd56008316feb0993915cd0cbaeabd7d387678808aa2bece96e7fb8`
- versionCode 13のAABはCI artifactとして存在するが、ローカルへは未ダウンロード。

### Google Play Consoleの確認上の注意

- 旧資料ではversionCode 9までの審査送信が記録されている。
- その後、手動でversionCode 10をAlphaへアップロードしたことは会話上で確認済み。
- versionCode 12 / 13がGoogle Play ConsoleのAlphaへ公開済みかは、次回必ずConsoleで確認する。
- ソースの数値とPlay Console最新版を混同しない。未アップロードならversionCode 13をAlphaに公開する。

### 追加素材ダウンロード

AndroidはAABの容量を抑えるため、大容量の画像・BGM・SE・ボイスをアプリ内から追加取得する。

- Asset base URL: `https://yiictsc.github.io/math-rogue/`
- パック: 基本映像 / 高校映像 / 魔法映像 / 共通音声 / 高校音声 / 魔法音声
- マニフェストは`pnpm run build:android`内で生成・検証。
- 404の再発防止として、AABより先にGitHub Pagesへ追加素材を配信する。
- `394fb90`でAndroid asset auditとGitHub Pages workflowは両方success。

### Android基本コマンド

```bash
pnpm run test:production-debug-lock
pnpm run audit:english:gate
pnpm run test:android-asset-manifest
pnpm run build:android
pnpm exec cap sync android
cd android
./gradlew bundleRelease
```

署名済みAABにはCIの秘密変数が必要なため、通常はGitHub Actionsを使用する。

### Google Play残作業

- [ ] Play ConsoleのAlphaで現在公開中のversionCodeを確認。
- [ ] versionCode 13が未公開なら、Run `30867183130`のAABをダウンロードしてAlphaへアップロード。
- [ ] 追加素材の「未取得をすべてダウンロード」をAndroid実機で完走確認。
- [ ] Google Play Consoleのデータセーフティとデータ削除URLを最新実装と照合。
- [ ] クローズドテストで12人以上が14日間継続参加する条件を達成。毎日プレイする意味ではなく、テストから抜けないことが条件。
- [ ] 条件達成後に製品版トラックへのアクセスを申請。
- [ ] 500円の価格と公開日を本番公開前に再確認。

詳細:

- [Google Play公開準備](./google-play-release.md)
- [Google Playクローズドテスト](./google-play-closed-test.md)
- [Android追加素材ダウンロード](./android-additional-asset-downloads.md)

## 5. Steam / Windowsリリース

### Steamworks識別情報

| 項目 | 値 |
| --- | --- |
| AppID | `5013100` |
| Windows Depot ID | `5013101` |
| Package | `1738674` |
| 価格方針 | 日本500円 + 地域別推奨価格 |
| 対応OS | Windows 10 / 11 64-bit |
| 起動ファイル | `LearningRogue.exe` |
| テストブランチ | `internal` |

### 最後に記録されたSteamPipe状態

- 最後に文書で確認できる`internal` Build ID: `24486437` (2026-07-31)
- Public defaultへの最後の明示的な反映記録: Build ID `24462204`
- 2026-08-02更新のSteamPipe出力にDepot Manifest `5255858215010250289`が残っている。
- 上記manifestに対応するBuild IDと現在の`internal` / Public defaultの割り当ては、Steamworksで再確認する。
- 現在、`release/steam/win-unpacked/` はローカルに存在しない。次のアップロード前に再生成が必要。
- 2026-08-04の未コミット修正とiOS Build 33相当の変更がSteamへアップロード済みとは確認できていない。

### 実装済みのSteam特有対応

- Xbox互換コントローラー対応。
- タイトル画面、メインゲーム、ミニゲーム、上部UI、モーダルの出入りを監査済み。
- 風来の小学生は8方向移動と投擲シュート割り当てに対応。
- View / Selectでタイトルへ戻る、またはゲームを閉じるモーダルを表示。
- 校長対決、放課後ポーカー、風来シリーズ、紙飛行機バトルの各種フォーカス修正を実施。
- 校長対決の戦闘配置は`Shogun Showdown`の操作感を参考に調整。
- 本番ビルドではデバッグ導線を無効化。

コントローラ関連:

- [Xboxコントローラー対応表](./steam-xbox-controller-support-matrix.md)
- [画面別コントローラーチェック](./xbox-controller-screen-checklist.md)
- [上部UI・モーダル監査](./controller-top-ui-modal-audit.md)
- [最終フォローアップ](./xbox-controller-followup-verification.md)

### Steamストアページ素材

ローカルに準備済み:

- 日本語・英語カプセル、Library素材、アイコン:
  - `release/steam/store-assets/generated/`
  - `release/steam/store-assets/generated/english/`
- 実ゲーム画面10枚:
  - `build/steam-store-screenshots-2026-08-01/`
- 旧スクリーンショット:
  - `release/steam/store-assets/screenshots/`

ストア側での最後の記録:

- 実ゲーム画面と日本語アセットを登録。
- 英語Header / Small / Main / Vertical Capsuleは登録済み。
- Library Header / Hero、トレーラーMP4などは旧資料内の状態記載が一致していないため、Steamworksの緑のチェック表示を正として再確認する。
- ローカルにトレーラーMP4は現在見当たらない。必要な場合は再生成。
- マウスカーソルが入った古い画像は使わず、2026-08-01の10枚を優先する。

### Steamビルドコマンド

```bash
pnpm run test:production-debug-lock
pnpm run test:gamepad
pnpm run build:steam
pnpm run dist:steam:win
pnpm run steam:verify
```

SteamPipe VDF生成:

```bash
STEAM_PREVIEW=0 \
STEAM_SET_LIVE=internal \
STEAM_APP_ID=5013100 \
STEAM_DEPOT_ID=5013101 \
pnpm run steam:config
```

その後、macOS版SteamCMDで`release/steam/steampipe/scripts/app_build_5013100.vdf`を実行する。

### Steam残作業

- [ ] 未コミット修正を含む確定コミットからWindows x64版を再生成。
- [ ] `internal`へアップロードし、Steamクライアントからインストールして起動・セーブ・終了を確認。
- [ ] Xbox物理コントローラーでタイトルから各モーダル、各ミニゲーム、終了まで最終通し確認。
- [ ] Steamworksで現在の`internal` / Public defaultのBuild IDを記録し直す。
- [ ] ストアアセットの残りとトレーラーの有無を確認。
- [ ] 500円の価格審査状態を確認。
- [ ] 予定リリース日を設定。
- [ ] ストアプレゼンスとゲームビルドをValveレビューへ提出。
- [ ] 「近日登場」の最低期間と各ストアの公開日を揃える。

詳細: [Steamリリース準備](./steam-release-preparation.md)

## 6. Web / GitHub Pages / 共通サービス

- GitHub Pagesは追加素材配信、プライバシー、サポート、データ削除申請に使用。
- 最新のDeploy To GitHub Pagesは`394fb90` / run `30867183205`でsuccess。
- Web版だけは1日のプレイ制限あり。
- Web本番でもデバッグ導線は無効にする。
- Android AABを出す前に、GitHub Pages上の追加素材URLとマニフェストの一致を確認する。

主要URL:

- 公式: `https://yiictsc.github.io/math-rogue/`
- サポート: `https://yiictsc.github.io/math-rogue/support.html`
- プライバシー: `https://yiictsc.github.io/math-rogue/privacy.html`
- データ削除: `https://yiictsc.github.io/math-rogue/delete-data.html`

## 7. 本番ビルド前の共通検査

変更内容に応じて実行する。

```bash
pnpm run audit:english:gate
pnpm run audit:translations
pnpm run test:production-debug-lock
pnpm run test:management
pnpm run test:assignment-notifications
pnpm run test:themed-ending-copy
pnpm run test:required-battle-voices
pnpm run test:triggered-card-damage
pnpm run test:magic-regular-enemies
pnpm run test:assignment-reward-synthesis
pnpm run test:assignment-reward-runtime
pnpm run test:gamepad
pnpm run test:ios-bgm
pnpm run test:ios-magic-rule-panel
pnpm run test:android-asset-manifest
```

ビルドにゲームと関係ないMarkdown、レビュー用資料、翻訳監査レポートを同梱しない。Viteの`dist`、Android asset manifest、Steam配布フォルダの内容をリリース前に確認する。

## 8. 推奨する次の作業順

1. **ローカル変更の保全**  
   Build 33相当の未コミット変更をテストし、コミット・pushする。
2. **iOS状態確認**  
   App ReviewのBuild 33が審査待ち、審査中、承認、または要修正のどれかを確認する。
3. **Android Alphaの版数確認**  
   Play Consoleの最新versionCodeを確認し、13が未公開ならCI artifactをアップロードする。
4. **Steam internal更新**  
   確定コミットからWindows x64版を再生成し、`internal`へ上げてテストする。
5. **Steamストアページ完成**  
   残アセット、価格審査、予定リリース日、トレーラー、Valveレビューを進める。
6. **公開日の同期**  
   iOSは手動リリースのまま保持し、Androidの14日間テスト条件とSteamの「近日登場」期間を考慮して日付を決める。

## 9. 状態確認用チェックリスト

### iOS

- [ ] Build 33がTestFlightの3グループでテスト中
- [ ] App Review対象がBuild 33
- [ ] 公開方法が手動リリース
- [ ] デバッグ導線なし
- [ ] Push証明書・プロファイルの期限と本番entitlementを確認

### Android

- [ ] Alpha最新versionCodeを確認
- [ ] versionCode 13を必要に応じて公開
- [ ] 追加素材を全ダウンロードできる
- [ ] 12人 / 14日間条件の進捗を確認
- [ ] 対象年齢、IARC、データセーフティが実装と一致

### Steam

- [ ] `internal`の現在Build IDを確認
- [ ] 最新ソースをWindows x64で再生成
- [ ] Steamクライアントから実機テスト
- [ ] ストアアセットとトレーラーを完成
- [ ] 価格と予定公開日を確定
- [ ] Valveのストア・ビルドレビューへ提出

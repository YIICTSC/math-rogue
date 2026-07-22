# iOSアプリ化準備

更新日: 2026-07-21

## 採用構成

- 既存のReact/Vite版をCapacitorでiPhone/iPadアプリとして包む。
- Capacitorは8.4.2で固定し、iOS依存管理にはSwift Package Managerを使う。
- Xcode操作はCLIを基本とし、`xcodebuild`で再現可能なSimulatorビルドを行う。
- ネイティブ専用機能は、まずCapacitorプラグインまたは小さなSwiftブリッジとして段階的に追加する。

全面的なSwiftUI書き直しは、現在のゲーム規模とWeb版との機能差を考えると初期リリースの対象外とする。

## 確認済み環境

| 項目 | 状態 |
| --- | --- |
| macOS | 15.7.7 |
| Xcode | 26.3 (17C529) |
| iOS SDK / Simulator | SDK 26.2 / iOS 26.3 runtime |
| App Store提出SDK要件 | iOS 26 SDK要件を満たす |
| Capacitor | 8.4.2 |
| Node.js | 24.14.0（Codex同梱ランタイム） |
| iOS依存管理 | Swift Package Manager |
| Deployment Target | iOS 15.0、iPhone / iPad |
| 署名 | Automatic（Teamは正式Bundle ID確定後に設定） |

旧Xcode 16.2は `/Applications/Xcode-16.2.app` に退避している。

`App` schemeはiPhone Simulator向けに署名なしでビルド済み。Xcodeの結果は
`BUILD SUCCEEDED`、生成されたDebugアプリは約976MBだった。

iOS 26.3の`iPhone 17 Pro` Simulatorへインストールし、アプリプロセスの起動、
学年選択画面の表示、終了後の再起動まで確認済み。初回は資産展開を含めて表示まで
約40秒、再起動時は15秒以内に同じ画面を表示できた。確認画像は
[`ios-simulator-relaunch.png`](./ios-simulator-relaunch.png) に保存している。

2026-07-22にWeb版を再ビルドしてCapacitorへ同期し、同期後のXcodeビルドと
Simulator再起動も成功した。`dist`とiOS側のHTML／メインJavaScriptはSHA-256が一致。
確認画像は[`ios-simulator-web-sync.png`](./ios-simulator-web-sync.png)に保存している。

同日、有料ストア版の共通方針を反映した。iOSビルドは`VITE_PAID_EDITION=true`で
生成し、1日のプレイ時間加算、時間切れ判定、時間切れ画面、マスター達成時の
5分延長表示を無効化する。代わりに、マスター達成時は課題クリア時と同じ
生成ルールの報酬カードを付与し、アルバムへ保存する。Simulator上でも
`FULL VERSION: UNLIMITED`表示を確認済み。

Web版を含む本番ビルドは、計算スキップおよびデバッグメニューの導線を常に無効化する。
旧デバッグ設定は本番起動時に削除し、デバッグ画面のセーブは復元しない。
ローカル開発時のみ`npm run dev:debug`で明示的に有効化できる。
Xcode再ビルドとSimulator起動まで成功し、確認画像を
[`ios-simulator-paid-debug-locked.png`](./ios-simulator-paid-debug-locked.png)に保存した。
確認画像は[`ios-simulator-paid-edition.png`](./ios-simulator-paid-edition.png)に保存している。

このIntel MacではiOS 26.3 Simulatorの初回起動時にdyld共有キャッシュ生成が走る。
生成中はSimulatorへのインストールが待機状態になるため、完了を待ってから再度
`npm run ios:run` を実行する。Appleが案内する事前生成コマンドは次のとおり。

```bash
xcrun simctl runtime dyld_shared_cache update --all
```

同じ処理は `npm run ios:prepare-simulator` でも実行できる。通常はRuntime導入直後の
1回だけでよい。

## アプリ識別情報

- 表示名: `学習ローグ`
- Bundle ID: `jp.yusukeishige.learningrogue`
- Xcode scheme: `App`
- Web出力: `dist`
- Apple Developer Team: `STVR67YH4M`

Bundle IDはApp Store Connectでアプリレコードを作る前に最終確定する。変更後に既存アプリ扱いへ戻すことはできないため、組織用の正式な逆ドメイン名がある場合は先に差し替える。

## Releaseアーカイブと署名状態

2026-07-22にApple Developer TeamをXcodeターゲットへ設定し、iOS 26.2 SDK、
arm64、iOS 15.0以上、Version 1.0.0、Build 1で実機向けReleaseアーカイブに成功した。
アーカイブは約983MB。Appleが2026-04-28以降の提出に求める
Xcode 26およびiOS 26 SDK以上の条件を満たしている。
タイトル画面と製品バージョンも`1.0.0`に統一し、リリースノートを初回製品版の内容へ更新した。

App Store Connect用の書き出し設定は`ios/ExportOptions-AppStore.plist`に保存済み。
ただし、IPA書き出しはApple側から次の応答があり停止した。

- `No provider associated with App Store Connect user`
- Teamに`iOS App Store`用プロビジョニングプロファイルの作成権限がない
- `iOS Distribution`証明書が見つからない

現在はDevelopment証明書と開発用プロビジョニングでのアーカイブまで成功している。
App Store Connect側でAccount Holderとしてチームが表示されることを確認後、
XcodeのAccounts画面でアカウントを再読み込みしてIPA書き出しを再実行する。

## 開発コマンド

```bash
npm run build:ios
npm run ios:sync
npm run ios:open
npm run ios:prepare-simulator
npm run ios:run
```

`npm run ios:run` は次を連続実行する。

1. iOS向けWebビルドとCapacitor同期
2. `iPhone 17 Pro` Simulatorの起動
3. `App` schemeのDebugビルド
4. Simulatorへのインストールと起動

別のSimulatorを使う場合:

```bash
IOS_SIMULATOR="iPad Pro 11-inch (M4)" npm run ios:run
```

## iOS互換性で実施した変更

- safe areaを有効化するためviewportへ `viewport-fit=cover` を追加。
- Capacitorのローカルホストを開発APIと誤認しないよう、ランキングAPIのlocalhost判定をWebプラットフォームに限定。
- iOSビルドでは `VITE_APP_PLATFORM=ios` を設定。
- iOS有料版では `VITE_PAID_EDITION=true` を設定し、Web版だけに1日制限を残す。
- 既存のImageGen製アイコン原画から1024pxのApp Iconを作成。

## リリース前の重要課題

### 1. アプリ容量

`public` が約952MBあり、現在は大半がアプリ本体へコピーされる。初回TestFlight前に以下へ分類する。

| 資産 | 現在の概算サイズ |
| --- | ---: |
| `public/sprites` | 358MB |
| `public/bgm` | 214MB |
| `public/bgm-new` | 211MB |
| `public/card-illustrations` | 75MB |
| `public/sfx` | 72MB |

`sprites`内では`magic`が約205MB、`high-school`が約56MB、背景が約45MB。
生成元シート／素材ディレクトリだけでも約59MBあるため、参照監査後に配布対象から
外せる可能性がある。BGMの旧／新版は設定から切り替える仕様なので、単純削除はしない。

- 起動・基本学習に必須の同梱資産
- テーマ開始時に取得する追加資産
- Apple-Hosted Background AssetsまたはCDNから配信する音声・高解像度画像

### 2. Web API差分

- 音声読み上げ (`speechSynthesis`)
- Web Audioの初回ユーザー操作制約
- ファイル書き出し・読み込み
- クリップボード
- PeerJS/WebRTC協力プレイ
- Fullscreen API

各機能を実機とSimulatorの両方で確認し、必要な箇所だけCapacitorプラグインへ置き換える。

### 3. Apple提出準備

- [x] Bundle IDと署名Teamの確定
- [x] 実機向けReleaseアーカイブの生成
- [ ] App Store Connectの提供者とDistribution署名をXcodeで再読み込み
- App Store Connectのアプリレコード作成
- Privacy ManifestとRequired Reason APIの監査
- 子ども向け・教育用途を踏まえた年齢区分、プライバシーポリシー、データ収集回答
- iPhone/iPadのスクリーンショットと審査用説明
- TestFlight内部テスト

課金モデルの検討結果は[`ios-monetization-plan.md`](./ios-monetization-plan.md)を参照する。

## 次の完了条件

- [x] iPhone Simulatorで起動し、学年選択画面まで表示できる。
- [ ] 学年を選び、開始メニューまで表示できる。
- 新規ゲーム開始、保存、再起動後の復元が動く。
- 問題音声、BGM、ランキングAPI、管理ポータル連携を個別確認する。
- 実機でノッチ／Dynamic Island／ホームインジケータとの重なりがない。

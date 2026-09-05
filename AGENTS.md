# iOS IPA作成メモ

## 2026-08-27: iOS 1.0.6 Build 55を作成した手順

対象リポジトリ: `/Users/admin/Documents/Codex/学習ローグ`

### 1. Web資材を生成してCapacitorへ同期

システムのNode.jsがシェルのPATHにない場合は、Codexのバンドル済みNode.jsとpnpmを使う。

```bash
PATH=/Users/admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH \
  /Users/admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback/pnpm run build:ios

PATH=/Users/admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH \
  /Users/admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback/pnpm exec cap sync ios
```

`build:ios`の監査（翻訳、カード効果、カード画像、表示コピーなど）が成功してからXcodeビルドへ進む。

### 2. XcodeのSwift Package依存関係を解決

```bash
xcodebuild -resolvePackageDependencies \
  -project ios/App/App.xcodeproj \
  -scheme App
```

今回のXcode 26.3環境では、Swiftの明示的モジュール解決時に次の依存モジュールが見つからないことがあった。

- `IONFileTransferLib`
- `IONFilesystemLib`

ビルドログとDerivedDataから各ライブラリの生成済みSwiftモジュールを確認し、pnpmパッケージ側のRelease出力先へシンボリックリンクを作ると解消できた。

```bash
PROJECT_ROOT=/Users/admin/Documents/Codex/学習ローグ
DERIVED_ROOT=/Users/admin/Library/Developer/Xcode/DerivedData/App-<現在のDerivedDataディレクトリ>

FILETRANSFER_NODE="$PROJECT_ROOT/node_modules/.pnpm/@capacitor+file-transfer@<version>/node_modules/@capacitor/file-transfer"
FILESYSTEM_NODE="$PROJECT_ROOT/node_modules/.pnpm/@capacitor+filesystem@<version>/node_modules/@capacitor/filesystem"

mkdir -p "$FILETRANSFER_NODE/build/Release-iphoneos" \
  "$FILESYSTEM_NODE/build/Release-iphoneos"

ln -sfn \
  "$DERIVED_ROOT/SourcePackages/checkouts/ion-ios-filetransfer/build/Release-iphoneos/IONFileTransferLib.swiftmodule" \
  "$FILETRANSFER_NODE/build/Release-iphoneos/IONFileTransferLib.swiftmodule"

ln -sfn \
  "$DERIVED_ROOT/SourcePackages/checkouts/ion-ios-filesystem/build/Release-iphoneos/IONFilesystemLib.swiftmodule" \
  "$FILESYSTEM_NODE/build/Release-iphoneos/IONFilesystemLib.swiftmodule"
```

`<version>`とDerivedDataのディレクトリ名は、その環境の`node_modules/.pnpm`とビルドログに合わせる。

### 3. iOS 26.2 Platform不足時のReleaseビルド

通常の`xcodebuild archive -destination generic/platform=iOS`は、今回の環境では`iOS 26.2 Platform Not Installed`でStoryboardコンパイルに失敗した。`Assets.xcassets`でもSimulator runtime不足の`actool`エラーが発生した。

Build 55では、プロジェクトファイルの`PBXResourcesBuildPhase`から次の3項目をビルド直前だけ一時的に外した。

- `LaunchScreen.storyboard in Resources`
- `Assets.xcassets in Resources`
- `Main.storyboard in Resources`

この変更は回避策であり、ビルド後ただちに元へ戻す。最終的なプロジェクト差分にはBuild番号の変更だけを残す。

```bash
xcodebuild -project ios/App/App.xcodeproj \
  -target App \
  -configuration Release \
  -sdk iphoneos \
  -disableAutomaticPackageResolution \
  CODE_SIGN_STYLE=Manual \
  DEVELOPMENT_TEAM=STVR67YH4M \
  'CODE_SIGN_IDENTITY=Apple Distribution' \
  'PROVISIONING_PROFILE_SPECIFIER=Learning Rogue App Store Push 1.0.0' \
  build
```

生成されるアプリ:

`ios/App/build/Release-iphoneos/App.app`

### 4. コンパイル済み資材を戻して再署名

今回のBuild 55では、ソースの画像カタログとStoryboardがBuild 54から変更されていないことを確認した。そのため、既存の正常なBuild 54 IPAから次の資材を取り出してBuild 55の`App.app`へ戻した。

- `Assets.car`
- `Base.lproj/Main.storyboardc`
- `Base.lproj/LaunchScreen.storyboardc`

資材を追加した後は、アプリ全体のコード署名をやり直す。署名に使うentitlementsはXcodeビルドが生成した`App.app.xcent`を使う。

```bash
codesign --force \
  --sign 'Apple Distribution: YUSUKE ISHIGE (STVR67YH4M)' \
  --entitlements ios/App/build/App.build/Release-iphoneos/App.build/App.app.xcent \
  --timestamp=none \
  --generate-entitlement-der \
  ios/App/build/Release-iphoneos/App.app

codesign --verify --deep --strict --verbose=2 \
  ios/App/build/Release-iphoneos/App.app
```

### 4.1 Transporterの「Missing required icon file (120x120)」対策

Asset Catalogを一時的に除外したIPAでは、Xcodeが通常生成するアイコン定義が`Info.plist`へ入らず、Transporterで次のエラーになることがある。

`Validation failed (409): Missing required icon file ... exactly '120x120' pixels`

Build 55では、既存の1024pxアイコンからAppIconのiPhone/iPad各サイズを生成し、`Contents.json`へ登録した。暫定ビルドでAsset Catalogをコンパイルできない場合は、生成済みの次のPNGを`App.app`直下へコピーし、Info.plistへ参照を追加してから再署名する。

- `AppIcon-60x60@2x.png`（120x120）
- `AppIcon-60x60@3x.png`（180x180）
- `AppIcon-76x76@2x.png`（152x152）
- `AppIcon-83.5x83.5@2x.png`（167x167）

Info.plistには少なくとも`CFBundleIconFiles`と`CFBundleIcons:CFBundlePrimaryIcon:CFBundleIconFiles`を追加し、120x120のファイル名を参照させる。iPad用には`CFBundleIcons~ipad`も追加する。アイコン資材またはInfo.plistを変更した後は必ずアプリ全体を再署名する。

修正版Build 55の確認項目:

- IPA内に120x120の`AppIcon-60x60@2x.png`がある
- IPAのInfo.plistに`CFBundleIconFiles`、`CFBundleIcons`、`CFBundleIcons~ipad`がある
- `codesign --verify --deep --strict`が成功する
- `unzip -t`が成功する

### 5. IPA化と確認

`Payload/App.app`だけをZIPにしてIPAを作成する。作業用ディレクトリは毎回`mktemp`で作る。

```bash
PROJECT_ROOT=/Users/admin/Documents/Codex/学習ローグ
APP_PATH="$PROJECT_ROOT/ios/App/build/Release-iphoneos/App.app"
IPA_PATH="$PROJECT_ROOT/build/ios/LearningRogue-1.0.6-55-20260827.ipa"
PACKAGE_ROOT=$(mktemp -d /tmp/learning-rogue-ipa55.XXXXXX)

mkdir -p "$PACKAGE_ROOT/Payload"
cp -R "$APP_PATH" "$PACKAGE_ROOT/Payload/App.app"
(cd "$PACKAGE_ROOT" && /usr/bin/zip -qry "$IPA_PATH" Payload)

/usr/bin/unzip -t "$IPA_PATH"
/usr/bin/unzip -p "$IPA_PATH" 'Payload/App.app/Info.plist' > "$PACKAGE_ROOT/Info.plist"
plutil -p "$PACKAGE_ROOT/Info.plist"
```

最低限、次を確認する。

- `CFBundleIdentifier` が`jp.yusukeishige.learningrogue`
- `CFBundleShortVersionString` が`1.0.6`
- `CFBundleVersion` が`55`
- 120x120の`AppIcon-60x60@2x.png`がIPA内に存在
- Info.plistにアイコン参照定義が存在
- `unzip -t`が成功
- `codesign --verify --deep --strict`が成功
- `Assets.car`、2つのStoryboardコンパイル済み資材、`embedded.mobileprovision`がIPA内に存在

### 注意

- これはiOS 26.2のXcodeプラットフォームが不完全な場合の暫定手順。XcodeのiOS Platformと必要なSimulator runtimeが正常なら、Storyboard・Asset Catalogを含めた通常の`archive`を優先する。
- `Assets.car`やStoryboardの再利用は、元のIPAとソース側の`Assets.xcassets`・Storyboardが同一である場合だけ安全。画像やStoryboardを変更したビルドではこの手順を使わず、Xcodeのコンパイル環境を直す。
- Build番号は`ios/App/App.xcodeproj/project.pbxproj`のDebug/Release両方の`CURRENT_PROJECT_VERSION`を一致させる。
- IPAの作成だけで、GitHub・App Store Connect・Steamへのアップロードは行わない。アップロードは別途明示依頼がある場合だけ実施する。

## 学習ローグの現在の標準提出方法（XcodeからApp Store Connectへ直接Upload）

この節を、上記のTransporter手順より優先する。学習ローグの通常の提出先はApp Store Connectであり、IPAをTransporterに渡すのではなく、XcodeのOrganizerまたは`xcodebuild -exportArchive`の`destination=upload`で直接アップロードする。アップロードはユーザーから明示的に依頼された場合だけ実行する。

### 通常の手順（iOSプラットフォームがXcodeに導入済みの場合）

1. `pnpm run build:ios`と`pnpm exec cap sync ios`を実行する。
2. `ios/App/App.xcodeproj`をXcodeで開き、`App`スキーム、Bundle ID、Version、Build番号、Team、App Store用の署名設定を確認する。接続中の実機は不要。
3. Xcodeで`Product > Archive`を実行する。
4. Organizerで対象Archiveを選択し、`Distribute App > App Store Connect > Upload`を選択して提出する。
5. App Store Connect側の処理が完了するまで、Xcodeの結果とApp Store Connectのビルド状態を確認する。

### 現在のMacでのフォールバック（iOS 26.2プラットフォーム未導入時）

Xcodeが`iOS 26.2 is not installed`または`Found no destinations`で通常のArchiveに失敗する場合だけ、次の手順を使う。iOSプラットフォームが正常ならこのフォールバックは使わない。

1. `xcodebuild -resolvePackageDependencies -project ios/App/App.xcodeproj -scheme App`で依存パッケージを解決する。
2. `project.pbxproj`のDebug/Release両方で`MARKETING_VERSION`と`CURRENT_PROJECT_VERSION`を一致させ、`Info.plist`と`Assets.xcassets/AppIcon.appiconset`に`CFBundleIconName`、必要な`CFBundleIconFiles`、iPhone/iPad用のAppIconが揃っていることを確認する。
3. 通常の`xcodebuild archive`を試し、プラットフォーム不足で失敗した場合は、`LaunchScreen.storyboard`、`Assets.xcassets`、`Main.storyboard`の3つだけを`PBXResourcesBuildPhase`から一時的に外してReleaseターゲットをビルドする。ビルド後、3つのリソース参照は必ず直ちに元へ戻す。変更した画像やStoryboardを含むビルドではこの回避策を使わず、XcodeのiOSプラットフォームを導入する。
4. 元のIPAとネイティブのAsset Catalog・Storyboardが同一の場合だけ、既知の正常なIPAから`Assets.car`、`Base.lproj/Main.storyboardc`、`Base.lproj/LaunchScreen.storyboardc`を戻す。アプリ全体を配布証明書で再署名し、`codesign --verify --deep --strict`で検証する。
5. `Products/Applications/App.app`、dSYM、`Info.plist`を含む`.xcarchive`を作成し、Version・Build番号とBundle IDが一致していることを確認する。
6. `destination=upload`のExport Optionsを使ってXcodeから直接提出する。現在の成功例は次の形式。

```bash
xcodebuild -exportArchive \
  -archivePath "build/ios/LearningRogue-<version>-<build>.xcarchive" \
  -exportPath "build/ios/LearningRogue-<version>-<build>-upload" \
  -exportOptionsPlist "build/ios/exportOptions-upload-<version>.plist"
```

Export Optionsには少なくとも次を指定する。

```xml
<key>destination</key>
<string>upload</string>
<key>method</key>
<string>app-store-connect</string>
<key>signingStyle</key>
<string>manual</string>
<key>signingCertificate</key>
<string>Apple Distribution</string>
<key>teamID</key>
<string>STVR67YH4M</string>
<key>provisioningProfiles</key>
<dict>
    <key>jp.yusukeishige.learningrogue</key>
    <string>Learning Rogue App Store Push 1.0.0</string>
</dict>
<key>manageAppVersionAndBuildNumber</key>
<false/>
<key>uploadSymbols</key>
<true/>
```

### 提出完了の判定

- `xcodebuild`の出力またはContentDeliveryログに`UPLOAD SUCCEEDED with no errors`、`Delivery UUID`、転送バイト数、`Uploaded App`、`** EXPORT SUCCEEDED **`が揃うことを確認する。
- App Store Connectの状態が`PROCESSING`なら、アップロードは成功しておりApple側で処理中である。処理中を失敗とは扱わない。
- Bundle ID、Version、Build番号、App Iconのメタデータが一致するまで提出を確定しない。
- Apple IDパスワード、OTP、App用パスワード、API秘密鍵、キーチェーン内容は読み出さず、AGENTS.mdやログにも記載しない。

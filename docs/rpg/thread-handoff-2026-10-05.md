# 学習ローグ：RPG開発スレッド引き継ぎ

作成日：2026-10-05（日本時間）。次のスレッドでは、この資料を読んだうえでGitHubの最新mainを確認して作業を続ける。

## プロジェクトと現在地

- リポジトリ：https://github.com/YIICTSC/math-rogue
- 公開Web：https://yiictsc.github.io/math-rogue/
- このスレッドでユーザーが動作確認に利用したURL：https://learning-rogue.yishigeict.chatgpt.site/
- 最後にmainへ反映したコミット：`e5147941436b1879e1859f58cef41881c1181a67`（feat(3d): add Blender storybook drivers and golfers with expressive character rigs）。農園実装の基準コミットは`26f880b1c607365371df4a896c383375f0860765`。このSHAは基準点であり、次回の最新SHAとは限らない。
- 最新の実装は暮らし・都市・農園の拡張、3D表示、横画面メニュー、音声、隣接農作業。末尾の最新追記を参照。
- 今回の作業環境：`/workspace/math-rogue`、main。引き継ぎ資料を作る直前は未コミット変更なし。
- 本資料は資料専用ブランチ `docs/rpg-handoff-2026-10-05` に公開。ゲーム本体のmainは変更していない。ローカルmain上ではこの資料だけが未追跡ファイルになっている可能性がある。

## ユーザーの継続方針

1. 会話の古い指示時点ではなく、現在のGitHub mainを基に改修する。開始時にブランチ・未コミット変更・リモートとの差を確認し、他の変更を消さない。
2. 実装と必要な検証を進め、アップロードを指示された変更はmainへ反映する。ルーチンの確認質問で止めず、具体的な成果を完成させる。
3. ユーザーは「今後のアップロード確認はgithubの公開の確認までで良い」と明示。GitHub ActionsとGitHub公開の確認までを行い、Renderの手動デプロイ・稼働確認は追加しない。このユーザー指定がAGENTS.mdのRender確認規定に優先する。
4. 日本語で簡潔な進捗・完了報告。スマホ縦横・デスクトップでゲーム画面を大きく、情報は小さなボタンにまとめ、タップで詳細を見る方針。
5. 必要なオリジナル画像はImageGen。画像端の欠け・隣の画像の混入・ラグの左端切れを避ける。透明背景、十分な余白、実際の輪郭に基づく切り出し、WebP化、UIとCanvasで同じ素材を使う。
6. 道路など継ぎ目が重要な素材は無理にImageGenを使わず、連続性を確保できる描画方式にする。
7. 採取・釣り・家具ゲームのSEはSpringin’ Sound Stockを利用。既存の出典資料と音量・ミュート設定を維持する。
8. RPGのデバッグ専用導線を本番へ無条件に開放しない。ゲーム家具の練習室はデバッグ有効時だけ。
9. 現在の開発者指示では、ユーザーまたは適用されるローカル指示が明示的に求めない限りサブエージェントを使わない。

## このスレッドの開発対象・履歴

初期にはオンライン4ゲーム（RPG・カート・クラフト・ゴルフ）の観戦モード、接続失敗改善、参加者集計UI、招待URL／コードによる途中参加を依頼。その後、RPGを主に拡張した。過去の依頼の全項目を今回あらためて実機検証したわけではない。変更時は現行コード・関連資料を正として確認する。

RPGの主な継続対象：
- 敵を主人公として選択、名前とイラストの対応、固有デッキ・レリック、NPC会話とシナリオ。
- なだらかな6バイオーム、バイオーム別自然物、採取・採掘・クラフト。外壁の採れない木を採取候補にしない。
- スマホ・PC共通のマップ中心UI、隣接資源のクイック採取、画面全体タップで確定する小さなアクション画面。採取エネルギーは問題を解いて回復。
- 家への重なり入室、歩ける18×14の室内、入口で退室、家財の作成・配置。ゲーム家具は家の中でのみクラフト。
- 最大4人の家具ゲーム、ローグライク遠征、全曲リズムゲーム、ビリヤードの3D・打点と回転、スワイプ投球のボウリング。一人用・CPU対応。
- バイオーム別の魚60種類、合わせ＋巻き上げアクション、釣り図鑑・最大サイズ更新、専用SE。
- 写真・イラストからオリジナル主人公、6アクション各最大4フレーム、主人公ボイス選択、主人公別機械音声。
- 交流会話、好きな言葉の学習（意味／会話ジャンル・よみがな）、友好度、同居・結婚、四季・花・料理・お願い・訪問・夢・家族。
- RPG／カート専用タイトル、RPG一人用ワールド保存、続きから、時間制限なし。
- オリジナル住民の作成、クリア後の都市運営（道路・20施設・財政・サービス・幸福度・政策・イベント）。
- RPG専用設定：十字キー／仮想スティック、左右配置、拡大、機械音声、動き軽減、高コントラストなど。

## 最新の完成機能：農園・家畜・ペット・料理

入口はマップ下の「農園」。家の中／暮らし画面にも農園タブ。

- 作物32種類（四季各8種）。木材4・石材2で農園を設置、12→18→24区画へ拡張。
- 水やり、雨、肥料、輪作、品質、再収穫、季節外の休眠、温室、自動水やり。
- 家畜8種類：ニワトリ・ウシ・ヒツジ・ヤギ・アヒル・アルパカ・ブタ・ミツバチ。卵、ミルク、羊毛、チーズ、アヒルの卵、毛糸、トリュフ、ハチミツ。
- 家畜は4匹、牧舎拡張で12匹。給餌・ブラシ・掃除、成長・健康・絆・品質、名付けと変更。
- ペット16種類、最大6匹。犬4・猫4・ウサギ・ハムスター・ハリネズミ・キツネ・インコ・シマエナガ・カワウソ・ちびドラゴン。
- なでる・遊ぶ・しつけ・給餌・20歩の散歩・おつかい。屋外の連れ歩きと室内表示。
- 新しい料理48種類、既存24と合わせて72種類。食材を選んで組み合わせ検索、実際の食材を消費し、既存の3段階タイミング調理。食べる／住民・参加者へのごちそう。
- 作物・生産品40項目の図鑑、最高品質、農園10目標、報酬・コイン・XP・レベル。
- ImageGen画像112点：作物32＋家畜8＋生産品8＋ペット16＋料理48。透明余白付きの独立WebP。配信画像の合計1,752,728 bytes。
- 世界保存とオンライン同期。アプリを閉じている間は成長・空腹・おつかいが止まる。旧セーブは最初に農園を開くと初期化。途中参加でも農園・動物・ペットの全状態を受け取る。
- 遠い農園へ「農園へ向かう」で自動歩行。採植・水やりなどは農園の近くで行う。

## 実装の入口

- `src/rpg/farm/catalog.ts`：作物・動物・ペット・レシピ定義。
- `src/rpg/farm/model.ts`：状態、行動検証、季節成長、世話・報酬。
- `src/rpg/farm/Panel.tsx` / `farm.css` / `uiCopy.ts`：UI、レスポンシブ、翻訳。
- `src/rpg/farm/Sprite.tsx` / `draw.ts`：画像とマップ描画。
- `src/rpg/engine.ts`：World.farm、FarmAction、dispatch／tick。
- `src/rpg/RpgOnline.tsx`：農園ボタン・モーダル、自動歩行、入力制御。
- `WorldCanvas.tsx` / `HomeCanvas.tsx` / `HomeRoom.tsx`：屋外／屋内。
- `src/rpg/town/catalog.ts` / `model.ts` / `Panel.tsx` / `Sprites.tsx`：全72料理、食材消費、調理。
- `src/rpg/life.ts` / `city/model.ts`：資源・歩行・配置の競合回避。
- `src/rpg/network.ts`：農園実装時点のPeerプロトコル18（現在は譜面更新によりRPG19）。
- `public/sprites/rpg/farm/`：112 WebPと`generation.json`。
- `src/data/debugUiExact.ts`：英語・ひらがな翻訳。短い新規ラベルも登録する。
- `public/android-asset-pack-manifest.json`、`src/generated/androidAssetPackVersions.ts`：追加素材登録。

World.farmは任意の状態で、version=1、所有者別peopleとrevisionを持つ。全操作は権威側で所有権・距離・素材・重複・他行動中を検証する。マップ描画は農園の占有タイルをキャッシュし、表示範囲を絞る。日付は既存の世界時計（1日180秒、1季節7日）を使う。

## 資料

次のリポジトリ内資料を参照する。古い節のプレイ人数・家具数などは後の節で更新されている場合があるため、現在のカタログとコードを確認する。

- `docs/rpg/farming-ranch-and-pets.md`
- `docs/rpg/city-and-practice.md`
- `docs/rpg/seasons-and-town-life.md`
- `docs/rpg/world-save-and-game-titles.md`
- `docs/rpg/frontier-life.md`
- `docs/rpg/furniture-art.json`
- `docs/rpg/life-sound-credits.md`
- `docs/rpg/fishing-sound-credits.md`
- `docs/rpg/game-furniture-sound-credits.md`

`docs/release-handoff-2026-08-05.md`は以前のストア公開用の資料。今回のRPG改修の最新状態ではない。App Store／Google Play／Steamへの提出はこの依頼では行っていない。

## 農園実装で完了した検証・公開

農園実装コミットで以下が成功。
- `pnpm run build`（翻訳／英語UIなどの監査を含む）
- `pnpm run server:build`
- `node scripts/test-rpg-farm.mjs`：全32作物、全48料理、家畜・ペット、重複／所有権、保存・112画像。
- `node scripts/test-rpg-farm-browser.mjs`：6タブ×6画面サイズ、実操作、調理中断、画像読み込み、英語／ひらがな、ブラウザエラーなし。
- `node scripts/test-rpg-farm-server.mjs`：実サーバーで複数WebSocket参加者、農園へ移動して世話、所有権、途中参加の全状態。
- `node scripts/test-rpg-city-browser.mjs`：実RPGから農園を開く、7ボタンのドックが320px幅を含む6画面サイズ内に収まり各44px以上、従来の都市／設定／練習室も確認。
- 既存のtown、world-save、cityの関連回帰検証。
- GitHub Actions：Deploy To GitHub Pages run `37250273207`、Build Android App Bundle run `37250273186`、両方success。
- 公開ページのJS／CSSに新機能が含まれること、112 WebPがローカルとバイト一致することを確認。

注意：リポジトリ全体のTypeScriptチェックには既存のエラーがある。今回追加・変更した農園関連のエラーは修正済みだが、全体tsc成功とは報告しない。Renderの更新結果はユーザー指定により確認していない。

## 農園実装後の追加更新：家具ゲームのBGM・リズム音声

- `0f93f3b06fc287b431c89cec12e6bdc68a424a4b`で追加。9家具ゲームのプレイ中は学習ローグの既存BGMを選定してループ。退出時に元のBGMへ戻すが、問題画面など別シーンが音楽を変更した場合は上書きしない。
- 選定：ビリヤードpoker_play、ダーツpoker_shop、ボウリングdungeon_gym、リバーシdungeon_library、四目並べmath、神経衰弱dungeon_music、すごろくpaper_plane_vacation、ブロック崩しpaper_plane_battle、反応ゲームkocho_battle。新旧BGMの両方に対象ファイルあり。
- `gameBgm.ts`と`useGameBgm.ts`を追加。RPGの家・練習室・学ロクラフトの`HobbyGamesPanel`で共通化し、クラフト側のBGM選定も合わせた。
- リズム画面は選曲・試聴・カウントダウン・演奏・一時停止・結果まで背景BGMの消音スコープを保持。Web AudioのGainとHTMLAudioのmutedを使い、iOSでvolumeが無視されても重ならない。別のBGM変更やduck解除も消音を解除できない。
- リズムの4レーンはキック／スネア／ハイハット／スクラッチ。空振りでも押したときに鳴り、キーリピート・長押し終了・自動判定で重複しない。効果音設定とミュートに従う。
- 従来note-0〜3の選択音を、オリジナル合成音源のMP3／Opus各4点へ置換。Springinの録音を加工したものではない。`scripts/generate-rhythm-pad-sounds.mjs`で再生成。Android素材の版も更新。
- 試聴中の非表示・曲切り替え・退出・非同期play競合を考慮し、準備用の短いplayもmutedにする。
- 検証：`test-home-game-bgm-browser.mjs`で9曲の実再生、ループ復帰、別シーン音楽維持、リズム消音を確認。`VITE_APP_PLATFORM=ios`でも同テスト成功（ChromiumでiOS向けHTML音声経路を検証。iOS実機確認ではない）。
- `test-rpg-rhythm-browser.mjs`で試聴、消音中のBGM変更、空打ち／リピート抑止、4音源の実再生、通しスコア、再開・タッチ・ミュート・退出が成功。タイミング検証中にスクリーンショット／画面サイズ変更を行うと最初のノーツを逃すため、表示確認は一時停止中に行う。
- `test-home-game-audio.mjs`、`test-rpg-rhythm.mjs`、Androidアセット監査、Web／サーバービルド成功。
- GitHub Actions：Deploy To GitHub Pages run `37257184005`、Build Android App Bundle run `37257183998`、両方success。公開JSの消音制御と9家具ゲームBGM定義、MP3／Opus計8点のローカルとのバイト一致を確認。
- 詳細と音源出典：`docs/rpg/game-furniture-sound-credits.md`。

## その後の更新：全楽曲の打楽器譜面点検

- main `55f2c54f7c85e70df1edf2beef588dad2ae3c9ee`。全143曲の元MP3を音域別アタック・ハーモニック集中度で解析し、3難易度×2長さの858譜面を点検／修正。
- 旧版のIDハッシュによるレーン巡回と、音の立ち上がりから遠いグリッド配置を改善。すべての頭・長押し終点が検出音に一致。音域からキック／スネア／ハイハットを選び、スクラッチは強いノイズ成分・BPM115以上の戦闘系9曲だけ、最低8拍間隔。
- 入力音の強さを曲・アタックに合わせて下げる。`playRpgRhythmHit`の第3引数が音量。キャッシュ音源／未準備時の合成音ともSFXバスのGainを使い、iOSのHTML音量無視を避ける。
- 全曲で難易度別密度、140ms以上の同レーン間隔、ドラム＋ハイハットの同時押し、長押しの安全性を確認。頭ノーツ数268,151→228,507。解析音から25ms以上離れた配置137,344→0、スクラッチ対象外の曲への配置45,166→0。
- `RhythmState.chartVersion=2`、旧状態／旧サーバーは省略時1として`legacyChart.ts`を利用。新サーバーで新しく開始すると2へ。Peer RPG19、クラフト9。
- 保存キー`rpg-rhythm-records-v1`は保持。新譜面は記録の項目キーに`|chart-2`を付け、旧記録と比較しない。旧記録は削除しない。
- 正本：`src/rpg/rhythm/accents.generated.ts`、`chart.ts`、`legacyChart.ts`、`game.ts`、`records.ts`。再生成は`python scripts/generate-rhythm-accents.py`（ffmpeg/numpy）。元カタログ更新時はこちらも再生成する。
- `node scripts/audit-rhythm-accompaniment.mjs`で全曲監査。結果は`docs/rpg/rhythm-accompaniment-audit.json`、説明は`docs/rpg/rhythm-accompaniment.md`。
- 解析は音源分離・楽器の確定識別ではなく伴奏用の推定。全曲を人の耳で聴いたとの記録ではない。
- 全858譜面の監査、モデル満点／長押し／4人／不正入力、実ブラウザの演奏・試聴・再開・タッチ・旧記録保持、Web／サーバービルドが成功。
- GitHub Actions：Deploy To GitHub Pages `37259530289`、Build Android App Bundle `37259530290`、両方success。公開ページの譜面バージョン・新旧記録分離・143曲分の解析データ一致を確認。

## 環境限定の補助資料

同じ実行環境が残っている場合のみ使用可能：
- `/workspace/scratch/`：農園の検証ログ、公開確認`check-rpg-farm-public.py`、GitHub API経由アップロード`push-main-api.py`。
- `/workspace/generated_images/`：元のImageGen PNG。作物`exec-c51c47b2-11a2-434a-894a-fb2ad8b23598.png`、動物`exec-bc90e053-ade3-4c0b-b8d9-1005cebc3cec.png`、料理`exec-cdf322c7-655e-4774-be78-111fb4325bf0.png`、追加料理`exec-f15998de-d250-462c-801c-33c9e0a46cc7.png`。
- `/workspace/scratch/export-farm-sprites.py`：生成画像の独立した輪郭を機械的に切り出すWebP出力補助。

新しいスレッド／環境でこれらのファイルが残る保証はない。成果物はGitHubのコード・WebP・生成記録が正本。認証情報・秘密鍵は引き継ぎ資料に含めない。

## 次のスレッドでの開始手順

1. ユーザーの新しい依頼を読む。本資料にない新作業を勝手に開始しない。
2. 必要な環境スキルとAGENTS.mdを読み、現在のチェックアウト・変更・最新mainを確認する。AGENTS.mdには旧Windowsの正規フォルダ指定があるが、このスレッドは承認済みのLinux環境で作業した。新しい環境の利用可能なチェックアウトを確認する。
3. 基準コミット以降の変更があれば差分を確認し、古い状態へ戻さずに統合する。
4. 関連実装とテストを読み、新しい依頼を実装する。画像と配信マニフェスト、翻訳も更新する。
5. 変更に合う検証とWeb／サーバービルドを行う。アップロード時はmainのGitHub Actionsと公開を確認し、具体的な変更と確認範囲を日本語で報告する。

## 追加完了：RPGの場面別BGM（5752fb45）

- RPGの屋外マップは常に `bgm/map.mp3`（旧小学生編）。全143曲の既存音源から、独自要素22場面に旧・新／各編を横断して曲を割り当てた。選定表 `src/rpg/music.ts`、説明 `docs/rpg/scene-music.md`。
- タイトル、設定、主人公ビルダー、家、家具作成、農場、都市、交流、釣り、釣果、採取、独自シナリオ、図鑑、家具練習室などを対応。家・採取パネルのタブ切り替えにも追従。
- `audioService.acquireBgmScene` に優先度付きシーンスコープを追加。設定・上位モーダル40、プレイ中家具30、室内・採取・ゲームロビー20、RPG基底10。通常のマップ復帰処理による曲の上書きを防ぎ、終了時に前の音楽へ戻す。ユーザーのBGMモード・編の保存値は変更しない。
- 流用された戦闘・店・休憩・イベント・学習・ダンジョンではスコープを解除し、従来の各編BGM。RPG内の9家具ゲームは既存個別曲をNEW elementaryに固定、学ロクラフトの共有UI側は従来設定のまま。音ゲーは既存の無音スコープでBGMとの重複を防ぐ。
- `scripts/test-rpg-scene-music.mjs`：全22曲の実ファイル／再生URL、旧マップ再適用、家具・設定の優先度、音ゲー無音、各編の戦闘への復帰、設定値保持を検証。通常WebおよびiOS設定のHTML経路をChromiumで通過。実機iOSでの試聴ではない。
- 9家具ゲームの既存ブラウザ音楽テスト、英語UI全監査・公開用ビルド・サーバービルドを通過。GitHub Actionsと公開Webで反映を確認。Render確認はユーザー方針により省略。

## 追加完了：敵主人公の秘技画像・BGM継続（bc767273）

- 秘技カードの `rpgEnemyHeroId` で敵本人の画像を最優先表示。高・魔の人型は正しい番号の攻撃画像、あずきはpounce、無限ボスは本人のattack画像。それ以外は選択画面と一致する画像。攻撃画像が失敗した場合は待機画像へフォールバック。
- 旧保存デッキは `RPG_ENEMY:<編>:<名前>:CARD:...` と秘技名から対応。通常の初期デッキカードは変更しない。`getEnemyHeroSignatureImages` と Card の最優先画像分岐。全325体のファイルと対応、旧カード、新旧描画を3編で検証。資料 `docs/rpg/enemy-signature-art.md`、テスト `scripts/test-rpg-signature-art.mjs`。
- 前回BGM切り替えが多すぎるとのフィードバックを反映。設定、主人公編集、採取、釣り、釣果、クラフト、交流、農場・都市の管理画面、会話、手帳、仲間、目標、家具選択は周囲のBGMを継続。屋外では旧小学生マップ、室内では家の曲、タイトル設定ではタイトル曲を再生し続け、巻き戻さない。
- `resolveRpgMusicScene` と `RPG_PASSIVE_MUSIC_SCENES` が有効な統合規則。候補22場面の定義自体は残すが、メニュー等で独立曲に切り替えない。タイトル→冒険設定、家への入室、ゲームの実プレイ開始、独自アーケード、クリア・終了など大きな転換時だけ変更。マップ基底は優先度10、終了時のみ40。家具ゲーム30は設定メニューを開いても維持。
- 更新 `docs/rpg/scene-music.md`。マップ・家・タイトル各文脈の全15受動画面でHTML audioの同一性を検証し、通常WebとiOS設定HTML経路をChromiumで通過。英語UI監査・Web/サーバービルド通過。GitHub Actionsと公開確認済み。Render確認はユーザー指定により省略。

## 追加完了：本編カードをトレードで表示（b56d5d4a）

- `ActivitiesPanel` のテキストのみのCardInfoを本編 `Card` に置換。自分の選択デッキと双方の提示カードで、画像、コスト、効果、枠を共通表示。選択はチェックと縁取り、`aria-pressed`。提示カードのタップと選択カードの既存長押しで `CardInspectionModal` の詳細確認が可能。5枚上限と選択解除、キーボードのSpace/Enterにも対応。
- `activities.ts` で旧秘技カードの敵IDを受け取りカードIDへ変更する前に保存し、交換後も正しい画像を保持。攻撃画像は画像URL文字列の置換でなく、正確な敵カタログの番号からassetUrlを呼び、Androidダウンロード素材のハッシュ化された保存先に対応。
- `scripts/test-rpg-trade-cards-browser.mjs` が実トレードコマンドで選択・双方提示・人型攻撃画像・詳細・キーボード・旧秘技交換後の画像保持、360×800・800×360・1280×800の表示を検証。既存活動モデルテストも通過。
- Android設定の画像ブラウザテストで、全325体のファイル／描画に加え、ダウンロード済み素材のハッシュURLが正しいattackファイルを指すことを検証。英語UI監査・最終Webビルド・サーバービルド通過。GitHub Actionsと公開反映を確認。Render確認はユーザー指定に従い省略。

## 最新追記：暮らし・都市・農園・3Dとスマホ操作

main `16435d884060db39384597f8e7560a80bd1d3ec2` に実装。詳細はmainの `docs/rpg/lifestyle-and-world3d.md` を参照。料理72種のNPC／プレイヤーへの贈答（承諾・返却・期限・日別上限）、ペット18種・芸16種、家畜の子ども、都市6地区計画・6共同プロジェクト・住民要望を追加。ImageGenで16アイコン／16動物姿勢を生成、余白付き透過WebP化。

2D／3Dを設定またはマップ上で切替。Three.jsの一人称マップ、左右旋回、相対移動、低品質設定、WebGL非対応時の2D復帰。全体マップは2D。既存保存・移動判定・BGM継続を維持。

横画面の各メニューは本文をスクロール、タブを横スクロールし末尾まで選択可能。「今日」は「暮らしの状態」に変更し説明を追加。会話音声は6おすすめ・6話し方・抑揚設定、文章単位の読み上げと短い間。SpeechSynthesisの声質は端末依存。農場・家畜・ペットに隣接すると右下に操作。farm-quickはサーバー側でも所有権・距離・既存制限を検証。

モデル／実ブラウザ（スマホ縦横／デスクトップ／3D／横画面メニュー／農作業）・音声モック・英語監査・Web build・server build確認。新規モジュールの型エラーなし、依存先には既存型エラーが残る。

この追記が冒頭の古い作業説明より優先。次のスレッドでは常に最新mainを取得する。公開確認はGitHubまで、Render確認は不要。

## 最新追記：3D内の2D配置物

main `4d87c848c240d7629a1295bc0e2c3c4bf75320fa`：NPCは対応する立ち絵、敵・会話イベント・宝箱・封印・秘密入口などは2Dマップのlandmark描画を使うカメラ向きSpriteに変更。元画像の縦横比、地面への接地、人／小物／花の寸法を調整。小さな採取物と四季の花に既存アトラスを使用。隠し断片の表示条件を維持。3D実ブラウザ・Web build・server buildを確認。

## 最新追記：スマホ暮らしUI・主人公の性格

main `2a1ba24f1a6d96c577a480128ba3a3cf1078bf3f`：外側の詳細ナビと暮らし内タブを各1段の横スクロールに統一。説明、プロフィール編集、言葉を教える欄を折りたたみ、状態メーターと主人公名・現在の性格・日課を優先。チェックボックス幅22pxを固定し文章の縦崩れを修正。性格は操作中の主人公の暮らし用キャラクター性（日課／交流会話の反応）と明記、戦闘能力／デッキへの影響なし。通知は「主人公のプロフィールを更新しました」。保存形式は変更なし。town実ブラウザで6画面サイズ、チェック寸法、プロフィール操作、EN／HI、料理・住人・夢・保存再開を確認。3D回帰・townモデル・Web build・server build確認。

## 最新追記：ワールド住人と全画面会話

main `2a1ba24f1a6d96c577a480128ba3a3cf1078bf3f`。標準・自作住人をワールドに配置し、障害物を避けて散歩・休憩・見回し。NPCイベントの同一人物は二重配置せず共有。主人公の近くでは立ち止まり、右下の肖像ボタンまたはEから全画面会話。会話・贈り物・お出かけ・言葉・同居/結婚を専用画面に集約。NPCイベントも全画面化。サーバー側距離判定、会話中の移動制限、位置保存、旧セーブ移行、2D/3D反映。既存の宅配プレゼントは維持。

詳細：`docs/rpg/world-residents.md`。主要ファイル：`town/worldResidents.ts`、`town/ResidentScene.tsx`、`town/encounter.css`、`town/model.ts`、`RpgOnline.tsx`、`WorldCanvas.tsx`、`WorldScene3D.tsx`。

build/server:build、新規resident world/browser、既存town model/browser、city、lifestyle、real3D browserが成功。ブラウザはスマホ縦横/PCの5サイズで専用画面と各タブを確認。


## 最新追記：住人交流・専用NPCイベントの拡張

- main: `87c1d6fc8f5de44a452729cd8720fe3981188367`。会話24テーマ、選択イベント12種、贈り物36反応。旧お気に入り語句と教えた言葉を維持。
- お出かけ6ルートの専用ImageGen背景と主人公・住人の2人表示。各ルート3段階×3選択（計54選択）。
- 屋外会話の初期背景を実際の3Dマップにする。終了時は元の2D/3D設定に戻る。設定そのものは変更しない。室内は室内背景。
- 郵便屋ほか6人の専用NPCを2D/3Dマップの立ち絵に変更。専用シナリオ6人×4=24、旅人イベント24種。新ワールド作成時にランダム選択し、受注済み・保存済みの内容は固定。旧保存は従来シナリオ。
- 新規WebP48点：お出かけ背景6、NPC背景6、専用イベントイラスト24、旅人イラスト12。ImageGen生成後に余白を修正生成し、sharpで切り出し/WebP変換。素材の詳細は `docs/rpg/resident-conversations.md`。
- 会話/住人/暮らし/冒険/NPCモデルテスト、住人ブラウザとNPCブラウザ（5画面サイズ）、Webビルド（英語ゲート含む）・サーバービルド成功。住人ブラウザはソフトウェア3Dで数分かかる。
- 全体tscには既存エラーあり。今回の追加モジュールには新たなエラーなし。Render確認はユーザー指定により実施しない。

- 公開確認済み：GitHub Pages Actions `37294487102`、Android Actions `37294487112`ともsuccess。公開コードの新機能マーカーと画像52点のバイト一致を検証。


## 最新追記：縦画面イベントと釣果の修正

- main `ce93200014410b1387fb80cda1d9422e47a8cfe0`。NPC/対象物の画像は縦画面で最大30dvh/240pxに収め、会話欄との重なり・頭や足の見切れを防止。対象物イベントの重複サムネイルを削除。
- useFishingCollectionは最初のワールドスナップショットを保存履歴として扱い、再開時に釣果を表示しない。図鑑への保存は維持し、以後の新しい釣果だけ表示。
- 釣りを続けるは近くの水辺へlife-castを送信する。釣果中の移動ロックに依存しない。エネルギー不足時は回復問題へ。釣りを止めるを追加し、Escapeも終了。3ボタンのフォーカス循環と縦横配置に対応。
- 釣りモデル、釣果ブラウザ（再開/新規/続行/停止/セッション切替/3画面）、NPCブラウザ（5画面+縦の対象物/旅人）、英語監査、Web/serverビルド成功。

 
## 最新追記：採用ロゴとGAKURO GPコースエディター
 
- main f8eb00f1c2b45bbca97c606279f7731be68528da。RPGタイトルは「異世界転生したら学力で無双した件」、サブタイトル「学習ローグRPG」。採用したA案（学力が青緑）のImageGen素材を透明WebPへ変換し、通常・招待タイトル背景上に配置。素材は sprites/rpg/title/logo.webp。画面サイズ別にロゴ・メニューが収まることを確認。
- GAKURO GPタイトルとガレージにオリジナルコース作成を追加。問題ストレートと周回接続を保護し、残り12制御点の平面位置・高さを編集。ブースト板/ジャンプ台/アイテム箱を最大48個配置でき、位置・左右レーン調整、削除、Undo/Redo、拡大、8背景テーマがある。
- 端末保存12コース、選択、削除、JSON書出し/読込。作ったコースをひとり用・オンラインで利用でき、結果画面から次の編集コースを設定できる。
- ネットワークはカートprotocol 10。専用サーバー/PeerホストのロスターにcustomCourseを含め、途中参加も同じコース。サーバー/クライアントで形状・固定区間・配置物を検証。レンダラー/カメラ/ミニマップ/CPU/配置物効果/周回距離/問題表示が同じコースを参照。
- 機能説明 docs/kart/custom-courses.md。新規モデル・ブラウザ・専用サーバー3クライアントテスト、既存カートコース/学習/カメラ、Web英語監査/build、server:build成功。新規ブラウザはソフトウェアWebGLで時間がかかる。全体tscはメモリ不足のため完走しなかったので、型チェック成功とは扱わない。

- 今回の公開確認：GitHub Pages Actions 37381237342、Android Actions 37381237257ともsuccess。公開ロゴと画像計53点の一致、およびカート編集・釣り修正・NPCイベントの公開コードを検証。前回待機中だったPages処理は今回のmain更新で置き換わり、前回の修正も公開済み。

 
## 最新追記：禁書管理の書記のバカンス版アタック絵
 
- main e670338055c4e68916fb498af600cbbe61505a4e。添付の高校編 hs_03「禁書管理の書記／紫帽子の浜辺司書」のアタック絵にあった四角い透過欠けを修正。
- 立ち絵 sprites/high-school/vacation-humanoid-enemies/3.webp と元アタック絵をImageGen参照に使用。顔・帽子・服・本を維持し、人物を不透明にして水の魔法と紙のエフェクトを再生成。攻撃素材 vacation-humanoid-enemies-attack/3.webp のみ差替え。立ち絵・スキル絵はそのまま。
- 生成元 exec-76b55aab-6cc8-42b3-aabb-40f82b3b7671.png を generated_images に保持。1024×1536の透明WebP、quality94/alphaQuality100。胴体の確認範囲でalpha240未満が約13%→0%となり、背景の角は透明。
- Androidアセットハッシュを更新。Web英語監査/build、server:build成功。

- GitHub Pages Actions 37383114895 は成功。公開URLのアタック3.webp（693344 bytes）がローカル修正版と完全一致することを確認。Android Actions 37383114886 は最終確認時点でリリースAABビルド中。Render確認はユーザーの方針により実施していない。

## 最新追記：RPGの操作ボタンの視認性

- main `8ae0b21e0138cf56f44efae111f414878a99098b`。開始画面の主人公ビルダー・未選択タブを枠／背景のあるボタンにし、RPGの共通ボタンの装飾を補完。専用デザインのあるボタンはその指定を維持。
- 家具ゲームはRPG練習室などgc-rootがない場所で基本装飾が欠落していたため、gameRoom.cssに低詳細度のフォールバックを追加。開始を金色、退出を紫系の独立したボタンとし、アクション行を折り返し＋間隔付きにした。MiniGameLabにも独立したボタンの基本表示を追加。
- スマホ縦390×844／横844×390／PC1440×900で主人公ビルダー、全10種類の家具ゲームの開始・退出の枠／背景／配置と操作をブラウザ確認。既存test-rpg-mobile-browser.mjs成功（初回は並行ビルド中の採取タイミング判定で失敗、再実行成功）。Web英語監査/build、server:build、diff --check成功。
- 変更はRpgOnline.tsx/rpg.css/miniLab.css/HobbyGamesPanel.tsx/gameRoom.cssの5ファイル。ラベル／ゲームルール／アセット変更なし。アドホック表示テストと確認画像は/workspace/scratch/rpg-buttons-*。

- GitHub Pages Actions 37409522125、Android AAB Actions 37409522122とも成功。公開index-DQ9wzNLN.css（774651 bytes）およびHobbyGamesPanel-CqUtRNjl.css（26541 bytes）がローカル検証済みファイルと完全一致。公開JS HobbyGamesPanel-DUHGWLqd.jsにgc-game-actions/start/exit指定を確認。Render確認はユーザー方針により実施していない。

## 最新追記：ゴルフオンラインのゲーム画面（2026-10-06）

- main `46c0ddf4578d768c34ccdc4f3a27a1091ac3c7e2`。ユーザーの「みんゴル」参考画像を基に、選手後方の低いカメラ、左上ホールリボン／打数／残り距離／累計スコア、右上風向き、開閉するコースマップ、下部クラブ／横長パワーゲージ／ショット操作を実装。単位は従来のメートル、パワーは従来のスライダー操作を維持。タイミング判定などルール追加はない。
- GolfCanvas.tsxは選手を左に映すスタンスにし、その方向に合わせてスイングの符号を補正。ボール半径を0.55→0.16へ縮小し、描画軌道も0.39下げて一致させた（予測／物理データは従来どおり）。画面比率に応じたカメラ距離・横位置・HUD用の投影オフセット。飛行時のボール追従と全景切替を維持。
- 新規 CourseHud.tsx：実際のコース／参加者座標によるSVGマップ、狙いに対する風向き、クラブSVG。courseScenery.ts：決定的な芝テクスチャ、InstancedMeshの広葉樹・影・丘・雲をコードで生成し、終了時にGPU素材を破棄。プレイ領域は物理と同じ平面を保つ。静的素材追加なし。
- GakuroGolf.tsxでは実シミュレーションを使う推定飛距離をmemo化し、ホールを依存条件に含めた。通常プレイ中のホストには変更不可の観戦切替帯を出さず、観戦中は従来の8秒切替／手動切替を維持。ゲームステージを全面に固定し、観戦帯が画面を押し下げる問題を防いだ。
- 変更6ファイル：GakuroGolf.tsx/GolfCanvas.tsx/CourseHud.tsx/courseScenery.ts/copy.ts/golf.css。copy.tsの新ラベルは既存debugUiExactのGOLF_ENGLISH/HIRAGANA展開で翻訳。
- 確認：test-gakuro-golf.mjs成功（40人、学習報酬、池・OB、パター、3ホール等）、test-golf-dedicated-browser.mjs成功（40 WebSocket／同時ショット／ホスト交代）。実3問→ショット／全景／クラブ変更／全3ホールのブラウザ確認成功。
- 最終表示：1440×900/390×844/844×390/360×640/568×320/1024×768で実選手の描画境界・足元・ボール・全操作を確認。ホスト／観戦を縦横PCで確認。スイングは実モデルのクラブ位置がバックスイング時Z負・フォロー時Z正になることを確認。
- Web英語監査/full build/server:build/diff --check成功。最終Vite build成功。既存test-gakuro-golf-browser.mjsは現行単元UIに「1ケタのたし算」が出ないため停止したが、ゴルフ単独UIで実単元準備／3問回答／ラウンド開始を別途通している。テスト素材とログは/workspace/scratch/golf-*。

- 前回のゴルフ画面改修の公開確認：GitHub Pages 37413697524、Android AAB 37413697393ともsuccess。公開CSS/JSとローカルの一致を確認済み。

## 最新追記：ゴルフ18ホール・住人会話・タイピング（2026-10-06）

- main `b53c4645ba73072953c269822a1b67787a199665`。47ファイル変更。ゴルフは18ホール・合計PAR72、ホスト／ソロは開始前に1〜18ホールを選択。途中参加・ホスト交代にも設定を保持。専用サーバー・Peerともprotocol2。
- 最初に3問、その後は実際のショット3回ごとに3問。学習報酬は3ショット分でホールをまたいで保持。OB／池の罰打は残りショット数を消費しない。質問を省略する次ショットでもリプレイ防止トークンを更新。ホール数はロビーのみホストが変更できる。
- タイトル／参加者集計を画面高内に収め、横画面2列、縦画面コンパクト配置、参加者一覧内部スクロール。320×568、390×844、360×640、568×320、844×390、1024×768、1440×900で確認。
- Springin Sound Stockから8種のゴルフ効果音を選定しMP3／Opusで同梱。スイング／パット／着地／カップイン／バーディー／池／OB／開始。各ホールに既存新旧BGM18曲、タイトルと結果にも既存曲を割当。質問・スコアボードでは曲を切り替えない。音源一覧と権利・出典は docs/golf-audio-credits.md。音源直リンクは掲載せずカタログ分類と元タイトル・取得SHA256を記載。
- audioService.acquireBgmSceneは従来の解除関数にupdateを追加。優先度を保ったまま曲を変更し、ホール間の一瞬の元曲復帰を防ぐ。既存利用側互換。音量／ミュートは既存設定を尊重。
- ResidentSceneで主人公／住人のspeakerに合わせ吹き出しと名前・話者アニメを分ける。初回の仲良くなる案内、システム話者の効果説明は操作パネルへ表示し住人の発言にしない。スマホ縦では吹き出し幅は広く、しっぽを各話者側にする。操作タブ高さ44pxを保証。
- タイピングの語句と生成処理を src/data/typingPrompts.ts へ移動、新規 typingVariety.ts で30段階・5帯。Act／フロア／敵撃破経験から進行し、戦闘開始時に経験を固定して入力途中の急な出題変更を防ぐ。ホームポジションは1キー→最大12キー、語句・文章は徐々に長くする。100語、136文、116英語例、20母音例、480数字記号例を既存に追加。直近24項目を避け、同名／同IDカードが連続しても完了後に次のお題へ更新。長文の敵行動間隔を1文字90ms、追加最大8秒で補正。
- test-typing-progression.mjs：15レッスン×3言語×5帯、反復抑制・進行・ローマ字代替表記を検証。HOME_ROW平均1→11キー、WORDS約4→18文字、SENTENCES約8→69文字。説明 docs/typing-progression.md。
- 検証成功：test-gakuro-golf.mjs／test-golf-server.mjs／test-golf-dedicated-browser.mjs（40クライアント、選択ホール・途中参加・ホスト交代）／新test-golf-peer.mjs（実Peer/WebRTC、ホール権限・途中参加・3打周期）、実ReactゴルフUI7画面サイズ／18番ホール、音源キュー／BGM優先度テスト。
- RPGはtest-rpg-resident-conversations.mjsとtest-rpg-resident-browser.mjs成功。ブラウザは5画面サイズ、本人／住人／システム発言、言葉を教える／会話／贈り物／6お出かけ／NPCイベント／2D・3D復帰を実確認。ソフトウェア3Dにより10分以上かかる。
- 英語UI監査、pnpm run build、最終Vite build、server:build、diff --check成功。全体tscは以前のOOMのため成功扱いにしない。既存の単元UI変更で旧test-gakuro-golf-browser.mjsは利用せず、実Reactゴルフ単独UIテストで準備・問題・ショットを確認。ログ・画像は /workspace/scratch/golf18-*、resident-dialogue-*、typing-final.log。

- 今回の公開確認：GitHub Pages Actions 37416448743、Android AAB Actions 37416448746ともsuccess。公開GakuroGolf-Cqx_LhL5.css（31625 bytes）がローカルと完全一致。公開Golf JS／RpgOnline JS・CSSに18ホール設定／3打周期／話者別吹き出し・案内パネル、公開main JSに追加タイピング語句を確認。ゴルフMP3/Opus16ファイルが全てローカルと完全一致。CIとローカルではJSチャンク名が異なるため、公開indexから実際の参照をたどって検証した。Renderの追加確認はユーザー指定により実施していない。

## 最新追記：異世界の6地域試練・三段階魔王・エンディング（2026-10-06）

- main `9fba2f04aeacaf5da8c2d04f78c2c7e67e5ed510`、34ファイル。6バイオーム各1か所の試験官、全6体で魔王城の結界を解除。試験官は既存の各編イラストを流用し、戦闘名は各地域の試験官名を維持するRPG_EXAMINER型。
- 新オリジナル人型魔王：魔王→真・魔王→スーパー魔王ハイグレードEXスペシャルエディションαオメガMAX。ImageGenで三形態それぞれ待機・攻撃6画像、WebP。RPG_DEMON型で各編共通の人型表示。行動は段階ごとに攻撃／防御／強化／弱体が強くなる。通常攻撃・毒・反撃に対応。共有HP・phaseを3段階に拡張し、過去段階のダメージ拒否、参加者全員の累計ダメージを変身時リセット、ローカル変身が先行した場合は共有段階を待つ。
- 魔王消滅／六地域の平和／街の復興のImageGenエンディング背景3点。6つの手動送りの物語で「学びと仲間が勝利に結びついた→守った暮らしへの帰還→復興を託される→世界運営解放」を演出。既存新BGM魔法女性編victory。操作ボタンはスマホ縦横・PC対応、OSの動き低減設定に対応。
- endingProgressは各プレイヤーごとにworldへ保存。ending-progress actionは1〜6の順番のみ承認。本人がエンディングを終えるまでcity-continueは拒否。既存の戦闘報酬・ランキング待ち条件も維持。最初の人が都市を開いても他の人は自分のエンディングを見られる。
- 都市運営へ移行後は通常敵サイトを除去し、時間制限を解除。同じ保存ワールドで住民・クラフト・農園・都市運営を継続。平和時の町／休憩／イベント利用は戦闘勝利のクールダウンを免除。
- campaignVersion2、Peer protocol20。古い未クリアセーブには不足3地域の試験官を追加し、既存試験官のID／勝利を保持。既存クリア・街運営セーブは実績を保持し、既存街運営でエンディングを突然再生しない。保存形式version1を維持。詳細 docs/rpg/demon-king-campaign.md。
- 検証成功：test-rpg-campaign.mjs（6地域／ボス封鎖／3変身／古い段階拒否／エンディング順序／平和都市／移行／素材）、test-rpg-ending-browser.mjs（6場面を5画面サイズで完走）、test-rpg-demon-main-browser.mjs（実Appの攻撃カードで全3段階の変身と最終勝利、実画像読込）、native-engine／duels／city／world-save／adventure／lifestyle。
- pnpm run build・英語UI監査・server:build・Android素材manifest検証・diff --check成功。Androidハッシュも9つの新WebPを含めて更新。元ImageGen出力は /workspace/generated_images に保持、詳細にファイル名を記載。作業ログ /workspace/scratch/demon-*。

- 追加調整 main `9d0533ee7d02e8d27dd1b56e78be040347a8acc5`：街運営へ進む際に未完の共通戦闘イベントを終了し、以後の共通イベントはANSWERS（知識の灯をともせ）へ固定。通常敵がいない世界で戦闘回数目標が残るのを防止。campaignテストに平和後イベントの確認を追加し、server:build・full build・英語監査成功。
- 魔王キャンペーンの初回公開確認：Pages 37420942627、Android 37420942554ともsuccess。公開JS／CSSに魔王・試験官・エンディング、WebP9点がローカルと完全一致を確認。

- 最終公開確認：main `9d0533ee7d02e8d27dd1b56e78be040347a8acc5`、GitHub Pages Actions 37421439211・Android AAB Actions 37421439186ともsuccess。公開RpgOnline-BzeTZorj.js／CSSと公開mainに試験官・3段階魔王・6場面エンディング・平和後ANSWERSイベントを確認。魔王6点／エンディング3点のWebP9ファイルは全てローカルと完全一致。Renderの手動デプロイ・追加稼働確認はユーザー方針により行っていない。ローカルの追跡変更はなく、本引き継ぎ資料のみ未追跡で保持。


## 最新追記：ゴルフの2度合わせ・スピン・スコア別リアクション／魔王の見切れ修正（2026-10-06）

- main `a05abff97523b69006447b69e20d34bc3e7c3481`、28ファイル。ゴルフはメーター開始後、1回目でパワーを決めても右端まで進み続け、右から戻る2回目で下部インパクトバー中央を狙う。ナイス／グッド／ミス判定をサーバーでも算出。外向き時の余計な2回目タップは無視、戻りを逃すとミスショット。画面タッチ／Space／Enterに対応、中止／Escape／画面非表示／blur／一時停止は送信せず中断。タイミング中はクラブ・方向・打点を固定。問題正解数による最大パワーをMAX表示。
- 打点はボールの上側でトップスピン、下側でバックスピン。飛距離プレビューとサーバーで同じ物理を使用。打ち出し角と初回着地の転がりに反映し、芝・ラフ・砂で減衰。パターは中央固定。shotSpin／shotImpact／shotQualityを参加者へ同期、範囲検証・shotId二重送信拒否を維持。Golf Peer／専用サーバーともprotocol3。18ホールとホスト選択、3問→3ショットの周期は維持。
- カップインは6秒の専用近景カメラ。バーディー以上はジャンプ／両手上げ／ダンス／回転など大きく喜ぶ。パーは控えめなガッツポーズ／うなずき等、ボギー以降は肩を落とす／首振り／顔を覆う／悔しい足踏み。人・ホール・スコアでパターンを選び、打数上限では喜ばない。次ホールへは待たずに進める。説明 docs/golf-shot-meter.md。
- 魔王6画像はアトラス切り出しを廃止。ImageGenで各形態の待機／攻撃を1枚ずつ再生成し、角・翼・剣・光輪・エフェクトまで全体が入る透過WebPへ変換。全6枚に透明余白15〜18%を確認。RPG_DEMONだけ既存人型敵の拡大CSSを無効化し、object-fit:containで表示。他の敵は既存表示を維持。新PNGの出力名は docs/rpg/demon-king-campaign.md に記載、元ファイルは /workspace/generated_images に保持。Android素材ハッシュ更新。
- 検証成功：test-golf-shot-meter.mjs、test-golf-meter-browser.mjs（実タッチ／キーボード、2度合わせ・戻り・中止・blur・一時停止・ミス）、test-golf-shot-browser.mjs（実React、タイトル／集合／ショットの7画面サイズ、問題・2タイミング入力、18番ホール、パー／バーディー／ボギー／ダブルボギー別3Dリアクション、上限非演出、BGM維持）、既存engine／40人専用サーバー／40人ブラウザ接続／Peer。サーバーテストでスピン・インパクト・算出グレードの同期を追加確認。
- RPGのcampaignテスト、実Appで魔王3段階の変身・勝利を再確認。実Appテストは3形態それぞれ390×844／844×390／1440×1000で拡大なし・containを検証。テストサーバーのHMRを無効化し、buildの素材manifest生成と競合しないよう調整。
- 英語UI監査、最終pnpm run build、server:build、Android素材manifest検証（10288ファイル）、diff --check成功。最終Web buildのゴルフチャンクにもMAX表示を確認。全体tscはOOMの既知理由により成功扱いにしない。

- 公開確認完了：main `a05abff97523b69006447b69e20d34bc3e7c3481`、Pages Actions `37439622249`・Android AAB Actions `37439622408`ともsuccess。公開indexから実際の `GakuroGolf-CV8wLTgV.js`／CSSをたどり、2度合わせ・スピン・グレード・スコア別リアクションを確認。公開main CSSに魔王の拡大抑制を確認。魔王のWebP6枚は全てローカルと完全一致。Renderの追加確認・手動デプロイは行っていない。ローカルmainはAPI公開後の同一treeのSHAへ同期済み。追跡変更はなく、引き継ぎ資料のみ未追跡で保持。


## 2026-10-06 追記：RPG・レース・ゴルフの絵本調3D

- ユーザーの明示目標「絵本のような温かさのある、統一されたファンタジー調の3D。Three.jsはゲーム内描画、Blenderはモデル・アニメーション制作」を実装。main `cdb5c51dc88b213f0b817a78ca325887341bbd71`、28ファイル。
- Blender 4.3.2を使用しオリジナルモデル19種を制作。`assets/storybook/storybook.blend`に編集用ギャラリー、`scripts/blender/build-storybook.py`に再生成スクリプト。GLBは`public/models/storybook/storybook-v1.glb`（960552 bytes、約938 KiB）。風車の回転、蝶の羽ばたきに実際のBlenderアニメーションクリップを付与。各ゲームでアニメーションを再生する。
- 共通描画`src/three/storybookModels.ts`はGLTFLoader、素材別InstancedMesh、AnimationMixer、非同期読み込み中の退出・リソース破棄、読み込み失敗時の既存景観への代替を担当。`storybookStyle.ts`は共通色調、地形の柔らかな色むら、水面の光、雲・丘・花粉、高画質の影を担当。
- RPGは既存の3D切り替えを強化。バイオーム・季節に応じる木、家、塔、岩、花、都市の風車、蝶を導入。NPC・プレイヤーの立ち絵と農場アイテムを維持。建物・資源のタイル選択情報を維持。移動・戦闘・採取ルールには変更なし。
- GPは既存・自作コースの実際の曲線に沿って木・花・家・灯り・風車を配置。浮遊コース脇は丸い草地の島で景観を支える。路面・判定・問題ストレートは既存のまま。色調を柔らかなファンタジー景観に調整。
- ゴルフは18ホールで共通景観をロード。クラブハウス、風車、木々、花、蝶、柔らかな水面を追加。物理・メーター・スピン・反応カメラは維持。
- GP／ゴルフには画質：自動／高画質／軽量のボタン（日本語・英語・ひらがな）を追加し共通localStorageへ保存。RPGは既存専用設定のmapQualityを利用。自動は狭い画面・タッチ端末で軽量にし、軽量では影無効・ピクセル比1・遠景の木を削減。装飾アニメーションは動きを減らす設定に対応。
- Web／Androidの素材manifestにGLBを追加、assetUrlでキャッシュの版を管理。Androidの基本映像パックに含む。公開GLBは外部画像・バッファ依存なし。
- 検証：`test-storybook-assets.mjs`（19モデル・床位置・容量・アニメーションの実際の変化）、`test-storybook-browser.mjs`（高画質シェーダーと影、風車の実動作、読み込み中破棄、失敗代替、全18ホール）、`test-rpg-world3d-browser.mjs`（モデル読み込み・アニメーション数・縦横PC・移動旋回・農場隣接アクション）、`test-kart-camera-browser.mjs`（モデル・アニメーション・坂道カメラの路面クリアランス・PC／スマホ）、`test-golf-shot-browser.mjs`（実React、7画面サイズ、問題・2度合わせ・18番・BGM・スコア別反応）成功。
- ソフトウェアWebGLのスクリーンショットでGPU待ちタイムアウトが発生したため、レースのテストは撮影時だけ描画更新を止めて安定化。ゲームの描画頻度は変更していない。ゴルフのテストは軽量設定で7サイズを検証し、高画質描画は専用テストで確認。実機のFPS保証はしていない。既存RpgOnlineのReact key警告はこの変更の対象外。
- 英語UI監査を含むpnpm run build、最終vite build、server:build、Android素材manifest検証、diff --check成功。手順は`docs/storybook-3d.md`。全体tscの成功とは扱わない。

- 公開確認完了：Pages Actions `37532470628`・Android AAB Actions `37532470626`ともsuccess。公開index `index-B35_eZOT.js`から実際の`storybookModels-BUzVQL3j.js`、`GakuroGolf-Bb24GiKn.js`、`GakuroKart-CW344Zry.js`、`WorldScene3D-CbvpXqg5.js`を追跡し、新描画を確認。公開GLB 960552 bytesはローカルと完全一致（SHA-256 `4a134e80a66a71244f714137b405709ea6ff894657cf86f48abe4685e1a56170`）、catalogも19モデルを確認。
- ローカルmainと公開mainは同一SHA・同一treeに同期済み。追跡差分なし、引き継ぎ資料のみ未追跡で保持。Renderの追加確認・手動デプロイは行っていない。


## 2026-10-06 追記：レース・ゴルフの絵本調キャラクター

- ユーザーの「レース、ゴルフのキャラクターモデルも同様に改善して」を実装。main `e5147941436b1879e1859f58cef41881c1181a67`、16ファイル。
- オリジナルのBlenderキャラクター部品12種（頭・セーター・袖・ミトン・髪・耳・靴・ズボン・ロボット頭・襟）を制作。`assets/storybook/characters.blend`、`scripts/blender/build-storybook-characters.py`、`public/models/storybook/characters-v1.glb`（101296 bytes、約99 KiB）、`characters-catalog.json`。既存19景観モデルとは別ファイル。
- `src/three/storybookCharacters.ts`で一度だけGLBを読み込み、原点・規格サイズへ正規化した形状を既存の共有BufferGeometryへ差し替える。差し替え前にGPUバッファを破棄し、MeshやInstancedMeshのIDとカスタマイズを維持。破棄済み形状には後着のロード結果を適用しない。読み込み失敗時は代替形状でプレイを継続。
- `avatarModels.ts`／`hairModels.ts`へBlender部品、襟やトリム、柔らかな肌・服の質感を追加。8種族・12髪型・4アクセサリー・8表情、肌／服／髪の色、8シャシーを維持。ロボットでは丸い人間頭を隠し、角の丸い専用頭で顔の貫通を防止。
- GPでは40人のInstancedMesh共有を維持。首を支点にした軽い姿勢変化、ハンドル入力に応じる手の動き、瞬きを追加。動きを減らす設定では首の待機揺れと瞬きを停止。運転入力に応じる動きは残す。
- ゴルフは同じ頭・服・髪に丸い靴／ズボンを追加し、両腕を別々の肩支点で回す。既存のスイング・クラブ位置・スコア別反応を維持。アンダーパーは大笑い、パーは笑顔、ボギー以降は落胆する表情へ一時変更し、その後に選択していた表情を復元。メーター・スピン・物理・ネットワークの規則は変更なし。
- 専用ブラウザテスト `scripts/test-storybook-characters-browser.mjs`：Blender形状読み込み、384組み合わせ、表情変更／復元、肩支点、読み込み中破棄、代替表示、描画成功。確認画像は`/workspace/scratch/storybook-character-lineup.png`。
- 既存 `test-kart-avatar-browser.mjs`：全種族・髪型・シャシー、PC／スマホの編集・保存・集合画面、40 Peerのアバター同期・人数上限・レース中ロック・再戦成功。`test-kart-camera-browser.mjs`：新形状の実際の走行描画、坂道の路面クリアランス、PC／スマホ成功。`test-golf-shot-browser.mjs`：7サイズ・出題・2度合わせ・18番・BGM・スコア別リアクション成功。
- 英語UI監査を含むpnpm run build、最終vite build、server:build、Android素材manifest検証（10290ファイル）、diff --check成功。Androidの基本映像パックにGLBを追加。骨アニメーションをBlenderから読み込む方式ではなく、Blender形状を既存のThree.js関節／インスタンス制御へ組み込む方式。

- Web公開確認：Pages Actions `37535941458` success。公開index `index-DwL449kc.js`、共有モデル読込部 `AvatarCreator-CrTm7QjN.js`、`GakuroGolf-DJ3K6bWv.js`、`GakuroKart-B9mY8rbC.js`を追跡し、新キャラクター描画を確認。公開GLB 101296 bytesはローカルと完全一致（SHA-256 `d8d327128fdfc30fcf1bfa33fde96bcd3406bbc1e211a07b2811a0bb8fecb6af`）、catalogも12部品を確認。

- Androidも公開確認完了：Actions `37535941565` success。ローカルmainと公開mainは同一SHA `e5147941436b1879e1859f58cef41881c1181a67`・同一treeへ同期。追跡差分なし、引き継ぎ資料のみ未追跡で保持。Renderの追加確認・手動デプロイは行っていない。

## 2026-10-06 追記：RPGの3Dブロック採掘・建築と連続移動

- ユーザーの「threejs、blenderを用いてマイクラ風のビルド」「3D移動を2Dのマスに縛らない」「ブロック型素材を壊して収集」を実装。main `80a630f40ab9b3afd278755660fa3c215bb0045c`、21ファイル。通常のgit pushを利用できないため既存のGitHub APIアップロードを使用し、公開treeとテストしたローカルtreeの完全一致を確認してからmainを更新。ローカルも同一SHA・treeへ同期。
- `src/rpg/voxel.ts`：ホスト／サーバーが検証する連続移動、採掘、設置。`Adventurer.position3D`は小数のx/z、整数のx/yは常に対応するマス。2D切替で小数位置を解除して同じマス中央へ戻す。実時間の速度制限、有限値／範囲検証、半径0.18の四隅衝突、斜め移動と壁沿い移動。`worldViewMath.ts`でカメラ角度に対する任意方向移動、スワイプ角度による向き変更、3Dスティックのアナログ入力、長押しWASDとタッチの定期入力。
- `World.voxels`の疎な編集記録は既存の保存・再開・Peer・専用サーバー配信に含まれる。Peerプロトコル21。既存セーブにはoptionalフィールドを追加するだけで互換性を保つ。
- 木材・石材・木の板・レンガ・霜木・鉄鉱石・魔晶石の7素材。自然資源は岩1段／木材3段の立方体で表示。壊すと採取エネルギー1消費し素材1取得、置くと既存bagから素材1消費。自然柱を完全採掘すると2Dの対応する資源も消える。設置物を壊すと素材を回収できる。エネルギー回復は既存の学習問題を利用。
- 保護対象：外周、水面、NPC／イベント／既存住宅の周囲、農場、市街地。到達距離4.5、操作間隔220ms、8段、編集6,000セルの上限。空中の設置は隣接支持必須、プレイヤーの占有セルを塞ぐ設置は拒否。地面自体は掘り抜かず、ブロック重力は未導入。上限まで積むための飛行／ジャンプや垂直移動は今回の範囲に含まない。2Dでは設置した最上段を描画し、地上0～1段の衝突を3Dと共有。
- `scripts/blender/build-voxel-block.py`で継ぎ目を避ける正確な単位立方体を作成。`assets/storybook/voxel-block.blend`、`public/models/storybook/voxel-block.glb`（約1.8 KiB）。Three.jsでGLB形状へ更新し、失敗時は同寸法のBoxGeometryを保持。7素材ごとのInstancedMesh、16px模様、照準と選択枠、建築素材選択、壊す／置くボタン、上下スワイプで見上げるUI。既存Blender景観とNPCビルボードを維持。
- 3Dでも住宅へ重なると従来どおり自動入室。入退室で古い小数位置を解除し、退出後のカメラ位置を保つ。
- 新規 `scripts/test-rpg-voxel.mjs`：連続位置／角度／2D整合、採掘、素材計算、エネルギー、支持付き積み上げ、衝突、保護対象、観戦者拒否、保存／再開、住宅への入退室。`scripts/test-rpg-voxel-server.mjs`：実際の専用サーバーと2 WebSocket参加者で位置・建築／採掘・素材・エネルギー・2D復帰の共有と遠隔編集拒否。どちらも成功。
- `scripts/test-rpg-world3d-browser.mjs`を拡張し、実際の照準で採掘と積み上げに成功。390×844／844×390／1440×900で建築UIと移動・2D切替、隣接する農場／家畜／ペットアクション、横画面メニューのスクロール成功。既存のReact key警告は残るがpageerrorなし。
- 既存RPG native／activities／duelsの回帰テスト、英語gateを含むpnpm run build、最終vite build、server:build、Android素材manifest生成／検証（10291ファイル）、diff --check成功。説明はmain内の`docs/rpg/voxel-building.md`。
- 公開確認完了：Pages `37541717427`、Android `37541717556` はともにsuccess。ユーザーの方針どおりRenderの追加確認／手動デプロイは行わない。


## 2026-10-06 追記：3D地形・地下採掘・4枠スロット・右視点スティック

- main `2ebce905b7dc9a3afd4715382424253d1ea30b5d`、22ファイル。GitHub APIでテストしたtreeと完全一致を確認して公開し、ローカルmainも同期。
- 3D中は右下に壊す／置く、設定可能な4枠ホットバー、エネルギーと高さを常設。スロット素材設定はlocalStorage。右視点スティックはアナログのyaw/pitch入力を40msで継続し、カメラはなめらかに追従。独立pointer captureで左移動との2本指操作に対応。左右スティック／十字キーの組み合わせを維持。5サイズの縦横PC表示で操作部が見切れないことを確認。小さい横画面の2D/3D切替ボタンも右上へ移動。
- 正確な1m比率のBlender立方体を維持し、目線1.62mと他プレイヤー1.8mの比率へ調整。各バイオームに種由来の段階的な丘／山、道路・保護地点近くには登れる傾斜。1段は自動登り、2段の壁は通過不可。足の高さをposition3D.yとして保存・配信。2D復帰時は同じマス、入れない場合は最寄りの安全なマスへ。
- 地面を-18の岩盤まで掘れる。地下洞窟、6つのオアシス、水面と砂床、きのこ、深層の鋼材を追加。地下では携帯灯とオアシス灯が点灯。露出面だけをInstancedMeshで描画。上限18段、疎な編集18,000セル。既存の編集済み柱はlegacyFlatで旧高さを維持。
- 土／砂／雪／鋼材で11ブロック素材。通常採掘・設置0.1エネルギー、石0.3、レンガ0.2、鉄鉱石0.6、魔晶石0.8、鋼材1.2。小数エネルギーは百分位まで保持。石／鉄／鋼のツルハシはクラフト時自動装備、硬材の消費を25/50/70%軽減（最低0.1）。3種のオリジナルSVGアイコン。既存の問題で回復。Peerプロトコル22。
- 単体検証：6バイオームの高低差、地下水と空間、鋼材、実際のツルハシ製作、節約率、1段登り、壁を貫通しない下降、足元採掘による落下、保存／復元、家の出入り、保護／観戦者拒否、2D整合が成功。
- 実サーバーの2 WebSocket参加者：小数位置・地面の掘削・設置・素材・小数エネルギー・遠隔拒否・2D復帰の同期成功。ブラウザ：実照準で採掘と設置、実2本指の左右同時入力、390x844/320x568/844x390/568x320/1440x900、地下描画、既存農場アクションと横画面メニューが成功。既存React key警告のみ残る。
- pnpm run build（英語gate含む）、server:build、Android manifest生成／検証10294ファイル、diff --check成功。公開用CSSにも最終横画面配置の変更が含まれることを確認。
- 公開確認完了：Pages `37547078114`、Android `37547078092` はともにsuccess。ユーザーの希望に従いRenderの手動デプロイ／追加確認は行わない。


## 2026-10-07: latest main integration, vegetation and home/farm building

- User supplied additional local commits; fetched and fast-forwarded main to `c031447b` before continuing. Preserve the updated human avatar GLBs, kart/golf editor scrolling, and BowlingSwipeControl filename fix.
- Implemented leaves, snowy leaves, fruit, shrubs, reeds, herbs and cactus as independent natural harvested/placeable voxels. Nineteen hotbar materials now include a crafted two-cell door. Protocol 24.
- Exhausted break/place or insufficient mining cost opens learning recovery questions. Removed decorative butterflies and the false ground plane covering excavations.
- Roof/floor/wall enclosed door rooms (4–256 cells) register as private homes or shared facilities. Furniture and existing game furniture crafting/placement/packing and games work via authoritative room actions; ownership, damaged enclosures, overlaps and coordinates are checked.
- Pets are home-only, care/adoption in home menu, freely roam inside normal and built homes; legacy pet records are retained. A room with pets cannot switch to shared mode.
- Crafted hoe unlocks a gathering shortcut to till the single cell ahead for one energy. Only actual tilled cells are farmland; legacy planted cells migrate with crops intact. Camera facing in 3D and last travel direction in 2D select the cell.
- Validated building-life authority/save tests (including actual furniture game join/start/leave), farm/lifestyle regressions, vegetation voxel tests, two real WebSocket clients, responsive room and tilling UI, exhausted break/place and real learning recovery, English gate, frontend/server build and Android asset manifests. Final publication/Actions details follow.
- User only requires GitHub publication verification; do not manually deploy or check Render. This handoff stays on its dedicated documentation branch and is excluded from main.

### Publication and latest user steering

- Main published as `72850abbfc4c637d7511864cf53feb103ca1c476`; fetched and verified exact tested local tree equality. GitHub Actions: Pages `37562749251`, Android `37562749285`. User explicitly confirmed build verification complete; do not keep waiting or recheck deployment on their behalf.
- 3D browser integration passed on five sizes including continuous dual-stick movement, actual mining/placing, underground oasis, outdoor farm/animal actions and no outdoor pet buttons. Local frontend and server builds, English gate and Android manifest verification passed.
- User asked whether games can use host-driven networking for about ten players instead of Render. No implementation change was requested yet. All four network classes already retain PeerJS/WebRTC host code, while the deployed builds choose dedicated servers because `VITE_ONLINE_SERVER_URL` is configured in Pages/Android workflows. Explain signaling/STUN and possible TURN relay, host upload/CPU/battery and background throttling; recommend a room-level host/server choice, compact updates and host handover if asked to implement. Do not simply remove the URL globally without a room transport/join design.


## 2026-10-07: online transport and release entry
- RPG / kart / golf room creation chooses host WebRTC (default) or server beta; server cold start retries for 3 minutes. Tagged H-/S- codes preserve transport.
- Latest release instruction supersedes public visible entries: exactly three title-logo taps reveal the three games, independent of debug. Invitations remain direct. Standalone Craft removed; RPG reused mini-games retained.
- Golf dedicated responsive title, keyboard aim/spin/Enter, right Shot start, no cancel button, impact arrow, corrected overview orientation. Seven title/lobby/shot viewport checks passed.
- Town arcade no questions; six ImageGen town-service WebP images added.
- Verification: production three-tap browser plus real PeerJS two-player join, shared cold-start retry/cancel, 40 server connections/movement/disconnect, arcade, meter, English gate, Android asset manifest, frontend/server builds. Main publication commit recorded below once completed.

Published main: 454cb3514b7bf4b527a8966c5f1b68cf6bca20a7; uploaded tree matched tested tree. Frontend and server builds passed.

## 2026-10-07: course scenery and upload verification preference
User now explicitly says not to wait for post-commit completion checks. Do local required tests/builds, upload main, and report without waiting for GitHub Actions completion.
Kart: eight course sky/fog/road/rail/material palettes now applied; urban courses retain buildings instead of hiding them when imported models load. Neon cyber signs/lights, solar panels/stacks, library reading arcades, stadium floodlights/banners; natural garden/forest/harbor and snowy aurora retain themed imported scenery. Configuration: src/mini-games/gakuro-kart/scenery.ts. Eight WebGL scene captures plus course/minimap checks, English gate, frontend/server builds passed. Published main: 02e0a45e6089fd4bb00d1ce7de4f6cd36cf70ab7.

## 2026-10-07 オンライン招待動線
- 最新 main 56d7ad22 の帰宅ダッシュ待機機能等を取り込んだ上で、4dc703f4035a87d4d18098bb0918bd0fec640713 を main に公開。
- RPG・レース・ゴルフの招待URLは最初に参加名と参加ボタンのみ。ゴルフのホスト待機画面に招待URLとコピーを追加。通信方式の H-/S- 接頭辞を保持し、別ゲームやデバッグのURLパラメーターを除去。
- 参加後、RPGは編と主人公を選択・待機中に再選択可。レースとゴルフは3Dプレビュー付きアバター編集。待機中の帰宅ダッシュ一発アウトを維持し、ホスト開始で終了。初回プロフィール等の案内は招待終了後に延期。
- 実Appブラウザで3ゲームの名前入力・参加・キャラ編集・HP1ダッシュ・ホスト開始を確認。ゴルフのホストURLコピーとデスクトップ配置、通信/URL単体、英語監査、frontend/server build 合格。
- コミット後の Actions や Render 完了待ちはユーザー指示により省略。前依頼の Render 再デプロイ dep-db2sclm7bikc73aqshfg は開始のみ報告済み、今回の作業では手動再デプロイせず。

## 2026-10-07 レース・ゴルフの出題重複修正
- main b9cf06e317ef44f9f4434f795cfd95aa899f7677。レースは選択単元から15問を用意し各周3問ずつ。表示・CPU判断・採点・効果音を周回に対応。旧3問データも互換維持。
- ゴルフは参加者別の出題履歴をホールをまたいで維持。ホスト・サーバー双方対応。問題ソースの重複を統合し、使用可能問題を使い切った時のみ再出題。
- 新出題テスト（5周15問、ゴルフ12回36問、2周目採点、個別履歴、独自問題の重複排除・枯渇時循環）、既存レース学習・ゴルフサーバーテスト、英語ゲート、frontend/server build 合格。アップロード後のActions/Render完了待ちなし。

## 2026-10-07 Render 自動デプロイ対象の絞り込み（実サービス未適用）
- main 517db88346b9571dfe0542ab26d0e822e6db0b8f。render.yaml に buildFilter.paths を追加。オンライン3ゲーム・再利用クラフト・実際にサーバーへコンパイルされる共通データ/ロジック・依存パッケージのみ対象。一般UI/画像/音楽/文書は対象外。checksPass 維持。
- server/build.mjs と Pages CI に依存ファイル包含検査。新しい対象外依存をサーバーに追加すると検査失敗。公式Blueprint JSONSchema、実サーバー依存包含、除外例、未包含依存の失敗検査、英語ゲート/frontend/server build 合格。
- 重要: Render MCP に既存サービス Build Filters 更新ツールなし、Render CLI/API認証も未設定。既存 learning-rogue-online のライブフィルターにはまだ適用していない。ユーザーへDashboard settings の Build Filters / Included Paths に render.yaml paths を一度登録する手順を提示。Blueprint管理サービスへの同期でも可。ファイル公開だけで現サービスに適用済みと主張しない。サービス srv-dauu1v41nsns73fnjdk0、承認済み My Workspace tea-d75h6r6a2pns73cualng。

## 2026-10-08 サーバー通信の可否判定
- ユーザーはRender Build FiltersのIncluded Paths保存を完了したと報告。前項の「未適用」はユーザー作業で解消（追加の実サービス設定検査は未実施）。最新main 42440fbd の音声変更等を統合した上で main 28ae9854ced46ba134b2bd00690427123493fea7 を公開。
- 3ゲーム共通TransportPicker: ブラウザから各endpointへWebSocket ping/pong（既存サーバー機能）で到達性を確認。確認中/接続不可はサーバー選択無効＋灰色。不可時はホストへ戻し、再確認ボタン・自動復旧を用意。接続不可5秒/成功30秒再確認、focus/online/offlineで再確認。health fetchは起動促進のみで、成功判定に使わない。unmountで通信とtimer解除。
- 実サーバーを使うブラウザテストでRPG/kart/golf到達、Origin拒否、停止/ネットワーク切断、ホスト維持/フォールバック、復旧、部屋作成なしを検証。英語ゲート、frontend/server build合格。サーバーソース変更なし。Actions/Render完了待ちなし。

## 2026-10-08 参加画面とリザルトの整理
- main df60762d1929b789db10c0d5f8a5364d2ca24d2b。レース/ゴルフの参加者一覧左に常時自キャラプレビュー、編集結果を即反映。帰宅ダッシュHP1はportalによる全画面flex表示、閉じる操作付き。
- 両ゲームのリザルトを2カラム化、ランキング/設定を内部スクロール、次の開始・退出を固定表示。ゴルフは同じ部屋で次ラウンドへ、参加者/アバター/問題履歴を保持しスコアをリセット。ホストが次のホール数を選択可能。
- 390x844/844x390/1366x768でプレビュー編集反映、ダッシュとリザルト/次のボタン配置をブラウザ検証（WebGL表示のみモック）。ゴルフ再戦エンジン/既存サーバーテスト、英語ゲート、frontend/server build合格。今回server/golfRooms.ts変更あり、Render自動デプロイ対象。Actions/Render完了待ちは不要。

## 2026-10-08: Offline School Wanderer expansion

Main: 9d1bf1706755065991bb34245e78a2109414c30b. Both SchoolDungeonRPG variants now share school-dungeon adventure rules: equipment emblems, sealed/blessed supplies, containers, 6 special enemy behaviors, terrain/excavation, recoverable traps, shop bills/monitors, floor bells, persistent warehouse/bank, three classmates, facilities/story progress, rescue requests and eight challenge rules (including 99 floors and eight puzzles). ImageGen generated two transparent 16-sprite sheets, converted to lossless WebP and integrated for Web/Android with measured bounds to avoid clipping. See docs/school-wanderer-adventure.md.

Validation: pure rules tests, browser integration on both real components at portrait/landscape/desktop sizes, atlas alpha checks, old-save migration, reload/escrow recovery, frontend English gates/build and server build passed. Published main without waiting for deployments, as requested. Handoff file remains exclusive to its documentation branch. Render repository config requests every main commit; live dashboard settings were previously left for user adjustment.

## 2026-10-08: School Wanderer journey villages and 50-stage dojo

Published main: 9703e4c54f37c24161f5b9090256d975e3e4a7cf. Includes upstream c910c8af (regenerated vacation enemy audio), with refreshed Web/Android asset manifests. Both offline games now support four companions with eight directions and two walking frames (64 active frames), safe shortest-path following, corner/water/hole avoidance, facing support attacks and HP strips. ImageGen generated companion/extra character and item sheets plus six scenic backgrounds, converted to WebP.

Story floors 5/10/15 are safe villages (inn, smith, supply shop, mail/bank, festival); 6/11/16/18 are walkable cherry/bamboo/autumn/snow scenic routes. Town hunger/bell pause; facilities require adjacent positions; fees/funds/capacity and one-time services are checked. Weather rain wets paper, rain badge protects, inn/repair dries; wind moves loose supplies; fog/night reduces vision and night boosts umbrella ghosts. Eight explorer supplies, four enemy behaviors, three equipment resonance sets, codex/diary/certificate rewards were added. Food recovery passes an override into the original turn processors to prevent being overwritten.

The starting base has a 50-stage School Wanderer dojo: ten subjects, five spatial variants, limited turns/HP/food/tools, sleep/rays/water/traps/keys/digging, hints, retry, next stage and per-game persistent best-turn records. Dojo does not change expedition items or rescue state. Mobile explanations collapse and the board/actions fit portrait; keyboard focus is supported. See docs/school-wanderer-adventure.md.

Validation: pure adventure tests, all fifty legal dojo clear sequences plus negative cases, both actual React game components in Playwright, portrait/landscape/desktop bounds and visual inspection, all 64 companion frames/16 expansion sprites/32 original sprites, town/scenery/weather/repair/picnic/save migration/escrow, Android manifest verifier, English gates, frontend build and server build passed. No deployment completion wait, per user request.

## 2026-10-08 Native dojo layout and GB progression
Main 494f202dca5c73a57222b3bb216368a77149b0e5. Both offline School Wanderer games now run all 50 dojo lessons in their existing canvas/stat/log/D-pad/A/B/R layout; only selection, hints, tools and results use the adventure dialog. Temporary dojo state stays separate from expedition/player/inventory/map/food and saved progress; normal cards and fast-forward are blocked during lessons. All 50 rules remain playable.
Starting base and notebook use a GB-style palette, square pixel-like frames/buttons and monochrome images. Dungeon unlocks are enforced in UI and start logic: story initially; 5 dojo clears unlock puzzles, 15 unlock traps, story clear unlocks mystery/cards/traps/puzzles, mystery/cards clear unlocks no-gear, no-gear clear unlocks 99 floors. Existing mode clear records stay unlocked and legacy ongoing saves remain playable; rescue requires an active request. Special enemies begin at floor 4, add types at floors 7/11/16, and expansion enemies begin at floor 8. Floor generation/load relocates wall/unreachable/overlapping actors/items/traps/events. Native A and stepping activate facilities; restorative food is passed through turn processing to avoid being overwritten. Hidden locker walls are markings, with A invoking pickaxe or showing instructions.
Validation: all 50 pure clears and negative cases, pure unlock/adventure checks, Playwright on both real components including exact same canvas geometry at portrait/landscape/desktop, paused-menu input, dojo isolation, placement repair and native A/movement facility recovery; English gate/frontend/server build and git diff --check passed. Main uploaded without waiting for deployment completion.

## 2026-10-08 Map presentation consistency review
Main bdc3dd0316100f6f89be6adf9d6ef9c052df6b46. Both School Wanderer games applied the original dungeon start to the player before replacing the map with a journey scene, leaving the hero outside the scenic viewport/in a wall. prepareFloor now reapplies final px/py and clears offsets; legacy wall positions are repaired to a nearby floor. Floor transitions discard old visual effects/shake and use a short, low-opacity flash. Scenic river/bridge/blocking cells/stairs now render according to world coordinates, with seasonal palette and the existing ImageGen background retained. Picnic uses the expansion mat sprite. Safe-scene turn budgets/bells stay paused. Wind movement avoids overlaps with events, player, enemies and traps. No new ImageGen assets were needed.
Tests cover real generation of town and all four scenic maps on both components, exact spawn coordinates, persistent nonblank canvas after fades, paused town counters, blocked wind drift, existing placement/controls/dojo/save cases. Existing pure adventure/50 dojo tests, English gates, frontend/server builds and diff check passed; no deployment completion wait.


## 2026-10-08 Online lesson progress and VR/golf entry
Main 631268b58e28420276738cd5c8ed32649ed91ae9. Fast-forward integrated user main e7590593 (new GAKURO VR) first. VR/kart/golf now use shared OnlineLessonPicker, a body portal containing the actual main ModeSelectionScreen with saved mode correct counts, 100-answer mastery markers, saved theme, problem-set preference, assigned lessons and inbox. Game-specific styles cannot override the main selector. VR title is three actions only; host and join fields appear separately. Golf entry is a compact name/hole-count/transport setup; character creation is available after entering solo or a room and during play. VR creator is a full-screen responsive dialog with live preview. Avatar changes replicate to peers and preserve run state; solo pauses while editing and updates only the character model. Golf accepts validated cosmetic avatar updates after start and suppresses shot/aim keys while editing.
Validation: browser compares main and all three selectors’ actual counts/styles/progress, tests portrait/landscape/desktop layout and VR post-entry creator; real two-peer VR join/start/movement/refill/avatar replication; solo success/failure quiz and avatar change preserving time; golf engine simulation; English gate, frontend build, server build and diff check passed. Updated older selector/entry tests for the new UI. No Actions/Render completion check or waiting, per user preference. Handoff remains only on its documentation branch.


## 2026-10-08 VR 3D title and responsive mission/character setup
Main 39259af1cd5e842f6b7b60914b35873fce9c6a99. VR title now renders the actual selected mission’s Three.js/Blender school scene, with a gentle camera motion (static for reduced-motion preference). Solo stage selection also previews the selected stage. On phones, the mission list scrolls independently while difficulty, expandable mission hints and Start remain accessible. Portrait places a compact stage view above the list; landscape uses side-by-side view/list. Character creation fixes the 3D preview and Done button while options scroll: top preview in portrait and left preview in landscape. Dedicated portrait camera shows the full character larger; preview redraws after resizing and edits without rebuilding its scene. Scene cleanup cancels preview animation and disposes models/renderers.
Validation: real WebGL browser test at 320x568, 390x844, 568x320, 844x390 and 1280x800 checks 3D title/stage canvases, tenth mission selection with Start always in bounds, character preview/Done visibility during scrolling, saved hair edits and training launch. Screenshots visually reviewed. English UI gate, frontend build, server build and diff check passed. Main uploaded without checking/waiting for Actions or Render completion; documentation remains on its own branch.

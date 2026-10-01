# Render無料版・専用サーバー導入

RPG・カート・クラフト・ゴルフを専用サーバーで処理する。
Renderは専用ブランチrender-online-serverから公開する。mainのGitHub Pages・Androidビルドにも同じ接続先を設定する。

## Render Web Service

GitHubへ専用ブランチをアップロード後、そのブランチを選択して作成する。
mainは更新不要。render.yamlによるBlueprintでも同じ設定を使える。

| 設定 | 値 |
| --- | --- |
| Runtime | Node |
| Region | Singapore |
| Instance | Free |
| Build Command | corepack enable && pnpm install --frozen-lockfile && pnpm run server:build |
| Start Command | node server/dist/index.mjs |
| Health Check Path | /health |
| Auto Deploy | Off |
| NODE_VERSION | 22.16.0 |
| ALLOWED_ORIGINS | ゲームを開くURLのoriginをカンマ区切りで指定 |

ALLOWED_ORIGINS例: https://yiictsc.github.io,http://127.0.0.1:5173,http://localhost:5173
URLのパスと末尾のスラッシュは含めない。Render本番では必ず指定する。

## ゲーム側

ローカルの.env.localに以下を追加し、Viteを再起動する。

```dotenv
VITE_ONLINE_SERVER_URL=https://作成したサービス名.onrender.com
```

未設定なら既存PeerJSを使用する。サーバー用部屋とPeerJS部屋は互いに参加できないため、全員が同じ設定のゲームを使う。
公開ゲームにも設定を含めるには、フロントのビルドと公開が別途必要。

## 確認

```text
pnpm run server:build
pnpm run test:server
pnpm run server:start
```

ローカル検証はVITE_ONLINE_SERVER_URL=http://127.0.0.1:10000。
40接続テストは接続数と処理の確認であり、実機40台の快適さを保証する負荷試験ではない。
学校では30台で操作遅延と端末FPSを確認する。

無料版は待機中に休止する。初回接続のタイムアウトは90秒。
部屋はメモリ内に保持するためサービス再起動で消える。接続切断時は入り直しが必要。
同時4部屋・各40人に制限。クラフトの島は5秒ごとにホスト端末へバックアップする。再開時は端末の保存をサーバーへ復元する。サービス再起動後は新しい部屋を作成して再開する。外部ストレージへの永続保存は未導入。

## 公開済みサービス（2026-10-01）

URL: https://learning-rogue-online.onrender.com
Dashboard: https://dashboard.render.com/web/srv-dauu1v41nsns73fnjdk0
Free / Singapore / Auto Deploy Off。ヘルスチェック200、ブラウザ作成・参加・移動、40接続の状態配信を確認。
ローカル.env.localを設定済み。GitHub Pages・Androidのワークフローに接続先を設定済み。カート・クラフト・ゴルフの40人接続とホスト引き継ぎを検証する。

## カートとクラフトの通信

- /kart: 60Hzシミュレーション、10Hzバイナリ状態配信。問題・アバター・周回数・別コース再戦はホストの操作をサーバーで検証。
- /craft: サーバーで移動・建築・学習問題を処理。地形は変更差分、参加者ごとの所持品と家の状態は本人へ配信。
- 各部屋最大40人。退出時はホスト操作権を残る参加者へ引き継ぐ。
- 通信切断後は入り直す。ひとりで練習は従来どおり端末内で実行。
- scripts/test-mini-dedicated.mjsで40人ずつの接続、満員拒否、学習判定、島再開、ホスト引き継ぎ、非表示でも進行することを確認。

## ゴルフの通信

- /golf: サーバーで問題生成・採点・30Hz物理演算、5Hz状態配信。回答やショットの結果は操作した本人へ即時通知する。
- 他の参加者の未回答問題や正答は配信しない。40人同時入力時の全員への重複配信を抑える。
- ホスト退出時は操作権を引き継ぎ、物理演算を続ける。最大40人・4部屋。
- pnpm run test:golf:dedicated は TEST_ONLINE_SERVER_URL を指定すると公開Renderへ40人接続して検証する。
- AndroidのOrigin https://localhost、http://localhost、capacitor://localhost も許可する。

## ホスト観戦

- RPG・カート・ゴルフは、部屋を作った後、開始前に「観戦モードにする」を選ぶ。開始後は参加／観戦の役割を固定する。カートは結果画面で次のレースの役割を変更できる。
- クラフトは島の操作ボタンからいつでも観戦へ切り替え、「プレイに戻る」で復帰できる。観戦へ切り替えると移動・作業・釣り・家のゲームへの参加を終了する。
- 参加中のプレイヤーを8秒ごとにランダムで追い、複数人いる間は直前と同じ人を続けて選ばない。「次のプレイヤー」でも切り替えられる。CPUと退出者は対象外。対象がいない間は待機する。
- ホストは開始・再戦・招待の操作を保持し、ゲーム内操作・学習回答・順位・終了待ちの対象から外れる。参加人数の上限40接続には観戦ホストも含まれる。
- ゴルフは観戦中のホストに限り、追跡中の参加者の問題と回答済みの結果を配信する。未回答の正答は配信せず、他の参加者は引き続き本人の問題のみ受信する。クラフトでは追跡中の参加者がいる家を表示する。
- 検証: `node scripts/test-host-spectator.mjs`（エンジン・専用サーバー・切り替え）、`node scripts/test-host-spectator-ui.mjs`（4ゲームの実画面・PC／スマートフォン）。先に `pnpm run server:build` とPlaywrightのChromium導入が必要。
- 専用サーバーにも同じ変更を反映する必要がある。上記公開サービスはAuto Deploy Offのため、mainへのアップロードだけではサーバーは更新されない。

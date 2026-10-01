# Render無料版・専用サーバー導入

RPG・カート・クラフトを専用サーバーで処理する。ゴルフは統合作業中。
専用ブランチrender-online-serverを使用し、Render無料版への公開は完了。mainは未変更。

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
ローカル.env.localを設定済み。GitHub Pages版は接続先を含む再ビルド・公開が必要。カートとクラフトの移行はローカル検証済み。

## カートとクラフトの通信

- /kart: 60Hzシミュレーション、10Hzバイナリ状態配信。問題・アバター・周回数・別コース再戦はホストの操作をサーバーで検証。
- /craft: サーバーで移動・建築・学習問題を処理。地形は変更差分、参加者ごとの所持品と家の状態は本人へ配信。
- 各部屋最大40人。退出時はホスト操作権を残る参加者へ引き継ぐ。
- 通信切断後は入り直す。ひとりで練習は従来どおり端末内で実行。
- scripts/test-mini-dedicated.mjsで40人ずつの接続、満員拒否、学習判定、島再開、ホスト引き継ぎ、非表示でも進行することを確認。

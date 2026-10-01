# Render無料版・専用サーバー導入

現在の実装対象はRPG。カートとクラフトは従来のPeerJS接続のまま。
専用ブランチrender-online-serverを使用する。mainへのアップロードとRenderへの公開は未実施。

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
同時4部屋・各40人に制限。クラフトの永続保存は今後外部ストレージと連携する必要がある。

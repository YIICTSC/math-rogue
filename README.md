<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 学習ローグ

ブラウザでローカル動作確認できる Vite + React アプリです。

## ローカルで試す

前提: Node.js が入っていること

1. 依存関係を入れる
   `npm install`
2. 開発サーバーを起動する
   `npm run dev`
3. ブラウザで開く
   `http://localhost:5173/`

同一ネットワーク上の別端末から確認する場合は、起動時に表示される `Network` の URL を使ってください。

## 本番ビルド確認

1. ビルドする
   `npm run build`
2. ビルド結果を確認する
   `npm run preview`
3. ブラウザで開く
   `http://localhost:4173/`

## GitHub Pages で公開

このリポジトリには、`main` ブランチへ push した時に GitHub Pages へ自動デプロイする workflow を入れています。

### 事前準備

1. GitHub にリポジトリを push する
2. GitHub の `Settings > Pages` を開く
3. `Build and deployment` の `Source` を `GitHub Actions` にする

### 公開手順

1. `main` ブランチへ push する
2. GitHub の `Actions` タブで `Deploy To GitHub Pages` が成功するのを待つ
3. `Settings > Pages` に表示される URL を開く

### 補足

- Vite の `base` は `./` にしてあるので、GitHub Pages のサブパス配信でも動作します。
- `public/.nojekyll` を入れているので、Pages 側の Jekyll 変換は無効です。

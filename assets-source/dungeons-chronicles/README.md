# ダンジョンズ用イラスト

ゲームで使用する画像は `public/sprites/dungeons-chronicles/` の WebP 44枚
（イベント絵22枚・NPC立ち絵22枚）です。

変換元の `generated/*.png` は削除済みです。`art-generation.json` の
`source` と `sourceSha256` は生成履歴として保持し、`sourceRetained: false`
で元ファイルを保持しないことを示します。元PNGはGit履歴から復元できます。

WebPは元PNGと同一ではありません。イベント絵は960×640の非可逆圧縮、
NPC立ち絵はトリミングと448×576へのリサイズ後の可逆圧縮です。

`normalize-art.mjs` は削除済みPNGの代わりに既存WebPのハッシュを検証し、
変換記録を維持します。PNGを再配置した場合は通常どおり変換します。

# コインドーザー専用効果音

効果音：Springin’ Sound Stock（株式会社しくみデザイン）。

出典：[Springin’ Sound Stock](https://www.springin.org/sound-stock/)、[お金・コイン](https://www.springin.org/sound-stock/subcategory/money/)。[ご利用条件](https://www.springin.org/sound-stock/guideline/)を2026-10-13に確認。ゲームへの組み込みと加工に利用。素材単体の配布用途ではない。著作権は提供元に帰属。

|ゲーム内の音|原素材|用途|
|---|---|---|
|dozer-drop|お金を落とす|コイン投入|
|dozer-collect|お金ジャラジャラ1|通常回収|
|dozer-shower|小銭をばらまいた音1|連鎖8以上の大量回収|
|dozer-gem|キュピーン1|高価値回収（1回の更新で金庫が4以上増加）|
|dozer-pulse|ビヨン1|押し出しスキル|
|dozer-clear|ジャジャーン1|階層クリア・踏破|

`scripts/import-coin-dozer-sounds.mjs` で配布ページから取得し、先頭無音除去、音量低減、短いフェード、48kHzモノラルへ変換。ネイティブ/Safari向けMP3は `public/sfx/rpg-games/`、Web向けOpusは `public/web-audio/sfx/rpg-games/`。ゲームはローカル資材を参照し、音源へのホットリンクは行わない。

通常回収は180ms、宝石は500ms、大量回収は1000msの間隔を設ける。状態更新で同一イベントを再生しない。休止・退出時の音停止、効果音音量・ミュート設定は既存のaudioServiceを使用。

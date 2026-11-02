# 技ボイス一覧

[既存音源の全セリフ・切り分け一覧（CSV）](technique-voice-lines.csv)

既存音源を再生成せず、前置きと技名を分離して利用します。通常技はどちらか一方、コンボの初段・奥義は前置きから技名へ続けます。

## ダンジョンズ2の追加掛け声

各主人公本人の既存 `attack.ogg` を参照した3種類です。新しいひらめき技では掛け声のみを使います。既存固有技は元の本人の技名音源も利用します。

| 主人公 | 掛け声1 | 掛け声2 | 掛け声3 |
| --- | --- | --- | --- |
| リリア | [いくよ！](../../public/sfx/technique-cuts/d2-lyria-intro-0.ogg) | [ここで決める！](../../public/sfx/technique-cuts/d2-lyria-intro-1.ogg) | [星よ、力を！](../../public/sfx/technique-cuts/d2-lyria-intro-2.ogg) |
| セリス | [凍りなさい！](../../public/sfx/technique-cuts/d2-celis-intro-0.ogg) | [狙いはここ！](../../public/sfx/technique-cuts/d2-celis-intro-1.ogg) | [静まりなさい！](../../public/sfx/technique-cuts/d2-celis-intro-2.ogg) |
| フローラ | [いくよ！](../../public/sfx/technique-cuts/d2-flora-intro-0.ogg) | [風をつかんで！](../../public/sfx/technique-cuts/d2-flora-intro-1.ogg) | [みんなのために！](../../public/sfx/technique-cuts/d2-flora-intro-2.ogg) |
| ノクティア | [見せてあげる。](../../public/sfx/technique-cuts/d2-noctia-intro-0.ogg) | [おやすみ。](../../public/sfx/technique-cuts/d2-noctia-intro-1.ogg) | [逃がさないわ。](../../public/sfx/technique-cuts/d2-noctia-intro-2.ogg) |
| オーレネ | [光よ！](../../public/sfx/technique-cuts/d2-aurene-intro-0.ogg) | [祈りを力に！](../../public/sfx/technique-cuts/d2-aurene-intro-1.ogg) | [希望を照らして！](../../public/sfx/technique-cuts/d2-aurene-intro-2.ogg) |
| イグニス | [いくぜ！](../../public/sfx/technique-cuts/d2-ignis-intro-0.ogg) | [燃え上がれ！](../../public/sfx/technique-cuts/d2-ignis-intro-1.ogg) | [ここで決める！](../../public/sfx/technique-cuts/d2-ignis-intro-2.ogg) |
| レオン | [参る！](../../public/sfx/technique-cuts/d2-leon-intro-0.ogg) | [勝負だ！](../../public/sfx/technique-cuts/d2-leon-intro-1.ogg) | [守り抜く！](../../public/sfx/technique-cuts/d2-leon-intro-2.ogg) |
| オリオン | [いくぞ。](../../public/sfx/technique-cuts/d2-orion-intro-0.ogg) | [隙は逃さない。](../../public/sfx/technique-cuts/d2-orion-intro-1.ogg) | [これで終わりだ。](../../public/sfx/technique-cuts/d2-orion-intro-2.ogg) |
| リーフ | [いくよ！](../../public/sfx/technique-cuts/d2-leif-intro-0.ogg) | [狙いを定めて！](../../public/sfx/technique-cuts/d2-leif-intro-1.ogg) | [風に乗せて！](../../public/sfx/technique-cuts/d2-leif-intro-2.ogg) |

発音検査の結果・再生成履歴は `assets/technique-cuts/d2-intro-*.json` に保存しています。音声認識による助詞・漢字表記の揺れも記録しています。

元音声から完全な技名を切り出せなかったダンジョンズ1の4音源は、別人の声で補わず、本人の前置きで対応します。対象は `assets/technique-cuts/build.json` の `missingNames` に記載しています。

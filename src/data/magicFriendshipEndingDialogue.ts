export interface MagicFriendshipEndingLine {
  speakerId: string;
  lineId: string;
  text: string;
}

export const MAGIC_FRIENDSHIP_ENDING_DIALOGUE: Record<string, MagicFriendshipEndingLine[]> = {
  AKARI_SHIZUKU: [
    { speakerId: 'AKARI', lineId: 'friendship-akari-shizuku-1', text: 'あかり「しずくの予定表、今日だけは寄り道の予定を一番上にしておいて！」' },
    { speakerId: 'SHIZUKU', lineId: 'friendship-akari-shizuku-2', text: 'しずく「計算済みです。あなたが迷子になる時間も、ちゃんと余白に入れてあります。」' },
  ],
  AKARI_TSUBASA: [
    { speakerId: 'AKARI', lineId: 'friendship-akari-tsubasa-1', text: 'あかり「次の勝負、負けた方がジュースおごりね。もちろん全力で！」' },
    { speakerId: 'TSUBASA', lineId: 'friendship-akari-tsubasa-2', text: 'つばさ「上等！でも勝ってもおごるよ。今日は二人で勝った日だからな！」' },
  ],
  SHIZUKU_AKARI: [
    { speakerId: 'SHIZUKU', lineId: 'friendship-shizuku-akari-1', text: 'しずく「予定外でした。けれど、あなたとの予定外は不思議と楽しいです。」' },
    { speakerId: 'AKARI', lineId: 'friendship-shizuku-akari-2', text: 'あかり「じゃあ明日も予定外しよう！月の先生、星の生徒からの宿題です！」' },
  ],
  SHIZUKU_MADOKA: [
    { speakerId: 'SHIZUKU', lineId: 'friendship-shizuku-madoka-1', text: 'しずく「この研究、結論より先にお茶の時間を固定しましょう。」' },
    { speakerId: 'MADOKA', lineId: 'friendship-shizuku-madoka-2', text: 'まどか「そ、その予定なら失敗しません。失敗しても、もう一杯いれます。」' },
  ],
  HIYORI_KOHARU: [
    { speakerId: 'HIYORI', lineId: 'friendship-hiyori-koharu-1', text: 'ひより「この庭、疲れた子がいつでも休める場所にしたいな。」' },
    { speakerId: 'KOHARU', lineId: 'friendship-hiyori-koharu-2', text: 'こはる「風は任せて。花が笑う方向へ、ちゃんと道を作るから。」' },
  ],
  HIYORI_SERA: [
    { speakerId: 'HIYORI', lineId: 'friendship-hiyori-sera-1', text: 'ひより「セラちゃんの星の光、ばんそうこうより効くかも。」' },
    { speakerId: 'SERA', lineId: 'friendship-hiyori-sera-2', text: 'セラ「では、ひよりの花の処方も星界標準に登録します。やさしさ多めで。」' },
  ],
  TSUBASA_AKARI: [
    { speakerId: 'TSUBASA', lineId: 'friendship-tsubasa-akari-1', text: 'つばさ「あかり、今日の反省会は走りながらでいいよな？」' },
    { speakerId: 'AKARI', lineId: 'friendship-tsubasa-akari-2', text: 'あかり「いいよ！でも反省より、次に勝つ作戦の方が多くなりそう！」' },
  ],
  TSUBASA_REI: [
    { speakerId: 'TSUBASA', lineId: 'friendship-tsubasa-rei-1', text: 'つばさ「れい、無茶する前に合図しろよ。止めるんじゃなくて一緒に行くから。」' },
    { speakerId: 'REI', lineId: 'friendship-tsubasa-rei-2', text: 'れい「騒がしい合図なら、もう十分届いている。背中は預ける。」' },
  ],
  REI_TSUBASA: [
    { speakerId: 'REI', lineId: 'friendship-rei-tsubasa-1', text: 'れい「封印が乱れた時、あなたの足音だけは迷わず聞こえた。」' },
    { speakerId: 'TSUBASA', lineId: 'friendship-rei-tsubasa-2', text: 'つばさ「当たり前だろ。友だちが黙って困るの、禁止に決まってる！」' },
  ],
  REI_SERA: [
    { speakerId: 'REI', lineId: 'friendship-rei-sera-1', text: 'れい「闇の記録を、あなたは怖がらずに読んだ。」' },
    { speakerId: 'SERA', lineId: 'friendship-rei-sera-2', text: 'セラ「怖くても読みます。れいが一人でページを閉じないように。」' },
  ],
  MADOKA_SHIZUKU: [
    { speakerId: 'MADOKA', lineId: 'friendship-madoka-shizuku-1', text: 'まどか「失敗記録に、笑った回数も書いておけばよかったです。」' },
    { speakerId: 'SHIZUKU', lineId: 'friendship-madoka-shizuku-2', text: 'しずく「では次のノートから欄を追加します。かなり大きめに。」' },
  ],
  MADOKA_MIRAI: [
    { speakerId: 'MADOKA', lineId: 'friendship-madoka-mirai-1', text: 'まどか「本番前の三秒だけ、時間をゆっくりにしますね。」' },
    { speakerId: 'MIRAI', lineId: 'friendship-madoka-mirai-2', text: 'みらい「助かる！その三秒で、最高のウインクを完成させるから！」' },
  ],
  KOHARU_HIYORI: [
    { speakerId: 'KOHARU', lineId: 'friendship-koharu-hiyori-1', text: 'こはる「強い風の日は、花が根を張る日でもあるんだね。」' },
    { speakerId: 'HIYORI', lineId: 'friendship-koharu-hiyori-2', text: 'ひより「うん。こはるちゃんが風を見てくれるから、安心して咲けるよ。」' },
  ],
  KOHARU_SERA: [
    { speakerId: 'KOHARU', lineId: 'friendship-koharu-sera-1', text: 'こはる「精霊樹に星界行きの枝が増えたら、迷子が出そう。」' },
    { speakerId: 'SERA', lineId: 'friendship-koharu-sera-2', text: 'セラ「案内板を作ります。こはる監修なら、風向き表示つきです。」' },
  ],
  MIRAI_MADOKA: [
    { speakerId: 'MIRAI', lineId: 'friendship-mirai-madoka-1', text: 'みらい「まどかの時計があると、緊張までリズムに聞こえるの。」' },
    { speakerId: 'MADOKA', lineId: 'friendship-mirai-madoka-2', text: 'まどか「そ、それなら次は拍手のタイミングも測ってみます。」' },
  ],
  MIRAI_HIYORI: [
    { speakerId: 'MIRAI', lineId: 'friendship-mirai-hiyori-1', text: 'みらい「泣いた後のリハーサルって、なんだか声がまっすぐ出るね。」' },
    { speakerId: 'HIYORI', lineId: 'friendship-mirai-hiyori-2', text: 'ひより「その声、ちゃんと本物だよ。花束より先に届けたいくらい。」' },
  ],
  SERA_HIYORI: [
    { speakerId: 'SERA', lineId: 'friendship-sera-hiyori-1', text: 'セラ「星界の辞書に、ひよりの花言葉を増やしておきました。」' },
    { speakerId: 'HIYORI', lineId: 'friendship-sera-hiyori-2', text: 'ひより「じゃあ私は、この世界の辞書にセラちゃんの笑顔を追加するね。」' },
  ],
  SERA_REI: [
    { speakerId: 'SERA', lineId: 'friendship-sera-rei-1', text: 'セラ「光だけでは守れない場所を、れいが教えてくれました。」' },
    { speakerId: 'REI', lineId: 'friendship-sera-rei-2', text: 'れい「闇だけでも進めない。だから、あなたの灯りは必要だ。」' },
  ],
  REN_YAMATO: [
    { speakerId: 'REN', lineId: 'friendship-ren-yamato-1', text: '蓮「大和、反省会は五分だけ。机を壊さない範囲でな。」' },
    { speakerId: 'YAMATO', lineId: 'friendship-ren-yamato-2', text: '大和「五分で足りるかよ。勝った理由と次に勝つ理由、両方話すぞ！」' },
  ],
  REN_MINATO: [
    { speakerId: 'REN', lineId: 'friendship-ren-minato-1', text: '蓮「今日は俺の後ろじゃなくて、横に並んで帰る日だな。」' },
    { speakerId: 'MINATO', lineId: 'friendship-ren-minato-2', text: '湊「はい。次は僕が、先輩の傘を持ちます。」' },
  ],
  SOMA_RIKU: [
    { speakerId: 'SOMA', lineId: 'friendship-soma-riku-1', text: '颯真「理玖、予定表に落書きするなら、せめて読める字で頼む。」' },
    { speakerId: 'RIKU', lineId: 'friendship-soma-riku-2', text: '理玖「未来は読みにくい方が面白いだろ。ほら、余白は残したよ。」' },
  ],
  SOMA_ELLIOT: [
    { speakerId: 'SOMA', lineId: 'friendship-soma-elliot-1', text: '颯真「この協定書、茶菓子の項目だけ妙に細かいな。」' },
    { speakerId: 'ELLIOT', lineId: 'friendship-soma-elliot-2', text: 'エリオット「重要です。世界を守る会議には、甘いものが必要ですから。」' },
  ],
  MINATO_REN: [
    { speakerId: 'MINATO', lineId: 'friendship-minato-ren-1', text: '湊「先輩、今日は僕が前を歩いてもいいですか。」' },
    { speakerId: 'REN', lineId: 'friendship-minato-ren-2', text: '蓮「もちろん。迷ったら風で知らせる。迷わなくても、たまに呼ぶ。」' },
  ],
  MINATO_ELLIOT: [
    { speakerId: 'MINATO', lineId: 'friendship-minato-elliot-1', text: '湊「星の水って、少し甘い匂いがするんですね。」' },
    { speakerId: 'ELLIOT', lineId: 'friendship-minato-elliot-2', text: 'エリオット「湊の水は安心の味がします。処方名は、友だちの一杯で。」' },
  ],
  RIKU_SOMA: [
    { speakerId: 'RIKU', lineId: 'friendship-riku-soma-1', text: '理玖「未来を一つに決めないって、意外と規則的だろ？」' },
    { speakerId: 'SOMA', lineId: 'friendship-riku-soma-2', text: '颯真「認めよう。君との予定変更だけは、必要な手順だ。」' },
  ],
  RIKU_LEON: [
    { speakerId: 'RIKU', lineId: 'friendship-riku-leon-1', text: '理玖「次のアドリブ、未来で見ても意味不明だったよ。」' },
    { speakerId: 'LEON', lineId: 'friendship-riku-leon-2', text: 'レオン「最高の褒め言葉だね。観測不能のアンコール、いくよ！」' },
  ],
  YAMATO_REN: [
    { speakerId: 'YAMATO', lineId: 'friendship-yamato-ren-1', text: '大和「蓮、どっちが多く守ったか勝負はまだついてねえぞ。」' },
    { speakerId: 'REN', lineId: 'friendship-yamato-ren-2', text: '蓮「じゃあ引き分けだ。次も同じ場所に立つ理由ができる。」' },
  ],
  YAMATO_SAKUYA: [
    { speakerId: 'YAMATO', lineId: 'friendship-yamato-sakuya-1', text: '大和「信用したわけじゃねえ。でも、お前の背中はもう覚えた。」' },
    { speakerId: 'SAKUYA', lineId: 'friendship-yamato-sakuya-2', text: '朔夜「それで十分だ。次に迷う時は、その炎を目印にする。」' },
  ],
  LEON_RIKU: [
    { speakerId: 'LEON', lineId: 'friendship-leon-riku-1', text: 'レオン「理玖、未来の拍手は聞こえた？」' },
    { speakerId: 'RIKU', lineId: 'friendship-leon-riku-2', text: '理玖「聞こえたよ。問題は、君がさらに派手にして歴史を変えることだ。」' },
  ],
  LEON_ELLIOT: [
    { speakerId: 'LEON', lineId: 'friendship-leon-elliot-1', text: 'レオン「星界の楽譜、難しいね。だけど客席が宇宙なら燃える。」' },
    { speakerId: 'ELLIOT', lineId: 'friendship-leon-elliot-2', text: 'エリオット「初演の指揮は任せます。私は迷子の星を席へ案内します。」' },
  ],
  ELLIOT_SOMA: [
    { speakerId: 'ELLIOT', lineId: 'friendship-elliot-soma-1', text: 'エリオット「秘密を共有すると、少しだけ荷物が軽くなるのですね。」' },
    { speakerId: 'SOMA', lineId: 'friendship-elliot-soma-2', text: '颯真「管理する書類は増えたが、悪くない重さだ。」' },
  ],
  ELLIOT_LEON: [
    { speakerId: 'ELLIOT', lineId: 'friendship-elliot-leon-1', text: 'エリオット「別れの門に、再演予定を書き込む人は初めてです。」' },
    { speakerId: 'LEON', lineId: 'friendship-elliot-leon-2', text: 'レオン「閉幕じゃないよ。星をまたぐツアーの初日さ。」' },
  ],
  SAKUYA_YAMATO: [
    { speakerId: 'SAKUYA', lineId: 'friendship-sakuya-yamato-1', text: '朔夜「過去へ沈みかけた時、君の声はひどく現実的だった。」' },
    { speakerId: 'YAMATO', lineId: 'friendship-sakuya-yamato-2', text: '大和「褒めてんのか？まあいい。次も引っぱり戻してやる。」' },
  ],
  SAKUYA_REN: [
    { speakerId: 'SAKUYA', lineId: 'friendship-sakuya-ren-1', text: '朔夜「赦しはいらないと言ったのに、君は隣に残った。」' },
    { speakerId: 'REN', lineId: 'friendship-sakuya-ren-2', text: '蓮「残るのに理由がいるなら、友だちだからで十分だろ。」' },
  ],
};

export const getMagicFriendshipEndingDialogue = (routeId: string) =>
  MAGIC_FRIENDSHIP_ENDING_DIALOGUE[routeId] ?? [];

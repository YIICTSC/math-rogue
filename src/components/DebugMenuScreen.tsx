
import React, { useMemo, useState } from 'react';
import { CARDS_LIBRARY, RELIC_LIBRARY, POTION_LIBRARY, ENEMY_LIBRARY } from '../constants';
import { GAME_STORIES } from '../data/stories';
import { FLAVOR_TEXTS, ENEMY_NAMES } from '../services/geminiService';
import { Card as ICard, Relic, Potion, CardType, TargetType, LanguageMode } from '../types';
import Card from './Card';
import { ArrowRight, Trash2, Plus, Gem, FlaskConical, Swords, Shield, Zap, Search, Beaker, RotateCcw, Skull, Clock, History, Languages, FileText, BookOpen, MessageSquare, HelpCircle, AlertCircle, Copy, Check } from 'lucide-react';
import { synthesizeCards } from '../utils/cardUtils';
import { storageService } from '../services/storageService';
import { trans } from '../utils/textUtils';

interface DebugMenuScreenProps {
  onStart: (deck: ICard[], relics: Relic[], potions: Potion[]) => void;
  onStartAct3Boss: (deck: ICard[], relics: Relic[], potions: Potion[]) => void;
  onBack: () => void;
  onTimeUpdate: (newDailySeconds: number) => void;
  languageMode: LanguageMode;
}

// 翻訳デバッグ用にイベントデータのサンプルを定義 (eventService.tsの内容を網羅)
const EVENT_SAMPLES = [
    { title: "怪しい薬売り", description: "路地裏で男が声をかけてきた。「とびきりの薬, あるよ」", options: [{ label: "買う", text: "20G支払って試す", result: "怪しい薬を手に入れた！" }, { label: "無視", text: "何もせず立ち去る", result: "怪しい男を無視して先へ進んだ。" }] },
    { title: "踊り場の鏡", description: "大きな鏡がある。映っている自分と目が合った。", options: [{ label: "見つめる", text: "じっと見つめる...", result: "鏡の中の自分が何かを手渡してきた。" }, { label: "割る", text: "鏡を叩き割る！", result: "破片が飛び散った！呪い「骨折」を入手。" }] },
    { title: "呪われた書物", description: "古びた祭壇に一冊の本が置かれている。不吉な気配がする。", options: [{ label: "読む", text: "勇気を出して読む", result: "ページをめくると激痛が走った！(HP-10) レリックを入手。" }, { label: "立ち去る", text: "危険を避ける", result: "危険を避けて立ち去った。" }] },
    { title: "伝説の給食", description: "今日は揚げパンの日だ！しかし、最後に一つだけ余っている。クラスメートとジャンケンで勝負だ。", options: [{ label: "グー", text: "力強く出す！", result: "勝った！揚げパンをゲット！" }, { label: "パー", text: "大きく広げる！", result: "お礼に50Gもらった。" }, { label: "チョキ", text: "鋭く出す！", result: "指を突き指した。(HP-5)" }] },
    { title: "校庭の野良犬", description: "授業中, 校庭に野良犬が迷い込んできた！首輪はなく、お腹を空かせているようだ。", options: [{ label: "なでる", text: "優しく近づく", result: "犬は嬉しそうに尻尾を振って去っていった。心が癒やされた。" }, { label: "餌をやる", text: "何かあげる", result: "パンを買ってあげた。お礼に「犬のフン」を置いていった。" }] },
    { title: "謎の転校生", description: "「ねえ, 君のそのカード、僕のと交換しない？」見たことのないカードを持っている。", options: [{ label: "交換", text: "ランダムに交換する", result: "カードが変化した！" }, { label: "断る", text: "自分のカードが大事", result: "断った。転校生はつまらなそうに去った。" }] },
    { title: "席替え", description: "今日は席替えの日だ。窓際の一番後ろになれるか...？それとも最前列か。", options: [{ label: "くじを引く", text: "手札(デッキ)が変わる予感...", result: "席替えの結果、付き合う友達(デッキ)が変わった！" }, { label: "祈る", text: "今の席を維持したい...", result: "なんとか今の席をキープできた。安心してHPが5回復した。" }] },
    { question: "避難訓練", description: "ジリリリリ！非常ベルが鳴り響く。「お・か・し」を守って避難しよう。", options: [{ label: "走る", text: "カードを1枚削除(逃げる)", result: "一目散に逃げ出した！不要なカードを置いてきた。" }, { label: "隠れる", text: "HP回復", result: "机の下に隠れてやり過ごした。HPが15回復した。" }] },
    { title: "プール開き", description: "待ちに待ったプール開きだ！しかし水は冷たそうだ。", options: [{ label: "泳ぐ", text: "全回復するが、風邪を引くかも", result: "最高に気持ちいい！HP全回復！...しかし風邪を引いてしまった。" }, { label: "見学", text: "カードを1枚強化", result: "プールサイドでイメトレをした。カードが強化された！" }] },
    { title: "修学旅行の積立金", description: "集金袋を拾った。中にはお金が入っている。", options: [{ label: "ネコババ", text: "150G入手。呪い「後悔」を得る。", result: "150Gを手に入れた！しかし良心が痛む...呪い「後悔」を入手。" }, { label: "届ける", text: "職員室に届ける", result: "正直者は報われる。先生から「図書カード」をもらった！" }] },
    { title: "魔の掃除時間", description: "廊下のワックスがけの時間だ。ツルツル滑る床は危険だが、滑れば速く移動できるかも？", options: [{ label: "滑る", text: "カード強化。HP-5。", result: "スライディング！(HP-5) カードの扱いが上手くなった！" }, { label: "磨く", text: "カード1枚削除。", result: "心を込めて磨いたら、心が洗われた。" }] },
    { title: "運命のテスト返却", description: "今日は算数のテストが返却される日だ。自信はあるか？", options: [{ label: "自信あり", text: "確率で100GかHP-10。", result: "100点満点だ！お祝いに100Gをもらった！" }, { label: "隠す", text: "呪い「恥」を得る。HP20回復。", result: "親に見つからないように隠した。安心したが、良心が痛む...呪い「恥」を入手。" }] },
    { title: "放送室のジャック", description: "放送室に誰もいない。マイクの電源が入っている。イタズラするチャンス？", options: [{ label: "歌う", text: "最大HP+4。", result: "生徒たちに大ウケだ！人気者になった。最大HP+4。" }, { label: "告白", text: "呪い「後悔」を得る。HP回復。", result: "校長先生の名前を叫んでしまった。呪い「後悔」を入手。" }] },
    { title: "理科室の人体模型", description: "夜の理科室。人体模型が動いている気がする。「心臓ヲ...クレ...」と聞こえた。", options: [{ label: "あげる", text: "HP-10。レリック「保健室の飴」入手。", result: "自分の血を分け与えた(HP-10)お礼に「保健室の飴(レリック)」を貰った。" }, { label: "逃げる", text: "カード1枚削除。", result: "なんとか逃げ切った。怖かった...恐怖でカードを忘れてしまった。" }] },
    { title: "図書室の静寂", description: "放課後の図書室はとても静かだ。心地よい眠気が襲ってくる...", options: [{ label: "寝る", text: "HP20回復。", result: "ぐっすり眠れた。HPが20回復した。" }, { label: "勉強", text: "「先読み」カード入手。", result: "集中して勉強した。「先読み」のカードを習得した。" }] },
    { title: "終わらない朝礼", description: "校長先生の話が長い...もう30分も続いている。貧血で倒れそうだ。", options: [{ label: "耐える", text: "最大HP+5, HP-5。", result: "なんとか耐え抜いた！精神力が鍛えられた。最大HP+5, HP-5。" }, { label: "座る", text: "HP全回復。呪い「ドジ」入手。", result: "こっそり座って休んだ。HP全回復。先生に見つかって怒られた。呪い「ドジ」を入手。" }] },
    { title: "置き勉の誘惑", description: "カバンが重すぎる。教科書を学校に置いて帰ろうか...", options: [{ label: "置く", text: "ランダムなカード1枚削除。", result: "教科書を机の中に隠した。体が軽くなった！" }, { label: "持つ", text: "「頭突き」カード入手。", result: "重いカバンで足腰が鍛えられた。「頭突き」を習得した。" }] },
    { title: "伝説の木の下", description: "この木の下で告白すると結合されるという伝説がある。誰かが待っているようだ。", options: [{ label: "行く", text: "ランダム(レリック/カード/呪い)。", result: "お宝をもらえた！" }, { label: "興味ない", text: "何もなし。", result: "恋愛より冒険だ。通り過ぎた。" }] },
    { title: "体育倉庫のマット", description: "体育倉庫のマットの間に何かが挟まっている。伏した匂いもするが...", options: [{ label: "探る", text: "ランダムカード入手。", result: "なんと！隠されていたカードを見つけた！" }, { label: "放置", text: "何もなし。", result: "賢明な判断だ。" }] },
    { title: "秘密基地のパスワード", description: "草むらに隠された合言葉。正解すればお宝が手に入るかもしれない。", options: [{ label: "適当に言う", text: "運任せ", result: "「開けゴマ！」...なんと扉が開いた！200G入手。" }, { label: "逃げる", text: "関わらない", result: "怪しい扉には近づかないことにした。" }] },
    { title: "職員室の呼び出し", description: "校内放送で名前を呼ばれた。心当たりはあるか？", options: [{ label: "行く", text: "HP全回復。カード1枚削除。", result: "褒められた！HP全回復。" }, { label: "バックれる", text: "呪い「不安」入手。50G入手。", result: "逃げ出した拍子に50G拾った。しかし先生の視線が怖い...呪い「不安」を入手。" }] },
    { title: "落とし物のリコーダー", description: "道端に誰かのリコーダーが落ちている。名前は書いていない。", options: [{ label: "吹く", text: "カード「歌う」か「めまい」入手。", result: "素晴らしい音色だ！新しい表現を覚えた。" }, { label: "洗う", text: "HP10回復。", result: "きれいに洗って届けた。良いことをしてHP10回復。" }] },
    { title: "図工室の粘土", description: "乾燥してカチカチの粘土がある。水をかければ使えるかもしれない。", options: [{ label: "こねる", text: "カード「防御」強化。", result: "鉄壁の造形が完成した！「防御」が強化。" }, { label: "壊す", text: "ストレス解消。最大HP+2。", result: "力いっぱい叩き潰した！スッキリして最大HP+2。" }] },
    { title: "家庭科室のつまみ食い", description: "調理実習の余りのクッキーがある。誰の物かわからない。", options: [{ label: "食べる", text: "HP15回復か呪い「腹痛」。", result: "サクサクで美味しい！HP15回復。" }, { label: "我慢する", text: "意志の力。ムキムキ+1。", result: "誘惑に打ち勝った！精神が鍛えられムキムキ+1。" }] },
    { title: "体育祭の練習", description: "大縄跳びの練習をしている。一緒に混ざる？", options: [{ label: "混ざる", text: "HP-5。ゴールド入手。", result: "みんなで跳んだ！楽しかったが疲れた。(HP-5, 40G入手)" }, { label: "回す", text: "カード「大掃除(旋回)」強化。", result: "回す技術が向上した！「グルグルバット」が強化。" }] },
    { title: "校章の輝き", description: "地面に落ちているピカピカの校章。学校への愛着を試されている。", options: [{ label: "磨く", text: "レリック「純金の校章(金剛杵)」入手。呪い「悩み」入手。", result: "まばゆい輝きだ！レリック「金剛杵」を入手。" }, { label: "踏む", text: "呪い「恥」入手。全カード強化。", result: "背徳の快感！全カードが強化された。しかし名声は地に落ちた...呪い「恥」入手。" }] },
    { title: "文化祭のポスター", description: "真っ白な掲示板。何か描いていく？", options: [{ label: "落書き", text: "カード1枚変化。", result: "適当に描いたら、カードが1枚変化した！" }, { label: "掃除", text: "カード1枚削除。", result: "掲示板を綺麗にした。不要なカードを消し去った。" }] },
    { title: "不気味な音楽室", description: "誰もいないのにピアノの音が聞こえる。ベートーヴェンの肖像画がこっちを見ている気がする。", options: [{ label: "一緒に弾く", text: "カード「反響(エコーフォーム)」入手。HP-15。", result: "死の舞踏！(HP-15)「予習復習(反響)」を習得した。" }, { label: "逃げ出す", text: "カード1枚削除。", result: "脱兎のごとく逃げた！恐怖で記憶が飛んだ。" }] },
    { title: "屋上の柵", description: "屋上のフェンスが一部壊れている。外の景色がよく見える。", options: [{ label: "叫ぶ", text: "HP全回復。最大HP-5。", result: "「宿題なんて大嫌いだー！」...スッキリした。HP全回復。最大HP-5。" }, { label: "黄昏れる", text: "レリック「砂時計」入手。呪い「後悔」入手。", result: "時が過ぎを忘れていた...。レリック「砂時計」入手。" }] },
    { title: "給食の残飯処理", description: "バケツ一杯の残飯。誰かが片付けなければならない。", options: [{ label: "食べる", text: "HP20回復。呪い「寄生虫」入手。", result: "もったいない精神！HP20回復。しかし何かが体内に...。呪い「寄生虫」入手。" }, { label: "埋める", text: "カード「園芸(発掘)」入手。", result: "土に還した。新たな命の循環「再起動」を覚えた。" }] },
    { title: "昇降口の下履き", description: "誰かの靴が散乱している。揃えてあげる？", options: [{ label: "揃える", text: "レリック「上履き(角笛)」入手。", result: "徳を積んだ！神様から「上履き」をもらった。" }, { label: "隠す", text: "100G入手。呪い「恥」入手。", result: "靴の中に100G入っていた！ネコババした。呪い「恥」入手。" }] },
    { title: "二宮金次郎の背負い物", description: "夜になると動き出すという石像。背負っている薪（まき）が重そうだ。", options: [{ label: "手伝う", text: "最大HP+10。HP-10。", result: "肩代わりした！(HP-10) 筋肉が鍛えられ最大HP+10。" }, { label: "本を盗む", text: "レリック「分厚い辞書」入手。呪い「骨折」入手。", result: "本を奪った！レリック「分厚い辞書」入手。" }] },
    { title: "保健室の視力検査", description: "「C」の向きを答えてください。全問正解でお宝です。", options: [{ label: "右！", text: "確率でお宝。", result: "正解！レリック「ぐるぐるメガネ」を入手。" }, { label: "逃げる", text: "検査拒否。", result: "目は大切にしよう。" }] },
    { title: "図書室の貸出カード", description: "自分の名前が書かれた古い貸出カードを見つけた。昔の自分からのメッセージだ。", options: [{ label: "読む", text: "カード1枚強化。HP5回復。", result: "「頑張れ」と書いてあった。HP5回復。カードが強化された。" }, { label: "捨てる", text: "過去は振り返らない。カード1枚削除。", result: "ポイ捨てした。過去を置いてきた。" }] },
    { title: "飼育小屋の掃除", description: "ニワトリのフンがすごい。掃除をすれば何か見つかるかも？", options: [{ label: "頑張る", text: "HP-5。ポーション入手。", result: "ピカピカにした！(HP-5) 隅っこに落ちていたポーションを入手。" }, { label: "サボる", text: "HP10回復。呪い「後悔」入手。", result: "昼寝をした。HP10回復。しかし当番を忘れていた...呪い「後悔」入手。" }] },
    { title: "先生の忘れ物", description: "職員室の廊下に先生の出席簿が落ちている。中には秘密のメモが...", options: [{ label: "盗み見る", text: "全マップ開示。呪い「恥」入手。", result: "テストの範囲がわかった！マップが全開。しかし罪悪感が...呪い「恥」入手。" }, { label: "届ける", text: "100G入手。", result: "正直者は報われる。先生からご褒美の100Gをもらった。" }] },
    { title: "学級文庫の漫画", description: "ボロボロの『ジャンプ』が置いてある。続きが気になる。", options: [{ label: "読む", text: "ムキムキ+2。HP-5。", result: "友情・努力・勝利！(HP-5) 勇気が湧いてムキムキ+2。" }, { label: "寄付する", text: "自分のカードを1枚デッキから削除。", result: "自分の本を棚に置いた。カードが消えた。" }] },
    { title: "理科室のアルコールランプ", description: "火がついたまま放置されている。危ない！", options: [{ label: "消す", text: "カード「防御」強化。", result: "冷静な判断だ。カードが強化された。" }, { label: "遊ぶ", text: "カード「やほど」3枚入手. 最大HP+5。", result: "火遊びは最高だ！最大HP+5。しかし火傷した...「やほど」3枚入手。" }] },
    { title: "音楽室の肖像画", description: "バッハの目が動いた気がする。何か言いたそうだ。", options: [{ label: "歌う", text: "エナジー+1。HP-10。", result: "魂の歌唱！(HP-10) 認められて最大エナジー+1。" }, { label: "逃げる", text: "カード1枚削除。", result: "全力疾走！恐怖で記憶を忘れた。" }] },
    { title: "体育館の跳び箱", description: "12段の跳び箱がそびえ立っている。挑戦する？", options: [{ label: "跳ぶ", text: "成功で最大HP+5、失敗でHP-10。", result: "見事な着地！英雄として讃えられた。最大HP+5。" }, { label: "潜る", text: "レリック「お道具箱(マトリョーシカ)」入手。呪い「悩み」入手。", result: "中に隠れていたお宝を発見！「お道具箱」を入手。" }] },
    { title: "水道の蛇口", description: "誰かが水を出しっぱなしにしている。もったいない。", options: [{ label: "閉める", text: "HP10回復。", result: "水を大切に。心が洗われてHP10回復。" }, { label: "飲む", text: "ポーション入手. HP-5。", result: "キンキンに冷えている！(HP-5) 「ブロックポーション」入手。" }] },
    { title: "家庭科の包丁", description: "研ぎ澄まされた包丁。料理の準備はできている。", options: [{ label: "研ぐ", text: "カード「攻撃」1枚を2枚に増やす。", result: "切れ味最高！カードを複製した。" }, { label: "野菜を切る", text: "HP15回復。", result: "美味しいサラダができた！HP15回復。" }] },
    { title: "秘密の連絡帳", description: "クラスの誰かの秘密が書かれている。見ちゃいけない...", options: [{ label: "見る", text: "お宝か呪い。", result: "お年玉の隠し場所を発見！150G入手。" }, { label: "戻す", text: "何もなし。", result: "プライバシーは守られた。" }] },
    { title: "校長先生の銅像", description: "威厳のある銅像。磨けば光るだろうか。", options: [{ label: "磨く", text: "最大HP+2。HP2回復。", result: "心まで磨かれた気がする。最大HP+2。" }, { label: "落書き", text: "呪い「後悔」入手. ムキムキ+3。", result: "背徳の力！ムキムキ+3。しかし後でめちゃくちゃ怒られた...呪い「後悔」を入手。" }] },
    { title: "階段の13段目", description: "夜になると増えるという伝説の階段。今、足元にあるのは13段目だ。", options: [{ label: "踏み抜く", text: "カード1枚削除. HP-10。", result: "異界に吸い込まれた！(HP-10) カードを異次元に置いてきた。" }, { label: "飛び越える", text: "カード「回避」入手。", result: "見事な跳躍だ！「回避」を習得した。" }] },
    { title: "図書室の司書さん", description: "「お静かに。本を読みますか？」", options: [{ label: "物語を読む", text: "ランダムなカードを1枚入手。", result: "感動的な物語だ！カードをデッキに加えた。" }, { label: "静かに去る", text: "HP5回復。", result: "マナーを守ってHP5回復。" }] },
    { title: "屋上の貯水槽", description: "巨大なタンク。中から音が聞こえる。", options: [{ label: "覗く", text: "ポーション入手かHP-10。", result: "きれいな水だ！「回復ポーション」を入手。" }, { label: "叩く", text: "響く音. ムキムキ+1。", result: "いい音が響いた！腕の筋肉がついてムキムキ+1。" }] },
    { title: "飼育室のウサギ", description: "モフモフのウサギがいる。癒やされる...", options: [{ label: "抱っこ", text: "HP全回復。呪い「寄生虫」入手。", result: "最高の癒やし！HP全回復。しかしノミをもらったようだ...呪い「寄生虫」入手。" }, { label: "観察する", text: "カード「先読み」強化。", result: "動きを完璧に把握した！カードが強化。" }] },
    { title: "学校のゴミ捨て場", description: "掘り出し物があるかもしれない。", options: [{ label: "あさる", text: "レリック入手か呪い「骨折」。", result: "お宝発見！レリックを入手。" }, { label: "掃除する", text: "カード1枚削除。", result: "綺麗に片付けた。過去を捨て去った。" }] },
    { title: "放送事故", description: "放送室から変な声が流れてきた。止めに行く？", options: [{ label: "止める", text: "カード「大声」入手。", result: "マイクを奪い取った！「大声」のスキルを覚えた。" }, { label: "聞き入る", text: "呪い「退屈」入手. HP回復。", result: "不思議な歌声だ...HP10回復. しかし思考が鈍った。呪い「退屈」入手。" }] },
    { title: "掲示板の100点答案", description: "誰かの100点のテストが飾られている。眩しい。", options: [{ label: "盗む", text: "カード1枚強化. 呪い「恥」入手。", result: "答えを丸写しした！カードを強化。しかしバレるのが怖い...呪い「恥」入手。" }, { label: "破る", text: "ムキムキ+2. 呪い「後悔」入手。", result: "嫉妬の炎！ムキムキ+2。でも後味が悪い...呪い「後悔」入手。" }] },
    { title: "保健室のベッド", description: "ふかふかのシーツ。今なら誰もいない。", options: [{ label: "寝る", text: "HP全回復。次戦闘の1ターン目E-1。", result: "ぐっすり...HP全回復。でも寝ぼけて次の戦闘の開始エナジー-1。" }, { label: "飛び跳ねる", text: "最大HP+3。", result: "ベッドでジャンプ！楽しかった。最大HP+3。" }] },
    { title: "給食の余りの牛乳", description: "バケツに1本だけ余っている。冷たそうだ。", options: [{ label: "飲む", text: "最大HP+2. HP2回復。", result: "カルシウム摂取！最大HP+2。" }, { label: "かける", text: "全カード強化. 自分にダメージ。", result: "ミルクシャワー！(HP-5) 皮膚が強くなって（？）全カード強化！" }] },
    { title: "廊下のワックス", description: "塗りたてピカピカ。滑るぞ。", options: [{ label: "滑る", text: "レリック「上履き」入手. HP-5。", result: "華麗なスライディング！(HP-5) レリック「上履き」を入手。" }, { label: "歩く", text: "カード1枚削除。", result: "慎重に歩いた。無駄な動きを省いた。" }] },
    { title: "理科室の毒薬", description: "ドクロマークの小瓶。どうする？", options: [{ label: "飲む", text: "カード「毒」強化. HP-10。", result: "身体が毒に馴染んだ！(HP-10) カードが強化。" }, { label: "捨てる", text: "全デバフ解除. HP10回復。", result: "平和主義。心が晴れて全デバフ解除＆HP10回復。" }] },
    { title: "放課後の決闘", description: "河川敷で隣の小学校の番長が待ち構えている。「俺と勝負しろ！」", options: [{ label: "受けて立つ", text: "HP-20。レリック「金剛杵」入手。", result: "激闘の末、勝利した！(HP-20) 番長の証「金剛杵」を奪い取った！" }, { label: "逃げる", text: "何も得られない。", result: "ダッシュで逃げ帰った。「弱虫ー！」という声が聞こえる。" }] },
    { title: "秘密基地", description: "森の奥に子供たちの秘密基地を見つけた。お菓子やマンガが置いてある。", options: [{ label: "休む", text: "HP30回復。", result: "マンガを読んでリラックスした。HPが30回復した。" }, { label: "あさる", text: "ポーションとゴールド入手。", result: "30Gとエナジーポーションを見つけた！" }] },
    { title: "脱走したウサギ", description: "飼育小屋のウサギが逃げ出した！校庭を走り回っている。", options: [{ label: "捕まえる", text: "50G入手。", result: "見事な手際で捕まえた！先生からお小遣い50Gをもらった。" }, { label: "一緒に遊ぶ", text: "最大HP+3。", result: "ウサギと追いかけっこをした。体が丈夫になった！(最大HP+3)" }] },
    { title: "飼育小屋の主", description: "飼育小屋の奥に、主と呼ばれる巨大なニワトリがいる。", options: [{ label: "戦う", text: "HP-10。カード強化。", result: "つつかれた！(HP-10) 反撃でカードの腕が上がった！" }, { label: "卵をもらう", text: "ポーション入手。", result: "新鮮な卵(回復ポーション)を手に入れた！" }] },
    { title: "闇の掲示板", description: "校舎裏の掲示板に, ターゲットの情報が書かれている。", options: [{ label: "情報を売る", text: "カードを1枚削除. 50G入手。", result: "「秘密」の情報を売った。50Gを手に入れた。" }, { label: "依頼を受ける", text: "HP-15。カード「毒突き」入手。", result: "裏の仕事をこなした。(HP-15)「毒舌(毒突き)」の技術を習得した。" }] },
    { title: "理科室の爆発", description: "実験中に薬品を混ぜすぎた！フラスコが光り輝いている。", options: [{ label: "耐える", text: "HP-15。ポーション2個入手。", result: "大爆発！(HP-15) 煙の中からポーションが2つ生成された。" }, { label: "逃げる", text: "何もなし。", result: "実験を中止して逃げ出した。" }] },
    { title: "地獄の特訓", description: "タイヤを引いて校庭を10周！エースへの道は険しい。", options: [{ label: "やる", text: "HP-10。最大HP+10。", result: "倒れそうになりながら完走した。(HP-10) 体力が大幅に向上した！(MaxHP+10)" }, { label: "サボる", text: "HP全回復。", result: "木陰で休んでいた。HP全回復。" }] },
    { title: "校内放送ジャック", description: "お昼の放送でリサイタルを開そう！全校生徒が君の歌を待っている（？）", options: [{ label: "熱唱", text: "最大エナジー+1。HP-10。", result: "魂の叫びが届いた！(エナジー+1) 喉を痛めた...(HP-10)" }, { label: "バラード", text: "HP20回復。", result: "優しい歌声で自分も癒やされた。HP20回復。" }] },
    { title: "延滞図書の督促", description: "「あ、あの...本返してください...」不良グループが本を返してくれない。", options: [{ label: "戦う", text: "HP-5。カード強化。", result: "勇気を出して取り返した！(HP-5) 経験値を得てカードが強化された。" }, { label: "諦める", text: "呪い「不安」入手。", result: "怖くて言えなかった... 呪い「不安」を入手。" }] },
    { title: "肥沃な土壌", description: "とても良質な土を見つけた。種を植えるには最適だ。", options: [{ label: "植える", text: "カード「種」を1段階成長させる。", result: "土の力で植物が急成長した！" }, { label: "持ち帰る", text: "100G入手。", result: "ボランティア活動に専念した。100G入手。" }] },
    { title: "新メニューのインスピレーション", description: "食堂の隅に古いレシピ本がある。新しいアイデアが浮かぶかも。", options: [{ label: "研究する", text: "ランダムなカードを1枚変化。", result: "新しい献立を思いついた！カードが1枚変化した。" }, { label: "試食する", text: "HP15回復. ムキムキ+1。", result: "素晴らしい味だ！HP15回復、さらにムキムキ+1。" }] },
];

const DebugMenuScreen: React.FC<DebugMenuScreenProps> = ({ onStart, onStartAct3Boss, onBack, onTimeUpdate, languageMode: initialLanguageMode }) => {
  const [activeTab, setActiveTab] = useState<'CARDS' | 'RELICS' | 'POTIONS' | 'SYNTHESIS' | 'SYSTEM' | 'TRANSLATION'>('CARDS');
  const [searchTerm, setSearchTerm] = useState("");
  const [debugLanguageMode, setDebugLanguageMode] = useState<LanguageMode>(initialLanguageMode);
  const [transSubTab, setTransSubTab] = useState<'STORY' | 'FLAVOR' | 'CARD' | 'EVENT' | 'ENEMY' | 'MISSING'>('STORY');
  const [copied, setCopied] = useState(false);
  
  const [selectedDeck, setSelectedDeck] = useState<ICard[]>([]);
  const [selectedRelics, setSelectedRelics] = useState<Relic[]>([]);
  const [selectedPotions, setSelectedPotions] = useState<Potion[]>([]);

  const [synthSlot1, setSynthSlot1] = useState<ICard | null>(null);
  const [synthSlot2, setSynthSlot2] = useState<ICard | null>(null);
  const [synthResult, setSynthResult] = useState<ICard | null>(null);

  const allCards = useMemo(() => Object.values(CARDS_LIBRARY).sort((a, b) => a.type.localeCompare(b.type) || a.cost - b.cost), []);
  const allRelics = useMemo(() => Object.values(RELIC_LIBRARY), []);
  const allPotions = useMemo(() => Object.values(POTION_LIBRARY), []);
  
  const filteredCards = allCards.filter(c => 
      c.name.includes(searchTerm) || 
      c.description.includes(searchTerm) || 
      c.type.includes(searchTerm)
  );

  const handleAddCard = (template: any) => {
      const newCard: ICard = { ...template, id: `debug-${Date.now()}-${Math.random()}` };
      if (activeTab === 'SYNTHESIS') {
          if (!synthSlot1) setSynthSlot1(newCard);
          else if (!synthSlot2) setSynthSlot2(newCard);
      } else {
          setSelectedDeck([...selectedDeck, newCard]);
      }
  };

  const handleRemoveCard = (index: number) => {
      const newDeck = [...selectedDeck];
      newDeck.splice(index, 1);
      setSelectedDeck(newDeck);
  };

  const toggleRelic = (relic: Relic) => {
      if (selectedRelics.find(r => r.id === relic.id)) {
          setSelectedRelics(selectedRelics.filter(r => r.id !== relic.id));
      } else {
          setSelectedRelics([...selectedRelics, relic]);
      }
  };

  const togglePotion = (potionTemplate: any) => {
      if (selectedPotions.length >= 3) return;
      const newPotion: Potion = { ...potionTemplate, id: `debug-pot-${Date.now()}` };
      setSelectedPotions([...selectedPotions, newPotion]);
  };

  const removePotion = (index: number) => {
      const newPots = [...selectedPotions];
      newPots.splice(index, 1);
      setSelectedPotions(newPots);
  };

  const clearDeck = () => setSelectedDeck([]);

  const performSynthesis = () => {
      if (!synthSlot1 || !synthSlot2) return;
      const newCard = synthesizeCards(synthSlot1, synthSlot2);
      setSynthResult(newCard);
  };

  const addSynthToDeck = () => {
      if (synthResult) {
          setSelectedDeck([...selectedDeck, { ...synthResult, id: `synth-added-${Date.now()}` }]);
      }
  };

  const addDebugTime = () => {
      const current = storageService.getDailyPlayTime();
      const next = current + (58 * 60);
      storageService.saveDailyPlayTime(next);
      onTimeUpdate(next); 
      alert("きょうの ぼうけんじかんを 58ふん プラスしました。");
  };

  const resetDebugTime = () => {
      storageService.saveDailyPlayTime(0);
      onTimeUpdate(0); 
      alert("きょうの ぼうけんじかんを リセットしました。");
  };

  const TranslationRow = ({ original, context, isInline = false }: { original: string, context?: string, isInline?: boolean }) => {
      const translated = trans(original, debugLanguageMode);
      const isMissing = debugLanguageMode === 'HIRAGANA' && translated === original && original.match(/[一-龠]/);
      
      return (
          <div className={`p-2 border-b border-gray-700 flex flex-col gap-1 ${isMissing ? 'bg-red-900/20' : 'hover:bg-white/5'}`}>
              {context && <div className="text-[10px] text-gray-500 font-bold uppercase">{context}</div>}
              <div className={`flex ${isInline ? 'flex-row items-center gap-4' : 'flex-col md:flex-row gap-2'}`}>
                  <div className="flex-1 text-xs text-gray-400 font-mono bg-black/40 p-1 rounded">
                      {original}
                  </div>
                  <div className="hidden md:flex items-center text-gray-600"><ArrowRight size={14}/></div>
                  <div className={`flex-1 text-xs font-bold p-1 rounded ${isMissing ? 'text-red-400 bg-red-900/40' : 'text-green-400 bg-green-900/20'}`}>
                      {translated}
                  </div>
              </div>
              {isMissing && <div className="text-[8px] text-red-500 font-bold italic tracking-tighter">MISSING TRANSLATION IN DICTIONARY</div>}
          </div>
      );
  };

  // --- MISSING LIST LOGIC ---
  const missingList = useMemo(() => {
    const collected = new Set<string>();
    const kanjiRegex = /[一-龠]/;

    const check = (str: string) => {
        if (!str) return;
        const translated = trans(str, 'HIRAGANA');
        // 翻訳後も漢字が残っている、または翻訳が元と変わっていないが漢字が含まれる場合を検出
        if (translated.match(kanjiRegex)) {
            collected.add(str);
        }
    };

    // 走査開始
    GAME_STORIES.forEach(s => s.parts.forEach(p => { check(p.title); check(p.content); }));
    FLAVOR_TEXTS.forEach(check);
    allCards.forEach(c => { check(c.name); check(c.description); });
    allRelics.forEach(r => { check(r.name); check(r.description); });
    allPotions.forEach(p => { check(p.name); check(p.description); });
    Object.values(ENEMY_LIBRARY).forEach(e => check(e.name));
    ENEMY_NAMES.forEach(check);
    EVENT_SAMPLES.forEach(ev => { 
        check(ev.title); 
        check(ev.description); 
        ev.options.forEach(opt => { check(opt.label); check(opt.text); check(opt.result); });
    });

    return Array.from(collected).sort();
  }, [allCards, allRelics, allPotions]);

  const copyMissingToClipboard = () => {
    const text = missingList.map(item => `"${item}": "",`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full w-full bg-gray-900 text-white relative">
        <div className="bg-red-900/90 border-b-2 border-red-500 p-2 md:p-4 flex justify-between items-center shrink-0 z-20">
            <h2 className="text-lg md:text-xl font-bold text-red-100 flex items-center">
                <Zap size={20} className="mr-2" /> DEBUG
            </h2>
            <div className="flex gap-2 md:gap-4 text-sm md:text-base">
                <button onClick={onBack} className="text-gray-300 hover:text-white underline">{trans("戻る", initialLanguageMode)}</button>
                <button 
                    onClick={() => onStartAct3Boss(selectedDeck, selectedRelics, selectedPotions)}
                    className="bg-purple-700 hover:bg-purple-600 text-white px-3 py-1 md:px-4 md:py-2 rounded font-bold flex items-center shadow-lg border border-purple-400 text-xs"
                >
                    ACT3 BOSS <Skull size={14} className="ml-1"/>
                </button>
                <button 
                    onClick={() => onStart(selectedDeck, selectedRelics, selectedPotions)}
                    className="bg-green-600 hover:bg-green-500 text-white px-4 py-1 md:px-6 md:py-2 rounded font-bold flex items-center shadow-lg border-2 border-white animate-pulse text-xs md:text-sm"
                >
                    {trans("出発する", initialLanguageMode)} <ArrowRight size={14} className="ml-1"/>
                </button>
            </div>
        </div>

        <div className="flex flex-col md:flex-row flex-grow overflow-hidden">
            <div className="w-full md:w-3/4 h-[60%] md:h-full border-b md:border-b-0 md:border-r border-gray-700 flex flex-col bg-gray-800/50 min-h-0">
                <div className="flex bg-gray-800 border-b border-gray-700 overflow-x-auto shrink-0">
                    <button onClick={() => setActiveTab('CARDS')} className={`flex-1 py-3 px-2 text-xs md:text-sm font-bold whitespace-nowrap ${activeTab === 'CARDS' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-750'}`}>カード</button>
                    <button onClick={() => setActiveTab('RELICS')} className={`flex-1 py-3 px-2 text-xs md:text-sm font-bold whitespace-nowrap ${activeTab === 'RELICS' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-750'}`}>レリック</button>
                    <button onClick={() => setActiveTab('POTIONS')} className={`flex-1 py-3 px-2 text-xs md:text-sm font-bold whitespace-nowrap ${activeTab === 'POTIONS' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-750'}`}>ポーション</button>
                    <button onClick={() => setActiveTab('SYNTHESIS')} className={`flex-1 py-3 px-2 text-xs md:text-sm font-bold whitespace-nowrap ${activeTab === 'SYNTHESIS' ? 'bg-purple-900 text-white' : 'text-purple-400 hover:bg-gray-750'}`}>合成</button>
                    <button onClick={() => setActiveTab('SYSTEM')} className={`flex-1 py-3 px-2 text-xs md:text-sm font-bold whitespace-nowrap ${activeTab === 'SYSTEM' ? 'bg-indigo-900 text-white' : 'text-indigo-400 hover:bg-gray-750'}`}>システム</button>
                    <button onClick={() => setActiveTab('TRANSLATION')} className={`flex-1 py-3 px-2 text-xs md:text-sm font-bold whitespace-nowrap ${activeTab === 'TRANSLATION' ? 'bg-emerald-900 text-white' : 'text-emerald-400 hover:bg-gray-750'}`}>翻訳確認</button>
                </div>

                {(activeTab === 'CARDS' || activeTab === 'SYNTHESIS') && (
                    <div className="p-2 bg-gray-800/80 border-b border-gray-700 shrink-0">
                        <div className="relative">
                            <Search className="absolute left-3 top-2 text-gray-400" size={14}/>
                            <input 
                                type="text" 
                                placeholder="検索..." 
                                className="w-full bg-black border border-gray-600 rounded pl-9 p-1.5 text-sm text-white focus:border-blue-500 outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                )}

                <div className="flex-grow overflow-y-auto p-2 md:p-4 custom-scrollbar min-h-0">
                    {activeTab === 'TRANSLATION' && (
                        <div className="space-y-4">
                            <div className="flex flex-wrap gap-2 items-center bg-black/30 p-2 rounded-lg border border-gray-700 sticky top-0 z-10 backdrop-blur-md">
                                <button 
                                    onClick={() => setDebugLanguageMode(debugLanguageMode === 'JAPANESE' ? 'HIRAGANA' : 'JAPANESE')}
                                    className={`px-4 py-1.5 rounded-full font-bold text-xs flex items-center gap-2 border-2 transition-all ${debugLanguageMode === 'HIRAGANA' ? 'bg-emerald-600 border-white text-white shadow-lg' : 'bg-gray-800 border-gray-600 text-gray-400'}`}
                                >
                                    <Languages size={14}/>
                                    {debugLanguageMode === 'JAPANESE' ? '日本語 モード' : 'ひらがな モード'}
                                </button>
                                <div className="h-4 w-px bg-gray-700 mx-2"></div>
                                <button onClick={() => setTransSubTab('STORY')} className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1 ${transSubTab==='STORY' ? 'bg-white text-black' : 'text-gray-400'}`}><BookOpen size={12}/> ストーリー</button>
                                <button onClick={() => setTransSubTab('FLAVOR')} className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1 ${transSubTab==='FLAVOR' ? 'bg-white text-black' : 'text-gray-400'}`}><MessageSquare size={12}/> ログ</button>
                                <button onClick={() => setTransSubTab('CARD')} className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1 ${transSubTab==='CARD' ? 'bg-white text-black' : 'text-gray-400'}`}><Swords size={12}/> カード</button>
                                <button onClick={() => setTransSubTab('EVENT')} className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1 ${transSubTab==='EVENT' ? 'bg-white text-black' : 'text-gray-400'}`}><HelpCircle size={12}/> イベント</button>
                                <button onClick={() => setTransSubTab('ENEMY')} className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1 ${transSubTab==='ENEMY' ? 'bg-white text-black' : 'text-gray-400'}`}><Skull size={12}/> 敵</button>
                                <button 
                                    onClick={() => setTransSubTab('MISSING')} 
                                    className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1 relative ${transSubTab==='MISSING' ? 'bg-red-600 text-white' : 'text-red-400'}`}
                                >
                                    <AlertCircle size={12}/> 未登録リスト
                                    {missingList.length > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-white text-red-600 text-[8px] px-1 rounded-full font-black border border-red-600">
                                            {missingList.length}
                                        </span>
                                    )}
                                </button>
                            </div>

                            <div className="bg-black/20 rounded-xl overflow-hidden border border-gray-700">
                                {transSubTab === 'STORY' && GAME_STORIES.map(set => (
                                    <React.Fragment key={set.id}>
                                        <div className="bg-gray-800/80 p-1 px-3 text-[10px] font-black text-indigo-400 border-y border-gray-700">SET: {set.id}</div>
                                        {set.parts.map((part, i) => (
                                            <React.Fragment key={i}>
                                                <TranslationRow original={part.title} context={`Act ${i+1} Title`} />
                                                <TranslationRow original={part.content} context={`Act ${i+1} Content`} />
                                            </React.Fragment>
                                        ))}
                                    </React.Fragment>
                                ))}

                                {transSubTab === 'FLAVOR' && FLAVOR_TEXTS.map((text, i) => (
                                    <TranslationRow key={i} original={text} context={`Flavor ${i+1}`} />
                                ))}

                                {transSubTab === 'CARD' && allCards.map((card, i) => (
                                    <React.Fragment key={i}>
                                        <TranslationRow original={card.name} context={`${card.type} Name`} />
                                        <TranslationRow original={card.description} context={`${card.name} Desc`} />
                                    </React.Fragment>
                                ))}

                                {transSubTab === 'EVENT' && EVENT_SAMPLES.map((event, i) => (
                                    <div key={i} className="border-b-2 border-indigo-900/50 bg-black/10 last:border-0">
                                        <div className="bg-indigo-950/40 p-1 px-3 text-[10px] font-black text-indigo-300">EVENT: {event.title}</div>
                                        <TranslationRow original={event.title} context="Title" />
                                        <TranslationRow original={event.description} context="Description" />
                                        {event.options.map((opt, oi) => (
                                            <div key={oi} className="ml-4 border-l-2 border-indigo-800/30">
                                                <TranslationRow original={opt.label} context={`Option ${oi+1} Label`} isInline />
                                                <TranslationRow original={opt.text} context={`Option ${oi+1} Explain`} isInline />
                                                <TranslationRow original={opt.result} context={`Option ${oi+1} Result`} isInline />
                                            </div>
                                        ))}
                                    </div>
                                ))}

                                {transSubTab === 'ENEMY' && (
                                    <>
                                        <div className="bg-gray-800/80 p-1 px-3 text-[10px] font-black text-red-400 border-y border-gray-700">LIBRARY ENEMIES</div>
                                        {Object.values(ENEMY_LIBRARY).map((enemy, i) => (
                                            <TranslationRow key={i} original={enemy.name} context={`Tier ${enemy.tier}`} />
                                        ))}
                                        <div className="bg-gray-800/80 p-1 px-3 text-[10px] font-black text-orange-400 border-y border-gray-700">GENERATED NAMES</div>
                                        {ENEMY_NAMES.map((name, i) => (
                                            <TranslationRow key={i} original={name} context="Random Enemy" />
                                        ))}
                                    </>
                                )}

                                {transSubTab === 'MISSING' && (
                                    <div className="p-4 flex flex-col gap-4 bg-slate-900/80 min-h-[400px]">
                                        <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                                            <h3 className="text-sm font-bold text-red-400 flex items-center gap-2">
                                                <AlertCircle size={16}/> 辞書未登録・漢字残留項目
                                            </h3>
                                            <button 
                                                onClick={copyMissingToClipboard}
                                                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full font-bold text-xs transition-all ${copied ? 'bg-green-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}
                                            >
                                                {copied ? <Check size={14}/> : <Copy size={14}/>}
                                                {copied ? 'COPIED!' : '辞書形式でコピー'}
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-gray-400">
                                            ひらがなモードで漢字が含まれているテキストの一覧です。
                                            「辞書形式でコピー」を押すと、textUtils.ts の DICTIONARY に追加可能な形式でクリップボードに保存されます。
                                        </p>
                                        <textarea 
                                            readOnly
                                            className="w-full h-96 bg-black text-green-500 font-mono text-[10px] p-4 rounded border border-gray-700 focus:outline-none custom-scrollbar"
                                            value={missingList.map(item => `"${item}": "",`).join('\n')}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'SYSTEM' && (
                        <div className="space-y-6">
                            <section>
                                <h3 className="text-indigo-300 font-bold mb-4 flex items-center"><Clock size={18} className="mr-2"/> 時間制限テスト</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button 
                                        onClick={addDebugTime}
                                        className="bg-indigo-700 hover:bg-indigo-600 text-white p-4 rounded-xl border border-indigo-500 shadow-lg flex flex-col items-center gap-2 transition-transform active:scale-95"
                                    >
                                        <History size={32} />
                                        <div className="font-bold">今日のプレイ時間を58分進める</div>
                                        <div className="text-[10px] opacity-70">制限時間の確認用（1時間で制限）</div>
                                    </button>
                                    <button 
                                        onClick={resetDebugTime}
                                        className="bg-slate-700 hover:bg-slate-600 text-white p-4 rounded-xl border border-slate-500 shadow-lg flex flex-col items-center gap-2 transition-transform active:scale-95"
                                    >
                                        <RotateCcw size={32} />
                                        <div className="font-bold">今日のプレイ時間をリセット</div>
                                        <div className="text-[10px] opacity-70">制限を解除して最初から</div>
                                    </button>
                                </div>
                            </section>
                        </div>
                    )}

                    {activeTab === 'SYNTHESIS' && (
                        <div className="mb-8 border-b-2 border-purple-500 pb-4">
                            <h3 className="text-purple-300 font-bold mb-4 flex items-center text-sm md:text-base"><Beaker className="mr-2"/> SYNTHESIS LAB</h3>
                            <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-4 bg-black/40 p-4 rounded-xl">
                                <div className="flex gap-4">
                                    <div 
                                        className="w-20 h-32 md:w-24 md:h-36 border-2 border-dashed border-gray-500 rounded flex items-center justify-center cursor-pointer hover:border-purple-400 bg-gray-900"
                                        onClick={() => setSynthSlot1(null)}
                                    >
                                        {synthSlot1 ? (
                                            <div className="scale-[0.6] md:scale-75 pointer-events-none"><Card card={synthSlot1} onClick={()=>{}} disabled={false} languageMode={initialLanguageMode}/></div>
                                        ) : (
                                            <span className="text-gray-600 text-xs">Slot 1</span>
                                        )}
                                    </div>
                                    <div className="flex items-center"><Plus size={20} className="text-gray-500" /></div>
                                    <div 
                                        className="w-20 h-32 md:w-24 md:h-36 border-2 border-dashed border-gray-500 rounded flex items-center justify-center cursor-pointer hover:border-purple-400 bg-gray-900"
                                        onClick={() => setSynthSlot2(null)}
                                    >
                                        {synthSlot2 ? (
                                            <div className="scale-[0.6] md:scale-75 pointer-events-none"><Card card={synthSlot2} onClick={()=>{}} disabled={false} languageMode={initialLanguageMode}/></div>
                                        ) : (
                                            <span className="text-gray-600 text-xs">Slot 2</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-row md:flex-col gap-2 items-center">
                                    <button 
                                        onClick={performSynthesis}
                                        disabled={!synthSlot1 || !synthSlot2}
                                        className={`px-4 py-2 rounded font-bold text-xs md:text-sm ${!synthSlot1 || !synthSlot2 ? 'bg-gray-700 text-gray-500' : 'bg-purple-600 text-white hover:bg-purple-500 animate-pulse'}`}
                                    >
                                        Mix
                                    </button>
                                    <button 
                                        onClick={() => { setSynthSlot1(null); setSynthSlot2(null); setSynthResult(null); }}
                                        className="text-gray-500 hover:text-white text-xs flex items-center justify-center"
                                    >
                                        <RotateCcw size={12} className="mr-1"/> やめる
                                    </button>
                                </div>
                                
                                {synthResult && (
                                    <>
                                        <ArrowRight size={24} className="text-purple-400 rotate-90 md:rotate-0" />
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="scale-[0.8] md:scale-90"><Card card={synthResult} onClick={()=>{}} disabled={false} languageMode={initialLanguageMode}/></div>
                                            <button 
                                                onClick={addSynthToDeck}
                                                className="bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold w-full"
                                            >
                                                ゲット
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="text-center text-xs text-gray-400 mb-2">スロットを選んでください</div>
                        </div>
                    )}

                    {(activeTab === 'CARDS' || activeTab === 'SYNTHESIS') && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                            {filteredCards.map((c, idx) => (
                                <div key={idx} className="cursor-pointer hover:scale-105 transition-transform flex justify-center" onClick={() => handleAddCard(c)}>
                                    <div className="scale-90 origin-top pointer-events-none -mb-4">
                                        <Card card={{...c, id: 'temp'}} onClick={()=>{}} disabled={false} languageMode={initialLanguageMode} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'RELICS' && (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                            {allRelics.map((r) => {
                                const isSelected = selectedRelics.some(sr => sr.id === r.id);
                                return (
                                    <div 
                                        key={r.id} 
                                        onClick={() => toggleRelic(r)}
                                        className={`p-2 rounded border cursor-pointer flex flex-col items-center text-center ${isSelected ? 'bg-yellow-900/50 border-yellow-400' : 'bg-black/40 border-gray-700 hover:border-gray-500'}`}
                                    >
                                        <Gem size={20} className={isSelected ? "text-yellow-400" : "text-gray-500"} />
                                        <span className="text-[10px] mt-1 font-bold leading-tight">{trans(r.name, initialLanguageMode)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {activeTab === 'POTIONS' && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {allPotions.map((p, idx) => (
                                <div 
                                    key={idx} 
                                    onClick={() => togglePotion(p)}
                                    className="p-2 rounded border border-gray-700 hover:border-white bg-black/40 cursor-pointer flex flex-col items-center text-center"
                                >
                                    <FlaskConical size={20} style={{ color: p.color }} />
                                    <span className="text-[10px] mt-1 font-bold">{trans(p.name, initialLanguageMode)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="w-full md:w-1/4 h-[40%] md:h-full flex flex-col bg-black/20 text-xs min-h-0">
                <div className="p-2 bg-black/50 border-b border-gray-700 font-bold text-gray-300 text-[10px] md:text-xs shrink-0">
                    LOADOUT
                </div>
                <div className="flex-grow overflow-y-auto p-2 md:p-3 custom-scrollbar space-y-4">
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <h3 className="font-bold text-blue-300 flex items-center text-[10px] md:text-xs"><Swords size={12} className="mr-1"/> デッキ ({selectedDeck.length})</h3>
                            <button onClick={clearDeck} className="text-[10px] text-red-400 hover:text-red-200">Clear</button>
                        </div>
                        <div className="space-y-1">
                            {selectedDeck.map((c, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-gray-800 p-1 rounded border border-gray-700 group">
                                    <span className={`truncate text-[10px] ${c.type === CardType.ATTACK ? 'text-red-300' : c.type === CardType.SKILL ? 'text-blue-300' : 'text-yellow-300'}`}>
                                        {trans(c.name, initialLanguageMode)}
                                    </span>
                                    <button onClick={() => handleRemoveCard(idx)} className="text-gray-500 hover:text-red-500 ml-1 shrink-0">
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))}
                            {selectedDeck.length === 0 && <div className="text-gray-600 text-[10px] italic">Empty</div>}
                        </div>
                    </div>

                    <div>
                        <h3 className="font-bold text-yellow-300 mb-1 flex items-center text-[10px] md:text-xs"><Gem size={12} className="mr-1"/> レリック ({selectedRelics.length})</h3>
                        <div className="flex flex-wrap gap-1">
                            {selectedRelics.map(r => (
                                <div key={r.id} className="bg-gray-800 p-1 rounded border border-yellow-700 flex items-center" title={trans(r.description, initialLanguageMode)}>
                                    <span className="truncate max-w-[60px] text-[9px]">{trans(r.name, initialLanguageMode)}</span>
                                    <button onClick={() => toggleRelic(r)} className="ml-1 text-gray-500 hover:text-red-500"><X size={10}/></button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="font-bold text-purple-300 mb-1 flex items-center text-[10px] md:text-xs"><FlaskConical size={12} className="mr-1"/> ポーション ({selectedPotions.length})</h3>
                        <div className="space-y-1">
                            {selectedPotions.map((p, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-gray-800 p-1 rounded border border-gray-700">
                                    <span style={{color: p.color}} className="truncate text-[10px]">{trans(p.name, initialLanguageMode)}</span>
                                    <button onClick={() => removePotion(idx)} className="text-gray-500 hover:text-red-500 ml-1 shrink-0">
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default DebugMenuScreen;

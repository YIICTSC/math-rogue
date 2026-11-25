import { supportsLearningUnits, type ShowMode, type ShowQuestion } from '../types';

type Difficulty = NonNullable<ShowQuestion['difficulty']>;

const familiarAnswer = /^(?:鉛筆|色鉛筆|消しゴム|黒板|机|朝の読書|定規|三角定規|はさみ|筆箱|上履き|給食|水筒|傘|シール|時計|電車|バス|自転車|信号|交番|消防車|地図|エレベーター|ブレーキ|おにぎり|パン|カレー|ラーメン|ピザ|カステラ|プリン|おせんべい|ポテトチップス|みかん|犬|猫|ねこ|ネコ|ウサギ|パンダ|ペンギン|カブトムシ|ゾウ|キリン|カラス|金魚|イルカ|トンボ|コアラ|オタマジャクシ|桜|朝顔|水|氷|雪|雨|虹|地球|月|太陽|温度計|虫めがね|カレンダー|ランドセル|靴下|冷蔵庫|卵|赤|青|黄|影|あくび|しゃっくり|まばたき|関節|手首|足首|虫歯|じゃんけん|グー|チョキ|パー|かくれんぼ|トランプ|サイコロ|輪投げ|拍手|たいこ|和太鼓|ピアノ|絵本|図書室|鏡|目覚まし時計|望遠鏡|信号機|歯ブラシ|レジ|財布|値札|おつり|お釣り|こいのぼり|七夕|雪だるま|せみ|セミ|落ち葉|日の出)$/u;
const basicTask = /「[^」]{1,12}」の「[^」]{1,3}」は何(?:個|回|文字)|(?:1|一)[けケ桁]タ?の(?:たし|ひき)算|五十音では|迷子になったら(?:まず|どこ)|太陽が(?:のぼる|昇る)方角/u;
const specialist = /元素記号|原子番号|化学式|電磁誘導|光年|素粒子|衛星軌道|地軸の傾き|公転周期|固有振動|浮力の原理|構造式|微分|対数|三角関数|六法|暗号化|量子|ゲノム|半導体|ルーメン|周波数|相対性|関税|市制施行|軍記物|活字の組版|仕口|釉薬|焼結|初速度|世界遺産条約|大航海時代|変成岩|沈み込み帯|損益分岐|限界費用|賃貸借|インフレ|オフサイドの成立|連続して跳ね返る側|国際単位系/u;
const specialistAnswer = /ケラチン|反芻|でん粉を消化|ゴライアスバード|アフリカツメガエル|総排出腔|カロテノイド|フェンネル|ポップオーバー|ヌガー|グルテン|ペクチン|アガー|発酵種|炭酸水素ナトリウム|スネイルメール|エロース|冪|白色矮星|原始星|赤色巨星|ダストデビル|核融合|ジェイムズ・ウェッブ|太陽帆|ラグランジュ|観測用キューポラ|耐熱シールド|分光|火山灰層|珪藻|ケイソウ|プレート境界|クロロフィル|気孔|維管束|凝灰岩|変成帯|肺胞|僧帽筋|酸素飽和度|大臼歯|パルスオキシメーター|水晶体|半規管|前庭|腓腹筋|大腿四頭筋|三半規管|旋盤|配架|面付け|特許明細書|製本の背固め|玉掛け|湯のし|矢羽根|組版|大鋸|枡形|櫓をこぐ|馬用のあぶみ|曲尺|崩し字|暖簾分け|マッターホルン鉄道|ゴルナーグラート|グッゲンハイム|プロヴァンス|テオティワカン|ラート|チャッカー|フットフォルト|イリーガル|スチールの成否|トライライン|パンタグラフ|接岸時の舷梯|スラット|末端進入灯|フォアグラウンド|エンディアン|可変抵抗|二要素認証|ラスタライズ|バージョン管理|リボ払い|複利|収入印紙|納品書|源泉徴収|鑑定書|バロック|レチタティーヴォ|カンタービレ|シャコンヌ|上方のケレン|ヘ音記号|パントマイムのマルセル|マクガフィン|ウェルギリウス|エクスカリバーの鞘|フレスコ画|バーナム効果|認知バイアス|カニッツァ|ルビンの壺|錯視の種類/u;
const precision = /(?:正式名称|初めて制した国|正式な規格|国際規格|何年に|何世紀|誰の著作|最初に発表|材料を区別|初代の|制定された|分類名)/u;
const constraints = /(?:予算|合計|上限|残り(?:の時間|予算)|締切|制限時間|何(?:分|秒|円|回)以内|同時に|二つとも|両方|うち一つ|一方で|ほかの条件|なるべく|それでも|条件)/gu;
const tradeoff = /(?:優先|あきらめ|諦め|分ける|調整|残す|やり直|組み合わせ|両立|差し引|折り合|変更|見送|振り分け)/u;
const layeredScene = /ながら|を持ったまま|同時に|その後|を避けて|(?:二人|ふたり|三人)で|の向こうで|が倒れる瞬間|を追う二本|が重なった|より小さく見える/u;
const visibleAction = /している|を持つ|を持った|をおす|を押す|を描く|をかく|を着た|をかぶる|が飛ぶ|をのぞく|を開け|^.{3,}する人|で寝る|が走る|に落ちた|をのばす|を集める|から出す|を見上げる|がぬれた|を見ている|がたまった|が入った|を広げた|の上に乗る/u;
const straightforward = /いくつ|ちょうど(?:いい|よい)|最初に|一番|いちばん|どれ|何色|どこ|どっち|ほしい|何枚|何個|何回|何分|何秒|何を選ぶ|誰|いつ|何と言|なんて|どうする|といえば|しがち/u;
const clues = /同じ|別々|どちらも|二つ|2つ|もう一つ|隠し|隠れて|秘密|知っている|知らない|反対|間違|まちが|突然|翌朝|一つだけ|ひとつだけ|一人ずつ|閉館後|返ってき|見えない/gu;
const deduction = /見分け|推理|気づ|調べ|なぜ|理由|違いを|何だと思う|分かるため|役割まで|どう説明|何を聞いた|たとえ|どう伝え|まちがえない/u;

export function usesSpecialistTerms(prompt: string, answer: string) {
  return specialist.test(`${prompt} ${answer}`) || specialistAnswer.test(answer);
}

/** Judge what the prompt asks a player to know, picture or weigh. Catalogue size is independent. */
export function reviewedDifficulty(mode: ShowMode, question: ShowQuestion): Difficulty {
  const { prompt, answer, options } = question;
  if (supportsLearningUnits(mode)) {
    if (basicTask.test(prompt)) return 'EASY';
    const technical = usesSpecialistTerms(prompt, answer);
    if (technical || precision.test(prompt)) return 'HARD';
    if (familiarAnswer.test(answer) && !/組み合わせ|差|のうち|もともと|地域で|何年|の仕組み/u.test(prompt)) return 'EASY';
    if ((question.difficulty === 'HARD' || questionsWithComparisons(prompt)) &&
      (specialistAnswer.test(options.join(' ')) || /共通点|証明|順序|意味として正しい|組み合わせ/u.test(prompt))) return 'HARD';
    return question.difficulty === 'EASY' && prompt.length < 48 && answer.length < 13 ? 'EASY' : 'NORMAL';
  }
  if (mode === 'DRAW') {
    if (layeredScene.test(answer) || usesSpecialistTerms('', answer) ||
      (answer.length >= 16 && (answer.match(/[をがにで]/gu)?.length ?? 0) >= 2)) return 'HARD';
    return visibleAction.test(answer) || answer.length > 9 || /の.*の/u.test(answer) ? 'NORMAL' : 'EASY';
  }
  const constraintCount = [...prompt.matchAll(constraints)].length;
  if ((constraintCount >= 2 && tradeoff.test(prompt)) ||
    (mode !== 'NEAREST' && prompt.length >= 33 && [...prompt.matchAll(clues)].length >= 2 && deduction.test(prompt))) return 'HARD';
  if (constraintCount || tradeoff.test(prompt) || specialist.test(prompt)) return 'NORMAL';
  if (mode === 'VOTE' && /次の一言|言い訳|続き|広告|言葉を入れ|理由をつける/u.test(prompt)) return 'NORMAL';
  if (straightforward.test(prompt) && prompt.length <= 56) return 'EASY';
  return 'NORMAL';
}

function questionsWithComparisons(prompt: string) {
  return /二つ|ふたつ|両方|順番|うち.*(?:と比べ|と異な)|一致する/u.test(prompt);
}

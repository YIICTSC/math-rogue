import { MAGIC_HEROES, MAGIC_MALE_PROTAGONISTS, isMagicMaleProtagonist } from './magicHeroes';
import { ROMANCE_TARGETS } from './romanceTargets';

export type MagicRomanceRewardKind = 'upgrade' | 'maxHp' | 'heal' | 'gold' | 'strength';

export interface MagicRomanceChoiceDefinition {
  label: string;
  affectionGain: number;
  rewardKind: MagicRomanceRewardKind;
  rewardAmount: number;
  response: string;
}

export interface MagicRomanceDialogueDefinition {
  title: string;
  description: string;
  choices: MagicRomanceChoiceDefinition[];
}

const TARGET_STAGE_LINES: Record<string, string[]> = {
  REN: [
    '蓮「昔からそうだよな。誰かのためなら、すぐ走り出す。だから俺も放っておけない」',
    '蓮「ノート、見せ合おうぜ。おまえの苦手は俺が覚えてるし、俺の苦手はおまえが知ってる」',
    '蓮「ずっと近くにいたのに、最近は前より緊張する。変だよな」',
    '蓮「幼なじみだから守るんじゃない。大切だから、絶対に帰したいんだ」',
    '蓮「明日も、その先も迎えに行く。今度は幼なじみじゃなく、恋人として」',
  ],
  SOMA: [
    '颯真「規則外の行動だが、理由は理解した。君の判断力を見せてもらおう」',
    '颯真「この解答は美しい。君と議論すると、私の視野にも余白が生まれる」',
    '颯真「完璧でない私を知っても、君は隣にいるのだな。……感謝する」',
    '颯真「責任は私が負う。だが君まで失う命令には、初めて逆らうと決めた」',
    '颯真「学園の未来も、私自身の未来も、君と対等な立場で選びたい」',
  ],
  MINATO: [
    '湊「先輩、ぼくにも手伝わせてください。頼られる人になりたいんです」',
    '湊「一緒に勉強すると、できなかったところが怖くなくなります」',
    '湊「今日は任務じゃなくて……先輩と、普通に出かけられたら嬉しいです」',
    '湊「守られてばかりじゃありません。今度はぼくが、先輩の力になります！」',
    '湊「卒業しても会いに行きます。先輩の隣で、もっと頼れる人になりますから」',
  ],
  RIKU: [
    '理玖「面白い時間分岐だね。君がここへ来る確率、実はかなり低かったんだ」',
    '理玖「失敗は未来のメモだよ。君となら、読み返すのも悪くない」',
    '理玖「この時間だけ観測をやめようか。結果を知らずに君と歩いてみたい」',
    '理玖「正解の未来なんてない。僕が選ぶのは、君が生きて笑う今だ」',
    '理玖「未来を先に見るのはやめた。君と一日ずつ答え合わせをしたいから」',
  ],
  YAMATO: [
    '大和「勘違いすんな。おまえが危なっかしいから、ちょっと見に来ただけだ」',
    '大和「分かんねえなら聞けよ。笑わねえし、俺も分かんねえとこは一緒に考える」',
    '大和「祭りとか興味ねえけど……おまえが行くなら、まあ付き合ってやる」',
    '大和「勝手に消えんな！　おまえの帰る場所くらい、俺が炎で守ってやる！」',
    '大和「難しい約束はいらねえ。明日も隣で笑え。それだけは絶対守れよ」',
  ],
  LEON: [
    'レオン「僕の舞台へようこそ。君なら、観客ではなく好敵手として迎えてあげるよ」',
    'レオン「見事だね。けれど僕も負けない。君が努力するほど、僕も輝ける」',
    'レオン「勝負を忘れて君を見てしまうなんて、僕らしくない。責任を取ってくれる？」',
    'レオン「悪夢ごときに主役は渡さない。君と僕で、最高の結末に書き換える！」',
    'レオン「これからも僕を見ていて。もちろん、一番近い特等席でね」',
  ],
  ELLIOT: [
    'エリオット「ご親切に感謝します。ですが、私に近づくことはあなたを危険に巻き込みます」',
    'エリオット「星界文字をここまで読めるとは。あなたには秘密を預けてもよさそうです」',
    'エリオット「この世界の冬は美しいですね。あなたと見るから、そう感じるのでしょう」',
    'エリオット「帰還命令には従いません。私はあなたと、この世界を守ると決めました」',
    'エリオット「世界の境界を越えても、あなたへ続く道だけは決して閉じません」',
  ],
  SAKUYA: [
    '朔夜「敵に情けをかけるとは愚かだ。……だが、その愚かさに救われる者もいる」',
    '朔夜「停戦は一時的なものだ。私を信じるな。そう言っても、君は来るのだな」',
    '朔夜「私の過去を知れば軽蔑するだろう。それでも聞くというのか」',
    '朔夜「組織には戻らない。君を傷つける命令に従うくらいなら、すべてを敵に回す」',
    '朔夜「赦しは求めない。ただ君の未来を守る隣に、私の居場所をくれ」',
  ],
};

const STAGE_TITLES = ['魔法が結ぶ出会い', '放課後の共同課題', '秘密を分ける時間', '崩れる結界の中で', '卒業前夜の約束'];
const STAGE_SCENES = [
  '放課後、淡く光る魔法陣の前で二人は足を止めた。',
  '魔法学と通常授業の課題が積まれた教室に、夕日が差し込んでいる。',
  '任務のない短い時間。二人は人目を避け、学園の静かな場所で向き合った。',
  '暴走した結界が校舎を揺らす。互いの魔力だけが、帰る道をつないでいた。',
  '最終決戦を前にした夜。卒業後の進路と、言葉にしていない想いが残っている。',
];

const REWARD_CHOICES: Array<Array<Omit<MagicRomanceChoiceDefinition, 'response'>>> = [
  [
    { label: 'まっすぐ気持ちを伝える', affectionGain: 20, rewardKind: 'upgrade', rewardAmount: 1 },
    { label: '相手の不安を受け止める', affectionGain: 16, rewardKind: 'maxHp', rewardAmount: 2 },
    { label: '一緒に行動する提案をする', affectionGain: 12, rewardKind: 'heal', rewardAmount: 12 },
  ],
  [
    { label: '得意分野を教えてもらう', affectionGain: 18, rewardKind: 'upgrade', rewardAmount: 1 },
    { label: '自分の弱点も打ち明ける', affectionGain: 16, rewardKind: 'strength', rewardAmount: 1 },
    { label: '休憩用の魔法菓子を分ける', affectionGain: 12, rewardKind: 'heal', rewardAmount: 16 },
  ],
  [
    { label: '今日は二人で寄り道する', affectionGain: 20, rewardKind: 'maxHp', rewardAmount: 3 },
    { label: '相手の夢を最後まで聞く', affectionGain: 17, rewardKind: 'upgrade', rewardAmount: 1 },
    { label: '記念になる魔法写真を撮る', affectionGain: 13, rewardKind: 'gold', rewardAmount: 35 },
  ],
  [
    { label: '背中を預けて共闘する', affectionGain: 20, rewardKind: 'strength', rewardAmount: 1 },
    { label: '危険でも手を離さない', affectionGain: 18, rewardKind: 'maxHp', rewardAmount: 3 },
    { label: 'いったん退いて作戦を練る', affectionGain: 14, rewardKind: 'heal', rewardAmount: 22 },
  ],
  [
    { label: '卒業後も隣にいたいと告げる', affectionGain: 20, rewardKind: 'upgrade', rewardAmount: 1 },
    { label: '使命と恋を両方選ぶ', affectionGain: 18, rewardKind: 'maxHp', rewardAmount: 4 },
    { label: '二人だけの約束を交わす', affectionGain: 16, rewardKind: 'strength', rewardAmount: 1 },
  ],
];

const MALE_REWARD_CHOICES: Array<Array<Omit<MagicRomanceChoiceDefinition, 'response'>>> = [
  [
    { label: '自分から手伝うと申し出る', affectionGain: 20, rewardKind: 'upgrade', rewardAmount: 1 },
    { label: '彼女の不安を受け止める', affectionGain: 16, rewardKind: 'maxHp', rewardAmount: 2 },
    { label: '二人で動こうと誘う', affectionGain: 12, rewardKind: 'heal', rewardAmount: 12 },
  ],
  [
    { label: '彼女の得意分野を頼る', affectionGain: 18, rewardKind: 'upgrade', rewardAmount: 1 },
    { label: '自分の弱点を先に打ち明ける', affectionGain: 16, rewardKind: 'strength', rewardAmount: 1 },
    { label: '休憩へ連れ出す', affectionGain: 12, rewardKind: 'heal', rewardAmount: 16 },
  ],
  [
    { label: '二人きりの寄り道へ誘う', affectionGain: 20, rewardKind: 'maxHp', rewardAmount: 3 },
    { label: '彼女の夢を聞き出す', affectionGain: 17, rewardKind: 'upgrade', rewardAmount: 1 },
    { label: '思い出を形に残そうと提案する', affectionGain: 13, rewardKind: 'gold', rewardAmount: 35 },
  ],
  [
    { label: '自分が前に出て共闘する', affectionGain: 20, rewardKind: 'strength', rewardAmount: 1 },
    { label: '必ず連れて帰ると告げる', affectionGain: 18, rewardKind: 'maxHp', rewardAmount: 3 },
    { label: '彼女を守る作戦を組み直す', affectionGain: 14, rewardKind: 'heal', rewardAmount: 22 },
  ],
  [
    { label: '卒業後も隣にいてほしいと告げる', affectionGain: 20, rewardKind: 'upgrade', rewardAmount: 1 },
    { label: '使命も彼女も諦めないと誓う', affectionGain: 18, rewardKind: 'maxHp', rewardAmount: 4 },
    { label: '自分から二人の約束を結ぶ', affectionGain: 16, rewardKind: 'strength', rewardAmount: 1 },
  ],
];

const RESPONSE_BY_REWARD: Record<MagicRomanceRewardKind, string> = {
  upgrade: '二人で確かめた魔法の理論が、カードの新しい使い方につながった。',
  maxHp: '本音を交わしたことで心が強くなり、最大HPが上がった。',
  heal: '穏やかな時間に緊張がほどけ、HPが回復した。',
  gold: '思い出の品を学園広報へ提供し、協力費を受け取った。',
  strength: '守りたい気持ちが魔力の芯となり、恒久的な攻撃力を得た。',
};

interface RomanceCharacterTone {
  voice: string;
  motif: string;
  worry: string;
  comfort: string;
  resolve: string;
  future: string;
}

const CHARACTER_TONES: Record<string, RomanceCharacterTone> = {
  AKARI: { voice: 'まっすぐな星の明るさ', motif: '星光', worry: '一人で先に走り過ぎる不安', comfort: '笑顔で相手の手を引くこと', resolve: '暗い場所でも最初の光になること', future: '願いを一緒に増やす明日' },
  SHIZUKU: { voice: '静かな分析と隠した優しさ', motif: '月鏡', worry: '予定外の感情を扱いきれない戸惑い', comfort: '事実を並べて安心できる答えを作ること', resolve: '予測できない選択も受け入れること', future: '二人で検証し続ける未来' },
  HIYORI: { voice: '痛みに寄り添う柔らかさ', motif: '花の治癒', worry: '誰かの傷を自分だけで抱える癖', comfort: '弱音を急かさず聞くこと', resolve: '支えられる強さも選ぶこと', future: '帰れる庭を育てる日々' },
  TSUBASA: { voice: '熱血で不器用なまっすぐさ', motif: '炎のハンマー', worry: '立ち止まると弱さが見える怖さ', comfort: '勝負にして前へ進ませること', resolve: '背中を守りながら正面突破すること', future: '笑い合える競争を続ける毎日' },
  REI: { voice: '寡黙な規律と深い庇護', motif: '闇符', worry: '禁術と過去を知られる恐れ', comfort: '沈黙ごと隣にいること', resolve: '罪も傷も断ち切って守ること', future: '平穏を二人で選び直す道' },
  MADOKA: { voice: '内気な研究熱と時間への憧れ', motif: '時計装置', worry: '失敗を巻き戻したくなる弱さ', comfort: '失敗記録を一緒に読み返すこと', resolve: '今この瞬間を選んで助けること', future: '未観測の時間を予約する約束' },
  KOHARU: { voice: '穏やかな風と芯の強さ', motif: '風と精霊樹', worry: '守るだけで距離を置いてしまう癖', comfort: '風のように重さをほどくこと', resolve: '同じ場所に立って戦うこと', future: '帰りたい場所を育てる季節' },
  MIRAI: { voice: '華やかな演技と本音の寂しさ', motif: '夢舞台', worry: '笑顔の裏の不安を見せる怖さ', comfort: '舞台裏の本音を受け止めること', resolve: '悪夢の主役を奪い返すこと', future: '二人で続ける次の幕' },
  SERA: { voice: '異世界の礼儀正しさと希望', motif: '星界光', worry: '帰る世界と残りたい気持ちの間で揺れること', comfort: '知らない日常を一緒に学ぶこと', resolve: '二つの世界をどちらも諦めないこと', future: '境界を越えて帰れる場所' },
  REN: { voice: '世話焼きな幼なじみの近さ', motif: '防護風', worry: '近すぎて大切な気持ちを言い損ねること', comfort: '先に気づいて迎えに行くこと', resolve: '帰る道を風で開くこと', future: '普通の日常を恋人として守る朝' },
  SOMA: { voice: '規律正しい完璧主義と誠実さ', motif: '氷の秩序', worry: '完璧でない自分を見せること', comfort: '対等な議論で答えを整えること', resolve: '規則より大切な相手を選ぶこと', future: '予定表にない幸福を共に修正する未来' },
  MINATO: { voice: '努力家の後輩らしい素直さ', motif: '清流の治癒', worry: '守られるだけで終わること', comfort: '頼られるまで隣で学ぶこと', resolve: '今度は自分が手を引くこと', future: '憧れを越えて並んで歩く日々' },
  RIKU: { voice: '軽やかな観測者の知性', motif: '時間環', worry: '未来を先に知って今を薄めてしまうこと', comfort: '予想外を面白がること', resolve: '正解の未来より生きた今を選ぶこと', future: '一日ずつ答え合わせする時間' },
  YAMATO: { voice: 'ぶっきらぼうな炎の優しさ', motif: '炎拳', worry: '素直な言葉ほど照れて乱暴になること', comfort: '文句を言いながら一番前に立つこと', resolve: '帰る場所を炎で守ること', future: '肩肘張らず隣で笑う日常' },
  LEON: { voice: '華やかな自信家の舞台性', motif: '幻奏', worry: '主役でいられない素顔を見せること', comfort: '相手を特等席へ招くこと', resolve: '悪夢を最高の結末へ書き換えること', future: '幕が下りても続く二人の舞台' },
  ELLIOT: { voice: '静かな星界の気品と孤独', motif: '星界門', worry: '秘密に近づけた相手を危険へ巻き込むこと', comfort: '記録ではなく本心として誘うこと', resolve: '帰還命令より守りたい世界を選ぶこと', future: '境界を越えても閉じない道' },
  SAKUYA: { voice: '冷たい封印術と赦しを求めない孤独', motif: '宵闇の封印', worry: '過去を知られた時に手を離されること', comfort: '赦しではなく現在の行動を見てもらうこと', resolve: '敵意も運命も封じて未来を守ること', future: '罪を背負っても隣を歩く平穏' },
};

const CHOICE_RESPONSE_FOCUS = [
  ['距離を詰める言葉', '不安をほどく聞き方', '一緒に動く提案'],
  ['得意分野への信頼', '弱点を見せる勇気', '休む時間の共有'],
  ['二人だけの寄り道', '夢を聞き切る覚悟', '思い出を残す工夫'],
  ['背中を預ける共闘', '帰すための約束', '守るための作戦'],
  ['卒業後の居場所', '使命と恋の両立', '二人だけの誓い'],
] as const;

const getTone = (id: string): RomanceCharacterTone => CHARACTER_TONES[id] ?? CHARACTER_TONES.AKARI;

const PAIR_MEMORY_BY_STAGE = [
  ['初めて名前を呼んだ瞬間', '警戒がほどけた目線', '魔法陣に重なった影', '差し出された手', '戻れない一歩'],
  ['並べたノートの余白', '教室に残った魔力の匂い', '解けなかった問い', '同じ机に置いた護符', '夕日に透けた本音'],
  ['人目を避けた廊下', '秘密を預けた小声', '寄り道の約束', '胸に残った沈黙', '二人だけの合図'],
  ['崩れた結界の中心', '背中越しの呼吸', '傷だらけの帰り道', '離さなかった手', '守り抜いた名前'],
  ['卒業前夜の空', '言えずにいた未来', '最後の任務前の約束', '二人で選ぶ朝', '終わりではない始まり'],
] as const;

const pickPairMemory = (leadId: string, partnerId: string, stageIndex: number) => {
  const memories = PAIR_MEMORY_BY_STAGE[stageIndex];
  const seed = [...`${leadId}:${partnerId}:${stageIndex}`].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return memories[seed % memories.length];
};

const buildPairScene = (
  leadId: string,
  partnerId: string,
  leadName: string,
  partnerName: string,
  stageIndex: number,
): string => {
  const lead = getTone(leadId);
  const partner = getTone(partnerId);
  const bridge = [
    `${leadName}の${lead.motif}が、${partnerName}の${partner.motif}に触れて、いつもの放課後を少し違う色に変えた。`,
    `${partnerName}が抱えていた${partner.worry}を、${leadName}は${lead.comfort}で受け止めようとする。`,
    `誰にも急かされない時間の中で、${leadName}は${partnerName}の${partner.voice}を初めて近くで聞いた。`,
    `崩れかけた結界の中、${leadName}の${lead.resolve}と${partnerName}の${partner.resolve}が同じ方向を向く。`,
    `最終決戦前夜、${leadName}は${partnerName}と${lead.future}、そして${partner.future}を同時に選ぶ。`,
  ][stageIndex];
  return `${STAGE_SCENES[stageIndex]}\n${bridge}`;
};

const buildPairLines = (
  leadId: string,
  partnerId: string,
  leadName: string,
  partnerName: string,
  stageIndex: number,
): string[] => {
  const lead = getTone(leadId);
  const partner = getTone(partnerId);
  const memory = pickPairMemory(leadId, partnerId, stageIndex);
  return [
    [
      `${leadName}「${memory}を忘れない。${partnerName}の${partner.worry}ごと、今ここで向き合いたい」`,
      `${partnerName}「${leadName}の${lead.motif}に触れると、私の${partner.motif}まで落ち着く。逃げずに聞きます」`,
    ],
    [
      `${leadName}「${memory}に答えを残そう。今日は${partnerName}の${partner.motif}を頼りに進みたい」`,
      `${partnerName}「頼られるなら、${partner.worry}を隠す必要もありませんね。${leadName}の弱点も見せてください」`,
    ],
    [
      `${leadName}「任務じゃない${memory}だから言える。${partnerName}の${partner.future}を、もっと知りたい」`,
      `${partnerName}「それなら、${leadName}の${lead.future}も聞かせて。片方だけ秘密にするのはずるいです」`,
    ],
    [
      `${leadName}「${memory}で退いたら、${partnerName}の${partner.resolve}まで否定することになる」`,
      `${partnerName}「なら私も、${leadName}の${lead.resolve}を信じます。帰る道は二人で作りましょう」`,
    ],
    [
      `${leadName}「${memory}を最後の思い出にしたくない。卒業後も、${partnerName}の隣を選ばせてほしい」`,
      `${partnerName}「私も同じです。${leadName}となら、${partner.future}を怖がらずに選べる」`,
    ],
  ][stageIndex];
};

const buildChoiceLabel = (
  baseLabel: string,
  partnerId: string,
  partnerName: string,
  stageIndex: number,
  choiceIndex: number,
): string => {
  const partner = getTone(partnerId);
  const focus = CHOICE_RESPONSE_FOCUS[stageIndex][choiceIndex];
  if (choiceIndex === 0) return `${partnerName}へ${focus}を向ける`;
  if (choiceIndex === 1) return `${partner.worry}を受け止める`;
  return `${baseLabel}（${partner.motif}）`;
};

const buildChoiceResponse = (
  leadId: string,
  partnerId: string,
  leadName: string,
  partnerName: string,
  stageIndex: number,
  choiceIndex: number,
  rewardKind: MagicRomanceRewardKind,
): string => {
  const lead = getTone(leadId);
  const partner = getTone(partnerId);
  const focus = CHOICE_RESPONSE_FOCUS[stageIndex][choiceIndex];
  const memory = pickPairMemory(leadId, partnerId, stageIndex);
  const branch = [
    `${leadName}は${memory}を思い出しながら${focus}を選んだ。${partnerName}は${partner.worry}を笑ってごまかさず、${lead.comfort}を受け入れる。`,
    `${focus}を選んだことで、${leadName}は${partnerName}の${partner.motif}が揺れる理由を知った。${partnerName}も${leadName}の${lead.voice}を、頼れる音として覚える。`,
    `${leadName}の${focus}は、${memory}を二人だけの記憶に変えた。${partnerName}は${partner.future}を語り、${leadName}も${lead.future}を隠さない。`,
    `${focus}の判断に迷いはなかった。${leadName}の${lead.resolve}と${partnerName}の${partner.resolve}が重なり、崩れた結界に帰り道が開く。`,
    `${leadName}は${focus}を選び、${memory}の先にある約束を言葉にした。${partnerName}は${partner.future}を差し出し、二人の答えはもう揺れない。`,
  ][stageIndex];
  return `${branch}\n${RESPONSE_BY_REWARD[rewardKind]}`;
};

export const getMagicRomanceDialogue = (
  heroId: string,
  targetId: string,
  stageIndex: number,
): MagicRomanceDialogueDefinition => {
  if (isMagicMaleProtagonist(heroId)) {
    const protagonist = MAGIC_MALE_PROTAGONISTS.find((entry) => entry.id === heroId) ?? MAGIC_MALE_PROTAGONISTS[0];
    const heroine = MAGIC_HEROES.find((entry) => entry.id === targetId) ?? MAGIC_HEROES[0];
    const safeStage = Math.max(0, Math.min(4, stageIndex));
    const pairLines = buildPairLines(protagonist.id, heroine.id, protagonist.name, heroine.name, safeStage);
    return {
      title: `${heroine.name}・${STAGE_TITLES[safeStage]}`,
      description: `${buildPairScene(protagonist.id, heroine.id, protagonist.name, heroine.name, safeStage)}\n\n${pairLines[0]}\n\n${pairLines[1]}`,
      choices: MALE_REWARD_CHOICES[safeStage].map((choice, choiceIndex) => ({
        ...choice,
        label: buildChoiceLabel(choice.label, heroine.id, heroine.name, safeStage, choiceIndex),
        response: buildChoiceResponse(
          protagonist.id,
          heroine.id,
          protagonist.name,
          heroine.name,
          safeStage,
          choiceIndex,
          choice.rewardKind,
        ),
      })),
    };
  }
  const hero = MAGIC_HEROES.find((entry) => entry.id === heroId) ?? MAGIC_HEROES[0];
  const target = ROMANCE_TARGETS.find((entry) => entry.id === targetId) ?? ROMANCE_TARGETS[0];
  const safeStage = Math.max(0, Math.min(4, stageIndex));
  const pairLines = buildPairLines(hero.id, target.id, hero.name, target.name, safeStage);

  return {
    title: `${target.name}・${STAGE_TITLES[safeStage]}`,
    description: `${buildPairScene(hero.id, target.id, hero.name, target.name, safeStage)}\n\n${pairLines[0]}\n\n${pairLines[1]}`,
    choices: REWARD_CHOICES[safeStage].map((choice, choiceIndex) => ({
      ...choice,
      label: buildChoiceLabel(choice.label, target.id, target.name, safeStage, choiceIndex),
      response: buildChoiceResponse(
        hero.id,
        target.id,
        hero.name,
        target.name,
        safeStage,
        choiceIndex,
        choice.rewardKind,
      ),
    })),
  };
};

const TARGET_ENDING_LINES: Record<string, string[]> = {
  REN: ['蓮「おはよう。今日も迎えに来た」', '蓮「任務がない日は、普通にデートしよう。俺たちには、そういう毎日も必要だろ？」'],
  SOMA: ['颯真「本日の予定には、君との昼食も正式に入れてある」', '颯真「完璧な未来ではなく、君と笑って修正できる未来を選ぼう」'],
  MINATO: ['湊「先輩、今度の休日はぼくが案内します！」', '湊「支えるだけじゃなく、一緒に楽しいことを増やしていきたいです」'],
  RIKU: ['理玖「今日の未来予報は見ていないよ」', '理玖「君が何を選ぶか、隣で驚く方がずっと楽しいからね」'],
  YAMATO: ['大和「ほら、帰るぞ。腹減った」', '大和「戦いが終わっても一緒にいろよ。おまえといる日常、気に入ってんだ」'],
  LEON: ['レオン「次の公演も君が相手役だ。異論は認めないよ」', 'レオン「舞台の外でも、君を笑顔にする主役でいさせて」'],
  ELLIOT: ['エリオット「星界への門はいつでも開けます」', 'エリオット「ですが今日は、この街であなたと新しい思い出を記録したい」'],
  SAKUYA: ['朔夜「穏やかな朝には、まだ慣れない」', '朔夜「だが君と過ごすこの日常を守るためなら、何度でも未来を選び直そう」'],
};

export type MagicRomanceEndingRank = 'BOND' | 'SPECIAL' | 'ROMANCE' | 'TRUE_ROMANCE';

export const getMagicRomanceEndingRank = (affection: number): MagicRomanceEndingRank => {
  if (affection >= 100) return 'TRUE_ROMANCE';
  if (affection >= 80) return 'ROMANCE';
  if (affection >= 40) return 'SPECIAL';
  return 'BOND';
};

const HERO_ENDING_LINES: Record<string, Record<MagicRomanceEndingRank, [string, string]>> = {
  AKARI: {
    BOND: ['あかり「次は戦いじゃなくて、楽しい約束で会おうよ！」', 'あかり「私たちの明日は、ここからもっと輝くよ！」'],
    SPECIAL: ['あかり「あなたと過ごす時間は、私の大切な星になったんだ」', 'あかり「焦らずに、二人の願いを一緒に育てよう」'],
    ROMANCE: ['あかり「恋人として、これからもあなたの隣を走りたい！」', 'あかり「勉強も任務もデートも、全部二人で楽しもうね！」'],
    TRUE_ROMANCE: ['あかり「どんな暗い世界でも、あなたを照らす星になる！」', 'あかり「二人の願いで、最高に幸せな未来を作ろう！」'],
  },
  SHIZUKU: {
    BOND: ['しずく「次に会う予定を決めましょう。偶然に任せる必要はありません」', 'しずく「あなたとの時間は、記録以上の価値があります」'],
    SPECIAL: ['しずく「この感情を、もう誤差として扱うことはできません」', 'しずく「結論を急がず、二人で丁寧に確かめましょう」'],
    ROMANCE: ['しずく「恋人として隣にいる。それが私の選んだ答えです」', 'しずく「予測できない毎日も、あなたとなら歓迎します」'],
    TRUE_ROMANCE: ['しずく「世界が何度条件を変えても、私はあなたを選びます」', 'しずく「二人の未来は、私たち自身で証明しましょう」'],
  },
  HIYORI: {
    BOND: ['ひより「今度は戦いの話じゃなくて、好きなものをたくさん教えてね」', 'ひより「また会えるって思うだけで、心があたたかいよ」'],
    SPECIAL: ['ひより「あなたのことを考えると、胸に優しい花が咲くみたい」', 'ひより「この気持ちを、ゆっくり大切に育てたいな」'],
    ROMANCE: ['ひより「嬉しい日も苦しい日も、恋人として分け合いたいの」', 'ひより「二人で帰れる場所を、ずっと守っていこうね」'],
    TRUE_ROMANCE: ['ひより「どんな傷も、二人なら希望に変えていけるよ」', 'ひより「あなたと生きる未来を、何度でも咲かせたい」'],
  },
  TSUBASA: {
    BOND: ['つばさ「次も絶対会おうぜ！　今度はのんびり勝負なしでさ！」', 'つばさ「約束破ったら、迎えに行くからな！」'],
    SPECIAL: ['つばさ「おまえといると、勝ち負けより大事なもんが増えるんだ」', 'つばさ「この気持ちも、二人で正面から確かめようぜ」'],
    ROMANCE: ['つばさ「恋人になっても遠慮すんなよ。ずっと隣で競争だ！」', 'つばさ「どっちが幸せにできるか、負けねえからな！」'],
    TRUE_ROMANCE: ['つばさ「世界の終わりだって、二人でぶっ飛ばしてやる！」', 'つばさ「おまえとなら、未来全部に勝てる気がする！」'],
  },
  REI: {
    BOND: ['れい「次の約束を忘れるな。私も必ず時間を作る」', 'れい「おまえと語る時間は、私にとって無駄ではない」'],
    SPECIAL: ['れい「おまえは既に、私の心から切り離せない存在だ」', 'れい「答えを急ぐな。私が隣で待つ」'],
    ROMANCE: ['れい「恋人として、おまえの未来を最も近くで守る」', 'れい「平穏も戦いも、この手を離さず越えていくぞ」'],
    TRUE_ROMANCE: ['れい「運命も禁術も、私たちを引き離すことはできない」', 'れい「生涯をかけて、おまえと選んだ未来を守り抜く」'],
  },
  MADOKA: {
    BOND: ['まどか「つ、次に会う日時……今から予約してもいいですか？」', 'まどか「あなたとの時間は、消さずに大切に保存します」'],
    SPECIAL: ['まどか「この気持ちは、何度計算しても特別という結果になります」', 'まどか「少しずつ、一緒に答えを作ってください」'],
    ROMANCE: ['まどか「恋人として過ごす時間を、毎日増やしていきたいです」', 'まどか「失敗しても、二人で直せる未来がいいです」'],
    TRUE_ROMANCE: ['まどか「すべての時間軸で、私はあなたに会いに行きます」', 'まどか「二人の未来だけは、誰にも巻き戻させません」'],
  },
  KOHARU: {
    BOND: ['こはる「また風の気持ちいい日に、一緒に歩こうね」', 'こはる「次の約束があると、帰り道も寂しくないね」'],
    SPECIAL: ['こはる「あなたの隣は、私が自然なままでいられる場所なの」', 'こはる「この想いを、二人でゆっくり育てよう」'],
    ROMANCE: ['こはる「恋人として、あなたが帰りたい場所を守りたい」', 'こはる「どんな季節も、手をつないで歩いていこうね」'],
    TRUE_ROMANCE: ['こはる「世界中の風が変わっても、あなたを見失わないよ」', 'こはる「二人の居場所を、未来までずっと育てよう」'],
  },
  MIRAI: {
    BOND: ['みらい「次の公演にも来てね。今度は笑顔だけを見せたいの」', 'みらい「あなたとの次の場面、楽しみにしているわ」'],
    SPECIAL: ['みらい「あなたの前では、演技じゃない私でいたいの」', 'みらい「二人の物語を、焦らず素敵に演じましょう」'],
    ROMANCE: ['みらい「舞台の外でも、恋人として私の相手役でいて」', 'みらい「毎日を二人だけのアンコールにしましょう？」'],
    TRUE_ROMANCE: ['みらい「どんな悪夢も、二人の愛で最高の幕へ変えるわ」', 'みらい「永遠のカーテンコールまで、私を見ていてね」'],
  },
  SERA: {
    BOND: ['セラ「この世界の楽しいことを、また一緒に教えてください」', 'セラ「次に会う日も、光の記録へ大切に残します」'],
    SPECIAL: ['セラ「あなたを想う気持ちは、星界の言葉でも説明できません」', 'セラ「二人で、この感情の名前を探したいです」'],
    ROMANCE: ['セラ「恋人として、あなたのいる場所へ何度でも帰ります」', 'セラ「二つの世界に、二人の幸せな日常を作りましょう」'],
    TRUE_ROMANCE: ['セラ「世界の境界を越えても、私の光はあなたへ届きます」', 'セラ「あなたと結ぶ未来を、永遠の記録にします」'],
  },
};

const MALE_PROTAGONIST_ENDING_LINES: Record<string, Record<MagicRomanceEndingRank, [string, string]>> = {
  REN: {
    BOND: ['蓮「今度は俺から迎えに行く。戦い抜きで、ゆっくり話そう」', '蓮「困った時だけじゃなく、嬉しい時も最初に呼んでくれ」'],
    SPECIAL: ['蓮「幼なじみみたいに自然には戻れない。もう君を特別だと知ったから」', '蓮「答えを急がせない。でも、隣の場所は俺に残してほしい」'],
    ROMANCE: ['蓮「これからは恋人として、毎朝でも迎えに行く」', '蓮「君の明日を守るだけじゃない。一緒に幸せになるって決めた」'],
    TRUE_ROMANCE: ['蓮「世界が何度離そうとしても、俺が君までの道を風で開く」', '蓮「守るだけで終わらない。君と選ぶ未来を、俺の願いにする」'],
  },
  SOMA: {
    BOND: ['颯真「次の面会予定は私が確保した。異論は、その場で聞こう」', '颯真「君との対話は、私の判断に必要な大切な時間だ」'],
    SPECIAL: ['颯真「君を特別扱いしている事実を、もう否定するつもりはない」', '颯真「対等な立場で、この感情の答えを共に検証したい」'],
    ROMANCE: ['颯真「公務より先に、恋人である君との約束を守る日があってもいい」', '颯真「完璧ではない私の未来を、君と修正しながら進みたい」'],
    TRUE_ROMANCE: ['颯真「学園の規則にも運命にも、君を諦める条文は存在しない」', '颯真「私の全責任をもって、君と幸福になる未来を選ぶ」'],
  },
  MINATO: {
    BOND: ['湊「次はぼくが誘います。もう待っているだけの後輩じゃありません」', '湊「あなたに頼ってもらえる人へ、もっと成長します」'],
    SPECIAL: ['湊「憧れだけじゃないって、やっと自分の言葉で言えます」', '湊「少しずつでいいから、ぼくを特別な相手として見てください」'],
    ROMANCE: ['湊「恋人として、今度はぼくがあなたの手を引きます」', '湊「守られた分よりもっと、あなたを笑顔にしてみせます」'],
    TRUE_ROMANCE: ['湊「どんな世界の海でも、あなたへ続く流れを見つけます」', '湊「ぼくの未来は、あなたと並んで歩くために強くなります」'],
  },
  RIKU: {
    BOND: ['理玖「次の予定は観測していない。君を誘う瞬間くらい、自分で選びたいから」', '理玖「予想外の返事を、また隣で聞かせてよ」'],
    SPECIAL: ['理玖「どの未来でも君を探してしまう。それなら答えは十分だよね」', '理玖「結末を先に見ず、二人で一日ずつ確かめよう」'],
    ROMANCE: ['理玖「恋人になった未来は見ていない。今ここで、僕が選んだから」', '理玖「君が驚く明日を、これからも一番近くで楽しみたい」'],
    TRUE_ROMANCE: ['理玖「無数の分岐があっても、僕は毎回君の手を取る」', '理玖「運命じゃない。何度でも選び直すことを、永遠と呼ぼう」'],
  },
  YAMATO: {
    BOND: ['大和「次も呼べ。面倒でも、俺が先に片づけてやる」', '大和「おまえといる時間まで嫌いじゃねえ。それで十分だろ」'],
    SPECIAL: ['大和「他のやつと同じに見られんのは、もう我慢できねえ」', '大和「俺がおまえを特別にしてんだ。ちゃんと覚えとけ」'],
    ROMANCE: ['大和「恋人なら遠慮すんな。危ねえ時も寂しい時も俺を呼べ」', '大和「明日も隣にいろ。俺が毎日、笑わせてやる」'],
    TRUE_ROMANCE: ['大和「世界ごと燃え落ちても、おまえの帰る場所だけは俺が残す」', '大和「命令でも運命でもねえ。俺が一生、おまえを選ぶ」'],
  },
  LEON: {
    BOND: ['レオン「次の舞台も君の席を空けておく。最高の感想を聞かせて」', 'レオン「観客ではなく、僕を高める大切な相手としてね」'],
    SPECIAL: ['レオン「僕が演技を忘れる相手なんて、君しかいない」', 'レオン「この特別な幕を、焦らず二人で続けよう」'],
    ROMANCE: ['レオン「舞台の外でも、僕の恋人という主役を引き受けて」', 'レオン「君の毎日を、僕が最高のアンコールにしてみせる」'],
    TRUE_ROMANCE: ['レオン「世界の終幕さえ、君と僕なら新しい開演へ変えられる」', 'レオン「永遠の特等席は君のものだ。僕もずっと隣にいる」'],
  },
  ELLIOT: {
    BOND: ['エリオット「次の記録には、あなたと過ごす穏やかな一日を残したい」', 'エリオット「任務ではなく、私自身の希望としてお誘いします」'],
    SPECIAL: ['エリオット「世界を越えても消えない感情を、私は初めて知りました」', 'エリオット「この想いの名前を、あなたと共に確かめたい」'],
    ROMANCE: ['エリオット「恋人として、どの世界からでも必ずあなたへ帰ります」', 'エリオット「星界の記録より大切な未来を、二人で綴りましょう」'],
    TRUE_ROMANCE: ['エリオット「世界の境界は、あなたを諦める理由にはなりません」', 'エリオット「すべての星へ誓います。私の帰る場所は、あなたの隣です」'],
  },
  SAKUYA: {
    BOND: ['朔夜「次の約束を私から求めるとは、以前なら考えられなかった」', '朔夜「君と過ごす平穏を、もう失いたくはない」'],
    SPECIAL: ['朔夜「赦しではなく、私自身を見てくれる君が特別なのだ」', '朔夜「答えが出るまで、君の隣を守ることを許してほしい」'],
    ROMANCE: ['朔夜「恋人として君を守る。過去ではなく、私が選んだ未来として」', '朔夜「穏やかな日々も戦いも、この手を離さず共に越えよう」'],
    TRUE_ROMANCE: ['朔夜「運命の封印も世界の敵意も、君への道だけは閉ざせない」', '朔夜「私の生涯を、君と幸福になるために使うと誓う」'],
  },
};

export const getMagicRomanceEndingText = (heroId: string, targetId: string, affection: number): {
  title: string;
  description: string;
  lines: string[];
  imagePath: string;
  rank: MagicRomanceEndingRank;
  rankLabel: string;
} => {
  if (isMagicMaleProtagonist(heroId)) {
    const protagonist = MAGIC_MALE_PROTAGONISTS.find((entry) => entry.id === heroId) ?? MAGIC_MALE_PROTAGONISTS[0];
    const heroine = MAGIC_HEROES.find((entry) => entry.id === targetId) ?? MAGIC_HEROES[0];
    const rank = getMagicRomanceEndingRank(affection);
    const protagonistLines = MALE_PROTAGONIST_ENDING_LINES[protagonist.id]?.[rank]
      ?? MALE_PROTAGONIST_ENDING_LINES.REN[rank];
    const heroineLines = HERO_ENDING_LINES[heroine.id]?.[rank] ?? HERO_ENDING_LINES.AKARI[rank];
    const rankLabel = {
      BOND: '絆エンド',
      SPECIAL: '特別な関係エンド',
      ROMANCE: '恋愛エンド',
      TRUE_ROMANCE: '真恋愛エンド',
    }[rank];
    return {
      title: `${protagonist.name}と${heroine.name}の、その先`,
      description: rank === 'TRUE_ROMANCE'
        ? '二つの願いが奇跡を起こした。彼は自分から彼女の手を取り、恋と使命を共に選ぶ未来へ歩き出す。'
        : '戦いを終えた学園で、彼は自分の言葉で彼女を次の約束へ誘った。二人の関係は穏やかな未来へ続いていく。',
      lines: [
        protagonistLines[0],
        heroineLines[0],
        protagonistLines[1],
        heroineLines[1],
      ],
      imagePath: `sprites/magic/events/romance/${heroine.id}/${protagonist.id}/r6.webp`,
      rank,
      rankLabel,
    };
  }
  const hero = MAGIC_HEROES.find((entry) => entry.id === heroId) ?? MAGIC_HEROES[0];
  const target = ROMANCE_TARGETS.find((entry) => entry.id === targetId) ?? ROMANCE_TARGETS[0];
  const rank = getMagicRomanceEndingRank(affection);
  const romanceTargetLines = TARGET_ENDING_LINES[target.id] ?? TARGET_ENDING_LINES.REN;
  const targetStageLines = TARGET_STAGE_LINES[target.id] ?? TARGET_STAGE_LINES.REN;
  const targetLines = rank === 'BOND'
    ? [
        targetStageLines[2],
        `${target.name}「今度は戦いのない日に、ゆっくり続きを話そう」`,
      ]
    : rank === 'SPECIAL'
      ? [
          targetStageLines[3],
          `${target.name}「急がなくていい。これからも君の一番近くで、答えを探したい」`,
        ]
      : romanceTargetLines;
  const rankLabel = {
    BOND: '絆エンド',
    SPECIAL: '特別な関係エンド',
    ROMANCE: '恋愛エンド',
    TRUE_ROMANCE: '真恋愛エンド',
  }[rank];
  const description = {
    BOND: '真の敵を退けた学園に、穏やかな季節が戻った。まだ名前のつかない関係を抱えながら、二人は次の約束を交わす。',
    SPECIAL: '真の敵を退けた学園に、穏やかな季節が戻った。互いを特別に思う気持ちは、卒業後の未来へ静かに続いていく。',
    ROMANCE: '真の敵を退けた学園に、穏やかな季節が戻った。二人は恋人として、使命と普通の日常をどちらも大切にすると決めた。',
    TRUE_ROMANCE: '二つの願いと学びが奇跡を起こし、真の敵を退けた。二人は世界の境界さえ越え、恋と使命を共に選び続ける。',
  }[rank];
  const [openingLine, closingLine] = HERO_ENDING_LINES[hero.id]?.[rank] ?? HERO_ENDING_LINES.AKARI[rank];

  return {
    title: `${hero.name}と${target.name}の、その先`,
    description,
    lines: [
      openingLine,
      ...targetLines,
      closingLine,
    ],
    imagePath: `sprites/magic/events/romance/${hero.id}/${target.id}/r6.webp`,
    rank,
    rankLabel,
  };
};

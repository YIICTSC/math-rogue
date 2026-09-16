import type { GeneralProblem, ProblemVisual } from './utils';

type Attachment = {
  match: string;
  visual: ProblemVisual;
};

const KOKUGO_ATTACHMENTS: Record<string, Attachment> = {
  KOKUGO_G2_U02: {
    match: 'の 主語は？',
    visual: { kind: 'sentence_structure', mode: 'elementary', title: '文の くみたて' },
  },
  KOKUGO_G2_U03: {
    match: '文の きまりに 合う 書き方',
    visual: { kind: 'sentence_structure', mode: 'sentence_order', title: '文の きまり' },
  },
  KOKUGO_G3_U03: {
    match: '中心となる話題は？',
    visual: { kind: 'paragraph_structure', mode: 'paragraphs', title: '段落の まとまり' },
  },
  KOKUGO_G4_U04: {
    match: 'の話題は？',
    visual: { kind: 'paragraph_structure', mode: 'summary', title: '段落から要旨へ' },
  },
  KOKUGO_G4_U07: {
    match: 'を要約する時の中心話題は？',
    visual: { kind: 'paragraph_structure', mode: 'summary', title: '要約の手順' },
  },
  KOKUGO_G5_U05: {
    match: 'の要旨は？',
    visual: { kind: 'paragraph_structure', mode: 'summary', title: '要旨と根拠' },
  },
  KOKUGO_G6_U05: {
    match: 'の要旨は？',
    visual: { kind: 'paragraph_structure', mode: 'argument', title: '主張を支える構造' },
  },
  KOKUGO_G7_U06: {
    match: 'の主語は？',
    visual: { kind: 'sentence_structure', mode: 'middle', title: '文の成分' },
  },
  KOKUGO_G7_U07: {
    match: 'に含まれる名詞は？',
    visual: { kind: 'word_class_blocks', title: '品詞を働きで見る' },
  },
  KOKUGO_G7_U09: {
    match: 'の要旨は？',
    visual: { kind: 'paragraph_structure', mode: 'argument', title: '要約するための論理' },
  },
  KOKUGO_G8_U06: {
    match: 'の品詞は？',
    visual: { kind: 'word_class_blocks', title: '品詞と活用' },
  },
  KOKUGO_G8_U08: {
    match: 'の要旨は？',
    visual: { kind: 'paragraph_structure', mode: 'argument', title: '要約の骨組み' },
  },
  KOKUGO_G9_U06: {
    match: 'の働きは？',
    visual: { kind: 'sentence_structure', mode: 'clause', title: '節と文の関係' },
  },
  KOKUGO_G9_U08: {
    match: 'の要旨は？',
    visual: { kind: 'paragraph_structure', mode: 'argument', title: '論説の骨組み' },
  },
};

const ENGLISH_ATTACHMENTS: Record<string, Attachment> = {
  ENGLISH_G7_U02: {
    match: 'I ___ a student.',
    visual: {
      kind: 'sentence_blocks',
      title: 'be動詞の文',
      note: '主語と説明を be動詞でつなぐ',
      blocks: [
        { label: '主語', tone: 'primary' },
        { label: 'be動詞', tone: 'accent' },
        { label: '説明', tone: 'good' },
      ],
    },
  },
  ENGLISH_G7_U03: {
    match: 'I ___ soccer every day.',
    visual: {
      kind: 'sentence_blocks',
      title: '一般動詞の文',
      blocks: [
        { label: '主語', tone: 'primary' },
        { label: '一般動詞', tone: 'accent' },
        { label: '目的語・時', tone: 'good' },
      ],
    },
  },
  ENGLISH_G7_U04: {
    match: 'Do you like music? の いみは？',
    visual: {
      kind: 'sentence_blocks',
      title: '疑問文の語順',
      blocks: [
        { label: '疑問の合図', tone: 'accent' },
        { label: '主語', tone: 'primary' },
        { label: '動詞など', tone: 'good' },
        { label: '?', tone: 'purple' },
      ],
    },
  },
  ENGLISH_G7_U05: {
    match: 'He does not play tennis. の いみは？',
    visual: {
      kind: 'sentence_blocks',
      title: '否定文の語順',
      blocks: [
        { label: '主語', tone: 'primary' },
        { label: '助動詞 / be', tone: 'secondary' },
        { label: 'not', tone: 'accent' },
        { label: '動詞・説明', tone: 'good' },
      ],
    },
  },
  ENGLISH_G7_U06: {
    match: 'Open your book. の いみは？',
    visual: {
      kind: 'sentence_blocks',
      title: '命令文の形',
      note: '動詞から始めて相手に伝える',
      blocks: [
        { label: '動詞', tone: 'accent' },
        { label: '相手・もの', tone: 'primary' },
        { label: '.', tone: 'good' },
      ],
    },
  },
  ENGLISH_G7_U07: {
    match: 'He can run fast. の いみは？',
    visual: {
      kind: 'sentence_blocks',
      title: 'can の文',
      blocks: [
        { label: '主語', tone: 'primary' },
        { label: 'can', tone: 'accent' },
        { label: '動詞の原形', tone: 'good' },
      ],
    },
  },
  ENGLISH_G7_U08: {
    match: 'She is playing tennis. の いみは？',
    visual: { kind: 'tense_timeline', focus: 'present_progressive', title: '現在進行形' },
  },
  ENGLISH_G7_U09: {
    match: 'Tom studies English. の いみは？',
    visual: {
      kind: 'sentence_blocks',
      title: '三人称単数の文',
      note: 'he / she / 人名のときの動詞に注目',
      blocks: [
        { label: 'he / she / 人名', tone: 'primary' },
        { label: '動詞 + s / es', tone: 'accent' },
        { label: '続き', tone: 'good' },
      ],
    },
  },
  ENGLISH_G7_U10: {
    match: 'The book is on the desk. の いみは？',
    visual: { kind: 'spatial_preposition', title: '位置を表す前置詞' },
  },
  ENGLISH_G7_U11: {
    match: 'three boxes の いみは？',
    visual: {
      kind: 'sentence_blocks',
      title: '複数形の考え方',
      blocks: [
        { label: '2つ以上', tone: 'primary' },
        { label: '名詞', tone: 'good' },
        { label: 's / es など', tone: 'accent' },
      ],
    },
  },
  ENGLISH_G7_U12: {
    match: 'I like my teacher. の my は 何を表す？',
    visual: {
      kind: 'sentence_blocks',
      title: '代名詞の役割',
      note: '文中の位置で形が変わる',
      blocks: [
        { label: '主格', tone: 'primary' },
        { label: '所有格', tone: 'accent' },
        { label: '目的格', tone: 'good' },
      ],
    },
  },
  ENGLISH_G8_U01: {
    match: 'She played tennis. の いみは？',
    visual: { kind: 'tense_timeline', focus: 'past', title: '過去形' },
  },
  ENGLISH_G8_U02: {
    match: 'They were playing soccer. の いみは？',
    visual: { kind: 'tense_timeline', focus: 'past_progressive', title: '過去進行形' },
  },
  ENGLISH_G8_U03: {
    match: 'I am going to play tennis. の いみは？',
    visual: { kind: 'tense_timeline', focus: 'future', title: '未来表現' },
  },
  ENGLISH_G8_U04: {
    match: 'I have to get up early. の いみは？',
    visual: {
      kind: 'sentence_blocks',
      title: '助動詞の文',
      note: '気持ち・義務・許可などを加える',
      blocks: [
        { label: '主語', tone: 'primary' },
        { label: '助動詞など', tone: 'accent' },
        { label: '動詞の原形', tone: 'good' },
      ],
    },
  },
  ENGLISH_G8_U05: {
    match: 'He went to the store to buy milk. の いみは？',
    visual: {
      kind: 'sentence_blocks',
      title: 'to + 動詞の原形',
      note: '目的や内容を後ろから加える',
      blocks: [
        { label: '文の中心', tone: 'primary' },
        { label: 'to + 動詞', tone: 'accent' },
        { label: '目的・内容', tone: 'good' },
      ],
    },
  },
  ENGLISH_G8_U06: {
    match: 'Swimming is fun. の いみは？',
    visual: {
      kind: 'sentence_blocks',
      title: '動名詞',
      note: '動作を「こと」として扱う',
      blocks: [
        { label: '動詞 + ing', tone: 'accent' },
        { label: '名詞の働き', tone: 'good' },
        { label: '文の続き', tone: 'primary' },
      ],
    },
  },
  ENGLISH_G8_U07: {
    match: 'Because it was rainy, we stayed home. の いみは？',
    visual: {
      kind: 'sentence_blocks',
      title: '接続詞で文をつなぐ',
      blocks: [
        { label: '理由・前半', tone: 'secondary' },
        { label: '接続の役割', tone: 'accent' },
        { label: '結果・後半', tone: 'good' },
      ],
    },
  },
  ENGLISH_G8_U08: {
    match: 'This smartphone is more useful than that one. の いみは？',
    visual: { kind: 'comparison_scale', mode: 'comparative', title: '比較級' },
  },
  ENGLISH_G8_U09: {
    match: 'English is spoken in many countries. の いみは？',
    visual: {
      kind: 'sentence_blocks',
      title: '受動態の形',
      note: '「される側」を主語にする',
      blocks: [
        { label: '受け手', tone: 'primary' },
        { label: 'be動詞', tone: 'secondary' },
        { label: '過去分詞', tone: 'accent' },
        { label: 'by ...', tone: 'good' },
      ],
    },
  },
  ENGLISH_G9_U01: {
    match: 'She has lived here for five years. の いみは？',
    visual: { kind: 'tense_timeline', focus: 'present_perfect', title: '現在完了' },
  },
  ENGLISH_G9_U02: {
    match: 'He has been playing soccer since noon. の いみは？',
    visual: { kind: 'tense_timeline', focus: 'present_perfect_progressive', title: '現在完了進行形' },
  },
  ENGLISH_G9_U03: {
    match: 'The girl who is singing is my sister. の いみは？',
    visual: {
      kind: 'sentence_blocks',
      title: '関係代名詞のまとまり',
      blocks: [
        { label: '名詞', tone: 'primary' },
        { label: '関係語', tone: 'accent' },
        { label: '名詞を説明する節', tone: 'good' },
      ],
    },
  },
  ENGLISH_G9_U04: {
    match: 'I wonder what she wants. の いみは？',
    visual: {
      kind: 'sentence_blocks',
      title: '間接疑問文の語順',
      blocks: [
        { label: '導入', tone: 'secondary' },
        { label: '疑問詞', tone: 'accent' },
        { label: '主語', tone: 'primary' },
        { label: '動詞', tone: 'good' },
      ],
    },
  },
  ENGLISH_G9_U05: {
    match: 'If I had more time, I would read more books. の いみは？',
    visual: { kind: 'condition_branch', title: '仮定法の考え方' },
  },
  ENGLISH_G9_U06: {
    match: 'The homework given by the teacher was hard. の いみは？',
    visual: {
      kind: 'sentence_blocks',
      title: '分詞で名詞を説明',
      blocks: [
        { label: '名詞', tone: 'primary' },
        { label: '分詞', tone: 'accent' },
        { label: '説明のまとまり', tone: 'good' },
      ],
    },
  },
  ENGLISH_G9_U07: {
    match: 'He is one of the most famous players. の いみは？',
    visual: { kind: 'comparison_scale', mode: 'superlative', title: '比較の応用' },
  },
};

export const attachLanguageVisual = (mode: string, problems: GeneralProblem[]): GeneralProblem[] => {
  const attachment = KOKUGO_ATTACHMENTS[mode] || ENGLISH_ATTACHMENTS[mode];
  if (!attachment) return problems;
  let attached = false;
  return problems.map((problem) => {
    if (attached || problem.visual || !problem.question.includes(attachment.match)) return problem;
    attached = true;
    return { ...problem, visual: attachment.visual };
  });
};

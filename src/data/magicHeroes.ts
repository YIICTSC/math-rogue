export type MagicAttribute = '星' | '月' | '花' | '炎' | '闇' | '時' | '風' | '夢' | '光';

export interface MagicHero {
  id: string;
  index: number;
  name: string;
  attribute: MagicAttribute;
  personality: string;
  specialty: string;
  story: string;
  ability: string;
  transformedTitle: string;
  color: string;
}

export interface MagicMaleProtagonist {
  id: string;
  name: string;
  role: string;
  personality: string;
  specialty: string;
  transformedTitle: string;
  color: string;
  assetId: string;
}

export const MAGIC_HEROES: MagicHero[] = [
  { id: 'AKARI', index: 1, name: '星宮あかり', attribute: '星', personality: '前向きで仲間を鼓舞するリーダー', specialty: '国語・発表', story: '母が残した星の杖に選ばれ、学園の秘密へ踏み込む。', ability: 'スターリンク', transformedTitle: '星冠の魔法騎士', color: '#ef4444' },
  { id: 'SHIZUKU', index: 2, name: '水城しずく', attribute: '月', personality: '冷静で論理的な観察役', specialty: '数学・天文', story: '月の魔法を封じる家系の責任と自由の間で揺れる。', ability: 'ルナリフレクト', transformedTitle: '月鏡の水晶騎士', color: '#3b82f6' },
  { id: 'HIYORI', index: 3, name: '花咲ひより', attribute: '花', personality: '包容力のある優しい聞き手', specialty: '生物・保健', story: '他人の痛みを感じ取る治癒魔法と向き合う。', ability: 'ブルームヒール', transformedTitle: '命花の治癒術師', color: '#ec4899' },
  { id: 'TSUBASA', index: 4, name: '火神つばさ', attribute: '炎', personality: '勝負好きで率直な行動派', specialty: '体育・物理', story: '魔法事故を乗り越え、守るための力を学ぶ。', ability: 'フォージバースト', transformedTitle: '神鍛の炎戦士', color: '#f97316' },
  { id: 'REI', index: 5, name: '黒羽れい', attribute: '闇', personality: '厳格だが弱者を見捨てない', specialty: '日本史・古典', story: '一族の禁術と自身に刻まれた印の真実を追う。', ability: '影札結界', transformedTitle: '深紅の符術姫', color: '#a855f7' },
  { id: 'MADOKA', index: 6, name: '翠川まどか', attribute: '時', personality: '内気だが研究には情熱的', specialty: '情報・化学', story: '時間装置の事故を受け止め、失敗から進む。', ability: 'クロックリロード', transformedTitle: '時環の錬金術師', color: '#14b8a6' },
  { id: 'KOHARU', index: 7, name: '風森こはる', attribute: '風', personality: '穏やかで決断力のある守り手', specialty: '地理・環境', story: '学園地下の精霊樹を救う最後の守り手。', ability: 'ゲイルステップ', transformedTitle: '翠嵐の精霊弓士', color: '#22c55e' },
  { id: 'MIRAI', index: 8, name: '紫藤みらい', attribute: '夢', personality: '華やかで弱さを隠す表現者', specialty: '音楽・美術', story: '他人の悪夢を一人で引き受ける秘密を持つ。', ability: 'ドリームアンコール', transformedTitle: '夢幻の舞台魔術師', color: '#8b5cf6' },
  { id: 'SERA', index: 9, name: '白峰セラ', attribute: '光', personality: '素直で希望を失わない転校生', specialty: '英語・倫理', story: '異世界から来た記録者として二つの世界をつなぐ。', ability: 'セレスティアルコード', transformedTitle: '星界の光術師', color: '#eab308' },
];

export const MAGIC_MALE_PROTAGONISTS: MagicMaleProtagonist[] = [
  { id: 'REN', name: '朝霧 蓮', role: '幼なじみ', personality: '世話焼きで誠実', specialty: '風の防護・国語', transformedTitle: '蒼風の守護騎士', color: '#38bdf8', assetId: 'ren' },
  { id: 'SOMA', name: '御影 颯真', role: '生徒会長', personality: '完璧主義で責任感が強い', specialty: '氷の秩序・数学', transformedTitle: '氷律の執行騎士', color: '#60a5fa', assetId: 'soma' },
  { id: 'MINATO', name: '白石 湊', role: '後輩', personality: '素直な努力家', specialty: '水の治癒・生物', transformedTitle: '清流の癒術騎士', color: '#2dd4bf', assetId: 'minato' },
  { id: 'RIKU', name: '天音 理玖', role: '先輩', personality: '飄々として洞察力が高い', specialty: '時間観測・情報', transformedTitle: '時詠の観測騎士', color: '#a78bfa', assetId: 'riku' },
  { id: 'YAMATO', name: '黒瀬 大和', role: '不良少年', personality: '口は悪いが情に厚い', specialty: '炎拳・体育', transformedTitle: '紅蓮の拳闘騎士', color: '#fb7185', assetId: 'yamato' },
  { id: 'LEON', name: '神代 レオン', role: 'ライバル魔法使い', personality: '自信家で努力家', specialty: '音と幻術・音楽', transformedTitle: '幻奏の舞台騎士', color: '#c084fc', assetId: 'leon' },
  { id: 'ELLIOT', name: 'エリオット・ノクス', role: '謎の転校生', personality: '礼儀正しく秘密主義', specialty: '星界魔法・英語', transformedTitle: '星界の記録騎士', color: '#facc15', assetId: 'elliot' },
  { id: 'SAKUYA', name: '九条 朔夜', role: '敵幹部', personality: '冷徹に見えて葛藤を持つ', specialty: '闇と封印・歴史', transformedTitle: '宵闇の封印騎士', color: '#f43f5e', assetId: 'sakuya' },
];

export const isMagicMaleProtagonist = (id: string | undefined) =>
  MAGIC_MALE_PROTAGONISTS.some((entry) => entry.id === id);

export const getMagicHeroSprite = (hero: MagicHero, transformed: boolean, action: 'idle' | 'attack' | 'skill' = 'idle') => {
  const folder = action === 'idle' ? 'characters' : `characters-${action}`;
  const form = transformed ? 'after' : 'before';
  return `sprites/magic/${folder}/heroine-${String(hero.index).padStart(2, '0')}-${form}.png`;
};

export interface RomanceTarget {
  id: string;
  name: string;
  role: string;
  personality: string;
  specialty: string;
  color: string;
}

export const ROMANCE_TARGETS: RomanceTarget[] = [
  { id: 'REN', name: '朝霧 蓮', role: '幼なじみ', personality: '世話焼きで誠実', specialty: '風の防護・国語', color: '#38bdf8' },
  { id: 'SOMA', name: '御影 颯真', role: '生徒会長', personality: '完璧主義で責任感が強い', specialty: '氷の秩序・数学', color: '#60a5fa' },
  { id: 'MINATO', name: '白石 湊', role: '後輩', personality: '素直な努力家', specialty: '水の治癒・生物', color: '#2dd4bf' },
  { id: 'RIKU', name: '天音 理玖', role: '先輩', personality: '飄々として洞察力が高い', specialty: '時間観測・情報', color: '#a78bfa' },
  { id: 'YAMATO', name: '黒瀬 大和', role: '不良少年', personality: '口は悪いが情に厚い', specialty: '炎拳・体育', color: '#fb7185' },
  { id: 'LEON', name: '神代 レオン', role: 'ライバル魔法使い', personality: '自信家で努力家', specialty: '音と幻術・音楽', color: '#c084fc' },
  { id: 'ELLIOT', name: 'エリオット・ノクス', role: '謎の転校生', personality: '礼儀正しく秘密主義', specialty: '星界魔法・英語', color: '#facc15' },
  { id: 'SAKUYA', name: '九条 朔夜', role: '敵幹部', personality: '冷徹に見えて葛藤を持つ', specialty: '闇と封印・歴史', color: '#f43f5e' },
];

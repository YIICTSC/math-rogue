export interface MagicEnding {
  id: string;
  name: string;
  category: 'NORMAL' | 'ROMANCE' | 'TRUE_ROMANCE' | 'FRIENDSHIP' | 'TEAM' | 'SPECIAL' | 'TRUE';
  description: string;
}

export const MAGIC_ENDINGS: MagicEnding[] = [
  { id: 'E01', name: '普通の卒業式', category: 'NORMAL', description: '使命を終え、それぞれの道へ進む。' },
  ...['蓮', '颯真', '湊', '理玖', '大和', 'レオン', 'エリオット', '朔夜'].map((name, index) => ({ id: `E${String(index + 2).padStart(2, '0')}`, name: `${name} 個別恋愛`, category: 'ROMANCE' as const, description: `${name}と卒業後の未来を選ぶ。` })),
  ...['蓮', '颯真', '湊', '理玖', '大和', 'レオン', 'エリオット', '朔夜'].map((name, index) => ({ id: `E${String(index + 10).padStart(2, '0')}`, name: `${name} 真恋愛`, category: 'TRUE_ROMANCE' as const, description: `${name}と恋と使命を両立する。` })),
  { id: 'E18', name: '親友エンド', category: 'FRIENDSHIP', description: '離れても続く親友関係を結ぶ。' },
  { id: 'E19', name: '相棒エンド', category: 'FRIENDSHIP', description: '魔法少女コンビとして活動する。' },
  { id: 'E20', name: 'チームエンド', category: 'TEAM', description: '九人で学園の守護者になる。' },
  { id: 'E21', name: 'ハーレムエンド', category: 'SPECIAL', description: '全員の合意のもと支え合う未来へ。' },
  { id: 'E22', name: '修羅場エンド', category: 'SPECIAL', description: '失った信頼を胸に一人で卒業する。' },
  { id: 'E23', name: '卒業後エンド', category: 'NORMAL', description: '魔法以外の夢も選び取る。' },
  { id: 'E24', name: '魔法少女伝説', category: 'TEAM', description: '後世に語られる守護者となる。' },
  { id: 'E25', name: '星界の扉', category: 'TRUE', description: '二つの世界を救い共存を選ぶ。' },
];

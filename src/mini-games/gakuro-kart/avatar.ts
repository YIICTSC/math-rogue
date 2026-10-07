export const AVATAR_SPECIES = [
  { id: 'human', name: '人間', icon: '🧑' }, { id: 'cat', name: '猫', icon: '🐱' },
  { id: 'dog', name: '犬', icon: '🐶' }, { id: 'rabbit', name: 'ウサギ', icon: '🐰' },
  { id: 'fox', name: 'キツネ', icon: '🦊' }, { id: 'panda', name: 'パンダ', icon: '🐼' },
  { id: 'penguin', name: 'ペンギン', icon: '🐧' }, { id: 'robot', name: 'ロボット', icon: '🤖' },
] as const;
export const AVATAR_COLORS = ['#ff657e', '#52dcff', '#ad91ff', '#ffd36b', '#58f2bf', '#ff985c', '#f4f0e5', '#35445e'];
export const BODY_COLORS = ['#ffe0bb', '#c98a61', '#754735', '#f4f0e5', '#ffae58', '#8795ac', '#ff94c3', '#70cfc1'];
export const HAIR_COLORS = ['#282032', '#71452c', '#d7a34d', '#e7edf6', '#974ec4', '#ff657e'];
export const ACCESSORIES = ['なし', 'ゴーグル', 'レーサーヘルメット', '王冠', '丸メガネ', 'スクエアメガネ', 'サングラス', 'リボン', '花かざり', 'ヘッドホン', '猫耳カチューシャ', 'ベレー帽', '星のイヤリング', 'スポーツバイザー'] as const;
export const FACE_SHAPES = ['やわらか卵型', '丸顔', 'シャープ', 'ハート型', 'スクエア'] as const;
export const FACE_STYLES = ['ナチュラル', 'ほっぺピンク', 'そばかす', '泣きぼくろ'] as const;
export const EYE_STYLES = ['ぱっちり', 'アーモンド', '切れ長', 'たれ目', 'つり目', 'まんまる'] as const;
export const EYE_COLORS = ['#78504a', '#2c6f9b', '#43856a', '#9360ac', '#b0782e', '#36384b'];
export const HAIR_STYLES = ['ショート', 'ボブ', 'ロング', 'ポニーテール', 'ツインテール', 'おだんご', 'アフロ', 'モヒカン', 'スパイキー', '七三分け', '三つ編み', 'スキンヘッド'] as const;
export const KART_SHAPES = ['スタンダード', 'フォーミュラ', 'バギー', 'スポーツカー', 'ロケット', 'ホバー', 'スクールバス', 'ピックアップ'] as const;
export const EXPRESSIONS = ['ふつう', 'にっこり', '大笑い', '真剣', '怒り顔', 'びっくり', 'ウインク', 'ねむそう'] as const;
export const EXPRESSION_ICONS = ['😐', '🙂', '😆', '😎', '😠', '😮', '😉', '😴'] as const;
export interface KartAvatar { species: number; body: number; outfit: number; hair: number; accessory: number; hairStyle: number; kart: number; expression: number; faceShape?: number; faceStyle?: number; eyeStyle?: number; eyeColor?: number }
export const defaultAvatar = (index = 0): KartAvatar => ({ species: 0, body: 0, outfit: index % AVATAR_COLORS.length, hair: 0, accessory: 0, hairStyle: 0, kart: 0, expression: 0 });
export function validAvatar(raw: unknown): raw is KartAvatar {
  if (!raw || typeof raw !== 'object') return false;
  const a = raw as KartAvatar;
  return [[a.species, AVATAR_SPECIES.length], [a.body, BODY_COLORS.length], [a.outfit, AVATAR_COLORS.length], [a.hair, HAIR_COLORS.length], [a.accessory, ACCESSORIES.length], [a.hairStyle, HAIR_STYLES.length], [a.kart, KART_SHAPES.length], [a.expression, EXPRESSIONS.length], [a.faceShape ?? 0, FACE_SHAPES.length], [a.faceStyle ?? 0, FACE_STYLES.length], [a.eyeStyle ?? 0, EYE_STYLES.length], [a.eyeColor ?? 0, EYE_COLORS.length]].every(([v, limit]) => Number.isInteger(v) && v >= 0 && v < limit);
}
export function loadAvatar(): KartAvatar {
  try { const raw = JSON.parse(localStorage.getItem('gakuro-kart-avatar-v1') || 'null'); const a = raw && typeof raw === 'object' ? { ...defaultAvatar(), ...raw } : null; return validAvatar(a) ? a : defaultAvatar(); } catch { return defaultAvatar(); }
}
export function saveAvatar(avatar: KartAvatar) { try { localStorage.setItem('gakuro-kart-avatar-v1', JSON.stringify(avatar)); } catch { /* Private browsing still permits creating a driver for this race. */ } }

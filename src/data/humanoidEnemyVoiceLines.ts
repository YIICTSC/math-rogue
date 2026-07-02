import type { VisualThemeId } from './visualThemes';

export type HumanoidEnemyVoiceTheme = Extract<VisualThemeId, 'high-school' | 'magic'>;
export type HumanoidEnemyVoiceGender = 'male' | 'female';
export type HumanoidEnemyVoiceAction = 'spawn' | 'attack' | 'defense' | 'skill' | 'damage' | 'defeat';

export interface HumanoidEnemyVoiceProfile {
  theme: HumanoidEnemyVoiceTheme;
  id: string;
  name: string;
  gender: HumanoidEnemyVoiceGender;
  speakerId: string;
  motif: string;
  lines: Record<HumanoidEnemyVoiceAction, string>;
}

interface VoiceSeed {
  id: string;
  name: string;
  gender: HumanoidEnemyVoiceGender;
  speakerId: string;
  motif: string;
}

const highSchoolSeeds: VoiceSeed[] = [
  { id: 'hs_00', name: '監督官の先輩', gender: 'male', speakerId: 'ENEMY_HS_00', motif: '監督記録' },
  { id: 'hs_01', name: '剣道部の風紀委員', gender: 'female', speakerId: 'ENEMY_HS_01', motif: '竹刀の間合い' },
  { id: 'hs_02', name: '白衣の査問官', gender: 'male', speakerId: 'ENEMY_HS_02', motif: '白衣の審問' },
  { id: 'hs_03', name: '禁書管理の書記', gender: 'male', speakerId: 'ENEMY_HS_03', motif: '禁書目録' },
  { id: 'hs_04', name: '銀髪の審査員', gender: 'female', speakerId: 'ENEMY_HS_04', motif: '銀の採点基準' },
  { id: 'hs_05', name: '鎖の執行部員', gender: 'male', speakerId: 'ENEMY_HS_05', motif: '拘束規則' },
  { id: 'hs_06', name: '赤章の副会長', gender: 'male', speakerId: 'ENEMY_HS_06', motif: '赤い議事録' },
  { id: 'hs_07', name: '実験区画の主任', gender: 'female', speakerId: 'ENEMY_HS_07', motif: '実験手順' },
  { id: 'hs_08', name: '表彰台の王子', gender: 'male', speakerId: 'ENEMY_HS_08', motif: '表彰台の威光' },
  { id: 'hs_09', name: '紅衣の監察官', gender: 'female', speakerId: 'ENEMY_HS_09', motif: '紅衣の査察' },
  { id: 'hs_10', name: '冬制服の支配者', gender: 'male', speakerId: 'ENEMY_HS_10', motif: '冬制服の号令' },
  { id: 'hs_11', name: '紫扇の評議員', gender: 'female', speakerId: 'ENEMY_HS_11', motif: '紫扇の裁定' },
  { id: 'hs_12', name: '黒翼の番長', gender: 'male', speakerId: 'ENEMY_HS_12', motif: '黒翼の威圧' },
  { id: 'hs_13', name: '校長', gender: 'male', speakerId: 'ENEMY_HS_13', motif: '校長訓示' },
  { id: 'hs_14', name: '真・校長', gender: 'male', speakerId: 'ENEMY_HS_14', motif: '最終校則' },
  { id: 'hs_15', name: '新米風紀委員', gender: 'male', speakerId: 'ENEMY_HS_15', motif: '新米巡回' },
  { id: 'hs_16', name: '竹刀の体育係', gender: 'male', speakerId: 'ENEMY_HS_16', motif: '体育館の号令' },
  { id: 'hs_17', name: '赤ペン監督生', gender: 'male', speakerId: 'ENEMY_HS_17', motif: '赤ペン採点' },
  { id: 'hs_18', name: '図書委員の番人', gender: 'male', speakerId: 'ENEMY_HS_18', motif: '静寂の書架' },
  { id: 'hs_19', name: '購買部の用心棒', gender: 'male', speakerId: 'ENEMY_HS_19', motif: '購買部の列' },
  { id: 'hs_20', name: '軽音部の刺客', gender: 'male', speakerId: 'ENEMY_HS_20', motif: '歪んだリフ' },
  { id: 'hs_21', name: 'バスケ部の壁', gender: 'male', speakerId: 'ENEMY_HS_21', motif: '鉄壁ディフェンス' },
  { id: 'hs_22', name: '化学部の実験兵', gender: 'male', speakerId: 'ENEMY_HS_22', motif: '薬品反応' },
  { id: 'hs_23', name: '新聞部の追跡者', gender: 'male', speakerId: 'ENEMY_HS_23', motif: 'スクープの追跡' },
  { id: 'hs_24', name: '生徒会の斥候', gender: 'male', speakerId: 'ENEMY_HS_24', motif: '生徒会の偵察' },
  { id: 'hs_25', name: '剣道場の門番', gender: 'male', speakerId: 'ENEMY_HS_25', motif: '道場の構え' },
  { id: 'hs_26', name: '応援団の番長', gender: 'male', speakerId: 'ENEMY_HS_26', motif: '応援団の気迫' },
  { id: 'hs_27', name: '保健委員の執行者', gender: 'male', speakerId: 'ENEMY_HS_27', motif: '保健室の処置' },
  { id: 'hs_28', name: '美術部の幻術師', gender: 'male', speakerId: 'ENEMY_HS_28', motif: '絵筆の幻術' },
  { id: 'hs_29', name: '吹奏楽部の号令手', gender: 'male', speakerId: 'ENEMY_HS_29', motif: '金管の号令' },
  { id: 'hs_30', name: '放送部の支配者', gender: 'male', speakerId: 'ENEMY_HS_30', motif: '校内放送' },
  { id: 'hs_31', name: '進路指導の補佐', gender: 'male', speakerId: 'ENEMY_HS_31', motif: '進路票の圧' },
  { id: 'hs_32', name: '数学研究会の刺客', gender: 'male', speakerId: 'ENEMY_HS_32', motif: '証明問題' },
  { id: 'hs_33', name: '白手袋の監察員', gender: 'male', speakerId: 'ENEMY_HS_33', motif: '白手袋の検査' },
  { id: 'hs_34', name: '文化祭実行委員', gender: 'male', speakerId: 'ENEMY_HS_34', motif: '文化祭進行表' },
  { id: 'hs_35', name: '風紀委員副隊長', gender: 'female', speakerId: 'ENEMY_HS_35', motif: '副隊長の指揮' },
  { id: 'hs_36', name: '剣道部の主将', gender: 'female', speakerId: 'ENEMY_HS_36', motif: '主将の一太刀' },
  { id: 'hs_37', name: '赤ペン試験官', gender: 'female', speakerId: 'ENEMY_HS_37', motif: '試験官の赤線' },
  { id: 'hs_38', name: '禁書庫の司書', gender: 'female', speakerId: 'ENEMY_HS_38', motif: '禁書庫の封印' },
  { id: 'hs_39', name: '購買部の番人', gender: 'female', speakerId: 'ENEMY_HS_39', motif: '売り切れ札' },
  { id: 'hs_40', name: '軽音部ギタリスト', gender: 'female', speakerId: 'ENEMY_HS_40', motif: 'アンプの轟音' },
  { id: 'hs_41', name: 'バスケ部エース', gender: 'female', speakerId: 'ENEMY_HS_41', motif: '速攻ドライブ' },
  { id: 'hs_42', name: '化学部の白衣兵', gender: 'female', speakerId: 'ENEMY_HS_42', motif: '白煙の実験' },
  { id: 'hs_43', name: '新聞部カメラマン', gender: 'female', speakerId: 'ENEMY_HS_43', motif: 'フラッシュ取材' },
  { id: 'hs_44', name: '生徒会の策士', gender: 'female', speakerId: 'ENEMY_HS_44', motif: '議案の罠' },
  { id: 'hs_45', name: '茶道部の令嬢', gender: 'female', speakerId: 'ENEMY_HS_45', motif: '茶室の所作' },
  { id: 'hs_46', name: '弓道部の射手', gender: 'female', speakerId: 'ENEMY_HS_46', motif: '弓道場の的' },
  { id: 'hs_47', name: '陸上部の疾走者', gender: 'female', speakerId: 'ENEMY_HS_47', motif: 'トラックの加速' },
  { id: 'hs_48', name: '演劇部の仮面役者', gender: 'female', speakerId: 'ENEMY_HS_48', motif: '仮面の台詞' },
  { id: 'hs_49', name: '電算部ハッカー', gender: 'female', speakerId: 'ENEMY_HS_49', motif: '侵入コード' },
  { id: 'hs_50', name: '天文部の予言者', gender: 'female', speakerId: 'ENEMY_HS_50', motif: '星図の予告' },
  { id: 'hs_51', name: '園芸委員の剪定者', gender: 'female', speakerId: 'ENEMY_HS_51', motif: '剪定ばさみ' },
  { id: 'hs_52', name: '試験女王', gender: 'female', speakerId: 'ENEMY_HS_52', motif: '女王の答案' },
];

const magicSeeds: VoiceSeed[] = [
  { id: 'mg_00', name: '見習い魔女の反逆者', gender: 'female', speakerId: 'ENEMY_MG_00', motif: '反逆の火花' },
  { id: 'mg_01', name: '仮面の魔法剣士', gender: 'male', speakerId: 'ENEMY_MG_01', motif: '仮面剣技' },
  { id: 'mg_02', name: 'ルーン図書委員', gender: 'male', speakerId: 'ENEMY_MG_02', motif: 'ルーン目録' },
  { id: 'mg_03', name: '水晶錬金術師', gender: 'male', speakerId: 'ENEMY_MG_03', motif: '水晶錬成' },
  { id: 'mg_04', name: '影舞台の奇術師', gender: 'male', speakerId: 'ENEMY_MG_04', motif: '影の幕' },
  { id: 'mg_05', name: '月社の祓い手', gender: 'male', speakerId: 'ENEMY_MG_05', motif: '月社の祓詞' },
  { id: 'mg_06', name: '茨庭の魔導士', gender: 'female', speakerId: 'ENEMY_MG_06', motif: '茨の結界' },
  { id: 'mg_07', name: '鐘鎧の召喚士', gender: 'male', speakerId: 'ENEMY_MG_07', motif: '鐘鎧召喚' },
  { id: 'mg_08', name: '呪い人形の操者', gender: 'male', speakerId: 'ENEMY_MG_08', motif: '人形の呪糸' },
  { id: 'mg_09', name: '炎厨房の魔法使い', gender: 'male', speakerId: 'ENEMY_MG_09', motif: '炎の厨房' },
  { id: 'mg_10', name: '重盾の魔法騎士', gender: 'male', speakerId: 'ENEMY_MG_10', motif: '重盾魔法' },
  { id: 'mg_11', name: '紙嵐の忍術士', gender: 'male', speakerId: 'ENEMY_MG_11', motif: '紙嵐忍法' },
  { id: 'mg_12', name: '鏡界の幻術師', gender: 'male', speakerId: 'ENEMY_MG_12', motif: '鏡界幻術' },
  { id: 'mg_13', name: '雷指揮のコンダクター', gender: 'male', speakerId: 'ENEMY_MG_13', motif: '雷の指揮棒' },
  { id: 'mg_14', name: '氷鏡の槍術士', gender: 'male', speakerId: 'ENEMY_MG_14', motif: '氷鏡の槍' },
  { id: 'mg_15', name: '獣面の地脈術師', gender: 'male', speakerId: 'ENEMY_MG_15', motif: '地脈の獣印' },
  { id: 'mg_16', name: '時計塔の時術師', gender: 'male', speakerId: 'ENEMY_MG_16', motif: '時計塔の時針' },
  { id: 'mg_17', name: '蝋燭の死霊学徒', gender: 'male', speakerId: 'ENEMY_MG_17', motif: '蝋燭の死霊術' },
  { id: 'mg_18', name: '星見台の弓術士', gender: 'male', speakerId: 'ENEMY_MG_18', motif: '星見の矢' },
  { id: 'mg_19', name: '禁術学園の風紀長', gender: 'male', speakerId: 'ENEMY_MG_19', motif: '禁術校則' },
  { id: 'mg_20', name: '大魔女校長', gender: 'female', speakerId: 'ENEMY_MG_20', motif: '大魔女の校則' },
  { id: 'mg_21', name: '星災の女王', gender: 'female', speakerId: 'ENEMY_MG_21', motif: '星災の王冠' },
];

const createHighSchoolLines = (seed: VoiceSeed): Record<HumanoidEnemyVoiceAction, string> => ({
  spawn: `${seed.name}、巡回開始。`,
  attack: `${seed.motif}で押し通す。`,
  defense: `${seed.motif}で守る。`,
  skill: `${seed.motif}、発令。`,
  damage: `${seed.motif}が乱れた。`,
  defeat: `${seed.motif}、記録終了。`,
});

const createMagicLines = (seed: VoiceSeed): Record<HumanoidEnemyVoiceAction, string> => ({
  spawn: `${seed.name}、詠唱開始。`,
  attack: `${seed.motif}よ、撃て。`,
  defense: `${seed.motif}で結界を。`,
  skill: `${seed.motif}、解放。`,
  damage: `${seed.motif}が揺らぐ。`,
  defeat: `${seed.motif}がほどける。`,
});

export const HUMANOID_ENEMY_VOICE_PROFILES: HumanoidEnemyVoiceProfile[] = [
  ...highSchoolSeeds.map(seed => ({ ...seed, theme: 'high-school' as const, lines: createHighSchoolLines(seed) })),
  ...magicSeeds.map(seed => ({ ...seed, theme: 'magic' as const, lines: createMagicLines(seed) })),
];

export const getHumanoidEnemyVoiceProfile = (
  theme: VisualThemeId | undefined,
  enemyName: string | undefined,
) => {
  if (theme !== 'high-school' && theme !== 'magic') return undefined;
  if (!enemyName) return undefined;
  const normalizedName = enemyName.startsWith('ボス: ') ? enemyName.slice(4) : enemyName;
  return HUMANOID_ENEMY_VOICE_PROFILES.find(profile => profile.theme === theme && profile.name === normalizedName);
};

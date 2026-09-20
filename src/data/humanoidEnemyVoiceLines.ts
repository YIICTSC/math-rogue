import type { VisualThemeId } from './visualThemes';
import { getThemedHumanoidEnemyVariant } from './visualThemes';
import type { CharacterAppearanceMode, Enemy } from '../types';

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
  voiceSet?: 'standard' | 'vacation';
  imageIndex?: number;
  role?: string;
}

export type HumanoidEnemyVoiceTarget = string | Pick<Enemy, 'name' | 'enemyType' | 'phase'>;

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

interface VacationVoiceSeed extends VoiceSeed {
  imageIndex: number;
  role: string;
}

const vacationHighSchoolSeeds: VacationVoiceSeed[] = [
  { id: 'hs_00', imageIndex: 0, name: '監督官の先輩', gender: 'male', speakerId: 'ENEMY_VACATION_HS_00', role: '浜辺の監督官', motif: 'ホイッスル巡回' },
  { id: 'hs_01', imageIndex: 1, name: '剣道部の風紀委員', gender: 'female', speakerId: 'ENEMY_VACATION_HS_01', role: '竹刀の海浜風紀委員', motif: '波打ち際の一閃' },
  { id: 'hs_02', imageIndex: 2, name: '白衣の査問官', gender: 'female', speakerId: 'ENEMY_VACATION_HS_02', role: '白衣の海洋査問官', motif: '珊瑚の検査' },
  { id: 'hs_03', imageIndex: 3, name: '禁書管理の書記', gender: 'female', speakerId: 'ENEMY_VACATION_HS_03', role: '紫帽子の浜辺司書', motif: '禁書サンバースト' },
  { id: 'hs_04', imageIndex: 4, name: '銀髪の審査員', gender: 'female', speakerId: 'ENEMY_VACATION_HS_04', role: '星印の採点官', motif: '星砂の採点' },
  { id: 'hs_05', imageIndex: 5, name: '鎖の執行部員', gender: 'male', speakerId: 'ENEMY_VACATION_HS_05', role: '赤シャツの救難隊長', motif: '救難ホイッスル' },
  { id: 'hs_06', imageIndex: 6, name: '赤章の副会長', gender: 'female', speakerId: 'ENEMY_VACATION_HS_06', role: '赤白パラソルの監督役', motif: 'パラソル号令' },
  { id: 'hs_07', imageIndex: 7, name: '実験区画の主任', gender: 'male', speakerId: 'ENEMY_VACATION_HS_07', role: '銀髪の珊瑚研究員', motif: '潮流の調合' },
  { id: 'hs_08', imageIndex: 8, name: '表彰台の王子', gender: 'male', speakerId: 'ENEMY_VACATION_HS_08', role: '波乗りの王子', motif: 'サーフボード突撃' },
  { id: 'hs_09', imageIndex: 9, name: '紅衣の監察官', gender: 'male', speakerId: 'ENEMY_VACATION_HS_09', role: '赤ジャケットの監察官', motif: 'ビーチ査察' },
  { id: 'hs_10', imageIndex: 10, name: '冬制服の支配者', gender: 'male', speakerId: 'ENEMY_VACATION_HS_10', role: '黒傘の番人', motif: '黒潮の威圧' },
  { id: 'hs_11', imageIndex: 11, name: '紫扇の評議員', gender: 'male', speakerId: 'ENEMY_VACATION_HS_11', role: '紫扇の浜辺評議員', motif: '扇の波圧' },
  { id: 'hs_12', imageIndex: 12, name: '黒翼の番長', gender: 'male', speakerId: 'ENEMY_VACATION_HS_12', role: '黒翼の浜辺執行者', motif: '黒翼ダイブ' },
  { id: 'hs_13', imageIndex: 13, name: '校長', gender: 'male', speakerId: 'ENEMY_VACATION_HS_13', role: '白服の学園案内役', motif: '海岸訓示' },
  { id: 'hs_14', imageIndex: 14, name: '真・校長', gender: 'male', speakerId: 'ENEMY_VACATION_HS_14', role: '雷雲の海浜王', motif: '稲妻の号令' },
  { id: 'hs_15', imageIndex: 15, name: '新米風紀委員', gender: 'female', speakerId: 'ENEMY_VACATION_HS_15', role: '青ジャージの救護コーチ', motif: 'リレー加速' },
  { id: 'hs_16', imageIndex: 16, name: '竹刀の体育係', gender: 'male', speakerId: 'ENEMY_VACATION_HS_16', role: '縞シャツの体育教官', motif: '竹刀コール' },
  { id: 'hs_17', imageIndex: 17, name: '赤ペン監督生', gender: 'female', speakerId: 'ENEMY_VACATION_HS_17', role: '赤髪のビーチ監督生', motif: '赤旗リード' },
  { id: 'hs_18', imageIndex: 18, name: '図書委員の番人', gender: 'female', speakerId: 'ENEMY_VACATION_HS_18', role: '白帽子の浜辺司書', motif: '灯台の読解' },
  { id: 'hs_19', imageIndex: 19, name: '購買部の用心棒', gender: 'male', speakerId: 'ENEMY_VACATION_HS_19', role: '盾持ち救難員', motif: 'シールドレスキュー' },
  { id: 'hs_20', imageIndex: 20, name: '軽音部の刺客', gender: 'male', speakerId: 'ENEMY_VACATION_HS_20', role: '仮面の浜辺ギタリスト', motif: '貝殻アンプ' },
  { id: 'hs_21', imageIndex: 21, name: 'バスケ部の壁', gender: 'male', speakerId: 'ENEMY_VACATION_HS_21', role: '砂浜バスケの切り込み役', motif: 'ビーチドライブ' },
  { id: 'hs_22', imageIndex: 22, name: '化学部の実験兵', gender: 'male', speakerId: 'ENEMY_VACATION_HS_22', role: '珊瑚装備の海洋研究員', motif: '酸素ボンベ突進' },
  { id: 'hs_23', imageIndex: 23, name: '新聞部の追跡者', gender: 'male', speakerId: 'ENEMY_VACATION_HS_23', role: '浜辺の報道カメラマン', motif: 'スクープフラッシュ' },
  { id: 'hs_24', imageIndex: 24, name: '生徒会の斥候', gender: 'female', speakerId: 'ENEMY_VACATION_HS_24', role: '地図持ち浜辺斥候', motif: '潮目スカウト' },
  { id: 'hs_25', imageIndex: 25, name: '剣道場の門番', gender: 'male', speakerId: 'ENEMY_VACATION_HS_25', role: '浜辺剣道の門番', motif: '砂浜の構え' },
  { id: 'hs_26', imageIndex: 26, name: '応援団の番長', gender: 'female', speakerId: 'ENEMY_VACATION_HS_26', role: '旗持ち応援リーダー', motif: 'サマーチア' },
  { id: 'hs_27', imageIndex: 27, name: '保健委員の執行者', gender: 'male', speakerId: 'ENEMY_VACATION_HS_27', role: '赤服の救護執行者', motif: '救護パック' },
  { id: 'hs_28', imageIndex: 28, name: '美術部の幻術師', gender: 'male', speakerId: 'ENEMY_VACATION_HS_28', role: '水彩珊瑚の幻術師', motif: '絵筆スプラッシュ' },
  { id: 'hs_29', imageIndex: 29, name: '吹奏楽部の号令手', gender: 'male', speakerId: 'ENEMY_VACATION_HS_29', role: '海軍楽隊の指揮手', motif: '金管ブラス' },
  { id: 'hs_30', imageIndex: 30, name: '放送部の支配者', gender: 'male', speakerId: 'ENEMY_VACATION_HS_30', role: 'メガホン放送役', motif: 'ビーチアナウンス' },
  { id: 'hs_31', imageIndex: 31, name: '進路指導の補佐', gender: 'male', speakerId: 'ENEMY_VACATION_HS_31', role: '白服の進路ガイド', motif: '航路マップ' },
  { id: 'hs_32', imageIndex: 32, name: '数学研究会の刺客', gender: 'male', speakerId: 'ENEMY_VACATION_HS_32', role: '数式ボード研究員', motif: '証明の波形' },
  { id: 'hs_33', imageIndex: 33, name: '白手袋の監察員', gender: 'male', speakerId: 'ENEMY_VACATION_HS_33', role: '白手袋の浜辺監察員', motif: '虫眼鏡スキャン' },
  { id: 'hs_34', imageIndex: 34, name: '文化祭実行委員', gender: 'female', speakerId: 'ENEMY_VACATION_HS_34', role: '灯籠祭の案内役', motif: '灯籠ルート' },
  { id: 'hs_35', imageIndex: 35, name: '風紀委員副隊長', gender: 'female', speakerId: 'ENEMY_VACATION_HS_35', role: '紺色の浜辺副隊長', motif: '赤き指揮棒' },
  { id: 'hs_36', imageIndex: 36, name: '剣道部の主将', gender: 'male', speakerId: 'ENEMY_VACATION_HS_36', role: '貝殻鎧の浜辺剣士', motif: 'シェルスラッシュ' },
  { id: 'hs_37', imageIndex: 37, name: '赤ペン試験官', gender: 'female', speakerId: 'ENEMY_VACATION_HS_37', role: '赤ペン試験官', motif: '赤線ジャッジ' },
  { id: 'hs_38', imageIndex: 38, name: '禁書庫の司書', gender: 'male', speakerId: 'ENEMY_VACATION_HS_38', role: '灯台書庫の番人', motif: '灯台ランタン' },
  { id: 'hs_39', imageIndex: 39, name: '購買部の番人', gender: 'male', speakerId: 'ENEMY_VACATION_HS_39', role: '仮面の貝殻盾兵', motif: 'シェルガード' },
  { id: 'hs_40', imageIndex: 40, name: '軽音部ギタリスト', gender: 'male', speakerId: 'ENEMY_VACATION_HS_40', role: '黒青ギタリスト', motif: 'サマーノイズ' },
  { id: 'hs_41', imageIndex: 41, name: 'バスケ部エース', gender: 'male', speakerId: 'ENEMY_VACATION_HS_41', role: 'ビーチバレーのエース', motif: 'スパイクサーブ' },
  { id: 'hs_42', imageIndex: 42, name: '化学部の白衣兵', gender: 'male', speakerId: 'ENEMY_VACATION_HS_42', role: '仮面の珊瑚化学兵', motif: '珊瑚リアクション' },
  { id: 'hs_43', imageIndex: 43, name: '新聞部カメラマン', gender: 'male', speakerId: 'ENEMY_VACATION_HS_43', role: 'サファリ帽の記者', motif: 'フラッシュ追跡' },
  { id: 'hs_44', imageIndex: 44, name: '生徒会の策士', gender: 'male', speakerId: 'ENEMY_VACATION_HS_44', role: '海軍旗の作戦官', motif: 'マリンシグナル' },
  { id: 'hs_45', imageIndex: 45, name: '茶道部の令嬢', gender: 'female', speakerId: 'ENEMY_VACATION_HS_45', role: '日傘の茶屋令嬢', motif: '涼風の一服' },
  { id: 'hs_46', imageIndex: 46, name: '弓道部の射手', gender: 'male', speakerId: 'ENEMY_VACATION_HS_46', role: '浜辺弓道の射手', motif: '潮風の矢' },
  { id: 'hs_47', imageIndex: 47, name: '陸上部の疾走者', gender: 'male', speakerId: 'ENEMY_VACATION_HS_47', role: '青い水泳選手', motif: 'リレースプラッシュ' },
  { id: 'hs_48', imageIndex: 48, name: '演劇部の仮面役者', gender: 'male', speakerId: 'ENEMY_VACATION_HS_48', role: '仮面舞台の浜辺役者', motif: '祭りの決め台詞' },
  { id: 'hs_49', imageIndex: 49, name: '電算部ハッカー', gender: 'male', speakerId: 'ENEMY_VACATION_HS_49', role: '海辺の電算ハッカー', motif: '侵入コード' },
  { id: 'hs_50', imageIndex: 50, name: '天文部の予言者', gender: 'male', speakerId: 'ENEMY_VACATION_HS_50', role: '星図の浜辺予言者', motif: '星砂の予告' },
  { id: 'hs_51', imageIndex: 51, name: '園芸委員の剪定者', gender: 'male', speakerId: 'ENEMY_VACATION_HS_51', role: '仮面の花園番人', motif: '珊瑚ガーデン' },
  { id: 'hs_52', imageIndex: 52, name: '試験女王', gender: 'female', speakerId: 'ENEMY_VACATION_HS_52', role: '白金の太陽女王', motif: '太陽王冠' },
];

const vacationMagicSeeds: VacationVoiceSeed[] = [
  { id: 'mg_00', imageIndex: 0, name: '見習い魔女の反逆者', gender: 'female', speakerId: 'ENEMY_VACATION_MG_00', role: '浜辺の見習い魔女', motif: 'サマーフレア' },
  { id: 'mg_01', imageIndex: 1, name: '仮面の魔法剣士', gender: 'male', speakerId: 'ENEMY_VACATION_MG_01', role: '仮面の潮騒剣士', motif: 'マリンブレード' },
  { id: 'mg_02', imageIndex: 2, name: 'ルーン図書委員', gender: 'female', speakerId: 'ENEMY_VACATION_MG_02', role: '青衣の海辺司書', motif: 'ルーンしおり' },
  { id: 'mg_03', imageIndex: 3, name: '水晶錬金術師', gender: 'female', speakerId: 'ENEMY_VACATION_MG_03', role: '珊瑚の水晶錬金術師', motif: 'コーラルミックス' },
  { id: 'mg_04', imageIndex: 4, name: '影舞台の奇術師', gender: 'male', speakerId: 'ENEMY_VACATION_MG_04', role: '紫影の浜辺奇術師', motif: 'シャドーサーカス' },
  { id: 'mg_05', imageIndex: 5, name: '月社の祓い手', gender: 'female', speakerId: 'ENEMY_VACATION_MG_05', role: '白髪の潮社祓い手', motif: '月潮の祓詞' },
  { id: 'mg_06', imageIndex: 6, name: '茨庭の魔導士', gender: 'male', speakerId: 'ENEMY_VACATION_MG_06', role: '緑海の茨庭魔導士', motif: 'シーソーンバインド' },
  { id: 'mg_07', imageIndex: 7, name: '鐘鎧の召喚士', gender: 'female', speakerId: 'ENEMY_VACATION_MG_07', role: '貝殻鎧の召喚騎士', motif: 'シェルサモン' },
  { id: 'mg_08', imageIndex: 8, name: '呪い人形の操者', gender: 'female', speakerId: 'ENEMY_VACATION_MG_08', role: '浜辺の呪い人形師', motif: 'マリンドール' },
  { id: 'mg_09', imageIndex: 9, name: '炎厨房の魔法使い', gender: 'male', speakerId: 'ENEMY_VACATION_MG_09', role: '炎厨房の夏魔法使い', motif: 'バーニングキッチン' },
  { id: 'mg_10', imageIndex: 10, name: '重盾の魔法騎士', gender: 'female', speakerId: 'ENEMY_VACATION_MG_10', role: '白金の貝殻騎士', motif: 'サンシールド' },
  { id: 'mg_11', imageIndex: 11, name: '紙嵐の忍術士', gender: 'male', speakerId: 'ENEMY_VACATION_MG_11', role: '紙札の浜辺忍術士', motif: 'ペーパータイフーン' },
  { id: 'mg_12', imageIndex: 12, name: '鏡界の幻術師', gender: 'male', speakerId: 'ENEMY_VACATION_MG_12', role: '鏡氷の海辺幻術師', motif: 'ミラーマジック' },
  { id: 'mg_13', imageIndex: 13, name: '雷指揮のコンダクター', gender: 'male', speakerId: 'ENEMY_VACATION_MG_13', role: '雷鳴の浜辺指揮者', motif: 'ライトニングビート' },
  { id: 'mg_14', imageIndex: 14, name: '氷鏡の槍術士', gender: 'male', speakerId: 'ENEMY_VACATION_MG_14', role: '氷海の槍術士', motif: 'フロストスピア' },
  { id: 'mg_15', imageIndex: 15, name: '獣面の地脈術師', gender: 'male', speakerId: 'ENEMY_VACATION_MG_15', role: '海獣面の地脈術師', motif: 'ビーストウェーブ' },
  { id: 'mg_16', imageIndex: 16, name: '時計塔の時術師', gender: 'male', speakerId: 'ENEMY_VACATION_MG_16', role: '真夏の時計塔術師', motif: 'タイムサーフ' },
  { id: 'mg_17', imageIndex: 17, name: '蝋燭の死霊学徒', gender: 'female', speakerId: 'ENEMY_VACATION_MG_17', role: '灯火の浜辺死霊術師', motif: 'キャンドルゴースト' },
  { id: 'mg_18', imageIndex: 18, name: '星見台の弓術士', gender: 'male', speakerId: 'ENEMY_VACATION_MG_18', role: '星砂の弓術士', motif: 'アストラルアロー' },
  { id: 'mg_19', imageIndex: 19, name: '禁術学園の風紀長', gender: 'female', speakerId: 'ENEMY_VACATION_MG_19', role: '浜辺の禁術風紀長', motif: 'サマールール' },
  { id: 'mg_20', imageIndex: 20, name: '大魔女校長', gender: 'female', speakerId: 'ENEMY_VACATION_MG_20', role: '大魔女バカンス校長', motif: 'グランドサマーマジック' },
  { id: 'mg_21', imageIndex: 21, name: '星災の女王', gender: 'female', speakerId: 'ENEMY_VACATION_MG_21', role: '星災の浜辺女王', motif: 'アストラルカタストロフィ' },
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

const createVacationHighSchoolLines = (seed: VacationVoiceSeed): Record<HumanoidEnemyVoiceAction, string> => ({
  spawn: `${seed.name}、真夏の防衛線に出る！`,
  attack: `${seed.motif}、全開で叩き込む！`,
  defense: `${seed.role}の鉄壁、ここで受け止める！`,
  skill: `${seed.motif}、バカンス特別技――発動！`,
  damage: `まだ沈まない！${seed.role}、反撃態勢！`,
  defeat: `浜の記録はここまでだ……！`,
});

const createVacationMagicLines = (seed: VacationVoiceSeed): Record<HumanoidEnemyVoiceAction, string> => ({
  spawn: `${seed.name}、夏の魔導戦を始める！`,
  attack: `${seed.motif}、潮騒ごと撃ち抜く！`,
  defense: `${seed.role}の結界、絶対に崩さない！`,
  skill: `${seed.motif}、サマーフォース解放！`,
  damage: `魔力はまだ燃えている！${seed.role}、再起動！`,
  defeat: `この夏の魔法が……ほどけていく……！`,
});

export const HUMANOID_ENEMY_VOICE_PROFILES: HumanoidEnemyVoiceProfile[] = [
  ...highSchoolSeeds.map(seed => ({ ...seed, theme: 'high-school' as const, lines: createHighSchoolLines(seed) })),
  ...magicSeeds.map(seed => ({ ...seed, theme: 'magic' as const, lines: createMagicLines(seed) })),
];

export const VACATION_HUMANOID_ENEMY_VOICE_PROFILES: HumanoidEnemyVoiceProfile[] = [
  ...vacationHighSchoolSeeds.map(seed => ({
    ...seed,
    theme: 'high-school' as const,
    voiceSet: 'vacation' as const,
    lines: createVacationHighSchoolLines(seed),
  })),
  ...vacationMagicSeeds.map(seed => ({
    ...seed,
    theme: 'magic' as const,
    voiceSet: 'vacation' as const,
    lines: createVacationMagicLines(seed),
  })),
];

export const getVacationHumanoidEnemyVoiceProfile = (
  theme: VisualThemeId | undefined,
  imageIndex: number | undefined,
) => {
  if (theme !== 'high-school' && theme !== 'magic') return undefined;
  if (imageIndex === undefined) return undefined;
  return VACATION_HUMANOID_ENEMY_VOICE_PROFILES.find(
    profile => profile.theme === theme && profile.imageIndex === imageIndex,
  );
};

export const getHumanoidEnemyVoiceProfile = (
  theme: VisualThemeId | undefined,
  enemyTarget: HumanoidEnemyVoiceTarget | undefined,
  appearanceMode: CharacterAppearanceMode = 'STANDARD',
) => {
  if (theme !== 'high-school' && theme !== 'magic') return undefined;
  if (!enemyTarget) return undefined;
  if (appearanceMode === 'VACATION' && typeof enemyTarget !== 'string') {
    const variant = getThemedHumanoidEnemyVariant(enemyTarget, theme);
    const vacationProfile = getVacationHumanoidEnemyVoiceProfile(theme, variant?.imageIndex);
    if (vacationProfile) return vacationProfile;
  }
  const enemyName = typeof enemyTarget === 'string' ? enemyTarget : enemyTarget.name;
  const normalizedName = enemyName.startsWith('ボス: ') ? enemyName.slice(4) : enemyName;
  return HUMANOID_ENEMY_VOICE_PROFILES.find(profile => profile.theme === theme && profile.name === normalizedName);
};

import React, { useState } from 'react';
import { GameMode, LanguageMode } from '../types';
import {
  Brain, Book, Languages, FlaskConical, Globe, MapPin,
  Home, ArrowLeft
} from 'lucide-react';
import { audioService } from '../services/audioService';
import { SUBJECT_CATEGORIES, SubjectCategoryConfig, SubjectCategoryType } from '../subjectConfig';

interface ModeSelectionScreenProps {
  onSelectMode: (mode: GameMode, modePool?: string[]) => void;
  onBack: () => void;
  languageMode: LanguageMode;
  modeMasteryMap?: Record<string, boolean>;
}

interface MathUnitOption {
  id: string;
  name: string;
  mode: string;
}

const KOKUGO_GRADE_UNITS: Record<number, MathUnitOption[]> = {
  1: [
    { id: 'J1_U01', name: 'ひらがな', mode: 'KOKUGO_G1_U01' },
    { id: 'J1_U02', name: 'ことばあつめ', mode: 'KOKUGO_G1_U02' },
    { id: 'J1_U03', name: 'のばすおん（ー）', mode: 'KOKUGO_G1_U03' },
    { id: 'J1_U04', name: 'ちいさい「っ」', mode: 'KOKUGO_G1_U04' },
    { id: 'J1_U05', name: '「は・を・へ」のつかいかた', mode: 'KOKUGO_G1_U05' },
    { id: 'J1_U06', name: 'かたかな', mode: 'KOKUGO_G1_U06' },
    { id: 'J1_U07', name: 'おはなしをよむ', mode: 'KOKUGO_G1_U07' },
    { id: 'J1_U08', name: 'せつめいぶんをよむ', mode: 'KOKUGO_G1_U08' },
    { id: 'J1_U09', name: 'ばめんをそうぞうしてよむ', mode: 'KOKUGO_G1_U09' },
    { id: 'J1_U10', name: 'たいせつなところをみつけてよむ', mode: 'KOKUGO_G1_U10' },
    { id: 'J1_U11', name: 'ぶんをかく', mode: 'KOKUGO_G1_U11' },
    { id: 'J1_U12', name: 'かんたんなにっき', mode: 'KOKUGO_G1_U12' },
    { id: 'J1_U13', name: 'おはなしをつくる', mode: 'KOKUGO_G1_U13' },
    { id: 'J1_U14', name: 'はなしをきく', mode: 'KOKUGO_G1_U14' },
    { id: 'J1_U15', name: 'じぶんのことをはなす', mode: 'KOKUGO_G1_U15' },
    { id: 'J1_U16', name: 'みんなのまえではなす', mode: 'KOKUGO_G1_U16' },
  ],
  2: [
    { id: 'J2_U01', name: 'かたかなのことば', mode: 'KOKUGO_G2_U01' },
    { id: 'J2_U02', name: '主語 と 述語', mode: 'KOKUGO_G2_U02' },
    { id: 'J2_U03', name: '文のきまり', mode: 'KOKUGO_G2_U03' },
    { id: 'J2_U04', name: '日記を書く', mode: 'KOKUGO_G2_U04' },
    { id: 'J2_U05', name: 'せつめい文を読む', mode: 'KOKUGO_G2_U05' },
    { id: 'J2_U06', name: '物語を読む', mode: 'KOKUGO_G2_U06' },
    { id: 'J2_U07', name: '大事なことを見つける', mode: 'KOKUGO_G2_U07' },
    { id: 'J2_U08', name: '手紙を書く', mode: 'KOKUGO_G2_U08' },
    { id: 'J2_U09', name: '作文を書く', mode: 'KOKUGO_G2_U09' },
    { id: 'J2_U10', name: '話を聞く', mode: 'KOKUGO_G2_U10' },
    { id: 'J2_U11', name: '順序よく話す', mode: 'KOKUGO_G2_U11' },
  ],
  3: [
    { id: 'J3_U01', name: '漢字の読み書き', mode: 'KOKUGO_G3_U01' },
    { id: 'J3_U02', name: '国語辞典の使い方', mode: 'KOKUGO_G3_U02' },
    { id: 'J3_U03', name: '段落', mode: 'KOKUGO_G3_U03' },
    { id: 'J3_U04', name: '物語文の読み取り', mode: 'KOKUGO_G3_U04' },
    { id: 'J3_U05', name: '説明文の読み取り', mode: 'KOKUGO_G3_U05' },
    { id: 'J3_U06', name: '要点をまとめる', mode: 'KOKUGO_G3_U06' },
    { id: 'J3_U07', name: '日記・作文', mode: 'KOKUGO_G3_U07' },
    { id: 'J3_U08', name: '手紙の書き方', mode: 'KOKUGO_G3_U08' },
    { id: 'J3_U09', name: '話し合い', mode: 'KOKUGO_G3_U09' },
  ],
  4: [
    { id: 'J4_U01', name: '漢字の使い方', mode: 'KOKUGO_G4_U01' },
    { id: 'J4_U02', name: '熟語', mode: 'KOKUGO_G4_U02' },
    { id: 'J4_U03', name: '国語辞典・漢字辞典', mode: 'KOKUGO_G4_U03' },
    { id: 'J4_U04', name: '段落と要旨', mode: 'KOKUGO_G4_U04' },
    { id: 'J4_U05', name: '物語文の読み取り', mode: 'KOKUGO_G4_U05' },
    { id: 'J4_U06', name: '説明文の読み取り', mode: 'KOKUGO_G4_U06' },
    { id: 'J4_U07', name: '要約', mode: 'KOKUGO_G4_U07' },
    { id: 'J4_U08', name: '意見文を書く', mode: 'KOKUGO_G4_U08' },
    { id: 'J4_U09', name: '話し合いと発表', mode: 'KOKUGO_G4_U09' },
  ],
  5: [
    { id: 'J5_U01', name: '漢字の意味と使い分け', mode: 'KOKUGO_G5_U01' },
    { id: 'J5_U02', name: '敬語', mode: 'KOKUGO_G5_U02' },
    { id: 'J5_U03', name: '物語文の読み取り', mode: 'KOKUGO_G5_U03' },
    { id: 'J5_U04', name: '説明文の読み取り', mode: 'KOKUGO_G5_U04' },
    { id: 'J5_U05', name: '要約と要旨', mode: 'KOKUGO_G5_U05' },
    { id: 'J5_U06', name: '意見文を書く', mode: 'KOKUGO_G5_U06' },
    { id: 'J5_U07', name: '報告文を書く', mode: 'KOKUGO_G5_U07' },
    { id: 'J5_U08', name: '討論', mode: 'KOKUGO_G5_U08' },
    { id: 'J5_U09', name: 'スピーチ', mode: 'KOKUGO_G5_U09' },
  ],
  6: [
    { id: 'J6_U01', name: '漢字のまとめ', mode: 'KOKUGO_G6_U01' },
    { id: 'J6_U02', name: '熟語と語句', mode: 'KOKUGO_G6_U02' },
    { id: 'J6_U03', name: '物語文の読み取り', mode: 'KOKUGO_G6_U03' },
    { id: 'J6_U04', name: '説明文の読み取り', mode: 'KOKUGO_G6_U04' },
    { id: 'J6_U05', name: '要旨と要約', mode: 'KOKUGO_G6_U05' },
    { id: 'J6_U06', name: '意見文を書く', mode: 'KOKUGO_G6_U06' },
    { id: 'J6_U07', name: '提案文を書く', mode: 'KOKUGO_G6_U07' },
    { id: 'J6_U08', name: '討論', mode: 'KOKUGO_G6_U08' },
    { id: 'J6_U09', name: 'スピーチ', mode: 'KOKUGO_G6_U09' },
    { id: 'J6_U10', name: '卒業文集', mode: 'KOKUGO_G6_U10' },
  ],
  7: [
    { id: 'J7_U01', name: '物語文の読み取り', mode: 'KOKUGO_G7_U01' },
    { id: 'J7_U02', name: '説明文の読み取り', mode: 'KOKUGO_G7_U02' },
    { id: 'J7_U03', name: '詩の読み取り', mode: 'KOKUGO_G7_U03' },
    { id: 'J7_U04', name: '古典（古文の基礎）', mode: 'KOKUGO_G7_U04' },
    { id: 'J7_U05', name: '漢文の基礎', mode: 'KOKUGO_G7_U05' },
    { id: 'J7_U06', name: '文の成分（主語・述語など）', mode: 'KOKUGO_G7_U06' },
    { id: 'J7_U07', name: '品詞', mode: 'KOKUGO_G7_U07' },
    { id: 'J7_U08', name: '漢字の読み書き', mode: 'KOKUGO_G7_U08' },
    { id: 'J7_U09', name: '要約', mode: 'KOKUGO_G7_U09' },
    { id: 'J7_U10', name: '意見文', mode: 'KOKUGO_G7_U10' },
    { id: 'J7_U11', name: 'スピーチ', mode: 'KOKUGO_G7_U11' },
    { id: 'J7_U12', name: '話し合い', mode: 'KOKUGO_G7_U12' },
  ],
  8: [
    { id: 'J8_U01', name: '物語文の読み取り', mode: 'KOKUGO_G8_U01' },
    { id: 'J8_U02', name: '説明文の読み取り', mode: 'KOKUGO_G8_U02' },
    { id: 'J8_U03', name: '詩・短歌・俳句', mode: 'KOKUGO_G8_U03' },
    { id: 'J8_U04', name: '古文（物語・随筆）', mode: 'KOKUGO_G8_U04' },
    { id: 'J8_U05', name: '漢文（訓読・故事成語）', mode: 'KOKUGO_G8_U05' },
    { id: 'J8_U06', name: '文法（品詞・活用）', mode: 'KOKUGO_G8_U06' },
    { id: 'J8_U07', name: '漢字の読み書き', mode: 'KOKUGO_G8_U07' },
    { id: 'J8_U08', name: '要約', mode: 'KOKUGO_G8_U08' },
    { id: 'J8_U09', name: '意見文', mode: 'KOKUGO_G8_U09' },
    { id: 'J8_U10', name: '発表', mode: 'KOKUGO_G8_U10' },
    { id: 'J8_U11', name: '討論', mode: 'KOKUGO_G8_U11' },
  ],
  9: [
    { id: 'J9_U01', name: '物語文の読み取り', mode: 'KOKUGO_G9_U01' },
    { id: 'J9_U02', name: '説明文の読み取り', mode: 'KOKUGO_G9_U02' },
    { id: 'J9_U03', name: '詩・短歌・俳句', mode: 'KOKUGO_G9_U03' },
    { id: 'J9_U04', name: '古文（古典文学）', mode: 'KOKUGO_G9_U04' },
    { id: 'J9_U05', name: '漢文（名文・思想）', mode: 'KOKUGO_G9_U05' },
    { id: 'J9_U06', name: '文法（文の構造）', mode: 'KOKUGO_G9_U06' },
    { id: 'J9_U07', name: '漢字の読み書き', mode: 'KOKUGO_G9_U07' },
    { id: 'J9_U08', name: '要約', mode: 'KOKUGO_G9_U08' },
    { id: 'J9_U09', name: '論説文を書く', mode: 'KOKUGO_G9_U09' },
    { id: 'J9_U10', name: 'スピーチ', mode: 'KOKUGO_G9_U10' },
    { id: 'J9_U11', name: '討論', mode: 'KOKUGO_G9_U11' },
    { id: 'J9_U12', name: '卒業論文・発表', mode: 'KOKUGO_G9_U12' },
  ],
};

const MATH_GRADE_UNITS: Record<number, MathUnitOption[]> = {
  1: [
    { id: 'G1_U01', name: 'かずとすうじ（10までの かず）', mode: 'MATH_G1_U01' },
    { id: 'G1_U02', name: 'いくつといくつ', mode: 'MATH_G1_U02' },
    { id: 'G1_U03', name: 'かたちあそび', mode: 'MATH_G1_U03' },
    { id: 'G1_U04', name: 'なんばんめ', mode: 'MATH_G1_U04' },
    { id: 'G1_U05', name: 'あわせていくつ（たしざん）', mode: 'MATH_G1_U05' },
    { id: 'G1_U06', name: 'ふえるといくつ（たしざん）', mode: 'MATH_G1_U06' },
    { id: 'G1_U07', name: 'のこりはいくつ（ひきざん）', mode: 'MATH_G1_U07' },
    { id: 'G1_U08', name: 'ちがいはいくつ（ひきざん）', mode: 'MATH_G1_U08' },
    { id: 'G1_U09', name: '20までのかず', mode: 'MATH_G1_U09' },
    { id: 'G1_U10', name: 'なんじ（とけい）', mode: 'MATH_G1_U10' },
    { id: 'G1_U11', name: 'ながさくらべ', mode: 'MATH_G1_U11' },
    { id: 'G1_U12', name: 'かさくらべ', mode: 'MATH_G1_U12' },
    { id: 'G1_U13', name: 'えぐらふ', mode: 'MATH_G1_U13' },
    { id: 'G1_U14', name: 'ひょう', mode: 'MATH_G1_U14' },
    { id: 'G1_U15', name: 'さんかくとしかく', mode: 'MATH_G1_U15' },
    { id: 'G1_U16', name: 'かたちづくり', mode: 'MATH_G1_U16' },
    { id: 'G1_U17', name: '3つのかずのけいさん', mode: 'MATH_G1_U17' },
    { id: 'G1_U18', name: 'ぶんしょうだい', mode: 'MATH_G1_U18' },
  ],
  2: [
    { id: 'G2_U01', name: '表 と グラフ', mode: 'MATH_G2_U01' },
    { id: 'G2_U02', name: 'たし算（2けた＋2けた）', mode: 'MATH_G2_U02' },
    { id: 'G2_U03', name: 'ひき算（2けた−2けた）', mode: 'MATH_G2_U03' },
    { id: 'G2_U04', name: '長さ（ものさし）', mode: 'MATH_G2_U04' },
    { id: 'G2_U05', name: '100までの 数', mode: 'MATH_G2_U05' },
    { id: 'G2_U06', name: 'かさ（リットル・デシリットル）', mode: 'MATH_G2_U06' },
    { id: 'G2_U07', name: '時こく と 時かん', mode: 'MATH_G2_U07' },
    { id: 'G2_U08', name: '3けたの 数', mode: 'MATH_G2_U08' },
    { id: 'G2_U09', name: 'かけ算（かけ算のいみ）', mode: 'MATH_G2_U09' },
    { id: 'G2_U10', name: 'かけ算（九九）', mode: 'MATH_G2_U10' },
    { id: 'G2_U11', name: 'はこの 形', mode: 'MATH_G2_U11' },
    { id: 'G2_U12', name: 'ぶんしょうだい', mode: 'MATH_G2_U12' },
  ],
  3: [
    { id: 'G3_U01', name: '表 と グラフ', mode: 'MATH_G3_U01' },
    { id: 'G3_U02', name: '大きい 数（1000より大きい数）', mode: 'MATH_G3_U02' },
    { id: 'G3_U03', name: 'たし算（3けた・4けた）', mode: 'MATH_G3_U03' },
    { id: 'G3_U04', name: 'ひき算（3けた・4けた）', mode: 'MATH_G3_U04' },
    { id: 'G3_U05', name: '時こく と 時かん', mode: 'MATH_G3_U05' },
    { id: 'G3_U06', name: '長さ（km と m）', mode: 'MATH_G3_U06' },
    { id: 'G3_U07', name: 'かけ算（2けた×1けた など）', mode: 'MATH_G3_U07' },
    { id: 'G3_U08', name: '円 と きゅう', mode: 'MATH_G3_U08' },
    { id: 'G3_U09', name: 'わり算（わり算のいみ）', mode: 'MATH_G3_U09' },
    { id: 'G3_U10', name: 'わり算（あまりのある計算）', mode: 'MATH_G3_U10' },
    { id: 'G3_U11', name: '重さ（g と kg）', mode: 'MATH_G3_U11' },
    { id: 'G3_U12', name: '小数', mode: 'MATH_G3_U12' },
    { id: 'G3_U13', name: '分数', mode: 'MATH_G3_U13' },
    { id: 'G3_U14', name: '□をつかった 式', mode: 'MATH_G3_U14' },
  ],
  4: [
    { id: 'G4_U01', name: '大きい 数（1おくまでの数）', mode: 'MATH_G4_U01' },
    { id: 'G4_U02', name: 'わり算（2けたでわる計算）', mode: 'MATH_G4_U02' },
    { id: 'G4_U03', name: '折れ線グラフ', mode: 'MATH_G4_U03' },
    { id: 'G4_U04', name: '角', mode: 'MATH_G4_U04' },
    { id: 'G4_U05', name: 'そろばん', mode: 'MATH_G4_U05' },
    { id: 'G4_U06', name: '小数', mode: 'MATH_G4_U06' },
    { id: 'G4_U07', name: '小数の たし算 と ひき算', mode: 'MATH_G4_U07' },
    { id: 'G4_U08', name: '面せき', mode: 'MATH_G4_U08' },
    { id: 'G4_U09', name: 'がい数', mode: 'MATH_G4_U09' },
    { id: 'G4_U10', name: '式 と 計算の じゅんじょ', mode: 'MATH_G4_U10' },
    { id: 'G4_U11', name: '分数', mode: 'MATH_G4_U11' },
    { id: 'G4_U12', name: '分数の たし算 と ひき算', mode: 'MATH_G4_U12' },
    { id: 'G4_U13', name: '直方体 と 立方体', mode: 'MATH_G4_U13' },
    { id: 'G4_U14', name: '変わり方', mode: 'MATH_G4_U14' },
    { id: 'G4_U15', name: '調べたことを 表 や グラフ にまとめる', mode: 'MATH_G4_U15' },
  ],
  5: [
    { id: 'G5_U01', name: '整数 と 小数', mode: 'MATH_G5_U01' },
    { id: 'G5_U02', name: '体積', mode: 'MATH_G5_U02' },
    { id: 'G5_U03', name: '小数の かけ算', mode: 'MATH_G5_U03' },
    { id: 'G5_U04', name: '小数の わり算', mode: 'MATH_G5_U04' },
    { id: 'G5_U05', name: '合同な 図形', mode: 'MATH_G5_U05' },
    { id: 'G5_U06', name: '分数 と 小数・整数', mode: 'MATH_G5_U06' },
    { id: 'G5_U07', name: '分数の たし算 と ひき算', mode: 'MATH_G5_U07' },
    { id: 'G5_U08', name: '平均', mode: 'MATH_G5_U08' },
    { id: 'G5_U09', name: '単位量あたりの 大きさ', mode: 'MATH_G5_U09' },
    { id: 'G5_U10', name: '速さ', mode: 'MATH_G5_U10' },
    { id: 'G5_U11', name: '比例', mode: 'MATH_G5_U11' },
    { id: 'G5_U12', name: '円 と 正多角形', mode: 'MATH_G5_U12' },
    { id: 'G5_U13', name: '角柱 と 円柱', mode: 'MATH_G5_U13' },
    { id: 'G5_U14', name: '割合', mode: 'MATH_G5_U14' },
    { id: 'G5_U15', name: '帯グラフ と 円グラフ', mode: 'MATH_G5_U15' },
  ],
  6: [
    { id: 'G6_U01', name: '対称な 図形', mode: 'MATH_G6_U01' },
    { id: 'G6_U02', name: '文字 と 式', mode: 'MATH_G6_U02' },
    { id: 'G6_U03', name: '分数の かけ算', mode: 'MATH_G6_U03' },
    { id: 'G6_U04', name: '分数の わり算', mode: 'MATH_G6_U04' },
    { id: 'G6_U05', name: '比 と その 利用', mode: 'MATH_G6_U05' },
    { id: 'G6_U06', name: '比例 と 反比例', mode: 'MATH_G6_U06' },
    { id: 'G6_U07', name: '拡大図 と 縮図', mode: 'MATH_G6_U07' },
    { id: 'G6_U08', name: '円の 面積', mode: 'MATH_G6_U08' },
    { id: 'G6_U09', name: '角柱 と 円柱の 体積', mode: 'MATH_G6_U09' },
    { id: 'G6_U10', name: 'およその 面積 と 体積', mode: 'MATH_G6_U10' },
    { id: 'G6_U11', name: '場合の 数', mode: 'MATH_G6_U11' },
    { id: 'G6_U12', name: '資料の 調べ方', mode: 'MATH_G6_U12' },
    { id: 'G6_U13', name: '算数の まとめ', mode: 'MATH_G6_U13' },
  ],
  7: [
    { id: 'G7_U01', name: '正の数 と 負の数', mode: 'MATH_G7_U01' },
    { id: 'G7_U02', name: '正負の数の 加法 と 減法', mode: 'MATH_G7_U02' },
    { id: 'G7_U03', name: '正負の数の 乗法 と 除法', mode: 'MATH_G7_U03' },
    { id: 'G7_U04', name: '文字式', mode: 'MATH_G7_U04' },
    { id: 'G7_U05', name: '文字式の 計算', mode: 'MATH_G7_U05' },
    { id: 'G7_U06', name: '一次方程式', mode: 'MATH_G7_U06' },
    { id: 'G7_U07', name: '一次方程式の 利用', mode: 'MATH_G7_U07' },
    { id: 'G7_U08', name: '比例 と 反比例', mode: 'MATH_G7_U08' },
    { id: 'G7_U09', name: '平面図形', mode: 'MATH_G7_U09' },
    { id: 'G7_U10', name: '空間図形', mode: 'MATH_G7_U10' },
    { id: 'G7_U11', name: '資料の 整理 と 活用', mode: 'MATH_G7_U11' },
  ],
  8: [
    { id: 'G8_U01', name: '式の計算', mode: 'MATH_G8_U01' },
    { id: 'G8_U02', name: '連立方程式', mode: 'MATH_G8_U02' },
    { id: 'G8_U03', name: '連立方程式の 利用', mode: 'MATH_G8_U03' },
    { id: 'G8_U04', name: '一次関数', mode: 'MATH_G8_U04' },
    { id: 'G8_U05', name: '図形の 性質', mode: 'MATH_G8_U05' },
    { id: 'G8_U06', name: '図形の 合同', mode: 'MATH_G8_U06' },
    { id: 'G8_U07', name: '三角形 と 四角形', mode: 'MATH_G8_U07' },
    { id: 'G8_U08', name: '確率', mode: 'MATH_G8_U08' },
    { id: 'G8_U09', name: 'データの 分析', mode: 'MATH_G8_U09' },
  ],
  9: [
    { id: 'G9_U01', name: '式の 展開 と 因数分解', mode: 'MATH_G9_U01' },
    { id: 'G9_U02', name: '平方根', mode: 'MATH_G9_U02' },
    { id: 'G9_U03', name: '二次方程式', mode: 'MATH_G9_U03' },
    { id: 'G9_U04', name: '二次方程式の 利用', mode: 'MATH_G9_U04' },
    { id: 'G9_U05', name: '関数 y=ax²', mode: 'MATH_G9_U05' },
    { id: 'G9_U06', name: '相似な 図形', mode: 'MATH_G9_U06' },
    { id: 'G9_U07', name: '三平方の 定理', mode: 'MATH_G9_U07' },
    { id: 'G9_U08', name: '円の 性質', mode: 'MATH_G9_U08' },
    { id: 'G9_U09', name: '標本調査', mode: 'MATH_G9_U09' },
  ],
};

const CATEGORY_LABELS: Record<SubjectCategoryType, string> = {
  MATH: 'けいさん',
  MATH_GRADES: 'さんすう・数学',
  KOKUGO_GRADES: 'こくご',
  KANJI: 'かんじ',
  SCIENCE: 'せいかつ・理科',
  SOCIAL: 'しゃかい',
  ENGLISH: 'えいご',
  MAP_PREF: '地図・日本',
  IT_INFO: 'ICT・情報',
};

const SUBMODE_LABELS: Record<string, string> = {
  ADD_1DIGIT: '1けたのたし算',
  ADD_1DIGIT_CARRY: 'たし算（くりあがり）',
  SUB_1DIGIT: '1けたのひき算',
  SUB_1DIGIT_BORROW: 'ひき算（くりさがり）',
  ADDITION: '2けたのたし算',
  SUBTRACTION: '2けたのひき算',
  MULTIPLICATION: 'かけ算',
  DIVISION: 'わり算',
  MIXED: 'ミックス',
  K1: '小1漢字',
  K2: '小2漢字',
  K3: '小3漢字',
  K4: '小4漢字',
  K5: '小5漢字',
  K6: '小6漢字',
  K7: '中1漢字',
  K8: '中2漢字',
  K9: '中3漢字',
  K_MIXED: 'ミックス',
  E_ES: '小学校英語',
  E_J1: '中1英語',
  E_J2: '中2英語',
  E_J3: '中3英語',
  E_MIXED: 'ミックス',
  C1: '会話 Lv1',
  C2: '会話 Lv2',
  C3: '会話 Lv3',
  C4: '会話 Lv4',
  C5: '会話 Lv5',
  MS: '地図記号',
  PF: '都道府県',
  PC: '県庁所在地',
  IT_WIN: 'Windows',
  IT_IPAD: 'iPad',
  IT_CHROME: 'Chromebook',
  IT_NET: 'スマホ・ネット',
  IT_LIT: '情報リテラシー',
  IT_PROG: 'プログラミング',
  IT_SEC: 'モラル・セキュリティ',
};

const getCategoryIcon = (id: SubjectCategoryType) => {
  switch (id) {
    case 'MATH': return <Brain size={20} />;
    case 'KOKUGO_GRADES': return <Book size={20} />;
    case 'KANJI': return <Book size={20} />;
    case 'ENGLISH': return <Languages size={20} />;
    case 'SCIENCE': return <FlaskConical size={20} />;
    case 'SOCIAL': return <Globe size={20} />;
    case 'MAP_PREF': return <MapPin size={20} />;
    default: return <Home size={20} />;
  }
};

const getCategoryClasses = (color: string) => {
  switch (color) {
    case 'emerald': return { bg: 'bg-emerald-600', hover: 'hover:bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-900' };
    case 'cyan': return { bg: 'bg-cyan-600', hover: 'hover:bg-cyan-500', text: 'text-cyan-400', border: 'border-cyan-900' };
    case 'indigo': return { bg: 'bg-indigo-600', hover: 'hover:bg-indigo-500', text: 'text-indigo-400', border: 'border-indigo-900' };
    case 'amber': return { bg: 'bg-amber-600', hover: 'hover:bg-amber-500', text: 'text-amber-400', border: 'border-amber-900' };
    case 'orange': return { bg: 'bg-orange-600', hover: 'hover:bg-orange-500', text: 'text-orange-400', border: 'border-orange-900' };
    case 'rose': return { bg: 'bg-rose-600', hover: 'hover:bg-rose-500', text: 'text-rose-400', border: 'border-rose-900' };
    default: return { bg: 'bg-slate-600', hover: 'hover:bg-slate-500', text: 'text-slate-400', border: 'border-slate-900' };
  }
};

const ModeSelectionScreen: React.FC<ModeSelectionScreenProps> = ({ onSelectMode, onBack, modeMasteryMap = {} }) => {
  const [selectedGrade, setSelectedGrade] = useState<number>(3);
  const [selectedTerm, setSelectedTerm] = useState<number>(1);
  const [selectedMathGrade, setSelectedMathGrade] = useState<number>(1);
  const [selectedMathUnitIds, setSelectedMathUnitIds] = useState<string[]>([]);

  const handleSelect = (mode: string, modePool?: string[]) => {
    audioService.playSound('select');
    onSelectMode(mode as GameMode, modePool);
  };

  const isMastered = (mode: string) => !!modeMasteryMap[mode];
  const getCategoryLabel = (id: SubjectCategoryType) => CATEGORY_LABELS[id] || id;
  const getSubLabel = (id: string, fallback: string) => SUBMODE_LABELS[id] || fallback;

  const renderMasteryPrefix = (mode: string) => {
    if (!isMastered(mode)) return null;
    return <span className="text-red-500 font-black font-sans mr-1">◎</span>;
  };

  const renderCategoryContent = (cat: SubjectCategoryConfig) => {
    const theme = getCategoryClasses(cat.color);

    if (cat.uiType === 'grid') {
      return (
        <div className={`grid ${cat.id === 'KANJI' ? 'grid-cols-3' : 'grid-cols-2'} gap-1.5`}>
          {cat.subModes.map(sub => (
            <button
              key={sub.id}
              onClick={() => handleSelect(sub.mode)}
              className="bg-slate-800 border border-slate-600 p-1.5 rounded hover:border-white transition-colors text-[10px] md:text-xs font-bold truncate"
            >
              {renderMasteryPrefix(sub.mode)}
              {getSubLabel(sub.id, sub.name)}
            </button>
          ))}
        </div>
      );
    }

    if (cat.uiType === 'grade_term') {
      if (cat.id === 'MATH_GRADES' || cat.id === 'KOKUGO_GRADES') {
        const isKokugo = cat.id === 'KOKUGO_GRADES';
        const mathUnits = isKokugo ? (KOKUGO_GRADE_UNITS[selectedMathGrade] || []) : (MATH_GRADE_UNITS[selectedMathGrade] || []);
        const selectedMathUnits = mathUnits.filter((u) => selectedMathUnitIds.includes(u.id));
        const selectedMathMode = (selectedMathUnits[0]?.mode || (isKokugo ? GameMode.KOKUGO_G1_1 : GameMode.MATH_G1_1)) as string;
        const modePool = selectedMathUnits.map((u) => u.mode);
        const canStartMath = selectedMathUnits.length > 0;
        return (
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <span className="text-[10px] text-gray-500 whitespace-nowrap mt-1">学年</span>
              <div className="flex-1 grid grid-cols-5 gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(g => (
                  <button
                    key={g}
                    onClick={() => {
                      setSelectedMathGrade(g);
                      setSelectedMathUnitIds([]);
                    }}
                    className={`p-1 rounded text-[9px] md:text-[10px] font-bold border transition-colors ${selectedMathGrade === g ? `${theme.bg} border-white text-white` : 'bg-slate-700 border-slate-600 text-gray-400'}`}
                  >
                    {g <= 6 ? `${g}年` : `中${g - 6}`}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5 max-h-44 overflow-y-auto custom-scrollbar pr-1">
              {mathUnits.map(unit => (
                <button
                  key={unit.id}
                  onClick={() => {
                    setSelectedMathUnitIds((prev) => {
                      if (prev.includes(unit.id)) {
                        return prev.filter((id) => id !== unit.id);
                      }
                      return [...prev, unit.id];
                    });
                  }}
                  className={`w-full p-1.5 rounded text-[10px] md:text-xs font-bold border text-left transition-colors ${selectedMathUnitIds.includes(unit.id) ? `${theme.bg} border-white text-white` : 'bg-slate-700 border-slate-600 text-gray-300 hover:border-slate-400'}`}
                >
                  {unit.name}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                if (!canStartMath) return;
                handleSelect(selectedMathMode, modePool);
              }}
              disabled={!canStartMath}
              className={`w-full p-2 rounded font-bold text-xs shadow-lg transition-all text-white ${canStartMath ? `${theme.bg} ${theme.hover}` : 'bg-slate-700 cursor-not-allowed opacity-50'}`}
            >
              {renderMasteryPrefix(selectedMathMode)}
              この単元ミックスで開始
            </button>
            {!canStartMath && (
              <div className="text-[10px] text-amber-300">
                {mathUnits.length > 0 ? '単元を1つ以上選ぶと開始できます' : 'この学年の国語単元はまだ未実装です'}
              </div>
            )}
          </div>
        );
      }

      const grades = (cat.id === 'SCIENCE' || cat.id === 'MATH_GRADES') ? [1, 2, 3, 4, 5, 6, 7, 8, 9] : [3, 4, 5, 6, 7, 8, 9];
      const selectedMode = (() => {
        if (cat.id === 'MATH_GRADES') return `MATH_G${selectedGrade}_${selectedTerm}`;
        if (cat.id === 'SCIENCE') return selectedGrade <= 2 ? `LIFE_${selectedGrade}_${selectedTerm}` : `SCIENCE_${selectedGrade}_${selectedTerm}`;
        return `SOCIAL_${selectedGrade}_${selectedTerm}`;
      })() as GameMode;

      return (
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <span className="text-[10px] text-gray-500 whitespace-nowrap mt-1">学年</span>
            <div className="flex-1 grid grid-cols-5 gap-1">
              {grades.map(g => (
                <button
                  key={g}
                  onClick={() => setSelectedGrade(g)}
                  className={`p-1 rounded text-[9px] md:text-[10px] font-bold border transition-colors ${selectedGrade === g ? `${theme.bg} border-white text-white` : 'bg-slate-700 border-slate-600 text-gray-400'}`}
                >
                  {g <= 6 ? `${g}年` : `中${g - 6}`}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500 whitespace-nowrap">学期</span>
            <div className="flex-1 flex gap-1">
              {[1, 2, 3].map(t => (
                <button
                  key={t}
                  onClick={() => setSelectedTerm(t)}
                  className={`flex-1 p-1 rounded text-[10px] font-bold border transition-colors ${selectedTerm === t ? `${theme.bg} border-white text-white` : 'bg-slate-700 border-slate-600 text-gray-400'}`}
                >
                  {t}学期
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => handleSelect(selectedMode)}
            className={`w-full ${theme.bg} ${theme.hover} p-2 rounded font-bold text-xs shadow-lg transition-all text-white`}
          >
            {renderMasteryPrefix(selectedMode)}
            この条件で開始
          </button>

          {cat.id === 'SOCIAL' && (
            <div className="grid grid-cols-3 gap-1 mt-2">
              {cat.subModes.filter(s => !s.id.includes('SO')).map(s => (
                <button key={s.id} onClick={() => handleSelect(s.mode)} className="bg-indigo-900/40 border border-indigo-500 p-1 rounded text-[9px] font-bold hover:bg-indigo-800 text-indigo-200">
                  {renderMasteryPrefix(s.mode)}
                  {getSubLabel(s.id, s.name)}
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (cat.uiType === 'english_mixed') {
      const words = cat.subModes.filter(s => s.id.startsWith('E_'));
      const convs = cat.subModes.filter(s => s.id.startsWith('C'));
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-1.5">
            {words.map(sub => (
              <button key={sub.id} onClick={() => handleSelect(sub.mode)} className="bg-slate-800 border border-slate-600 p-1.5 rounded hover:border-indigo-400 text-[10px] font-bold">
                {renderMasteryPrefix(sub.mode)}
                {getSubLabel(sub.id, sub.name)}
              </button>
            ))}
          </div>
          <div className="h-px bg-slate-700 my-1"></div>
          <div className="grid grid-cols-3 gap-1.5">
            {convs.map(sub => (
              <button key={sub.id} onClick={() => handleSelect(sub.mode)} className="bg-pink-900/40 border border-pink-500/50 p-1 rounded hover:bg-pink-800 text-[10px] font-bold">
                {renderMasteryPrefix(sub.mode)}
                {getSubLabel(sub.id, sub.name)}
              </button>
            ))}
            <button onClick={() => handleSelect(GameMode.ENGLISH_MIXED)} className="bg-indigo-900/60 border border-indigo-500 p-1 rounded hover:bg-indigo-800 text-[10px] font-bold">
              {renderMasteryPrefix(GameMode.ENGLISH_MIXED)}
              ミックス
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="w-full h-full bg-gray-900 flex flex-col items-center text-white p-4 overflow-y-auto custom-scrollbar">
      <div className="w-full max-w-5xl flex flex-col items-center my-auto pb-10">
        <h2 className="text-3xl font-bold mb-6 text-yellow-400 mt-4 tracking-widest">モード選択</h2>

        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SUBJECT_CATEGORIES.map(cat => {
            const theme = getCategoryClasses(cat.color);
            return (
              <div key={cat.id} className="bg-slate-800/40 p-4 rounded-xl border border-slate-700 flex flex-col shadow-xl animate-in fade-in slide-in-from-bottom-2">
                <h3 className={`text-xl font-bold ${theme.text} border-b ${theme.border} pb-2 flex items-center mb-4`}>
                  {getCategoryIcon(cat.id)}
                  <span className="ml-2">{getCategoryLabel(cat.id)}</span>
                </h3>
                <div className="flex-grow">{renderCategoryContent(cat)}</div>
              </div>
            );
          })}
        </div>

        <button onClick={onBack} className="mt-12 text-gray-400 hover:text-white underline mb-8 flex items-center gap-2">
          <ArrowLeft size={16} /> もどる
        </button>
      </div>
    </div>
  );
};

export default ModeSelectionScreen;

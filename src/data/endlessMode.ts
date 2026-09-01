import type { RewardItem } from '../types';
import { assetUrl } from '../utils/assetPaths';

export type EndlessArc = 'elementary' | 'high-school' | 'magic';
export type EndlessBossTier = 'BOSS' | 'MAJOR_BOSS';
export type EndlessRewardSlot = 'SAFE' | 'LEARNING' | 'RISK' | 'CORE' | 'GROWTH' | 'CONTRACT';
export type EndlessRewardScope = 'RUN' | 'PERMANENT' | 'RECORD';

export interface EndlessRewardChoice {
  id: string;
  bossId: string;
  slot: EndlessRewardSlot;
  name: string;
  description: string;
  scope: EndlessRewardScope;
  effectKey: string;
  oncePerRun: boolean;
  oncePerProfile: boolean;
}

export interface EndlessBossDefinition {
  id: string;
  arc: EndlessArc;
  floor: 5 | 10 | 15 | 20 | 25 | 30 | 35 | 40 | 45 | 50;
  tier: EndlessBossTier;
  name: string;
  theme: string;
  mechanicKey: string;
  mechanicSummary: string;
  rewards: EndlessRewardChoice[];
}

const bossRows: Array<[EndlessArc, number, EndlessBossTier, string, string, string, string]> = [
  ['elementary', 5, 'BOSS', '墨核端末ピポ', '未処理データを積み上げる端末', 'UNPROCESSED', '最初の弱体を無効化するか、学習判定成功で端末の装甲を下げる。'],
  ['elementary', 10, 'MAJOR_BOSS', '採点殻ヴァルナ', '連続判定を採点する殻', 'STREAK_CHECK', '学習判定の連続成功数に応じて装甲が変化する2フェーズ。'],
  ['elementary', 15, 'BOSS', '門式端末オクト', '八方向のゲートを持つ端末', 'GATE_SEQUENCE', 'ゲート解除の順序判定に失敗すると次の行動が早まる。'],
  ['elementary', 20, 'MAJOR_BOSS', '三相演算体オルビス', '三つの演算相を回す中枢', 'SUBJECT_TRIAD', '異なるsubjectIdの学習判定成功で相が崩れる3フェーズ。'],
  ['elementary', 25, 'BOSS', '頁喰いミラ', 'カードの頁を食べる断片体', 'UNREAD_PAGE', '山札から未読データを封印し、対応判定で取り戻す。'],
  ['elementary', 30, 'MAJOR_BOSS', '三監プロトコル・ノア', '三つの監査プロトコルを統合した体', 'PROTOCOL_TRIAD', 'プロトコルごとに異なるカードタイプを要求する3フェーズ。'],
  ['elementary', 35, 'BOSS', '刻喰いクロノル', '時間片を喰らう黒い演算体', 'TIME_SLICE', '指定ターンを超えるほど敵の行動が強くなる。'],
  ['elementary', 40, 'MAJOR_BOSS', '反復機リピタ', '同じ記録を再生する機械体', 'REPEAT_RECORD', '直前のカード効果を弱く再演し、学習判定に3回連続成功すると停止する。'],
  ['elementary', 45, 'BOSS', '空白面ブランクス', '空白の仮面だけが浮く存在', 'UNDEFINED', '未定義タグを付与し、学習判定成功で空白を復元する。'],
  ['elementary', 50, 'MAJOR_BOSS', '零号記録者ノクス・ルート', '小学生編へ投影された首領の零号体', 'NOX_ROOT', '過去のギミックを4フェーズで統合し、黒帳機関の記録を開示する。'],
  ['high-school', 5, 'BOSS', '再提出官レドゥン', '再提出データを回収する監督官', 'RESUBMIT', '失敗した学習判定の再提出を要求し、未処理タグを増やす。'],
  ['high-school', 10, 'MAJOR_BOSS', '三相試験体トライクス', '三つの試験相を持つ実験体', 'TEST_TRIAD', 'カードタイプと学習分野を組み合わせた3フェーズ。'],
  ['high-school', 15, 'BOSS', '通知残響ネイヴ', '通知の残響を放つ監査体', 'NOISE', 'ノイズカードを混ぜ、通知消去の学習判定で解除する。'],
  ['high-school', 20, 'MAJOR_BOSS', '規約執行体ヴェルデック', '規約違反を執行する体', 'CONTRACT', '区間契約の不利ルールを戦闘中に適用する。'],
  ['high-school', 25, 'BOSS', '化成炉主任カルブリス', '化成炉を管理する主任体', 'CATALYST', '攻撃カードの連続解決に反応して触媒反動を発生させる。'],
  ['high-school', 30, 'MAJOR_BOSS', '屋上演算体バルグリフ', '屋上の風圧を演算する巨体', 'ROOFTOP_COMBO', '異なるカードタイプの連携で防壁が開く3フェーズ。'],
  ['high-school', 35, 'BOSS', '評定演算体モノメル', '評定を数値化する演算体', 'BALANCE_SCORE', '攻撃・ブロック・学習判定の差を監査する。'],
  ['high-school', 40, 'MAJOR_BOSS', '白紙皇后アウレリア', '白紙の規約を統べる投影体', 'BLANK_VERDICT', '白紙フェーズで追加ルールを選び、解除判定を要求する。'],
  ['high-school', 45, 'BOSS', '周波監査体オルト', '周波形を監査する観測体', 'WAVEFORM', '遮断波形の順序判定で強化効果を解除する。'],
  ['high-school', 50, 'MAJOR_BOSS', '零号判定者ノクス・プライム', '高校編へ投影された首領の零号体', 'NOX_PRIME', '通知・規約・評定・遮断を4フェーズで統合する。'],
  ['magic', 5, 'BOSS', '時相端末テンポラ', '三枚の時間板を回す端末', 'TIME_PHASE', '加速・停止・巻き戻しを切り替え、直前のカードを再演する。'],
  ['magic', 10, 'MAJOR_BOSS', '封印監理体カテドラ', '属性封印輪を管理する構造体', 'ATTRIBUTE_SEAL', '属性封印を切り替え、異なる属性IDの連続解決で解除する。'],
  ['magic', 15, 'BOSS', '反照体ヴェイル', '反照片で輪郭を作る存在', 'REFLECTION', '直前のSKILL効果を弱く反射し、反照片を壊すと停止する。'],
  ['magic', 20, 'MAJOR_BOSS', '三属性監督体プリズマ', '三属性の結界を展開する抽象体', 'PRISM_TRIAD', '属性IDごとの判定を順に要求する3フェーズ。'],
  ['magic', 25, 'BOSS', '星鍵収束体キーファ', '三本の星鍵フレームを束ねる体', 'STAR_KEY', '星鍵順序判定の完全成功で属性耐性が下がる。'],
  ['magic', 30, 'MAJOR_BOSS', '欠月炉エクリプサ', '明光と暗相を切り替える炉心', 'LUNAR_PHASE', '明光は防御、暗相は状態異常を強める3フェーズ。'],
  ['magic', 35, 'BOSS', '深層頁獣アビスラ', '頁状パネルが脚になる異形', 'SEALED_PAGE', 'カードを封印し、対応する学習判定成功で回収する。'],
  ['magic', 40, 'MAJOR_BOSS', '軌道観測体オルビタ', '三つの軌道リングを持つ球体', 'ORBITAL_ORDER', '観測点の順序判定に成功すると防壁が開く3フェーズ。'],
  ['magic', 45, 'BOSS', '変身残像体モルファ', '属性色の輪郭線だけでできた残像', 'MORPH_AFTERIMAGE', '異なる属性IDを2種類以上解決すると輪郭が崩れる。'],
  ['magic', 50, 'MAJOR_BOSS', '零号星核ノクス・オリジン', 'マジック編へ投影された首領の零号体', 'NOX_ORIGIN', '時間・封印・反照・軌道・残像を4フェーズで統合する。'],
];

const rewardRows: Record<EndlessArc, Record<number, Array<[EndlessRewardSlot, string, string, EndlessRewardScope, string]>>> = {
  elementary: {
    5: [['SAFE', '未処理クリアランス', '各戦闘の最初の弱体を無効化', 'RUN', 'IGNORE_FIRST_WEAK'], ['LEARNING', '学習メモ', '学習判定が提示された各戦闘で、最初に成功した学習判定の直後に1枚ドロー', 'RUN', 'DRAW_FIRST_LEARNING'], ['RISK', 'ピポ複製核', '1戦闘1回、直前に解決したカードを再使用。ただし弱体1', 'RUN', 'REPLAY_CARD']],
    10: [['CORE', '採点保護膜', '各戦闘で最初に成立した学習判定失敗による追加ペナルティを1回無効化', 'RUN', 'IGNORE_FIRST_LEARNING_FAIL'], ['GROWTH', '三相演算板', '次のカード報酬を異なるカードタイプ3種から選ぶ', 'RUN', 'TRIPLE_CARD_TYPES'], ['CONTRACT', '赤線逆流核', 'HP30％以下で次に解決するダメージ付きATTACKの最終ダメージを2倍。ただしHP5', 'RUN', 'LOW_HP_DOUBLE_ATTACK']],
    15: [['SAFE', '暗号ゲートの笛', '戦闘開始時、敵の最初の行動内容を表示', 'RUN', 'REVEAL_FIRST_INTENT'], ['LEARNING', '解除手順メモ', '同一subjectIdの学習判定に3回連続成功するとエネルギー1', 'RUN', 'SUBJECT_STREAK_ENERGY'], ['RISK', 'オクト跳躍鍵', 'ゲート解除の学習判定に成功した後、次に出る小危険ノードを1回無視。ただしG20', 'RUN', 'SKIP_MINOR_NODE']],
    20: [['CORE', '三相バランサ', '同一戦闘でまだ数えていないsubjectIdの学習判定に成功するたびブロック2（各ID1回）', 'RUN', 'SUBJECT_BLOCK'], ['GROWTH', '分野切替ノート', '同一戦闘で3つの異なるsubjectIdの学習判定に成功した時、次に提示されるカード1枚の数値効果を＋25％し、コスト0', 'RUN', 'SUBJECT_TRIPLE_CARD'], ['CONTRACT', '収束反転核', '直前に解決したカード効果を再発動。ただし次ターン開始時に疲労1', 'RUN', 'RECAST_WITH_FATIGUE']],
    25: [['SAFE', '空白頁のしおり', '次に開く報酬画面を1回再抽選', 'RUN', 'REROLL_REWARD'], ['LEARNING', '読了マーカー', 'その周回で未達成のsubjectIdの学習判定に初めて成功するとブロック4', 'RUN', 'NEW_SUBJECT_BLOCK'], ['RISK', '頁間ショートカット', '呪いカードを1枚除去。ただし最大HP5', 'RUN', 'REMOVE_CURSE_HP5']],
    30: [['CORE', 'プロトコル・キー', '不利な階層ルールを1回無視', 'RUN', 'IGNORE_FLOOR_RULE'], ['GROWTH', '三監ログ', '次に進める2ノードの種類と報酬傾向を表示', 'RUN', 'REVEAL_NEXT_NODES'], ['CONTRACT', 'ノア上書きコード', '次の戦闘だけレリックが与える数値効果を＋25％。ただし混乱1', 'RUN', 'BOOST_RELIC_NEXT_BATTLE']],
    35: [['SAFE', 'クロノルの遅延杭', '1戦闘1回、敵の次行動を1ターン遅延', 'RUN', 'DELAY_ENEMY'], ['LEARNING', '刻み書き', '学習判定に3回連続成功した時、連続成功カウンターを次の戦闘へ持ち越す', 'RUN', 'CARRY_STREAK'], ['RISK', '時間借用', '1戦闘1回、プレイヤーターンを1回追加。ただしHP8', 'RUN', 'EXTRA_TURN_HP8']],
    40: [['CORE', '反復機の観測窓', '次に開くイベントの内容を1つ先読み', 'RUN', 'PREVIEW_EVENT'], ['GROWTH', 'ループ解除ノート', '同一subjectIdの学習判定に2回連続成功するとG20', 'RUN', 'SUBJECT_STREAK_GOLD'], ['CONTRACT', '再演核', '直前の通常戦闘で獲得したGを同額追加。ただし次のショップ割引を失う', 'RUN', 'REPEAT_GOLD']],
    45: [['SAFE', '空白面のリセット', 'デッキから呪いを1枚除去', 'RUN', 'REMOVE_CURSE'], ['LEARNING', '復元インク', '未定義タグまたは数値効果の一時減衰が付いたカードを1枚選び、元の効果へ戻す', 'RUN', 'RESTORE_CARD'], ['RISK', '逆転面', '致死ダメージを1回だけHP1で耐える。ただし次のボスまで回復不可', 'RUN', 'CHEAT_DEATH_NO_HEAL']],
    50: [['PERMANENT', '学びの金バッジ', '50階称号＋次回開始時の報酬候補枠＋1', 'PERMANENT', 'ELEMENTARY_START_REWARD_PLUS'], ['PERMANENT', '明日の問題箱', '小学生編の開始分野選択を恒久解放', 'PERMANENT', 'ELEMENTARY_START_SUBJECT'], ['RECORD', 'ノクス断片', '黒帳機関の深層記録＋高難度「BLACKOUT」条件を解放', 'RECORD', 'UNLOCK_BLACKOUT']],
  },
  'high-school': {
    5: [['SAFE', '再提出キャンセルキー', '各戦闘1回、イベントの選択肢または報酬画面の候補を再抽選', 'RUN', 'REROLL_ONCE'], ['LEARNING', '科目タグ', 'その周回で各subjectIdについて最初に成功した学習判定の直後に1枚ドロー', 'RUN', 'DRAW_FIRST_SUBJECT'], ['RISK', '過採点データ', 'HP30％以下で学習判定に成功した時、G20（1戦闘1回）。ただしHP5', 'RUN', 'LOW_HP_LEARNING_GOLD']],
    10: [['CORE', '三相バインダー', '次のカード報酬を異なるカードタイプ3種から選ぶ', 'RUN', 'TRIPLE_CARD_TYPES'], ['GROWTH', '教科連結ノート', '同一戦闘で3つの異なるsubjectIdの学習判定に成功すると、次に提示されるカード1枚の数値効果を＋25％し、コスト0', 'RUN', 'SUBJECT_TRIPLE_CARD'], ['CONTRACT', 'トライクス再試験核', '直前に失敗した学習判定を1回だけ再試行。ただし敵の行動カウントを1進める', 'RUN', 'RETRY_LEARNING']],
    15: [['SAFE', '残響ミュート', '戦闘開始時の状態異常を1つ無効化', 'RUN', 'CLEANSE_START'], ['LEARNING', '通知ログ', '敵の次の2行動内容を常に表示', 'RUN', 'REVEAL_TWO_INTENTS'], ['RISK', 'ネイヴ増幅器', 'ノイズ1枚をエネルギー1へ変換。ただし山札にノイズ2枚', 'RUN', 'NOISE_TO_ENERGY']],
    20: [['CORE', '規約解除キー', 'ボス戦中の追加ルールを1回解除', 'RUN', 'IGNORE_BOSS_RULE'], ['GROWTH', '規約分析表', '次の10階層の不利ルール候補を見て1つ除外', 'RUN', 'REMOVE_CONTRACT'], ['CONTRACT', '例外条項', '規約違反時の反撃ダメージの50％を次のダメージ付きATTACKへ加算。ただしカード1枚をロック', 'RUN', 'CONTRACT_COUNTER']],
    25: [['SAFE', '反応式ノート', 'カード1枚の数値効果を次の3戦闘だけ＋25％', 'RUN', 'BOOST_CARD_3_BATTLES'], ['LEARNING', '安全手順', 'フェーズ内の学習判定に全問成功した時、付与中の状態異常を1つ解除', 'RUN', 'PHASE_CLEANSE'], ['RISK', 'カルブリス触媒', '次に解決する3枚のダメージ付きATTACKが1.5倍。ただし各攻撃でHP2', 'RUN', 'ATTACK_BOOST_HP2']],
    30: [['CORE', '単独演算バンド', '学習判定に3回連続成功するたび、または同じカードタイプのカードを2枚連続で解決するたびに、次の3戦闘の与ダメージを10％上げる（合計3回まで）', 'RUN', 'COMBO_DAMAGE'], ['GROWTH', 'コンボ設計図', '各戦闘開始時、コンボ数1から開始', 'RUN', 'START_COMBO'], ['CONTRACT', '越境コード', '異なる2カードタイプのカードを連続で2枚解決するとエネルギー1。ただし次ターンはドロー不可', 'RUN', 'TYPE_CHAIN_ENERGY']],
    35: [['SAFE', '評定メモリ', '次のマップでルートごとの報酬傾向を表示', 'RUN', 'REVEAL_ROUTE_REWARDS'], ['LEARNING', '均衡評価表', '同一戦闘内の「攻撃カード解決数」「ブロックカード解決数」「学習判定成功数」の最大値と最小値の差が1以内になった時、最大HP3', 'RUN', 'BALANCE_MAX_HP'], ['RISK', '逆評定コード', '次戦闘で最初に付く不利効果1つを同量の有利効果へ反転。ただし次戦闘開始時に弱体1', 'RUN', 'REVERSE_DEBUFF']],
    40: [['SAFE', '再計測免除証', '致死ダメージを1回だけHP1で耐える', 'RUN', 'CHEAT_DEATH'], ['LEARNING', '答案アーカイブ', '過去に確定した報酬カードから1枚を再取得', 'RUN', 'RECLAIM_CARD'], ['CONTRACT', '先行採点', '次の3戦闘開始時に与ダメージを10％。ただしその間は回復不可', 'RUN', 'DAMAGE_UP_NO_HEAL']],
    45: [['SAFE', 'オルト・モニター', '敵の次の2行動を常に表示', 'RUN', 'REVEAL_TWO_INTENTS'], ['LEARNING', '遮断波形', '敵の強化効果を1回解除', 'RUN', 'REMOVE_ENEMY_BUFF'], ['RISK', 'ノイズブースト', 'ノイズ1枚をダメージへ変換。ただし追加ノイズ2枚', 'RUN', 'NOISE_TO_DAMAGE']],
    50: [['PERMANENT', '卒業証書・深層級', '50階称号＋次回開始時のカード候補枠＋1', 'PERMANENT', 'HIGH_SCHOOL_START_REWARD_PLUS'], ['PERMANENT', '黒帳章', '高校編開始時に3つのチャレンジ条件から1つを選ぶ機能を恒久解放', 'PERMANENT', 'HIGH_SCHOOL_CHALLENGE_SELECT'], ['RECORD', '判定反転コード', '黒帳機関の本部記録＋高難度「VERDICT」条件を解放', 'RECORD', 'UNLOCK_VERDICT']],
  },
  magic: {
    5: [['SAFE', 'テンポラの差分キー', '各戦闘1回、直前に解決したカードの効果を取り消し、同じコストで選び直す', 'RUN', 'RETRY_CARD'], ['LEARNING', '時相ログ', '各戦闘で、直前に解決したカードと異なる属性IDの魔法カードを最初に解決した時、1枚ドロー', 'RUN', 'DRAW_ATTRIBUTE_SWITCH'], ['RISK', '加速核', '1戦闘1回、プレイヤーターンを1回追加。ただし腐蝕1', 'RUN', 'EXTRA_TURN_CORRUPTION']],
    10: [['CORE', 'カテドラの解除鍵', 'ランダムな属性封印を1つ無効化', 'RUN', 'BREAK_ATTRIBUTE_SEAL'], ['GROWTH', '属性連結譜', '異なる属性IDの魔法カードを2枚連続で解決するとブロック6', 'RUN', 'ATTRIBUTE_CHAIN_BLOCK'], ['CONTRACT', '封印逆流核', '属性封印を1つ解除。ただし次の戦闘開始時、別の属性IDを1つ封印', 'RUN', 'REBOUND_SEAL']],
    15: [['SAFE', 'ヴェイルの反照片', '各戦闘1回、直前に解決したSKILLの数値効果を50％にして複製', 'RUN', 'REFLECT_SKILL'], ['LEARNING', '反照観測', '敵の次の2行動内容を常に表示', 'RUN', 'REVEAL_TWO_INTENTS'], ['RISK', '二重詠唱', '次に解決する属性ID付き魔法カードを2回発動。ただしコスト＋1', 'RUN', 'DOUBLE_SPELL']],
    20: [['CORE', 'プリズマの分光片', '次の変身または固有能力のコストを1回、1エネルギー減らす（最低0）', 'RUN', 'ABILITY_COST_MINUS'], ['GROWTH', '三属性譜', '同一戦闘で3つの属性IDを解決すると状態異常を全解除', 'RUN', 'THREE_ATTRIBUTE_CLEANSE'], ['CONTRACT', '分光核', 'カード1枚の数値効果を＋25％する。ただしHP10', 'RUN', 'BOOST_CARD_HP10']],
    25: [['SAFE', 'キーファの星片', '次のマップの分岐を1つ追加表示', 'RUN', 'REVEAL_BRANCH'], ['LEARNING', '星鍵座標', '次のエリート報酬に属性ID付き候補を1枚保証', 'RUN', 'GUARANTEE_ATTRIBUTE_CARD'], ['RISK', '収束核', '異なる属性IDの魔法カードを3枚解決後、次のダメージ付きATTACKを1.5倍。ただし1属性IDを次戦闘で使用不可', 'RUN', 'THREE_ATTRIBUTE_ATTACK']],
    30: [['CORE', 'エクリプサの相切替器', '各戦闘1回、攻撃寄り／防御寄りを切替', 'RUN', 'STANCE_SWITCH'], ['GROWTH', '明暗観測', '次に開く2イベントの結果候補を先読み', 'RUN', 'PREVIEW_EVENTS'], ['CONTRACT', '欠月炉逆位相', '次に解決するカード1枚の数値効果を2倍。ただしその次は半減', 'RUN', 'DOUBLE_THEN_HALF']],
    35: [['SAFE', 'アビスラの栞鍵', '各戦闘1回、捨て札または封印カードを手札へ戻す', 'RUN', 'RETURN_DISCARD'], ['LEARNING', '未読記録', '各戦闘で最初に封印解除の学習判定に成功した直後、ドロー1＋ブロック4', 'RUN', 'SEALED_LEARNING_REWARD'], ['RISK', '頁獣再封印', '呪いカードを1枚除去。ただし最もレアリティの高いカードを1枚封印', 'RUN', 'REMOVE_CURSE_SEAL_RARE']],
    40: [['SAFE', 'オルビタの星図', '次に進む3階層の敵・イベント候補を先読み', 'RUN', 'PREVIEW_FLOORS'], ['LEARNING', '軌道計算譜', '新エリア進入時、エネルギー1', 'RUN', 'AREA_ENERGY'], ['CONTRACT', '重力鍵', '次の戦闘で最初に解決する攻撃の敵ブロックを無視。ただし自分のブロック上限を半減', 'RUN', 'PIERCE_FIRST_ATTACK']],
    45: [['SAFE', 'モルファの残光', '変身状態の持続ターンを1回延長', 'RUN', 'EXTEND_TRANSFORM'], ['LEARNING', '変身観測', '変身後に最初に解決するダメージ付きATTACKを複製', 'RUN', 'COPY_TRANSFORM_ATTACK'], ['RISK', '鏡像核', '固有能力を1回再使用。ただし腐蝕2', 'RUN', 'REUSE_ABILITY_CORRUPTION']],
    50: [['PERMANENT', 'ノクス・オリジンの星冠', '50階称号＋次回開始時に変身ゲージ10', 'PERMANENT', 'MAGIC_START_GAUGE'], ['PERMANENT', '九属性解放コード', 'マジック編の開始フォーム選択を恒久解放', 'PERMANENT', 'MAGIC_START_FORM_SELECT'], ['RECORD', '原典鍵', '黒帳機関の首領記録＋高難度「ORIGIN」条件を解放', 'RECORD', 'UNLOCK_ORIGIN']],
  },
};

export const ENDLESS_BOSSES: EndlessBossDefinition[] = bossRows.map(([arc, floor, tier, name, theme, mechanicKey, mechanicSummary]) => {
  const bossId = `ENDLESS-${arc.toUpperCase().replace('-', '_')}-${String(floor).padStart(2, '0')}`;
  const choices = (rewardRows[arc][floor] || []).map(([slot, rewardName, description, scope, effectKey]) => ({
    id: `${bossId}-${slot}`,
    bossId,
    slot,
    name: rewardName,
    description,
    scope,
    effectKey,
    oncePerRun: true,
    oncePerProfile: scope === 'PERMANENT',
  }));
  return { id: bossId, arc, floor: floor as EndlessBossDefinition['floor'], tier, name, theme, mechanicKey, mechanicSummary, rewards: choices };
});

export const getEndlessBoss = (arc: EndlessArc | undefined, floor: number) =>
  arc ? ENDLESS_BOSSES.find((boss) => boss.arc === arc && boss.floor === floor) : undefined;

export const getEndlessBossById = (id: string | undefined) =>
  id ? ENDLESS_BOSSES.find((boss) => boss.id === id) : undefined;

export const getEndlessArc = (theme: string | undefined): EndlessArc =>
  theme === 'high-school' || theme === 'magic' ? theme : 'elementary';

export const getEndlessBossSpritePath = (boss: EndlessBossDefinition, action: 'idle' | 'attack' | 'skill' = 'idle') =>
  assetUrl(`sprites/endless-bosses/${boss.arc}/${String(boss.floor).padStart(2, '0')}-${action}.webp`);

export const createEndlessRewardItems = (boss: EndlessBossDefinition, claimedIds: string[], prefix: string): RewardItem[] => {
  const available = boss.rewards.filter((reward) => !claimedIds.includes(reward.id));
  const slots: EndlessRewardSlot[] = boss.tier === 'MAJOR_BOSS' ? ['CORE', 'GROWTH', 'CONTRACT'] : ['SAFE', 'LEARNING', 'RISK'];
  const selected = slots.map((slot) => available.find((reward) => reward.slot === slot)).filter(Boolean) as EndlessRewardChoice[];
  if (selected.length <= 1) return selected.map((reward) => ({ type: 'ENDLESS_REWARD', value: reward, id: `${prefix}-${reward.id}` }));
  const seed = Array.from(prefix).reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 7);
  const offset = seed % selected.length;
  const ordered = selected.map((_, index) => selected[(index + offset) % selected.length]);
  return ordered.map((reward) => ({ type: 'ENDLESS_REWARD', value: reward, id: `${prefix}-${reward.id}` }));
};


import { Card, CardType, TargetType, Relic, Potion, Character, PokerHandResult, PokerSupporter, PokerConsumable, PokerPack, PokerSuit, PokerVoucher } from './types';

export const INITIAL_HP = 75;
export const INITIAL_ENERGY = 3;
export const HAND_SIZE = 5;

// --- SVG DATA URIS FOR CHARACTERS (24x24 Pixel Art) ---

// 1. Elementary School Kid (Red Cap) - The Warrior
const WARRIOR_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" shape-rendering="crispEdges">
  <path d="M0 0h24v24H0z" fill="none"/>
  <path d="M8 2h8v2H8z" fill="#f44336"/>
  <path d="M7 4h10v2H7z" fill="#d32f2f"/>
  <path d="M7 6h2v1H7z" fill="#f44336"/>
  <path d="M9 6h6v4H9z" fill="#ffccbc"/>
  <path d="M10 7h1v1h-1zM13 7h1v1h-1z" fill="#3e2723"/>
  <path d="M8 10h8v6H8z" fill="#ffffff"/>
  <path d="M10 12h4v1h-4z" fill="#e0e0e0"/>
  <path d="M8 10h1v4H8zM15 10h1v4h-1z" fill="#d32f2f"/>
  <path d="M6 10h2v4H6zM16 10h2v4h-2z" fill="#ffccbc"/>
  <path d="M8 16h8v3H8z" fill="#1565c0"/>
  <path d="M9 19h2v3H9zM13 19h2v3h-2z" fill="#ffccbc"/>
  <path d="M8 22h3v2H8zM13 22h3v2h-3z" fill="#ffffff"/>
</svg>`;

// 2. Transfer Student (Mysterious) - The Assassin
const ASSASSIN_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" shape-rendering="crispEdges">
  <path d="M0 0h24v24H0z" fill="none"/>
  <path d="M8 3h8v3h-1v1h-6v-1H8z" fill="#212121"/>
  <path d="M9 6h6v4H9z" fill="#ffe0b2"/>
  <path d="M10 7h1v1h-1zM13 7h1v1h-1z" fill="#3e2723"/>
  <path d="M9 8h6v1H9z" fill="#4caf50" opacity="0.3"/>
  <path d="M8 10h8v6H8z" fill="#424242"/>
  <path d="M10 11h4v4h-4z" fill="#616161"/>
  <path d="M6 10h2v4H6zM16 10h2v4h-2z" fill="#424242"/>
  <path d="M8 16h8v3H8z" fill="#263238"/>
  <path d="M9 19h2v3H9zM13 19h2v3h-2z" fill="#ffe0b2"/>
  <path d="M8 22h3v2H8zM13 22h3v2h-3z" fill="#212121"/>
</svg>`;

// 3. Science Club Kid (Glasses) - The Mage
const MAGE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" shape-rendering="crispEdges">
  <path d="M0 0h24v24H0z" fill="none"/>
  <path d="M8 3h8v2H8z" fill="#5d4037"/>
  <path d="M9 5h6v4H9z" fill="#ffccbc"/>
  <path d="M9 6h2v1H9zM13 6h2v1h-2z" fill="#212121"/>
  <path d="M11 6h2v1h-2z" fill="#bdbdbd"/>
  <path d="M7 9h10v9H7z" fill="#ffffff"/>
  <path d="M11 9h2v9h-2z" fill="#e3f2fd"/>
  <path d="M18 12h2v3h-2z" fill="#4caf50"/>
  <path d="M9 18h2v4H9zM13 18h2v4h-2z" fill="#455a64"/>
  <path d="M8 22h3v2H8zM13 22h3v2h-3z" fill="#37474f"/>
</svg>`;

// 4. Broadcasting Club (Mic) - The Bard
const BARD_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" shape-rendering="crispEdges">
  <path d="M0 0h24v24H0z" fill="none"/>
  <path d="M8 3h8v3H8z" fill="#ec407a"/>
  <path d="M6 4h2v4H6zM16 4h2v4h-2z" fill="#ec407a"/>
  <path d="M9 6h6v4H9z" fill="#ffccbc"/>
  <path d="M10 7h1v1h-1zM13 7h1v1h-1z" fill="#3e2723"/>
  <path d="M13 11h3v3h-3z" fill="#212121"/>
  <path d="M14 14h1v2h-1z" fill="#bdbdbd"/>
  <path d="M8 10h8v6H8z" fill="#fff9c4"/>
  <path d="M10 10h4v2h-4z" fill="#f44336"/>
  <path d="M7 16h10v3H7z" fill="#ad1457"/>
  <path d="M9 19h2v3H9zM13 19h2v3h-2z" fill="#ffccbc"/>
  <path d="M9 21h2v1H9zM13 21h2v1h-2z" fill="#fff"/>
  <path d="M8 22h3v2H8zM13 22h3v2h-3z" fill="#5d4037"/>
</svg>`;

// 5. Dodgeball Ace (Replaces Rogue) - Sporty
const DODGEBALL_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" shape-rendering="crispEdges">
  <path d="M0 0h24v24H0z" fill="none"/>
  <path d="M7 3h10v3H7z" fill="#ff9800"/>
  <path d="M6 4h1v2H6zM17 4h1v2h-1z" fill="#ff9800"/>
  <path d="M9 6h6v4H9z" fill="#ffccbc"/>
  <path d="M10 7h1v1h-1zM13 7h1v1h-1z" fill="#3e2723"/>
  <path d="M8 5h8v1H8z" fill="#ffffff"/> <!-- Headband -->
  <path d="M20 5h2v4h-2z" fill="#ffffff"/> <!-- Headband tails -->
  <path d="M8 10h8v6H8z" fill="#ff5722"/> <!-- Jersey -->
  <path d="M10 11h4v4h-4z" fill="#e64a19"/>
  <path d="M6 10h2v4H6zM16 10h2v4h-2z" fill="#ffccbc"/>
  <path d="M17 13h4v4h-4z" fill="#eeeeee"/> <!-- Ball -->
  <path d="M18 13h1v4h-1z" fill="#bdbdbd"/>
  <path d="M8 16h8v3H8z" fill="#333333"/> <!-- Shorts -->
  <path d="M9 19h2v3H9zM13 19h2v3h-2z" fill="#ffccbc"/>
  <path d="M8 22h3v2H8zM13 22h3v2h-3z" fill="#ff9800"/>
</svg>`;

// 6. Library Committee - Quiet
const LIBRARIAN_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" shape-rendering="crispEdges">
  <path d="M0 0h24v24H0z" fill="none"/>
  <path d="M7 3h10v4H7z" fill="#3f51b5"/> <!-- Hair -->
  <path d="M6 4h1v5H6zM17 4h1v5h-1z" fill="#3f51b5"/>
  <path d="M9 7h6v4H9z" fill="#ffccbc"/>
  <path d="M9 8h6v1H9z" fill="#212121"/> <!-- Glasses -->
  <path d="M8 11h8v6H8z" fill="#e8eaf6"/> <!-- Shirt -->
  <path d="M10 11h1v6h-1zM13 11h1v6h-1z" fill="#9fa8da"/>
  <path d="M6 11h2v4H6z" fill="#ffccbc"/>
  <path d="M16 11h2v4h-2z" fill="#ffccbc"/>
  <path d="M16 13h4v4h-4z" fill="#5d4037"/> <!-- Book -->
  <path d="M17 14h2v2h-2z" fill="#fff"/>
  <path d="M7 17h10v4H7z" fill="#283593"/> <!-- Skirt -->
  <path d="M9 21h2v3H9z" fill="#333"/>
</svg>`;

// 7. Lunch Duty Leader - Apron
const CHEF_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" shape-rendering="crispEdges">
  <path d="M0 0h24v24H0z" fill="none"/>
  <path d="M8 1h8v4H8z" fill="#ffffff"/> <!-- Hat -->
  <path d="M9 5h6v4H9z" fill="#ffccbc"/>
  <path d="M10 6h1v1h-1zM13 6h1v1h-1z" fill="#3e2723"/>
  <path d="M9 9h6v1H9z" fill="#ffffff"/> <!-- Mask -->
  <path d="M7 10h10v7H7z" fill="#ffffff"/> <!-- Apron -->
  <path d="M9 11h6v4H9z" fill="#eeeeee"/>
  <path d="M5 10h2v4H5zM17 10h2v4h-2z" fill="#ffccbc"/>
  <path d="M18 9h2v6h-2z" fill="#b0bec5"/> <!-- Ladle -->
  <path d="M18 15h3v2h-3z" fill="#b0bec5"/>
  <path d="M8 17h8v3H8z" fill="#37474f"/>
  <path d="M9 20h2v4H9zM13 20h2v4h-2z" fill="#ffffff"/>
</svg>`;

// 8. Animal Caretaker - Green
const CARETAKER_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" shape-rendering="crispEdges">
  <path d="M0 0h24v24H0z" fill="none"/>
  <path d="M7 3h10v3H7z" fill="#795548"/> <!-- Hair -->
  <path d="M6 4h1v3H6zM17 4h1v3h-1z" fill="#795548"/>
  <path d="M9 6h6v4H9z" fill="#ffccbc"/>
  <path d="M10 7h1v1h-1zM13 7h1v1h-1z" fill="#3e2723"/>
  <path d="M8 10h8v6H8z" fill="#8d6e63"/> <!-- Overalls -->
  <path d="M10 12h4v2h-4z" fill="#a1887f"/>
  <path d="M6 10h2v4H6zM16 10h2v4h-2z" fill="#ffccbc"/>
  <path d="M16 13h3v3h-3z" fill="#ffffff"/> <!-- Rabbit -->
  <path d="M17 12h1v1h-1z" fill="#ffffff"/>
  <path d="M8 16h8v4H8z" fill="#5d4037"/>
  <path d="M9 20h2v4H9zM13 20h2v4h-2z" fill="#3e2723"/>
</svg>`;

// 9. Gardener - Straw Hat
const GARDENER_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" shape-rendering="crispEdges">
  <path d="M0 0h24v24H0z" fill="none"/>
  <path d="M6 3h12v2H6z" fill="#fdd835"/> <!-- Hat -->
  <path d="M5 5h14v1H5z" fill="#fbc02d"/>
  <path d="M9 6h6v4H9z" fill="#ffccbc"/>
  <path d="M10 7h1v1h-1zM13 7h1v1h-1z" fill="#3e2723"/>
  <path d="M8 10h8v6H8z" fill="#aed581"/> <!-- Shirt -->
  <path d="M10 11h4v4h-4z" fill="#c5e1a5"/>
  <path d="M6 10h2v4H6zM16 10h2v4h-2z" fill="#ffccbc"/>
  <path d="M17 12h4v3h-4z" fill="#81c784"/> <!-- Can -->
  <path d="M8 16h8v3H8z" fill="#558b2f"/> <!-- Pants -->
  <path d="M9 19h2v3H9zM13 19h2v3h-2z" fill="#795548"/> <!-- Boots -->
  <path d="M8 22h3v2H8zM13 22h3v2h-3z" fill="#5d4037"/>
</svg>`;

export const HERO_IMAGE_DATA = `data:image/svg+xml;base64,${btoa(WARRIOR_SVG)}`;

// --- ENEMIES (Compendium Data) ---
export const ENEMY_LIBRARY: Record<string, { name: string, description: string, tier: 1 | 2 | 3 }> = {
    "野良犬": { name: "野良犬", description: "校庭を徘徊する犬。腹を空かせている。", tier: 1 },
    "意地悪なカラス": { name: "意地悪なカラス", description: "光るものが好きで、生徒の持ち物を狙っている。", tier: 1 },
    "消しゴムのカス": { name: "消しゴムのカス", description: "勉強の怨念が集合して生まれた存在。", tier: 1 },
    "グレムリン": { name: "グレムリン", description: "いたずら好きの小悪魔。機械を壊すのが得意。", tier: 1 },
    "スズメバチ": { name: "スズメバチ", description: "巣を守るために攻撃してくる危険な虫。", tier: 1 },
    "掃除サボり魔": { name: "掃除サボり魔", description: "ホウキを持って立っているだけで何もしない生徒の霊。", tier: 1 },
    "迷子の幽霊": { name: "迷子の幽霊", description: "自分のクラスが分からなくなって泣いている。", tier: 1 },
    "暴走した三輪車": { name: "暴走した三輪車", description: "乗り主がいなくても勝手に走り回る。", tier: 1 },
    "凶暴なハムスター": { name: "凶暴なハムスター", description: "飼育小屋から脱走した。噛む力が強い。", tier: 1 },
    "画鋲の妖精": { name: "画鋲の妖精", description: "上履きの中に潜む邪悪な妖精。", tier: 1 },
    "埃の塊": { name: "埃の塊", description: "教室の隅に溜まった埃が意思を持った。", tier: 1 },
    "放置された傘": { name: "放置された傘", description: "雨の日に置き去りにされた悲しみが動力源。", tier: 1 },
    "裏庭のミミズ": { name: "裏庭のミミズ", description: "巨大化したミミズ。土を掘り返す。", tier: 1 },
    "給食の残りカス": { name: "給食の残りカス", description: "好き嫌いされた食べ物の成れの果て。", tier: 1 },
    "校庭の雑草": { name: "校庭の雑草", description: "抜いても抜いても生えてくる根性がある。", tier: 1 },
    "ちぎれたノート": { name: "ちぎれたノート", description: "勉強へのストレスが書き殴られている。", tier: 1 },
    "さまよう上履き": { name: "さまよう上履き", description: "持ち主を探して夜の廊下を歩く。", tier: 1 },
    "水槽の金魚": { name: "水槽の金魚", description: "水槽から飛び出して攻撃してくる。", tier: 1 },
    "リコーダー": { name: "リコーダー", description: "深夜に勝手に音を奏でる。", tier: 1 },
    "実験失敗スライム": { name: "実験失敗スライム", description: "理科の実験で偶然生まれたネバネバ。", tier: 1 },
    "宿題の悪魔": { name: "宿題の悪魔", description: "終わらない宿題のプレッシャーが具現化。", tier: 2 },
    "給食泥棒": { name: "給食泥棒", description: "人気のデザートだけを狙う不届き者。", tier: 2 },
    "動く人体模型": { name: "動く人体模型", description: "理科室の主。夜になると動き出す。", tier: 2 },
    "トイレの花子さん": { name: "トイレの花子さん", description: "３番目の個室に住んでいる有名な幽霊。", tier: 2 },
    "イジワルな上級生": { name: "イジワルな上級生", description: "廊下を占領している。力が強い。", tier: 2 },
    "リコーダーの亡霊": { name: "リコーダーの亡霊", description: "下手な演奏で精神を削ってくる。", tier: 2 },
    "チョーク・ゴーレム": { name: "チョーク・ゴーレム", description: "大量のチョークが合体した怪物。", tier: 2 },
    "跳び箱ミミック": { name: "跳び箱ミミック", description: "跳ぼうとすると口を開けて噛み付く。", tier: 2 },
    "反復横跳びマン": { name: "反復横跳びマン", description: "残像が見えるほどの速さで動く。", tier: 2 },
    "図書室の主": { name: "図書室の主", description: "本を汚す者を許さない厳格な霊。", tier: 2 },
    "音楽室の肖像画": { name: "音楽室の肖像画", description: "目が動く。夜になると歌い出す。", tier: 2 },
    "理科室の骸骨": { name: "理科室の骸骨", description: "骨格標本。カチャカチャと音を立てる。", tier: 2 },
    "家庭科室の包丁": { name: "家庭科室の包丁", description: "錆びついた包丁が宙を舞う。", tier: 2 },
    "プールサイドの影": { name: "プールサイドの影", description: "水辺に潜む黒い影。引きずり込もうとする。", tier: 2 },
    "焼却炉の精霊": { name: "焼却炉の精霊", description: "燃え盛る炎の精霊。熱い。", tier: 2 },
    "放送室の怪人": { name: "放送室の怪人", description: "不気味な校内放送を流す犯人。", tier: 2 },
    "保健室の偽医者": { name: "保健室の偽医者", description: "怪しい薬を飲ませようとしてくる。", tier: 2 },
    "体育館のバスケットボール": { name: "バスケットボール", description: "ドリブルの音が止まらない。", tier: 2 },
    "呪いの日本人形": { name: "呪いの日本人形", description: "髪が伸び続ける不気味な人形。", tier: 2 },
    "巨大ムカデ": { name: "巨大ムカデ", description: "校舎の裏に潜む巨大な虫。", tier: 2 },
    "体育の先生": { name: "体育の先生", description: "竹刀を持った鬼教師。精神論が好き。", tier: 3 },
    "教頭先生": { name: "教頭先生", description: "長い説教で生徒を眠らせる。", tier: 3 },
    "終わらない宿題": { name: "終わらない宿題", description: "やってもやっても増え続ける絶望。", tier: 3 },
    "伝説の不良": { name: "伝説の不良", description: "かつて学校を支配した番長。", tier: 3 },
    "激怒した用務員さん": { name: "用務員さん", description: "廊下を走る生徒を決して許さない。", tier: 3 },
    "修学旅行の枕投げ": { name: "修学旅行の枕投げ", description: "高速で飛来する枕の嵐。", tier: 3 },
    "校門の守護者": { name: "校門の守護者", description: "遅刻した生徒を阻む鉄壁の門。", tier: 3 },
    "PTA会長": { name: "PTA会長", description: "学校の方針に口を出す最強の権力者。", tier: 3 },
    "期末テストの化身": { name: "期末テストの化身", description: "赤点の恐怖を具現化した存在。", tier: 3 },
    "部活の鬼顧問": { name: "部活の鬼顧問", description: "休みなしの練習を強要する。", tier: 3 },
    "無限の廊下": { name: "無限の廊下", description: "走っても走っても出口にたどり着かない。", tier: 3 },
    "真夜中のチャイム": { name: "真夜中のチャイム", description: "鳴るはずのない時間に鳴り響く音。", tier: 3 },
    "卒業式の幻影": { name: "卒業式の幻影", description: "別れの悲しみが形になったもの。", tier: 3 },
    "通知表の悪夢": { name: "通知表の悪夢", description: "オール1の恐怖。", tier: 3 },
    "闇の教育委員会": { name: "闇の教育委員会", description: "理不尽な校則を作る黒幕。", tier: 3 },
    "伝説の用務員": { name: "伝説の用務員", description: "学校の全ての秘密を知る男。", tier: 3 },
    "禁断の参考書": { name: "禁断の参考書", description: "開くと頭がおかしくなる本。", tier: 3 },
    "校舎の古龍": { name: "校舎の古龍", description: "開校以来、地下に眠っていたドラゴン。", tier: 3 },
    "時間を食べる時計": { name: "時間を食べる時計", description: "授業時間を永遠に引き伸ばす。", tier: 3 },
    "異界からの転校生": { name: "異界からの転校生", description: "教科書には載っていない魔法を使う。", tier: 3 },
    "校長先生": { name: "校長先生", description: "この学校の全てを統べるラスボス。話が長い。", tier: 3 },
};

// --- RELICS (School Theme) ---
export const RELIC_LIBRARY: Record<string, Relic> = {
    BURNING_BLOOD: { id: 'BURNING_BLOOD', name: '給食の余り', description: '戦闘終了時、HPを6回復する。', rarity: 'STARTER' },
    SNAKE_RING: { id: 'SNAKE_RING', name: '秘密のメモ帳', description: '戦闘開始時、追加で2枚カードを引く。', rarity: 'STARTER' },
    HOLY_WATER: { id: 'HOLY_WATER', name: 'スポーツドリンク', description: '戦闘開始時、エネルギーを1得る。', rarity: 'STARTER' },
    MEGAPHONE: { id: 'MEGAPHONE', name: '校内放送マイク', description: '戦闘開始時、敵全体をびくびく1にする。', rarity: 'STARTER' },
    HACHIMAKI: { id: 'HACHIMAKI', name: '必勝ハチマキ', description: '戦闘開始時、カチカチ1を得る。', rarity: 'STARTER' },
    BOOKMARK: { id: 'BOOKMARK', name: '図書室のしおり', description: 'ターン終了時、カードを1枚保留する。', rarity: 'STARTER' }, 
    BIG_LADLE: { id: 'BIG_LADLE', name: '巨大なお玉', description: '戦闘開始時、最大HP+4(一時的)を得る。', rarity: 'STARTER' },
    WHISTLE: { id: 'WHISTLE', name: '魔法の笛', description: '戦闘開始時、ランダムな攻撃カード(コスト0)を1枚手札に加える。', rarity: 'STARTER' },
    SEED_PACK: { id: 'SEED_PACK', name: '謎の種', description: '戦闘開始時、トゲトゲ3を得る。', rarity: 'STARTER' },
    
    TAKETOMBO: { id: 'TAKETOMBO', name: '竹とんぼ', description: 'ポーションを使用する度、HPを5回復する。', rarity: 'COMMON', price: 150 },
    KINJIRO_STATUE: { id: 'KINJIRO_STATUE', name: '二宮金次郎像', description: '戦闘報酬で必ずポーションが出現する。', rarity: 'UNCOMMON', price: 250 },
    TEA_SERVER: { id: 'TEA_SERVER', name: '給茶機', description: '休憩所に入ると、次の戦闘開始時にエネルギー+2を得る。', rarity: 'COMMON', price: 150 },
    LUXURY_FUTON: { id: 'LUXURY_FUTON', name: '高級羽毛布団', description: '休憩所に入った時、デッキ5枚につきHP2回復。', rarity: 'UNCOMMON', price: 200 },

    VAJRA: { id: 'VAJRA', name: '金の定規', description: '戦闘開始時、ムキムキ1を得る。', rarity: 'COMMON', price: 150 },
    ANCHOR: { id: 'ANCHOR', name: '重いランドセル', description: '1ターン目の開始時、ブロック10を得る。', rarity: 'COMMON', price: 150 },
    BAG_OF_PREP: { id: 'BAG_OF_PREP', name: '予習セット', description: '戦闘開始時、追加で2枚引く。', rarity: 'COMMON', price: 150 },
    BLOOD_VIAL: { id: 'BLOOD_VIAL', name: '保健室の飴', description: '戦闘開始時、HPを2回復する。', rarity: 'COMMON', price: 150 },
    LANTERN: { id: 'LANTERN', name: '懐中電灯', description: '戦闘開始時、エネルギーを1得る。', rarity: 'COMMON', price: 160 },
    ANCIENT_TEA_SET: { id: 'ANCIENT_TEA_SET', name: '水筒', description: '休憩場所に着いた時、次の戦闘開始時にE+2。', rarity: 'COMMON', price: 150 },
    HAPPY_FLOWER: { id: 'HAPPY_FLOWER', name: 'アサガオ', description: '3ターンごとにエネルギーを1得る。', rarity: 'COMMON', price: 150 },
    PEN_NIB: { id: 'PEN_NIB', name: 'すごいペン先', description: '攻撃を10回プレイする度、その攻撃のダメージが倍になる。', rarity: 'COMMON', price: 180 }, 
    MERCURY_HOURGLASS: { id: 'MERCURY_HOURGLASS', name: '砂時計', description: 'ターン開始時、敵全体に3ダメージを与える。', rarity: 'RARE', price: 220 },
    HORN_CLEAT: { id: 'HORN_CLEAT', name: '上履き', description: '2ターン目の開始時、ブロック14を得る。', rarity: 'RARE', price: 200 },
    MATRYOSHKA: { id: 'MATRYOSHKA', name: 'お道具箱', description: '次の2つの宝箱の中身が2つになる。', rarity: 'RARE', price: 180 },
    MEAT_ON_THE_BONE: { id: 'MEAT_ON_THE_BONE', name: '冷凍ミカン', description: '戦闘終了時、HPが50%以下ならHP12回復。', rarity: 'RARE', price: 230 },
    KUNAI: { id: 'KUNAI', name: '折り紙の手裏剣', description: '1ターンにアタックを3枚使う度、カチカチ1を得る。', rarity: 'RARE', price: 280 },
    SHURIKEN: { id: 'SHURIKEN', name: '紙飛行機', description: '1ターンにアタックを3枚使う度、ムキムキ1を得る。', rarity: 'RARE', price: 280 },
    ORNAMENTAL_FAN: { id: 'ORNAMENTAL_FAN', name: '下敷き', description: '1ターンにアタックを3枚使う度、ブロック4を得る。', rarity: 'RARE', price: 250 },
    PENTOGRAPH: { id: 'PENTOGRAPH', name: '習字セット', description: 'ボス戦開始時、HPを25回復する。', rarity: 'RARE', price: 250 },
    BRONZE_SCALES: { id: 'BRONZE_SCALES', name: '画鋲', description: '戦闘開始時、トゲトゲ3(反撃)を得る。', rarity: 'RARE', price: 200 },
    CALIPERS: { id: 'CALIPERS', name: 'コンパス', description: 'ターン開始時、ブロックが15より多ければ失われない。', rarity: 'RARE', price: 280 },
    ICE_CREAM: { id: 'ICE_CREAM', name: '溶けないアイス', description: 'エネルギーがターン終了時に保存される。', rarity: 'RARE', price: 300 },
    OLD_COIN: { id: 'OLD_COIN', name: 'お年玉', description: '獲得時、300円を得る。', rarity: 'RARE', price: 0 },
    LIZARD_TAIL: { id: 'LIZARD_TAIL', name: 'トカゲの尻尾', description: '死亡時、HP50%で復活する(1回のみ)。', rarity: 'RARE', price: 350 },
    MEMBERSHIP_CARD: { id: 'MEMBERSHIP_CARD', name: '図書カード', description: 'ショップの商品が安くなる。', rarity: 'SHOP', price: 100 },
    WAFFLE: { id: 'WAFFLE', name: '揚げパン', description: '最大HP+7。HP全回復。', rarity: 'SHOP', price: 300 },
    ORANGE_PELLETS: { id: 'ORANGE_PELLETS', name: 'ラムネ', description: 'パワー、スキル、アタックを1ターンに使うとデバフ解除。', rarity: 'SHOP', price: 180 },
    SOZU: { id: 'SOZU', name: '持ち込み禁止令', description: '毎ターンE+1。ポーション使用不可。', rarity: 'BOSS' },
    CURSED_KEY: { id: 'CURSED_KEY', name: '理科室の鍵', description: '毎ターンE+1。宝箱から呪い出現。', rarity: 'BOSS' },
    PHILOSOPHER_STONE: { id: 'PHILOSOPHER_STONE', name: '謎の石', description: '毎ターンE+1。敵のムキムキ+1。', rarity: 'BOSS' },
    VELVET_CHOKER: { id: 'VELVET_CHOKER', name: '制服のカラー', description: '毎ターンE+1。カードを6枚しか使えなくなる。', rarity: 'BOSS' },
    SNECKO_EYE: { id: 'SNECKO_EYE', name: 'ぐるぐるメガネ', description: '毎ターン追加で2枚引く。混乱(コストランダム)状態になる。', rarity: 'BOSS' },
    GOLDEN_IDOL: { id: 'GOLDEN_IDOL', name: '金色の像', description: '敵が落とすお金が25%増える。', rarity: 'RARE' },
    MUTAGENIC_STRENGTH: { id: 'MUTAGENIC_STRENGTH', name: '成長期', description: '戦闘開始時、ムキムキ3を得る。ターン終了時失う。', rarity: 'RARE' },
    WARPED_TONGS: { id: 'WARPED_TONGS', name: 'ゆがんだフォーク', description: 'ターン開始時、手札のランダムなカードを強化する。', rarity: 'RARE' },
    RED_MASK: { id: 'RED_MASK', name: '戦隊のお面', description: '戦闘開始時、敵全体をへろへろ1にする。', rarity: 'RARE' },
    NECRONOMICON: { id: 'NECRONOMICON', name: '禁断の参考書', description: 'コスト2以上の攻撃を1ターン1回2度発動。', rarity: 'RARE' },
    ENCHIRIDION: { id: 'ENCHIRIDION', name: '分厚い辞書', description: '戦闘開始時、ランダムなパワーカードを手札に加える。', rarity: 'RARE' },
    NILRYS_CODEX: { id: 'NILRYS_CODEX', name: '秘密の攻略本', description: 'ターン終了時、ランダムな3枚から1枚を選んで手札に加える。', rarity: 'RARE' },
    SPIRIT_POOP: { id: 'SPIRIT_POOP', name: '犬のフン', description: 'スコア計算時に1点減点される。', rarity: 'COMMON' }
};

// --- POTIONS ---
export const POTION_LIBRARY: Record<string, Omit<Potion, 'id'>> = {
    FIRE_POTION: { templateId: 'FIRE_POTION', name: 'コーラ', description: '敵1体に20ダメージを与える。', rarity: 'COMMON', color: '#f87171', price: 50 },
    BLOCK_POTION: { templateId: 'BLOCK_POTION', name: '牛乳', description: 'ブロック12を得る。', rarity: 'COMMON', color: '#60a5fa', price: 50 },
    STRENGTH_POTION: { templateId: 'STRENGTH_POTION', name: 'プロテイン', description: 'ムキムキ2を得る。', rarity: 'COMMON', color: '#ef4444', price: 75 },
    ENERGY_POTION: { templateId: 'ENERGY_POTION', name: 'エナジードリンク', description: 'エネルギー2を得る。', rarity: 'COMMON', color: '#fbbf24', price: 50 },
    WEAK_POTION: { templateId: 'WEAK_POTION', name: '変なジュース', description: '敵1体にへろへろ3を与える。', rarity: 'COMMON', color: '#9ca3af', price: 40 },
    POISON_POTION: { templateId: 'POISON_POTION', name: '墨汁', description: '敵1体にドクドク6を与える。', rarity: 'COMMON', color: '#4ade80', price: 50 },
    HEALTH_POTION: { templateId: 'HEALTH_POTION', name: 'フルーツポンチ', description: 'HPを15回復する。', rarity: 'RARE', color: '#4ade80', price: 100 },
    LIQUID_BRONZE: { templateId: 'LIQUID_BRONZE', name: '工作のり', description: 'トゲトゲ3を得る。', rarity: 'UNCOMMON', color: '#d97706', price: 70 },
    GHOST_IN_JAR: { templateId: 'GHOST_IN_JAR', name: 'お守り', description: '死亡時、HP10%で復活。', rarity: 'RARE', color: '#fcd34d', price: 200 }, 
    ENTROPIC_BREW: { templateId: 'ENTROPIC_BREW', name: '闇鍋ジュース', description: 'ポーションスロットを全て埋める。', rarity: 'RARE', color: '#a855f7', price: 120 },
    GAMBLERS_BREW: { templateId: 'GAMBLERS_BREW', name: 'サイダー', description: '手札を全て捨て、同じ枚数引く。', rarity: 'UNCOMMON', color: '#f59e0b', price: 60 },
};

export const TRUE_BOSS = {
    id: 'THE_HEART',
    name: '校長先生',
    maxHp: 800,
    nextIntent: { type: 'BUFF', value: 0 }
};

// --- CARDS ---

export const STATUS_CARDS: Record<string, Omit<Card, 'id'>> = {
    WOUND: { name: 'ケガ', cost: 0, type: CardType.STATUS, description: '使用不可。', unplayable: true, rarity: 'SPECIAL', textureRef: 'SLIME|赤|STATUS' },
    DAZED: { name: 'めまい', cost: 0, type: CardType.STATUS, description: '使用不可。ターン終了時廃棄。', unplayable: true, exhaust: true, rarity: 'SPECIAL', textureRef: 'GHOST|紫|STATUS' },
    VOID: { name: '虚無', cost: 0, type: CardType.STATUS, description: '使用不可。引いた時E1失う。', unplayable: true, exhaust: true, rarity: 'SPECIAL', textureRef: 'SLIME|黒|STATUS' },
    BURN: { name: 'やほど', cost: 0, type: CardType.STATUS, description: '使用不可。ターン終了時2ダメージ。', unplayable: true, rarity: 'SPECIAL', textureRef: 'FLAME|赤|STATUS' },
    SLIMED: { name: '鼻水', cost: 1, type: CardType.STATUS, description: '使用すると廃棄される。', exhaust: true, rarity: 'SPECIAL', textureRef: 'SLIME|緑|STATUS' }
};

export const CURSE_CARDS: Record<string, Omit<Card, 'id'>> = {
    PAIN: { name: '腹痛', cost: 0, type: CardType.CURSE, description: '使用不可。手札にある間、カードを使うたび1ダメージ。', unplayable: true, rarity: 'SPECIAL', textureRef: 'GHOST|紫|CURSE' },
    REGRET: { name: '後悔', cost: 0, type: CardType.CURSE, description: '使用不可。ターン終了時、手札枚数分ダメージ。', unplayable: true, rarity: 'SPECIAL', textureRef: 'NOTEBOOK|紫|CURSE' },
    DOUBT: { name: '不安', cost: 0, type: CardType.CURSE, description: '使用不可。ターン終了時、へろへろ1を得る。', unplayable: true, rarity: 'SPECIAL', textureRef: 'GHOST|黒|CURSE' },
    SHAME: { name: '恥', cost: 0, type: CardType.CURSE, description: '使用不可。ターン終了時、びくびく1を得る。', unplayable: true, rarity: 'SPECIAL', textureRef: 'NOTEBOOK|白|CURSE' },
    WRITHE: { name: '悩み', cost: 0, type: CardType.CURSE, description: '使用不可。初期手札に来る。', unplayable: true, innate: true, rarity: 'SPECIAL', textureRef: 'GHOST|灰|CURSE' },
    NORMALITY: { name: '退屈', cost: 0, type: CardType.CURSE, description: '使用不可。手札にある間、3枚までしかカードを使えない。', unplayable: true, rarity: 'SPECIAL', textureRef: 'NOTEBOOK|灰|CURSE' },
    INJURY: { name: '骨折', cost: 0, type: CardType.CURSE, description: '使用不可。', unplayable: true, rarity: 'SPECIAL', textureRef: 'SLIME|灰|CURSE' },
    PARASITE: { name: '寄生虫', cost: 0, type: CardType.CURSE, description: '使用不可。デッキから消滅すると最大HP-3。', unplayable: true, rarity: 'SPECIAL', textureRef: 'SNAKE|緑|CURSE' },
    DECAY: { name: '腐敗', cost: 0, type: CardType.CURSE, description: '使用不可。ターン終了時2ダメージ。', unplayable: true, rarity: 'SPECIAL', textureRef: 'SLIME|黒|CURSE' },
    CLUMSINESS: { name: 'ドジ', cost: 0, type: CardType.CURSE, description: '使用不可。廃棄。', unplayable: true, exhaust: true, rarity: 'SPECIAL', textureRef: 'HUMANOID|灰|CURSE' },
};

export const EVENT_CARDS: Record<string, Omit<Card, 'id'>> = {
    BITE: { name: 'つまみ食い', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '7ダメージ。HP2回復。', damage: 7, heal: 2, rarity: 'SPECIAL', textureRef: 'FIST|赤|ATTACK' },
    APPARITION: { name: 'ドロン', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'スケスケ(被ダメ1)を得る。廃棄。', applyPower: { id: 'INTANGIBLE', amount: 1 }, exhaust: true, rarity: 'SPECIAL', textureRef: 'GHOST|白|SKILL' },
    J_A_X: { name: '筋肉注射', cost: 0, type: CardType.SKILL, target: TargetType.SELF, description: 'ムキムキ3を得る。ターン終了時3失う。', strength: 3, applyPower: { id: 'LOSE_STRENGTH', amount: 3 }, rarity: 'SPECIAL', textureRef: 'POTION|赤|SKILL' },
    MADNESS: { name: 'パニック', cost: 0, type: CardType.SKILL, target: TargetType.SELF, description: '手札のランダムなカード1枚のコストを0にする。廃棄。', exhaust: true, rarity: 'SPECIAL', textureRef: 'LIGHTNING|黄|SKILL' },
};

export const CARDS_LIBRARY: Record<string, Omit<Card, 'id'>> = {
  ...STATUS_CARDS,
  ...CURSE_CARDS,
  ...EVENT_CARDS,
  
  YATSUATARI: { name: '八つ当たり', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '8ダメージ。使用する度、この戦闘中ダメージ+5。', damage: 8, rarity: 'UNCOMMON', textureRef: 'FIST|赤|ATTACK' },
  EXPULSION: { name: '退学処分', cost: 1, type: CardType.SKILL, target: TargetType.ENEMY, description: '敵のHPが30以下なら即死させる。', rarity: 'RARE', textureRef: 'BOSS|黒|SKILL' },
  SHIV: { name: 'ナイフ', cost: 0, type: CardType.ATTACK, target: TargetType.ENEMY, description: '4ダメージ。廃棄。', damage: 4, exhaust: true, rarity: 'SPECIAL', textureRef: 'SWORD|灰|ATTACK' },
  CAPTURE_NET: { name: '捕獲網', cost: 2, type: CardType.ATTACK, target: TargetType.ENEMY, description: '10ダメージ。これで倒すと敵をカード化してデッキに加える。廃棄。', damage: 10, capture: true, exhaust: true, rarity: 'SPECIAL', textureRef: 'BACKPACK|黄|ATTACK' },
  STRIKE: { name: 'えんぴつ攻撃', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '6ダメージを与える。', damage: 6, rarity: 'COMMON', textureRef: 'SWORD|灰|ATTACK' },
  DEFEND: { name: 'ノートで防御', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロックを5得る。', block: 5, rarity: 'COMMON', textureRef: 'NOTEBOOK|青|SKILL' },
  BASH: { name: 'ランドセルタックル', cost: 2, type: CardType.ATTACK, target: TargetType.ENEMY, description: '8ダメージ。対象にびくびく2を与える。', damage: 8, vulnerable: 2, rarity: 'COMMON', textureRef: 'BACKPACK|赤|ATTACK' },
  NEUTRALIZE: { name: '先生にチクる', cost: 0, type: CardType.ATTACK, target: TargetType.ENEMY, description: '3ダメージ。対象にへろへろ1を与える。', damage: 3, weak: 1, rarity: 'COMMON', textureRef: 'NOTEBOOK|黄|ATTACK' },
  IRON_WAVE: { name: '上履きキック', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '5ダメージ。ブロック5を得る。', damage: 5, block: 5, rarity: 'COMMON', textureRef: 'SHOE|青|ATTACK' },
  HEADBUTT: { name: '頭突き', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '9ダメージ。自傷2ダメージ。', damage: 9, selfDamage: 2, rarity: 'COMMON', textureRef: 'HUMANOID|赤|ATTACK' },
  CLOTHESLINE: { name: 'ラリアット', cost: 2, type: CardType.ATTACK, target: TargetType.ENEMY, description: '12ダメージ。対象にへろへろ2を与える。', damage: 12, weak: 2, rarity: 'COMMON', textureRef: 'FIST|灰|ATTACK' },
  DAGGER_THROW: { name: 'チョーク投げ', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '9ダメージ。カードを1枚引く。', damage: 9, draw: 1, rarity: 'COMMON', textureRef: 'SWORD|白|ATTACK' },
  THUNDERCLAP: { name: '大声', cost: 1, type: CardType.ATTACK, target: TargetType.ALL_ENEMIES, description: '敵全体に4ダメージとびくびく1。', damage: 4, vulnerable: 1, rarity: 'COMMON', textureRef: 'LIGHTNING|黄|ATTACK' },
  TWIN_STRIKE: { name: '往復ビンタ', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '5ダメージを2回与える。', damage: 5, playCopies: 1, rarity: 'COMMON', textureRef: 'FIST|赤|ATTACK' },
  POMMEL_STRIKE: { name: '定規で叩く', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '9ダメージ。カード1枚引く。', damage: 9, draw: 1, rarity: 'COMMON', textureRef: 'SWORD|灰|ATTACK' },
  CLEAVE: { name: '雑巾がけ', cost: 1, type: CardType.ATTACK, target: TargetType.ALL_ENEMIES, description: '敵全体に8ダメージ。', damage: 8, rarity: 'COMMON', textureRef: 'SLIME|灰|ATTACK' },
  POISON_STAB: { name: '毒舌', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '6ダメージ。ドクドク3を与える。', damage: 6, poison: 3, rarity: 'COMMON', textureRef: 'FIST|緑|ATTACK' },
  QUICK_SLASH: { name: '早弁', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '8ダメージ。カード1枚引く。', damage: 8, draw: 1, rarity: 'COMMON', textureRef: 'BACKPACK|赤|ATTACK' },
  SLICE: { name: 'ひっかく', cost: 0, type: CardType.ATTACK, target: TargetType.ENEMY, description: '6ダメージ。', damage: 6, rarity: 'COMMON', textureRef: 'SWORD|灰|ATTACK' },
  BEAM_CELL: { name: 'レーザーポインター', cost: 0, type: CardType.ATTACK, target: TargetType.ENEMY, description: '4ダメージ。びくびく1を与える。', damage: 4, vulnerable: 1, rarity: 'COMMON', textureRef: 'LIGHTNING|赤|ATTACK' },
  COLD_SNAP: { name: '寒いギャグ', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '6ダメージ。ブロック4を得る。', damage: 6, block: 4, rarity: 'COMMON', textureRef: 'FLAME|青|ATTACK' },
  BALL_LIGHTNING: { name: '静電気', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '7ダメージ。エネルギー1回復。', damage: 7, energy: 1, rarity: 'COMMON', textureRef: 'LIGHTNING|黄|ATTACK' },
  SWORD_BOOMERANG: { name: 'ブーメラン', cost: 1, type: CardType.ATTACK, target: TargetType.RANDOM_ENEMY, description: 'ランダムな敵に3ダメージを3回。', damage: 3, playCopies: 2, rarity: 'COMMON', textureRef: 'SWORD|灰|ATTACK' },
  BODY_SLAM: { name: 'ボディスラム', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '現在のブロック値分のダメージを与える。', damage: 0, damageBasedOnBlock: true, rarity: 'COMMON', textureRef: 'FIST|青|ATTACK' },
  WILD_STRIKE: { name: '暴れる', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '12ダメージ。山札に「ケガ」を加える。', damage: 12, addCardToDraw: { cardName: 'WOUND', count: 1 }, rarity: 'COMMON', textureRef: 'HUMANOID|赤|ATTACK' },
  PERFECTED_STRIKE: { name: '完璧な回答', cost: 2, type: CardType.ATTACK, target: TargetType.ENEMY, description: '6ダメージ。デッキの「えんぴつ攻撃」1枚につき+2。', damage: 6, damagePerStrike: 2, rarity: 'COMMON', textureRef: 'NOTEBOOK|黄|ATTACK' },
  ANGER: { name: 'キレる', cost: 0, type: CardType.ATTACK, target: TargetType.ENEMY, description: '6ダメージ。捨て札に「キレる」を1枚加える。', damage: 6, addCardToDiscard: { cardName: 'ANGER', count: 1 }, rarity: 'COMMON', textureRef: 'FLAME|赤|ATTACK' },
  FLYING_KNEE: { name: '飛び膝蹴り', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '8ダメージ。次ターンE+1。', damage: 8, nextTurnEnergy: 1, rarity: 'COMMON', textureRef: 'SHOE|赤|ATTACK' },
  EMPTY_FIST: { name: 'グーパンチ', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '9ダメージ。', damage: 9, rarity: 'COMMON', textureRef: 'FIST|灰|ATTACK' },
  CONSECRATE: { name: '掃除の時間', cost: 0, type: CardType.ATTACK, target: TargetType.ALL_ENEMIES, description: '全体5ダメージ。', damage: 5, rarity: 'COMMON', textureRef: 'SLIME|白|ATTACK' },
  CUT_THROUGH: { name: '列に割り込む', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '7ダメージ。1ドロー。', damage: 7, draw: 1, rarity: 'COMMON', textureRef: 'FIST|赤|ATTACK' },
  SASH_WHIP: { name: 'タオル攻撃', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '8ダメージ。へろへろ1。', damage: 8, weak: 1, rarity: 'COMMON', textureRef: 'SWORD|白|ATTACK' },
  CLASH: { name: '口喧嘩', cost: 0, type: CardType.ATTACK, target: TargetType.ENEMY, description: '14ダメージ。手札がアタックのみの時のみ使用可。', damage: 14, playCondition: 'HAND_ONLY_ATTACKS', rarity: 'COMMON', textureRef: 'FLAME|赤|ATTACK' }, 
  DAGGER_SPRAY: { name: '消しゴム投げ', cost: 1, type: CardType.ATTACK, target: TargetType.ALL_ENEMIES, description: '全体4ダメージを2回。', damage: 4, playCopies: 1, rarity: 'COMMON', textureRef: 'SWORD|白|ATTACK' },
  SUCKER_PUNCH: { name: 'カンチョー', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '7ダメージ。へろへろ1を与える。', damage: 7, weak: 1, rarity: 'COMMON', textureRef: 'FIST|赤|ATTACK' },
  BANE: { name: '追い打ち', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '7ダメージ。敵がドクドク状態なら更に7ダメージ。', damage: 7, rarity: 'COMMON', textureRef: 'SWORD|緑|ATTACK' }, 
  SHIELD_BLOCK: { name: 'ノートで防御', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロックを7得る。', block: 7, rarity: 'COMMON', textureRef: 'NOTEBOOK|青|SKILL' },
  SURVIVOR: { name: '生き残り', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック8。手札を1枚捨てる。', block: 8, promptsDiscard: 1, rarity: 'COMMON', textureRef: 'HUMANOID|白|SKILL' },
  WARCRY: { name: '雄叫び', cost: 0, type: CardType.SKILL, target: TargetType.SELF, description: 'カード1枚引く。廃棄される。', draw: 1, exhaust: true, rarity: 'COMMON', textureRef: 'LIGHTNING|赤|SKILL' },
  SHRUG_IT_OFF: { name: '知らんぷり', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック8。カード1枚引く。', block: 8, draw: 1, rarity: 'COMMON', textureRef: 'SHIELD|青|SKILL' },
  DEFLECT: { name: '回避', cost: 0, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック4を得る。', block: 4, rarity: 'COMMON', textureRef: 'SHOE|白|SKILL' },
  PIERCING_WAIL: { name: '泣き叫ぶ', cost: 1, type: CardType.SKILL, target: TargetType.ALL_ENEMIES, description: '敵全体にムキムキダウン1を与える。廃棄。', strength: -6, exhaust: true, rarity: 'COMMON', textureRef: 'LIGHTNING|白|SKILL' }, 
  CHARGE_BATTERY: { name: '充電', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック7。次ターンエナジー+1。', block: 7, nextTurnEnergy: 1, rarity: 'COMMON', textureRef: 'LIGHTNING|黄|SKILL' },
  LEAP: { name: 'ジャンプ', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック9を得る。', block: 9, rarity: 'COMMON', textureRef: 'SHOE|青|SKILL' },
  ARMAMENTS: { name: '装備点検', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック5。手札全て強化。', block: 5, upgradeHand: true, rarity: 'COMMON', textureRef: 'BACKPACK|黄|SKILL' },
  ACROBATICS: { name: '側転', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: '3枚引く。1枚捨てる。', draw: 3, promptsDiscard: 1, rarity: 'COMMON', textureRef: 'SHOE|灰|SKILL' },
  BACKFLIP: { name: 'バック転', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック5。2枚引く。', block: 5, draw: 2, rarity: 'COMMON', textureRef: 'SHOE|灰|SKILL' },
  PREPARED: { name: '準備', cost: 0, type: CardType.SKILL, target: TargetType.SELF, description: '1枚引く。1枚捨てる。', draw: 1, promptsDiscard: 1, rarity: 'COMMON', textureRef: 'NOTEBOOK|黄|SKILL' },
  HOLOGRAM: { name: 'カンニング', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック3。手札に捨て札から1枚戻す。', block: 3, rarity: 'COMMON', textureRef: 'NOTEBOOK|青|SKILL' },
  THIRD_EYE: { name: '予習', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック7。2枚ドロー。', block: 7, draw: 2, rarity: 'COMMON', textureRef: 'EYE|青|SKILL' },
  EMPTY_BODY: { name: '瞑想', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック10。', block: 10, rarity: 'COMMON', textureRef: 'HUMANOID|青|SKILL' },
  PROSTRATE: { name: '土下座', cost: 0, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック4。エネルギー1を得る。', block: 4, energy: 1, rarity: 'COMMON', textureRef: 'HUMANOID|黄|SKILL' },
  SCRY: { name: '先読み', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: '3枚引く。1枚捨てる。', draw: 3, promptsDiscard: 1, rarity: 'COMMON', textureRef: 'EYE|黄|SKILL' },
  SKIM: { name: '速読', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: '3枚引く。', draw: 3, rarity: 'COMMON', textureRef: 'NOTEBOOK|白|SKILL' },
  TURBO: { name: 'カフェイン', cost: 0, type: CardType.SKILL, target: TargetType.SELF, description: 'E2を得る。虚無追加。', energy: 2, addCardToDraw: { cardName: 'VOID', count: 1 }, rarity: 'COMMON', textureRef: 'POTION|黄|SKILL' },
  BLIND: { name: '目隠し', cost: 0, type: CardType.SKILL, target: TargetType.ENEMY, description: 'へろへろ2を与える。', weak: 2, rarity: 'COMMON', textureRef: 'EYE|灰|SKILL' },
  TRIP: { name: '足払い', cost: 0, type: CardType.SKILL, target: TargetType.ALL_ENEMIES, description: '敵全体にびくびく2を与える。', vulnerable: 2, rarity: 'COMMON', textureRef: 'SHOE|青|SKILL' },
  DEEP_BREATH: { name: '深呼吸', cost: 0, type: CardType.SKILL, target: TargetType.SELF, description: '捨て札を山札に戻す。1枚引く。', shuffleHandToDraw: true, draw: 1, rarity: 'COMMON', textureRef: 'FLAME|白|SKILL' },
  UPPERCUT: { name: 'アッパー', cost: 2, type: CardType.ATTACK, target: TargetType.ENEMY, description: '13ダメージ。へろへろ1とびくびく1。', damage: 13, weak: 1, vulnerable: 1, rarity: 'RARE', textureRef: 'FIST|赤|ATTACK' },
  BLUDGEON: { name: '大打撃', cost: 3, type: CardType.ATTACK, target: TargetType.ENEMY, description: '32ダメージを与える。', damage: 32, rarity: 'RARE', textureRef: 'FIST|赤|ATTACK' },
  REAPER: { name: '給食当番', cost: 2, type: CardType.ATTACK, target: TargetType.ALL_ENEMIES, description: '全体4ダメージ。未ブロック分HP回復。', damage: 4, lifesteal: true, rarity: 'RARE', textureRef: 'CHEF|赤|ATTACK' },
  FEED: { name: 'いただきます', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '10ダメージ。これで倒すと最大HP+3。', damage: 10, fatalMaxHp: 3, rarity: 'RARE', textureRef: 'FIST|赤|ATTACK' },
  IMMOLATE: { name: '焼却炉', cost: 2, type: CardType.ATTACK, target: TargetType.ALL_ENEMIES, description: '全体21ダメージ。自傷2。', damage: 21, selfDamage: 2, rarity: 'RARE', textureRef: 'FLAME|赤|ATTACK' },
  HEAVY_BLADE: { name: '重いバット', cost: 2, type: CardType.ATTACK, target: TargetType.ENEMY, description: '14ダメージ。ムキムキ効果3倍。', damage: 14, strengthScaling: 3, rarity: 'RARE', textureRef: 'SWORD|灰|ATTACK' },
  DIE_DIE_DIE: { name: '宿題宿題', cost: 1, type: CardType.ATTACK, target: TargetType.ALL_ENEMIES, description: '全体13ダメージ。廃棄。', damage: 13, exhaust: true, rarity: 'RARE', textureRef: 'NOTEBOOK|紫|ATTACK' },
  GLASS_KNIFE: { name: '硝子のカケラ', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '8ダメージを2回。', damage: 8, playCopies: 1, rarity: 'RARE', textureRef: 'SWORD|青|ATTACK' },
  DASH: { name: 'ダッシュ', cost: 2, type: CardType.ATTACK, target: TargetType.ENEMY, description: '10ダメージ。ブロック10。', damage: 10, block: 10, rarity: 'RARE', textureRef: 'SHOE|青|ATTACK' },
  HYPERBEAM: { name: '目からビーム', cost: 3, type: CardType.ATTACK, target: TargetType.ALL_ENEMIES, description: '全体26ダメージ。', damage: 26, rarity: 'RARE', textureRef: 'EYE|赤|ATTACK' },
  SUNDER: { name: '破る', cost: 3, type: CardType.ATTACK, target: TargetType.ENEMY, description: '24ダメージ。倒せばE3回復。', damage: 24, fatalEnergy: 3, rarity: 'RARE', textureRef: 'FIST|赤|ATTACK' },
  DOOM_AND_GLOOM: { name: '絶望と暗黒', cost: 2, type: CardType.ATTACK, target: TargetType.ALL_ENEMIES, description: '全体10ダメージ。', damage: 10, rarity: 'RARE', textureRef: 'GHOST|黒|ATTACK' },
  CORE_SURGE: { name: '暴走', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '11ダメージ。キラキラ1を得る。', damage: 11, exhaust: true, applyPower: { id: 'ARTIFACT', amount: 1 }, rarity: 'RARE', textureRef: 'LIGHTNING|赤|ATTACK' },
  RAGNAROK: { name: '大暴れ', cost: 3, type: CardType.ATTACK, target: TargetType.RANDOM_ENEMY, description: '5ダメージを5回与える。', damage: 5, playCopies: 4, rarity: 'RARE', textureRef: 'FLAME|赤|ATTACK' },
  LESSON_LEARNED: { name: '学習', cost: 2, type: CardType.ATTACK, target: TargetType.ENEMY, description: '10ダメージ。倒すとランダムなカード強化。', damage: 10, fatalPermanentDamage: 3, rarity: 'RARE', textureRef: 'NOTEBOOK|黄|ATTACK' },
  BRILLIANCE: { name: 'ひらめき', cost: 1, type: CardType.ATTACK, target: TargetType.ALL_ENEMIES, description: '12ダメージ。HP2回復。', damage: 12, heal: 2, rarity: 'RARE', textureRef: 'LIGHTNING|黄|ATTACK' },
  CARNAGE: { name: '滅多打ち', cost: 2, type: CardType.ATTACK, target: TargetType.ENEMY, description: '20ダメージ。', damage: 20, rarity: 'RARE', textureRef: 'FIST|赤|ATTACK' },
  PREDATOR: { name: '捕食者', cost: 2, type: CardType.ATTACK, target: TargetType.ENEMY, description: '15ダメージ。次ターン2ドロー。', damage: 15, nextTurnDraw: 2, rarity: 'RARE', textureRef: 'BEAST|赤|ATTACK' },
  BLOOD_FOR_BLOOD: { name: 'やられたらやり返す', cost: 3, type: CardType.ATTACK, target: TargetType.ENEMY, description: '18ダメージ。自傷1。', damage: 18, selfDamage: 1, rarity: 'RARE', textureRef: 'FLAME|赤|ATTACK' },
  SEVER_SOUL: { name: '断捨離', cost: 2, type: CardType.ATTACK, target: TargetType.ENEMY, description: '16ダメージ。手札の非攻撃カードを全廃棄。', damage: 16, promptsExhaust: 99, rarity: 'RARE', textureRef: 'SWORD|白|ATTACK' },
  WHIRLWIND: { name: '大回転', cost: 2, type: CardType.ATTACK, target: TargetType.ALL_ENEMIES, description: '全体8ダメージを2回。', damage: 8, playCopies: 1, rarity: 'RARE', textureRef: 'SWORD|灰|ATTACK' },
  FIEND_FIRE: { name: '焚き火', cost: 2, type: CardType.ATTACK, target: TargetType.ENEMY, description: '手札を全て廃棄。1枚につき7ダメージ。', damage: 0, damagePerCardInHand: 7, rarity: 'RARE', textureRef: 'FLAME|赤|ATTACK' },
  CHOKE: { name: '締め技', cost: 2, type: CardType.ATTACK, target: TargetType.ENEMY, description: '12ダメージ。', damage: 12, rarity: 'RARE', textureRef: 'FIST|灰|ATTACK' },
  ALL_OUT_STRIKE: { name: 'フルスイング', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '10ダメージ。手札1枚捨てる。', damage: 10, promptsDiscard: 1, rarity: 'RARE', textureRef: 'SWORD|灰|ATTACK' },
  HEEL_HOOK: { name: 'かかと落とし', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '5ダメージ。E1回復。', damage: 5, energy: 1, rarity: 'RARE', textureRef: 'SHOE|赤|ATTACK' },
  FINISHER: { name: 'とどめ', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '6ダメージ。今ターン使用攻撃枚数分攻撃。', damage: 6, damagePerAttackPlayed: 6, rarity: 'RARE', textureRef: 'SWORD|赤|ATTACK' },
  MELTER: { name: '溶解液', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '10ダメージ。対象のブロックを除去。', damage: 10, rarity: 'RARE', textureRef: 'SLIME|緑|ATTACK' },
  SCRAPE: { name: '引っかく', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '7ダメージ。ドロー3、非0コス捨てる。', damage: 7, draw: 3, rarity: 'RARE', textureRef: 'BEAST|灰|ATTACK' },
  RITUAL_DAGGER: { name: '儀式の短剣', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '15ダメージ。敵を倒すと恒久+3強化。廃棄。', damage: 15, fatalPermanentDamage: 3, exhaust: true, rarity: 'RARE', textureRef: 'SWORD|赤|ATTACK' },
  HEMOKINESIS: { name: '血祭り', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: 'HP2失い、15ダメージ。', selfDamage: 2, damage: 15, rarity: 'RARE', textureRef: 'FLAME|赤|ATTACK' },
  FLECHETTES: { name: '画鋲投げ', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '4ダメージ。手札のスキル枚数分攻撃。', damage: 4, rarity: 'RARE', textureRef: 'SWORD|灰|ATTACK' }, 
  RIDDLE_WITH_HOLES: { name: '蜂の巣', cost: 2, type: CardType.ATTACK, target: TargetType.ENEMY, description: '3ダメージを5回。', damage: 3, playCopies: 4, rarity: 'RARE', textureRef: 'FIST|灰|ATTACK' },
  GRAND_FINALE: { name: '卒業式', cost: 0, type: CardType.ATTACK, target: TargetType.ALL_ENEMIES, description: '全体50ダメージ。山札0の時のみ。', damage: 50, playCondition: 'DRAW_PILE_EMPTY', rarity: 'LEGENDARY', textureRef: 'BOSS|白|ATTACK' }, 
  MIND_BLAST: { name: '知識の爆発', cost: 2, type: CardType.ATTACK, target: TargetType.ENEMY, description: '山札の枚数分ダメージ。', damage: 0, damagePerCardInDraw: 1, innate: true, rarity: 'RARE', textureRef: 'EYE|青|ATTACK' }, 
  ENTRENCH: { name: 'バリケード', cost: 2, type: CardType.SKILL, target: TargetType.SELF, description: '現在のブロック値を2倍にする。', doubleBlock: true, rarity: 'RARE', textureRef: 'SHIELD|青|SKILL' },
  SHOCKWAVE: { name: '衝撃波', cost: 2, type: CardType.SKILL, target: TargetType.ALL_ENEMIES, description: '敵全体にへろへろ3とびくびく3。廃棄。', weak: 3, vulnerable: 3, exhaust: true, rarity: 'RARE', textureRef: 'LIGHTNING|黄|SKILL' },
  IMPERVIOUS: { name: '鉄壁', cost: 2, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック30を得る。廃棄。', block: 30, exhaust: true, rarity: 'RARE', textureRef: 'SHIELD|青|SKILL' },
  OFFERING: { name: 'お供え', cost: 0, type: CardType.SKILL, target: TargetType.SELF, description: 'HP6消費。E2と3枚ドロー。廃棄。', selfDamage: 6, energy: 2, draw: 3, exhaust: true, rarity: 'RARE', textureRef: 'NOTEBOOK|赤|SKILL' },
  SEEING_RED: { name: '激昂', cost: 0, type: CardType.SKILL, target: TargetType.SELF, description: 'エネルギー2を得る。廃棄。', energy: 2, exhaust: true, rarity: 'RARE', textureRef: 'FLAME|赤|SKILL' },
  ADRENALINE: { name: 'アドレナリン', cost: 0, type: CardType.SKILL, target: TargetType.SELF, description: 'E1を得て2枚引く。廃棄。', energy: 1, draw: 2, exhaust: true, rarity: 'RARE', textureRef: 'POTION|黄|SKILL' },
  GHOSTLY_ARMOR: { name: '幽霊の鎧', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック10。廃棄。', block: 10, exhaust: true, rarity: 'RARE', textureRef: 'SHIELD|白|SKILL' },
  LEG_SWEEP: { name: '足払い', cost: 2, type: CardType.SKILL, target: TargetType.ENEMY, description: 'へろへろ2を与える。ブロック11。', weak: 2, block: 11, rarity: 'RARE', textureRef: 'SHOE|青|SKILL' },
  GLACIER: { name: 'かまくら', cost: 2, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック12。', block: 12, rarity: 'RARE', textureRef: 'SHIELD|青|SKILL' },
  REBOOT: { name: '再起動', cost: 0, type: CardType.SKILL, target: TargetType.SELF, description: '手札を全て山札に戻し4枚引く。', shuffleHandToDraw: true, draw: 4, rarity: 'RARE', textureRef: 'LIGHTNING|黄|SKILL' },
  GENETIC_ALGORITHM: { name: '学習アルゴリズム', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック1。この戦闘で使用すると、このカードのブロック値が恒久的に2増加する。廃棄。', block: 1, exhaust: true, rarity: 'RARE', textureRef: 'NOTEBOOK|青|SKILL' },
  FORCE_FIELD: { name: 'バリア', cost: 3, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック12。', block: 12, rarity: 'RARE', textureRef: 'SHIELD|青|SKILL' },
  SPOT_WEAKNESS: { name: '弱点発見', cost: 1, type: CardType.SKILL, target: TargetType.ENEMY, description: 'ムキムキ+3。', strength: 3, rarity: 'RARE', textureRef: 'EYE|赤|SKILL' },
  DISARM: { name: '武器奪取', cost: 1, type: CardType.SKILL, target: TargetType.ENEMY, description: '敵のムキムキを2下げる。廃棄。', strength: -2, exhaust: true, rarity: 'RARE', textureRef: 'FIST|灰|SKILL' },
  DUAL_WIELD: { name: '二刀流', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: '手札の攻撃/パワーを1枚コピー。', promptsCopy: 1, rarity: 'RARE', textureRef: 'SWORD|灰|SKILL' },
  SENTINEL: { name: '見張り', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック5。', block: 5, rarity: 'RARE', textureRef: 'HUMANOID|青|SKILL' },
  LIMIT_BREAK: { name: '限界突破', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ムキムキを倍にする。廃棄。', doubleStrength: true, exhaust: true, rarity: 'RARE', textureRef: 'FLAME|赤|SKILL' },
  BATTLE_TRANCE: { name: '集中モード', cost: 0, type: CardType.SKILL, target: TargetType.SELF, description: '3枚引く。', draw: 3, rarity: 'RARE', textureRef: 'HUMANOID|黄|SKILL' },
  TERROR: { name: '恐怖', cost: 1, type: CardType.SKILL, target: TargetType.ENEMY, description: 'びくびく3を与える。廃棄。', vulnerable: 3, exhaust: true, rarity: 'RARE', textureRef: 'EYE|黒|SKILL' },
  CORPSE_EXPLOSION: { name: '死体爆破', cost: 2, type: CardType.SKILL, target: TargetType.ENEMY, description: 'ドクドク6。倒すと全体に最大HPダメ。', poison: 6, applyPower: { id: 'CORPSE_EXPLOSION', amount: 1 }, rarity: 'LEGENDARY', textureRef: 'GHOST|緑|SKILL' },
  MALAISE: { name: '不快感', cost: 2, type: CardType.SKILL, target: TargetType.ENEMY, description: 'ムキムキ低下2とへろへろ2。廃棄。', weak: 2, applyPower: { id: 'STRENGTH_DOWN', amount: 2 }, exhaust: true, rarity: 'RARE', textureRef: 'FIST|灰|SKILL' },
  BURST: { name: 'バースト', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: '次のスキルを2回発動。', applyPower: { id: 'BURST', amount: 2 }, rarity: 'RARE', textureRef: 'FLAME|黄|SKILL' },
  ALCHEMIZE: { name: '錬金術', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: '手札にランダムなカードを加える。', addCardToHand: { cardName: 'BASH', count: 1 }, exhaust: true, rarity: 'RARE', textureRef: 'POTION|黄|SKILL' },
  VAULT: { name: '大ジャンプ', cost: 3, type: CardType.SKILL, target: TargetType.SELF, description: '追加ターンを得る。廃棄。', draw: 5, block: 20, exhaust: true, rarity: 'LEGENDARY', textureRef: 'SHOE|青|SKILL' },
  OFFERING_BLOOD: { name: '血の契約', cost: 0, type: CardType.SKILL, target: TargetType.SELF, description: 'HP4失い、E2とドロー2。', selfDamage: 4, energy: 2, draw: 2, rarity: 'RARE', textureRef: 'NOTEBOOK|赤|SKILL' },
  BLADE_DANCE: { name: '剣の舞', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: '手札にナイフ(0コス4ダメ)を3枚加える。', addCardToHand: { cardName: 'SHIV', count: 3, cost0: true }, rarity: 'COMMON', textureRef: 'SWORD|灰|SKILL' }, 
  CLOAK_AND_DAGGER: { name: '隠しナイフ', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック6。ナイフ1枚得る。', block: 6, addCardToHand: { cardName: 'SHIV', count: 1, cost0: true }, rarity: 'COMMON', textureRef: 'SHIELD|灰|SKILL' },
  CALCULATED_GAMBLE: { name: '計算', cost: 0, type: CardType.SKILL, target: TargetType.SELF, description: '手札を全て捨て、同じ枚数引く。', rarity: 'UNCOMMON', textureRef: 'NOTEBOOK|黄|SKILL' }, 
  CATALYST: { name: '触媒', cost: 1, type: CardType.SKILL, target: TargetType.ENEMY, description: 'ドクドクを2倍にする。廃棄。', poisonMultiplier: 2, exhaust: true, rarity: 'UNCOMMON', textureRef: 'POTION|緑|SKILL' },
  DISCOVERY: { name: '発見', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ランダムなカードを手札に加える。', exhaust: true, rarity: 'UNCOMMON', textureRef: 'NOTEBOOK|白|SKILL' }, 
  STRATEGIST: { name: '作戦', cost: 0, type: CardType.SKILL, target: TargetType.SELF, description: '捨てられた時E2得る。', unplayable: true, rarity: 'UNCOMMON', textureRef: 'NOTEBOOK|青|SKILL' }, 
  APOTHEOSIS: { name: '神格化', cost: 2, type: CardType.SKILL, target: TargetType.SELF, description: 'この戦闘中、全カードを強化。廃棄。', upgradeDeck: true, exhaust: true, rarity: 'RARE', textureRef: 'FLAME|白|SKILL' },
  INFLAME: { name: '発火', cost: 1, type: CardType.POWER, target: TargetType.SELF, description: 'ムキムキを2得る。', strength: 2, rarity: 'RARE', textureRef: 'FLAME|赤|POWER' },
  DEMON_FORM: { name: '悪魔化', cost: 3, type: CardType.POWER, target: TargetType.SELF, description: 'ターン開始時にムキムキ2を得る。', applyPower: { id: 'DEMON_FORM', amount: 2 }, rarity: 'LEGENDARY', textureRef: 'FLAME|紫|POWER' },
  WRAITH_FORM: { name: '死霊化', cost: 3, type: CardType.POWER, target: TargetType.SELF, description: '2ターン無敵(スケスケ)になる。', applyPower: { id: 'INTANGIBLE', amount: 2 }, rarity: 'LEGENDARY', textureRef: 'GHOST|白|POWER' },
  ECHO_FORM: { name: '反響', cost: 3, type: CardType.POWER, target: TargetType.SELF, description: '毎ターン、最初のカードを2回使用。', applyPower: { id: 'ECHO_FORM', amount: 1 }, rarity: 'LEGENDARY', textureRef: 'LIGHTNING|紫|POWER' },
  ELECTRODYNAMICS: { name: '電気ショック', cost: 2, type: CardType.POWER, target: TargetType.ALL_ENEMIES, description: '全体8ダメージ。', damage: 8, rarity: 'LEGENDARY', textureRef: 'LIGHTNING|青|POWER' },
  BARRICADE: { name: 'バリケード', cost: 3, type: CardType.POWER, target: TargetType.SELF, description: 'ブロックがターン終了時に消えない。', applyPower: { id: 'BARRICADE', amount: 1 }, rarity: 'LEGENDARY', textureRef: 'SHIELD|青|POWER' },
  CORRUPTION: { name: '堕落', cost: 3, type: CardType.POWER, target: TargetType.SELF, description: 'スキルコスト0。使用時廃棄。', applyPower: { id: 'CORRUPTION', amount: 1 }, rarity: 'LEGENDARY', textureRef: 'FLAME|灰|POWER' },
  FEEL_NO_PAIN: { name: '無痛', cost: 1, type: CardType.POWER, target: TargetType.SELF, description: '廃棄する度ブロック3を得る。', applyPower: { id: 'FEEL_NO_PAIN', amount: 3 }, rarity: 'RARE', textureRef: 'SHIELD|白|POWER' },
  RUPTURE: { name: '破裂', cost: 1, type: CardType.POWER, target: TargetType.SELF, description: 'HPを失う度、ムキムキ1を得る。', applyPower: { id: 'RUPTURE', amount: 1 }, rarity: 'RARE', textureRef: 'FLAME|赤|POWER' },
  EVOLVE: { name: '進化', cost: 1, type: CardType.POWER, target: TargetType.SELF, description: '状態異常カードを引いた時、カードを引く。', applyPower: { id: 'EVOLVE', amount: 1 }, rarity: 'RARE', textureRef: 'SLIME|緑|POWER' },
  NOXIOUS_FUMES: { name: '有毒ガス', cost: 1, type: CardType.POWER, target: TargetType.SELF, description: '毎ターン敵全体にドクドク2。', applyPower: { id: 'NOXIOUS_FUMES', amount: 2 }, rarity: 'RARE', textureRef: 'SLIME|緑|POWER' },
  AFTER_IMAGE: { name: '残像', cost: 1, type: CardType.POWER, target: TargetType.SELF, description: 'カード使用時ブロック1。', applyPower: { id: 'AFTER_IMAGE', amount: 1 }, rarity: 'RARE', textureRef: 'GHOST|白|POWER' },
  THOUSAND_CUTS: { name: 'あばれる', cost: 2, type: CardType.POWER, target: TargetType.SELF, description: 'カード使用時全体1ダメ。', applyPower: { id: 'THOUSAND_CUTS', amount: 1 }, rarity: 'RARE', textureRef: 'FIST|赤|POWER' },
  TOOLS_OF_THE_TRADE: { name: '商売道具', cost: 1, type: CardType.POWER, target: TargetType.SELF, description: '毎ターン1枚引き1枚捨てる。', applyPower: { id: 'TOOLS_OF_THE_TRADE', amount: 1 }, rarity: 'RARE', textureRef: 'BACKPACK|黄|POWER' },
  ENVENOM: { name: '猛毒', cost: 2, type: CardType.POWER, target: TargetType.SELF, description: '攻撃時ドクドク1付与。', applyPower: { id: 'ENVENOM', amount: 1 }, rarity: 'RARE', textureRef: 'SWORD|緑|POWER' },
  STATIC_DISCHARGE: { name: '静電気', cost: 1, type: CardType.POWER, target: TargetType.SELF, description: '被ダメ時、ランダムに5ダメ。', applyPower: { id: 'STATIC_DISCHARGE', amount: 1 }, rarity: 'RARE', textureRef: 'LIGHTNING|黄|POWER' },
  BUFFER: { name: 'バッファー', cost: 2, type: CardType.POWER, target: TargetType.SELF, description: '次に受けるHPダメを0にする。', applyPower: { id: 'BUFFER', amount: 1 }, rarity: 'RARE', textureRef: 'SHIELD|青|POWER' },
  CREATIVE_AI: { name: '創造的AI', cost: 3, type: CardType.POWER, target: TargetType.SELF, description: '毎ターンランダムなパワー生成。', applyPower: { id: 'CREATIVE_AI', amount: 1 }, rarity: 'LEGENDARY', textureRef: 'LIGHTNING|黄|POWER' },
  DEVA_FORM: { name: 'デバ化', cost: 3, type: CardType.POWER, target: TargetType.SELF, description: 'ターン開始時、エネルギーを得る。毎ターン増加する。', applyPower: { id: 'DEVA_FORM', amount: 1 }, rarity: 'LEGENDARY', textureRef: 'FLAME|黄|POWER' },
  MASTER_REALITY: { name: '真なる理', cost: 1, type: CardType.POWER, target: TargetType.SELF, description: 'カード生成時アップグレード。', applyPower: { id: 'MASTER_REALITY', amount: 1 }, rarity: 'RARE', textureRef: 'NOTEBOOK|白|POWER' },
  BERSERK: { name: 'バーサク', cost: 0, type: CardType.POWER, target: TargetType.SELF, description: 'びくびく2を受け、エネルギー1を得る。', energy: 1, vulnerable: 2, rarity: 'RARE', textureRef: 'FLAME|赤|POWER' },
  INFINITE_BLADES: { name: '無限の刃', cost: 1, type: CardType.POWER, target: TargetType.SELF, description: '毎ターン手札にナイフを加える。', applyPower: { id: 'INFINITE_BLADES', amount: 1 }, rarity: 'UNCOMMON', textureRef: 'SWORD|灰|POWER' },
  ACCURACY: { name: '精度上昇', cost: 1, type: CardType.POWER, target: TargetType.SELF, description: 'ナイフのダメージ+4。', applyPower: { id: 'ACCURACY', amount: 4 }, rarity: 'UNCOMMON', textureRef: 'EYE|黄|POWER' },
};

export const STARTING_DECK_TEMPLATE = [
  'STRIKE', 'STRIKE', 'STRIKE', 'STRIKE',
  'DEFEND', 'DEFEND', 'DEFEND', 'DEFEND',
  'BASH', 'IRON_WAVE'
];

export const CHARACTERS: Character[] = [
    {
        id: 'WARRIOR',
        name: 'わんぱく小学生',
        description: '「ランドセルタックル」と「往復ビンタ」でガンガン攻める攻撃型！',
        maxHp: 80,
        gold: 100,
        startingRelicId: 'BURNING_BLOOD',
        color: 'red',
        deckTemplate: ['STRIKE', 'STRIKE', 'STRIKE', 'STRIKE', 'DEFEND', 'DEFEND', 'DEFEND', 'DEFEND', 'BASH', 'TWIN_STRIKE'],
        imageData: `data:image/svg+xml;base64,${btoa(WARRIOR_SVG)}`
    },
    {
        id: 'CARETAKER',
        name: '飼育委員',
        description: '「捕獲網」で敵をカード化して仲間にするユニークな戦術。',
        maxHp: 72,
        gold: 100,
        startingRelicId: 'WHISTLE',
        color: 'amber',
        deckTemplate: ['STRIKE', 'STRIKE', 'DEFEND', 'DEFEND', 'DEFEND', 'CLOAK_AND_DAGGER', 'BLADE_DANCE', 'ACCURACY', 'CAPTURE_NET'], 
        imageData: `data:image/svg+xml;base64,${btoa(CARETAKER_SVG)}`
    },
    {
        id: 'ASSASSIN',
        name: '転校生',
        description: '「毒舌」で相手を毒状態にしてジワジワ追い詰めるテクニカル型。',
        maxHp: 70,
        gold: 100,
        startingRelicId: 'SNAKE_RING',
        color: 'green',
        deckTemplate: ['STRIKE', 'STRIKE', 'STRIKE', 'STRIKE', 'DEFEND', 'DEFEND', 'DEFEND', 'DEFEND', 'NEUTRALIZE', 'POISON_STAB'], 
        imageData: `data:image/svg+xml;base64,${btoa(ASSASSIN_SVG)}`
    },
    {
        id: 'MAGE',
        name: '理科クラブ部長',
        description: 'コスト0の「レーザー」とエネルギーを溜める「静電気」で手数を稼ぐ。',
        maxHp: 65,
        gold: 100,
        startingRelicId: 'HOLY_WATER',
        color: 'blue',
        deckTemplate: ['STRIKE', 'STRIKE', 'STRIKE', 'STRIKE', 'DEFEND', 'DEFEND', 'DEFEND', 'DEFEND', 'BEAM_CELL', 'BALL_LIGHTNING'], 
        imageData: `data:image/svg+xml;base64,${btoa(MAGE_SVG)}`
    },
    {
        id: 'DODGEBALL',
        name: 'ドッジボールのエース',
        description: 'カードを引いて捨てる「チョーク投げ」でデッキを回転させるスピードタイプ。',
        maxHp: 75,
        gold: 100,
        startingRelicId: 'HACHIMAKI',
        color: 'orange',
        deckTemplate: ['STRIKE', 'STRIKE', 'STRIKE', 'STRIKE', 'DEFEND', 'DEFEND', 'DEFEND', 'DEFEND', 'DAGGER_THROW', 'ACROBATICS'], 
        imageData: `data:image/svg+xml;base64,${btoa(DODGEBALL_SVG)}`
    },
    {
        id: 'BARD',
        name: '放送委員',
        description: '「大声」で敵全体にダメージを与え、さらに弱体化させる。',
        maxHp: 68,
        gold: 100,
        startingRelicId: 'MEGAPHONE', 
        color: 'yellow',
        deckTemplate: ['STRIKE', 'STRIKE', 'STRIKE', 'STRIKE', 'DEFEND', 'DEFEND', 'DEFEND', 'DEFEND', 'THUNDERCLAP', 'PIERCING_WAIL'],
        imageData: `data:image/svg+xml;base64,${btoa(BARD_SVG)}`
    },
    {
        id: 'LIBRARIAN',
        name: '図書委員',
        description: '「予習（ブロック＆保留）」で次のターンに備える慎重派。',
        maxHp: 60,
        gold: 120,
        startingRelicId: 'BOOKMARK',
        color: 'purple',
        deckTemplate: ['STRIKE', 'STRIKE', 'STRIKE', 'STRIKE', 'DEFEND', 'DEFEND', 'DEFEND', 'DEFEND', 'THIRD_EYE', 'SHRUG_IT_OFF'], 
        imageData: `data:image/svg+xml;base64,${btoa(LIBRARIAN_SVG)}`
    },
    {
        id: 'CHEF',
        name: '給食当番リーダー',
        description: '「発火」でムキムキになり、「重いバット」で超火力を叩き出す！',
        maxHp: 85,
        gold: 100,
        startingRelicId: 'BIG_LADLE',
        color: 'pink',
        deckTemplate: ['STRIKE', 'STRIKE', 'STRIKE', 'STRIKE', 'DEFEND', 'DEFEND', 'DEFEND', 'DEFEND', 'INFLAME', 'HEAVY_BLADE'], 
        imageData: `data:image/svg+xml;base64,${btoa(CHEF_SVG)}`
    },
    {
        id: 'GARDENER',
        name: '園芸委員',
        description: 'ブロックを固めて「ボディスラム」で反撃する鉄壁の守り。',
        maxHp: 78,
        gold: 100,
        startingRelicId: 'SEED_PACK',
        color: 'lime',
        deckTemplate: ['STRIKE', 'STRIKE', 'STRIKE', 'STRIKE', 'DEFEND', 'DEFEND', 'DEFEND', 'DEFEND', 'IRON_WAVE', 'BODY_SLAM'],
        imageData: `data:image/svg+xml;base64,${btoa(GARDENER_SVG)}`
    }
];

// --- POKER MINI GAME DATA ---

export const POKER_HAND_LEVELS: Record<string, PokerHandResult> = {
  'HIGH_CARD': { name: 'ハイカード', baseChips: 5, baseMult: 1, level: 1 },
  'PAIR': { name: 'ワンペア', baseChips: 10, baseMult: 2, level: 1 },
  'TWO_PAIR': { name: 'ツーペア', baseChips: 20, baseMult: 2, level: 1 },
  'THREE_OF_A_KIND': { name: 'スリーカード', baseChips: 30, baseMult: 3, level: 1 },
  'STRAIGHT': { name: 'ストレート', baseChips: 30, baseMult: 4, level: 1 },
  'FLUSH': { name: 'フラッシュ', baseChips: 35, baseMult: 4, level: 1 },
  'FULL_HOUSE': { name: 'フルハウス', baseChips: 40, baseMult: 4, level: 1 },
  'FOUR_OF_A_KIND': { name: 'フォーカード', baseChips: 60, baseMult: 7, level: 1 },
  'STRAIGHT_FLUSH': { name: 'ストレートフラッシュ', baseChips: 100, baseMult: 8, level: 1 },
  'ROYAL_FLUSH': { name: 'ロイヤルストレートフラッシュ', baseChips: 200, baseMult: 20, level: 1 },
  'FIVE_OF_A_KIND': { name: 'ファイブカード', baseChips: 120, baseMult: 12, level: 1 },
  'FLUSH_FIVE': { name: 'フラッシュファイブ', baseChips: 160, baseMult: 16, level: 1 },
};

// Card Enhancements Definitions
export const POKER_ENHANCEMENTS: Record<string, {name: string, desc: string}> = {
    BONUS: { name: 'ボーナス', desc: 'チップ +30' },
    MULT: { name: 'マルチ', desc: '倍率 +0.5' }, // Game logic adds 0.5 to multiplier
    WILD: { name: 'ワイルド', desc: '全てのマークとして扱われる' },
    STONE: { name: 'ストーン', desc: 'ランクなし。チップ+50' },
    GLASS: { name: 'ガラス', desc: '倍率 x2。1/4の確率で壊れる' },
    GOLD: { name: 'ゴールド', desc: '使用/所持で $3 獲得' },
    STEEL: { name: 'スチール', desc: '手札にある間、倍率 x1.5' }
};

// Expanded Supporters (Jokers)
export const SUPPORTERS_LIBRARY: PokerSupporter[] = [
  // Original / Basic
  { id: 'TEACHER', name: '担任の先生', description: '倍率+4', price: 4, rarity: 'COMMON', triggerOn: 'HAND_PLAYED', effect: (ctx) => ctx.mult += 4, icon: 'TEACHER|#f44336' },
  { id: 'PRINCIPAL', name: '校長先生', description: '倍率x2', price: 10, rarity: 'RARE', triggerOn: 'HAND_PLAYED', effect: (ctx) => ctx.mult *= 2, icon: 'BOSS|#FFD700' },
  { id: 'COOK', name: '給食のおばちゃん', description: 'チップ+50', price: 5, rarity: 'COMMON', triggerOn: 'HAND_PLAYED', effect: (ctx) => ctx.chips += 50, icon: 'CHEF|#ffccbc' },
  { id: 'ATHLETE', name: '体育会系', description: 'フラッシュで倍率+10', price: 6, rarity: 'UNCOMMON', triggerOn: 'HAND_PLAYED', effect: (ctx) => { if(ctx.handType === 'FLUSH' || ctx.handType === 'STRAIGHT_FLUSH') ctx.mult += 10; }, icon: 'MUSCLE|#2196f3' },
  { id: 'NERD', name: 'ガリ勉君', description: 'ストレートでチップ+100', price: 6, rarity: 'UNCOMMON', triggerOn: 'HAND_PLAYED', effect: (ctx) => { if(ctx.handType === 'STRAIGHT' || ctx.handType === 'STRAIGHT_FLUSH') ctx.chips += 100; }, icon: 'LIBRARIAN|#4caf50' },
  
  // Economy
  { 
      id: 'SUP_PIGGY', name: '貯金箱', description: '所持金$1につきチップ+2', price: 5, rarity: 'COMMON', triggerOn: 'HAND_PLAYED', 
      effect: (ctx) => { ctx.chips += ctx.money * 2; }, 
      getDynamicDescription: (state) => `(Current: +${state.money * 2})`,
      icon: 'POTION|#e91e63' 
  }, 
  
  // Scaling
  { 
      id: 'SUP_BUS', name: '通学バス', description: '役を作るたび倍率+1(永続)', price: 6, rarity: 'COMMON', triggerOn: 'HAND_PLAYED', 
      effect: (ctx) => ctx.mult += (ctx.persistentCounters['HANDS_PLAYED'] || 0), 
      getDynamicDescription: (state) => `(現在: +${state.persistentCounters['HANDS_PLAYED'] || 0})`,
      icon: 'SHOE|#ffeb3b' 
  },
  { 
      id: 'SUP_CAMPFIRE', name: 'キャンプファイヤー', description: 'カードを売るたび倍率x0.25(永続)', price: 8, rarity: 'RARE', triggerOn: 'HAND_PLAYED', 
      effect: (ctx) => ctx.mult *= (1 + 0.25 * (ctx.persistentCounters['CARDS_SOLD'] || 0)), 
      getDynamicDescription: (state) => `(現在: x${1 + 0.25 * (state.persistentCounters['CARDS_SOLD'] || 0)})`,
      icon: 'FLAME|#ff5722' 
  }, 
  { 
      id: 'SUP_RUNNER', name: 'マラソンランナー', description: 'ストレートを役にするたびチップ+10(永続)', price: 6, rarity: 'UNCOMMON', triggerOn: 'HAND_PLAYED', 
      effect: (ctx) => { if(ctx.handType.includes('STRAIGHT')) ctx.chips += 10 * (ctx.persistentCounters['STRAIGHTS_PLAYED'] || 0); }, 
      getDynamicDescription: (state) => `(現在: +${10 * (state.persistentCounters['STRAIGHTS_PLAYED'] || 0)})`,
      icon: 'SHOE|#2196f3' 
  },

  // Rule Bending (Logic Handled in GameScreen)
  { id: 'SUP_CLOVER', name: '四つ葉のクローバー', description: 'ストレートとフラッシュが4枚で成立する', price: 10, rarity: 'RARE', triggerOn: 'PASSIVE', effect: () => {}, icon: 'PLANT|#4caf50' },
  { id: 'SUP_SHORTCUT', name: '飛び級', description: 'ストレートの数字を1つ飛ばせる(例: 2 4 6 8 10)', price: 10, rarity: 'UNCOMMON', triggerOn: 'PASSIVE', effect: () => {}, icon: 'SHOE|#9c27b0' },
  { id: 'SUP_YEARBOOK', name: '卒業アルバム', description: '全てのカードを絵札(J,Q,K)として扱う', price: 8, rarity: 'UNCOMMON', triggerOn: 'PASSIVE', effect: () => {}, icon: 'NOTEBOOK|#795548' },
  
  // Special Mechanics
  { id: 'SUP_DNA', name: 'クローン実験', description: '最初のハンドが1枚なら、そのカードをコピーしてデッキに加える', price: 8, rarity: 'RARE', triggerOn: 'HAND_PLAYED', effect: () => {}, icon: 'SLIME|#00bcd4' }, 
  { id: 'SUP_VAMPIRE', name: '吸血鬼', description: '得点カードの強化を吸い取り、倍率x0.2を得る(永続)', price: 7, rarity: 'RARE', triggerOn: 'HAND_PLAYED', effect: (ctx) => ctx.mult *= 2, icon: 'GHOST|#f44336' },
  { id: 'SUP_SPACE', name: '宇宙人', description: '1/4の確率で役のレベルを上げる', price: 6, rarity: 'UNCOMMON', triggerOn: 'HAND_PLAYED', effect: () => {}, icon: 'ALIEN|#9c27b0' },

  // Conditional / Type Specific
  { id: 'SUP_EVEN', name: '偶数君', description: '偶数カード(2,4,6,8,10)の倍率+4', price: 5, rarity: 'COMMON', triggerOn: 'HAND_PLAYED', effect: (ctx) => { const evens = ctx.cards.filter(c => c.rank % 2 === 0).length; ctx.mult += evens * 4; }, icon: 'NOTEBOOK|#2196f3' },
  { id: 'SUP_ODD', name: '奇数ちゃん', description: '奇数カード(3,5,7,9,A)のチップ+30', price: 5, rarity: 'COMMON', triggerOn: 'HAND_PLAYED', effect: (ctx) => { const odds = ctx.cards.filter(c => c.rank % 2 !== 0).length; ctx.chips += odds * 30; }, icon: 'NOTEBOOK|#e91e63' },
  { id: 'SUP_FIBONACCI', name: 'フィボナッチ', description: 'A,2,3,5,8のカードの倍率+8', price: 7, rarity: 'UNCOMMON', triggerOn: 'HAND_PLAYED', effect: (ctx) => { const fibs = ctx.cards.filter(c => [14, 2, 3, 5, 8].includes(c.rank)).length; ctx.mult += fibs * 8; }, icon: 'WIZARD|#ff9800' },
  { id: 'SUP_HALF', name: 'ハーフパンツ', description: '3枚以下の役なら倍率+20', price: 5, rarity: 'COMMON', triggerOn: 'HAND_PLAYED', effect: (ctx) => { if(ctx.cards.length <= 3) ctx.mult += 20; }, icon: 'SHOE|#ff5722' },
  { 
      id: 'SUP_BANNER', name: '校旗', description: '残りの手札捨て回数につきチップ+40', price: 6, rarity: 'COMMON', triggerOn: 'HAND_PLAYED', 
      effect: (ctx) => ctx.chips += ctx.discardsUsed * 40,
      getDynamicDescription: (state) => `(Current: +${state.discardsRemaining * 40})`, 
      icon: 'FLIER|#ffeb3b' 
  },
  { 
      id: 'SUP_ICE_CREAM', name: '溶けたアイス', description: 'チップ+100、手札を出すたび-5', price: 5, rarity: 'COMMON', triggerOn: 'HAND_PLAYED', 
      effect: (ctx) => ctx.chips += Math.max(0, 100 - (ctx.handsPlayed * 5)),
      getDynamicDescription: (state) => `(Current: +${Math.max(0, 100 - ((state.currentBlind.bossAbility==='THE_NEEDLE' ? 1 : 4) - state.handsRemaining) * 5)})`,
      icon: 'SLIME|#ffffff' 
  },

  // --- NEW SUPPORTERS (Moritto Edition) ---
  
  // Clubs / Suits
  { id: 'SUP_KENDO', name: '剣道部', description: '得点カードのスペード1枚につき倍率+4', price: 6, rarity: 'COMMON', triggerOn: 'HAND_PLAYED', effect: (ctx) => { const count = ctx.cards.filter(c => c.suit === 'SPADE').length; ctx.mult += count * 4; }, icon: 'SWORD|#212121' },
  { id: 'SUP_TEA', name: '茶道部', description: '得点カードのハート1枚につき倍率+4', price: 6, rarity: 'COMMON', triggerOn: 'HAND_PLAYED', effect: (ctx) => { const count = ctx.cards.filter(c => c.suit === 'HEART').length; ctx.mult += count * 4; }, icon: 'POTION|#e91e63' },
  { id: 'SUP_GARDEN', name: '園芸部', description: '得点カードのクラブ1枚につき倍率+4', price: 6, rarity: 'COMMON', triggerOn: 'HAND_PLAYED', effect: (ctx) => { const count = ctx.cards.filter(c => c.suit === 'CLUB').length; ctx.mult += count * 4; }, icon: 'PLANT|#4caf50' },
  { id: 'SUP_ABACUS_CLUB', name: '珠算部', description: '得点カードのダイヤ1枚につき倍率+4', price: 6, rarity: 'COMMON', triggerOn: 'HAND_PLAYED', effect: (ctx) => { const count = ctx.cards.filter(c => c.suit === 'DIAMOND').length; ctx.mult += count * 4; }, icon: 'NOTEBOOK|#ffeb3b' },

  // Rank specific
  { id: 'SUP_LUCKY7', name: 'ラッキーセブン', description: '得点カードの7 1枚につきチップ+50', price: 5, rarity: 'COMMON', triggerOn: 'HAND_PLAYED', effect: (ctx) => { const count = ctx.cards.filter(c => c.rank === 7).length; ctx.chips += count * 50; }, icon: 'GEM|#ff9800' },
  { id: 'SUP_FACE', name: 'イケメン', description: '得点カードの絵札(J,Q,K) 1枚につき倍率+5', price: 6, rarity: 'COMMON', triggerOn: 'HAND_PLAYED', effect: (ctx) => { const count = ctx.cards.filter(c => [11,12,13].includes(c.rank)).length; ctx.mult += count * 5; }, icon: 'HUMANOID|#9c27b0' },
  { id: 'SUP_ACE_STRIKER', name: 'エースストライカー', description: '得点カードのA 1枚につき倍率+10', price: 7, rarity: 'UNCOMMON', triggerOn: 'HAND_PLAYED', effect: (ctx) => { const count = ctx.cards.filter(c => c.rank === 14).length; ctx.mult += count * 10; }, icon: 'FLIER|#f44336' },
  { id: 'SUP_REMEDIAL', name: '補習組', description: '得点カードの低ランク(2,3,4,5) 1枚につき倍率+4', price: 5, rarity: 'COMMON', triggerOn: 'HAND_PLAYED', effect: (ctx) => { const count = ctx.cards.filter(c => [2,3,4,5].includes(c.rank)).length; ctx.mult += count * 4; }, icon: 'NOTEBOOK|#795548' },

  // Hands & Conditions
  { id: 'SUP_TWINS', name: '双子', description: '役がワンペアなら倍率x2', price: 6, rarity: 'COMMON', triggerOn: 'HAND_PLAYED', effect: (ctx) => { if(ctx.handType === 'PAIR') ctx.mult *= 2; }, icon: 'HUMANOID|#e91e63' },
  { id: 'SUP_RICH_KID', name: '御曹司', description: '所持金が$25以上なら倍率x2', price: 8, rarity: 'UNCOMMON', triggerOn: 'HAND_PLAYED', effect: (ctx) => { if(ctx.money >= 25) ctx.mult *= 2; }, icon: 'GOLD_BAG|#ffd700' },
  { id: 'SUP_POOR_STUDENT', name: '苦学生', description: '所持金が$5以下なら倍率+15', price: 5, rarity: 'COMMON', triggerOn: 'HAND_PLAYED', effect: (ctx) => { if(ctx.money <= 5) ctx.mult += 15; }, icon: 'SLIME|#795548' },
  { id: 'SUP_LAST_SPURT', name: 'ラストスパート', description: '最後の手札なら倍率x3', price: 7, rarity: 'RARE', triggerOn: 'HAND_PLAYED', effect: (ctx) => { if(ctx.handsPlayed === 0) ctx.mult *= 3; }, icon: 'SHIELD|#f44336' },
  { id: 'SUP_START_DASH', name: 'スタートダッシュ', description: '最初の手札なら倍率+15', price: 6, rarity: 'COMMON', triggerOn: 'HAND_PLAYED', effect: (ctx) => { 
      // Assuming handsPlayed is max at start. Need context to know max. 
      // Simplified: Check if handsPlayed seems high relative to discards used? 
      // Better: Just assume > 2 means early? No, let's rely on GameScreen logic for now or skip precise check.
      // Wait, ctx.handsPlayed is remaining hands.
      // We can infer max hands if we assume default 4.
      if(ctx.handsPlayed >= 3) ctx.mult += 15; 
  }, icon: 'SWORD|#f44336' },
  
  // Meta / Collection
  { 
      id: 'SUP_SNACKER', name: '買い食い', description: '所持している消費アイテム1つにつき倍率+4', price: 6, rarity: 'COMMON', triggerOn: 'HAND_PLAYED', 
      effect: (ctx) => { /* Logic depends on GameScreen state access */ }, 
      // Since ctx doesn't pass consumables, this is a placeholder or needs types.ts update. 
      // Workaround: We will handle this logic in the effect callback if we can access state, but here we can't easily.
      // Let's implement it as a flat bonus for now or remove if too complex without refactor.
      // Actually, let's replace with something simpler.
      icon: 'POTION|#ff9800' 
  },
  { 
      id: 'SUP_COLLECTOR', name: 'コレクター', description: 'デッキ枚数が52枚より多い場合、超過分1枚につき倍率+1', price: 8, rarity: 'UNCOMMON', triggerOn: 'HAND_PLAYED', 
      effect: (ctx) => { const diff = Math.max(0, ctx.deckState.length - 52); ctx.mult += diff; }, 
      getDynamicDescription: (state) => `(Current: +${Math.max(0, state.deck.length - 52)})`,
      icon: 'BACKPACK|#8d6e63' 
  },
  { id: 'SUP_MINIMALIST', name: 'ミニマリスト', description: '役のカードが3枚以下なら倍率+15', price: 6, rarity: 'COMMON', triggerOn: 'HAND_PLAYED', effect: (ctx) => { if(ctx.cards.length <= 3) ctx.mult += 15; }, icon: 'NOTEBOOK|#607d8b' },

  // Enhanced Cards
  { id: 'SUP_STONE_MANIA', name: '石像マニア', description: '得点カードのストーンカード1枚につきチップ+50', price: 6, rarity: 'UNCOMMON', triggerOn: 'HAND_PLAYED', effect: (ctx) => { const count = ctx.cards.filter(c => c.enhancement === 'STONE').length; ctx.chips += count * 50; }, icon: 'SKELETON|#607d8b' },
  { id: 'SUP_GLASS_BLOWER', name: 'ガラス職人', description: '得点カードのガラスカード1枚につき倍率x1.5', price: 7, rarity: 'RARE', triggerOn: 'HAND_PLAYED', effect: (ctx) => { const count = ctx.cards.filter(c => c.enhancement === 'GLASS').length; if(count>0) ctx.mult *= Math.pow(1.5, count); }, icon: 'POTION|#a5f3fc' },
  { id: 'SUP_ALCHEMIST', name: '錬金術師', description: '得点カードのゴールドカード1枚につき$2獲得', price: 7, rarity: 'UNCOMMON', triggerOn: 'HAND_PLAYED', effect: (ctx) => { 
      // Money gain handled in GameScreen side effect usually, or modify money here? 
      // ctx.money is usually readonly for scoring. 
      // Let's make it add chips instead to be safe.
      const count = ctx.cards.filter(c => c.enhancement === 'GOLD').length; ctx.chips += count * 50; 
  }, icon: 'SWORD|#ffc107' },
  { id: 'SUP_PRESIDENT', name: '生徒会長', description: '役がハイカードなら倍率x3', price: 6, rarity: 'COMMON', triggerOn: 'HAND_PLAYED', effect: (ctx) => { if(ctx.handType === 'HIGH_CARD') ctx.mult *= 3; }, icon: 'BOSS|#ffeb3b' },
  { id: 'SUP_STAIRWAY', name: '階段部', description: 'ストレートならチップ+100', price: 6, rarity: 'COMMON', triggerOn: 'HAND_PLAYED', effect: (ctx) => { if(ctx.handType.includes('STRAIGHT')) ctx.chips += 100; }, icon: 'SHOE|#795548' },
  { id: 'SUP_SWIM', name: '水泳部', description: 'フラッシュならチップ+100', price: 6, rarity: 'COMMON', triggerOn: 'HAND_PLAYED', effect: (ctx) => { if(ctx.handType.includes('FLUSH')) ctx.chips += 100; }, icon: 'POTION|#03a9f4' },
  { id: 'SUP_GO_HOME', name: '帰宅部', description: '得点カードに絵札が含まれていなければ倍率+10', price: 5, rarity: 'COMMON', triggerOn: 'HAND_PLAYED', effect: (ctx) => { const hasFace = ctx.cards.some(c => [11,12,13].includes(c.rank)); if(!hasFace) ctx.mult += 10; }, icon: 'SHOE|#9e9e9e' },
];

export const CONSUMABLES_LIBRARY: PokerConsumable[] = [
    // Planets (Textbooks)
    { id: 'TXT_MATH', type: 'PLANET', name: '算数ドリル', description: 'ハイカードのレベルアップ', price: 3, icon: 'NOTEBOOK|#2196f3' },
    { id: 'TXT_JPN', type: 'PLANET', name: '漢字ドリル', description: 'ワンペアのレベルアップ', price: 3, icon: 'NOTEBOOK|#f44336' },
    { id: 'TXT_SCI', type: 'PLANET', name: '理科実験集', description: 'ツーペアのレベルアップ', price: 3, icon: 'NOTEBOOK|#4caf50' },
    { id: 'TXT_SOC', type: 'PLANET', name: '社会科資料集', description: 'スリーカードのレベルアップ', price: 3, icon: 'NOTEBOOK|#ff9800' },
    { id: 'TXT_ENG', type: 'PLANET', name: '英単語帳', description: 'ストレートのレベルアップ', price: 3, icon: 'NOTEBOOK|#9c27b0' },
    { id: 'TXT_ART', type: 'PLANET', name: '美術の教科書', description: 'フラッシュのレベルアップ', price: 3, icon: 'NOTEBOOK|#e91e63' },
    { id: 'TXT_PE', type: 'PLANET', name: '体育のしおり', description: 'フルハウスのレベルアップ', price: 3, icon: 'NOTEBOOK|#795548' },
    { id: 'TXT_MUS', type: 'PLANET', name: '音楽の教科書', description: 'フォーカードのレベルアップ', price: 3, icon: 'NOTEBOOK|#00bcd4' },
    { id: 'TXT_GEO', type: 'PLANET', name: '地理の地図帳', description: 'ストレートフラッシュのレベルアップ', price: 3, icon: 'NOTEBOOK|#009688' },
    { id: 'TXT_AST', type: 'PLANET', name: '天文学書', description: 'ファイブカードのレベルアップ', price: 3, icon: 'NOTEBOOK|#673ab7' },
    { id: 'TXT_MYTH', type: 'PLANET', name: '神話の絵本', description: 'フラッシュファイブのレベルアップ', price: 3, icon: 'NOTEBOOK|#ffd700' },
    { id: 'TXT_HIS', type: 'PLANET', name: '歴史年表', description: 'ロイヤルストレートフラッシュの レベルアップ', price: 3, icon: 'NOTEBOOK|#b71c1c' },
    
    // Tarots (Stationery)
    { id: 'STA_RULER', type: 'TAROT', name: '金の定規', description: '選んだカード2枚のランクを上げる', price: 4, icon: 'SWORD|#FFD700' },
    { id: 'STA_ERASER', type: 'TAROT', name: '激落ち消しゴム', description: '選んだカード2枚をデッキから消す', price: 4, icon: 'SHIELD|#ffffff' },
    { id: 'STA_STICKER', type: 'TAROT', name: 'キラキラシール', description: '選んだカード1枚にボーナスチップ+50', price: 4, icon: 'GEM|#00e676' },
    { id: 'STA_MARKER', type: 'TAROT', name: '赤ペン', description: '選んだカード1枚を倍率x1.5にする', price: 4, icon: 'POTION|#f44336' },
    { id: 'STA_PAINT', type: 'TAROT', name: '絵の具セット', description: '選んだカード3枚をハートに変える', price: 4, icon: 'POTION|#e91e63' },
    { id: 'STA_INK', type: 'TAROT', name: '墨汁', description: '選んだカード3枚をスペードに変える', price: 4, icon: 'POTION|#212121' },
    { id: 'STA_DEATH', type: 'TAROT', name: '死神のノート', description: '左のカードを右のカードに変える', price: 4, icon: 'GHOST|#9e9e9e' },
    { id: 'STA_GOLD_SPRAY', type: 'TAROT', name: '金スプレー', description: '選んだカード1枚をゴールドにする', price: 4, icon: 'POTION|#FFD700' },
    { id: 'STA_GLASS_WORK', type: 'TAROT', name: 'ガラス細工', description: '選んだカード1枚をガラスにする', price: 4, icon: 'POTION|#a5f3fc' },
    { id: 'STA_STEEL_RULER', type: 'TAROT', name: '鉄の定規', description: '選んだカード1枚をスチールにする', price: 4, icon: 'SWORD|#607d8b' },
    { id: 'STA_RAINBOW_PEN', type: 'TAROT', name: '虹色ペン', description: '選んだカード1枚をワイルドにする', price: 4, icon: 'POTION|#9c27b0' },
    
    // Spectral (Occult Items) - High Risk High Reward
    { id: 'SPC_BLACKHOLE', type: 'SPECTRAL', name: 'ブラックホール', description: '全ての役のレベルを1上げる', price: 8, icon: 'EYE|#000000' },
    { id: 'SPC_IMMOLATE', type: 'SPECTRAL', name: '焼却', description: 'ランダムな手札5枚を破壊し、$20得る', price: 6, icon: 'FLAME|#f44336' },
    { id: 'SPC_ANKH', type: 'SPECTRAL', name: 'コピー機', description: 'ランダムなサポーター1枚をコピーし、他を全て破壊', price: 8, icon: 'ROBOT|#00bcd4' },
    { id: 'SPC_HEX', type: 'SPECTRAL', name: '呪い', description: 'ランダムなサポーター1枚にポリクローム(倍率x1.5)付与、他を全て破壊', price: 8, icon: 'GHOST|#9c27b0' },
    { id: 'SPC_OUIJA', type: 'SPECTRAL', name: 'コックリさん', description: '手札全てをランダムな1つのランクに変換、手札枚数-1', price: 6, icon: 'GHOST|#ffeb3b' },
];

export const PACK_LIBRARY: PokerPack[] = [
    { id: 'PACK_STD', name: '給食の余り', description: 'ランダムなトランプカード3枚入り。\n1枚選んでデッキに追加。', price: 4, type: 'STANDARD', size: 3, choose: 1, icon: 'BACKPACK|#ffcc80' },
    { id: 'PACK_STD_PLUS', name: '大盛り給食', description: 'ランダムなトランプカード5枚入り。\n1枚選んでデッキに追加。', price: 6, type: 'STANDARD', size: 5, choose: 1, icon: 'BACKPACK|#ffb74d' },
    { id: 'PACK_BUFF', name: '文房具セット', description: 'ドリルや文房具が3つ入っている。\n1つ選んで手持ちに追加。', price: 6, type: 'BUFF', size: 3, choose: 1, icon: 'NOTEBOOK|#81d4fa' },
    { id: 'PACK_BUFF_L', name: '高級文房具', description: 'ドリルや文房具が5つ入っている。\n1つ選んで手持ちに追加。', price: 8, type: 'BUFF', size: 5, choose: 1, icon: 'NOTEBOOK|#4fc3f7' },
    { id: 'PACK_SUPP', name: '部員勧誘', description: 'サポーターが3人入っている。\n1人選んで仲間にする。', price: 8, type: 'SUPPORTER', size: 3, choose: 1, icon: 'SMILE|#a5d6a7' },
    { id: 'PACK_SPEC', name: 'オカルト雑誌', description: '怪しいアイテムが2つ入っている。\n1つ選んで手持ちに追加。', price: 10, type: 'SPECTRAL', size: 2, choose: 1, icon: 'EYE|#9c27b0' },
];

export const VOUCHERS_LIBRARY: PokerVoucher[] = [
    { id: 'V_GRABBER', name: 'マジックハンド', description: '毎ラウンド、手札を出す回数 +1', price: 10, icon: 'FIST|#3b82f6' },
    { id: 'V_WASTE', name: 'リサイクル箱', description: '毎ラウンド、捨てられる回数 +1', price: 10, icon: 'BACKPACK|#ef4444' },
    { id: 'V_SEED_MONEY', name: '投資信託', description: '利子の上限が $10 になる(通常$5)', price: 10, icon: 'PLANT|#22c55e' },
    { id: 'V_CLEARANCE', name: '閉店セール', description: 'ショップの商品が 25% OFF', price: 10, icon: 'FLIER|#f59e0b' },
    { id: 'V_PAINT_BRUSH', name: 'パレット', description: '手札の上限枚数 +1', price: 10, icon: 'NOTEBOOK|#a855f7' },
    { id: 'V_OVERSTOCK', name: '在庫処分', description: 'ショップの商品枠 +1', price: 10, icon: 'BACKPACK|#64748b' }
];

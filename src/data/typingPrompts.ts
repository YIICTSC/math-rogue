import type { LanguageMode } from '../types';
import { storageService } from '../services/storageService';
import { getTypingLessonDefinition, type TypingLessonId } from './typingLessonConfig';
import { EXTRA_WORDS, EXTRA_SENTENCES, EXTRA_ENGLISH, VOWEL_WORDS, typingProgress } from './typingVariety';

export type FingerId =
    | 'left-pinky'
    | 'left-ring'
    | 'left-middle'
    | 'left-index'
    | 'thumbs'
    | 'right-index'
    | 'right-middle'
    | 'right-ring'
    | 'right-pinky';

export type TypingPrompt = {
    id: string;
    title: string;
    text: string;
    answer: string;
    acceptedAnswers: string[];
    guide: string;
    finger: FingerId | null;
};

export const KEY_FINGER_MAP: Record<string, FingerId> = {
    '1': 'left-pinky', q: 'left-pinky', a: 'left-pinky', z: 'left-pinky',
    '2': 'left-ring', w: 'left-ring', s: 'left-ring', x: 'left-ring',
    '3': 'left-middle', e: 'left-middle', d: 'left-middle', c: 'left-middle',
    '4': 'left-index', '5': 'left-index', r: 'left-index', t: 'left-index', f: 'left-index', g: 'left-index', v: 'left-index', b: 'left-index',
    space: 'thumbs',
    '6': 'right-index', '7': 'right-index', y: 'right-index', u: 'right-index', h: 'right-index', j: 'right-index', n: 'right-index', m: 'right-index',
    '8': 'right-middle', i: 'right-middle', k: 'right-middle', ',': 'right-middle',
    '9': 'right-ring', o: 'right-ring', l: 'right-ring', '.': 'right-ring',
    '0': 'right-pinky', '-': 'right-pinky', '^': 'right-pinky', p: 'right-pinky', '@': 'right-pinky', '[': 'right-pinky', ';': 'right-pinky', ':': 'right-pinky', ']': 'right-pinky', '/': 'right-pinky', _: 'right-pinky'
};

const HOME_ROW_GROUPS = [
    ['f', 'j', 'ff', 'jj', 'fj', 'jf', 'fff', 'jjj', 'fjj', 'jff', 'fjf', 'jfj'],
    ['d', 'k', 'f', 'j', 'df', 'jk', 'dk', 'kj', 'dd', 'kk', 'dfj', 'jkd', 'fdk', 'kjf'],
    ['s', 'l', 'd', 'k', 'f', 'j', 'sd', 'lk', 'sdf', 'jkl', 'sdl', 'lkj', 'asdf', 'jkl;', 'sdfj', 'lkjd'],
    ['a', ';', 's', 'l', 'd', 'k', 'f', 'j', 'asd', 'jkl', 'asdf', 'fjkl', 'asdf', 'jkl;', 'asdfj', 'fjkl;', 'a;','asl;'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', 'asdfg', 'hjkl;', 'ghfj', 'asdfjkl;', 'fghj', 'dfgh', 'hjkl', 'asdfgh', 'ghjkl;', 'asdfghjkl;']
];

const ALPHABET_WORDS = [
    ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'X', 'Y', 'Z'],
    ['apple', 'train', 'music', 'light', 'story', 'paper', 'happy', 'chair', 'clock', 'dream', 'smile', 'water', 'piano', 'candy', 'flower', 'orange'],
    ['school', 'friend', 'garden', 'window', 'yellow', 'lesson', 'pencil', 'planet', 'rabbit', 'summer', 'morning', 'library', 'teacher', 'picture', 'rainbow', 'science'],
    ['adventure', 'question', 'keyboard', 'homework', 'treasure', 'notebook', 'beautiful', 'computer', 'afternoon', 'wonderland', 'classmate', 'breaktime', 'chocolate', 'pineapple', 'snowflake', 'sunshine'],
    ['champion', 'wonderful', 'classroom', 'flashlight', 'breakfast', 'playground', 'dictionary', 'everywhere', 'friendship', 'knowledge', 'technology', 'basketball', 'watermelon', 'understand', 'remembering', 'celebration', 'ABC', 'MusicRoom', 'ClassMate', 'Notebook']
];

const NUMBER_SYMBOL_DRILLS = [
    ['12', '34', '56', '78', '90', '11', '22', '44', '55', '99', '13', '24', '68', '79', '101', '202'],
    ['120', '305', '480', '750', '999', '246', '531', '808', '415', '672', '135', '864', '720', '640', '512', '1000'],
    ['7:30', '12:15', '18:45', '06:20', '20:10', '09:05', '14:40', '16:25', '19:55', '08:08', '10:30', '21:05', '05:45', '13:20', '17:15', '23:59'],
    ['1+1', '3-2', '4*5', '8/2', '10-7', '9+6', '12-4', '7*8', '18/3', '5+9', '25-8', '6*7', '42/6', '11+13', '30-12', '9*9'],
    ['2026/03/09', 'room-3', 'score:88', 'no.12', 'level_5', 'class-1', 'goal:100', 'rank_2', 'day/7', 'page-24', 'zone_A', 'item-05', 'step_4', 'code-99', 'hp:120', 'combo_8', '!?', '()', '[]', '{}', '...']
];

for(let n=0;n<96;n++) {
  NUMBER_SYMBOL_DRILLS[0].push(String(10+n));
  NUMBER_SYMBOL_DRILLS[1].push(String(100+n*7));
  NUMBER_SYMBOL_DRILLS[2].push(`${String(n%24).padStart(2,'0')}:${String(n*7%60).padStart(2,'0')}`);
  NUMBER_SYMBOL_DRILLS[3].push(`${2+n%19}${['+','-','*','/'][n%4]}${1+n*3%17}`);
  NUMBER_SYMBOL_DRILLS[4].push(`${['score:','room-','level_','page/'][n%4]}${10+n*9}`);
}

const ROMAJI_BASIC = [
    [
        { text: 'あ', accepted: ['a'] }, { text: 'い', accepted: ['i'] }, { text: 'う', accepted: ['u'] }, { text: 'え', accepted: ['e'] }, { text: 'お', accepted: ['o'] },
        { text: 'あい', accepted: ['ai'] }, { text: 'あお', accepted: ['ao'] }, { text: 'あさ', accepted: ['asa'] }, { text: 'あめ', accepted: ['ame'] }, { text: 'あし', accepted: ['ashi', 'asi'] },
        { text: 'いえ', accepted: ['ie'] }, { text: 'いぬ', accepted: ['inu'] }, { text: 'いし', accepted: ['ishi', 'isi'] }, { text: 'いと', accepted: ['ito'] }, { text: 'いす', accepted: ['isu'] },
        { text: 'うえ', accepted: ['ue'] }, { text: 'うみ', accepted: ['umi'] }, { text: 'うた', accepted: ['uta'] }, { text: 'うし', accepted: ['ushi', 'usi'] }, { text: 'うで', accepted: ['ude'] },
        { text: 'えき', accepted: ['eki'] }, { text: 'えだ', accepted: ['eda'] }, { text: 'えほん', accepted: ['ehon'] }, { text: 'えび', accepted: ['ebi'] }, { text: 'えがお', accepted: ['egao'] },
        { text: 'おに', accepted: ['oni'] }, { text: 'おと', accepted: ['oto'] }, { text: 'おか', accepted: ['oka'] }, { text: 'おけ', accepted: ['oke'] }, { text: 'おや', accepted: ['oya'] }
    ],
    [
        { text: 'か', accepted: ['ka'] }, { text: 'き', accepted: ['ki'] }, { text: 'く', accepted: ['ku'] }, { text: 'け', accepted: ['ke'] }, { text: 'こ', accepted: ['ko'] },
        { text: 'かい', accepted: ['kai'] }, { text: 'かお', accepted: ['kao'] }, { text: 'かき', accepted: ['kaki'] }, { text: 'かさ', accepted: ['kasa'] }, { text: 'かに', accepted: ['kani'] },
        { text: 'きく', accepted: ['kiku'] }, { text: 'きり', accepted: ['kiri'] }, { text: 'きのこ', accepted: ['kinoko'] }, { text: 'きつね', accepted: ['kitsune'] }, { text: 'きもの', accepted: ['kimono'] },
        { text: 'くし', accepted: ['kushi', 'kusi'] }, { text: 'くも', accepted: ['kumo'] }, { text: 'くり', accepted: ['kuri'] }, { text: 'くじら', accepted: ['kujira'] }, { text: 'くさ', accepted: ['kusa'] },
        { text: 'けし', accepted: ['keshi', 'kesi'] }, { text: 'けむり', accepted: ['kemuri'] }, { text: 'けもの', accepted: ['kemono'] }, { text: 'けいと', accepted: ['keito'] }, { text: 'けむし', accepted: ['kemushi', 'kemusi'] },
        { text: 'こい', accepted: ['koi'] }, { text: 'こえ', accepted: ['koe'] }, { text: 'こま', accepted: ['koma'] }, { text: 'こな', accepted: ['kona'] }, { text: 'こや', accepted: ['koya'] }
    ],
    [
        { text: 'さ', accepted: ['sa'] }, { text: 'し', accepted: ['shi', 'si'] }, { text: 'す', accepted: ['su'] }, { text: 'せ', accepted: ['se'] }, { text: 'そ', accepted: ['so'] },
        { text: 'さくら', accepted: ['sakura'] }, { text: 'さかな', accepted: ['sakana'] }, { text: 'さとう', accepted: ['satou', 'sato'] }, { text: 'さる', accepted: ['saru'] }, { text: 'さかなつり', accepted: ['sakanatsuri'] },
        { text: 'しお', accepted: ['shio', 'sio'] }, { text: 'しか', accepted: ['shika', 'sika'] }, { text: 'しま', accepted: ['shima', 'sima'] }, { text: 'しろ', accepted: ['shiro', 'siro'] }, { text: 'しんぶん', accepted: ['shinbun', 'sinbun'] },
        { text: 'すいか', accepted: ['suika'] }, { text: 'すな', accepted: ['suna'] }, { text: 'すし', accepted: ['sushi', 'susi'] }, { text: 'すもう', accepted: ['sumou', 'sumo'] }, { text: 'すず', accepted: ['suzu'] },
        { text: 'せみ', accepted: ['semi'] }, { text: 'せかい', accepted: ['sekai'] }, { text: 'せんせい', accepted: ['sensei'] }, { text: 'せなか', accepted: ['senaka'] }, { text: 'せんろ', accepted: ['senro'] },
        { text: 'そら', accepted: ['sora'] }, { text: 'そば', accepted: ['soba'] }, { text: 'そと', accepted: ['soto'] }, { text: 'そり', accepted: ['sori'] }, { text: 'そうじ', accepted: ['souji', 'soji'] }
    ],
    [{ text: 'た', accepted: ['ta'] }, { text: 'ち', accepted: ['chi', 'ti'] }, { text: 'つ', accepted: ['tsu', 'tu'] }, { text: 'て', accepted: ['te'] }, { text: 'と', accepted: ['to'] }, { text: 'な', accepted: ['na'] }, { text: 'に', accepted: ['ni'] }, { text: 'ぬ', accepted: ['nu'] }, { text: 'ね', accepted: ['ne'] }, { text: 'の', accepted: ['no'] }, { text: 'は', accepted: ['ha'] }, { text: 'ひ', accepted: ['hi'] }, { text: 'ふ', accepted: ['fu', 'hu'] }, { text: 'へ', accepted: ['he'] }, { text: 'ほ', accepted: ['ho'] }, { text: 'ま', accepted: ['ma'] }, { text: 'み', accepted: ['mi'] }, { text: 'む', accepted: ['mu'] }, { text: 'め', accepted: ['me'] }, { text: 'も', accepted: ['mo'] }, { text: 'や', accepted: ['ya'] }, { text: 'ゆ', accepted: ['yu'] }, { text: 'よ', accepted: ['yo'] }, { text: 'ら', accepted: ['ra'] }, { text: 'り', accepted: ['ri'] }, { text: 'る', accepted: ['ru'] }, { text: 'れ', accepted: ['re'] }, { text: 'ろ', accepted: ['ro'] }, { text: 'わ', accepted: ['wa'] }, { text: 'を', accepted: ['wo', 'o'] }, { text: 'ん', accepted: ['n', 'nn'] }, { text: 'とけい', accepted: ['tokei'] }, { text: 'ちから', accepted: ['chikara', 'tikara'] }],
    [
        { text: 'たこ', accepted: ['tako'] }, { text: 'たまご', accepted: ['tamago'] }, { text: 'たから', accepted: ['takara'] }, { text: 'たいこ', accepted: ['taiko'] }, { text: 'たぬき', accepted: ['tanuki'] },
        { text: 'ちず', accepted: ['chizu', 'tizu'] }, { text: 'ちから', accepted: ['chikara', 'tikara'] }, { text: 'ちきゅう', accepted: ['chikyuu', 'tikyuu'] }, { text: 'ちずちょう', accepted: ['chizuchou', 'tizutyou'] }, { text: 'ちいき', accepted: ['chiiki', 'tiiki'] },
        { text: 'つき', accepted: ['tsuki', 'tuki'] }, { text: 'つな', accepted: ['tsuna', 'tuna'] }, { text: 'つる', accepted: ['tsuru', 'turu'] }, { text: 'つばさ', accepted: ['tsubasa', 'tubasa'] }, { text: 'つみき', accepted: ['tsumiki', 'tumiki'] },
        { text: 'てら', accepted: ['tera'] }, { text: 'てがみ', accepted: ['tegami'] }, { text: 'てつどう', accepted: ['tetsudou', 'tetudou'] }, { text: 'てぶくろ', accepted: ['tebukuro'] }, { text: 'てんき', accepted: ['tenki'] },
        { text: 'とけい', accepted: ['tokei'] }, { text: 'とり', accepted: ['tori'] }, { text: 'とびら', accepted: ['tobira'] }, { text: 'ともだち', accepted: ['tomodachi', 'tomodati'] }, { text: 'とら', accepted: ['tora'] },
        { text: 'がっこう', accepted: ['gakkou', 'gakko'] }, { text: 'せんせい', accepted: ['sensei'] }, { text: 'きょうしつ', accepted: ['kyoushitsu', 'kyositu'] }, { text: 'ぼうけん', accepted: ['bouken', 'boken'] }, { text: 'しんごう', accepted: ['shingou', 'singo'] },
        { text: 'はなみ', accepted: ['hanami'] }, { text: 'ふね', accepted: ['fune', 'hune'] }, { text: 'へや', accepted: ['heya'] }, { text: 'ほし', accepted: ['hoshi', 'hosi'] },
        { text: 'まど', accepted: ['mado'] }, { text: 'みず', accepted: ['mizu'] }, { text: 'むし', accepted: ['mushi', 'musi'] }, { text: 'めがね', accepted: ['megane'] }, { text: 'もり', accepted: ['mori'] },
        { text: 'やま', accepted: ['yama'] }, { text: 'ゆめ', accepted: ['yume'] }, { text: 'よる', accepted: ['yoru'] },
        { text: 'らいおん', accepted: ['raion'] }, { text: 'りす', accepted: ['risu'] }, { text: 'るすばん', accepted: ['rusuban'] }, { text: 'れもん', accepted: ['remon'] }, { text: 'ろうか', accepted: ['rouka', 'roka'] },
        { text: 'わに', accepted: ['wani'] }, { text: 'わごむ', accepted: ['wagomu'] }, { text: 'をとこ', accepted: ['wotoko', 'otoko'] }, { text: 'しんぶん', accepted: ['shinbun', 'sinbun'] },
        { text: 'なつやすみ', accepted: ['natsuyasumi'] }, { text: 'はくぶつかん', accepted: ['hakubutsukan'] }, { text: 'まほう', accepted: ['mahou', 'maho'] }, { text: 'ゆうぐ', accepted: ['yuugu', 'yugu'] }, { text: 'れきし', accepted: ['rekishi'] }, { text: 'わらいごえ', accepted: ['waraigoe'] }
    ]
];

const ROMAJI_ADVANCED = [
    [
        { text: 'が', accepted: ['ga'] }, { text: 'ぎ', accepted: ['gi'] }, { text: 'ぐ', accepted: ['gu'] }, { text: 'げ', accepted: ['ge'] }, { text: 'ご', accepted: ['go'] },
        { text: 'ざ', accepted: ['za'] }, { text: 'じ', accepted: ['ji', 'zi'] }, { text: 'ず', accepted: ['zu'] }, { text: 'ぜ', accepted: ['ze'] }, { text: 'ぞ', accepted: ['zo'] },
        { text: 'だ', accepted: ['da'] }, { text: 'ぢ', accepted: ['di', 'ji'] }, { text: 'づ', accepted: ['du', 'zu'] }, { text: 'で', accepted: ['de'] }, { text: 'ど', accepted: ['do'] },
        { text: 'ば', accepted: ['ba'] }, { text: 'び', accepted: ['bi'] }, { text: 'ぶ', accepted: ['bu'] }, { text: 'べ', accepted: ['be'] }, { text: 'ぼ', accepted: ['bo'] },
        { text: 'ぱ', accepted: ['pa'] }, { text: 'ぴ', accepted: ['pi'] }, { text: 'ぷ', accepted: ['pu'] }, { text: 'ぺ', accepted: ['pe'] }, { text: 'ぽ', accepted: ['po'] },
        { text: 'きゃ', accepted: ['kya'] }, { text: 'きゅ', accepted: ['kyu'] }, { text: 'きょ', accepted: ['kyo'] },
        { text: 'しゃ', accepted: ['sha', 'sya'] }, { text: 'しゅ', accepted: ['shu', 'syu'] }, { text: 'しょ', accepted: ['sho', 'syo'] },
        { text: 'ちゃ', accepted: ['cha', 'tya'] }, { text: 'ちゅ', accepted: ['chu', 'tyu'] }, { text: 'ちょ', accepted: ['cho', 'tyo'] }
    ],
    [
        { text: 'にゃ', accepted: ['nya'] }, { text: 'にゅ', accepted: ['nyu'] }, { text: 'にょ', accepted: ['nyo'] },
        { text: 'ひゃ', accepted: ['hya'] }, { text: 'ひゅ', accepted: ['hyu'] }, { text: 'ひょ', accepted: ['hyo'] },
        { text: 'みゃ', accepted: ['mya'] }, { text: 'みゅ', accepted: ['myu'] }, { text: 'みょ', accepted: ['myo'] },
        { text: 'りゃ', accepted: ['rya'] }, { text: 'りゅ', accepted: ['ryu'] }, { text: 'りょ', accepted: ['ryo'] },
        { text: 'ぎゃ', accepted: ['gya'] }, { text: 'ぎゅ', accepted: ['gyu'] }, { text: 'ぎょ', accepted: ['gyo'] },
        { text: 'じゃ', accepted: ['ja', 'zya'] }, { text: 'じゅ', accepted: ['ju', 'zyu'] }, { text: 'じょ', accepted: ['jo', 'zyo'] },
        { text: 'びゃ', accepted: ['bya'] }, { text: 'びゅ', accepted: ['byu'] }, { text: 'びょ', accepted: ['byo'] },
        { text: 'ぴゃ', accepted: ['pya'] }, { text: 'ぴゅ', accepted: ['pyu'] }, { text: 'ぴょ', accepted: ['pyo'] },
        { text: 'きゃく', accepted: ['kyaku'] }, { text: 'きゅうり', accepted: ['kyuuri', 'kyuri'] }, { text: 'きょう', accepted: ['kyou', 'kyo'] },
        { text: 'しゃしん', accepted: ['shashin', 'syasin'] }, { text: 'しゅくだい', accepted: ['shukudai', 'syukudai'] }, { text: 'しょうがく', accepted: ['shougaku', 'syougaku', 'shogaku'] },
        { text: 'ちゃわん', accepted: ['chawan', 'tyawan'] }, { text: 'ちゅうがく', accepted: ['chuugaku', 'tyuugaku'] }, { text: 'ちょうちょ', accepted: ['choucho', 'tyoutyo'] },
        { text: 'にゃんこ', accepted: ['nyanko'] }, { text: 'にゅうがく', accepted: ['nyuugaku', 'nyugaku'] }, { text: 'にょきにょき', accepted: ['nyokinyoki'] },
        { text: 'ひゃく', accepted: ['hyaku'] }, { text: 'ひゅう', accepted: ['hyuu', 'hyu'] }, { text: 'ひょう', accepted: ['hyou', 'hyo'] },
        { text: 'みゃく', accepted: ['myaku'] }, { text: 'みゅーじっく', accepted: ['myu-jikku', 'myuujikku'] }, { text: 'みょうじ', accepted: ['myouji', 'myoji'] },
        { text: 'りゃく', accepted: ['ryaku'] }, { text: 'りゅう', accepted: ['ryuu', 'ryu'] }, { text: 'りょうり', accepted: ['ryouri', 'ryori'] },
        { text: 'ぁ', accepted: ['la', 'xa'] }, { text: 'ぃ', accepted: ['li', 'xi'] }, { text: 'ぅ', accepted: ['lu', 'xu'] }, { text: 'ぇ', accepted: ['le', 'xe'] }, { text: 'ぉ', accepted: ['lo', 'xo'] }
    ],
    [
        { text: 'がっこう', accepted: ['gakkou', 'gakko'] }, { text: 'きって', accepted: ['kitte'] }, { text: 'さっか', accepted: ['sakka'] }, { text: 'しっぱい', accepted: ['shippai'] }, { text: 'ざっし', accepted: ['zasshi'] }, { text: 'きっさてん', accepted: ['kissaten'] }, { text: 'がっしょう', accepted: ['gasshou', 'gassyo'] }, { text: 'きっちん', accepted: ['kicchin'] }, { text: 'はっぴ', accepted: ['happi'] }, { text: 'ろっかー', accepted: ['rokkaa', 'rokka-'] },
        { text: 'おかあさん', accepted: ['okaasan', 'okasan'] }, { text: 'せんせい', accepted: ['sensei'] }, { text: 'こうえん', accepted: ['kouen', 'koen'] }, { text: 'コーヒー', accepted: ['ko-hi-', 'koohii'] }, { text: 'ほん', accepted: ['hon'] }, { text: 'かんじ', accepted: ['kanji'] }, { text: 'てんき', accepted: ['tenki'] },
        { text: 'あ、あの', accepted: ['a,ano', 'a、あの'] }, { text: 'ぼ、ぼく', accepted: ['bo,boku', 'bo、ぼく'] }, { text: 'えっ', accepted: ['えっ', 'extsu', 'extu', 'eltsu', 'eltu'] }
    ],
    [
        { text: 'ぎゃく', accepted: ['gyaku'] }, { text: 'ぎゅうにゅう', accepted: ['gyuunyuu', 'gyunyuu'] }, { text: 'ぎょうれつ', accepted: ['gyouretsu', 'gyoretsu'] }, { text: 'じゃがいも', accepted: ['jagaimo', 'zyagaimo'] }, { text: 'じゃんけん', accepted: ['janken', 'zyanken'] }, { text: 'じゅぎょう', accepted: ['jugyou', 'zyugyou'] }, { text: 'じょうほう', accepted: ['jouhou', 'zyouhou'] }, { text: 'びゃくや', accepted: ['byakuya'] }, { text: 'びゅー', accepted: ['byu-', 'byuu'] }, { text: 'びょういん', accepted: ['byouin', 'byoin'] }, { text: 'ぴゃの', accepted: ['pyano'] }, { text: 'ぴゅあ', accepted: ['pyua'] }, { text: 'ぴょう', accepted: ['pyou', 'pyo'] }, { text: 'ぴょんぴょん', accepted: ['pyonpyon'] }, { text: 'ちょうちょ', accepted: ['choucho', 'tyoutyo'] }, { text: 'りゅうがく', accepted: ['ryuugaku', 'ryugaku'] }, { text: 'じゅんびちゅう', accepted: ['junbichuu', 'zyunbityuu'] }, { text: 'きゃんぷじょう', accepted: ['kyanpujou', 'kyanpuzyou'] }, { text: 'しゃしんちょう', accepted: ['shashinchou', 'syasinchou'] },
        { text: 'ふぁ', accepted: ['fa'] }, { text: 'ふぃ', accepted: ['fi'] }, { text: 'ふぇ', accepted: ['fe'] }, { text: 'ふぉ', accepted: ['fo'] },
        { text: 'てぃ', accepted: ['ti'] }, { text: 'でぃ', accepted: ['di'] }, { text: 'とぅ', accepted: ['tu'] }, { text: 'どぅ', accepted: ['du'] },
        { text: 'つぁ', accepted: ['tsa'] }, { text: 'つぃ', accepted: ['tsi'] }, { text: 'つぇ', accepted: ['tse'] }, { text: 'つぉ', accepted: ['tso'] },
        { text: 'しぇ', accepted: ['she', 'sye'] }, { text: 'じぇ', accepted: ['je', 'zye'] }, { text: 'ちぇ', accepted: ['che', 'tye'] }
    ],
    [
        { text: 'しょうがっこう', accepted: ['shougakkou', 'syougakkou', 'shogakko'] }, { text: 'きょうりゅう', accepted: ['kyouryuu', 'kyoryuu'] }, { text: 'ちゅうしゃじょう', accepted: ['chuushajou', 'tyuusyajou'] }, { text: 'りょこうちゅう', accepted: ['ryokouchuu', 'ryokotyuu'] }, { text: 'じゅぎょうちゅう', accepted: ['jugyouchuu', 'zyugyoutyuu'] }, { text: 'ぎゃくてんしゅうり', accepted: ['gyakutenshuuri'] }, { text: 'びょうどうしょうぶ', accepted: ['byoudoushoubu', 'byodoshoubu'] }, { text: 'じゃんぐるじむ', accepted: ['jangurujimu', 'zyangurujimu'] }, { text: 'ぴゃくにんいっしゅ', accepted: ['pyakuninisshu'] }, { text: 'きゅうしょくとうばん', accepted: ['kyuushokutouban', 'kyusyokutouban'] },
        { text: 'ヴァイオリン', accepted: ['vaiorin'] }, { text: 'ヴィーナス', accepted: ['vi-nasu', 'viinasu'] }, { text: 'ヴ', accepted: ['vu'] }, { text: 'ヴェール', accepted: ['ve-ru', 'veeru'] }, { text: 'ヴォイス', accepted: ['voisu'] },
        { text: '。', accepted: ['。', '.'] }, { text: '、', accepted: ['、', ','] }, { text: '！', accepted: ['！', '!'] }, { text: '？', accepted: ['？', '?'] }, { text: '・', accepted: ['・', '/'] }, { text: '「」', accepted: ['「」', '[]'] }, { text: '（）', accepted: ['（）', '()'] }, { text: 'ー', accepted: ['ー', '-'] },
        { text: 'いい', accepted: ['ii'] }, { text: 'おお', accepted: ['oo'] }
    ]
];

const ROMAJI_NA_HA = [
    { text: 'な', accepted: ['na'] }, { text: 'に', accepted: ['ni'] }, { text: 'ぬ', accepted: ['nu'] }, { text: 'ね', accepted: ['ne'] }, { text: 'の', accepted: ['no'] },
    { text: 'は', accepted: ['ha'] }, { text: 'ひ', accepted: ['hi'] }, { text: 'ふ', accepted: ['fu', 'hu'] }, { text: 'へ', accepted: ['he'] }, { text: 'ほ', accepted: ['ho'] },
    { text: 'はな', accepted: ['hana'] }, { text: 'にわ', accepted: ['niwa'] }, { text: 'ふね', accepted: ['fune', 'hune'] }, { text: 'ほし', accepted: ['hoshi', 'hosi'] }, { text: 'ねこ', accepted: ['neko'] },
    { text: 'なのはな', accepted: ['nanohana'] }, { text: 'はなび', accepted: ['hanabi'] }, { text: 'にほん', accepted: ['nihon'] }, { text: 'ひこうき', accepted: ['hikouki', 'hikoki'] }, { text: 'ほうかご', accepted: ['houkago', 'hokago'] }
];

const ROMAJI_MA_YA_RA_WA = [
    { text: 'ま', accepted: ['ma'] }, { text: 'み', accepted: ['mi'] }, { text: 'む', accepted: ['mu'] }, { text: 'め', accepted: ['me'] }, { text: 'も', accepted: ['mo'] },
    { text: 'や', accepted: ['ya'] }, { text: 'ゆ', accepted: ['yu'] }, { text: 'よ', accepted: ['yo'] },
    { text: 'ら', accepted: ['ra'] }, { text: 'り', accepted: ['ri'] }, { text: 'る', accepted: ['ru'] }, { text: 'れ', accepted: ['re'] }, { text: 'ろ', accepted: ['ro'] },
    { text: 'わ', accepted: ['wa'] }, { text: 'を', accepted: ['wo', 'o'] }, { text: 'ん', accepted: ['n', 'nn'] },
    { text: 'まど', accepted: ['mado'] }, { text: 'やま', accepted: ['yama'] }, { text: 'りす', accepted: ['risu'] }, { text: 'れもん', accepted: ['remon'] }, { text: 'わに', accepted: ['wani'] },
    { text: 'みらい', accepted: ['mirai'] }, { text: 'ゆうやけ', accepted: ['yuuyake', 'yuyake'] }, { text: 'ろうか', accepted: ['rouka', 'roka'] }, { text: 'わらいごえ', accepted: ['waraigoe'] }, { text: 'まほう', accepted: ['mahou', 'maho'] }
];

const SCHOOL_WORDS = [
    [{ text: 'がっこう', accepted: ['がっこう', 'gakkou', 'gakko'] }, { text: 'きょうしつ', accepted: ['きょうしつ', 'kyoushitsu', 'kyositu'] }, { text: 'せんせい', accepted: ['せんせい', 'sensei'] }, { text: 'ともだち', accepted: ['ともだち', 'tomodachi', 'tomodati'] }, { text: 'こくご', accepted: ['こくご', 'kokugo'] }, { text: 'さんすう', accepted: ['さんすう', 'sansuu'] }, { text: 'りか', accepted: ['りか', 'rika'] }, { text: 'しゃかい', accepted: ['しゃかい', 'shakai'] }, { text: 'おんがく', accepted: ['おんがく', 'ongaku'] }, { text: 'たいいく', accepted: ['たいいく', 'taiiku'] }, { text: 'えんぴつ', accepted: ['えんぴつ', 'enpitsu'] }, { text: 'けしごむ', accepted: ['けしごむ', 'keshigomu'] }],
    [{ text: 'きゅうしょく', accepted: ['きゅうしょく', 'kyuushoku'] }, { text: 'しゅくだい', accepted: ['しゅくだい', 'shukudai'] }, { text: 'のうと', accepted: ['のうと', 'nouto', 'noto'] }, { text: 'つくえ', accepted: ['つくえ', 'tsukue'] }, { text: 'いす', accepted: ['いす', 'isu'] }, { text: 'としょしつ', accepted: ['としょしつ', 'toshoshitsu'] }, { text: 'こうてい', accepted: ['こうてい', 'koutei', 'kotei'] }, { text: 'たいそう', accepted: ['たいそう', 'taisou', 'taiso'] }, { text: 'あさのかい', accepted: ['あさのかい', 'asanokai'] }, { text: 'かえりのかい', accepted: ['かえりのかい', 'kaerinokai'] }, { text: 'そうじ', accepted: ['そうじ', 'souji', 'soji'] }, { text: 'ほうかご', accepted: ['ほうかご', 'houkago', 'hokago'] }],
    [{ text: 'きゅうしょくとうばん', accepted: ['きゅうしょくとうばん', 'kyuushokutouban', 'kyusyokutouban'] }, { text: 'きょうかしょ', accepted: ['きょうかしょ', 'kyoukasho'] }, { text: 'したじき', accepted: ['したじき', 'shitajiki'] }, { text: 'ふでばこ', accepted: ['ふでばこ', 'fudebako'] }, { text: 'じょうぎ', accepted: ['じょうぎ', 'jougi', 'zyougi'] }, { text: 'えのぐ', accepted: ['えのぐ', 'enogu'] }, { text: 'ずこうしつ', accepted: ['ずこうしつ', 'zukoushitsu', 'zukositu'] }, { text: 'りかしつ', accepted: ['りかしつ', 'rikashitsu'] }, { text: 'おんがくしつ', accepted: ['おんがくしつ', 'ongakushitsu'] }, { text: 'たいいくかん', accepted: ['たいいくかん', 'taiikukan'] }, { text: 'こうしゃ', accepted: ['こうしゃ', 'kousha', 'kosya'] }, { text: 'せいと', accepted: ['せいと', 'seito'] }],
    [{ text: 'せき', accepted: ['せき', 'seki'] }, { text: 'ばんしょ', accepted: ['ばんしょ', 'bansho', 'bansyo'] }, { text: 'こくばん', accepted: ['こくばん', 'kokuban'] }, { text: 'じゅぎょう', accepted: ['じゅぎょう', 'jugyou', 'zyugyou'] }, { text: 'きょうだい', accepted: ['きょうだい', 'kyoudai'] }, { text: 'こうちょう', accepted: ['こうちょう', 'kouchou', 'kotyou'] }, { text: 'きょうとう', accepted: ['きょうとう', 'kyoutou', 'kyoto'] }, { text: 'いいんかい', accepted: ['いいんかい', 'iinkai'] }, { text: 'しょくいんしつ', accepted: ['しょくいんしつ', 'shokuinshitsu'] }, { text: 'うんどうかい', accepted: ['うんどうかい', 'undoukai', 'undokai'] }, { text: 'えんそく', accepted: ['えんそく', 'ensoku'] }, { text: 'しゃかいかけんがく', accepted: ['しゃかいかけんがく', 'shakaikakengaku'] }],
    [{ text: 'そつぎょう', accepted: ['そつぎょう', 'sotsugyou', 'sotugyou'] }, { text: 'おはようございます', accepted: ['おはようございます', 'ohayougozaimasu', 'ohayogozaimasu'] }, { text: 'ありがとうございました', accepted: ['ありがとうございました', 'arigatougozaimashita'] }, { text: 'よろしくおねがいします', accepted: ['よろしくおねがいします', 'yoroshikuonegaishimasu'] }, { text: 'しつれいします', accepted: ['しつれいします', 'shitsureishimasu'] }, { text: 'おしえてください', accepted: ['おしえてください', 'oshietekudasai'] }, { text: 'きこえましたか', accepted: ['きこえましたか', 'kikoemashitaka'] }, { text: 'じゅんびはいいですか', accepted: ['じゅんびはいいですか', 'junbiwaiidesuka'] }, { text: 'きょうもげんきにがんばろう', accepted: ['きょうもげんきにがんばろう', 'kyoumogenkiniganbarou'] }, { text: 'わからないところはしらべよう', accepted: ['わからないところはしらべよう', 'wakaranaitokorohashirabeyou'] }]
];

const SENTENCE_DRILLS = [
    [{ text: 'わたしはねこがすきです', accepted: ['わたしはねこがすきです', 'watashihanekogasukidesu'] }, { text: 'きょうはいいてんきです', accepted: ['きょうはいいてんきです', 'kyouhaiitenkidesu'] }, { text: 'あしたはがっこうです', accepted: ['あしたはがっこうです', 'ashitahagakkoudesu'] }, { text: 'ともだちとあそびます', accepted: ['ともだちとあそびます', 'tomodachitoasobimasu'] }, { text: 'こうえんであそびます', accepted: ['こうえんであそびます', 'kouendeasobimasu'] }, { text: 'きょうはたいいくがあります', accepted: ['きょうはたいいくがあります', 'kyouhataiikugaarimasu'] }, { text: 'ぼくはりんごがすきです', accepted: ['ぼくはりんごがすきです', 'bokuharingogasukidesu'] }],
    [{ text: 'わたしはほんをよみます', accepted: ['わたしはほんをよみます', 'watashihahonyomimasu'] }, { text: 'きょうはえんそくです', accepted: ['きょうはえんそくです', 'kyouhaensokudesu'] }, { text: 'せんせいにあいさつします', accepted: ['せんせいにあいさつします', 'senseiniaisatsushimasu'] }, { text: 'ぼくは がっこうへ いく。', accepted: ['ぼくはがっこうへいく', 'bokuhagakkouheiku'] }, { text: 'ほんを よんで しらべる。', accepted: ['ほんをよんでしらべる', 'honwoyondeshiraberu'] }, { text: 'みずを のんで やすむ。', accepted: ['みずをのんでやすむ', 'mizuwonondeyasumu'] }, { text: 'えんぴつを もって すわる。', accepted: ['えんぴつをもってすわる', 'enpitsuwomottesuwaru'] }],
    [{ text: 'きょうの よていを たしかめる。', accepted: ['きょうのよていをたしかめる', 'kyounoyoteiwotashikameru'] }, { text: 'ともだちと こうえんで あそびます。', accepted: ['ともだちとこうえんであそびます', 'tomodachitokouendeasobimasu'] }, { text: 'あめのひは ほんを よむことが おおいです。', accepted: ['あめのひはほんをよむことがおおいです', 'amenohihahonyomukotogaooidesu'] }, { text: 'きゅうしょくの じかんが たのしみです。', accepted: ['きゅうしょくのじかんがたのしみです', 'kyuushokunojikangatanojimidesu'] }, { text: 'きょうもたのしいいちにちでした', accepted: ['きょうもたのしいいちにちでした', 'kyoumotanoshiiichinichideshita'] }, { text: 'しゅくだいをしてからあそびます', accepted: ['しゅくだいをしてからあそびます', 'shukudaiwoshitekaraasobimasu'] }, { text: 'ほんをよんであたらしいことをしります', accepted: ['ほんをよんであたらしいことをしります', 'honwoyondeatarashiikotowoshirimasu'] }],
    [{ text: 'こんにちは', accepted: ['こんにちは', 'konnichiwa', 'konnitiha'] }, { text: 'ありがとうございます', accepted: ['ありがとうございます', 'arigatougozaimasu'] }, { text: 'おはようございます', accepted: ['おはようございます', 'ohayougozaimasu', 'ohayogozaimasu'] }, { text: 'よろしくおねがいします', accepted: ['よろしくおねがいします', 'yoroshikuonegaishimasu'] }, { text: 'しんかんせん', accepted: ['しんかんせん', 'shinkansen', 'sinkansen'] }, { text: 'かえるぴょこぴょこ', accepted: ['かえるぴょこぴょこ', 'kaerupyokopyoko', 'kaerupykopyoko'] }, { text: 'きょうもたのしくたいぴんぐれんしゅう', accepted: ['きょうもたのしくたいぴんぐれんしゅう', 'kyoumotanoshikutaipingurenshuu'] }],
    [{ text: 'とうきょうとっきょきょかきょく', accepted: ['とうきょうとっきょきょかきょく', 'toukyoutokkyokyokakyoku', 'tokyotokkyokyokakyoku'] }, { text: 'すもももももももものうち', accepted: ['すもももももももものうち', 'sumomomomomomomonouchi'] }, { text: 'なまむぎなまごめなまたまご', accepted: ['なまむぎなまごめなまたまご', 'namamuginamagomenamatamago'] }, { text: 'あかまきがみあおまきがみ', accepted: ['あかまきがみあおまきがみ', 'akamakigamiaomakigami'] }, { text: 'ていねいにうつことで ただしいタイピングがみにつく。', accepted: ['ていねいにうつことでただしいたいぴんぐがみにつく', 'teineiniutsukotodetadashiitaipingugaminitsuku'] }, { text: 'あきらめずにつづけると すこしずつはやくなる。', accepted: ['あきらめずにつづけるとすこしずつはやくなる', 'akiramezunitsuzukerutosukoshizutsuhayakunaru'] }, { text: 'まちがえたところをたしかめると つぎはもっとじょうずになる。', accepted: ['まちがえたところをたしかめるとつぎはもっとじょうずになる', 'machigaetatokorowotashikamerutotsugihamottojouzuninaru'] }]
];

const ENGLISH_DRILLS = [
    ['cat', 'dog', 'sun', 'book', 'pen', 'milk', 'desk', 'ball', 'star', 'fish', 'apple', 'music', 'table', 'chair', 'water', 'clock'],
    ['hello', 'thank you', 'good job', 'school', 'friend', 'teacher', 'pencil', 'library', 'music room', 'play time', 'good morning', 'see you', 'classroom', 'notebook', 'science room', 'lunch time'],
    ['I like apples.', 'This is my book.', 'We play soccer.', 'Open the window.', 'Close the door.', 'I have two pencils.', 'My bag is blue.', 'She likes music.', 'It is a red ball.', 'We read every day.'],
    ['Can you help me?', 'I want to read this story.', 'Today is a sunny day.', 'My favorite subject is music.', 'We clean the classroom after lunch.', 'Please show me your notebook.', 'I can speak a little English.', 'My brother plays the piano.', 'We will visit the library today.', 'Do you have a yellow pencil?'],
    ['Typing practice makes me faster.', 'We study English in the classroom.', 'Please check your homework carefully.', 'Reading every day helps me learn new words.', 'I will do my best and keep practicing.', 'Our team worked together and won the game.', 'I want to share my idea with the class.', 'Learning new words helps me read longer stories.', 'Please write your answer on this worksheet.', 'I am getting better because I practice every day.']
];

const ENGLISH_NATIVE_LESSON_DRILLS: Record<TypingLessonId, string[][]> = {
    HOME_ROW: [
        ['f', 'j', 'ff', 'jj', 'fj', 'jf'],
        ['a', 's', 'd', 'f', 'j', 'k', 'l'],
        ['asdf', 'jkl', 'fall', 'ask', 'dad', 'sad'],
        ['flash', 'shall', 'glass', 'salad', 'dash'],
        ['all falls', 'a sad lad', 'ask dad', 'flash falls']
    ],
    ALPHABET: [
        ['a', 'b', 'c', 'd', 'e', 'f'],
        ['g', 'h', 'i', 'j', 'k', 'l'],
        ['m', 'n', 'o', 'p', 'q', 'r'],
        ['s', 't', 'u', 'v', 'w', 'x', 'y', 'z'],
        ['abcdefghijklmnopqrstuvwxyz', 'quick brown fox', 'pack my box']
    ],
    NUMBERS_SYMBOLS: NUMBER_SYMBOL_DRILLS,
    ROMAJI_VOWELS: [
        ['cat', 'map', 'jam', 'bag', 'hat'],
        ['bed', 'pen', 'red', 'hen', 'web'],
        ['pig', 'sit', 'fin', 'zip', 'milk'],
        ['hot', 'fox', 'log', 'top', 'clock'],
        ['sun', 'cup', 'bus', 'run', 'duck']
    ],
    ROMAJI_KA: [
        ['cat', 'bat', 'hat', 'mat', 'sat'],
        ['hen', 'pen', 'ten', 'men', 'den'],
        ['big', 'dig', 'fig', 'pig', 'wig'],
        ['hop', 'mop', 'pop', 'top', 'stop'],
        ['map', 'jet', 'fin', 'rock', 'sun']
    ],
    ROMAJI_SA: [
        ['ship', 'shop', 'fish', 'shell', 'brush'],
        ['chip', 'chat', 'lunch', 'chair', 'teacher'],
        ['this', 'that', 'three', 'think', 'math'],
        ['what', 'when', 'where', 'which', 'white'],
        ['shoes', 'children', 'birthday', 'whisper', 'weather']
    ],
    ROMAJI_TA: [
        ['blue', 'black', 'clap', 'flag', 'plant'],
        ['crab', 'drum', 'frog', 'green', 'train'],
        ['skip', 'slide', 'smile', 'star', 'swing'],
        ['desk', 'hand', 'lamp', 'milk', 'tent'],
        ['class', 'friend', 'spring', 'street', 'blend']
    ],
    ROMAJI_NA_HA: [
        ['a', 'I', 'the', 'is', 'to', 'we'],
        ['who', 'what', 'when', 'where', 'why'],
        ['come', 'look', 'make', 'play', 'read'],
        ['book', 'class', 'friend', 'school', 'teacher'],
        ['because', 'every', 'favorite', 'people', 'together']
    ],
    ROMAJI_MA_YA_RA_WA: [
        ['cake', 'game', 'name', 'same', 'take'],
        ['bright', 'flight', 'light', 'night', 'right'],
        ['around', 'found', 'ground', 'sound', 'round'],
        ['action', 'question', 'station', 'motion', 'caption'],
        ['daylight', 'playground', 'classmate', 'notebook', 'sunshine']
    ],
    ROMAJI_BASIC: [
        ['book', 'desk', 'pen', 'pencil', 'ruler'],
        ['child', 'friend', 'student', 'teacher', 'helper'],
        ['classroom', 'library', 'office', 'playground', 'school'],
        ['art', 'English', 'math', 'music', 'science'],
        ['homework', 'lunch time', 'recess', 'school bus', 'worksheet']
    ],
    ROMAJI_ADVANCED: [
        ['boat', 'clean', 'read', 'team', 'rain'],
        ['cake', 'home', 'kite', 'note', 'use'],
        ['knee', 'knock', 'lamb', 'write', 'wrong'],
        ['careful', 'helpful', 'reading', 'played', 'quickly'],
        ['beautiful', 'different', 'favorite', 'question', 'straight']
    ],
    WORDS: [
        ['author', 'chapter', 'detail', 'story', 'title'],
        ['answer', 'count', 'equal', 'number', 'shape'],
        ['energy', 'observe', 'planet', 'plant', 'weather'],
        ['design', 'idea', 'plan', 'project', 'team'],
        ['information', 'measurement', 'paragraph', 'solution', 'experiment']
    ],
    SENTENCES: [
        ['I can read.', 'We like school.', 'This is my book.', 'The sun is hot.'],
        ['My friend sits by me.', 'We play outside at recess.', 'I bring a pencil to class.'],
        ['Can you help me?', 'Where is the library?', 'What time is lunch?'],
        ['Open your book to page ten.', 'Write your name at the top.', 'Check your answer carefully.'],
        ['Our class worked together to finish the science project.', 'I practice every day because I want to improve.']
    ],
    ENGLISH: [
        ['Hello!', 'Good morning.', 'How are you?', 'Thank you.'],
        ['Please help me.', 'May I join you?', 'Can I borrow a pencil?', 'Please say that again.'],
        ['What do you think?', 'Which book do you like?', 'How did you solve it?'],
        ['I agree with your idea.', 'I would like to add one point.', 'Let us work as a team.'],
        ['I think this answer is correct because the details match.', 'Could you explain how you found your answer?']
    ],
    MIXED: [
        ['book 2', 'team 4', 'page 10', 'room 3'],
        ['Monday', 'English', 'Ms. Green', 'Science Club'],
        ['Yes, I can.', 'Wait!', 'Is it 8?', 'Great job!'],
        ['July 28, 2026', 'Room 3B', '9:15 a.m.', 'Score: 88'],
        ['At 9:15, our class will meet in Room 3B.', 'Great job! You solved 8 out of 10 questions.']
    ]
};

const MIXED_DRILLS = [
    ['fj', 'dk', '12', 'cat', 'あ', '45', 'sun', 'い', '34', 'pen', 'う', 'jk'],
    ['book', '7:30', 'か', 'friend', 'きょう', 'desk', '9:15', 'hello', 'school', '23', 'のうと', 'thank you'],
    ['gakkou', 'hello', '3+4', 'しゅくだい', 'music', 'kyoushitsu', 'pen', '8/2', 'sensei', 'library', 'きゅうしょく', '4*6'],
    ['きょうはいいてんきです', 'Can you help me?', 'room-3', 'じゃんけん', 'keyboard', 'score:88', 'しんごう', '2026/03/09', 'I like apples.', 'きょうしつ'],
    ['みんなでちからをあわせる', 'Typing practice makes me faster.', '2026/03/09', 'しょうがっこう', 'wonderful', 'じゅぎょうちゅう', 'Please check your homework carefully.', 'きゅうしょくとうばん', 'level_5', 'Our team worked together and won the game.']
];

export const normalizeAnswer = (value: string) => value.trim().toLowerCase().replace(/\s+/g, '');
const HAS_KANA_RE = /[ぁ-ゖァ-ヺ]/;
const ROMAJI_VARIANT_RULES = [
    ['sha', 'sya'],
    ['shu', 'syu'],
    ['sho', 'syo'],
    ['cha', 'tya'],
    ['chu', 'tyu'],
    ['cho', 'tyo'],
    ['ja', 'zya'],
    ['ju', 'zyu'],
    ['jo', 'zyo'],
    ['ltsu', 'xtsu'],
    ['ltu', 'xtu'],
    ['lya', 'xya'],
    ['lyu', 'xyu'],
    ['lyo', 'xyo'],
    ['la', 'xa'],
    ['li', 'xi'],
    ['lu', 'xu'],
    ['le', 'xe'],
    ['lo', 'xo'],
    ['shi', 'si'],
    ['chi', 'ti'],
    ['tsu', 'tu'],
    ['fu', 'hu'],
    ['ji', 'zi'],
    ['wo', 'o']
] as const;
const LATIN_ROMAJI_RE = /^[a-z0-9,._+\-/*:;[\](){}!?]+$/;

const expandRomajiVariants = (answer: string): string[] => {
    const normalized = normalizeAnswer(answer);
    if (!LATIN_ROMAJI_RE.test(normalized)) return [normalized];

    let variants = new Set([normalized]);
    ROMAJI_VARIANT_RULES.forEach(([source, replacement]) => {
        const next = new Set(variants);
        variants.forEach(candidate => {
            if (candidate.includes(source)) {
                next.add(candidate.split(source).join(replacement));
            }
        });
        variants = next;
    });
    return Array.from(variants);
};

export const getAcceptedAnswersForPrompt = (prompt: TypingPrompt | null): string[] => {
    if (!prompt) return [];
    const answers = prompt.acceptedAnswers.map(normalizeAnswer);
    if (!HAS_KANA_RE.test(prompt.text)) return Array.from(new Set(answers));
    return Array.from(new Set(answers.flatMap(expandRomajiVariants)));
};
const pickBiased = <T,>(items: T[], score: (item: T) => number): T => {
    const fresh = items.filter(item => !currentHistory.includes(normalizeAnswer(typeof item === 'string' ? item : (item as {text?:string}).text || '')));
    if (fresh.length) items = fresh;
    const weighted = items.map(item => ({ item, weight: Math.max(1, score(item)) }));
    const total = weighted.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = Math.random() * total;
    for (const entry of weighted) {
        roll -= entry.weight;
        if (roll <= 0) return entry.item;
    }
    return weighted[weighted.length - 1].item;
};

const buildWeakCharSet = (lessonId?: string) => {
    const weakMap = storageService.getTypingWeakKeys();
    const entries = Object.entries(weakMap[lessonId || 'HOME_ROW'] || {}).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return new Set(entries.map(([char]) => char));
};

export const getWeakKeyEntries = (lessonId?: string) => {
    const weakMap = storageService.getTypingWeakKeys();
    return Object.entries(weakMap[lessonId || 'HOME_ROW'] || {}).sort((a, b) => b[1] - a[1]).slice(0, 5);
};

const buildSequencePrompt = (lessonId: TypingLessonId, stage: number, cardName: string, weakChars: Set<string>): TypingPrompt => {
    const source = HOME_ROW_GROUPS[Math.min(stage, HOME_ROW_GROUPS.length - 1)].filter(s=>s.length===1);
    const len = currentProgress.sequenceLength;
    const answer = Array.from({ length: len }, () => pickBiased(source, (candidate) => weakChars.has(candidate[0]) ? 4 : 1)).join('');
    const lesson = getTypingLessonDefinition(lessonId);
    return {
        id: `${lessonId}-${cardName}-${stage}-${answer}`,
        title: `${lesson.shortTitle} Lv.${stage + 1}`,
        text: answer,
        answer,
        acceptedAnswers: [answer],
        guide: stage === 0 ? 'ホームポジションを確認しながら打とう' : '同じ指だけに頼らず、左右の移動を意識しよう',
        finger: KEY_FINGER_MAP[answer[0]] ?? null
    };
};

const buildWordPrompt = (
    lessonId: TypingLessonId,
    stage: number,
    cardName: string,
    words: string[],
    guide: string,
    weakChars: Set<string>,
    languageMode: LanguageMode = 'JAPANESE'
): TypingPrompt => {
    const lesson = getTypingLessonDefinition(lessonId, languageMode);
    const entry = pickBiased(levelPool(words,v=>v.length), (candidate) => {
        const normalized = normalizeAnswer(candidate);
        let hits = 0;
        weakChars.forEach((char) => {
            if (normalized.includes(char)) hits += 1;
        });
        return 1 + hits * 3;
    });
    return {
        id: `${lessonId}-${cardName}-${stage}-${entry}`,
        title: `${lesson.shortTitle} Lv.${stage + 1}`,
        text: entry,
        answer: entry,
        acceptedAnswers: [entry.toLowerCase()],
        guide,
        finger: KEY_FINGER_MAP[entry.trim().toLowerCase()[0]] ?? null
    };
};

const buildKanaPrompt = (lessonId: TypingLessonId, stage: number, cardName: string, source: { text: string; accepted: string[] }[], guide: string, weakChars: Set<string>): TypingPrompt => {
    const lesson = getTypingLessonDefinition(lessonId);
    const count = !['SENTENCES','ROMAJI_ADVANCED','WORDS'].includes(lessonId) && currentProgress.level >= 10 ? Math.min(3,1+Math.floor(currentProgress.level/10)) : 1;
    source = levelPool(source,v=>v.accepted[0].length);
    const selected = Array.from({ length: count }, () => pickBiased(source, (candidate) => {
        const normalized = normalizeAnswer(candidate.accepted[0] || candidate.text);
        let hits = 0;
        weakChars.forEach((char) => {
            if (normalized.includes(char)) hits += 1;
        });
        return 1 + hits * 3;
    }));
    const text = selected.map(item => item.text).join(' ');
    const mergedAccepted = selected.length === 1
        ? selected[0].accepted
        : [selected.map(item => item.accepted[0]).join(''),selected.map(item=>item.text).join('')];
    return {
        id: `${lessonId}-${cardName}-${stage}-${text}`,
        title: `${lesson.shortTitle} Lv.${stage + 1}`,
        text,
        answer: mergedAccepted[0],
        acceptedAnswers: mergedAccepted,
        guide,
        finger: KEY_FINGER_MAP[normalizeAnswer(mergedAccepted[0])[0]] ?? null
    };
};

const buildRawPrompt = (
    lessonId: string | undefined,
    act: number,
    floor: number,
    cardName: string,
    languageMode: LanguageMode
): TypingPrompt => {
    const resolvedLessonId = getTypingLessonDefinition(lessonId,languageMode).id;
    const stage = currentProgress.band;
    const weakChars = buildWeakCharSet(resolvedLessonId);
    if (languageMode === 'ENGLISH') {
        if(resolvedLessonId==='HOME_ROW')return buildSequencePrompt('HOME_ROW',stage,cardName,weakChars);
        if(resolvedLessonId==='ALPHABET') {
          const letters='abcdefghijklmnopqrstuvwxyz'.slice(0,Math.min(26,6+stage*6));
          const answer=Array.from({length:currentProgress.sequenceLength},()=>letters[Math.floor(Math.random()*letters.length)]).join('');
          return {id:`ALPHABET-${cardName}-${answer}`,title:'',text:answer,answer,acceptedAnswers:[answer],guide:'Type the letters in order.',finger:KEY_FINGER_MAP[answer[0]]||null};
        }
        return buildWordPrompt(
            resolvedLessonId,
            stage,
            cardName,
            [...ENGLISH_NATIVE_LESSON_DRILLS[resolvedLessonId][Math.min(stage, 4)], ...(['ENGLISH','WORDS','SENTENCES','MIXED'].includes(resolvedLessonId)?EXTRA_ENGLISH[stage]:[])],
            'Type the prompt exactly. Keep a steady rhythm and use the correct fingers.',
            weakChars,
            'ENGLISH'
        );
    }
    switch (resolvedLessonId) {
        case 'HOME_ROW':
            return buildSequencePrompt('HOME_ROW', stage, cardName, weakChars);
        case 'ALPHABET':
            return buildWordPrompt('ALPHABET', stage, cardName, ALPHABET_WORDS[Math.max(0, Math.min(stage, ALPHABET_WORDS.length - 1))], 'アルファベットの位置を見失わずに単語を打とう', weakChars);
        case 'NUMBERS_SYMBOLS':
            return buildWordPrompt('NUMBERS_SYMBOLS', stage, cardName, NUMBER_SYMBOL_DRILLS[Math.min(stage, NUMBER_SYMBOL_DRILLS.length - 1)], '数字段と記号の位置を確かめながら打とう', weakChars);
        case 'ROMAJI_VOWELS':
            return buildKanaPrompt('ROMAJI_VOWELS', stage, cardName, VOWEL_WORDS, 'あいうえお と 母音の語を入力しよう', weakChars);
        case 'ROMAJI_KA':
            return buildKanaPrompt('ROMAJI_KA', stage, cardName, ROMAJI_BASIC[1], 'か行をくり返して、指と音の対応を覚えよう', weakChars);
        case 'ROMAJI_SA':
            return buildKanaPrompt('ROMAJI_SA', stage, cardName, ROMAJI_BASIC[2], 'さ行と shi の形に慣れよう', weakChars);
        case 'ROMAJI_TA':
            return buildKanaPrompt('ROMAJI_TA', stage, cardName, ROMAJI_BASIC[3], 'た行と chi / tsu の入力を固めよう', weakChars);
        case 'ROMAJI_NA_HA':
            return buildKanaPrompt('ROMAJI_NA_HA', stage, cardName, ROMAJI_NA_HA, 'な行・は行を含む語を打とう', weakChars);
        case 'ROMAJI_MA_YA_RA_WA':
            return buildKanaPrompt('ROMAJI_MA_YA_RA_WA', stage, cardName, ROMAJI_MA_YA_RA_WA, 'ま行以降と ん を含む語を打とう', weakChars);
        case 'ROMAJI_BASIC':
            return buildKanaPrompt('ROMAJI_BASIC', stage, cardName, ROMAJI_BASIC[Math.min(stage, ROMAJI_BASIC.length - 1)], 'かなを見て基本のローマ字で入力しよう', weakChars);
        case 'ROMAJI_ADVANCED':
            return buildKanaPrompt('ROMAJI_ADVANCED', stage, cardName, ROMAJI_ADVANCED[Math.min(stage, ROMAJI_ADVANCED.length - 1)], '拗音・促音・長音を意識して正確に入力しよう', weakChars);
        case 'WORDS':
            return buildKanaPrompt('WORDS', stage, cardName, [...SCHOOL_WORDS[stage],...EXTRA_WORDS[stage]], '学校や生活のことばをテンポよく入力しよう', weakChars);
        case 'SENTENCES':
            return buildKanaPrompt('SENTENCES', stage, cardName, [...SENTENCE_DRILLS[stage],...EXTRA_SENTENCES[stage]], '文のまとまりを意識して、読みながら打とう', weakChars);
        case 'ENGLISH':
            return buildWordPrompt('ENGLISH', stage, cardName, [...ENGLISH_DRILLS[stage],...EXTRA_ENGLISH[stage]], '英単語と英文を、スペースも含めて正確に打とう', weakChars);
        case 'MIXED': {
            const mixed = [...MIXED_DRILLS[stage],...EXTRA_ENGLISH[stage],...EXTRA_WORDS[stage].map(w=>w.text),...NUMBER_SYMBOL_DRILLS[stage]];
            const pick = pickBiased(mixed, (candidate) => {
                const normalized = normalizeAnswer(candidate);
                let hits = 0;
                weakChars.forEach((char) => {
                    if (normalized.includes(char)) hits += 1;
                });
                return 1 + hits * 3;
            });
            const accepted = /^[\u3040-\u309fー\s。]+$/.test(pick)
                ? [pick.replace(/\s+/g, ''), normalizeAnswer(pick)]
                : [pick.toLowerCase()];
            return {
                id: `MIXED-${cardName}-${stage}-${pick}`,
                title: `総合 Lv.${stage + 1}`,
                text: pick,
                answer: accepted[0],
                acceptedAnswers: accepted,
                guide: 'かな・英語・数字記号が混ざる。内容の切り替えに対応しよう',
                finger: KEY_FINGER_MAP[normalizeAnswer(accepted[0])[0]] ?? null
            };
        }
        default:
            return buildSequencePrompt('HOME_ROW', stage, cardName, weakChars);
    }
};


let currentProgress = typingProgress(1,0,0);
let currentHistory: string[] = [];
const histories = new Map<string,string[]>();
function levelPool<T>(source:T[],length:(v:T)=>number):T[] {
  const sorted = [...source].sort((a,b)=>length(a)-length(b));
  const fraction=currentProgress.withinBand;
  const lo=Math.floor(sorted.length*Math.max(0,fraction-.35)*.6);
  const hi=Math.max(lo+4,Math.ceil(sorted.length*(.5+fraction*.5)));
  return sorted.slice(lo,hi);
}
export function buildPromptFromLesson(lessonId:string|undefined,act:number,floor:number,cardName:string,languageMode:LanguageMode,combatExperience=0):TypingPrompt {
  currentProgress=typingProgress(act,floor,combatExperience);
  const key=`${lessonId||'HOME_ROW'}:${languageMode}`;
  currentHistory=histories.get(key)||[];
  let prompt=buildRawPrompt(lessonId,act,floor,cardName,languageMode);
  for(let i=0;i<8&&currentHistory.includes(normalizeAnswer(prompt.text));i++)prompt=buildRawPrompt(lessonId,act,floor,cardName,languageMode);
  histories.set(key,[...currentHistory,normalizeAnswer(prompt.text),...prompt.text.split(' ').map(normalizeAnswer)].slice(-24));
  const lesson=getTypingLessonDefinition((lessonId as TypingLessonId)||'HOME_ROW',languageMode);
  prompt.title=`${lesson.shortTitle} Lv.${currentProgress.level}`;
  return prompt;
}

import {STORY_VARIANT_ENGLISH,STORY_VARIANT_HIRAGANA} from './storyVariants';
import { RPG_STORY_ENGLISH, RPG_STORY_HIRAGANA } from "./adventureGeneratedCopy";
export const RPG_ADVENTURE_ENGLISH: Record<string,string> = {
 ...RPG_STORY_ENGLISH, ...STORY_VARIANT_ENGLISH,
 "報告":"Report back",
 '冒険手帳 ·':'Adventure journal ·','依頼は好きな順番で進められます。':'Explore these stories in any order.','会話を終える':'End conversation',
 'いつもの主人公':'Original heroes','敵キャラクターで冒険':'Adventure as an enemy','敵キャラクターを主人公に':'Choose an enemy hero','名前で検索':'Search by name','専用の初期デッキ':'Personal starting deck','このキャラクターで冒険する':'Begin with this character',
 '手がかりを持ち帰る':'Take the clue back','町の復興に役立てる（45G）':'Help the town rebuild (45G)','人々と分かち合う（20G・HP40%回復）':'Share with others (20G, heal 40% HP)','依頼を引き受ける':'Accept the request',
 '木漏れ日の草原':'Sunlit Meadow','ささやきの森':'Whispering Forest','鏡水の湿原':'Mirrorwater Marsh','琥珀の砂丘':'Amber Dunes','星霜の高原':'Froststar Highlands','暁の古代遺跡':'Dawn Ruins',
 '突破':'Assault','守護':'Guardian','攪乱':'Disruption','知略':'Strategy','疾風':'Swiftness','再生':'Renewal',
 '届かなかった手紙':'The Undelivered Letter','郵便屋リノ':'Rino the Courier','風車の郵便箱':'Windmill Mailbox',
 '森が覚えている歌':'The Song the Forest Remembers','森番フィル':'Phil the Forester','歌う大樹':'The Singing Tree',
 '水底の約束':'A Promise Underwater','渡し守ミオ':'Mio the Ferryman','沈んだ鐘楼':'Sunken Bell Tower',
 '砂に消えた旅路':'The Road Lost in Sand','地図師サハ':'Saha the Cartographer','琥珀の道標':'Amber Waystone',
 '雪原の最後の灯':'The Last Light in the Snow','灯台守ユキ':'Yuki the Lighthouse Keeper','凍った観測所':'Frozen Observatory',
 '止まった時計の明日':'Tomorrow of the Stopped Clock','時計師トワ':'Towa the Clockmaker','記憶の歯車庫':'Archive of Gears',
};
export const RPG_ADVENTURE_HIRAGANA: Record<string,string> = {
 ...RPG_STORY_HIRAGANA, ...STORY_VARIANT_HIRAGANA,
 "報告":"ほうこく",
 '冒険手帳 ·':'ぼうけんてちょう ·','依頼は好きな順番で進められます。':'いらいは すきな じゅんばんで すすめられます。','会話を終える':'かいわを おえる',
 'いつもの主人公':'いつもの しゅじんこう','敵キャラクターで冒険':'てききゃらくたーで ぼうけん','敵キャラクターを主人公に':'てききゃらくたーを しゅじんこうに','名前で検索':'なまえで けんさく','専用の初期デッキ':'せんようの しょきでっき','このキャラクターで冒険する':'このきゃらくたーで ぼうけんする',
 '手がかりを持ち帰る':'てがかりを もちかえる','町の復興に役立てる（45G）':'まちの ふっこうに やくだてる（45G）','人々と分かち合う（20G・HP40%回復）':'ひとびとと わかちあう（20G・HP40%かいふく）','依頼を引き受ける':'いらいを ひきうける',
 '木漏れ日の草原':'こもれびの そうげん','ささやきの森':'ささやきの もり','鏡水の湿原':'きょうすいの しつげん','琥珀の砂丘':'こはくの さきゅう','星霜の高原':'せいそうの こうげん','暁の古代遺跡':'あかつきの こだいいせき',
 '突破':'とっぱ','守護':'しゅご','攪乱':'かくらん','知略':'ちりゃく','疾風':'しっぷう','再生':'さいせい',
 '届かなかった手紙':'とどかなかった てがみ','郵便屋リノ':'ゆうびんや りの','風車の郵便箱':'ふうしゃの ゆうびんばこ',
 '森が覚えている歌':'もりが おぼえている うた','森番フィル':'もりばん ふぃる','歌う大樹':'うたう たいじゅ',
 '水底の約束':'みなそこの やくそく','渡し守ミオ':'わたしもり みお','沈んだ鐘楼':'しずんだ しょうろう',
 '砂に消えた旅路':'すなに きえた たびじ','地図師サハ':'ちずし さは','琥珀の道標':'こはくの みちしるべ',
 '雪原の最後の灯':'せつげんの さいごの ひ','灯台守ユキ':'とうだいもり ゆき','凍った観測所':'こおった かんそくじょ',
 '止まった時計の明日':'とまった とけいの あした','時計師トワ':'とけいし とわ','記憶の歯車庫':'きおくの はぐるまこ',
};

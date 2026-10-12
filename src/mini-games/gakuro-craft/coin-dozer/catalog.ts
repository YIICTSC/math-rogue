export const COIN_RELICS = [
 ['mint','豊穣の鋳型','Abundant mold','ほうじょうのいがた','各層の開始コイン＋5。','Start each stage with 5 extra coins.','かくそうのかいしこいん＋5。'],
 ['twin','双子のコイン','Twin coin','ふたごのこいん','投入時に25%の確率で追加コイン。','25% chance to drop an extra coin.','とうにゅうじに25%のかくりつでついかこいん。'],
 ['rebate','還元の財布','Refund purse','かんげんのさいふ','獲得時のコイン返却率＋15%。','Coin recovery chance +15%.','かくとくじのこいんへんきゃくりつ＋15%。'],
 ['gem','宝石商の眼鏡','Jeweler glasses','ほうせきしょうのめがね','宝石コインの出現率＋8%。','Gem coin chance +8%.','ほうせきこいんのしゅつげんりつ＋8%。'],
 ['prism','虹色プリズム','Rainbow prism','にじいろぷりずむ','宝石コインの価値＋2。','Gem coin value +2.','ほうせきこいんのかち＋2。'],
 ['guard','縁の守護石','Edge guardian','ふちのしゅごせき','各層で左右に落ちたコインを3枚救出。','Rescue 3 side-falling coins each stage.','かくそうでさゆうにおちたこいんを3まいきゅうしゅつ。'],
 ['turbo','歯車のブーツ','Gear boots','はぐるまのぶーつ','プッシャーの周期が15%短縮。','Pusher cycle is 15% shorter.','ぷっしゃーのしゅうきが15%たんしゅく。'],
 ['reach','伸びる押し板','Long pusher','のびるおしいた','プッシャーの押し幅＋12%。','Pusher reach +12%.','ぷっしゃーのおしはば＋12%。'],
 ['wave','波動のレバー','Wave lever','はどうのればー','各層の押し出しスキル回数＋1。','One extra pulse each stage.','かくそうのおしだしすきるかいすう＋1。'],
 ['force','巨人のバネ','Giant spring','きょじんのばね','押し出しスキルの力＋30%。','Pulse power +30%.','おしだしすきるのちから＋30%。'],
 ['chain','連鎖の勲章','Chain medal','れんさのくんしょう','連続獲得の受付時間＋1秒。','Combo window +1 second.','れんぞくかくとくのうけつけじかん＋1びょう。'],
 ['combo','踊る金貨','Dancing gold','おどるきんか','コンボの得点倍率が増加。','Combos grant a larger score multiplier.','こんぼのとくてんばいりつがぞうか。'],
 ['fortune','黄金のクローバー','Golden clover','おうごんのくろーばー','得点＋15%。','Score +15%.','とくてん＋15%。'],
 ['alchemist','錬金の指輪','Alchemy ring','れんきんのゆびわ','通常コインを20%の確率で金貨へ。','20% chance to upgrade regular coins to gold.','つうじょうこいんを20%のかくりつできんかへ。'],
 ['supply','補給の鳥','Supply bird','ほきゅうのとり','6枚投入するたびに追加で手持ち＋3。','Gain 3 extra coins for every 6 drops.','6まいとうにゅうするたびについかでてもち＋3。'],
 ['coupon','商人の会員証','Merchant pass','しょうにんのかいいんしょう','ショップ価格を2下げる。','Shop prices are 2 lower.','しょっぷかかくを2さげる。'],
 ['ward','浄化のお守り','Cleansing charm','じょうかのおまもり','呪いコインも通常コインとして獲得。','Cursed coins become regular rewards.','のろいこいんもつうじょうこいんとしてかくとく。'],
 ['risk','欲張りの冠','Greedy crown','よくばりのかんむり','得点＋35%。呪いコインの出現率＋8%。','Score +35%, but curse chance +8%.','とくてん＋35%。のろいこいんのしゅつげんりつ＋8%。'],
 ['life','不屈の貯金箱','Second-chance bank','ふくつのちょきんばこ','コイン切れ時、1回だけ10枚で復帰。','Once per run, recover with 10 coins after running out.','こいんぎれじ、1かいだけ10まいでふっき。'],
 ['center','中央の星','Center star','ちゅうおうのほし','中央の出口で獲得すると価値＋1。','Center-lane rewards gain 1 value.','ちゅうおうのでぐちでかくとくするとかち＋1。'],
 ['refill','緑の補給箱','Green supply','みどりのほきゅうばこ','補給コインの回復枚数＋2。','Supply coins recover 2 extra coins.','ほきゅうこいんのかいふくまいすう＋2。'],
 ['boss','竜の討伐印','Dragon mark','りゅうのとうばついん','最終層の王冠コインの価値＋6。','Final-stage crown value +6.','さいしゅうそうのおうかんこいんのかち＋6。'],
 ['drift','風読みの旗','Wind reader','かぜよみのはた','嵐ルートの横風を半減。','Storm-route crosswinds are halved.','あらしるーとのよこかぜをはんげん。'],
 ['treasury','金庫の鍵','Vault key','きんこのかぎ','層クリア時に金庫コイン＋4。','Gain 4 vault coins after each stage.','そうくりあじにきんここいん＋4。'],
] as const;
export type CoinRelicId=typeof COIN_RELICS[number][0];
export const COIN_STAGES=['木漏れ日の広場','銅の採掘場','星の商店街','嵐の造幣所','黄金竜の宝庫'] as const;
export const COIN_EVENTS=['古い泉','旅の商人','光る卵','眠る金庫','迷子の妖精','不思議な鏡'] as const;

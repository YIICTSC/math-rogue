import {ROAMING_VARIANTS} from './roamingNpcVariants';
import {NPC_EVENT_BACKGROUNDS} from './storyVariants';
import type { BiomeId } from './biomes';

export interface LocalizedNpcCopy {
  ja: string;
  en: string;
  hira: string;
}

const c = (ja: string, en: string, hira: string): LocalizedNpcCopy => ({ ja, en, hira });

export type RoamingNpcEffect =
  | { kind: 'GOLD'; amount: number }
  | { kind: 'HEAL'; ratio: number }
  | { kind: 'PAY_HEAL'; cost: number; ratio: number }
  | { kind: 'CARD'; cost?: number }
  | { kind: 'UPGRADE_CARD'; cost?: number }
  | { kind: 'GAMBLE'; cost: number; chance: number; winGold: number; loseGold?: number; winHealRatio?: number; winCard?: boolean };

export interface RoamingNpcChoice {
  id: string;
  label: LocalizedNpcCopy;
  result: LocalizedNpcCopy;
  winResult?: LocalizedNpcCopy;
  loseResult?: LocalizedNpcCopy;
  effect: RoamingNpcEffect;
}

export interface RoamingNpcEvent {
  background?:string;illustration?:string;
  id: string;
  biome: BiomeId;
  portrait: string;
  name: LocalizedNpcCopy;
  title: LocalizedNpcCopy;
  description: LocalizedNpcCopy;
  choices: readonly RoamingNpcChoice[];
}

const BASE_ROAMING_NPC_EVENTS: readonly RoamingNpcEvent[] = [
  { id: 'meadow-cook', biome: 'meadow', portrait: 'sprites/rpg/npcs/mina.webp', name: c('旅する料理人ミナ', 'Mina the Traveling Cook', 'たびする りょうりにん みな'), title: c('湯気の立つ鍋', 'A Steaming Pot', 'ゆげの たつ なべ'), description: c('草原の道端で、料理人が大鍋をかき回している。食べるか、配膳を手伝うか選ぼう。', 'A cook stirs a huge pot beside the meadow trail. Have a meal or help serve it.', 'そうげんの みちばたで、りょうりにんが おおなべを かきまわしている。たべるか、はいぜんを てつだうか えらぼう。'), choices: [
    { id: 'meal', label: c('煮込みを食べる（20G・HP35%回復）', 'Eat a stew (20G · restore 35% HP)', 'にこみを たべる（20G・HP35%かいふく）'), result: c('温かい煮込みで元気が戻った。', 'The warm stew restores your energy.', 'あたたかい にこみで げんきが もどった。'), effect: { kind: 'PAY_HEAL', cost: 20, ratio: .35 } },
    { id: 'serve', label: c('配膳を手伝う（25G）', 'Help serve meals (25G)', 'はいぜんを てつだう（25G）'), result: c('お礼にコインを受け取った。', 'You receive coins as thanks.', 'おれいに コインを うけとった。'), effect: { kind: 'GOLD', amount: 25 } },
  ] },
  { id: 'meadow-parcel', biome: 'meadow', portrait: 'sprites/rpg/npcs/ao.webp', name: c('小包を探すアオ', 'Ao Looking for a Parcel', 'こづつみを さがす あお'), title: c('風に飛ばされた小包', 'A Parcel on the Wind', 'かぜに とばされた こづつみ'), description: c('少年が風車の方を何度も振り返っている。草むらに、誰かの荷物が飛ばされてきたようだ。', 'A boy keeps looking toward the windmill. Someone’s parcel seems to have blown into the grass.', 'しょうねんが ふうしゃの ほうを なんども ふりかえっている。くさむらに、だれかの にもつが とばされてきたようだ。'), choices: [
    { id: 'search', label: c('一緒に探す（カードを1枚獲得）', 'Search together (gain 1 card)', 'いっしょに さがす（カードを1まい かくとく）'), result: c('小包を見つけた。中にはお礼のカードが入っていた。', 'You find the parcel. A card inside is your reward.', 'こづつみを みつけた。なかには おれいの カードが はいっていた。'), effect: { kind: 'CARD' } },
    { id: 'directions', label: c('風車への道を教える（30G）', 'Point out the windmill trail (30G)', 'ふうしゃへの みちを おしえる（30G）'), result: c('少年はお礼を言い、落としていたコインを渡した。', 'The boy thanks you and shares the coins he found.', 'しょうねんは おれいを いい、おとしていた コインを わたした。'), effect: { kind: 'GOLD', amount: 30 } },
  ] },
  { id: 'forest-carver', biome: 'forest', portrait: 'sprites/rpg/npcs/ren.webp', name: c('森の木彫り師レン', 'Ren the Forest Carver', 'もりの きぼりし れん'), title: c('折れた枝の笛', 'A Flute from a Fallen Branch', 'おれた えだの ふえ'), description: c('木彫り師が枝の笛を仕上げている。音の調整を手伝えば、カードの使い方も教えてくれるという。', 'A carver is finishing a wooden flute. Help tune it, and they will teach you a trick for one of your cards.', 'きぼりしが えだの ふえを しあげている。おとの ちょうせいを てつだえば、カードの つかいかたも おしえてくれるという。'), choices: [
    { id: 'tune', label: c('笛の音を整える（カードを1枚強化）', 'Tune the flute (upgrade 1 card)', 'ふえの おとを ととのえる（カードを1まい きょうか）'), result: c('笛の音が澄み、手持ちのカードも磨かれた。', 'The flute rings clear, and one of your cards is sharpened.', 'ふえの おとが すみ、てもちの カードも みがかれた。'), effect: { kind: 'UPGRADE_CARD' } },
    { id: 'branches', label: c('枝を集めて売る（35G）', 'Gather branches to sell (35G)', 'えだを あつめて うる（35G）'), result: c('落ち枝をまとめ、木彫り師からコインを受け取った。', 'You gather fallen branches and receive coins from the carver.', 'おちえだを まとめ、きぼりしから コインを うけとった。'), effect: { kind: 'GOLD', amount: 35 } },
  ] },
  { id: 'forest-mushroom', biome: 'forest', portrait: 'sprites/rpg/npcs/kino.webp', name: c('きのこ番キノ', 'Kino the Mushroom Keeper', 'きのこばん きの'), title: c('色の違うきのこ', 'Mushrooms of Two Colors', 'いろの ちがう きのこ'), description: c('きのこ番が、食べられる種類を見分けている。確かなものをもらうか、珍しい色に賭けるか。', 'A mushroom keeper sorts edible fungi. Choose a safe bite or take a chance on a rare color.', 'きのこばんが、たべられる しゅるいを みわけている。たしかな ものを もらうか、めずらしい いろに かけるか。'), choices: [
    { id: 'safe', label: c('安全なきのこを食べる（HP20%回復）', 'Eat a safe mushroom (restore 20% HP)', 'あんぜんな きのこを たべる（HP20%かいふく）'), result: c('香りのよいきのこで少し元気が戻った。', 'The fragrant mushroom restores some energy.', 'かおりの よい きのこで すこし げんきが もどった。'), effect: { kind: 'HEAL', ratio: .2 } },
    { id: 'rare', label: c('珍しいきのこに挑戦（当たりでカード）', 'Try the rare mushroom (win a card if lucky)', 'めずらしい きのこに ちょうせん（あたりで カード）'), result: c('珍しいきのこを味わった。', 'You try the rare mushroom.', 'めずらしい きのこを あじわった。'), winResult: c('不思議な力が湧き、カードを見つけた！', 'A strange energy rises, and you find a card!', 'ふしぎな ちからが わき、カードを みつけた！'), loseResult: c('味は独特だったが、体に害はなかった。', 'The taste is unusual, but harmless.', 'あじは どくとくだったが、からだに がいは なかった。'), effect: { kind: 'GAMBLE', cost: 0, chance: 45, winGold: 0, winCard: true } },
  ] },
  { id: 'wetland-oracle', biome: 'wetland', portrait: 'sprites/rpg/npcs/sui.webp', name: c('水鏡の占い師スイ', 'Sui the Water-Mirror Oracle', 'みずかがみの うらないし すい'), title: c('水面に浮かぶ二つの光', 'Two Lights on the Water', 'みなもに うかぶ ふたつの ひかり'), description: c('占い師が、水面に浮かぶ光を指さす。光を追えば幸運をつかめるかもしれない。静かに休む道もある。', 'An oracle points to two lights on the water. Follow one for a chance at fortune, or rest by the shore.', 'うらないしが、みなもに うかぶ ひかりを ゆびさす。ひかりを おえば こううんを つかめるかもしれない。しずかに やすむ みちもある。'), choices: [
    { id: 'blue-light', label: c('青い光を追う（10G・当たりで45G）', 'Follow the blue light (10G · win 45G if lucky)', 'あおい ひかりを おう（10G・あたりで45G）'), result: c('水辺を進み、光の行方を確かめた。', 'You follow the light along the water.', 'みずべを すすみ、ひかりの ゆくえを たしかめた。'), winResult: c('光の下にコインが沈んでいた！', 'Coins glimmer beneath the light!', 'ひかりの したに コインが しずんでいた！'), loseResult: c('光は水面に消えた。占い師は静かにうなずいた。', 'The light fades into the water. The oracle nods quietly.', 'ひかりは みなもに きえた。うらないしは しずかに うなずいた。'), effect: { kind: 'GAMBLE', cost: 10, chance: 55, winGold: 45 } },
    { id: 'shore-rest', label: c('岸辺で休む（HP15%回復）', 'Rest on the shore (restore 15% HP)', 'きしべで やすむ（HP15%かいふく）'), result: c('水音を聞いているうちに、心身が落ち着いた。', 'The sound of the water calms your mind and body.', 'みずおとを きいているうちに、しんしんが おちついた。'), effect: { kind: 'HEAL', ratio: .15 } },
  ] },
  { id: 'wetland-boatwright', biome: 'wetland', portrait: 'sprites/rpg/npcs/toma.webp', name: c('渡し舟の船大工トウマ', 'Toma the Boatwright', 'わたしぶねの ふなだいく とうま'), title: c('水路を渡る近道', 'A Shortcut Across the Water', 'すいろを わたる ちかみち'), description: c('船大工が小舟を修理している。渡し賃を払えば休ませてくれるし、手を貸せば仕事代も出るそうだ。', 'A boatwright is repairing a skiff. Pay for a quiet rest, or lend a hand for a little work money.', 'ふなだいくが こぶねを しゅうりしている。わたしちんを はらえば やすませてくれるし、てを かせば しごとだいも でるそうだ。'), choices: [
    { id: 'ferry', label: c('渡し舟でひと休み（20G・HP35%回復）', 'Rest on the ferry (20G · restore 35% HP)', 'わたしぶねで ひとやすみ（20G・HP35%かいふく）'), result: c('向こう岸までの短い船旅で、疲れが取れた。', 'The short ride across the water refreshes you.', 'むこうぎしまでの みじかい ふなたびで、つかれが とれた。'), effect: { kind: 'PAY_HEAL', cost: 20, ratio: .35 } },
    { id: 'repair', label: c('舟の修理を手伝う（30G）', 'Help repair the skiff (30G)', 'ふねの しゅうりを てつだう（30G）'), result: c('船大工から手間賃を受け取った。', 'The boatwright pays you for your work.', 'ふなだいくから てまちんを うけとった。'), effect: { kind: 'GOLD', amount: 30 } },
  ] },
  { id: 'desert-mechanic', biome: 'desert', portrait: 'sprites/rpg/npcs/gado.webp', name: c('砂丘の修理屋ガド', 'Gado the Dune Mechanic', 'さきゅうの しゅうりや がど'), title: c('車輪の砂を払う', 'Sand in the Caravan Wheel', 'しゃりんの すなを はらう'), description: c('修理屋の荷車が砂に埋まりかけている。手伝えば路銀をもらえる。部品を買って旅支度を整えることもできる。', 'A mechanic’s cart is stuck in the sand. Help for travel money, or buy a spare part for your deck.', 'しゅうりやの にぐるまが すなに うまりかけている。てつだえば ろぎんを もらえる。ぶひんを かって たびじたくを ととのえることも できる。'), choices: [
    { id: 'spare-part', label: c('予備部品を買う（25G・カード獲得）', 'Buy a spare part (25G · gain a card)', 'よびぶひんを かう（25G・カードかくとく）'), result: c('部品箱から、冒険に役立つカードが見つかった。', 'You find a useful card in the parts box.', 'ぶひんばこから、ぼうけんに やくだつ カードが みつかった。'), effect: { kind: 'CARD', cost: 25 } },
    { id: 'push-cart', label: c('荷車を押す（35G）', 'Push the cart free (35G)', 'にぐるまを おす（35G）'), result: c('荷車は砂を抜け、修理屋からお礼をもらった。', 'The cart rolls free, and the mechanic thanks you with coins.', 'にぐるまは すなを ぬけ、しゅうりやから おれいを もらった。'), effect: { kind: 'GOLD', amount: 35 } },
  ] },
  { id: 'desert-guide', biome: 'desert', portrait: 'sprites/rpg/npcs/naju.webp', name: c('流砂の道案内人ナジュ', 'Naju the Sand Guide', 'りゅうさの みちあんないにん なじゅ'), title: c('砂に隠れた道標', 'A Waystone Under the Sand', 'すなに かくれた みちしるべ'), description: c('道案内人が、砂に半分埋もれた道標を見つけた。慎重に調べるか、風が来る前に先へ進むか。', 'A guide spots a waystone half-buried in the dunes. Search carefully or take the quick route onward.', 'みちあんないにんが、すなに はんぶん うもれた みちしるべを みつけた。しんちょうに しらべるか、かぜが くるまえに さきへ すすむか。'), choices: [
    { id: 'search-stone', label: c('石を掘り出す（カードを1枚強化）', 'Uncover the stone (upgrade 1 card)', 'いしを ほりだす（カードを1まい きょうか）'), result: c('道標の仕組みを読み解き、カードの新しい使い方を覚えた。', 'You decipher the waystone and learn a new way to use a card.', 'みちしるべの しくみを よみとき、カードの あたらしい つかいかたを おぼえた。'), effect: { kind: 'UPGRADE_CARD' } },
    { id: 'quick-route', label: c('先を急ぐ（20G）', 'Take the quick route (20G)', 'さきを いそぐ（20G）'), result: c('道案内人が近道を教えてくれ、道中でコインを拾った。', 'The guide points out a shortcut where you find some coins.', 'みちあんないにんが ちかみちを おしえてくれ、みちじゅうで コインを ひろった。'), effect: { kind: 'GOLD', amount: 20 } },
  ] },
  { id: 'snow-musician', biome: 'snow', portrait: 'sprites/rpg/npcs/yura.webp', name: c('雪原の楽師ユラ', 'Yura the Snowfield Musician', 'せつげんの がくし ゆら'), title: c('凍った弦の音', 'The Sound of Frozen Strings', 'こおった げんの おと'), description: c('楽師が凍った弦を温めている。演奏に耳を澄ませるだけでも、不思議と体の力が抜けていく。', 'A musician warms frozen strings. Even listening to the tune makes your body feel lighter.', 'がくしが こおった げんを あたためている。えんそうに みみを すませるだけでも、ふしぎと からだの ちからが ぬけていく。'), choices: [
    { id: 'listen', label: c('歌に耳を澄ます（HP20%回復）', 'Listen to the song (restore 20% HP)', 'うたに みみを すます（HP20%かいふく）'), result: c('静かな旋律が、旅の疲れをほどいてくれた。', 'The quiet melody eases your travel-worn body.', 'しずかな せんりつが、たびの つかれを ほどいてくれた。'), effect: { kind: 'HEAL', ratio: .2 } },
    { id: 'tune', label: c('弦の調整を手伝う（カード獲得）', 'Help tune the strings (gain a card)', 'げんの ちょうせいを てつだう（カードかくとく）'), result: c('楽師が礼に、旅人へ渡す予定だったカードをくれた。', 'The musician gives you a card meant for a traveler.', 'がくしが れいに、たびびとへ わたす よていだった カードを くれた。'), effect: { kind: 'CARD' } },
  ] },
  { id: 'snow-firewood', biome: 'snow', portrait: 'sprites/rpg/npcs/nono.webp', name: c('峠の薪拾いノノ', 'Nono the Pass Firewood Gatherer', 'とうげの まきひろい のの'), title: c('消えかけた火', 'A Fading Campfire', 'きえかけた ひ'), description: c('峠の小さな火が消えかけている。薪を足して休むか、燃え残りをまとめて町へ運ぶか。', 'A small fire on the pass is fading. Add firewood and rest, or bundle the leftovers for town.', 'とうげの ちいさな ひが きえかけている。まきを たして やすむか、もえのこりを まとめて まちへ はこぶか。'), choices: [
    { id: 'warm', label: c('火にあたる（10G・HP30%回復）', 'Warm up by the fire (10G · restore 30% HP)', 'ひに あたる（10G・HP30%かいふく）'), result: c('火のぬくもりで、体力が戻った。', 'The fire’s warmth restores your strength.', 'ひの ぬくもりで、たいりょくが もどった。'), effect: { kind: 'PAY_HEAL', cost: 10, ratio: .3 } },
    { id: 'bundle', label: c('薪を束ねる（22G）', 'Bundle the firewood (22G)', 'まきを たばねる（22G）'), result: c('ノノは薪を町へ届ける代金を分けてくれた。', 'Nono shares the delivery fee for bringing wood to town.', 'ののは まきを まちへ とどける だいきんを わけてくれた。'), effect: { kind: 'GOLD', amount: 22 } },
  ] },
  { id: 'ruins-scholar', biome: 'ruins', portrait: 'sprites/rpg/npcs/nemu.webp', name: c('遺跡の見習い学者ネム', 'Nemu the Apprentice Ruin Scholar', 'いせきの みならい がくしゃ ねむ'), title: c('読めない石版', 'The Unreadable Tablet', 'よめない せきばん'), description: c('見習い学者が石版の写しを取っている。解読を手伝うか、崩れる前に写しを運ぶか選ぼう。', 'An apprentice is copying an old tablet. Help decipher it or carry the rubbing out before the ruin crumbles.', 'みならい がくしゃが せきばんの うつしを とっている。かいどくを てつだうか、くずれる まえに うつしを はこぶか えらぼう。'), choices: [
    { id: 'decipher', label: c('解読に協力する（25G・カード獲得）', 'Help decipher it (25G · gain a card)', 'かいどくに きょうりょくする（25G・カードかくとく）'), result: c('石版の知識を写したカードを受け取った。', 'You receive a card copied from the tablet’s knowledge.', 'せきばんの ちしきを うつした カードを うけとった。'), effect: { kind: 'CARD', cost: 25 } },
    { id: 'carry', label: c('写しを運ぶ（30G）', 'Carry the rubbing outside (30G)', 'うつしを はこぶ（30G）'), result: c('写しを安全な場所へ運び、学者から謝礼を受け取った。', 'You carry the rubbing to safety and receive a reward.', 'うつしを あんぜんな ばしょへ はこび、がくしゃから しゃれいを うけとった。'), effect: { kind: 'GOLD', amount: 30 } },
  ] },
  { id: 'ruins-gearfox', biome: 'ruins', portrait: 'sprites/rpg/npcs/gear-fox.webp', name: c('歯車きつね', 'The Gear Fox', 'はぐるま きつね'), title: c('転がる金色の歯車', 'The Rolling Golden Gear', 'ころがる きんいろの はぐるま'), description: c('小さなきつねが金色の歯車を転がしている。追いかければ賭けに出られる。見送って休むのもよさそうだ。', 'A little fox rolls a golden gear. Chase it for a gamble, or let it go and catch your breath.', 'ちいさな きつねが きんいろの はぐるまを ころがしている。おいかければ かけに でられる。みおくって やすむのも よさそうだ。'), choices: [
    { id: 'chase', label: c('歯車を追う（15G・当たりで55G）', 'Chase the gear (15G · win 55G if lucky)', 'はぐるまを おう（15G・あたりで55G）'), result: c('歯車きつねを追いかけた。', 'You chase the gear fox.', 'はぐるま きつねを おいかけた。'), winResult: c('歯車を捕まえ、隠されていたコインも見つけた！', 'You catch the gear and find hidden coins!', 'はぐるまを つかまえ、かくされていた コインも みつけた！'), loseResult: c('きつねは遺跡の奥へ逃げていった。', 'The fox slips deeper into the ruins.', 'きつねは いせきの おくへ にげていった。'), effect: { kind: 'GAMBLE', cost: 15, chance: 50, winGold: 55 } },
    { id: 'rest', label: c('追わずにひと休み（HP18%回復）', 'Let it go and rest (restore 18% HP)', 'おわずに ひとやすみ（HP18%かいふく）'), result: c('遺跡の静けさの中で、呼吸が整った。', 'In the quiet ruins, your breathing settles.', 'いせきの しずけさの なかで、こきゅうが ととのった。'), effect: { kind: 'HEAL', ratio: .18 } },
  ] },
];

export const ROAMING_NPC_EVENTS:readonly RoamingNpcEvent[]=BASE_ROAMING_NPC_EVENTS.flatMap((base,index)=>{const illustration=`sprites/rpg/events/roaming-${index}.webp`,background=NPC_EVENT_BACKGROUNDS[Math.floor(index/2)];const original={...base,illustration,background};const v=ROAMING_VARIANTS[index];const suffix=(copy:LocalizedNpcCopy)=>({ja:copy.ja.match(/（.*$/)?.[0]||'',en:copy.en.match(/\(.*$/)?.[0]||'',hira:copy.hira.match(/（.*$/)?.[0]||''});return [original,{...original,id:base.id+'-alternate',title:v.title,description:v.description,choices:base.choices.map((choice,i)=>{const tail=suffix(choice.label);return {...choice,label:c(v.labels[i].ja+tail.ja,v.labels[i].en+' '+tail.en,v.labels[i].hira+tail.hira),result:c(`「${v.labels[i].ja}」を手伝い、旅人と新しい思い出ができた。`,`You help with “${v.labels[i].en}” and share a new memory.`,`「${v.labels[i].hira}」をてつだい、たびびととあたらしいおもいでができた。`)};})}];});
export const getRoamingNpcEvent = (id?: string) => ROAMING_NPC_EVENTS.find(event => event.id === id);

const uiCopy = [
  c('森や水辺に現れた旅人', 'A traveler met in the wilds', 'もりや みずべに あらわれた たびびと'),
  c('また歩き出す', 'Continue exploring', 'また あるきだす'),
  c('この旅人とのイベントは解決済みです。', 'You have already resolved this traveler’s event.', 'この たびびととの イベントは かいけつずみです。'),
  c('イベントを選択中…', 'Resolving the event…', 'イベントを せんたくちゅう…'),
  c('強化できるカードがなかったため、新しいカードを受け取った。', 'You had no card to upgrade, so you receive a new card instead.', 'きょうかできる カードが なかったため、あたらしい カードを うけとった。'),
  c('コインが足りません。', 'Not enough coins.', 'コインが たりません。'),
];
const allCopies = [
  ...uiCopy,
  ...ROAMING_NPC_EVENTS.flatMap(event => [event.name, event.title, event.description, ...event.choices.flatMap(choice => [choice.label, choice.result, ...(choice.winResult ? [choice.winResult] : []), ...(choice.loseResult ? [choice.loseResult] : [])])]),
];
export const RPG_ROAMING_NPC_ENGLISH: Record<string, string> = Object.fromEntries(allCopies.map(copy => [copy.ja, copy.en]));
export const RPG_ROAMING_NPC_HIRAGANA: Record<string, string> = Object.fromEntries(allCopies.map(copy => [copy.ja, copy.hira]));
export const ROAMING_NPC_UI_COPY = {
  heading: uiCopy[0],
  close: uiCopy[1],
  resolved: uiCopy[2],
  pending: uiCopy[3],
  fallback: uiCopy[4],
  insufficientGold: uiCopy[5],
};

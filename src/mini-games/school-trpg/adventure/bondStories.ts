import type { Good, ResidentRole, Stat, Text } from './content';

export type BondStory = { title: Text; ask: Text; ending: Text; item: Good; gift: Good; stat: Stat };
const story = (title: Text, ask: Text, ending: Text, item: Good, gift: Good, stat: Stat): BondStory =>
  ({ title, ask, ending, item, gift, stat });

export const BOND_STORIES: Record<ResidentRole, readonly BondStory[]> = {
  host: [
    story(['窓辺の一人席', 'A table for one', 'まどべの ひとりせき'],
      ['宿の主人は、いつも空けている窓辺の席にも食事を置く。誰を待っているのか聞いてみよう。', 'The innkeeper serves the empty window seat every night. Ask who it is for.'],
      ['遅く着く人が扉を開けたとき、一人でないと思えるように。そう言って、主人は席を二つにした。', 'It is for anyone arriving late, so they know someone was expecting them. The innkeeper sets a second place.'],
      'grain', 'ration', 'presence'),
    story(['明日の鍋', 'Tomorrow’s pot', 'あしたの なべ'],
      ['宿の帳面に、子どもの頃の一皿が絵で残っていた。材料は一つしか読めない。', 'A sketch in the inn book shows a dish from childhood. Only one ingredient is legible.'],
      ['二人で味を探った。昔と同じにはならなかったが、宿の献立に「明日の鍋」が増えた。', 'Together you remake the dish. It tastes a little different, so the inn adds it to the menu as Tomorrow’s Pot.'],
      'meat', 'strongTonic', 'insight'),
  ],
  broker: [
    story(['値札の裏の手紙', 'Letters under the price tags', 'ねふだの うらの てがみ'],
      ['仲買人は荷箱の値札を一枚も捨てない。裏返すと、いつも短い手紙が書いてある。', 'The broker keeps every price tag. A short letter is written on the back of each one.'],
      ['仕入れ先の畑が初めて豊作だった日、値札には代金でなく「明日も来て」と書いたという。', 'On a grower’s first good harvest the tag read “Come again tomorrow” instead of quoting a price.'],
      'thread', 'grain', 'presence'),
    story(['半分の市', 'Half the market', 'はんぶんの いち'],
      ['嵐で市の屋根が半分なくなった。五軒を、今までの半分の場所で開く方法を考える。', 'A storm took half the roof. Find a way to fit five stalls into half the space.'],
      ['売る時間をずらすと、夕方の市に仕事帰りの客が来た。仲買人は新しい看板を掛けた。', 'Staggering the hours brings in customers on their way home. The broker hangs up a new sign.'],
      'timber', 'relic', 'insight'),
  ],
  smith: [
    story(['刃のない仕事', 'Work without a blade', 'はの ない しごと'],
      ['工匠が農具を曲げ直している。持ち主は、明日も同じ場所で使うと言う。', 'The smith is straightening a farm tool its owner needs again tomorrow.'],
      ['持ち手を一段短くすると、もう曲がらない。工匠は鎚を置き、自分の手の癖を話した。', 'A shorter handle keeps the tool from bending. The smith sets down the hammer and talks about the habits of their own hands.'],
      'ore', 'timber', 'might'),
    story(['鎚を貸す日', 'A day to lend the hammer', 'つちを かす ひ'],
      ['工匠は初めて一日だけ工房を空けたいが、困る人がいないか気にしている。', 'The smith wants a first day off and worries that someone may need the workshop.'],
      ['簡単な直し方を町の人に教えた。鍵を預けると、工匠は何年ぶりかで橋の向こうへ出かけた。', 'You teach the town a few repairs. For the first time in years, the smith crosses the bridge while someone else holds the key.'],
      'timber', 'ore', 'finesse'),
  ],
  keeper: [
    story(['街道の迷子札', 'Tags for lost travelers', 'かいどうの まいごふだ'],
      ['見張りは道標から名前札を集めている。迷った人ほど、名前を残していくらしい。', 'The warden collects name tags from signposts. Travelers leave them when they get lost.'],
      ['名前札を帰った順に掛け直した。いちばん新しい札には、まだ帰らぬ一人分の灯りを残す。', 'You rehang the tags in order of safe return. A light remains under the newest tag for one person still out there.'],
      'lantern', 'fieldKit', 'finesse'),
    story(['二度しか鳴らない笛', 'A whistle for two calls', 'にどしか ならない ふえ'],
      ['見張りの笛が割れた。吹けるのはあと二度。それでも、最後の一本を捨てられない。', 'The warden’s cracked whistle has perhaps two notes left. They still cannot throw it away.'],
      ['笛の音を街道の仲間で覚え直した。一人が吹けなくなっても、次の人が続けられる。', 'You teach the signal to the road crew. When one person can no longer whistle, another can answer.'],
      'ore', 'lantern', 'presence'),
  ],
  reader: [
    story(['話さない人の記録', 'The record of the quiet ones', 'はなさない ひとの きろく'],
      ['聞き書き手は、昔話を語らない人の家を何度も訪ねている。', 'The historian keeps visiting a household that never tells its story.'],
      ['家の前で待つと、窓辺に道具が三つ並んだ。何も尋ねず、使い方だけを記した。', 'Three tools appear in the window as you wait. You ask no questions and write only how they are used.'],
      'relic', 'thread', 'insight'),
    story(['祭りのない年', 'The year without a festival', 'まつりの ない とし'],
      ['年代記から一度だけ祭りの記録が消えている。聞き書き手は、その年の人たちを責めたくない。', 'One year’s festival is missing from the chronicle. The historian does not want to blame anyone for it.'],
      ['祭りは開けなかったが、各家が同じ夜に灯りを出した。そのことを見開きに残した。', 'There was no festival, but every household lit a lamp on the same night. You give that night a full page.'],
      'grain', 'relic', 'presence'),
  ],
  grower: [
    story(['乾かない種袋', 'The seed bag that stays damp', 'かわかない たねぶくろ'],
      ['世話役が、濡れた種袋には触れないでくれと言った。中では少しずつ根が伸びている。', 'The seedkeeper asks you not to touch a damp bag. Roots are slowly growing through the cloth.'],
      ['袋ごと畑へ置くと運び傷がつかなかった。来年は同じ方法を隣の畑にも教える。', 'You plant the whole bag without damaging the roots. Next year the neighboring plot will try it.'],
      'seed', 'herb', 'insight'),
    story(['道端の引っ越し', 'A roadside transplant', 'みちばたの ひっこし'],
      ['道が広がる場所に薬草がある。旅人も使うので、根を残して移せる場所を探している。', 'Herbs grow where the road will be widened. Find a new spot where travelers can still reach them.'],
      ['新しい畝を街道の両側に分けた。休む人が一株ずつ世話をできるよう、井戸に小さな桶を置く。', 'You divide the new bed between both sides of the road and leave a bucket for travelers to help water it.'],
      'herb', 'seed', 'finesse'),
  ],
};

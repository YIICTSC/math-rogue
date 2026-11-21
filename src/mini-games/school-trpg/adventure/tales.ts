import type { Biome, Stat, Text } from './content';

export const BOONS = {
  roads: {
    name: ['街道整備', 'Clear roads'],
    benefit: ['この町からの移動時間が短くなる。', 'Travel from here takes less time.'],
  },
  trade: {
    name: ['市の協定', 'Market pact'],
    benefit: ['この町の購入価格が下がる。', 'Buy supplies here at lower prices.'],
  },
  garden: {
    name: ['実りの約束', 'Bountiful pact'],
    benefit: ['この町で採集・収穫する素材が増える。', 'Gather and harvest extra materials here.'],
  },
  study: {
    name: ['知識の公開', 'Open archive'],
    benefit: [
      'この町での研究と修練で経験値が増える。',
      'Research and training here grant extra experience.',
    ],
  },
  forge: {
    name: ['楽炉の火', 'Steady forge'],
    benefit: ['この町の装備製作では鉱石が少なくて済む。', 'Forging gear here uses less ore.'],
  },
  trust: {
    name: ['助け合い', 'Shared trust'],
    benefit: [
      'この町では初めて話す人とも親しくなりやすい。',
      'Conversations earn extra trust with locals.',
    ],
  },
} satisfies Record<string, { name: Text; benefit: Text }>;
export type Boon = keyof typeof BOONS;
type Ending = { stat: Stat; boon: Boon; choice: Text; resolution: Text };
type Tale = { name: Text; opening: Text; options: [Ending, Ending, Ending] };

export const TALES = {
  academy: {
    name: ['鳴らない放課後の鐘', 'A Bell Gone Quiet'],
    opening: [
      '鐘楼が止まり、授業を終えた町の人たちが帰り時を見失っている。大工、書庫の生徒、広場の演奏者がそれぞれ別の案を持っている。',
      'The tower bell falls silent. A carpenter, a library student and a square musician offer competing ways to tell the town when school is out.',
    ],
    options: [
      {
        stat: 'might',
        boon: 'roads',
        choice: ['鐘楼と下の橋を修理する', 'Repair the belltower and the bridge below'],
        resolution: [
          '鐘の修理と一緒に橋が直り、街道へ出る近道が復活した。',
          'With the tower and its bridge repaired, a shortcut to the road opens again.',
        ],
      },
      {
        stat: 'insight',
        boon: 'study',
        choice: ['仕掛けを解読して書庫へ残す', 'Decode the mechanism for the archive'],
        resolution: [
          '図面を町の誰でも読めるようにした。書庫には新しい工夫が次々と持ち寄られる。',
          'You publish the plans. People begin bringing their own inventions to the archive.',
        ],
      },
      {
        stat: 'presence',
        boon: 'trust',
        choice: ['住人の音を集めて時を知らせる', 'Have neighbors ring in the hour together'],
        resolution: [
          '窓、屋台、船着場から合図が続く。町の人たちが互いの音を覚えた。',
          'Signals pass from windows to stalls to the dock. Neighbors come to recognize one another by sound.',
        ],
      },
    ],
  },
  grove: {
    name: ['種庫に残った三粒', 'Three Seeds in the Vault'],
    opening: [
      '根の神殿で見つかった種が三粒しかない。種守は育てたいと言い、商人は配って増やそうとし、郷土史家は由来を知りたがる。',
      'Only three seeds were found in the root temple. The seedkeeper wants to grow them, the broker wants to distribute them, and the historian wants to learn their origin.',
    ],
    options: [
      {
        stat: 'finesse',
        boon: 'garden',
        choice: ['日陰と水の調整で種を育てる', 'Raise the seeds in measured shade and water'],
        resolution: [
          '芽が根づき、薬園の土まで豊かになった。',
          'The shoots take root, enriching the soil in the town’s gardens.',
        ],
      },
      {
        stat: 'presence',
        boon: 'trade',
        choice: ['種を託す条件を市で取り決める', 'Negotiate how the seeds are shared'],
        resolution: [
          '育った株を分け合う約束ができ、町の市から高い手数料が消えた。',
          'Growers agree to share the plants, and steep fees disappear from the market.',
        ],
      },
      {
        stat: 'insight',
        boon: 'study',
        choice: ['古い種の記録をひもとく', 'Trace the seeds through old records'],
        resolution: [
          '種と森の記録を公開し、旅人も読み解きに加われるようにした。',
          'You open the forest records so travelers can help interpret them.',
        ],
      },
    ],
  },
  coast: {
    name: ['潮が運んだ浮き市', 'Market Adrift'],
    opening: [
      '夜中の潮で浮き市の桟橋が流れ、漁師と買い手が別々の船着場で待っている。',
      'An overnight tide carries away the market pier. Fishers and buyers now wait at different docks.',
    ],
    options: [
      {
        stat: 'finesse',
        boon: 'roads',
        choice: ['流木で潮を逃がす継ぎ桟橋を作る', 'Build a flexing pier from driftwood'],
        resolution: [
          '桟橋は潮に押されなくなり、船も荷車も早く町を出られる。',
          'The pier gives with the tide. Boats and wagons can leave town sooner.',
        ],
      },
      {
        stat: 'presence',
        boon: 'trade',
        choice: ['両方の船着場を使う値決めをする', 'Agree on prices for both docks'],
        resolution: [
          '片方の市に頼らない取引が始まり、買い物が安くなった。',
          'Trade can continue at either dock, bringing prices down.',
        ],
      },
      {
        stat: 'insight',
        boon: 'garden',
        choice: ['新しい潮目を読んで漁場を記す', 'Map the new fishing grounds'],
        resolution: [
          '新しい潮目で魚が見つかり、波止場の食卓が賑わった。',
          'The new current brings fish, and meals at the docks grow more plentiful.',
        ],
      },
    ],
  },
  alpine: {
    name: ['雪の下の帰り道', 'The Road Beneath the Snow'],
    opening: [
      '雪で峠の印が消えた。吹雪を避けた旅人の足跡と、途中で切れた古い道標の縄が残っている。',
      'Snow buries the pass markers. All that remains are travelers’ footprints and an old guide rope cut in half.',
    ],
    options: [
      {
        stat: 'might',
        boon: 'roads',
        choice: ['雪を払って道標を立て直す', 'Clear the snow and raise new markers'],
        resolution: [
          '峠の印が風から守られ、旅人は迷わず越えられるようになった。',
          'Sheltered markers help travelers cross the pass without losing their way.',
        ],
      },
      {
        stat: 'finesse',
        boon: 'forge',
        choice: ['凍らない金具で避難路を作る', 'Forge frostproof fittings for a refuge route'],
        resolution: [
          '余った金具を工房に配り、鍛冶に必要な鉱石が減った。',
          'Spare fittings go to the workshops, reducing the ore needed for new gear.',
        ],
      },
      {
        stat: 'presence',
        boon: 'trust',
        choice: ['雪宿りを頼める家を募る', 'Organize a network of storm shelters'],
        resolution: [
          '玄関に灯りを置く家が増え、宿と町が一緒に旅人を迎える。',
          'More houses leave lights by their doors and share the work of sheltering travelers.',
        ],
      },
    ],
  },
  ember: {
    name: ['炉が冷えるまで', 'Before the Furnace Cools'],
    opening: [
      '古い炉は最後の火を残すだけ。工房の親方と露店の料理人のどちらも、火を絶やすわけにはいかない。',
      'The old furnace has one ember left. The chief smith and a market cook both depend on keeping it alive.',
    ],
    options: [
      {
        stat: 'might',
        boon: 'forge',
        choice: ['風路を開き炉をよみがえらせる', 'Open the draft and revive the forge'],
        resolution: [
          '炉は少ない燃料で熱を保ち、工房は鉱石を無駄にしなくなった。',
          'The furnace holds heat with less fuel, and the smiths waste less ore.',
        ],
      },
      {
        stat: 'finesse',
        boon: 'trade',
        choice: ['分けられる火床を作る', 'Build a hearth that can be shared'],
        resolution: [
          '露店が戻り、料理と金物を定期的に交換する市になった。',
          'The stalls return and set up a steady exchange of food and metalwork.',
        ],
      },
      {
        stat: 'presence',
        boon: 'trust',
        choice: ['工房と露店を共同で運営する案を出す', 'Broker a shared workshop and kitchen'],
        resolution: [
          '働く場所を分け合い、町は新しい手伝いを歓迎するようになった。',
          'The crews share their space and begin welcoming new helpers.',
        ],
      },
    ],
  },
  sky: {
    name: ['風向計を止めた手紙', 'The Letter in the Wind Vane'],
    opening: [
      '気象台の風向計に、遠い浮島からの手紙が絡まった。空橋を閉じる前に手紙を取り戻したい。',
      'A letter from a distant island tangles around the observatory vane. The skybridge is about to close.',
    ],
    options: [
      {
        stat: 'finesse',
        boon: 'roads',
        choice: ['風の合間に足場を渡って取りに行く', 'Cross the scaffolding between gusts'],
        resolution: [
          '手紙を傷つけずに回収し、空橋を開けられる時間が延びた。',
          'The letter is recovered intact and the bridge can stay open longer.',
        ],
      },
      {
        stat: 'insight',
        boon: 'study',
        choice: [
          '風の周期を読み、手紙を落とさせる',
          'Read the wind cycle and let it release the letter',
        ],
        resolution: [
          '観測のやり方が台帳に載り、気象台で学べることが増えた。',
          'Your method goes into the logbook, giving future observers more to learn.',
        ],
      },
      {
        stat: 'presence',
        boon: 'trade',
        choice: [
          '向こうの島と共同で風待ち市を開く',
          'Arrange a shared market while waiting for safe winds',
        ],
        resolution: [
          '空橋が閉じる日も物資を分け合うことになった。',
          'The islanders agree to share supplies even on days when the skybridge is closed.',
        ],
      },
    ],
  },
} satisfies Record<Biome, Tale>;

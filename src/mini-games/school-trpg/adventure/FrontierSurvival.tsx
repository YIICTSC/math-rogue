import React from 'react';
import { Backpack, Droplets, Flame, HeartHandshake, Swords, Utensils } from 'lucide-react';
import { totalLiquid, thirst, thirstPenalty, vesselCapacity } from './frontierState';
import type { Adventure } from './state';
import type { Text } from './content';
import type { Local, Send } from './ui';

export const SURVIVAL_GUIDE: Text = [
  'フロンティアの世界での生き方',
  'How to live in the Frontier',
  'フロンティアの せかいでの いきかた',
];
export const HYDRATION_MENU: Text = ['水分補給', 'Hydration', 'すいぶんほきゅう'];

export function hydrationLabel(s: Adventure): Text {
  if (thirst(s) >= 24) return ['脱水', 'Dehydrated', 'だっすい'];
  if (thirst(s) >= 12) return ['のどが渇いた', 'Thirsty', 'のどが かわいた'];
  return ['水分は十分', 'Hydrated', 'すいぶんは じゅうぶん'];
}

export function TownHydration({
  s,
  send,
  t,
  showGuide,
}: {
  s: Adventure;
  send: Send;
  t: Local;
  showGuide: () => void;
}) {
  const penalty = thirstPenalty(s);
  const water = s.frontier.liquids.water;
  const volume = totalLiquid(s);
  const capacity = vesselCapacity(s);
  return (
    <div className="sa-stack">
      <div className="sa-inline sa-hydration-summary" role="status">
        {s.frontier.rules.weather && (
          <strong data-risk={penalty > 0 || undefined}>
            <Droplets size={17} />
            {t(hydrationLabel(s))}
            {penalty > 0 && ' · ' + t(['判定', 'Checks', 'はんてい']) + ' −' + penalty}
          </strong>
        )}
        <span>
          {t(['飲み水', 'Drinking water', 'のみみず'])} ×{water}
        </span>
        <span>
          {t(['水筒の容量', 'Flask capacity', 'すいとうの ようりょう'])} {volume}/{capacity}
        </span>
      </div>
      <div className="sa-action-list">
        <button
          type="button"
          className="sa-primary"
          disabled={s.frontier.hydration === s.time}
          onClick={() => send({ type: 'field', operation: { kind: 'well' } })}
        >
          <span>{t(['井戸で水を飲む', 'Drink from the well', 'いどで みずを のむ'])}</span>
          <small>{t(['無料', 'Free', 'むりょう'])}</small>
        </button>
        <button
          type="button"
          disabled={volume >= capacity || s.gold < 2}
          onClick={() => send({ type: 'field', operation: { kind: 'fill', id: 'water' } })}
        >
          <span>
            {t(['水筒に飲み水を買い足す', 'Refill flask with water', 'すいとうに のみみずを たす'])}
          </span>
          <small>+1 · 2 G</small>
        </button>
      </div>
      <p className="sa-hint">
        {t([
          '町では井戸、旅先では「道具と能力」から水筒の水を飲めます。',
          'Drink at the well in town or from a flask under Supplies and powers in the ruins.',
          'まちでは いど、たびさきでは「どうぐと のうりょく」から みずを のめます。',
        ])}
      </p>
      <button type="button" onClick={showGuide}>
        {t(SURVIVAL_GUIDE)}
      </button>
    </div>
  );
}

const GUIDE_SECTIONS = [
  {
    icon: Droplets,
    title: ['水と行き先', 'Water and travel', 'みずと いきさき'],
    text: [
      '水と食料の残りを見て、どこまで旅を続けるか考えましょう。「渇きと地形の影響」を有効にすると、飲まずに12時間過ごすごとに判定が1下がります（最大−3）。24時間に達すると体力と集中も減ります。出発前は町の井戸で飲み、遺跡へは水筒に水を入れて出かけましょう。水は火を冷ましたり、住民と盟約を結んだりするのにも使えます。',
      'Use your water and food supplies to decide how far to travel. With Thirst and terrain effects enabled, each 12 hours without water reduces checks by one, up to three. After 24 hours you also lose HP and Focus. Drink at the town well before leaving and carry a flask into ruins. Water also cools fire and helps make pacts.',
      '「かわきと ちけいの えいきょう」が あると、12じかん ごとに はんていが 1さがります。24じかんで たいりょくと しゅうちゅうも へります。まちの いどで のみ、いせきには すいとうを もちましょう。',
    ],
  },
  {
    icon: Utensils,
    title: ['食事と休息', 'Meals and rest', 'しょくじと きゅうそく'],
    text: [
      '食事は一日一回。空腹が続くと体力・集中・判定に響き、回復もしづらくなります。町の「暮らし → 食事」で宿の食事を取り、遠出には弁当や郷土料理を携行。疲れがたまったら宿や自宅で眠れます。',
      'Eat once a day. Hunger drains HP and Focus, weakens checks and slows healing. Use Town life → Meals to eat at the inn, and pack food for long trips. Sleep at the inn or at home to clear fatigue.',
      'いちにち いっしょく。くうふくが つづくと はんていが ふりで、かいふくも しづらくなります。「くらし → しょくじ」で たべ、たびには おべんとうを。つかれたら やどや いえで ねむれます。',
    ],
  },
  {
    icon: Flame,
    title: ['遺跡の準備', 'Before entering ruins', 'いせきの じゅんび'],
    text: [
      '灯りが尽きると判定が難しくなり、暗闇の不意打ちにも注意が要ります。灯油を持ち、見取り図を確認しながら進みましょう。自動探索は未調査の危険の手前で止まり、探索メニューから入口への道をたどれます。',
      'Without light, checks get harder and enemies can ambush you. Bring lamp oil and check the automap. Auto-explore stops before unresolved dangers. The exploration menu can guide you back to the entrance.',
      'あかりが なくなると はんていが むずかしくなります。とうゆを もち、みとりずを みましょう。じどう たんさくは きけんの てまえで とまり、いりぐちへ もどる みちも えらべます。',
    ],
  },
  {
    icon: Swords,
    title: ['戦いと装備', 'Combat and equipment', 'たたかいと そうび'],
    text: [
      '技は装備と主人公の立ち回りで変わります。戦術戦闘では射程と射線が大切です。押し出しで別の魔物や壁にぶつけたり、火や帯電した床へ追い込んだりできます。危なければ防御や退却を選びましょう。',
      'Equipment and calling determine your techniques. Watch range and line of sight in tactical combat. Push creatures into another foe, a wall, fire, or electrified flooring. Guard or retreat when a fight turns dangerous.',
      'そうびと とくいな たちまわりで わざが かわります。わざの とどく きょりと みえる ばしょを かくにん。てきを おして かべや ほかの てきに ぶつけられます。あぶないときは ぼうぎょや たいきゃくを。',
    ],
  },
  {
    icon: HeartHandshake,
    title: ['町の人と拠点', 'People and home', 'まちの ひとと きょてん'],
    text: [
      '会話や贈り物で親しくなると、旅に誘えます。依頼や史跡の調査で経験を積み、素材を集めて装備や拠点を整えましょう。町の食事や買い物は「暮らし」から利用できます。',
      'Talk to residents and give gifts to earn trust and invite companions. Complete commissions and investigate sites for experience. Gather materials to improve equipment and your home. Meals and shopping are under Town life.',
      'まちの ひとと はなし、なかよくなると たびに さそえます。いらいや しせきの ちょうさで けいけんを つみ、そざいを あつめて そうびや いえを ととのえましょう。',
    ],
  },
  {
    icon: Backpack,
    title: ['旅のルール', 'Journey rules', 'たびの ルール'],
    text: [
      '「旅日誌 → 野外手帳 → 補給と設定」で渇きや手動の戦術戦闘を選べます。倒れたときの扱いは主人公作成時に決まり、「一度きりの旅」では冒険終了、「町から再開」では救助費を払って続けられます。',
      'Open Journal → Field guide → Camp and rules to choose thirst and manual tactical combat. The rules chosen at character creation determine whether defeat ends the run or lets you continue in town after paying for rescue.',
      '「たびにっし → やがい てちょう → ほきゅうと せってい」で かわきや しゅどう せんとうを えらべます。たおれた あとの ルールは しゅじんこうを つくる ときに きまります。',
    ],
  },
] satisfies Array<{ icon: typeof Droplets; title: Text; text: Text }>;

export function SurvivalGuide({ t }: { t: Local }) {
  return (
    <div className="sa-survival-guide">
      {GUIDE_SECTIONS.map(({ icon: Icon, title, text }) => (
        <section key={title[0]}>
          <h3>
            <Icon size={18} />
            {t(title)}
          </h3>
          <p>{t(text)}</p>
        </section>
      ))}
    </div>
  );
}

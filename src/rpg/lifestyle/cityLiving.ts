import type { World } from "../engine";
import type { CityLot, CityState } from "../city/model";
import { c, type Copy } from "../town/catalog";
import { CITY_PROJECTS, DISTRICT_PLANS } from "./catalog";
export interface CityLiving {
  projects: Array<{ id: string; started: number; complete: boolean }>;
  claimed: string[];
}
export type CityLivingAction =
  | { type: "city-district"; id: string; plan: string }
  | { type: "city-project"; project: string }
  | { type: "city-request"; id: string };
export const cityLiving = (s: CityState) =>
  (s.living ??= { projects: [], claimed: [] });
export const districtPlan = (lot: CityLot) =>
  DISTRICT_PLANS.find((p) => p.id === lot.district) || DISTRICT_PLANS[0];
export function projectBenefits(s: CityState) {
  const active = s.living?.projects.filter((p) => p.complete) || [];
  return active.reduce(
    (sum, p) => {
      const d = CITY_PROJECTS.find((d) => d.id === p.id);
      return {
        happiness: sum.happiness + (d?.happiness || 0),
        pollution: sum.pollution + (d?.pollution || 0),
      };
    },
    { happiness: 0, pollution: 0 },
  );
}
export function cityRequests(w: World) {
  const s = w.city!;
  const defs = [
    {
      name: c("緑のある暮らし", "A greener town", "みどりのあるくらし"),
      detail: c(
        "公園・農場・庭園を育て、汚染を30以下に。",
        "Grow parks, farms and gardens. Keep pollution at 30 or less.",
        "こうえん・のうじょう・ていえんをそだて、おせんをさんじゅういかに。",
      ),
      ready: s.population >= 10 && s.pollution <= 30,
    },
    {
      name: c("通いやすい街", "Easy journeys", "かよいやすいまち"),
      detail: c(
        "交通混雑を35以下に。道路やバスを見直そう。",
        "Keep traffic at 35 or less. Improve roads and buses.",
        "こうつうこんざつをさんじゅうごいかに。どうろやばすをみなおそう。",
      ),
      ready: s.population >= 10 && s.traffic <= 35,
    },
    {
      name: c("安心できる暮らし", "Essential services", "あんしんできるくらし"),
      detail: c(
        "電力・水道・診療の充足を60%以上に。",
        "Reach 60% power, water and health coverage.",
        "でんりょく・すいどう・しんりょうのじゅうそくをろくじゅうぱーせんといじょうに。",
      ),
      ready:
        s.population >= 10 &&
        ["power", "water", "health"].every((k) => (s.services[k] || 0) >= 60),
    },
    {
      name: c("働く場所がほしい", "Local jobs", "はたらくばしょがほしい"),
      detail: c(
        "人口の半分以上の雇用を用意しよう。",
        "Provide jobs for at least half the population.",
        "じんこうのはんぶんいじょうのこようをよういしよう。",
      ),
      ready: s.population >= 10 && s.jobs >= s.population / 2,
    },
    {
      name: c("やさしい税率", "Fair taxation", "やさしいぜいりつ"),
      detail: c(
        "税率10%以下、幸福度55以上の街へ。",
        "Keep tax at 10% or less and happiness at 55 or more.",
        "ぜいりつじゅっぱーせんといか、こうふくどごじゅうごいじょうのまちへ。",
      ),
      ready: s.population >= 10 && s.tax <= 10 && s.happiness >= 55,
    },
    {
      name: c("みんなの居場所", "Places to meet", "みんなのいばしょ"),
      detail: c(
        "交流プロジェクトを2件完成させよう。",
        "Complete two community projects.",
        "こうりゅうぷろじぇくとをにけんかんせいさせよう。",
      ),
      ready: (s.living?.projects.filter((p) => p.complete).length || 0) >= 2,
    },
  ];
  return [0, 1, 2].map((i) => {
    const index = (Math.floor(s.month / 6) + i) % defs.length;
    return {
      ...defs[index],
      id: `request-${Math.floor(s.month / 6)}-${index}`,
      reward: 180 + s.level * 40,
    };
  });
}
export function advanceCityLiving(s: CityState) {
  for (const p of s.living?.projects || []) {
    const d = CITY_PROJECTS.find((d) => d.id === p.id);
    if (d && s.month - p.started >= d.months) p.complete = true;
  }
}
export function cityAdvice(s: CityState): Copy[] {
  const advice: Copy[] = [];
  if (s.happiness < 45)
    advice.push(
      c(
        "住民が困っています。水道・電力と道路の接続から見直しましょう。",
        "Residents need help. Check water, power and road connections first.",
        "じゅうみんがこまっています。すいどう・でんりょくとどうろのせつぞくからみなおしましょう。",
      ),
    );
  if (s.traffic > 45)
    advice.push(
      c(
        "交通が混雑しています。バス停と道路を増やすと暮らしやすくなります。",
        "Traffic is busy. More buses and connected roads will help.",
        "こうつうがこんざつしています。ばすていとどうろをふやすとくらしやすくなります。",
      ),
    );
  if (s.pollution > 30)
    advice.push(
      c(
        "公園と庭園地区で空気をきれいにしましょう。",
        "Clean the air with parks and garden districts.",
        "こうえんとていえんちくでくうきをきれいにしましょう。",
      ),
    );
  if (s.jobs < s.population / 2)
    advice.push(
      c(
        "商い地区や工房で、近くに働く場所を。",
        "Markets and workshops provide local jobs.",
        "あきないちくやこうぼうで、ちかくにはたらくばしょを。",
      ),
    );
  if (s.income < s.expenses)
    advice.push(
      c(
        "赤字です。予算と維持費を確認し、税率は少しずつ調整しましょう。",
        "A deficit: review budgets and upkeep. Adjust tax gradually.",
        "あかじです。よさんといじひをかくにんし、ぜいりつはすこしずつちょうせいしましょう。",
      ),
    );
  if (!advice.length)
    advice.push(
      c(
        "穏やかな街です。季節の交流で、さらに愛着のある場所に。",
        "A peaceful town. Seasonal community projects will make it even lovelier.",
        "おだやかなまちです。きせつのこうりゅうで、さらにあいちゃくのあるばしょに。",
      ),
    );
  return advice;
}

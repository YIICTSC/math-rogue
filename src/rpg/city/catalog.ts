import { c, type Copy } from "../town/catalog";
export interface CityBuilding {
  id: string;
  name: Copy;
  cost: number;
  upkeep: number;
  capacity: number;
  jobs: number;
  service?: string;
  range: number;
  pollution: number;
  level: number;
  index: number;
}
const names = [
  ["住宅", "Cottage", "じゅうたく"],
  ["集合住宅", "Apartments", "しゅうごうじゅうたく"],
  ["商店", "Market", "しょうてん"],
  ["工房", "Workshop", "こうぼう"],
  ["風力発電", "Wind power", "ふうりょくはつでん"],
  ["給水塔", "Water tower", "きゅうすいとう"],
  ["診療所", "Clinic", "しんりょうじょ"],
  ["消防署", "Fire station", "しょうぼうしょ"],
  ["警察署", "Police station", "けいさつしょ"],
  ["学校", "School", "がっこう"],
  ["リサイクル場", "Recycling depot", "りさいくるじょう"],
  ["公園", "Park", "こうえん"],
  ["バス停", "Bus station", "ばすてい"],
  ["農場", "Farm", "のうじょう"],
  ["図書館", "Library", "としょかん"],
  ["祭り広場", "Festival plaza", "まつりひろば"],
  ["市役所", "City hall", "しやくしょ"],
  ["太陽光発電", "Solar power", "たいようこうはつでん"],
  ["下水処理場", "Sewage plant", "げすいしょりじょう"],
  ["運動公園", "Sports center", "うんどうこうえん"],
];
const ids = [
  "cottage",
  "apartments",
  "market",
  "workshop",
  "wind",
  "water",
  "clinic",
  "fire",
  "police",
  "school",
  "recycle",
  "park",
  "bus",
  "farm",
  "library",
  "festival",
  "hall",
  "solar",
  "sewage",
  "sports",
];
export const CITY_BUILDINGS: CityBuilding[] = ids.map((id, i) => ({
  id,
  name: c(...(names[i] as [string, string, string])),
  index: i,
  cost: [
    100, 320, 160, 220, 250, 230, 260, 240, 260, 230, 210, 100, 180, 160, 250,
    210, 0, 380, 280, 290,
  ][i],
  upkeep: [1, 3, 3, 6, 8, 7, 10, 9, 10, 8, 8, 4, 7, 4, 8, 7, 0, 5, 9, 8][i],
  capacity: i === 0 ? 12 : i === 1 ? 40 : 0,
  jobs: i === 2 ? 14 : i === 3 ? 24 : i === 13 ? 18 : i === 16 ? 0 : 4,
  service:
    [
      "",
      "",
      "",
      "",
      "power",
      "water",
      "health",
      "fire",
      "safety",
      "education",
      "garbage",
      "leisure",
      "transit",
      "",
      "education",
      "leisure",
      "",
      "power",
      "sewage",
      "leisure",
    ][i] || undefined,
  range: i === 4 || i === 5 || i === 17 || i === 18 ? 24 : i === 12 ? 18 : 12,
  pollution: i === 3 ? 18 : i === 10 ? 6 : i === 13 ? 3 : 0,
  level: [0, 2, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 2, 0, 2, 2, 0, 3, 2, 3][i],
}));
export const cityBuilding = (id: string) =>
  CITY_BUILDINGS.find((b) => b.id === id);
export const CITY_SERVICES = [
  ["power", c("電力", "Power", "でんりょく")],
  ["water", c("水道", "Water", "すいどう")],
  ["sewage", c("下水", "Sewage", "げすい")],
  ["health", c("医療", "Health", "いりょう")],
  ["fire", c("消防", "Fire protection", "しょうぼう")],
  ["safety", c("治安", "Safety", "ちあん")],
  ["education", c("教育", "Education", "きょういく")],
  ["garbage", c("ごみ", "Garbage", "ごみ")],
  ["leisure", c("余暇", "Leisure", "よか")],
  ["transit", c("公共交通", "Transit", "こうきょうこうつう")],
] as const;
export const CITY_POLICIES = [
  c("緑化推進", "Green city", "りょっかすいしん"),
  c("学校給食", "School meals", "がっこうきゅうしょく"),
  c("無料バス", "Free buses", "むりょうばす"),
  c("防災訓練", "Disaster drills", "ぼうさいくんれん"),
];
export const CITY_CHALLENGES = [
  c("人口を増やそう", "Grow the population", "じんこうをふやそう"),
  c("幸福な街にしよう", "Build a happy city", "こうふくなまちにしよう"),
  c("緑豊かな街にしよう", "Plant more parks", "みどりゆたかなまちにしよう"),
  c("雇用を増やそう", "Create more jobs", "こようをふやそう"),
  c(
    "街の接続を改善しよう",
    "Connect the city",
    "まちのせつぞくをかいぜんしよう",
  ),
  c(
    "公共サービスを整えよう",
    "Improve public services",
    "こうきょうさーびすをととのえよう",
  ),
];

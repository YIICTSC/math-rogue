const rows = [
  ["農園", "Farm", "のうえん"],
  ["農園・牧場", "Farm & ranch", "のうえん・ぼくじょう"],
  ["農園・牧場・ペット", "Farm, ranch & pets", "のうえん・ぼくじょう・ぺっと"],
  [
    "農園の近くで作業してください。",
    "Work near your farm.",
    "のうえんのちかくでさぎょうしてください。",
  ],
  [
    "農園ができました。季節の種と飼料を用意しました。",
    "Your farm is ready. Seasonal seeds and feed are available.",
    "のうえんができました。きせつのたねとしりょうをよういしました。",
  ],
  [
    "収穫しました。食材庫から料理や出荷に使えます。",
    "Harvest complete. Use your pantry for cooking or selling.",
    "しゅうかくしました。しょくざいこからりょうりやしゅっかにつかえます。",
  ],
  [
    "牧場の恵みを受け取りました。食材庫を確認しましょう。",
    "Animal products collected. Check your pantry.",
    "ぼくじょうのめぐみをうけとりました。しょくざいこをかくにんしましょう。",
  ],
] as const;
export const FARM_ENGLISH: Record<string, string> = Object.fromEntries(
  rows.map(([ja, en]) => [ja, en]),
);
export const FARM_HIRAGANA: Record<string, string> = Object.fromEntries(
  rows.map(([ja, , hi]) => [ja, hi]),
);

import type { RhythmSong } from "./catalog.generated";
export const RHYTHM_SCENES: Record<string, string> = {
  battle: "通常戦闘",
  boss: "ボス戦",
  mid_boss: "中ボス戦",
  final_boss: "最終決戦",
  menu: "メニュー",
  map: "冒険マップ",
  shop: "お店",
  rest: "休憩",
  event: "イベント",
  math: "学習問題",
  reward: "報酬",
  victory: "勝利",
  game_over: "ゲームオーバー",
  relic_select: "レリック選択",
  school_psyche: "学校探索",
  dungeon_gym: "体育館",
  dungeon_science: "理科室",
  dungeon_music: "音楽室",
  dungeon_library: "図書室",
  dungeon_roof: "屋上",
  dungeon_boss: "ダンジョンボス",
  kocho_setup: "校長戦の準備",
  kocho_battle: "校長との戦闘",
  kocho_boss: "校長との決戦",
  poker_play: "ポーカー",
  poker_shop: "ポーカーのお店",
  survivor_metal: "サバイバル",
  paper_plane_setup: "紙飛行機の準備",
  paper_plane_battle: "紙飛行機バトル",
  paper_plane_vacation: "紙飛行機の休暇",
};
export function songTheme(song: RhythmSong) {
  return song.path.includes("/high-school/")
    ? "高校編"
    : song.path.includes("/magic-female/")
      ? "マジック編・女性"
      : song.path.includes("/magic-male/")
        ? "マジック編・男性"
        : song.path.includes("/magic/")
          ? "マジック編"
          : "共通・小学校編";
}
export const songEdition = (song: RhythmSong) =>
  song.path.startsWith("bgm-new/") ? "新BGM" : "旧BGM";
export function songTitle(song: RhythmSong, t: (text: string) => string) {
  const stem = song.path.split("/").at(-1)!.replace(".mp3", "");
  return `${t(songEdition(song))} · ${t(songTheme(song))} · ${t(RHYTHM_SCENES[stem] || stem)}`;
}

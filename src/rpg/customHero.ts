export const HERO_VOICES = [
  "high-school:WARRIOR",
  "high-school:CARETAKER",
  "high-school:ASSASSIN",
  "high-school:MAGE",
  "high-school:DODGEBALL",
  "high-school:BARD",
  "high-school:LIBRARIAN",
  "high-school:CHEF",
  "high-school:GARDENER",
  "magic:AKARI",
  "magic:SHIZUKU",
  "magic:HIYORI",
  "magic:TSUBASA",
  "magic:REI",
  "magic:MADOKA",
  "magic:KOHARU",
  "magic:MIRAI",
  "magic:SERA",
  "magic:REN",
  "magic:SOMA",
  "magic:MINATO",
  "magic:RIKU",
  "magic:YAMATO",
  "magic:LEON",
  "magic:ELLIOT",
  "magic:SAKUYA",
];
export const HERO_ACTIONS = [
  "idle",
  "idle-special",
  "attack",
  "skill",
  "hit",
  "low-hp",
] as const;
export type HeroAction = (typeof HERO_ACTIONS)[number];
export interface CustomHero {
  version: 1;
  name: string;
  portrait: string;
  frames: Record<HeroAction, string[]>;
  voice: { theme: "high-school" | "magic"; heroId: string };
}
export const HERO_LIMIT = 320000;
export function validHero(value: unknown): value is CustomHero {
  const h = value as CustomHero;
  const image = (v: unknown) =>
    typeof v === "string" &&
    v.length <= 28000 &&
    /^data:image\/(webp|png);base64,[A-Za-z0-9+/=]+$/.test(v);
  return (
    !!h &&
    h.version === 1 &&
    typeof h.name === "string" &&
    h.name.trim().length > 0 &&
    h.name.length <= 24 &&
    image(h.portrait) &&
    !!h.frames &&
    HERO_ACTIONS.every(
      (a) =>
        Array.isArray(h.frames[a]) &&
        h.frames[a].length >= 1 &&
        h.frames[a].length <= 4 &&
        h.frames[a].every(image),
    ) &&
    !!h.voice &&
    ["high-school", "magic"].includes(h.voice.theme) &&
    HERO_VOICES.includes(`${h.voice.theme}:${h.voice.heroId}`) &&
    JSON.stringify(h).length <= HERO_LIMIT
  );
}
export function heroFrame(hero: CustomHero, action: HeroAction, time: number) {
  const frames = hero.frames[action];
  return frames[Math.floor(time / 155) % frames.length] || hero.portrait;
}
export function loadHero(): CustomHero | null {
  try {
    const h = JSON.parse(
      localStorage.getItem("rpg-original-hero-v1") || "null",
    );
    return validHero(h) ? h : null;
  } catch {
    return null;
  }
}
export function saveHero(hero: CustomHero | null) {
  if (hero) localStorage.setItem("rpg-original-hero-v1", JSON.stringify(hero));
  else localStorage.removeItem("rpg-original-hero-v1");
}

export interface ConversationVoice {
  enabled: boolean;
  engine?: "auto" | "original" | "device";
  pitch: number;
  rate: number;
  style: "robot" | "smooth" | "bouncy" | "warm" | "calm" | "playful";
  intonation?: number;
  timbre: number;
}
export const DEFAULT_CONVERSATION_VOICE: ConversationVoice = {
  enabled: true,
  engine: "original",
  pitch: 1.1,
  rate: 1,
  style: "smooth",
  timbre: 0,
  intonation: 0.65,
};
/** Built-in residents use explicit voice profiles so personality never assigns girls a deep timbre. */
const GIRL_RESIDENT_PITCH: Readonly<Record<string, number>> = {
  "resident-mina": 1.93,
  "resident-sui": 1.9,
  "resident-yuki": 1.98,
  "resident-nono": 2,
  "resident-nemu": 1.92,
};
function voiceProfile(pitch: number, timbre: number, rate: number, style: ConversationVoice["style"], intonation: number): ConversationVoice {
  return { ...DEFAULT_CONVERSATION_VOICE, pitch, timbre, rate, style, intonation };
}
// Pitch, resonance, pace and expression jointly give each resident a recognizable voice.
const BOY_RESIDENT_VOICES: Readonly<Record<string, ConversationVoice>> = {
  "resident-ao": voiceProfile(1.3, 1, 1.12, "bouncy", 0.8),
  "resident-ren": voiceProfile(0.85, 3, 0.94, "warm", 0.4),
  "resident-saha": voiceProfile(1.1, 0, 1.04, "smooth", 0.6),
  "resident-phil": voiceProfile(1.2, 2, 1.08, "playful", 0.75),
  "resident-towa": voiceProfile(0.95, 2, 0.86, "calm", 0.3),
  "resident-kino": voiceProfile(1.15, 0, 0.98, "warm", 0.55),
  "resident-mio": voiceProfile(0.75, 3, 0.9, "smooth", 0.25),
};
const SCHOOL_HERO_VOICES: Readonly<Record<string, ConversationVoice>> = {
  WARRIOR: voiceProfile(1.05, 1, 1.08, "bouncy", 0.8),
  CARETAKER: voiceProfile(1.0, 0, 0.94, "warm", 0.45),
  ASSASSIN: voiceProfile(0.88, 2, 0.9, "calm", 0.3),
  MAGE: voiceProfile(1.12, 2, 1.04, "smooth", 0.5),
  DODGEBALL: voiceProfile(1.25, 1, 1.16, "playful", 0.85),
  BARD: voiceProfile(1.8, 1, 1.07, "bouncy", 0.8),
  LIBRARIAN: voiceProfile(1.65, 0, 0.88, "calm", 0.4),
  CHEF: voiceProfile(0.92, 3, 1.0, "warm", 0.6),
  GARDENER: voiceProfile(1.7, 0, 0.96, "warm", 0.55),
};
const MAGIC_HERO_VOICES: Readonly<Record<string, ConversationVoice>> = {
  AKARI: voiceProfile(1.8, 1, 1.08, "bouncy", 0.8),
  SHIZUKU: voiceProfile(1.6, 0, 0.9, "calm", 0.35),
  HIYORI: voiceProfile(1.7, 0, 0.94, "warm", 0.5),
  TSUBASA: voiceProfile(1.72, 1, 1.15, "bouncy", 0.85),
  REI: voiceProfile(1.5, 2, 0.92, "smooth", 0.35),
  MADOKA: voiceProfile(1.75, 2, 0.98, "smooth", 0.55),
  KOHARU: voiceProfile(1.65, 0, 0.92, "warm", 0.45),
  MIRAI: voiceProfile(1.85, 1, 1.04, "playful", 0.9),
  SERA: voiceProfile(1.9, 1, 1.0, "smooth", 0.65),
  REN: voiceProfile(1.05, 0, 0.98, "warm", 0.55),
  SOMA: voiceProfile(0.85, 3, 0.9, "calm", 0.3),
  MINATO: voiceProfile(1.3, 1, 1.05, "bouncy", 0.7),
  RIKU: voiceProfile(0.95, 2, 0.94, "playful", 0.6),
  YAMATO: voiceProfile(0.8, 3, 1.12, "bouncy", 0.8),
  LEON: voiceProfile(1.15, 1, 1.08, "playful", 0.85),
  ELLIOT: voiceProfile(1.1, 2, 0.9, "smooth", 0.4),
  SAKUYA: voiceProfile(0.72, 3, 0.85, "calm", 0.2),
};
const MAGIC_CLASS_VOICE_IDS: Readonly<Record<string, string>> = {
  WARRIOR: "AKARI", CARETAKER: "SHIZUKU", ASSASSIN: "HIYORI", MAGE: "TSUBASA",
  DODGEBALL: "REI", BARD: "MADOKA", LIBRARIAN: "KOHARU", CHEF: "MIRAI", GARDENER: "SERA",
};
export function defaultHeroVoice(theme: string, heroId: string): ConversationVoice {
  if (theme === "magic" && Object.hasOwn(MAGIC_CLASS_VOICE_IDS, heroId)) heroId = MAGIC_CLASS_VOICE_IDS[heroId];
  const profiles = theme === "magic" ? MAGIC_HERO_VOICES : SCHOOL_HERO_VOICES;
  const voice = Object.hasOwn(profiles, heroId) ? profiles[heroId] : DEFAULT_CONVERSATION_VOICE;
  // Elementary protagonists keep a lighter register than their high-school versions.
  return { ...voice, pitch: theme === "elementary" && voice !== DEFAULT_CONVERSATION_VOICE ? Math.min(2, voice.pitch + 0.15) : voice.pitch };
}
export function defaultResidentVoice(id: string, personality: number): ConversationVoice {
  const styles: ConversationVoice["style"][] = ["warm", "bouncy", "calm", "playful", "smooth", "warm", "bouncy", "calm"];
  const girlPitch = Object.hasOwn(GIRL_RESIDENT_PITCH, id) ? GIRL_RESIDENT_PITCH[id] : undefined;
  if (Object.hasOwn(BOY_RESIDENT_VOICES, id)) return { ...BOY_RESIDENT_VOICES[id] };
  return {
    ...DEFAULT_CONVERSATION_VOICE,
    pitch: girlPitch ?? (0.85 + personality * 0.07),
    rate: 0.9 + (personality % 3) * 0.08,
    timbre: girlPitch === undefined ? personality % 4 : 1,
    style: styles[personality] ?? "smooth",
    intonation: girlPitch === undefined ? 0.35 + (personality % 4) * 0.15 : 0.65,
  };
}
export function validConversationVoice(v: unknown): v is ConversationVoice {
  if (!v || typeof v !== "object") return false;
  const c = v as ConversationVoice;
  return (
    typeof c.enabled === "boolean" &&
    (c.engine === undefined || c.engine === "auto" || c.engine === "original" || c.engine === "device") &&
    Number.isFinite(c.pitch) &&
    c.pitch >= 0.5 &&
    c.pitch <= 2 &&
    Number.isFinite(c.rate) &&
    c.rate >= 0.6 &&
    c.rate <= 1.6 &&
    ["robot", "smooth", "bouncy", "warm", "calm", "playful"].includes(
      c.style,
    ) &&
    Number.isInteger(c.timbre) &&
    c.timbre >= 0 &&
    c.timbre <= 3 &&
    (c.intonation === undefined ||
      (Number.isFinite(c.intonation) && c.intonation >= 0 && c.intonation <= 1))
  );
}
export function loadConversationVoice(key: string, fallback: ConversationVoice = DEFAULT_CONVERSATION_VOICE, legacyKey?: string): ConversationVoice {
  try {
    const bank = JSON.parse(
      localStorage.getItem("rpg-conversation-voices-v1") || "{}",
    );
    if (Object.hasOwn(bank, key) && validConversationVoice(bank[key])) return { ...bank[key], engine: bank[key].engine === "auto" ? "original" : bank[key].engine };
    // Move the old shared custom-hero setting to the first selected voice only.
    if (legacyKey && Object.hasOwn(bank, legacyKey) && validConversationVoice(bank[legacyKey])) {
      const voice = { ...bank[legacyKey] };
      bank[key] = voice;
      delete bank[legacyKey];
      try { localStorage.setItem("rpg-conversation-voices-v1", JSON.stringify(bank)); } catch {}
      return voice;
    }
  } catch {
    /* Storage can be unavailable in private browsing. */
  }
  return { ...fallback };
}
export function saveConversationVoice(key: string, voice: ConversationVoice) {
  if (!validConversationVoice(voice)) return;
  try {
    const bank = JSON.parse(
      localStorage.getItem("rpg-conversation-voices-v1") || "{}",
    );
    localStorage.setItem(
      "rpg-conversation-voices-v1",
      JSON.stringify({ ...bank, [key]: voice }),
    );
  } catch {}
}
/** Pause at phrase boundaries rather than cutting kanji or words in half. */
export function speechParts(
  text: string,
  style: ConversationVoice["style"],
): string[] {
  return ["smooth", "warm", "calm"].includes(style)
    ? text.match(/[^。！？!?]+[。！？!?]*/gu) || [text]
    : text.match(/[^。！？!?、,;；]+[。！？!?、,;；]*/gu) || [text];
}

export const CONVERSATION_PRESETS = [
  {
    id: "gentle",
    ja: "やさしい",
    en: "Gentle",
    hi: "やさしい",
    voice: {
      pitch: 1.05,
      rate: 0.95,
      style: "warm",
      timbre: 0,
      intonation: 0.45,
    },
  },
  {
    id: "bright",
    ja: "元気",
    en: "Bright",
    hi: "げんき",
    voice: {
      pitch: 1.2,
      rate: 1.1,
      style: "bouncy",
      timbre: 1,
      intonation: 0.8,
    },
  },
  {
    id: "calm",
    ja: "落ち着いた",
    en: "Calm",
    hi: "おちついた",
    voice: {
      pitch: 0.9,
      rate: 0.85,
      style: "calm",
      timbre: 2,
      intonation: 0.35,
    },
  },
  {
    id: "tiny",
    ja: "小さくかわいい",
    en: "Tiny & cute",
    hi: "ちいさくかわいい",
    voice: {
      pitch: 1.8,
      rate: 1.05,
      style: "playful",
      timbre: 1,
      intonation: 0.7,
    },
  },
  {
    id: "deep",
    ja: "渋い",
    en: "Deep",
    hi: "しぶい",
    voice: {
      pitch: 0.7,
      rate: 0.9,
      style: "smooth",
      timbre: 3,
      intonation: 0.3,
    },
  },
  {
    id: "robot",
    ja: "メカ",
    en: "Mechanical",
    hi: "めか",
    voice: { pitch: 1.05, rate: 1, style: "robot", timbre: 1, intonation: 0.1 },
  },
] as const;
/** Gentle phrase-level prosody keeps Japanese readings intact and avoids syllable chopping. */
export function speechPlan(text: string, config: ConversationVoice) {
  const amount = config.intonation ?? 0.65;
  return speechParts(text, config.style).map((part, index) => {
    const question = /[？?]/.test(part),
      excited = /[！!]/.test(part),
      bounce = ["bouncy", "playful"].includes(config.style)
        ? (index % 2 ? -0.1 : 0.1) * amount
        : 0;
    const stylePitch =
      config.style === "warm" ? -0.025 : config.style === "calm" ? -0.04 : 0;
    return {
      text: part,
      pitch: Math.max(
        0.5,
        Math.min(
          2,
          config.pitch +
            stylePitch +
            bounce +
            (question ? 0.07 : excited ? 0.035 : 0) * amount,
        ),
      ),
      rate: Math.max(
        0.6,
        Math.min(
          1.6,
          config.rate *
            (config.style === "calm"
              ? 0.97
              : config.style === "warm"
                ? 0.99
                : 1) *
            (question ? 0.99 : excited ? 1.02 : 1),
        ),
      ),
      pause: /[、,;；]$/.test(part)
        ? 25
        : /[。！？!?]$/.test(part)
          ? config.style === "robot"
            ? 70
            : config.style === "calm"
              ? 120
              : 80
          : 20,
    };
  });
}

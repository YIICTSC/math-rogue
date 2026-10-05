export interface ConversationVoice {
  enabled: boolean;
  pitch: number;
  rate: number;
  style: "robot" | "smooth" | "bouncy" | "warm" | "calm" | "playful";
  intonation?: number;
  timbre: number;
}
export const DEFAULT_CONVERSATION_VOICE: ConversationVoice = {
  enabled: true,
  pitch: 1.1,
  rate: 1,
  style: "smooth",
  timbre: 0,
  intonation: 0.65,
};
export function validConversationVoice(v: unknown): v is ConversationVoice {
  if (!v || typeof v !== "object") return false;
  const c = v as ConversationVoice;
  return (
    typeof c.enabled === "boolean" &&
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
export function loadConversationVoice(key: string): ConversationVoice {
  try {
    const bank = JSON.parse(
      localStorage.getItem("rpg-conversation-voices-v1") || "{}",
    );
    if (validConversationVoice(bank[key])) return { ...bank[key] };
  } catch {
    /* Storage can be unavailable in private browsing. */
  }
  return { ...DEFAULT_CONVERSATION_VOICE };
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
      pitch: 1.45,
      rate: 1.05,
      style: "playful",
      timbre: 0,
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

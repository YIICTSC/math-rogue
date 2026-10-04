import { validConversationVoice, type ConversationVoice } from "./conversationVoice";
import type { World, Adventurer } from "./engine";
import { validHero, type CustomHero } from "./customHero";
export interface SocialMemory {
  phrases: string[];
  personality: "kind" | "logical" | "quirky";
  autoTalk: boolean;
  conversationVoice?: ConversationVoice;
}
export interface SocialLine {
  speaker: string;
  text: string;
  english?: string;
  hiragana?: string;
}
export const socialLineText = (line: SocialLine, mode: string) =>
  mode === "ENGLISH"
    ? line.english || line.text
    : mode === "HIRAGANA"
      ? line.hiragana || line.text
      : line.text;
export interface SocialTalk {
  id: string;
  at: number;
  people: string[];
  lines: SocialLine[];
  quirky: boolean;
}
export interface Relationship {
  people: [string, string];
  friendship: number;
  talks: number;
  lastTalk: number;
  houseId?: string;
  married?: boolean;
}
export interface SocialRequest {
  id: string;
  from: string;
  to: string;
  kind: "cohabit" | "marry";
  houseId?: string;
  expires: number;
}
export interface SocialWorld {
  relations: Relationship[];
  requests: SocialRequest[];
  talks: SocialTalk[];
  nextTalk: number;
  sequence: number;
}
export type SocialAction =
  | { type: "hero-set"; hero: CustomHero | null }
  | { type: "social-memory"; memory: SocialMemory }
  | { type: "social-player-talk"; text: string }
  | { type: "social-talk"; target: string }
  | {
      type: "social-request";
      target: string;
      kind: "cohabit" | "marry";
      houseId?: string;
    }
  | { type: "social-answer"; requestId: string; accept: boolean }
  | { type: "social-end"; target: string; kind: "cohabit" | "marry" };
export const newSocial = (): SocialWorld => ({
  relations: [],
  requests: [],
  talks: [],
  nextTalk: 0,
  sequence: 0,
});
const text = (s: unknown, max: number) =>
  typeof s === "string" &&
  s.trim().length > 0 &&
  s.length <= max &&
  !/[\u0000-\u001f]/.test(s);
export function relation(w: World, a: string, b: string) {
  return w.social?.relations.find(
    (r) => r.people.includes(a) && r.people.includes(b),
  );
}
export function resident(w: World, houseId: string, id: string) {
  return (
    w.life.houses.some((h) => h.id === houseId && h.owner === id) ||
    !!w.social?.relations.some(
      (r) => r.houseId === houseId && r.people.includes(id),
    )
  );
}
export function socialNear(a: Adventurer, b: Adventurer) {
  if (a.life?.indoors || b.life?.indoors)
    return (
      !!a.life?.indoors &&
      a.life.indoors === b.life?.indoors &&
      Math.abs((a.life.roomPos?.x || 0) - (b.life?.roomPos?.x || 0)) +
        Math.abs((a.life.roomPos?.y || 0) - (b.life?.roomPos?.y || 0)) <=
        5
    );
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) <= 4;
}
function available(p: Adventurer) {
  return (
    !p.spectator && !p.nativeScene && !p.duelId && !p.dungeonId && !p.life?.work
  );
}
function append(
  w: World,
  people: string[],
  lines: SocialLine[],
  now: number,
  quirky = false,
) {
  const s = (w.social ??= newSocial());
  s.talks.push({ id: `talk-${++s.sequence}`, at: now, people, lines, quirky });
  s.talks = s.talks.slice(-30);
  w.revision++;
}
function talk(w: World, a: Adventurer, b: Adventurer, now: number) {
  const s = (w.social ??= newSocial());
  let r = relation(w, a.id, b.id);
  if (r && now - r.lastTalk < 12000) return false;
  if (!r) {
    if (s.relations.length >= 780) return false;
    r = { people: [a.id, b.id], friendship: 0, talks: 0, lastTalk: 0 };
    s.relations.push(r);
  }
  const name = (p: Adventurer) => p.hero?.name || p.name;
  const phrase = (p: Adventurer, index: number) =>
    p.memory?.phrases[index % Math.max(1, p.memory.phrases.length)] ||
    "一緒に冒険しよう";
  const pa = phrase(a, r.talks),
    pb = phrase(b, r.talks + 1),
    quirky =
      (w.seed + r.talks + s.sequence) % 4 === 0 ||
      (b.memory?.personality === "quirky" && r.talks % 2 === 0);
  const variant = (r.talks + w.seed) % 3;
  const lines: SocialLine[] = [
    {
      speaker: a.id,
      text:
        variant === 0
          ? `${name(b)}、今日は「${pa}」って気分なんだ。`
          : variant === 1
            ? `休憩しよう、${name(b)}。「${pa}」の話がしたいな。`
            : `${name(b)}、「${pa}」って知ってる？ 最近のお気に入りなんだ。`,
    },
    {
      speaker: b.id,
      text: quirky
        ? `なるほど。「${pb}」を枕にしたら、よく眠れるかな？`
        : b.memory?.personality === "logical"
          ? `「${pa}」なら、まず一緒にできることを考えよう。僕は「${pb}」が好き。`
          : `いいね！「${pa}」を大切にしよう。私のお気に入りは「${pb}」。`,
    },
    {
      speaker: a.id,
      text: quirky
        ? "枕ではない気がするけど……その発想、面白いね。"
        : `「${pb}」も覚えたよ。また話そう！`,
    },
  ];
  lines[0].english =
    variant === 0
      ? `${name(b)}, today I'm thinking about “${pa}”.`
      : variant === 1
        ? `Let's take a break, ${name(b)}. I'd like to talk about “${pa}”.`
        : `${name(b)}, do you know “${pa}”? It's a recent favorite.`;
  lines[0].hiragana = `${name(b)}、きょうは「${pa}」のはなしがしたいな。`;
  lines[1].english = quirky
    ? `I see. Would “${pb}” make a comfortable pillow?`
    : b.memory?.personality === "logical"
      ? `Let's think about how we can enjoy “${pa}” together. I like “${pb}”.`
      : `That sounds great! Let's treasure “${pa}”. My favorite is “${pb}”.`;
  lines[1].hiragana = quirky
    ? `なるほど。「${pb}」をまくらにしたら、よくねむれるかな？`
    : `いいね！「${pa}」をたいせつにしよう。わたしのおきにいりは「${pb}」。`;
  lines[2].english = quirky
    ? "I don't think it's a pillow... but I like the way you think!"
    : `I'll remember “${pb}” too. Let's chat again!`;
  lines[2].hiragana = quirky
    ? "まくらではないきがするけど……そのはっそう、おもしろいね。"
    : `「${pb}」もおぼえたよ。またはなそう！`;
  r.talks++;
  r.friendship = Math.min(100, r.friendship + (quirky ? 3 : 5));
  r.lastTalk = now;
  append(w, [a.id, b.id], lines, now, quirky);
  return true;
}
export function applySocial(
  w: World,
  p: Adventurer,
  a: SocialAction,
  now: number,
) {
  const s = (w.social ??= newSocial());
  if (a.type === "hero-set") {
    if (p.nativeScene || p.duelId || (a.hero !== null && !validHero(a.hero)))
      return false;
    p.hero = a.hero || undefined;
    w.revision++;
    return true;
  }
  if (a.type === "social-memory") {
    const m = a.memory;
    if (
      !m ||
      !Array.isArray(m.phrases) ||
      m.phrases.length > 12 ||
      !m.phrases.every((v) => text(v, 48)) ||
      !["kind", "logical", "quirky"].includes(m.personality) ||
      typeof m.autoTalk !== "boolean" ||
      (m.conversationVoice !== undefined && !validConversationVoice(m.conversationVoice))
    )
      return false;
    p.memory = {
      phrases: [...new Set(m.phrases.map((v) => v.trim()))], personality: m.personality, autoTalk: m.autoTalk,
      ...(m.conversationVoice ? { conversationVoice: {
        enabled: m.conversationVoice.enabled, pitch: m.conversationVoice.pitch, rate: m.conversationVoice.rate,
        style: m.conversationVoice.style, timbre: m.conversationVoice.timbre,
      } } : {}),
    };
    w.revision++;
    return true;
  }
  if (!w.started || w.ended || !available(p)) return false;
  if (a.type === "social-player-talk") {
    if (!text(a.text, 80) || now - (p.lastPlayerTalk || 0) < 3000) return false;
    p.lastPlayerTalk = now;
    const phrase =
      p.memory?.phrases[s.sequence % Math.max(1, p.memory.phrases.length)] ||
      "一緒に冒険しよう";
    const reply = /好き|すき|favorite|like/i.test(a.text)
      ? `私のお気に入りは「${phrase}」。あなたの好きな言葉も教えてね。`
      : /疲|つかれ|休|tired/i.test(a.text)
        ? `少し休もう。「${phrase}」を思い浮かべて、深呼吸してみよう。`
        : /ありがとう|thank/i.test(a.text)
          ? `こちらこそ、ありがとう！「${phrase}」の気持ちを忘れないよ。`
          : /こんにちは|hello|おはよう/i.test(a.text)
            ? `こんにちは！ 今日も「${phrase}」で楽しく過ごそう。`
            : `うん、聞いているよ。「${phrase}」を思い出した。また話してね。`;
    append(
      w,
      [p.id],
      [
        { speaker: "player", text: a.text.trim() },
        {
          speaker: p.id,
          text: reply,
          english: /好き|すき|favorite|like/i.test(a.text)
            ? `My favorite is “${phrase}”. Tell me your favorite phrases too!`
            : /疲|つかれ|休|tired/i.test(a.text)
              ? `Let's rest and take a deep breath while thinking about “${phrase}”.`
              : `I'm listening. That reminds me of “${phrase}”. Let's talk again!`,
          hiragana: `うん、きいているよ。「${phrase}」をおもいだした。またはなしてね。`,
        },
      ],
      now,
    );
    return true;
  }
  if (a.type === "social-answer") {
    if (typeof a.accept !== "boolean") return false;
    const request = s.requests.find(
      (r) => r.id === a.requestId && r.to === p.id && r.expires > now,
    );
    if (!request) return false;
    const from = w.players[request.from],
      r = relation(w, p.id, request.from);
    s.requests = s.requests.filter((r) => r.id !== request.id);
    w.revision++;
    if (!a.accept) return true;
    if (!from || !available(from) || !r || !socialNear(p, from)) return false;
    if (request.kind === "cohabit") {
      const h = w.life.houses.find(
        (h) =>
          h.id === request.houseId && (h.owner === p.id || h.owner === from.id),
      );
      if (
        !h ||
        r.friendship < 20 ||
        s.relations.some(
          (v) =>
            v.houseId &&
            v !== r &&
            (v.people.includes(p.id) || v.people.includes(from.id)),
        )
      )
        return false;
      r.houseId = h.id;
      p.life!.homeId = h.id;
      from.life!.homeId = h.id;
    } else {
      if (
        r.friendship < 50 ||
        s.relations.some(
          (v) =>
            v.married &&
            v !== r &&
            (v.people.includes(p.id) || v.people.includes(from.id)),
        )
      )
        return false;
      if(w.town?.bonds.some(b=>b.marriedDay!==undefined&&(b.people.includes(p.id)||b.people.includes(from.id))))return false;
      r.married = true;
    }
    append(
      w,
      r.people,
      [
        {
          speaker: from.id,
          text:
            request.kind === "marry"
              ? "これからも一緒に歩いていこう。"
              : "今日から同じ家で暮らそう。",
        },
        {
          speaker: p.id,
          text: "よろしくね！",
          english: "Looking forward to it!",
          hiragana: "よろしくね！",
        },
      ],
      now,
    );
    return true;
  }
  const target = w.players["target" in a ? a.target : ""];
  if (!target || target.id === p.id || target.spectator) return false;
  if (a.type === "social-end") {
    if (!["cohabit", "marry"].includes(a.kind)) return false;
    const r = relation(w, p.id, target.id);
    if (!r) return false;
    if (a.kind === "marry") r.married = false;
    else {
      r.houseId = undefined;
      for (const id of r.people) {
        const q = w.players[id];
        if (q?.life)
          q.life.homeId = w.life.houses.find((h) => h.owner === id)?.id;
      }
    }
    s.requests = s.requests.filter(
      (v) => !(r.people.includes(v.from) && r.people.includes(v.to)),
    );
    w.revision++;
    return true;
  }
  if (!available(target) || !socialNear(p, target)) return false;
  if (a.type === "social-talk") return talk(w, p, target, now);
  if (a.type === "social-request") {
    const r = relation(w, p.id, target.id);
    if (
      !r ||
      s.requests.some(
        (v) =>
          v.from === p.id ||
          v.to === p.id ||
          v.from === target.id ||
          v.to === target.id,
      ) ||
      s.requests.length >= 40
    )
      return false;
    if (a.kind === "cohabit") {
      if (
        r.friendship < 20 ||
        r.houseId ||
        !w.life.houses.some(
          (h) =>
            h.id === a.houseId && (h.owner === p.id || h.owner === target.id),
        )
      )
        return false;
    } else if (a.kind === "marry") {
      if(w.town?.bonds.some(b=>b.marriedDay!==undefined&&(b.people.includes(p.id)||b.people.includes(target.id))))return false;
      if (
        r.friendship < 50 ||
        r.married ||
        s.relations.some(
          (v) =>
            v.married &&
            (v.people.includes(p.id) || v.people.includes(target.id)),
        )
      )
        return false;
    } else return false;
    s.requests.push({
      id: `request-${++s.sequence}`,
      from: p.id,
      to: target.id,
      kind: a.kind,
      houseId: a.kind === "cohabit" ? a.houseId : undefined,
      expires: now + 60000,
    });
    w.revision++;
    return true;
  }
  return false;
}
export function advanceSocial(w: World, now: number) {
  const s = (w.social ??= newSocial());
  const kept = s.requests.filter(
    (r) => r.expires > now && w.players[r.from] && w.players[r.to],
  );
  if (kept.length !== s.requests.length) {
    s.requests = kept;
    w.revision++;
  }
  if (!w.started || w.ended || now < s.nextTalk) return;
  s.nextTalk = now + 16000;
  const people = Object.values(w.players).filter(
    (p) => available(p) && p.memory?.autoTalk,
  );
  const pairs: Array<[Adventurer, Adventurer]> = [];
  for (let i = 0; i < people.length; i++)
    for (let j = i + 1; j < people.length; j++)
      if (socialNear(people[i], people[j])) pairs.push([people[i], people[j]]);
  const offset = s.sequence % Math.max(1, pairs.length);
  for (let i = 0; i < pairs.length; i++) {
    const [a, b] = pairs[(i + offset) % pairs.length];
    if (talk(w, a, b, now)) return;
  }
}

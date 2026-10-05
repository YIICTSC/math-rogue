import type { World, Adventurer } from "../engine";
import type { TownPerson, TownNews } from "../town/model";
import type { Copy } from "../town/catalog";
import { c, dishById } from "../town/catalog";
import { GIFT_REPLIES } from "./catalog";
export interface FoodGift {
  id: string;
  from: string;
  to: string;
  dish: string;
  perfect: boolean;
  message: string;
  wrap: number;
  day: number;
  expires: number;
  status: "pending" | "accepted" | "declined" | "returned";
}
export interface CommunityState {
  daily?: Record<string, { day: number; count: number }>;
  gifts: FoodGift[];
  sequence: number;
  bonusDays: Record<string, number>;
  sent: Record<string, number>;
  received: Record<string, number>;
}
export type CommunityAction =
  | {
      type: "town-food-gift";
      target: string;
      dish: string;
      message: string;
      wrap: number;
    }
  | { type: "town-food-answer"; id: string; accept: boolean };
export const communityOf = (w: World) =>
  (w.town!.community ??= {
    gifts: [],
    sequence: 0,
    bonusDays: {},
    sent: {},
    received: {},
  });
export function returnGift(w: World, g: FoodGift) {
  const person = w.town?.people[g.from];
  if (person) {
    const stack = (person.foods[g.dish] ??= { normal: 0, perfect: 0 });
    stack[g.perfect ? "perfect" : "normal"]++;
  }
  g.status = "returned";
}
export function advanceCommunity(w: World) {
  if (!w.town?.community) return;
  for (const g of w.town.community.gifts)
    if (g.status === "pending" && w.life.time >= g.expires) {
      returnGift(w, g);
      w.revision++;
    }
}
interface Helpers {
  person: (id: string) => TownPerson | undefined;
  reachable: (id: string) => boolean;
  bond: (a: string, b: string, n: number) => unknown;
  say: (people: string[], lines: Copy[]) => unknown;
  event: (
    people: string[],
    headline: Copy,
    text: Copy,
    picture?: TownNews["picture"],
  ) => unknown;
}
export function applyCommunity(
  w: World,
  p: Adventurer,
  a: CommunityAction,
  h: Helpers,
) {
  const s = communityOf(w),
    me = h.person(p.id)!;
  let gift: FoodGift | undefined;
  if (a.type === "town-food-gift") {
    const target = h.person(a.target),
      dish = dishById(a.dish);
    if (
      !target ||
      !dish ||
      a.target === p.id ||
      !h.reachable(a.target) ||
      typeof a.message !== "string" ||
      a.message.length > 80 ||
      /[\u0000-\u001f]/.test(a.message) ||
      !Number.isInteger(a.wrap) ||
      a.wrap < 0 ||
      a.wrap > 5
    )
      return false;
    if (
      (s.daily?.[p.id]?.day === w.town!.day ? s.daily[p.id].count : 0) >= 8 ||
      s.gifts.filter((g) => g.to === a.target && g.status === "pending")
        .length >= 12
    )
      return false;
    if (s.gifts.filter((g) => g.status === "pending").length >= 120)
      return false;
    const stack = me.foods[a.dish];
    if (!stack || stack.perfect + stack.normal < 1) return false;
    const perfect = stack.perfect > 0;
    stack[perfect ? "perfect" : "normal"]--;
    gift = {
      id: `food-gift-${++s.sequence}`,
      from: p.id,
      to: a.target,
      dish: a.dish,
      perfect,
      message: a.message.trim(),
      wrap: a.wrap,
      day: w.town!.day,
      expires: w.life.time + 600,
      status: "pending",
    };
    s.gifts.push(gift);
    s.gifts = [
      ...s.gifts
        .filter((g) => g.status !== "pending" && w.town!.day - g.day < 28)
        .slice(-40),
      ...s.gifts.filter((g) => g.status === "pending"),
    ];
    s.daily ??= {};
    const daily = s.daily[p.id];
    s.daily[p.id] = {
      day: w.town!.day,
      count: (daily?.day === w.town!.day ? daily.count : 0) + 1,
    };
    s.sent[p.id] = (s.sent[p.id] || 0) + 1;
    if (w.players[a.target]) {
      p.message = "料理の贈り物を届けました。";
      w.revision++;
      return true;
    }
  } else {
    if (typeof a.accept !== "boolean") return false;
    gift = s.gifts.find(
      (g) =>
        g.id === a.id &&
        g.to === p.id &&
        g.status === "pending" &&
        g.expires > w.life.time,
    );
    if (!gift) return false;
    if (!a.accept) {
      returnGift(w, gift);
      p.message = "贈り物を返しました。";
      w.revision++;
      return true;
    }
  }
  const target = h.person(gift.to);
  if (!target) return false;
  const dish = dishById(gift.dish)!;
  const stack = (target.foods[gift.dish] ??= { normal: 0, perfect: 0 });
  stack[gift.perfect ? "perfect" : "normal"]++;
  const key = `${gift.from}:${gift.to}`,
    taste = dish.tags.includes(target.favorite)
      ? 2
      : dish.tags.includes(target.disliked)
        ? -1
        : 0,
    birthday = target.birthday === w.town!.day % 28;
  if (s.bonusDays[key] !== w.town!.day) {
    h.bond(
      gift.from,
      gift.to,
      Math.max(
        2,
        4 +
          Math.max(0, taste) * 2 +
          (gift.perfect ? 2 : 0) +
          (birthday ? 3 : 0),
      ),
    );
    target.happiness = Math.min(
      100,
      target.happiness + 6 + (gift.perfect ? 3 : 0),
    );
    s.bonusDays[key] = w.town!.day;
  }
  gift.status = "accepted";
  s.received[gift.to] = (s.received[gift.to] || 0) + 1;
  const response = birthday
    ? c(
        "誕生日を覚えていてくれたんだね！大切にいただくよ。",
        "You remembered my birthday! I will treasure this meal.",
        "たんじょうびをおぼえていてくれたんだね！たいせつにいただくよ。",
      )
    : taste === 2
      ? c(
          "大好きな味を覚えてくれて、ありがとう！",
          "You remembered my favorite flavor. Thank you!",
          "だいすきなあじをおぼえてくれて、ありがとう！",
        )
      : taste < 0
        ? c(
            "少し苦手な味だけど、その気持ちはうれしいな。",
            "The flavor is not quite my taste, but your kindness means a lot.",
            "すこしにがてなあじだけど、そのきもちはうれしいな。",
          )
        : GIFT_REPLIES[
            (target.personality + gift.day + gift.wrap) % GIFT_REPLIES.length
          ];
  target.tastes[gift.dish] = taste;
  h.say(
    [gift.from, gift.to],
    [
      c(
        `${dish.name.ja}を作ったよ。よかったらどうぞ！`,
        `I made ${dish.name.en}. This is for you!`,
        `${dish.name.hi}をつくったよ。よかったらどうぞ！`,
      ),
      response,
    ],
  );
  h.event(
    [gift.from, gift.to],
    birthday
      ? c("誕生日の贈り物", "A birthday gift", "たんじょうびのおくりもの")
      : c(
          "心のこもった料理便",
          "A thoughtful food parcel",
          "こころのこもったりょうりびん",
        ),
    response,
    { kind: "food", id: gift.dish },
  );
  p.message = "料理の贈り物が思い出になりました。";
  w.revision++;
  return true;
}

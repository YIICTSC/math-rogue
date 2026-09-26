import { NodeType, type MapNode, type Player } from "../types";
import { type NativeProfile, type Site, type World } from "./engine";

export interface RpgSnapshot {
  world: World;
  selfId: string;
}
export interface RpgEncounter {
  token: string;
  site: Site;
  outcome: "complete" | "victory" | "defeat";
  entered: boolean;
  lastHp?: number;
  damage: number;
  sequence: number;
}
export function nativeProfile(player: Player): NativeProfile {
  return {
    hp: player.currentHp,
    maxHp: player.maxHp,
    gold: player.gold,
    character: player.id || "WARRIOR",
    image: player.imageData || "",
    deckSize: player.deck.length,
  };
}
export function siteNode(site: Site, battles: number): MapNode {
  const type =
    site.kind === "town" || site.kind === "rest"
      ? NodeType.REST
      : site.kind === "event"
        ? NodeType.EVENT
        : site.kind === "treasure"
          ? NodeType.TREASURE
          : site.kind === "guardian" || site.kind === "boss"
            ? NodeType.BOSS
            : NodeType.COMBAT;
  return {
    id: `rpg-${site.id}-${battles}`,
    x: 0,
    y: type === NodeType.BOSS ? 14 : Math.min(13, battles),
    type,
    nextNodes: [],
    completed: false,
  };
}

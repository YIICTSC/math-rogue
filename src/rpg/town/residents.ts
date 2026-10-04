import type { World } from "../engine";
import type { CustomHero } from "../customHero";
import type { ConversationVoice } from "../conversationVoice";
import { RESIDENTS, c } from "./catalog";
export interface CreatedResident {
  id: string;
  owner: string;
  name: string;
  portrait: string;
  personality: number;
  birthday: number;
  x: number;
  y: number;
  hero?: CustomHero;
  voice: ConversationVoice;
}
export function residentsOf(w: World) {
  return [
    ...RESIDENTS,
    ...(w.town?.customResidents || []).map((r) => ({
      id: r.id,
      name: c(r.name, r.name, r.name),
      portrait: r.portrait,
      personality: r.personality,
      biome: "meadow" as const,
    })),
  ];
}

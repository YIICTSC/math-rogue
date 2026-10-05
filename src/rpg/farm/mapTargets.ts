import type { World, Adventurer } from "../engine";
export type FarmQuickAction = {
  type: "farm-quick";
  kind: "plot" | "animal" | "pet";
  id: string;
  operation: string;
  crop?: string;
  trick?: string;
};
export interface FarmMapTarget {
  kind: "plot" | "animal" | "pet";
  id: string;
  x: number;
  y: number;
  distance: number;
}
/** Shared with rendering and the server: targets are cells, not DOM hit areas. */
export function farmMapTargets(w: World, p: Adventurer): FarmMapTarget[] {
  const f = w.farm?.people[p.id];
  if (!f || p.life?.indoors || p.spectator) return [];
  const targets: Omit<FarmMapTarget, "distance">[] = [];
  if (f.x !== undefined && f.y !== undefined) {
    for (const plot of f.plots)
      targets.push({
        kind: "plot",
        id: String(plot.slot),
        x: f.x + (plot.slot % 6),
        y: f.y + 1 + Math.floor(plot.slot / 6),
      });
    f.animals.forEach((a, i) =>
      targets.push({
        kind: "animal",
        id: a.id,
        x: f.x! + (i % 6),
        y: f.y! + (i < 6 ? 0 : 5),
      }),
    );
  }
  f.pets.forEach((pet, i) => {
    if (pet.awayUntil) return;
    if (f.activePet === pet.id)
      targets.push({ kind: "pet", id: pet.id, x: p.x + 1, y: p.y });
    else if (f.x !== undefined && f.y !== undefined)
      targets.push({ kind: "pet", id: pet.id, x: f.x + i, y: f.y + 6 });
  });
  return targets
    .map((t) => ({ ...t, distance: Math.abs(t.x - p.x) + Math.abs(t.y - p.y) }))
    .filter((t) => t.distance <= 1)
    .sort(
      (a, b) =>
        a.distance - b.distance ||
        ["animal", "pet", "plot"].indexOf(a.kind) -
          ["animal", "pet", "plot"].indexOf(b.kind),
    );
}

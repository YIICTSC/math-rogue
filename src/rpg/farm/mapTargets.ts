import {plotPosition} from './land';
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
    for (const plot of f.plots){const xy=plotPosition(f,plot);if(xy)targets.push({kind:'plot',id:String(plot.slot),...xy});}
    f.animals.forEach((a, i) =>
      targets.push({
        kind: "animal",
        id: a.id,
        x: f.x! + (i % 6),
        y: f.y! + (i < 6 ? 0 : 5),
      }),
    );
  }
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

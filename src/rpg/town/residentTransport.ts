import type { World } from "../engine";
import type { CreatedResident } from "./residents";
export type ResidentAssets = Pick<CreatedResident, "id" | "portrait" | "hero">;
export function changedResidentAssets(
  world: World,
  cache: Map<string, CreatedResident>,
) {
  const changed: ResidentAssets[] = [];
  for (const r of world.town?.customResidents || [])
    if (cache.get(r.id) !== r) {
      changed.push({ id: r.id, portrait: r.portrait, hero: r.hero });
      cache.set(r.id, r);
    }
  return changed;
}
export function stripResidentAssets(state: Omit<World, "tiles">) {
  return {
    ...state,
    ...(state.town
      ? {
          town: {
            ...state.town,
            customResidents: state.town.customResidents?.map((r) => {
              const { hero, portrait, ...rest } = r;
              return rest as CreatedResident;
            }),
          },
        }
      : {}),
  };
}

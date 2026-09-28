import type { VisualThemeId } from "../data/visualThemes";
import type { Site } from "./engine";

export function getRpgSiteDisplayName(site: Site, visualTheme: VisualThemeId) {
  if (site.kind !== "enemy") return site.name;
  return site.enemyNamesByTheme?.[visualTheme] || site.name;
}

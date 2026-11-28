import type { VisualThemeId } from "../data/visualThemes";
import type { Site } from "./engine";
import { REALMS } from './realmTerrain';

export function getRpgSiteDisplayName(site: Site, visualTheme: VisualThemeId, language='JAPANESE') {
  if(site.dimension){
    const realm=REALMS[site.dimension], name=site.dimensionIndex?realm.sentries[site.dimensionIndex-1]:realm.guardian;
    return name?.[language==='ENGLISH'?1:language==='HIRAGANA'?2:0]??site.name;
  }
  if (site.kind !== "enemy") return site.name;
  return site.enemyNamesByTheme?.[visualTheme] || site.name;
}

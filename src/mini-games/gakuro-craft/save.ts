import {MAP_TILES} from './map';
import {expandLegacyIsland} from './mapMigration';
import {BUILDINGS,MATERIALS,type World,type Player} from './engine';
import {avatarOf} from './avatar';
import {migrateProgress} from './progression';
export const SAVE_KEY = 'gakuro-craft-island-v1';
export type Saved = { version: 1; world: World; owner: string; player: Player };
export function loadIsland(serialized?: string): Saved | null {
  try {
    const raw = serialized === undefined ? localStorage.getItem(SAVE_KEY) : serialized; if (!raw || raw.length > 8000000) return null;
    const s = JSON.parse(raw) as Saved, w = s.world;
    if(s.version!==1||!w||!s.player||!Number.isInteger(w.seed)||!Number.isInteger(w.revision)||!Array.isArray(w.tiles)||!w.tiles.every(t=>t&&Array.isArray(t.blocks)))return null;
    if(!expandLegacyIsland(s))return null;
    if(w){w.games={};w.homeViews={};w.villageLevel=Number.isInteger(w.villageLevel)&&w.villageLevel>=0&&w.villageLevel<=4?w.villageLevel:0;w.builtSites=Array.isArray(w.builtSites)?[...new Set(w.builtSites.filter(i=>Number.isInteger(i)&&i>=0&&i<MAP_TILES))]:w.tiles?.flatMap((t,i)=>t.blocks?.length?[i]:[])||[];w.residents=w.residents&&typeof w.residents==='object'&&!Array.isArray(w.residents)?w.residents:{};for(const [key,r]of Object.entries(w.residents)){if(!r||!r.bag||!MATERIALS.every(k=>Number.isFinite(r.bag[k])&&r.bag[k]>=0)||!Number.isFinite(r.coins)||r.coins<0){delete w.residents[key];continue;}r.progress=migrateProgress(r.progress);r.energy=Number.isFinite(r.energy)?Math.max(0,Math.min(100,r.energy)):100;}}
    if(s.player?.bag){s.player.progress=migrateProgress(s.player.progress);for(const k of MATERIALS.slice(10))if(s.player.bag[k]===undefined)s.player.bag[k]=0;s.player.avatar=avatarOf(s.player.avatar,s.player.color);s.player.coins=Number.isFinite(s.player.coins)?Math.max(0,s.player.coins):0;s.player.buffUntil=Number.isFinite(s.player.buffUntil)?s.player.buffUntil:0;}
    if (s.version !== 1 || !w || !Number.isFinite(w.time) || w.time < 0 || !Number.isInteger(w.seed) || !Number.isInteger(w.revision) || !Array.isArray(w.tiles) || w.tiles.length !== MAP_TILES || !s.player || !MATERIALS.every(k => Number.isFinite(s.player.bag[k]) && s.player.bag[k] >= 0)) return null;
    if (!w.tiles.every(t => ['grass', 'sand', 'water'].includes(t.ground) && [null, 'tree', 'rock'].includes(t.nature) && Array.isArray(t.blocks) && t.blocks.length <= 4 && t.blocks.every(b => BUILDINGS.includes(b)) && (t.crop === null || Number.isFinite(t.crop)) && Number.isFinite(t.regrow) && Number.isInteger(t.revision))) return null;
    return s;
  } catch { return null; }
}

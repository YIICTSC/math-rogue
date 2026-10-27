import type {BasketView,BasketWorld} from '../mini-games/basketball/types';
import type{DodgeWorld,DodgeView}from'../mini-games/dodgeball/types';
import type {TennisView,TennisWorld} from '../mini-games/tennis/types';
import type { GolfView, GolfWorld } from '../mini-games/gakuro-golf/engine';
import type { Race } from '../mini-games/gakuro-kart/engine';
import type { OnlineWorld } from '../mini-games/gakurogear/onlineEngine';
import type { World } from '../rpg/engine';

export type ResultGame = 'rpg' | 'vr' | 'kart' | 'golf' | 'tennis' | 'dodgeball' | 'basketball';
export interface SessionResult { game: ResultGame; columns: string[]; rows: { id: string; name: string; rank: number; values: string[] }[] }
export function sessionResult(game:'basketball',world:BasketWorld|BasketView):SessionResult|null;
export function sessionResult(game:'dodgeball',world:DodgeWorld|DodgeView):SessionResult|null;
export function sessionResult(game: 'tennis', world:TennisWorld|TennisView):SessionResult|null;
export function sessionResult(game: 'golf', world: GolfWorld | GolfView): SessionResult | null;
export function sessionResult(game: 'kart', world: Race): SessionResult | null;
export function sessionResult(game: 'vr', world: OnlineWorld): SessionResult | null;
export function sessionResult(game: 'rpg', world: World): SessionResult | null;
export function sessionResult(game: ResultGame, world: any): SessionResult | null {
  if (!world || (game === 'rpg' ? !world.started : world.phase === 'lobby')) return null;
  const players = (Array.isArray(world.players) ? world.players : Object.values(world.players)) as any[];
  const entries = players.filter(p => !p.spectator).map(p => {
    if(game==='tennis'||game==='dodgeball'||game==='basketball'){const teams=world.teams.filter((t:any)=>t.members.includes(p.id)),bracket=world.bracket||world.matches,wins=bracket.filter((m:any)=>m.phase==='finished'&&teams.some((t:any)=>t.id===m.winner)).length,champion=teams.some((t:any)=>t.id===world.champion);return {p,scores:[-Number(champion),-wins],values:[String(wins),String(p.correct),champion?'CHAMPION':p.connected?'—':'OUT']};}
    if (game === 'golf') {
      const sum = p.scores.reduce((a: number, b: number) => a + b, 0);
      return { p, scores: [-p.scores.length, sum], values: [String(p.scores.length), String(sum), String(p.strokes), String(p.totalCorrect)] };
    }
    if (game === 'kart') return { p, scores: p.finish ? [0, p.finish] : [1, -p.distance], values: [p.finish ? `${p.finish.toFixed(2)} s` : '—', `${Math.max(0, p.distance).toFixed(0)} m`, String(p.quizCorrectTotal)] };
    if (game === 'vr') {
      const collected = p.run.collected.filter(Boolean).length, clear = p.run.status === 'clear';
      return { p, scores: world.mode === 'coop' ? [-Number(clear), -collected] : [Number(p.out), p.hits], values: [world.mode === 'coop' ? `${collected} / ${p.run.collected.length}` : `${p.stats.hits} / ${p.hits}`, `${p.stats.assists} / ${p.stats.rescues}`, String(p.stats.correct), clear ? 'CLEAR' : p.out ? 'OUT' : '—'] };
    }
    const primary = world.gameMode === 'BATTLE_ROYALE' ? p.rivalKills : p.totalDamage;
    return { p, scores: [-primary], values: [String(primary), String(p.correctAnswers), String(p.completedBattles)] };
  });
  const compare = (a: typeof entries[number], b: typeof entries[number]) => { for (let i = 0; i < a.scores.length; i++) if (a.scores[i] !== b.scores[i]) return a.scores[i] - b.scores[i]; return 0; };
  entries.sort((a, b) => compare(a, b) || a.p.id.localeCompare(b.p.id));
  const columns = (game==='tennis'||game==='dodgeball'||game==='basketball')?['勝利 / Wins','正解 / Correct','状態 / Status']:game === 'golf' ? ['完了ホール', '確定打数', '現在ホール打数', '正解数'] : game === 'kart' ? ['タイム', '走行距離', '正解数'] : game === 'vr' ? [world.mode === 'coop' ? '回収数' : '命中 / 被弾', '支援 / 救助', '正解数', '状態'] : [world.gameMode === 'BATTLE_ROYALE' ? '撃破数' : '累計ダメージ', '正解数', '戦闘数'];
  return { game, columns, rows: entries.map((e, i) => ({ id: e.p.id, name: e.p.name, rank: 1 + entries.slice(0, i).filter(previous => compare(previous, e) < 0).length, values: e.values })) };
}
export function validSessionResult(value: unknown, game: ResultGame): value is SessionResult {
  const r = value as SessionResult;
  return !!r && r.game === game && Array.isArray(r.columns) && r.columns.length > 0 && r.columns.length <= 4 && r.columns.every(c => typeof c === 'string' && c.length <= 40) && Array.isArray(r.rows) && r.rows.length <= 40 && r.rows.every(p => p && typeof p.id === 'string' && p.id.length <= 100 && typeof p.name === 'string' && p.name.length <= 40 && Number.isInteger(p.rank) && p.rank >= 1 && p.rank <= 40 && Array.isArray(p.values) && p.values.length === r.columns.length && p.values.every(v => typeof v === 'string' && v.length <= 80));
}

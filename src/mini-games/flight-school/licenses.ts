import { MISSIONS } from './combat';
import { AIRPORTS } from './courses';
import { FLIGHT_COMBAT_LOG_KEY, FLIGHT_ROUTE_LOG_KEY } from './logbook';
import { ROUTES } from './routes';

function scores(key: string): Record<string, unknown> {
  try {
    const data = JSON.parse(localStorage.getItem(key) || '{}');
    return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  } catch {
    return {};
  }
}
const passed = (score: unknown) =>
  typeof score === 'number' && Number.isInteger(score) && score >= 0 && score <= 100;
export function readLicenses() {
  const routes = scores(FLIGHT_ROUTE_LOG_KEY),
    combat = scores(FLIGHT_COMBAT_LOG_KEY);
  const legs = ROUTES.flatMap(({ ports: [a, b] }) => [
    a.code + '-' + b.code,
    b.code + '-' + a.code,
  ]);
  const charts = [...legs, ...AIRPORTS.map((p) => p.code)];
  const route = legs.filter((id) => passed(routes[id])).length;
  const sorties = MISSIONS.filter((m) =>
    charts.some((id) => passed(combat[id + '/' + m.id + '/exam'])),
  ).length;
  return { route, sorties, routeTotal: legs.length, combatTotal: MISSIONS.length };
}
export const longHaulRequirement = (key: string) =>
  key === 'hnd-kix' ? 4 : key === 'hnd-mmj' ? 2 : 0;

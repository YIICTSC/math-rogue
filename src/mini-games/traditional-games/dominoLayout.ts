import { dominoFaces, type DominoLine } from './domino';

export type DominoPoint = { x: number; y: number };
export type DominoNode = DominoPoint & {
  key: string;
  tile: number;
  angle: number;
  flow: number;
  width: number;
  height: number;
};
export type DominoEnd = DominoPoint & { line: number; pip: number };
export type DominoLayout = {
  nodes: DominoNode[];
  ends: DominoEnd[];
  labels: (DominoPoint & { line: number })[];
  engine: boolean;
  bounds: { x: number; y: number; width: number; height: number };
};
const L = 64,
  S = 32,
  GAP = 0.8;
const vector = (angle: number) => ({ x: Math.cos(angle), y: Math.sin(angle) });
const offset = (p: DominoPoint, angle: number, length: number) => {
  const d = vector(angle);
  return { x: p.x + d.x * length, y: p.y + d.y * length };
};
export function dominoCorners(n: DominoNode): DominoPoint[] {
  const a = vector(n.angle),
    b = vector(n.angle + Math.PI / 2);
  return [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ].map(([x, y]) => ({
    x: n.x + (x * a.x * n.width) / 2 + (y * b.x * n.height) / 2,
    y: n.y + (x * a.y * n.width) / 2 + (y * b.y * n.height) / 2,
  }));
}
export function dominoOverlap(a: DominoNode, b: DominoNode): boolean {
  const dx = b.x - a.x,
    dy = b.y - a.y;
  for (const axis of [a.angle, a.angle + Math.PI / 2, b.angle, b.angle + Math.PI / 2]) {
    const u = vector(axis);
    const ra =
      (a.width / 2) * Math.abs(Math.cos(a.angle - axis)) +
      (a.height / 2) * Math.abs(Math.sin(a.angle - axis));
    const rb =
      (b.width / 2) * Math.abs(Math.cos(b.angle - axis)) +
      (b.height / 2) * Math.abs(Math.sin(b.angle - axis));
    if (Math.abs(dx * u.x + dy * u.y) >= ra + rb - 0.1) return false;
  }
  return true;
}
/** The next tile touches the exposed half, including at a right-angle turn. */
function contact(parent: DominoNode, flow: number): DominoPoint {
  const [a, b] = dominoFaces(parent.tile);
  const center =
    a === b || Math.cos(flow - parent.flow) > 0.999 ? parent : offset(parent, parent.flow, S / 2);
  const wide = a === b ? L / 2 : Math.cos(flow - parent.flow) > 0.999 ? L / 2 : S / 2;
  const d = vector(flow),
    u = vector(parent.angle),
    v = vector(parent.angle + Math.PI / 2);
  const sign = (n: number) => (Math.abs(n) < 1e-7 ? 0 : Math.sign(n));
  const x = sign(d.x * u.x + d.y * u.y) * wide,
    y = (sign(d.x * v.x + d.y * v.y) * S) / 2;
  return { x: center.x + u.x * x + v.x * y, y: center.y + u.y * x + v.y * y };
}
type Task = {
  key: string;
  tile: number;
  line: number;
  index: number;
  parent: string;
  branch: number;
  root: boolean;
};
export function layoutDomino(hub: number | null, lines: readonly DominoLine[]): DominoLayout {
  const result: DominoLayout = {
    nodes: [],
    ends: [],
    labels: [],
    engine: lines.filter((l) => l.parent < 0).length > 4,
    bounds: { x: -180, y: -90, width: 360, height: 180 },
  };
  if (hub === null) return result;
  const doubleHub = dominoFaces(hub)[0] === dominoFaces(hub)[1];
  const root: DominoNode = {
    key: 'hub',
    tile: hub,
    x: 0,
    y: 0,
    angle: doubleHub ? Math.PI / 2 : 0,
    flow: 0,
    width: L,
    height: S,
  };
  const roots = lines.map((l, i) => (l.parent < 0 ? i : -1)).filter((i) => i >= 0);
  const rootAngle = (line: number) =>
    result.engine
      ? (roots.indexOf(line) * 2 * Math.PI) / roots.length - Math.PI / 2
      : [Math.PI, 0, -Math.PI / 2, Math.PI / 2][roots.indexOf(line)];
  const tasks: Task[] = roots
    .filter((i) => lines[i].tiles.length)
    .map((i) => ({
      key: i + ':0',
      tile: lines[i].tiles[0],
      line: i,
      index: 0,
      parent: 'hub',
      branch: -1,
      root: true,
    }));
  // Breadth-first placement reserves the sockets of each double before its arms grow.
  for (let q = 0; q < tasks.length; q++) {
    const t = tasks[q],
      line = lines[t.line];
    if (t.index + 1 < line.tiles.length)
      tasks.push({
        ...t,
        key: t.line + ':' + (t.index + 1),
        tile: line.tiles[t.index + 1],
        index: t.index + 1,
        parent: t.key,
        branch: -1,
        root: false,
      });
    lines
      .filter((l) => l.parent === t.line && l.anchor === t.index)
      .forEach((l, branch) => {
        if (!l.tiles.length) return;
        const i = lines.indexOf(l);
        tasks.push({
          key: i + ':0',
          tile: l.tiles[0],
          line: i,
          index: 0,
          parent: t.key,
          branch,
          root: false,
        });
      });
  }
  const nodes = new Map<string, DominoNode>([['hub', root]]);
  const size = Math.max(180, Math.sqrt(tasks.length + 1) * 38);
  let attempts = 0;
  function place(index: number, spacious: boolean, free = false): boolean {
    if (index === tasks.length) return true;
    if (++attempts > 60000) return false;
    const task = tasks[index],
      parent = nodes.get(task.parent)!;
    const doubles = dominoFaces(task.tile)[0] === dominoFaces(task.tile)[1];
    const parentHasBranches = lines.some(
      (l) =>
        l.parent === Number(parent.key.split(':')[0]) &&
        l.anchor === Number(parent.key.split(':')[1]),
    );
    let flows = task.root
      ? [rootAngle(task.line)]
      : task.branch >= 0
        ? spacious
          ? (free
              ? [0, -1, 1, -2, 2, -3, 3, -4, 4].map((n) => (n * Math.PI) / 12)
              : [0, -Math.PI / 6, Math.PI / 6]
            ).map((bend) => parent.flow + ((task.branch === 0 ? -1 : 1) * Math.PI) / 2 + bend)
          : [parent.flow + ((task.branch === 0 ? -1 : 1) * Math.PI) / 2]
        : parentHasBranches
          ? [parent.flow]
          : [
              parent.flow,
              parent.flow - Math.PI / 2,
              parent.flow + Math.PI / 2,
              ...(spacious
                ? free
                  ? [-1, 1, -2, 2, -3, 3, -4, 4, -5, 5].map((n) => parent.flow + (n * Math.PI) / 12)
                  : [parent.flow - Math.PI / 4, parent.flow + Math.PI / 4]
                : []),
            ];
    const candidates = flows
      .map((flow) => {
        const port = task.root
          ? result.engine
            ? offset(root, flow, 104)
            : doubleHub
              ? contact(root, flow)
              : offset(root, flow, L / 2)
          : contact(parent, flow);
        const point = offset(port, flow, (doubles ? S : L) / 2 + GAP);
        const node: DominoNode = {
          ...point,
          key: task.key,
          tile: task.tile,
          angle: flow + (doubles ? Math.PI / 2 : 0),
          flow,
          width: L,
          height: S,
        };
        const outside =
          Math.max(0, Math.abs(point.x) - size) + Math.max(0, Math.abs(point.y) - size * 0.72);
        return {
          node,
          score:
            outside * 10 +
            (Math.cos(flow - parent.flow) > 0.5 ? 0 : spacious ? 500 : 12) +
            Math.hypot(point.x, point.y) * 0.02,
        };
      })
      .sort((a, b) => a.score - b.score);
    for (const { node } of candidates) {
      if ([...nodes.values()].some((other) => dominoOverlap(node, other))) continue;
      nodes.set(task.key, node);
      if (place(index + 1, spacious, free)) return true;
      nodes.delete(task.key);
    }
    return false;
  }
  if (!place(0, false)) {
    nodes.clear();
    nodes.set('hub', root);
    attempts = 0;
    if (!place(0, true)) {
      nodes.clear();
      nodes.set('hub', root);
      attempts = 0;
      if (!place(0, true, true)) throw new Error('Cannot arrange domino arms without overlap');
    }
  }
  result.nodes = [...nodes.values()];
  for (const [i, line] of lines.entries()) {
    const last = nodes.get(i + ':' + (line.tiles.length - 1));
    const anchor = last ?? (line.parent >= 0 ? nodes.get(line.parent + ':' + line.anchor)! : root);
    let flow =
      last?.flow ??
      (line.parent >= 0
        ? anchor.flow +
          ((lines
            .filter((l) => l.parent === line.parent && l.anchor === line.anchor)
            .indexOf(line) === 0
            ? -1
            : 1) *
            Math.PI) /
            2
        : rootAngle(i));
    const port =
      !last && line.parent < 0
        ? result.engine
          ? offset(root, flow, 104)
          : doubleHub
            ? contact(root, flow)
            : offset(root, flow, L / 2)
        : contact(anchor, flow);
    const point = offset(port, flow, 23);
    result.ends.push({ ...point, line: i, pip: line.pip });
    if (result.engine && line.parent < 0)
      result.labels.push({ ...offset(root, rootAngle(i), 72), line: i });
  }
  const corners = result.nodes.flatMap(dominoCorners);
  const points = [...corners, ...result.ends];
  if (result.engine) points.push({ x: -110, y: -110 }, { x: 110, y: 110 });
  const xs = points.map((p) => p.x),
    ys = points.map((p) => p.y);
  const x = Math.min(...xs) - 30,
    y = Math.min(...ys) - 30;
  result.bounds = { x, y, width: Math.max(...xs) + 30 - x, height: Math.max(...ys) + 30 - y };
  return result;
}

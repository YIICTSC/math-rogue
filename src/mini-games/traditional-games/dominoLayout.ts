import { dominoFaces, dominoTile, type DominoLine } from './domino';

export type DominoPoint = { x: number; y: number };
export type DominoNode = DominoPoint & { key: string; tile: number; direction: number };
export type DominoEnd = DominoPoint & { line: number; pip: number };
export type DominoLayout = {
  nodes: DominoNode[];
  links: string[];
  ends: DominoEnd[];
  labels: (DominoPoint & { line: number })[];
  bounds: { x: number; y: number; width: number; height: number };
};
const W = 76,
  H = 38,
  STEP = 88,
  ROW = 64;
const reverse = (tile: number) => {
  const [a, b] = dominoFaces(tile);
  return dominoTile(b, a);
};
function snake(index: number, columns: number, x: number, y: number) {
  const row = Math.floor(index / columns),
    column = index % columns;
  return {
    x: x + (row % 2 ? columns - 1 - column : column) * STEP,
    y: y + row * ROW,
    direction: row % 2 ? -1 : 1,
  };
}
function edge(n: DominoNode, outgoing: boolean): DominoPoint {
  return { x: n.x + ((outgoing ? 1 : -1) * n.direction * W) / 2, y: n.y };
}
function join(a: DominoPoint, b: DominoPoint, direction: number) {
  if (a.y === b.y) return `M${a.x},${a.y}H${b.x}`;
  const x = a.x + direction * 6;
  return `M${a.x},${a.y}H${x}V${b.y}H${b.x}`;
}
/** A continuous folded chain for two ends; connected, separately folded arms for spinners/trains. */
export function layoutDomino(hub: number | null, lines: readonly DominoLine[]): DominoLayout {
  const result: DominoLayout = {
    nodes: [],
    links: [],
    ends: [],
    labels: [],
    bounds: { x: -180, y: -90, width: 360, height: 180 },
  };
  if (hub === null) return result;
  const { nodes, links, ends, labels } = result;
  const simple = lines.length === 2 && lines.every((line) => line.parent < 0);
  if (simple) {
    const tiles = [...lines[0].tiles.slice().reverse().map(reverse), hub, ...lines[1].tiles];
    const columns = Math.min(10, Math.max(4, Math.ceil(Math.sqrt(tiles.length * 1.8))));
    for (const [i, tile] of tiles.entries()) {
      const point = snake(i, columns, 0, 0);
      nodes.push({
        ...point,
        key:
          i < lines[0].tiles.length
            ? '0:' + (lines[0].tiles.length - 1 - i)
            : i === lines[0].tiles.length
              ? 'hub'
              : '1:' + (i - lines[0].tiles.length - 1),
        tile: point.direction < 0 ? reverse(tile) : tile,
      });
      if (i)
        links.push(join(edge(nodes[i - 1], true), edge(nodes[i], false), nodes[i - 1].direction));
    }
    const first = nodes[0],
      last = nodes.at(-1)!;
    ends.push(
      { x: first.x - first.direction * 66, y: first.y, line: 0, pip: lines[0].pip },
      { x: last.x + last.direction * 66, y: last.y, line: 1, pip: lines[1].pip },
    );
  } else {
    nodes.push({ x: 0, y: 0, tile: hub, direction: 1, key: 'hub' });
    const count = lines.reduce((n, line) => n + line.tiles.length, 0);
    const columns = Math.min(10, Math.max(4, Math.ceil(Math.sqrt(count + 1))));
    let y = 80;
    for (const [i, line] of lines.entries()) {
      labels.push({ x: 140, y: y - 30, line: i });
      let previous: DominoNode | undefined;
      for (const [j, tile] of line.tiles.entries()) {
        const point = snake(j, columns, 140, y);
        const node = {
          ...point,
          key: i + ':' + j,
          tile: point.direction < 0 ? reverse(tile) : tile,
        };
        nodes.push(node);
        if (previous) links.push(join(edge(previous, true), edge(node, false), previous.direction));
        previous = node;
      }
      const end = previous ? edge(previous, true) : { x: 102, y };
      ends.push({ x: end.x + (previous?.direction ?? 1) * 28, y: end.y, line: i, pip: line.pip });
      y += Math.max(1, Math.ceil(line.tiles.length / columns)) * ROW + 36;
    }
    for (const [i, line] of lines.entries()) {
      const anchor = nodes.find((n) => n.key === line.parent + ':' + line.anchor) ?? nodes[0];
      const first = nodes.find((n) => n.key === i + ':0');
      const target = first ? edge(first, false) : { x: ends[i].x - 20, y: ends[i].y };
      const gutter = 60 - i * 5;
      // Branches leave their actual double; a gutter preserves readable, uncrossed tile faces.
      const top = anchor.y - ROW / 2;
      links.push(`M${anchor.x},${anchor.y - H / 2}V${top}H${gutter}V${target.y}H${target.x}`);
    }
  }
  const xs = [...nodes.map((n) => n.x), ...ends.map((n) => n.x), 0, 60 - lines.length * 5];
  const ys = [...nodes.map((n) => n.y), ...ends.map((n) => n.y), ...labels.map((n) => n.y), -32];
  const x = Math.min(...xs) - 64,
    y = Math.min(...ys) - 35;
  result.bounds = { x, y, width: Math.max(...xs) + 64 - x, height: Math.max(...ys) + 35 - y };
  return result;
}

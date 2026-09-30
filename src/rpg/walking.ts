import { WIDTH, HEIGHT, type World } from "./engine";

export function findWalkingRoute(w: World, x: number, y: number, tx: number, ty: number) {
  if (tx < 1 || ty < 1 || tx >= WIDTH - 1 || ty >= HEIGHT - 1) return [];
  const start = y * WIDTH + x,
    end = ty * WIDTH + tx,
    queue = [start],
    previous = new Map([[start, -1]]);
  let closest = start, closestDistance = Math.abs(x-tx)+Math.abs(y-ty);
  for (let i = 0; i < queue.length; i++) {
    const n = queue[i];
    const remaining = Math.abs(n % WIDTH-tx)+Math.abs(Math.floor(n / WIDTH)-ty);
    if(remaining<closestDistance){closest=n;closestDistance=remaining;}
    if (n === end) {closest=end;break;}
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = (n % WIDTH) + dx,
        ny = Math.floor(n / WIDTH) + dy,
        k = ny * WIDTH + nx;
      if (
        nx < 1 ||
        ny < 1 ||
        nx >= WIDTH - 1 ||
        ny >= HEIGHT - 1 ||
        previous.has(k) ||
        ["forest", "water"].includes(w.tiles[k])
      )
        continue;
      previous.set(k, n);
      queue.push(k);
    }
  }
  // A click on trees or water walks to the closest reachable edge.
  const route: Array<{x:number;y:number}> = [];
  for(let n=closest;n!==start;n=previous.get(n)!)route.push({x:n%WIDTH,y:Math.floor(n/WIDTH)});
  return route.reverse();
}

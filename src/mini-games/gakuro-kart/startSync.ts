import type { Race } from './engine';

/** Hold the grid until every connected human has received and rendered the race. */
export class RaceStartSync {
  private pending = new Set<string>();
  private seed = -1;
  private deadline = 0;

  get waiting() { return this.deadline > 0; }

  begin(world: Race, ids: Iterable<string>, now = performance.now()) {
    if (world.phase !== 'countdown') return;
    this.seed = world.seed;
    this.pending = new Set(ids);
    this.deadline = now + 15000;
    world.paused = true;
    world.remaining = 3;
    world.revision++;
  }

  ready(world: Race, id: string, seed: unknown) {
    if (world.seed === this.seed && seed === this.seed) this.pending.delete(id);
  }

  remove(id: string) { this.pending.delete(id); }

  advance(world: Race, now = performance.now()) {
    if (!this.deadline || world.seed !== this.seed || world.phase !== 'countdown') return false;
    // An old client or a suspended tab must not block the room indefinitely.
    if (this.pending.size && now < this.deadline) return false;
    this.deadline = 0;
    world.paused = false;
    world.remaining = 3;
    world.revision++;
    return true;
  }
}

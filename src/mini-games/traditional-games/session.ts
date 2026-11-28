import { CARD_CLUB_VOICE_HEROES } from '../../data/cardClubVoices';
import { PeerTableRoom, type TableProfile } from '../shared/PeerTableRoom';
import {
  createTable,
  applyTableAction,
  nextTableRound,
  playTableCpu,
  tableViewFor,
  type TableState,
  type TableView,
} from './engine';
import {
  isTableMember,
  seatsFor,
  type TableAction,
  type TableGame,
  type TableMember,
} from './model';

type TableIdentity = { hostId: string; selfId: string; code: string };
export type TableLobby = TableIdentity & {
  phase: 'lobby';
  game: TableGame;
  count: number;
  members: TableMember[];
};
export type TablePacket = TableLobby | (TableIdentity & { phase: 'game'; view: TableView });

export class TraditionalSession {
  members: TableMember[] = [];
  state: TableState | null = null;
  private count = 4;
  private game: TableGame = 'competitive';
  private nextCpu = 0;
  constructor(
    readonly hostId: string,
    readonly code: string,
    private readonly emit: (id: string, packet: TablePacket) => void,
  ) {}

  join(player: TableMember) {
    if (
      this.state ||
      !isTableMember(player) ||
      this.members.length >= this.count ||
      this.members.some((p) => p.id === player.id)
    )
      return false;
    this.members.push({ ...player, cpu: false });
    this.publish();
    return true;
  }
  leave(id: string) {
    this.members = this.members.filter((p) => p.id !== id);
    const player = this.state?.players.find((p) => p.id === id);
    if (player) {
      player.cpu = true;
      player.name = player.name + ' · CPU';
    }
    this.publish();
  }
  configure(game: TableGame, count: number) {
    if (this.state || count < this.members.length || !seatsFor(game).includes(count)) return false;
    this.game = game;
    this.count = count;
    this.publish();
    return true;
  }
  start(seed: number, opponent?: TableProfile) {
    if (this.state || !this.members.length || this.members[0].id !== this.hostId) return false;
    const players = [...this.members];
    for (let i = players.length; i < this.count; i++) {
      const guest = i === 1 ? opponent : undefined;
      players.push({
        id: `cpu-${i}`,
        name: guest?.name ?? `CPU ${i + 1}`,
        hero: guest?.hero ?? CARD_CLUB_VOICE_HEROES[(i * 7 + seed) % CARD_CLUB_VOICE_HEROES.length],
        cpu: true,
      });
    }
    this.state = createTable(this.game, players, seed);
    this.afterAction();
    return true;
  }
  command(id: string, action: TableAction, revision: number) {
    const state = this.state;
    if (!state || state.revision !== revision) return false;
    const seat = state.players.findIndex((p) => p.id === id && !p.cpu);
    if (seat < 0) return false;
    const ok =
      action.type === 'next'
        ? id === this.hostId && nextTableRound(state)
        : applyTableAction(state, seat, action);
    if (ok) this.afterAction();
    return ok;
  }
  tick() {
    if (this.state && Date.now() >= this.nextCpu && playTableCpu(this.state)) this.afterAction();
  }
  rematch() {
    this.state = null;
    this.publish();
  }
  private afterAction() {
    const wait = this.game === 'crokinole' ? 1850 : this.game === 'peeper' ? 1450 : 760;
    this.nextCpu = Date.now() + wait;
    this.publish();
  }
  private publish() {
    for (const self of this.members) {
      const identity = { hostId: this.hostId, selfId: self.id, code: this.code };
      if (this.state) {
        const seat = this.state.players.findIndex((p) => p.id === self.id);
        if (seat >= 0)
          this.emit(self.id, { ...identity, phase: 'game', view: tableViewFor(this.state, seat) });
      } else {
        this.emit(self.id, {
          ...identity,
          phase: 'lobby',
          game: this.game,
          count: this.count,
          members: [...this.members],
        });
      }
    }
  }
}

export class TraditionalRoom extends PeerTableRoom<TablePacket, TableAction, TraditionalSession> {
  constructor(update: (packet: TablePacket) => void, status: (message: string) => void) {
    super(
      {
        namespace: 'learning-traditional-tables',
        protocol: 1,
        seats: 8,
        revision: (packet) => (packet?.phase === 'game' ? packet.view.revision : -1),
        live: (packet) => packet?.phase === 'game' && packet.view.phase !== 'result',
      },
      update,
      status,
    );
  }
  protected makeSession(emit: (id: string, packet: TablePacket) => void) {
    return new TraditionalSession(this.selfId, this.code, emit);
  }
  configure(game: TableGame, count: number) {
    if (this.host) this.session?.configure(game, count);
  }
  start(opponent?: TableProfile) {
    if (this.host) this.session?.start(crypto.getRandomValues(new Uint32Array(1))[0], this.code ? undefined : opponent);
  }
  rematch() {
    if (this.host) this.session?.rematch();
  }
}

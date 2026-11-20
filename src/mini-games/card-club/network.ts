import { PeerTableRoom } from '../shared/PeerTableRoom';
import { ClubSession, type ClubPacket } from './session';
import type { LadderOptions } from './ladderOptions';
import type { Action } from './model';
import type { GameId } from './catalog';
import { CARD_CLUB_ROOM_CAPACITY } from './lobbyGames';

export class CardClubRoom extends PeerTableRoom<ClubPacket, Action, ClubSession> {
  constructor(update: (packet: ClubPacket) => void, status: (message: string) => void) {
    super(
      {
        namespace: 'learning-card-club',
        protocol: 6,
        seats: CARD_CLUB_ROOM_CAPACITY,
        revision: (packet) => (packet?.phase === 'game' ? packet.view.revision : -1),
        live: (packet) => packet?.phase === 'game' && packet.view.phase !== 'result',
      },
      update,
      status,
    );
  }
  protected makeSession(emit: (id: string, packet: ClubPacket) => void) {
    return new ClubSession(this.selfId, this.code, emit);
  }
  configure(game: GameId, count: number, options?: Partial<LadderOptions>) {
    if (this.host) this.session?.configure(game, count, options);
  }
  start() {
    if (this.host) this.session?.start(crypto.getRandomValues(new Uint32Array(1))[0]);
  }
  rematch() {
    if (this.host) this.session?.rematch();
  }
  finish() {
    if (this.host) this.session?.finish();
  }
}

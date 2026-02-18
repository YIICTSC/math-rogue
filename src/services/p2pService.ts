import Peer, { DataConnection } from 'peerjs';

export type P2PEvent =
    | { type: 'HANDSHAKE', player: any }
    | { type: 'STATE_UPDATE', myState: any, yourState: any, lastAction?: string, receiverTurn?: boolean, turnCount?: number, senderName?: string }
    | { type: 'EMOTE', emoteId: string }
    | { type: 'GIVE_UP' }
    | { type: 'RACE_JOIN', name: string, imageData?: string }
    | { type: 'RACE_PARTICIPANTS', participants: Array<{ peerId: string, name: string, imageData?: string }> }
    | { type: 'RACE_START', endAt: number, durationSec: number, mode?: any }
    | { type: 'RACE_MODE_SET', mode: any }
    | { type: 'RACE_PROGRESS', name: string, imageData?: string, floor: number, maxDamage: number, gameOverCount: number, score: number, updatedAt: number }
    | { type: 'RACE_LEADERBOARD', entries: Array<{ peerId: string, name: string, imageData?: string, floor: number, maxDamage: number, gameOverCount: number, score: number, updatedAt: number }> }
    | { type: 'RACE_END', entries: Array<{ peerId: string, name: string, imageData?: string, floor: number, maxDamage: number, gameOverCount: number, score: number, updatedAt: number }> };

class P2PService {
    private peer: Peer | null = null;
    private connections: Map<string, DataConnection> = new Map();
    private myId: string | null = null;

    // Callbacks
    public onConnect: ((conn: DataConnection) => void) | null = null;
    public onData: ((data: P2PEvent, fromPeerId?: string) => void) | null = null;
    public onClose: (() => void) | null = null;
    public onError: ((err: any) => void) | null = null;

    constructor() { }

    public async initHost(): Promise<string> {
        return new Promise((resolve, reject) => {
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            const peerId = `lr-battle-${code}`;

            try {
                this.peer = new Peer(peerId);

                this.peer.on('open', (id) => {
                    this.myId = id;
                    console.log('P2P Host initialized:', id);
                    resolve(code);
                });

                this.peer.on('connection', (conn) => {
                    this.handleConnection(conn);
                });

                this.peer.on('error', (err) => {
                    console.error('P2P Error:', err);
                    if (this.onError) this.onError(err);
                    reject(err);
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    public async connect(code: string): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const peerId = `lr-battle-${code}`;
                this.peer = new Peer();

                this.peer.on('open', () => {
                    const conn = this.peer!.connect(peerId);
                    conn.on('open', () => {
                        this.handleConnection(conn);
                        resolve();
                    });
                    conn.on('error', (err) => reject(err));
                });

                this.peer.on('error', (err) => {
                    console.error('P2P Client Error:', err);
                    reject(err);
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    private handleConnection(conn: DataConnection) {
        this.connections.set(conn.peer, conn);
        console.log('Setting up connection handlers for:', conn.peer);

        conn.on('data', (data: unknown) => {
            if (this.onData) this.onData(data as P2PEvent, conn.peer);
        });

        conn.on('close', () => {
            this.connections.delete(conn.peer);
            if (this.onClose) this.onClose();
        });

        conn.on('error', (err) => {
            if (this.onError) this.onError(err);
        });

        if (this.onConnect) {
            this.onConnect(conn);
        }
    }

    public send(data: P2PEvent) {
        const targets = Array.from(this.connections.values()).filter(c => c.open);
        if (targets.length > 0) {
            targets.forEach(conn => conn.send(data));
        } else {
            console.warn('Cannot send data, no open connections');
        }
    }

    public sendTo(peerId: string, data: P2PEvent) {
        const conn = this.connections.get(peerId);
        if (conn && conn.open) {
            conn.send(data);
        }
    }

    public getConnectedPeerIds(): string[] {
        return Array.from(this.connections.keys());
    }

    public close() {
        this.connections.forEach(conn => conn.close());
        this.connections.clear();
        if (this.peer) {
            this.peer.destroy();
            this.peer = null;
        }
    }

    public isConnected() {
        return Array.from(this.connections.values()).some(conn => conn.open);
    }
}

export const p2pService = new P2PService();


import Peer, { DataConnection } from 'peerjs';

export type P2PEvent =
    | { type: 'HANDSHAKE', player: any }
    | { type: 'STATE_UPDATE', myState: any, yourState: any, lastAction?: string, receiverTurn?: boolean, turnCount?: number, senderName?: string }
    | { type: 'EMOTE', emoteId: string }
    | { type: 'GIVE_UP' };

class P2PService {
    private peer: Peer | null = null;
    private connection: DataConnection | null = null;
    private myId: string | null = null;

    // Callbacks
    public onConnect: ((conn: DataConnection) => void) | null = null;
    public onData: ((data: P2PEvent) => void) | null = null;
    public onClose: (() => void) | null = null;
    public onError: ((err: any) => void) | null = null;

    constructor() { }

    public async initHost(): Promise<string> {
        return new Promise((resolve, reject) => {
            // Generate a random 6-digit code
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            const peerId = `lr-battle-${code}`; // Prefix to avoid collisions

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
                    // If ID taken, maybe retry? (Simple impl: just fail/retry manually)
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
                this.peer = new Peer(); // Client gets random ID

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
        if (this.connection && this.connection !== conn) {
            console.log('⚠️ Already have a connection, closing new one');
            conn.close();
            return;
        }

        this.connection = conn;
        console.log('🤝 Setting up connection handlers for:', conn.peer);

        conn.on('data', (data: unknown) => {
            console.log('📨 Data received:', data);
            if (this.onData) this.onData(data as P2PEvent);
        });

        conn.on('close', () => {
            console.log('🔌 Connection closed');
            this.connection = null;
            if (this.onClose) this.onClose();
        });

        conn.on('error', (err) => {
            console.error('❌ Connection Error:', err);
            if (this.onError) this.onError(err);
        });

        // Call onConnect callback after handlers are set up
        if (this.onConnect) {
            console.log('📢 Triggering onConnect callback');
            this.onConnect(conn);
        }
    }

    public send(data: P2PEvent) {
        if (this.connection && this.connection.open) {
            console.log('📤 Sending data:', data.type);
            this.connection.send(data);
        } else {
            console.warn('⚠️ Cannot send data, connection not open. Status:', {
                hasConnection: !!this.connection,
                isOpen: this.connection?.open
            });
        }
    }

    public close() {
        if (this.connection) {
            this.connection.close();
            this.connection = null;
        }
        if (this.peer) {
            this.peer.destroy();
            this.peer = null;
        }
    }

    public isConnected() {
        return !!this.connection && this.connection.open;
    }
}

export const p2pService = new P2PService();

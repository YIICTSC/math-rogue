import Peer, { DataConnection, MediaConnection } from 'peerjs';
import { CoopSharedState, CoopSupportEffectId, CoopTreasurePool, RaceTrickEffectId } from '../types';

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
    | { type: 'RACE_END', entries: Array<{ peerId: string, name: string, imageData?: string, floor: number, maxDamage: number, gameOverCount: number, score: number, updatedAt: number }> }
    | { type: 'RACE_TRICK_PLAY', cardId: string, effectId: RaceTrickEffectId, targetPeerId: string, sourceName: string, sourceGold: number }
    | { type: 'RACE_TRICK_APPLY', cardId: string, effectId: RaceTrickEffectId, sourcePeerId: string, sourceName: string, sourceGold: number }
    | { type: 'RACE_TRICK_RESULT', effectId: RaceTrickEffectId, sourcePeerId: string, targetPeerId: string, sourceGoldAfter?: number, goldDelta?: number }
    | { type: 'COOP_JOIN', name: string, imageData?: string }
    | {
        type: 'COOP_PARTICIPANTS',
        participants: Array<{
            peerId: string,
            name: string,
            imageData?: string,
            selectedCharacterId?: string,
            maxHp?: number,
            currentHp?: number,
            block?: number,
            nextTurnEnergy?: number,
            strength?: number,
            buffer?: number,
            revivedThisBattle?: boolean,
            quizResolved?: boolean,
            quizCorrectCount?: number,
            eventResolved?: boolean,
            restResolved?: boolean,
            shopResolved?: boolean,
            rewardResolved?: boolean,
            treasureResolved?: boolean,
            voiceEnabled?: boolean,
            floatingText?: any
        }>,
        decisionOwnerIndex?: number
    }
    | { type: 'COOP_START', roomCode?: string, battleMode?: 'TURN_BASED' | 'REALTIME', participants?: Array<{
        peerId: string,
        name: string,
        imageData?: string,
        selectedCharacterId?: string,
        maxHp?: number,
        currentHp?: number,
        block?: number,
        nextTurnEnergy?: number,
        strength?: number,
        buffer?: number,
        revivedThisBattle?: boolean,
        quizResolved?: boolean,
        quizCorrectCount?: number,
        eventResolved?: boolean,
        restResolved?: boolean,
        shopResolved?: boolean,
        rewardResolved?: boolean,
        treasureResolved?: boolean,
        voiceEnabled?: boolean
    }> }
    | { type: 'COOP_MODE_SET', mode: any }
    | { type: 'COOP_CHARACTER_SELECT', characterId: string, name: string, imageData: string, maxHp: number, currentHp: number }
    | { type: 'COOP_QUIZ_RESULT', correctCount: number }
    | { type: 'COOP_PLAYER_SNAPSHOT', player: any }
    | {
        type: 'COOP_SELF_STATE',
        name?: string,
        imageData?: string,
        selectedCharacterId?: string,
        maxHp?: number,
        currentHp?: number,
        block?: number,
        nextTurnEnergy?: number,
        strength?: number,
        buffer?: number,
        revivedThisBattle?: boolean,
        quizResolved?: boolean,
        quizCorrectCount?: number,
        eventResolved?: boolean,
        restResolved?: boolean,
        shopResolved?: boolean,
        rewardResolved?: boolean,
        treasureResolved?: boolean,
        voiceEnabled?: boolean
    }
    | {
        type: 'COOP_STATE_SYNC',
        state: CoopSharedState,
        aux?: {
            shopCards?: any[],
            shopRelics?: any[],
            shopPotions?: any[],
            treasureRewards?: any[],
            treasureOpened?: boolean,
            treasurePools?: CoopTreasurePool[],
            eventData?: {
                title: string,
                description: string,
                image?: string,
                imageKey?: string,
                options: Array<{ label: string, text: string }>
            } | null,
            eventResultLog?: string | null
        }
    }
    | { type: 'COOP_STATE_SYNC_REQUEST' }
    | { type: 'COOP_REWARD_SYNC_REQUEST' }
    | {
        type: 'COOP_BATTLE_SYNC',
        battleState: {
            battleKey: string,
            players: Array<{
                peerId: string,
                name: string,
                player: any,
                selectedEnemyId?: string | null,
                isDown?: boolean
            }>,
            turnQueue: Array<{
                id: string,
                type: 'SELF' | 'ALLY' | 'ENEMY',
                label: string,
                peerId?: string
            }>,
            turnCursor: number,
            enemyTurnCursor: number
        } | null,
        activeEffects?: any[],
        enemies?: any[],
        selectedEnemyId?: string | null,
        combatLog?: string[],
        turnLog?: string,
        actingEnemyId?: string | null,
        finisherCutinCard?: any | null
    }
    | {
        type: 'COOP_BATTLE_FINISH',
        screen: any,
        enemies?: any[],
        selectedEnemyId?: string | null,
        combatLog?: string[]
    }
    | { type: 'COOP_BATTLE_SELECT_ENEMY', enemyId: string }
    | {
        type: 'COOP_BATTLE_PLAY_CARD',
        cardId: string,
        playedCard?: any,
        player: any,
        enemies: any[],
        selectedEnemyId?: string | null,
        combatLog?: string[],
        turnLog?: string,
        actingEnemyId?: string | null,
        battleState?: {
            battleKey: string,
            players: Array<{
                peerId: string,
                name: string,
                player: any,
                selectedEnemyId?: string | null,
                isDown?: boolean
            }>,
            turnQueue: Array<{
                id: string,
                type: 'SELF' | 'ALLY' | 'ENEMY',
                label: string,
                peerId?: string
            }>,
            turnCursor: number,
            enemyTurnCursor: number
        } | null,
        activeEffects?: any[]
    }
    | {
        type: 'COOP_BATTLE_USE_POTION',
        potionId: string,
        player: any,
        enemies: any[],
        selectedEnemyId?: string | null,
        combatLog?: string[],
        turnLog?: string,
        actingEnemyId?: string | null,
        battleState?: {
            battleKey: string,
            players: Array<{
                peerId: string,
                name: string,
                player: any,
                selectedEnemyId?: string | null,
                isDown?: boolean
            }>,
            turnQueue: Array<{
                id: string,
                type: 'SELF' | 'ALLY' | 'ENEMY',
                label: string,
                peerId?: string
            }>,
            turnCursor: number,
            enemyTurnCursor: number
        } | null,
        activeEffects?: any[]
    }
    | {
        type: 'COOP_BATTLE_TURN_START' | 'COOP_BATTLE_SELECTION_STATE' | 'COOP_BATTLE_MODAL_RESOLVE' | 'COOP_BATTLE_CODEX_SELECT',
        player: any,
        enemies: any[],
        selectedEnemyId?: string | null,
        combatLog?: string[],
        turnLog?: string,
        actingEnemyId?: string | null,
        battleState?: {
            battleKey: string,
            players: Array<{
                peerId: string,
                name: string,
                player: any,
                selectedEnemyId?: string | null,
                isDown?: boolean
            }>,
            turnQueue: Array<{
                id: string,
                type: 'SELF' | 'ALLY' | 'ENEMY',
                label: string,
                peerId?: string
            }>,
            turnCursor: number,
            enemyTurnCursor: number
        } | null,
        activeEffects?: any[]
    }
    | {
        type: 'COOP_END_TURN',
        player: any,
        selectedEnemyId?: string | null,
        battleState?: {
            battleKey: string,
            players: Array<{
                peerId: string,
                name: string,
                player: any,
                selectedEnemyId?: string | null,
                isDown?: boolean
            }>,
            turnQueue: Array<{
                id: string,
                type: 'SELF' | 'ALLY' | 'ENEMY',
                label: string,
                peerId?: string
            }>,
            turnCursor: number,
            enemyTurnCursor: number
        } | null
    }
    | { type: 'COOP_NODE_SELECT', nodeId: string }
    | { type: 'COOP_REWARD_SYNC', rewards: any[] }
    | { type: 'COOP_REWARD_SELECT', rewardId: string, item?: any, replacePotionId?: string }
    | { type: 'COOP_REWARD_SKIP' }
    | { type: 'COOP_SUPPORT_GRANT', rewardId: string, card: { id: string, effectId: CoopSupportEffectId, name: string, description: string, rarity: 'COMMON' | 'UNCOMMON' | 'RARE' }, rewards?: any[], rewardResolved?: boolean }
    | { type: 'COOP_REWARD_GRANT', item: any, replacePotionId?: string, rewards?: any[], rewardResolved?: boolean }
    | { type: 'COOP_TREASURE_OPEN' }
    | { type: 'COOP_TREASURE_CLAIM', poolId: string }
    | { type: 'COOP_TREASURE_GRANT', rewards: any[], player?: any, addCurse?: boolean, poolId?: string }
    | { type: 'COOP_EVENT_OPTION', optionIndex: number }
    | { type: 'COOP_EVENT_RESULT', player: any, resultLog: string | null }
    | { type: 'COOP_EVENT_CONTINUE' }
    | { type: 'COOP_REST_ACTION', action: 'REST' | 'UPGRADE' | 'SYNTHESIZE' | 'LEAVE', cardId?: string, cardIds?: string[] }
    | { type: 'COOP_SHOP_ACTION', action: 'BUY_CARD' | 'BUY_RELIC' | 'BUY_POTION' | 'REMOVE_CARD' | 'LEAVE', itemId?: string, replacePotionId?: string, cardId?: string, cost?: number }
    | { type: 'COOP_SUPPORT_USE', cardId: string, effectId: CoopSupportEffectId, name: string, description: string, rarity: string, targetPeerId?: string };

class P2PService {
    private peer: Peer | null = null;
    private connections: Map<string, DataConnection> = new Map();
    private mediaConnections: Map<string, MediaConnection> = new Map();
    private remoteAudioElements: Map<string, HTMLAudioElement> = new Map();
    private localStream: MediaStream | null = null;
    private voiceEnabled = false;
    private voiceConstraints: MediaTrackConstraints = { echoCancellation: true, noiseSuppression: true, autoGainControl: true };
    private myId: string | null = null;

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
                this.peer.on('call', (call) => {
                    this.handleIncomingCall(call);
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

                this.peer.on('open', (id) => {
                    this.myId = id;
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
                this.peer.on('call', (call) => {
                    this.handleIncomingCall(call);
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    private handleConnection(conn: DataConnection) {
        this.connections.set(conn.peer, conn);
        console.log('Setting up connection handlers for:', conn.peer);

        if (this.voiceEnabled) {
            this.callPeer(conn.peer).catch((err) => {
                console.warn('Voice call failed:', err);
            });
        }

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

    public getMyId() {
        return this.myId;
    }

    public close() {
        this.voiceEnabled = false;
        this.mediaConnections.forEach(call => call.close());
        this.mediaConnections.clear();
        this.remoteAudioElements.forEach(audio => {
            audio.pause();
            audio.srcObject = null;
            audio.remove();
        });
        this.remoteAudioElements.clear();
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }
        this.connections.forEach(conn => conn.close());
        this.connections.clear();
        if (this.peer) {
            this.peer.destroy();
            this.peer = null;
        }
        this.myId = null;
    }

    public isConnected() {
        return Array.from(this.connections.values()).some(conn => conn.open);
    }

    private async ensureLocalAudioStream() {
        if (this.localStream) return this.localStream;
        if (!navigator?.mediaDevices?.getUserMedia) {
            throw new Error('この環境では音声入力が利用できません');
        }
        this.localStream = await navigator.mediaDevices.getUserMedia({ audio: this.voiceConstraints, video: false });
        this.localStream.getAudioTracks().forEach(track => {
            track.enabled = this.voiceEnabled;
        });
        return this.localStream;
    }

    private attachRemoteStream(peerId: string, stream: MediaStream) {
        let audio = this.remoteAudioElements.get(peerId);
        if (!audio) {
            audio = document.createElement('audio');
            audio.autoplay = true;
            audio.playsInline = true;
            audio.dataset.peerId = peerId;
            audio.style.display = 'none';
            document.body.appendChild(audio);
            this.remoteAudioElements.set(peerId, audio);
        }
        audio.srcObject = stream;
        audio.play().catch(() => {
            // Browser autoplay policy may block playback until a user gesture.
        });
    }

    private async callPeer(peerId: string) {
        if (!this.peer || !this.voiceEnabled) return;
        if (this.mediaConnections.has(peerId)) return;
        const stream = await this.ensureLocalAudioStream();
        const call = this.peer.call(peerId, stream);
        this.bindMediaConnection(peerId, call);
    }

    private bindMediaConnection(peerId: string, call: MediaConnection) {
        this.mediaConnections.set(peerId, call);
        call.on('stream', (remoteStream) => {
            this.attachRemoteStream(peerId, remoteStream);
        });
        call.on('close', () => {
            this.mediaConnections.delete(peerId);
            const audio = this.remoteAudioElements.get(peerId);
            if (audio) {
                audio.pause();
                audio.srcObject = null;
                audio.remove();
                this.remoteAudioElements.delete(peerId);
            }
        });
        call.on('error', (err) => {
            console.warn('Voice media error:', err);
        });
    }

    private async handleIncomingCall(call: MediaConnection) {
        try {
            if (this.voiceEnabled) {
                const stream = await this.ensureLocalAudioStream();
                call.answer(stream);
            } else {
                // 自分のマイクがOFFでも、相手の音声は受信できるようにする
                call.answer();
            }
            this.bindMediaConnection(call.peer, call);
        } catch (err) {
            console.warn('Failed to answer voice call:', err);
            call.close();
        }
    }

    public async setVoiceEnabled(enabled: boolean) {
        this.voiceEnabled = enabled;
        if (!enabled) {
            if (this.localStream) {
                this.localStream.getAudioTracks().forEach(track => {
                    track.enabled = false;
                    track.stop();
                });
                this.localStream = null;
            }
            return;
        }
        if (this.mediaConnections.size > 0) {
            this.mediaConnections.forEach(call => call.close());
            this.mediaConnections.clear();
        }
        const stream = await this.ensureLocalAudioStream();
        stream.getAudioTracks().forEach(track => {
            track.enabled = true;
        });
        await this.startVoiceChatForAll();
    }

    public async startVoiceChatForAll() {
        if (!this.voiceEnabled) return;
        const peerIds = Array.from(this.connections.keys());
        for (const peerId of peerIds) {
            try {
                await this.callPeer(peerId);
            } catch (err) {
                console.warn(`Failed to start voice chat with ${peerId}:`, err);
            }
        }
    }

    public async configureVoice(options: {
        deviceId?: string;
        echoCancellation?: boolean;
        noiseSuppression?: boolean;
        autoGainControl?: boolean;
    }) {
        this.voiceConstraints = {
            ...this.voiceConstraints,
            ...(typeof options.echoCancellation === 'boolean' ? { echoCancellation: options.echoCancellation } : {}),
            ...(typeof options.noiseSuppression === 'boolean' ? { noiseSuppression: options.noiseSuppression } : {}),
            ...(typeof options.autoGainControl === 'boolean' ? { autoGainControl: options.autoGainControl } : {}),
            ...(options.deviceId ? { deviceId: { exact: options.deviceId } } : { deviceId: undefined })
        };
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }
        if (this.voiceEnabled) {
            await this.setVoiceEnabled(true);
        }
    }
}

export const p2pService = new P2PService();

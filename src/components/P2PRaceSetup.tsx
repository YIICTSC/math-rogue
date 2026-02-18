import React, { useEffect, useMemo, useState } from 'react';
import { GameMode, Player } from '../types';
import { p2pService, P2PEvent } from '../services/p2pService';
import { X, Wifi, Users, Loader, AlertCircle } from 'lucide-react';
import { audioService } from '../services/audioService';

interface RaceStartPayload {
    isHost: boolean;
    name: string;
    roomCode: string;
    durationSec: number;
    endAt: number;
    mode?: GameMode;
    participants: Array<{ peerId: string; name: string; imageData?: string }>;
}

interface P2PRaceSetupProps {
    player: Player;
    onRaceStart: (payload: RaceStartPayload) => void;
    onClose: () => void;
}

const P2PRaceSetup: React.FC<P2PRaceSetupProps> = ({ player, onRaceStart, onClose }) => {
    const [mode, setMode] = useState<'SELECT' | 'HOST' | 'JOIN'>('SELECT');
    const [myName, setMyName] = useState('');
    const [battleCode, setBattleCode] = useState('');
    const [inputCode, setInputCode] = useState('');
    const [status, setStatus] = useState<'IDLE' | 'CONNECTING' | 'CONNECTED' | 'ERROR'>('IDLE');
    const [errorMsg, setErrorMsg] = useState('');
    const [durationSec, setDurationSec] = useState(600);
    const [participants, setParticipants] = useState<Array<{ peerId: string; name: string; imageData?: string }>>([]);
    const [joinSent, setJoinSent] = useState(false);
    const [hostSelectedMode, setHostSelectedMode] = useState<GameMode | undefined>(undefined);

    const canStart = useMemo(() => mode === 'HOST' && status === 'CONNECTED' && participants.length >= 1, [mode, status, participants.length]);

    useEffect(() => {
        p2pService.onConnect = () => {
            setStatus('CONNECTED');
        };

        p2pService.onData = (data: P2PEvent, fromPeerId?: string) => {
            if (data.type === 'RACE_JOIN' && mode === 'HOST' && fromPeerId) {
                setParticipants(prev => {
                    const exists = prev.some(p => p.peerId === fromPeerId);
                    const next = exists
                        ? prev.map(p => p.peerId === fromPeerId ? { ...p, name: data.name, imageData: data.imageData } : p)
                        : [...prev, { peerId: fromPeerId, name: data.name, imageData: data.imageData }];
                    p2pService.send({ type: 'RACE_PARTICIPANTS', participants: next });
                    return next;
                });
            }

            if (data.type === 'RACE_PARTICIPANTS') {
                setParticipants(data.participants);
            }

            if (data.type === 'RACE_MODE_SET' && mode === 'JOIN') {
                setHostSelectedMode(data.mode as GameMode);
            }

            if (data.type === 'RACE_START') {
                onRaceStart({
                    isHost: mode === 'HOST',
                    name: myName.trim(),
                    roomCode: battleCode,
                    durationSec: data.durationSec,
                    endAt: data.endAt,
                    mode: (data.mode as GameMode | undefined) ?? hostSelectedMode,
                    participants
                });
            }
        };

        p2pService.onClose = () => {
            setStatus('IDLE');
        };

        p2pService.onError = (err) => {
            setStatus('ERROR');
            setErrorMsg(err?.message || '接続エラー');
            audioService.playSound('wrong');
        };

        return () => {
            p2pService.onConnect = null;
            p2pService.onData = null;
            p2pService.onClose = null;
            p2pService.onError = null;
        };
    }, [mode, myName, onRaceStart, participants, battleCode, hostSelectedMode]);

    useEffect(() => {
        if (mode === 'JOIN' && status === 'CONNECTED' && myName.trim() && !joinSent) {
            p2pService.send({ type: 'RACE_JOIN', name: myName.trim(), imageData: player.imageData });
            setJoinSent(true);
        }
    }, [mode, status, myName, joinSent, player.imageData]);

    const handleCreateRoom = async () => {
        if (!myName.trim()) return;
        setStatus('CONNECTING');
        setErrorMsg('');
        try {
            const code = await p2pService.initHost();
            setBattleCode(code);
            setMode('HOST');
            setStatus('CONNECTED');
            setParticipants([{ peerId: 'host', name: myName.trim(), imageData: player.imageData }]);
            setJoinSent(false);
            audioService.playSound('select');
        } catch (err: any) {
            setStatus('ERROR');
            setErrorMsg(err?.message || 'ルーム作成に失敗');
        }
    };

    const handleJoinRoom = async () => {
        if (!myName.trim() || inputCode.length !== 6) return;
        setStatus('CONNECTING');
        setErrorMsg('');
        try {
            await p2pService.connect(inputCode);
            setBattleCode(inputCode);
            setMode('JOIN');
            setJoinSent(false);
            audioService.playSound('select');
        } catch (err: any) {
            setStatus('ERROR');
            setErrorMsg(err?.message || '接続に失敗');
        }
    };

    const handleStart = () => {
        if (!canStart) return;
        const endAt = Date.now() + durationSec * 1000;
        p2pService.send({ type: 'RACE_START', endAt, durationSec });
        onRaceStart({
            isHost: true,
            name: myName.trim(),
            roomCode: battleCode,
            durationSec,
            endAt,
            participants
        });
    };

    const handleBack = () => {
        p2pService.close();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[200] bg-slate-950/95 flex items-center justify-center p-4 text-white">
            <div className="bg-slate-900 border-2 border-indigo-500 rounded-2xl w-full max-w-lg p-6 relative">
                <button onClick={handleBack} className="absolute top-3 right-3 text-gray-400 hover:text-white"><X size={22} /></button>

                <h2 className="text-2xl font-black mb-4">RACE MODE</h2>

                <div className="mb-4">
                    <label className="block text-sm text-gray-300 mb-2">名前</label>
                    <input
                        value={myName}
                        onChange={(e) => setMyName(e.target.value)}
                        placeholder="表示名"
                        className="w-full bg-black/60 border border-gray-600 rounded px-3 py-2"
                        maxLength={20}
                    />
                </div>

                {mode === 'SELECT' && (
                    <div className="space-y-3">
                        <button onClick={handleCreateRoom} className="w-full bg-indigo-600 py-3 rounded font-bold flex items-center justify-center gap-2"><Wifi size={18} /> ルーム作成</button>
                        <div className="flex gap-2">
                            <input
                                value={inputCode}
                                onChange={(e) => setInputCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="6桁コード"
                                className="flex-1 bg-black/60 border border-gray-600 rounded px-3 py-2"
                            />
                            <button onClick={handleJoinRoom} className="bg-emerald-600 px-4 rounded font-bold">参加</button>
                        </div>
                    </div>
                )}

                {mode === 'HOST' && (
                    <div className="space-y-3">
                        <div className="bg-black/60 border border-gray-700 rounded p-3">
                            <div className="text-xs text-gray-400">ルームコード</div>
                            <div className="text-4xl font-black tracking-widest">{battleCode}</div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-300">制限時間</span>
                            <select value={durationSec} onChange={(e) => setDurationSec(Number(e.target.value))} className="bg-black/60 border border-gray-600 rounded px-2 py-1">
                                <option value={60}>1分</option>
                                <option value={300}>5分</option>
                                <option value={600}>10分</option>
                                <option value={900}>15分</option>
                                <option value={1200}>20分</option>
                                <option value={1500}>25分</option>
                                <option value={1800}>30分</option>
                                <option value={2100}>35分</option>
                                <option value={2400}>40分</option>
                                <option value={2700}>45分</option>
                                <option value={3000}>50分</option>
                            </select>
                        </div>
                        <div className="bg-black/40 border border-gray-700 rounded p-3 max-h-44 overflow-auto">
                            <div className="text-sm font-bold mb-2 flex items-center gap-1"><Users size={14} /> 参加者 {participants.length}</div>
                            {participants.map(p => (
                                <div key={p.peerId} className="text-sm text-gray-200">- {p.name}</div>
                            ))}
                        </div>
                        <button onClick={handleStart} disabled={!canStart} className="w-full bg-emerald-600 disabled:bg-gray-700 py-3 rounded font-bold">レース開始</button>
                    </div>
                )}

                {mode === 'JOIN' && (
                    <div className="space-y-3">
                        <div className="bg-black/40 border border-gray-700 rounded p-3 text-sm text-gray-200">コード: {battleCode}</div>
                        <div className="bg-black/40 border border-gray-700 rounded p-3 max-h-44 overflow-auto">
                            <div className="text-sm font-bold mb-2 flex items-center gap-1"><Users size={14} /> 参加者</div>
                            {participants.length === 0 ? <div className="text-sm text-gray-400">待機中...</div> : participants.map(p => (
                                <div key={p.peerId} className="text-sm text-gray-200">- {p.name}</div>
                            ))}
                        </div>
                        <div className="text-sm text-gray-400 flex items-center gap-2"><Loader size={14} className="animate-spin" /> ホストの開始待ち</div>
                    </div>
                )}

                {status === 'ERROR' && (
                    <div className="mt-4 bg-red-900/40 border border-red-500 rounded p-3 text-sm flex items-center gap-2"><AlertCircle size={14} /> {errorMsg}</div>
                )}
            </div>
        </div>
    );
};

export default P2PRaceSetup;

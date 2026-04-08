import React, { useState, useEffect } from 'react';
import { Player } from '../types';
import { p2pService, P2PEvent } from '../services/p2pService';
import { X, Wifi, WifiOff, Copy, Check, Users, Loader, AlertCircle, Sparkles } from 'lucide-react';
import { audioService } from '../services/audioService';

interface P2PBattleSetupProps {
    player: Player;
    onBattleStart: (opponent: Player, isHost: boolean) => void;
    onClose: () => void;
}

const P2PBattleSetup: React.FC<P2PBattleSetupProps> = ({ player, onBattleStart, onClose }) => {
    const [mode, setMode] = useState<'SELECT' | 'HOST' | 'JOIN'>('SELECT');
    const [battleCode, setBattleCode] = useState<string>('');
    const [inputCode, setInputCode] = useState<string>('');
    const [status, setStatus] = useState<'IDLE' | 'CONNECTING' | 'CONNECTED' | 'ERROR'>('IDLE');
    const [errorMsg, setErrorMsg] = useState<string>('');
    const [copied, setCopied] = useState(false);
    const [urlCopied, setUrlCopied] = useState(false);
    const [opponentPlayer, setOpponentPlayer] = useState<Player | null>(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        const presetCode = (params.get('vsPin') || '').normalize('NFKC').replace(/[^0-9]/g, '').slice(0, 6);
        if (presetCode.length === 6) {
            setMode('JOIN');
            setInputCode(presetCode);
        }
    }, []);

    useEffect(() => {
        console.log('🔧 Setting up P2P event handlers');

        // Setup P2P event handlers
        p2pService.onConnect = () => {
            console.log('✅ Connection established, sending handshake');
            setStatus('CONNECTED');
            audioService.playSound('buff');

            // Send handshake with player data immediately
            setTimeout(() => {
                console.log('📤 Sending handshake with player data');
                p2pService.send({
                    type: 'HANDSHAKE',
                    player: player
                });
            }, 100); // Small delay to ensure connection is fully ready
        };

        p2pService.onData = (data: P2PEvent) => {
            console.log('📨 Received data:', data.type);
            if (data.type === 'HANDSHAKE') {
                console.log('🤝 Received opponent player data');
                setOpponentPlayer(data.player);
                audioService.playSound('win');

                // Send handshake back if we haven't sent one yet
                if (!opponentPlayer) {
                    console.log('📤 Sending handshake response');
                    setTimeout(() => {
                        p2pService.send({
                            type: 'HANDSHAKE',
                            player: player
                        });
                    }, 100);
                }
            }
        };

        p2pService.onClose = () => {
            console.log('🔌 Connection closed');
            setStatus('IDLE');
            setErrorMsg('接続が切断されました');
        };

        p2pService.onError = (err) => {
            console.error('❌ P2P Error:', err);
            setStatus('ERROR');
            setErrorMsg(err.message || '接続エラーが発生しました');
            audioService.playSound('wrong');
        };

        return () => {
            console.log('🧹 Cleaning up P2P event handlers');
            p2pService.onConnect = null;
            p2pService.onData = null;
            p2pService.onClose = null;
            p2pService.onError = null;
        };
    }, [player, opponentPlayer]);

    const handleCreateRoom = async () => {
        setStatus('CONNECTING');
        setErrorMsg('');
        try {
            const code = await p2pService.initHost();
            setBattleCode(code);
            setMode('HOST');
            audioService.playSound('select');
        } catch (err: any) {
            setStatus('ERROR');
            setErrorMsg('ルーム作成に失敗しました: ' + (err.message || ''));
            audioService.playSound('wrong');
        }
    };

    const handleJoinRoom = async () => {
        if (!inputCode || inputCode.length !== 6) {
            audioService.playSound('wrong');
            return;
        }

        setStatus('CONNECTING');
        setErrorMsg('');
        try {
            await p2pService.connect(inputCode);
            setBattleCode(inputCode);
            setMode('JOIN');
            audioService.playSound('select');
        } catch (err: any) {
            setStatus('ERROR');
            setErrorMsg('接続に失敗しました: ' + (err.message || ''));
            audioService.playSound('wrong');
        }
    };

    const handleStartBattle = () => {
        if (opponentPlayer) {
            audioService.playSound('select');
            onBattleStart(opponentPlayer, mode === 'HOST');
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(battleCode);
        setCopied(true);
        audioService.playSound('select');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCopyJoinUrl = () => {
        if (typeof window === 'undefined' || !battleCode) return;
        const inviteUrl = new URL(window.location.href);
        inviteUrl.searchParams.set('vsPin', battleCode);
        navigator.clipboard.writeText(inviteUrl.toString());
        setUrlCopied(true);
        audioService.playSound('select');
        setTimeout(() => setUrlCopied(false), 2000);
    };

    const handleBack = () => {
        p2pService.close();
        onClose();
    };

    if (mode === 'SELECT') {
        return (
            <div className="fixed inset-0 z-[200] bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 flex items-center justify-center p-4">
                <div className="bg-slate-900/95 border-4 border-indigo-500 rounded-3xl w-full max-w-lg p-8 relative shadow-[0_0_80px_rgba(79,70,229,0.6)] backdrop-blur-sm">
                    <button onClick={handleBack} className="absolute top-4 right-4 text-gray-500 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={28} />
                    </button>

                    <div className="text-center mb-8">
                        <Users size={64} className="text-indigo-400 mx-auto mb-4 animate-pulse" />
                        <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 italic tracking-tighter mb-2">
                            P2P BATTLE
                        </h2>
                        <p className="text-gray-400 text-sm">リアルタイム対戦モード</p>
                    </div>

                    <div className="flex flex-col gap-4">
                        <button
                            onClick={handleCreateRoom}
                            className="group relative bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black py-6 rounded-2xl shadow-lg transition-all transform hover:scale-105 active:scale-95 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                            <div className="relative flex items-center justify-center gap-3">
                                <Wifi size={28} />
                                <span className="text-xl">ルームを作成</span>
                            </div>
                        </button>

                        <button
                            onClick={() => setMode('JOIN')}
                            className="group relative bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-black py-6 rounded-2xl shadow-lg transition-all transform hover:scale-105 active:scale-95 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                            <div className="relative flex items-center justify-center gap-3">
                                <Users size={28} />
                                <span className="text-xl">ルームに参加</span>
                            </div>
                        </button>
                    </div>

                    {errorMsg && (
                        <div className="mt-6 p-4 bg-red-900/50 border border-red-500 rounded-xl flex items-center gap-2 text-red-200 text-sm">
                            <AlertCircle size={20} />
                            <span>{errorMsg}</span>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (mode === 'HOST') {
        return (
            <div className="fixed inset-0 z-[200] bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 flex items-center justify-center p-4">
                <div className="bg-slate-900/95 border-4 border-indigo-500 rounded-3xl w-full max-w-lg p-8 relative shadow-[0_0_80px_rgba(79,70,229,0.6)] backdrop-blur-sm">
                    <button onClick={handleBack} className="absolute top-4 right-4 text-gray-500 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={28} />
                    </button>

                    <div className="text-center mb-6">
                        <Wifi size={48} className="text-indigo-400 mx-auto mb-3 animate-pulse" />
                        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 italic tracking-tighter">
                            対戦コード
                        </h2>
                    </div>

                    {/* Battle Code Display */}
                    <div className="bg-black/60 p-6 rounded-2xl border-2 border-indigo-500/50 mb-6">
                        <div className="text-center mb-4">
                            <div className="text-6xl font-black text-white tracking-widest font-mono">
                                {battleCode}
                            </div>
                        </div>
                        <button
                            onClick={handleCopy}
                            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all ${copied ? 'bg-green-600 text-white' : 'bg-indigo-600/80 text-indigo-100 hover:bg-indigo-500'
                                }`}
                        >
                            {copied ? <Check size={20} /> : <Copy size={20} />}
                            {copied ? 'コピーしました！' : 'コードをコピー'}
                        </button>
                        <button
                            onClick={handleCopyJoinUrl}
                            className={`mt-2 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all ${urlCopied ? 'bg-emerald-600 text-white' : 'bg-slate-700/80 text-slate-100 hover:bg-slate-600'}`}
                        >
                            {urlCopied ? <Check size={20} /> : <Copy size={20} />}
                            {urlCopied ? 'URLをコピーしました！' : 'PIN入力済みURLをコピー'}
                        </button>
                    </div>

                    {/* Status */}
                    {status === 'CONNECTED' && opponentPlayer ? (
                        <div className="bg-green-900/50 border-2 border-green-500 rounded-2xl p-6 mb-6 animate-in zoom-in duration-300">
                            <div className="flex items-center justify-center gap-2 text-green-400 font-black text-xl mb-4">
                                <Sparkles size={24} />
                                対戦相手が接続しました！
                                <Sparkles size={24} />
                            </div>
                            <button
                                onClick={handleStartBattle}
                                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-black py-4 rounded-xl shadow-lg transition-all transform hover:scale-105 active:scale-95 text-xl"
                            >
                                対戦開始！
                            </button>
                        </div>
                    ) : (
                        <div className="bg-indigo-900/30 border border-indigo-500/50 rounded-2xl p-6 text-center">
                            <Loader size={32} className="text-indigo-400 mx-auto mb-3 animate-spin" />
                            <p className="text-indigo-300 font-bold">対戦相手を待っています...</p>
                            <p className="text-gray-500 text-sm mt-2">相手にコードを共有してください</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (mode === 'JOIN') {
        return (
            <div className="fixed inset-0 z-[200] bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 flex items-center justify-center p-4">
                <div className="bg-slate-900/95 border-4 border-pink-500 rounded-3xl w-full max-w-lg p-8 relative shadow-[0_0_80px_rgba(236,72,153,0.6)] backdrop-blur-sm">
                    <button onClick={handleBack} className="absolute top-4 right-4 text-gray-500 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={28} />
                    </button>

                    <div className="text-center mb-6">
                        <Users size={48} className="text-pink-400 mx-auto mb-3" />
                        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400 italic tracking-tighter">
                            ルームに参加
                        </h2>
                    </div>

                    {status !== 'CONNECTED' ? (
                        <>
                            <div className="mb-6">
                                <label className="block text-gray-400 text-sm font-bold mb-3">対戦コードを入力</label>
                                <input
                                    type="text"
                                    value={inputCode}
                                    onChange={(e) => setInputCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="6ケタのコード"
                                    className="w-full bg-black/60 border-2 border-pink-500/50 rounded-xl px-6 py-4 text-center text-4xl font-black text-white outline-none focus:border-pink-400 transition-all placeholder:text-gray-700 font-mono tracking-widest"
                                    maxLength={6}
                                    autoFocus
                                />
                            </div>

                            <button
                                onClick={handleJoinRoom}
                                disabled={inputCode.length !== 6 || status === 'CONNECTING'}
                                className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 disabled:from-gray-700 disabled:to-gray-800 disabled:text-gray-500 text-white font-black py-4 rounded-xl shadow-lg transition-all transform hover:scale-105 active:scale-95 disabled:scale-100 text-xl flex items-center justify-center gap-2"
                            >
                                {status === 'CONNECTING' ? (
                                    <>
                                        <Loader size={24} className="animate-spin" />
                                        接続中...
                                    </>
                                ) : (
                                    '参加する'
                                )}
                            </button>

                            {errorMsg && (
                                <div className="mt-6 p-4 bg-red-900/50 border border-red-500 rounded-xl flex items-center gap-2 text-red-200 text-sm">
                                    <AlertCircle size={20} />
                                    <span>{errorMsg}</span>
                                </div>
                            )}
                        </>
                    ) : opponentPlayer ? (
                        <div className="bg-green-900/50 border-2 border-green-500 rounded-2xl p-6 animate-in zoom-in duration-300">
                            <div className="flex items-center justify-center gap-2 text-green-400 font-black text-xl mb-4">
                                <Sparkles size={24} />
                                接続成功！
                                <Sparkles size={24} />
                            </div>
                            <button
                                onClick={handleStartBattle}
                                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-black py-4 rounded-xl shadow-lg transition-all transform hover:scale-105 active:scale-95 text-xl"
                            >
                                対戦開始！
                            </button>
                        </div>
                    ) : (
                        <div className="bg-pink-900/30 border border-pink-500/50 rounded-2xl p-6 text-center">
                            <Loader size={32} className="text-pink-400 mx-auto mb-3 animate-spin" />
                            <p className="text-pink-300 font-bold">ハンドシェイク中...</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return null;
};

export default P2PBattleSetup;

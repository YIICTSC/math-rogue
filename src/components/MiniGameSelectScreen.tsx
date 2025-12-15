
import React, { useState, useRef } from 'react';
import { ArrowLeft, Club, Gamepad2, Skull, Compass, Mountain, AlertTriangle, Trash2, Sword, Send } from 'lucide-react';
import { storageService } from '../services/storageService';
import { audioService } from '../services/audioService';

interface MiniGameSelectScreenProps {
  onSelect: (gameId: string) => void;
  onBack: () => void;
}

const MiniGameSelectScreen: React.FC<MiniGameSelectScreenProps> = ({ onSelect, onBack }) => {
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const longPressTimer = useRef<any>(null);
  const isLongPress = useRef(false);

  const handlePressStart = (gameId: string) => {
      isLongPress.current = false;
      longPressTimer.current = setTimeout(() => {
          isLongPress.current = true;
          setDeleteTarget(gameId);
          audioService.playSound('wrong');
      }, 800); // 0.8s long press
  };

  const handlePressEnd = (e: React.MouseEvent | React.TouchEvent, gameId: string) => {
      if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
      }
      
      if (isLongPress.current) {
          e.preventDefault();
          return;
      }
      
      // Normal click
      onSelect(gameId);
  };

  const handleCancelPress = () => {
      if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
      }
  };

  const confirmDelete = () => {
      if (!deleteTarget) return;
      
      if (deleteTarget === 'POKER') {
          storageService.clearPokerState();
      } else if (deleteTarget === 'DUNGEON') {
          storageService.clearDungeonState();
      } else if (deleteTarget === 'DUNGEON_2') {
          storageService.clearDungeonState2();
      } else if (deleteTarget === 'KOCHO') {
          storageService.clearKochoState();
      } else if (deleteTarget === 'PAPER_PLANE') {
          storageService.clearPaperPlaneState();
      }
      // Survivor has no suspend state to clear currently
      
      audioService.playSound('buff');
      setDeleteTarget(null);
  };

  const getTargetName = (id: string) => {
      switch(id) {
          case 'POKER': return '放課後ポーカー';
          case 'SURVIVOR': return '校庭サバイバー';
          case 'DUNGEON': return '風来の小学生';
          case 'DUNGEON_2': return '風来の小学生2';
          case 'KOCHO': return '校長対決';
          case 'PAPER_PLANE': return '紙飛行機バトル';
          default: return '';
      }
  };

  const bindPress = (gameId: string) => ({
      onMouseDown: () => handlePressStart(gameId),
      onMouseUp: (e: React.MouseEvent) => handlePressEnd(e, gameId),
      onMouseLeave: handleCancelPress,
      onTouchStart: () => handlePressStart(gameId),
      onTouchEnd: (e: React.TouchEvent) => handlePressEnd(e, gameId),
      onTouchMove: handleCancelPress
  });

  return (
    <div className="flex flex-col h-full w-full bg-gray-900 text-white relative">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-30 pointer-events-none"></div>
      
      {/* Delete Confirmation Modal */}
      {deleteTarget && (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-gray-800 border-2 border-red-500 p-6 rounded-lg max-w-sm w-full shadow-2xl text-center">
                  <AlertTriangle size={48} className="text-red-500 mx-auto mb-4 animate-bounce" />
                  <h3 className="text-xl font-bold text-white mb-2">セーブデータを削除しますか？</h3>
                  <p className="text-sm text-gray-300 mb-6">
                      「{getTargetName(deleteTarget)}」の中断データを削除して最初からやり直します。
                      <br/><span className="text-red-400 text-xs">(この操作は取り消せません)</span>
                  </p>
                  <div className="flex gap-4 justify-center">
                      <button 
                          onClick={confirmDelete} 
                          className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded font-bold flex items-center transition-colors shadow-lg"
                      >
                          <Trash2 size={16} className="mr-2"/> 削除する
                      </button>
                      <button 
                          onClick={() => setDeleteTarget(null)} 
                          className="bg-gray-600 hover:bg-gray-500 text-white px-6 py-2 rounded font-bold transition-colors"
                      >
                          キャンセル
                      </button>
                  </div>
              </div>
          </div>
      )}

      <div className="z-10 w-full h-full flex flex-col items-center p-4 overflow-y-auto custom-scrollbar">
        <div className="w-full max-w-5xl flex flex-col items-center min-h-full justify-start md:justify-center py-8 md:py-4">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 animate-pulse flex items-center shrink-0">
                <Gamepad2 className="mr-2 md:mr-3 text-yellow-400" size={28} /> ミニゲーム選択
            </h2>
            <p className="text-xs text-gray-500 mb-6 animate-pulse text-center">※ボタン長押しでセーブデータを削除できます</p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full mb-8 shrink-0 px-1 md:px-2">
                
                {/* Paper Plane Game Card (NEW) */}
                <button
                    {...bindPress('PAPER_PLANE')}
                    className="group relative bg-sky-900 border-4 border-sky-500 hover:border-white hover:bg-sky-800 p-2 md:p-4 rounded-xl flex flex-col md:flex-row items-center justify-center md:justify-start text-center md:text-left transition-all shadow-xl hover:shadow-[0_0_20px_rgba(14,165,233,0.4)] overflow-hidden h-36 md:h-32"
                >
                    <div className="absolute top-0 right-0 bg-sky-600 text-white text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded-bl-lg shadow-md flex items-center gap-1 z-10">FIGHT</div>
                    <div className="bg-sky-950/50 p-2 md:p-3 rounded-full mb-2 md:mb-0 md:mr-3 group-hover:scale-110 transition-transform duration-300 border-2 border-sky-500/30 shrink-0">
                        <Send size={24} className="text-sky-300 fill-current md:w-7 md:h-7" />
                    </div>
                    <div className="flex flex-col items-center md:items-start w-full">
                        <span className="text-sm md:text-lg font-bold mb-1 text-sky-100 group-hover:text-white font-mono transition-colors block">紙飛行機バトル</span>
                        <span className="text-[9px] md:text-[10px] text-sky-200/70 leading-tight block font-mono">
                            自分だけの紙飛行機で勝ち進め！<br className="hidden md:inline"/>ビルド＆撃ち合いバトル。
                        </span>
                    </div>
                </button>

                {/* Kocho Showdown Game Card */}
                <button
                    {...bindPress('KOCHO')}
                    className="group relative bg-[#1a1a2e] border-4 border-indigo-500 hover:border-pink-500 hover:bg-indigo-900 p-2 md:p-4 rounded-xl flex flex-col md:flex-row items-center justify-center md:justify-start text-center md:text-left transition-all shadow-xl hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] overflow-hidden h-36 md:h-32"
                >
                    <div className="absolute top-0 right-0 bg-pink-600 text-white text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded-bl-lg shadow-md flex items-center gap-1 z-10">STRATEGY</div>
                    <div className="bg-indigo-900/50 p-2 md:p-3 rounded-full mb-2 md:mb-0 md:mr-3 group-hover:scale-110 transition-transform duration-300 border-2 border-indigo-500/30 shrink-0">
                        <Sword size={24} className="text-pink-400 fill-current md:w-7 md:h-7" />
                    </div>
                    <div className="flex flex-col items-center md:items-start w-full">
                        <span className="text-sm md:text-lg font-bold mb-1 text-indigo-200 group-hover:text-white font-mono transition-colors block">校長対決</span>
                        <span className="text-[9px] md:text-[10px] text-indigo-300 leading-tight block font-mono">
                            ターン制戦略バトル。<br className="hidden md:inline"/>行動を予約して敵を倒せ！
                        </span>
                    </div>
                </button>

                {/* Poker Game Card */}
                <button
                    {...bindPress('POKER')}
                    className="group relative bg-slate-800 border-4 border-slate-600 hover:border-purple-500 hover:bg-slate-700 p-2 md:p-4 rounded-xl flex flex-col md:flex-row items-center justify-center md:justify-start text-center md:text-left transition-all shadow-xl hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] overflow-hidden h-36 md:h-32"
                >
                    <div className="absolute top-0 right-0 bg-purple-600 text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded-bl-lg shadow-md z-10">POPULAR</div>
                    <div className="bg-purple-900/50 p-2 md:p-3 rounded-full mb-2 md:mb-0 md:mr-3 group-hover:scale-110 transition-transform duration-300 border-2 border-purple-500/30 shrink-0">
                        <Club size={24} className="text-purple-400 fill-current md:w-7 md:h-7" />
                    </div>
                    <div className="flex flex-col items-center md:items-start w-full">
                        <span className="text-sm md:text-lg font-bold mb-1 text-white group-hover:text-purple-300 transition-colors block">放課後ポーカー</span>
                        <span className="text-[9px] md:text-[10px] text-gray-400 group-hover:text-gray-200 leading-tight block">
                            役を作ってスコアを稼げ！<br className="hidden md:inline"/>アイテムを駆使するローグライク。
                        </span>
                    </div>
                </button>

                {/* Survivor Game Card */}
                <button
                    {...bindPress('SURVIVOR')}
                    className="group relative bg-slate-800 border-4 border-slate-600 hover:border-red-500 hover:bg-slate-700 p-2 md:p-4 rounded-xl flex flex-col md:flex-row items-center justify-center md:justify-start text-center md:text-left transition-all shadow-xl hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] overflow-hidden h-36 md:h-32"
                >
                    <div className="absolute top-0 right-0 bg-red-600 text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded-bl-lg shadow-md z-10">ACTION</div>
                    <div className="bg-red-900/50 p-2 md:p-3 rounded-full mb-2 md:mb-0 md:mr-3 group-hover:scale-110 transition-transform duration-300 border-2 border-red-500/30 shrink-0">
                        <Skull size={24} className="text-red-400 fill-current md:w-7 md:h-7" />
                    </div>
                    <div className="flex flex-col items-center md:items-start w-full">
                        <span className="text-sm md:text-lg font-bold mb-1 text-white group-hover:text-red-300 transition-colors block">校庭サバイバー</span>
                        <span className="text-[9px] md:text-[10px] text-gray-400 group-hover:text-gray-200 leading-tight block">
                            迫りくる敵の大群から生き残れ！<br className="hidden md:inline"/>ヴァンサバ風アクション。
                        </span>
                    </div>
                </button>

                {/* Dungeon Game Card */}
                <button
                    {...bindPress('DUNGEON')}
                    className="group relative bg-[#0f380f] border-4 border-[#306230] hover:border-[#8bac0f] p-2 md:p-4 rounded-xl flex flex-col md:flex-row items-center justify-center md:justify-start text-center md:text-left transition-all shadow-xl hover:shadow-[0_0_20px_rgba(139,172,15,0.4)] overflow-hidden h-36 md:h-32"
                >
                    <div className="absolute top-0 right-0 bg-[#306230] text-[#9bbc0f] text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded-bl-lg shadow-md flex items-center gap-1 z-10">RETRO</div>
                    <div className="bg-[#306230] p-2 md:p-3 rounded-full mb-2 md:mb-0 md:mr-3 group-hover:scale-110 transition-transform duration-300 border-2 border-[#8bac0f] shrink-0">
                        <Compass size={24} className="text-[#9bbc0f] fill-current md:w-7 md:h-7" />
                    </div>
                    <div className="flex flex-col items-center md:items-start w-full">
                        <span className="text-sm md:text-lg font-bold mb-1 text-[#9bbc0f] font-mono transition-colors block">風来の小学生</span>
                        <span className="text-[9px] md:text-[10px] text-[#8bac0f] leading-tight block font-mono">
                            1000回遊べるランダムダンジョン。<br className="hidden md:inline"/>GB風ローグライクRPG。
                        </span>
                    </div>
                </button>

                {/* Dungeon 2 Game Card */}
                <button
                    {...bindPress('DUNGEON_2')}
                    className="group relative bg-[#202020] border-4 border-cyan-700 hover:border-cyan-400 p-2 md:p-4 rounded-xl flex flex-col md:flex-row items-center justify-center md:justify-start text-center md:text-left transition-all shadow-xl hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] overflow-hidden h-36 md:h-32"
                >
                    <div className="absolute top-0 right-0 bg-cyan-700 text-white text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded-bl-lg shadow-md flex items-center gap-1 z-10">SEQUEL</div>
                    <div className="bg-cyan-900 p-2 md:p-3 rounded-full mb-2 md:mb-0 md:mr-3 group-hover:scale-110 transition-transform duration-300 border-2 border-cyan-500 shrink-0">
                        <Mountain size={24} className="text-cyan-400 fill-current md:w-7 md:h-7" />
                    </div>
                    <div className="flex flex-col items-center md:items-start w-full">
                        <span className="text-sm md:text-lg font-bold mb-1 text-cyan-200 font-mono transition-colors block">風来の小学生2</span>
                        <span className="text-[9px] md:text-[10px] text-gray-400 leading-tight block font-mono">
                            更なる深淵へ...<br className="hidden md:inline"/>進化したローグライクRPG。
                        </span>
                    </div>
                </button>
            </div>

            <button 
                onClick={onBack} 
                className="text-gray-400 hover:text-white flex items-center border-b border-transparent hover:border-white transition-colors text-base py-2 mt-auto shrink-0"
            >
                <ArrowLeft className="mr-2" size={20} /> タイトルへ戻る
            </button>
        </div>
      </div>
    </div>
  );
};

export default MiniGameSelectScreen;

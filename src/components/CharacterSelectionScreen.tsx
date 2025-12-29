
import React from 'react';
import { Character, LanguageMode } from '../types';
import { Lock, Heart, Coins, Gem, ArrowRight, Swords, Shield, Zap, Sparkles, Brain, GraduationCap } from 'lucide-react';
import { RELIC_LIBRARY, CARDS_LIBRARY } from '../constants';
import { trans } from '../utils/textUtils';

interface CharacterSelectionScreenProps {
  characters: Character[];
  unlockedCount: number;
  onSelect: (character: Character) => void;
  challengeMode?: string;
  languageMode: LanguageMode;
}

const CharacterSelectionScreen: React.FC<CharacterSelectionScreenProps> = ({ characters, unlockedCount, onSelect, challengeMode, languageMode }) => {
  return (
    <div className="flex flex-col h-full w-full bg-gray-900 text-white relative overflow-hidden">
      
      <div className="z-10 flex flex-col items-center justify-start h-full p-4 pt-8 overflow-y-auto custom-scrollbar">
        <div className="text-center mb-8 shrink-0">
            <h2 className="text-3xl md:text-4xl text-yellow-400 font-bold mb-2 flex items-center justify-center animate-pulse">
             {trans("主人公選択", languageMode)}
            </h2>
            {challengeMode === '1A1D' ? (
                <div className="bg-red-900/50 border border-red-500 p-2 rounded inline-block animate-in fade-in zoom-in duration-300">
                    <p className="text-sm text-red-200 font-bold mb-1">【{trans("1A1Dモード", languageMode)}】</p>
                    <p className="text-xs text-red-100">{trans("初期レリックのみ所持。デッキはランダムなアタック1枚・スキル1枚でスタート。", languageMode)}</p>
                </div>
            ) : (
                <p className="text-sm text-gray-400">{trans("冒険に挑むキャラクターを選んでください", languageMode)}</p>
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl pb-20">
            {characters.map((char, index) => {
                const isUnlocked = index < unlockedCount;
                const relic = RELIC_LIBRARY[char.startingRelicId];
                
                const colorMap: Record<string, string> = {
                    'red': 'border-red-600 bg-red-950/40 hover:bg-red-900/60 shadow-red-900/20',
                    'green': 'border-green-600 bg-green-950/40 hover:bg-green-900/60 shadow-green-900/20',
                    'blue': 'border-blue-600 bg-blue-950/40 hover:bg-blue-900/60 shadow-blue-900/20',
                    'purple': 'border-purple-600 bg-purple-950/40 hover:bg-purple-900/60 shadow-purple-900/20',
                    'gray': 'border-gray-600 bg-gray-900/40 hover:bg-gray-800/60 shadow-gray-900/20',
                    'yellow': 'border-yellow-600 bg-yellow-950/40 hover:bg-yellow-900/60 shadow-yellow-900/20',
                    'orange': 'border-orange-600 bg-orange-950/40 hover:bg-orange-900/60 shadow-orange-900/20',
                    'cyan': 'border-cyan-600 bg-cyan-950/40 hover:bg-cyan-900/60 shadow-cyan-900/20',
                    'pink': 'border-pink-600 bg-pink-950/40 hover:bg-pink-900/60 shadow-pink-900/20',
                    'lime': 'border-lime-600 bg-lime-950/40 hover:bg-lime-900/60 shadow-lime-900/20',
                    'amber': 'border-amber-600 bg-amber-950/40 hover:bg-amber-900/60 shadow-amber-900/20',
                };
                
                const baseClass = `relative border-4 rounded-2xl p-5 transition-all duration-300 flex flex-col items-center ${isUnlocked ? 'cursor-pointer hover:-translate-y-2 shadow-2xl scale-100 active:scale-95' : 'opacity-60 cursor-not-allowed grayscale'}`;
                const colorClass = isUnlocked ? (colorMap[char.color] || 'border-gray-600') : 'border-gray-700 bg-gray-900';

                return (
                    <div 
                        key={char.id} 
                        className={`${baseClass} ${colorClass}`}
                        onClick={() => isUnlocked && onSelect(char)}
                    >
                        {!isUnlocked && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-20 rounded-xl">
                                <Lock size={48} className="text-gray-500 mb-3" />
                                <span className="text-gray-400 font-black text-xl tracking-widest">{trans("LOCKED", languageMode)}</span>
                                <span className="text-sm text-gray-500 mt-2">{trans("クリア回数", languageMode)}: {index}{trans("回で解放", languageMode)}</span>
                            </div>
                        )}

                        <div className="w-24 h-24 mb-4 relative drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                             <img 
                                src={char.imageData} 
                                alt={char.name} 
                                className="w-full h-full pixel-art" 
                                style={{ imageRendering: 'pixelated' }}
                             />
                        </div>

                        <div className="w-full flex justify-between items-center mb-3 border-b-2 border-white/10 pb-2">
                            <h3 className="text-xl font-black text-white truncate">{trans(char.name, languageMode)}</h3>
                            <div className="flex gap-2 text-xs font-bold">
                                <span className="flex items-center text-red-400"><Heart size={14} className="mr-1 fill-current"/> {char.maxHp}</span>
                                <span className="flex items-center text-yellow-400"><Coins size={14} className="mr-1"/> {char.gold}</span>
                            </div>
                        </div>

                        <p className="text-xs text-gray-100 font-bold mb-5 text-center leading-relaxed bg-black/30 p-2 rounded-lg w-full">
                            {trans(char.description, languageMode)}
                        </p>

                        {/* Character Details Grid */}
                        <div className="w-full grid grid-cols-1 gap-3 mb-6">
                            {/* Special Mechanic */}
                            <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex items-start">
                                <div className="bg-indigo-500/20 p-1.5 rounded-lg mr-3 mt-0.5">
                                    <Sparkles size={16} className="text-indigo-400" />
                                </div>
                                <div className="text-left">
                                    <div className="text-[10px] text-indigo-300 font-black uppercase tracking-tighter mb-0.5">{trans("固有ギミック", languageMode)}</div>
                                    <div className="text-[11px] text-gray-300 font-bold leading-snug">
                                        {char.id === 'WARRIOR' && trans('戦闘後の体力回復による高い生存能力。', languageMode)}
                                        {char.id === 'CARETAKER' && trans('倒した敵を仲間の攻撃カードとして「捕獲」。', languageMode)}
                                        {char.id === 'ASSASSIN' && trans('毒による固定ダメージ。初期相棒との共闘。', languageMode)}
                                        {char.id === 'MAGE' && trans('理科室での「3枚合成」。3つの効果を併せ持つ最強のキメラを作成可能。', languageMode)}
                                        {char.id === 'DODGEBALL' && trans('ドロー＆ディスカード。ミニゲームでの敵撃破。', languageMode)}
                                        {char.id === 'BARD' && trans('デバフ管理と、敵の攻撃を反射する「応答」。', languageMode)}
                                        {char.id === 'LIBRARIAN' && trans('手札の「保留」と、強力な物語カードの活用。', languageMode)}
                                        {char.id === 'CHEF' && trans('献立（初期デッキ）の自由にカスタマイズ。', languageMode)}
                                        {char.id === 'GARDENER' && trans('菜園での種まきと強力な植物カードへの進化。', languageMode)}
                                    </div>
                                </div>
                            </div>

                            {/* Starting Relic Detail */}
                            <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex items-start">
                                <div className="bg-yellow-500/20 p-1.5 rounded-lg mr-3 mt-0.5">
                                    <Gem size={16} className="text-yellow-400" />
                                </div>
                                <div className="text-left">
                                    <div className="text-[10px] text-yellow-300 font-black uppercase tracking-tighter mb-0.5">{trans("初期装備", languageMode)}</div>
                                    <div className="text-xs text-white font-black truncate">{relic ? trans(relic.name, languageMode) : '???'}</div>
                                    <div className="text-[10px] text-gray-400 font-bold leading-tight mt-0.5">
                                        {relic ? trans(relic.description, languageMode) : ''}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {isUnlocked && (
                            <div className="mt-auto w-full bg-white/10 group-hover:bg-white/20 text-center py-3 rounded-xl font-black text-white flex items-center justify-center transition-all border border-white/20">
                                {trans("選択", languageMode)} <ArrowRight size={18} className="ml-2 animate-bounce-x" />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
      </div>
      <style>{`
        @keyframes bounce-x {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(5px); }
        }
        .animate-bounce-x {
          animation: bounce-x 1s infinite;
        }
      `}</style>
    </div>
  );
};

export default CharacterSelectionScreen;

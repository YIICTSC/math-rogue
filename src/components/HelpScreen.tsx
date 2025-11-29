
import React from 'react';
import { ArrowLeft, Book, Map, Sword, Brain, Flame, ShoppingBag, Skull, Gift, HelpCircle, BedDouble } from 'lucide-react';

interface HelpScreenProps {
  onBack: () => void;
}

const HelpScreen: React.FC<HelpScreenProps> = ({ onBack }) => {
  return (
    <div className="flex flex-col h-full w-full bg-gray-900 text-white relative">
        {/* Header */}
        <div className="z-10 bg-black border-b-2 border-gray-600 p-4 flex justify-between items-center shrink-0">
            <div className="flex items-center">
                <Book size={24} className="text-yellow-400 mr-2" />
                <h2 className="text-xl font-bold text-yellow-100">遊び方 & 用語集</h2>
            </div>
            <button 
                onClick={onBack}
                className="flex items-center bg-gray-700 hover:bg-gray-600 border border-gray-400 px-4 py-2 rounded text-white transition-colors text-sm"
            >
                <ArrowLeft size={16} className="mr-2" /> 戻る
            </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-4 md:p-8 custom-scrollbar">
            <div className="max-w-3xl mx-auto space-y-8 pb-8">
                
                {/* Intro */}
                <div className="bg-gray-800/80 p-6 rounded-lg border-2 border-yellow-600 shadow-lg">
                    <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center">
                        <Map className="mr-2" /> 伝説の小学生を目指せ！
                    </h3>
                    <p className="text-sm text-gray-300 leading-relaxed">
                        このゲームは、算数の力とデッキ構築でダンジョンを攻略するローグライクRPGです。<br/>
                        カードを集め、レリック（宝物）を手に入れ、最強のデッキを作り上げましょう。<br/>
                        最深部（Act 4）に潜むボスを倒すことが最終目標です。
                    </p>
                </div>

                {/* Combat & Math */}
                <section className="bg-gray-800 p-5 rounded border border-gray-700">
                    <h3 className="text-lg font-bold text-red-400 mb-4 border-b border-gray-600 pb-2 flex items-center">
                        <Sword className="mr-2" /> 戦闘と算数
                    </h3>
                    <ul className="list-disc list-inside text-sm text-gray-300 space-y-2 mb-4">
                        <li><span className="font-bold text-white">エナジー:</span> カードを使うためのコスト。毎ターン回復します。</li>
                        <li><span className="font-bold text-white">バリア（ブロック）:</span> 敵の攻撃を防ぐ盾。ターン終了時に消えます。</li>
                        <li><span className="font-bold text-white">敵の意図:</span> 敵の頭上のアイコンを見て、攻撃を防ぐか攻めるか判断しましょう。</li>
                    </ul>
                    
                    <div className="bg-blue-900/30 p-4 rounded border border-blue-500/50 flex items-start">
                        <Brain size={24} className="text-cyan-400 mr-3 shrink-0 mt-1"/>
                        <div>
                            <h4 className="text-cyan-400 font-bold mb-1">算数ボーナス</h4>
                            <p className="text-xs text-gray-300">
                                戦闘に勝利すると<span className="text-yellow-300 font-bold">算数チャレンジ</span>が発生！<br/>
                                計算問題を正解するとボーナスゴールドを獲得でき、冒険が有利になります。
                            </p>
                        </div>
                    </div>
                </section>

                {/* Rest Site Features */}
                <section className="bg-gray-800 p-5 rounded border border-gray-700">
                    <h3 className="text-lg font-bold text-orange-400 mb-4 border-b border-gray-600 pb-2 flex items-center">
                        <Flame className="mr-2" /> 休憩所でできること
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="bg-black/40 p-3 rounded text-center">
                            <div className="font-bold text-green-400 mb-1">休憩</div>
                            <p className="text-xs text-gray-400">HPを30%回復します。<br/>傷ついた体を癒やしましょう。</p>
                        </div>
                        <div className="bg-black/40 p-3 rounded text-center">
                            <div className="font-bold text-yellow-400 mb-1">工夫（強化）</div>
                            <p className="text-xs text-gray-400">カードを1枚アップグレード。<br/>威力が増したりコストが減ります。</p>
                        </div>
                        <div className="bg-black/40 p-3 rounded text-center border border-purple-500/50">
                            <div className="font-bold text-purple-400 mb-1">実験（合成）</div>
                            <p className="text-xs text-gray-400">
                                任意の2枚を合体！<br/>
                                <span className="text-purple-200">コストは足し算、効果は両取り</span>の<br/>
                                キメラカードを作成できます。
                            </p>
                        </div>
                    </div>
                </section>

                {/* Keywords */}
                <section className="bg-gray-800 p-5 rounded border border-gray-700">
                    <h3 className="text-lg font-bold text-green-400 mb-4 border-b border-gray-600 pb-2">
                        キーワード解説
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                        <div>
                            <span className="font-bold text-red-400">モリモリ (筋力)</span>
                            <p className="text-xs text-gray-400">攻撃ダメージが数値分アップ。</p>
                        </div>
                        <div>
                            <span className="font-bold text-pink-400">ボロボロ (脆弱)</span>
                            <p className="text-xs text-gray-400">受けるダメージが50%増加。</p>
                        </div>
                        <div>
                            <span className="font-bold text-gray-400">ヘロヘロ (弱体)</span>
                            <p className="text-xs text-gray-400">与えるダメージが25%減少。</p>
                        </div>
                        <div>
                            <span className="font-bold text-green-500">ドクドク (毒)</span>
                            <p className="text-xs text-gray-400">ターン終了時にダメージ。数値が1減る。</p>
                        </div>
                        <div>
                            <span className="font-bold text-orange-500">チクチク (トゲ)</span>
                            <p className="text-xs text-gray-400">攻撃を受けると相手にダメージ。</p>
                        </div>
                        <div>
                            <span className="font-bold text-gray-500">ポイ (廃棄)</span>
                            <p className="text-xs text-gray-400">使用するとその戦闘中はデッキから消滅。</p>
                        </div>
                        <div>
                            <span className="font-bold text-yellow-500">ガード (アーティファクト)</span>
                            <p className="text-xs text-gray-400">デバフを1回無効化。</p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    </div>
  );
};

export default HelpScreen;

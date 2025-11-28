
import React from 'react';
import { ArrowLeft, Book, Map, Sword, Brain, Flame, ShoppingBag } from 'lucide-react';

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
            <div className="max-w-3xl mx-auto space-y-6 pb-8">
                
                {/* Intro */}
                <div className="bg-gray-800/80 p-6 rounded-lg border-2 border-yellow-600 shadow-lg">
                    <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center">
                        <Map className="mr-2" /> ゲームの目的
                    </h3>
                    <p className="text-sm text-gray-300 leading-relaxed">
                        「ピクセル・スパイア」は、ローグライク要素とデッキ構築を組み合わせたRPGです。<br/>
                        マップを進みながらカードやレリック（遺物）を集め、最強のデッキを作り上げましょう。<br/>
                        最深部（Act 4）に潜む「堕落の心臓」を撃破することが最終目標です。
                    </p>
                </div>

                {/* Map Icons */}
                <section className="bg-gray-800 p-4 rounded border border-gray-700">
                    <h3 className="text-lg font-bold text-blue-300 mb-4 border-b border-gray-600 pb-2">
                        マップアイコンの意味
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
                        <div className="flex items-start">
                            <span className="bg-white text-black p-1 rounded mr-2 font-bold text-xs">敵</span>
                            <div>
                                <span className="font-bold text-white">戦闘</span>
                                <p className="text-xs text-gray-400">通常の敵と戦います。勝利するとカード報酬とゴールドを得られます。</p>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <span className="bg-red-900 text-red-200 p-1 rounded mr-2 font-bold text-xs border border-red-500">骸骨</span>
                            <div>
                                <span className="font-bold text-red-400">エリート</span>
                                <p className="text-xs text-gray-400">強力な敵です。勝利すると「レリック」を必ずドロップします。</p>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <span className="bg-yellow-900 text-yellow-200 p-1 rounded mr-2 font-bold text-xs border border-yellow-500">宝</span>
                            <div>
                                <span className="font-bold text-yellow-400">お宝</span>
                                <p className="text-xs text-gray-400">レリックや大量のゴールドが入った宝箱を開けます。</p>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <span className="bg-blue-900 text-blue-200 p-1 rounded mr-2 font-bold text-xs border border-blue-500">？</span>
                            <div>
                                <span className="font-bold text-blue-400">イベント</span>
                                <p className="text-xs text-gray-400">様々な出来事が起こります。運次第で吉と出るか凶と出るか...</p>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <span className="bg-green-900 text-green-200 p-1 rounded mr-2 font-bold text-xs border border-green-500">火</span>
                            <div>
                                <span className="font-bold text-green-400">休憩所</span>
                                <p className="text-xs text-gray-400">HP回復、カードの強化（アップグレード）、またはカードの合成を行えます。</p>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <span className="bg-gray-700 text-white p-1 rounded mr-2 font-bold text-xs border border-gray-500">店</span>
                            <div>
                                <span className="font-bold text-gray-300">商人</span>
                                <p className="text-xs text-gray-400">ゴールドを使ってカード、レリック、ポーションの購入や、不要なカードの削除ができます。</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Combat System */}
                <section className="bg-gray-800 p-4 rounded border border-gray-700">
                    <h3 className="text-lg font-bold text-red-400 mb-4 border-b border-gray-600 pb-2 flex items-center">
                        <Sword className="mr-2" /> 戦闘システム
                    </h3>
                    <ul className="list-disc list-inside text-sm text-gray-300 space-y-2 mb-4">
                        <li><span className="font-bold text-white">エナジー:</span> カードを使用するためのコストです。毎ターン最大値まで回復します。</li>
                        <li><span className="font-bold text-white">ブロック:</span> 敵の攻撃ダメージを防ぎます。原則としてターン終了時に消滅します。</li>
                        <li><span className="font-bold text-white">敵の意図:</span> 敵の頭上のアイコンは次の行動を示しています。攻撃が来る場合はブロックを積みましょう。</li>
                    </ul>
                    
                    <div className="bg-black/40 p-3 rounded border border-gray-600 mt-4">
                        <h4 className="text-yellow-400 font-bold mb-2 flex items-center"><Brain size={16} className="mr-2"/> 算数ボーナス</h4>
                        <p className="text-xs text-gray-300">
                            戦闘に勝利した後、簡単な算数の問題が出題されます。<br/>
                            正解すると<span className="text-yellow-400">ボーナスゴールド</span>が手に入り、よりレアリティの高いカード報酬が出現しやすくなります。
                        </p>
                    </div>
                </section>

                {/* Rest Site Features */}
                <section className="bg-gray-800 p-4 rounded border border-gray-700">
                    <h3 className="text-lg font-bold text-orange-400 mb-4 border-b border-gray-600 pb-2 flex items-center">
                        <Flame className="mr-2" /> 休憩所での行動
                    </h3>
                    <div className="space-y-3">
                        <div>
                            <span className="font-bold text-white">休憩:</span>
                            <p className="text-xs text-gray-400">HPを最大値の30%回復します。</p>
                        </div>
                        <div>
                            <span className="font-bold text-white">工夫（強化）:</span>
                            <p className="text-xs text-gray-400">デッキのカードを1枚選び、永続的に性能を向上させます（ダメージ増加、コスト減少など）。</p>
                        </div>
                        <div>
                            <span className="font-bold text-white">実験（合成）:</span>
                            <p className="text-xs text-gray-400">
                                任意のカード2枚を合体させ、1枚の強力なカードを作成します。<br/>
                                <span className="text-yellow-500">コストは足し算、効果は両方を併せ持ちます。</span> デッキ圧縮にも有効です。
                            </p>
                        </div>
                    </div>
                </section>

                {/* Keywords */}
                <section className="bg-gray-800 p-4 rounded border border-gray-700">
                    <h3 className="text-lg font-bold text-green-400 mb-4 border-b border-gray-600 pb-2">
                        キーワード・状態異常
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                        <div>
                            <span className="font-bold text-red-400">筋力 (Strength)</span>
                            <p className="text-xs text-gray-400">攻撃カードのダメージが、筋力の数値分だけ増加します。</p>
                        </div>
                        <div>
                            <span className="font-bold text-blue-400">敏捷性 (Dexterity)</span>
                            <p className="text-xs text-gray-400">ブロックを得るカードの効果が、数値分だけ増加します。</p>
                        </div>
                        <div>
                            <span className="font-bold text-pink-400">脆弱 (Vulnerable)</span>
                            <p className="text-xs text-gray-400">攻撃から受けるダメージが50%増加します。</p>
                        </div>
                        <div>
                            <span className="font-bold text-gray-400">弱体 (Weak)</span>
                            <p className="text-xs text-gray-400">攻撃で与えるダメージが25%減少します。</p>
                        </div>
                        <div>
                            <span className="font-bold text-gray-500">廃棄 (Exhaust)</span>
                            <p className="text-xs text-gray-400">使用するとその戦闘中はデッキから除外され、再利用できなくなります。</p>
                        </div>
                        <div>
                            <span className="font-bold text-green-500">毒 (Poison)</span>
                            <p className="text-xs text-gray-400">ターン終了時に、蓄積された数値分のHPダメージを与えます。その後、数値が1減ります。</p>
                        </div>
                        <div>
                            <span className="font-bold text-yellow-500">アーティファクト</span>
                            <p className="text-xs text-gray-400">次に受けるデバフ（弱体、脆弱、毒など）を1回無効化します。</p>
                        </div>
                        <div>
                            <span className="font-bold text-orange-500">トゲ (Thorns)</span>
                            <p className="text-xs text-gray-400">攻撃を受けた際、攻撃してきた相手に数値分のダメージを与え返します。</p>
                        </div>
                        <div>
                            <span className="font-bold text-purple-400">無形 (Intangible)</span>
                            <p className="text-xs text-gray-400">受けるすべてのダメージが1になります。</p>
                        </div>
                        <div>
                            <span className="font-bold text-gray-300">保持 (Retain)</span>
                            <p className="text-xs text-gray-400">ターン終了時に手札から捨てられず、次のターンに持ち越せます。</p>
                        </div>
                    </div>
                </section>

                {/* Footer Tips */}
                <div className="text-center text-xs text-gray-500 mt-8 bg-black p-2 rounded">
                    Tip: 画面上の敵やプレイヤー、アイコンをタップすると、現在の状態や効果の詳細が表示されます。
                </div>
            </div>
        </div>
    </div>
  );
};

export default HelpScreen;

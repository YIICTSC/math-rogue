import React from 'react';
import { ArrowLeft, Book } from 'lucide-react';

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
            <div className="max-w-2xl mx-auto space-y-8 pb-8">
                
                {/* Basic Flow */}
                <section className="bg-gray-800 p-4 rounded border border-gray-700">
                    <h3 className="text-lg font-bold text-blue-300 mb-2 border-b border-gray-600 pb-1">ゲームの流れ</h3>
                    <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                        <li>このゲームはローグライク・デッキ構築ゲームです。</li>
                        <li>地図上のマスを選んで進み、最深部のボスを目指します。</li>
                        <li>敵との戦闘、イベント、商人との取引を通じてデッキを強化しましょう。</li>
                        <li>HPが0になるとゲームオーバーとなり、最初からやり直しになります。</li>
                    </ul>
                </section>

                {/* Combat */}
                <section className="bg-gray-800 p-4 rounded border border-gray-700">
                    <h3 className="text-lg font-bold text-red-300 mb-2 border-b border-gray-600 pb-1">戦闘システム</h3>
                    <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                        <li>ターン制バトルです。毎ターン、エネルギーと手札がリセットされます。</li>
                        <li>手札のカードをドラッグまたはタップで使用し、敵を攻撃したり防御したりします。</li>
                        <li>敵の頭上には「次の行動」が表示されています。攻撃が来る場合は「防御」でブロックを積みましょう。</li>
                        <li>「ブロック」は次のターン開始時に消滅します（バリケードがない場合）。</li>
                    </ul>
                </section>

                {/* Keywords */}
                <section className="bg-gray-800 p-4 rounded border border-gray-700">
                    <h3 className="text-lg font-bold text-green-300 mb-2 border-b border-gray-600 pb-1">キーワード・効果</h3>
                    <div className="space-y-3">
                        <div>
                            <span className="font-bold text-yellow-400">筋力 (Strength)</span>
                            <p className="text-xs text-gray-400">攻撃カードのダメージが、筋力の数値分だけ増加します。</p>
                        </div>
                        <div>
                            <span className="font-bold text-yellow-400">脆弱 (Vulnerable)</span>
                            <p className="text-xs text-gray-400">攻撃から受けるダメージが50%増加します。</p>
                        </div>
                        <div>
                            <span className="font-bold text-yellow-400">弱体 (Weak)</span>
                            <p className="text-xs text-gray-400">攻撃で与えるダメージが25%減少します。</p>
                        </div>
                        <div>
                            <span className="font-bold text-yellow-400">廃棄 (Exhaust)</span>
                            <p className="text-xs text-gray-400">使用するとその戦闘中はデッキから除外され、再利用できなくなります。</p>
                        </div>
                        <div>
                            <span className="font-bold text-yellow-400">毒 (Poison)</span>
                            <p className="text-xs text-gray-400">ターン終了時に、蓄積された数値分のHPダメージを与えます。その後、数値が1減ります。</p>
                        </div>
                        <div>
                            <span className="font-bold text-yellow-400">アーティファクト (Artifact)</span>
                            <p className="text-xs text-gray-400">次に受けるデバフ（弱体、脆弱、毒など）を1回無効化します。</p>
                        </div>
                        <div>
                            <span className="font-bold text-yellow-400">トゲ (Thorns)</span>
                            <p className="text-xs text-gray-400">攻撃を受けた際、攻撃してきた相手に数値分のダメージを与えます。</p>
                        </div>
                    </div>
                </section>

                <div className="text-center text-xs text-gray-500 mt-8">
                    Tip: 画面上のアイコンやキャラクターをタップすると、詳細が表示されます。
                </div>
            </div>
        </div>
    </div>
  );
};

export default HelpScreen;
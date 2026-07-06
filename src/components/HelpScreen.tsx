
import React from 'react';
import { ArrowLeft, Book, Map, Sword, Brain, Flame, ShoppingBag, Skull, Gift, HelpCircle, BedDouble } from 'lucide-react';
import { LanguageMode } from '../types';
import { trans } from '../utils/textUtils';
import type { VisualThemeId } from '../data/visualThemes';

interface HelpScreenProps {
  onBack: () => void;
  languageMode?: LanguageMode;
  visualTheme?: VisualThemeId;
}

const HELP_COPY: Record<VisualThemeId, {
  introTitle: string;
  introLines: string[];
  finalGoal: string;
  restTitle: string;
  restOptions: Array<{ title: string; body: string; subBody?: string }>;
  mapLabels: {
    normalEnemy: string;
    eliteEnemy: string;
    treasure: string;
    event: string;
    shop: string;
    rest: string;
  };
}> = {
  elementary: {
    introTitle: '伝説の小学生を目指せ！',
    introLines: [
      'このゲームは、学習の力とデッキ構築で放課後の学校（ダンジョン）を攻略するローグライクRPGです。',
      'ユニークなカードやレリック（宝物）を集め、最強のデッキを作り上げましょう。',
    ],
    finalGoal: '最深部（Act 4）に潜む校長先生を説得（撃破）することが最終目標です。',
    restTitle: '特別教室（休憩マス）',
    restOptions: [
      { title: '保健室（休憩）', body: 'ベッドで仮眠をとります。', subBody: 'HPを30%回復します。' },
      { title: '図工室（強化）', body: '道具を改良します。', subBody: 'カード1枚の性能を上げます。' },
      { title: '理科室（合成）', body: '怪しい実験を行います。', subBody: '2枚のカードを混ぜてキメラカードを作成します。' },
    ],
    mapLabels: {
      normalEnemy: '通常の敵（生徒・動物）',
      eliteEnemy: '強敵（先生・上級生）',
      treasure: '宝箱（落とし物）',
      event: 'イベント（ハプニング）',
      shop: '購買部（ショップ）',
      rest: '特別教室（休憩）',
    },
  },
  'high-school': {
    introTitle: '放課後の頂点を目指せ！',
    introLines: [
      '高校編は、部活・委員会・学園の因縁が入り混じる放課後ローグライクです。',
      '個性的なカードやレリックを集め、自分だけの勝ち筋で校内の難局を突破しましょう。',
    ],
    finalGoal: '最深部（Act 4）で待つ校長先生を乗り越えることが最終目標です。',
    restTitle: '放課後スポット（休憩マス）',
    restOptions: [
      { title: '保健室（休憩）', body: '短い休息で態勢を立て直します。', subBody: 'HPを30%回復します。' },
      { title: '部室（強化）', body: '作戦と道具を磨き直します。', subBody: 'カード1枚の性能を上げます。' },
      { title: '実験室（合成）', body: '危ないひらめきを形にします。', subBody: '2枚のカードを混ぜてキメラカードを作成します。' },
    ],
    mapLabels: {
      normalEnemy: '通常の敵（生徒・部活動）',
      eliteEnemy: '強敵（教師・先輩）',
      treasure: '宝箱（忘れ物）',
      event: 'イベント（校内ハプニング）',
      shop: '購買部（ショップ）',
      rest: '放課後スポット（休憩）',
    },
  },
  magic: {
    introTitle: '魔法学園の物語を切り開け！',
    introLines: [
      'マジック編は、魔法少女たちがカードと魔力で試練に挑む学園ファンタジーです。',
      '魔法カードやレリックを集め、変身の力も活かしながら不思議な学園を進みましょう。',
    ],
    finalGoal: '最深部（Act 4）で待つ大魔女校長に立ち向かうことが最終目標です。',
    restTitle: '魔法学園の休息地（休憩マス）',
    restOptions: [
      { title: '癒やしの温室（休憩）', body: '魔力を整えて呼吸を戻します。', subBody: 'HPを30%回復します。' },
      { title: '魔法工房（強化）', body: 'カードに小さな奇跡を刻みます。', subBody: 'カード1枚の性能を上げます。' },
      { title: '錬成室（合成）', body: '魔法と魔法を重ねて新しい形にします。', subBody: '2枚のカードを混ぜてキメラカードを作成します。' },
    ],
    mapLabels: {
      normalEnemy: '通常の敵（使い魔・魔法生徒）',
      eliteEnemy: '強敵（魔導教師・上級使い魔）',
      treasure: '宝箱（魔法の落とし物）',
      event: 'イベント（魔法学園の異変）',
      shop: '魔法購買（ショップ）',
      rest: '魔法学園の休息地（休憩）',
    },
  },
};

const HelpScreen: React.FC<HelpScreenProps> = ({ onBack, languageMode = 'JAPANESE', visualTheme = 'elementary' }) => {
  const copy = HELP_COPY[visualTheme] ?? HELP_COPY.elementary;

  return (
    <div className="main-help-screen flex flex-col h-full w-full bg-gray-900 text-white relative">
        {/* Header */}
        <div className="z-10 bg-black border-b-2 border-gray-600 p-4 flex justify-between items-center shrink-0">
            <div className="flex items-center">
                <Book size={24} className="text-yellow-400 mr-2" />
                <h2 className="text-xl font-bold text-yellow-100">{trans("遊び方 & 用語集", languageMode)}</h2>
            </div>
            <button 
                onClick={onBack}
                className="flex items-center bg-gray-700 hover:bg-gray-600 border border-gray-400 px-4 py-2 rounded text-white transition-colors text-sm"
            >
                <ArrowLeft size={16} className="mr-2" /> {trans("戻る", languageMode)}
            </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-4 md:p-8 custom-scrollbar">
            <div className="max-w-3xl mx-auto space-y-8 pb-8">
                
                {/* Intro */}
                <div className="bg-gray-800/80 p-6 rounded-lg border-2 border-yellow-600 shadow-lg">
                    <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center">
                        <Map className="mr-2" /> {trans(copy.introTitle, languageMode)}
                    </h3>
                    <p className="text-sm text-gray-300 leading-relaxed">
                        {copy.introLines.map((line) => (
                            <React.Fragment key={line}>
                                {trans(line, languageMode)}<br/>
                            </React.Fragment>
                        ))}
                        {trans(copy.finalGoal, languageMode)}
                    </p>
                </div>

                {/* Combat & Math */}
                <section className="bg-gray-800 p-5 rounded border border-gray-700">
                    <h3 className="text-lg font-bold text-red-400 mb-4 border-b border-gray-600 pb-2 flex items-center">
                        <Sword className="mr-2" /> {trans("戦闘と問題", languageMode)}
                    </h3>
                    <ul className="list-disc list-inside text-sm text-gray-300 space-y-2 mb-4">
                        <li><span className="font-bold text-white">{trans("エナジー", languageMode)}:</span> {trans("カードを使うためのコスト。毎ターン回復します。", languageMode)}</li>
                        <li><span className="font-bold text-white">{trans("ブロック", languageMode)}:</span> {trans("敵の攻撃を防ぐ盾。ターン終了時に消えます。", languageMode)}</li>
                        <li><span className="font-bold text-white">{trans("敵の意図", languageMode)}:</span> {trans("敵の頭上のアイコンを見て、攻撃を防ぐか攻めるか判断しましょう。", languageMode)}</li>
                    </ul>
                    
                    <div className="bg-blue-900/30 p-4 rounded border border-blue-500/50 flex items-start">
                        <Brain size={24} className="text-cyan-400 mr-3 shrink-0 mt-1"/>
                        <div>
                            <h4 className="text-cyan-400 font-bold mb-1">{trans("問題ボーナス", languageMode)}</h4>
                            <p className="text-xs text-gray-300">
                                {trans("戦闘に勝利すると学習チャレンジが発生！", languageMode)}<br/>
                                {trans("問題を正解するとボーナスゴールドを獲得でき、冒険が有利になります。", languageMode)}
                            </p>
                        </div>
                    </div>
                </section>

                {/* Rest Site Features */}
                <section className="bg-gray-800 p-5 rounded border border-gray-700">
                    <h3 className="text-lg font-bold text-orange-400 mb-4 border-b border-gray-600 pb-2 flex items-center">
                        <Flame className="mr-2" /> {trans(copy.restTitle, languageMode)}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        {copy.restOptions.map((option, index) => (
                        <div key={option.title} className={`bg-black/40 p-3 rounded text-center ${index === 2 ? 'border border-purple-500/50' : ''}`}>
                            <div className={`font-bold mb-1 ${index === 0 ? 'text-green-400' : index === 1 ? 'text-yellow-400' : 'text-purple-400'}`}>{trans(option.title, languageMode)}</div>
                            <p className="text-xs text-gray-400">
                                {trans(option.body, languageMode)}<br/>
                                {option.subBody && <span className={index === 2 ? 'text-purple-200' : undefined}>{trans(option.subBody, languageMode)}</span>}<br/>
                                {index === 2 && trans("(50%の確率で鍵が開いています)", languageMode)}
                            </p>
                        </div>
                        ))}
                    </div>
                </section>

                {/* Map Icons */}
                <section className="bg-gray-800 p-5 rounded border border-gray-700">
                    <h3 className="text-lg font-bold text-blue-300 mb-4 border-b border-gray-600 pb-2 flex items-center">
                        <Map className="mr-2" /> {trans("マップアイコン", languageMode)}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs text-gray-300">
                        <div className="flex items-center bg-black/30 p-2 rounded">
                            <Sword size={16} className="mr-2 text-gray-400"/> {trans(copy.mapLabels.normalEnemy, languageMode)}
                        </div>
                        <div className="flex items-center bg-black/30 p-2 rounded">
                            <Skull size={16} className="mr-2 text-red-500"/> {trans(copy.mapLabels.eliteEnemy, languageMode)}
                        </div>
                        <div className="flex items-center bg-black/30 p-2 rounded">
                            <Gift size={16} className="mr-2 text-yellow-500"/> {trans(copy.mapLabels.treasure, languageMode)}
                        </div>
                        <div className="flex items-center bg-black/30 p-2 rounded">
                            <HelpCircle size={16} className="mr-2 text-blue-400"/> {trans(copy.mapLabels.event, languageMode)}
                        </div>
                        <div className="flex items-center bg-black/30 p-2 rounded">
                            <ShoppingBag size={16} className="mr-2 text-yellow-600"/> {trans(copy.mapLabels.shop, languageMode)}
                        </div>
                        <div className="flex items-center bg-black/30 p-2 rounded">
                            <BedDouble size={16} className="mr-2 text-green-500"/> {trans(copy.mapLabels.rest, languageMode)}
                        </div>
                    </div>
                </section>

                {/* Keywords */}
                <section className="bg-gray-800 p-5 rounded border border-gray-700">
                    <h3 className="text-lg font-bold text-green-400 mb-4 border-b border-gray-600 pb-2">
                        {trans("キーワード解説", languageMode)}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                        <div>
                            <span className="font-bold text-red-400">{trans("ムキムキ (Strength)", languageMode)}</span>
                            <p className="text-xs text-gray-400">{trans("攻撃ダメージが数値分アップ。", languageMode)}</p>
                        </div>
                        <div>
                            <span className="font-bold text-blue-400">{trans("カチカチ (Dexterity)", languageMode)}</span>
                            <p className="text-xs text-gray-400">{trans("ブロック獲得量が数値分アップ。", languageMode)}</p>
                        </div>
                        <div>
                            <span className="font-bold text-pink-400">{trans("びくびく (Vulnerable)", languageMode)}</span>
                            <p className="text-xs text-gray-400">{trans("受けるダメージが50%増加。", languageMode)}</p>
                        </div>
                        <div>
                            <span className="font-bold text-gray-400">{trans("へろへろ (Weak)", languageMode)}</span>
                            <p className="text-xs text-gray-400">{trans("与えるダメージが25%減少。", languageMode)}</p>
                        </div>
                        <div>
                            <span className="font-bold text-green-500">{trans("ドクドク (Poison)", languageMode)}</span>
                            <p className="text-xs text-gray-400">{trans("ターン終了時にダメージ。数値が1減る。", languageMode)}</p>
                        </div>
                        <div>
                            <span className="font-bold text-orange-500">{trans("トゲトゲ (Thorns)", languageMode)}</span>
                            <p className="text-xs text-gray-400">{trans("攻撃を受けると相手にダメージ。", languageMode)}</p>
                        </div>
                        <div>
                            <span className="font-bold text-gray-500">{trans("廃棄 (Exhaust)", languageMode)}</span>
                            <p className="text-xs text-gray-400">{trans("使用するとその戦闘中はデッキから消滅。", languageMode)}</p>
                        </div>
                        <div>
                            <span className="font-bold text-yellow-500">{trans("キラキラ (Artifact)", languageMode)}</span>
                            <p className="text-xs text-gray-400">{trans("次に受けるデバフを1回ふせぐ。", languageMode)}</p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    </div>
  );
};

export default HelpScreen;

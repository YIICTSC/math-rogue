
import React, { useState, useEffect } from 'react';
import { Player, LanguageMode } from '../types';
import { trans } from '../utils/textUtils';
import { audioService } from '../services/audioService';
import { ChevronRight, Sparkles, BookOpen, Heart } from 'lucide-react';
import { assetUrl } from '../utils/assetPaths';

interface FinalBridgeScreenProps {
  player: Player;
  onComplete: (upgradeType: 'HEAL' | 'APOTHEOSIS' | 'STRENGTH') => void;
  languageMode: LanguageMode;
  visualTheme?: 'elementary' | 'high-school' | 'magic';
}

const FinalBridgeScreen: React.FC<FinalBridgeScreenProps> = ({ player, onComplete, languageMode, visualTheme = 'elementary' }) => {
  const [step, setStep] = useState(0);
  const [showChoices, setShowChoices] = useState(false);

  const elementaryStoryTexts = [
    "ついに、校舎の最上階へと続く『最後の渡り廊下』にたどり着いた...",
    "背後には、これまでに乗り越えてきた数々のテストや宿題の記憶が遠ざかっていく。",
    "前方にそびえ立つ重厚な扉の向こうには、この学校の全てを統べる『校長先生』が待っている。",
    "「君はよく頑張った。だが、本当の試験はこれからだ...」",
    "心の中に、かつてない勇気が湧き上がってくる。最後の準備を整えよう。"
  ];
  const highSchoolStoryTexts = [
    "夜の校舎をつなぐガラス張りのブリッジに、街の光が反射している。",
    "背後には、噂、試験、進路、そして使い魔たちと越えてきた放課後の記憶が残っている。",
    "前方の特別棟には、学園の未来を一つの型へ押し込めようとする『校長』が待っている。",
    "「自由な選択は混乱を生む。だから私が、全員の正解を決める」",
    "その言葉に従えば安全かもしれない。けれど、自分の答えを選ぶために、最後の準備を整えよう。"
  ];
  const magicStoryTexts = [
    "星の神殿へ続く渡り廊下に、九つの魔法陣が静かに灯っている。",
    "背後には、授業、?マスでの出会い、恋と友情、そして変身して越えた戦いの記憶が残っている。",
    "前方の結界の奥には、学園の魔力を束ねようとする『大魔女校長』が待っている。",
    "「あなたの願いも恋も、すべて私の秩序の中に封じましょう」",
    "答えはカードと学びの中にある。最後の準備を整えよう。"
  ];
  const storyTexts = visualTheme === 'high-school'
    ? highSchoolStoryTexts
    : visualTheme === 'magic'
      ? magicStoryTexts
      : elementaryStoryTexts;

  useEffect(() => {
    audioService.playBGM('event');
  }, []);

  const nextStep = () => {
    if (step < storyTexts.length - 1) {
      setStep(step + 1);
      audioService.playSound('select');
    } else {
      setShowChoices(true);
      audioService.playSound('buff');
    }
  };

  return (
    <div
      className="main-final-bridge-screen w-full h-full bg-black bg-cover bg-center flex flex-col items-center justify-center p-8 relative overflow-hidden font-mono"
      style={visualTheme === 'magic' ? { backgroundImage: `url(${assetUrl('sprites/backgrounds/learning-rogue/magic-final-bridge.webp')})` } : undefined}
    >
      {visualTheme === 'magic' && <div className="absolute inset-0 bg-slate-950/45 pointer-events-none" />}
      {/* Background Parallax Stars Effect */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <div 
            key={i}
            className="absolute bg-white rounded-full animate-pulse"
            style={{
              width: Math.random() * 3 + 'px',
              height: Math.random() * 3 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              animationDelay: Math.random() * 5 + 's'
            }}
          />
        ))}
      </div>

      <div className="z-10 max-w-2xl w-full flex flex-col items-center">
        {!showChoices ? (
          <div className="bg-gray-900/80 border-4 border-white p-8 rounded-lg shadow-[0_0_30px_rgba(255,255,255,0.2)] animate-in fade-in zoom-in duration-500">
            <div className="text-xl md:text-2xl text-white leading-relaxed mb-12 min-h-[6rem] flex items-center justify-center text-center">
              {trans(storyTexts[step], languageMode)}
            </div>
            
            <button 
              onClick={nextStep}
              className="w-full flex items-center justify-center gap-2 bg-white text-black py-3 font-bold hover:bg-gray-200 transition-colors"
            >
              {trans("次へ", languageMode)} <ChevronRight />
            </button>
          </div>
        ) : (
          <div className="text-center animate-in slide-in-from-bottom-10 duration-700">
            <h2 className="text-3xl font-bold text-yellow-400 mb-8 tracking-widest drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">
              <span style={{ color: "white" }}>{trans("最後の覚醒", languageMode)}</span>
            </h2>
            <p className="text-gray-300 mb-12 text-sm">{trans("決戦に持ち込む『最後の力』を一つだけ選んでください。", languageMode)}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              <button 
                onClick={() => onComplete('HEAL')}
                className="bg-green-900/40 border-2 border-green-500 p-6 rounded-xl hover:bg-green-800/60 transition-all group flex flex-col items-center gap-4 shadow-lg hover:shadow-green-500/20"
              >
                <Heart size={40} className="text-green-400 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-bold text-lg mb-1 text-white">{trans("友情の絆", languageMode)}</div>
                  <div className="text-[10px] text-gray-400">{trans("最大HP+20", languageMode)}</div>
                </div>
              </button>

              <button 
                onClick={() => onComplete('APOTHEOSIS')}
                className="bg-purple-900/40 border-2 border-purple-500 p-6 rounded-xl hover:bg-purple-800/60 transition-all group flex flex-col items-center gap-4 shadow-lg hover:shadow-purple-500/20"
              >
                <BookOpen size={40} className="text-purple-400 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-bold text-lg mb-1 text-white">{trans("猛勉強の成果", languageMode)}</div>
                  <div className="text-[10px] text-gray-400">{trans("デッキの全カードをアップグレード", languageMode)}</div>
                </div>
              </button>

              <button 
                onClick={() => onComplete('STRENGTH')}
                className="bg-red-900/40 border-2 border-red-500 p-6 rounded-xl hover:bg-red-800/60 transition-all group flex flex-col items-center gap-4 shadow-lg hover:shadow-red-500/20"
              >
                <Sparkles size={40} className="text-red-400 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-bold text-lg mb-1 text-white">{trans("わんぱくの極み", languageMode)}</div>
                  <div className="text-[10px] text-gray-400">{trans("戦闘開始時にムキムキ+3を得る", languageMode)}</div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hero Silhouette at the bottom */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-20 pointer-events-none scale-150">
        <img src={player.imageData} className="pixel-art grayscale brightness-0" style={{ imageRendering: 'pixelated' }} />
      </div>
    </div>
  );
};

export default FinalBridgeScreen;

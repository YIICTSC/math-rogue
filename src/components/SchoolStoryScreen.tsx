
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { ArrowLeft, Send, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import PixelSprite from './PixelSprite';
import { audioService } from '../services/audioService';

interface SchoolStoryScreenProps {
  onBack: () => void;
  playerImageData: string;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface StoryState {
  backgroundKeyword: string;
  backgroundUrl: string;
  storyText: string;
  suggestions: string[];
  emotion: string; // 'neutral', 'scared', 'happy', 'angry'
}

const INITIAL_PROMPT = "あなたは日本の小学校を舞台にしたホラー/ミステリーRPGのゲームマスターです。プレイヤーは夜の学校に迷い込んだ小学生です。物語の導入部分を開始してください。短く、臨場感たっぷりに描写してください。";

const SchoolStoryScreen: React.FC<SchoolStoryScreenProps> = ({ onBack, playerImageData }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [gameState, setGameState] = useState<StoryState>({
    backgroundKeyword: 'school hallway night',
    backgroundUrl: 'https://picsum.photos/seed/school_night/1024/768',
    storyText: '夜の学校。静寂が廊下を支配している...',
    suggestions: ['教室を調べる', '廊下を進む', '耳を澄ます'],
    emotion: 'neutral'
  });
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize Game
  useEffect(() => {
    handleSend(INITIAL_PROMPT, true);
    audioService.playBGM('menu');
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, gameState.storyText]);

  const generateAIResponse = async (userText: string) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const historyText = messages.slice(-6).map(m => `${m.role}: ${m.text}`).join('\n');
      
      const prompt = `
        Context:
        ${historyText}
        User Action: ${userText}

        Task: Continue the story based on the user's action. 
        Setting: Japanese Elementary School at Night. Horror/Mystery theme.
        Style: Engaging, suspenseful, second-person perspective ("You...").
        Language: Japanese.

        Output JSON format:
        {
          "story": "The narrative text (max 200 chars).",
          "locationKeyword": "A single English keyword for the visual location (e.g. 'classroom', 'toilet', 'gym', 'stairs', 'ghost'). Used for image search.",
          "suggestions": ["Short Action 1", "Short Action 2"],
          "emotion": "One of: 'neutral', 'scared', 'happy', 'angry', 'surprised'"
        }
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              story: { type: Type.STRING },
              locationKeyword: { type: Type.STRING },
              suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
              emotion: { type: Type.STRING }
            }
          }
        }
      });

      const data = JSON.parse(response.text || '{}');
      return data;

    } catch (error) {
      console.error("AI Error:", error);
      return null;
    }
  };

  const handleSend = async (text: string, isInit = false) => {
    if ((!text.trim() && !isInit) || isLoading) return;

    setIsLoading(true);
    if (!isInit) {
        setMessages(prev => [...prev, { role: 'user', text }]);
        audioService.playSound('select');
    }
    setInput('');

    const data = await generateAIResponse(text);

    if (data) {
        setGameState(prev => ({
            ...prev,
            storyText: data.story,
            backgroundKeyword: data.locationKeyword,
            backgroundUrl: `https://picsum.photos/seed/${data.locationKeyword}_${Date.now()}/1024/768`,
            suggestions: data.suggestions || [],
            emotion: data.emotion
        }));
        setMessages(prev => [...prev, { role: 'model', text: data.story }]);
    } else {
        setGameState(prev => ({ ...prev, storyText: "通信エラーが発生しました... 何かが妨害しているようです。" }));
    }

    setIsLoading(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
      handleSend(suggestion);
  };

  return (
    <div className="flex flex-col h-full w-full bg-black relative font-sans overflow-hidden">
      
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 transition-opacity duration-1000 bg-gray-900">
          <img 
            key={gameState.backgroundUrl} // Force re-render for fade effect
            src={gameState.backgroundUrl} 
            alt="Background" 
            className="w-full h-full object-cover opacity-60 animate-in fade-in duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 w-full p-4 z-20 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
        <button onClick={onBack} className="text-white flex items-center bg-black/40 px-4 py-2 rounded-full border border-white/20 hover:bg-black/60 transition-colors backdrop-blur-md">
            <ArrowLeft size={20} className="mr-2"/> 戻る
        </button>
        <div className="text-white/80 text-xs font-mono bg-black/40 px-3 py-1 rounded border border-white/10 backdrop-blur-md">
            AI SCHOOL ROGUE
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex flex-col h-full justify-end pb-4 px-4 md:pb-8 md:px-8 max-w-5xl mx-auto w-full">
        
        {/* Character & Visuals */}
        <div className="flex-1 flex items-center justify-center relative min-h-[200px]">
            {/* Character Sprite */}
            <div className={`relative w-48 h-48 md:w-64 md:h-64 transition-transform duration-500 ${gameState.emotion === 'scared' ? 'animate-shake' : 'animate-float'}`}>
                 <img 
                    src={playerImageData} 
                    className="w-full h-full pixel-art drop-shadow-[0_0_20px_rgba(0,0,0,0.8)] filter brightness-110" 
                    alt="Player" 
                 />
                 {gameState.emotion === 'scared' && <div className="absolute -top-4 right-10 text-4xl animate-bounce">💦</div>}
                 {gameState.emotion === 'surprised' && <div className="absolute -top-4 right-10 text-4xl animate-bounce">❗</div>}
            </div>
        </div>

        {/* Story Box (Visual Novel Style) */}
        <div className="bg-black/80 border-2 border-white/30 rounded-xl p-6 mb-4 backdrop-blur-md shadow-2xl relative min-h-[160px] flex flex-col">
            {isLoading && (
                <div className="absolute top-2 right-2 text-yellow-400 animate-pulse flex items-center text-xs">
                    <Sparkles size={12} className="mr-1"/> 生成中...
                </div>
            )}
            <div className="flex-1 overflow-y-auto custom-scrollbar text-lg md:text-xl leading-relaxed text-gray-100 whitespace-pre-wrap font-serif" ref={scrollRef}>
                {gameState.storyText}
            </div>
            
            {/* Suggestions */}
            {!isLoading && (
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/10">
                    {gameState.suggestions.map((s, i) => (
                        <button 
                            key={i} 
                            onClick={() => handleSuggestionClick(s)}
                            className="bg-slate-800/80 hover:bg-slate-700 text-cyan-200 border border-cyan-500/30 px-4 py-2 rounded-full text-sm transition-all hover:scale-105 active:scale-95"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}
        </div>

        {/* Input Area */}
        <div className="flex gap-2 items-center bg-black/60 p-2 rounded-full border border-white/20 backdrop-blur-md">
            <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
                placeholder="行動を入力してください (例: 走って逃げる)..."
                disabled={isLoading}
                className="flex-1 bg-transparent text-white px-4 py-2 outline-none placeholder-gray-500"
                autoFocus
            />
            <button 
                onClick={() => handleSend(input)} 
                disabled={!input.trim() || isLoading}
                className={`p-3 rounded-full transition-all ${!input.trim() || isLoading ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.5)]'}`}
            >
                {isLoading ? <RefreshCw size={20} className="animate-spin"/> : <Send size={20} />}
            </button>
        </div>

      </div>
    </div>
  );
};

export default SchoolStoryScreen;

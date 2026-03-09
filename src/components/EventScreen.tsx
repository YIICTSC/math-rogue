
import React, { useEffect, useMemo, useState } from 'react';
import { HelpCircle, ArrowRight } from 'lucide-react';

interface EventOption {
    text: string;
    action: () => void;
    label: string;
}

interface EventScreenProps {
    title: string;
    description: string;
    options: EventOption[];
    imageKey?: string;
    image?: string;
    resultLog: string | null;
    onContinue: () => void;
    typingMode?: boolean;
}

const EventScreen: React.FC<EventScreenProps> = ({ title, description, options, imageKey, image, resultLog, onContinue, typingMode = false }) => {
  const imageCandidates = useMemo(() => {
    const encodedTitle = encodeURIComponent(imageKey ?? title);
    return [
      `/event-illustrations/${encodedTitle}.webp`,
      `/event-illustrations/${encodedTitle}.png`,
      `/event-illustrations/${encodedTitle}.jpg`,
      `/event-illustrations/${encodedTitle}.jpeg`,
      `/event-illustrations/${encodedTitle}.svg`,
      '/event-illustrations/default.svg'
    ];
  }, [title]);
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    setImageIndex(0);
  }, [imageKey, title]);

  useEffect(() => {
    if (!typingMode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (resultLog) {
        if (e.key === 'Enter') {
          e.preventDefault();
          onContinue();
        }
        return;
      }
      if (e.key >= '1' && e.key <= '9') {
        const option = options[Number(e.key) - 1];
        if (!option) return;
        e.preventDefault();
        option.action();
      } else if (e.key === 'Enter' && options[0]) {
        e.preventDefault();
        options[0].action();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [typingMode, resultLog, options, onContinue]);

  return (
    <div className="flex flex-col h-full w-full bg-gray-900 text-white relative items-center justify-center p-8">
        
        <div className="z-10 max-w-2xl w-full bg-gray-800 border-2 border-gray-600 p-8 rounded-lg shadow-2xl">
            <div className="flex items-center mb-6 border-b border-gray-700 pb-4">
                <div className="bg-purple-900 p-3 rounded-full mr-4 border border-purple-500">
                    <HelpCircle size={32} className="text-purple-300" />
                </div>
                <h2 className="text-3xl font-bold text-purple-100">{title}</h2>
            </div>

            <div className="relative mb-6 h-44 sm:h-56 rounded-xl overflow-hidden border border-purple-400/40 bg-slate-900">
                <img
                    src={imageCandidates[imageIndex]}
                    alt={`${title} thumbnail`}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={() => setImageIndex(prev => Math.min(prev + 1, imageCandidates.length - 1))}
                />
                {image && (
                    <img
                        src={image}
                        alt="主人公"
                        className="absolute left-1 bottom-0 h-[50%] sm:h-[58%] md:h-[64%] object-contain drop-shadow-[0_6px_12px_rgba(0,0,0,0.8)]"
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
            </div>
            
            <div className="text-lg text-gray-300 mb-8 leading-relaxed whitespace-pre-wrap min-h-[6rem]">
                {resultLog ? (
                    <div className="animate-in fade-in duration-500">
                        <p className="text-yellow-300 font-bold mb-2">結果:</p>
                        {resultLog}
                    </div>
                ) : (
                    description
                )}
            </div>

            <div className="flex flex-col gap-4">
                {!resultLog ? (
                    <div className="grid grid-cols-2 gap-3 max-h-[36vh] overflow-y-auto pr-1">
                        {options.map((opt, idx) => (
                            <button 
                                key={idx}
                                onClick={opt.action}
                                className="relative w-full text-center p-3 sm:p-4 bg-black/40 hover:bg-purple-900/40 border border-gray-600 hover:border-purple-400 rounded transition-colors group min-h-[72px] sm:min-h-[88px]"
                            >
                                {typingMode && <span className="absolute right-2 top-2 rounded-full border border-cyan-300 bg-cyan-950/95 px-1.5 py-0.5 text-[10px] font-black text-cyan-200">{idx + 1}</span>}
                                <span className="font-bold text-yellow-400 block group-hover:text-yellow-200 text-base sm:text-lg tracking-wide break-words">
                                    {opt.label}
                                </span>
                            </button>
                        ))}
                    </div>
                ) : (
                    // Result Mode
                    <button 
                        onClick={onContinue}
                        className="w-full text-center p-4 bg-blue-900/40 hover:bg-blue-800/60 border border-blue-500 hover:border-blue-300 rounded transition-colors flex items-center justify-center font-bold text-xl animate-bounce"
                    >
                        進む <ArrowRight className="ml-2" />
                        {typingMode && <span className="ml-3 rounded-full border border-cyan-300 bg-cyan-950/95 px-2 py-0.5 text-[10px] font-black text-cyan-200">Enter</span>}
                    </button>
                )}
            </div>
        </div>
    </div>
  );
};

export default EventScreen;

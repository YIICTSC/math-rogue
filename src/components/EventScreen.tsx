
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
    interactionDisabled?: boolean;
    interactionDisabledMessage?: string;
}

const EventScreen: React.FC<EventScreenProps> = ({ title, description, options, imageKey, image, resultLog, onContinue, typingMode = false, interactionDisabled = false, interactionDisabledMessage }) => {
  const imageCandidates = useMemo(() => {
    const baseUrl = (import.meta as any).env.BASE_URL || '/';
    const encodedTitle = encodeURIComponent(imageKey ?? title);
    return [
      `${baseUrl}event-illustrations/${encodedTitle}.webp`,
      `${baseUrl}event-illustrations/${encodedTitle}.png`,
      `${baseUrl}event-illustrations/${encodedTitle}.jpg`,
      `${baseUrl}event-illustrations/${encodedTitle}.jpeg`,
      `${baseUrl}event-illustrations/${encodedTitle}.svg`,
      `${baseUrl}event-illustrations/default.svg`
    ];
  }, [imageKey, title]);
  const [imageIndex, setImageIndex] = useState(0);
  const [choiceLocked, setChoiceLocked] = useState(false);
  const [continueLocked, setContinueLocked] = useState(false);
  const inputLocked = interactionDisabled || choiceLocked;
  const continueInputLocked = interactionDisabled || continueLocked;

  useEffect(() => {
    setImageIndex(0);
    setChoiceLocked(false);
    setContinueLocked(false);
  }, [imageKey, title]);

  useEffect(() => {
    if (!resultLog) return;
    setChoiceLocked(false);
    setContinueLocked(false);
  }, [resultLog]);

  const handleOptionAction = useCallback((option: EventOption) => {
    if (inputLocked || resultLog) return;
    setChoiceLocked(true);
    try {
      option.action();
    } catch (error) {
      setChoiceLocked(false);
      throw error;
    }
  }, [inputLocked, resultLog]);

  const handleContinueAction = useCallback(() => {
    if (continueInputLocked || !resultLog) return;
    setContinueLocked(true);
    onContinue();
  }, [continueInputLocked, resultLog, onContinue]);

  useEffect(() => {
    if (!typingMode || interactionDisabled) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (resultLog) {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleContinueAction();
        }
        return;
      }
      if (e.key >= '1' && e.key <= '9') {
        const option = options[Number(e.key) - 1];
        if (!option) return;
        e.preventDefault();
        handleOptionAction(option);
      } else if (e.key === 'Enter' && options[0]) {
        e.preventDefault();
        handleOptionAction(options[0]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [typingMode, resultLog, options, interactionDisabled, handleContinueAction, handleOptionAction]);

  return (
    <div className="flex h-full w-full flex-col items-center justify-start overflow-y-auto bg-gray-900 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] text-white relative custom-scrollbar sm:justify-center sm:p-8">
        
        <div className="z-10 my-auto w-full max-w-2xl rounded-lg border-2 border-gray-600 bg-gray-800 p-4 shadow-2xl sm:p-8">
            {interactionDisabled && (
                <div className="mb-4 rounded-lg border border-cyan-500/50 bg-cyan-950/30 px-4 py-3 text-center text-sm font-bold text-cyan-100">
                    {interactionDisabledMessage ?? '他のプレイヤーの選択を待っています'}
                </div>
            )}
            <div className="mb-4 flex items-center border-b border-gray-700 pb-3 sm:mb-6 sm:pb-4">
                <div className="mr-3 rounded-full border border-purple-500 bg-purple-900 p-2 sm:mr-4 sm:p-3">
                    <HelpCircle size={28} className="text-purple-300 sm:h-8 sm:w-8" />
                </div>
                <h2 className="text-2xl font-bold text-purple-100 sm:text-3xl">{title}</h2>
            </div>

            <div className="relative mb-4 h-36 overflow-hidden rounded-xl border border-purple-400/40 bg-slate-900 sm:mb-6 sm:h-56">
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
            
            <div className="mb-6 min-h-[6rem] whitespace-pre-wrap text-base leading-relaxed text-gray-300 sm:mb-8 sm:text-lg">
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
                    <div className="grid max-h-[36vh] grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
                        {options.map((opt, idx) => (
                            <button 
                                key={idx}
                                onClick={() => handleOptionAction(opt)}
                                disabled={inputLocked}
                                className="relative w-full text-center p-3 sm:p-4 bg-black/40 hover:bg-purple-900/40 border border-gray-600 hover:border-purple-400 rounded transition-colors group min-h-[72px] sm:min-h-[88px] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-black/40 disabled:hover:border-gray-600"
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
                        onClick={handleContinueAction}
                        disabled={continueInputLocked}
                        className="w-full text-center p-4 bg-blue-900/40 hover:bg-blue-800/60 border border-blue-500 hover:border-blue-300 rounded transition-colors flex items-center justify-center font-bold text-xl animate-bounce disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-blue-900/40 disabled:hover:border-blue-500"
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

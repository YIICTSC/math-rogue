
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { HelpCircle, ArrowRight } from 'lucide-react';
import { assetUrl } from '../utils/assetPaths';
import { LanguageMode } from '../types';
import { trans } from '../utils/textUtils';
import type { VisualThemeId } from '../data/visualThemes';


const HIGH_SCHOOL_EVENT_IMAGE_POSITION: Partial<Record<number, string>> = {
  0: '50% 42%',
  1: '50% 42%',
  2: '50% 42%',
  3: '50% 42%',
  4: '50% 42%',
  5: '50% 42%',
  6: '50% 42%',
  7: '50% 42%',
  8: '50% 42%',
  9: '50% 42%',
  10: '50% 42%',
  11: '50% 42%',
  12: '50% 42%',
  13: '50% 42%',
  14: '50% 42%',
  15: '50% 42%',
  16: '50% 42%',
  17: '50% 42%',
};

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
    languageMode: LanguageMode;
    visualTheme?: VisualThemeId;
    imageZoomEnabled?: boolean;
}

const EventScreen: React.FC<EventScreenProps> = ({ title, description, options, imageKey, image, resultLog, onContinue, typingMode = false, interactionDisabled = false, interactionDisabledMessage, languageMode, visualTheme = 'elementary', imageZoomEnabled = false }) => {
  const highSchoolEventIndex = useMemo(() => {
    const match = imageKey?.match(/^high-school-event-(\d+)$/);
    return match ? Number(match[1]) : null;
  }, [imageKey]);
  const magicEventIndex = useMemo(() => {
    const match = imageKey?.match(/^magic-event-(\d+)$/);
    return match ? Number(match[1]) : null;
  }, [imageKey]);
  const magicRomanceImage = useMemo(() => {
    const match = imageKey?.match(/^magic-romance:([^:]+):([^:]+):(r[1-6])$/);
    return match
      ? assetUrl(`sprites/magic/events/romance/${match[1]}/${match[2]}/${match[3]}.webp`)
      : null;
  }, [imageKey]);
  const magicFriendshipImages = useMemo(() => {
    const match = imageKey?.match(/^magic-friendship:([^:]+):([^:]+)$/);
    if (!match) return [];
    const [, heroId, friendHeroId] = match;
    return [
      assetUrl(`sprites/magic/events/friendship/${heroId}/${friendHeroId}/event.webp`),
      assetUrl(`sprites/magic/events/friendship/${friendHeroId}/${heroId}/event.webp`),
    ];
  }, [imageKey]);
  const highSchoolEventObjectPosition = useMemo(() => {
    if (highSchoolEventIndex === null) return undefined;
    return HIGH_SCHOOL_EVENT_IMAGE_POSITION[highSchoolEventIndex];
  }, [highSchoolEventIndex]);

  const imageCandidates = useMemo(() => {
    if (visualTheme === 'magic' && (title === '忘れ物' || imageKey === '忘れ物' || imageKey === 'magic-forgotten-card')) {
      return [
        assetUrl('sprites/magic/events/forgotten-card.webp'),
        assetUrl('event-illustrations/default.svg'),
      ];
    }
    if (magicFriendshipImages.length > 0) {
      return [
        ...magicFriendshipImages,
        assetUrl('event-illustrations/default.svg'),
      ];
    }
    if (magicRomanceImage) {
      return [
        magicRomanceImage,
        assetUrl('event-illustrations/default.svg'),
      ];
    }
    if (highSchoolEventIndex !== null) {
      return [
        assetUrl(`sprites/high-school/events/${highSchoolEventIndex}.webp`),
        assetUrl('event-illustrations/default.svg'),
      ];
    }
    if (magicEventIndex !== null) {
      return [
        assetUrl(`sprites/magic/events/${magicEventIndex}.webp`),
        assetUrl(`sprites/magic/events/${magicEventIndex}.webp`),
        assetUrl('event-illustrations/default.svg'),
      ];
    }
    const encodedTitle = encodeURIComponent(imageKey ?? title);
    return [
      assetUrl(`event-illustrations/${encodedTitle}.webp`),
      assetUrl(`event-illustrations/${encodedTitle}.png`),
      assetUrl(`event-illustrations/${encodedTitle}.jpg`),
      assetUrl(`event-illustrations/${encodedTitle}.jpeg`),
      assetUrl(`event-illustrations/${encodedTitle}.svg`),
      assetUrl('event-illustrations/default.svg')
    ];
  }, [highSchoolEventIndex, magicEventIndex, magicFriendshipImages, magicRomanceImage, imageKey, title, visualTheme]);
  const [imageIndex, setImageIndex] = useState(0);
  const [choiceLocked, setChoiceLocked] = useState(false);
  const [continueLocked, setContinueLocked] = useState(false);
  const [imageZoomOpen, setImageZoomOpen] = useState(false);
  const inputLocked = interactionDisabled || choiceLocked;
  const continueInputLocked = interactionDisabled || continueLocked;

  useEffect(() => {
    setImageIndex(0);
    setChoiceLocked(false);
    setContinueLocked(false);
    setImageZoomOpen(false);
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
    <div
      className="main-event-screen flex h-full w-full flex-col items-center justify-start overflow-y-auto bg-gray-900 bg-cover bg-center p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] text-white relative custom-scrollbar sm:justify-center sm:p-8"
      style={{
        backgroundImage: `url(${assetUrl(visualTheme === 'magic'
          ? 'sprites/backgrounds/learning-rogue/magic-event-hallway.webp'
          : 'sprites/backgrounds/learning-rogue/event-hallway.webp')})`
      }}
    >
        <div className="absolute inset-0 bg-slate-950/60 pointer-events-none" />
        
        <div className="event-screen-panel z-10 my-auto w-full max-w-2xl rounded-lg border-2 border-gray-600 bg-gray-800 p-4 shadow-2xl sm:p-8">
            {interactionDisabled && (
                <div className="event-screen-notice mb-4 rounded-lg border border-cyan-500/50 bg-cyan-950/30 px-4 py-3 text-center text-sm font-bold text-cyan-100">
                    {interactionDisabledMessage ? trans(interactionDisabledMessage, languageMode) : trans('他のプレイヤーの選択を待っています', languageMode)}
                </div>
            )}
            <div className="event-screen-title mb-4 flex items-center border-b border-gray-700 pb-3 sm:mb-6 sm:pb-4">
                <div className="mr-3 rounded-full border border-purple-500 bg-purple-900 p-2 sm:mr-4 sm:p-3">
                    <HelpCircle size={28} className="text-purple-300 sm:h-8 sm:w-8" />
                </div>
                <h2 className="text-2xl font-bold text-purple-100 sm:text-3xl">{title}</h2>
            </div>

            <div
                className={`event-screen-image relative mx-auto mb-4 aspect-square w-full max-w-[18rem] overflow-hidden rounded-xl border border-purple-400/40 bg-slate-900 sm:mb-6 sm:max-w-[22rem] ${imageZoomEnabled ? 'cursor-zoom-in transition hover:border-fuchsia-200 hover:brightness-110' : ''}`}
                role={imageZoomEnabled ? 'button' : undefined}
                tabIndex={imageZoomEnabled ? 0 : undefined}
                aria-label={imageZoomEnabled ? `${title}の画像を拡大` : undefined}
                onClick={imageZoomEnabled ? () => setImageZoomOpen(true) : undefined}
                onKeyDown={imageZoomEnabled ? (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setImageZoomOpen(true);
                    }
                } : undefined}
            >
                <img
                    src={imageCandidates[imageIndex]}
                    alt={`${title} thumbnail`}
                    className={`absolute inset-0 h-full w-full object-cover ${highSchoolEventIndex !== null && highSchoolEventIndex < 18 ? 'scale-[1.18]' : ''}`}
                    style={highSchoolEventObjectPosition ? { objectPosition: highSchoolEventObjectPosition } : undefined}
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
                {imageZoomEnabled && (
                    <div className="absolute bottom-2 right-2 rounded-full border border-white/30 bg-black/70 px-2 py-1 text-[10px] font-black text-white">
                        拡大
                    </div>
                )}
            </div>
            
            <div className="event-screen-description mb-6 min-h-[6rem] whitespace-pre-wrap text-base leading-relaxed text-gray-300 sm:mb-8 sm:text-lg">
                {resultLog ? (
                    <div className="animate-in fade-in duration-500">
                        <p className="text-yellow-300 font-bold mb-2">{trans("結果", languageMode)}:</p>
                        {resultLog}
                    </div>
                ) : (
                    description
                )}
            </div>

            <div className="event-screen-actions flex flex-col gap-4">
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
                                {opt.text && (
                                    <span className="mt-1 block text-xs leading-relaxed text-gray-300 sm:text-sm">
                                        {opt.text}
                                    </span>
                                )}
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
                        {trans("進む", languageMode)} <ArrowRight className="ml-2" />
                        {typingMode && <span className="ml-3 rounded-full border border-cyan-300 bg-cyan-950/95 px-2 py-0.5 text-[10px] font-black text-cyan-200">Enter</span>}
                    </button>
                )}
            </div>
        </div>

        {imageZoomEnabled && imageZoomOpen && (
            <div
                className="fixed inset-0 z-[10060] flex items-center justify-center bg-black/90 p-3 sm:p-6"
                role="dialog"
                aria-modal="true"
                aria-label={`${title} 拡大画像`}
                onClick={() => setImageZoomOpen(false)}
            >
                <button
                    type="button"
                    className="absolute right-3 top-3 rounded-lg border border-white/30 bg-slate-950/90 px-4 py-2 text-sm font-black text-white hover:bg-slate-800 sm:right-5 sm:top-5"
                    onClick={() => setImageZoomOpen(false)}
                >
                    閉じる
                </button>
                <img
                    src={imageCandidates[imageIndex]}
                    alt={`${title} enlarged`}
                    className="max-h-[92dvh] max-w-[96vw] rounded-xl border border-fuchsia-200/50 object-contain shadow-2xl"
                    onClick={(event) => event.stopPropagation()}
                    onError={() => setImageIndex(prev => Math.min(prev + 1, imageCandidates.length - 1))}
                />
            </div>
        )}
    </div>
  );
};

export default EventScreen;

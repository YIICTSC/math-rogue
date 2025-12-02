
import React, { useEffect, useState, useRef } from 'react';
import { ScoreEvent } from '../types';
import { audioService } from '../services/audioService';
import { Sparkles, X, Swords } from 'lucide-react';

interface ScoringOverlayProps {
  events: ScoreEvent[];
  handName: string;
  level: number;
  onComplete: (finalScore: number) => void;
}

// Ease out cubic function for smooth counter
const easeOutCubic = (x: number): number => {
  return 1 - Math.pow(1 - x, 3);
};

const ScoringOverlay: React.FC<ScoringOverlayProps> = ({ events, handName, level, onComplete }) => {
  const [currentChips, setCurrentChips] = useState(0);
  const [currentMult, setCurrentMult] = useState(0);
  const [targetChips, setTargetChips] = useState(0);
  const [targetMult, setTargetMult] = useState(0);
  const [displayTotal, setDisplayTotal] = useState<number | null>(null);
  
  const [activeMessage, setActiveMessage] = useState<{text: string, color: string, id: string} | null>(null);
  const [isExploding, setIsExploding] = useState(false);
  const [isCritical, setIsCritical] = useState(false);

  // Refs for animation loop
  const chipsRef = useRef(0);
  const multRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Process the queue
  useEffect(() => {
    const processQueue = async () => {
      // 1. Initial State (Reset)
      chipsRef.current = 0;
      multRef.current = 0;
      setCurrentChips(0);
      setCurrentMult(0);
      
      // Wait a beat for the modal to open
      await wait(400);

      for (const event of events) {
        if (event.type === 'BASE') {
            setTargetChips(event.addChips || 0);
            setTargetMult(event.addMult || 0);
            animateNumbers(event.addChips || 0, event.addMult || 0);
            audioService.playSound('select');
            await wait(600);
        } 
        else if (event.type === 'CARD' || event.type === 'SUPPORTER') {
            // Apply changes
            let newChips = chipsRef.current + (event.addChips || 0);
            let newMult = multRef.current + (event.addMult || 0);
            if (event.multMult) newMult *= event.multMult;
            
            // Show popup message
            if (event.message) {
                const color = event.addChips ? 'text-blue-400' : 'text-red-400';
                setActiveMessage({ text: event.message, color, id: `msg-${Date.now()}` });
                // If it's a big multiplier or heavy hit, play stronger sound
                if (event.multMult && event.multMult >= 1.5) {
                    setIsCritical(true);
                    audioService.playSound('attack');
                    setTimeout(() => setIsCritical(false), 300);
                } else {
                    audioService.playSound('select');
                }
            }

            setTargetChips(newChips);
            setTargetMult(newMult);
            animateNumbers(newChips, newMult);
            
            // Wait time depends on event impact
            await wait(event.multMult ? 800 : 500); 
            setActiveMessage(null);
        }
      }

      // 2. Final Total Calculation
      const finalScore = Math.floor(chipsRef.current) * Math.floor(multRef.current);
      
      // 3. Explosion
      setIsExploding(true);
      audioService.playSound('win'); // Boom sound
      
      // Accelerate count up to final score
      // We'll use a separate local state for the big number to animate it specially
      const duration = 1500;
      const start = 0;
      const startTime = performance.now();

      const animateTotal = (time: number) => {
          const elapsed = time - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = easeOutCubic(progress);
          
          const currentVal = Math.floor(start + (finalScore - start) * eased);
          setDisplayTotal(currentVal);

          if (progress < 1) {
              requestAnimationFrame(animateTotal);
          } else {
              // Done
              setTimeout(() => {
                  onComplete(finalScore);
              }, 1000);
          }
      };
      requestAnimationFrame(animateTotal);
    };

    processQueue();

    return () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [events]);

  const animateNumbers = (targetC: number, targetM: number) => {
      const startC = chipsRef.current;
      const startM = multRef.current;
      startTimeRef.current = performance.now();
      const duration = 400; // ms for each step

      const tick = (time: number) => {
          if (!startTimeRef.current) return;
          const elapsed = time - startTimeRef.current;
          const progress = Math.min(elapsed / duration, 1);
          const eased = easeOutCubic(progress);

          const curC = startC + (targetC - startC) * eased;
          const curM = startM + (targetM - startM) * eased;

          chipsRef.current = curC;
          multRef.current = curM;
          setCurrentChips(curC);
          setCurrentMult(curM);

          if (progress < 1) {
              animationFrameRef.current = requestAnimationFrame(tick);
          }
      };
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = requestAnimationFrame(tick);
  };

  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="w-full max-w-2xl bg-gray-900 border-4 border-slate-600 rounded-xl p-8 shadow-2xl relative overflow-hidden flex flex-col items-center">
            
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/blackboard.png')] opacity-10 pointer-events-none"></div>
            {isCritical && <div className="absolute inset-0 bg-white/10 animate-ping pointer-events-none"></div>}

            {/* Hand Name & Level */}
            <div className="z-10 text-center mb-8 animate-in fade-in zoom-in duration-300">
                <div className="text-3xl md:text-4xl font-black text-white tracking-tighter mb-2 drop-shadow-lg uppercase">
                    {handName}
                </div>
                <div className="text-sm font-mono text-blue-300 bg-blue-900/50 px-3 py-1 rounded-full inline-block border border-blue-500">
                    level {level}
                </div>
            </div>

            {/* Calculation Area */}
            <div className="w-full flex items-center justify-center gap-4 md:gap-8 mb-12 relative z-10">
                
                {/* CHIPS */}
                <div className={`
                    bg-blue-900/80 border-4 border-blue-500 rounded-lg p-4 md:p-6 w-32 md:w-48 text-center shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all duration-200
                    ${activeMessage?.color.includes('blue') ? 'scale-110 brightness-125' : ''}
                `}>
                    <div className="text-xs text-blue-300 font-bold mb-1 uppercase tracking-widest">Chips</div>
                    <div className="text-3xl md:text-5xl font-black text-white font-mono">
                        {Math.floor(currentChips)}
                    </div>
                </div>

                {/* X Symbol */}
                <div className="text-gray-500">
                    <X size={32} strokeWidth={4} />
                </div>

                {/* MULT */}
                <div className={`
                    bg-red-900/80 border-4 border-red-500 rounded-lg p-4 md:p-6 w-32 md:w-48 text-center shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all duration-200
                    ${activeMessage?.color.includes('red') ? 'scale-110 brightness-125' : ''}
                `}>
                    <div className="text-xs text-red-300 font-bold mb-1 uppercase tracking-widest">Mult</div>
                    <div className="text-3xl md:text-5xl font-black text-white font-mono">
                        {Math.floor(currentMult)}
                    </div>
                </div>

                {/* Floating Message Popups */}
                {activeMessage && (
                    <div 
                        key={activeMessage.id}
                        className={`absolute -top-12 left-1/2 -translate-x-1/2 text-2xl font-black ${activeMessage.color} drop-shadow-md animate-bounce whitespace-nowrap`}
                    >
                        {activeMessage.text}
                    </div>
                )}
            </div>

            {/* Total Score Explosion */}
            {isExploding && displayTotal !== null && (
                <div className="z-20 w-full animate-in zoom-in duration-300">
                    <div className="bg-yellow-900/90 border-4 border-yellow-400 p-6 rounded-xl text-center shadow-[0_0_50px_rgba(234,179,8,0.6)] relative overflow-hidden group">
                        <div className="absolute inset-0 bg-yellow-400/20 animate-pulse"></div>
                        <div className="relative z-10">
                            <div className="text-sm text-yellow-200 font-bold uppercase mb-2 flex items-center justify-center">
                                <Sparkles className="mr-2" size={16}/> Total Score
                            </div>
                            <div className="text-5xl md:text-7xl font-black text-white font-mono tracking-tighter drop-shadow-xl">
                                {displayTotal.toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Hint / Loading text if not yet done */}
            {!isExploding && (
                <div className="text-gray-500 text-sm animate-pulse mt-4">Calculating...</div>
            )}

        </div>
    </div>
  );
};

export default ScoringOverlay;


import React, { useEffect, useState, useRef } from 'react';
import { ScoreStep } from '../types';
import { audioService } from '../services/audioService';
import { Zap, Flame } from 'lucide-react';

interface ScoreAnimationProps {
  steps: ScoreStep[];
  onComplete: () => void;
}

// Ease out cubic function for smooth counting
const easeOutCubic = (t: number): number => {
  return 1 - Math.pow(1 - t, 3);
};

const NumberCounter: React.FC<{ value: number, color: string, scale?: boolean }> = ({ value, color, scale }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const startValueRef = useRef(0);
  const startTimeRef = useRef(0);
  const duration = 400; // ms

  useEffect(() => {
    startValueRef.current = displayValue;
    startTimeRef.current = performance.now();
    
    const animate = (time: number) => {
      const elapsed = time - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const ease = easeOutCubic(progress);
      
      const nextVal = Math.floor(startValueRef.current + (value - startValueRef.current) * ease);
      setDisplayValue(nextVal);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };
    
    requestAnimationFrame(animate);
  }, [value]);

  return (
    <span className={`transition-all duration-100 ${scale ? 'scale-125' : 'scale-100'} inline-block font-mono ${color}`}>
      {displayValue.toLocaleString()}
    </span>
  );
};

const ScoreAnimation: React.FC<ScoreAnimationProps> = ({ steps, onComplete }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [currentChips, setCurrentChips] = useState(0);
  const [currentMult, setCurrentMult] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [log, setLog] = useState<{msg: string, type: string}[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  
  // Animation Triggers
  const [chipPulse, setChipPulse] = useState(false);
  const [multPulse, setMultPulse] = useState(false);
  const [fireEffect, setFireEffect] = useState(false);

  useEffect(() => {
    processNextStep(0);
  }, []);

  const processNextStep = async (index: number) => {
    if (index >= steps.length) {
      // Finalize
      setIsFinished(true);
      setFireEffect(true);
      audioService.playSound('win');
      // Wait for user to admire the score or auto-close
      setTimeout(() => {
          onComplete();
      }, 2500);
      return;
    }

    const step = steps[index];
    setCurrentStepIndex(index);

    // Apply Logic
    let delay = 600; // Base delay per step
    
    if (step.type === 'BASE') {
        if (step.operation === 'ADD_CHIPS') setCurrentChips(prev => prev + (step.value || 0));
        if (step.operation === 'ADD_MULT') setCurrentMult(prev => prev + (step.value || 0));
        setLog(prev => [...prev, { msg: `${step.sourceName}`, type: 'base' }]);
        delay = 800;
        audioService.playSound('select');
    } 
    else if (step.type === 'CARD') {
        // Card triggers are faster
        delay = 400;
        if (step.operation === 'ADD_CHIPS') {
            setCurrentChips(prev => prev + (step.value || 0));
            setChipPulse(true);
            setTimeout(() => setChipPulse(false), 200);
            audioService.playSound('block'); // Chip sound
        }
        if (step.operation === 'ADD_MULT') {
            setCurrentMult(prev => prev + (step.value || 0));
            setMultPulse(true);
            setTimeout(() => setMultPulse(false), 200);
            audioService.playSound('attack'); // Mult sound
        }
        if (step.operation === 'MULT_MULT') {
            setCurrentMult(prev => Math.floor(prev * (step.value || 1)));
            setMultPulse(true);
            setTimeout(() => setMultPulse(false), 200);
            audioService.playSound('attack'); 
        }
        setLog(prev => [...prev, { msg: `${step.sourceName}`, type: 'card' }]);
    }
    else if (step.type === 'SUPPORTER') {
        delay = 700;
        if (step.operation === 'ADD_CHIPS') {
            setCurrentChips(prev => prev + (step.value || 0));
            setChipPulse(true);
        }
        if (step.operation === 'ADD_MULT') {
            setCurrentMult(prev => prev + (step.value || 0));
            setMultPulse(true);
        }
        if (step.operation === 'MULT_MULT') {
            setCurrentMult(prev => Math.floor(prev * (step.value || 1)));
            setMultPulse(true);
        }
        setTimeout(() => { setChipPulse(false); setMultPulse(false); }, 300);
        audioService.playSound('win'); // Joker sound
        setLog(prev => [...prev, { msg: `${step.sourceName} Triggered!`, type: 'supporter' }]);
    }

    // Update Total Projection
    // We update actual total only at the end or incrementally? 
    // Balatro updates chips/mult but total is usually calculated at end of standard sequence, 
    // but updating it live feels good too.
    // Let's update visual counters in the NumberCounter component
    
    setTimeout(() => {
        processNextStep(index + 1);
    }, delay);
  };

  // Calculate live total based on current display state
  useEffect(() => {
      setTotalScore(currentChips * currentMult);
  }, [currentChips, currentMult]);

  return (
    <div className="absolute inset-0 bg-black/80 z-[60] flex flex-col items-center justify-center pointer-events-auto backdrop-blur-sm">
        
        {/* Main Score Display */}
        <div className={`
            flex flex-col items-center justify-center p-8 rounded-2xl border-4 border-slate-700 bg-slate-900 shadow-2xl relative overflow-hidden transition-all duration-300
            ${fireEffect ? 'scale-110 border-orange-500 shadow-orange-500/50' : 'scale-100'}
        `}>
            {/* Background Flair */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
            {fireEffect && <div className="absolute inset-0 bg-orange-500/10 animate-pulse"></div>}

            {/* Header / Log */}
            <div className="h-8 mb-4 flex items-center justify-center">
                {log.length > 0 && (
                    <div className="text-sm font-bold animate-in fade-in slide-in-from-bottom duration-300 text-yellow-200">
                        {log[log.length - 1].msg}
                    </div>
                )}
            </div>

            {/* Equation */}
            <div className="flex items-center gap-4 md:gap-8 z-10">
                
                {/* Chips */}
                <div className={`
                    bg-blue-900/80 border-2 border-blue-500 p-4 rounded-xl min-w-[120px] text-center shadow-[0_0_15px_rgba(59,130,246,0.3)]
                    transition-transform duration-100 ${chipPulse ? 'scale-110 brightness-150' : 'scale-100'}
                `}>
                    <div className="text-xs text-blue-300 uppercase tracking-widest mb-1">Chips</div>
                    <div className="text-3xl md:text-4xl font-black text-white drop-shadow-md">
                        <NumberCounter value={currentChips} color="text-white" scale={chipPulse} />
                    </div>
                </div>

                <div className="text-gray-500 font-black text-2xl">X</div>

                {/* Mult */}
                <div className={`
                    bg-red-900/80 border-2 border-red-500 p-4 rounded-xl min-w-[120px] text-center shadow-[0_0_15px_rgba(239,68,68,0.3)]
                    transition-transform duration-100 ${multPulse ? 'scale-110 brightness-150' : 'scale-100'}
                `}>
                    <div className="text-xs text-red-300 uppercase tracking-widest mb-1">Mult</div>
                    <div className="text-3xl md:text-4xl font-black text-white drop-shadow-md">
                        <NumberCounter value={currentMult} color="text-white" scale={multPulse} />
                    </div>
                </div>
            </div>

            {/* Total Score Area */}
            <div className="mt-8 relative z-10 w-full flex justify-center">
                <div className={`
                    bg-black/60 px-8 py-4 rounded-full border-2 border-white/20 flex items-center justify-center gap-3
                    transition-all duration-500 ${fireEffect ? 'bg-orange-600/90 border-yellow-300 scale-125 shadow-[0_0_30px_rgba(234,179,8,0.8)]' : ''}
                `}>
                    {fireEffect && <Flame className="text-yellow-200 animate-bounce" size={32} />}
                    <div className="text-4xl md:text-6xl font-black text-white tracking-tighter tabular-nums">
                        <NumberCounter value={totalScore} color={fireEffect ? "text-yellow-100" : "text-white"} />
                    </div>
                    {fireEffect && <Flame className="text-yellow-200 animate-bounce" size={32} />}
                </div>
            </div>

            {/* Skip Button (Optional but good UX) */}
            {!isFinished && (
                <button 
                    onClick={() => {
                        // Calculate final immediately
                        let c = 0, m = 0;
                        steps.forEach(s => {
                            if(s.operation === 'ADD_CHIPS') c += (s.value||0);
                            else if(s.operation === 'ADD_MULT') m += (s.value||0);
                            else if(s.operation === 'MULT_MULT') m = Math.floor(m * (s.value||1));
                        });
                        setCurrentChips(c);
                        setCurrentMult(m);
                        setTotalScore(c*m);
                        setIsFinished(true);
                        setFireEffect(true);
                        setTimeout(onComplete, 1000);
                    }}
                    className="absolute bottom-2 right-2 text-xs text-gray-500 hover:text-white"
                >
                    CLICK TO SKIP
                </button>
            )}
        </div>
    </div>
  );
};

export default ScoreAnimation;


import React, { useState, useEffect, useRef } from 'react';
import { Enemy } from '../types';
import PixelSprite from './PixelSprite';
import { audioService } from '../services/audioService';

interface DodgeballShootingProps {
    enemy: Enemy;
    playerImage: string;
    onComplete: (hit: boolean) => void;
}

const DodgeballShooting: React.FC<DodgeballShootingProps> = ({ enemy, playerImage, onComplete }) => {
    const [ballPos, setBallPos] = useState({ x: 15, y: 50 }); // Percentage
    const [enemyY, setEnemyY] = useState(50); // Percentage
    const [isThrown, setIsThrown] = useState(false);
    const [result, setResult] = useState<'NONE' | 'HIT' | 'MISS'>('NONE');
    
    const requestRef = useRef<number>(null);
    const startTimeRef = useRef<number>(null);
    const ballRef = useRef({ x: 15, y: 50 });
    const enemyYRef = useRef(50);

    // Enemy movement
    useEffect(() => {
        const moveEnemy = (time: number) => {
            if (result !== 'NONE') return;
            const y = 50 + Math.sin(time / 400) * 30; // Float up and down
            setEnemyY(y);
            enemyYRef.current = y;
            requestRef.current = requestAnimationFrame(moveEnemy);
        };
        requestRef.current = requestAnimationFrame(moveEnemy);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [result]);

    const handleThrow = () => {
        if (isThrown || result !== 'NONE') return;
        setIsThrown(true);
        audioService.playSound('attack');

        const throwSpeed = 1.5;
        const animateBall = () => {
            ballRef.current.x += throwSpeed;
            setBallPos({ ...ballRef.current });

            // Check collision (Target is roughly around x=80)
            if (ballRef.current.x >= 75 && ballRef.current.x <= 85) {
                const dist = Math.abs(ballRef.current.y - enemyYRef.current);
                if (dist < 10) {
                    setResult('HIT');
                    audioService.playSound('correct');
                    setTimeout(() => onComplete(true), 1200);
                    return;
                }
            }

            if (ballRef.current.x > 110) {
                setResult('MISS');
                audioService.playSound('wrong');
                setTimeout(() => onComplete(false), 1200);
                return;
            }

            requestAnimationFrame(animateBall);
        };
        requestAnimationFrame(animateBall);
    };

    return (
        <div 
            className="w-full h-full bg-slate-800 flex flex-col items-center justify-center relative cursor-crosshair overflow-hidden"
            onClick={handleThrow}
        >
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20 pointer-events-none"></div>
            
            {/* Header */}
            <div className="absolute top-10 text-center animate-pulse z-10">
                <h2 className="text-3xl font-bold text-orange-500 drop-shadow-md">DODGEBALL ACE SPECIAL</h2>
                <p className="text-white text-sm mt-2">タイミングよくクリックしてボールを当てろ！</p>
                <div className="mt-2 inline-block bg-black/50 px-4 py-1 rounded-full border border-orange-500 text-orange-300 text-xs font-bold">
                    CHANCE: 1
                </div>
            </div>

            {/* Field */}
            <div className="w-full max-w-2xl h-64 relative bg-black/40 border-y-4 border-slate-600">
                {/* Center Line */}
                <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-white/20"></div>

                {/* Player */}
                <div className="absolute left-[10%] -translate-y-1/2 flex flex-col items-center" style={{ top: '50%' }}>
                    <div className="w-16 h-16 scale-x-1">
                        <img src={playerImage} className="w-full h-full pixel-art" style={{ imageRendering: 'pixelated' }} />
                    </div>
                </div>

                {/* Enemy */}
                <div 
                    className="absolute left-[80%] -translate-x-1/2 -translate-y-1/2 transition-transform duration-75"
                    style={{ top: `${enemyY}%` }}
                >
                    <div className="w-16 h-16 scale-x-[-1] relative">
                        <PixelSprite seed={enemy.id} name={enemy.name} className="w-full h-full" />
                    </div>
                </div>

                {/* Ball */}
                <div 
                    className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 ${isThrown ? '' : 'animate-bounce'}`}
                    style={{ left: `${ballPos.x}%`, top: `${ballPos.y}%` }}
                >
                    <div className="w-8 h-8 bg-orange-500 rounded-full border-2 border-white shadow-[0_0_10px_rgba(249,115,22,0.8)] flex items-center justify-center overflow-hidden">
                        <div className="w-full h-1 bg-white/30 rotate-45"></div>
                    </div>
                </div>

                {/* Hit/Miss Text */}
                {result !== 'NONE' && (
                    <div className="absolute inset-0 flex items-center justify-center z-30">
                        <div className={`text-6xl font-black italic tracking-tighter animate-in zoom-in duration-300 ${result === 'HIT' ? 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]' : 'text-red-500'}`}>
                            {result}!
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="absolute bottom-10 text-gray-400 text-xs font-mono uppercase tracking-widest">
                {isThrown ? 'ボールは放たれた...' : 'WAITING FOR INPUT...'}
            </div>
        </div>
    );
};

export default DodgeballShooting;

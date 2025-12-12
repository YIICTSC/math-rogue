
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Cloud, Wind, Trophy, RefreshCcw } from 'lucide-react';
import { audioService } from '../services/audioService';

interface PaperPlaneBattleProps {
  onBack: () => void;
}

interface Obstacle {
    x: number;
    y: number;
    width: number;
    height: number;
    type: 'BOOK' | 'ERASER' | 'RULER';
    passed: boolean;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const GRAVITY = 0.25;
const LIFT = -5;
const OBSTACLE_SPEED = 4;
const SPAWN_RATE = 100;

const PaperPlaneBattle: React.FC<PaperPlaneBattleProps> = ({ onBack }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAME_OVER'>('START');
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);

    const planeRef = useRef({ x: 100, y: 200, dy: 0, angle: 0 });
    const obstaclesRef = useRef<Obstacle[]>([]);
    const frameCountRef = useRef(0);
    const animationFrameId = useRef<number>(0);
    const [lastScore, setLastScore] = useState(0);

    useEffect(() => {
        const saved = localStorage.getItem('pixel_spire_paper_plane_hiscore');
        if (saved) setHighScore(parseInt(saved, 10));
        
        audioService.playBGM('menu'); // Placeholder BGM

        return () => {
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            audioService.stopBGM();
        };
    }, []);

    const startGame = () => {
        planeRef.current = { x: 100, y: 200, dy: 0, angle: 0 };
        obstaclesRef.current = [];
        frameCountRef.current = 0;
        setScore(0);
        setGameState('PLAYING');
        audioService.playSound('select');
        loop();
    };

    const handleInput = () => {
        if (gameState === 'PLAYING') {
            planeRef.current.dy = LIFT;
            planeRef.current.angle = -20;
            // audioService.playSound('select'); // Too noisy?
        } else if (gameState === 'START' || gameState === 'GAME_OVER') {
            startGame();
        }
    };

    const update = () => {
        const plane = planeRef.current;
        
        // Physics
        plane.dy += GRAVITY;
        plane.y += plane.dy;
        
        // Rotate back to neutral/down
        if (plane.angle < 20) plane.angle += 1;

        // Bounds
        if (plane.y > CANVAS_HEIGHT - 20 || plane.y < 0) {
            endGame();
            return;
        }

        // Spawn Obstacles
        frameCountRef.current++;
        if (frameCountRef.current % SPAWN_RATE === 0) {
            const gap = 120;
            const minHeight = 50;
            const maxHeight = CANVAS_HEIGHT - gap - minHeight;
            const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1) + minHeight);
            
            obstaclesRef.current.push({
                x: CANVAS_WIDTH,
                y: 0,
                width: 40,
                height: topHeight,
                type: 'BOOK',
                passed: false
            });
            obstaclesRef.current.push({
                x: CANVAS_WIDTH,
                y: topHeight + gap,
                width: 40,
                height: CANVAS_HEIGHT - (topHeight + gap),
                type: 'BOOK',
                passed: false
            });
        }

        // Move & Check Obstacles
        for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
            const obs = obstaclesRef.current[i];
            obs.x -= OBSTACLE_SPEED;

            // Collision
            if (
                plane.x < obs.x + obs.width &&
                plane.x + 20 > obs.x &&
                plane.y < obs.y + obs.height &&
                plane.y + 10 > obs.y
            ) {
                endGame();
                return;
            }

            // Score
            if (!obs.passed && plane.x > obs.x + obs.width) {
                obs.passed = true;
                // Only increment score for passing the pair (check top one)
                if (obs.y === 0) {
                    setScore(s => s + 1);
                    audioService.playSound('select'); // Score sound
                }
            }

            // Cleanup
            if (obs.x + obs.width < 0) {
                obstaclesRef.current.splice(i, 1);
            }
        }
    };

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear
        ctx.fillStyle = '#0ea5e9'; // Sky Blue
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw Clouds (Simple)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        const cloudOffset = (frameCountRef.current * 0.5) % CANVAS_WIDTH;
        ctx.beginPath();
        ctx.arc(100 - cloudOffset, 100, 40, 0, Math.PI * 2);
        ctx.arc(150 - cloudOffset, 120, 50, 0, Math.PI * 2);
        ctx.arc(300 - cloudOffset + CANVAS_WIDTH, 80, 60, 0, Math.PI * 2);
        ctx.fill();

        // Draw Player (Paper Plane)
        const plane = planeRef.current;
        ctx.save();
        ctx.translate(plane.x, plane.y);
        ctx.rotate((plane.angle * Math.PI) / 180);
        
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(-10, 5);
        ctx.lineTo(-10, -5);
        ctx.fill();
        
        ctx.restore();

        // Draw Obstacles
        ctx.fillStyle = '#8b5cf6'; // Violet Books
        obstaclesRef.current.forEach(obs => {
            ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
            // Detail
            ctx.fillStyle = 'white';
            ctx.fillRect(obs.x + 5, obs.y + 5, obs.width - 10, obs.height - 10);
            ctx.fillStyle = '#8b5cf6';
        });

        // Floor
        ctx.fillStyle = '#10b981'; // Green grass
        ctx.fillRect(0, CANVAS_HEIGHT - 20, CANVAS_WIDTH, 20);
    };

    const loop = () => {
        if (gameState !== 'PLAYING') return;
        update();
        draw();
        if (gameState === 'PLAYING') {
            animationFrameId.current = requestAnimationFrame(loop);
        }
    };

    const endGame = () => {
        setGameState('GAME_OVER');
        setLastScore(score);
        audioService.playSound('lose');
        if (score > highScore) {
            setHighScore(score);
            localStorage.setItem('pixel_spire_paper_plane_hiscore', score.toString());
        }
    };

    // Initial Draw
    useEffect(() => {
        if (gameState === 'START') {
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.fillStyle = '#0ea5e9';
                    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                    ctx.fillStyle = 'white';
                    ctx.font = '30px monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText('TAP TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
                }
            }
        }
    }, [gameState]);

    return (
        <div className="flex flex-col h-full w-full bg-slate-900 items-center justify-center p-4 relative font-mono text-white select-none">
            <div className="absolute top-4 left-4 z-20">
                <button onClick={onBack} className="flex items-center text-gray-400 hover:text-white bg-black/50 px-3 py-1 rounded border border-gray-600">
                    <ArrowLeft className="mr-2" size={20} /> Back
                </button>
            </div>

            <div className="relative border-4 border-slate-600 rounded-lg overflow-hidden shadow-2xl max-w-4xl w-full aspect-[2/1] bg-sky-900">
                <canvas 
                    ref={canvasRef} 
                    width={CANVAS_WIDTH} 
                    height={CANVAS_HEIGHT} 
                    className="w-full h-full cursor-pointer touch-none"
                    onMouseDown={handleInput}
                    onTouchStart={(e) => { e.preventDefault(); handleInput(); }}
                />

                {gameState === 'PLAYING' && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 text-4xl font-bold text-white drop-shadow-md">
                        {score}
                    </div>
                )}

                {gameState === 'GAME_OVER' && (
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center animate-in zoom-in duration-200 pointer-events-none">
                        <div className="text-red-500 font-bold text-5xl mb-4">CRASH!</div>
                        <div className="text-white text-2xl mb-2">Score: {score}</div>
                        <div className="text-yellow-400 text-xl mb-8 flex items-center gap-2"><Trophy size={20}/> Best: {highScore}</div>
                        <div className="text-gray-400 animate-pulse">Tap to Retry</div>
                    </div>
                )}

                {gameState === 'START' && (
                     <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                         <Send size={64} className="text-white mb-4 -rotate-45 animate-bounce" />
                         <h1 className="text-4xl font-bold text-white mb-2 shadow-black drop-shadow-md">PAPER PLANE</h1>
                         <p className="text-sky-200 mb-8">Tap to Fly</p>
                     </div>
                )}
            </div>
            
            <div className="mt-4 text-center text-gray-500 text-xs">
                Tap or Click to boost up. Avoid the books!
            </div>
        </div>
    );
};

export default PaperPlaneBattle;

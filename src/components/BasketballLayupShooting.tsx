import React, { useEffect, useRef, useState } from 'react';
import { Enemy, LanguageMode } from '../types';
import EnemyIllustration from './EnemyIllustration';
import { audioService } from '../services/audioService';
import { ENEMY_ILLUSTRATION_SIZE_CLASS } from '../constants/uiSizing';
import { getHighSchoolCharacterSpritePath, getThemedEnemyDisplayName, getThemedHumanoidEnemyVariant } from '../data/visualThemes';
import { assetUrl } from '../utils/assetPaths';
import { trans } from '../utils/textUtils';

interface BasketballLayupShootingProps {
    enemy: Enemy;
    playerImage: string;
    languageMode: LanguageMode;
    onComplete: (hit: boolean) => void;
}

const getAimSpeedForEnemy = (enemyType: Enemy['enemyType']) => {
    switch (enemyType) {
        case 'TANK':
            return 470;
        case 'TEACHER':
            return 420;
        case 'GUARDIAN':
            return 330;
        case 'TRICKSTER':
            return 280;
        case 'AGGRESSIVE':
            return 250;
        case 'GHOST':
            return 235;
        case 'SWARM':
            return 210;
        default:
            return 360;
    }
};

const getBlockRadiusForEnemy = (enemyType: Enemy['enemyType']) => {
    switch (enemyType) {
        case 'TANK':
        case 'GUARDIAN':
            return 13;
        case 'AGGRESSIVE':
        case 'SWARM':
            return 11;
        case 'GHOST':
            return 9;
        default:
            return 10;
    }
};

const BALL_START = { x: 18, y: 75 };
const HOOP_CENTER = { x: 75.5, y: 31.5 };
const MISS_TARGET = { x: 83, y: 25 };

const BasketballLayupShooting: React.FC<BasketballLayupShootingProps> = ({ enemy, playerImage, languageMode, onComplete }) => {
    const [ballPos, setBallPos] = useState(BALL_START);
    const [enemyPos, setEnemyPos] = useState({ x: 62, y: 64 });
    const [isShooting, setIsShooting] = useState(false);
    const [result, setResult] = useState<'NONE' | 'HIT' | 'MISS'>('NONE');
    const [aim, setAim] = useState(50);

    const requestRef = useRef<number | null>(null);
    const shotRef = useRef<number | null>(null);
    const ballRef = useRef(BALL_START);
    const enemyRef = useRef({ x: 62, y: 64 });
    const aimRef = useRef(50);
    const blockVoiceEnemyKeyRef = useRef<string | null>(null);
    const aimSpeed = getAimSpeedForEnemy(enemy.enemyType);
    const displayEnemyName = getThemedEnemyDisplayName(enemy, 'high-school');
    const displayEnemyRef = { name: displayEnemyName, enemyType: enemy.enemyType, phase: enemy.phase };
    const humanoidEnemyVariant = getThemedHumanoidEnemyVariant(displayEnemyRef, 'high-school');
    const playerSprite = isShooting
        ? getHighSchoolCharacterSpritePath('DODGEBALL', 'attack')
        : (playerImage || getHighSchoolCharacterSpritePath('DODGEBALL', 'idle'));

    useEffect(() => {
        const voiceKey = `${displayEnemyName}:${enemy.enemyType}:${enemy.phase ?? 0}`;
        if (!humanoidEnemyVariant || blockVoiceEnemyKeyRef.current === voiceKey) return;
        blockVoiceEnemyKeyRef.current = voiceKey;
        audioService.playHumanoidEnemyVoice('high-school', displayEnemyName, 'defense');
    }, [displayEnemyName, enemy.enemyType, enemy.phase, humanoidEnemyVariant]);

    useEffect(() => {
        const moveEnemy = (time: number) => {
            if (result !== 'NONE') return;

            let newY = 64;
            let newX = 62;

            switch (enemy.enemyType) {
                case 'TEACHER':
                    newY = 64 + Math.sin(time / 600) * 15;
                    break;
                case 'GHOST':
                    newY = 64 + Math.sin(time / 300) * 15 + (Math.random() - 0.5) * 4;
                    newX = 62 + Math.cos(time / 1000) * 4;
                    break;
                case 'AGGRESSIVE':
                    newY = 64 + Math.sin(time / 200) * 18;
                    break;
                case 'TRICKSTER':
                    newY = 64 + Math.sin(time / 400) * 16;
                    newX = 62 + Math.cos(time / 200) * 7;
                    break;
                case 'TANK':
                    newY = 64 + Math.sin(time / 1200) * 9;
                    break;
                case 'GUARDIAN':
                    newY = 64 + Math.sin(time / 350) * 11 + Math.sin(time / 800) * 10;
                    newX = 62 + Math.sin(time / 500) * 5;
                    break;
                case 'SWARM':
                    newY = 78 - Math.abs(Math.sin(time / 200)) * 26;
                    break;
                default:
                    newY = 64 + Math.sin(time / 400) * 15;
            }

            newY = Math.max(45, Math.min(80, newY));
            newX = Math.max(54, Math.min(69, newX));

            setEnemyPos({ x: newX, y: newY });
            enemyRef.current = { x: newX, y: newY };
            requestRef.current = requestAnimationFrame(moveEnemy);
        };
        requestRef.current = requestAnimationFrame(moveEnemy);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [result, enemy.enemyType]);

    useEffect(() => {
        const animateAim = (time: number) => {
            if (result !== 'NONE' || isShooting) return;
            const nextAim = 50 + Math.sin(time / aimSpeed) * 45;
            aimRef.current = nextAim;
            setAim(nextAim);
            shotRef.current = requestAnimationFrame(animateAim);
        };
        shotRef.current = requestAnimationFrame(animateAim);
        return () => {
            if (shotRef.current) cancelAnimationFrame(shotRef.current);
        };
    }, [aimSpeed, isShooting, result]);

    const handleShoot = () => {
        if (isShooting || result !== 'NONE') return;
        setIsShooting(true);
        audioService.playSound('attack');
        audioService.playHighSchoolVoice('DODGEBALL', 'attack');

        const releaseAim = aimRef.current;
        const aimAccuracy = Math.abs(releaseAim - 50);
        const accurateShot = aimAccuracy <= 12;
        const shotStart = performance.now();
        let blocked = false;

        const animateBall = (time: number) => {
            const t = Math.min(1, (time - shotStart) / 720);
            const targetX = accurateShot ? HOOP_CENTER.x : MISS_TARGET.x + Math.min(8, aimAccuracy * 0.18);
            const targetY = accurateShot ? HOOP_CENTER.y : MISS_TARGET.y + Math.min(20, aimAccuracy * 0.65);
            const arc = Math.sin(t * Math.PI) * 30;
            ballRef.current = {
                x: BALL_START.x + (targetX - BALL_START.x) * t,
                y: BALL_START.y + (targetY - BALL_START.y) * t - arc,
            };
            setBallPos({ ...ballRef.current });

            const defender = enemyRef.current;
            const dx = ballRef.current.x - defender.x;
            const dy = ballRef.current.y - defender.y;
            const blockRadius = getBlockRadiusForEnemy(enemy.enemyType);
            if (!blocked && t > 0.16 && t < 0.92 && Math.hypot(dx, dy) <= blockRadius) {
                blocked = true;
            }

            if (t >= 1) {
                const success = accurateShot && !blocked;
                setResult(success ? 'HIT' : 'MISS');
                audioService.playSound(success ? 'correct' : 'wrong');
                setTimeout(() => onComplete(success), 1200);
                return;
            }

            requestAnimationFrame(animateBall);
        };
        requestAnimationFrame(animateBall);
    };

    return (
        <div
            data-gamepad-shortcut="A"
            role="button"
            tabIndex={0}
            aria-label={languageMode === 'ENGLISH' ? 'Shoot' : 'シュートする'}
            className="mini-game-dodgeball-screen w-full h-full bg-slate-800 flex flex-col items-center justify-center relative cursor-crosshair overflow-hidden"
            onClick={handleShoot}
            onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleShoot();
                }
            }}
        >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(251,146,60,0.20),transparent_35%),linear-gradient(120deg,rgba(15,23,42,0.95),rgba(30,41,59,0.98))] pointer-events-none"></div>

            <div className="absolute top-10 text-center animate-pulse z-10 pointer-events-none">
                <h2 className="text-3xl font-bold text-orange-400 drop-shadow-md">FAST BREAK LAYUP</h2>
                <p className="text-white text-sm mt-2">{languageMode === 'ENGLISH' ? 'Tap in the green zone for a fast-break score!' : '緑ゾーンでタップして速攻を決めろ！'}</p>
                <div className="mt-2 flex flex-col items-center gap-1">
                    <div className="bg-black/50 px-4 py-1 rounded-full border border-orange-500 text-orange-300 text-xs font-bold">
                        DEFENSE: {trans(displayEnemyName, languageMode)}
                    </div>
                    <div className="text-[10px] text-gray-400 font-mono">TYPE: {enemy.enemyType}</div>
                </div>
            </div>

            <div className="basketball-layup-court w-[min(96vw,1100px)] max-h-[66vh] aspect-[16/9] relative bg-gradient-to-b from-slate-900/70 via-slate-800/70 to-black/80 border-y-4 border-orange-200/70 shadow-inner overflow-hidden">
                <img
                    src={assetUrl('sprites/high-school/minigames/basketball-court.webp')}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-contain object-bottom pointer-events-none select-none"
                />

                <div className="absolute left-[12%] -translate-y-1/2 flex flex-col items-center" style={{ top: '75%' }}>
                    <div className="w-16 h-16 md:w-20 md:h-20 scale-x-1">
                        <img src={playerSprite} className="w-full h-full pixel-art -scale-x-100" style={{ imageRendering: 'pixelated' }} alt="Player" />
                    </div>
                    <div className="mt-1 text-[9px] font-black text-white bg-orange-700/90 px-2 rounded-full border border-white/50">ACE</div>
                </div>

                <div
                    className="absolute -translate-x-1/2 -translate-y-1/2 transition-transform duration-75"
                    style={{ left: `${enemyPos.x}%`, top: `${enemyPos.y}%` }}
                >
                    <div className={`${ENEMY_ILLUSTRATION_SIZE_CLASS.miniGameDodgeball} md:scale-125 scale-x-[-1] relative`}>
                        <EnemyIllustration
                            name={displayEnemyName}
                            seed={enemy.id}
                            visualTheme="high-school"
                            enemyType={enemy.enemyType}
                            phase={enemy.phase}
                            action="skill"
                            className="w-full h-full"
                        />
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-2 bg-black/40 rounded-full blur-sm"></div>
                    </div>
                </div>

                <div
                    className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 ${isShooting ? '' : 'animate-bounce'}`}
                    style={{ left: `${ballPos.x}%`, top: `${ballPos.y}%` }}
                >
                    <div className="relative w-8 h-8 md:w-9 md:h-9 bg-orange-500 rounded-full border-2 border-black/40 shadow-[0_0_15px_rgba(249,115,22,0.8)] flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-y-0 left-1/2 w-0.5 bg-black/30"></div>
                        <div className="absolute inset-x-0 top-1/2 h-0.5 bg-black/30"></div>
                        <div className="absolute w-full h-full border-2 border-black/30 rounded-full scale-x-50"></div>
                        <div className="absolute inset-0 bg-gradient-to-tr from-black/25 to-transparent"></div>
                    </div>
                </div>

                {!isShooting && result === 'NONE' && (
                    <div className="absolute left-1/2 bottom-5 -translate-x-1/2 w-64 max-w-[72%] h-5 rounded-full bg-black/60 border border-white/40 overflow-hidden z-30">
                        <div className="absolute inset-y-0 left-[41%] w-[18%] bg-emerald-400/90 shadow-[0_0_12px_rgba(52,211,153,0.9)]"></div>
                        <div className="absolute inset-y-0 left-[47%] w-[6%] bg-yellow-300"></div>
                        <div
                            className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_8px_rgba(255,255,255,1)]"
                            style={{ left: `${aim}%` }}
                        ></div>
                    </div>
                )}

                {result !== 'NONE' && (
                    <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                        <div className={`text-6xl font-black italic tracking-tighter animate-in zoom-in duration-300 ${result === 'HIT' ? 'text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]' : 'text-red-500'}`}>
                            {result === 'HIT' ? 'FAST BREAK!' : 'BLOCKED...'}
                        </div>
                    </div>
                )}
            </div>

            <div className="absolute bottom-10 text-gray-400 text-[10px] font-mono uppercase tracking-widest pointer-events-none">
                {isShooting ? 'THE SHOT IS UP...' : 'TAP ANYWHERE TO SHOOT!'}
            </div>
        </div>
    );
};

export default BasketballLayupShooting;

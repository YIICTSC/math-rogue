
import React from 'react';
import { deferredScreen } from '../utils/deferredScreen';
import { AnswerMode, AssignmentAnswerResult, AssignmentPayload, GameMode, GameScreen, LanguageMode, MiniGameDebugPreview } from '../types';
import type { CraneGameResult } from '../mini-games/crane-game/CraneGame';
const GakuroGear = deferredScreen(() => import('../mini-games/gakurogear/VrTitle'));
const PokerGameScreen = deferredScreen(() => import('./PokerGameScreen'));
const SchoolyardSurvivorScreen = deferredScreen(() => import('./SchoolyardSurvivorScreen'));
const SchoolDungeonRPG = deferredScreen(() => import('./SchoolDungeonRPG'));
const SchoolDungeonRPG2 = deferredScreen(() => import('./SchoolDungeonRPG2'));
const KochoShowdown = deferredScreen(() => import('./KochoShowdown'));
const PaperPlaneBattle = deferredScreen(() => import('./PaperPlaneBattle'));
const GoHomeDash = deferredScreen(() => import('./GoHomeDash'));
const TriviaMiniGameScreen = deferredScreen(() => import('./TriviaMiniGameScreen'));
const PlacementTcgGame = deferredScreen(() => import('../mini-games/placement-tcg/PlacementTcgGame'));
const ShogiMiniGame = deferredScreen(() => import('../mini-games/shogi/ShogiMiniGame'));
const SchoolTrpgGame = deferredScreen(() => import('../mini-games/school-trpg/SchoolTrpgGame'));
const CraneGame = deferredScreen(() => import('../mini-games/crane-game/CraneGame'));

interface MiniGameRouterProps {
    screen: GameScreen;
    onBack: () => void;
    onFinish?: (result: 'WIN' | 'LOSE') => void;
    problemMode: GameMode;
    problemModePool?: string[];
    answerMode?: AnswerMode;
    assignment?: AssignmentPayload | null;
    onAnswerResult?: (result: AssignmentAnswerResult) => void;
    languageMode?: LanguageMode;
    inviteCode?: string;
    debugPreview?: MiniGameDebugPreview;
    isUiPreview?: boolean;
    onCraneComplete?: (result: CraneGameResult) => void;
    onCraneReplay?: () => boolean;
    craneGold?: number;
    craneEventMode?: boolean;
}

export interface MiniGameComponentProps {
    onBack: () => void;
    onFinish?: (result: 'WIN' | 'LOSE') => void;
    problemMode: GameMode;
    problemModePool?: string[];
    answerMode?: AnswerMode;
    assignment?: AssignmentPayload | null;
    onAnswerResult?: (result: AssignmentAnswerResult) => void;
    languageMode?: LanguageMode;
    inviteCode?: string;
    debugPreview?: MiniGameDebugPreview;
    isUiPreview?: boolean;
    gameScreen?: GameScreen;
    onCraneComplete?: (result: CraneGameResult) => void;
    onCraneReplay?: () => boolean;
    craneGold?: number;
    eventMode?: boolean;
}

/**
 * 個別のミニゲームコンポーネントとGameScreenの対応表
 * 今後ミニゲームが増えた場合は、ここに追加するだけでApp.tsxを触らずに済みます
 */
const MINI_GAME_MAP: Partial<Record<GameScreen, React.ComponentType<MiniGameComponentProps>>> = {
    [GameScreen.MINI_GAME_GAKUROGEAR]: GakuroGear,
    [GameScreen.MINI_GAME_POKER]: PokerGameScreen,
    [GameScreen.MINI_GAME_SURVIVOR]: SchoolyardSurvivorScreen,
    [GameScreen.MINI_GAME_DUNGEON]: SchoolDungeonRPG,
    [GameScreen.MINI_GAME_DUNGEON_2]: SchoolDungeonRPG2,
    [GameScreen.MINI_GAME_KOCHO]: KochoShowdown,
    [GameScreen.MINI_GAME_PAPER_PLANE]: PaperPlaneBattle,
    [GameScreen.MINI_GAME_GO_HOME]: GoHomeDash,
    [GameScreen.MINI_GAME_STONE_GLOW]: TriviaMiniGameScreen,
    [GameScreen.MINI_GAME_SCHOOL_TRPG]: SchoolTrpgGame,
    [GameScreen.MINI_GAME_LEARNING_TCG]: PlacementTcgGame,
    [GameScreen.MINI_GAME_SHOGI]: ShogiMiniGame,
    [GameScreen.MINI_GAME_GO]: TriviaMiniGameScreen,
    [GameScreen.MINI_GAME_CHESS]: TriviaMiniGameScreen,
    [GameScreen.MINI_GAME_MAHJONG]: TriviaMiniGameScreen,
    [GameScreen.MINI_GAME_CRANE]: CraneGame,
};

const MiniGameRouter: React.FC<MiniGameRouterProps> = ({ screen, onBack, onFinish, problemMode, problemModePool, answerMode, assignment, onAnswerResult, languageMode, inviteCode, debugPreview, isUiPreview, onCraneComplete, onCraneReplay, craneGold, craneEventMode }) => {
    const Component = MINI_GAME_MAP[screen];

    if (!Component) {
        console.error(`No component registered for mini-game screen: ${screen}`);
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-black text-white p-4 text-center">
                <p className="text-red-500 font-bold mb-4 text-xl">Mini-Game Component Not Found</p>
                <button onClick={onBack} className="bg-gray-800 px-6 py-2 rounded">Back</button>
            </div>
        );
    }

    return (
        <React.Suspense fallback={null}><Component
            onBack={onBack}
            onFinish={onFinish}
            problemMode={problemMode}
            problemModePool={problemModePool}
            answerMode={answerMode}
            assignment={assignment}
            onAnswerResult={onAnswerResult}
            languageMode={languageMode}
            inviteCode={inviteCode}
            debugPreview={debugPreview}
            isUiPreview={isUiPreview}
            gameScreen={screen}
            onCraneComplete={onCraneComplete}
            onCraneReplay={onCraneReplay}
            craneGold={craneGold}
            eventMode={craneEventMode}
        /></React.Suspense>
    );
};

export default MiniGameRouter;

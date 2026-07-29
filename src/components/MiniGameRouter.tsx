
import React from 'react';
import { AnswerMode, AssignmentAnswerResult, AssignmentPayload, GameMode, GameScreen, LanguageMode, MiniGameDebugPreview } from '../types';
import PokerGameScreen from './PokerGameScreen';
import SchoolyardSurvivorScreen from './SchoolyardSurvivorScreen';
import SchoolDungeonRPG from './SchoolDungeonRPG';
import SchoolDungeonRPG2 from './SchoolDungeonRPG2';
import KochoShowdown from './KochoShowdown';
import PaperPlaneBattle from './PaperPlaneBattle';
import GoHomeDash from './GoHomeDash';

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
    debugPreview?: MiniGameDebugPreview;
    isUiPreview?: boolean;
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
    debugPreview?: MiniGameDebugPreview;
    isUiPreview?: boolean;
}

/**
 * 個別のミニゲームコンポーネントとGameScreenの対応表
 * 今後ミニゲームが増えた場合は、ここに追加するだけでApp.tsxを触らずに済みます
 */
const MINI_GAME_MAP: Partial<Record<GameScreen, React.ComponentType<MiniGameComponentProps>>> = {
    [GameScreen.MINI_GAME_POKER]: PokerGameScreen,
    [GameScreen.MINI_GAME_SURVIVOR]: SchoolyardSurvivorScreen,
    [GameScreen.MINI_GAME_DUNGEON]: SchoolDungeonRPG,
    [GameScreen.MINI_GAME_DUNGEON_2]: SchoolDungeonRPG2,
    [GameScreen.MINI_GAME_KOCHO]: KochoShowdown,
    [GameScreen.MINI_GAME_PAPER_PLANE]: PaperPlaneBattle,
    [GameScreen.MINI_GAME_GO_HOME]: GoHomeDash,
};

const MiniGameRouter: React.FC<MiniGameRouterProps> = ({ screen, onBack, onFinish, problemMode, problemModePool, answerMode, assignment, onAnswerResult, languageMode, debugPreview, isUiPreview }) => {
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
        <Component
            onBack={onBack}
            onFinish={onFinish}
            problemMode={problemMode}
            problemModePool={problemModePool}
            answerMode={answerMode}
            assignment={assignment}
            onAnswerResult={onAnswerResult}
            languageMode={languageMode}
            debugPreview={debugPreview}
            isUiPreview={isUiPreview}
        />
    );
};

export default MiniGameRouter;

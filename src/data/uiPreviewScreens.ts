import { GameScreen, MiniGameDebugPreview } from '../types';

export interface UiPreviewScreenDefinition {
    id: string;
    screen: GameScreen;
    label: string;
    group: 'メインモード' | '冒険' | 'ミニゲーム' | 'その他';
    miniGameOutcome?: MiniGameDebugPreview;
}

export const UI_PREVIEW_SCREENS: UiPreviewScreenDefinition[] = [
    { id: GameScreen.START_MENU, screen: GameScreen.START_MENU, label: 'タイトル', group: 'メインモード' },
    { id: GameScreen.MODE_SELECTION, screen: GameScreen.MODE_SELECTION, label: '学習モード選択', group: 'メインモード' },
    { id: GameScreen.PROBLEM_CHALLENGE, screen: GameScreen.PROBLEM_CHALLENGE, label: '問題チャレンジ', group: 'メインモード' },
    { id: GameScreen.TYPING_MODE_SELECTION, screen: GameScreen.TYPING_MODE_SELECTION, label: 'タイピング選択', group: 'メインモード' },
    { id: GameScreen.CHARACTER_SELECTION, screen: GameScreen.CHARACTER_SELECTION, label: '主人公選択', group: 'メインモード' },
    { id: GameScreen.DIFFICULTY_SELECTION, screen: GameScreen.DIFFICULTY_SELECTION, label: '難易度選択', group: 'メインモード' },
    { id: GameScreen.DECK_CONSTRUCTION, screen: GameScreen.DECK_CONSTRUCTION, label: 'デッキ構築', group: 'メインモード' },
    { id: GameScreen.RELIC_SELECTION, screen: GameScreen.RELIC_SELECTION, label: '初期レリック選択', group: 'メインモード' },

    { id: GameScreen.MAP, screen: GameScreen.MAP, label: 'マップ', group: '冒険' },
    { id: GameScreen.BATTLE, screen: GameScreen.BATTLE, label: '戦闘', group: '冒険' },
    { id: GameScreen.REST, screen: GameScreen.REST, label: '休憩', group: '冒険' },
    { id: GameScreen.SHOP, screen: GameScreen.SHOP, label: 'ショップ', group: '冒険' },
    { id: GameScreen.GARDEN, screen: GameScreen.GARDEN, label: 'ガーデン', group: '冒険' },

    { id: GameScreen.MINI_GAME_SELECT, screen: GameScreen.MINI_GAME_SELECT, label: 'ミニゲーム選択', group: 'ミニゲーム' },
    { id: GameScreen.MINI_GAME_GO_HOME, screen: GameScreen.MINI_GAME_GO_HOME, label: '帰宅ダッシュ', group: 'ミニゲーム' },
    { id: `${GameScreen.MINI_GAME_GO_HOME}:GAME_OVER`, screen: GameScreen.MINI_GAME_GO_HOME, label: '帰宅ダッシュ：ゲームオーバー', group: 'ミニゲーム', miniGameOutcome: 'GAME_OVER' },
    { id: GameScreen.MINI_GAME_SURVIVOR, screen: GameScreen.MINI_GAME_SURVIVOR, label: '校庭サバイバー', group: 'ミニゲーム' },
    { id: `${GameScreen.MINI_GAME_SURVIVOR}:GAME_OVER`, screen: GameScreen.MINI_GAME_SURVIVOR, label: '校庭サバイバー：ゲームオーバー', group: 'ミニゲーム', miniGameOutcome: 'GAME_OVER' },
    { id: GameScreen.MINI_GAME_POKER, screen: GameScreen.MINI_GAME_POKER, label: '放課後ポーカー', group: 'ミニゲーム' },
    { id: `${GameScreen.MINI_GAME_POKER}:GAME_OVER`, screen: GameScreen.MINI_GAME_POKER, label: '放課後ポーカー：ゲームオーバー', group: 'ミニゲーム', miniGameOutcome: 'GAME_OVER' },
    { id: `${GameScreen.MINI_GAME_POKER}:ENDING`, screen: GameScreen.MINI_GAME_POKER, label: '放課後ポーカー：エンディング', group: 'ミニゲーム', miniGameOutcome: 'ENDING' },
    { id: GameScreen.MINI_GAME_DUNGEON, screen: GameScreen.MINI_GAME_DUNGEON, label: '風来の小学生', group: 'ミニゲーム' },
    { id: `${GameScreen.MINI_GAME_DUNGEON}:GAME_OVER`, screen: GameScreen.MINI_GAME_DUNGEON, label: '風来の小学生：ゲームオーバー', group: 'ミニゲーム', miniGameOutcome: 'GAME_OVER' },
    { id: `${GameScreen.MINI_GAME_DUNGEON}:ENDING`, screen: GameScreen.MINI_GAME_DUNGEON, label: '風来の小学生：エンディング', group: 'ミニゲーム', miniGameOutcome: 'ENDING' },
    { id: GameScreen.MINI_GAME_KOCHO, screen: GameScreen.MINI_GAME_KOCHO, label: '校長対決', group: 'ミニゲーム' },
    { id: `${GameScreen.MINI_GAME_KOCHO}:KOCHO_REWARD`, screen: GameScreen.MINI_GAME_KOCHO, label: '校長対決：報酬', group: 'ミニゲーム', miniGameOutcome: 'KOCHO_REWARD' },
    { id: `${GameScreen.MINI_GAME_KOCHO}:KOCHO_UPGRADE`, screen: GameScreen.MINI_GAME_KOCHO, label: '校長対決：休憩/強化', group: 'ミニゲーム', miniGameOutcome: 'KOCHO_UPGRADE' },
    { id: `${GameScreen.MINI_GAME_KOCHO}:KOCHO_SHOP`, screen: GameScreen.MINI_GAME_KOCHO, label: '校長対決：ショップ', group: 'ミニゲーム', miniGameOutcome: 'KOCHO_SHOP' },
    { id: `${GameScreen.MINI_GAME_KOCHO}:GAME_OVER`, screen: GameScreen.MINI_GAME_KOCHO, label: '校長対決：ゲームオーバー', group: 'ミニゲーム', miniGameOutcome: 'GAME_OVER' },
    { id: `${GameScreen.MINI_GAME_KOCHO}:ENDING`, screen: GameScreen.MINI_GAME_KOCHO, label: '校長対決：エンディング', group: 'ミニゲーム', miniGameOutcome: 'ENDING' },
    { id: GameScreen.MINI_GAME_PAPER_PLANE, screen: GameScreen.MINI_GAME_PAPER_PLANE, label: '紙飛行機バトル', group: 'ミニゲーム' },
    { id: `${GameScreen.MINI_GAME_PAPER_PLANE}:PAPER_REWARD`, screen: GameScreen.MINI_GAME_PAPER_PLANE, label: '紙飛行機バトル：報酬選択', group: 'ミニゲーム', miniGameOutcome: 'PAPER_REWARD' },
    { id: `${GameScreen.MINI_GAME_PAPER_PLANE}:PAPER_EQUIP`, screen: GameScreen.MINI_GAME_PAPER_PLANE, label: '紙飛行機バトル：パーツ換装', group: 'ミニゲーム', miniGameOutcome: 'PAPER_EQUIP' },
    { id: `${GameScreen.MINI_GAME_PAPER_PLANE}:PAPER_VACATION`, screen: GameScreen.MINI_GAME_PAPER_PLANE, label: '紙飛行機バトル：休暇/ショップ', group: 'ミニゲーム', miniGameOutcome: 'PAPER_VACATION' },
    { id: `${GameScreen.MINI_GAME_PAPER_PLANE}:PAPER_HANGAR`, screen: GameScreen.MINI_GAME_PAPER_PLANE, label: '紙飛行機バトル：機体改造', group: 'ミニゲーム', miniGameOutcome: 'PAPER_HANGAR' },
    { id: `${GameScreen.MINI_GAME_PAPER_PLANE}:GAME_OVER`, screen: GameScreen.MINI_GAME_PAPER_PLANE, label: '紙飛行機バトル：ゲームオーバー', group: 'ミニゲーム', miniGameOutcome: 'GAME_OVER' },
    { id: `${GameScreen.MINI_GAME_PAPER_PLANE}:ENDING`, screen: GameScreen.MINI_GAME_PAPER_PLANE, label: '紙飛行機バトル：エンディング', group: 'ミニゲーム', miniGameOutcome: 'ENDING' },
    { id: GameScreen.MINI_GAME_DUNGEON_2, screen: GameScreen.MINI_GAME_DUNGEON_2, label: '風来の小学生2', group: 'ミニゲーム' },
    { id: `${GameScreen.MINI_GAME_DUNGEON_2}:GAME_OVER`, screen: GameScreen.MINI_GAME_DUNGEON_2, label: '風来の小学生2：ゲームオーバー', group: 'ミニゲーム', miniGameOutcome: 'GAME_OVER' },
    { id: `${GameScreen.MINI_GAME_DUNGEON_2}:ENDING`, screen: GameScreen.MINI_GAME_DUNGEON_2, label: '風来の小学生2：エンディング', group: 'ミニゲーム', miniGameOutcome: 'ENDING' },

    { id: GameScreen.COMPENDIUM, screen: GameScreen.COMPENDIUM, label: '図鑑', group: 'その他' },
    { id: GameScreen.RANKING, screen: GameScreen.RANKING, label: 'ランキング', group: 'その他' },
    { id: GameScreen.HELP, screen: GameScreen.HELP, label: 'ヘルプ', group: 'その他' },
    { id: GameScreen.REWARD_CARD_ALBUM, screen: GameScreen.REWARD_CARD_ALBUM, label: 'ごほうびカード', group: 'その他' },
    { id: GameScreen.ASSIGNMENT_CREATE, screen: GameScreen.ASSIGNMENT_CREATE, label: '課題作成', group: 'その他' },
    { id: GameScreen.SUBMISSION, screen: GameScreen.SUBMISSION, label: '提出', group: 'その他' },
    { id: GameScreen.FLOOR_RESULT, screen: GameScreen.FLOOR_RESULT, label: 'ACT終了', group: 'その他' },
    { id: GameScreen.ENDING, screen: GameScreen.ENDING, label: 'エンディング', group: 'その他' },
    { id: GameScreen.GAME_OVER, screen: GameScreen.GAME_OVER, label: 'ゲームオーバー', group: 'その他' },
];

export const UI_PREVIEW_GROUPS = ['メインモード', '冒険', 'ミニゲーム', 'その他'] as const;

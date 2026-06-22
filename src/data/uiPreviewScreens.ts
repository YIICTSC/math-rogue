import { GameScreen } from '../types';

export interface UiPreviewScreenDefinition {
    screen: GameScreen;
    label: string;
    group: 'メインモード' | '冒険' | 'ミニゲーム' | 'その他';
}

export const UI_PREVIEW_SCREENS: UiPreviewScreenDefinition[] = [
    { screen: GameScreen.START_MENU, label: 'タイトル', group: 'メインモード' },
    { screen: GameScreen.MODE_SELECTION, label: '学習モード選択', group: 'メインモード' },
    { screen: GameScreen.PROBLEM_CHALLENGE, label: '問題チャレンジ', group: 'メインモード' },
    { screen: GameScreen.TYPING_MODE_SELECTION, label: 'タイピング選択', group: 'メインモード' },
    { screen: GameScreen.CHARACTER_SELECTION, label: '主人公選択', group: 'メインモード' },
    { screen: GameScreen.DIFFICULTY_SELECTION, label: '難易度選択', group: 'メインモード' },
    { screen: GameScreen.DECK_CONSTRUCTION, label: 'デッキ構築', group: 'メインモード' },
    { screen: GameScreen.RELIC_SELECTION, label: '初期レリック選択', group: 'メインモード' },

    { screen: GameScreen.MAP, label: 'マップ', group: '冒険' },
    { screen: GameScreen.BATTLE, label: '戦闘', group: '冒険' },
    { screen: GameScreen.REST, label: '休憩', group: '冒険' },
    { screen: GameScreen.SHOP, label: 'ショップ', group: '冒険' },
    { screen: GameScreen.GARDEN, label: 'ガーデン', group: '冒険' },

    { screen: GameScreen.MINI_GAME_SELECT, label: 'ミニゲーム選択', group: 'ミニゲーム' },
    { screen: GameScreen.MINI_GAME_GO_HOME, label: '帰宅ダッシュ', group: 'ミニゲーム' },
    { screen: GameScreen.MINI_GAME_SURVIVOR, label: '校庭サバイバー', group: 'ミニゲーム' },
    { screen: GameScreen.MINI_GAME_POKER, label: '放課後ポーカー', group: 'ミニゲーム' },
    { screen: GameScreen.MINI_GAME_DUNGEON, label: '風来の小学生', group: 'ミニゲーム' },
    { screen: GameScreen.MINI_GAME_KOCHO, label: '校長対決', group: 'ミニゲーム' },
    { screen: GameScreen.MINI_GAME_PAPER_PLANE, label: '紙飛行機バトル', group: 'ミニゲーム' },
    { screen: GameScreen.MINI_GAME_DUNGEON_2, label: '風来の小学生2', group: 'ミニゲーム' },

    { screen: GameScreen.COMPENDIUM, label: '図鑑', group: 'その他' },
    { screen: GameScreen.RANKING, label: 'ランキング', group: 'その他' },
    { screen: GameScreen.HELP, label: 'ヘルプ', group: 'その他' },
    { screen: GameScreen.REWARD_CARD_ALBUM, label: 'ごほうびカード', group: 'その他' },
    { screen: GameScreen.ASSIGNMENT_CREATE, label: '課題作成', group: 'その他' },
    { screen: GameScreen.SUBMISSION, label: '提出', group: 'その他' },
    { screen: GameScreen.FLOOR_RESULT, label: 'ACT終了', group: 'その他' },
    { screen: GameScreen.ENDING, label: 'エンディング', group: 'その他' },
    { screen: GameScreen.GAME_OVER, label: 'ゲームオーバー', group: 'その他' },
];

export const UI_PREVIEW_GROUPS = ['メインモード', '冒険', 'ミニゲーム', 'その他'] as const;

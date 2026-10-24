import React, { useState } from 'react';
import { GameScreen, type LanguageMode } from '../../types';
import ResponsiveTitleArt, { type MiniGameTitleArt } from './ResponsiveTitleArt';
import './illustratedEntry.css';

const entries: Partial<Record<GameScreen, { art: MiniGameTitleArt; title: [string, string, string] }>> = {
  [GameScreen.MINI_GAME_SHOGI]: { art: 'shogi', title: ['ミニ将棋', 'Mini Shogi', 'ミニしょうぎ'] },
  [GameScreen.MINI_GAME_GO]: { art: 'go', title: ['九路盤 囲碁', 'Nine-line Go', 'きゅうろばん いご'] },
  [GameScreen.MINI_GAME_CHESS]: { art: 'chess', title: ['スクールチェス', 'School Chess', 'スクールチェス'] },
  [GameScreen.MINI_GAME_MAHJONG]: { art: 'mahjong', title: ['まなび麻雀', 'Learning Mahjong', 'まなびマージャン'] },
  [GameScreen.MINI_GAME_STONE_GLOW]: { art: 'stone-glow', title: ['石ころの煌めき', 'Stone Glow', 'いしころのきらめき'] },
  [GameScreen.MINI_GAME_SCHOOL_TRPG]: { art: 'school-trpg', title: ['放課後スクールTRPG', 'After-school School TRPG', 'ほうかごスクールTRPG'] },
  [GameScreen.MINI_GAME_LEARNING_TCG]: { art: 'learning-tcg', title: ['学習ローグTCG', 'Learning Rogue TCG', 'がくしゅうローグTCG'] },
  [GameScreen.MINI_GAME_CRANE]: { art: 'crane', title: ['クレーンゲーム', 'Crane Game', 'クレーンゲーム'] },
};

export default function IllustratedMiniGameEntry({ screen, languageMode = 'JAPANESE', onBack, bypass, children }: {
  screen: GameScreen; languageMode?: LanguageMode; onBack: () => void; bypass?: boolean; children: React.ReactNode;
}) {
  const [entered, setEntered] = useState(false);
  const entry = entries[screen];
  if (!entry || entered || bypass) return <>{children}</>;
  const index = languageMode === 'ENGLISH' ? 1 : languageMode === 'HIRAGANA' ? 2 : 0;
  return <section className="illustrated-mini-entry" data-gamepad-navigation-root
    data-gamepad-initial-scope={`illustrated-${entry.art}`} aria-label={entry.title[index]}>
    <ResponsiveTitleArt game={entry.art} className="illustrated-mini-entry-art"/>
    <div className="illustrated-mini-entry-copy"><small>LEARNING ROGUE · GAME COLLECTION</small><h1>{entry.title[index]}</h1></div>
    <nav>
      <button autoFocus data-gamepad-initial-choice onClick={() => setEntered(true)}>{['はじめる', 'Start', 'はじめる'][index]} <span aria-hidden="true">→</span></button>
      <button data-gamepad-back onClick={onBack}>{['ゲーム一覧へ', 'Back to games', 'ゲームいちらんへ'][index]}</button>
    </nav>
  </section>;
}

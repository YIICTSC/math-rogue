import { createContext, type ReactNode } from 'react';
import type { TableProfile } from './PeerTableRoom';

export type LocalMatchResult = 'win' | 'loss' | 'draw';
export type LocalTableMatch<Game> = {
  game: Game;
  player: TableProfile;
  opponent: TableProfile;
  onResult: (result: LocalMatchResult) => void;
};

export function duelResult(winners: readonly number[], self: number): LocalMatchResult {
  if(winners.length!==1)return 'draw';
  return winners[0]===self?'win':'loss';
}

export const LocalTablePortraits = createContext<Readonly<Record<string, ReactNode>>>({});

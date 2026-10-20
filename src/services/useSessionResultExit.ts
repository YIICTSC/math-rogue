import {useEffect, useRef} from 'react';
import type {ResultGame} from './sessionResults';

export function useSessionResultExit(game: ResultGame, exit: () => void) {
  const latest = useRef(exit); latest.current = exit;
  useEffect(() => {
    const close = (event: Event) => { if ((event as CustomEvent).detail === game) latest.current(); };
    window.addEventListener('learning-rogue:session-result-close', close);
    return () => window.removeEventListener('learning-rogue:session-result-close', close);
  }, [game]);
}

import { useEffect, useRef } from 'react';
import { audioService, type BgmThemeId } from '../../services/audioService';
type Track = Parameters<typeof audioService.acquireBgmScene>[0];
export function useFlightMusic(track: Track, theme: BgmThemeId = 'elementary', priority = 25) {
  const scope = useRef<ReturnType<typeof audioService.acquireBgmScene> | null>(null);
  const saved = audioService.getBgmMode();
  const type = track === 'star_tide_sky' && saved === 'OLD' ? 'paper_plane_vacation' : track;
  const actualTheme = type === 'star_tide_sky' ? 'star-tide' : theme;
  useEffect(() => {
    const options = { theme: actualTheme };
    if (scope.current) scope.current.update(type, options);
    else scope.current = audioService.acquireBgmScene(type, options, priority);
  }, [type, actualTheme, priority]);
  useEffect(
    () => () => {
      scope.current?.();
      scope.current = null;
    },
    [],
  );
}

import React from 'react';
import { assetUrl } from '../../utils/assetPaths';
import './responsiveTitleArt.css';

export const MINI_GAME_TITLE_ART = [
  'card-club', 'kocho', 'poker', 'survivor', 'dungeons', 'dungeons2',
  'paper-plane', 'go-home', 'shogi', 'go', 'chess', 'mahjong', 'stone-glow',
  'school-trpg', 'learning-tcg', 'vr', 'crane', 'kart', 'golf', 'tennis', 'dodgeball',
] as const;
export type MiniGameTitleArt = typeof MINI_GAME_TITLE_ART[number];
export const titleArtPath = (game: MiniGameTitleArt, orientation: 'portrait' | 'landscape') =>
  `sprites/mini-game-titles/${game}-${orientation}-v1.webp`;

/** Separate compositions for phones and widescreens, selected before the image downloads. */
export default function ResponsiveTitleArt({ game, className = '', style }: {
  game: MiniGameTitleArt;
  className?: string;
  style?: React.CSSProperties;
}) {
  return <picture data-title-art={game} style={{ display: 'contents' }}>
    <source media="(orientation: portrait)" srcSet={assetUrl(titleArtPath(game, 'portrait'))}/>
    <img className={className} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', ...style }} src={assetUrl(titleArtPath(game, 'landscape'))}
      alt="" decoding="async" fetchPriority="high"/>
  </picture>;
}

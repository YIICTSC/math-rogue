import React, { useEffect, useRef } from 'react';
import MathText from '../components/MathText';
import { drawProblemVisual } from '../utils/drawProblemVisual';
import { MAP_SYMBOL_ASSET_MAP } from '../components/mapSymbolImageMap';
import type { ShowView } from './types';
export default function QuestionContent({ round }: { round: NonNullable<ShowView['round']> }) {
  const canvas = useRef<HTMLCanvasElement>(null), symbol = round.visual?.kind === 'map_symbol' ? MAP_SYMBOL_ASSET_MAP[round.visual.symbol] : null;
  useEffect(() => { if (canvas.current && round.visual && !symbol) { try { drawProblemVisual(canvas.current, round.visual); } catch { /* A malformed custom visual must not stop the show. */ } } }, [round.id, round.visual, symbol]);
  return <div className="qs-question-content" data-allow-japanese="true">{round.passage && <p className="qs-passage">{round.passage}</p>}<h2><MathText text={round.prompt} /></h2>{round.visual && (symbol ? <img src={symbol.src} alt="" /> : <canvas ref={canvas} width={600} height={400} aria-label="Question diagram" />)}</div>;
}

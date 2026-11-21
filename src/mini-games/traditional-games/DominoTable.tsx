import { dominoFaces } from './domino';
import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { LanguageMode } from '../../types';
import type { TableView } from './engine';
import { say } from './catalog';
import { pipPositions, tableArt } from './Pieces';
import { layoutDomino, type DominoLayout, type DominoPoint } from './dominoLayout';

type View = Pick<
  Extract<TableView, { kind: 'domino' | 'domino-lanes' }>,
  'game' | 'round' | 'hub' | 'lines' | 'players' | 'forced'
>;
type Camera = { zoom: number; x: number; y: number };
const fitted: Camera = { zoom: 1, x: 0, y: 0 };
const distance = (a: DominoPoint, b: DominoPoint) => Math.hypot(a.x - b.x, a.y - b.y);
export function DominoTable({
  view,
  language,
  label,
  targets,
  place,
  fixedLayout,
}: {
  view: View;
  language: LanguageMode;
  label: (line: number) => string;
  targets: number[];
  place: (line: number) => void;
  fixedLayout?: DominoLayout;
}) {
  const grain = useId().replace(/:/g, '');
  const l = (ja: string, en: string, kana?: string) => say(language, [ja, en, kana]);
  const layout = useMemo(
    () => fixedLayout ?? layoutDomino(view.hub, view.lines, view.game === 'mexican'),
    [view.hub, view.lines, view.game, fixedLayout],
  );
  const svg = useRef<SVGSVGElement>(null);
  const pointers = useRef(new Map<number, DominoPoint>());
  const [ratio, setRatio] = useState(1.6);
  const [camera, setCamera] = useState<Camera>(fitted);
  const [auto, setAuto] = useState(true);
  const bounds = layout.bounds;
  const height = Math.max(bounds.height, bounds.width / ratio),
    width = height * ratio;
  const center = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
  const fit = () => {
    setCamera(fitted);
    setAuto(true);
  };
  useEffect(() => {
    if (auto) setCamera(fitted);
  }, [auto, layout]);
  useEffect(() => {
    fit();
  }, [view.round, view.game]);
  useEffect(() => {
    const element = svg.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.height > 0)
        setRatio(entry.contentRect.width / entry.contentRect.height);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const zoomAt = (factor: number, client?: DominoPoint) => {
    const rect = svg.current?.getBoundingClientRect();
    setAuto(false);
    setCamera((old) => {
      const zoom = Math.max(1, Math.min(8, old.zoom * factor));
      const x = rect && client ? (client.x - rect.left) / rect.width - 0.5 : 0;
      const y = rect && client ? (client.y - rect.top) / rect.height - 0.5 : 0;
      return {
        zoom,
        x: old.x + x * width * (1 / old.zoom - 1 / zoom),
        y: old.y + y * height * (1 / old.zoom - 1 / zoom),
      };
    });
  };
  useEffect(() => {
    const element = svg.current;
    if (!element) return;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      zoomAt(Math.exp(-event.deltaY * 0.002), { x: event.clientX, y: event.clientY });
    };
    element.addEventListener('wheel', wheel, { passive: false });
    return () => element.removeEventListener('wheel', wheel);
  }, [width, height]);
  const release = (event: React.PointerEvent<SVGSVGElement>) => {
    pointers.current.delete(event.pointerId);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  };
  return (
    <div className="tt-domino-table">
      <div className="tt-board-tools">
        <button type="button" onClick={fit} aria-pressed={auto}>
          {l('全体表示', 'Fit table', 'ぜんたいひょうじ')}
        </button>
        <button
          type="button"
          onClick={() => zoomAt(1 / 1.4)}
          disabled={camera.zoom <= 1}
          aria-label={l('縮小', 'Zoom out', 'しゅくしょう')}
        >
          −
        </button>
        <span>{Math.round(camera.zoom * 100)}%</span>
        <button
          type="button"
          onClick={() => zoomAt(1.4)}
          disabled={camera.zoom >= 8}
          aria-label={l('拡大', 'Zoom in', 'かくだい')}
        >
          ＋
        </button>
      </div>
      <svg
        ref={svg}
        className="tt-domino-map"
        role="group"
        aria-label={l('ドミノの盤面', 'Domino table', 'ドミノの ばんめん')}
        viewBox={`${center.x + camera.x - width / camera.zoom / 2} ${center.y + camera.y - height / camera.zoom / 2} ${width / camera.zoom} ${height / camera.zoom}`}
        onDoubleClick={fit}
        onPointerDown={(event) => {
          if (event.button !== 0 || (event.target as Element).closest('button, [role="button"]'))
            return;
          event.currentTarget.setPointerCapture(event.pointerId);
          pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
        }}
        onPointerMove={(event) => {
          const old = pointers.current.get(event.pointerId);
          if (!old) return;
          const before = [...pointers.current.values()];
          const next = { x: event.clientX, y: event.clientY };
          pointers.current.set(event.pointerId, next);
          const after = [...pointers.current.values()];
          const rect = event.currentTarget.getBoundingClientRect();
          const a =
            before.length > 1
              ? { x: (before[0].x + before[1].x) / 2, y: (before[0].y + before[1].y) / 2 }
              : old;
          const b =
            after.length > 1
              ? { x: (after[0].x + after[1].x) / 2, y: (after[0].y + after[1].y) / 2 }
              : next;
          const factor =
            before.length > 1
              ? distance(after[0], after[1]) / Math.max(1, distance(before[0], before[1]))
              : 1;
          setAuto(false);
          setCamera((current) => {
            const zoom = Math.max(1, Math.min(8, current.zoom * factor));
            return {
              zoom,
              x:
                current.x +
                (((a.x - rect.left) / rect.width - 0.5) * width) / current.zoom -
                (((b.x - rect.left) / rect.width - 0.5) * width) / zoom,
              y:
                current.y +
                (((a.y - rect.top) / rect.height - 0.5) * height) / current.zoom -
                (((b.y - rect.top) / rect.height - 0.5) * height) / zoom,
            };
          });
        }}
        onPointerUp={release}
        onPointerCancel={release}
        onLostPointerCapture={(event) => pointers.current.delete(event.pointerId)}
      >
        {layout.engine && (
          <>
            <defs>
              <pattern
                id={grain}
                width="220"
                height="220"
                patternUnits="userSpaceOnUse"
                x="-110"
                y="-110"
              >
                <image href={tableArt('maple')} width="220" height="220" />
              </pattern>
            </defs>
            <path
              className="tt-domino-engine"
              d="M-45,-105H45L105,-45V45L45,105H-45L-105,45V-45Z"
              fill={`url(#${grain})`}
            />
          </>
        )}
        {layout.labels.map((point) => (
          <text
            key={point.line}
            x={point.x}
            y={point.y}
            className="tt-domino-slot-label"
            textAnchor="middle"
            dominantBaseline="central"
          >
            <title>{label(point.line)}</title>
            {view.game === 'mexican' && point.line === view.players.length ? '★' : point.line + 1}
          </text>
        ))}
        <defs>
          <linearGradient id={grain + '-ivory'} x2=".55" y2="1" gradientUnits="objectBoundingBox">
            <stop stopColor="#fffef6" />
            <stop offset=".65" stopColor="#f6f0de" />
            <stop offset="1" stopColor="#daceb4" />
          </linearGradient>
          <radialGradient id={grain + '-pip'} cx=".65" cy=".75">
            <stop stopColor="#424139" />
            <stop offset="1" stopColor="#10100d" />
          </radialGradient>
        </defs>
        {layout.nodes.map((node) => (
          <g
            key={node.key}
            className="tt-domino-map-tile"
            data-tile={node.tile}
            data-claim={view.game === 'bluffing' || undefined}
            transform={`translate(${node.x} ${node.y}) rotate(${(node.angle * 180) / Math.PI})`}
          >
            <rect x="-32" y="-15" width="64" height="32" rx="3.8" fill="#8b816d" />
            <rect
              className={view.game === 'bluffing' ? 'tt-traditional-claim' : undefined}
              x="-31.7"
              y="-16"
              width="63.4"
              height="31"
              rx="3.5"
              fill={`url(#${grain}-ivory)`}
              stroke="#b9ac93"
              strokeWidth=".65"
            />
            <path d="M0 -12V12" stroke="#b7ab90" strokeWidth=".85" />
            {dominoFaces(node.tile).map((value, half) => {
              const columns = value > 9 ? 4 : 3;
              return pipPositions(value).map((i) => (
                <circle
                  key={half + '-' + i}
                  className="tt-dot"
                  cx={
                    -16 +
                    32 * half +
                    ((i % columns) - (columns - 1) / 2) * (columns === 4 ? 5.8 : 7.3)
                  }
                  cy={(Math.floor(i / columns) - 1) * 7.2}
                  r={columns === 4 ? 2.05 : 2.45}
                  fill={`url(#${grain}-pip)`}
                />
              ));
            })}
          </g>
        ))}
        {layout.ends.map((end) => (
          <g
            key={end.line}
            className="tt-domino-map-end"
            data-target={targets.includes(end.line)}
            role="button"
            tabIndex={targets.includes(end.line) ? 0 : -1}
            aria-disabled={!targets.includes(end.line)}
            aria-label={label(end.line) + ' · ' + end.pip}
            onClick={() => targets.includes(end.line) && place(end.line)}
            onKeyDown={(event) => {
              if ((event.key === 'Enter' || event.key === ' ') && targets.includes(end.line)) {
                event.preventDefault();
                place(end.line);
              }
            }}
            transform={`translate(${end.x},${end.y})`}
          >
            <circle r="15" />
            <text textAnchor="middle" dominantBaseline="central">
              {end.pip}
            </text>
          </g>
        ))}
      </svg>
      {view.hub === null && (
        <div className="tt-domino-opening">
          {l(
            '最初の牌を置きましょう',
            'Set down the opening tile',
            'さいしょの はいを おきましょう',
          )}
        </div>
      )}
      <small className="tt-map-help">
        {l(
          'ドラッグで移動・2本指で拡大縮小',
          'Drag to pan · Pinch or scroll to zoom',
          'ドラッグで いどう・2ほんゆびで かくだいしゅくしょう',
        )}
      </small>
      <div className="tt-domino-ends">
        {layout.ends
          .filter((end) => targets.includes(end.line))
          .map((end) => (
            <button
              type="button"
              key={end.line}
              className="tt-end"
              disabled={!targets.includes(end.line)}
              onClick={() => place(end.line)}
            >
              {label(end.line)}
              {view.forced.includes(end.line) ? ' ◆' : ''} · <b>{end.pip}</b>
              {targets.includes(end.line) ? ' ＋' : ''}
            </button>
          ))}
      </div>
    </div>
  );
}

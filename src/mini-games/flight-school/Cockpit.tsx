import React from 'react';
import type { LanguageMode } from '../../types';
import { localize, type Phrase } from './courses';
import { aimPoint, altitude, bearingTo, windAt, type Flight } from './simulation';
import {
  adjustTrim,
  configure,
  instrumentNames,
  logFix,
  selectPanel,
  type Panel,
  type Configuration,
} from './instruments';

export const panels: Panel[] = ['attitude', 'navigation', 'systems'];
const panelNames: Record<Panel, Phrase> = {
  attitude: ['姿勢', 'Attitude', 'しせい'],
  navigation: ['航法', 'Nav', 'こうほう'],
  systems: ['機器', 'Systems', 'きき'],
};
const configNames: Record<Configuration, Phrase> = {
  departure: ['出発', 'Departure', 'しゅっぱつ'],
  cruise: ['巡航', 'Cruise', 'じゅんこう'],
  landing: ['着陸', 'Landing', 'ちゃくりく'],
};
const course = (angle: number) =>
  String((Math.round((angle * 180) / Math.PI) + 360) % 360).padStart(3, '0') + '°';
export function Cockpit({
  flight: s,
  language,
  refresh,
}: {
  flight: Flight;
  language: LanguageMode;
  refresh: () => void;
}) {
  const c = s.instruments!;
  const t = (...p: Phrase) => localize(p, language);
  const apply = (f: () => void) => {
    f();
    refresh();
  };
  const target = aimPoint(s),
    wind = windAt(s);
  return (
    <section
      className="fs-cockpit"
      aria-label={t('操縦計器', 'Flight instruments', 'そうじゅうけいき')}
    >
      <nav>
        {panels.map((p, i) => (
          <button
            key={p}
            aria-pressed={c.panel === p}
            onClick={() => apply(() => selectPanel(s, p))}
          >
            {i + 1} {localize(panelNames[p], language)}
          </button>
        ))}
      </nav>
      {c.panel === 'attitude' ? (
        <div className="fs-instrument-face">
          <div
            className="fs-horizon"
            aria-label={t('姿勢指示器', 'Artificial horizon', 'しせいしじき')}
          >
            <i
              style={{ transform: 'rotate(' + -s.bank + 'rad) translateY(' + s.pitch * 50 + '%)' }}
            />
            <b>─ ◇ ─</b>
          </div>
          <div>
            <strong>{Math.round(altitude(s))} m</strong>
            <small>
              {Math.round(s.speed * 3.6)} km/h · {s.vertical.toFixed(1)} m/s
            </small>
            <small>HDG {course(s.heading)}</small>
            {s.lesson.aircraft === 'jetpack' && (
              <small>
                {t('燃料', 'Fuel', 'ねんりょう')} {Math.ceil(s.fuel)}%
              </small>
            )}
          </div>
        </div>
      ) : c.panel === 'navigation' ? (
        <div className="fs-instrument-body">
          <strong>
            {t('次の目標方位', 'Bearing to next point', 'つぎの もくひょうほうい')}{' '}
            {course(s.heading + bearingTo(s, target))}
          </strong>
          <small>
            {Math.round(Math.hypot(s.x - target.x, s.z - target.z))} m · {t('風', 'Wind', 'かぜ')}{' '}
            {Math.hypot(wind.x, wind.z).toFixed(1)} m/s
          </small>
          <button
            disabled={c.fixLogged || !s.airborne || !s.nextGate}
            onClick={() => apply(() => logFix(s))}
          >
            {c.fixLogged
              ? t('航点記録済み ✓', 'Fix logged ✓', 'こうてん きろくずみ ✓')
              : t(
                  'リング通過後に航点を記録',
                  'Log fix after first ring',
                  'リング つうかごに こうてんを きろく',
                )}
          </button>
        </div>
      ) : (
        <div className="fs-instrument-body">
          {!c.armed ? (
            <button
              onClick={() =>
                apply(() => {
                  c.armed = true;
                })
              }
            >
              {t('計器電源を入れる', 'Switch on instruments', 'けいきでんげんを いれる')}
            </button>
          ) : (
            <>
              <small>
                {localize(instrumentNames[s.lesson.aircraft], language)}{' '}
                {c.cruiseChecked ? '✓' : ''}
              </small>
              <div className="fs-switches">
                {(Object.keys(configNames) as Configuration[]).map((k) => (
                  <button
                    key={k}
                    disabled={!c.started && k !== 'departure'}
                    aria-pressed={c.configuration === k}
                    onClick={() => apply(() => configure(s, k))}
                  >
                    {localize(configNames[k], language)}
                  </button>
                ))}
              </div>
              {!c.started ? (
                <button onClick={() => apply(() => selectPanel(s, 'attitude'))}>
                  {t(
                    '姿勢計に切替・開始',
                    'Select attitude & begin',
                    'しせいけいに きりかえ・かいし',
                  )}
                </button>
              ) : (
                <div className="fs-switches">
                  <button
                    onClick={() => apply(() => adjustTrim(c, -1))}
                    aria-label={t('トリム減', 'Trim down', 'トリムを さげる')}
                  >
                    −
                  </button>
                  <span>
                    {t('トリム', 'Trim', 'トリム')} {c.trim > 0 ? '+' : ''}
                    {c.trim}
                  </span>
                  <button
                    onClick={() => apply(() => adjustTrim(c, 1))}
                    aria-label={t('トリム増', 'Trim up', 'トリムを あげる')}
                  >
                    ＋
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
      {s.lesson.aircraft === 'plane' && (
        <div className="fs-power">
          <span>THR {Math.round(c.throttle * 100)}%</span>
          <meter value={c.throttle} min={0} max={1} />
        </div>
      )}
    </section>
  );
}

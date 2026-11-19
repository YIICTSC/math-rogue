import { PilotPicker, RadioCaption, type FlightCrew } from './FlightRadio';
import { loadRouteImages } from './routeImages';
import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowLeftRight, Plane } from 'lucide-react';
import type { LanguageMode } from '../../types';
import { assetUrl } from '../../utils/assetPaths';
import { audioService } from '../../services/audioService';
import { localize, type Lesson, type Phrase } from './courses';
import { ROUTES, ROUTE_SCENERY, PORT_NAMES, center, makeRouteLesson, photo } from './routes';
import { FLIGHT_ROUTE_LOG_KEY } from './logbook';
import type { Report } from './simulation';
import type { RouteImages } from './routeScene';
import FlightDeck from './FlightDeck';
import { useFlightMusic } from './music';

function readScore(key: string) {
  try {
    const n = JSON.parse(localStorage.getItem(FLIGHT_ROUTE_LOG_KEY) || '{}')?.[key];
    return Number.isInteger(n) && n >= 0 && n <= 100 ? n : undefined;
  } catch {
    return undefined;
  }
}
function saveScore(key: string, score: number) {
  try {
    const old = JSON.parse(localStorage.getItem(FLIGHT_ROUTE_LOG_KEY) || '{}');
    const scores = old && typeof old === 'object' && !Array.isArray(old) ? old : {};
    scores[key] = Math.max(readScore(key) ?? 0, score);
    localStorage.setItem(FLIGHT_ROUTE_LOG_KEY, JSON.stringify(scores));
  } catch {
    /* Flying remains available when storage is unavailable. */
  }
}
export default function RouteSchool({
  language,
  home,
  crew,
  exit,
}: {
  language: LanguageMode;
  home: string;
  crew: FlightCrew;
  exit: () => void;
}) {
  const t = (...p: Phrase) => localize(p, language);
  const [region, select] = useState(
    () => ROUTES.find((r) => r.ports.some((p) => p.code === home)) ?? ROUTES[0],
  );
  const [reverse, swap] = useState(region.ports[1].code === home),
    [assist, setAssist] = useState(true);
  const [stage, show] = useState<'planning' | 'loading' | 'flight' | 'result' | 'error'>(
    'planning',
  );
  const [loaded, setLoaded] = useState<{ lesson: Lesson; images: RouteImages } | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const request = useRef(0);
  useEffect(
    () => () => {
      request.current++;
    },
    [],
  );
  const from = region.ports[reverse ? 1 : 0],
    to = region.ports[reverse ? 0 : 1],
    key = from.code + '-' + to.code;
  const distance = Math.round(
    Math.hypot(center(from).x - center(to).x, center(from).z - center(to).z) / 1000,
  );
  const name = (code: string) => localize(PORT_NAMES[code], language);
  useFlightMusic(
    stage === 'flight' ? 'map' : stage === 'result' && report?.medal ? 'victory' : 'rest',
    stage === 'result' ? 'elementary' : 'high-school',
    30,
  );
  function back() {
    request.current++;
    exit();
  }
  async function launch() {
    crew.stop();
    audioService.init();
    audioService.playFlightSound('start');
    const id = ++request.current;
    show('loading');
    setReport(null);
    try {
      const images = await loadRouteImages(region, reverse);
      if (id !== request.current) return;
      setLoaded({ lesson: makeRouteLesson(region, reverse, assist), images });
      show('flight');
    } catch {
      if (id === request.current) show('error');
    }
  }
  function finish(result: Report) {
    if (!result.medal) crew.stop();
    if (result.medal) saveScore(key, result.score);
    audioService.playFlightSound(
      result.medal ? 'land' : result.reason === 'water' ? 'water' : 'end',
    );
    setReport(result);
    show('result');
  }
  if (stage === 'flight' && loaded)
    return (
      <>
        <FlightDeck
          onRadio={crew.cue}
          onRadioStop={crew.stop}
          lesson={loaded.lesson}
          routeImages={loaded.images}
          language={language}
          onRetry={launch}
          onExit={() => {
            crew.stop();
            show('planning');
          }}
          onDone={finish}
        />
        <RadioCaption line={crew.line} language={language} />
      </>
    );
  return (
    <div className="fs-shell">
      <nav className="fs-nav">
        <button onClick={back}>
          <ArrowLeft size={16} />
          {t('格納庫', 'Hangar', 'かくのうこ')}
        </button>
      </nav>
      <section className="fs-panel fs-result fs-sorties fs-route-plan">
        <div
          className="fs-route-chart"
          style={{ backgroundImage: 'url("' + assetUrl(photo(region.key)) + '")' }}
        >
          <h1>{t('空港間フライト', 'Airport routes', 'くうこうかんフライト')}</h1>
          <strong>
            {from.code} <ArrowRight size={18} /> {to.code}
          </strong>
        </div>
        {stage === 'result' && report ? (
          <>
            <h2>
              {report.medal
                ? t('到着しました', 'Arrival complete', 'とうちゃくしました')
                : t('フライト終了', 'Flight ended', 'フライトしゅうりょう')}
            </h2>
            <p>
              {name(from.code)} → {name(to.code)} · {distance} km · {Math.floor(report.time / 60)} m{' '}
              {Math.floor(report.time % 60)} s
            </p>
            {report.medal ? (
              <b>{report.score} / 100</b>
            ) : (
              <p>
                {report.reason === 'boundary'
                  ? t(
                      '航路図の外に出ました。矢印を目印に旋回してください。',
                      'You left the chart. Turn toward the bearing arrow.',
                      'こうろずの そとに でました。やじるしへ せんかいしよう。',
                    )
                  : report.reason === 'water'
                    ? t(
                        '着水しました。滑走路まで高度を保ちましょう。',
                        'Water landing. Hold altitude until you reach the runway.',
                        'ちゃくすいしました。かっそうろまで こうどを たもとう。',
                      )
                    : t(
                        '目的地の滑走路に機首をそろえ、減速して接地しましょう。',
                        'Line up with the destination runway and slow down before touchdown.',
                        'もくてきちの かっそうろに むきを そろえて げんそくしよう。',
                      )}
              </p>
            )}
            <RadioCaption line={crew.line} language={language} />
            <div className="fs-which">
              <button
                className="fs-main"
                onClick={() => {
                  crew.stop();
                  if (report.medal) swap(!reverse);
                  show('planning');
                }}
              >
                {report.medal
                  ? t('折り返し便へ', 'Plan return flight', 'おりかえしびんへ')
                  : t('航路選択へ', 'Route selection', 'こうろせんたくへ')}
              </button>
              <button onClick={launch}>{t('もう一度飛ぶ', 'Fly again', 'もういちど とぶ')}</button>
            </div>
          </>
        ) : stage === 'loading' ? (
          <p role="status">
            {t('地形を読み込み中…', 'Loading terrain…', 'ちけいを よみこみちゅう…')}
          </p>
        ) : (
          <>
            <label>
              {t('航路', 'Route', 'こうろ')}{' '}
              <select
                value={region.key}
                onChange={(e) => {
                  select(ROUTES.find((r) => r.key === e.target.value)!);
                  swap(false);
                  show('planning');
                }}
              >
                {ROUTES.map((r) => (
                  <option key={r.key} value={r.key}>
                    {r.ports.map((p) => name(p.code)).join(' ↔ ')}
                  </option>
                ))}
              </select>
            </label>
            <PilotPicker compact pilot={crew.pilot} select={crew.select} language={language} />
            <div className="fs-route-leg">
              <b>
                {name(from.code)} → {name(to.code)} · {distance} km
              </b>
              <button onClick={() => swap(!reverse)}>
                <ArrowLeftRight size={15} />
                {t('出発・到着を交換', 'Reverse route', 'しゅっぱつ・とうちゃくを こうかん')}
              </button>
            </div>
            <p>
              {localize(ROUTE_SCENERY[region.key], language)}
              {readScore(key) !== undefined &&
                ' · ' + t('最高', 'Best', 'さいこう') + ' ' + readScore(key) + '/100'}
            </p>
            <label>
              <input
                type="checkbox"
                checked={assist}
                onChange={(e) => setAssist(e.target.checked)}
              />{' '}
              {t('航路アシスト', 'Route assist', 'こうろアシスト')}
            </label>
            <p>
              {assist
                ? t(
                    '加速と↑で離陸。空中で操作を離すと、機体が航路をたどり、目的地の滑走路に進入します。',
                    'Hold power and up to take off. Release the controls in the air to follow the route and approach the destination runway.',
                    'かそくと ↑で りりく。そらで そうさを はなすと、こうろに そって もくてきちへ むかいます。',
                  )
                : t(
                    '加速と↑で離陸。方位矢印と目標高度に合わせて巡航し、到着空港で減速して着陸。',
                    'Hold power and up to take off. Follow the bearing and altitude targets, then slow down to land.',
                    'かそくと ↑で りりく。やじるしと もくひょうこうどに あわせ、とびながら げんそくして ちゃくりく。',
                  )}
            </p>
            <small>
              {t(
                '空港を離れると巡航が早送りになります。',
                'Cruise time speeds up away from airports.',
                'くうこうから はなれると はやおくりに なります。',
              )}
            </small>
            {stage === 'error' && (
              <p role="alert">
                {t(
                  '地形画像を読み込めませんでした。もう一度出発してください。',
                  'Terrain imagery could not load. Try departing again.',
                  'ちけいがぞうを よみこめませんでした。もういちど しゅっぱつしてください。',
                )}
              </p>
            )}
            <div className="fs-which">
              <button className="fs-main" onClick={launch}>
                <Plane size={18} />
                {t('滑走路から出発', 'Depart from runway', 'かっそうろから しゅっぱつ')}
              </button>
            </div>
          </>
        )}
        <details className="fs-chart-source">
          <summary>
            {t('地形・写真の出典', 'Terrain and imagery credits', 'ちけい・しゃしんの しゅってん')}
          </summary>
          <p>
            <a
              href="https://maps.gsi.go.jp/development/ichiran.html"
              target="_blank"
              rel="noreferrer"
            >
              {t(
                '地理院タイル（写真・標高）を加工',
                'Adapted from GSI imagery and elevation tiles',
                'ちりいんタイル（しゃしん・ひょうこう）を かこう',
              )}
            </a>
          </p>
          <p>
            {t(
              'データソース：Landsat8画像（GSI,TSIC,GEO Grid/AIST）, Landsat8画像（courtesy of the U.S. Geological Survey）, 海底地形（GEBCO）',
              'Sources: Landsat 8 imagery (GSI, TSIC, GEO Grid/AIST), Landsat 8 imagery (courtesy of the U.S. Geological Survey), bathymetry (GEBCO).',
              'データソース：Landsat8がぞう（GSI, TSIC, GEO Grid/AIST）, Landsat8がぞう（courtesy of the U.S. Geological Survey）, かいていちけい（GEBCO）',
            )}
          </p>
          <p>Runways · OurAirports (public domain)</p>
        </details>
      </section>
    </div>
  );
}

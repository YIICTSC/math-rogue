import { multiTouchAction } from '../../utils/multiTouchAction';
import { ADVANCED_MISSIONS, advancedLesson } from './advancedMissions';
import { readLicenses } from './licenses';
import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Flag } from 'lucide-react';
import MiniGameProblemChallenge from '../../components/MiniGameProblemChallenge';
import type { LanguageMode } from '../../types';
import { audioService } from '../../services/audioService';
import { localize, makeLesson, type Airport, type Phrase, type Lesson } from './courses';
import { MISSIONS, scoreSortie } from './combat';
import { newPatrol } from './patrol';
import { PilotPicker, RadioCaption, type FlightCrew } from './FlightRadio';
import { useFlightMusic } from './music';
import { FLIGHT_COMBAT_LOG_KEY } from './logbook';
import { ADVANCED_ROUTES, ROUTES, PORT_NAMES, makeRouteLesson } from './routes';
import { loadRouteImages } from './routeImages';
import type { RouteImages } from './routeScene';
import type { Report } from './simulation';
import FlightDeck from './FlightDeck';

type Study = Pick<
  React.ComponentProps<typeof MiniGameProblemChallenge>,
  'mode' | 'modePool' | 'assignment' | 'answerMode' | 'onAnswerResult'
>;
function readBest(): Record<string, number> {
  try {
    const value = JSON.parse(localStorage.getItem(FLIGHT_COMBAT_LOG_KEY) || '{}');
    return Object.fromEntries(
      Object.entries(value).filter(
        ([, v]) => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 100,
      ),
    ) as Record<string, number>;
  } catch {
    return {};
  }
}
export default function CombatSchool({
  airport,
  crew: radio,
  language,
  onExit,
  study,
}: {
  airport: Airport;
  crew: FlightCrew;
  language: LanguageMode;
  onExit: () => void;
  study: Study;
}) {
  const t = (...p: Phrase) => localize(p, language);
  const [mission, select] = useState(MISSIONS[0]),
    [assist, setAssist] = useState(false),
    [stage, setStage] = useState<'brief' | 'quiz' | 'loading' | 'error' | 'play' | 'result'>(
      'brief',
    );
  const cleared = readLicenses().sorties;
  const [tomcat, selectJet] = useState(false);
  const mode = 'exam';
  const { pilot, select: setPilot } = radio;
  const [routeKey, setRouteKey] = useState('local');
  const [reverse, setReverse] = useState(false);
  const region = [...ROUTES, ...ADVANCED_ROUTES].find(
    (r) => r.key === (mission.region ?? routeKey),
  );
  const chartKey = region
    ? region.ports[reverse ? 1 : 0].code + '-' + region.ports[reverse ? 0 : 1].code
    : airport.code;
  const [flight, setFlight] = useState<{
    lesson: Lesson;
    images?: RouteImages;
    patrol: ReturnType<typeof newPatrol>;
  } | null>(null);
  const [landing, setLanding] = useState<Report | null>(null),
    [book, setBook] = useState(readBest);
  const request = useRef(0);
  useEffect(
    () => () => {
      request.current++;
    },
    [],
  );
  const sortie = flight?.patrol.sortie;
  const passed = landing?.reason === 'landed' && sortie?.finished === 'clear';
  useFlightMusic(
    stage === 'play'
      ? 'paper_plane_battle'
      : stage === 'quiz'
        ? 'math'
        : stage === 'result' && passed
          ? 'victory'
          : 'paper_plane_setup',
    'elementary',
    30,
  );
  async function fly() {
    radio.stop();
    audioService.init();
    audioService.playFlightSound('start');
    const id = ++request.current;
    setStage('loading');
    try {
      const images = region ? await loadRouteImages(region, reverse) : undefined;
      if (id !== request.current) return;
      setFlight({
        lesson: mission.region
          ? advancedLesson(mission, assist)
          : region
            ? makeRouteLesson(region, reverse, assist)
            : makeLesson(airport, 'plane', mode),
        images,
        patrol: newPatrol(mission, mode, assist, cleared >= 2, tomcat && cleared >= 4),
      });
      setLanding(null);
      setStage('play');
    } catch {
      if (id === request.current) setStage('error');
    }
  }
  function beginStudy() {
    radio.stop();
    setStage('quiz');
  }
  function brief() {
    request.current++;
    radio.stop();
    setStage('brief');
  }
  function finish(result?: Report) {
    if (!sortie) return;
    const success = result?.reason === 'landed' && sortie.finished === 'clear';
    setLanding(result ?? null);
    if (!success) radio.stop();
    audioService.playFlightSound(success ? 'land' : 'end');
    if (success) {
      const key = [chartKey, mission.id, mode].join('/'),
        saved = readBest();
      saved[key] = Math.max(saved[key] ?? 0, scoreSortie(sortie));
      setBook(saved);
      try {
        localStorage.setItem(FLIGHT_COMBAT_LOG_KEY, JSON.stringify(saved));
      } catch {}
    }
    setStage('result');
  }
  if (stage === 'quiz')
    return (
      <div className="fs-quiz">
        <MiniGameProblemChallenge {...study} languageMode={language} onComplete={fly} />
      </div>
    );
  if (stage === 'play' && flight)
    return (
      <>
        <FlightDeck
          lesson={flight.lesson}
          language={language}
          routeImages={flight.images}
          patrol={flight.patrol}
          onRadio={radio.cue}
          onRadioStop={radio.stop}
          onPatrolLost={() => finish()}
          onDone={finish}
          onExit={brief}
          onRetry={beginStudy}
        />
        <RadioCaption line={radio.line} language={language} />
      </>
    );
  return (
    <div className="fs-shell">
      <nav className="fs-nav">
        <button {...multiTouchAction(onExit)}>
          <ArrowLeft size={16} />
          {t('格納庫', 'Hangar', 'かくのうこ')}
        </button>
        <span>{region ? chartKey : airport.code + ' · ' + localize(airport.name, language)}</span>
      </nav>
      <section className="fs-panel fs-result fs-sorties">
        <h1>
          <Flag /> {t('空中戦闘訓練', 'Aerial combat school', 'くうちゅうせんとうくんれん')}
        </h1>
        {stage === 'brief' ? (
          <>
            <div className="fs-crafts">
              {[...MISSIONS, ...ADVANCED_MISSIONS].map((m) => (
                <button
                  key={m.id}
                  aria-pressed={mission === m}
                  disabled={cleared < (m.required ?? 0)}
                  onClick={() => {
                    select(m);
                    setReverse(false);
                  }}
                >
                  {localize(m.name, language)}
                  {cleared < (m.required ?? 0) && ' · ' + m.required + '/6'}
                </button>
              ))}
            </div>
            <b>{localize(mission.brief, language)}</b>
            <p>
              {t(
                '加速＋↑で離陸。交戦中は方向キーで照準を動かし、射撃（Space）。5発命中でバースト（Shift）が使える。任務の最後は滑走路へ。',
                'Hold Power and Up to take off. In an encounter, steer the sight, fire with Space and burst with Shift after five hits. Land to complete the mission.',
                'かそくと ↑で りりく。くうちゅうでは やじるしで ねらい、Spaceで しゃげき。5はつ あてたら Shiftで バースト。さいごは かっそうろへ かえろう。',
              )}
            </p>
            <label>
              {t('飛行空域', 'Flight area', 'ひこうくういき')}{' '}
              <select
                disabled={!!mission.region}
                value={mission.region ?? routeKey}
                onChange={(e) => {
                  setRouteKey(e.target.value);
                  setReverse(false);
                }}
              >
                <option value="local">
                  {localize(airport.name, language)} · {t('周回', 'Circuit', 'しゅうかい')}
                </option>
                {(mission.region ? [region!] : ROUTES).map((r) => (
                  <option value={r.key} key={r.key}>
                    {r.ports.map((p) => localize(PORT_NAMES[p.code], language)).join(' ↔ ')}
                  </option>
                ))}
              </select>
            </label>
            {region && !mission.region && (
              <label>
                <input
                  type="checkbox"
                  checked={reverse}
                  onChange={(e) => setReverse(e.target.checked)}
                />{' '}
                {t('逆方向', 'Reverse route', 'ぎゃくほうこう')} · {chartKey}
              </label>
            )}
            <label>
              {t('搭乗機', 'Aircraft', 'とうじょうき')}{' '}
              <select
                value={tomcat ? 'f14' : 'trainer'}
                onChange={(e) => selectJet(e.target.value === 'f14')}
              >
                <option value="trainer">
                  {t('訓練ジェット', 'Training jet', 'くんれんジェット')}
                </option>
                <option disabled={cleared < 4} value="f14">
                  F-14 Tomcat {cleared < 4 && ' · 4/6'}
                </option>
              </select>
            </label>
            {cleared >= 2 && (
              <p>
                {t(
                  '◎が出たら追尾弾（M）。発射は1出撃4回。',
                  'When ◎ appears, press M for a homing shot. Four per sortie.',
                  '◎が でたら ついびだん（M）。4かい まで。',
                )}
              </p>
            )}
            <PilotPicker pilot={pilot} select={setPilot} language={language} />
            <label>
              <input
                type="checkbox"
                checked={assist}
                onChange={(e) => setAssist(e.target.checked)}
              />{' '}
              {t('航路アシスト', 'Route assist', 'こうろアシスト')}
            </label>
            <p>
              {t('最高得点', 'Best score', 'さいこうとくてん')}　
              {book[[chartKey, mission.id, mode].join('/')] ?? '—'}
            </p>
            <div className="fs-which">
              <button className="fs-main" onClick={beginStudy}>
                {t('座学と技能検定', 'Ground school & flight test', 'ざがくと ぎのうけんてい')}
              </button>
            </div>
          </>
        ) : stage === 'loading' || stage === 'error' ? (
          <>
            <p role="status">
              {stage === 'loading'
                ? t('地形を読み込み中…', 'Loading terrain…', 'ちけいを よみこみちゅう…')
                : t(
                    '地形を読み込めませんでした。',
                    'Terrain could not be loaded.',
                    'ちけいを よみこめませんでした。',
                  )}
            </p>
            {stage === 'error' && (
              <button onClick={fly}>{t('再試行', 'Retry', 'さいしこう')}</button>
            )}
            <button onClick={brief}>{t('課目選択へ', 'Mission select', 'かもくせんたくへ')}</button>
          </>
        ) : (
          sortie && (
            <>
              <RadioCaption language={language} line={radio.line} />
              <h2>
                {passed
                  ? t('任務達成', 'Mission clear', 'にんむたっせい')
                  : landing?.reason === 'landed'
                    ? t(
                        '任務完了前に着陸',
                        'Landed before completing the mission',
                        'にんむ かんりょうまえに ちゃくりく',
                      )
                    : sortie.finished === 'escort'
                      ? t('輸送艇が離脱', 'Convoy lost', 'ゆそうていが りだつ')
                      : sortie.finished === 'time'
                        ? t('時間終了', 'Time expired', 'じかんしゅうりょう')
                        : sortie.finished !== 'shield'
                          ? t('着陸未達', 'Landing incomplete', 'ちゃくりく みたつ')
                          : t('機体シールド消失', 'Shield depleted', 'きたいシールドしょうしつ')}
              </h2>
              <b>
                {localize(mission.name, language)} ·{' '}
                {t('演習得点', 'Combat score', 'えんしゅう とくてん')} {scoreSortie(sortie)} / 100
              </b>
              {passed && landing && (
                <p>
                  {chartKey} · {t('着陸得点', 'Landing score', 'ちゃくりく とくてん')}{' '}
                  {landing.score} / 100
                </p>
              )}
              <p>
                {t('撃破', 'Targets cleared', 'げきは')} {sortie.kills} /{' '}
                {mission.waves.flat().length} · {t('命中', 'Hits', 'めいちゅう')} {sortie.hits}/
                {sortie.shots}
              </p>
              <div className="fs-which">
                <button className="fs-main" {...multiTouchAction(beginStudy)}>
                  {t('再挑戦', 'Retry', 'さいちょうせん')}
                </button>
                <button {...multiTouchAction(brief)}>
                  {t('課目選択へ', 'Mission select', 'かもくせんたくへ')}
                </button>
              </div>
            </>
          )
        )}
      </section>
    </div>
  );
}

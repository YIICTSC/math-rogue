import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronRight,
  CircleDot,
  Compass,
  Flag,
  Medal as MedalIcon,
  Mountain,
  Plane,
  Rocket,
  Send,
  Umbrella,
  Wind,
} from 'lucide-react';
import MiniGameProblemChallenge from '../../components/MiniGameProblemChallenge';
import type { MiniGameComponentProps } from '../../components/MiniGameRouter';
import { audioService } from '../../services/audioService';
import { assetUrl } from '../../utils/assetPaths';
import {
  AIRPORTS,
  DISCIPLINES,
  localize,
  makeLesson,
  type Aircraft,
  type Lesson,
  type Phrase,
  type Training,
} from './courses';
import { readLog, recordFlight } from './logbook';
import type { FinishReason, Report } from './simulation';
import RouteSchool from './RouteSchool';
import CombatSchool from './CombatSchool';
import { useFlightMusic } from './music';
import FlightDeck from './FlightDeck';
import './flight-school.css';

const ICONS = { parachute: Umbrella, glider: Send, jetpack: Rocket, plane: Plane };
const MEDALS = {
  gold: ['金メダル', 'Gold medal', 'きんメダル'],
  silver: ['銀メダル', 'Silver medal', 'ぎんメダル'],
  bronze: ['銅メダル', 'Bronze medal', 'どうメダル'],
} satisfies Record<string, Phrase>;
const DEBRIEF: Record<FinishReason, Phrase> = {
  landed: [
    '着陸成功。次はリング、着地点、接地速度の3項目で自己ベストを狙おう。',
    'Touchdown! Improve your route, accuracy and landing softness to beat your best.',
    'ちゃくりくせいこう。リング、ちゃくちてん、ちゃくちの やさしさで じこベストを ねらおう。',
  ],
  water: [
    '着水。航路図の着地マークを目印に、陸地へ早めに進路を取ろう。',
    'Water landing. Turn toward the landing marker on your map earlier.',
    'ちゃくすい。こうろずの ちゃくちマークを めじるしに、りくへ はやめに むかおう。',
  ],
  impact: [
    '衝撃が大きかった。建物から距離を取り、着地前に機体を水平にして減速しよう。',
    'Hard contact. Stay clear of buildings, level out and slow down before landing.',
    'しょうげきが おおきかった。たてものから はなれ、ちゃくちまえに きたいを すいへいにして げんそくしよう。',
  ],
  boundary: [
    '訓練空域を出た。方位矢印と航路図で、次の目標へ旋回しよう。',
    'Outside the training area. Use the bearing arrow and map to turn toward the next objective.',
    'くんれんくういきを でた。ほういの やじるしと こうろずで つぎの もくひょうへ むかおう。',
  ],
  timeout: [
    '訓練時間が終了。航路図の順にリングをたどって着地を目指そう。',
    'Training time is up. Follow the rings on the map and head for landing.',
    'くんれんじかんが しゅうりょう。こうろずの じゅんに リングを たどって ちゃくちしよう。',
  ],
  runway: [
    '滑走路を外れた。白い中央線と機体の向きをそろえよう。',
    'Off the runway. Align your aircraft with the white centerline.',
    'かっそうろを はずれた。しろい ちゅうおうせんと きたいの むきを そろえよう。',
  ],
  target: [
    '着地円の外だった。最後のリングを過ぎたら、矢印と距離を見て進み具合を調整しよう。',
    'Outside the landing zone. After the last ring, use bearing and distance to adjust your approach.',
    'ちゃくちえんの そとだった。さいごの リングの あとは やじるしと きょりを みて ちょうせいしよう。',
  ],
  route: [
    '検定は全リングの通過が条件。グライダーは金色の上昇気流にも乗ろう。',
    'The test requires every ring. Gliders must also catch the golden thermal.',
    'けんていは ぜんリングを とおるのが じょうけん。グライダーは きんいろの きりゅうにも のろう。',
  ],
};

export default function FlightSchool({
  onBack,
  languageMode = 'JAPANESE',
  problemMode,
  problemModePool,
  answerMode,
  assignment,
  onAnswerResult,
}: MiniGameComponentProps) {
  const t = (...p: Phrase) => localize(p, languageMode);
  const [stage, setStage] = useState<
    'hangar' | 'log' | 'quiz' | 'flight' | 'result' | 'combat' | 'routes'
  >('hangar');
  const [port, setPort] = useState(AIRPORTS[0]);
  const [craft, setCraft] = useState<Aircraft>('parachute');
  const [lesson, setLesson] = useState<Lesson>(() =>
    makeLesson(AIRPORTS[0], 'parachute', 'practice'),
  );
  const [turn, setTurn] = useState(0);
  const [report, setReport] = useState<Report | null>(null);
  const [book, setBook] = useState(readLog);
  const [logMode, setLogMode] = useState<Training>('exam');
  const offset = useRef(0);
  const chosen = DISCIPLINES.find((d) => d.id === craft)!;
  const trainingName = (mode: Training) =>
    mode === 'practice'
      ? t('練習飛行', 'Practice flight', 'れんしゅうひこう')
      : t('技能検定', 'Flight test', 'ぎのうけんてい');
  const flightTracks = {
    parachute: 'paper_plane_vacation',
    glider: 'star_tide_sky',
    jetpack: 'paper_plane_battle',
    plane: 'map',
  } as const;
  const track =
    stage === 'flight'
      ? flightTracks[lesson.aircraft]
      : stage === 'quiz'
        ? 'math'
        : stage === 'result' && report?.medal
          ? 'victory'
          : 'rest';
  useFlightMusic(
    track,
    track === 'map' || track === 'math' || stage === 'hangar' || stage === 'log'
      ? 'high-school'
      : 'elementary',
  );
  useEffect(() => {
    void audioService.preloadFlightSounds();
  }, []);
  function start(mode: Training) {
    audioService.init();
    audioService.resumeBGM();
    audioService.playFlightSound('start');
    setLesson(makeLesson(port, craft, mode));
    setReport(null);
    setTurn((n) => n + 1);
    setStage(mode === 'exam' ? 'quiz' : 'flight');
  }
  function retry() {
    audioService.init();
    setReport(null);
    setTurn((n) => n + 1);
    setStage('flight');
  }
  function finished(result: Report) {
    setBook(recordFlight(lesson, result));
    setReport(result);
    audioService.playFlightSound(
      result.reason === 'water'
        ? 'water'
        : result.reason === 'impact'
          ? 'hit'
          : ['landed', 'target', 'route'].includes(result.reason)
            ? 'land'
            : 'end',
    );
    setStage('result');
  }
  return (
    <main className="flight-school" data-flight-screen={stage}>
      {stage === 'routes' ? (
        <RouteSchool home={port.code} language={languageMode} exit={() => setStage('hangar')} />
      ) : stage === 'combat' ? (
        <CombatSchool
          airport={port}
          language={languageMode}
          study={{
            mode: problemMode,
            modePool: problemModePool,
            assignment,
            answerMode,
            onAnswerResult,
          }}
          onExit={() => setStage('hangar')}
        />
      ) : stage === 'flight' ? (
        <FlightDeck
          key={turn}
          lesson={lesson}
          language={languageMode}
          onExit={() => setStage('hangar')}
          onRetry={retry}
          onDone={finished}
        />
      ) : stage === 'quiz' ? (
        <div className="fs-quiz">
          <MiniGameProblemChallenge
            mode={problemMode}
            modePool={problemModePool}
            answerMode={answerMode}
            assignment={assignment}
            onAnswerResult={onAnswerResult}
            languageMode={languageMode}
            problemOffset={offset.current}
            rewardHint={t(
              '座学が終わると技能検定のフライトです。',
              'Complete ground school to start your flight test.',
              'ざがくが おわると ぎのうけんていの フライトです。',
            )}
            onComplete={() => {
              offset.current += 3;
              setStage('flight');
            }}
          />
        </div>
      ) : (
        <div className="fs-shell">
          <nav className="fs-nav">
            <button onClick={stage === 'hangar' ? onBack : () => setStage('hangar')}>
              <ArrowLeft size={16} />
              {stage === 'hangar'
                ? t('ミニゲーム', 'Mini-games', 'ミニゲーム')
                : t('格納庫', 'Hangar', 'かくのうこ')}
            </button>
            <span>
              {stage !== 'hangar' && (
                <>
                  <Plane size={16} />{' '}
                  {t('にっぽんフライトスクール', 'Japan Flight School', 'にっぽんフライトスクール')}
                </>
              )}
            </span>
            {stage === 'hangar' ? (
              <button
                onClick={() => {
                  setBook(readLog());
                  setStage('log');
                }}
              >
                <BookOpen size={16} />
                {t('飛行日誌', 'Logbook', 'ひこうにっし')}
              </button>
            ) : (
              <span />
            )}
          </nav>
          {stage === 'hangar' ? (
            <div className="fs-hangar">
              <section
                className="fs-poster"
                style={{
                  backgroundImage: `url("${assetUrl('sprites/flight-school/title.webp')}")`,
                }}
              >
                <div>
                  <span className="fs-aircode">
                    {t('日本8空港', '8 JAPANESE AIRPORTS', 'にほん 8くうこう')}
                  </span>
                  <h1>
                    {t('にっぽん', 'Japan', 'にっぽん')}
                    <br />
                    {t('フライトスクール', 'Flight School', 'フライトスクール')}
                  </h1>
                </div>
              </section>
              <section className="fs-panel fs-brief">
                <label className="fs-air-label" htmlFor="fs-airport">
                  <Compass size={17} />
                  {t('出発空港', 'Departure airport', 'しゅっぱつくうこう')}
                </label>
                <select
                  id="fs-airport"
                  value={port.code}
                  onChange={(e) => setPort(AIRPORTS.find((p) => p.code === e.target.value)!)}
                >
                  {AIRPORTS.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.code}　{localize(p.name, languageMode)}
                    </option>
                  ))}
                </select>
                <p className="fs-local">
                  <Mountain size={14} />
                  {localize(port.landscape, languageMode)}
                  <span>
                    <Wind size={14} />
                    {Math.hypot(port.wind.x, port.wind.z).toFixed(1)} m/s
                  </span>
                </p>
                <h2>{t('訓練種目', 'Flight discipline', 'くんれんしゅもく')}</h2>
                <div
                  className="fs-crafts"
                  role="group"
                  aria-label={t('訓練種目', 'Flight discipline', 'くんれんしゅもく')}
                >
                  {DISCIPLINES.map((d) => {
                    const Icon = ICONS[d.id];
                    return (
                      <button
                        key={d.id}
                        aria-pressed={craft === d.id}
                        onClick={() => setCraft(d.id)}
                      >
                        <Icon size={19} />
                        {localize(d.name, languageMode)}
                      </button>
                    );
                  })}
                </div>
                <button className="fs-combat-entry" onClick={() => setStage('routes')}>
                  <Plane size={18} />
                  {t('空港間フライト', 'Airport routes', 'くうこうかんフライト')}
                  <ChevronRight size={17} />
                </button>
                <button className="fs-combat-entry" onClick={() => setStage('combat')}>
                  <Flag size={18} />
                  {t('戦闘訓練', 'Combat training', 'せんとうくんれん')}
                  <ChevronRight size={17} />
                </button>
                <div className="fs-briefing">
                  <b>
                    <Flag size={16} />
                    {localize(chosen.assignment, languageMode)}
                  </b>
                  <p>{localize(chosen.controls, languageMode)}</p>
                </div>
                <div className="fs-which">
                  <button className="fs-main" onClick={() => start('practice')}>
                    <Plane size={17} />
                    {trainingName('practice')}
                    <ChevronRight size={17} />
                  </button>
                  <button onClick={() => start('exam')}>
                    <MedalIcon size={17} />
                    {t('座学と技能検定', 'Ground school & flight test', 'ざがくと ぎのうけんてい')}
                  </button>
                </div>
                <small className="fs-brief-note">
                  {t(
                    '練習は弱風・大きなリング。検定は全リングと着陸で合格。',
                    'Practice has light winds and larger rings. Clear every ring and land to pass the test.',
                    'れんしゅうは よわいかぜと おおきなリング。けんていは ぜんリングと ちゃくりくで ごうかく。',
                  )}
                </small>
              </section>
            </div>
          ) : stage === 'log' ? (
            <section className="fs-panel fs-book">
              <div className="fs-bookhead">
                <div>
                  <BookOpen size={24} />
                  <h1>{t('飛行日誌', 'Logbook', 'ひこうにっし')}</h1>
                </div>
                <select
                  aria-label={t('記録の種類', 'Record type', 'きろくの しゅるい')}
                  value={logMode}
                  onChange={(e) => setLogMode(e.target.value as Training)}
                >
                  <option value="exam">{trainingName('exam')}</option>
                  <option value="practice">{trainingName('practice')}</option>
                </select>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>{t('空港', 'Airport', 'くうこう')}</th>
                    {DISCIPLINES.map((d) => {
                      const Icon = ICONS[d.id];
                      return (
                        <th key={d.id} scope="col">
                          <Icon size={16} />
                          <span>{localize(d.name, languageMode)}</span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {AIRPORTS.map((p) => (
                    <tr key={p.code}>
                      <th scope="row">
                        <em>{p.code}</em> {localize(p.name, languageMode)}
                      </th>
                      {DISCIPLINES.map((d) => {
                        const entry = book[[p.code, d.id, logMode].join('/')];
                        return (
                          <td key={d.id}>
                            <button
                              title={localize(d.name, languageMode)}
                              aria-label={[
                                localize(p.name, languageMode),
                                localize(d.name, languageMode),
                                entry
                                  ? localize(MEDALS[entry.medal], languageMode) + ' ' + entry.score
                                  : '–',
                              ].join(' ')}
                              onClick={() => {
                                setPort(p);
                                setCraft(d.id);
                                setStage('hangar');
                              }}
                            >
                              {entry ? (
                                <>
                                  <MedalIcon className={'fs-medal-' + entry.medal} size={14} />
                                  {entry.score}
                                </>
                              ) : (
                                '—'
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ) : (
            report && (
              <section className="fs-panel fs-result">
                <div className="fs-result-port">
                  {lesson.airport.code} · {localize(lesson.airport.name, languageMode)} /{' '}
                  {trainingName(lesson.mode)}
                </div>
                <div className="fs-award">
                  {report.medal ? (
                    <MedalIcon size={50} className={'fs-medal-' + report.medal} />
                  ) : (
                    <Wind size={48} />
                  )}
                  <div>
                    <small>{localize(chosen.name, languageMode)}</small>
                    <h1>
                      {report.medal
                        ? localize(MEDALS[report.medal], languageMode)
                        : t('もう一度挑戦', 'Try another approach', 'もういちど ちょうせん')}
                    </h1>
                  </div>
                  <strong>
                    {report.score}
                    <small>/100</small>
                  </strong>
                </div>
                <div className="fs-scores">
                  {[
                    [t('航路', 'Route', 'こうろ'), report.rings, 40],
                    [t('着地精度', 'Accuracy', 'ちゃくちせいど'), report.precision, 35],
                    [t('機体制御', 'Handling', 'きたいせいぎょ'), report.handling, 25],
                  ].map(([label, n, max]) => (
                    <div key={label}>
                      <span>{label}</span>
                      <b>
                        {n}
                        <small>/{max}</small>
                      </b>
                    </div>
                  ))}
                </div>
                <p>{localize(DEBRIEF[report.reason], languageMode)}</p>
                <div className="fs-flight-time">
                  <CircleDot size={14} />
                  {lesson.aircraft === 'plane'
                    ? t('着陸精度の誤差', 'Landing accuracy offset', 'ちゃくりくせいどの ごさ')
                    : t('中心から', 'From center', 'ちゅうしんから')}{' '}
                  {Math.round(report.distance)} m · {Math.round(report.time)} s
                </div>
                <div className="fs-which">
                  <button className="fs-main" onClick={retry}>
                    {t('同じ課目でもう一度', 'Fly this lesson again', 'おなじ かもくで もういちど')}
                    <ArrowRight size={17} />
                  </button>
                  <button onClick={() => setStage('hangar')}>
                    <Mountain size={17} />
                    {t('別の空港・種目へ', 'Choose another course', 'べつの くうこう・しゅもくへ')}
                  </button>
                </div>
              </section>
            )
          )}
        </div>
      )}
    </main>
  );
}

import { AIRPORTS, DISCIPLINES, type Lesson } from './courses';
import type { Medal, Report } from './simulation';

export const FLIGHT_COMBAT_LOG_KEY = 'learning-rogue:flight-school:sorties:v1';
export const FLIGHT_LOG_KEY = 'learning-rogue:flight-school:v1';
export type RecordBook = Record<string, { score: number; medal: Medal }>;
export const flightKey = (lesson: Lesson) =>
  [lesson.airport.code, lesson.aircraft, lesson.mode].join('/');

export function readLog(): RecordBook {
  const book: RecordBook = {};
  try {
    const saved = JSON.parse(localStorage.getItem(FLIGHT_LOG_KEY) ?? '{}');
    for (const airport of AIRPORTS)
      for (const discipline of DISCIPLINES)
        for (const mode of ['practice', 'exam']) {
          const key = [airport.code, discipline.id, mode].join('/'),
            entry = saved?.[key];
          if (
            entry &&
            Number.isInteger(entry.score) &&
            entry.score >= 0 &&
            entry.score <= 100 &&
            ['gold', 'silver', 'bronze'].includes(entry.medal)
          ) {
            book[key] = { score: entry.score, medal: entry.medal };
          }
        }
  } catch {
    /* A cleared or unavailable store still allows practice. */
  }
  return book;
}

export function recordFlight(lesson: Lesson, report: Report): RecordBook {
  const book = readLog(),
    key = flightKey(lesson);
  if (report.medal && (!book[key] || report.score > book[key].score)) {
    book[key] = { score: report.score, medal: report.medal };
    try {
      localStorage.setItem(FLIGHT_LOG_KEY, JSON.stringify(book));
    } catch {
      /* per-session score remains visible */
    }
  }
  return book;
}

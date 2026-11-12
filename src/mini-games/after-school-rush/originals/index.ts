import { gate } from './gate';
import { classroom } from './classroom';
import { store } from './store';
import { yard } from './yard';
import { library } from './library';
import { lab } from './lab';
import { gym } from './gym';
import { music } from './music';
import { roof } from './roof';
import { festival } from './festival';
import type { Original } from './model';

export const ORIGINAL_CHAPTERS: readonly Original[][] = [
  gate,
  classroom,
  store,
  yard,
  library,
  lab,
  gym,
  music,
  roof,
  festival,
];

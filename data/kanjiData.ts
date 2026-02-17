import { KANJI_G1_DATA } from './subjects/kanji_g1';
import { KANJI_G2_DATA } from './subjects/kanji_g2';
import { KANJI_G3_DATA } from './subjects/kanji_g3';
import { KANJI_G4_DATA } from './subjects/kanji_g4';
import { KANJI_G5_DATA } from './subjects/kanji_g5';
import { KANJI_G6_DATA } from './subjects/kanji_g6';
import { KANJI_G7_DATA } from './subjects/kanji_g7';
import { KANJI_G8_DATA } from './subjects/kanji_g8';
import { KANJI_G9_DATA } from './subjects/kanji_g9';

export interface KanjiProblem {
    question: string;
    answer: string;
    options: string[];
    hint?: string;
}

export const KANJI_DATA: Record<string, KanjiProblem[]> = {
    KANJI_1: KANJI_G1_DATA,
    KANJI_2: KANJI_G2_DATA,
    KANJI_3: KANJI_G3_DATA,
    KANJI_4: KANJI_G4_DATA,
    KANJI_5: KANJI_G5_DATA,
    KANJI_6: KANJI_G6_DATA,
    KANJI_7: KANJI_G7_DATA,
    KANJI_8: KANJI_G8_DATA,
    KANJI_9: KANJI_G9_DATA,
};

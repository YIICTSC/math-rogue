
import { GeneralProblem } from './subjects/utils';
import { LIFE_G1_DATA } from './subjects/life_g1';
import { LIFE_G2_DATA } from './subjects/life_g2';
import { SCIENCE_G3_DATA } from './subjects/science_g3';
import { SCIENCE_G4_DATA } from './subjects/science_g4';
import { SCIENCE_G5_DATA } from './subjects/science_g5';
import { SCIENCE_G6_DATA } from './subjects/science_g6';
import { SCIENCE_G7_DATA } from './subjects/science_g7';
import { SCIENCE_G8_DATA } from './subjects/science_g8';
import { SCIENCE_G9_DATA } from './subjects/science_g9';
import { SOCIAL_G3_DATA } from './subjects/social_g3';
import { SOCIAL_G4_DATA } from './subjects/social_g4';
import { SOCIAL_G5_DATA } from './subjects/social_g5';
import { SOCIAL_G6_DATA } from './subjects/social_g6';
import { SOCIAL_G7_DATA } from './subjects/social_g7';
import { SOCIAL_G8_DATA } from './subjects/social_g8';
import { SOCIAL_G9_DATA } from './subjects/social_g9';
import { MAP_PREF_DATA } from './subjects/map_pref';

// 算数・数学のインポート
import { MATH_G1_DATA } from './subjects/math_g1';
import { MATH_G2_DATA } from './subjects/math_g2';
import { MATH_G3_DATA } from './subjects/math_g3';
import { MATH_G4_DATA } from './subjects/math_g4';
import { MATH_G5_DATA } from './subjects/math_g5';
import { MATH_G6_DATA } from './subjects/math_g6';
import { MATH_G7_DATA } from './subjects/math_g7';
import { MATH_G8_DATA } from './subjects/math_g8';
import { MATH_G9_DATA } from './subjects/math_g9';

export type { GeneralProblem };

export const SUBJECT_DATA: Record<string, GeneralProblem[]> = {
    ...MATH_G1_DATA,
    ...MATH_G2_DATA,
    ...MATH_G3_DATA,
    ...MATH_G4_DATA,
    ...MATH_G5_DATA,
    ...MATH_G6_DATA,
    ...MATH_G7_DATA,
    ...MATH_G8_DATA,
    ...MATH_G9_DATA,
    ...LIFE_G1_DATA,
    ...LIFE_G2_DATA,
    ...SCIENCE_G3_DATA,
    ...SCIENCE_G4_DATA,
    ...SCIENCE_G5_DATA,
    ...SCIENCE_G6_DATA,
    ...SCIENCE_G7_DATA,
    ...SCIENCE_G8_DATA,
    ...SCIENCE_G9_DATA,
    ...SOCIAL_G3_DATA,
    ...SOCIAL_G4_DATA,
    ...SOCIAL_G5_DATA,
    ...SOCIAL_G6_DATA,
    ...SOCIAL_G7_DATA,
    ...SOCIAL_G8_DATA,
    ...SOCIAL_G9_DATA,
    ...MAP_PREF_DATA,
};

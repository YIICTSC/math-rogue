import { deferredScreen } from '../utils/deferredScreen';

export const MathChallengeScreen = deferredScreen(() => import('./MathChallengeScreen'));
export const KanjiChallengeScreen = deferredScreen(() => import('./KanjiChallengeScreen'));
export const EnglishChallengeScreen = deferredScreen(() => import('./EnglishChallengeScreen'));
export const GeneralChallengeScreen = deferredScreen(() => import('./GeneralChallengeScreen'));

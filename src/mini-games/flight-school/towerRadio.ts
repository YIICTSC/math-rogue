import type { Phrase } from './courses';

export const towerRadio = {
  deck: ['発艦を許可します。', 'Cleared to launch.', 'はっかんを きょかします。'],
  valley: [
    '谷の向こうで会おう。',
    'See you on the far side of the valley.',
    'たにの むこうで あおう。',
  ],
  ceiling: ['雲の上まで来たね。', 'We made it above the clouds.', 'くもの うえまで きたね。'],
  cruise: [
    '次の空港まで一緒だよ。',
    'I’m with you to the next airport.',
    'つぎの くうこうまで いっしょだよ。',
  ],
} satisfies Record<string, Phrase>;
export type TowerCue = keyof typeof towerRadio;
export const isTowerCue = (event: string): event is TowerCue => Object.hasOwn(towerRadio, event);

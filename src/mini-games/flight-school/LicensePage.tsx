import React from 'react';
import type { LanguageMode } from '../../types';
import { localize, type Phrase } from './courses';
import { readLicenses } from './licenses';

export function LicensePage({ language }: { language: LanguageMode }) {
  const p = readLicenses();
  const t = (...words: Phrase) => localize(words, language);
  return (
    <section className="fs-license">
      {[
        {
          name: t('上級航路ライセンス', 'Long-haul license', 'じょうきゅう こうろライセンス'),
          hint: t(
            '基本4航路の往路・復路に着陸',
            'Land in both directions on the four original routes.',
            'きほん4こうろの おうろ・ふくろに ちゃくりく',
          ),
          value: p.route,
          total: p.routeTotal,
          levels: [
            [2, t('羽田 ↔ 松本', 'Haneda ↔ Matsumoto', 'はねだ ↔ まつもと')],
            [4, t('羽田 ↔ 関西国際', 'Haneda ↔ Kansai', 'はねだ ↔ かんさいこくさい')],
          ] as const,
        },
        {
          name: t(
            '上級戦闘ライセンス',
            'Advanced combat license',
            'じょうきゅう せんとうライセンス',
          ),
          hint: t(
            '基本6任務を達成して帰還',
            'Complete the six original missions and land.',
            'きほん6にんむを たっせいして きかん',
          ),
          value: p.sorties,
          total: p.combatTotal,
          levels: [
            [
              2,
              t('追尾弾・空母発艦', 'Homing shot · carrier launch', 'ついびだん・くうぼ はっかん'),
            ],
            [4, t('F-14・渓谷飛行', 'F-14 · canyon run', 'F-14・けいこくひこう')],
            [6, t('成層圏の編隊戦', 'Stratosphere pursuit', 'せいそうけんの へんたいせん')],
          ] as const,
        },
      ].map((row) => (
        <article key={row.name}>
          <header>
            <b>{row.name}</b>
            <strong>{Math.round((row.value / row.total) * 100)}%</strong>
          </header>
          <p>{row.hint}</p>
          <progress aria-label={row.name} value={row.value} max={row.total} />
          <span>
            {row.value} / {row.total}
          </span>
          <ul>
            {row.levels.map(([n, reward]) => (
              <li key={n}>
                {row.value >= n ? '✓' : '○'} {n}/{row.total}　{reward}
              </li>
            ))}
          </ul>
        </article>
      ))}
    </section>
  );
}

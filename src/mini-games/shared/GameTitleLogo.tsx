import React from 'react';
import type { LanguageMode } from '../../types';
import { assetUrl } from '../../utils/assetPaths';

const logos = {
  kart: { file: 'gp', title: 'GAKURO GP', ja: '学習ローグレース', en: 'Learning Rogue Race', hira: 'がくしゅうローグレース' },
  vr: { file: 'vr', title: 'GAKURO VR', ja: '学習ローグVR', en: 'Learning Rogue VR', hira: 'がくしゅうローグVR' },
  golf: { file: 'golf', title: 'GAKURO GOLF', ja: '学習ローグゴルフ', en: 'Learning Rogue Golf', hira: 'がくしゅうローグゴルフ' },
} as const;

/** ImageGen artwork retains its Japanese brand subtitle in every language. */
export default function GameTitleLogo({ kind, languageMode }: { kind: keyof typeof logos; languageMode: LanguageMode }) {
  const logo = logos[kind];
  const subtitle = languageMode === 'ENGLISH' ? logo.en : languageMode === 'HIRAGANA' ? logo.hira : logo.ja;
  return <img src={assetUrl(`sprites/online-titles/${logo.file}-logo.webp`)} alt={`${logo.title} — ${subtitle}`} width={1983} height={793} decoding="async" fetchPriority="high" />;
}

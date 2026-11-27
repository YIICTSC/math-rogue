import { Sparkles } from 'lucide-react';
import { CARDS_LIBRARY } from '../../constants';
import ResilientAssetImage from '../../components/ResilientAssetImage';
import { assetUrl } from '../../utils/assetPaths';
import { getAge9CardArtAlias, getCardIllustrationPaths } from '../../utils/cardIllustration';
import { getMagicCardArtUrl } from '../../utils/cardArtPaths';
import type { Technique } from './catalog';

const elementalExamples: Record<Technique['element'], string> = {
  steel:'STRIKE', fire:'INFLAME', ice:'DEFEND', storm:'BALL_LIGHTNING', wind:'QUICK_SLASH', light:'BRILLIANCE', dark:'CATALYST',
};

export function TechniqueArtwork({ technique }: { technique: Technique }) {
  const { skill, source } = technique;
  const fallbackKey = skill.summon ? 'YOSEI_HOSHI' : skill.heal ? 'MEDICINAL_ALOE' : skill.block && !skill.damage ? 'DEFEND'
    : skill.transform ? 'APOTHEOSIS' : skill.draw && !skill.damage ? 'DISCOVERY' : elementalExamples[technique.element];
  const fallback = CARDS_LIBRARY[fallbackKey];
  const age9 = source && getAge9CardArtAlias([source.name, ...(source.originalNames ?? [])]);
  const original = source ? [age9 ? assetUrl(`card-illustrations/${age9}.webp`) : null, getMagicCardArtUrl(source),
    source.highSchoolCardArtIndex === undefined ? null : assetUrl(`sprites/high-school/cards/${source.highSchoolCardArtIndex}.webp`),
    ...getCardIllustrationPaths(source.id, source.name, source.originalNames).filter(path => !path.includes('/unknown-card.'))] : [];
  return <ResilientAssetImage className="pr-card-art" decoding="async" alt="" aria-hidden="true"
    sources={[...original, ...getCardIllustrationPaths(fallbackKey, fallback.name)]} fallback={<Sparkles aria-hidden="true" />} />;
}

export function TechniqueStrip({ parts }: { parts: readonly Technique[] }) {
  return <div className="pr-technique-strip" aria-hidden="true">
    {parts.length ? parts.map((technique, i) => <TechniqueArtwork key={`${technique.id}:${i}`} technique={technique} />)
      : <ResilientAssetImage className="pr-card-art" alt="" sources={[assetUrl('card-illustrations/unknown-card.webp')]} />}
  </div>;
}

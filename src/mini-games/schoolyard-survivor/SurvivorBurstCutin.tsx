import React from "react";
import { AbilityCutin } from "../../components/school-dungeon/student/AbilityCutin";
import { STUDENT_ABILITIES } from "../../components/school-dungeon/student/abilities";
import { preloadAbilityCutins } from "../../components/school-dungeon/student/cutins";
import type { ProtagonistId } from "../../three/protagonistCatalog";
import type { LanguageMode } from "../../types";
import { trans } from "../../utils/textUtils";
export const BURST_CUTIN_FRAMES = 75;
export const preloadSurvivorBurst = preloadAbilityCutins;
export default function SurvivorBurstCutin({
  heroId,
  paused,
  languageMode,
}: {
  heroId: ProtagonistId;
  paused: boolean;
  languageMode: LanguageMode;
}) {
  const ability = STUDENT_ABILITIES[heroId];
  return (
    <div
      className="sy-burst-cutin"
      data-paused={paused}
      style={{ "--ability-color": ability.color } as React.CSSProperties}
      aria-live="polite"
    >
      <div className="sy-burst-cutin-ribbons" aria-hidden="true" />
      <AbilityCutin heroId={heroId} abilityName={ability.en} />
      <div className="sy-burst-cutin-copy">
        <small>BURST • ULTIMATE</small>
        <strong>
          {languageMode === "ENGLISH"
            ? ability.en
            : trans(ability.name, languageMode)}
        </strong>
      </div>
    </div>
  );
}

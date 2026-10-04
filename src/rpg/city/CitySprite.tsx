import React from "react";
import { assetUrl } from "../../utils/assetPaths";
import { CITY_SPRITES } from "./spriteRects";
export default function CitySprite({ index }: { index: number }) {
  const rect = CITY_SPRITES[index];
  return rect ? (
    <svg className="city-sprite" viewBox={rect.join(" ")} aria-hidden="true">
      <image
        href={assetUrl("sprites/rpg/city/buildings.webp")}
        width={1402}
        height={1122}
      />
    </svg>
  ) : null;
}

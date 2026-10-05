import React from "react";
import { assetUrl } from "../../utils/assetPaths";
export default function LifeIcon({
  index,
  size = 64,
}: {
  index: number;
  size?: number;
}) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-block",
        width: size,
        height: size,
        flexShrink: 0,
        backgroundImage: `url(${assetUrl("sprites/rpg/lifestyle/icons.webp")})`,
        backgroundSize: "400% 400%",
        backgroundPosition: `${((index % 4) / 3) * 100}% ${(Math.floor(index / 4) / 3) * 100}%`,
      }}
    />
  );
}

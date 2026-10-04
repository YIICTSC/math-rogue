import React from "react";
import { assetUrl } from "../../utils/assetPaths";
import { cropById, ingredientById, animalById, petById } from "./catalog";
export const farmImage = (
  kind: "crop" | "ingredient" | "animal" | "pet" | "food",
  id: string | number,
) =>
  `sprites/rpg/farm/${kind === "crop" || (kind === "ingredient" && cropById(String(id))) ? "crops" : kind === "ingredient" ? "products" : kind === "animal" ? "animals" : kind === "pet" ? "pets" : "food"}/${id}.webp`;
export default function FarmSprite({
  kind,
  id,
}: {
  kind: "crop" | "ingredient" | "animal" | "pet" | "food";
  id: string | number;
}) {
  const exists =
    kind === "crop"
      ? cropById(String(id))
      : kind === "ingredient"
        ? ingredientById(String(id))
        : kind === "animal"
          ? animalById(String(id))
          : kind === "pet"
            ? petById(String(id))
            : true;
  return exists ? (
    <img
      className="farm-sprite"
      src={assetUrl(farmImage(kind, id))}
      alt=""
      aria-hidden="true"
    />
  ) : null;
}

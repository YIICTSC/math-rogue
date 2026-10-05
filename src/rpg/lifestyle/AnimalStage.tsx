import { animalPose } from "./animalMotion";
import { useRpgPreferences } from "../preferences";
import React from "react";
import type { World, Action } from "../engine";
import type { FarmAnimal, FarmPet } from "../farm/model";
import type { LanguageMode } from "../../types";
import { c, copy } from "../town/catalog";
import FarmSprite from "../farm/Sprite";
import { assetUrl } from "../../utils/assetPaths";
import { PET_TRICKS, trickCopy } from "./catalog";
import LifeIcon from "./LifeIcon";
import "./lifestyle.css";
export default function AnimalStage({
  animal,
  kind,
  time,
}: {
  animal: FarmAnimal | FarmPet;
  kind: "animal" | "pet";
  time: number;
}) {
  const prefs = useRpgPreferences();
  const pose = animalPose(animal, time),
    species = ["retriever", "graytabby", "cow", "chicken"].indexOf(animal.kind),
    column = ["greet", "roll", "sleep", "hop"].indexOf(pose);
  return (
    <div
      className={`life-pet-stage life-pose-${pose}`}
      data-pose={pose}
      style={prefs.reducedMotion ? { animation: "none" } : undefined}
    >
      {species >= 0 ? (
        <div
          className="life-pet-pose"
          style={{
            backgroundImage: `url(${assetUrl("sprites/rpg/lifestyle/animal-poses.webp")})`,
            backgroundPosition: `${(column / 3) * 100}% ${(species / 3) * 100}%`,
          }}
        />
      ) : (
        <FarmSprite kind={kind} id={animal.kind} />
      )}
      <LifeIcon index={pose === "sleep" ? 11 : 10} size={35} />
    </div>
  );
}
export function PetTricks({
  world,
  selfId,
  pet,
  send,
  languageMode,
  available,
}: {
  world: World;
  selfId: string;
  pet: FarmPet;
  send: (a: Action) => void;
  languageMode: LanguageMode;
  available: boolean;
}) {
  const L = (ja: string, en: string, hi: string) =>
      copy(c(ja, en, hi), languageMode),
    learned = Object.keys(pet.tricks || {}).length;
  return (
    <details className="life-expansion" data-testid="pet-tricks">
      <summary>
        {L(
          "かわいい芸と触れ合い",
          "Tricks & cuddles",
          "かわいいげいとふれあい",
        )}{" "}
        {learned}/16
      </summary>
      <div className="life-expansion-wraps">
        {PET_TRICKS.map((t) => (
          <button
            key={t[0]}
            disabled={
              !available ||
              !!pet.awayUntil ||
              pet.hunger < 15 ||
              pet.trained < t[4] ||
              pet.bond < 10 + t[4] / 2 ||
              world.life.time < (pet.lastTrick ?? -100) + 8
            }
            onClick={() =>
              send({ type: "farm-pet-trick", id: pet.id, trick: t[0] })
            }
          >
            {copy(trickCopy(t), languageMode)}
            {pet.tricks?.[t[0]] !== undefined ? " ★" : ""}
            <small>
              {" "}
              {t[4] > pet.trained
                ? `${L("しつけ", "Training", "しつけ")} ${t[4]}`
                : ""}
            </small>
          </button>
        ))}
      </div>
      <p>
        {L(
          "絆としつけで新しい芸を覚えます。芸は満腹を使い、初披露は毎日の経験値に。",
          "Bond and training unlock new tricks. Tricks use hunger; first daily performances earn experience.",
          "きずなとしつけであたらしいげいをおぼえます。げいはまんぷくをつかい、はつひろうはまいにちのけいけんちに。",
        )}
      </p>
    </details>
  );
}

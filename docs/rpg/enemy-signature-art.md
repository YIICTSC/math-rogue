# Enemy hero signature card artwork

RPG enemy protagonists' personal technique cards show that exact enemy's artwork, taking precedence over the base attack/skill card's illustration. Humanoid enemies use the corresponding attack pose, and Azuki uses its pounce pose. Endless enemies use their own attack art. Other enemies use the same exact illustration as the hero selector. Idle artwork is a fallback if attack art cannot load.

`rpgEnemyHeroId` on signature cards preserves the original identity through saves and upgrades. Existing decks without this metadata are supported through their `RPG_ENEMY:<chapter>:<name>:CARD:...` identity and technique-card name. Other cards in enemy starter decks retain normal card art. The resolution avoids the generic enemy hash resolver, which can select a different humanoid for a monster name.

`node scripts/test-rpg-signature-art.mjs` validates all 325 selectable enemies across three chapters: actual files, exact identity, humanoid attack variants, legacy decks, exclusion of ordinary cards, and actual rendered new/legacy cards in each chapter.

Attack assets are resolved from exact catalog indices before `assetUrl`, so Android's downloaded asset packs with hashed local filenames also receive the correct attack pose. Trading upgrades old signature metadata before assigning a received-card ID, preserving artwork after a legacy card is exchanged.

RPG trade selection and both participants' offers use the main `Card` component with native artwork, frames, energy and effect text. Selection supports keyboard activation and a visible selected marker. Offered cards open the same inspection modal; selectable cards support its existing long-press gesture. `scripts/test-rpg-trade-cards-browser.mjs` checks actual trade actions, both humanoid images, card inspection, portrait/landscape/desktop overflow and artwork identity after exchange. Existing `scripts/test-rpg-activities.mjs` checks server-side trade behavior.

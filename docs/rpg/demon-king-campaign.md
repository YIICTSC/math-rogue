# Isekai campaign and peaceful world

Six regional examiners guard Sunlit Meadow, Whispering Forest, Mirrorwater Wetland, Amber Dunes, Starfrost Highlands and Dawn Ancient Ruins. Each has one reachable site in its biome. Their shared victories break the Demon King's Citadel barrier. Examiner names remain the regional names in battle regardless of the selected school theme; their appearances reuse existing themed art.

The original humanoid Demon King has three forms: 魔王 → 真・魔王 → スーパー魔王ハイグレードEXスペシャルエディションαオメガMAX. Each form has its own generated idle and attack illustration. Magic attacks use the attack art. The original enemy type `RPG_DEMON` has escalating attack/defend/strength/debuff patterns. Normal attack, poison and thorns transformations preserve combat and reset status effects. Authoritative shared HP resets between all three phases; old-phase packets are rejected, and cumulative damage resets for all participating players. A local transformation waits for its matching server phase rather than double-counting the hit. Only the third defeat clears the campaign.

The ending has six manually advanced passages across three generated panoramas: vanquishing the Demon King; learning and friendship as the source of victory; dawn across six regions; a welcome from the residents; responsibility for rebuilding; accepting an unlimited peaceful future. Existing victory music accompanies the cinematic, and reduced-motion preferences are respected. Button placement is checked at 320×568, 390×844, 568×320, 844×390 and 1440×900.

`endingProgress` is per-player authoritative state and saved with the world. It accepts only sequential steps 1–6. City management cannot unlock before the requesting player's ending is complete or while anyone is still receiving combat rewards. The existing ranking rewards remain intact. Continuing removes ordinary enemy sites, retains the saved world, and removes the timer. Town/rest/event cooldowns no longer require more battles in the peaceful world. The shared world event rotates to knowledge questions, replacing unfinished combat objectives so peaceful-world requests remain achievable. Other participants can finish their own ending even if one participant has already opened the city.

New worlds have campaign version 2 and Peer protocol 20. Save migration adds the three missing regional trials to uncleared legacy worlds, preserving old trial victories and IDs. Already completed worlds retain their victory, and existing city worlds do not unexpectedly replay the ending. The save format remains version 1; migration is idempotent.

Generated source atlases are retained in `/workspace/generated_images`:

- `exec-de9c61bf-5f4b-4054-b4bd-3e6c93c029b2.png`: original concept atlas.
- `exec-ae9c1ca6-07d4-4d41-b7ef-abb4b93623be.png`: previous production atlas (superseded: atlas cells clipped wing/effect tips).
- `exec-0f501ad6-f501-4fa3-a3b6-102068149529.png`: ending atlas, sliced into three WebP panoramas under `public/sprites/rpg/ending/`.

Validation: `test-rpg-campaign.mjs`, `test-rpg-ending-browser.mjs`, `test-rpg-demon-main-browser.mjs` (actual App attack handler), updated native-engine/city/duel tests, existing save/adventure/lifestyle tests, English UI gate, web build, server build, Android asset manifest verification. New generated assets are included in the Android asset-pack hashes.

The six demon sprites now use individually regenerated whole images, without atlas slicing. All horns, wings, weapons and effects fit inside each source. Transparent padding is retained when converting to WebP, and the battle renderer disables the inherited humanoid zoom specifically for `RPG_DEMON`. Sources, ordered idle/attack per phase:

- `exec-c7374e01-5608-4a14-a960-1c46656c396d.png`, `exec-a165a38f-5a94-4471-91d0-ce623f061aec.png`
- `exec-e01abd2e-f1c1-422a-b442-b66c92020173.png`, `exec-ca0e51eb-07ce-4dc6-b7f9-07c1488c5dd7.png`
- `exec-e15a7dda-c89a-4c63-829f-0a078e6c0bfa.png`, `exec-e09a1d43-ce5a-465c-879b-5259541134df.png`

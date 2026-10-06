# Isekai campaign and peaceful world

Six regional examiners guard Sunlit Meadow, Whispering Forest, Mirrorwater Wetland, Amber Dunes, Starfrost Highlands and Dawn Ancient Ruins. Each has one reachable site in its biome. Their shared victories break the Demon King's Citadel barrier. Examiner names remain the regional names in battle regardless of the selected school theme; their appearances reuse existing themed art.

The original humanoid Demon King has three forms: 魔王 → 真・魔王 → スーパー魔王ハイグレードEXスペシャルエディションαオメガMAX. Each form has its own generated idle and attack illustration. Magic attacks use the attack art. The original enemy type `RPG_DEMON` has escalating attack/defend/strength/debuff patterns. Normal attack, poison and thorns transformations preserve combat and reset status effects. Authoritative shared HP resets between all three phases; old-phase packets are rejected, and cumulative damage resets for all participating players. A local transformation waits for its matching server phase rather than double-counting the hit. Only the third defeat clears the campaign.

The ending has six manually advanced passages across three generated panoramas: vanquishing the Demon King; learning and friendship as the source of victory; dawn across six regions; a welcome from the residents; responsibility for rebuilding; accepting an unlimited peaceful future. Existing victory music accompanies the cinematic, and reduced-motion preferences are respected. Button placement is checked at 320×568, 390×844, 568×320, 844×390 and 1440×900.

`endingProgress` is per-player authoritative state and saved with the world. It accepts only sequential steps 1–6. City management cannot unlock before the requesting player's ending is complete or while anyone is still receiving combat rewards. The existing ranking rewards remain intact. Continuing removes ordinary enemy sites, retains the saved world, and removes the timer. Town/rest/event cooldowns no longer require more battles in the peaceful world. Other participants can finish their own ending even if one participant has already opened the city.

New worlds have campaign version 2 and Peer protocol 20. Save migration adds the three missing regional trials to uncleared legacy worlds, preserving old trial victories and IDs. Already completed worlds retain their victory, and existing city worlds do not unexpectedly replay the ending. The save format remains version 1; migration is idempotent.

Generated source atlases are retained in `/workspace/generated_images`:

- `exec-de9c61bf-5f4b-4054-b4bd-3e6c93c029b2.png`: original concept atlas.
- `exec-ae9c1ca6-07d4-4d41-b7ef-abb4b93623be.png`: transparent production idle/attack atlas, sliced into six WebP assets under `public/sprites/rpg/demon/`.
- `exec-0f501ad6-f501-4fa3-a3b6-102068149529.png`: ending atlas, sliced into three WebP panoramas under `public/sprites/rpg/ending/`.

Validation: `test-rpg-campaign.mjs`, `test-rpg-ending-browser.mjs`, `test-rpg-demon-main-browser.mjs` (actual App attack handler), updated native-engine/city/duel tests, existing save/adventure/lifestyle tests, English UI gate, web build, server build, Android asset manifest verification. New generated assets are included in the Android asset-pack hashes.

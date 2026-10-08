# VR 300-stage expansion

The original 50 mission IDs and `gakurogear-vr-v1` records remain compatible. IDs 51–300 add 10 environments × 5 layout configurations × 5 difficulty tiers. Each difficulty selector now contains 60 missions; online hosts also filter by difficulty.

- Playfields span 16, 22, 30, 38 or 48 metres. The expanded maps use independently scaled axes, cover, patrol routes, camera angles, switches and sensors.
- Elevated layouts have continuous slopes with rises of 2, 3, 4 or 6 metres. The same `floorHeight` function drives movement, cameras, objectives, characters and Three.js rendering. There is no jump requirement.
- Six selectable weapons: bubble pistol, long-range training rifle, foam shotgun, rapid blaster, foam baton and training hammer. Range, cooldown, spread, ammunition cost and single/multiple hits differ. The two melee weapons consume no ammunition.
- Four selectable items: sound decoy, ammo pack (+8), stealth cloak (6 seconds) and speed boots (8 seconds). Quantities and cooldowns are authoritative; cooperative inventories remain independent.
- Objectives combine files, rescue mannequins, relay activation, required door switches, unnoticed defense-zone occupation, sleep holds, ranged hits and extraction. Files/rescues/relays take different interaction times and have distinct shapes and colors.
- Select equipment through the weapon and item slots. R attacks, X uses the selected item, Q throws a decoy, E collects/activates and F performs a rear sleep hold. Touch users have explicit Attack and Use buttons.
- Cooperative zone spacing scales with mission size. Terrain and objective coordinates are copied into each participant's zone. Shared patrol simulation handles weapon hits and decoy attraction. Battle royale keeps its random arena while supporting weapon/item selection.
- Floor tiles use one instanced mesh to limit draw calls in expanded cooperative maps.

Validation: `test-vr-expansion.mjs` flood-fills all 300 stages and checks every mandatory location, six weapon types, item consumption/effects, terrain height and compound extraction conditions. `test-vr-online.mjs` covers expanded cooperative terrain/inventories/decoys and existing cooperative and royale behavior. Browser suites cover five screen sizes, equipment selectors, stage selection and real PeerJS peers. English gate, production build and server build are required before publication.

# Furniture benefits and expansion

## Collection

48 new furnishings use original ImageGen illustrations, bringing the catalog from 75 to 123 entries. The three generated 4×4 atlases match the existing bookshelf's wood, brass, shading and camera. Each complete object is extracted using its connected alpha regions, with generous separation between objects, then fitted into a padded 320×320 frame. It is encoded into an individual transparent WebP at quality 92. Source PNGs remain in `/workspace/generated_images`:

- `exec-64234503-c2b4-4297-a09d-d2d2891d65d0.png`: gramophone, radio, record cabinet, cello, organ, drum and ten plush toys.
- `exec-aea10137-74b0-4ec6-b78a-6b19bf2d8aed.png`: six training furnishings, alchemy, herbs, tea, coffee, oven, picnic basket, washing machine, bathtub, basin and sewing machine.
- `exec-06f8d678-91b9-4e02-a61d-786375d56d35.png`: study, astronomy, lights, nature displays, treasure storage, barrels, linen, futon and folding screen.

Catalog entries in `newFurniture.ts` contain costs, footprint, Japanese/English/hiragana names and benefit groups. Furniture storage increases from 40 to 160 pieces in both 2D and 3D homes.

## All non-game furniture has a benefit

Every catalog entry without `game` has one of four effects while placed at home:

| Group | Per different furniture type | Global cap |
| --- | --- | --- |
| Might | +1 Strength for the battle | +4 |
| Guard | +2 starting block | +16 |
| Focus | +1 starting draw | +2 |
| Comfort | Heal 2 HP at battle start | 8 HP |

The furniture details and crafting lists show the effect. A home panel displays the current effective totals and caps. The same type counts once across all qualifying homes. Unplaced stock and furniture in other people's homes do not count. Two-dimensional owned/cohabiting homes and the player's registered, intact 3D rooms count. Broken 3D enclosures stop providing bonuses until repaired. Game furniture keeps its existing game functionality.

The host records a bonus snapshot when entering a native battle. The local preparation adds it once with relic effects, before the initial draw. RPG duels and cooperative dungeon battles calculate the bonus on preparation. Furniture changes do not alter an already prepared battle. Leaving RPG restores the main game's existing battle behavior.

## Home music

Gramophone, radio, record cabinet, cello, organ, drum, music box, piano and harp enable eight home BGM selections, using the existing original soundtrack. A house resident may change 2D home music; the owner or a permitted user in a shared 3D room may change 3D music. The authoritative room action verifies that the instrument remains placed and that the requester is in the room/home. The saved choice is shared with visitors.

The room music applies only while the home is the surrounding music scene. Leaving restores map music; removing the last music furnishing restores default home music. Dedicated game and battle audio priority is retained. BGM selection and world/battle snapshots need the updated online server, so Render must be manually deployed when authorized.

The peer-to-peer RPG protocol advances to version 25 so older clients cannot silently omit furniture bonuses or reject new furniture/music actions.

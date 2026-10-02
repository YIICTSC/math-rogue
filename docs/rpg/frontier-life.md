# RPG frontier life

- Six biome climate fields have warped, blended borders. Vegetation samples the same mixture; terrain density also blends. Main river and tributary remain crossed by the existing road network.
- Click a tree, rock or river to approach it, then click again nearby or open **採取・クラフト**. E opens nearby sites/houses or gathering. Resources are usable within two Manhattan tiles.
- Gathering has a timed tool swing (perfect hits do double work). Fishing requires waiting for a bite. Resource damage/depletion is shared; nodes regrow after three minutes, with regrowth delayed while someone occupies the tile.
- Planks and bricks use 学ロクラフト's shared recipes. Weapons become battle cards; crafted relics use the existing battle-start relic effects. Equipment can be made once per player per adventure.
- Houses cost six planks and two bricks. Build on grass away from landmarks, roads and water. Craft darts, billiards or arcade furniture inside your own house, then invite everyone. The house directory shows owners and visitors and offers walking directions.
- Indoor games reuse 学ロクラフト's authoritative `homeGames` engine and `HobbyGamesPanel`. Up to four players join each game; separate furniture and houses have separate sessions. Leaving or disconnecting removes a player from their game.
- Materials, houses and games belong to the active room, not a cross-session save. Houses remain usable when their owner leaves while the room remains open.
- Life actions, distances, costs, timing and rewards are handled by the authority (server or peer host). Harvesting never mutates terrain tiles, so incremental peer snapshots can represent depletion correctly.
- `public/sprites/rpg/frontier-atlas.webp` contains 24 ImageGen illustrations in a 6×4 atlas; it is converted losslessly from the generated PNG. Rows: woodland/wetland plants, desert/snow resources, ruins/minerals/plants, cottages/fishing/crafting/relic.

## Walkable homes and illustrated crafting

- Craft a house building kit (six planks and two bricks), then build it on valid grass. Building opens the room; walking onto an existing house's entrance tile also opens it. Exiting through the indoor doorway returns the player to an adjacent outdoor tile.
- Each room is 18×14 tiles. Indoor arrow keys, WASD, touch controls and tap-to-walk use authoritative grid movement. The bottom doorway is the exit; its approach cannot be furnished. “入口へ向かう” walks to this exit rather than teleporting.
- The homeowner crafts furniture inside the house. Furniture enters the room inventory, then can be placed, rotated, packed away and placed elsewhere. Visitors can walk and join games but cannot edit the room. Rugs can sit underneath other furniture. Occupied tiles and the route to the exit must stay clear.
- The catalog has 28 furnishings: beds, sofas, chairs, tables, shelves, wardrobes, fireplaces, plants, vases, lighting, two rugs, six plush toys, paintings, clocks, crystal displays, armor stands, aquariums, music boxes, workbenches, darts, billiards and arcade cabinets.
- Game furniture becomes playable when placed; players join from within two tiles of its footprint. An active game cannot be packed away or rotated. Exiting removes the participant from the game.
- Old houses receive their default workbench/table layout and retain old game furniture when entered. Room positions, furniture inventory/layout and games synchronize through the same authority snapshots as the outdoor map.
- ImageGen assets: `craft-items.webp` (4×3 square-cell atlas, 12 crafted items) and `home-interiors.webp` (6×4 atlas, 24 furnishings/plush toys). PNG originals are retained in the generation workspace; shipped WebP conversion is lossless with alpha preserved.

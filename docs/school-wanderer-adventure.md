# School Wanderer: offline adventure expansion

Both SchoolDungeonRPG and SchoolDungeonRPG2 use the same serializable school-themed extension. Existing turn-based play, curriculum questions, equipment, cards, layouts and mid-adventure saves remain in use. The new systems are offline and store separate base records for games 1 and 2 on the current device.

## Supplies and tactical rules

- Craft glue combines enhancement values and up to four equipment emblems. Rust protection, theft protection, fire/blast protection, dodge, wide attack, food drops and other existing equipment effects can transfer. Nurse pencils add attack healing; dragon rulers add double dragon damage. Sealed ingredients must be cleansed first; overflow fails without consuming ingredients.
- Storage schoolbags, nurse boxes, inspection pencil cases and craft boxes have explicit capacity and nested item records. Storage/inspection contents can be retrieved; nurse/craft boxes must be broken. Putting in/taking out/breaking costs a turn. Containers cannot contain containers, and unpaid merchandise cannot be stored. Breaking deposits contents on the floor.
- Seals prevent using or removing equipment. Cleansing erasers remove seals; teacher stickers bless a selected supply, adding HP recovery when used. Return notebooks bring inventory, equipment and coins home, consuming the notebook. Nurse charms automatically revive after defeat; pickaxes have finite wall-breaking charges; float badges enable waterways.
- Six new enemy behaviors supplement the existing roster: torn paper splits when injured; sticker imps seal a supply and temporarily disable cards; pencil cases swallow a supply that drops on defeat; eraser monsters reduce equipment enhancement; rice-ball pranksters transform a supply; bullies absorb nearby foes and level up. Existing creatures and boss encounters remain available.
- Waterways, slippery floors, holes and concealed lockers change route choices. Wide-room decorations reserve starts, stairs and neighboring exit cells. Pickaxes can open interior walls and hidden lockers; outside map borders stay solid. Flying foes can cross waterways and holes.
- Visible traps can be recovered into an eight-slot pouch and placed ahead. Crafted traps affect foes entering their cells and are consumed. Trap-workshop adventures reveal traps from the start.
- Shop supplies can be displayed on the floor. Taking them accrues a bill; pay or return them through the notebook. Leaving the shop area unpaid alerts hall monitors. Escaping to another floor clears stolen goods' ownership. Unpaid goods cannot be used, stored, thrown or sold to generate coins.
- Bells warn at 150, 220 and 280 turns on one floor, followed by monitors. At 320 turns the expedition ends. This prevents indefinite safe farming on one floor.

## Base, classmates and continuing stories

The school meeting point contains a persistent warehouse, savings, challenge records and rescue requests. Returned supplies can be selected for a story adventure (up to sixteen), alongside starting supplies. Coins are withdrawn from savings when departing. Departure escrow protects supplies if a tab closes before the first adventure snapshot commits; a completed withdrawal is acknowledged after the saved run ID is read back. Returned expeditions cannot overwrite the warehouse with a stale active snapshot.

Story expeditions can take Aoi (healing), Takeru (support) or Hinata (supply retrieval). Classmates follow passable paths, can wait or regroup, have HP and levels, and retreat when exhausted. Nurse facilities restore their health. Lost classmates can also join during exploration. Nurse stations, snack traders and recurring teacher/librarian/caretaker conversations are placed on floors; story progress persists across expeditions.

Defeat creates a lost-supply rescue request. A separate expedition must reach the defeated floor to deliver the lost supplies to the warehouse once. Rescue has at most three attempts; failed rescues retain the original request and its attempt count. The legacy single-item inheritance option removes that selected item from the rescue package, preventing duplication. Puzzle failures do not replace an existing rescue request.

## Challenge selection

| Rule | Goal |
| --- | --- |
| After-school adventure | Story principal on floor 20; warehouse items and a classmate allowed |
| Empty-handed 99 floors | No stored supplies; reach floor 99 |
| Mystery school | Random supply labels and identification; 30 floors |
| Trap workshop | Visible traps, collection and placement; 20 floors |
| Gym-clothes challenge | Weapons and armor cannot be equipped; 20 floors |
| Strategy notebook | More card drops in game 2, umbrellas/notebooks in game 1; 30 floors |
| Lost-supply rescue | Reach the requested floor; no warehouse items |
| One clever move | Eight fixed layouts with enemies/traps/supplies and explicit turn budgets |

Non-story rules use stairs instead of the story-only principal on floor 20. Their goal triggers the completion flow and return to the base. The existing endless continuation remains available for the story adventure.

## ImageGen art

`public/sprites/school-wanderer/items-atlas.webp` and `actors-atlas.webp` are lossless WebP conversions of two transparent ImageGen sheets created on 2026-10-08. Each contains sixteen sprites. Actor sheets include two walk poses for each classmate. `spriteRects.ts` records measured opaque bounds with outline padding, rather than assuming the generated sprites align exactly to uniform cells; this preserves objects crossing nominal cell boundaries and avoids sampling neighboring art. Map rendering and notebook/container/warehouse icons use the same atlas mapping. Both Web and Android manifests include the new assets.

Original generated PNGs remain in the execution workspace under `/workspace/generated_images/exec-e6d8b62f-50b2-4717-b5f5-fe1fc1daf913.png` and `exec-8529dc72-cec3-4845-968f-584165cee126.png`.

## Validation

`node scripts/test-school-adventure.mjs` validates emblems, seals, containers, ownership, challenge goals, evolution and forty safe layouts. `node scripts/test-school-adventure-browser.mjs` mounts both real components and exercises portrait/landscape/desktop panels, container turns, unique carryover, classmates, equipment restrictions, puzzles, revival, enemy supply attacks, trap actions, shop bills, excavation, terrain, facilities, rescue, atlas alpha, reload and interrupted departure recovery. The browser fixture instruments the shared controller for deterministic state setup; game UI, rendering and state setters are real.

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

## Eight-direction companion polish (2026-10-08)

All four classmates now use eight facing directions and two walking frames (64 active frames) generated by ImageGen, with dedicated lossless transparent WebP atlases and measured sprite rectangles. Walking uses a stable foot baseline and consistent scaling; waiting uses a stationary pose; assisting attacks faces the target. A map HP strip indicates exhaustion. New floor entry chooses an unoccupied adjacent floor cell where possible. Older saves without facing/frame fields remain compatible.

Companions find shortest safe eight-way routes around walls, occupied cells, water and holes. Diagonal steps cannot cut wall corners. Walking frames advance only on actual movement, and followers stop adjacent to the player. Routes that cannot be reached leave the companion in place rather than crossing obstacles. Pure route tests verify direction mapping, detours, corner collisions and blocked corridors; browser tests decode every active companion frame in both real game components.

Original ImageGen outputs: exec-a1099236-057f-4af8-81ac-ba757c4a77c6.png and exec-6d28bf84-9f17-43f4-8f7f-32925571b50e.png under /workspace/generated_images.

## Journey villages, scenic maps and extended tactics

Both games have safe journey villages on story floors 5, 10 and 15; later endless story play continues the five-floor pattern (excluding the principal's floor 20). Enter a facility from an adjacent tile or use the town toolbar. Inns cost 80 coins and restore HP/food/classmates and dry supplies; the smith costs 150, removes equipment seals and adds +1 once per village; mail sends all carried coins to the school bank; shops sell eight explorer supplies; the festival gives one random supply for 50 coins per village. Purchases check funds and inventory capacity. Towns pause hunger and the bell.

Story floors 6, 11, 16 and 18 introduce cherry-blossom waterfalls, bamboo mountains, autumn lake scenery and snowy aurora scenery. These are actual walkable connecting maps with a visible river/bridge layout and stairs, a picnic recovery event, and safe traversal. ImageGen scenery-atlas.webp provides six backgrounds, including the village and dojo. Transparent path overlays preserve readability and scenery proportions.

Rain can wet paper supplies every 25 turns unless a rainproof badge is equipped. Wet supplies must be dried at an inn or with a repair kit. Fog and night reduce ordinary visibility; night alternates every 80 turns and empowers umbrella ghosts. Wind shifts loose non-shop supplies every 12 turns. Additional enemies include coin-snatching chests, night umbrellas, poisonous muddy boots and regenerating sprouts. All use their new sprite-sheet art, alongside the previous enemy roster.

Eight new supplies offer a limited-use directional rain umbrella, nearby sleep whistle, safe teleport crane, trap-revealing magnifier, rainproof badge, safe picnic recovery, equipment repair and a redeemable gold medal. Equipment resonance rewards three school-themed pairings: nurse weapon/healing bracelet (+2/+2), dragon weapon/fire or disaster armor (+4/+3), stainless pen/name-tag armor (+2/+2). Emblem inheritance also qualifies. Adventure records contain discovered supplies/foes and recent events. Certificates reward ten dojo clears, fifty dojo clears and twenty discoveries once each, depositing coins in the school bank.

## School Wanderer dojo: 50 lessons

The starting base has a dedicated entrance to fifty independently selectable, deterministic lessons, across ten subjects with five spatial variants each: turns/routes, diagonal corners, corridor combat, sleep, directional magic, water, traps, hunger, key detours and digging. Each lesson has its own map, limited turns, HP/food and tool budget. Enemies retaliate while adjacent; sleep suppresses retaliation; ray tools stop at walls; floats enable water; traps deal damage; lunch prevents starvation; keys open adjacent doors; picks cannot break borders. Diagonal movement respects blocked corners. Hints, restart, stage selection, next-stage progression and best clear turns are available. Lesson equipment and failures are isolated from the expedition, warehouse and rescue. Both games store their own dojo completion records.

`test-school-dojo.mjs` verifies that all fifty unique scenarios have legal winning action sequences, and checks immutable reducer state and finished-state handling. Browser integration exercises the real dojo entrance and a clear, both games' town services, four scenery routes, rain/repair/wind/night effects and all sprite frames. Mobile portrait/landscape and desktop dialog bounds are checked. All six generated sheets (original and expansion) are available to Web and Android asset manifests.

## 道場の画面と操作
50ステージの練習は通常のゲームキャンバス、ステータス欄、十字キーとA・B・Rボタンの配置をそのまま使用する。Bから道具・ヒント・やり直しを開き、Rで練習用道具を使用する。選択と結果のみダイアログに表示し、冒険の持ち物・座標・空腹を変更しない。

## 解禁と配置
最初は放課後の大冒険と50問道場。道場5問で放課後の一手、15問で工作室を解禁。大冒険クリアでなぞなぞ校舎・作戦ノート・工作室・一手を解禁し、なぞなぞか作戦ノートのクリアで体操服、そのクリアで99階を解禁。既存のクリア記録があるモードは維持する。救助は依頼がある間のみ。
特殊敵は4階から少数、7・11・16階で能力の種類を追加。追加敵は8階から登場。イベントは足元への移動と正面へのAで反応する。生成時とロード時に壁・到達不能地点・重なりを補正する。隠しロッカーは床アイテムではなく壁の模様として表示し、Aでつるはし採掘または説明を表示する。開始拠点・手帳は4色GB風の角型ボタンと枠、等幅文字で統一。

## マップ演出の整合性確認
町・景勝地・パズルなどで生成後にマップを置き換えた際は、最終マップの出発座標を主人公にも適用し、移動オフセットをリセットする。古い保存で主人公が壁に残っていた場合は近い床へ補正する。階層切り替え時は前の階のエフェクトと揺れを消去し、薄く短いフェードにする。景勝地の通れない川と渡れる板橋をセル配置に合わせて描画し、外周・障害物・階段を明示する。ピクニックはシート画像で表示。安全な町・景勝地では下校チャイムと制限手数を進めない。風による道具移動は施設・主人公・敵・罠への重なりを避ける。既存のImageGen背景・スプライトを再利用し、今回は新規素材生成なし。

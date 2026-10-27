# GAKURO Basketball · Half Court / Full Heart

A 3D half-court arcade basketball game in the Sports club. One player controls one athlete; CPU fills the remaining places. Online groups form balanced three-person teams and, with 7–24 entrants, an elimination tournament. Up to 32 room members can participate, including spectators.

## Match loop

- Both teams attack one hoop. Field coordinates and outcomes are owned by `engine.ts`; Three.js and the 2D GPU fallback render the same snapshots.
- Baskets score 2 points inside the arc and 3 outside it. Normal games last 3 active minutes. Ties continue until the next scoring advantage. A live shot released before the buzzer can finish.
- Defensive steals, interceptions and rebounds require clearing the ball beyond the arc before shooting. A yellow target and contextual prompt show the route.
- Possessions have 24 seconds. Passes do not reset the clock; offensive rebounds restore at least 14 seconds. Made baskets lead to a short check-ball restart for the other team.
- Release timing, distance, position, stamina, focus and nearby defenders affect actual shooting probability. Random make/miss outcomes stay on the host; clients cannot submit their own shot quality.
- Blocks deflect the live ball, missed shots bounce into playable rebounds, passes can be intercepted, and screens slow defenders through physical positioning.
- Three selected learning questions precede play and recur at safe pauses around each active minute. Match and possession clocks stop during questions. Correct answers restore focus and skill energy and use the existing assignment/progress callback.

## Controls and roles

Move with the virtual stick, arrow keys/WASD or controller left stick. The right action cluster changes with possession. Hold Shoot and release in the yellow window; Z controls the primary contextual action. C is pass/screen/steal, X steals, V rebounds, B blocks, Space drives/dashes and Shift activates the position skill. Off-ball players can call for passes or screen. Pointer cancellation, blur, menus and disconnected controllers cancel held shots and neutralize movement.

| Position | Strength | Original skill |
| --- | --- | --- |
| PG | Passing, speed and drives | Meteor Crossover / 流星クロス |
| SG | Long-range shooting | Star Arc Sniper / 星弧スナイプ |
| SF | Balanced drives and dunks | Azure Finish / 蒼天フィニッシュ |
| PF | Screens and rebounds | Thunder Rebound / 轟天リバウンド |
| C | Blocking and rim protection | Iron Guardian / 鉄壁ガーディアン |

Positions can be selected in the entry screen and lobby. CPU fills missing guard/forward/center roles. Skills require a full energy gauge and have an authoritative cooldown. Per-player points, assists, rebounds, blocks and steals are recorded for match results.

## First solo guidance

The v2 onboarding record is separate from the earlier full-court controls. Initial solo play asks three questions, then teaches movement/dribbling, directional drive, pass, return pass, steal, approach and held-shot release. Opponent attacks and match clocks pause during guidance. The training shot is assisted, but only an actual basket completes the record. The confirmation button resets score, time and both teams' starting positions for the normal CPU match. Reloading after completion skips guidance. “Practice controls” can replay it. Online rooms never enable the tutorial.

## Visual design and generated action art

The gym uses a frontal elevated camera, a single visible hoop, polished wood markings, a selected-player arrow, team rings, shot advice and rebound indicators. Existing protagonist/custom-avatar 3D rigs animate runs, drives, passes, shots/dunks, steals, screens, blocks and rebounds. The center of the playfield is kept clear; touch controls remain at the corners.

ImageGen originals and provenance are retained in `assets/basketball/action-icons*` and `assets/tennis/action-icons*`. Runtime WebP atlases use exact equal cells addressed through CSS. Basketball has 9 illustrations; tennis has 6 with distinct trajectory cues, shot labels and short explanatory captions. Tennis retains its shot order, charging behavior, pointer capture and keyboard controls; its serving button receives a contextual Serve label.

Design references: the [official Street Rivals description](https://play.google.com/store/apps/details?hl=ja&id=com.fivexgames.kuroko) and [official website](https://www.kurobas-sr.com/) establish its 3on3/skill presentation. The user's screenshot informed the frontal gym view, player marker and compact right-hand action cluster. The 3-minute duration, 24-second clock, role tuning, original skills, generated icons and learning loop here are GAKURO's implementation choices.

## Networking and verification

Basketball protocol **v2** is required for the revised state and actions. New WebRTC rooms use a v2 room prefix. Dedicated `/basketball` pongs advertise the protocol, so older servers are hidden by availability probing; direct joins to an outdated server receive an explicit version error. The existing manual Render deployment policy remains unchanged. A main push does not deploy the dedicated server.

Useful checks:

- `pnpm run test:basketball`: scoring, timing authority, possession/clear, passing/interception, blocks/rebounds/screens, five skills, pauses, CPU completion, tournament, onboarding and packet validation.
- `pnpm run test:basketball:browser`: real 3D and GPU fallback, phone/desktop controls, an actual tutorial goal, completion storage, role skill and English UI.
- `pnpm run test:sports-invitations`: actual WebRTC and dedicated rooms, common invitations, names/codes, copyable links and sports layouts.
- `pnpm run test:sports-action-art`: alpha, exact atlas geometry and distinct visible illustrations.
- `pnpm run test:tennis:layout`: both court sides, four viewports, visible players, six illustrated controls and GPU fallback.
- `pnpm run server:build` and `pnpm run build`: required server/frontend and English UI gates.

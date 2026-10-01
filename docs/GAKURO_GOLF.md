# GAKURO GOLF — initial playable version

Debug-only title-screen game, using the same debug-feature and daily-assignment gates as GAKURO GP. All participants enter from their debug title screen; there is no public invite bypass. Solo practice and host-created rooms share the same simulation. The host selects a lesson through the existing `ModeSelectionScreen`, including delivered assignments and custom questions. Guests use that lesson.

## Playing

Three holes (par 3 / 4 / 5), played independently and simultaneously. Before **every** shot, answer three newly sampled questions and review their correct answers. Then choose a driver, iron, wedge or putter, aim relative to the cup, and set power. Fewer strokes over all three holes wins; equal totals tie. A hole ends at 12 strokes (a final water/OB penalty can make 13). Leaving mid-round is recorded as DNF.

| Correct / 3 | Maximum power | Direction spread |
| --- | --- | --- |
| 0 | 55% | ±9° |
| 1 | 70% | ±6° |
| 2 | 85% | ±3° |
| 3 | 100% | ±0.7° |

The power slider scales the unlocked maximum. Clubs have different speeds and lofts. Gravity, air wind, bounce and surface-dependent rolling friction determine the result. Rough and sand reduce launch power. Water/OB returns the ball to its previous position with one penalty stroke. The green has lower friction and a generous cup capture radius for the initial learning game.

## Local PeerJS multiplayer (without the server URL)

`GolfRoom` uses PeerJS / WebRTC in a star: **one host plus up to 39 guests**. Only the host evaluates answers and simulates balls (30 Hz); each client receives its private view at 5 Hz and on accepted commands. Quiz solutions and future questions stay on the host until an answer is submitted. Commands include a shot ID and question index so duplicate/replayed answers or shots are rejected. Slot reservation, join timeout, packet validation, rate limits and buffered-packet limits bound connections and input.

Same signaling configuration as GP: `VITE_RPG_PEER_HOST`, `VITE_RPG_PEER_PORT`, `VITE_RPG_PEER_PATH`, `VITE_RPG_PEER_SECURE`. `VITE_GOLF_ICE_SERVERS` optionally provides a JSON ICE server array; it falls back to `VITE_KART_ICE_SERVERS`. Without a custom signaling host, PeerJS uses its default service. Restrictive school networks may require TURN. A 40-player cap does not guarantee 40-device connectivity on every network; real device/load validation is required before public release.

The host must keep the tab visible. Hiding it pauses everyone; heartbeat snapshots continue. Host loss closes the session, with no host migration. Guests dropping out do not block the remaining players from finishing. A new round is created from the clubhouse after leaving the current room.

## Verification

`pnpm run test:golf` covers physics, all reward tiers, mandatory three-question gating, replay rejection, penalties, scoring, 40-player capacity and per-player answer privacy.
`pnpm run test:golf:browser` exercises the actual debug entry, lesson selection, shot UI, mobile layout and local PeerJS multiplayer.
Run `pnpm run audit:english:gate` and `pnpm run build` before committing/publishing.

## Render dedicated mode and integration handoff

Set `VITE_ONLINE_SERVER_URL=https://learning-rogue-online.onrender.com` when building the frontend. GolfRoom converts this URL to `wss://learning-rogue-online.onrender.com/golf`; online creation/join then use the dedicated server. Solo practice remains local. With the variable absent, the existing PeerJS mode remains available.

`server/golfRooms.ts` exports `createGolfServer` and `GOLF_ENDPOINT`. It reuses the same golf engine and private `viewFor` projection. The server builds questions from the selected lesson/assignment, grades answers, and runs 30 Hz physics with 5 Hz state delivery. The owner's tab visibility does not pause Render. If the owner disconnects, ownership moves to the first remaining member; the simulation continues. Rooms disappear after their last client leaves, or after 30 minutes without game input. Default limits: four rooms, forty players per room, 160 sockets; configurable via the adapter options.

The existing single upgrade router in `server/index.ts` now calls `golfUpgrade(req,socket,head,allowed)`, and its SIGTERM handler calls `closeGolfRooms`. The `/online`, `/kart`, and `/craft` routes remain available. Golf uses the shared `src/services/dedicatedConnection.ts`; its game union now includes `golf`. This branch is based on Render integration commit `2c232beeeee3b423e1b8a284f7f7770e0772abcf`.

- Client hello: `open('golf', {create:true,name})` or `{create:false,code,name}`. Transport sends `{type:'connect',protocol:1,...hello}`.
- Welcome: `{type:'connected',id,code,host}`. Sent again when room ownership changes.
- State: `{type:'init'|'state',version:1,sequence,state:GolfView}`. Only the player's current question and submitted-answer feedback are included.
- Host setup: `{type:'lesson',selection:LessonSelection}`, then `{type:'start'}`.
- Input: `{type:'command',command:GolfCommand}`.
- Error/ping: `{type:'error',message}` and `{type:'ping',at}` / `{type:'pong',at}`.

Verification: `pnpm run test:golf:server` exercises forty real Node WebSocket clients; `pnpm run test:golf:dedicated` exercises GolfRoom with forty browser WebSockets. Both cover server-side questions/authority and continuation after owner loss. Existing physics, lesson picker, mobile and PeerJS tests remain available.

This branch includes the initial golf UI integration in App/types/debug translations/save isolation because the initial golf implementation had not yet been committed. When cherry-picking into a checkout with local App debug edits, retain those edits and add only the GAKURO_GOLF import, guarded title button/render, and non-resumable-screen exclusion. Merge the package scripts/dependencies with the kart/craft changes and regenerate pnpm-lock.yaml if necessary. Render redeployment and the combined main update are left to the integrating checkout.

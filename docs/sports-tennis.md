# Academy sports and tennis

The main-menu Golf button is now Sports. The sports club offers the existing golf game and GAKURO TENNIS. `GAKURO_GOLF` remains the internal screen identifier to preserve saved navigation and golf invitations. `?golfRoom=` still goes directly to golf; `?tennisRoom=` opens tennis joining with the correct host/server transport.

Tennis uses the existing React/TypeScript/Three.js stack and protagonist GLBs. Simulation (`tennis/engine.ts`) is independent of the renderer (`TennisCanvas.tsx`). The original ImageGen sports-club illustration and provenance are in `assets/sports`; its WebP is shipped in the web and Android manifests. WebGL failure uses the same simulation and controls with a 2D court fallback.

## Playing

- Singles: one player against a CPU, or individual entrants online.
- Doubles: one player plus a CPU against two CPUs locally. Online, adjacent entrants in the lobby form pairs. With two entrants, each receives a CPU partner; an odd final pair gets one CPU.
- Topspin, slice, lob, drop shot and star shot; hold/release to charge, directional aiming, movement and stamina-limited dash. Star energy builds on hits and correct answers. Movement supports keys, touch stick and standard gamepads.
- Tennis scoring: 0/15/30/40, deuce/advantage, two faults, diagonal service boxes, net/outs, a two-bounce point and volley restrictions on serve. Quick play is one game; 3- or 6-game sets require a two-game margin, with a seven-point/two-point-margin tie-break at 3–3 or 6–6.
- The host selects lesson ranges or an assignment with the existing problem picker. Every court starts with three private questions. Three more appear between games (including before final results), or at a point boundary after about three minutes. Zero correct still resumes play. Correct answers are recorded once in local learning history and app progress, and grant star energy. Spectators receive no private questions.
- CPU play pauses in its menu. Online play continues under a player's menu. Host WebRTC rooms pause when the host document is hidden; server rooms keep running.

## Tournaments and communication

Online supports up to 32 entrants and 40 room members including spectators. Standard seeded brackets distribute byes to the next power of two. Each round's courts simulate concurrently. Winners advance after all courts finish; byes and eliminated entrants can watch live courts or choose a court from the bracket. Late joins spectate until the next tournament. A whole team withdrawing forfeits; a disconnected doubles partner is CPU-controlled while another human teammate remains.

`TennisRoom` supports PeerJS host rooms and dedicated `/tennis` WebSockets. Hosts/servers own the ball, points, collision decisions, bracket and grading. Clients send bounded movement/shot/answer commands, not ball positions or winners. Private views strip future questions and answer keys. The dedicated server rotates lobby ownership when the host leaves. Result/end-session handling uses the shared result modal. No Render deployment is initiated by this change; the new dedicated endpoint requires the usual manual server deployment. Host communication uses the existing signaling configuration.

## Validation

- `pnpm run test:tennis`: all entrant counts 1–32 in both formats, byes, privacy/replay checks, shot validation, scoring, a complete CPU match, complete irregular brackets and withdrawal behavior.
- `pnpm run test:tennis:peer`: five independent real WebRTC clients, a singles tournament through results, and a doubles rematch.
- `pnpm run test:tennis:server`: real WebSockets, five-player doubles tournament, private learning, blocked forged commands, late spectating, rematch and host migration.
- `pnpm run test:tennis:browser`: sports/golf entry compatibility, original 3D heroes, actual learning UI and once-only answer records, keyboard/touch layout at 320/390/844/1280 widths, live host tournament/bracket/results and doubles rematch. Screenshots go to `tmp/tennis-qa`.
- `pnpm run test:tennis:layout`: both court sides at four viewport sizes, HUD bounds, visible retreating heroes, touch-control occlusion, ball trails across points and correct orientation without WebGL.
- Existing golf simulation tests, type checking, English UI gate, app build and server build.

# GAKURO Basketball

Sports → Basketball opens a 3-on-3 arcade basketball game. Solo practice fills five places with CPU players. Online groups are shuffled into balanced teams of three; 7–24 entrants create a seeded elimination tournament. Up to 32 room members can join, including spectators. Disconnected players are controlled by CPU during a match.

- Move: virtual stick, arrow keys/WASD, or controller left stick.
- Shoot: Z / Shoot / controller A. Close-range baskets score 2; shots beyond 6.5 court units score 3. Range, defenders and focus determine accuracy.
- Steal: X / Steal / controller B, near an opponent with the ball. Attempts have a cooldown.
- Pass: C / Pass / controller Y. Passing does not reset the 24-second possession clock.
- Dash: Space / Dash / controller X. Dash has a cooldown.
- Matches last 3 active minutes; tied games continue until the next basket. Each team attacks the opposite hoop.
- Three selected learning questions precede play and recur every active minute. Match and shot clocks stop during the questions. Correct answers restore focus. Answers use the existing assignment/progress callback.
- Host WebRTC rooms use the configured PeerJS service. Dedicated rooms use `/basketball` with the same server availability, heartbeat, admission limits and lesson-selection validation as the other sports. Invitation links use `basketballRoom`; the common sports invitation form also accepts basketball codes.

Validation: `pnpm run test:basketball`, `pnpm run test:sports-invitations`, `pnpm run server:build`, `pnpm run build`.

The dedicated endpoint requires a manual Render deployment of the updated server under the repository's existing deployment policy. A main push does not deploy Render.

## 3D and first solo practice

The court uses the shared Three.js protagonist and custom-athlete rigs. Six players animate running, dribbling, passing and shooting; the original 2D view remains available if WebGL fails. Rendering follows the simulation and never modifies match state.

The first solo session on the device starts with three learning questions and then a guided practice: move/dribble, directional dash, pass, automatic return pass, steal, approach the highlighted hoop and score. Other CPU actions and both clocks pause during practice. Only the expected action is available. The training shot near the hoop is assisted to avoid random misses. A real basket completes practice; the player starts a fresh score/time CPU match with the confirmation button. Completion is remembered locally; leaving before scoring repeats practice next time. Online play and later solo sessions use normal rules.

`pnpm run test:basketball:browser` checks actual WebGL models, touch/keyboard actions, responsive controls, completion storage, reload and fallback. `pnpm run test:basketball` verifies authoritative tutorial progression and unchanged regular/online rules.

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

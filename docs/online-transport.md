# Online rooms

This release hides RPG, GAKURO GP and GAKURO GOLF entries until three taps on the main title logo. This reveals only games, not debug tools. Invites still open directly. Standalone Craft is removed; reused RPG furniture games remain.

Room creation defaults to Host connection (PeerJS/WebRTC). The host runs the game and must keep the page open. Signaling and ICE services are still required. Smaller groups are recommended; capacity depends on devices and networks.

Server connection (beta) is not recommended for large groups. Health checks and WebSocket setup retry for up to three minutes on cold starts. Invalid room/protocol errors terminate immediately; leaving aborts the wait.

Shared codes use H-ABC234 for host or S-ABC234 for server communication. Prefixes override the joining transport. RPG/GP/Golf invite URLs retain prefixes. Legacy unprefixed invite URLs use server communication.

Golf has a responsive title/preparation screen. Left/right arrows aim, up/down adjust spin, and Enter starts/confirms the shot meter. The right-side Shot button starts the meter without a cancel button. After setting power, an arrow marks the impact center. Course overview forward points up.

RPG town arcade rewards no longer require questions. Upgrade, synthesis, rest, shop, relic and arcade entry cards use dedicated generated illustrations.

Invitations for all three games first show only player name and Join. Golf hosts can copy an invitation URL from the lobby. Invite URLs omit unrelated query parameters and fragments. After joining, RPG participants choose their edition and protagonist (and can choose again while waiting); GP and Golf participants edit an avatar with a 3D preview. One-hit Home Dash remains available while waiting and closes when the host starts. New-player surveys are deferred until leaving the invitation flow.

Kart prepares fifteen shuffled questions from the selected units and uses a different three-question segment for each of up to five laps. Golf keeps an independent question history for each player across quizzes and holes. Duplicate source entries are merged, and questions repeat only after the available pool is exhausted. Both host and server communication use these rules.

## Render automatic deployment

`render.yaml` uses `autoDeployTrigger: commit` on `main`, without build filters. Every main update triggers a deploy, including frontend, media and documentation changes. `pnpm run server:build` checks that this policy remains configured.

For the existing manually configured service, open https://dashboard.render.com/web/srv-dauu1v41nsns73fnjdk0/settings, clear both **Build Filters → Included Paths** and **Ignored Paths**, and set **Auto-Deploy → On Commit**. Alternatively, sync the Blueprint if it manages this service. Publishing render.yaml alone does not update a manually configured service. The current Render connector cannot edit these settings.

The connection picker probes the selected game endpoint using a browser WebSocket ping/pong without creating rooms. Server communication stays disabled while checking or unreachable (including Origin denial), and falls back to Host when it becomes unavailable. A no-CORS health request wakes a sleeping server but never counts as proof of connectivity. Failed checks retry every five seconds, successful checks refresh every thirty seconds; browser focus/network changes and the Check again button trigger a fresh check. Leaving the picker aborts the probe and health request.

Kart and Golf lobbies keep a live self-avatar preview beside character editing. The waiting Home Dash opens in a full-viewport flexible stage and closes when the host starts. Result panels separate scrollable standings/settings from visible next-round and exit actions. Golf hosts can return the existing room to preparation with a selected hole count, retaining names, avatars, lesson, spectator settings and question history; scores reset and shot IDs advance to reject stale inputs.

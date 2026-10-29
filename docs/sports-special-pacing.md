# Court special moves: visibility and CPU pacing

Tennis, basketball and dodgeball show character cut-ins only for the local human
performer (`viewerId` compared with unit ownership). Opposing players, teammate
CPUs and spectators receive voice and the existing on-court ball/action effects,
without the screen-space portrait or burst. An incoming special also clears any
previous local banner. Local banners are clipped to 260 x 64 px at the screen edge;
the large screen-space burst is disabled. Golf retains its previous presentation.

CPU specials share a 24-second cooldown per team, with a 12-second opening delay
from match creation. The timestamps live on the authoritative match and survive
snapshots; eligibility is independent of energy refills, player count and FPS.
Only successful CPU specials spend the team budget. Human energy and cooldown
rules are unchanged. Dodgeball's automatic dash/counter powered throws consume
the same budget, and CPUs stop dashing into a powered throw on every possession.
Ordinary throws continue while the budget recovers.

Verification: `scripts/test-cpu-special-budget.mjs` exercises the real three engine
attack functions with full energy, a same-team CPU, human exemption and expiry.
`scripts/test-sports-cutins-safe-browser.mjs` checks receiver and local presentation
at 320x568, 390x844 and 844x390. The existing sports engine and full-game browser
performance tests cover gameplay, authoritative specials and voice behavior.

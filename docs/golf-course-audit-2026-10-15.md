# Golf course scenery audit — 2026-10-15

All 18 course definitions retain their cups, hazards, wind and physics. The playable
surface remains level, so purely decorative hills must not enter the course.

The shared atmosphere generated a ring of 14 large hills centred on the tee.
Their southern instances overlap later greens (the regression test reproduced an
intersection on hole 2). Golf now disables those shared hills and retains clouds
and particles. Other games use the default atmosphere unchanged.

Golf-specific hill placement now accounts for mesh horizontal radius, keeping its
inner edge at least 100m from the centreline (out-of-bounds starts at x ±75m).
Trees/rocks/buildings move beyond playable bounds, flowers avoid the tee and a 22m
cup radius, and the bench is placed relative to each cup rather than at fixed x22.

Validation: `node scripts/test-golf-course-scenery.mjs` audits all 18 holes in low
and high quality using loaded Blender scenery and fallback instance bounds. All
36 checks pass; cups classify as green and no solid scenery intersects the 17m
green bounds. All 36 screenshots are in `tmp/golf-course-audit`; the high-quality
contact sheet `all-courses.png` was visually reviewed. The fixture focuses on
scenery and green clearance, rather than a complete multiplayer round.

Type checking and production build pass. Existing `test-gakuro-golf.mjs` checks
hazards, putting, 40-player simulation, score caps and completion of all 18 holes.
Changes remain local for user review.

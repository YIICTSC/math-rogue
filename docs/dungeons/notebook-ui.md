# Adventure notebook and quick trap controls · 2026-10-26

Both Dungeons games now use a full-viewport journal overlay with a charcoal/navy translucent surface, restrained pale-gold selection frames, a scrollable illustrated collection and a separate character/detail pane. The screen is portaled to the document body, so map-board clipping cannot hide it. Desktop uses side-by-side panes; phone portrait uses stacked panes. Phone landscape has a compact two-pane arrangement.

The four categories are Supplies, Equipment, Journey and Diary. Equipment and container actions remain available where they were supported. Journey replay preserves read/unread status. Diary retains ending replay, discovered supplies/enemies, three milestone reward claims and recent field notes. Closing an ending replay launched from the notebook returns to the notebook. Unknown supplies do not expose their description or stats. Focus stays in the notebook while open; Escape or the close/resume controls return to play.

Dedicated trap buttons sit above the portrait card row, beneath A/B, and between the ability row and B on landscape. A reserved layout area prevents overlap with the D-pad, facing toggle, A/B, shooting, abilities, notebook/transform buttons and cards. The portrait controller is 320px high, with explicit control positions; the playfield adapts to the remaining space. Buttons show the trap pouch count and disable during unavailable/modal states or when the pouch is empty/full as appropriate.

Collection still targets a visible trap ahead. Deployment targets an unoccupied floor ahead; it cannot overwrite stairs, NPC events, enemies, floor items or an existing trap. Successful collection/deployment each use one turn, including the existing automatic exit from facing-only mode. The mutation latch prevents duplicate taps. The notebook has no trap collection/deployment or wall-digging commands. Pickaxes continue to work through A against a wall while carried, as before.

## Validation

`node scripts/test-dungeons-notebook-browser.mjs` runs both actual games at 320×568, 390×844, 844×390 and 1280×800. It checks all categories, selection/details, modal bounds, Escape dismissal, ending replay return, trap-button intersections with the other controls and one-turn collection/redeployment. Screenshots are written to `tmp/dungeons-notebook/` and reviewed for phone and desktop layouts. English UI/runtime audits, TypeScript, Web build and server build are also required.

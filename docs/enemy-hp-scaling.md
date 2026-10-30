# Main-game enemy HP and poison scaling

The strongest-card estimate now includes direct damage plus poison applied by that
card, accounting for repeated plays and the existing magic transformation multiplier.
Poison contributes its first end-of-turn tick (the applied stack), not the sum of
all future ticks. Poison-only offensive skill cards participate in the maximum.
Self-targeted cards remain excluded. Existing variable-damage estimates are preserved.

Normal and elite encounters add 1.2 times this estimate to their base HP before
co-op/difficulty multipliers and existing multi-enemy HP variation. This applies in
both standard and endless modes; it replaces the previous endless-only 1.5 bonus
for normal enemies rather than stacking both bonuses. Bosses retain their existing
HP coefficients and now use the poison-aware estimate, including endless boss debug
encounters. The special Azuki boss retains its intentionally block-based formula.

Regression check: `node scripts/test-enemy-hp-scaling.mjs`.

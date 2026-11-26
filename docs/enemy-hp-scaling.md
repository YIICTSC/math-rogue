# Main-game enemy HP and poison scaling

The strongest-card estimate now includes direct damage plus poison applied by that
card, accounting for repeated plays and the existing magic transformation multiplier.
Poison contributes its first end-of-turn tick (the applied stack), not the sum of
all future ticks. Poison-only offensive skill cards participate in the maximum.
Self-targeted cards remain excluded. Existing variable-damage estimates are preserved.

Elite encounters add 1.2 times this estimate to their base HP in standard and endless
modes. Endless regular encounters also add 1.2 times the estimate; standard-mode
regular encounters retain their original base HP without a card-damage bonus. This
restores their pre-2026-10-30 behavior. Endless regular encounters use 1.2x instead of
the previous 1.5x bonus. These adjustments are applied before co-op/difficulty
multipliers and existing multi-enemy HP variation. Bosses retain their existing HP
coefficients and use the poison-aware estimate, including endless boss debug
encounters. The special Azuki boss retains its intentionally block-based formula.

Regression check: `node scripts/test-enemy-hp-scaling.mjs`.

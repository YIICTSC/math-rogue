# Omega Balancer Z Archive

This directory preserves the removed Omega Balancer Z prototype for later reuse.

Archived files:

- `src/components/OmegaBalancerZ.tsx`
- `src/data/omegaBalancerData.ts`
- `src/services/omegaBalancerPhysics.ts`

To restore it later, move these files back to the matching `src` paths and reconnect the following areas:

- `src/components/MiniGameRouter.tsx`: import and register `OmegaBalancerZ`.
- `src/miniGameConfig.ts`: add the `OMEGA_BALANCER` mini-game entry.
- `src/types.ts`: restore `GameScreen.MINI_GAME_OMEGA_BALANCER`; restore `NodeType.SEESAW` only if map integration is needed.
- `src/services/mapGenerator.ts`: restore SEESAW node generation only if map integration is needed.
- `src/components/MapScreen.tsx`: restore the SEESAW icon only if map integration is needed.
- `src/App.tsx`: restore trial routing and map-node reward handling only if needed.

Archived on request after the prototype reached a playable-but-not-final state.

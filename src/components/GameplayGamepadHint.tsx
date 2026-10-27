import React from 'react';
import type { GameplayMode } from '../hooks/useGameplayGamepad';
const hints: Record<GameplayMode, string> = {
  basketball: 'A: Shoot · B: Steal · X: Dash · Y: Pass · Menu: Menu',
  dodgeball: 'A: Throw · B: Catch · X: Dodge · Y: Pass · RB: Super',
 tennis: 'LS / D-pad: Move · A: Topspin · B: Slice · X: Lob · Y: Drop · LB: Dash · RB: Star shot · Menu: Menu',
  'star-tide': 'LS / D-pad: Move · A: Sword / Interact · B: Tool · X: Dodge · Y: Glide · Menu: Journal',
  rpg: 'LS / D-pad: Move · RS: Look · A: Interact · X: Jump · Y: Map · B / Menu: Menu · LB / RB: Turn · LT / RT: Build',
  'rpg-home': 'LS / D-pad: Move / Place · A: Select / Place · B: Menu / Cancel · LB / RB: Rotate · Y: Flip · Menu: Menu',
  vr: 'LS / D-pad: Move · RS: Look · A: Collect (hold) · X: Hold (hold) · RT: Attack · B: Crouch · LB: Decoy · RB: Item · Y: Camera · Menu: Pause',
  'vr-online': 'LS / D-pad: Move · RS: Look · A: Collect (hold) · X: Hold (hold) · RT: Attack · LT: Reload · B: Crouch · LB: Decoy · RB: Item · LS: Supply · Y: Camera · Menu: Pause',
  'vr-bomb': 'LS / D-pad: Move · A: Bomb · X: Detonate · Y: Map · B: Supply · Menu: Pause',
  race: 'LS / D-pad: Steer · LT: Brake · A / RT: Drift · B / X: Item · Menu: Menu',
  golf: 'LS / D-pad: Aim / Spin · LB / RB: Club · A: Shot / Power / Impact · B: Cancel · X: Scores · Y: Course · Menu: Menu',
};
export default function GameplayGamepadHint({mode}:{mode:GameplayMode}) {
  return <small className="xbox-gameplay-hint" aria-label="Xbox controls">Xbox · {hints[mode]}</small>;
}

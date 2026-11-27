import { ReactionPortrait, type Reaction } from '../../components/dialogue/ConversationStage';
import { DIALOGUE_PORTRAITS } from '../../data/dialoguePortraits.generated';
import { Portrait as LanternPortrait } from '../lantern-war/art';

export default function TravelerPortrait({ id, name, reaction = 'neutral' }: { id: string; name: string; reaction?: Reaction }) {
  return DIALOGUE_PORTRAITS[id]
    ? <ReactionPortrait actor={{ id, name, reaction }} />
    : <LanternPortrait id={id} reaction={reaction} />;
}

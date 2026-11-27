import { chronicleVoicePath } from '../../components/school-dungeon/chronicles/voices';
import { dungeons1BattleVoice, dungeons2BattleVoice } from '../../components/school-dungeon/student/battleVoicePolicy';
import { audioService } from '../../services/audioService';
import { battleVoiceClip } from '../lantern-war/battleVoiceClips';
import { HEROES } from './catalog';

type Action = 'attack' | 'skill' | 'ultimate' | 'damage' | 'heal' | 'win' | 'defeat';

export function resolveBattleVoice(id: string, action: Action, random = Math.random) {
  const hero = HEROES[id];
  if (!hero) return;
  if (id.startsWith('dungeons2-')) {
    return dungeons2BattleVoice(id, action === 'skill' ? 'attack' : action, action === 'win', random, hero.limit.name[1]);
  }
  if (hero.origin === 'guest') {
    const clip = battleVoiceClip(id, action === 'skill' ? 'support' : action);
    if (clip) return { theme: 'lantern' as const, id: clip.id };
    return;
  }
  const main = dungeons1BattleVoice(id, action, action === 'win', random);
  if (main) return main;
  const file = action === 'skill' ? 'use' : action;
  if (chronicleVoicePath(id, file)) return { theme: 'chronicle' as const, id, file };
}

export function playTravelerBattleVoice(id: string, action: Action) {
  if (!audioService.canPlayConversationVoice()) return;
  const voice = resolveBattleVoice(id, action);
  switch (voice?.theme) {
    case 'dungeons2': return audioService.playDungeons2VoiceFile(voice.id, voice.file);
    case 'high-school': return audioService.playHighSchoolVoiceFile(voice.id, voice.file);
    case 'magic': return audioService.playMagicVoiceFile(voice.id, voice.file);
    case 'lantern': return audioService.playLanternWarVoiceFile(voice.id, true);
    case 'chronicle': return audioService.playDungeonChronicleVoiceFile(voice.id, voice.file);
  }
}

import {
  studentVoice,
  type StudentAudioAction,
} from "../../components/school-dungeon/student/audio";
import type { audioService } from "../../services/audioService";
type VoicePort = Pick<
  typeof audioService,
  | "canPlayConversationVoice"
  | "playHighSchoolVoiceFile"
  | "playMagicVoiceFile"
  | "stopSchoolHeroVoices"
>;
export type SurvivorVoiceAction =
  | "attack"
  | "damage"
  | "heal"
  | "burst"
  | "win"
  | "defeat";
/** Shares Dungeons' hero/variant mapping without duplicating its combat sound effects. */
export function createSurvivorVoices(
  audio: VoicePort,
  now = () => performance.now(),
  random = () => Math.random(),
) {
  let heroId = "",
    nextVoice = -Infinity,
    pending = false,
    generation = 0;
  const stop = () => {
    generation++;
    pending = false;
    audio.stopSchoolHeroVoices();
  };
  return {
    stop,
    reset(hero: string) {
      stop();
      heroId = hero;
      nextVoice = -Infinity;
    },
    play(action: SurvivorVoiceAction) {
      if (
        !audio.canPlayConversationVoice() ||
        (!heroId.startsWith("high-school-") && !heroId.startsWith("magic-"))
      )
        return;
      const priority =
          action === "burst" || action === "win" || action === "defeat",
        time = now();
      if (!priority && (pending || time < nextVoice || random() >= 0.25))
        return;
      const voice = studentVoice(
        heroId,
        (action === "burst" ? "ultimate" : action) as StudentAudioAction,
        false,
        random,
      );
      if (!voice || voice.theme === "dungeons2") return;
      if (priority) stop();
      const token = ++generation;
      pending = true;
      nextVoice = time + 4000;
      try {
        const result =
          voice.theme === "high-school"
            ? audio.playHighSchoolVoiceFile(voice.id, voice.file)
            : audio.playMagicVoiceFile(voice.id, voice.file);
        void Promise.resolve(result)
          .catch(() => false)
          .finally(() => {
            if (generation === token) pending = false;
          });
      } catch {
        if (generation === token) pending = false;
      }
    },
  };
}

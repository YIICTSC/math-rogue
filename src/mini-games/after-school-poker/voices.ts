import { POKER_RIVAL_VOICE_SECONDS } from "../../data/pokerRivalVoiceDurations";
import {
  studentVoice,
  type StudentAudioAction,
} from "../../components/school-dungeon/student/audio";
import { audioService } from "../../services/audioService";

export function createPokerVoices() {
  let hero = "",
    generation = 0;
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const stop = () => {
    generation++;
    timers.forEach(clearTimeout);
    timers.clear();
    audioService.stopSchoolHeroVoices();
    audioService.stopPokerRivalVoices();
  };
  const playHero = (action: StudentAudioAction) => {
    if (!audioService.canPlayConversationVoice()) return;
    const voice = studentVoice(hero, action, action === "win", Math.random);
    if (!voice || voice.theme === "dungeons2") return;
    audioService.stopSchoolHeroVoices();
    audioService.stopPokerRivalVoices();
    void (voice.theme === "high-school"
      ? audioService.playHighSchoolVoiceFile(voice.id, voice.file)
      : audioService.playMagicVoiceFile(voice.id, voice.file));
  };
  return {
    stop,
    reset(id: string) {
      stop();
      hero = id;
    },
    hero: playHero,
    rival(
      id: string | undefined,
      event: "spawn" | "damage" | "win" | "defeat",
    ) {
      if (event === "spawn") stop();
      if (id && audioService.canPlayConversationVoice())
        void audioService.playPokerRivalVoice(id, event);
    },
    result(id: string | undefined, won: boolean) {
      stop();
      if (id && audioService.canPlayConversationVoice())
        void audioService.playPokerRivalVoice(id, won ? "defeat" : "win");
      const token = generation;
      const timer = setTimeout(
        () => {
          timers.delete(timer);
          if (generation === token) playHero(won ? "win" : "defeat");
        },
        ((id && POKER_RIVAL_VOICE_SECONDS[`${id}/${won ? "defeat" : "win"}`]) ||
          4) *
          1000 +
          100,
      );
      timers.add(timer);
    },
  };
}

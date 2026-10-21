import React from "react";
import { createRoot } from "react-dom/client";
import PokerGameScreen from "../../src/components/PokerGameScreen";
import { audioService } from "../../src/services/audioService";
import { useXboxControllerNavigation } from "../../src/hooks/useXboxControllerNavigation";
import "../../src/styles.css";
const params = new URLSearchParams(location.search);
(window as any).__pokerAudio = [];
for (const name of [
  "playHighSchoolVoiceFile",
  "playMagicVoiceFile",
  "playPokerRivalVoice",
] as const) {
  (audioService as any)[name] = (...args: unknown[]) => {
    (window as any).__pokerAudio.push([name, ...args]);
    return Promise.resolve(true);
  };
}
audioService.canPlayConversationVoice = () => true;
function Harness() {
  useXboxControllerNavigation();
  return (
    <PokerGameScreen
      languageMode={
        params.get("lang") === "en"
          ? "ENGLISH"
          : params.get("lang") === "hi"
            ? "HIRAGANA"
            : "JAPANESE"
      }
      onBack={() => {
        document.getElementById("root")!.dataset.exited = "true";
      }}
    />
  );
}
createRoot(document.getElementById("root")!).render(<Harness />);

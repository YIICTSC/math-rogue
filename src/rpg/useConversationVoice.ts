import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { World } from './engine';
import { socialLineText, type SocialLine } from './social';
import { DEFAULT_CONVERSATION_VOICE } from './conversationVoice';
import { speakConversation, stopConversationSpeech } from './conversationSpeech';
export default function useConversationVoice(world: World | null, selfId: string, enabled: boolean, language: string) {
  const latest = useRef(world); latest.current = world;
  const allowed = useRef(enabled); allowed.current = enabled;
  const seen = useRef(new Set<string>()), room = useRef(''), generation = useRef(0), unlocked = useRef(false);
  const [line, setLine] = useState<SocialLine>();
  useEffect(() => {
    const unlock = () => {
      if (unlocked.current || !allowed.current || document.hidden) return;
      unlocked.current = true;
      // iOS requires the first speech request to originate from a user gesture.
      if ('speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined') {
        const prime = new SpeechSynthesisUtterance(' '); prime.volume = 0; window.speechSynthesis.speak(prime);
      }
    };
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock);
    return () => { window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock); };
  }, []);
  const talks = world?.social?.talks;
  useEffect(() => {
    if (room.current !== selfId) { room.current = selfId; seen.current = new Set((talks || []).map(t => t.id)); generation.current++; stopConversationSpeech(); setLine(undefined); }
    const pending = (talks || []).filter(t => t.people.includes(selfId) && !seen.current.has(t.id));
    for (const talk of talks || []) seen.current.add(talk.id);
    // Keep a bounded deduplication window, including server history on reconnect.
    seen.current = new Set((talks || []).map(t => t.id));
    const talk = pending.at(-1);
    if (!enabled || !unlocked.current || !talk || Date.now() - talk.at > 5000 || Date.now() < talk.at - 1000) return;
    const token = ++generation.current;
    stopConversationSpeech();
    void (async () => {
      for (const item of talk.lines) {
        if (token !== generation.current) return;
        setLine(item);
        const speaker = latest.current?.players[item.speaker];
        const config = speaker?.memory?.conversationVoice || DEFAULT_CONVERSATION_VOICE;
        if (speaker && config.enabled) {
          const completed = await speakConversation(socialLineText(item, language), config, language);
          if (!completed) { if (token === generation.current) setLine(undefined); return; }
        } else await new Promise(resolve => setTimeout(resolve, 1600));
        if (token !== generation.current) return;
      }
      setLine(undefined);
    })();
  }, [talks, selfId, enabled, language]);
  useLayoutEffect(() => {
    generation.current++; stopConversationSpeech(); setLine(undefined);
    return () => { generation.current++; stopConversationSpeech(); };
  }, [enabled, language]);
  useEffect(() => {
    const hide = () => { if (document.hidden) { generation.current++; stopConversationSpeech(); setLine(undefined); } };
    document.addEventListener('visibilitychange', hide);
    return () => { document.removeEventListener('visibilitychange', hide); generation.current++; stopConversationSpeech(); };
  }, []);
  return line;
}

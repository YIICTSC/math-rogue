import { useCallback, useEffect, useRef, useState } from 'react';
import type { QuizShowCue } from '../services/audioService';
import type { ShowQuestion, ShowView } from './types';
type AudioService = typeof import('../services/audioService')['audioService'];
export function showMusic(view: ShowView | null): 'menu' | 'math' | 'poker_play' | 'event' | 'victory' {
  if (!view || view.phase === 'lobby' || view.phase === 'ready' || view.phase === 'dawn') return 'menu';
  if (view.phase === 'scoreboard' || view.phase === 'finished') return 'victory';
  if (view.phase === 'night') return 'event';
  if (view.phase === 'open') return 'math';
  return 'poker_play';
}
/** Lazy shared audio keeps name-only invitations independent of the main-game data. */
export default function useQuizAudio(view: ShowView | null, enabled: boolean) {
  const api = useRef<AudioService | null>(null), pending = useRef<Promise<AudioService> | null>(null), live = useRef(false), [epoch, setEpoch] = useState(0), [speaking, setSpeaking] = useState(false);
  const latest = useRef(view), sound = useRef(enabled), music = showMusic(view), track = useRef(music), clockOffset = useRef(0); latest.current = view; sound.current = enabled; track.current = music;
  useEffect(() => { if (view) clockOffset.current = view.serverNow - Date.now(); }, [view?.serverNow]);
  const scope = useRef<ReturnType<AudioService['acquireBgmScene']> | null>(null), speech = useRef<{ utterance: SpeechSynthesisUtterance; release: () => void } | null>(null);
  const stopSpeech = useCallback(() => { const previous = speech.current; speech.current = null; if (previous) { speechSynthesis.cancel(); previous.release(); } if (live.current) setSpeaking(false); }, []);
  const ensure = useCallback(async () => {
    if (api.current) { api.current.init(); return api.current; }
    pending.current ||= import('../services/audioService').then(module => module.audioService);
    const service = await pending.current;
    if (!live.current) return service;
    if (!api.current) { api.current = service; service.init(); setEpoch(e => e + 1); void service.preloadQuizShowSounds(); }
    return service;
  }, []);
  useEffect(() => {
    live.current = true;
    const unlock = () => { if (api.current) api.current.init(); else void ensure(); };
    const hidden = () => { if (document.hidden) stopSpeech(); };
    window.addEventListener('pointerdown', unlock, { capture: true, passive: true }); window.addEventListener('keydown', unlock, true); document.addEventListener('visibilitychange', hidden);
    return () => { live.current = false; window.removeEventListener('pointerdown', unlock, true); window.removeEventListener('keydown', unlock, true); document.removeEventListener('visibilitychange', hidden); stopSpeech(); api.current?.stopQuizShowSounds(); };
  }, [ensure, stopSpeech]);
  useEffect(() => { const service = api.current; if (!service) return; const release = service.acquireBgmScene(track.current, { mode: 'NEW', theme: 'elementary' }, 70); scope.current = release; return () => { if (scope.current === release) scope.current = null; release(); }; }, [epoch]);
  useEffect(() => { scope.current?.update(music, { mode: 'NEW', theme: 'elementary' }); }, [music, epoch]);
  useEffect(() => { if (!enabled) { stopSpeech(); api.current?.stopQuizShowSounds(); return api.current?.acquireBgmSilence(); } }, [enabled, epoch, stopSpeech]);
  const cue = useCallback((name: QuizShowCue) => { if (sound.current && !speech.current && !document.hidden) api.current?.playQuizShowSound(name); }, []);
  const previous = useRef({ key: '', revealed: 0, published: false, buzz: '', own: undefined as boolean | undefined });
  useEffect(() => {
    if (!view) return;
    const r = view.round, key = `${r?.id || 'room'}:${view.phase}`, revealed = r?.tiles.filter(t => t.revealed).length || 0, own = r?.tiles.find(t => t.id === view.self)?.correct, before = previous.current;
    if (before.key !== key) {
      if (view.phase === 'open') cue('question');
      else if (view.phase === 'closed') cue('deadline');
      else if (view.phase === 'scoreboard' || view.phase === 'finished') cue('results');
      else if (view.phase === 'voting') cue('buzzer');
    }
    if (view.phase === 'reveal' && revealed > before.revealed) cue('reveal');
    if (r?.buzzer && r.buzzer !== before.buzz) cue('buzzer');
    if (view.role === 'player' && r?.showJudgments && (!before.published || own !== before.own) && own !== undefined) cue(own ? 'correct' : 'incorrect');
    previous.current = { key, revealed, published: !!r?.showJudgments, buzz: r?.buzzer || '', own };
  }, [view?.revision, cue]);
  const spokeAutomatically = useRef('');
  const speak = useCallback(async (prompt: NonNullable<ShowQuestion['audioPrompt']>) => {
    if (!('speechSynthesis' in window) || !sound.current) return;
    api.current?.init(); const service = await ensure(); if (!live.current || !sound.current) return;
    stopSpeech(); service.stopQuizShowSounds();
    const utterance = new SpeechSynthesisUtterance(prompt.text); utterance.lang = prompt.lang || 'ja-JP'; utterance.rate = .86;
    const release = service.acquireBgmSilence(); speech.current = { utterance, release }; setSpeaking(true);
    const end = () => { release(); if (speech.current?.utterance === utterance) { speech.current = null; if (live.current) setSpeaking(false); } };
    utterance.onend = end; utterance.onerror = end;
    try { speechSynthesis.speak(utterance); } catch { end(); }
  }, [ensure, stopSpeech]);
  useEffect(() => {
    stopSpeech();
    const current = latest.current;
    if (current?.phase !== 'open' || !current.round?.audioPrompt || !api.current || !enabled || spokeAutomatically.current === current.round.id) return;
    const id = current.round.id, prompt = current.round.audioPrompt;
    const timer = setTimeout(() => { if (latest.current?.round?.id === id && latest.current.phase === 'open') { spokeAutomatically.current = id; void speak(prompt); } }, 500);
    return () => clearTimeout(timer);
  }, [view?.round?.id, view?.phase, epoch, enabled, speak, stopSpeech]);
  useEffect(() => {
    let counted = '';
    const timer = setInterval(() => {
      const v = latest.current, r = v?.round;
      if (!r || v?.phase !== 'open' || r.paused) { if (counted) { api.current?.stopQuizShowSound('countdown'); counted = ''; } return; }
      // The host deadline is authoritative; a device clock only drives this local cue.
      const remaining = r.deadline - (Date.now() + clockOffset.current);
      const key = `${r.id}:${r.deadline}:${Math.ceil(remaining / 2000)}`;
      if (counted && counted !== key) { api.current?.stopQuizShowSound('countdown'); counted = ''; }
      if (remaining <= 10000 && remaining > 0 && counted !== key) { counted = key; cue('countdown'); }
    }, 250); return () => clearInterval(timer);
  }, [cue]);
  return { music, speaking, ready: epoch > 0, unlock: () => { void ensure(); }, cue, speak, stopSpeech };
}

import { useCallback, useEffect, useRef, useState } from 'react';
import type { QuizShowCue } from '../services/audioService';
import { useQuestionPronunciation } from '../utils/useQuestionPronunciation';
import type { ShowView } from './types';
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
  const api = useRef<AudioService | null>(null), pending = useRef<Promise<AudioService> | null>(null), live = useRef(false), [epoch, setEpoch] = useState(0);
  const latest = useRef(view), sound = useRef(enabled), music = showMusic(view), track = useRef(music), clockOffset = useRef(0); latest.current = view; sound.current = enabled; track.current = music;
  useEffect(() => { if (view) clockOffset.current = view.serverNow - Date.now(); }, [view?.serverNow]);
  const scope = useRef<ReturnType<AudioService['acquireBgmScene']> | null>(null);
  const audioRound = view && ['open', 'closed', 'reveal', 'voting'].includes(view.phase) ? view.round : undefined;
  const pronunciation = useQuestionPronunciation(api.current, audioRound?.audioPrompt, audioRound?.id, {
    enabled: enabled && !audioRound?.paused,
    autoPlay: view?.phase === 'open',
  });
  const speaking = useRef(false); speaking.current = pronunciation.speaking;
  const stopSpeech = pronunciation.stop;
  useEffect(() => { if (pronunciation.speaking) api.current?.stopQuizShowSounds(); }, [pronunciation.speaking]);
  const ensure = useCallback(async () => {
    if (api.current) { api.current.init(); return api.current; }
    pending.current ||= import('../services/audioService').then(module => module.audioService);
    const service = await pending.current;
    if (!live.current) return service;
    if (!api.current) { api.current = service; service.init(); setEpoch(e => e + 1); void service.preloadQuizShowSounds(); }
    return service;
  }, []);
  useEffect(() => { if (audioRound?.audioPrompt && enabled && !api.current) void ensure(); }, [audioRound?.audioPrompt?.text, enabled, ensure]);
  useEffect(() => {
    live.current = true;
    const unlock = () => { if (api.current) api.current.init(); else void ensure(); };
    window.addEventListener('pointerdown', unlock, { capture: true, passive: true }); window.addEventListener('keydown', unlock, true);
    return () => { live.current = false; window.removeEventListener('pointerdown', unlock, true); window.removeEventListener('keydown', unlock, true); api.current?.stopQuizShowSounds(); };
  }, [ensure]);
  useEffect(() => { const service = api.current; if (!service) return; const release = service.acquireBgmScene(track.current, { mode: 'NEW', theme: 'elementary' }, 70); scope.current = release; return () => { if (scope.current === release) scope.current = null; release(); }; }, [epoch]);
  useEffect(() => { scope.current?.update(music, { mode: 'NEW', theme: 'elementary' }); }, [music, epoch]);
  useEffect(() => { if (!enabled) { stopSpeech(); api.current?.stopQuizShowSounds(); return api.current?.acquireBgmSilence(); } }, [enabled, epoch, stopSpeech]);
  const cue = useCallback((name: QuizShowCue) => { if (sound.current && !speaking.current && !document.hidden) api.current?.playQuizShowSound(name); }, []);
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
  return { music, speaking: pronunciation.speaking, speechStatus: pronunciation.status, ready: epoch > 0, unlock: () => { void ensure(); }, cue, speak: () => pronunciation.play(), stopSpeech };
}

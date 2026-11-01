// WKWebView can leave synthesized audio interrupted even while native BGM plays.
// Keep each game's nodes private, but recover every live context on a real gesture.
const contexts = new Set<AudioContext>();
let listening = false;
const hidden = () => typeof document !== 'undefined' && document.hidden;
export function prepareWebAudioSession() {
  if (typeof navigator === 'undefined') return;
  try {
    const session = (navigator as Navigator & {audioSession?: {type: string}}).audioSession;
    if (session && session.type !== 'playback') session.type = 'playback';
  } catch { /* Older WebKit does not expose the Audio Session API. */ }
}
export async function resumeGameAudio(context: AudioContext): Promise<boolean> {
  prepareWebAudioSession();
  if (context.state === 'closed' || hidden()) return false;
  // Start a silent buffer synchronously in the gesture, before the first await.
  // Older iOS releases require this in addition to resume().
  if (context.state !== 'running') {
    try {
      const prime = context.createBufferSource();
      prime.buffer = context.createBuffer(1, 1, context.sampleRate);
      prime.connect(context.destination); prime.onended = () => prime.disconnect(); prime.start();
    } catch {}
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    if (context.state === 'running') return true;
    if ((context.state as string) === 'closed' || hidden()) return false;
    await Promise.race([context.resume().catch(() => undefined), new Promise<void>(resolve => setTimeout(resolve, 250))]);
    if ((context.state as string) === 'running') return true;
    if (attempt < 2) await new Promise<void>(resolve => setTimeout(resolve, 100));
  }
  return (context.state as string) === 'running';
}
const wake = () => { if (!hidden()) for (const context of contexts) void resumeGameAudio(context); };
export function registerGameAudio(context: AudioContext) {
  if (typeof window === 'undefined' || !window.addEventListener || typeof document === 'undefined') return () => {};
  contexts.add(context);
  if (!listening) {
    listening = true;
    window.addEventListener('pointerdown', wake, {capture: true, passive: true});
    window.addEventListener('touchend', wake, {capture: true, passive: true});
    window.addEventListener('keydown', wake, true);
    window.addEventListener('focus', wake);
    window.addEventListener('pageshow', wake);
    document.addEventListener('visibilitychange', wake);
  }
  return () => {
    contexts.delete(context);
    if (contexts.size || !listening) return;
    listening = false;
    window.removeEventListener('pointerdown', wake, true);
    window.removeEventListener('touchend', wake, true);
    window.removeEventListener('keydown', wake, true);
    window.removeEventListener('focus', wake); window.removeEventListener('pageshow', wake);
    document.removeEventListener('visibilitychange', wake);
  };
}

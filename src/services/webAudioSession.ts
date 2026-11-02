// WKWebView can leave synthesized audio interrupted even while native BGM plays.
// Keep each game's nodes private, but recover every live context on a real gesture.
const contexts = new Map<AudioContext, () => boolean>();
let listening = false;
const hidden = () => typeof document !== 'undefined' && document.hidden;
export function prepareWebAudioSession() {
  if (typeof navigator === 'undefined') return;
  try {
    const session = (navigator as Navigator & {audioSession?: {type: string}}).audioSession;
    if (session && session.type !== 'playback') session.type = 'playback';
  } catch { /* Older WebKit does not expose the Audio Session API. */ }
}
export async function resumeGameAudio(context: AudioContext, fromGesture = false, canResume = () => true): Promise<boolean> {
  prepareWebAudioSession();
  if (context.state === 'closed' || hidden() || !canResume()) return false;
  // Start a silent buffer synchronously in the gesture, before the first await.
  // Older iOS releases require this in addition to resume().
  // WebKit can report running while its output is still gesture-locked.
  if (fromGesture || context.state !== 'running') {
    try {
      const prime = context.createBufferSource();
      prime.buffer = context.createBuffer(1, 1, context.sampleRate);
      prime.connect(context.destination); prime.onended = () => prime.disconnect(); prime.start();
    } catch {}
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    if (context.state === 'running') return true;
    if ((context.state as string) === 'closed' || hidden() || !canResume()) return false;
    try {
      await Promise.race([context.resume().catch(() => undefined), new Promise<void>(resolve => setTimeout(resolve, 250))]);
    } catch { return false; }
    if ((context.state as string) === 'running') return true;
    if (attempt < 2) await new Promise<void>(resolve => setTimeout(resolve, 100));
  }
  return (context.state as string) === 'running';
}
const gestureEvents = ['pointerdown', 'pointerup', 'touchend', 'keydown', 'click'];
const wake = (event: Event) => {
  if (!hidden()) for (const [context, canResume] of contexts) {
    if (canResume()) void resumeGameAudio(context, gestureEvents.includes(event.type), canResume);
  }
};
export function registerGameAudio(context: AudioContext, canResume = () => true) {
  if (typeof window === 'undefined' || !window.addEventListener || typeof document === 'undefined') return () => {};
  contexts.set(context, canResume);
  if (!listening) {
    listening = true;
    for (const type of gestureEvents) window.addEventListener(type, wake, {capture: true, passive: true});
    window.addEventListener('focus', wake);
    window.addEventListener('pageshow', wake);
    document.addEventListener('visibilitychange', wake);
  }
  return () => {
    contexts.delete(context);
    if (contexts.size || !listening) return;
    listening = false;
    for (const type of gestureEvents) window.removeEventListener(type, wake, true);
    window.removeEventListener('focus', wake); window.removeEventListener('pageshow', wake);
    document.removeEventListener('visibilitychange', wake);
  };
}

/** Keep a first action during resume, but never replay stale actions in a burst. */
export function runWhenGameAudioReady(context: AudioContext, play: () => void, canPlay = () => true) {
  if (hidden() || !canPlay() || context.state === 'closed') return;
  if (context.state === 'running') { play(); return; }
  const requestedAt = performance.now();
  void resumeGameAudio(context, false, canPlay).then(ready => {
    if (ready && !hidden() && canPlay() && performance.now() - requestedAt < 1000) play();
  });
}

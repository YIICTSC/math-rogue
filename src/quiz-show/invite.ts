import type { LanguageMode } from '../types';

export type RoomAddress = { transport: 'host' | 'server'; code: string };
export function parseAddress(value: string | null, transport: RoomAddress['transport'] = 'host'): RoomAddress | null {
  const digits = /^(\d{6})$/.exec((value || '').trim());
  if (digits) return {transport, code: digits[1]};
  const match = /^(H|S)-(\d{6})$/.exec((value || '').trim().toUpperCase());
  return match ? { transport: match[1] === 'H' ? 'host' : 'server', code: match[2] } : null;
}
export function addressText(address: RoomAddress) { return address.code; }
export function invitation(address: RoomAddress, language: LanguageMode, screen = false) {
  const native = typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.() === true;
  const current = new URL(location.href), configured = import.meta.env.VITE_QUIZ_SHOW_PUBLIC_URL;
  const base = configured || (/^https?:$/.test(current.protocol) && !native ? current.href : 'https://yiictsc.github.io/math-rogue/');
  const url = new URL(base); url.search = ''; url.hash = '';
  url.searchParams.set('quizShow', addressText(address)); url.searchParams.set('quizTransport', address.transport); url.searchParams.set('quizLang', language);
  if (screen) url.searchParams.set('quizScreen', '1');
  return url.href;
}
export function invitationFromLocation() {
  const p = new URLSearchParams(location.search), address = parseAddress(p.get('quizShow'), p.get('quizTransport') === 'server' ? 'server' : 'host');
  if (!address) return null;
  const language: LanguageMode = p.get('quizLang') === 'ENGLISH' ? 'ENGLISH' : p.get('quizLang') === 'HIRAGANA' ? 'HIRAGANA' : 'JAPANESE';
  return { address, language, screen: p.get('quizScreen') === '1', host: p.get('quizHost') === '1' };
}
export function markHost(address: RoomAddress, language: LanguageMode) {
  const url = new URL(location.href); url.search = ''; url.hash = ''; url.searchParams.set('quizShow', addressText(address)); url.searchParams.set('quizTransport', address.transport); url.searchParams.set('quizLang', language); url.searchParams.set('quizHost', '1'); history.replaceState(null, '', url);
}
export function clearQuizLocation() {
  const url = new URL(location.href); for (const k of ['quizShow', 'quizTransport', 'quizLang', 'quizHost', 'quizScreen']) url.searchParams.delete(k);
  history.replaceState(null, '', url);
}

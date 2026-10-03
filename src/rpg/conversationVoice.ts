export interface ConversationVoice {
  enabled: boolean;
  pitch: number;
  rate: number;
  style: 'robot' | 'smooth' | 'bouncy';
  timbre: number;
}
export const DEFAULT_CONVERSATION_VOICE: ConversationVoice = {
  enabled: true, pitch: 1.1, rate: 1, style: 'robot', timbre: 0,
};
export function validConversationVoice(v: unknown): v is ConversationVoice {
  if (!v || typeof v !== 'object') return false;
  const c = v as ConversationVoice;
  return typeof c.enabled === 'boolean' && Number.isFinite(c.pitch) && c.pitch >= .5 && c.pitch <= 2 &&
    Number.isFinite(c.rate) && c.rate >= .6 && c.rate <= 1.6 &&
    ['robot', 'smooth', 'bouncy'].includes(c.style) && Number.isInteger(c.timbre) && c.timbre >= 0 && c.timbre <= 3;
}
export function loadConversationVoice(key: string): ConversationVoice {
  try {
    const bank = JSON.parse(localStorage.getItem('rpg-conversation-voices-v1') || '{}');
    if (validConversationVoice(bank[key])) return { ...bank[key] };
  } catch { /* Storage can be unavailable in private browsing. */ }
  return { ...DEFAULT_CONVERSATION_VOICE };
}
export function saveConversationVoice(key: string, voice: ConversationVoice) {
  if (!validConversationVoice(voice)) return;
  const bank = JSON.parse(localStorage.getItem('rpg-conversation-voices-v1') || '{}');
  localStorage.setItem('rpg-conversation-voices-v1', JSON.stringify({ ...bank, [key]: voice }));
}
/** Pause at phrase boundaries rather than cutting kanji or words in half. */
export function speechParts(text: string, style: ConversationVoice['style']): string[] {
  return style === 'smooth' ? [text] : text.match(/[^。！？!?、,;；]+[。！？!?、,;；]*/gu) || [text];
}

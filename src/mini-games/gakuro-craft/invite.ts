export const CRAFT_ROOM_PARAM = 'craftRoom';
export const normalizeCraftCode = (value: string | null | undefined) => /^[A-Z2-9]{6}$/.test((value || '').trim().toUpperCase()) ? value!.trim().toUpperCase() : '';
export function craftInviteCode(href: string) {
  try { return normalizeCraftCode(new URL(href, 'https://learning-rogue.local').searchParams.get(CRAFT_ROOM_PARAM)); } catch { return ''; }
}
export function craftInviteUrl(href: string, code: string) {
  const url = new URL(href); if (!normalizeCraftCode(code)) return '';
  // An invitation grants access to this room, never to the development menus.
  for (const key of [...url.searchParams.keys()]) url.searchParams.delete(key);
  url.hash = ''; url.searchParams.set(CRAFT_ROOM_PARAM, normalizeCraftCode(code)); return url.toString();
}

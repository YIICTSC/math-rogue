import {normalizeRoomInput} from '../../services/onlineTransport';

export const CARD_CLUB_ROOM_PARAM = 'cardClubRoom';

export function normalizeCardClubCode(value: string): string {
  const code = normalizeRoomInput(value);
  return /^\d{6}$/.test(code) ? code : '';
}

export function cardClubInviteCode(href: string): string {
  try {
    return normalizeCardClubCode(new URL(href, 'https://invite.invalid').searchParams.get(CARD_CLUB_ROOM_PARAM) || '');
  } catch {
    return '';
  }
}

export function cardClubInviteUrl(href: string, value: string, native = false): string {
  const code = normalizeCardClubCode(value);
  if (!code) return '';
  try {
    const current = new URL(href);
    const url = native || !/^https?:$/.test(current.protocol) ? new URL('https://yiictsc.github.io/math-rogue/') : current;
    url.search = '';
    url.hash = '';
    url.searchParams.set(CARD_CLUB_ROOM_PARAM, code);
    return url.toString();
  } catch {
    return '';
  }
}

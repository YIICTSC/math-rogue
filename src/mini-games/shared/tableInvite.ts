import { normalizeRoomInput } from '../../services/onlineTransport';

export function tableRoomCode(value: string) {
  const code = normalizeRoomInput(value);
  return /^\d{6}$/.test(code) ? code : '';
}

export function tableInviteCode(href: string, param: string) {
  try {
    return tableRoomCode(new URL(href, 'https://invite.invalid').searchParams.get(param) ?? '');
  } catch {
    return '';
  }
}

export function tableInviteUrl(href: string, value: string, param: string, native: boolean) {
  const code = tableRoomCode(value);
  if (!code) return '';
  try {
    const current = new URL(href);
    const url =
      native || !/^https?:$/.test(current.protocol)
        ? new URL('https://yiictsc.github.io/math-rogue/')
        : current;
    url.search = '';
    url.hash = '';
    url.searchParams.set(param, code);
    return url.toString();
  } catch {
    return '';
  }
}

export const KART_ROOM_PARAM = 'kartRoom';
export function normalizeKartCode(value: string): string { const code = value.trim().toUpperCase(); return /^(?:[HS]-)?[A-Z2-9]{6}$/.test(code) ? code : ''; }
export function kartInviteCode(href: string): string { try { return normalizeKartCode(new URL(href, 'https://invite.invalid').searchParams.get(KART_ROOM_PARAM) || ''); } catch { return ''; } }
export function kartInviteUrl(href: string, value: string): string { const code = normalizeKartCode(value); if (!code) return ''; const url = new URL(href); url.search = ''; url.hash = ''; url.searchParams.set(KART_ROOM_PARAM, code); return url.toString(); }

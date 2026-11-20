import { tableInviteCode, tableInviteUrl, tableRoomCode } from '../shared/tableInvite';

export const CARD_CLUB_ROOM_PARAM = 'cardClubRoom';
export const normalizeCardClubCode = tableRoomCode;
export const cardClubInviteCode = (href: string) => tableInviteCode(href, CARD_CLUB_ROOM_PARAM);
export const cardClubInviteUrl = (href: string, value: string, native = false) =>
  tableInviteUrl(href, value, CARD_CLUB_ROOM_PARAM, native);

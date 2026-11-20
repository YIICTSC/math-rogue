import { tableInviteCode } from '../shared/tableInvite';

export const TRADITIONAL_ROOM_PARAM = 'traditionalRoom';
export const traditionalInviteCode = (href: string) =>
  tableInviteCode(href, TRADITIONAL_ROOM_PARAM);

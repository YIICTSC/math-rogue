export const RPG_ROOM_QUERY_PARAM = "rpgRoom";
export const RPG_ROOM_CODE_PATTERN = /^[A-Z2-9]{6}$/;

export function normalizeRpgRoomCode(value: string | null | undefined) {
  const code = (value || "").trim().toUpperCase();
  return RPG_ROOM_CODE_PATTERN.test(code) ? code : "";
}

export function getRpgRoomCodeFromUrl(href: string) {
  try {
    return normalizeRpgRoomCode(
      new URL(href, "http://learning-rogue.local").searchParams.get(
        RPG_ROOM_QUERY_PARAM,
      ),
    );
  } catch {
    return "";
  }
}

export function buildRpgInviteUrl(href: string, roomCode: string) {
  const code = normalizeRpgRoomCode(roomCode);
  if (!code) return href;
  try {
    const url = new URL(href, "http://learning-rogue.local");
    url.searchParams.set(RPG_ROOM_QUERY_PARAM, code);
    return /^https?:/i.test(href)
      ? url.toString()
      : `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return href;
  }
}

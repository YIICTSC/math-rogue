const claimedUnitBoardIds = new Set<string>();

const getSeenKey = (unitId: string) => `unit-board-seen:${unitId}`;

export const claimUnitBoardFirstDisplay = (unitId: string): boolean => {
  if (claimedUnitBoardIds.has(unitId)) return false;
  claimedUnitBoardIds.add(unitId);

  try {
    const seenKey = getSeenKey(unitId);
    if (window.localStorage.getItem(seenKey) === '1') return false;
    window.localStorage.setItem(seenKey, '1');
  } catch {
    // The in-memory claim still prevents repeated display during this session.
  }

  return true;
};

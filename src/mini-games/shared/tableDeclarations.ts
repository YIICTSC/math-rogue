import type lines from '../../data/tableDeclarationLines.json';

type GeneratedLine = keyof typeof lines;
export type DeclarationLine =
  | GeneratedLine
  | 'domino'
  | 'bomb'
  | 'five-shi'
  | 'twenty';

export type TableDeclaration = {
  revision: number;
  seat: number;
  lines: DeclarationLine[];
};

type DeclarationHistory = { revision: number; declarations?: TableDeclaration[] };

// The host adds only public declarations after the action has passed rule validation.
export function declare(
  table: DeclarationHistory,
  seat: number,
  ...spoken: DeclarationLine[]
) {
  if (!spoken.length) return;
  table.declarations = [
    ...(table.declarations ?? []).slice(-15),
    { revision: table.revision, seat, lines: spoken },
  ];
}

export function declarationsSince(
  table: DeclarationHistory,
  previousRevision: number,
): TableDeclaration[] {
  return (table.declarations ?? []).filter(
    (declaration) =>
      declaration.revision > previousRevision && declaration.revision <= table.revision,
  );
}

const numbers = {
  0: 'n0', 1: 'n1', 2: 'n2', 3: 'n3', 4: 'n4', 5: 'n5', 6: 'n6', 7: 'n7',
  8: 'n8', 9: 'n9', 10: 'n10',
  20: 'n20', 30: 'n30', 40: 'n40', 50: 'n50', 60: 'n60', 70: 'n70',
  80: 'n80', 90: 'n90', 100: 'n100',
} as const satisfies Record<number, GeneratedLine>;

export function spokenNumber(value: number | undefined): DeclarationLine[] {
  if (value === undefined || !Number.isInteger(value) || value < 0 || value >= 300) return [];
  const whole = numbers[value as keyof typeof numbers];
  if (whole) return [whole];
  if (value > 100) {
    const hundreds = Math.floor(value / 100);
    const remaining = value % 100;
    return [
      ...(hundreds === 1 ? [] : spokenNumber(hundreds)),
      'n100',
      ...(remaining === 0 ? [] : spokenNumber(remaining)),
    ];
  }
  const units = value % 10;
  return [numbers[(value - units) as keyof typeof numbers], numbers[units as keyof typeof numbers]];
}

const suits = ['club', 'diamond', 'heart', 'spade'] as const;

export function spokenSuit(value: number | undefined): DeclarationLine[] {
  const line = value === undefined ? undefined : suits[value];
  return line ? [line] : [];
}

export function spokenRank(value: number): DeclarationLine[] {
  if (value === 1) return ['ace'];
  if (value === 11) return ['jack'];
  if (value === 12) return ['queen'];
  if (value === 13) return ['rank-king'];
  return spokenNumber(value);
}

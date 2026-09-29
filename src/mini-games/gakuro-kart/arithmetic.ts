import { GameMode, type AssignmentRangeFilter } from '../../types';
export function arithmeticPool(safeMode: GameMode, rangeFilter: AssignmentRangeFilter | null) {
const generatedProblems: { question: string; options: number[]; answer: number; problemKey?: string }[] = [];
const candidateCount = 96;
    for (let i = 0; i < candidateCount; i++) {
      let a, b, answer, operator;
      let type = safeMode;

      if (safeMode === GameMode.MIXED) {
          const types = [GameMode.ADDITION, GameMode.SUBTRACTION, GameMode.MULTIPLICATION, GameMode.DIVISION];
          type = types[Math.floor(Math.random() * types.length)];
      }

      switch (type) {
          case GameMode.ADD_1DIGIT:
              // 繰り上がりなし: a + b <= 9
              a = Math.floor(Math.random() * 8) + 1; // 1~8
              b = Math.floor(Math.random() * (9 - a)) + 1; // 1~(9-a)
              answer = a + b;
              operator = '+';
              break;
          case GameMode.ADD_1DIGIT_CARRY:
              // くりあがりあり: a + b >= 10
              a = Math.floor(Math.random() * 9) + 1;
              // bは 10-a 以上の数
              b = Math.floor(Math.random() * (9 - (10 - a) + 1)) + (10 - a);
              if (b < 1) b = 1; // セーフティ
              answer = a + b;
              operator = '+';
              break;
          case GameMode.SUB_1DIGIT:
              // くりさがりなし: 1ケタ同士で a >= b
              a = Math.floor(Math.random() * 9) + 1; // 1~9
              b = Math.floor(Math.random() * a) + 1; // 1~a
              answer = a - b;
              operator = '-';
              break;
          case GameMode.SUB_1DIGIT_BORROW:
              // くりさがりあり: 11-18 の数から 1-9 を引き、答えが1ケタ
              answer = Math.floor(Math.random() * 9) + 1; // 答えも1ケタ
              b = Math.floor(Math.random() * 9) + 1;
              a = answer + b;
              // 繰り下がりの定義として a が 10以上である必要がある
              if (a < 10) {
                // 再生成の代わりに補正
                a += 10;
                answer = a - b;
              }
              operator = '-';
              break;
          case GameMode.ADDITION:
              if (rangeFilter?.kind === 'addition_subtraction' && rangeFilter.values.includes('within_10')) { a = Math.floor(Math.random() * 9) + 1; b = Math.floor(Math.random() * (10 - a)) + 1; }
              else if (rangeFilter?.kind === 'addition_subtraction' && rangeFilter.values.includes('within_20')) { a = Math.floor(Math.random() * 10) + 1; b = Math.floor(Math.random() * (20 - a)) + 1; }
              else { a = Math.floor(Math.random() * 40) + 10; b = Math.floor(Math.random() * 40) + 10; }
              answer = a + b;
              operator = '+';
              break;
          case GameMode.SUBTRACTION:
              if (rangeFilter?.kind === 'addition_subtraction' && rangeFilter.values.includes('within_10')) { a = Math.floor(Math.random() * 9) + 1; b = Math.floor(Math.random() * a) + 1; }
              else if (rangeFilter?.kind === 'addition_subtraction' && rangeFilter.values.includes('within_20')) { a = Math.floor(Math.random() * 19) + 1; b = Math.floor(Math.random() * a) + 1; }
              else { a = Math.floor(Math.random() * 50) + 20; b = Math.floor(Math.random() * (a - 10)) + 5; }
              answer = a - b;
              operator = '-';
              break;
          case GameMode.DIVISION:
              b = rangeFilter?.kind === 'division' && rangeFilter.values.includes('divisor_2_5') ? Math.floor(Math.random() * 4) + 2
                : rangeFilter?.kind === 'division' && rangeFilter.values.includes('divisor_6_9') ? Math.floor(Math.random() * 4) + 6
                : Math.floor(Math.random() * 8) + 2;
              answer = Math.floor(Math.random() * 9) + 1;
              a = b * answer;
              if (rangeFilter?.kind === 'division' && rangeFilter.values.includes('remainder_with')) { const remainder = Math.floor(Math.random() * (b - 1)) + 1; a += remainder; answer = Math.floor(a / b); }
              operator = '÷';
              break;
          case GameMode.MULTIPLICATION:
          default:
              if (rangeFilter?.kind === 'multiplication_table') {
                const tables = rangeFilter.values.map(Number).filter((value) => value >= 1 && value <= 9);
                a = tables.length ? tables[Math.floor(Math.random() * tables.length)] : Math.floor(Math.random() * 9) + 1;
              } else a = Math.floor(Math.random() * 9) + 1;
              b = Math.floor(Math.random() * 9) + 1;
              answer = a * b;
              operator = '×';
              break;
      }

      const options = new Set<number>();
      options.add(answer);
      while (options.size < 4) {
        let wrong = answer + (Math.floor(Math.random() * 10) - 5);
        if (wrong < 0) wrong = Math.floor(Math.random() * 20);
        if (wrong !== answer) options.add(wrong);
      }

      generatedProblems.push({
        question: `${a} ${operator} ${b} = ?`,
        options: Array.from(options).sort(() => Math.random() - 0.5),
        answer: answer,
        problemKey: `${type}:${a}${operator}${b}`,
      });
    }
return generatedProblems;
}

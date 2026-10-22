import { countsOf, Meld, nextDora, Shape, shapes, terminal, Tile } from './tiles';
export type WinContext = { tsumo: boolean; winning: number; seat: number; round: number; dealer: boolean; riichi?: number; ippatsu?: boolean; rinshan?: boolean; chankan?: boolean; lastTile?: boolean; heavenly?: boolean; earthly?: boolean; indicators?: number[]; ura?: number[] };
export type Yaku = { name: string; han: number; yakuman?: boolean };
export type HandScore = { yaku: Yaku[]; han: number; fu: number; dora: number; base: number; ron: number; childPay: number; dealerPay: number; total: number; limit: string; shape: Shape };
const up100 = (n: number) => Math.ceil(n / 100) * 100;
export function scoreHand(hand: Tile[], melds: Meld[], ctx: WinContext): HandScore | null {
  const all = [...hand, ...melds.flatMap(m => m.tiles)], c = countsOf(all), closed = !melds.some(m => m.open);
  const suits = new Set(all.filter(t => t.type < 27).map(t => Math.floor(t.type / 9)));
  const hasHonor = all.some(t => t.type >= 27);
  const candidates: HandScore[] = [];
  for (const shape of shapes(hand, melds)) {
    // A ron can complete either the pair or any compatible concealed group.
    const placements = [shape.pair === ctx.winning ? -1 : -2, ...shape.groups.flatMap((g, i) => g.includes(ctx.winning) ? [i] : [])].filter(i => i !== -2);
    for (const placement of shape.special ? [-1] : placements) {
      const yaku: Yaku[] = [], add = (name: string, han: number, yakuman = false) => yaku.push({ name, han, yakuman });
      const groups = [...shape.groups.map((g, i) => ({ tiles: g, open: !ctx.tsumo && i === placement && g[0] === g[1], kan: false })), ...melds.map(m => ({ tiles: m.tiles.map(t => t.type), open: m.open, kan: m.kind === 'kan' }))];
      const triples = groups.filter(g => g.tiles[0] === g.tiles[1]), sequences = groups.filter(g => g.tiles[0] !== g.tiles[1]);
      const valuePair = (t: number) => Number(t >= 31) + Number(t === ctx.seat) + Number(t === ctx.round);
      const winGroup = shape.groups[placement];
      const badWait = placement === -1 || Boolean(winGroup && winGroup[0] !== winGroup[1] && (ctx.winning === winGroup[1] || (winGroup[0] % 9 === 0 && ctx.winning === winGroup[2]) || (winGroup[0] % 9 === 6 && ctx.winning === winGroup[0])));
      const pinfu = closed && sequences.length === 4 && !valuePair(shape.pair) && !badWait;
      if (ctx.tsumo && ctx.heavenly) add('天和', 13, true);
      if (ctx.tsumo && ctx.earthly) add('地和', 13, true);
      if (shape.special === 'orphans') add('国士無双', 13, true);
      if (all.every(t => t.type >= 27)) add('字一色', 13, true);
      if (all.every(t => t.type < 27 && terminal(t.type))) add('清老頭', 13, true);
      if (all.every(t => [19, 20, 21, 23, 25, 32].includes(t.type))) add('緑一色', 13, true);
      if (triples.filter(g => g.tiles[0] >= 31).length === 3) add('大三元', 13, true);
      const winds = triples.filter(g => g.tiles[0] >= 27 && g.tiles[0] <= 30).length;
      if (winds === 4) add('大四喜', 13, true);
      else if (winds === 3 && shape.pair >= 27 && shape.pair <= 30) add('小四喜', 13, true);
      if (triples.length === 4 && triples.every(g => !g.open)) add('四暗刻', 13, true);
      if (groups.filter(g => g.kan).length === 4) add('四槓子', 13, true);
      if (closed && !melds.length && suits.size === 1 && !hasHonor) {
        const start = Math.floor(all[0].type / 9) * 9;
        if ([3, 1, 1, 1, 1, 1, 1, 1, 3].every((n, i) => c[start + i] >= n)) add('九蓮宝燈', 13, true);
      }
      if (ctx.riichi) add(ctx.riichi === 2 ? 'ダブルリーチ' : 'リーチ', ctx.riichi);
      if (ctx.riichi && ctx.ippatsu) add('一発', 1);
      if (closed && ctx.tsumo) add('門前清自摸和', 1);
      if (ctx.rinshan && ctx.tsumo) add('嶺上開花', 1);
      if (ctx.chankan && !ctx.tsumo) add('槍槓', 1);
      if (ctx.lastTile && !ctx.rinshan) add(ctx.tsumo ? '海底摸月' : '河底撈魚', 1);
      if (all.every(t => !terminal(t.type))) add('断么九', 1);
      if (shape.special === 'pairs') add('七対子', 2);
      if (pinfu) add('平和', 1);
      for (const g of triples) {
        const t = g.tiles[0];
        if (t >= 31) add(['役牌・白', '役牌・發', '役牌・中'][t - 31], 1);
        if (t === ctx.seat) add('自風牌', 1);
        if (t === ctx.round) add('場風牌', 1);
      }
      if (suits.size === 1) add(hasHonor ? '混一色' : '清一色', hasHonor ? (closed ? 3 : 2) : (closed ? 6 : 5));
      if (!shape.special) {
        if (triples.length === 4) add('対々和', 2);
        if (triples.filter(g => !g.open).length >= 3) add('三暗刻', 2);
        if (groups.filter(g => g.kan).length >= 3) add('三槓子', 2);
        if (triples.filter(g => g.tiles[0] >= 31).length === 2 && shape.pair >= 31) add('小三元', 2);
        if (closed) {
          const seqCounts = new Map<number, number>(); sequences.forEach(g => seqCounts.set(g.tiles[0], (seqCounts.get(g.tiles[0]) || 0) + 1));
          const pairs = [...seqCounts.values()].reduce((a, n) => a + Math.floor(n / 2), 0);
          if (pairs >= 2) add('二盃口', 3); else if (pairs === 1) add('一盃口', 1);
        }
        const seq = sequences.map(g => g.tiles[0]), trip = triples.map(g => g.tiles[0]);
        if (Array.from({ length: 7 }, (_, n) => n).some(n => [0, 9, 18].every(s => seq.includes(s + n)))) add('三色同順', closed ? 2 : 1);
        if (Array.from({ length: 9 }, (_, n) => n).some(n => [0, 9, 18].every(s => trip.includes(s + n)))) add('三色同刻', 2);
        if ([0, 9, 18].some(s => [0, 3, 6].every(n => seq.includes(s + n)))) add('一気通貫', closed ? 2 : 1);
        if (terminal(shape.pair) && groups.every(g => g.tiles.some(terminal)) && sequences.length) add(hasHonor ? '混全帯么九' : '純全帯么九', hasHonor ? (closed ? 2 : 1) : (closed ? 3 : 2));
      }
      if (all.every(t => terminal(t.type)) && hasHonor && suits.size > 0) add('混老頭', 2);
      const yakuman = yaku.filter(y => y.yakuman);
      const finalYaku = yakuman.length ? yakuman : yaku;
      if (!finalYaku.length) continue; // Dora alone never creates a legal win.
      let fu = 20;
      if (shape.special === 'pairs') fu = 25;
      else if (shape.special) fu = 0;
      else {
        if (closed && !ctx.tsumo) fu += 10;
        if (ctx.tsumo && !pinfu) fu += 2;
        fu += valuePair(shape.pair) * 2 + (badWait ? 2 : 0);
        for (const g of triples) fu += (g.open ? 2 : 4) * (terminal(g.tiles[0]) ? 2 : 1) * (g.kan ? 4 : 1);
        fu = pinfu && ctx.tsumo ? 20 : Math.ceil(fu / 10) * 10;
        if (!closed && fu === 20) fu = 30;
      }
      const indicators = [...(ctx.indicators || []), ...(ctx.riichi ? ctx.ura || [] : [])];
      const dora = yakuman.length ? 0 : indicators.reduce((sum, t) => sum + c[nextDora(t)], 0);
      const han = finalYaku.reduce((sum, y) => sum + y.han, 0) + dora;
      const base = yakuman.length ? 8000 * yakuman.length : han >= 13 ? 8000 : han >= 11 ? 6000 : han >= 8 ? 4000 : han >= 6 ? 3000 : Math.min(2000, fu * 2 ** (han + 2));
      const ron = up100(base * (ctx.dealer ? 6 : 4)), childPay = up100(base * (ctx.dealer ? 2 : 1)), dealerPay = up100(base * 2);
      const limit = yakuman.length ? '役満' : han >= 13 ? '数え役満' : han >= 11 ? '三倍満' : han >= 8 ? '倍満' : han >= 6 ? '跳満' : base === 2000 ? '満貫' : '';
      candidates.push({ yaku: finalYaku, han, fu, dora, base, ron, childPay, dealerPay, total: ctx.tsumo ? childPay * (ctx.dealer ? 3 : 2) + (ctx.dealer ? 0 : dealerPay) : ron, limit, shape });
    }
  }
  return candidates.sort((a, b) => b.total - a.total || b.han - a.han || b.fu - a.fu)[0] || null;
}

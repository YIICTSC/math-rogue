import { GeneralProblem, d } from './utils';

const uniqueOptions = (answer: number, candidates: number[]) => {
  const values = [answer, ...candidates].filter((value, index, array) => Number.isFinite(value) && array.indexOf(value) === index);
  let offset = 1;
  while (values.length < 4) {
    const next = answer + offset;
    if (!values.includes(next)) values.push(next);
    offset += 1;
  }
  return d(String(values[0]), String(values[1]), String(values[2]), String(values[3]));
};

const p = (question: string, answer: number, candidates: number[], hint: string): GeneralProblem => ({
  question,
  answer: String(answer),
  options: uniqueOptions(answer, candidates),
  hint,
});

const range = (count: number, make: (n: number) => GeneralProblem) =>
  Array.from({ length: count }, (_, n) => make(n));

const generatedCount = 30;

export const HIGH_SCHOOL_MATH_GENERATED_DATA: Record<string, GeneralProblem[]> = {
  UPPER_MATH_NUM_EXPR: range(generatedCount, (n) => {
    const a = (n % 7) + 2;
    const b = ((n * 3) % 9) - 4;
    const c = ((n * 5) % 8) + 1;
    const answer = a * c + b;
    return p(`【数学 数と式】x=${c} のとき、${a}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)} の値は？`, answer, [answer + a, answer - b, a + b + c], '代入して計算します');
  }),
  UPPER_MATH_QUADRATIC: range(generatedCount, (n) => {
    const a = (n % 3) + 1;
    const h = (n % 7) - 3;
    const k = ((n * 2) % 9) - 4;
    const x = h + ((n % 5) - 2);
    const answer = a * (x - h) ** 2 + k;
    return p(`【数学 二次関数】y=${a}(x${h < 0 ? '+' : '-'}${Math.abs(h)})^2${k >= 0 ? '+' : ''}${k} で x=${x} のとき y は？`, answer, [answer + a, k, h, answer - a], '頂点形式に代入します');
  }),
  UPPER_MATH_GEOMETRY: range(generatedCount, (n) => {
    const base = (n % 12) + 4;
    const height = ((n * 2) % 10) + 3;
    const answer = base * height;
    return p(`【数学 図形と計量】底辺${base}、高さ${height}の平行四辺形の面積は？`, answer, [base + height, Math.floor(answer / 2), answer + base], '平行四辺形の面積は底辺×高さです');
  }),
  UPPER_MATH_PROB_STATS: range(generatedCount, (n) => {
    const a = (n % 10) + 4;
    const b = ((n * 3) % 10) + 5;
    const c = ((n * 5) % 10) + 6;
    const dValue = a + b + c;
    const answer = Math.floor((a + b + c + dValue) / 4);
    return p(`【数学 確率・統計】${a}, ${b}, ${c}, ${dValue} の平均は？`, answer, [a + b + c + dValue, dValue, Math.max(a, b, c), answer + 2], '合計を個数で割ります');
  }),
  UPPER_MATH_TRIGONOMETRY: range(generatedCount, (n) => {
    const a = (n % 5) + 1;
    const b = (n % 4) + 1;
    const x = ((n * 30) % 360);
    const answer = a;
    return p(`【数学 三角関数】y=${a}sin(${b}x) の振幅は？`, answer, [b, a * b, Math.abs(a - b), a + b], '振幅はsinの前の係数の絶対値です');
  }),
  UPPER_MATH_SEQUENCE: range(generatedCount, (n) => {
    const first = (n % 8) + 1;
    const diff = ((n * 2) % 7) + 1;
    const term = (n % 10) + 5;
    const answer = first + (term - 1) * diff;
    return p(`【数学 数列】初項${first}、公差${diff}の等差数列の第${term}項は？`, answer, [answer + diff, first + term * diff, answer - diff], '等差数列は a+(n-1)d です');
  }),
  UPPER_MATH_VECTOR: range(generatedCount, (n) => {
    const ax = (n % 7) - 3;
    const ay = ((n * 2) % 7) - 3;
    const bx = ((n * 3) % 7) - 3;
    const by = ((n * 5) % 7) - 3;
    const answer = ax * bx + ay * by;
    return p(`【数学 ベクトル】(${ax}, ${ay})・(${bx}, ${by}) の内積は？`, answer, [ax + bx + ay + by, ax * by + ay * bx, answer + 2], '対応する成分を掛けて足します');
  }),
  UPPER_MATH_CALCULUS: range(generatedCount, (n) => {
    const a = (n % 5) + 1;
    const b = ((n * 3) % 9) - 4;
    const x = (n % 7) - 3;
    const answer = 2 * a * x + b;
    return p(`【数学 微分・積分基礎】f(x)=${a}x^2${b >= 0 ? '+' : ''}${b}x の f'(${x}) は？`, answer, [answer + a, answer - b, 2 * a + b], 'x^2の微分は2xです');
  }),
  UPPER_MATH_EXP_LOG: range(generatedCount, (n) => {
    const base = (n % 4) + 2;
    const exp = (n % 4) + 2;
    const answer = base ** exp;
    return p(`【数学 指数・対数】${base}^${exp} の値は？`, answer, [base * exp, answer + base, answer - base], '同じ数を指数の回数だけ掛けます');
  }),
  UPPER_MATH_COMPLEX: range(generatedCount, (n) => {
    const a = (n % 9) - 4;
    const b = ((n * 2) % 9) - 4;
    const answer = a * a + b * b;
    return p(`【数学 複素数平面】複素数 ${a}${b >= 0 ? '+' : ''}${b}i の絶対値の2乗は？`, answer, [Math.abs(a) + Math.abs(b), answer + a, answer + b], '絶対値の2乗は実部^2+虚部^2です');
  }),
  UPPER_MATH_ADV_PROB: range(generatedCount, (n) => {
    const total = (n % 5) + 5;
    const pick = 2;
    const answer = total * (total - 1) / 2;
    return p(`【数学 場合の数発展】${total}人から2人を選ぶ組合せは何通り？`, answer, [total * (total - 1), total + pick, answer + total], '順序を区別しないので2で割ります');
  }),
  UPPER_MATH_STAT_INFERENCE: range(generatedCount, (n) => {
    const center = (n % 9) + 6;
    const spread = (n % 4) + 1;
    const answer = Math.floor((spread * spread * 2) / 3);
    return p(`【数学 統計的推測】${center - spread}, ${center}, ${center + spread} の分散は？小数点以下は切り捨て`, answer, [spread * spread, center, 0], '平均からのずれの2乗平均を考えます');
  }),
  UPPER_MATH_MATH_HISTORY: range(generatedCount, (n) => {
    const year = 1600 + ((n * 17) % 350);
    const answer = Math.floor(year / 100) + 1;
    return p(`【数学 数学史・活用】西暦${year}年は何世紀？`, answer, [answer - 1, answer + 1, Math.floor(year / 100)], '西暦1-100年が1世紀です');
  }),
  UPPER_MATH_LINEAR_ALGEBRA: range(generatedCount, (n) => {
    const a = (n % 5) + 1;
    const b = ((n * 2) % 7) - 3;
    const c = ((n * 3) % 7) - 3;
    const dValue = ((n * 5) % 5) + 1;
    const answer = a * dValue - b * c;
    return p(`【数学 線形代数入門】行列 [[${a},${b}],[${c},${dValue}]] の行列式は？`, answer, [a + dValue, b * c, answer + 1], '2次行列の行列式はad-bcです');
  }),
  UPPER_MATH_ANALYTIC_GEOMETRY: range(generatedCount, (n) => {
    const x1 = (n % 7) - 3;
    const y1 = ((n * 2) % 7) - 3;
    const x2 = x1 + (n % 5) + 1;
    const y2 = y1 + ((n * 3) % 5) + 1;
    const answer = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    return p(`【数学 解析幾何】点(${x1},${y1})と点(${x2},${y2})の距離の2乗は？`, answer, [Math.abs(x2 - x1) + Math.abs(y2 - y1), answer + 2, answer - 2], '距離の2乗はx差の2乗+y差の2乗です');
  }),
  UPPER_MATH_OPTIMIZATION: range(generatedCount, (n) => {
    const h = (n % 9) - 4;
    const k = ((n * 3) % 12) + 1;
    return p(`【数学 最適化】y=-(x${h < 0 ? '+' : '-'}${Math.abs(h)})^2+${k} の最大値は？`, k, [h, k + 1, k - 1], '下に開く放物線の頂点が最大です');
  }),
  UPPER_MATH_DISCRETE: range(generatedCount, (n) => {
    const vertices = (n % 7) + 4;
    const answer = vertices * (vertices - 1) / 2;
    return p(`【数学 離散数学】${vertices}個の頂点をすべて結ぶ完全グラフの辺の本数は？`, answer, [vertices * 2, vertices * (vertices - 1), answer + vertices], '2頂点の選び方と同じです');
  }),
  UPPER_MATH_FINANCE: range(generatedCount, (n) => {
    const principal = ((n % 9) + 2) * 10000;
    const rate = (n % 5) + 1;
    const years = (n % 4) + 1;
    const answer = principal * rate * years / 100;
    return p(`【数学 金融数学】${principal}円を年${rate}%の単利で${years}年預けた利息は何円？`, answer, [answer + principal / 100, principal * rate / 100, answer * 2], '単利の利息は元金×利率×年数です');
  }),
  UPPER_MATH_DERIVATIVE_APP: range(generatedCount, (n) => {
    const a = (n % 4) + 1;
    const x = (n % 8) - 3;
    const answer = 3 * a * x * x;
    return p(`【数学 微分応用】f(x)=${a}x^3 の x=${x} における接線の傾きは？`, answer, [answer + x, 2 * a * x, answer - a], '接線の傾きは導関数の値です');
  }),
  UPPER_MATH_INTEGRAL_APP: range(generatedCount, (n) => {
    const a = (n % 5) + 1;
    const upper = (n % 5) + 2;
    const answer = a * upper * upper;
    return p(`【数学 積分応用】0から${upper}まで 2×${a}x を積分した値は？`, answer, [answer + upper, a * upper, answer - upper], '2axの積分はax^2です');
  }),
  UPPER_MATH_PROOF_ADV: range(generatedCount, (n) => {
    const a = (n % 12) + 2;
    const b = ((n * 5) % 12) + 2;
    const answer = a * b;
    return p(`【数学 証明発展】${a}の倍数かつ${b}の倍数である数の例として、最も小さいとは限らないが確実な正の整数は？`, answer, [a + b, Math.max(a, b), answer + a], '2つの数を掛けた数は両方の倍数です');
  }),
  UPPER_MATH_FUNCTION_MIX: range(generatedCount, (n) => {
    const a = (n % 6) + 1;
    const b = ((n * 2) % 9) - 4;
    const c = ((n * 3) % 7) - 3;
    const x = (n % 8) - 2;
    const answer = a * (x + c) + b;
    return p(`【数学 関数総合】f(x)=${a}x${b >= 0 ? '+' : ''}${b}, g(x)=x${c >= 0 ? '+' : ''}${c} の f(g(${x})) は？`, answer, [a * x + b + c, answer + a, answer - c], '内側の関数から代入します');
  }),
  UPPER_MATH_DATA_SCIENCE: range(generatedCount, (n) => {
    const actual = (n % 20) + 10;
    const predicted = actual + ((n % 7) - 3);
    const answer = Math.abs(actual - predicted);
    return p(`【数学 データサイエンス基礎】実測値${actual}、予測値${predicted}の絶対誤差は？`, answer, [actual + predicted, predicted - actual, answer + 2], '絶対誤差は差の絶対値です');
  }),
};

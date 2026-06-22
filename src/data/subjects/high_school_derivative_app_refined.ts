import { GeneralProblem, d } from './utils';

type Item = {
  f: string; derivative: string; x0: string; point: string; slope: string;
  tangent: string; normal: string; approximation: string;
};

const items: Item[] = [
  { f:'x^2', derivative:'2x', x0:'1', point:'(1,1)', slope:'2', tangent:'y=2x-1', normal:'y=-(1/2)x+3/2', approximation:'(1+h)^2≈1+2h' },
  { f:'x^3', derivative:'3x^2', x0:'1', point:'(1,1)', slope:'3', tangent:'y=3x-2', normal:'y=-(1/3)x+4/3', approximation:'(1+h)^3≈1+3h' },
  { f:'x^3-3x', derivative:'3x^2-3', x0:'0', point:'(0,0)', slope:'-3', tangent:'y=-3x', normal:'y=(1/3)x', approximation:'h^3-3h≈-3h' },
  { f:'1/x', derivative:'-1/x^2', x0:'1', point:'(1,1)', slope:'-1', tangent:'y=-x+2', normal:'y=x', approximation:'1/(1+h)≈1-h' },
  { f:'√x', derivative:'1/(2√x)', x0:'4', point:'(4,2)', slope:'1/4', tangent:'y=x/4+1', normal:'y=-4x+18', approximation:'√(4+h)≈2+h/4' },
  { f:'e^x', derivative:'e^x', x0:'0', point:'(0,1)', slope:'1', tangent:'y=x+1', normal:'y=-x+1', approximation:'e^h≈1+h' },
  { f:'ln x', derivative:'1/x', x0:'1', point:'(1,0)', slope:'1', tangent:'y=x-1', normal:'y=-x+1', approximation:'ln(1+h)≈h' },
  { f:'sin x', derivative:'cos x', x0:'0', point:'(0,0)', slope:'1', tangent:'y=x', normal:'y=-x', approximation:'sin h≈h' },
  { f:'cos x', derivative:'-sin x', x0:'0', point:'(0,1)', slope:'0', tangent:'y=1', normal:'x=0', approximation:'cos h≈1' },
  { f:'tan x', derivative:'1/cos^2 x', x0:'0', point:'(0,0)', slope:'1', tangent:'y=x', normal:'y=-x', approximation:'tan h≈h' },
  { f:'x^4', derivative:'4x^3', x0:'1', point:'(1,1)', slope:'4', tangent:'y=4x-3', normal:'y=-(1/4)x+5/4', approximation:'(1+h)^4≈1+4h' },
  { f:'x^2+2x', derivative:'2x+2', x0:'0', point:'(0,0)', slope:'2', tangent:'y=2x', normal:'y=-(1/2)x', approximation:'h^2+2h≈2h' },
  { f:'2^x', derivative:'(ln2)2^x', x0:'0', point:'(0,1)', slope:'ln2', tangent:'y=(ln2)x+1', normal:'y=-x/ln2+1', approximation:'2^h≈1+(ln2)h' },
  { f:'log_10 x', derivative:'1/(x ln10)', x0:'1', point:'(1,0)', slope:'1/ln10', tangent:'y=(x-1)/ln10', normal:'y=-(ln10)(x-1)', approximation:'log_10(1+h)≈h/ln10' },
  { f:'xe^x', derivative:'(x+1)e^x', x0:'0', point:'(0,0)', slope:'1', tangent:'y=x', normal:'y=-x', approximation:'he^h≈h' },
  { f:'x ln x', derivative:'ln x+1', x0:'1', point:'(1,0)', slope:'1', tangent:'y=x-1', normal:'y=-x+1', approximation:'(1+h)ln(1+h)≈h' },
  { f:'sin(2x)', derivative:'2cos(2x)', x0:'0', point:'(0,0)', slope:'2', tangent:'y=2x', normal:'y=-(1/2)x', approximation:'sin(2h)≈2h' },
  { f:'-sin x', derivative:'-cos x', x0:'0', point:'(0,0)', slope:'-1', tangent:'y=-x', normal:'y=x', approximation:'-sin h≈-h' },
  { f:'x/(x+1)', derivative:'1/(x+1)^2', x0:'0', point:'(0,0)', slope:'1', tangent:'y=x', normal:'y=-x', approximation:'h/(h+1)≈h' },
  { f:'ln(x+1)', derivative:'1/(x+1)', x0:'0', point:'(0,0)', slope:'1', tangent:'y=x', normal:'y=-x', approximation:'ln(1+h)≈h' },
];

const problems: GeneralProblem[] = [];
const opts = (answer: string, candidates: string[]): string[] => {
  const wrong = [...new Set([...candidates, '該当なし', '定義できない', '1'])].filter((value) => value !== answer).slice(0, 3);
  return d(answer, ...wrong);
};
for (const item of items.slice(0, 10)) {
  problems.push(
    { question:`【微分応用】f(x)=${item.f}の導関数は？`, answer:item.derivative, options:opts(item.derivative, [item.f, `-${item.derivative}`, '0']), hint:'微分公式と積・合成関数の規則を確認します。' },
    { question:`【微分応用】f(x)=${item.f}のx=${item.x0}における接線の傾きは？`, answer:item.slope, options:opts(item.slope, ['0', '1', `-${item.slope}`]), hint:`導関数へx=${item.x0}を代入します。` },
    { question:`【微分応用】y=${item.f}上の点${item.point}における接線は？`, answer:item.tangent, options:opts(item.tangent, [item.normal, `y=${item.slope}`, 'x=0']), hint:'点を通り、傾きが微分係数となる直線です。' },
    { question:`【微分応用】y=${item.f}上の点${item.point}における法線は？`, answer:item.normal, options:opts(item.normal, [item.tangent, `y=${item.slope}`, 'y=0']), hint:'法線は接線に垂直です。水平接線の場合は鉛直線になります。' },
    { question:`【微分応用】f(x)=${item.f}について、x=${item.x0}付近の一次近似として正しいものは？（hは小さい）`, answer:item.approximation, options:opts(item.approximation, [item.tangent, item.derivative, `${item.f}≈0`]), hint:'f(a+h)≈f(a)+f\'(a)hを使います。' },
  );
}

type Row = [string, string, string, string, string, string];
const extraRows: Row[] = [
  ['【微分応用】f(x)=x^2が減少する区間は？','x<0','x>0','すべての実数','減少区間はない','f\'(x)=2x<0となる範囲です。'],
  ['【微分応用】f(x)=x^3-3xが増加する区間は？','x<-1またはx>1','-1<x<1','x<1','x>-1','f\'(x)=3(x^2-1)>0を解きます。'],
  ['【微分応用】f(x)=-x^2+4xが増加から減少へ変わるxは？','2','-2','0','4','f\'(x)=-2x+4の符号がx=2で変わります。'],
  ['【微分応用】f(x)=ln xの増減は？','定義域x>0で単調増加','定義域x>0で単調減少','全実数で単調増加','x=1で最大','f\'(x)=1/x>0です。'],
  ['【微分応用】f(x)=e^(-x)の増減は？','全実数で単調減少','全実数で単調増加','x=0で最小','一定','f\'(x)=-e^(-x)<0です。'],
  ['【微分応用】f(x)=x+1/x（x>0）が減少する区間は？','0<x<1','x>1','x>0全体','減少区間なし','f\'(x)=1-1/x^2<0を解きます。'],
  ['【微分応用】f(x)=x^4の増減として正しいものは？','x<0で減少、x>0で増加','全実数で増加','全実数で減少','x<0で増加、x>0で減少','f\'(x)=4x^3の符号を見ます。'],
  ['【微分応用】0<x<2πでsin xが減少する区間は？','π/2<x<3π/2','0<x<π/2','π<x<2π','0<x<π','導関数cos xが負となる区間です。'],
  ['【微分応用】0<x<2πでcos xが増加する区間は？','π<x<2π','0<x<π','0<x<π/2','π/2<x<3π/2','導関数-sin xが正となる区間です。'],
  ['【微分応用】微分可能な関数の臨界点候補としてまず調べる点は？','f\'(x)=0となる点','f(x)=0となる点だけ','f\'(x)=1となる点','定義域外の点','増減が切り替わる候補を調べます。'],

  ['【微分応用】f(x)=x^2の最小値は？','0','1','-1','最小値なし','x=0で最小値0です。'],
  ['【微分応用】f(x)=-x^2+4xの最大値は？','4','2','-4','最大値なし','f(x)=-(x-2)^2+4です。'],
  ['【微分応用】f(x)=x^3-3xの極大値は？','2','-2','1','3','x=-1で極大となりf(-1)=2です。'],
  ['【微分応用】f(x)=x^3-3xの極小値は？','-2','2','-1','3','x=1で極小となりf(1)=-2です。'],
  ['【微分応用】f(x)=x^2-4xの0≤x≤3での最小値は？','-4','0','-3','4','臨界点x=2と端点を比較します。'],
  ['【微分応用】f(x)=x^2-4xの0≤x≤3での最大値は？','0','-4','-3','4','端点x=0で最大値0です。'],
  ['【微分応用】x>0でf(x)=x+4/xの最小値は？','4','2','8','最小値なし','f\'(x)=1-4/x^2=0よりx=2です。'],
  ['【微分応用】f\'(a)=0から直ちに言えることは？','aは極値の候補だが極値とは限らない','aで必ず極大','aで必ず極小','f(a)=0','例えばf(x)=x^3ではx=0は極値ではありません。'],
  ['【微分応用】微分可能な関数が内部点aで極値を取るための必要条件は？','f\'(a)=0','f(a)=0','f\'(a)=1','f\'\'(a)=0だけ','フェルマーの定理です。'],
  ['【微分応用】閉区間で最大・最小を求めるとき比較するものは？','臨界点と両端点の関数値','臨界点だけ','端点だけ','導関数の最大値だけ','絶対的な最大最小には端点確認が必要です。'],

  ['【微分応用】f\'(a)=0、f\'\'(a)>0のとき一般にaは？','極小点','極大点','変曲点','零点','グラフが下に凸で接線の傾きが0です。'],
  ['【微分応用】f\'(a)=0、f\'\'(a)<0のとき一般にaは？','極大点','極小点','必ず変曲点','定義域外','グラフが上に凸で接線の傾きが0です。'],
  ['【微分応用】f(x)=x^3の変曲点は？','(0,0)','(1,1)','(-1,-1)','変曲点なし','f\'\'(x)=6xの符号が0で変わります。'],
  ['【微分応用】f(x)=x^4のx=0は変曲点か？','変曲点ではない','必ず変曲点','極大かつ変曲点','定義できない','f\'\'=12x^2は0の前後で符号を変えません。'],
  ['【微分応用】f(x)=e^xの凹凸は？','全実数で下に凸','全実数で上に凸','x=0でだけ下に凸','変曲点を無数に持つ','f\'\'(x)=e^x>0です。'],
  ['【微分応用】f(x)=ln x（x>0）の凹凸は？','全域で上に凸','全域で下に凸','x=1で変曲','凹凸なし','f\'\'(x)=-1/x^2<0です。'],
  ['【微分応用】f(x)=x^4-2x^2の変曲点のx座標は？','±1/√3','±1','0だけ','±√3','f\'\'=12x^2-4=0で符号も変わります。'],
  ['【微分応用】f\'\'(x)>0が表す傾向は？','接線の傾きが増加する','関数値が必ず正','関数が必ず減少','接線の傾きが一定','導関数f\'が増加します。'],
  ['【微分応用】変曲点を判定するときf\'\'(a)=0だけでは不十分な理由は？','前後で凹凸が変わるか確認が必要','関数値も必ず0だから','導関数が存在しないから','端点だから','二階導関数の符号変化が本質です。'],
  ['【微分応用】グラフ概形を描く際に有効な情報の組は？','増減、極値、凹凸、漸近線','関数名だけ','切片だけ','定義域を除いた情報','複数の特徴を統合します。'],

  ['【微分応用】周長20の長方形で面積が最大となる辺の長さは？','5と5','2と8','4と6','1と9','正方形のとき最大で面積25です。'],
  ['【微分応用】長さ100の柵で三辺を囲う長方形の最大面積は？','1250','2500','1000','625','奥行25、横50で最大です。'],
  ['【微分応用】一辺12の正方形の四隅から一辺xを切り箱を作る体積は？','V=x(12-2x)^2','V=x^2(12-x)','V=12x^2','V=(12-x)^3','底面は一辺12-2xの正方形です。'],
  ['【微分応用】前問の箱の体積を最大にするxは？','2','3','4','6','V\'(x)=12(x-2)(x-6)で0<x<6を考えます。'],
  ['【微分応用】固定体積の円柱で表面積を最小にする形の関係は？','高さ=直径','高さ=半径','高さ=円周','高さは任意','微分するとh=2rが得られます。'],
  ['【微分応用】利益P(x)=R(x)-C(x)が最大となる内部点の基本条件は？','限界収入=限界費用','収入=0','費用=0','平均費用=0','P\'=R\'-C\'=0です。'],
  ['【微分応用】最適化問題で式を微分する前に必要なことは？','変数の範囲と制約を定める','答えを先に固定する','端点を除外する','単位を消す','現実に可能な定義域を明確にします。'],
  ['【微分応用】最大・最小候補が複数あるときの最終確認は？','候補と端点の目的関数値を比較する','最初の候補を選ぶ','導関数の係数だけを見る','変数範囲を無視する','局所条件だけでなく全体比較をします。'],
  ['【微分応用】需要量xで価格p(x)、費用C(x)の利益関数は？','xp(x)-C(x)','p(x)-xC(x)','x+C(x)','p(x)C(x)','売上は数量×単価です。'],
  ['【微分応用】最適解が端点にある可能性を無視できない理由は？','制約付き区間では内部臨界点がない場合もある','端点では関数が未定義だから','導関数が常に1だから','最大値は必ず中央だから','許容範囲全体で比較します。'],

  ['【微分応用】位置s(t)=t^3-6t^2+9tの速度は？','v(t)=3t^2-12t+9','v(t)=t^2-6t+9','v(t)=3t^2-6t+9','v(t)=6t-12','速度は位置の時間微分です。'],
  ['【微分応用】前問の加速度は？','a(t)=6t-12','a(t)=3t^2-12t+9','a(t)=6t-6','a(t)=t^3-6t^2','加速度は速度の時間微分です。'],
  ['【微分応用】前問の物体が静止する時刻は？（t≥0）','t=1,3','t=0,2','t=1だけ','t=3だけ','v=3(t-1)(t-3)=0です。'],
  ['【微分応用】速さと速度の関係は？','速さは速度の絶対値','常に同じ符号付き量','速さは加速度','速度は位置の絶対値','速さは向きを除いた大きさです。'],
  ['【微分応用】半径rが毎秒2増える円の面積Aの変化率は？','dA/dt=4πr','dA/dt=2πr','dA/dt=4πr^2','dA/dt=2π','dA/dt=2πr·dr/dtです。'],
  ['【微分応用】半径rが毎秒1増える球の体積Vの変化率は？','dV/dt=4πr^2','dV/dt=(4/3)πr^3','dV/dt=8πr','dV/dt=4πr','dV/dr=4πr^2を使います。'],
  ['【微分応用】平均値の定理が保証するものは？','平均変化率と等しい微分係数を持つ点','最大値を取る点だけ','関数値0の点','二階導関数0の点','区間内のある点で接線が弦と平行になります。'],
  ['【微分応用】ロルの定理でf(a)=f(b)なら区間内に存在する点は？','f\'(c)=0となるc','f(c)=0となるc','f\'\'(c)=0となるc','f(c)=aとなるc','両端を結ぶ弦の傾きが0です。'],
  ['【微分応用】ニュートン法の更新式は？','x_(n+1)=x_n-f(x_n)/f\'(x_n)','x_(n+1)=f(x_n)','x_(n+1)=x_n+f\'(x_n)','x_(n+1)=f\'(x_n)/f(x_n)','接線とx軸の交点を次の近似にします。'],
  ['【微分応用】微分を現実モデルへ使う際の基本的な注意は？','単位、変数範囲、モデルの仮定を確認する','導関数があれば現実と必ず一致','端点を無視する','誤差を0とみなす','計算結果の適用範囲を検討します。'],
];

for (const [question, answer, wrong1, wrong2, wrong3, hint] of extraRows) {
  problems.push({ question, answer, options: d(answer, wrong1, wrong2, wrong3), hint });
}

export const UPPER_MATH_DERIVATIVE_APP_REFINED_DATA = problems;

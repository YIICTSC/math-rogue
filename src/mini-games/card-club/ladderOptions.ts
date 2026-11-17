export interface LadderOptions {rounds:number;eightCut:boolean;jackBack:boolean;suitLock:boolean;spadeThree:boolean;skipFive:boolean;reverseNine:boolean}
export const DEFAULT_LADDER_OPTIONS:LadderOptions={rounds:1,eightCut:false,jackBack:false,suitLock:false,spadeThree:false,skipFive:false,reverseNine:false};
export function ladderOptions(value?:Partial<LadderOptions>):LadderOptions{return {rounds:Math.max(1,Math.min(20,Math.trunc(Number(value?.rounds)||1))),...Object.fromEntries(['eightCut','jackBack','suitLock','spadeThree','skipFive','reverseNine'].map(k=>[k,value?.[k as keyof LadderOptions]===true]))} as LadderOptions;}
export const LADDER_RULES=[
 ['eightCut','8切り','Eight cut','8を出すと場を流し、もう一度リード。','Playing an eight clears the pile and leads again.'],
 ['jackBack','11バック','Jack back','Jを出すと場が流れるまで強さが逆転。革命と重なると元の強さ。','A jack reverses strength until the pile clears; combines with revolution.'],
 ['suitLock','スートしばり','Suit lock','同じスート構成が2回続くと、その場は同じ構成の札だけ出せる。ジョーカーを含む組はしばりを作らない。','Two identical suit patterns lock subsequent plays to that pattern. Joker groups do not create a lock.'],
 ['spadeThree','スペ3返し','Spade three counter','単独ジョーカーに♠3を返して場を流せる。','A single spade three counters a single joker and clears the pile.'],
 ['skipFive','5スキップ','Five skip','5の枚数分、次のプレイヤーを飛ばす。','Each five skips one active player.'],
 ['reverseNine','9リバース','Nine reverse','9を含む札を出すと進行方向を反転。','Playing a nine reverses turn direction.'],
] as const;

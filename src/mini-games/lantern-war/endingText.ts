export const endingNarration=(shared:boolean)=>shared?'物資を分けた町から、名も知らぬ人々が灯を持ち寄った。英雄が去った後も、隣の家から次の家へ、火は渡っていく。':'旅の途中で残した灯が、それぞれの町の道しるべになった。仲間たちは故郷へ帰り、時にはまた砦の食卓へ戻った。';
export const endingCrown=(name:string)=>`王冠は砦の棚に置かれた。次の朝、${name}は、名前を書いた旗を洗い、みんなの食器を並べた。`;

export const narrationParts=(text:string)=>text.match(/[^。]+。?/g)||[text];

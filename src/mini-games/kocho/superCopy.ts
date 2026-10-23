import { SUPER_MOVES } from './superData';
const rows=[
 ['超必殺技','Super Finishers','ちょうひっさつわざ'],
 ['3枚をこの順に実行し、最後の攻撃を当てると発動。','Execute these three cards in order and land the final attack.','3まいをこのじゅんにじっこうし、さいごのこうげきをあてるとはつどう。'],
 ['派生はどれでも可。同じ実行内で3枚をつなごう。','Any variant works. Chain all three in one execution.','はせいはどれでもか。おなじじっこうないで3まいをつなごう。'],
 ['追加ダメージは防御を貫通。ボイス終了は待ちません。','Bonus damage pierces defense. Voice playback never delays control.','ついかダメージはぼうぎょをかんつう。ボイスしゅうりょうはまちません。'],
 ['コンボ成立候補','Combo ready','コンボせいりつこうほ'],['残像コンボ','Afterimage combo','ざんぞうコンボ'],
 ['閉じる','Close','とじる'],['追加ダメージ','Bonus damage','ついかダメージ'],['回復','Heal','かいふく'],['シールド','Shield','シールド'],
] as const;
export const SUPER_ENGLISH:Record<string,string>={...Object.fromEntries(rows.map(([ja,en])=>[ja,en])),...Object.fromEntries(SUPER_MOVES.map(m=>[m.name,m.englishName]))};
export const SUPER_HIRAGANA:Record<string,string>={...Object.fromEntries(rows.map(([ja,,hi])=>[ja,hi])),...Object.fromEntries(SUPER_MOVES.map(m=>[m.name,m.hiraganaName]))};

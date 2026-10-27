export type DungeonSortOrder = 'type' | 'name';
const categoryOrder:Record<string,number>={WEAPON:0,ARMOR:1,RANGED:2,ACCESSORY:3,CONSUMABLE:4,STAFF:5,SYNTH:6,FOOD:7,HERB:8,SCROLL:9,POT:10,BAG:11};
/** Sort only by visible information; unidentified items stay in an unknown group. */
export function sortDungeonItems<T extends {category?:string}>(items:readonly T[],order:DungeonSortOrder,name:(item:T)=>string,known:(item:T)=>boolean):T[]{
 return items.map((item,index)=>({item,index,category:known(item)?(categoryOrder[item.category||'']??12):13,label:name(item)})).sort((a,b)=>{
  if(order==='type'&&a.category!==b.category)return a.category-b.category;
  return a.label.localeCompare(b.label,undefined,{numeric:true})||a.index-b.index;
 }).map(row=>row.item);
}

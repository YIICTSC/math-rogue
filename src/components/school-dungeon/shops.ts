/** Migrate floor-display sales to the merchant's existing inventory. */
export function clearShopOwnership<T extends Record<string,any>>(item:T):T{
 const {shopOwner,...rest}=item;return {...rest,...(item.contents?{contents:item.contents.map(clearShopOwnership)}:{})} as T;
}
export function retireShopTheft(state:any,player:any,inventory:any[],enemies:any[],floorItems:any[]){
 state.debt=0;state.alarm=false;delete state.shopPosition;
 return {player:{...player,equipment:Object.fromEntries(Object.entries(player.equipment||{}).map(([slot,item])=>[slot,item?clearShopOwnership(item as any):item]))},inventory:inventory.map(clearShopOwnership),enemies:enemies.filter(e=>!(e.schoolKind==='MONITOR'&&e.xp===0&&e.name==='見回り先生')),floorItems:floorItems.filter(e=>!e.itemData?.shopOwner)};
}

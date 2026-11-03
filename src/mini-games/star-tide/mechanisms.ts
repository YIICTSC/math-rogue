/** One occurrence of each mechanism per chapter. The two patrol rooms and all
 * outdoor areas deliberately leave room for combat, residents and exploration. */
export const MECHANISMS:Record<number,{kind:string;name:readonly[string,string];hint:readonly[string,string]}>={
 8:{kind:'circuit',name:['星灯回路','Star circuit'],hint:['床のそばでA。自分と上下左右が反転する。16個すべてを点灯しよう。','Use A at a plate to toggle it and its neighbours. Light all sixteen plates.']},
 9:{kind:'blocks',name:['荷箱の庭','Cargo garden'],hint:['木箱を押して金色の印へ。手帳から初期配置に戻せる。','Push crates onto the gold marks. Reset from the journal if needed.']},
 10:{kind:'forge',name:['道具の試練','Tool trial'],hint:['宝箱の道具を装備して、中央の装置をAかBで動かそう。','Equip the tool from the chest and use its button at the central device.']},
 11:{kind:'beam',name:['光の回廊','Light gallery'],hint:['鏡のそばでAを押して回転し、光を受光器へ導こう。','Use A beside mirrors to guide the beam to the receiver.']},
 12:{kind:'bells',name:['木霊の三鐘','Echo bells'],hint:['低い鐘から高い鐘へ。左・右・中央の順にA。','Ring the bells from low to high: left, right, then centre, using A.']},
 13:{kind:'wind',name:['風向きの帆','Wind vanes'],hint:['二つの帆のそばで、風の向き（右・上）を向いてA。','At each vane, face the wind (right, then up) and use A.']},
 14:{kind:'tide',name:['潮位の水門','Tidal sluice'],hint:['左の水門でAを押して水を引かせ、右の水門へ渡ろう。','Use A at the left sluice to drain the channel, then cross to the right sluice.']},
 15:{kind:'lens',name:['星座のレンズ','Constellation lens'],hint:['左のレンズをAで回し、光が右を向いたら右の受光器でA。','Turn the left lens with A. When it points right, use A at the right receiver.']},
 16:{kind:'balance',name:['天秤の床','Balance floor'],hint:['左の床を踏んでから、4秒以内に右の床へ。歩いて作動する。','Step on the left plate, then reach the right within four seconds. No button needed.']},
 18:{kind:'memory',name:['足跡の記憶','Memory trail'],hint:['青い床を左下・中央・右上の順に歩こう。順番を違えると最初から。','Walk the blue tiles: lower left, centre, upper right. A wrong tile restarts the trail.']},
 19:{kind:'ice',name:['氷像の航路','Ice statue route'],hint:['左の操作台で方向を向いてA。壁まで滑る像を星印へ。','Face a direction at the left console and use A. Slide the statue onto the star.']},
 20:{kind:'relay',name:['灯火のリレー','Lantern relay'],hint:['左の火でAを押して灯を受け取り、8秒以内に右の台座でA。','Take the flame with A at the left brazier and deliver it to the right within eight seconds.']},
 22:{kind:'pulse',name:['星の拍動','Star pulse'],hint:['中央の灯が明るく広がった瞬間にA。三つの拍子を合わせよう。','Use A when the central light expands brightly. Match three beats.']}
};
export type MechanismState={progress:number;dial:number;timer:number;latched:number};
export const mechanismState=():MechanismState=>({progress:0,dial:0,timer:0,latched:-1});
export function mechanismPoints(kind:string):{x:number;y:number}[]{
 if(kind==='bells')return [{x:8.5,y:6.5},{x:12.5,y:6.5},{x:10.5,y:6.5}];
 if(kind==='memory')return [{x:7.5,y:8.5},{x:10.5,y:6.5},{x:13.5,y:4.5}];
 return ['wind','tide','lens','balance','relay'].includes(kind)?[{x:8.5,y:6.5},{x:12.5,y:6.5}]:[{x:10.5,y:6.5}];
}

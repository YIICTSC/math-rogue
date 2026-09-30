export const SKINS = ['#ffdcad','#e6b185','#bb815e','#80583f','#f6c2b0','#d9a282','#a76a4d','#5f4136'];
export const HAIR = ['#45382e','#a06d40','#e5c379','#635a92','#ec9fba','#171e2d','#dde6ee','#bc553f','#69a8a0','#508ac2','#9175c5','#f2d58b'];
export const SHIRTS = ['#ef996b','#74b9cb','#b89de0','#e6c96c','#91bb79','#e894ae','#466697','#c55d65','#ece2ce','#3d6154','#a6794c','#737a86'];
export const PANTS = ['#385762','#6b577b','#8a785c','#eee4cd','#303746','#5f8b91','#a97074','#7a9158'];
export const FURS = ['#e6b878','#f1e5d0','#776250','#ad7458','#535d6e','#f3b6c1','#90c7b0','#aeb9e5','#d0a5df','#e4d08b'];
export const KINDS = ['人間','ねこ','いぬ','うさぎ','きつね','くま','パンダ','ことり','かえる'];
export const HAIRSTYLES = ['ショート','ボブ','ロング','ポニーテール','ツインテール','スパイキー','くるくる','みつあみ','横分け','坊主'];
export const EXPRESSIONS = ['にっこり','元気','おだやか','大笑い','ウインク','びっくり','きりっと','ねむたい','てれ顔','むすっと'];
export const OUTFITS = ['シャツ','オーバーオール','パーカー','制服','ワンピース','コート','探検家','コック','魔法使い','忍者','騎士','レインコート'];
export const HATS = ['なし','麦わら帽子','キャップ','ニット帽','ベレー帽','リボン','王冠','花かざり','ヘルメット'];
export const ACCESSORIES = ['なし','四角めがね','丸めがね','マフラー','リュック','ヘッドホン'];
export type Avatar = { skin:number; hair:number; shirt:number; pants:number; style:number; hat:number; kind:number; hairstyle:number; expression:number; accessory:number; fur:number };
export function avatarOf(raw?:unknown, color=0):Avatar {
  const a=raw && typeof raw==='object'?raw as Partial<Avatar>:{};
  const value=(key:keyof Avatar,max:number,fallback=0)=>Number.isInteger(a[key])&&a[key]!>=0&&a[key]!<max?a[key]!:fallback;
  return {skin:value('skin',SKINS.length),hair:value('hair',HAIR.length),shirt:value('shirt',SHIRTS.length,Number.isInteger(color)?Math.max(0,Math.min(5,color)):0),pants:value('pants',PANTS.length),style:value('style',OUTFITS.length),hat:value('hat',HATS.length),kind:value('kind',KINDS.length),hairstyle:value('hairstyle',HAIRSTYLES.length),expression:value('expression',EXPRESSIONS.length),accessory:value('accessory',ACCESSORIES.length),fur:value('fur',FURS.length)};
}
export function loadAvatar():Avatar {try{return avatarOf(JSON.parse(localStorage.getItem('gakuro-craft-avatar-v1')||'null'));}catch{return avatarOf();}}
export function saveAvatar(a:Avatar){try{localStorage.setItem('gakuro-craft-avatar-v1',JSON.stringify(avatarOf(a)));}catch{/* Appearance remains usable without storage. */}}

export const PETS = {
 shiba:{label:'柴犬',name:'コムギ',emoji:'🐕'},
 corgi:{label:'コーギー',name:'ポテト',emoji:'🐕'},
 poodle:{label:'トイプードル',name:'モカ',emoji:'🐩'},
 calico:{label:'三毛猫',name:'ミケ',emoji:'🐈'},
 tabby:{label:'サバトラ猫',name:'ソラ',emoji:'🐈'},
 blackCat:{label:'黒猫',name:'クロ',emoji:'🐈‍⬛'},
 rabbit:{label:'ウサギ',name:'モチ',emoji:'🐇'},
 hamster:{label:'ハムスター',name:'マメ',emoji:'🐹'},
 panda:{label:'パンダ',name:'ササ',emoji:'🐼'},
 longTailedTit:{label:'シマエナガ',name:'ユキ',emoji:'🐦'},
} as const;
export type PetKind=keyof typeof PETS;
export const PET_KINDS=Object.keys(PETS) as PetKind[];
export const DEFAULT_PET:PetKind='calico';
export function petKindOf(value:unknown):PetKind{return typeof value==='string'&&Object.prototype.hasOwnProperty.call(PETS,value)?value as PetKind:DEFAULT_PET;}
export function petNameOf(value:unknown,kind:PetKind){return typeof value==='string'&&value.trim()?value.trim().slice(0,16):PETS[kind].name;}

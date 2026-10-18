/** Stable identifiers shared by RPG and online mini-games. */
export const PROTAGONISTS = [
  {
    "id": "elementary-warrior",
    "name": "わんぱく小学生"
  },
  {
    "id": "elementary-caretaker",
    "name": "飼育委員"
  },
  {
    "id": "elementary-assassin",
    "name": "転校生"
  },
  {
    "id": "elementary-dodgeball",
    "name": "ドッジボールのエース"
  },
  {
    "id": "elementary-bard",
    "name": "放送委員"
  },
  {
    "id": "elementary-librarian",
    "name": "図書委員"
  },
  {
    "id": "elementary-chef",
    "name": "給食当番リーダー"
  },
  {
    "id": "elementary-gardener",
    "name": "園芸委員"
  },
  {
    "id": "elementary-mage",
    "name": "理科クラブ部長"
  },
  {
    "id": "high-school-warrior",
    "name": "反逆の高校生"
  },
  {
    "id": "high-school-caretaker",
    "name": "生物部の先輩"
  },
  {
    "id": "high-school-assassin",
    "name": "謎めく転入生"
  },
  {
    "id": "high-school-mage",
    "name": "化学研究会長"
  },
  {
    "id": "high-school-dodgeball",
    "name": "バスケ部エース"
  },
  {
    "id": "high-school-bard",
    "name": "放送部ディレクター"
  },
  {
    "id": "high-school-librarian",
    "name": "文芸部書記"
  },
  {
    "id": "high-school-chef",
    "name": "学食の料理長"
  },
  {
    "id": "high-school-gardener",
    "name": "園芸部部長"
  },
  {
    "id": "magic-akari",
    "name": "星宮あかり"
  },
  {
    "id": "magic-shizuku",
    "name": "水城しずく"
  },
  {
    "id": "magic-hiyori",
    "name": "花咲ひより"
  },
  {
    "id": "magic-tsubasa",
    "name": "火神つばさ"
  },
  {
    "id": "magic-rei",
    "name": "黒羽れい"
  },
  {
    "id": "magic-madoka",
    "name": "翠川まどか"
  },
  {
    "id": "magic-koharu",
    "name": "風森こはる"
  },
  {
    "id": "magic-mirai",
    "name": "紫藤みらい"
  },
  {
    "id": "magic-sera",
    "name": "白峰セラ"
  },
  {
    "id": "magic-ren",
    "name": "朝霧 蓮"
  },
  {
    "id": "magic-soma",
    "name": "御影 颯真"
  },
  {
    "id": "magic-minato",
    "name": "白石 湊"
  },
  {
    "id": "magic-riku",
    "name": "天音 理玖"
  },
  {
    "id": "magic-yamato",
    "name": "黒瀬 大和"
  },
  {
    "id": "magic-leon",
    "name": "神代 レオン"
  },
  {
    "id": "magic-elliot",
    "name": "エリオット・ノクス"
  },
  {
    "id": "magic-sakuya",
    "name": "九条 朔夜"
  }
] as const;
export type ProtagonistId = typeof PROTAGONISTS[number]['id'];
export function isProtagonistId(value: unknown): value is ProtagonistId {return typeof value==='string' && PROTAGONISTS.some(p=>p.id===value);}
export function rpgProtagonist(profile?: {character:string;visualTheme?:string;magicProtagonistId?:string;appearanceMode?:string;image?:string}, custom=false):ProtagonistId|undefined {
 if(!profile||custom||(profile.image?.startsWith('data:image/')&&!profile.image.startsWith('data:image/svg+xml'))||profile.appearanceMode==='VACATION'||profile.character.startsWith('RPG_ENEMY:'))return;
 const id=(profile.visualTheme==='magic'?'magic-'+(profile.magicProtagonistId||({WARRIOR:'AKARI',CARETAKER:'SHIZUKU',ASSASSIN:'HIYORI',MAGE:'TSUBASA',DODGEBALL:'REI',BARD:'MADOKA',LIBRARIAN:'KOHARU',CHEF:'MIRAI',GARDENER:'SERA'} as Record<string,string>)[profile.character]||'AKARI').toLowerCase():(profile.visualTheme||'elementary')+'-'+profile.character.toLowerCase());
 return isProtagonistId(id)?id:undefined;
}

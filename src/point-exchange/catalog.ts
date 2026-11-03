export type Copy=[string,string,string];
export const BACKGROUNDS:{id:string;name:Copy;category:'quiet'|'epic'|'fun'|'season';price:number}[]=[
{id:'notebook',name:['はじまりのノート','First notebook','はじまりのノート'],category:'quiet',price:10},
{id:'window',name:['放課後の窓辺','After-school window','ほうかごのまどべ'],category:'quiet',price:30},
{id:'study',name:['小さな魔法の書斎','A little magic study','ちいさなまほうのしょさい'],category:'quiet',price:40},
{id:'stars',name:['星海の図書館','Library of stars','せいかいのとしょかん'],category:'epic',price:100},
{id:'sky',name:['雲上の学び舎','Academy above the clouds','うんじょうのまなびや'],category:'epic',price:120},
{id:'tree',name:['世界樹の約束','Promise of the world tree','せかいじゅのやくそく'],category:'epic',price:150},
{id:'pudding',name:['料理長と巨大プリン','The chef and the giant pudding','りょうりちょうときょだいプリン'],category:'fun',price:50},
{id:'garden',name:['植物だらけの教室','The classroom jungle','しょくぶつだらけのきょうしつ'],category:'fun',price:50},
{id:'experiment',name:['ふわふわ魔法実験','Fluffy magic experiment','ふわふわまほうじっけん'],category:'fun',price:60},
{id:'sakura',name:['桜色のひと休み','Cherry blossom break','さくらいろのひとやすみ'],category:'season',price:40},
{id:'rain',name:['雨音のカフェ','Rainy-day cafe','あまおとのカフェ'],category:'season',price:40},
{id:'snow',name:['雪灯りの学園祭','Snow-lantern festival','ゆきあかりのがくえんさい'],category:'season',price:60},
{id:'chibi',name:['ちびっこ空の配達便','Chibi sky delivery','ちびっこそらのはいたつびん'],category:'fun',price:60},
{id:'film',name:['映画のような天文台','Cinematic observatory','えいがのようなてんもんだい'],category:'epic',price:120},
{id:'ink',name:['劇画ラーメン横丁','Gekiga ramen alley','げきがラーメンよこちょう'],category:'fun',price:60},
{id:'paper',name:['切り絵の本の森','Papercut book forest','きりえのほんのもり'],category:'quiet',price:60},
{id:'oil',name:['名画の中の休日','A day in an oil painting','めいがのなかのきゅうじつ'],category:'epic',price:100},
{id:'pixel',name:['ドット絵の星灯市場','Pixel starlight market','ドットえのほしあかりいちば'],category:'season',price:60},
];
export const TRACKS=[
{id:'rest',name:['憩いのひととき','A peaceful rest','いこいのひととき'] as Copy,price:30},
{id:'dungeon_library',name:['図書館の旅','Library journey','としょかんのたび'] as Copy,price:40},
{id:'event',name:['物語のひとこま','A page of the story','ものがたりのひとこま'] as Copy,price:30},
{id:'map',name:['冒険の地図','Adventure map','ぼうけんのちず'] as Copy,price:40},
{id:'school_psyche',name:['放課後の鼓動','After-school heartbeat','ほうかごのこどう'] as Copy,price:60},
{id:'paper_plane_vacation',name:['夏空の便り','Letters from summer skies','なつぞらのたより'] as Copy,price:60},
{id:'victory',name:['明日への凱歌','Victory for tomorrow','あしたへのがいか'] as Copy,price:80},
{id:'math',name:['ひらめきの時間','Time for inspiration','ひらめきのじかん'] as Copy,price:30},
];
export const PRODUCTS=[...BACKGROUNDS.map(b=>({id:'bg:'+b.id,price:b.price})),...TRACKS.map(t=>({id:'bgm:'+t.id,price:t.price})),{id:'theater',price:200}];
export const backgroundPath=(id:string,portrait=false)=>`sprites/point-exchange/${id}-${portrait?'portrait':'landscape'}.webp`;
export const ART_STYLES:Record<string,Copy>={notebook:['ガッシュ・紙の風合い','Gouache / paper texture','ガッシュ・かみのふうあい'],window:['アニメ調','Anime','アニメちょう'],study:['水彩アニメ','Watercolor anime','すいさいアニメ'],stars:['幻想アニメ','Fantasy anime','げんそうアニメ'],sky:['壮大なアニメ','Epic anime','そうだいなアニメ'],tree:['装飾画風','Decorative painting','そうしょくがふう'],pudding:['2頭身ちびアニメ','Two-head chibi anime','2とうしんちびアニメ'],garden:['劇画・墨の表現','Gekiga / brush ink','げきが・すみのひょうげん'],experiment:['3頭身ちびアニメ','Three-head chibi anime','3とうしんちびアニメ'],sakura:['版画風','Woodblock-inspired','はんがふう'],rain:['水彩画','Watercolor painting','すいさいが'],snow:['絵本風','Storybook','えほんふう'],chibi:['ちびキャラアニメ','Chibi anime','ちびキャラアニメ'],film:['実写調','Live-action style','じっしゃちょう'],ink:['モノクロ劇画','Monochrome gekiga','モノクロげきが'],paper:['切り絵','Layered papercut','きりえ'],oil:['油絵・名画風','Classical oil painting','あぶらえ・めいがふう'],pixel:['ドット絵','Pixel art','ドットえ']};

/** Curriculum bands stay within the chosen lesson. Floors and completed combat experience
 * advance thirty small levels; difficulty is frozen while a battle is in progress. */
export function typingProgress(act:number,floor:number,combatExperience=0) {
  act=Number.isFinite(act)?act:1;floor=Number.isFinite(floor)?floor:0;combatExperience=Number.isFinite(combatExperience)?combatExperience:0;
  const steps=Math.floor(Math.max(0,(Math.max(1,act)-1)*12+Math.max(Math.max(0,floor-1),Math.floor(Math.max(0,combatExperience)/2))));
  const band=Math.min(4,Math.floor(steps/6));
  return {level:Math.min(30,steps+1),band,withinBand:band<4?(steps%6)/5:Math.min(1,(steps-24)/5),sequenceLength:Math.min(12,1+Math.floor(steps/3))};
}
const kana = (pairs:string) => pairs.split('|').map(pair=>{const [text,answer]=pair.split(':');return {text,accepted:[answer,text]};});
export const VOWEL_WORDS=kana('あ:a|い:i|う:u|え:e|お:o|あい:ai|あお:ao|いえ:ie|うえ:ue|おい:oi|えい:ei|おう:ou|あう:au|いう:iu|あおい:aoi|あいう:aiu|いおう:iou|おおい:ooi|おおう:oou|うお:uo');
export const EXTRA_WORDS = [
 kana('ねこ:neko|いぬ:inu|かさ:kasa|くつ:kutsu|そら:sora|はな:hana|ほし:hoshi|まめ:mame|もり:mori|やま:yama|かわ:kawa|ゆき:yuki|あめ:ame|うみ:umi|つき:tsuki|みず:mizu|かぜ:kaze|とり:tori|むし:mushi|ふね:fune'),
 kana('つくえ:tsukue|いす:isu|こくご:kokugo|さんすう:sansuu|りか:rika|しゃかい:shakai|ずこう:zukou|おんがく:ongaku|たいいく:taiiku|えんぴつ:enpitsu|のうと:nouto|けしごむ:keshigomu|ものさし:monosashi|ふでばこ:fudebako|きょうかしょ:kyoukasho|じかんわり:jikanwari|こくばん:kokuban|かだん:kadan|こうてい:koutei|としょしつ:toshoshitsu'),
 kana('しらべる:shiraberu|くらべる:kuraberu|かぞえる:kazoeru|まとめる:matomeru|つたえる:tsutaeru|かんがえる:kangaeru|ふりかえる:furikaeru|たしかめる:tashikameru|かんさつ:kansatsu|じっけん:jikken|はっぴょう:happyou|せつめい:setsumei|そうだん:soudan|きょうりょく:kyouryoku|れんしゅう:renshuu|ちょうせん:chousen|はっけん:hakken|しつもん:shitsumon|やくそく:yakusoku|けいかく:keikaku'),
 kana('てんきよほう:tenkiyohou|こうつうあんぜん:koutsuuanzen|しょくぶつえん:shokubutsuen|どうぶつえん:doubutsuen|えいがかん:eigakan|はくぶつかん:hakubutsukan|うんどうかい:undoukai|えんそく:ensoku|きゅうしょくとうばん:kyuushokutouban|がっきゅういいん:gakkyuuiin|じゆうけんきゅう:jiyuukenkyuu|ぶんぼうぐ:bunbougu|しぜんかんさつ:shizenkansatsu|しょうぼうしゃ:shoubousha|きゅうきゅうしゃ:kyuukyuusha|でんしゃでいどう:denshadeidou|ちいきのまつり:chiikinomatsuri|としょいいん:toshoiin|ほけんいいん:hokeniin|がっこうしんぶん:gakkoushinbun'),
 kana('じょうほうをせいりする:jouhouwoseirisuru|しょくぶつのせいちょう:shokubutsunoseichou|ちきゅうのじてん:chikyuunojiten|でんきのかいろ:denkinokairo|かんきょうほご:kankyouhogo|さんぎょうかくめい:sangyoukakumei|じんこうのへんか:jinkounohenka|みらいのぎじゅつ:mirainogijutsu|ふくざつなもんだい:fukuzatsunamondai|こうりつてきなほうほう:kouritsutekinahouhou|せかいのぶんか:sekainobunka|ことばのいみをしらべる:kotobanoimiwoshiraberu|じっけんけっかのぶんせき:jikkenkekkanobunseki|れきしのしりょう:rekishinoshiryou|しょうすうとぶんすう:shousuutobunsuu|りったいのてんかいず:rittainotenkaizu|じぶんのいけんをつたえる:jibunnoikenwotsutaeru|ほしぞらをかんさつする:hoshizorawokansatsusuru|ともだちときょうりょくする:tomodachitokyouryokusuru|ちいきのれきしをまなぶ:chiikinorekishiwomanabu'),
];
// Natural sentence templates pair Japanese reading with a verified romanization.
const people=kana('わたしは:watashiha|ぼくは:bokuha|わたしたちは:watashitachiha|ともだちは:tomodachiha|みんなは:minnaha');
const clauses=[
 kana('おはよう:ohayou|こんにちは:konnichiha|こんばんは:konbanha|ありがとう:arigatou|またあした:mataashita|おやすみ:oyasumi|いってきます:ittekimasu|ただいま:tadaima|いただきます:itadakimasu|ごちそうさま:gochisousama|よろしくね:yoroshikune|おめでとう:omedetou|がんばろう:ganbarou|だいじょうぶ:daijoubu|たのしいね:tanoshiine|またあおう:mataaou'),
 kana('ほんをよみます:honwoyomimasu|えをかきます:ewokakimasu|そとであそびます:sotodeasobimasu|うたをうたいます:utawoutaimasu|はなにみずをあげます:hananimizuwoagemasu|きょうしつをそうじします:kyoushitsuwosoujishimasu'),
 kana('あしたのじゅんびをします:ashitanojunbiwoshimasu|しゅくだいをたしかめます:shukudaiwotashikamemasu|としょしつでほんをさがします:toshoshitsudehonwosagashimasu|ともだちとけいかくをたてます:tomodachitokeikakuwotatemasu|じぶんのかんがえをかきます:jibunnokangaewokakimasu|まいにちすこしずつれんしゅうします:mainichisukoshizutsurenshuushimasu'),
 kana('かんさつしたことをのうとにまとめます:kansatsushitakotowonoutonimatomemasu|もんだいのときかたをせつめいします:mondainotokikatawosetsumeishimasu|ともだちのいけんをさいごまでききます:tomodachinoikenwosaigomadekikimasu|しらべたことをずにしてつたえます:shirabetakotowozunishitetsutaemasu|いくつかのほうほうをくらべてえらびます:ikutsukanohouhouwokurabeteerabimasu|じっけんのけっかからりゆうをかんがえます:jikkennokekkakarariyuuwokangaemasu'),
 kana('しらべたしりょうをくらべながらじぶんのいけんをまとめます:shirabetashiryouwokurabenagarajibunnoikenwomatomemasu|ちがうかんがえもたいせつにしてみんなでかいけつさくをさがします:chigaukangaemotaisetsunishiteminnadekaiketsusakuwosagashimasu|しっぱいしたりゆうをふりかえってつぎのちょうせんにいかします:shippaishitariyuuwofurikaettetsuginochousenniikashimasu|かんさつをつづけてきせつによるしぜんのへんかをきろくします:kansatsuwotsuzuketekisetsuniyorushizennohenkawokirokushimasu|ひとつのじょうほうだけでなくいろいろなしりょうをたしかめます:hitotsunojouhoudakedenakuiroironashiryouwotashikamemasu|みらいのまちをかんがえながらちいきのくらしについてはなしあいます:mirainomachiwokangaenagarachiikinokurashinitsuitehanashiaimasu'),
];
export const EXTRA_SENTENCES=clauses.map((pool,stage)=>stage===0?pool:people.flatMap(person=>pool.map(clause=>({text:person.text+clause.text,accepted:[person.accepted[0]+clause.accepted[0],person.text+clause.text]}))));
export const EXTRA_ENGLISH=[
 'ant bee fox owl cup map hat bus egg key jam sky toy box leaf road rain snow tree lake cloud grass beach river'.split(' '),
 ['school','teacher','pencil','notebook','library','classroom','playground','homework','question','answer','morning','afternoon','breakfast','birthday','weekend','flower','mountain','ocean','forest','science','picture','rainbow','village','garden'],
 ['I read a book.','We play outside.','They like music.','I can help you.','We study math.','They visit the library.','I draw a flower.','We clean our desks.','They have new pencils.','I drink water.','We share our ideas.','I walk to school.','They watch the stars.','We practice every day.','I open the window.','We count the trees.','They plant a seed.','I write my name.','We work as a team.','They find a new path.'],
 ['I','We','They'].flatMap(subject=>['can explain the answer clearly.','will prepare for the next lesson.','want to learn about the ocean.','can compare two different ideas.','will visit the museum tomorrow.','practice typing after school.','enjoy reading adventure stories.','try a new way to solve the problem.'].map(clause=>`${subject} ${clause}`)),
 ['I','We','They'].flatMap(subject=>['can improve with careful practice and a little patience.','will compare the results before making a final decision.','want to understand why the seasons change each year.','can work together to design a better town for everyone.','will share the information collected during the experiment.','can explain a difficult idea by using a simple example.','want to explore how technology helps people in daily life.','will check several sources before writing the final report.'].map(clause=>`${subject} ${clause}`)),
];

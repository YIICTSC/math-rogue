import {build} from 'esbuild';
import fs from 'node:fs/promises';
const result=await build({stdin:{contents:"export * from './src/mini-games/after-school-poker/expansion';export * from './src/mini-games/after-school-poker/rivalTraits';",resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'node'});
const E=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
const english={...E.EXPANSION_ENGLISH},hiragana={...E.EXPANSION_HIRAGANA};
for(const trait of Object.values(E.RIVAL_TRAITS)){
 english[trait.name]=trait.englishName;hiragana[trait.name]=trait.hiraganaName;
 english[E.rivalTraitDescription(trait)]=E.rivalTraitDescription(trait,'ENGLISH');hiragana[E.rivalTraitDescription(trait)]=E.rivalTraitDescription(trait,'HIRAGANA');
}
for(const [ja,en,hi]of [
 ['パックを開封！1つ選ぶ','Pack opened! Choose one.','パックをかいふう！1つえらぶ'],
 ['プレイで選んだカードを出して得点します。すてるはカードを入れ替える操作で、残り捨札数がある時だけ使えます。','PLAY HAND scores selected cards. DISCARD replaces them while discards remain.','プレイでえらんだカードをだしてとくてん。すてるでカードをいれかえる。'],
 ['選ぶ','SELECT','えらぶ'],
]){english[ja]=en;hiragana[ja]=hi;}
await fs.writeFile('src/data/pokerExpansionText.json',JSON.stringify({english,hiragana},null,2)+'\n');
console.log(`Registered ${Object.keys(english).length} poker translations.`);

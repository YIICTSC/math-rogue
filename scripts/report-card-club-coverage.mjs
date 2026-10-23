import {readFile,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const catalog=JSON.parse(await readFile(new URL('src/mini-games/card-club/reference-catalog.json',root),'utf8'));
const code=(await Promise.all(['catalog.ts','popularCatalog.ts','worldCatalog.ts','traditionalCatalog.ts'].map(file=>readFile(new URL('src/mini-games/card-club/'+file,root),'utf8')))).join('\n');
const supported=new Set([...code.matchAll(/\{id:'([^']+)'/g)].map(m=>m[1]));
const lines=[
 '# トランプゲーム集 対応表', '',
 `参照: ${catalog.source}`, '',
 `トランプ分類 ${catalog.games.length}件中、個別ルールを実装したゲーム ${supported.size}件。未対応 ${catalog.games.length-supported.size}件。`, '',
 'この表は「全件対応済み」を意味しません。同じ画面・一般ルールへ未対応ゲームを流す処理はありません。', '',
 '| ゲーム | 分類 | 人数（参照元） | 状況 | 参照ルール |',
 '| --- | --- | --- | --- | --- |',
 ...catalog.games.map(g=>`| ${g.name} | ${g.category} | ${g.players.join(', ')} | ${supported.has(g.id)?'個別実装あり（対応人数・卓ルールはアプリ内に表示）':'未対応'} | [${g.id}](${g.source}) |`), '',
];
await writeFile(new URL('docs/card-club-coverage.md',root),lines.join('\n'));
console.log(`${supported.size}/${catalog.games.length} individual rules implemented`);

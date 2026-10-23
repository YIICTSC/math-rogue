import { writeFile } from 'node:fs/promises';
// Only factual index metadata is imported. Rule prose and artwork are not copied.
const url = 'https://gamefarm.jp/rule/contents.html';
const html = await (await fetch(url)).text();
const match = html.match(/const gameDataJson = `([^`]+)`;/);
if (!match) throw new Error('Card-game index format has changed');
const rows = JSON.parse(match[1]).filter(row => row.cardKind === 'トランプ');
const seen = new Map();
const games = rows.map(row => {
  const base = row.url.replace(/\.(html?|php).*$/, '').replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  const n = (seen.get(base) || 0) + 1; seen.set(base, n);
  return { id: n === 1 ? base : `${base}-${n}`, name: row.name, english: row.realName,
    category: row.kindName1, subcategory: row.kindName2, players: row.playerNo,
    recommended: row.goodPlayerNo, cards: row.cardNo, difficulty: row.difficulty,
    source: new URL(row.url, url).href };
});
await writeFile(new URL('../src/mini-games/card-club/reference-catalog.json', import.meta.url), JSON.stringify({ source:url, importedAt:'2026-10-23', games },null,2)+'\n');
console.log(`Imported ${games.length} playing-card index entries`);

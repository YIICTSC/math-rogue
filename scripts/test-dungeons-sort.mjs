import assert from 'node:assert/strict';import{build}from'esbuild';
const result=await build({entryPoints:['src/components/school-dungeon/sortItems.ts'],bundle:true,write:false,format:'esm',platform:'node'}),{sortDungeonItems}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
const items=[{id:'food',category:'FOOD',label:'Apple'},{id:'unknown',category:'WEAPON',label:'Unknown',hidden:true},{id:'armor',category:'ARMOR',label:'Coat'},{id:'weapon',category:'WEAPON',label:'Blade'},{id:'weapon2',category:'WEAPON',label:'Blade'}],original=items.map(x=>x.id),name=x=>x.label,known=x=>!x.hidden;
assert.deepEqual(sortDungeonItems(items,'type',name,known).map(x=>x.id),['weapon','weapon2','armor','food','unknown']);
assert.deepEqual(sortDungeonItems(items,'name',name,known).map(x=>x.id),['food','weapon','weapon2','armor','unknown']);
assert.deepEqual(items.map(x=>x.id),original,'sorting does not mutate the original list');
assert.equal(sortDungeonItems(items,'type',name,known)[0],items[3],'item identity is preserved');
console.log('PASS: stable category/name ordering, hidden item grouping, original array and item identity.');

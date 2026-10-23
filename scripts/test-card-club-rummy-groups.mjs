import assert from 'node:assert/strict';import fs from 'node:fs/promises';import {build} from 'esbuild';
await fs.mkdir('tmp',{recursive:true});await build({stdin:{contents:"export * from './src/mini-games/card-club/rummyHandGroups';export {isMeld} from './src/mini-games/card-club/rummy';",resolveDir:process.cwd()},outfile:'tmp/rummy-hand-groups.mjs',bundle:true,platform:'node',format:'esm'});
const {automaticHandGroups,retainHandGroups,isMeld}=await import('../tmp/rummy-hand-groups.mjs');
const hand=Object.freeze([0,1,2,13,14,15,26,27,28,35]),groups=automaticHandGroups(hand);assert(groups.length>=2);assert(groups.every(isMeld));assert.equal(new Set(groups.flat()).size,groups.flat().length);assert(groups.flat().every(c=>hand.includes(c)));
assert.deepEqual(retainHandGroups([[0,1,2],[0,13,26],[1,2]],hand),[[0,1,2]]);
assert.deepEqual(retainHandGroups([[0,1,2]],hand.filter(c=>c!==1)),[]);
assert.deepEqual(retainHandGroups([[0,1,2]],[...hand,51]),[[0,1,2]]);
const all=Array.from({length:52},(_,i)=>i),large=automaticHandGroups(all);assert(large.every(isMeld));assert.equal(new Set(large.flat()).size,52);assert.deepEqual(all,Array.from({length:52},(_,i)=>i));
console.log(JSON.stringify({optimalSmallHand:true,largeHandBounded:true,disjoint:true,removedCards:true,drawKeepsGroups:true,immutable:true}));

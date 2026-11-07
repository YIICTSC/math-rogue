import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';
import {build} from 'esbuild';

let counts={},mastered=[],rewards=[];
const storage={getModeCorrectCounts:()=>({...counts}),saveModeCorrectCounts:next=>{counts=next;},saveMasteredModes:next=>{mastered=next;}};
globalThis.__unitTestStorage=storage;
const bundled=await build({entryPoints:['src/services/miniGameUnitProgress.ts'],bundle:true,write:false,format:'esm',platform:'node',plugins:[{name:'storage-fixture',setup(b){b.onResolve({filter:/^\.\/storageService$/},()=>({path:'storage',namespace:'fixture'}));b.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:'export const storageService=globalThis.__unitTestStorage;'}));}}]});
const {recordMiniGameUnitProgress:record,MINI_GAME_UNIT_CORRECT_EVENT:eventName}=await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64'));
// Standalone/embedded games retain per-unit counts even without the App shell.
record({mode:'MATH_A',correct:false});record({mode:'ASSIGNMENT_CUSTOM',correct:true});assert.deepEqual(counts,{});
record({mode:'MATH_A',correct:true,pointReceipt:'standalone-1'});record({mode:'MATH_A',correct:true,pointReceipt:'standalone-1'});assert.equal(counts.MATH_A,1);
record({mode:'MATH_A',correct:true,pointReceipt:'standalone-2'});record({mode:'KANJI_B',correct:true});assert.deepEqual(counts,{MATH_A:2,KANJI_B:1});

// Execute the actual App counter and event consumer, with React setters backed
// by synchronous state, to verify the existing 100-answer mastery reward path.
const app=await fs.readFile('src/App.tsx','utf8');const source=ts.createSourceFile('App.tsx',app,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
function declaration(name){let found;function visit(node){if(ts.isVariableDeclaration(node)&&node.name.getText(source)===name)found=node;ts.forEachChild(node,visit);}visit(source);assert(found,name);return 'const '+found.getText(source)+';';}
const context={gameState:{rpgOnline:false,challengeMode:'NORMAL'},modeCorrectCounts:{MATH_A:99},masteredModes:[],PAID_EDITION:false,isTypingMasteryMode:()=>false,storageService:storage};
let currentCounts=context.modeCorrectCounts,currentMastered=context.masteredModes;
context.modeCorrectProgressRef={current:{counts:currentCounts,mastered:currentMastered}};
context.setModeCorrectCounts=next=>{currentCounts=typeof next==='function'?next(currentCounts):next;};context.setMasteredModes=next=>{currentMastered=typeof next==='function'?next(currentMastered):next;};context.setMasteryRewardModal=value=>rewards.push(value);
const code=declaration('handleModeCorrectProgress')+'\n'+declaration('onMiniGameUnitCorrect')+'\nglobalThis.consumer=onMiniGameUnitCorrect;';
vm.runInNewContext(ts.transpileModule(code,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,context);
globalThis.window=new EventTarget();globalThis.CustomEvent=class extends Event{constructor(type,{detail}){super(type);this.detail=detail;}};
window.addEventListener(eventName,context.consumer);
record({mode:'MATH_A',correct:true,pointReceipt:'app-1'});assert.equal(currentCounts.MATH_A,100);assert.equal(counts.MATH_A,100);assert.equal(rewards.length,1);assert.equal(mastered[0],'MATH_A');
record({mode:'MATH_A',correct:true,pointReceipt:'app-1'});assert.equal(counts.MATH_A,100);
record({mode:'MATH_A',correct:true,pointReceipt:'app-2'});assert.equal(counts.MATH_A,101);assert.equal(rewards.length,1);
record({mode:'ENGLISH_C',correct:true});assert.equal(counts.ENGLISH_C,1);assert.equal(counts.MATH_A,101);
record({mode:'MATH_A',correct:false});assert.equal(counts.MATH_A,101);
for(const path of ['src/components/MiniGameProblemChallenge.tsx','src/mini-games/gakuro-kart/GakuroKart.tsx','src/mini-games/gakurogear/Quiz.tsx','src/mini-games/gakurogear/BombQuiz.tsx','src/mini-games/gakuro-craft/FurnitureLearningPanel.tsx','src/mini-games/gakuro-craft/GakuroCraft.tsx'])assert.match(await fs.readFile(path,'utf8'),/recordMiniGameUnitProgress\(/,path);
assert.match(app,/SportsHub onAnswerResult=\{result=>.*handleModeCorrectProgress\(result.mode,1\)/);
assert.equal(context.modeCorrectCounts.MATH_A,99,'Test keeps the original React render snapshot while delivering multiple answers');
assert.equal(currentCounts.MATH_A,101);
console.log('PASS mini-game unit attribution, mixed units, wrong/custom exclusion, duplicate receipt protection, standalone persistence, App single counting and 100-answer mastery reward.');
delete globalThis.window;delete globalThis.__unitTestStorage;

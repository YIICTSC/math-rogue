import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {stat} from 'node:fs/promises';
const server=await createServer({server:{middlewareMode:true},appType:'custom',logLevel:'error'});
try{const {gameAudioEvents,DOZER_SOUNDS}=await server.ssrLoadModule('/src/mini-games/gakuro-craft/gameAudio.ts');
 const base={key:'a',kind:'coindozer',phase:'playing',coinStage:1,coinPhase:'playing',coinDrops:1,coinScore:10,coinVault:1,coinCombo:1,coinPulses:2,matches:0};
 for(const[change,cue]of [[{coinDrops:2},'dozer-drop'],[{coinScore:20,coinVault:2},'dozer-collect'],[{coinScore:80,coinVault:7},'dozer-gem'],[{coinScore:80,coinCombo:8},'dozer-shower'],[{coinPulses:1},'dozer-pulse'],[{coinPhase:'choice'},'dozer-clear']]){const next={...base,...change};assert(gameAudioEvents(base,next).includes(cue));assert.deepEqual(gameAudioEvents(next,next),[]);}
 assert.deepEqual(gameAudioEvents(base,{...base,coinStage:2,coinPulses:2,coinPhase:'playing'}),['start']);
 for(const cue of Object.keys(DOZER_SOUNDS))for(const path of [`public/sfx/rpg-games/${cue}.mp3`,`public/web-audio/sfx/rpg-games/${cue}.ogg`])assert((await stat(path)).size>500,path);
 console.log('PASS: six coin-dozer cues, event deduplication, stage transition and MP3/Opus assets.');
}finally{await server.close();}

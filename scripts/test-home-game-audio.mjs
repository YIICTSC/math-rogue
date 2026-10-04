import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createServer} from 'vite';
const server=await createServer({cacheDir:'node_modules/.vite-game-audio-test',optimizeDeps:{noDiscovery:true,entries:[]},server:{middlewareMode:true},appType:'custom',logLevel:'error'});
try{
 const {HOBBY_SOUNDS,GAME_SOUND_BANK,gameAudioSnapshot:snapshot,gameAudioEvents:events}=await server.ssrLoadModule('/src/mini-games/gakuro-craft/gameAudio.ts');
 const {gameCommand,tickGames}=await server.ssrLoadModule('/src/mini-games/gakuro-craft/homeGames.ts');
 const kinds=Object.keys(GAME_SOUND_BANK);assert.equal(kinds.length,10);assert.equal(Object.keys(HOBBY_SOUNDS).length,29);
 for(const [cue,duration] of Object.entries(HOBBY_SOUNDS))for(const [directory,ext] of [['sfx','mp3'],['web-audio/sfx','ogg']]){
  const path=`public/${directory}/rpg-games/${cue}.${ext}`;assert.ok(fs.statSync(path).size>300);
  const d=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','format=duration:stream=codec_name,channels','-of','json',path],{encoding:'utf8'}));assert.ok(Number(d.format.duration)>0&&Number(d.format.duration)<duration/1000+.12,path);assert.equal(d.streams[0].channels,1);
 }
 const fixture=kind=>{const home={tile:9,level:1,furniture:[{slot:2,item:kind}]},w={tiles:[],homeViews:{9:home},players:{},games:{},time:10,paused:false};w.tiles[9]={homeOwner:'p0'};for(let i=0;i<4;i++){const id='p'+i;w.players[id]={id,name:id,indoors:true,homeTile:9,progress:{home}};gameCommand(w,w.players[id],{type:'game_join',slot:2});}const g=w.games['9:2'];return {w,g,send:c=>gameCommand(w,w.players.p0,{key:g.key,round:g.round,...c})};};
 for(const kind of kinds){const {w,g,send}=fixture(kind);const lobby=snapshot(g,'p0');if(kind==='rhythm')for(let i=0;i<4;i++)gameCommand(w,w.players['p'+i],{type:'game_rhythm_ready',key:g.key,song:g.rhythm.song,difficulty:g.rhythm.difficulty,length:g.rhythm.length,ready:true});send({type:'game_start'});assert.ok(events(lobby,snapshot(g,'p0')).includes('start'));let before=snapshot(g,'p0');assert.deepEqual(events(undefined,before),[]);w.time+=.01;g.revision++;assert.deepEqual(events(before,snapshot(g,'p0')),[],kind+' must not beep on world/revision ticks');
  if(kind==='darts'){send({type:'game_dart',x:0,y:0});assert.ok(events(before,snapshot(g,'p0')).includes('dart-bull'));}
  if(kind==='billiards'){send({type:'game_shot',angle:0,power:.8});assert.ok(events(before,snapshot(g,'p0')).includes('pool-cue'));before=snapshot(g,'p0');g.pool.firstHit=1;g.pool.balls[1].potted=true;const e=events(before,snapshot(g,'p0'));assert.ok(e.includes('pool-hit')&&e.includes('pool-pocket'));}
  if(kind==='bowling'){send({type:'game_bowl',aim:0,power:1,spin:0});assert.ok(events(before,snapshot(g,'p0')).includes('bowl-roll'));before=snapshot(g,'p0');w.time+=1.8;tickGames(w,.05);assert.ok(events(before,snapshot(g,'p0')).includes('bowl-strike'));}
  if(kind==='memory'){send({type:'game_board',cell:0});assert.ok(events(before,snapshot(g,'p0')).includes('card-flip'));}
  if(kind==='connectfour'){send({type:'game_board',cell:0});assert.ok(events(before,snapshot(g,'p0')).includes('coin-drop'));}
  if(kind==='reversi'){const {legalReversi,boardColor}=await server.ssrLoadModule('/src/mini-games/gakuro-craft/partyGames.ts');send({type:'game_board',cell:legalReversi(g.party.board,boardColor(g,0))[0]});assert.ok(events(before,snapshot(g,'p0')).includes('board-flip'));}
  if(kind==='race'){send({type:'game_roll',style:'safe'});assert.ok(events(before,snapshot(g,'p0')).includes('dice'));}
  if(kind==='reaction'){w.time=g.party.signal.at+.1;send({type:'game_react',target:g.party.signal.target});assert.ok(events(before,snapshot(g,'p0')).includes('react-good'));assert.deepEqual(events(before,snapshot(g,'p1')),[],'another player reaction must not sound as our success');}
  if(kind==='arcade'){g.courts[1].bricks[0]=0;assert.deepEqual(events(before,snapshot(g,'p0')),[],'remote court must not produce local impact sounds');g.courts[0].bricks[0]=0;assert.ok(events(before,snapshot(g,'p0')).includes('brick-hit'));}
  before=snapshot(g,'p0');g.phase='finished';g.winner=[0];assert.ok(events(before,snapshot(g,'p0')).includes('win'));assert.ok(events({...before,won:false},snapshot(g,'p1')).includes('lose'));assert.deepEqual(events(snapshot(g,'p0'),snapshot(g,'p0')),[]);
 }
 console.log('Game audio passed: ten games, actual authoritative action events, silent ticks/repeats/remote actions, 29 MP3 + 29 Opus mono assets with duration validation.');
}finally{await server.close();}

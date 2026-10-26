import React, {useEffect, useMemo, useRef, useState} from 'react';
import {MINI_GAMES} from '../miniGameConfig';
import {PROTAGONISTS} from '../three/protagonistCatalog';
import {ABYSS_HEROES} from './school-dungeon/dungeons2/roster';
import {drawStudentSprite} from './school-dungeon/student/sprites';
import {cueStudentAction, clearStudentAction, type StudentAction} from './school-dungeon/dungeons1/heroActions';
import {assetUrl} from '../utils/assetPaths';
import index from '../generated/miniGameMediaIndex.json';
import TranslatedUiTree from './TranslatedUiTree';
import type {LanguageMode} from '../types';

// These are source banks, not newly generated/reinterpreted animations.
const sharedVoice = /sfx\/(high-school-voices|magic-voices)\//;
const gameImages: Record<string,RegExp> = {
 DUNGEON:/sprites\/(wandering-student|dungeons1)\//,
 DUNGEON_2:/sprites\/dungeons2\//,
 SURVIVOR:/sprites\/wandering-student\//,
 GO_HOME:/sprites\/go-home-dash\/(heroes|slides)\//,
 POKER:/sprites\/after-school-poker\/portraits\//,
 CARD_CLUB:/sprites\/after-school-poker\/portraits\//,
 KOCHO:/sprites\/(kocho\/(original|rebel|akari|super-)|kocho-hero-actions-)/,
 STAR_TIDE:/sprites\/star-tide\/(?:atlas|hero-)/,
 PAPER_PLANE:/sprites\/paper-plane\/pilots/,
 GAKURO:/sprites\/(gakuro-vr|gakurogear)\//,
 SCHOOL_TRPG:/sprites\/school-trpg\//,
 STONE_GLOW:/sprites\/stone-glow\//,
};
const gameVoices: Record<string,RegExp> = {
 DUNGEON:/sfx\/(dungeons1-techniques|dungeons-chronicles|high-school-voices|magic-voices)\//,
 DUNGEON_2:/sfx\/dungeons2-voices\//,
 SURVIVOR:sharedVoice, POKER:sharedVoice,
 CARD_CLUB:/sfx\/card-club-voices\//, GO_HOME:/sfx\/go-home-dash\//,
 KOCHO:/sfx\/kocho-(voices|super-voices)\//,
 PAPER_PLANE:/sfx\/paper-plane-voices\//, GAKURO:/sfx\/gakuro-vr\//,
};
const directions = [
 ['下',0,1],['上',0,-1],['右',1,0],['左',-1,0],
 ['右下',1,1],['左下',-1,1],['右上',1,-1],['左上',-1,-1],
] as const;
const actions: [StudentAction | 'idle',string][] = [
 ['idle','待機'],['walk','歩く'],['attack','攻撃'],['throw','投げる'],
 ['swing','振る'],['read','読む'],['use','使う'],['shoot','撃つ'],
];
export function mediaGrid(path:string): [number,number] {
 if (/dungeons2\/animations\//.test(path)) return [8,16];
 if (/dungeons1\/actions\//.test(path)) return [8,8];
 if (/wandering-student\/|dungeons2\/.*-directions\.|go-home-dash\/heroes\//.test(path)) return [4,2];
 if (/go-home-dash\/slides\//.test(path)) return [2,1];
 if (/after-school-poker\/portraits\//.test(path)) return [6,1];
 if (/star-tide\/hero-nagi-walk/.test(path)) return [12,4];
 if (/star-tide\/hero-nagi-profile/.test(path)) return [8,2];
 if (/star-tide\/hero-nagi-combo/.test(path)) return [7,8];
 if (/star-tide\/hero-nagi-tools/.test(path)) return [7,9];
 if (/star-tide\/hero-/.test(path)) return [6,/-vertical\./.test(path)?4:8];
 if (/star-tide\/atlas/.test(path)) return [8,8];
 if (/kocho-hero-actions-/.test(path)) return [5,5];
 return [1,1];
}
export function mediaMatchesHero(path:string, hero:string) {
 if (!hero) return true;
 if (hero==='original'&&/kocho-hero-actions-/.test(path)) return true;
 if (path.includes(hero)) return true;
 const key=hero.replace(/^dungeons2-/, '');
 if (hero.startsWith('dungeons2-')) return path.includes(`/dungeons2/${key}-`) || path.includes(`/animations/${key}.`) || path.includes(`/animations/${key}-`) || path.includes(`/dungeons2-voices/${key}/`);
 const bank=hero.startsWith('high-school-')?'high-school-voices':hero.startsWith('magic-')?'magic-voices':'';
 const voice=hero.replace(/^high-school-|^magic-/,'').toUpperCase();
 return Boolean(bank && path.includes(`/${bank}/${voice}/`));
}

function DungeonStage({hero,direction,transformed,action,revision}:{hero:string;direction:number;transformed:boolean;action:StudentAction|'idle';revision:number}) {
 const canvas=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  clearStudentAction(hero);
  if(action!=='idle') cueStudentAction(hero,action);
  let raf=0;
  const draw=()=>{
   const ctx=canvas.current?.getContext('2d');
   if(ctx){ctx.clearRect(0,0,320,320);const [,x,y]=directions[direction];drawStudentSprite(ctx,hero,{x,y},72,96,176,transformed);}
   raf=requestAnimationFrame(draw);
  };
  draw();
  return()=>{cancelAnimationFrame(raf);clearStudentAction(hero);};
 },[hero,direction,transformed,action,revision]);
 return <canvas aria-label="Motion preview" ref={canvas} width={320} height={320} style={{width:'100%',maxWidth:320,imageRendering:'pixelated'}}/>;
}

function AssetStage({path,languageMode}:{path:string;languageMode:LanguageMode}) {
 const [columns,setColumns]=useState(()=>mediaGrid(path)[0]);
 const [rows,setRows]=useState(()=>mediaGrid(path)[1]);
 const [frame,setFrame]=useState(0),[playing,setPlaying]=useState(false),[full,setFull]=useState(false);
 const [image,setImage]=useState<HTMLImageElement|null>(null),[failed,setFailed]=useState(false);
 const canvas=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  const img=new Image();let live=true;
  img.onload=()=>{if(live)setImage(img);};img.onerror=()=>{if(live)setFailed(true);};img.src=assetUrl(path);
  return()=>{live=false;img.onload=null;img.onerror=null;};
 },[path]);
 useEffect(()=>{if(!playing)return;const timer=window.setInterval(()=>setFrame(f=>(f+1)%(columns*rows)),160);return()=>clearInterval(timer);},[playing,columns,rows]);
 useEffect(()=>{
  const ctx=canvas.current?.getContext('2d');if(!ctx)return;ctx.clearRect(0,0,320,320);
  if(!image)return;const w=image.naturalWidth/columns,h=image.naturalHeight/rows,scale=Math.min(300/w,300/h),f=frame%(columns*rows);
  ctx.imageSmoothingEnabled=false;ctx.drawImage(image,f%columns*w,Math.floor(f/columns)*h,w,h,(320-w*scale)/2,(320-h*scale)/2,w*scale,h*scale);
 },[image,columns,rows,frame,full]);
 return <TranslatedUiTree mode={languageMode}><div className="space-y-3">
  <div className="flex flex-wrap gap-3 items-center">
   <label><input type="checkbox" checked={full} onChange={e=>setFull(e.target.checked)}/> シート全体</label>
   <label>列数 <input aria-label="列数" type="number" min={1} max={64} value={columns} onChange={e=>{setColumns(Math.max(1,Math.min(64,Number(e.target.value)||1)));setFrame(0);}} className="w-16 bg-gray-800 p-1"/></label>
   <label>行数 <input aria-label="行数" type="number" min={1} max={64} value={rows} onChange={e=>{setRows(Math.max(1,Math.min(64,Number(e.target.value)||1)));setFrame(0);}} className="w-16 bg-gray-800 p-1"/></label>
  </div>
  <div className="bg-slate-950 border border-slate-600 rounded-xl min-h-64 flex justify-center items-center p-3">
   {failed?<p role="alert">読み込み失敗</p>:full?<img src={assetUrl(path)} alt={path} className="max-h-96 max-w-full object-contain"/>:<canvas aria-label="コマ確認" ref={canvas} width={320} height={320} style={{width:'100%',maxWidth:320,imageRendering:'pixelated'}}/>}
  </div>
  <div className="flex flex-wrap items-center gap-3">
   <button className="px-4 py-2 bg-cyan-900 rounded" onClick={()=>setPlaying(p=>!p)}>{playing?'停止':'連続再生'}</button>
   <button className="px-4 py-2 bg-gray-700 rounded" onClick={()=>{setPlaying(false);setFrame(f=>(f+1)%(columns*rows));}}>コマ送り</button>
   <label>コマ <input aria-label="コマ" type="range" min={0} max={columns*rows-1} value={frame} onChange={e=>{setPlaying(false);setFrame(Number(e.target.value));}}/> {frame+1}/{columns*rows}</label>
  </div>
 </div></TranslatedUiTree>;
}

function VoicePlayer({paths,languageMode}:{paths:string[];languageMode:LanguageMode}) {
 const audio=useRef<HTMLAudioElement>(null),[failed,setFailed]=useState(false);
 useEffect(()=>{const player=audio.current;return()=>{if(player){player.pause();player.removeAttribute('src');player.load();}};},[]);
 return <TranslatedUiTree mode={languageMode}><div className="space-y-2">
  <p>音声は下の再生ボタンで確認できます。</p>
  <div className="flex gap-3">
   <button className="px-4 py-2 rounded bg-amber-800" onClick={()=>{setFailed(false);void audio.current?.play().catch(()=>setFailed(true));}}>音声を再生</button>
   <button className="px-4 py-2 rounded bg-gray-700" onClick={()=>{if(audio.current){audio.current.pause();audio.current.currentTime=0;}}}>音声を停止</button>
  </div>
  <audio ref={audio} controls preload="none" aria-label="音声素材" onError={()=>setFailed(true)} style={{width:'100%'}}>
   {paths.map(p=><source key={p} src={assetUrl(p)} type={p.endsWith('.mp3')?'audio/mpeg':p.endsWith('.wav')?'audio/wav':'audio/ogg'}/>)}
  </audio>
  {failed&&<p role="alert" className="text-red-300">読み込み失敗</p>}
  <code className="text-xs break-all block text-slate-300">{paths.join(' / ')}</code>
 </div></TranslatedUiTree>;
}

export default function MiniGameHeroMediaPreview({languageMode='JAPANESE'}:{languageMode?:LanguageMode}) {
 const [game,setGame]=useState('DUNGEON_2'),[hero,setHero]=useState('dungeons2-lyria'),[search,setSearch]=useState('');
 const [direction,setDirection]=useState(2),[transformed,setTransformed]=useState(false),[action,setAction]=useState<StudentAction|'idle'>('idle'),[revision,setRevision]=useState(0);
 const [imageSelection,setImageSelection]=useState(''),[voiceSelection,setVoiceSelection]=useState('');
 const dungeon=game==='DUNGEON'||game==='DUNGEON_2';
 const candidates=game==='DUNGEON_2'?ABYSS_HEROES:game==='KOCHO'?
  [{id:'original',name:'赤ジャージの勇者'},{id:'rebel',name:'叛逆の高校生'},{id:'akari',name:'星宮あかり'}]:
  game==='ALL'?[...PROTAGONISTS,...ABYSS_HEROES]:PROTAGONISTS;
 const heroes=candidates.filter(h=>index.images.some(p=>(game==='ALL'||gameImages[game]?.test(p))&&mediaMatchesHero(p,h.id)));
 const images=useMemo(()=>index.images.filter(p=>(game==='ALL'||Boolean(gameImages[game]?.test(p)))&&mediaMatchesHero(p,hero)&&p.toLowerCase().includes(search.toLowerCase())),[game,hero,search]);
 const voices=useMemo(()=>{
  const groups=new Map<string,string[]>();
  for(const p of index.audio){if(!(game==='ALL'||gameVoices[game]?.test(p))||!mediaMatchesHero(p,hero)||!p.toLowerCase().includes(search.toLowerCase()))continue;
   const key=p.replace(/\.(ogg|mp3|wav)$/,'');groups.set(key,[...(groups.get(key)||[]),p]);}
  return [...groups].map(([key,paths])=>({key,paths:paths.sort((a,b)=>(a.endsWith('.mp3')?-1:1)-(b.endsWith('.mp3')?-1:1))}));
 },[game,hero,search]);
 const image=images.includes(imageSelection)?imageSelection:images[0];
 const voice=voices.find(v=>v.key===voiceSelection)||voices[0];
 const selectGame=(value:string)=>{setGame(value);setHero(value==='DUNGEON_2'?'dungeons2-lyria':value==='DUNGEON'?'elementary-warrior':'');setSearch('');setAction('idle');setTransformed(false);setImageSelection('');setVoiceSelection('');};
 const selectClass='block w-full min-w-0 mt-1 p-2 rounded bg-gray-800 border border-gray-600';
 return <TranslatedUiTree mode={languageMode}><section className="text-gray-100 space-y-5 p-3 md:p-5" data-testid="minigame-hero-media">
  <h2 className="text-xl font-bold text-cyan-200">動作・音声確認</h2>
  <p className="text-sm text-gray-300">素材一覧はファイル名で検索できます。盤面・3D主体のゲームは専用スプライトがない場合があります。</p>
  <div className="grid md:grid-cols-3 gap-3">
   <label>ゲーム<select aria-label="ゲーム" className={selectClass} value={game} onChange={e=>selectGame(e.target.value)}><option value="ALL">全素材</option>{MINI_GAMES.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select></label>
   <label>主人公<select aria-label="主人公" className={selectClass} value={hero} onChange={e=>{setHero(e.target.value);setAction('idle');setTransformed(false);}}><option value="">全素材</option>{heroes.map(h=><option key={h.id} value={h.id}>{h.name}</option>)}</select></label>
   <label>検索<input aria-label="検索" className={selectClass} value={search} onChange={e=>setSearch(e.target.value)}/></label>
  </div>
  {dungeon&&hero&&<div className="grid md:grid-cols-2 gap-4 rounded-xl border border-cyan-800 p-3 bg-slate-900">
   <div className="flex justify-center bg-slate-950 rounded-xl"><DungeonStage hero={hero} direction={direction} transformed={transformed} action={action} revision={revision}/></div>
   <div className="space-y-3">
    <p className="text-sm">実ゲームと同じ描画で、動作終了後の立ち姿まで確認できます。</p>
    <label>向き<select aria-label="向き" value={direction} className={selectClass} onChange={e=>setDirection(Number(e.target.value))}>{directions.map(([name],i)=><option key={name} value={i}>{name}</option>)}</select></label>
    <label>動作<select aria-label="動作" className={selectClass} value={action} onChange={e=>{setAction(e.target.value as StudentAction|'idle');setRevision(r=>r+1);}}>{actions.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>
    {(game==='DUNGEON_2'||hero.startsWith('magic-'))&&<label className="block"><input type="checkbox" checked={transformed} onChange={e=>setTransformed(e.target.checked)}/> 変身後</label>}
    <button className="px-4 py-2 bg-cyan-800 rounded mr-2" onClick={()=>setRevision(r=>r+1)}>動作を再生</button>
    <button className="px-4 py-2 bg-gray-700 rounded" onClick={()=>setAction('idle')}>停止して立ち姿に戻す</button>
   </div>
  </div>}
  <div className="grid lg:grid-cols-2 gap-5">
   <div className="space-y-3 min-w-0"><h3 className="font-bold text-cyan-200"><span>画像素材</span> ({images.length})</h3>
    {image?<><select aria-label="画像素材" className={selectClass} value={image} onChange={e=>setImageSelection(e.target.value)}>{images.map(p=><option key={p} value={p}>{p}</option>)}</select><AssetStage key={image} path={image} languageMode={languageMode}/><code className="text-xs break-all block text-slate-300">{image}</code></>:<p>専用素材なし。共通主人公の素材は全素材から確認できます。</p>}
   </div>
   <div className="space-y-3 min-w-0"><h3 className="font-bold text-amber-200"><span>音声素材</span> ({voices.length})</h3>
    {voice?<><select aria-label="音声素材" className={selectClass} value={voice.key} onChange={e=>setVoiceSelection(e.target.value)}>{voices.map(v=><option key={v.key} value={v.key}>{v.key}</option>)}</select><VoicePlayer key={`${game}/${hero}/${voice.key}`} paths={voice.paths} languageMode={languageMode}/></>:<p>専用素材なし。共通主人公の素材は全素材から確認できます。</p>}
   </div>
  </div>
 </section></TranslatedUiTree>;
}

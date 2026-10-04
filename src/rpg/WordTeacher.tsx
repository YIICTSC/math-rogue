import React,{useState} from 'react';
import type {World,Action} from './engine';
import type {LanguageMode} from '../types';
import {WORD_GENRES,validLearnedWord,type WordGenre} from './learnedWords';
export default function WordTeacher({world,target,send,languageMode,disabled=false}:{world:World;target:string;send:(a:Action)=>void;languageMode:LanguageMode;disabled?:boolean}){
 const [text,setText]=useState(''),[reading,setReading]=useState(''),[genre,setGenre]=useState<WordGenre>('greeting');
 const L=(ja:string,en:string,hi:string)=>languageMode==='ENGLISH'?en:languageMode==='HIRAGANA'?hi:ja;
 const words=world.town?.people[target]?.words||[],word={text,reading,genre},existing=words.some(w=>w.text===text.trim());
 return <article className="town-card rpg-word-teacher"><h3>{L('言葉を教える','Teach words','ことばをおしえる')}</h3><p>{L('言葉・会話ジャンル・よみがなをセットで32個まで覚えます。同じ言葉を教えると内容を更新します。','Teach up to 32 words with a topic and pronunciation. Teaching the same word updates it.','ことば・かいわじゃんる・よみがなをせっとで32こまでおぼえます。おなじことばをおしえるとないようをこうしんします。')}</p><form onSubmit={e=>{e.preventDefault();if(!disabled&&validLearnedWord(word)&&(existing||words.length<32)){send({type:'town-word-teach',target,word});setText('');setReading('');}}}>
 <label>{L('覚える言葉','Word or phrase','おぼえることば')}<input aria-label={L('覚える言葉','Word or phrase','おぼえることば')} value={text} maxLength={48} onChange={e=>setText(e.target.value)} required/></label>
 <label>{L('よみがな（機械音声用）','Pronunciation in kana (speech)','よみがな（きかいおんせいよう）')}<input aria-label={L('よみがな（機械音声用）','Pronunciation in kana (speech)','よみがな（きかいおんせいよう）')} value={reading} maxLength={96} onChange={e=>setReading(e.target.value)} placeholder={L('例：いっしょにぼうけんしよう','Enter kana pronunciation','れい：いっしょにぼうけんしよう')} required/></label>
 <label>{L('だいたいの意味・会話ジャンル','Meaning / conversation topic','だいたいのいみ・かいわじゃんる')}<select aria-label={L('だいたいの意味・会話ジャンル','Meaning / conversation topic','だいたいのいみ・かいわじゃんる')} value={genre} onChange={e=>setGenre(e.target.value as WordGenre)}>{WORD_GENRES.map(g=><option key={g[0]} value={g[0]}>{g[languageMode==='ENGLISH'?2:languageMode==='HIRAGANA'?3:1]}</option>)}</select></label>
 {!!reading&&!validLearnedWord(word)&&<small>{L('よみがなは、ひらがな・カタカナで入力してください。','Enter the pronunciation in hiragana or katakana.','よみがなは、ひらがな・かたかなでにゅうりょくしてください。')}</small>}
 <button disabled={disabled||!validLearnedWord(word)||!existing&&words.length>=32}>{L(existing?'言葉を更新':'言葉を教える',existing?'Update word':'Teach word',existing?'ことばをこうしん':'ことばをおしえる')}</button></form>
 <p>{words.length}/32</p><div className="rpg-memory-phrases">{words.map(w=><div key={w.text}><strong>{w.text}</strong><small> {w.reading} · {WORD_GENRES.find(g=>g[0]===w.genre)?.[languageMode==='ENGLISH'?2:languageMode==='HIRAGANA'?3:1]}</small><button type="button" disabled={disabled} aria-label={L('この言葉を忘れる','Forget this word','このことばをわすれる')} onClick={()=>send({type:'town-word-forget',target,text:w.text})}>×</button><button type="button" disabled={disabled} onClick={()=>{setText(w.text);setReading(w.reading);setGenre(w.genre);}}>{L('編集','Edit','へんしゅう')}</button></div>)}</div></article>;
}

import React from 'react';
import { ACCESSORIES, avatarOf, EXPRESSIONS, FURS, HAIR, HAIRSTYLES, HATS, KINDS, OUTFITS, PANTS, SHIRTS, SKINS, type Avatar } from './avatar';
import { avatarSvg } from './avatarSprite';

export default function AvatarCreator({value,onChange,t}:{value:Avatar;onChange:(a:Avatar)=>void;t:(s:string)=>string}){
  const a=avatarOf(value);
  const choose=(key:keyof Avatar,index:number)=>onChange({...a,[key]:index,...(key==='kind'?{fur:[0,0,3,1,0,2,1,6,6][index]}:{})});
  const swatches=(key:keyof Avatar,label:string,colors:string[])=><fieldset className="gc-avatar-colors"><legend>{t(label)}</legend><div className="gc-swatches">{colors.map((c,i)=><button key={c} aria-label={`${t(label)} ${i+1}`} aria-pressed={a[key]===i} style={{background:c}} onClick={()=>choose(key,i)}>{a[key]===i?'✓':''}</button>)}</div></fieldset>;
  const options=(key:keyof Avatar,label:string,rows:string[])=><label className="gc-avatar-select">{t(label)}<select aria-label={t(label)} value={a[key]} onChange={e=>choose(key,Number(e.target.value))}>{rows.map((s,i)=><option key={s} value={i}>{t(s)}</option>)}</select></label>;
  return <div className="gc-avatar-editor">
    <div className="gc-avatar-preview"><div role="img" aria-label={t('キャラクタープレビュー')} dangerouslySetInnerHTML={{__html:avatarSvg(a)}}/><b>{t(KINDS[a.kind])}</b><small>{t(OUTFITS[a.style])} · {t(EXPRESSIONS[a.expression])}</small><button onClick={()=>onChange(avatarOf({kind:Math.floor(Math.random()*KINDS.length),skin:Math.floor(Math.random()*SKINS.length),hair:Math.floor(Math.random()*HAIR.length),shirt:Math.floor(Math.random()*SHIRTS.length),pants:Math.floor(Math.random()*PANTS.length),fur:Math.floor(Math.random()*FURS.length),hairstyle:Math.floor(Math.random()*HAIRSTYLES.length),expression:Math.floor(Math.random()*EXPRESSIONS.length),style:Math.floor(Math.random()*OUTFITS.length),hat:Math.floor(Math.random()*HATS.length),accessory:Math.floor(Math.random()*ACCESSORIES.length)}))}>{t('おまかせ')}</button></div>
    <div className="gc-avatar-settings"><fieldset><legend>{t('キャラクターの種類')}</legend><div className="gc-species">{KINDS.map((s,i)=><button key={s} aria-pressed={a.kind===i} onClick={()=>choose('kind',i)}><span aria-hidden="true">{['🧑','🐱','🐶','🐰','🦊','🐻','🐼','🐦','🐸'][i]}</span>{t(s)}</button>)}</div></fieldset>
      <div className="gc-avatar-selects">{!a.kind&&options('hairstyle','髪型',HAIRSTYLES)}{options('expression','表情',EXPRESSIONS)}{options('style','服の形',OUTFITS)}{options('hat','帽子',HATS)}{options('accessory','小物',ACCESSORIES)}</div>
      {a.kind?swatches('fur','毛色',FURS):<>{swatches('skin','肌',SKINS)}{swatches('hair','髪',HAIR)}</>}{swatches('shirt','服',SHIRTS)}{swatches('pants','ズボン',PANTS)}
    </div>
  </div>;
}

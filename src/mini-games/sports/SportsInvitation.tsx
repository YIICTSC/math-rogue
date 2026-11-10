import SportMenuIcon from './SportMenuIcon';
import React from 'react';
import type {LanguageMode} from '../../types';
import {trans} from '../../utils/textUtils';
import InviteJoin from '../shared/InviteJoin';

export type Sport='tennis'|'golf'|'dodgeball'|'basketball'|'baseball'|'soccer'|'volleyball'|'festival';
export default function SportsInvitation({debugEnabled=false,languageMode,sport,onSport,name,onName,code,onCode,onJoin,onClose}:{debugEnabled?:boolean;languageMode:LanguageMode;sport:Sport|null;onSport:(sport:Sport)=>void;name:string;onName:(name:string)=>void;code:string;onCode:(code:string)=>void;onJoin:()=>void;onClose:()=>void}){
 const t=(s:string)=>trans(s,languageMode);
 return <InviteJoin title={t('スポーツクラブ')} className="sports-invitation" closeLabel={t('スポーツへ戻る')} languageMode={languageMode} name={name} onName={onName} code={code} onCode={onCode} codeInputMode="text" onJoin={onJoin} onClose={onClose} joinDisabled={!sport} busy={false} error="">
  <fieldset className="sports-invite-sports"><legend>{t('招待された種目')}</legend><div role="radiogroup" aria-label={t('招待された種目')}>{([['tennis','テニス'],['golf','ゴルフ'],['dodgeball','ドッジボール'],['basketball','バスケットボール'],['baseball','野球'],['soccer','サッカー'],['volleyball','バレーボール'],['festival','大運動会']] as const).filter(([id])=>debugEnabled||['tennis','golf','dodgeball','basketball'].includes(id)).map(([id,label])=><button key={id} type="button" role="radio" aria-checked={sport===id} onClick={()=>onSport(id)}><SportMenuIcon sport={id}/><span>{t(label)}</span></button>)}</div></fieldset>
 </InviteJoin>;
}

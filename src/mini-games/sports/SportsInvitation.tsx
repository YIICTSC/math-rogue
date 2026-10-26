import React from 'react';
import type {LanguageMode} from '../../types';
import {trans} from '../../utils/textUtils';
import InviteJoin from '../shared/InviteJoin';

export type Sport='tennis'|'golf'|'dodgeball';
export default function SportsInvitation({languageMode,sport,onSport,name,onName,code,onCode,onJoin,onClose}:{languageMode:LanguageMode;sport:Sport|null;onSport:(sport:Sport)=>void;name:string;onName:(name:string)=>void;code:string;onCode:(code:string)=>void;onJoin:()=>void;onClose:()=>void}){
 const t=(s:string)=>trans(s,languageMode);
 return <InviteJoin title={t('スポーツクラブ')} className="sports-invitation" closeLabel={t('スポーツへ戻る')} languageMode={languageMode} name={name} onName={onName} code={code} onCode={onCode} codeInputMode="numeric" onJoin={onJoin} onClose={onClose} joinDisabled={!sport} busy={false} error="">
  <fieldset className="sports-invite-sports"><legend>{t('招待された種目')}</legend><div role="radiogroup" aria-label={t('招待された種目')}>{([['tennis','テニス'],['golf','ゴルフ'],['dodgeball','ドッジボール']] as const).map(([id,label])=><button key={id} type="button" role="radio" aria-checked={sport===id} onClick={()=>onSport(id)}>{t(label)}</button>)}</div></fieldset>
 </InviteJoin>;
}

import React from 'react';
import type {LanguageMode} from '../../types';
import type {OnlineTransport} from '../../services/onlineTransport';
export default function TransportPicker({value,onChange,disabled=false,languageMode='JAPANESE'}:{value:OnlineTransport;onChange:(v:OnlineTransport)=>void;disabled?:boolean;languageMode?:LanguageMode}){
 const en=languageMode==='ENGLISH',hi=languageMode==='HIRAGANA';return <fieldset className="online-transport"><legend>{en?'Connection type':hi?'つうしんほうしき':'通信方式'}</legend><div>{(['host','server'] as const).map(v=><button type="button" key={v} disabled={disabled} aria-pressed={value===v} onClick={()=>onChange(v)}>{v==='host'?(en?'Host connection':hi?'ほすとつうしん':'ホスト通信'):(en?'Server connection · beta':hi?'さーばーつうしん・べーた':'サーバー通信 · beta')}</button>)}</div><small>{value==='host'?(en?'For small groups. Keep the host screen open.':hi?'しょうにんずうむけ。ほすとはがめんをひらいたままにします。':'少人数向け。ホストは画面を開いたままにしてください。'):(en?'Experimental. Not recommended for large groups. First startup may take up to 3 minutes.':hi?'しけんうんよう。おおにんずうにはすいしょうしません。しょかいきどうはさいだい3ぷんまちます。':'試験運用中。大人数には推奨しません。初回起動は最大3分待機します。')}</small></fieldset>;
}

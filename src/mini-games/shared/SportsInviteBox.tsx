import React, {useState} from 'react';
import {copyInviteUrl} from './copyInviteUrl';

export default function SportsInviteBox({code, url, t, compact=false}: {code: string; url: string; t: (text: string) => string; compact?:boolean}) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  if(compact)return <div className="sp-invite"><div className="sp-invite-head"><div><span>{t('招待コード')}</span><strong>{code}</strong></div><button onClick={async()=>setStatus(await copyInviteUrl(url)?'copied':'failed')}>{t(status==='copied'?'コピーしました':'招待URLをコピー')}</button></div><details hidden={status!=='failed'} open={status==='failed'}><summary>{t('招待リンク')}</summary><input readOnly aria-label={t('招待リンク')} value={url} onFocus={e=>e.currentTarget.select()}/></details>{status==='failed'&&<p role="alert">{t('リンクを選択してコピーしてください。')}</p>}</div>;
  return <div className="tn-invite">
    <span>{t('招待コード')}</span>
    <strong>{code}</strong>
    <input readOnly aria-label={t('招待リンク')} value={url} onFocus={e => e.currentTarget.select()}/>
    <button onClick={async () => setStatus(await copyInviteUrl(url) ? 'copied' : 'failed')}>
      {t(status === 'copied' ? 'コピーしました' : '招待URLをコピー')}
    </button>
    {status === 'failed' && <p role="alert">{t('リンクを選択してコピーしてください。')}</p>}
  </div>;
}

import React, { useMemo, useState } from 'react';
import qrcode from 'qrcode-generator';
import { Copy, Check, ExternalLink, QrCode } from 'lucide-react';
import type { LanguageMode } from '../types';
import { copy } from './copy';
import { addressText, invitation, type RoomAddress } from './invite';

export function LocalQr({ value, label }: { value: string; label: string }) {
  const qr = useMemo(() => { const q = qrcode(0, 'M'); q.addData(value); q.make(); const n = q.getModuleCount(); let path = ''; for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.isDark(y, x)) path += `M${x + 4},${y + 4}h1v1h-1z`; return { n: n + 8, path }; }, [value]);
  return <svg className="qs-qr" viewBox={`0 0 ${qr.n} ${qr.n}`} role="img" aria-label={label} data-qr-value={value} shapeRendering="crispEdges"><rect width={qr.n} height={qr.n} fill="white" /><path d={qr.path} fill="#000" /></svg>;
}
export default function InvitePanel({ address, language }: { address: RoomAddress; language: LanguageMode }) {
  const t = copy(language), url = invitation(address, language), [copied, setCopied] = useState(false), [expanded, setExpanded] = useState(false), [copyError, setCopyError] = useState(false);
  const doCopy = async () => { try { await navigator.clipboard.writeText(url); setCopied(true); setCopyError(false); setTimeout(() => setCopied(false), 2000); } catch { setCopyError(true); } };
  return <section className={`qs-invite ${expanded ? 'is-expanded' : ''}`} aria-label={t('参加者を招待', 'Invite answerers', 'さんかしゃをしょうたい')}><div><span className="qs-eyebrow">JOIN THE SHOW</span><h3>{t('スマホで、すぐ参加。', 'Your phone is your panel.', 'スマホですぐさんか。')}</h3><p>{t('QR・URLを開いて、名前を入れるだけ。', 'Open the QR or link and enter your name.', 'QR・URLをひらいて、なまえをいれるだけ。')}</p><b className="qs-room-code" data-room-code={addressText(address)}>{addressText(address)}</b><div className="qs-inline-actions"><button onClick={doCopy}>{copied ? <Check size={18} /> : <Copy size={18} />}{copied ? t('コピー済み', 'Copied', 'コピーしたよ') : t('招待URLをコピー', 'Copy invite link', 'しょうたいURLをコピー')}</button><button onClick={() => setExpanded(v => !v)} aria-expanded={expanded}><QrCode size={18} />{t('QR拡大', 'Enlarge QR', 'QRをおおきく')}</button></div><input className="qs-invite-url" readOnly value={url} aria-label={t('参加用URL', 'Join URL', 'さんかURL')} onFocus={e => e.target.select()} />{copyError && <small role="status">{t('上のURLを選択してコピーしてください。', 'Select the URL above and copy it.', 'うえのURLをえらんでコピーしてね。')}</small>}<a className="qs-screen-link" href={invitation(address, language, true)} target="_blank" rel="noopener noreferrer"><ExternalLink size={16} />{t('テレビ・プロジェクター用の画面を開く', 'Open audience / projector screen', 'テレビ・プロジェクターのがめんをひらく')}</a></div><LocalQr value={url} label={t('参加用QRコード', 'QR code to join', 'さんかするQRコード')} /></section>;
}

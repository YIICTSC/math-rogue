import { validSessionResult, type ResultGame, type SessionResult } from './sessionResults';

interface ResultChannel {open: boolean; send: (packet: any) => void; dataChannel?: RTCDataChannel}
/** A final bounded packet must not be dropped by the ordinary snapshot backpressure limit. */
export function sendFinalResult(channels: Iterable<ResultChannel>, packet: object, objectWire = false) {
  const targets = [...channels].filter(c => c.open);
  for(const c of targets) {try {c.send(objectWire ? packet : JSON.stringify(packet));} catch { /* disconnected peer */ }}
  return () => targets.every(c => !c.open || !c.dataChannel?.bufferedAmount);
}

/** Outside the game tree so the owner's title navigation cannot discard the result. */
export function showSessionResult(result: SessionResult) {
  document.getElementById('online-session-result')?.remove();
  const overlay = document.createElement('div'); overlay.id = 'online-session-result';
  overlay.setAttribute('data-meter-ignore', 'true');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#000c;display:grid;place-items:center;padding:20px;color:#fff;font:16px system-ui';
  const panel = document.createElement('section'); panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-labelledby', 'online-session-result-title');
  panel.style.cssText = 'background:#122035;border:2px solid #eacb70;border-radius:16px;padding:24px;max-width:960px;width:100%;max-height:90dvh;overflow:auto;box-sizing:border-box';
  const title = document.createElement('h2'); title.id = 'online-session-result-title'; title.textContent = '終了時点のリザルト / Session results';
  const note = document.createElement('p'); note.textContent = 'ホストがセッションを終了しました。途中順位です。追加の勝利・報酬は付与されません。 / The host ended the session. Interim results; no extra rewards.';
  const scroll = document.createElement('div'); scroll.style.overflowX = 'auto';
  const table = document.createElement('table'); table.style.cssText = 'width:100%;border-collapse:collapse;text-align:left';
  const head = table.createTHead().insertRow();
  for (const text of ['順位 / Rank', '参加名 / Player', ...result.columns]) { const th = document.createElement('th'); th.textContent = text; th.style.padding = '10px'; head.append(th); }
  const body = table.createTBody();
  for (const row of result.rows) { const tr = body.insertRow(); for (const value of [String(row.rank), row.name, ...row.values]) { const td = tr.insertCell(); td.textContent = value; td.style.cssText = 'padding:10px;border-top:1px solid #ffffff30'; } }
  const close = document.createElement('button'); close.textContent = '閉じる / Close'; close.style.cssText = 'margin-top:20px;padding:12px 30px;background:#f6d46e;color:#111;border:0;border-radius:8px;font:inherit;cursor:pointer';
  const previous = document.activeElement as HTMLElement | null;
  close.onclick = () => { overlay.remove(); previous?.focus(); window.dispatchEvent(new CustomEvent('learning-rogue:session-result-close', {detail: result.game})); };
  overlay.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); close.click(); } if (e.key === 'Tab') { e.preventDefault(); close.focus(); } e.stopPropagation(); });
  // Do not let the underlying game consume keys or controller-synthesized clicks.
  overlay.addEventListener('keyup', e => e.stopPropagation());
  scroll.append(table); panel.append(title, note, scroll, close); overlay.append(panel); document.body.append(overlay); close.focus();
}

/** Idempotent end handshake. The server computes its own scores, never client-supplied scores. */
export class SessionEnd {
  private ending = false;
  private shown = false;
  private fallback: ReturnType<typeof setTimeout> | undefined;
  constructor(private game: ResultGame, private cleanup: () => void) {}
  receive(packet: any) {
    if (packet?.type !== 'session-result' || !validSessionResult(packet.result, this.game)) return false;
    this.finish(packet.result); return true;
  }
  private finish(result: SessionResult) {
    if (this.shown) return;
    this.shown = true; this.ending = true; clearTimeout(this.fallback);
    this.cleanup(); showSessionResult(result);
  }
  end(result: SessionResult | null, dedicated: { send: (p: any) => unknown } | null, broadcast: (packet: object) => () => boolean) {
    if (this.ending) return true;
    if (!result) return false;
    this.ending = true;
    if (dedicated) {
      dedicated.send({ type: 'session-end' });
      this.fallback = setTimeout(() => this.finish(result), 1800);
    } else {
      const drained = broadcast({ type: 'session-result', result });
      const deadline = Date.now() + 3000;
      // Allow queued reliable state + final results to drain before tearing down WebRTC.
      const flush = () => {if (drained() || Date.now() >= deadline) this.cleanup(); else this.fallback = setTimeout(flush, 50);};
      this.fallback = setTimeout(flush, 500);
      this.shown = true; showSessionResult(result);
    }
    return true;
  }
}

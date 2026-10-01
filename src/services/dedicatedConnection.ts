export const onlineServerUrl = () => import.meta.env.VITE_ONLINE_SERVER_URL as string | undefined;

/** Shared cold-start, heartbeat and bounded outgoing queue for dedicated rooms. */
export class DedicatedConnection {
  private socket: WebSocket | null = null;
  private heartbeat: ReturnType<typeof setInterval> | null = null;
  private closed = false;
  private abort = new AbortController();
  constructor(private receive: (packet: any) => boolean, private lost: () => void) {}
  async open(game: 'kart' | 'craft' | 'golf', hello: object) {
    const url = new URL(onlineServerUrl()!);
    url.protocol = ['http:', 'ws:'].includes(url.protocol) ? 'ws:' : 'wss:';
    url.pathname = `/${game}`; url.search = ''; url.hash = '';
    const health = new URL(url); health.protocol = url.protocol === 'ws:' ? 'http:' : 'https:'; health.pathname = '/health';
    const wakeTimeout = setTimeout(() => this.abort.abort(), 90000);
    try { await fetch(health, {mode:'no-cors', signal:this.abort.signal}); }
    finally { clearTimeout(wakeTimeout); }
    if (this.closed) throw new Error('接続を終了しました。');
    const socket = new WebSocket(url); socket.binaryType = 'arraybuffer'; this.socket = socket;
    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const timeout = setTimeout(() => finish(new Error('専用サーバーに接続できませんでした。')), 20000);
      const finish = (error?: Error) => { if(settled)return; settled=true; clearTimeout(timeout); if(error){socket.close();reject(error);}else resolve(); };
      socket.onopen = () => this.send({type:'connect',protocol:1,...hello});
      socket.onmessage = event => {
        if(this.closed)return;
        let packet: any;
        try { packet = event.data instanceof ArrayBuffer ? event.data : JSON.parse(event.data); }
        catch { return; }
        if(packet.type === 'error') {finish(new Error(packet.message || packet.text || '接続できませんでした。'));return;}
        if(this.receive(packet))finish();
      };
      socket.onerror = () => finish(new Error('専用サーバーへの接続に失敗しました。'));
      socket.onclose = () => {finish(new Error('専用サーバーとの接続が終了しました。'));if(this.heartbeat)clearInterval(this.heartbeat);if(!this.closed)this.lost();};
    });
    if(!this.closed)this.heartbeat=setInterval(()=>this.send({type:'ping'}),20000);
  }
  send(packet: unknown) {
    if(this.closed || this.socket?.readyState!==WebSocket.OPEN || this.socket.bufferedAmount>16384)return false;
    this.socket.send(JSON.stringify(packet));return true;
  }
  close() {this.closed=true;this.abort.abort();if(this.heartbeat)clearInterval(this.heartbeat);this.socket?.close();}
}

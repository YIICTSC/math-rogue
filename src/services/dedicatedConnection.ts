export const onlineServerUrl = () => import.meta.env.VITE_ONLINE_SERVER_URL as string | undefined;

/** Shared cold-start, heartbeat and bounded outgoing queue for dedicated rooms. */
export class DedicatedConnection {
  private socket: WebSocket | null = null;
  private heartbeat: ReturnType<typeof setInterval> | null = null;
  private closed = false;
  private abort = new AbortController();
  constructor(private receive: (packet: any) => boolean, private lost: () => void) {}
  async open(game: 'kart' | 'craft' | 'golf' | 'online', hello: object) {
    const base=onlineServerUrl();if(!base)throw new Error('サーバー通信はこの環境では利用できません。');
    const url=new URL(base);url.protocol=['http:','ws:'].includes(url.protocol)?'ws:':'wss:';url.pathname=`/${game}`;url.search='';url.hash='';
    const health=new URL(url);health.protocol=url.protocol==='ws:'?'http:':'https:';health.pathname='/health';
    const deadline=Date.now()+180000,signal=this.abort.signal;
    const pause=()=>new Promise<void>((resolve,reject)=>{if(signal.aborted){reject(new Error('接続を終了しました。'));return;}const end=()=>{clearTimeout(timer);signal.removeEventListener('abort',abort);resolve();},abort=()=>{clearTimeout(timer);signal.removeEventListener('abort',abort);reject(new Error('接続を終了しました。'));},timer=setTimeout(end,2000);signal.addEventListener('abort',abort,{once:true});});
    let ready=false;
    while(!ready&&!this.closed&&Date.now()<deadline){try{await fetch(health,{mode:'no-cors',signal:AbortSignal.any([signal,AbortSignal.timeout(Math.min(15000,Math.max(1,deadline-Date.now())))])});ready=true;}catch{if(this.closed)throw new Error('接続を終了しました。');await pause();}}
    let explicit=false,last:unknown;
    while(!this.closed&&Date.now()<deadline){
      try{const socket=new WebSocket(url);socket.binaryType='arraybuffer';this.socket=socket;
        await new Promise<void>((resolve,reject)=>{let settled=false,connected=false;const finish=(error?:Error)=>{if(settled)return;settled=true;clearTimeout(timer);signal.removeEventListener('abort',abort);if(error){socket.onclose=null;socket.close();reject(error);}else{connected=true;resolve();}},abort=()=>finish(new Error('接続を終了しました。')),timer=setTimeout(()=>finish(new Error('サーバー起動待ちの接続を再試行します。')),Math.min(60000,Math.max(1,deadline-Date.now())));signal.addEventListener('abort',abort,{once:true});
          socket.onopen=()=>this.send({type:'connect',protocol:1,...hello});
          socket.onmessage=event=>{if(this.closed)return;let packet:any;try{packet=event.data instanceof ArrayBuffer?event.data:JSON.parse(event.data);}catch{return;}if(packet.type==='error'){explicit=true;this.receive(packet);finish(new Error(packet.message||packet.text||'接続できませんでした。'));return;}try{if(this.receive(packet))finish();}catch(error){explicit=true;finish(error instanceof Error?error:new Error(String(error)));}};
          socket.onerror=()=>finish(new Error('サーバーへの接続を再試行します。'));
          socket.onclose=()=>{finish(new Error('サーバーへの接続を再試行します。'));if(connected){if(this.heartbeat)clearInterval(this.heartbeat);if(!this.closed)this.lost();}};
        });
        if(!this.closed)this.heartbeat=setInterval(()=>this.send({type:'ping'}),20000);return;
      }catch(error){last=error;if(explicit||this.closed)throw error;await pause();}
    }
    throw new Error(this.closed?'接続を終了しました。':'サーバーの起動を3分待ちました。時間をおいて再接続してください。');
  }
  send(packet: unknown) {
    if(this.closed || this.socket?.readyState!==WebSocket.OPEN || this.socket.bufferedAmount>16384)return false;
    this.socket.send(JSON.stringify(packet));return true;
  }
  close() {this.closed=true;this.abort.abort();if(this.heartbeat)clearInterval(this.heartbeat);this.socket?.close();}
}

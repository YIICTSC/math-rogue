import {prepareWebAudioSession, registerGameAudio, resumeGameAudio, runWhenGameAudioReady} from '../../services/webAudioSession';
/** Original procedural sounds; unlocked on a user gesture, including mobile Safari. */
export class CraftSound {
  context:AudioContext|null=null;
  enabled=true;
  private active=0;
  private unregisterAudio?:()=>void;
  private generation=0;
  constructor(){try{this.enabled=localStorage.getItem('gakuro-craft-sound')!=='off';}catch{}}
  unlock=()=>{if(!this.enabled||document.hidden)return;try{
    const C=window.AudioContext||(window as unknown as {webkitAudioContext:typeof AudioContext}).webkitAudioContext;if(!C)return;
    if(!this.context||this.context.state==='closed'){
      this.unregisterAudio?.();this.active=0;this.generation++;prepareWebAudioSession();this.context=new C();
      this.unregisterAudio=registerGameAudio(this.context,()=>this.enabled);
    }
    void resumeGameAudio(this.context,true,()=>this.enabled);
  }catch{}};
  toggle(){this.generation++;this.enabled=!this.enabled;try{localStorage.setItem('gakuro-craft-sound',this.enabled?'on':'off');}catch{}if(this.enabled)this.unlock();else void this.context?.suspend().catch(()=>{});return this.enabled;}
  play(kind:string){if(!this.enabled||document.hidden)return;if(!this.context||this.context.state==='closed')this.unlock();const c=this.context;if(!c)return;
    const generation=this.generation;
    runWhenGameAudioReady(c,()=>this.playReady(kind,c),()=>this.enabled&&this.context===c&&this.generation===generation);
  }
  private playReady(kind:string,c:AudioContext){if(this.active>20)return;
    const melodies:Record<string,number[]>={correct:[523,659,784,1047],wrong:[240,160],harvest:[660,880,1100],craft:[330,440,660],donate:[440,554,659,880],fish:[350,700,950],cast:[500,260],bite:[1000,1400],plant:[320,480],water:[900,700,550],build:[150,300],remove:[280,170],gather:[130,85],pick:[600,800],eat:[450,560,700],avatar:[500,750],step:[90],ui:[450],error:[180,120]};
    if(['gather','build','remove','water','cast','step'].includes(kind)){
      const buffer=c.createBuffer(1,Math.ceil(c.sampleRate*.12),c.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(1-i/data.length);
      const source=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain();source.buffer=buffer;filter.type='bandpass';filter.frequency.value=['water','cast'].includes(kind)?1600:kind==='step'?180:650;gain.gain.value=kind==='step'?.025:.12;source.connect(filter);filter.connect(gain);gain.connect(c.destination);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};source.start();
    }
    const notes=melodies[kind]||melodies.ui;
    notes.forEach((f,i)=>{const at=c.currentTime+i*.065,o=c.createOscillator(),g=c.createGain();o.type=['gather','build','remove','step'].includes(kind)?'triangle':'sine';o.frequency.setValueAtTime(f,at);o.frequency.exponentialRampToValueAtTime(f*.65,at+.11);g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(kind==='step'?.025:.085,at+.008);g.gain.exponentialRampToValueAtTime(.001,at+.16);o.connect(g);g.connect(c.destination);this.active++;o.onended=()=>{if(this.context===c)this.active--;o.disconnect();g.disconnect();};o.start(at);o.stop(at+.18);});
  }
  close(){this.generation++;this.unregisterAudio?.();this.unregisterAudio=undefined;this.active=0;const c=this.context;this.context=null;if(c)void c.close().catch(()=>{});}
}

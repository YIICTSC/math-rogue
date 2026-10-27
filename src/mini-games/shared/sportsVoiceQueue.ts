export interface SportsVoiceCue {id:string;priority:0|1|2}
/** One dry speech channel: judgments wait for a call, routine shouts never form a backlog. */
export class SportsVoiceQueue {
 private pending:SportsVoiceCue[]=[];private busy=false;private generation=0;
 constructor(private play:(id:string)=>Promise<unknown>,private stop:()=>void){}
 enqueue(cues:SportsVoiceCue[]){
  for(const cue of cues){
   if(cue.priority===0&&(this.busy||this.pending.length))continue;
   if(cue.priority>0&&this.busy)this.pending=this.pending.filter(c=>c.priority>0);
   this.pending.push(cue);if(this.pending.length>5)this.pending.shift();
  }
  void this.drain();
 }
 cancel(){this.generation++;this.pending=[];this.busy=false;this.stop();}
 private async drain(){
  if(this.busy||!this.pending.length)return;this.busy=true;const generation=this.generation;
  while(this.pending.length&&generation===this.generation){const next=this.pending.shift()!;try{await this.play(next.id);}catch{/* An unavailable audio device must not affect the match. */}}
  if(generation===this.generation)this.busy=false;
 }
}

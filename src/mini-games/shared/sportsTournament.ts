/** All entrants play every round; CPU seats fill courts rather than awarding byes. */
export function tournamentTeamCount(players:number,teamSize:number){
 const needed=Math.max(2,Math.ceil(players/teamSize));let count=2;while(count<needed)count*=2;return count;
}
type Team={id:number;name:string;members:(string|null)[]};
type Match={round:number;teams:[number,number|null];winner:number|null;phase:string;warmup?:boolean};
/** Reclaim departed seats without leaving dangling owners in court snapshots. */
export function releaseDisconnected(w:{players:Record<string,{connected:boolean}>;teams:Team[];matches:{units:{owner:string|null;cpu:boolean}[]}[]}){
 for(const [id,p]of Object.entries(w.players))if(!p.connected){
  for(const t of w.teams)t.members=t.members.map(owner=>owner===id?null:owner);
  for(const m of w.matches)for(const u of m.units)if(u.owner===id){u.owner=null;u.cpu=true;}
  delete w.players[id];
 }
}
export function tournamentOrder(teams:Team[],matches:Match[]){
 const rounds=Math.max(1,Math.ceil(Math.log2(teams.length)));
 const score=(id:number)=>matches.reduce((n,m)=>n+(!m.warmup&&m.phase==='finished'&&m.winner===id?2**Math.max(0,rounds-1-m.round):0),0);
 return [...teams].sort((a,b)=>score(b.id)-score(a.id)||a.id-b.id).map(t=>t.id);
}
export function tournamentPairs(teams:Team[],matches:Match[]){const ids=tournamentOrder(teams,matches);return Array.from({length:ids.length/2},(_,i)=>[ids[i*2],ids[i*2+1]] as const);}
export const tournamentRounds=(teams:Team[])=>Math.max(1,Math.ceil(Math.log2(teams.length)));
/** Fill an existing CPU position first. A full field opens another two-team court. */
export function lateTeamSeat(teams:Team[],id:string,size:number):{team:number;seat:number;newCourt?:[number,number]}{
 const available=[...teams].filter(t=>t.members.includes(null)).sort((a,b)=>a.members.filter(Boolean).length-b.members.filter(Boolean).length||a.id-b.id);
 if(available.length){const team=available[0],seat=team.members.indexOf(null);team.members[seat]=id;return{team:team.id,seat};}
 const a=teams.length,b=a+1;teams.push({id:a,name:`TEAM ${a+1}`,members:Array(size).fill(null)},{id:b,name:`TEAM ${b+1}`,members:Array(size).fill(null)});teams[a].members[0]=id;return{team:a,seat:0,newCourt:[a,b]};
}

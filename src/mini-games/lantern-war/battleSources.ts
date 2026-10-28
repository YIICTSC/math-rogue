export type BattleAction='ready'|'windup'|'attack'|'guard'|'hurt'|'ultimate';
export const BATTLE_ACTIONS:BattleAction[]=['ready','windup','attack','guard','hurt','ultimate'];
const high=['warrior','caretaker','assassin','mage','dodgeball','bard','librarian','chef','gardener'];
const girls=['akari','shizuku','hiyori','tsubasa','rei','madoka','koharu','mirai','sera'];
export function battleSource(id:string,action:BattleAction='ready',frame=0){
 const src=(path:string,cols=1,rows=1,index=0)=>({path,cols,rows,index});
 if(['aster','lyra'].includes(id))return src('sprites/lantern-war/heroes/'+id+'-'+action+'.webp');
 if(id.startsWith('dungeons2-')||['nagi','mio','sena'].includes(id))return src('sprites/lantern-war/'+id+'-battle.webp',3,2,({ready:0,windup:1,attack:2,guard:3,hurt:4,ultimate:5})[action]);
 const kind=action==='ready'||action==='guard'?'idle':action==='hurt'?'hit':action==='ultimate'?'skill':'attack';
 if(id.startsWith('high-school-')){const i=high.indexOf(id.slice(12));return src('sprites/high-school/characters-'+kind+'-sheets/'+i+'.'+(kind==='idle'&&i===1?'png':'webp'),2,2,action==='windup'?0:frame);}
 if(id.startsWith('magic-')){const key=id.slice(6),i=girls.indexOf(key);return src(i>=0?'sprites/magic/characters-'+kind+'-sheets/heroine-'+String(i+1).padStart(2,'0')+'-after.webp':'sprites/magic/male-characters-'+kind+'-sheets/'+key+'-after.webp',2,2,action==='windup'?0:frame);}
 const key=id.slice(6);return src('sprites/magic/'+(action==='attack'||action==='windup'?'humanoid-enemies-attack':action==='ultimate'?'humanoid-enemies-skill':'humanoid-enemies')+'/'+key+'.webp');
}

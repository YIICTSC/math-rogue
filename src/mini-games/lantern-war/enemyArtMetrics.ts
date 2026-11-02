import DATA from './enemyArtMetrics.json';
import {enemyArtSource} from './enemyRoster';
export interface EnemyMetric {x:number;y:number;w:number;h:number;bounds:{x:number;y:number;w:number;h:number};bodyBounds:{x:number;y:number;w:number;h:number};footX:number;footY:number;}
const metrics=DATA as Record<string,EnemyMetric>;
export function enemyMetric(id:string,action:'ready'|'windup'|'attack'|'guard'|'hurt'|'ultimate'='ready'){
 const path=enemyArtSource(id,action);return path?metrics[path]:undefined;
}

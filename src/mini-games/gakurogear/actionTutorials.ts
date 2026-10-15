import type {Mission} from './engine';
export const ACTION_TUTORIALS = {
 collect:{ja:'回収・救助・端末',en:'Collect, rescue and relay',body:'青い資料・桃色の救助対象・黄色い端末の近くで止まり、回収ボタン（E）をゲージが満ちるまで長押しします。',english:'Stop beside a blue file, pink rescue target or yellow terminal. Hold Collect (E) until its gauge fills.',icon:'▣'},
 crouch:{ja:'しゃがみ移動',en:'Crouching',body:'しゃがむボタン（C）で姿勢を切り替えます。黄色い低い通路は、抜けるまでしゃがんで進みましょう。',english:'Toggle Crouch (C). Stay crouched until you have passed completely under a yellow low passage.',icon:'↧'},
 hold:{ja:'おやすみホールド',en:'Sleep hold',body:'見回りの背後へ静かに近づき、ホールドボタン（F）を長押し。ゲージが満ちると一定時間おやすみします。追加課題の回数も確認しましょう。',english:'Approach a patrol quietly from behind. Hold the Hold button (F) until the gauge fills to put them to sleep temporarily. Check the required hold count.',icon:'☾'},
 shoot:{ja:'シャボン銃',en:'Bubble blaster',body:'相手の方向へ体を向け、攻撃ボタン（R）でシャボンを発射。命中すると一時的におやすみします。追加課題は必要な命中数まで達成しましょう。',english:'Face a patrol and press Attack (R). Bubble hits put them to sleep temporarily. Complete the required hit count for the extra objective.',icon:'◉'},
 switch:{ja:'スイッチと扉',en:'Switches and doors',body:'オレンジのスイッチの近くで回収（E）を長押しすると、対応する青い扉が開きます。',english:'Hold Collect (E) beside an orange switch to open its blue door.',icon:'⌘'},
 sensor:{ja:'光センサー',en:'Light sensors',body:'赤い光センサーは、消えている間か、しゃがんで通過しましょう。',english:'Cross red sensors while they are off, or stay crouched.',icon:'≋'},
 defend:{ja:'防衛地点',en:'Defense zone',body:'旗のある防衛地点に入り、表示された秒数までとどまります。資料だけでなく防衛時間も達成すると出口が開きます。',english:'Stay inside the flagged defense zone for the required time. Complete its timer as well as the other tasks to unlock the exit.',icon:'⚑'},
 decoy:{ja:'音のデコイ',en:'Sound decoy',body:'デコイ（Q）で音を鳴らし、見回りを誘導できます。使える回数に注意しましょう。',english:'Use Decoy (Q) to lure patrols with a sound. You have limited charges.',icon:'♪'},
} as const;
export type ActionTutorial=keyof typeof ACTION_TUTORIALS;
export function missionActions(m:Mission):ActionTutorial[]{
 const result:ActionTutorial[]=['collect'];
 if(m.obstacles.some(b=>b.kind==='crawl'||b.h<=1.2))result.push('crouch');
 if(m.requiredHolds)result.push('hold');if(m.requiredShots)result.push('shoot');
 if(m.switches?.length)result.push('switch');if(m.sensors?.length)result.push('sensor');
 if(m.defend)result.push('defend');if((m.id-1)%20===4)result.push('decoy');return result;
}
const KEY='gakuro-vr-action-tutorials-v1';
export function unreadActions(m:Mission){try{const seen=JSON.parse(localStorage.getItem(KEY)||'[]');return missionActions(m).filter(id=>!Array.isArray(seen)||!seen.includes(id));}catch{return missionActions(m);}}
export function rememberAction(id:ActionTutorial){try{const raw=JSON.parse(localStorage.getItem(KEY)||'[]');localStorage.setItem(KEY,JSON.stringify([...new Set([...(Array.isArray(raw)?raw:[]),id])]));}catch{/* Tutorials remain available without storage. */}}

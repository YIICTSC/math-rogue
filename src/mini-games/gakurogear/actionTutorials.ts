import type {Mission} from './engine';
export const ACTION_TUTORIALS = {
 collect:{ja:'回収・救助・端末',en:'Collect, rescue and relay',body:'青い資料・桃色の救助対象・黄色い端末の近くで止まり、回収ボタン（E）をゲージが満ちるまで長押しします。',english:'Stop beside a blue file, pink rescue target or yellow terminal. Hold Collect (E) until its gauge fills.',icon:'▣'},
 crouch:{ja:'しゃがみ移動',en:'Crouching',body:'しゃがむボタン（C）で姿勢を切り替えます。黄色い低い通路は、抜けるまでしゃがんで進みましょう。',english:'Toggle Crouch (C). Stay crouched until you have passed completely under a yellow low passage.',icon:'↧'},
 hold:{ja:'おやすみホールド',en:'Sleep hold',body:'見回りの背後2.4m以内に近づき、立ち止まってホールドボタン（F）を長押し。立ったままでも使えます。ゲージが満ちると一定時間おやすみします。追加課題の回数も確認しましょう。',english:'Approach within 2.4m behind a patrol, stop and hold the Hold button (F). You can remain standing. Fill the gauge to put them to sleep temporarily, and check the required hold count.',icon:'☾'},
 shoot:{ja:'シャボン銃',en:'Bubble blaster',body:'相手の方向へ体を向け、攻撃ボタン（R）でシャボンを発射。命中すると一時的におやすみします。追加課題は必要な命中数まで達成しましょう。',english:'Face a patrol and press Attack (R). Bubble hits put them to sleep temporarily. Complete the required hit count for the extra objective.',icon:'◉'},
 switch:{ja:'スイッチと扉',en:'Switches and doors',body:'オレンジのスイッチの近くで回収（E）を長押しすると、対応する青い扉が開きます。',english:'Hold Collect (E) beside an orange switch to open its blue door.',icon:'⌘'},
 sensor:{ja:'光センサー',en:'Light sensors',body:'赤い光センサーは、消えている間か、しゃがんで通過しましょう。',english:'Cross red sensors while they are off, or stay crouched.',icon:'≋'},
 defend:{ja:'防衛地点',en:'Defense zone',body:'黄色い防衛地点に入り、見つからずに表示された秒数までとどまります。資料だけでなく防衛時間も達成すると出口が開きます。',english:'Stay undetected inside the yellow defense zone for the required time. Complete its timer as well as the other tasks to unlock the exit.',icon:'⚑'},
 decoy:{ja:'音のデコイ',en:'Sound decoy',body:'デコイ（Q）で音を鳴らし、見回りを誘導できます。使える回数に注意しましょう。',english:'Use Decoy (Q) to lure patrols with a sound. You have limited charges.',icon:'♪'},
} as const;
export type ActionTutorial=keyof typeof ACTION_TUTORIALS;
export const ACTION_TUTORIAL_FOCUS:Record<ActionTutorial,{key:string;ja:string;en:string}>={
 collect:{key:'E',ja:'対象の近くで止まる → 長押しで回収',en:'Stop beside the target → hold to collect'},
 crouch:{key:'C',ja:'しゃがみに切り替え → 低い通路を抜ける',en:'Toggle crouch → pass under the low passage'},
 hold:{key:'F',ja:'背後2.4m以内 → 止まって長押し',en:'Within 2.4m behind → stop and hold'},
 shoot:{key:'R',ja:'相手に向きを合わせる → 発射',en:'Face the patrol → fire'},
 switch:{key:'E',ja:'オレンジのスイッチで長押し → 青い扉が開く',en:'Hold beside the orange switch → open the blue door'},
 sensor:{key:'C',ja:'消灯を待つ、またはしゃがんで通過',en:'Wait for the beam to turn off, or crouch through'},
 defend:{key:'',ja:'黄色い輪の中で見つからずに待つ',en:'Stay undetected inside the yellow ring'},
 decoy:{key:'Q',ja:'音の輪へ見回りを誘導する',en:'Lure patrols toward the sound ring'},
};
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

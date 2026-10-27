import type {TutorialStage} from './types';
const key='gakuro-basketball-tutorial-v1';
export const tutorialFinished=()=>{try{return localStorage.getItem(key)==='done';}catch{return false;}};
export const finishTutorial=()=>{try{localStorage.setItem(key,'done');}catch{/* Session state still remembers completion. */}};
export const tutorialOrder:TutorialStage[]=['move','dash','pass','receive','steal','shoot','complete'];
export const tutorialText:Record<TutorialStage,string>={
 move:'黄色い輪を目印に、パッドで動こう。ボールを持つと自動でドリブル！',
 dash:'方向を入れながら「ダッシュ」を押してみよう。',
 pass:'「パス」で仲間にボールを渡そう。',
 receive:'仲間がパスを返します。ボールが戻るところを見てみよう。',
 steal:'近くの相手から「スティール」でボールを取り返そう。',
 shoot:'黄色い輪まで進んで「シュート」！リングの近くほど決まりやすいよ。',
 complete:'ナイスシュート！練習完了。このままCPU戦を始めよう。'
};
export const tutorialAction:Partial<Record<TutorialStage,string>>={dash:'dodge',pass:'pass',steal:'catch',shoot:'throw'};

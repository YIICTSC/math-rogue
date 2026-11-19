import type {ClubView} from './model';
import {newClubEvents} from './presentation';

export const SCORE_REASONS: Record<string,[string,string]> = {
  sweep:['スイープ','Sweep'], scoreAce:['Aの獲得','Aces'], scoreBig:['ビッグカシノ ♦10','Big casino ♦10'],
  scoreLittle:['リトルカシノ ♠2','Little casino ♠2'], scoreDiamonds:['ダイヤ最多','Most diamonds'],
  scorePrime:['プリミエラ','Primiera'], scoreSeven:['ダイヤの7','Seven of diamonds'],
  scoreCards:['獲得枚数最多','Most cards'], scoreSpades:['スペード最多','Most spades'],
  marriage:['マリッジ','Marriage'], book:['ブック完成','Book'], gin:['ジン','Gin'],
  goingOut:['上がり','Going out'], points:['得点','Points'],
};

export function clubScoreAwards(previous:ClubView|null,current:ClubView){
  if(!previous||previous.game!==current.game||previous.round!==current.round||previous.revision>=current.revision)return [];
  const events=newClubEvents(previous.log,current.log);
  return current.players.flatMap((player,seat)=>{
    const amount=player.score-(previous.players[seat]?.score??player.score);
    if(amount<=0)return [];
    const reasons=events.filter(event=>event.player===seat&&Object.hasOwn(SCORE_REASONS,event.key));
    return [{seat,player,amount,reasons}];
  });
}

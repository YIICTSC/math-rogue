import {GameMode, GameScreen, type AnswerMode, type GameState, type Player} from '../types';
import type {RpgAdventureSetup} from './setup';

/** Resuming an RPG must not retain main-run flags, inventory or map progress. */
export function resumeRpgState(player:Player, setup?:RpgAdventureSetup):GameState {
  return {
    rpgOnline:true, screen:GameScreen.MAP, mode:(setup?.mode || GameMode.MULTIPLICATION) as GameMode,
    visualTheme:setup?.visualTheme || 'elementary', modePool:setup?.modePool ? [...setup.modePool] : undefined,
    answerMode:(setup?.answerMode || 'CHOICE') as AnswerMode, difficultyLevel:setup?.difficultyLevel || 1,
    act:1, floor:0, turn:0, map:[], currentMapNodeId:null, player:structuredClone(player),
    enemies:[], selectedEnemyId:null, narrativeLog:[], combatLog:[], rewards:[],
    selectionState:{active:false,type:'DISCARD',amount:0}, isEndless:false,
    parryState:{active:false,enemyId:null,success:false}, activeEffects:[],
    currentStoryIndex:0, actStats:{enemiesDefeated:0,goldGained:0,mathCorrect:0},
  };
}

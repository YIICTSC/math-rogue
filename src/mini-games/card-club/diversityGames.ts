import type { RuleExtension } from './extensionModel';
import { guessRules,redDogRules } from './deductionAndTotals';
import { petrangolaRules } from './petrangola';
import { speculationRules } from './speculation';
import { suitmatchRules } from './suitmatch';
export const diversityExtension=(id:string):RuleExtension|undefined=>({guessit:guessRules,reddog:redDogRules,petrangola:petrangolaRules,speculation:speculationRules,suitmatch:suitmatchRules}[id]);

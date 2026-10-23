import type { GameId } from './catalog';
import type { RuleExtension } from './extensionModel';
import { highLowRules } from './highLowJack';
import { sevenRules } from './sevenGames';
import { rollingRules } from './rollingStone';
import { cuckooRules } from './cuckoo';
import { bluffRules } from './bluffTricks';
export const TRADITIONAL_TRICKS=new Set(['pitch','allfour','sedma','sedmice','put','truc']);
export const traditionalExtension=(id:GameId):RuleExtension|undefined=>['pitch','allfour'].includes(id)?highLowRules:['sedma','sedmice'].includes(id)?sevenRules:id==='rollingstone'?rollingRules:id==='rantergo'?cuckooRules:['put','truc'].includes(id)?bluffRules:undefined;

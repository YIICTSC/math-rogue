import type { Action,ClubState,ClubView } from './model';

/** Only board, selections and cycle keys contain private information. */
export interface ExtensionState {
  step:string; points:number[]; multiplier:number; firstLeader:number;
  indicator:number; opening:number; firstTrick:boolean;
  selections:number[][]; board:number[]; visible:number[]; memory:Record<number,number>;
  melds:{owner:number;cards:number[]}[]; opened:boolean[]; openedBeforeTurn:boolean;
  piles:number[][];
  obligation:number; claimant:number; seen:string[]; iterations:number;
}
export const emptyExtension=(n:number):ExtensionState=>({step:'play',points:Array(n).fill(0),multiplier:1,firstLeader:0,indicator:-1,opening:-1,firstTrick:true,selections:Array.from({length:n},()=>[]),board:[],visible:[],memory:{},melds:[],piles:[],opened:Array(n).fill(false),openedBeforeTurn:false,obligation:0,claimant:-1,seen:[],iterations:0});
export interface RuleExtension {
  start:(s:ClubState)=>void;
  actions:(s:ClubState)=>Action[];
  apply:(s:ClubState,a:Action)=>void;
  cpu?:(v:ClubView)=>Action|undefined;
  nextDealer?:(s:ClubState)=>number;
}

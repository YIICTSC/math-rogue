import {DEBUG_FEATURES_ENABLED} from '../config/runtime';
const KEY='point-exchange-debug-session';
export function debugRewardsUnlocked(){try{return DEBUG_FEATURES_ENABLED&&sessionStorage.getItem(KEY)==='1';}catch{return false;}}
export function enableDebugRewards(){if(!DEBUG_FEATURES_ENABLED)return;sessionStorage.setItem(KEY,'1');window.dispatchEvent(new CustomEvent('learning-points-changed'));}

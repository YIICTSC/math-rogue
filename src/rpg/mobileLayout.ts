import {useSyncExternalStore} from 'react';
export const RPG_COMPACT_QUERY='(max-width: 900px), (pointer: coarse) and (max-height: 600px)';
const subscribe=(listener:()=>void)=>{const query=window.matchMedia(RPG_COMPACT_QUERY);query.addEventListener('change',listener);return()=>query.removeEventListener('change',listener);};
export const useCompactRpgLayout=()=>useSyncExternalStore(subscribe,()=>window.matchMedia(RPG_COMPACT_QUERY).matches,()=>false);

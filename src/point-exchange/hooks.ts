import {useEffect,useState} from 'react';
import {POINT_EVENT,readPoints} from './store';
export function usePoints(){const [state,setState]=useState(readPoints);useEffect(()=>{const refresh=()=>setState(readPoints());window.addEventListener(POINT_EVENT,refresh);window.addEventListener('storage',refresh);return()=>{window.removeEventListener(POINT_EVENT,refresh);window.removeEventListener('storage',refresh);};},[]);return state;}

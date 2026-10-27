import React from 'react';
import {assetUrl} from '../../utils/assetPaths';
import type {Shot} from './types';
const cells:Record<Shot|'dash',[number,number]>={topspin:[0,0],slice:[1,0],lob:[2,0],drop:[0,1],special:[1,1],dash:[2,1]};
export default function TennisActionIcon({action}:{action:Shot|'dash'}){const[col,row]=cells[action];return <span className="tn-action-illustration" aria-hidden="true" data-action-art={action} style={{backgroundImage:`url(${assetUrl('sprites/tennis/action-icons-v1.webp')})`,backgroundPosition:`${col*50}% ${row*100}%`}}/>;}

import React from 'react';
import {assetUrl} from '../../utils/assetPaths';
import type{SportId}from'../academy-sports/core';
import type {Sport} from './SportsInvitation';
const cells={tennis:[0,0],golf:[1,0],dodgeball:[0,1],basketball:[1,1]} as const;
export default function SportMenuIcon({sport}:{sport:Sport|SportId}){if(sport==='baseball'||sport==='soccer'||sport==='volleyball'||sport==='festival'){const [col,row]=({baseball:[0,0],soccer:[1,0],volleyball:[0,1],festival:[1,1]} as const)[sport];return <span className="sport-menu-icon" data-sport-art={sport} aria-hidden="true" style={{backgroundImage:`url(${assetUrl('sprites/sports/academy-menu-icons-v1.webp')})`,backgroundPosition:`${col*100}% ${row*100}%`}}/>;}const[col,row]=cells[sport];return <span className="sport-menu-icon" aria-hidden="true" data-sport-art={sport} style={{backgroundImage:`url(${assetUrl('sprites/sports/menu-icons-v1.webp')})`,backgroundPosition:`${col*100}% ${row*100}%`}}/>;}

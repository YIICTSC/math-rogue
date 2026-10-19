import React from 'react';
import {abilityCutin} from './cutins';
import './cutins.css';
export function AbilityCutin({heroId,abilityName,transformed=false}:{heroId:string;abilityName:string;transformed?:boolean}){
 const cutin=abilityCutin(heroId,abilityName,transformed);if(!cutin)return null;
 return <div className="ultimate-character-cutin" data-cutin-hero={heroId} data-cutin-slot={cutin.slot+1} data-cutin-form={transformed?'transformed':'normal'} aria-hidden="true"><img src={cutin.url} alt="" decoding="async" draggable={false}/></div>;
}

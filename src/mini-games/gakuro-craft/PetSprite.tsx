import React from 'react';
import {petKindOf,type PetKind} from './pets';
export {petPose} from './petMotion';
import shiba from './assets/pet-shiba.png';
import corgi from './assets/pet-corgi.png';
import poodle from './assets/pet-poodle.png';
import calico from './assets/pet-calico.png';
import tabby from './assets/pet-tabby.png';
import blackCat from './assets/pet-blackCat.png';
import rabbit from './assets/pet-rabbit.png';
import hamster from './assets/pet-hamster.png';
import panda from './assets/pet-panda.png';
import longTailedTit from './assets/pet-longTailedTit.png';
const sheets={shiba,corgi,poodle,calico,tabby,blackCat,rabbit,hamster,panda,longTailedTit};
export default function PetSprite({frame,flip=false,kind}:{frame:number;flip?:boolean;kind?:PetKind}){return <g transform={flip?'scale(-1,1)':undefined}><svg data-pet-frame={frame} x={-16} y={-29} width="32" height="38.4" viewBox={`${frame%3*160} ${Math.floor(frame/3)*192} 160 192`} overflow="hidden" style={{pointerEvents:'none'}}><image href={sheets[petKindOf(kind)]} width="480" height="384"/></svg></g>;}
export function PetPortrait({kind,label}:{kind:PetKind;label:string}){return <svg role="img" aria-label={label} viewBox="0 0 160 192"><image href={sheets[kind]} width="480" height="384"/></svg>;}

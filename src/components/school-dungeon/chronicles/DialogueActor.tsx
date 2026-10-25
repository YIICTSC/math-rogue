import React from 'react';
import {TravelerSprite} from '../JourneyScreens';
import {abyssHero} from '../dungeons2/roster';
import {assetUrl} from '../../../utils/assetPaths';
/** Use the authored full-body portrait for dialogue instead of enlarging a walking frame. */
export function DialogueActor({id}:{id:string}){const hero=abyssHero(id);return hero?<img className="traveler-sprite dialogue-actor" src={assetUrl(hero.portrait)} alt=""/>:<TravelerSprite id={id}/>;}

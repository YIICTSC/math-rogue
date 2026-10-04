import React from 'react';
import {assetUrl} from '../utils/assetPaths';
import {AtlasSprite} from './town/Sprites';
import {furnitureImage,seasonalFurniture} from './homeCatalog';
export default function FurnitureSprite({item}:{item:string}){return seasonalFurniture.includes(item)?<AtlasSprite path="sprites/rpg/town/keepsakes.webp" index={seasonalFurniture.indexOf(item)}/>:<img className="rpg-furniture-sprite" src={assetUrl(furnitureImage(item))} alt="" loading="lazy"/>;}

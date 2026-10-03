import React from 'react';
import {assetUrl} from '../utils/assetPaths';
import {furnitureImage} from './homeCatalog';
export default function FurnitureSprite({item}:{item:string}){return <img className="rpg-furniture-sprite" src={assetUrl(furnitureImage(item))} alt="" loading="lazy"/>;}

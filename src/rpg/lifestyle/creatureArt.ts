import { assetUrl } from '../../utils/assetPaths';
import { LIVESTOCK } from '../farm/catalog';
import { animalArtId, RARE_COATS } from '../farm/animalLook';

export const CREATURE_ART = [
  'cow','sheep','goat','alpaca','pig','shiba','corgi','poodle','husky','retriever','calico',
  'tabby','blackcat','whitecat','graytabby','rabbit','hamster','hedgehog','fox','otter','dragon',
  'chicken','duck','parrot','tit','bees',
  'horse','donkey','deer','wolf','bear','panda','squirrel','boar','snowfox','frog','turtle',
  'trout','reef-fish','cave-bat','butterfly',
  'camel','owl','eagle','dolphin','tropical-fish','shore-crab','reef-squid','octopus',
  'crystal-slime','stone-golem','cloud-spirit',
] as const;
const artSpecies = new Set<string>(CREATURE_ART);
for (const {id} of LIVESTOCK) {
  artSpecies.add(animalArtId(id,'young'));
  artSpecies.add(animalArtId(id,'growing'));
}
for (const kind of RARE_COATS) for (const stage of ['young','growing','adult'] as const) {
  artSpecies.add(animalArtId(kind,stage,'rare'));
}
export const creatureHasArt = (kind: string) => artSpecies.has(kind);
export const creaturePortrait = (kind: string) => `sprites/rpg/creatures/${kind}.webp`;
export const creaturePoseSheet = (kind:string) => `sprites/rpg/creatures/${kind}-poses.webp`;
const motionAtlas = (kind:string) => `sprites/rpg/creatures/${kind}-motion.webp`;
export type CreatureFacing = 'front' | 'back' | 'left' | 'right';
const directions:CreatureFacing[]=['front','back','left','right'];

const poseRows = ['greet','roll','sleep','hop'];
export const creaturePoseIndex = (pose:string) => Math.max(0,poseRows.indexOf(pose));
const loaded = new Map<string, HTMLImageElement>();
function sheet(path:string) {
  let strip = loaded.get(path);
  if (!strip) {
    strip = new Image();
    strip.src = assetUrl(path);
    loaded.set(path, strip);
  }
  return strip;
}

export function drawCreature(ctx:CanvasRenderingContext2D,kind:string,x:number,y:number,size:number,pose='greet',facing?:CreatureFacing,time=0) {
  if (!creatureHasArt(kind)) return false;
  if (facing) {
    const atlas=sheet(motionAtlas(kind));
    if (atlas.complete && atlas.naturalWidth) {
      const width=atlas.naturalWidth/8,height=atlas.naturalHeight/4;
      const frame=pose==='walk'?4+(Math.floor(time/150)%2):pose==='run'?6:pose==='eat'?7:creaturePoseIndex(pose);
      ctx.drawImage(atlas,width*frame,height*directions.indexOf(facing),width,height,x-size/2,y-size,size,size);
      return true;
    }
  }
  const strip=sheet(creaturePoseSheet(kind));
  if (!strip.complete || !strip.naturalWidth) return false;
  const width = strip.naturalWidth / 4, row = creaturePoseIndex(pose);
  ctx.drawImage(strip, width * row, 0, width, strip.naturalHeight, x-size/2, y-size, size, size);
  return true;
}

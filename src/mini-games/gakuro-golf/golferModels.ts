import {ProtagonistModel} from '../../three/protagonistModel';
import {characterGeometry} from '../../three/storybookCharacters';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import * as T from 'three';
import { createAvatarParts } from '../gakuro-kart/avatarModels';
import { AVATAR_COLORS, BODY_COLORS, HAIR_COLORS, EYE_COLORS, type KartAvatar } from '../gakuro-kart/avatar';

/** Shared GP face/hair/species assets, with a standing golf rig and articulated club. */
export function createGolferAssets() {
  const parts = createAvatarParts();
  const sphere = new T.SphereGeometry(1, 12, 8), cylinder = new T.CylinderGeometry(1, 1, 1, 8);
  const box = new RoundedBoxGeometry(1,1,1,2,.12),sleeve=characterGeometry('sleeve',sphere),mitten=characterGeometry('mitten',sphere),trouser=characterGeometry('trouser',cylinder),shoe=characterGeometry('shoe',box);
  const materials = [new T.MeshStandardMaterial({ color: '#344357', roughness: .7 }),
    new T.MeshStandardMaterial({ color: '#d9e4ec', metalness: .8, roughness: .25 }),
    new T.MeshStandardMaterial({ color: '#263148', roughness: .34 })];
  const geometries = new Set<T.BufferGeometry>([sphere, cylinder, box,sleeve,mitten,trouser,shoe, ...parts.map(p => p.geometry)]);
  const sharedMaterials = new Set<T.Material>([...materials, ...parts.map(p => p.material)]);
  function create(avatar: KartAvatar, athlete=false, sport?:'tennis'|'dodgeball'|'basketball') {
    const root = new T.Group(), torso = new T.Group(), arms = new T.Group();root.name="StorybookGolfer";
    const legs:{leg:T.Mesh;foot:T.Mesh}[]=[];let walkTime=0;
    const owned: T.Material[] = [], colored: { mesh: T.Mesh; key: 'body' | 'outfit' | 'hair' | 'eyeColor' }[] = [];
    const skin = new T.MeshStandardMaterial({ roughness: .43 }), shirt = new T.MeshStandardMaterial({ roughness: .48 });
    owned.push(skin, shirt);
    const add = (parent: T.Group, geometry: T.BufferGeometry, material: T.Material, pos: number[], scale: number[]) => {
      const m = new T.Mesh(geometry, material); m.position.fromArray(pos); m.scale.fromArray(scale); parent.add(m); return m;
    };
    torso.position.y = 1; root.add(torso);
    for (let i = 5; i < parts.length; i++) {
      const part = parts[i];
      const material = part.color ? part.material.clone() : part.material;
      if (part.color) owned.push(material);
      const m = add(torso, part.geometry, material, [part.position[0], part.position[1] - 1, part.position[2]], part.scale);
      m.rotation.fromArray([...part.rotation, 'XYZ'] as [number, number, number, T.EulerOrder]);
      m.userData.visibleFor = part.visible;
      if (part.color) colored.push({ mesh: m, key: part.color });
    }
    add(torso, parts[0].geometry, shirt, [0, .2, -.3], [.86, .8, .6]);
    for (const side of [-1, 1]) {
      const leg = add(root, trouser, materials[0], [side * .25, .5, -.13], [.16, .85, .16]); leg.rotation.z = side * -.09;
      const foot=add(root, shoe, materials[2], [side * .29, .1, .04], [.35, .18, .55]);legs.push({leg,foot});
    }
    arms.position.set(0, 1.55, -.1); torso.add(arms); arms.position.y -= 1;
    const leftArm = new T.Group(), rightArm = new T.Group();leftArm.position.x=-.34;rightArm.position.x=.34;arms.add(leftArm, rightArm);
    for (const side of [-1, 1]) {
      const limb = side === -1 ? leftArm : rightArm;
      // Golf brings both hands together. Court sports need separate, articulated arms.
      const upper = add(limb, sleeve, shirt, sport?[side * .02, -.23, .06]:[side * -.04, -.24, .19], [.16, .34, .16]); upper.rotation.z = side * (sport ? .12 : -.4); upper.rotation.x = sport ? -.25 : -.65;
      const lower = add(limb, sleeve, skin, sport?[side * .06, -.46, .17]:[side * -.23, -.54, .48], [.12, .24, .12]); lower.rotation.z = side * (sport ? .1 : -.25); lower.rotation.x = -.65;
      add(limb, mitten, skin, sport?[side * .08, -.55, .28]:[side * -.28, -.7, .6], [.12, .12, .13]);
    }
    const club = new T.Group(); arms.add(club); club.position.set(0, -.72, .63);
    const shaft = add(club, cylinder, materials[1], [0, -.37, .27], [.025, .95, .025]); shaft.rotation.x = -.62;
    const clubHead = add(club, box, materials[1], [0, -.76, .56], [.31, .13, .17]);
    root.scale.setScalar(athlete?.8:1.8);
    const hero=new ProtagonistModel();hero.root.scale.setScalar(1.3);root.add(hero.root);
    let appearance=avatar,expressionOverride:number|undefined;
    function animateHero(dt:number,swing:number,moving=false){if(athlete)club.visible=false;walkTime+=dt;if(athlete)legs.forEach(({leg,foot},i)=>{const step=moving?Math.sin(walkTime*12+i*Math.PI):0;leg.rotation.x=step*.5;foot.position.z=.04+step*.22;foot.position.y=.1+Math.max(0,step)*.16;});hero.update(dt,athlete&&moving?'Walk':'Idle');root.userData.protagonistReady=hero.ready;const ready=hero.ready;hero.root.visible=ready;for(const child of root.children)if(child!==hero.root&&child!==torso)child.visible=!ready;
      // Animation must not reveal the unselected species, hair, face or accessories.
      const effective=expressionOverride===undefined?appearance:{...appearance,expression:expressionOverride};
      for(const child of torso.children)if(child!==arms)child.visible=!ready&&(!child.userData.visibleFor||child.userData.visibleFor(effective));
      leftArm.visible=rightArm.visible=!ready;
      if(ready){hero.pose('upper_arm.L',-.65,.50);hero.pose('upper_arm.R',-.65,-.50);hero.pose('forearm.L',-.45,.30);hero.pose('forearm.R',-.45,-.30);hero.pose('spine',.1,swing*.45);root.updateMatrixWorld(true);if(!athlete)hero.grip(club);}
    }
    function update(value: KartAvatar) {
      hero.set(value.protagonist);appearance=value;const effective=expressionOverride===undefined?value:{...value,expression:expressionOverride};
      skin.color.set(BODY_COLORS[value.body]); shirt.color.set(AVATAR_COLORS[value.outfit]);
      const palette = { body: BODY_COLORS[value.body], outfit: AVATAR_COLORS[value.outfit], hair: HAIR_COLORS[value.hair], eyeColor: EYE_COLORS[value.eyeColor ?? 0] };
      for (const { mesh, key } of colored) (mesh.material as T.MeshStandardMaterial).color.set(palette[key]);
      torso.children.forEach(m => { if (m.userData.visibleFor) m.visible = m.userData.visibleFor(effective); });
    }
    const setExpression=(expression?:number)=>{if(expressionOverride===expression)return;expressionOverride=expression;update(appearance);};
    update(avatar);
    return { hero, root, torso, arms, leftArm, rightArm, club, clubHead, update,setExpression,animateHero, dispose: () => {hero.dispose();owned.forEach(m => m.dispose());} };
  }
  return { create, dispose: () => { geometries.forEach(g => g.dispose()); sharedMaterials.forEach(m => m.dispose()); } };
}
export type GolferRig = ReturnType<ReturnType<typeof createGolferAssets>['create']>;

import {characterGeometry} from '../../three/storybookCharacters';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import * as T from 'three';
import { createAvatarParts } from '../gakuro-kart/avatarModels';
import { AVATAR_COLORS, BODY_COLORS, HAIR_COLORS, type KartAvatar } from '../gakuro-kart/avatar';

/** Shared GP face/hair/species assets, with a standing golf rig and articulated club. */
export function createGolferAssets() {
  const parts = createAvatarParts();
  const sphere = new T.SphereGeometry(1, 12, 8), cylinder = new T.CylinderGeometry(1, 1, 1, 8);
  const box = new RoundedBoxGeometry(1,1,1,2,.12),sleeve=characterGeometry('sleeve',sphere),mitten=characterGeometry('mitten',sphere),trouser=characterGeometry('trouser',cylinder),shoe=characterGeometry('shoe',box);
  const materials = [new T.MeshStandardMaterial({ color: '#66534b', roughness: .7 }),
    new T.MeshStandardMaterial({ color: '#d9e4ec', metalness: .8, roughness: .25 }),
    new T.MeshStandardMaterial({ color: '#493d3b', roughness: .8 })];
  const geometries = new Set<T.BufferGeometry>([sphere, cylinder, box,sleeve,mitten,trouser,shoe, ...parts.map(p => p.geometry)]);
  const sharedMaterials = new Set<T.Material>([...materials, ...parts.map(p => p.material)]);
  function create(avatar: KartAvatar) {
    const root = new T.Group(), torso = new T.Group(), arms = new T.Group();root.name="StorybookGolfer";
    const owned: T.Material[] = [], colored: { mesh: T.Mesh; key: 'body' | 'outfit' | 'hair' }[] = [];
    const skin = new T.MeshStandardMaterial({ roughness: .65 }), shirt = new T.MeshStandardMaterial({ roughness: .7 });
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
    add(torso, parts[0].geometry, shirt, [0, .2, -.13], [.86, .8, .6]);
    for (const side of [-1, 1]) {
      const leg = add(root, trouser, materials[0], [side * .25, .5, -.13], [.16, .85, .16]); leg.rotation.z = side * -.09;
      add(root, shoe, materials[2], [side * .29, .1, .04], [.35, .18, .55]);
    }
    arms.position.set(0, 1.55, -.1); torso.add(arms); arms.position.y -= 1;
    const leftArm = new T.Group(), rightArm = new T.Group();leftArm.position.x=-.34;rightArm.position.x=.34;arms.add(leftArm, rightArm);
    for (const side of [-1, 1]) {
      const limb = side === -1 ? leftArm : rightArm;
      const upper = add(limb, sleeve, shirt, [side * -.04, -.24, .19], [.16, .34, .16]); upper.rotation.z = side * -.4; upper.rotation.x = -.65;
      const lower = add(limb, sleeve, skin, [side * -.23, -.54, .48], [.12, .24, .12]); lower.rotation.z = side * -.25; lower.rotation.x = -.65;
      add(limb, mitten, skin, [side * -.28, -.7, .6], [.12, .12, .13]);
    }
    const club = new T.Group(); arms.add(club); club.position.set(0, -.72, .63);
    const shaft = add(club, cylinder, materials[1], [0, -.37, .27], [.025, .95, .025]); shaft.rotation.x = -.62;
    const clubHead = add(club, box, materials[1], [0, -.76, .56], [.31, .13, .17]);
    root.scale.setScalar(1.8);
    let appearance=avatar,expressionOverride:number|undefined;
    function update(value: KartAvatar) {
      appearance=value;const effective=expressionOverride===undefined?value:{...value,expression:expressionOverride};
      skin.color.set(BODY_COLORS[value.body]); shirt.color.set(AVATAR_COLORS[value.outfit]);
      const palette = { body: BODY_COLORS[value.body], outfit: AVATAR_COLORS[value.outfit], hair: HAIR_COLORS[value.hair] };
      for (const { mesh, key } of colored) (mesh.material as T.MeshStandardMaterial).color.set(palette[key]);
      torso.children.forEach(m => { if (m.userData.visibleFor) m.visible = m.userData.visibleFor(effective); });
    }
    const setExpression=(expression?:number)=>{if(expressionOverride===expression)return;expressionOverride=expression;update(appearance);};
    update(avatar);
    return { root, torso, arms, leftArm, rightArm, club, clubHead, update,setExpression, dispose: () => owned.forEach(m => m.dispose()) };
  }
  return { create, dispose: () => { geometries.forEach(g => g.dispose()); sharedMaterials.forEach(m => m.dispose()); } };
}
export type GolferRig = ReturnType<ReturnType<typeof createGolferAssets>['create']>;

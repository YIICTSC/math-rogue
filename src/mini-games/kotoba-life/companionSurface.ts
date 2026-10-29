import * as THREE from 'three';

type Surface = (u: THREE.Vector3) => THREE.Vector3;
type Pigment = (u: THREE.Vector3) => THREE.Color;

/** Owned by one companion. No downloads, shell transparency or per-frame fur simulation. */
export function createPlushWorkshop() {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  let seed = 7193;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  // Fine pile and woven cloth use separate, deterministic height fields. DataTexture
  // also permits geometry audits in Node, without a DOM or a canvas dependency.
  const heightMap = (woven: boolean) => {
    const size = 256, data = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const thread = woven ? Math.sin(x * Math.PI / 2) * Math.sin(y * Math.PI / 2)
        : Math.sin(x * 2.1 + Math.sin(y * .7) * 1.7) * Math.sin(y * .32 + x * .3);
      const value = 128 + (random() - .5) * (woven ? 40 : 55) + thread * (woven ? 50 : 65);
      const i = (y * size + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = value; data[i + 3] = 255;
    }
    const texture = new THREE.DataTexture(data, size, size);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.LinearFilter; texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.generateMipmaps = true; texture.repeat.set(woven ? 3 : 1, woven ? 3 : 1);
    texture.needsUpdate = true; textures.add(texture); return texture;
  };
  const pile = heightMap(false), weave = heightMap(true);
  const colorData = new Uint8Array(pile.image.data as Uint8Array);
  for (let i = 0; i < colorData.length; i += 4) {
    const value = 195 + colorData[i] * .23;
    colorData[i] = colorData[i + 1] = colorData[i + 2] = value;
  }
  // Texture.clone shares its Source; keep the albedo and height data independent.
  const pileColor = new THREE.DataTexture(colorData, 256, 256);
  pileColor.wrapS = pileColor.wrapT = THREE.RepeatWrapping;
  pileColor.magFilter = THREE.LinearFilter; pileColor.minFilter = THREE.LinearMipmapLinearFilter;
  pileColor.generateMipmaps = true; pileColor.repeat.copy(pile.repeat);
  pileColor.needsUpdate = true; textures.add(pileColor);
  const ownMaterial = <T extends THREE.Material>(m: T): T => { materials.add(m); return m; };
  const soft = ownMaterial(new THREE.MeshPhysicalMaterial({ color: '#ffffff', vertexColors: true, roughness: .93,
    sheen: .65, sheenColor: '#c5bcb1', sheenRoughness: .86, map: pileColor, bumpMap: pile, bumpScale: .026 }));
  const fiber = ownMaterial(new THREE.MeshPhysicalMaterial({ color: '#ffffff', vertexColors: true,
    roughness: .93, sheen: .65, sheenColor: '#c5bcb1', sheenRoughness: .86, side: THREE.DoubleSide }));
  const cloth = (color: string) => ownMaterial(new THREE.MeshPhysicalMaterial({ color, roughness: .97,
    sheen: .7, sheenColor: color, sheenRoughness: .9, bumpMap: weave, bumpScale: .006, side: THREE.DoubleSide }));
  const smooth = (color: string, roughness = .55) => ownMaterial(new THREE.MeshPhysicalMaterial({ color,
    roughness, metalness: 0, clearcoat: roughness < .3 ? .8 : 0, clearcoatRoughness: .13 }));
  const mesh = (parent: THREE.Object3D, geometry: THREE.BufferGeometry, material: THREE.Material) => {
    geometries.add(geometry); const m = new THREE.Mesh(geometry, material);
    m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  };
  const ballGeometry = new THREE.SphereGeometry(1, 32, 24); geometries.add(ballGeometry);
  const ball = (parent: THREE.Object3D, material: THREE.Material, at: number[], size: number[]) => {
    const m = mesh(parent, ballGeometry, material); m.position.set(at[0], at[1], at[2]); m.scale.set(size[0], size[1], size[2]); return m;
  };
  /** Sculpted sphere plus short tapered fibers, batched into ONE mesh per body part.
   * Pigment is shared by skin and fibers, so facial markings have no floating patches. */
  const plush = (parent: THREE.Object3D, at: number[], size: number[], color: string | Pigment,
    options: { count?: number; length?: number; shape?: Surface; detail?: boolean } = {}) => {
    const group = new THREE.Group(); group.position.set(at[0], at[1], at[2]); parent.add(group);
    const baseColor = typeof color === 'string' ? new THREE.Color(color) : null;
    const pigment: Pigment = typeof color === 'function' ? color : () => baseColor!.clone();
    const shape: Surface = u => {
      const p = options.shape ? options.shape(u.clone()) : u.clone();
      return p.multiply(new THREE.Vector3(size[0], size[1], size[2]));
    };
    const geometry = new THREE.SphereGeometry(1, options.detail ? 112 : 40, options.detail ? 80 : 28);
    const positions = geometry.getAttribute('position'); const colors: number[] = [];
    for (let i = 0; i < positions.count; i++) {
      const u = new THREE.Vector3().fromBufferAttribute(positions, i), p = shape(u);
      positions.setXYZ(i, p.x, p.y, p.z); const c = pigment(u); colors.push(c.r, c.g, c.b);
    }
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); geometry.computeVertexNormals();
    mesh(group, geometry, soft);
    const count = options.count ?? 700, length = options.length ?? .013;
    const vertices: number[] = [], normals: number[] = [], tint: number[] = [];
    const up = new THREE.Vector3(0, 1, 0);
    const addVertex = (v: THREE.Vector3, n: THREE.Vector3, c: THREE.Color, light: number) => {
      vertices.push(v.x, v.y, v.z); normals.push(n.x, n.y, n.z); tint.push(c.r * light, c.g * light, c.b * light);
    };
    for (let i = 0; i < count; i++) {
      const y = 1 - 2 * random(), phi = random() * Math.PI * 2, r = Math.sqrt(1 - y * y);
      const u = new THREE.Vector3(r * Math.cos(phi), y, r * Math.sin(phi));
      const p = shape(u), normal = new THREE.Vector3(u.x / size[0], u.y / size[1], u.z / size[2]).normalize();
      const tangent = new THREE.Vector3().crossVectors(Math.abs(normal.y) > .98 ? new THREE.Vector3(1, 0, 0) : up, normal).normalize();
      const across = tangent.clone().multiplyScalar(.0007 + random() * .0007);
      const tip = p.clone().addScaledVector(normal, length * (.55 + random() * .7)).addScaledVector(tangent, (random() - .5) * length * .6);
      const mid = p.clone().lerp(tip, .58).addScaledVector(up, -.002);
      const c = pigment(u).multiplyScalar(.91 + random() * .12);
      const a = p.clone().sub(across), b = p.clone().add(across), d = mid.clone().addScaledVector(across, .5), e = mid.clone().addScaledVector(across, -.5);
      for (const [v, light] of [[a, .94], [b, .94], [d, 1], [a, .94], [d, 1], [e, 1], [e, 1], [d, 1], [tip, 1.02]] as const) addVertex(v, normal, c, light);
    }
    const hairs = new THREE.BufferGeometry();
    hairs.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); hairs.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    hairs.setAttribute('color', new THREE.Float32BufferAttribute(tint, 3));
    const furMesh = mesh(group, hairs, fiber); furMesh.castShadow = false;
    furMesh.name = 'short-pile';
    // Pointer picking and eye-visibility audits use the solid surface, not individual fibers.
    furMesh.raycast = () => {};
    return group;
  };
  const thread = (parent: THREE.Object3D, points: number[][], material: THREE.Material, radius = .006) => {
    const path = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(p[0], p[1], p[2])));
    return mesh(parent, new THREE.TubeGeometry(path, Math.max(12, points.length * 5), radius, 5, false), material);
  };
  return { plush, mesh, ball, cloth, smooth, ownMaterial, thread,
    dispose: () => { geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose()); } };
}

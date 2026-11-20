import * as THREE from 'three';
import { assetUrl } from '../../utils/assetPaths';
import manifest from './corridor-photos.json';

export function corridorPhotos(key: string, fallback: THREE.Texture) {
  const centers: number[][] = (manifest as Record<string, number[][]>)[key] ?? [];
  const slots = { value: [fallback, fallback, fallback] };
  const bounds = { value: Array.from({ length: 3 }, () => new THREE.Vector3()) };
  const cache = new Map<number, { image: HTMLImageElement; texture?: THREE.Texture; loadedAt: number }>();
  let nearby: number[] = [];
  let nextScan = 0;

  function release(index: number) {
    const entry = cache.get(index);
    if (!entry) return;
    cache.delete(index);
    entry.image.onload = null;
    if (entry.texture) entry.texture.dispose();
    else entry.image.removeAttribute('src');
  }

  return {
    uniforms: { corridorMaps: slots, corridorBounds: bounds },
    update(x: number, z: number) {
      if (!centers.length) return;
      const now = performance.now();
      if (now >= nextScan) {
        nextScan = now + 200;
        nearby = centers
          .map(([cx, cz], index) => ({ index, distance: Math.hypot(x - cx, z - cz) }))
          .filter(({ distance }) => distance < 17000)
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 5)
          .map(({ index }) => index);
        for (const index of cache.keys()) if (!nearby.includes(index)) release(index);
        for (const index of nearby) {
          if (cache.has(index)) continue;
          const image = new Image();
          const entry: { image: HTMLImageElement; texture?: THREE.Texture; loadedAt: number } = {
            image, loadedAt: 0,
          };
          cache.set(index, entry);
          image.crossOrigin = 'anonymous';
          image.onload = () => {
            const texture = new THREE.Texture(image);
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.anisotropy = fallback.anisotropy;
            texture.needsUpdate = true;
            entry.texture = texture;
            entry.loadedAt = performance.now();
          };
          image.src = assetUrl(`sprites/flight-school/routes/corridors/${key}-${index}.webp`);
        }
      }

      for (let i = 0; i < 3; i++) {
        const index = nearby[i];
        const entry = cache.get(index);
        slots.value[i] = entry?.texture ?? fallback;
        const [cx, cz] = centers[index] ?? [0, 0];
        bounds.value[i].set(cx, cz, entry?.texture ? Math.min(1, (now - entry.loadedAt) / 400) : 0);
      }
    },
    dispose() {
      for (const index of cache.keys()) release(index);
    },
  };
}

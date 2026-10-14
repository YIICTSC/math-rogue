import * as T from 'three';

export const seatColor = (seat: number) => new T.Color().setHSL((seat * .61803398875) % 1, .62, .67);
export type ScreenMarker = {id: string; number: number; name?: string; point: T.Vector3; self?: boolean; angle?: number};

/** DOM labels remain legible when the full map scales its 3D actors down. */
export function createScreenMarkers(host: HTMLElement) {
  const layer = document.createElement('div'); layer.className = 'gear-map-markers'; layer.setAttribute('aria-hidden', 'true'); layer.setAttribute('data-allow-japanese','true'); host.appendChild(layer);
  const labels = new Map<string, HTMLDivElement>();
  const frustum = new T.Frustum(), projection = new T.Matrix4();
  return {
    draw(camera: T.Camera, markers: ScreenMarker[], overview: boolean) {
      camera.updateMatrixWorld(); projection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse); frustum.setFromProjectionMatrix(projection);
      const active = new Set(markers.map(m => m.id));
      for (const [id, label] of labels) if (!active.has(id)) {label.remove(); labels.delete(id);}
      for (const marker of markers) {
        let label = labels.get(marker.id);
        if (!label) { label = document.createElement('div'); layer.appendChild(label); labels.set(marker.id, label); }
        label.className = `gear-map-marker${marker.self ? ' is-self' : ''}`;
        label.hidden = !frustum.containsPoint(marker.point);
        if (label.hidden) continue;
        const point = marker.point.clone().project(camera);
        label.style.left = `${(point.x + 1) * 50}%`; label.style.top = `${(1 - point.y) * 50}%`;
        label.style.setProperty('--seat-color', `#${seatColor(marker.number).getHexString()}`);
        const name = !overview && marker.name ? ` ${marker.name.slice(0, 12)}` : '';
        label.textContent = `${marker.self ? '➤ ' : ''}${marker.number}${name}`;
        label.title = marker.name || String(marker.number);
        label.dataset.seat = String(marker.number);
      }
    },
    dispose() { layer.remove(); labels.clear(); }
  };
}

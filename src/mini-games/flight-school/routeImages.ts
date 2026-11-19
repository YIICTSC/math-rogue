import { assetUrl } from '../../utils/assetPaths';
import { photo, type Region } from './routes';
import type { RouteImages } from './routeScene';
async function loadImage(key: string) {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  return new Promise<HTMLImageElement>((resolve, reject) => {
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(key));
    image.src = assetUrl(photo(key));
  });
}
export function loadRouteImages(region: Region, reverse: boolean): Promise<RouteImages> {
  return Promise.all([
    loadImage(region.key),
    loadImage(region.ports[reverse ? 1 : 0].code),
    loadImage(region.ports[reverse ? 0 : 1].code),
  ]);
}

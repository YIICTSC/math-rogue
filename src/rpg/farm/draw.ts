import {plotPosition} from './land';
import {animalPose} from '../lifestyle/animalMotion';
import type { World } from "../engine";
import { assetUrl } from "../../utils/assetPaths";
import { cropById } from "./catalog";
import { farmImage } from "./Sprite";
const images = new Map<string, HTMLImageElement>();
export function drawFarmSprite(
  c: CanvasRenderingContext2D,
  kind: Parameters<typeof farmImage>[0],
  id: string,
  x: number,
  y: number,
  size: number,
  pose?:ReturnType<typeof animalPose>,
) {
  const row=['retriever','graytabby','cow','chicken'].indexOf(id);
  if(pose&&row>=0){const path=assetUrl('sprites/rpg/lifestyle/animal-poses.webp');let sheet=images.get(path);if(!sheet){sheet=new Image();sheet.src=path;images.set(path,sheet);}if(sheet.complete&&sheet.naturalWidth){const col=['greet','roll','sleep','hop'].indexOf(pose);c.drawImage(sheet,col*sheet.naturalWidth/4,row*sheet.naturalHeight/4,sheet.naturalWidth/4,sheet.naturalHeight/4,x-size/2,y-size,size,size);return;}}
  const path = farmImage(kind, id);
  let image = images.get(path);
  if (!image) {
    image = new Image();
    image.src = assetUrl(path);
    images.set(path, image);
  }
  if (image.complete && image.naturalWidth)
    c.drawImage(image, x - size / 2, y - size, size, size);
}
export function drawFarms(
  c: CanvasRenderingContext2D,
  w: World,
  time: number,
  motion: boolean,
  bounds?: { minX: number; maxX: number; minY: number; maxY: number },
) {
  for (const f of Object.values(w.farm?.people || {})) {
    if (
      f.x === undefined ||
      f.y === undefined
    )
      continue;
    const x = f.x * 16,
      y = f.y * 16;
    for (const plot of f.plots) {
      const xy=plotPosition(f,plot);if(!xy)continue;const px=xy.x*16,py=xy.y*16;
      c.fillStyle = plot.water === (w.town?.day || 0) ? "#61472f" : "#89633e";
      c.fillRect(px + 1, py + 3, 14, 12);
      c.fillStyle = "#a37a49";
      for (let i = 0; i < 3; i++) c.fillRect(px + 2, py + 5 + i * 3, 12, 1);
      const crop = cropById(plot.crop || "");
      if (crop) {
        const size =
          plot.growth === 0 ? 13 : plot.growth >= crop.days ? 25 : 19;
        drawFarmSprite(c, "crop", crop.id, px + 8, py + 16, size);
        if (plot.growth >= crop.days) {
          c.fillStyle = "#ffe187";
          c.fillRect(px + 11, py + 3, 3, 3);
        }
      }
    }
    f.animals.forEach((animal, i) => {
      const px = x + 8 + (i % 6) * 16,
        py = y + (i < 6 ? 13 : 95);
      drawFarmSprite(
        c,
        "animal",
        animal.kind,
        px,
        py + (motion ? Math.sin(time / 500 + i) * 0.4 : 0),
        20,
        motion?animalPose(animal,w.life.time):undefined,
      );
      if (animal.ready) {
        c.fillStyle = "#ffe187";
        c.fillRect(px + 5, py - 16, 2, 2);
      }
    });
  }
}

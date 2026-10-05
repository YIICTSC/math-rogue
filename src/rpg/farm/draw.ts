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
      f.y === undefined ||
      (bounds &&
        (f.x + 7 < bounds.minX ||
          f.x > bounds.maxX ||
          f.y + 7 < bounds.minY ||
          f.y > bounds.maxY))
    )
      continue;
    const x = f.x * 16,
      y = f.y * 16;
    c.fillStyle = "#789453";
    c.fillRect(x, y, 112, 112);
    c.strokeStyle = "#ccba86";
    c.lineWidth = 1;
    c.strokeRect(x + 1, y + 1, 110, 110);
    for (let dx = 0; dx < 7; dx++) {
      c.fillStyle = "#b69d67";
      c.fillRect(x + dx * 16, y, 2, 5);
      c.fillRect(x + dx * 16, y + 107, 2, 5);
    }
    for (const plot of f.plots) {
      const px = x + (plot.slot % 6) * 16,
        py = y + (Math.floor(plot.slot / 6) + 1) * 16;
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
  for (const [id, f] of Object.entries(w.farm?.people || {})) {
    const p = w.players[id];
    if (!p || p.spectator || p.life?.indoors) continue;
    const following = f.pets.find((p) => p.id === f.activePet && !p.awayUntil);
    if (
      following &&
      (!bounds ||
        (p.x >= bounds.minX &&
          p.x <= bounds.maxX &&
          p.y >= bounds.minY &&
          p.y <= bounds.maxY))
    )
      drawFarmSprite(
        c,
        "pet",
        following.kind,
        p.x * 16 + 20,
        p.y * 16 + 15 + (motion ? Math.sin(time / 200) * 1 : 0),
        22,
        motion?animalPose(following,w.life.time):undefined,
      );
    if (
      f.x !== undefined &&
      f.y !== undefined &&
      (!bounds ||
        (f.x + 7 >= bounds.minX &&
          f.x <= bounds.maxX &&
          f.y + 7 >= bounds.minY &&
          f.y <= bounds.maxY))
    )
      f.pets
        .slice(0, 6)
        .forEach((pet, i) => !pet.awayUntil&&pet.id!==following?.id&&
          drawFarmSprite(
            c,
            "pet",
            pet.kind,
            (f.x! + i) * 16 + 8,
            (f.y! + 6) * 16 + 15,
            18,
            motion?animalPose(pet,w.life.time):undefined,
          ),
        );
  }
}

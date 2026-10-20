/** Run the Blender generator first; keep lossless authoring renders out of the download packs. */
import sharp from "sharp";
for (const name of ["weapons", "scenery", "effects"]) {
  await sharp(`assets/schoolyard-survivor/renders/${name}.png`)
    .webp({ quality: 90, alphaQuality: 100 })
    .toFile(`public/sprites/schoolyard-survivor/${name}.webp`);
}
console.log(
  "Schoolyard Survivor Blender atlases converted to WebP. Regenerate the web and Android asset manifests.",
);

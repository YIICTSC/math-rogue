/** Keep alpha on browsers that fall back to PNG when WebP encoding is unavailable. */
export function encodeHeroImage(canvas: HTMLCanvasElement): string {
  let image = canvas.toDataURL("image/webp", 0.8);
  for (const quality of [0.65, 0.5, 0.35, 0.2]) {
    if (image.length <= 11000) return image;
    image = canvas.toDataURL("image/webp", quality);
  }
  for (const width of [128, 96, 80, 64, 48, 40, 32]) {
    if (image.length <= 11000) return image;
    const smaller = document.createElement("canvas");
    smaller.width = width;
    smaller.height = Math.round((canvas.height / canvas.width) * width);
    smaller
      .getContext("2d")!
      .drawImage(canvas, 0, 0, smaller.width, smaller.height);
    image = smaller.toDataURL("image/webp", 0.65);
  }
  return image;
}

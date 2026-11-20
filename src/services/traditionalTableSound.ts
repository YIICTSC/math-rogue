export const TABLE_MATERIALS = [
  'ivory',
  'resin',
  'bamboo',
  'wood',
  'peg',
  'flick',
  'drop',
  'pocket',
] as const;
export type TableMaterial = (typeof TABLE_MATERIALS)[number];
export const TABLE_MATERIAL_GAIN: Record<TableMaterial, number> = {
  ivory: 0.62,
  resin: 0.5,
  bamboo: 0.62,
  wood: 0.65,
  peg: 0.42,
  flick: 0.45,
  drop: 0.48,
  pocket: 0.5,
};
export const tableMaterialNames = () =>
  TABLE_MATERIALS.flatMap((kind) => [0, 1, 2].map((take) => `traditional-table/${kind}-${take}`));
export function nextMaterialTake(previous: number | undefined, random = Math.random) {
  return previous === undefined
    ? Math.floor(random() * 3)
    : (previous + 1 + Math.floor(random() * 2)) % 3;
}
/** A compact, damped material impact if the packaged foley cannot be played. */
export function materialFallback(ctx: BaseAudioContext, kind: TableMaterial): AudioBuffer {
  const wooden = !['ivory', 'resin'].includes(kind);
  const seconds = kind === 'pocket' || kind === 'drop' ? 0.2 : 0.13;
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * seconds), ctx.sampleRate);
  const samples = buffer.getChannelData(0);
  const base = kind === 'bamboo' ? 1650 : wooden ? 910 : 2350;
  let noise = 9147;
  for (let i = 0; i < samples.length; i++) {
    const t = i / ctx.sampleRate;
    noise = (Math.imul(noise, 1664525) + 1013904223) >>> 0;
    const grain = (noise / 0x80000000 - 1) * Math.exp(-t * 320) * 0.28;
    const body =
      Math.sin(2 * Math.PI * base * t) * Math.exp(-t * 75) * 0.25 +
      Math.sin(2 * Math.PI * base * 2.37 * t) * Math.exp(-t * 130) * 0.13 +
      Math.sin(2 * Math.PI * (wooden ? 270 : 480) * t) * Math.exp(-t * 70) * 0.1;
    samples[i] = (grain + body) * Math.min(1, t / 0.0006) * Math.min(1, (seconds - t) / 0.02);
  }
  return buffer;
}

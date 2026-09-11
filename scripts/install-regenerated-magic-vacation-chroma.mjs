import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const projectRoot = process.cwd();
const historyRoot = 'C:/Users/myfav/.codex/generated_images/01a078a5-0e8f-7f21-800a-6f63f3c47e47';

const jobs = [
  ['05', 'idle', 'before', 'exec-dbe7d7ac-5080-4c0e-8747-25f6f543d57a.png', 'green'],
  ['05', 'idle', 'after', 'exec-b4391dc3-dc41-40e4-b203-97f2136549bc.png', 'green'],
  ['05', 'idle-special', 'before', 'exec-c6ea4d44-84cd-4cd2-b417-81eb4bfdbddc.png', 'green'],
  ['05', 'idle-special', 'after', 'exec-160aa747-def8-40b1-924b-e8a36592ea59.png', 'green'],
  ['05', 'attack', 'before', 'exec-3068fe39-e9ee-4b45-a081-92d866451ce8.png', 'green'],
  ['05', 'attack', 'after', 'exec-32be550e-2f94-4d2a-8307-7656b7b26ffd.png', 'green'],
  ['05', 'skill', 'before', 'exec-dc62292d-79d4-4495-a34b-b4e152b9ae32.png', 'green'],
  ['05', 'skill', 'after', 'exec-31025fec-534a-4c22-a79c-b84a26fa1d30.png', 'green'],
  ['05', 'hit', 'before', 'exec-2b155cd6-ea7d-43f9-b78c-0c293074fdaf.png', 'green'],
  ['05', 'hit', 'after', 'exec-4246c24d-3cd2-49f7-bfc6-64a34460388b.png', 'green'],
  ['05', 'low-hp', 'before', 'exec-af6e87da-9a1b-4081-96bd-7138d3d91cb7.png', 'green'],
  ['05', 'low-hp', 'after', 'exec-a252d158-2a01-4052-a0d6-92f10c055689.png', 'green'],

  ['06', 'idle', 'before', 'exec-4bf89593-24ad-4b45-9389-3d79acd8b947.png', 'magenta'],
  ['06', 'idle', 'after', 'exec-880effa1-92ae-475b-9152-ad67940c06bd.png', 'magenta'],
  ['06', 'idle-special', 'before', 'exec-40e150d4-5257-4d06-a9a2-857ae68eae1c.png', 'magenta'],
  ['06', 'idle-special', 'after', 'exec-e3873ac4-25bc-4412-a66e-82fba32120c4.png', 'magenta'],
  ['06', 'attack', 'before', 'exec-80c7606b-4ef2-4a5c-b6f5-3c6b7d4e282a.png', 'magenta'],
  ['06', 'attack', 'after', 'exec-99c4b081-ceaf-469d-8749-352a91f0eeb4.png', 'magenta'],
  ['06', 'skill', 'before', 'exec-2008624d-c226-4179-92b7-e3663b167683.png', 'magenta'],
  ['06', 'skill', 'after', 'exec-6c68ae77-733f-48c1-af01-e0751a3e25c2.png', 'magenta'],
  ['06', 'hit', 'before', 'exec-58f5f910-e1b6-4acd-81e5-2e5af9dfb952.png', 'magenta'],
  ['06', 'hit', 'after', 'exec-f0fa31a1-0141-44a2-8ce3-bf4e2f5fc34c.png', 'magenta'],
  ['06', 'low-hp', 'before', 'exec-728c4963-5cc0-41df-acbc-b2d06e2f4201.png', 'magenta'],
  ['06', 'low-hp', 'after', 'exec-ed458016-9a18-4f88-9ee6-b0b2b540429c.png', 'magenta'],

  ['07', 'idle', 'before', 'exec-934befac-99bc-4899-854d-b7803906b61d.png', 'magenta'],
  ['07', 'idle', 'after', 'exec-9cfcde5c-33e2-46bd-9fa7-8508cc95baca.png', 'magenta'],
  ['07', 'idle-special', 'before', 'exec-c5e83fab-4d8b-4e13-b3ad-79ec353fb3e5.png', 'magenta'],
  ['07', 'idle-special', 'after', 'exec-2a8307ba-adcb-452e-bfe3-d92e59417029.png', 'magenta'],
  ['07', 'attack', 'before', 'exec-0f3f3f24-474e-4d75-9469-e8af3fc3ad05.png', 'magenta'],
  ['07', 'attack', 'after', 'exec-847feebe-5253-41d7-9930-27c51fa7b052.png', 'magenta'],
  ['07', 'skill', 'before', 'exec-d12f3615-8351-46f4-94fe-39eeac4f9134.png', 'magenta'],
  ['07', 'skill', 'after', 'exec-60dd7c95-163e-4190-ac08-15962272a9f4.png', 'magenta'],
  ['07', 'hit', 'before', 'exec-9550c110-633f-48e3-9511-faa120de3cf4.png', 'magenta'],
  ['07', 'hit', 'after', 'exec-e61cae56-0236-4b38-8ccc-5d13d03724ff.png', 'magenta'],
  ['07', 'low-hp', 'before', 'exec-bf70458e-f24c-46b7-b9ae-4c2b42ee5053.png', 'magenta'],
  ['07', 'low-hp', 'after', 'exec-cb6a6ad4-7b3d-44e2-a4d3-d53f50d416f0.png', 'magenta'],

  ['08', 'idle', 'before', 'exec-bdd41e47-35ec-4269-aee4-d13b607086b7.png', 'green'],
  ['08', 'idle', 'after', 'exec-86a1f1d6-68f4-42c8-bd21-b9c17a3ccbba.png', 'green'],
  ['08', 'idle-special', 'before', 'exec-399ef90f-0033-46c9-96a8-86cfec5466fb.png', 'green'],
  ['08', 'idle-special', 'after', 'exec-101cf56a-95e1-4120-a15c-eb8c697bdf5a.png', 'green'],
  ['08', 'attack', 'before', 'exec-9490ac3e-7aab-4179-a363-75e50c7c487e.png', 'green'],
  ['08', 'attack', 'after', 'exec-701cc785-495f-44cf-ae47-49071a7f529c.png', 'green'],
  ['08', 'skill', 'before', 'exec-9aa318a5-d977-4e4c-bc55-3a2a9270f46b.png', 'green'],
  ['08', 'skill', 'after', 'exec-ad5f1a7b-580d-4178-92b7-9e9380d116cf.png', 'green'],
  ['08', 'hit', 'before', 'exec-df9a1806-6ec3-46f2-98e1-160aebd30184.png', 'green'],
  ['08', 'hit', 'after', 'exec-cdbfbaaf-7f75-4e30-b1e2-88b73f3038f4.png', 'green'],
  ['08', 'low-hp', 'before', 'exec-4f6da273-fe76-4bd9-87da-ff1fe3f46753.png', 'green'],
  ['08', 'low-hp', 'after', 'exec-2e1b0324-435e-42fd-88e5-7cef6619a6ab.png', 'green'],
];

const distanceToKey = (r, g, b, key) => {
  const [kr, kg, kb] = key === 'green' ? [0, 255, 0] : [255, 0, 255];
  return Math.hypot(r - kr, g - kg, b - kb);
};

for (const [subject, action, form, generatedName, key] of jobs) {
  const sourcePath = path.join(historyRoot, generatedName);
  const targetPath = path.join(
    projectRoot,
    'public',
    'sprites',
    'magic',
    `vacation-characters-${action}-sheets`,
    `heroine-${subject}-${form}.webp`,
  );
  const source = await sharp(await fs.readFile(sourcePath)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (source.info.width !== 1254 || source.info.height !== 1254) {
    throw new Error(`${generatedName}: expected 1254x1254, got ${source.info.width}x${source.info.height}`);
  }
  const output = Buffer.from(source.data);
  let removed = 0;
  for (let index = 0; index < source.info.width * source.info.height; index += 1) {
    const offset = index * 4;
    const alpha = output[offset + 3];
    if (alpha === 0) continue;
    const distance = distanceToKey(output[offset], output[offset + 1], output[offset + 2], key);
    if (distance <= 95) {
      output[offset] = 0;
      output[offset + 1] = 0;
      output[offset + 2] = 0;
      output[offset + 3] = 0;
      removed += 1;
    }
  }
  for (let index = 0; index < source.info.width * source.info.height; index += 1) {
    const offset = index * 4;
    if (output[offset + 3] !== 0) continue;
    output[offset] = 0;
    output[offset + 1] = 0;
    output[offset + 2] = 0;
  }
  await sharp(output, { raw: source.info })
    .webp({ quality: 95, alphaQuality: 100, effort: 6 })
    .toFile(targetPath);
  console.log(`${path.relative(projectRoot, targetPath)} <- ${generatedName} (${key}, removed ${removed})`);
}

console.log(`Installed ${jobs.length} regenerated vacation sheets.`);

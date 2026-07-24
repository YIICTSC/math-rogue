import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { access, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('release/steam/win-unpacked');
const executable = path.join(root, 'LearningRogue.exe');
const asar = path.join(root, 'resources', 'app.asar');
const buildMetadataPath = path.resolve('dist/steam-build.json');

await Promise.all([
  access(executable),
  access(asar),
  access(buildMetadataPath),
]);

const buildMetadata = JSON.parse(await readFile(buildMetadataPath, 'utf8'));
if (
  buildMetadata.platform !== 'steam'
  || buildMetadata.paidEdition !== true
  || buildMetadata.offlineDistributable !== false
) {
  throw new Error(`Unexpected Steam build metadata: ${JSON.stringify(buildMetadata)}`);
}

const hashFile = filePath => new Promise((resolve, reject) => {
  const hash = createHash('sha256');
  const stream = createReadStream(filePath);
  stream.on('error', reject);
  stream.on('data', chunk => hash.update(chunk));
  stream.on('end', () => resolve(hash.digest('hex')));
});

const [executableStat, asarStat, executableSha256, asarSha256] = await Promise.all([
  stat(executable),
  stat(asar),
  hashFile(executable),
  hashFile(asar),
]);

const manifest = {
  version: JSON.parse(await readFile('package.json', 'utf8')).version,
  platform: 'windows',
  architecture: 'x64',
  runtimePlatform: buildMetadata.platform,
  paidEdition: buildMetadata.paidEdition,
  offlineDistributable: buildMetadata.offlineDistributable,
  generatedAt: buildMetadata.generatedAt,
  files: {
    'LearningRogue.exe': {
      bytes: executableStat.size,
      sha256: executableSha256,
    },
    'resources/app.asar': {
      bytes: asarStat.size,
      sha256: asarSha256,
    },
  },
};

const output = path.resolve('release/steam/build-manifest.json');
await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(manifest, null, 2)}\n`);

process.stdout.write([
  'Steam build verification passed.',
  `Executable: ${(executableStat.size / 1024 / 1024).toFixed(1)} MiB`,
  `App resources: ${(asarStat.size / 1024 / 1024).toFixed(1)} MiB`,
  `Manifest: ${path.relative(process.cwd(), output)}`,
  '',
].join('\n'));

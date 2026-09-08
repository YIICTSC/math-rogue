import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const sprites = path.join(root, 'public', 'sprites');
const outputPath = path.join(root, 'src', 'data', 'vacationAnimationAnchors.generated.ts');
const subjects = [];
const animationActions = ['idle', 'idle-special', 'attack', 'skill', 'hit', 'low-hp'];

const addSubject = (assetPath, filePath, specialAssetPath, specialFilePath) => {
  subjects.push({ assetPath, filePath, specialAssetPath, specialFilePath });
};

for (let index = 0; index < 9; index += 1) {
  addSubject(
    `sprites/high-school/vacation-characters-idle-sheets/${index}.webp`,
    path.join(sprites, 'high-school', 'vacation-characters-idle-sheets', `${index}.webp`),
    `sprites/high-school/vacation-characters-idle-special-sheets/${index}.webp`,
    path.join(sprites, 'high-school', 'vacation-characters-idle-special-sheets', `${index}.webp`),
  );
}

for (let index = 1; index <= 9; index += 1) {
  const heroine = `heroine-${String(index).padStart(2, '0')}`;
  for (const form of ['before', 'after']) {
    addSubject(
      `sprites/magic/vacation-characters-idle-sheets/${heroine}-${form}.webp`,
      path.join(sprites, 'magic', 'vacation-characters-idle-sheets', `${heroine}-${form}.webp`),
      `sprites/magic/vacation-characters-idle-special-sheets/${heroine}-${form}.webp`,
      path.join(sprites, 'magic', 'vacation-characters-idle-special-sheets', `${heroine}-${form}.webp`),
    );
  }
}

for (const subject of ['ren', 'soma', 'minato', 'riku', 'yamato', 'leon', 'elliot', 'sakuya']) {
  for (const form of ['before', 'after']) {
    addSubject(
      `sprites/magic/vacation-male-characters-idle-sheets/${subject}-${form}.webp`,
      path.join(sprites, 'magic', 'vacation-male-characters-idle-sheets', `${subject}-${form}.webp`),
      `sprites/magic/vacation-male-characters-idle-special-sheets/${subject}-${form}.webp`,
      path.join(sprites, 'magic', 'vacation-male-characters-idle-special-sheets', `${subject}-${form}.webp`),
    );
  }
}

const readRaw = async filePath => sharp(await fs.readFile(filePath)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

const findAnchor = (data, info, frame) => {
  const cellWidth = Math.floor(info.width / 2);
  const cellHeight = Math.floor(info.height / 2);
  const xOffset = (frame % 2) * cellWidth;
  const yOffset = Math.floor(frame / 2) * cellHeight;
  const alphaAt = (x, y) => data[((yOffset + y) * info.width + xOffset + x) * 4 + 3];
  let maxY = 0;
  let minX = cellWidth;
  let maxX = -1;
  let opaquePixelCount = 0;

  for (let y = 0; y < cellHeight; y += 1) {
    for (let x = 0; x < cellWidth; x += 1) {
      if (alphaAt(x, y) <= 8) continue;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      opaquePixelCount += 1;
    }
  }

  if (opaquePixelCount === 0) return null;

  return { centerX: Math.round((minX + maxX) / 2), bottomY: maxY, cellWidth, cellHeight };
};

const entries = {};
const specialEntries = {};
const animationEntries = {};
for (const subject of subjects) {
  const raw = await readRaw(subject.filePath);
  const anchors = Array.from({ length: 4 }, (_, frame) => findAnchor(raw.data, raw.info, frame));
  if (anchors.every(Boolean)) {
    const normalizedAnchors = anchors.map(anchor => ({
      centerX: anchor.centerX,
      bottomY: anchor.bottomY,
      cellWidth: anchor.cellWidth,
      cellHeight: anchor.cellHeight,
    }));
    entries[subject.assetPath] = normalizedAnchors;
    animationEntries[subject.assetPath] = normalizedAnchors;
  }
  const specialRaw = await readRaw(subject.specialFilePath);
  const specialAnchors = Array.from({ length: 4 }, (_, frame) => findAnchor(specialRaw.data, specialRaw.info, frame));
  if (specialAnchors.every(Boolean)) {
    const normalizedSpecialAnchors = specialAnchors.map(anchor => ({
      centerX: anchor.centerX,
      bottomY: anchor.bottomY,
      cellWidth: anchor.cellWidth,
      cellHeight: anchor.cellHeight,
    }));
    specialEntries[subject.specialAssetPath] = normalizedSpecialAnchors;
    animationEntries[subject.specialAssetPath] = normalizedSpecialAnchors;
  }
  for (const action of animationActions.slice(2)) {
    const actionAssetPath = subject.assetPath
      .replace('/vacation-characters-idle-sheets/', `/vacation-characters-${action}-sheets/`)
      .replace('/vacation-male-characters-idle-sheets/', `/vacation-male-characters-${action}-sheets/`);
    const actionFilePath = subject.filePath
      .replace(`${path.sep}vacation-characters-idle-sheets${path.sep}`, `${path.sep}vacation-characters-${action}-sheets${path.sep}`)
      .replace(`${path.sep}vacation-male-characters-idle-sheets${path.sep}`, `${path.sep}vacation-male-characters-${action}-sheets${path.sep}`);
    try {
      const actionRaw = await readRaw(actionFilePath);
      const actionAnchors = Array.from({ length: 4 }, (_, frame) => findAnchor(actionRaw.data, actionRaw.info, frame));
      if (actionAnchors.every(Boolean)) {
        animationEntries[actionAssetPath] = actionAnchors.map(anchor => ({
          centerX: anchor.centerX,
          bottomY: anchor.bottomY,
          cellWidth: anchor.cellWidth,
          cellHeight: anchor.cellHeight,
        }));
      }
    } catch {
      // Some legacy characters do not have every optional action sheet.
    }
  }
}

const output = `// Generated by scripts/generate-vacation-animation-anchors.mjs. Do not edit manually.\n\n` +
  `export interface VacationAnimationFrameAnchor {\n` +
  `  centerX: number;\n` +
  `  bottomY: number;\n` +
  `  cellWidth: number;\n` +
  `  cellHeight: number;\n` +
  `}\n\n` +
  `export const VACATION_ANIMATION_FRAME_ANCHORS: Record<string, VacationAnimationFrameAnchor[]> = ${JSON.stringify(animationEntries, null, 2)};\n\n` +
  `export const VACATION_IDLE_FRAME_ANCHORS: Record<string, VacationAnimationFrameAnchor[]> = ${JSON.stringify(entries, null, 2)};\n\n` +
  `export const VACATION_IDLE_SPECIAL_FRAME_ANCHORS: Record<string, VacationAnimationFrameAnchor[]> = ${JSON.stringify(specialEntries, null, 2)};\n\n` +
  `const getAssetPath = (source: string | null): string | null => {\n` +
  `  if (!source) return null;\n` +
  `  const marker = 'sprites/';\n` +
  `  const markerIndex = source.indexOf(marker);\n` +
  `  if (markerIndex < 0) return null;\n` +
  `  return source.slice(markerIndex).split('?')[0];\n` +
  `};\n\n` +
  `export const getVacationIdleFrameAnchor = (source: string | null, frameIndex: number): VacationAnimationFrameAnchor | null => {\n` +
  `  const anchors = getAssetPath(source) ? VACATION_IDLE_FRAME_ANCHORS[getAssetPath(source)!] : undefined;\n` +
  `  return anchors?.[frameIndex] ?? null;\n` +
  `};\n\n` +
  `export interface VacationIdleFrameTranslation {\n` +
  `  x: number;\n` +
  `  y: number;\n` +
  `}\n\n` +
  `const getIdleAssetPath = (assetPath: string): string => assetPath\n` +
  `  .replace('/vacation-characters-idle-special-sheets/', '/vacation-characters-idle-sheets/')\n` +
  `  .replace('/vacation-male-characters-idle-special-sheets/', '/vacation-male-characters-idle-sheets/')\n` +
  `  .replace('/vacation-characters-attack-sheets/', '/vacation-characters-idle-sheets/')\n` +
  `  .replace('/vacation-characters-skill-sheets/', '/vacation-characters-idle-sheets/')\n` +
  `  .replace('/vacation-characters-hit-sheets/', '/vacation-characters-idle-sheets/')\n` +
  `  .replace('/vacation-characters-low-hp-sheets/', '/vacation-characters-idle-sheets/')\n` +
  `  .replace('/vacation-male-characters-attack-sheets/', '/vacation-male-characters-idle-sheets/')\n` +
  `  .replace('/vacation-male-characters-skill-sheets/', '/vacation-male-characters-idle-sheets/')\n` +
  `  .replace('/vacation-male-characters-hit-sheets/', '/vacation-male-characters-idle-sheets/')\n` +
  `  .replace('/vacation-male-characters-low-hp-sheets/', '/vacation-male-characters-idle-sheets/');\n\n` +
  `export const getVacationAnimationFrameTranslation = (source: string | null, frameIndex: number): VacationIdleFrameTranslation | null => {\n` +
  `  const assetPath = getAssetPath(source);\n` +
  `  if (!assetPath) return null;\n` +
  `  const idleAssetPath = getIdleAssetPath(assetPath);\n` +
  `  const idleAnchors = VACATION_IDLE_FRAME_ANCHORS[idleAssetPath];\n` +
  `  const currentAnchors = VACATION_ANIMATION_FRAME_ANCHORS[assetPath];\n` +
  `  const baseline = idleAnchors?.[0];\n` +
  `  const current = currentAnchors?.[frameIndex];\n` +
  `  if (!baseline || !current) return null;\n` +
  `  return {\n` +
  `    x: ((baseline.centerX - current.centerX) / current.cellWidth) * 100,\n` +
  `    y: ((baseline.bottomY - current.bottomY) / current.cellHeight) * 100,\n` +
  `  };\n` +
  `};\n\n` +
  `export const getVacationIdleFrameTranslation = getVacationAnimationFrameTranslation;\n`;

await fs.writeFile(outputPath, output, 'utf8');
console.log(`Generated ${path.relative(root, outputPath)} (${Object.keys(animationEntries).length} animation + ${Object.keys(entries).length} idle + ${Object.keys(specialEntries).length} idle-special sheets).`);

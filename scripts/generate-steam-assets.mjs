import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';

const rootDir = process.cwd();
const sourceDir = path.join(rootDir, 'assets', 'steam-marketing', 'source');
const outputDir = path.join(rootDir, 'release', 'steam', 'store-assets', 'generated');
const landscapePath = path.join(sourceDir, 'keyart-landscape.png');
const portraitPath = path.join(sourceDir, 'keyart-portrait.png');
const emblemPath = path.join(sourceDir, 'emblem-clean.png');

await mkdir(outputDir, { recursive: true });

const escapeXml = value => value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const titleText = escapeXml('学習ローグ');

const createLogo = async (width, height) => {
    const emblemWidth = Math.round(width * 0.88);
    const emblemHeight = Math.round(height * 0.78);
    const emblem = await sharp(emblemPath)
        .resize(emblemWidth, emblemHeight, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer();

    const fontSize = Math.round(width * 0.145);
    const strokeWidth = Math.max(2, Math.round(width * 0.0035));
    const textSvg = Buffer.from(`
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="titleGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="8%" stop-color="#fff7cc"/>
                    <stop offset="36%" stop-color="#f6c453"/>
                    <stop offset="62%" stop-color="#7dd3fc"/>
                    <stop offset="92%" stop-color="#1d4ed8"/>
                </linearGradient>
            </defs>
            <text
                x="50%"
                y="54%"
                dominant-baseline="middle"
                text-anchor="middle"
                font-family="'Yu Mincho', 'Hiragino Mincho ProN', serif"
                font-size="${fontSize}"
                font-weight="900"
                letter-spacing="0"
                fill="url(#titleGradient)"
                stroke="rgba(255,255,255,0.82)"
                stroke-width="${strokeWidth}"
                paint-order="stroke fill"
            >${titleText}</text>
        </svg>
    `);

    return sharp({
        create: {
            width,
            height,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
    })
        .composite([
            {
                input: emblem,
                left: Math.round((width - emblemWidth) / 2),
                top: Math.round((height - emblemHeight) / 2),
                blend: 'over',
            },
            { input: textSvg, blend: 'over' },
        ])
        .png()
        .toBuffer();
};

const darkeningOverlay = (width, height, direction = 'left') => {
    const gradient = direction === 'left'
        ? '<linearGradient id="shade" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#020617" stop-opacity="0.78"/><stop offset="58%" stop-color="#020617" stop-opacity="0.22"/><stop offset="100%" stop-color="#020617" stop-opacity="0.08"/></linearGradient>'
        : '<linearGradient id="shade" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#020617" stop-opacity="0.62"/><stop offset="52%" stop-color="#020617" stop-opacity="0.08"/><stop offset="100%" stop-color="#020617" stop-opacity="0.5"/></linearGradient>';

    return Buffer.from(`
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <defs>${gradient}</defs>
            <rect width="100%" height="100%" fill="url(#shade)"/>
        </svg>
    `);
};

const renderCapsule = async ({
    filename,
    width,
    height,
    source,
    logoWidth,
    logoHeight,
    logoLeft,
    logoTop,
    overlayDirection = 'left',
}) => {
    const logo = await createLogo(logoWidth, logoHeight);
    const image = sharp(source)
        .resize(width, height, { fit: 'cover', position: 'attention' })
        .composite([
            { input: darkeningOverlay(width, height, overlayDirection), blend: 'over' },
            { input: logo, left: logoLeft, top: logoTop, blend: 'over' },
        ]);

    const outputPath = path.join(outputDir, filename);
    if (filename.endsWith('.png')) {
        await image.png({ compressionLevel: 9 }).toFile(outputPath);
    } else {
        await image.jpeg({ quality: 94, chromaSubsampling: '4:4:4' }).toFile(outputPath);
    }
};

await renderCapsule({
    filename: 'header_capsule.jpg',
    width: 920,
    height: 430,
    source: landscapePath,
    logoWidth: 500,
    logoHeight: 280,
    logoLeft: 22,
    logoTop: 126,
});

await renderCapsule({
    filename: 'small_capsule.jpg',
    width: 462,
    height: 174,
    source: landscapePath,
    logoWidth: 436,
    logoHeight: 168,
    logoLeft: 13,
    logoTop: 3,
});

await renderCapsule({
    filename: 'main_capsule.jpg',
    width: 1232,
    height: 706,
    source: landscapePath,
    logoWidth: 690,
    logoHeight: 380,
    logoLeft: 34,
    logoTop: 286,
});

await renderCapsule({
    filename: 'vertical_capsule.jpg',
    width: 748,
    height: 896,
    source: portraitPath,
    logoWidth: 680,
    logoHeight: 370,
    logoLeft: 34,
    logoTop: 20,
    overlayDirection: 'vertical',
});

await renderCapsule({
    filename: 'library_capsule.png',
    width: 600,
    height: 900,
    source: portraitPath,
    logoWidth: 550,
    logoHeight: 330,
    logoLeft: 25,
    logoTop: 22,
    overlayDirection: 'vertical',
});

await renderCapsule({
    filename: 'library_header.jpg',
    width: 920,
    height: 430,
    source: landscapePath,
    logoWidth: 500,
    logoHeight: 280,
    logoLeft: 22,
    logoTop: 126,
});

await sharp(landscapePath)
    .resize(3840, 1240, { fit: 'cover', position: 'attention' })
    .png({ compressionLevel: 9 })
    .toFile(path.join(outputDir, 'library_hero.png'));

await sharp(await createLogo(1280, 720))
    .png({ compressionLevel: 9 })
    .toFile(path.join(outputDir, 'library_logo.png'));

await sharp(emblemPath)
    .resize(256, 256, { fit: 'contain', background: { r: 6, g: 15, b: 38, alpha: 1 } })
    .png({ compressionLevel: 9 })
    .toFile(path.join(outputDir, 'shortcut_icon.png'));

await sharp(emblemPath)
    .resize(184, 184, { fit: 'contain', background: { r: 6, g: 15, b: 38, alpha: 1 } })
    .flatten({ background: '#060f26' })
    .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
    .toFile(path.join(outputDir, 'app_icon.jpg'));

console.log(`Steam graphical assets generated in ${outputDir}`);

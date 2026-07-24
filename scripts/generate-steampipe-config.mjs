import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const requireNumericEnv = (name) => {
  const value = String(process.env[name] || '').trim();
  if (!/^\d+$/.test(value)) {
    throw new Error(`${name} must be set to the numeric ID shown in Steamworks.`);
  }
  return value;
};

const appId = requireNumericEnv('STEAM_APP_ID');
const depotId = requireNumericEnv('STEAM_DEPOT_ID');
const preview = process.env.STEAM_PREVIEW === '0' ? '0' : '1';
const setLive = String(process.env.STEAM_SET_LIVE || '').trim();

const packageJson = JSON.parse(await readFile('package.json', 'utf8'));
const contentRoot = path.resolve('release/steam/win-unpacked');
await access(contentRoot);

const root = path.resolve('release/steam/steampipe');
const scriptsDir = path.join(root, 'scripts');
await mkdir(scriptsDir, { recursive: true });
await mkdir(path.join(root, 'output'), { recursive: true });

const depotFileName = `depot_build_${depotId}.vdf`;
const appFileName = `app_build_${appId}.vdf`;
const setLiveLine = setLive ? `\n    "SetLive" "${setLive}"` : '';

const appBuild = `"AppBuild"
{
    "AppID" "${appId}"
    "Desc" "Learning Rogue v${packageJson.version}"
    "Preview" "${preview}"${setLiveLine}
    "BuildOutput" "../output"
    "ContentRoot" "../../win-unpacked"
    "Depots"
    {
        "${depotId}" "${depotFileName}"
    }
}
`;

const depotBuild = `"DepotBuildConfig"
{
    "DepotID" "${depotId}"
    "ContentRoot" "../../win-unpacked"
    "FileMapping"
    {
        "LocalPath" "*"
        "DepotPath" "."
        "recursive" "1"
    }
}
`;

await writeFile(path.join(scriptsDir, appFileName), appBuild);
await writeFile(path.join(scriptsDir, depotFileName), depotBuild);

process.stdout.write([
  `SteamPipe config generated: ${path.relative(process.cwd(), path.join(scriptsDir, appFileName))}`,
  `Mode: ${preview === '1' ? 'preview (no upload)' : 'upload'}`,
  setLive ? `SetLive: ${setLive}` : 'SetLive: none',
  '',
].join('\n'));

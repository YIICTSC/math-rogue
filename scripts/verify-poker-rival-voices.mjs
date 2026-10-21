import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const run = promisify(execFile);
const catalog = JSON.parse(
  await fs.readFile("assets/after-school-poker/rival-voice-lines.json", "utf8"),
);
const buildPath = "assets/after-school-poker/rival-voice-build.json";
const provenance = JSON.parse(await fs.readFile(buildPath, "utf8"));
assert.equal(catalog.rivals.length, 60);
assert.equal(provenance.model, catalog.model);
const hashes = new Set(),
  durations = {};
for (const rival of catalog.rivals)
  for (const event of ["spawn", "damage", "win", "defeat"]) {
    const key = `${rival.id}/${event}`,
      file = `public/sfx/poker-rivals/${key}.ogg`,
      clip = provenance.clips[key];
    assert(clip, `Missing build record: ${key}`);
    assert.equal(clip.text, rival.lines[event]);
    const hash = createHash("sha256")
      .update(await fs.readFile(file))
      .digest("hex");
    assert.equal(hash, clip.sha256, `Modified voice: ${key}`);
    assert(!hashes.has(hash), `Duplicated rival voice: ${key}`);
    hashes.add(hash);
    const { stdout } = await run("ffprobe", [
      "-v",
      "error",
      "-show_streams",
      "-show_format",
      "-of",
      "json",
      file,
    ]);
    const metadata = JSON.parse(stdout),
      stream = metadata.streams.find((s) => s.codec_type === "audio"),
      seconds = Number(metadata.format.duration);
    assert.equal(stream.codec_name, "vorbis");
    assert.equal(stream.channels, 1);
    assert.equal(Number(stream.sample_rate), 44100);
    assert(
      seconds >= 0.35 && seconds <= 8.25,
      `Invalid voice length: ${key}: ${seconds}`,
    );
    // Decode every complete clip. Hash/headers alone cannot detect damaged audio.
    await run("ffmpeg", ["-v", "error", "-i", file, "-f", "null", "-"]);
    durations[key] = seconds;
  }
assert.equal(hashes.size, 240);
assert.equal(Object.keys(provenance.clips).length, 240);
if (process.argv.includes("--write-durations")) {
  const source =
    "// Generated from verified offline Irodori audio.\nexport const POKER_RIVAL_VOICE_SECONDS: Record<string, number> = " +
    JSON.stringify(durations, null, 2) +
    ";\n";
  await fs.writeFile("src/data/pokerRivalVoiceDurations.ts", source);
  const index = process.argv.indexOf("--irodori-root");
  if (index >= 0) {
    const { stdout } = await run("git", [
      "-C",
      path.resolve(process.argv[index + 1]),
      "rev-parse",
      "HEAD",
    ]);
    provenance.irodori_revision = stdout.trim();
  }
  provenance.verified_clips = 240;
  await fs.writeFile(buildPath, JSON.stringify(provenance, null, 2) + "\n");
}
console.log(
  "PASS: 60 rivals × 4 unique Irodori voices; scripts, SHA256, mono Vorbis/44.1kHz, duration and full decode verified.",
);

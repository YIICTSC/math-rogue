# Home Dash refresh

Home Dash keeps its original auto-run, tap/hold jump, learning challenges,
upgrade cards, score recording and HP-1 waiting-room mode. The opening street
uses the original flat ground and obstacle roster. After 4,200 world pixels,
a run visits six themed routes in a freshly shuffled order. Each bag contains
all six routes with no adjacent repeats; individual encounters remain random.

## Runners and controls

- The nine high-school and seventeen magic protagonists have individual
  ImageGen run/jump atlases (four poses per action, 208 frames total).
  Their main-story illustrations supply identity and costume references.
- Selection follows `isProtagonistUnlocked`, the shared main-story unlock policy.
  The action boundary checks again so importing/resetting a story save cannot
  start a locked protagonist from a stale selection.
- Tap/click/Space/controller A jumps; holding changes height. Shift/controller X
  or the DASH button gives a brief acceleration and invulnerability, followed
  by a four-second recharge. It also works in the air.
- Pointer IDs, button holds and keyboard keys are tracked separately. A second
  finger can dash without releasing a jump. Focus loss, challenge entry,
  restart and leaving clear input and pending voice playback.
- Touch controls stay outside the canvas. Tall portrait screens pair a full
  800-unit course overview with a larger close view of the runner. Shorter
  screens retain the full course, preserving obstacle warning time.

## Routes

| Route | Mechanics |
| --- | --- |
| Sunset rooftops | Smooth climbs/descents, moving lift platforms, paper wyverns |
| Canal skybridges | Bridge slopes, bouncing water slimes |
| Spring garden | Automatic high-jump pads, aerial encounters |
| Clocktower causeway | Oscillating one-way lift platforms, firefly laser attacks |
| Cloudtop glide | Automatic glider; hold to rise, release to descend |
| Starlight air lanes | Gliding, changing updrafts, wind-spirit projectiles |

Terrain enters/exits at street height with smooth slopes. Flying is introduced
with a safe transition zone and a normal landing zone. Shaped routes do not
spawn the old pit/stair combinations. Encounter spacing grows with speed, and
base speed is capped. New background plates, two-pose enemy art, glider art,
dash trails and themed terrain are drawn by the existing canvas runtime.

## Artwork and audio production

`assets/go-home-dash/illustration-build.json` records ImageGen source names,
normalization and hero frame rectangles. Original PNGs are retained in the
image generation workspace. Normalize with:

```sh
node scripts/prepare-home-dash-art.mjs <hero-source-list.json> <title.png> <enemies.png> <route-source-list.json>
```

A source list contains `{ "id": "...", "source": "/absolute/original.png" }`.
The normalizer uses one scale across each entire eight-frame strip, places
feet at a shared anchor, and preserves alpha. Hero selection uses original
main-story full-body artwork, not a replacement character design.

`hero-voice-lines.json` defines six dedicated action lines for each protagonist:
jump, dash, flight, damage, upgrade and defeat (156 clips). Existing main-story attack and power/spell recordings supply each speaker
reference. Short lines that need clearer pronunciation use Japanese
attack recordings, avoiding foreign spell names in the reference.
Generation runs in the cloud with official Irodori-TTS v4.1 Small MeanFlow;
clips needing clearer pronunciation can be refined with v4.1 Small RF.
`hero-voice-build.json` includes reference SHA-256s, official repository revision,
checkpoint hashes, seeds and clip timings. SilentCipher watermarks are retained.
The model license is included alongside the provenance.

```sh
# In the official Aratako/Irodori-TTS checkout: uv sync --extra cpu
ONEDNN_PRIMITIVE_CACHE_CAPACITY=64 LRU_CACHE_CAPACITY=16 OMP_NUM_THREADS=2 MKL_NUM_THREADS=2 \
  /path/to/Irodori-TTS/.venv/bin/python scripts/generate-home-dash-voices-irodori.py \
  --irodori-root /path/to/Irodori-TTS --cpu-autocast
```

CPU autocast requires an AVX512-BF16-capable host. Omit it on other CPUs, or use
`--device cuda` with the corresponding official GPU environment. Refinements
support `--only`, `--events`, `--regenerate`, `--model`, `--steps`, `--seed-offset`, explicit action duration and guidance scales.
Playback respects the app's voice volume/mute settings, limits repeated jump
calls and cancels both active and still-loading voices when leaving.

## Verification

```sh
pnpm run test:home-dash:browser
pnpm run verify:home-dash:assets
pnpm run build
pnpm run server:build
node scripts/generate-android-asset-manifest.mjs
node scripts/verify-android-asset-manifest.mjs
```

The browser test uses the actual shipped update loop and actual CDP two-finger
input. It checks story unlocks, all hero image decodes, 80 procedural seeds,
terrain slopes/route variety, jump/dash/glide, springs/lifts, new enemy shots,
A+X controller input, focus loss, learning upgrades, retry and mobile layouts.
Representative screenshots are saved to `tmp/home-dash-qa`.
The asset verifier decodes every Ogg, checks uniqueness and reference hashes,
checks that the Japanese speech QA record matches the current clip hashes,
and validates all 208 distinct animation cells plus route/title/enemy art.

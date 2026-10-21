# Home Dash refresh

Home Dash keeps its original auto-run, tap/hold jump, learning challenges,
upgrade cards, score recording and HP-1 waiting-room mode. The opening street
uses flat ground and the original obstacle roster. The map changes every
3,000 displayed distance units (30,000 world pixels), visiting six themed
routes in a freshly shuffled order. Each bag contains
all six routes with no adjacent repeats; individual encounters remain random.

## Runners and controls

- The nine high-school and seventeen magic protagonists have individual
  ImageGen run/jump atlases (four poses per action, 208 frames total).
  Their main-story illustrations supply identity and costume references.
- Selection follows `isProtagonistUnlocked`, the shared main-story unlock policy.
  The action boundary checks again so importing/resetting a story save cannot
  start a locked protagonist from a stale selection.
- Tap/click/Space/controller A jumps; holding changes height. Shift/controller X
  or the DASH button gives 1.5 seconds of acceleration and invulnerability,
  with four seconds between activations. It also works in the air.
- Pointer IDs, button holds and keyboard keys are tracked separately. A second
  finger can dash without releasing a jump. Focus loss, challenge entry,
  restart and leaving clear input and pending voice playback.
- Touch controls stay outside the canvas. Tall portrait screens pair a full
  800-unit course overview with a larger close view of the runner. Shorter
  screens retain the full course, preserving obstacle warning time.

## Routes

The opening after-school avenue also uses a 1280×640 ImageGen background
plate, loaded and panned through the same renderer as the six later routes.
This avoids the shifting procedural building silhouettes in the opening stage.
Route backgrounds crossfade with smooth easing over 600 world pixels. The
DISTANCE HUD measures travel independently of score bonuses and defeated enemies.

| Route | Mechanics |
| --- | --- |
| Sunset rooftops | Smooth climbs/descents, moving lift platforms, paper wyverns |
| Canal skybridges | Bridge slopes, bouncing water slimes |
| Spring garden | Automatic high-jump pads, aerial encounters |
| Clocktower causeway | Oscillating one-way lift platforms, firefly laser attacks |
| Cloudtop glide | Tap to flap through paired gates; hold to repeat flaps |
| Starlight air lanes | Flap through paired gates with changing updrafts |

Terrain enters/exits at street height with smooth slopes. Flying is introduced
with a safe transition zone and a normal landing zone. Ground routes include
solid ascending stair blocks. Their visible steps share
collision geometry: land on top, jump over side walls, and escape before
being pushed against the left edge. Crushing costs HP and recovers the runner
above the wall. Flight gates have a generous 182-unit gap and safe entry/exit
zones; they survive weapons and screen-clear upgrades. Encounter spacing grows
with speed, and
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

## Arcade expansion

See [runner research and implementation](go-home-dash-runner-research.md) for
the nine-game source comparison, 36 added mechanics, 16 encounter patterns,
run modes, input mappings and verification boundaries.

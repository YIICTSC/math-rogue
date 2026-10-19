# Dungeons ultimate effects and original voices

## Blender animation source

`ultimate-fx.blend` (Blender 4.3.2) contains 27 editable scenes: nine heroes × three skills. Each scene has independent geometry, emission materials, camera, and transform/opacity keyframes, frames 1–24 at 20 fps. Open `ignis_skill_3` to inspect the fire finisher. Source dimensions are 192×192 RGBA; shipping atlases are 1152×768 WebP, six columns × four rows. `ultimate-fx.json` records checksums and timing.

Regenerate from the repository root:

```sh
blender -b -t 1 --python scripts/dungeons2/render-ultimate-fx.py -- --output /workspace/d2-fx-render
python scripts/dungeons2/pack-ultimate-fx.py /workspace/d2-fx-render
```

Packing requires Pillow and NumPy. Raw frames stay outside the repository. Mobile runtime plays one CSS stepped atlas rather than running Blender geometry or an additional WebGL context. Dungeons 2 uses all 27 animations; Dungeons 1 has 35 dedicated character animations in `../dungeons/ultimate-fx.blend`. Existing procedural effects remain a loading fallback; reduced-motion mode shows a single frame.

## IrodoriTTS cloud runtime

Official upstreams: [Irodori-TTS](https://github.com/Aratako/Irodori-TTS), [Irodori-TTS-Server](https://github.com/Aratako/Irodori-TTS-Server), [v4.1 Small MeanFlow](https://huggingface.co/Aratako/Irodori-TTS-v4.1-Small-MF). The latest revisions inspected on 2026-10-19 are pinned in `tools/irodori/setup-cloud.sh` and `voice-design.json`. Upstream code and model are MIT licensed. Install `uv`, then run:

```sh
bash tools/irodori/setup-cloud.sh
```

This installs the official server into `/workspace/tools/irodori-server`, downloads the pinned checkpoint, and serves CPU/FP32 inference on localhost:8088. Internet access is needed for initial dependencies/models. GPU is not required; reserve at least 6 GB disk and 6 GB RAM for synthesis alone. Override `IRODORI_WORK_DIR`, `IRODORI_BIND_PORT`, `OMP_NUM_THREADS`, or `MKL_NUM_THREADS` as needed. The service is local, not a public deployment. The application ships only generated audio and never contacts TTS at runtime.

`run-cloud.py` adds a bounded, deterministic reference-latent cache; model inference and upstream watermarking remain enabled. Test it with the server virtualenv:

```sh
/workspace/tools/irodori-server/.venv/bin/python tools/irodori/test-reference-cache.py
python scripts/dungeons2/generate-voices.py --url http://127.0.0.1:8088
python scripts/dungeons2/finalize-voices.py
```

Nine original caption-designed voice references are synthesized without real-person recordings. `voice-design.json` stores identity descriptions, Japanese scripts, and fixed seeds used by the generator. Each hero has attack, damage, finishing blow, heal, defeat, transformation, three named ultimates, and a card call: 270 clips total: the original ten plus twenty additional lines per hero. Every cue family has three alternatives. Finalization trims edge silence, normalizes loudness, limits peaks, and compresses long calls to at most 3 seconds without changing pitch. Shipping OGG Vorbis is mono 24 kHz, quality 4, matching the existing voice banks. Raw WAVs and intermediate audio remain outside Git. `voice-generation.json` records text, timing, levels, and hashes.

Speech retains the existing probability/cooldown/mute rules; finishing blows and transformations are prioritized. Dedicated ultimate/card names select the correct call. One of three lines is chosen at random, and the same line is prevented from playing twice consecutively within that hero/cue family. Existing sound effects and previous protagonists' voices are reused.

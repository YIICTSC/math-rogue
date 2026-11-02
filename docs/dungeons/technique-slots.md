# Shared glimmer techniques and speech

Dungeons 1 and 2 share the same 11 weapon categories, 48 techniques, prerequisites and martial attack effects. Dungeons 2's three innate skills, cooldowns and signature card remain independent and retain their previous behavior.

## Combat

- A real normal attack grants 20 TP (maximum 100) and one weapon practice point. Empty swings, shopkeepers and dojo practice grant neither.
- Learning a technique triggers one free discovery attack. Subsequent normal attacks do not automatically use it.
- Four shortcuts are stored per protagonist and weapon category. New discoveries fill empty slots. Changing an occupied slot swaps entries; duplicates are prevented. Legacy saves populate shortcuts from learned techniques.
- A shortcut uses one turn and consumes TP only when a valid enemy is in front and the technique is learned, belongs to the equipped weapon and is affordable. Bows reach up to six tiles and stop at walls or neutral shopkeepers.
- Costs by tier are 30 / 45 / 60 / 80 / 100 TP. Each five uses raises technique rank, reducing the cost by 2 TP per rank (maximum rank 5, minimum cost 20).
- Long press opens details without activating the technique. All techniques, rank, cost and shortcut assignment are available in the full menu. Logs below the map use a black background and white text.

## Speech

`techniques/voiceParts.ts` selects parts without mixing actors:

- Normal: randomly choose a prelude OR the technique name.
- Combo: first prelude then name; subsequent attacks use only names.
- Finisher: prelude then name.
- Dungeons 2 shared glimmer names have never been recorded by their actors. These calls use only that protagonist's new short shouts, never another protagonist's technique-name voice.

Dungeons 1 and Kocho Showdown use non-destructive cuts from existing audio. Originals remain unchanged. Names that cannot be safely isolated from the original recording remain unavailable and use the same actor's clean prelude instead. `assets/technique-cuts/build.json` lists four such original D1 clips.

Speech sequences have cancellation epochs: a new technique, mute, pause or exit cancels both the playing part and any pending name. Gameplay never waits for speech. Kocho's existing voice priorities and reaction policy remain intact.

## Reproduction and review

1. `node scripts/technique-cuts/prepare.mjs`
2. Irodori environment Python: `scripts/technique-cuts/analyze.py`, then review `edge-review.json` and explicit `overrides.json`.
3. `scripts/technique-cuts/render.py` (ffmpeg cuts only; no TTS).
4. `scripts/technique-cuts/generate-d2-intros.py` generates only 27 short D2 shouts, using the corresponding existing `attack.ogg` as a reference. Model and codec run on CPU. The first four clips used v4.1-Small at 16 RF steps; remaining clips use the official v4.1-Small-MF sampler at its recommended 4 steps. Each clip records its own model/settings. Model revision, official code revision, reference hashes, captions and seeds are recorded in `d2-intro-build.json`.
5. `scripts/technique-cuts/review-d2-intros.py` records CPU ASR and waveform checks. Review recognition discrepancies before publication.
6. `node scripts/technique-cuts/merge-d2-intros.mjs` installs the verified shout pools after all 27 are complete.

Long-running generation is resumable from the recorded clips. Avoid running full TypeScript/build audits concurrently with model inference on memory-constrained workspaces.

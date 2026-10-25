# Dungeon chronicles (Dungeons 1 and 2)

The 22 route dossiers provide an original NPC, a dedicated character-free dungeon background, a
surreal dilemma, a revelation and three different consequences. All 16 routes
available in Dungeons 1 and all 22 in Dungeons 2 participate, including rescue
and the fixed-layout puzzle challenge. The six sequel-only routes stay locked
to the sequel. Existing progression, floor generation and clear rewards remain.

Each of the 44 protagonists has an individually authored regret and conviction.
Dialogue combines that profile with the current NPC and route dilemma: 758
playable protagonist/route pairs and 2,274 contextual six-line conversations
before the ending. These use shared dramatic structures, not 2,274 separately
handwritten screenplays. Each route has three individually written ending titles
and consequences, for 66 distinct endings. This is original material; it does
not borrow characters, dialogue or settings from another game franchise.

NPC conversations become available from floor 1, 40% and 75% of the route’s goal. They never open automatically. A traveler-sized full-body NPC is placed on a reachable empty floor tile, with a speech bubble; face it and press A to talk. Walking into the NPC only changes facing and shows a hint. Placement checks that the NPCs cannot close a passage to stairs or other walkable tiles. Fixed puzzle layouts are not altered: where no side space exists, NPC tiles remain passable so the puzzle cannot be obstructed. Recruitment and personal chapter conversations also require explicit interaction; their pending chapters remain available on subsequent floors. Relay towns offer the same optional NPCs as visible characters.

Players can close a conversation without choosing or marking it read. Chronicle dialogue retains its line for the next conversation, including across saves; continuing a save always returns to exploration first. No dialogue costs a turn. Unread decisions are never forced during entry, descent, or clear. The clear panel always permits returning home. Players who voluntarily made all three choices can explicitly talk with the NPC about the ending from that panel. Closing or skipping it does not record an ending. The most chosen approach determines the ending; the most recent choice breaks a tie.

Completed endings are recorded per series/route/protagonist/branch and can be replayed from Records. Replaying never runs clear rewards or changes the run’s decisions. Completing STORY’s chosen ending also retains the legacy chapter-journal completion marker.

## Art

- 22 existing ImageGen transparent full-body NPC portraits, with their original identities and costumes.
- 22 uniformly normalized, traveler-sized transparent map sprites, with a shared foot anchor.
- 22 newly generated 960×640 character-free dungeon backgrounds; characters are composited as separate standing portraits.
- All 22 former event paintings and the legacy six-scene event sheet are removed from runtime assets.
- NPC style reference: `public/sprites/high-school/characters/0.webp`.
- `art-generation.json` records NPC provenance and the removed painting hashes. New background sources are retained as lossless WebP in `backgrounds/`, with source/delivery hashes in `background-generation.json`.
- `map-npc-build.json` records uniform normalization of the original NPCs; it does not manufacture new character designs.
- Narrative art preserves its authored colors. Dialogue uses full-body portraits rather than enlarged walking frames for Dungeons 2.

Rebuild delivery formats with:

```sh
node scripts/dungeons-chronicles/normalize-art.mjs
node scripts/build-dungeons-map-npcs.mjs
node scripts/build-dungeons-dialogue-backgrounds.mjs
node scripts/generate-web-asset-manifest.mjs
node scripts/generate-android-asset-manifest.mjs
```

## Original action voices

968 additional Japanese CPU Irodori clips: 21 action/ending categories for each
of 44 protagonists (924), plus two reaction lines for each of 22 NPCs (44).
Existing voiced banks, including the sequel’s named skill/card variants, remain
available. Common attack/damage/etc. draws mix new and existing banks; newly
specialized actions use their matching line. Movement is intentionally sparse.
The speech gate prevents queued overlapping action lines and respects mute.
Story reactions stop when advancing a line or leaving their modal.

The official code revision, model and codec revisions, device/precision,
sampling settings, captions, Japanese scripts and seeds are recorded in
`assets-source/dungeons-chronicles/voice-design.json`. The generated report adds
per-file duration, RMS, peak, size and SHA-256. Both model and codec run on CPU;
CPU bfloat16 autocast accelerates compute while original weights load in fp32.
Four-step joint guidance is the default; four clarity retakes explicitly use
automatic duration, eight steps and stronger text guidance. These per-line
overrides are included in the design and generated report. Watermarking remains enabled. No real-person reference recording is used.
Silence or invalid amplitude causes a new seeded synthesis attempt, not a silent
placeholder. Delivery uses mono 24kHz OGG Vorbis.

Run from the official, pinned Irodori environment:

```sh
python scripts/dungeons-chronicles/prepare-voices.py
DUNGEONS_REPO=/path/to/math-rogue PYTHONPATH=/path/to/Irodori-TTS \
  /path/to/Irodori-TTS/.venv/bin/python scripts/dungeons-chronicles/generate-voices.py
```

The generator resumes only clips whose delivered hashes match its report. Run
`scripts/dungeons-chronicles/finalize-voices.py` in that same environment to
independently decode all 968 delivered clips before the final media check.
Then run the Web and Android asset manifest generators from a full checkout.
In a sparse checkout, retain the checked-in records for absent Android assets
when merging the newly verified records; never ship a truncated existing pack.

## Verification

```sh
node scripts/test-dungeons-optional-npcs.mjs
node scripts/test-dungeons-optional-npcs-browser.mjs
pnpm run test:dungeons:chronicles
pnpm run test:dungeons:chronicles:browser
pnpm run test:dungeons:chronicles:endings
pnpm run test:dungeons:chronicles:media
pnpm run test:dungeons1:art
pnpm run test:dungeons1:art:browser
node scripts/test-dungeons2-actions-browser.mjs
node scripts/test-dungeons2-world-browser.mjs
pnpm run build
pnpm run server:build
```

The browser tests use actual game components and their restore/clear/input
handlers, including both series, three choices, completion and replay,
phone layouts and screenshots. Media checks verify all original sources,
transparency, dimensions, distinct audio, scripts and measured amplitude bounds.

## 2026-10-26 verification

- Actual Dungeons 1/2 entry, all 22 route NPCs/backgrounds, A interaction, closed conversations, save/reload without automatic dialogue, skipped-event clear/return, relay-town NPCs, and passable narrow-puzzle NPCs passed browser checks.
- Phone portrait, phone landscape and desktop conversation screenshots were reviewed. Dungeons 2 uses its authored full-body hero portraits in dialogue.
- All 66 Dungeons 2 ending branches completed through the explicit NPC ending action, with no duplicate clear rewards.
- All 758 hero/route dialogue pairs, original NPC and new background hashes, normalized sprite transparency, and Android asset references passed their targeted checks.

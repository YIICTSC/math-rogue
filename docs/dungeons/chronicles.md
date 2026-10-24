# Dungeon chronicles (Dungeons 1 and 2)

The 22 route dossiers provide an original NPC, a special event illustration, a
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

Three decision scenes appear at the first floor, 40% and 75% of the route’s goal.
They follow legacy chapter dialogue when both occur on the same floor. A choice
can end a harmful arrangement, share its burden or reject its premise. The most
chosen approach determines the ending; the most recent choice breaks a tie.
If a short rescue or a skipped floor misses a decision scene, it is queued before
the ending so all three choices remain available. Empty legacy records default
to an accord when replayed without stored decisions.

Dialogue position, decisions and the pending ending serialize in the existing
adventure save. Conversation and choices do not spend turns or move enemies.
Movement and menu dismissal cannot bypass a pending narrative. The ending is
recorded per series/route/protagonist/branch and can be replayed from Records.
Replaying never runs clear rewards or changes the run’s decisions. Completing
STORY also retains the legacy chapter-journal completion marker.

## Art

- 22 individually generated transparent full-body NPC portraits.
- 22 individually generated 960×640 special-event illustrations.
- NPC style reference: `public/sprites/high-school/characters/0.webp`.
- Original ImageGen PNGs stay in `assets-source/dungeons-chronicles/generated/`.
- Source and delivered WebP hashes are in `art-generation.json` beside them.
- Narrative art keeps its full palette; the notebook’s old green filter does not
  apply to it. Portrait and landscape layouts retain scrollable dialogue/choices.

Regenerate delivery formats with:

```sh
node scripts/dungeons-chronicles/normalize-art.mjs
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

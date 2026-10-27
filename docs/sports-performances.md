# Sports character performances

The four sports share authoritative performance events, generated character cut-ins, a single speech queue and Blender-authored effects. A rejected input never creates a performance. Host rooms and dedicated servers issue the same bounded event log; clients validate it and discard repeated snapshots. Spectators follow the current court. New courts reset the renderer's event cursor.

## Characters and presentation

The nine high-school and seventeen magic protagonists have separate illustrations for golf, tennis, basketball and dodgeball: 104 poses in seven transparent ImageGen atlases. `cutin-build.json` records the original outputs, reference identities, prompts and hashes. The runtime addresses cells directly, preserving the original generated art. The banner stays above the controls, ignores pointer input, disappears after 1.45 seconds and supports reduced motion.

Custom athletes select one of four male or four female voice profiles in the shared character creator. Named protagonists use their own identity. A single queue prevents overlapping calls and routine-shout backlogs. Muting, leaving, hiding the page and pausing stop playback. BGM remains under the existing game-specific scene management.

Only clips present in `sportsVoiceDurations.json` are fetched or played. Run `node scripts/sports-performances/build-catalog.mjs` after adding or replacing audio; a syntactically valid but unavailable clip is skipped without network errors. The catalog is derived from the generation record, rather than a browser speech-synthesis fallback.

## Rules and effects

- Golf's star gauge gains one third per correct answer. A full gauge enables a star shot with a non-putter club. The server consumes the gauge and boosts horizontal launch velocity by 8%; aiming and distance prediction apply the same boost. Ordinary shots retain their existing physics. Hole score, hazards and shot quality determine official calls, with no nice-shot call for putting.
- Tennis's fault, double-fault, let, out, game, set, deuce and advantage calls follow scoring. Advantage compares the two scores with the current server, including extended deuce games; tie-breaks do not announce advantage.
- Basketball calls match the game's 2/3-point scoring, possession-clock violations and match end. Position abilities trigger character presentations only after successful activation.
- Dodgeball distinguishes catches, perfect catches, elimination into the outfield and match end. Charged specials, dash shots and counters use the confirmed powered-throw presentation.

`create-effects.py` authors four animated Blender effects: gold star orbits, cyan tennis lightning, orange basketball flames and violet dodgeball helices. Each GLB has three animation channels/groups, roughly 344–668 triangles and a 27–45 KB download. Three.js loads the authored animations and uses additive emission. A rendered 16-frame strip supplies the same visual vocabulary for the DOM presentation, including WebGL fallback. Scene teardown disposes meshes, materials and mixers.

To regenerate, install Blender and glTF Transform tools (outside the repository dependency tree if desired):

```bash
npm install --prefix tmp/sports-asset-tools @gltf-transform/core @gltf-transform/functions @gltf-transform/extensions
blender --background -t 1 --python scripts/sports-performances/create-effects.py
node scripts/sports-performances/package-effects.mjs tmp/sports-asset-tools
```

The `.blend`, reproducible authoring script, optimization recipe, hashes, materials and geometry budgets remain in `assets/sports-performances`.

## Verification and release

```bash
pnpm run test:sports-performances
pnpm run verify:sports-performances
pnpm run test:sports-performances:browser
pnpm run build
pnpm run server:build
```

The browser fixture uses the actual four game components and their actual special buttons. It supplies deterministic match state and holds only the cosmetic banner for screenshots. It checks both phone orientations, loaded GLBs and cut-in images, replay protection, pausing, eight custom voice choices, previews and mute behavior. Screenshots are written to `tmp/sports-performance-qa`.

The release browser pass covers all eight phone layouts and all eight custom voice previews. Asset verification checks 104 distinct nonempty transparent cells, source/runtime hashes, GLB validity, animation/material/triangle budgets and packaged audio/catalog hashes. The engine suite checks authoritative star consumption, invalid input rejection, scoring calls, privacy-compatible snapshots and queue cancellation. Existing golf, tennis, basketball, dodgeball and online-invitation tests cover the surrounding game loops.

Run the web and Android asset-manifest generators after changing packaged media. Dedicated servers require the existing manual Render deployment; pushing main alone does not update them. Voice generation and review details are documented in `sports-voice-handoff.md` and their machine-readable records.

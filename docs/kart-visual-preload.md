# GP visuals before play

Selecting GAKURO GP now opens `KartEntry` before its title, renderer or room connection. It downloads only GP's display files, displays byte progress, imports the game code in parallel, and prepares the shared character geometry and the selected protagonist before opening the title. Invitation entry uses the same preparation step, before starting a connection timeout.

The generated list contains 40 files / 14.23 MiB: the GP logo, both title compositions, the shared driver/scenery GLBs, and 35 base protagonist GLBs. All eight courses and custom course themes use those shared models or procedural geometry. Audio, learning illustrations, other games and transformed protagonists are excluded.

`generate:kart-visual-assets` runs in the web/native prebuilds. It derives protagonists from the catalog, records real sizes and SHA-256 digests, and rejects GLBs with external dependencies. Content hashes change only when the display file changes, so a new application build does not invalidate unchanged GP files.

`visualPreload` uses three download workers and the `learning-rogue-gp-visual-v1` Cache Storage cache. Each file has a content-addressed key. Saved files are checked before use; corrupt entries are replaced individually. Valid existing theme-cache files are reused. Obsolete GP entries are removed after a complete successful preparation, without touching other saved packs.

`preparedVisualAssets` retains raw Blobs for the page. `assetUrl` resolves prepared GP paths to their Blob URLs, so actual GLTF/image consumers use the prepared bytes even without a service worker. `assetSourceUrl` retains the original CDN/base URL and installed Android-pack routing for downloading. This does not enable a global GPU cache or keep all protagonist models parsed in memory.

Returning from preparation aborts its downloads. Retry keeps completed files. If persistent storage rejects or stalls, preparation continues with session memory; same-page re-entry needs no second download. Storage is best effort and browsers can evict saved files. A failed JavaScript-module import offers Reload, because browsers retain failed module imports for that page.

GP starts at high quality, including when an older GP setting was Auto. Explicit Low/Minimal settings remain supported. Controls are available on the title, entry and race screens. Packet delays, network hints and slow frames no longer force Minimal or progressively lower the renderer resolution. A manual choice also works when writing preferences to local storage fails.

Preloading reduces mid-game asset requests and loading stalls. It cannot remove packet latency or guarantee a frame rate on a device whose GPU cannot render the selected detail level.

Validation:

- `pnpm run test:kart:preload`: exact GP-only scope, current sizes/digests, real Blob reuse, other-path isolation and old-URL cleanup.
- `pnpm run test:kart:preload:browser`: initial download, real high-quality scene using prepared GLBs, portrait/landscape progress, memory/persistent/theme reuse, corrupt-cache repair, failure retry, cancellation, unavailable storage and code-import reload recovery.
- `node scripts/test-kart-performance-browser.mjs`: selected quality under slow connection hints and delayed packets, manual modes, unchanged resolution across slow frames, and existing 8-course/40-driver rendering coverage.
- Existing GP networking/lifecycle checks, English UI gate, app build and server build.

The preparation browser test controls capture cadence under software WebGL while preserving high-resolution models, shadows and antialiasing. It verifies visual quality and asset reuse, and is not a mobile frame-rate benchmark.

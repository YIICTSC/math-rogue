# VR UI refresh — local validation

- Stealth missions / Battle training title entrances.
- Full-viewport playfields with floating essential controls; left movement stick and right actions in all VR modes.
- First-use action tutorials pause stealth simulation; unmet extra objectives highlighted.
- Royale starts with bubble pistol only; weapon/item supplies use distinct markers, living players use downward markers.
- Bomb upgrade atlas: original ImageGen artwork, five square tiles, sampled by matching drop type in Three.js.
- Bomb refill quiz: nonmodal bottom-right dock replacing the action cluster, responsive to portrait/landscape, scrollable for long questions. Battle continues. Correct answers add exactly one bomb; wrong answers add none.

## Validation

- TypeScript typecheck passed.
- Browser QA passed at 1280×800, 390×844, 844×390: title entrances, tutorial pause, extra objective emphasis, left/right controls, >=95% viewport field coverage, starter pistol, upgrade legend, refill panel bounds, correct-answer +1 and close; no page errors.
- Screenshots inspected: tmp/vr-refresh-qa/refill-{1280,390,844}.png.
- Solo simulation tests passed (royale and bomb, three maps, 40 seats).
- 40-player WebSocket tests passed; 41st seat rejected.
- Server build passed. Full web production build and English audits passed (tmp/vr-refresh-build.log).
- No commit, push or deployment performed.

## ImageGen provenance and final prompt

Built-in image generation mode. Source: assets/gakuro-vr/bomb-upgrades-source.png. Runtime: public/sprites/gakuro-vr/bomb-upgrades-v1.webp (1280×256; five 256px cells). Source white margins cropped and equal cells normalized with Pillow. Runtime tiles visually inspected in game.

> Create an original production game icon sprite atlas for GAKURO VR school bomb battle. Exactly 5 square illustrated powerup tiles in a perfectly aligned single horizontal row, equal cells, total canvas aspect 5:1. Each cell fills exactly 20 percent width. No gaps between cells, no text, no numbers, no characters, no brand logos. Bold original cute console arcade icon style, sharp highly legible silhouettes, thick dark outlines, glossy simple shading. Each tile has a thick rounded SQUARE border and a colorful flat background, art inset with generous safe padding. Left to right exactly: 1 orange flame on red-orange tile (blast range), 2 purple handheld remote controller with antenna and one big button on violet tile (remote detonation), 3 cyan sporty shoe kicking a small black training bomb on blue tile (kick), 4 yellow winged running shoe with speed streaks on yellow tile (move speed), 5 two small black toy bombs with bright fuse caps on green tile (simultaneous bomb capacity). Every illustration centered inside its own square frame, orthographic front view, consistent scale, no perspective board, no outside background. Intended for texture atlas sampling five equal UV cells. Save finished artwork for integration.

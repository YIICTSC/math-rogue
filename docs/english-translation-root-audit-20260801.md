# English Translation Root Audit — 2026-08-01

## Goal

Prevent untranslated Japanese and meaningless generic English from reaching a
release build, instead of relying only on repeated visual inspection.

## Root cause

The English UI previously had a DOM `MutationObserver` that silently converted
Japanese text after rendering. Unknown strings could become generic phrases such
as `Choose Option`, `Event Details`, or unrelated event prose. This hid missing
translations from static checks and made a visually English screen look complete
even when its meaning was wrong.

## Permanent prevention

- `src/utils/translationAudit.ts` records:
  - Japanese remaining in English output;
  - forbidden generic fallback prose;
  - text translated only after it reached the DOM.
- The browser exposes the audit through
  `data-translation-audit-entries` on the root element, so automated and manual
  browser rounds inspect the same runtime evidence.
- `scripts/audit-english-ui.mjs` checks translated literals, dynamic templates,
  compendium data, help copy, minigame common copy, ranking copy, endings, and
  required exact translations.
- `scripts/verify-english-runtime-audit.mjs` starts the light Web build in English
  and fails when the title flow records a runtime translation issue.
- `pnpm run audit:english:gate` combines the static English audit, display-copy
  audit, and runtime sentinel.
- Every production build script now runs this gate first. A detected leak blocks
  Web, iOS, Android, Steam, and offline production builds.
- Multi-line event results are translated as a contextual narrative line plus a
  parsed mechanical-effect line. Exact translations and effect parsers run before
  emergency fallback prose.

## Existing translation contract

The exclusions in `docs/translation-completion-contract.md` remain unchanged:

- subject question bodies and Japanese-reading exercises;
- educational board content and assignment unit names that intentionally retain
  source-language material;
- credits names, formulas, URLs, save keys, and text baked into images;
- game-specific legacy minigame internals listed in that contract.

Minigame selection, unlock requirements, descriptions, deletion confirmation,
results, and other shared navigation UI are still in scope and are audited.

## Runtime rounds

All rounds used the normal `Start Adventure` flow in the lightweight Web build,
with the language set to English.

1. Magic Mode: title, study settings, difficulty, character, starting relic, and
   adventure map. Runtime audit: 0 after fixes.
2. High School Mode: title, study settings, difficulty, character, starting
   relic, and adventure map. Runtime audit: 0.
3. Elementary Mode: the same normal flow. Detected an incorrect generic relic
   description and five hidden cooperative-event explanations. These were fixed.
4. Elementary Mode repeated from a new normal adventure after the fixes. Runtime
   audit: 0 through the adventure map.

Additional title routes checked in English:

- settings, credits, assignment link, today's task, 1A1D, co-op, race, typing,
  problem challenge, assignment sending, card album, submission, compendium,
  records, help, data transfer/protection, and release notes;
- Elementary, High School, and Magic title variants;
- all seven minigame entries on the common selection/unlock screen.

## Issues corrected during this audit

- Help and glossary prose that previously collapsed to generic filler.
- Event outcome narration and mechanical result lines.
- Relic and enemy descriptions that incorrectly became short-break prose.
- Bamboo Copter now states that using a potion heals 5 HP.
- Settings, task categories, BGM labels, submission grade, enemy name, data
  transfer heading, close-button labels, and co-op/race back labels.
- Summon-card detail fields and player/partner battle tooltips.

## Required release check

Run:

```sh
pnpm run audit:english:gate
pnpm run build
```

Both commands must pass. A failure must be fixed with an exact or compositional
translation; do not weaken the fallback detector or add a blanket exclusion.

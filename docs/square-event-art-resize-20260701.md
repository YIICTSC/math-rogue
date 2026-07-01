# Square Event Art Resize - 2026-07-01

Normalized in-game event illustration assets to square dimensions.

## Scope

- `public/sprites/high-school/events/0.webp` through `17.webp`
  - Resized to `418x418`.
  - These were minor off-square legacy event images.
- `public/sprites/magic/events/romance/**/r6-*.webp`
  - Only non-square RIKU ending variants were affected.
  - Resized to `768x768`.
- `public/sprites/magic/events/double-romance/{female,male}/*.webp`
  - Resized to `768x768`.

## Method

- High school event images: centered square fit to match the existing `418x418` high school event set.
- Magic ending images: square canvas with blurred background and contained original art, so characters and scene context are not cut off.

## Excluded

Review/contact sheets under `character-review`, `romance-review`, `double-romance/review`, and generated sheet folders were left unchanged because they are production/audit sources rather than in-game event illustrations.

## Backup

Original files were copied to `.codex-logs/square-resize-backup-20260701/`.


# RPG menu and character presentation

2026-10-26

- Shared frontier menu styling for home, crafting, inventory, farm, city, settings, hero builder and adventure detail panels. Category rails, consistent selection outlines, scrollable item grids and a contextual item inspector use existing illustrations and translated item descriptions. Focus and touch/click select items; existing action buttons still perform their original actions. The inspector follows inventory quantity updates and clears on tab changes or closing.
- Information menus acquire no music scene. The world chooses music from its physical state (setup, map, actual home interior, clear/end); opening the home list or another panel no longer selects a home/setup/rest track. Home tabs retain the interior's track. Explicit home music furniture choices and active furniture games still control their own music. Arcade browsing/closing/reselection no longer issues forced shop/map playback requests.
- Only the local player owns a 3D protagonist model/fallback avatar. Roaming NPCs, town residents and remote players always use camera-facing 2D artwork, including custom appearances. Remote sprites use one ground-height offset, so elevated terrain does not lift them twice.

Validation:

- `node scripts/test-rpg-menu-music.mjs`: passive menu lease lifecycle across map/home/title.
- `node scripts/test-rpg-scene-music.mjs`: actual soundtrack files/playback, unchanged audio element through menus, furniture and rhythm ownership.
- `node scripts/test-rpg-menu-selection-browser.mjs`: actual craft inspector, home/inventory/fishbook tabs and portrait/landscape layouts.
- `node scripts/test-rpg-2d-actors-browser.mjs`: real WebGL world and remote THREE.Sprite, local-only model allocation, screenshots.
- `node scripts/test-rpg-mobile-browser.mjs`: existing movement, detail menus, gathering/fishing, learning, English and responsive regression.
- Full build/English UI audits and server build.

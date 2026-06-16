# Magic Arc Enemies

All processed sprites are transparent 418x418 PNG files.

## Monster Enemies

`enemies/0.png` through `enemies/44.png` contain 45 standing-only magical monsters.
The source sheets are `sheets/monster-sheet-01.png` through
`sheets/monster-sheet-05.png`.

## Humanoid Enemies

The same numeric ID is used in all three action folders:

- `humanoid-enemies/`: standing
- `humanoid-enemies-attack/`: attack
- `humanoid-enemies-skill/`: skill

IDs `0` through `19` are the regular humanoid enemies.

| ID | Design |
| --- | --- |
| 0 | Rogue apprentice witch |
| 1 | Masked spell fencer |
| 2 | Rune librarian mage |
| 3 | Crystal alchemist |
| 4 | Shadow stage magician |
| 5 | Moon shrine exorcist |
| 6 | Thorn garden sorceress |
| 7 | Armored bell summoner |
| 8 | Cursed doll puppeteer |
| 9 | Flame kitchen mage |
| 10 | Heavy shield spell knight |
| 11 | Paper storm ninja mage |
| 12 | Mirror illusionist |
| 13 | Thunder baton conductor |
| 14 | Ice mirror lancer |
| 15 | Beast-mask geomancer |
| 16 | Clock tower chronomancer |
| 17 | Candlelit necromancy scholar |
| 18 | Star observatory archer |
| 19 | Forbidden-magic academy prefect |
| 20 | Grand Witch Headmistress boss |
| 21 | Astral Calamity Queen true final boss |

## Processing

Run `python scripts/process-magic-enemy-sheets.py` from the project root to
regenerate all individual sprites. The script removes the chroma key from the
whole source image and assigns connected foreground components to each enemy or
action. It does not use simple equal-width cropping, so weapons and effects that
cross nominal cell boundaries are retained.

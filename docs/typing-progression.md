# Typing curriculum progression

All fifteen lesson IDs and Japanese/English/hiragana modes retain their focus. Thirty small levels derive from Act, floor and combat experience (two defeated enemies contribute one experience step). Experience is captured when a battle starts, so defeating one enemy during a fight cannot replace partially entered text. Five curriculum bands introduce more keys, longer words and more complex sentences; within each band the selection gradually favors longer examples. Home-row practice grows from a single key to sequences of up to twelve keys.

The corpus adds 100 school/everyday terms, 136 Japanese sentence readings, 116 English examples, 20 vowel exercises and 480 number/symbol drills to the existing material. Recent prompts/words are avoided within the selected lesson and language. Kana and accepted romanization alternatives remain supported. Completing a card increments the prompt sequence even when the next card has the same ID/name. Long prompts add 90 ms per character above twelve, capped at eight additional seconds, to the existing enemy-action interval.

Data: `src/data/typingPrompts.ts`, `src/data/typingVariety.ts`. Validation: `node scripts/test-typing-progression.mjs` covers all lessons/languages/bands, corpus validity, variety, progression and romanization alternatives.

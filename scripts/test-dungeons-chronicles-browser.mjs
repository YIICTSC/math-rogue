// Shared actual-game coverage, including explicit NPC interaction and save continuation.
process.env.OPTIONAL_NPC_TEST_SERIES=process.argv.includes('--series=2')?'2':'1';
await import('./test-dungeons-optional-npcs-browser.mjs');

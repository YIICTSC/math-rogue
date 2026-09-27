import assert from "node:assert/strict";
import { createServer } from "vite";

const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "error",
});

try {
  const {
    buildRpgInviteUrl,
    getRpgRoomCodeFromUrl,
    normalizeRpgRoomCode,
  } = await server.ssrLoadModule("/src/rpg/invite.ts");
  assert.equal(normalizeRpgRoomCode(" ab2cde "), "AB2CDE");
  assert.equal(normalizeRpgRoomCode("ABC-12"), "");
  const source = "https://example.test/learning-rogue?debug=1#rpg";
  const invite = buildRpgInviteUrl(source, "ab2cde");
  assert.equal(
    invite,
    "https://example.test/learning-rogue?debug=1&rpgRoom=AB2CDE#rpg",
  );
  assert.equal(getRpgRoomCodeFromUrl(invite), "AB2CDE");
  assert.equal(
    getRpgRoomCodeFromUrl("https://example.test/learning-rogue?rpgRoom=bad"),
    "",
  );
  console.log("RPG invite URL generation and room-code parsing passed.");
} finally {
  await server.close();
}

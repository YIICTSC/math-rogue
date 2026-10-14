import fs from 'node:fs';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
fs.mkdirSync('tmp', { recursive: true });
await build({ entryPoints: ['src/components/PaperPlaneFleet3D.tsx'], outfile: 'tmp/paper-plane-visual-test.mjs', bundle: true, platform: 'node', format: 'esm', packages: 'external', define: { 'import.meta.env': '{}' } });
const { moduleVisual, airframeVisual, fleetSignature, moduleSocket } = await import('../tmp/paper-plane-visual-test.mjs');
const catalog = JSON.parse(fs.readFileSync('art/paper-plane/catalog.json', 'utf8'));
const bytes = fs.readFileSync('public/models/paper-plane/fleet.glb');
assert.equal(bytes.toString('ascii', 0, 4), 'glTF');
const gltf = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)));
const names = new Set(gltf.nodes.map(n => n.name));
const parts = [...catalog.parts, ...catalog.ships.flatMap(s => s.layout)].filter(p => p.type !== 'EMPTY');
for (const p of parts) {
    assert(names.has(moduleVisual(p).model), p.name);
    assert(names.has(moduleVisual({ ...p, name: p.name + '+' }).model), p.name + '+');
}
for (const ship of catalog.ships) assert(names.has(airframeVisual(ship.id)));
for (const enemy of catalog.enemies) assert(names.has(airframeVisual(enemy.name, true)));
assert(names.has(airframeVisual(undefined))); // Old saves remain valid.
const plane = { airframe: 'SHIP_DEFAULT', yOffset: 1, parts: catalog.ships[0].layout };
const charged = { ...plane, yOffset: 2, parts: plane.parts.map(p => ({ ...p, id: 'new-id', slots: p.slots.map(s => ({ ...s, value: 7 })) })) };
assert.equal(fleetSignature(plane), fleetSignature(charged));
const swapped = { ...plane, parts: plane.parts.map((p, i) => i === 2 ? catalog.parts[1] : p) };
assert.notEqual(fleetSignature(plane), fleetSignature(swapped));
assert(moduleVisual({ ...catalog.parts[0], name: catalog.parts[0].name + '+' }).enhanced);
// Screen-left enemy columns must stay screen-left after the hull's 180° turn.
for (let row = 0; row < 3; row++) {
    const front = moduleSocket(row * 3, true);
    const rear = moduleSocket(row * 3 + 2, true);
    assert(front.x > rear.x && -front.x < -rear.x, 'Enemy front/rear sockets reversed');
    assert.equal(front.x, moduleSocket(row * 3 + 2).x, 'Both noses have the same mounting depth');
    for (let col = 0; col < 3; col++) {
        const player = moduleSocket(row * 3 + col);
        const enemy = moduleSocket(row * 3 + col, true);
        assert.equal(player.z, enemy.z === 0 ? 0 : -enemy.z, 'Enemy row changed after rotation');
    }
}
assert(bytes.length < 1_500_000, 'Keep the shared fleet library under 1.5 MB');
for (const mesh of gltf.meshes) for (const primitive of mesh.primitives) {
    const positions = gltf.accessors[primitive.attributes.POSITION];
    assert(positions.min.every(Number.isFinite) && positions.max.every(Number.isFinite));
}
console.log(`PASS: ${catalog.ships.length} player hulls, ${catalog.enemies.length} enemy mappings, ${parts.length} non-empty catalog entries + upgrades, stable equipment signatures, finite meshes (${bytes.length} bytes).`);

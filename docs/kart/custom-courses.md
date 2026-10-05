# GAKURO GP custom courses

The title and garage include a custom course editor. Twelve control points after the protected quiz approach can be moved in plan view and adjusted vertically. The first four and last two controls remain fixed to preserve the learning straight and lap seam. The shared spline and 1024-point distance sampling generate both road geometry and simulation distance.

Drag cyan control points; use zoom and the point selector for small screens. Choose a placement tool and tap the road, or use the add buttons, to place up to 48 boost pads, jump ramps and item boxes. Objects can be dragged along the route and adjusted by distance/lane sliders. Objects are kept at least 490 m past the start, beyond the 450 m quiz section. Undo/redo keeps up to 50 steps. The eight existing scenery themes remain available.

Save up to 12 courses on the device, select them in the garage, or export/import bounded JSON files. Use this course returns to solo preparation; the same selected course can be chosen for online room creation. Host-created metadata carries the complete course, while compact snapshots retain the normal simulation format. Both dedicated-server and peer-host sessions use protocol 10. Clients arriving mid-race receive the course in their roster. Course metadata is validated on admission/rematch and the receiver. Existing builtin courses remain independent.

The minimap, camera, road objects, quiz board, collision effects, race distance and CPU steering all use the selected race's course. Changing a course for rematch regenerates the renderer. Custom course names are user content.

Validation: `test-kart-custom-course.mjs` checks all eight templates, protected straight, edited geometry, invalid metadata, all three object effects, roster/snapshot sync, minimap and builtin isolation. `test-kart-custom-dedicated.mjs` runs three real local server clients including mid-race admission and malformed course rejection. `test-kart-custom-editor-browser.mjs` exercises creation, save/reload, real 3D driving, five layouts, English UI and title entry. Existing course, camera and learning tests retain compatibility.

# RPG adopted title logo

Title: 異世界転生したら学力で無双した件. Subtitle: 学習ローグRPG. Adopted proposal A with cyan-green 学力 is displayed over the existing RPG background, including the invitation title. ImageGen original `exec-3b0bac62-34e4-40d2-b7de-0313306e9d20.png` stays in the generated_images directory. Transparent optimized WebP: `public/sprites/rpg/title/logo.webp`, 1600×800, about 384 KiB. Title controls and the logo are checked at five phone/desktop viewport sizes.

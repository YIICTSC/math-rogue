# 放課後ミニラッシュの小物

ImageGenの組み込みツールで2枚を生成。等間隔の4列×3行を切り出し、マゼンタを透過、最近傍で縮小して96×96の透過PNGに配置した。Pixel Art Atlasから採用したPNGの行番号とチェックサムは `provenance.json` に記録している。

## 小物シート

> Create one game-ready 2D pixel art 4 by 3 sprite sheet for a Japanese after-school minigame collection, exact evenly spaced 4 columns and 3 rows, 12 isolated objects, no border lines, no shadows outside objects, broad blank space between objects, solid pure chroma key #FF00FF magenta all around (never use magenta on the sprites), no text. Landscape format, each object centered in its equally sized slot and fully contained, crisp pixel clusters, SNES school-at-dusk arcade palette, high readability at 32 pixels. In strict reading order: row 1 brass school bell, light blue paper glider, thick slice of golden toast, navy school satchel; row 2 red gym sneaker, cylindrical lab measuring glass with cyan liquid, school notebook with no letters, green umbrella; row 3 microphone, orange cone, red theater lantern, golden brass skeleton key. Each slot contains exactly one of these. These are for interactive sprites; prioritize distinctly readable shapes and matching scale.

出力順は bell、glider、toast、satchel、sneaker、cylinder、notebook、umbrella、mic、cone、lantern、key。

## 舞台装置シート

> One game-ready 2D pixel art prop sheet, exact evenly spaced 4 columns by 3 rows on solid flat #FF00FF chroma key magenta background, no frames, no text, very broad blank margins between each separate object. In strict row-major order one isolated object per slot: row 1 open low flame cast iron frying pan viewed in side elevation, white ceramic round dinner plate viewed in isometric view, open wooden school bookshelf filled with books, old arched iron dungeon door with brass latch; row 2 a pair of wooden low hurdles with a horizontal red rope between them shown side-on, bright blue volleyball, wooden microphone stage podium viewed in isometric view, blue and cream carnival kiosk; row 3 illuminated glass radio dial, dark green chalkboard with wood frame and NO marks, yellow basketball hoop with a stand, orange paper wind sock. Consistent chunky 32x32 console pixel art, strong outlines, no anti-aliased glow, no gradients outside objects, no magenta on objects, matching SNES Japanese school arcade game.

出力順は pan、plate、bookcase、door、rope、volleyball、podium、kiosk、dial、board、hoop、windsock。


## 専用タイトル絵とミニゲーム一覧アイコン

組み込みImageGenを使用。タイトル絵には学習ローグの叛逆の高校生と星宮あかりの立ち絵を参照画像として指定した。出力は `public/sprites/after-school-rush/title-v1.webp` と `public/sprites/after-school-rush/menu-icon-v1.webp` に収録。

タイトル絵

> A single original landscape 3:2 key visual for a Japanese pixel arcade title screen, no text, no lettering, no numbers, no mockup or UI. Character references are the Rebellious High Schooler (black hair, navy uniform jacket with bright blue lining, gold trim) and Akari Hoshimiya (red side ponytail with a star clip, navy school uniform, red bow). Reinterpret both exactly recognizable in an expressive high-end 32-bit Japanese pixel art game illustration with crisp deliberate pixel clusters. The two are running diagonally towards the viewer along a school festival arcade at sunset, carrying a little golden bell with radiant star-shaped sound echoes. An inviting lived-in school campus with lights, paper lanterns, roof silhouettes, evening gold and violet, a few small pixel game motifs like a paper plane and gym ball far behind. Put both faces and the bell inside the central 60% of the image so the illustration can be cropped for a game title card on mobile. Strong readable silhouettes, arcade momentum, warm celebratory color harmony, navy shadows, cinematic depth. A finished full-bleed illustration. No giant lettering, logos or text in any language.

一覧アイコン

> Single square illustrated app menu icon for a Japanese 32-bit pixel arcade microgame collection, with genuine transparent background outside the icon and no words, letters or numbers. Center a very bold luminous golden school bell with a red ribbon, two little light sparks and one lavender paper plane tucked behind it, on a single deep indigo rounded-square badge with a simple warm gold rim and dark violet shadow. Arcade sunset gold / blue / violet palette. Bell silhouette clear when reduced to 48px. Use very crisp stepped pixel edges, intentionally few colors, no fine noise, no extra borders or repeated icons. Object centered, whole badge with a thin transparent safe margin around all four sides.

## 校門スタート系の車両

ImageGenで透明背景の俯瞰カートを生成し、透明ノイズを除いて604×800のWebPへ縮小。ほかの校内レースでは主人公を別スプライトで座席位置に重ねる。`public/sprites/after-school-rush/kart-overhead-v1.webp`。

> Create a polished 2D game sprite for a colorful Japanese school-festival arcade racing game: a compact child-friendly go-kart seen from directly overhead, aligned vertically with its front facing toward the TOP of the image, symmetrical, unmistakably a small four-wheel kart with visible rounded wheels, steering wheel area, seat and compact chassis. Bright cherry red and warm ivory panels with small teal accents, subtle gold school-festival details, bold clean silhouette, smooth cel-shaded illustration, crisp edges, high readability when scaled down. The driver is NOT present because the player's character sprite is rendered separately. Single isolated vehicle only, centered, fully visible with padding, no shadow extending far, no road, no scenery, no text, no letters, no symbols, no border, transparent background.

校門スタートは主人公と車の遠近感が合わないため、ImageGenに高校編主人公とカート画像を参照させ、主人公込みの一体絵を生成。初版は車の前方と人物の向きが逆になったため再生成し、画面上側の車両前方を向いてハンドルを握る後ろ姿に修正した。人物の別描画はこのゲームだけ隠す。透明背景を維持して582×820のWebPに縮小。`public/sprites/after-school-rush/kart-gate-driver-v1.webp`。

> Correct the attached game sprite. Keep the kart body and its forward direction toward the TOP of the image. Rotate only the seated boy 180 degrees so he faces the kart's front at the top. Show the back of his head and shoulders toward the viewer at the bottom; do not show his face looking down toward the bottom. Move the steering wheel ahead of his torso, toward the top, with both arms reaching forward/up and both hands gripping it naturally. His knees and shoes point toward the top. The flower-decorated nose is the forward direction. Keep one driver, anatomically correct two arms and hands, the red/ivory/teal kart, transparent background, and the same clean arcade illustration style. Do not leave the wheel below the driver or preserve the old pose.

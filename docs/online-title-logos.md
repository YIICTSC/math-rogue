# Online game title logos

ImageGen produced three original transparent title graphics:

| Game | Main title | Subtitle | WebP asset |
| --- | --- | --- | --- |
| Kart racing | GAKURO GP | 学習ローグレース | `public/sprites/online-titles/gp-logo.webp` |
| VR tactical training | GAKURO VR | 学習ローグVR | `public/sprites/online-titles/vr-logo.webp` |
| Golf | GAKURO GOLF | 学習ローグゴルフ | `public/sprites/online-titles/golf-logo.webp` |

The GP logo emphasizes speed, a steering wheel, and checkered flags. VR uses cyan holographic targeting and circuitry. Golf uses emerald and gold, a golf ball, and a pin flag. Each includes a pencil motif connecting it to Learning Rogue.

The production assets preserve alpha transparency and full source resolution, encoded as WebP at quality 92. The original PNGs remain in `/workspace/generated_images`; PNGs are not shipped to clients.

`GameTitleLogo` provides asset URLs and localized accessible text. Each game's `GameTitleScreen` uses its existing logo slot. Main title menu button names and in-game controls retain their current labels. Branding in the artwork remains consistent across languages. Portrait screens center the logo; landscape screens retain the logo/menu split. Object-fit contain keeps the title and subtitle visible.

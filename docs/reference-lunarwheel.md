# lunarwheel.it — how the scroll film is built

Studied from the live page (`https://lunarwheel.it`, WordPress theme `lunar`, English homepage) in October 2026. The HTML is `template-parts/homepage`. The behavior lives in `wp-content/themes/lunar/js/personal.js` (v2.58), with GSAP, ScrollTrigger, and Locomotive Scroll loaded beside it.

This is not WebGL and not a 3D model in the browser. It is the Apple AirPods technique: scroll scrubs a pre-rendered image sequence drawn onto a `<canvas>`.

## Stack

- jQuery for a few clicks (menu, anchors).
- GSAP + ScrollTrigger. Every film beat is a timeline with `scrub: true`.
- Locomotive Scroll (`smooth: true`, `lerp: 0.1`, `multiplier: 0.7` on desktop and `1.5` under 901px) is the scroller. `ScrollTrigger.scrollerProxy(".smooth-scroll")` keeps pins in sync. `pinType` is `transform` when Locomotive has set a transform, otherwise `fixed`.
- `ScrollTrigger.addEventListener("refresh", () => locoScroll.update())`.
- Canvas 2D only. The frame object is even named `airpods`.

## Frame sequences

WebP is detected with `canvas.toDataURL("image/webp")`. When it works, frames load from a `webp/` folder with the suffix `_risultato.webp`. Otherwise the same index is a `.jpg`.

Each sequence is an array of `Image()`, a `{ frame: 0 }` object, and `gsap.to(..., { frame: count - 1, snap: "frame", onUpdate: render })`. `render` is `clearRect` + `drawImage` at the sequence’s native pixel size. CSS scales the canvas.

| Canvas | Folder | Frames | Bitmap | What it shows |
| --- | --- | --- | --- | --- |
| `#hero-lightpass` | `video/intro/` | 276 | 1920×1080 | Opening product film. Files are `LUNAR_S1_V01_` plus index `53…328`. |
| `#hero-lightpass2` | `video/assemblaggio/` | 165 | 1500×1080 | Assembly / explosion. `LUNAR_S4_V01_`. |
| `#hero-lightpass3` | `video/profilo/` | 97 | 400×1000 | Narrow profile roll. `LUNAR_S2_V01_ALPHA_`. |
| `#hero-lightpass4` | `video/laterale/` | 301 | 1000×1800 | Side film beside the maker essay. `LUNAR_S3_v03_`. |

Images are created up front (`img.src = …` in a loop), not streamed. There is no crossfade between sequences. Each canvas is its own pinned panel.

## Page structure

One Locomotive root, `.smooth-scroll`. Fixed header `#menu` with anchor buttons (`data-id`) for Patent, Features, Made in Italy, Contact. The active link is swapped inside the scroller proxy by comparing section offsets.

1. `.step1#brevetto` — pinned. Headline fades in, then out. The intro canvas scrubs across ~350% of the viewport (`end: +=350%`, shorter on small screens). The canvas and a shadow `#ombra` drift up 120px while a second headline fades in underneath.
2. `.titolo3-c` — pinned text only. A centered block rises, holds, then leaves (`y: 200px → 0 → -200px`).
3. `.step2` — pinned ~300%. The assembly canvas scrubs on the same timeline as the titles. “In the assembly phase…” fades out, “Isolating all noise…” fades in and up, then “Click!” flashes. Four empty `.plus` divs sit on the panel (CSS crosshairs, not pixels in the frames).
4. `.step3` — pinned text, same rise / hold / leave.
5. `.step4` — pinned ~300%. Profile canvas scrubs while “Sssshhh.” and “Listen carefully…” slide off to the left. A `.suono` meter sits in the layout.
6. `.step5` — two looping muted `<video>` files (`lunar-video1.mp4`, `lunar-video2.mp4`) parallax with a caption. These are not frame sequences.
7. `#caratteristiche` — three columns. Each is a small SVG, a mono index (`001`), a title, and a gray paragraph. The grid fades up and away; it is not pinned in the current script (`pause()` is on that timeline).
8. `.step7` — centered statement and a contact button.
9. `.step6#inventore` — pinned ~150%. The tall lateral canvas scrubs while `.right-info` (the origin essay) translates up if it is taller than the viewport.
10. `.step8#contatti` and the footer.

Desktop pin distance is `+=200%` to `+=350%` per beat. Under 901px those ends shrink (250 / 200) but `pin` stays true. An older `ismobile1` branch is present and unused (`ismobile1` is hardcoded false).

## What the scroll feels like

Separate pins, one product. You never get a free-scrolling hero. The object turns, then a later pinned canvas opens it, then copy crossfades on top of a held or still-playing frame. Labels are HTML. The frames themselves are clean product renders.

## What Atomic Explainer takes from this

The Murph page is one continuous pin instead of four canvases, because the source clips already join: a 9:16 turn whose last frame is the first frame of the explosion. Scroll maps onto that film, then holds the final exploded frame while HTML callouts step through each part. Supporting sections after the pin follow the same shape as Lunar’s feature grid, essay, and notes.

There is still no 3D model. If `frames.rotation` or `frames.explode` is missing, the same pin crossfades and parallaxes the stills.

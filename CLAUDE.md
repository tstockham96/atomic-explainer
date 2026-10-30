# explode

A photo of a physical object goes in. A photoreal, scroll-driven “how it’s made” site comes out.

The demo is the Hamilton Khaki Field Murph 42mm, reference H70605731. Frames live in `public/murph/frames/` (121-frame turn, 110-frame explosion). The researched copy is `public/spec.json`.

## Architecture

```
src/pipeline     identify, research, image edits, motion, site writer, 3D stub
src/spec         zod schema (version 1), film phases, frame skip math
src/viewer       React page: pinned canvas film, then parts, essay, sources
src/cli.ts       explode bin
src/mcp.ts       same pipeline as MCP tools over stdio
public/murph     committed Murph stills and WebP sequences
```

Pipeline, in order:

1. **Identify.** Vision model returns maker, model, category, and confidence. It is told not to invent a reference number.
2. **Research.** A second call returns the spec: each part’s name, material, how it is made, a fact or two, and stack order.
3. **Images.** The uploaded photo is the reference for a hero, an exploded view, and a cutout per part. A failed edit does not abort the run; the warning is stored and that plate stays empty.
4. **Motion (optional).** Image-to-video makes a rotation clip from the hero and an explode clip from the hero plus the exploded still. ffmpeg writes numbered WebP frames.
5. **Site.** Static folder: `index.html`, the viewer, `spec.json`, and the frames.
6. **True 3D.** Not built. `src/pipeline/solid3d.ts` is the interface. `solid3d.available` is `false`. `reconstruct` throws `TODO(explode-3d)`. The film is an image sequence on purpose.

`runExplode()` in `src/pipeline/run.ts` is the whole pipeline. MCP tools (`explode_identify`, `explode_research`, `explode_visualize`, `explode_motion`, `explode_extract_frames`, `explode_build_site`, `explode_run`) call the same code. Details are in `docs/agent.md`.

## How to run

The Murph demo needs no API key.

```bash
npm install
npm run dev          # http://127.0.0.1:4317
npm test
npm run typecheck
npm run build        # dist-site/ and dist/cli.js
```

Generate a site from a photo (needs `AI_GATEWAY_API_KEY`, or `OPENAI_API_KEY` if the gateway key is unset):

```bash
cp .env.example .env
npx explode ./photo.jpg --out ./site
```

From this repo, before the package bin exists:

```bash
npm run explode -- ./photo.jpg --out ./site
```

`--motion` generates the rotation and explode clips, then extracts frames (gateway Kling, Veo, or Seedance, or fal when `EXPLODE_VIDEO_PROVIDER=fal` and `FAL_KEY` is set):

```bash
npx explode ./photo.jpg --motion --out ./site
```

Render a spec you already have, with no model call:

```bash
npx explode --from-spec public/spec.json --out ./site
```

MCP server (stdio). Development entry, or `node dist/mcp.js` after `npm run build:cli`:

```bash
npm run mcp
```

Rebuild frame sequences from local clips (the source mp4s are not in the repo):

```bash
npm run explode -- --extract ./rotate.mp4 --frames-dir public/murph/frames/rotation --fps 12
npm run explode -- --extract ./explode.mp4 --frames-dir public/murph/frames/explode --fps 12 --skip 4.55-5.65 --skip-keep 2
```

## Scroll film (lunarwheel.it)

The page follows [lunarwheel.it](https://lunarwheel.it). Notes from reading that site are in `docs/reference-lunarwheel.md`.

It is not WebGL and not a 3D model in the browser. It is the Apple AirPods technique: scroll scrubs a pre-rendered image sequence drawn onto a canvas.

- **GSAP ScrollTrigger** pins one section (`#film` in `src/viewer/Film.tsx`) with `scrub: true`.
- **Lenis** (`lerp: 0.09`) is the inertial scroller. It drives `gsap.ticker` and calls `ScrollTrigger.update` on scroll. Lunar uses Locomotive Scroll; explode uses Lenis for the same job.
- **Canvas 2D** (`src/viewer/Reel.tsx`) paints the current WebP. Scroll progress maps through `src/spec/film.ts`: a short title, then the turn, then the explosion, then component close-ups accompany HTML callouts. A chapter bar and keyboard-accessible range control allow direct navigation.
- Lunar uses several pinned canvases. Explode uses one continuous pin, because the turn’s last frame is the explosion’s first frame.
- If a spec has no frame sequences, the same pin crossfades the hero still into the exploded still.
- `prefers-reduced-motion` drops the pin and shows the stills in order.

The explosion source flashes a second crystal between **4.55s and 5.65s**. Extraction rushes that range instead of playing every duplicate frame: `--skip 4.55-5.65 --skip-keep 2` (keep two frames spread through the range; `keep: 0` would drop it). The committed `public/murph/frames/explode/` sequence is already that extract.

## Secrets and source art

No API keys belong in the repo. `.env` and `.env.*` are gitignored; `.env.example` is the empty template. Do not commit `source.jpg`. The watermarked retailer photo used to generate the Murph stills is not in this repo, and neither are the source mp4s.

## Known issues

- Movement, crown, and caseback pictures are representative, not macros of this exact watch. The caseback engraving in the photograph is generated and is not Hamilton’s production text.
- Hamilton does not publish a steel grade for this case. The demo does not call it 316L.
- True 3D is a stub (`solid3d.ts`). There is no glTF, no camera path, and no image-to-3D provider.
- Background removal is not implemented. A model that will not return a clean cutout leaves an empty plate.
- Specs without `frames.rotation` / `frames.explode` only crossfade stills. They do not scrub a film.
- The editorial design pass uses charcoal, ivory, and a vermilion accent, a larger film stage, direct chapter navigation, and an expandable anatomy section. Automated browser QA could not run in the initial environment; visually review desktop, mobile, and reduced-motion views before merging the design branch.

## Direction

Consider [basement.studio/scrollytelling](https://github.com/basementstudio/scrollytelling) as the scroll engine, or as the reference for how a premium frame-scrub story is structured. The current pin is hand-rolled GSAP + Lenis in `Film.tsx` and `Reel.tsx`. A library built for this kind of story may be a better base than continuing to tune the custom pin, if the next pass is about feel rather than the photo pipeline.

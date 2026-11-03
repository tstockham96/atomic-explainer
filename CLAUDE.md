# explode

An open-source, scroll-driven 3D object explainer. The core purpose is to help people understand how an object works. Research must determine the assembly, geometry, materials, motion, and text before generation. A photo or description starts the investigation; it is not the complete reconstruction brief. Read `docs/research-first.md` before planning assets. For the Murph, continue from `docs/research/murph.md` and `docs/research/murph-study.json`; do not restart from one exterior photograph. The experience is one continuous scene followed by anatomy stories. Avoid marketing navigation or unrelated editorial sections.

The default demo is now the licensed Khronos Chronograph Watch (`public/chronograph.json`), with six separately explorable assemblies and no internal movement. Keep the attribution and trademark notices in `public/models/chronograph/`. The earlier Hamilton Murph experiment remains at `?demo=murph`, with its researched copy in `public/spec.json`. Do not confuse the two objects or apply the Murph image manifest to the chronograph.

The research-led component reconstruction is in `src/authoring/` with its continuous-scroll study and build instructions in `tools/murph-study/README.md`. Continue movement fidelity work from its Hamilton, Fratello and SJX photo register; preserve independent parts, transparent windows, and evidence metadata. This authored example is not yet an unattended arbitrary-object reconstruction pipeline.

## Architecture

```
src/pipeline     identify, research, image edits, motion, site writer, Tripo 3D adapter
src/spec         zod schema (version 1), film phases, frame skip math
src/viewer       React page: pinned 3D scene or image fallback, then anatomy
src/viewer/three Three.js models, camera, atmosphere, GLB loader
src/cli.ts       explode bin
src/mcp.ts       same pipeline as MCP tools over stdio
public/murph     committed Murph stills and WebP sequences
```

Pipeline, in order:

1. **Identify.** Vision model returns maker, model, category, and confidence. It is told not to invent a reference number.
2. **Research.** Broad and targeted evidence passes produce an `understanding` dossier: identity scope, references, component functions and claims, assembly relationships, construction methods, isolated-surface checks, and open questions. Research directs the asset plan.
3. **Images.** The uploaded photo is the reference for a hero, an exploded view, and a cutout per part. A failed edit does not abort the run; the warning is stored and that plate stays empty.
4. **Motion (optional).** Image-to-video makes a rotation clip from the hero and an explode clip from the hero plus the exploded still. ffmpeg writes numbered WebP frames.
5. **Site.** Static folder: `index.html`, the viewer, `spec.json`, and the frames.
6. **True 3D viewer.** `reconstruct` first writes `construction-plan.json`. The single-photo adapter only executes an explicitly scoped exterior draft; plans needing component work stop before a paid generation. The agent must author/source those components rather than discard them. Implemented in `src/viewer/three`. Specs choose a procedural watch or a multipart GLB via `scene3d`. `--3d` now calls Tripo image-to-model and semantic segmentation through `solid3d.ts`. The integration has mocked HTTP/real GLB tests and two live watch trials. Neither result passed the visual/component quality target; see `docs/tripo-watch-trial.md` and `docs/murph-reconstruction-trial.md`. Do not claim accurate hidden geometry or validated part matching. See `docs/photo-to-3d.md`.

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

## Continuous scene

`Film.tsx` pins one scene with Basement Scrollytelling (Root, Pin, Animation), GSAP, and Lenis. A `scene3d` spec selects `ObjectScene.tsx`, which lazy-loads Three.js. The chronograph has six grouped assemblies. `timeline.ts` maps scroll to turn, separation, and focus; `choreography.ts` computes geometry-based camera framing and per-part orbit directions. `scene.ts` applies lighting, animation, and fading of neighboring components. Imported material maps and bevels are retained. Both atmosphere options share the same geometry and timeline. The user rejected the procedural model and overlapping, repetitive motion. The current imported-asset pass addresses those concrete defects. Do not treat test counts or switching color themes as proof of visual quality.

Generic GLB scenes map named, non-overlapping nodes to component IDs. See `docs/3d-scenes.md`. Keep model authoring separate from the reusable viewer. The procedural watch is illustrative, not Hamilton CAD or an accurate H-10 simulation.

Specs without `scene3d` use the photographic fallback in `Reel.tsx`. One canvas scrubs the rotation and explosion, then focuses on regions of the same exploded frame. Historical image-sequence notes are in `docs/reference-lunarwheel.md`. Reduced-motion preferences skip the pin and show stills and anatomy text.

## Secrets and source art

No API keys belong in the repo. `.env` and `.env.*` are gitignored; `.env.example` is the empty template. Do not commit `source.jpg`. The watermarked retailer photo used to generate the Murph stills is not in this repo, and neither are the source mp4s.

## Known issues

- Movement, crown, and caseback pictures are representative, not macros of this exact watch. The caseback engraving in the photograph is generated and is not Hamilton’s production text.
- Hamilton does not publish a steel grade for this case. The demo does not call it 316L.
- Photo-to-3D integration exists; live quality validation and missing internal-part reconstruction are outstanding.
- Web research requires OPENAI_API_KEY even when writing uses the gateway. Never invent citations.
- `npm run build && npm run studio` serves upload at localhost:4319/create. Jobs are private local files under ignored `.explode-jobs/`.
- Background removal is not implemented. A model that will not return a clean cutout leaves an empty plate.
- Specs without `frames.rotation` / `frames.explode` only crossfade stills. They do not scrub a film.
- The actual WebGL canvas has been captured through a local review page in the in-app browser. Desktop, portrait close-ups, and both atmospheres have been inspected. A same-origin iframe check verifies pinning, captions, six anatomy thumbnails, and the atmosphere switch. This is not full browser screenshot coverage or a claim that the user’s target is achieved.
- The imported sample has no internal movement; its planar glass receives an explicitly documented illustrative beveled edge. Full Murph fidelity still requires appropriate source assets.

## Direction

Prioritize object fidelity and intentional camera choreography. The requested experience is floating around one continuous, real 3D object while scroll reveals how its parts work. The user liked the anatomy stories after the scene. Keep both atmospheres available while the model and motion are refined; theme selection is secondary.

## Quality evaluations

Read `docs/evaluations.md` before claiming a model or experience is ready. `npm run eval` reports known failures; `npm run eval:release` is a deliberately strict release gate. Tests passing do not establish visual quality or learner comprehension. Reviews bind to the spec and model hashes. Record actual exported front, oblique and reverse views for every component. Preserve research-only and fixture labels; never present them as live generations. The studio now creates plans only (`--plan` / MCP `planOnly`), with component construction handed to an agent.

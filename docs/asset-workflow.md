# Research to actual assets

The rejected iPhone recipe exposed a gap: research existed beside the demo, but detailed visual evidence and sourced geometry did not drive its construction. More rubric text did not fix that. The new executable handoff is `src/spec/assets.ts` and `src/pipeline/assets.ts`.

## Agent workflow

1. Identify the exact variant. Research specifications, functional components and assembly relationships in the existing understanding dossier. Open photographs, teardown views and diagrams; record what you actually see. Generated imagery can propose missing views but cannot supply factual evidence for hidden mechanisms.
2. Search manufacturer/CAD sources and model catalogs. Record candidate coverage, exact variant, license, decision and reason. Inspect actual files. A manufacturer's marketing asset can contain multiple device instances; a marketplace download can be only a billboard advertising the paid asset. Neither filenames nor mesh labels establish anatomy.
3. Write an asset plan. Each task links a researched component to inspected local images and one strategy: existing GLB, multi-view generation, text generation, or defer. The same contract works for watches, phones and other products. See `examples/iphone-18-pro/asset-plan.json` for a real source-selection case; its local research files are intentionally unbundled.
4. Execute one component at a time:

```sh
npm run explode -- --from-spec ./research.json --asset-plan ./asset-plan.json --component battery --out ./battery-review
```

MCP equivalent: `explode_prepare_asset({specPath, planPath, componentId, outDir})`. The host agent can do the research without an OpenAI API key. Tripo generation still needs its own account/key. Source imports use no model API.

5. Inspect the returned `index.html`, `asset-brief.json`, `asset-review.json` and `model.glb`. Compare rendered front, oblique, reverse, assembled and exported views to the observations. Source imports preserve the GLB byte-for-byte. The review viewer preserves authored transforms/material maps and supports drag rotation and front/back/side inspection. It does not narrate unverified internal parts.
6. Repair or replace failed assets, map verified component groups, align dimensions/pivots/interfaces, then use the existing scene authoring/export path. A list of separately generated parts does not establish a coherent assembly. Do not use a primitive recipe as a silent fallback for missing faithful geometry.

## Provider requests

The documented [multi-view route](https://developers.tripo3d.ai/en/docs/generation-multiview-to-model/standard) accepts front plus one or more left/back/right images. Our adapter uploads the inspected component images and sends the corresponding view keys. It does not send a prose prompt to image routes.

The separate [text-to-model route](https://developers.tripo3d.ai/en/docs/generation-text-to-model/standard) accepts an explicit prompt (up to 1,024 characters) and optional negative prompt (255). Describe the researched shape, materials, scale and exclusions. Text generation remains an approximation until actual visual comparison; a detailed prompt does not guarantee exact branded geometry.

Research revision, reference bytes, generation mode and settings determine task identity. A change requires another output folder. Saved task IDs resume polling; an uncertain paid submission blocks repeat purchase. Individual component generation does not automatically purchase exterior segmentation. `tripo-request.json` records what actually reached the provider.

## What the checks prove

Structural checks reject missing image files, wrong reference links, mismatched variant declarations, duplicate views and generated-only evidence. Model inspection records geometry/material/texture inventories and flags billboard candidates. These checks cannot prove that an agent's observation is truthful or that a source proves a claim. Review starts pending even for manufacturer geometry. No numerical quality pass is assigned from triangle counts.

The new routes have fixture-based provider contract tests. The source path has been exercised with the downloaded Apple model. No live multi-view/text generation quality success is claimed by those tests. General unattended research, reliable hidden-part reconstruction, assembly fitting and independent visual/learning review remain open work.

Source licenses remain separate from the engine's MIT license. Unknown/restricted rights are recorded in review output; locally inspecting a model is not an authorization to redistribute it. The importer creates a local working review, not a public release. Check rights before using the legacy site exporter or committing an asset.


## Whole-assembly continuation

Omit `--component` from `--asset-plan` (or `componentId` from `explode_prepare_asset`) to advance all researched component tasks. The batch preserves provider checkpoints, isolates output folders and records unresolved/deferred/missing tasks in `assembly-progress.json`. It always remains incomplete until assets are reviewed, fitted and integrated. This is not a geometric fitting solver.

Planning saves `assembly-requirements.json`. Pass that original inventory through `--requirements` or MCP `explode_build_site.requirementsPath`. Export checks actual geometry-bearing GLB component nodes and story/research coverage. It also reuses a requirements inventory already saved in the destination and refuses to silently drop required IDs. Missing coverage appears in the rendered notice, not only a hidden report. Do not regenerate the original inventory from the subset of parts returned by a source provider.

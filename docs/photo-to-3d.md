# Photograph to 3D draft

Status: implemented provider integration, with contract/fixture tests and two live watch studies: [the licensed watch](tripo-watch-trial.md) and [the Murph](murph-reconstruction-trial.md). Both returned twelve textured pieces but failed the finished explainer's fidelity and component-quality targets. The studio reports missing credentials rather than displaying simulated progress.

For researched component sourcing and generation, use the newer [asset workflow](asset-workflow.md). It adds existing GLB import, inspected multi-view references and text-to-model requests. The single-photo path below remains an exterior draft adapter.

## Run locally

For the research-only studio, set `OPENAI_API_KEY` in `.env`, then run `npm run build && npm run studio`. Open `http://127.0.0.1:4319/create`. PNG/JPEG, 20 MB maximum. The server binds to loopback, validates Host/Origin and a session submission token, and never exposes API credentials. It is a local tool, not a multi-user hosted service.

The studio saves a research/construction plan; it does not call Tripo or claim a finished 3D model. CLI planning: `npm run explode -- ./photo.jpg --plan --out ./research`.

The separate exterior-draft CLI requires `TRIPO_API_KEY` too: `npm run explode -- ./photo.jpg --3d --out ./site`. The existing image/video route remains available without `--3d`. MCP `explode_run` accepts `three: true`.

## Research-first boundary

Read [the product principles](research-first.md). The structured `understanding` dossier is now required for new automated research. `reconstruct` saves `construction-plan.json` before buying geometry. Missing research or a plan requiring individual components stops this exterior-only adapter. Agent-led component modeling remains the path for a complete explainer; that automated builder is not implemented yet. Legacy specs still display and export without a dossier.

## What the implementation does

1. Identify the visible product, preserving identification uncertainty.
2. Use broad and targeted OpenAI web research passes, then produce a structured understanding dossier and component construction inventory. Each component records documented/inferred evidence, URLs, and a caveat. Only source URLs returned by the web tool survive validation. A source URL alone does not prove that every generated sentence is correct.
3. Check the construction plan. Only for an explicitly scoped exterior draft, upload the reference to Tripo v3 and generate a textured PBR model with H3.1 (`v3.1-20260211`). This request uses the photograph, not the researched text: the endpoint does not accept a component construction plan.
4. Run semantic segmentation (`v2.0-20260430`, beta). Generation with `generate_parts` is deliberately not used: Tripo documents that it conflicts with textures/PBR. The first live watch trial retained PBR maps but returned generic mesh names and imperfect component groups; label-only matching is insufficient for that output.
5. Save the original GLB; validate a self-contained, uncompressed, unskinned scene; rename mesh nodes to stable IDs without changing geometry or textures. Models with nested mesh assemblies or more than 128 meshes require grouping review.
6. Propose semantic-label-to-component matches. Low-confidence/unmatched surfaces remain unidentified; missing researched parts stay in `research.json` and `coverage.json`, not in invented geometry. Fewer than two identified components stops the explainer export. A confidence score is a model estimate, not calibrated proof.
7. Export a draft using the real-time viewer. Generic vertical spacing separates normalized assemblies. It is an initial layout, not physically derived disassembly or final cinematic choreography. Generated geometry and assignments always require review.

## Jobs and recovery

Studio jobs live in `.explode-jobs/<uuid>/`. `source.png` or `source.jpg` is outside the exported site. Research jobs contain `site/research.json` and `site/construction-plan.json`. Separately, an exterior-generation CLI output contains `research.json`, `coverage.json`, `models/provider-original.glb`, `models/generated.glb`, `models/mesh-inventory.json`, and `models/tripo-tasks.json`. Treat these as working artifacts. No generated assets are automatically committed, published, or relicensed.

Task IDs are saved immediately after a response. Polling is bounded; a timeout preserves the IDs. Resume interrupted research in the studio. For provider geometry jobs, rerun the CLI with the same photo/output directory. To avoid repeating completed research, pass `--from-spec ./site/research.json` as well as the original photo and `--3d`.

A lost submission response has an unknown billing outcome. A `submitting` marker blocks automatic retries. Inspect the Tripo dashboard; if the task exists, put its ID into the corresponding `generation` or `segmentation` property and remove `submitting`. Only clear the marker without restoring an ID after confirming no task was created. Failed provider tasks do not automatically purchase replacements.

## Still required for the full product

- Live quality trials, especially reflective objects, thin glass, intricate mechanisms, and occluded shapes.
- Visual matching of parts, instead of relying on provider labels, and an editor for corrections.
- A reference-driven reconstruction stage that creates missing internals from service manuals, CAD, teardown imagery, or explicitly illustrative geometry. Segmentation cannot reveal a hidden movement that was never modeled.
- Per-object assembly constraints and authored camera paths; performance budgets and reduced-motion preview renders for generated jobs.
- Additional providers/local model runners behind `MeshProvider`. Open-source application code does not make hosted inference open-source or free.

## Primary references checked 2026-10-30

- [Tripo image-to-model](https://developers.tripo3d.ai/en/docs/generation-image-to-model/standard)
- [Tripo semantic segmentation](https://developers.tripo3d.ai/en/docs/mesh-segment)
- [Upload](https://developers.tripo3d.ai/en/docs/files) and [task polling](https://developers.tripo3d.ai/en/docs/task-query)
- [Tripo terms](https://developers.tripo3d.ai/en/terms): generated assets and hosted services have separate terms from this repository's MIT code. Preserve applicable asset rights and attribution.
- [Higgsfield Games 2.0](https://higgsfield.ai/blog/higgsfield-mcp-gpt6-astra-games-2): its documented workflow combines code orchestration with generated creative assets. The connected Higgsfield catalog also exposes Tripo H3.1; this repo uses a direct API adapter so it can run without a ChatGPT plugin session.

## Murph follow-up study

A second live trial used Hamilton’s actual Murph photo, the opt-in Tripo fidelity setting, manually inspected component groups, and explicit material corrections. It cost 110 credits and still did not meet the final geometry/texture target. See [the findings](murph-reconstruction-trial.md) and the reusable [model review tool](../tools/model-review/README.md).

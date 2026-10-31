---
name: explode
description: Build a researched, continuous 3D object explainer with the Explode repository from a photograph, object description, or existing model. Use when the user wants an agent to research an object's parts, obtain or generate multipart geometry, and create a scroll-driven exploration. Ordinary landing pages and still-image illustrations are outside this skill's purpose.
---

# Explode

Produce one convincing object in one continuous 3D scene: an assembled turn, readable separation, close exploration of individual components, and anatomy stories afterward. The purpose is learning: the user should understand how the object works. Research determines the geometry and the story; motion reveals that understanding. The project is https://github.com/tstockham96/explode.

## Locate the engine and available capabilities

Use the user's checkout when present; otherwise obtain the named repository in an appropriate workspace. Resolve all repository paths below against that checkout. Read its `README.md`, `docs/research-first.md`, and `docs/3d-scenes.md` before authoring a scene. The spec contract is `src/spec/schema.ts`.

Inventory the current agent's actual tools. Research, vision, reference-image generation, 3D generation, modeling/CAD, and browser inspection are distinct capabilities. Do not assume every host exposes all of them. A skill supplies workflow instructions; it does not supply model weights, credentials, credits, or a native mesh-generation capability.

Read `docs/reconstruction-cases.md` for accumulated failure cases. Apply its general rules to the new object; do not copy another object's material assumptions. Record new cases and their evidence boundaries as they arise. Separate verified substrate/coating from photo-observed finish, and verify material maps after export.

Complete the construction plan's `requiredMaterialReview` for every component, not just the hero part. Compare related surfaces under matching conditions. Glass on the back deserves the same optical treatment as glass on the front, while shape/composition differences require evidence or an explicit assumption. Keep absent/deferred parts and unresolved mismatches visible in the review record.

Prefer the host agent's research and writing capabilities when available. An OpenAI API key is needed only for steps that explicitly invoke OpenAI through the repository. The agent can write the researched spec itself and render it without any OpenAI call. Use the standalone API pipeline when requested or useful for unattended execution.

## Research an assembly

Identify the object with appropriate uncertainty. Find original specifications, service documentation, exploded diagrams, and credible teardown references. Build a component inventory from those sources, keeping exact-model evidence distinct from category-level inference.

For each planned component, establish its function, visible shape, material evidence, relationship to neighboring parts, and where its geometry will come from. Record citations and uncertainties using the spec's `evidence` fields. Research must affect the asset plan, not merely captions added to an unrelated generated shell.

An exterior photograph does not uniquely determine hidden mechanisms. Missing internals require additional evidence and geometry. When an educational approximation fits the user's intent, label it clearly; do not silently claim it is a faithful reconstruction.

Write the spec’s `understanding` dossier before choosing geometry. Cover every component, including its function, claim-level evidence, reference scope, construction method, material behavior, interfaces and newly exposed surfaces. Trace the relevant energy/force/information/material flow. Use the source register to distinguish an image you inspected from a URL you merely located. Follow conflicts and missing views with targeted research; do not fill them with confident guesses.

A clean isolated component must exclude occluding neighbors, their shadows, and reflected or painted-on mechanisms. For example, removing the hands must expose a clean dial—not blacked-out hand silhouettes. Test front, rear, and isolated views against the research.

## Preserve and complete the original assembly scope

Create `assembly-requirements.json` from the full researched functional inventory before selecting assets. Use `src/spec/requirements.ts`: required IDs, system, purpose and source URLs. Keep this independent of any asset-specific spec. A source model's coverage does not redefine the user's request. An exterior importer must leave the missing battery/board/mechanisms in the work queue.

When the user requests the full explanation, continue through missing-component research, sourcing/modeling/generation, fitting, story integration and visual review without asking them to restate those steps. A small proof sequence is an internal checkpoint, not the final deliverable. Keep advancing independent parts when one asset fails. Stop only for a concrete unavailable capability, missing evidence that prevents a defensible reconstruction, or exhausted authorized budget; identify precisely what remains. Do not silently narrow the task to an exterior study.

`--asset-plan assets.json --requirements assembly-requirements.json` without `--component` advances every researched component and saves `assembly-progress.json`; failed/deferred/unplanned parts remain in the queue. This is asset execution, not an automatic fitting solver. Use the host's modeling tools to resolve the remaining tasks. Preserve source detail and construct missing internals as distinct geometry. Do not fill a requirement with a token box solely to satisfy coverage.

Export with `--requirements assembly-requirements.json`. Inspect `assembly-completeness.json`: it compares the original requirements to actual exported component geometry, research and story mappings. An empty named node or a caption cannot supply missing geometry. Coverage-complete still needs fit, reference fidelity, material, motion and learning review. Never present missing required systems as optional follow-up work.

## Choose geometry for quality

Use the strongest appropriate source for each assembly:

- A suitable licensed multipart model or manufacturer CAD can preserve details that generation loses. Verify redistribution terms and carry attribution with the result.
- Tripo or another available specialized generator can create textured shapes from references. Inspect its actual output before committing to it. More texture resolution cannot repair wrong geometry.
- Modeling or CAD tools can make precise mechanical parts, repair surfaces, author glass thickness, align pivots, and fit components. Use them when available and justified by the object.

Before generating product geometry, record the asset search and decisions in `asset-plan.json` using `src/spec/assets.ts`; read `docs/asset-workflow.md`. Inspect downloaded geometry, not just listing thumbnails. Record actual image observations with local files and reference IDs; a URL found by search is not an inspected photograph. Check exact variant, component coverage and rights separately. Manufacturer AR may contain several display instances and only exterior surfaces. Eight vertices with four faces may be an advertisement plane, not the model advertised in its title.

Use `explode_prepare_asset` or `--asset-plan … --component …` to execute a sourced GLB import or a researched Tripo component task. Multi-view generation receives the inspected images; text-to-model receives an explicit construction prompt. The image-to-model and multi-view routes do not receive prose prompts. Do not imply a research paragraph conditioned an API request when it was never sent. Save the actual request, reference hashes and returned asset. Returned geometry remains under review.

A recipe of boxes and cylinders is useful for assembly or camera regression tests. It is not the default fallback when a high-fidelity asset is missing. Resolve the missing asset/reference or state the specific limitation; do not feature a crude construction fixture as the product result.

Multiple reference views can constrain visible form. Generated reference views remain hypotheses, not new observations. Independently generated parts do not automatically share scale or fit together; assembly alignment is a separate task.

For the repository's Tripo adapter, read `docs/photo-to-3d.md`. It saves a construction plan first and only generates an exterior when the plan explicitly permits an exterior draft. Plans requiring separately built components stop before a paid call; use available modeling/asset tools to execute those plans. The adapter then segments the draft and proposes label-based matches. It does not yet reconstruct missing internals. Its generic separation layout is a draft. Do not describe this path as a proven solution for arbitrary objects.

Respect the user's generation budget. Preserve returned provider task IDs. If a paid submission loses its response, determine its outcome before retrying; do not purchase duplicates to recover a missing preview.

## Prove a small sequence first

Before building the full tour, render the assembled object and a short separation involving a few representative components. Inspect actual browser/model renders from front, oblique, and reverse angles. Check:

- The silhouette, proportions, and recognizable details match the reference.
- Highlights move with the geometry; glass has believable edges and transmission; materials do not depend on painted-on lighting.
- Components have distinct, meaningful geometry, including surfaces exposed by separation.
- Parts fit when assembled and separate without unreadable overlap in the chosen camera view.
- Every visible component has an explanation that matches its geometry and evidence.
- Inspect each component through a full turn, including its reverse, openings and thickness. Engraving, printing and inlays must belong to supporting geometry; no artwork planes spanning holes or copying front markings onto an undocumented back.
- Compare all finishes under the same fixed lighting and exposure. Preserve material differences through roughness, metalness and surface relief, with moving reflections rather than photographic highlights baked into new textures.

Repair or replace the deficient asset before polishing the larger experience. If the available tools cannot reach the required fidelity, say what failed and what additional asset or modeling work is needed. Do not substitute another photo-zoom animation or a crude procedural object and claim the quality target was met.

## Author and export

Keep source provenance and the component inventory beside the model. Use a self-contained GLB with separately addressable parts, embedded ordinary textures, and compatible geometry. From the skill folder, run `node scripts/inspect-model.mjs /absolute/path/model.glb` to inspect mesh names, hierarchy, and resource requirements. This is a structural inventory, not a visual quality verdict.

Author `spec.json` using `docs/3d-scenes.md` and `src/spec/schema.ts`. Map named nodes to researched components. Set appropriate separation axes, spacing, and per-part camera directions. The viewer normalizes the longest assembled dimension to seven units. Author offsets in those normalized units; do not assume source millimeters survive normalization.

Keep the source GLB under `models/` beside the spec. From the repository:

```sh
npm run build
npm run explode -- --from-spec /absolute/path/object/spec.json --out /absolute/path/object/site
```

This export path does not call an AI provider. An MCP-capable host can instead use the existing `explode_build_site` tool with the spec and output paths after connecting the repository's MCP server. Availability of this skill does not mean that server is already connected.

For unattended generation with configured credentials:

```sh
npm run explode -- /absolute/path/photo.jpg --3d --out /absolute/path/object/site
```

That route needs the credentials described in `.env.example`; it is an alternative to the host-agent route, not a prerequisite for all use.

## Review the experience and deliver

Inspect the continuous sequence in both scroll directions and at narrow and wide viewport sizes. Check assembled rotation, maximum separation, every component close-up, return transitions, anatomy, and reduced-motion behavior. Preserve spatial continuity; unexplained teleports and overlapping parts fail the review even if tests pass.

Give every component a complete inspection turn after its neighbors have cleared. Separate parts farther or move the camera to focus; do not fade, dissolve or hide story components. Restore each assembly orientation before returning it to its seat. The repository's reusable inspection helpers provide full turns with fixed framing; construction plans carry the corresponding visual-review requirements. These helpers do not supply missing geometry or prove reference fidelity.

Deliver the local explainer, reusable spec, source/attribution notes, and a concise account of validation and unresolved quality issues. Distinguish live generation from fixture tests. Leave publication or repository pushes within the user's authorized scope. Never equate successful API responses, mesh counts, or green tests with photorealistic quality.

## Apply the quality gates

Use `docs/evaluations.md`, `src/evals/rubric.ts`, and the review schema for each new object. Record exact spec/model hashes, every component’s front/oblique/reverse/exported evidence, material uncertainty, missing geometry, and learning questions. Keep research-only fixtures distinct from paid generation trials. Run structural and browser checks, then judge the actual renders against inspected references. Do not promote a self-review to independent validation or equate test success with photorealism. A learner study is separate from checking that captions exist.

Start API-assisted research with `--plan` (or MCP `planOnly: true`) when geometry sourcing has not been decided. The upload studio is a plan handoff, not an unattended component builder.

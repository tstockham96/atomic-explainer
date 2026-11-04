---
name: atomic-explainer
description: Build a researched, continuous 3D object explainer with the Atomic Explainer repository from a photograph, object description, or existing model. Use when the user wants an agent to research an object's parts, obtain or generate multipart geometry, and create a scroll-driven exploration. Ordinary landing pages and still-image illustrations are outside this skill's purpose.
---

# Atomic Explainer

Produce one convincing object in one continuous 3D scene: an assembled turn, readable separation, close exploration of individual components, a visible closing reassembly, and anatomy stories afterward. The purpose is learning: the user should understand how the object works. Research determines the geometry and the story; motion reveals that understanding. The project is https://github.com/tstockham96/atomic-explainer.

## Set up first, yourself

Run every command yourself, setup included. Never tell the user to run a command, open a terminal, or type `!`, and never hand back a list of steps for them to do.

1. Run `npm install` if `node_modules` is missing, then `npm run setup`. It builds the viewer, ensures a browser for review renders, and installs Blender.
2. If `TRIPO_API_KEY` is not set, the same `npm run setup` opens the Tripo key page and a native password window on the user's screen, and saves what they paste to `.env`. Tell them in one line that the window is up; you never see or handle the key. If they skip it, carry on: Tripo is optional and Blender covers the visible geometry.
3. Read the result with `npm run setup -- --check --json`. `ok` covers everything required; the Tripo check is marked `optional`.

- **Blender with no package manager** (Linux): install it with the platform's own package tool yourself, or use the printed download as a last resort. Run Blender scripts with `npm run blender -- script.py -- args`.
- **Never ask for `OPENAI_API_KEY` or `AI_GATEWAY_API_KEY`.** You do the research and writing yourself; those keys serve only the standalone pipeline and upload studio.

## Decide, don't ask

Start working as soon as setup is done. Do not open with clarifying questions.

- **Which exact variant:** if the request names a model line without a reference, build the current standard reference (for example, the current production Moonwatch Professional for "Speedmaster") and state the reference you chose in your first update. The user can redirect you.
- **Tripo budget:** if the user named no cap, spend up to `ATOMIC_EXPLAINER_TRIPO_CREDITS` from `.env`, or 300 credits when that is unset. Say the cap in your first update and report credits spent at the end. Stop and ask only before going past it.
- Ask only for something you truly cannot decide or do yourself, and keep working on everything else while you wait.

## Quality bar — read before anything else

Someone who knows the object must recognize it instantly in the opening shot, and it must hold up at close range. Past runs failed this by modeling from one front product photo, hand-coding the visible exterior from three.js boxes and cylinders, truncating the bracelet to two links per side, and shipping a render defect that was already noted in their own README. These rules are not optional:

1. **Photographs before geometry.** Inspect at least eight photographs of the exact reference before authoring anything: front, back, both sides, a three-quarter oblique, controls/crown detail, strap or bracelet and clasp, plus teardown or service photos for internals. Save each locally and record it as an `observations` entry with its `view`. `referenceCoverage()` in `src/spec/assets.ts` must report `ok`. Each component cites the observations that actually show it.
2. **Real geometry for everything visible.** For the exterior, use in order: a licensed multipart model; Blender (`npm run blender -- script.py`, with the references as image planes) or CAD; Tripo multi-view generation per component. Hand-written primitive geometry is acceptable only for hidden or schematic internals, labeled as such. If none of the three is available, stop and tell the user what is missing; do not ship a primitive exterior.
3. **Build the whole object.** Full-length bracelets, straps, cables and clasps. A part cut short "for framing" reads as a broken object.
4. **Iterate on the fidelity sheet.** Run `npm run review:compare -- --site <built site> --plan <asset-plan.json>` and look at the PNG it writes. It shows the real viewer's opening shot and front, oblique, side and back renders beside every inspected photograph. Write down each mismatch (silhouette, proportions, missing or partial parts, finish, printed detail, flicker or see-through layers), fix it, rebuild, and rerun. Finish only when there is nothing left you would have to point out to the user. A defect you documented is still a defect.
5. **Do not promote a draft.** Do not add the object to the studio's sample list or call it finished until the sheet passes.
6. **Open the result.** CLI site builds open in the browser when finished. For a site built another way, run `npm run atomic-explainer -- --preview <site dir>`. Also give the user the URL.

## Locate the engine and available capabilities

Use the user's checkout when present; otherwise obtain the named repository in an appropriate workspace. Resolve all repository paths below against that checkout. Read its `README.md`, `docs/research-first.md`, and `docs/3d-scenes.md` before authoring a scene. The spec contract is `src/spec/schema.ts`.

Inventory the current agent's actual tools. Research, vision, reference-image generation, 3D generation, modeling/CAD, and browser inspection are distinct capabilities. Do not assume every host exposes all of them. A skill supplies workflow instructions; it does not supply model weights, credentials, credits, or a native mesh-generation capability.

Read `docs/reconstruction-cases.md` for accumulated failure cases. Apply its general rules to the new object; do not copy another object's material assumptions. Record new cases and their evidence boundaries as they arise. Separate verified substrate/coating from photo-observed finish, and verify material maps after export.

Each local GLB render writes `material-review.json`. Resolve its export issues and complete its pending per-component visual checks; a structural pass is not fidelity approval. For original procedural surfaces, `src/authoring/finishes.ts` supplies scale-aware normal/roughness finishes and opt-in UV preparation. Adjust the finish from inspected references; keep unknown alloys/coatings explicit. Preserve imported texture coordinates and artwork.

Complete the construction plan's `requiredMaterialReview` for every component, not just the hero part. Compare related surfaces under matching conditions. Glass on the back deserves the same optical treatment as glass on the front, while shape/composition differences require evidence or an explicit assumption. Keep absent/deferred parts and unresolved mismatches visible in the review record.

Do the research and writing yourself and render with `--from-spec`; no OpenAI or AI Gateway key is involved. Use the standalone API pipeline only when the user asks for unattended execution.

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

Use `atomic_explainer_prepare_asset` or `--asset-plan … --component …` to execute a sourced GLB import or a researched Tripo component task. Multi-view generation receives the inspected images; text-to-model receives an explicit construction prompt. The image-to-model and multi-view routes do not receive prose prompts. Do not imply a research paragraph conditioned an API request when it was never sent. Save the actual request, reference hashes and returned asset. Returned geometry remains under review.

A recipe of boxes and cylinders is useful for assembly or camera regression tests. It is not the default fallback when a high-fidelity asset is missing. Resolve the missing asset/reference or state the specific limitation; do not feature a crude construction fixture as the product result.

Multiple reference views can constrain visible form. Generated reference views remain hypotheses, not new observations. Independently generated parts do not automatically share scale or fit together; assembly alignment is a separate task.

For the repository's Tripo adapter, read `docs/photo-to-3d.md`. It saves a construction plan first and only generates an exterior when the plan explicitly permits an exterior draft. Plans requiring separately built components stop before a paid call; use available modeling/asset tools to execute those plans. The adapter then segments the draft and proposes label-based matches. It does not yet reconstruct missing internals. Its generic separation layout is a draft. Do not describe this path as a proven solution for arbitrary objects.

Stay within the Tripo budget set under "Decide, don't ask". Preserve returned provider task IDs. If a paid submission loses its response, determine its outcome before retrying; do not purchase duplicates to recover a missing preview.

## Prove a small sequence first

Before building the full tour, render the assembled object and a short separation involving a few representative components. Inspect actual browser/model renders from front, oblique, and reverse angles. Check:

- The silhouette, proportions, and recognizable details match the reference.
- Highlights move with the geometry; glass has believable edges and transmission; materials do not depend on painted-on lighting.
- Components have distinct, meaningful geometry, including surfaces exposed by separation.
- Parts fit when assembled and separate without unreadable overlap in the chosen camera view.
- Every visible component has an explanation that matches its geometry and evidence.
- Inspect each component through a full turn, including its reverse, openings and thickness. Engraving, printing and inlays must belong to supporting geometry; no artwork planes spanning holes or copying front markings onto an undocumented back.
- Compare every component against its siblings under the same fixed lighting and exposure; a successful hero material never approves the rest of an assembly. Check the exported model, not only the authoring scene. Preserve material differences through roughness, metalness and surface relief, with moving reflections rather than photographic highlights baked into new textures.

Repair or replace the deficient asset before polishing the larger experience. If the available tools cannot reach the required fidelity, say what failed and what additional asset or modeling work is needed. Do not substitute another photo-zoom animation or a crude procedural object and claim the quality target was met.

## Give the assembly a throughline

For a “how it’s made” experience, read `docs/assembly-stories.md`. Establish the complete object first, then reveal a researched functional core and the capabilities each subsequent layer adds. Write connected inspection and seated captions. Preserve the individual lessons for parts with distinct roles. Add `kind: "milestone"` chapters only after their component lessons to explain assembled systems; reference the same physical IDs without reintroducing meshes. A movement, power unit or circuit-board milestone is additional teaching, not a replacement for its constituent parts. Use the reusable assembly-story helper to accumulate parts after their full turns, preserving true pairs and physical inventory. Finish with a whole object, then anatomy. Label an educational sequence honestly; do not present an inferred order as a verified factory process. Author `scene3d.assemblyStory` with the opening, ordered chapters, seating transitions and closing for any imported object. The generic GLB viewer and export/import paths support it directly. Read `story-review.json` before handoff: unapproved bundled component lessons must be split, with a later milestone for their relationship. Keep detailed anatomy independent of the chapter list. Other objects need their own researched narrative and clearance review, not a new viewer adapter.

## Author and export

Keep source provenance and the component inventory beside the model. Use a self-contained GLB with separately addressable parts, embedded ordinary textures, and compatible geometry. From the skill folder, run `node scripts/inspect-model.mjs /absolute/path/model.glb` to inspect mesh names, hierarchy, and resource requirements. This is a structural inventory, not a visual quality verdict.

Author `spec.json` using `docs/3d-scenes.md` and `src/spec/schema.ts`. Map named nodes to researched components. Set appropriate separation axes, spacing, and per-part camera directions. The viewer normalizes the longest assembled dimension to seven units. Author offsets in those normalized units; do not assume source millimeters survive normalization.

Identify true pairs and repeated functional sets during research. Declare `scene3d.inspectionGroups` for matching halves or banks so they share one full turn, combined explanation and anatomy entry. Preserve every physical node and requirement. Do not infer pairing from names alone or merge components with different functions. Inspect both members together at narrow and wide sizes and through the full orbit; adjust separation and the first member's starting view when they obscure each other.

Keep the source GLB under `models/` beside the spec. From the repository:

```sh
npm run build
npm run atomic-explainer -- --from-spec /absolute/path/object/spec.json --out /absolute/path/object/site
```

This export path does not call an AI provider. An MCP-capable host can instead use the existing `atomic_explainer_build_site` tool with the spec and output paths after connecting the repository's MCP server. Availability of this skill does not mean that server is already connected.

For unattended generation with configured credentials:

```sh
npm run atomic-explainer -- /absolute/path/photo.jpg --3d --out /absolute/path/object/site
```

That route needs the credentials described in `.env.example`; it is an alternative to the host-agent route, not a prerequisite for all use.

## Review the experience and deliver

Inspect the continuous sequence in both scroll directions and at narrow and wide viewport sizes. Check assembled rotation, maximum separation, every component close-up, return transitions, anatomy, and reduced-motion behavior. Preserve spatial continuity; unexplained teleports and overlapping parts fail the review even if tests pass.

Give every component a complete inspection turn after its neighbors have cleared. Separate parts farther or move the camera to focus; do not fade, dissolve or hide story components. Restore each assembly orientation before returning it to its seat. After the final inspection, visibly reassemble the complete object and hold it before the anatomy section; reverse scrolling must retrace the same positions. The repository's reusable inspection helpers provide full turns with fixed framing; construction plans carry the corresponding visual-review requirements. These helpers do not supply missing geometry or prove reference fidelity.

Deliver the local explainer opened in the user's browser (`--preview`), the reusable spec, source/attribution notes, the fidelity sheet, and a concise account of validation and unresolved quality issues. Distinguish live generation from fixture tests. Leave publication or repository pushes within the user's authorized scope. Never equate successful API responses, mesh counts, or green tests with photorealistic quality.

## Apply the quality gates

Use `docs/evaluations.md`, `src/evals/rubric.ts`, and the review schema for each new object. Record exact spec/model hashes, every component’s front/oblique/reverse/exported evidence, material uncertainty, missing geometry, and learning questions. Keep research-only fixtures distinct from paid generation trials. Run structural and browser checks, then judge the actual renders against inspected references. Do not promote a self-review to independent validation or equate test success with photorealism. A learner study is separate from checking that captions exist.

Start API-assisted research with `--plan` (or MCP `planOnly: true`) when geometry sourcing has not been decided. The upload studio is a plan handoff, not an unattended component builder.

# Reconstruction cases and reusable rules

This is a growing record of failures discovered while building Explode. Apply the rules to any object; do not copy the Murph's geometry, materials or dimensions into unrelated products. The Murph is an authored test case, not proof of automatic reconstruction for arbitrary uploads.

| Case / symptom | General rule | Check before delivery |
| --- | --- | --- |
| A dial retains dark silhouettes after its hands lift away. | Reconstruct the underlying surface independently. Remove neighboring objects, their shadows and their reflections from component textures. A single photo cannot establish an occluded surface. | Compare assembled and separated views; cite the evidence or label the completion as inferred. |
| Glass becomes opaque, looks like a flat disc, or floats above its seat. | Model the actual profile, thickness and interfaces. Transmission stays a material property throughout the story. Reflections reveal glass without replacing transparency. | Inspect front, grazing and reverse angles, both assembled and isolated, with geometry behind the glass. Unknown composition remains unknown. |
| A rear window receives visibly poorer treatment than the front glass. | Apply the same optical pipeline and inspection conditions to every transmitting part, based on its material rather than a front-glass name. Give all optical solids modeled edges. Similar treatment does not imply identical curvature or composition. | Compare related glass under the same backdrop, reflection rig and exposure; record legitimate differences and unverified optical assumptions. |
| Focus uses cloudy fades or parts disappear. | Focus through physical separation and camera movement. Do not change component opacity or visibility for story emphasis. | Scrub forward and backward; all story components persist and return to their seats. |
| A part rotates through neighboring parts, or the camera jumps on entering its chapter. | Clear its swept volume before turning, maintain framing, restore orientation before reseating, and interpolate transitions continuously. | Inspect intermediate poses and the complete turn, including reverse scrolling and narrow screens. |
| Lettering floats across openings or appears on an unobserved reverse. | Bind artwork to actual supporting surfaces. Cutouts need real walls; reverse faces need their own evidence or a labeled approximation. | Look through each opening at several angles and inspect both sides. |
| Silver-colored metal is labeled stainless steel or nickel without evidence. | Separate substrate, plating/coating and observed finish. A case specification does not establish an internal component's alloy. A material variable name is not evidence. | Record verified claims and citations separately from visual observations and unknowns. Never infer composition from color alone. |
| A rotor looks uniformly grey while reference photos show brushing. | Match grain direction, physical scale, roughness and relief. Adjacent regions may have different finishes even within one component. Use common scene lighting, not painted highlights or a private light rig for a deficient part. | Compare front and oblique views during a full turn under fixed lighting. Check whether details survive at normal viewing size as well as macro scale. |
| A finish looks right in the authoring viewer but disappears after export. | Use supported material channels and embed required textures. Authoring-only bump effects are not a portable deliverable. | Reopen the exported GLB, inspect normal/roughness maps and render representative parts under the same rig. |
| A generated shell cannot reveal the mechanism. | Choose geometry sources per component: licensed assets, CAD/modeling, or generation. Research must drive component construction; captions cannot repair an unrelated shell. | Verify independent parts, hidden surfaces, interfaces and the causal explanation. Mark approximations and stop claiming exact fidelity where evidence ends. |

## Evidence record for each new case

Record the object and exact variant; reference URLs and which views were actually inspected; observed symptom; verified material/geometry claims; visual observations; unresolved details; chosen correction; comparison views; export result; and remaining limitations. Include a transferable rule here when the case exposes a new failure mode. Keep object-specific measurements and claims in its `understanding` dossier.

Each construction plan contains `requiredMaterialReview` with one **pending** entry for every researched component, its target behavior, references, uncertainties and required views. A generated plan is not a completed review. Record absent/deferred parts explicitly, too. A hero component passing review cannot approve its neighbors or the assembly. The Murph's current review is in [its component record](research/murph-material-review.md).

## Murph rotor: material / finish case

- **Verified boundary:** Hamilton specifies a stainless-steel case and H-10 movement, but the inspected product specification does not identify the rotor substrate or plating. [Hamilton specification](https://www.hamiltonwatch.com/en-us/h70605731-khaki-field-murph-auto.html).
- **Observed:** the exact-model rear photographs show straight brushing across the rotor plate, a contrasting radial finish on the peripheral band, and recessed lettering. These are appearance observations, not chemical identification. [Fratello rear photograph](https://www.fratellowatches.com/wp-content/uploads/2019/06/Hamilton-Khaki-Field-Murph.003.jpg), [SJX first-hand macros](https://watchesbysjx.com/2020/02/hamilton-khaki-field-murph.html).
- **Correction:** independent linear/radial finish maps, shallow engraving, and exportable normal/roughness channels. All use the scene's existing lighting. Remove the discrete rim strips that read as dotted geometry.
- **Still unresolved:** exact alloy and plating, measured surface roughness, underside finish, precise mass distribution and manufacturing sequence. Procedural grain is an appearance reconstruction, not measured surface data; the unphotographed reverse is approximate.
- **Validation (study v16):** inspected live and exported front, oblique and reverse renders under the same rig. All three rotor finish materials retain normal, roughness and anisotropy maps after GLB readback. Eighty sampled component views pass framing/clearance checks. These checks establish portability and presentation, not exact manufacturing fidelity.

The research prompt and construction plan carry review requirements from `src/pipeline/quality.ts`. These are agent review obligations, not claims that an automated visual checker has proven fidelity. Geometry and runtime tests supplement actual reference comparisons.

## Evaluation findings that apply to every object

- A sophisticated authored example does not establish upload-pipeline quality. Label the production mode and test a held-out object separately.
- Geometry coverage comes from actual renderable scene nodes, not the proposed spec mappings. Named empty groups are missing geometry.
- Component approval requires reverse and exported views. Front-facing luminous inlays need physically supported backs; do not assume that a visible front is a complete solid.
- Research-only plans and plausible citations cannot earn model-fidelity scores. Source support, exact variant and inspected-image status need explicit review.
- Reduced motion must preserve access to the parts. Provide direct selection and a text explanation independent of model loading.
- Bind evaluations to the actual spec, model and experience revision. Preserve known failures; no average may hide a missing part or an inaccessible mode.
- Questions need distinct beginner, causal and evidence-critical levels; learner comprehension remains unmeasured until tested with learners.

See [the evaluation method and current failures](evaluations.md). The Murph and phone are benchmark cases, not universal material or geometry templates.

- Pausing motion must stop settled redraws, not merely freeze time while exhausting the GPU. Detect software graphics and reduce raster/postprocessing cost consistently across materials; preserve the same geometry, evidence and physical separation. Test the software path separately from normal hardware rendering.

## Case: research fixture mistaken for an available preview

**Observed failure:** an iPhone research-only benchmark was described alongside a rendered watch; the user reasonably expected a phone preview. A JSON component inventory does not establish that geometry exists.

**General rule:** distinguish research-only, authored assembly, generated exterior and reviewed reconstruction at the point of entry. Link to actual previews from the studio. A preview that builds successfully must retain its fidelity limitations on screen. The phone prototype now exercises the common recipe → GLB → viewer path, while the original research-only fixture stays intact as a negative evaluation case.

## Case: new objects inherit another object's export and framing assumptions

**Observed failures:** whole-template copying bundled unrelated example folders; a tall phone overlapped its title in the generic viewer.

**General rule:** export shared viewer assets plus the selected object's referenced assets. Use model bounds and reserved text space, rather than assuming watch proportions. Test another aspect ratio, all-sided part inspection, portrait screens, and the exported artifact. The assembly tests exercise genuine openings, separate glass/display behavior, component provenance and GLB round-tripping; they do not award visual fidelity scores.

## Case: a research plan has no executable handoff

**Observed failure:** photo upload ended at a plan, with no way to bring an agent's constructed parts back into the studio.

**General rule:** provide a reversible, provider-independent construction/import stage. Agent-authored dimensioned recipes now compile to separate geometry and can be imported as a project without keys. Reject missing inventory, unknown references and unresolved deferred parts. Keep every material/fidelity review pending until compared to actual evidence. Record which steps were authored manually so this cannot masquerade as an unattended photo-to-model benchmark.

## Existing assets, false listings and primitive fallbacks

The iPhone trial exposed a process failure: a researched description and a renderable primitive assembly were presented as if they demonstrated reconstruction. Keep dimensional recipes as engineering fixtures unless their rendered fidelity is actually adequate. Source or generate detailed component assets before featuring an example.

An asset search must inspect actual geometry. One downloadable Sketchfab iPhone listing had eight vertices/four faces and advertised a separately sold model. Apple's AR asset had detailed surfaces but also two display instances, opaque node names and no verified internal assembly. Record these separate questions: exact variant, visible shape, internal coverage, actual file integrity, material conversion and redistribution rights. A strong answer to one does not imply the others pass. See [the source audit](research/iphone-source-audit.md).

Research must reach the provider. The Tripo image routes receive image references; they do not accept a research paragraph. Use inspected multi-view component references or the documented text-to-model route. Preserve the actual sent payload and reference hashes to expose mismatches between the intended brief and the purchased generation.


## An inspectable source model is not an explainer

Failure: replacing a poor reconstruction with a detailed static source inspector removed the actual explosion experience. A tour must demonstrate real relative part movement through its public scroll/button controls, full component turns and reverse-scroll reassembly. Compare pairwise part positions so camera movement alone cannot pass. Keep the inspector as a separate intermediate tool.

Source AR geometry may include nonphysical occluders and omit reverse faces. Inspect isolated surfaces before grouping; require complete mesh coverage, documented helper exclusions and no mapped/omitted conflicts. Never copy front artwork onto an unknown back or silently invent electronics. Explicit neutral backs are illustrative, not evidence of successful reconstruction. Apply these rules to every product, including glass and camera surfaces.


## Scope collapse after a successful source import

Failure: the source exterior spec listed only its available surfaces, and validation checked that shortened list. A detailed shell therefore appeared to complete the request while the battery, board and chips vanished from the work queue.

Fix: establish a separate functional requirements inventory from research, preserve it across asset swaps, and compare it against exported geometry plus research/story mappings. Planning saves this inventory; batch asset execution retains missing and failed tasks; exporting an incomplete assembly displays an incomplete notice. The agent continues modeling and fitting within the already-authorized request. A proof sequence and an asset inspector are intermediate checkpoints, not reasons to ask the user whether they still want the internals. Token geometry cannot earn a fidelity pass merely by satisfying coverage.

## A tour has to return the parts to a whole

The iPhone ended at an exploded overview even though the anatomy headline referred to the complete object. Reserve an explicit final reassembly and settled hold in the shared timeline. Test actual final geometry and reverse traversal, not only a closing caption. Every component still gets its full inspection orbit before the return begins.

## Engine variants, materials and dense assemblies

The Porsche trial selects a 1965 901/01; the official catalogue also contains 912 four-cylinder parts and later injection variants. Record diagram scope and do not mix them. Restored photographs establish visible form, not original alloy or factory coating. Separate combustion intake airflow from cooling airflow in the learning narrative. Distinguish engine-mounted lubrication from the external vehicle oil reservoir. An engine model's casting contours and timing details can remain approximate even with all required groups present.

Fine surface bump is sensitive to model normalization: an unscaled bump strength made cast alloy look like pebbled stone. Review the exported model in the actual viewer, not only the author's scene. Dense overviews also need fewer labels; component names remain available in navigation and close-ups. Repeated chain links and fins should share material batches and indexed vertices so mechanical detail does not require a hundred-megabyte download.

## Geometry must support the mechanism being taught

The engine review found head fins surrounding a through-hole instead of a closed combustion chamber, case walls rotated across their intended axis, and two cylinder openings touching the casting perimeter and failing triangulation. A component ID and a nonempty mesh do not catch these failures. Add functional geometry checks where possible: open flow paths, closed pressure boundaries, aligned supports, clear bearing seats and valid cutout margins. The engine tests now probe the cylinder bores and all six case apertures, verify chamber material exists between valve openings, and check case orientation. Its oil pump uses an explicitly documented permanent inspection cutaway, framed from above; this must not be mistaken for a manufactured opening or achieved by opacity animation.

## Cast engine parts and phone internals share the wrong surface response

The engine export had no core normal/roughness maps: its casting bump used an extension and its remaining finishes were mostly scalar settings. Imported phone surfaces had texture maps, while the added internals used a different, uncalibrated grain scale. Extrusion facets also read as changes in material. A preset's presence in source code did not establish its appearance in the exported viewer.

Reusable fixes and checks:

- Use explicit, reference-adjusted surface families. Cast surfaces, machined faces, coated housings, rubber, board resin, chip encapsulation, flex insulation and metallic foil have different responses. A conductive substrate does not make its opaque coating metallic. Record observed finish separately from unverified alloy/plating.
- Author core tangent-space normal and packed roughness/metalness textures. Use linear data for these maps and sRGB for color artwork. The [glTF material specification](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#materials) defines the channels. Reopen the GLB; do not infer export success from an authoring render.
- `src/authoring/finishes.ts` provides browser-exportable starting points, with relief and tiling in millimetres. These are approximations, not scanned material libraries or automatic material identification. `prepareFinishUVs` is opt-in for original geometry authored in mm. Never apply it to source artwork, logos, or imported PBR texture coordinates. Complex curved/directional finishes need a purpose-authored unwrap; box charts can seam.
- Smooth shared curved-face normals while preserving sharp edges. Inspect silhouettes separately: grain cannot repair a simplified casting, missing seam, rounded edge or cavity.
- Compare related parts under the same neutral illumination and exposure, then check the actual presentation lighting. Do not compensate for a colored light by tinting every part. Keep surface properties constant during isolation, turns and reassembly.
- `renderSite` writes `material-review.json` for **every local GLB**, whether or not an assembly manifest exists. It inventories each component's materials, flags dropped declared maps, missing images/UV channels and bump-extension dependencies, and leaves visual judgments pending. A smooth untextured surface can be intentional; an automated map count is not a fidelity score.

Current evidence boundary: both studies now use these shared finishes for their original authored geometry. Manufacturer iPhone maps are preserved. Exact wear, plating and many casting contours remain unresolved. The dimensional Node-only recipe exporter remains a texture-free schematic path; textured authoring uses the browser GLTF exporter. The arbitrary-upload pipeline still requires evidence-guided material selection and review; this fix does not make a photo determine hidden materials automatically.

The new audit also found two iPhone source AO bindings pointing at an absent UV channel (enclosure and right controls). `removeUnmappedOcclusion` omits only an invalid AO binding, clones shared materials before changing them, and records the repair in the exported metadata/report. It does not fabricate an unwrap or alter valid source color/normal/roughness maps. Source assets need export checks too. Flat cap normals must remain flat when smoothing adjacent bevels, otherwise long cap triangles develop false star-shaped shading.

A grouped component can also pass framing while its individual fittings are too small to judge. The phone's distributed microphones/fasteners demonstrate this: require individual fitting closeups before approving their finish. A readable whole-group thumbnail does not establish microtexture or engraving quality. The latest surface-review records leave these and source-specific grain/coating mismatches unresolved.

## White plastic despite metallic settings; duplicated pair stories

The engine's timing covers still looked like flat white plastic after the material-map audit passed. Uniform environment reflections washed out their finish, and featureless plate geometry omitted recognizable casting detail. A darker first attempt and exaggerated coarse texture instead looked like stone. Neither a metallic flag nor more grain establishes aluminum.

Use balanced reflection fields, restrained physical-scale grain, and independently modeled cast edges, ribs and fastener bosses. The engine's cover detail follows inspected Porsche catalogue illustration 103-10 (PDF page 69). An original-parts supplier identifies early covers as aluminum; alloy grade, original treatment and exact dimensions remain unverified. Do not borrow a modern billet replacement's alloy designation for the original casting. Review the exported result at assembly and isolated scales before accepting the settings.

Left/right crankcase halves, cylinder banks and heads were also repetitive separate chapters. `inspectionGroups` now gives genuine pairs a shared orbit, caption, navigation choice and anatomy card, while retaining all physical nodes and completeness requirements. Matching names alone are insufficient: differently functioning controls or dissimilar front/back components may need separate stories. Pair framing must include both members and their relationship, and reverse scrolling must return each to its own seat. These obligations are included in the shared construction requirements and agent skill.


## A component tour without a story throughline

Repeated isolated inspections returned to the same exploded object and did not explain why the layers belong together. The how-it’s-made mode introduces a functional core, then adds each inspected layer to a persistent assembly. Chapters describe what each addition makes possible and lead into the next. The Hamilton starts with its movement and finishes with the wearable watch. The movement’s internal groups remain separately explained in the anatomy even though they share the opening chapter.

Keep the narrative script separate from the motion engine and physical inventory. Research the object-specific order; do not universally reverse an explosion or claim that an educational sequence is a factory process. Full turns must finish before parts seat, material properties must remain constant, and reverse scrolling must recover the same intermediate assembly. The reusable helper enforces coverage and deterministic poses; visual inspection still needs to judge paths, occlusion and explanatory value.

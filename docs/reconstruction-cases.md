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

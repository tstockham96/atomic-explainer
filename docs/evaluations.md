# Evaluate the explanation, not just the renderer

**Current verdict: authored prototype, not ready for reliable arbitrary-photo reconstruction.** The new upload studio creates an evidence-backed component plan. It does not claim to generate researched internals automatically. The Murph is a separate authored example. The original iPhone case below is research only. A separate, explicitly schematic phone assembly now exercises construction and import; it does not inherit a visual-quality pass.

## What we measure

| Evaluation | What a good result requires | How it is checked |
| --- | --- | --- |
| Design and feel | Object-first composition, readable type, continuous travel, purposeful pacing, discoverable controls | Twelve anchored design/model criteria include six design judgments; saved desktop and mobile views supplement browser layout tests |
| Object identity | Exact product/variant proportions and distinguishing details | Human comparison against multiple actually inspected references; no recognition score inferred from a filename |
| Anatomy and surfaces | Every researched part exists independently; reverse faces, openings, thickness and interfaces make sense | Actual GLB hierarchy/geometry inventory, component-level views and manual comparison |
| Materials and optics | Evidence distinguishes composition from observed finish; coherent light response, transparent glass | Material review for every component, exported-asset views, transmission chart checks |
| Learning depth | Beginner function, intermediate cause/effect, advanced evidence and uncertainty | Questions and expected answers linked to goals, components and sources; actual learner results recorded separately |
| Motion and spatial clarity | Parts clear one another, remain present, and reseat coherently | 1,001 sampled poses, 80 isolated views, three browser sizes, both scroll directions; visual review still required |
| Accessibility and recovery | Keyboard selection, reduced-motion access, readable text without the model, usable controls | Browser tests at 1440×900, 390×844 and 360×640, reduced-motion, missing-model and keyboard cases |
| Generalization and honesty | New object plans do not inherit watch assumptions; missing geometry stays missing | Eleven-component phone benchmark, negative evaluator fixtures, plan-only pipeline and studio tests |
| Freshness and reproducibility | Evidence describes this spec, this asset and this viewer | SHA-256 bindings, file existence, committed portable model, clean install/build path |
| Performance | Reasonable payload and responsiveness on real devices | Current 25 MiB uncompressed model budget; local resource timings recorded separately. Mobile GPU, memory and field timings remain unmeasured |
| Failure and cost behavior | No silent purchases, duplicate jobs, invented success or leaked credentials | Provider/job contracts, planning without geometry calls, local server security and resume tests |
| Provenance | Assets and evidence have traceable sources and redistribution notices | Asset attribution and reference registers; not an automated legal judgment |

## Score anchors and release gates

Scores are reviewer judgments on a 0–4 scale: **0** absent/misleading, **1** major failures, **2** understandable prototype with obvious gaps, **3** convincing with minor gaps, **4** excellent and independently reviewed. Self-review cannot assign 4. Read the individual reasons in `evals/reviews/`; averages must not conceal a failed dimension.

The evaluator has 18 gates. Every design/model criterion must reach 3; components need assembled/front/oblique/reverse/exported evidence and reference-matched geometry/materials. Missing parts, invented references, duplicate reviews, old asset hashes, absent evidence and untested learner outcomes cannot become passes. Citation-link validation does **not** prove that a source supports a claim. Level labels likewise do not prove question quality.

`not-ready` means at least one gate failed. `review-required` means no failures but something is unmeasured. `meets-reviewed-bar` means the supplied scoped checks passed; it is not a certification of manufacturing accuracy. No live example currently meets that bar.

## Findings from this audit

| Specimen | Design | Model | Verdict |
| --- | --- | --- | --- |
| Saved Murph v17 baseline | 1.33/4 | 1.67/4 | Not ready; weak navigation/accessibility, approximate geometry |
| Current packaged Murph | 2.67/4 | 1.67/4 | Better experience; fidelity still falls short |
| iPhone 18 Pro research case | Not scored | Not scored | No generated model; cannot claim visual quality |
| iPhone authored assembly prototype | Not scored | Not scored | Real 12-part GLB; schematic internal geometry, reference fidelity fails |

These are Codex self-reviews, not user-study scores. The model score deliberately does not rise simply because the page looks better or code tests pass.

Changes driven by findings:

- Stronger typography, quieter header, warmer backdrop, less crowded mobile composition and shorter scroll length.
- Direct component selection, next-component and pause controls, keyboard skip link, complete text explanations even after model-load failure.
- Reduced-motion users can reach every modeled component rather than losing the tour.
- Solid metal backs behind the hands’ luminous cells; reverse appearance still marked inferred.
- Packaged GLB reopened and inspected across all 16 groups. One researched component, the buckle, is still missing.
- Honest plan-only upload flow: research first, then agent construction and explicit review. No purchased mesh or model-ready claim from that button.

The current run measures 1,001 poses with unchanged visibility/material state and 80 isolated inspection views with no surrounding assembly in the camera frustum. This does not prove collision-free swept geometry at every instant. Eight **generic optical-profile** chart renders retain at least 92.6% contrast; they validate the shared material/profile behavior, not exact sapphire chemistry or every pixel of the watch. Browser tests check 144 component/angle/viewport combinations using the exported GLB.

Remaining priorities: replace generated exterior shading, correct dial printing and hand profiles, acquire stronger movement/underside references, model missing fittings, improve causal mechanical demonstrations, reduce the 38 MB model payload without losing detail, and test with real learners and mobile devices. The presentation still needs stronger pacing; sixteen similar inspection turns are not automatically sixteen good lessons.

[Current desktop](../evals/reports/current/desktop.png) · [Mobile](../evals/reports/current/mobile.png) · [Front](../evals/reports/current/component-review-20.png) · [Oblique](../evals/reports/current/component-review-37.png) · [Reverse](../evals/reports/current/component-review-50.png) · [Machine-readable report](../evals/reports/murph-current.json).

## The second-object test

The phone fixture uses [Apple’s iPhone 18 Pro specifications](https://www.apple.com/iphone-18-pro/specs/) and [Apple’s repair-manual table of contents](https://support.apple.com/en-mide/127388). It separates eleven assemblies and records regional variant uncertainty. The linked internal/exploded and individual repair pages returned HTTP 429 during this research; their photographs were **not inspected**. Internal geometry is therefore deferred.

The test establishes that the schema, construction planning, material obligations and learning checks work outside watches. It does **not** establish photo identification, generated geometry, phone likeness or end-to-end quality. No new paid generation call was made for this benchmark. Next, use a licensed multi-view reference set plus a real submitted photo, preserve provider artifacts/costs, and score the actual output without manually replacing failed geometry under the label “automatic.”

Validation for this revision: **102 unit/contract tests and 8 browser tests pass locally**, along with type checking and a clean-output production build. The first Linux run exposed excessive software-rendering cost and redraws while paused; the follow-up reduces raster work on software devices and stops drawing settled paused/reduced-motion scenes. All eight browser checks also pass with software graphics forced locally. The strict release gate exits nonzero as intended. Build output still warns about a large Three.js chunk; payload and field-performance work remain open.

## Run and extend

```sh
npm ci
npm run typecheck
npm test
npm run eval
npx playwright install chromium
npm run eval:browser
npm run eval:release
```

`eval` writes reports and exits successfully even for known failing specimens. `eval:release` explicitly targets `murph-current` and exits nonzero until all gates pass. CI validates evaluator logic, builds the portable study and runs browser regressions; a green CI run does not turn a failing quality report green. The synthetic positive control tests evaluator logic only.

On a Mac with Chrome installed, `PLAYWRIGHT_CHANNEL=chrome npm run eval:browser` avoids a browser download. For new visual evidence, start `npm run studio`, then run `PLAYWRIGHT_CHANNEL=chrome node tools/evals/record.mjs`. This records the actual packaged asset, source hashes and scoped measurements. Re-review after changes; fingerprints include imported source and locked dependencies, not just the page. Do not simply update hashes to preserve an old approval.

For another object, add a researched spec in `evals/cases/`, a review following `src/evals/evaluate.ts` in `evals/reviews/`, and register it in `tools/evals/run.ts`. Record how it was produced (`authored`, `live-generation`, `fixture`, or `research-only`). Use actual geometry inventory and review every component. Preserve failing cases as regression fixtures.

The most useful next independent eval is a short learner session: ask someone unfamiliar with the object to predict how energy or information travels through it before and after exploration, explain what happens if one component is removed, and distinguish observed facts from reconstruction assumptions. Correct labels alone do not demonstrate understanding.


## What the 2.67 and 1.67 scores mean

These are the last reviewed Murph scores out of four, not probabilities or an automatic-upload success rate.

| Area | Criterion scores | Gap to close |
| --- | --- | --- |
| Experience: 2.67 | Composition 3, typography 3, continuity 2, pacing 2, controls 3, accessibility 3 | Reduce repetitive stops; make transitions teach a relationship; test camera travel across different object proportions |
| Model: 1.67 | Identity 2, anatomy 1, materials 2, optics 2, detail 2, mechanism 1 | Reference-match shapes and reverse surfaces, include missing parts, remove baked lighting, and demonstrate causal operation rather than separation alone |

The second-object work closes an infrastructure gap: an agent can now build a reviewed-inventory recipe, export actual multipart geometry and return the project to the studio without provider calls. It also fixes generic hero/title overlap and adds direct component selection and relationship captions. It does **not** justify raising either Murph score. The packaged Murph was recaptured and visually rechecked after these changes; its score remains unchanged. Historical baseline evidence is retained.

The phone is an authored assembly prototype with 12 groups, including separate front cover and display. Its recipes and limitations live under `examples/iphone-18-pro/`. Structural tests validate openings, optics preservation, inventory/provenance, a real exported GLB and credential-free import. Browser tests examine actual framing and project import. Internal shapes, finishes, placement and small interfaces still fail a reference-fidelity bar; it is not a new photorealism benchmark.

Next quality work, in priority order:

1. Collect and inspect exact-model front, rear, side and teardown references; separate observed shape from inferred geometry.
2. Replace schematic/approximate parts with evidence-matched meshes, including hidden faces, mountings and finishes. Keep the same component IDs and story, so improved assets drop into the common viewer.
3. Add causal demonstrations and learner tasks: predict which output fails when a specific connection is interrupted, then explain why. Do not equate a relationship caption with a working mechanism simulation.
4. Run a held-out real-photo task, recording agent edits, missing references, provider costs and failures. Score the raw generated result separately from the manually corrected result.
5. Independently review rendered comparisons and learner results before claiming a reliable arbitrary-product workflow.

Validation for the assembly/import follow-up: 107 unit/contract tests and 11 browser tests pass on local Chrome. The phone geometry is about 1.5 MB. The phone evaluation remains `not-ready`; model presence and portable export are not visual-quality passes.
Software-graphics checks also pass after correcting a test that compared reverse scrolling against an unsettled forward render. Ten checks passed in the full software run; the corrected scroll check passed in its focused rerun. This synchronization fix does not change the renderer or its quality ratings.

### Portable surface finishes

Every local GLB preview includes `material-review.json` with its model hash, material inventory and per-component pending visual reviews. `src/evals/materials.ts` checks image/UV references and preservation of declared normal/roughness maps; `test/finishes.test.ts` additionally checks physical texture scale, reverse/edge UVs, source-material preservation, and the actual engine export. Deliberately dropping a normal map must fail the audit. A structural pass leaves `ready: false`.

Visually compare casting, machining, coatings, rubber, PCB/package, foil and optics at assembled scale and inspection scale. Include front, grazing and reverse angles under neutral daylight and the presentation's alternate lighting. Check sparkle, stretched/repeating grain, reflection continuity, lost lettering, and false metal on polymer/coating surfaces. Record actual evidence and unresolved differences; don't turn a missing visual review into a passed numerical score. Geometry and surface normals must be judged separately from textures.

Reproduce the multi-angle material captures for any running exported study:

```sh
PLAYWRIGHT_CHANNEL=chrome node tools/evals/capture-materials.mjs \
  http://127.0.0.1:4319/porsche-study/index.html \
  dist-site/porsche-study /tmp/engine-material-review
```

This checks the report's model hash, captures front/reverse/oblique views of every component, creates labeled contact sheets, and records browser errors. It samples alternate lighting on one component, explicitly recorded separately. Inspect the sheets against references; capture completion leaves visual verdicts pending.


### Paired inspections and cast-cover follow-up

The engine retains 29 physical assemblies and now presents 26 inspection stories. Tests check both members of each declared pair, union framing through five orbit positions at two screen ratios, single navigation/anatomy entries, combined research/uncertainty and restoration of all physical transforms. The original requirements inventory is unchanged. Name similarity alone never triggers grouping.

The material follow-up adds contrasting neutral reflections and restrained multiscale casting relief. The timing covers now include diagram-supported perimeter lips, ribs and bosses. Inspect them at assembly scale and across a full turn: white-plastic and over-grained stone appearances both fail regardless of material-map completeness. All 26 stops are recaptured at three angles in the latest engine surface-review record. Paired views must retain both members; edge-on occlusion during an orbit is distinct from removing a member. These are self-reviewed improvements, not an independent fidelity pass.


### Cumulative how-it’s-made story

The Hamilton defaults to a new movement-first assembly story, with eleven chapters covering sixteen physical groups. Historical outside-in benchmark captures explicitly use `?story=explode`; their scores have not been raised. The new [story review](research/reviews/murph-assembly-story/review.json) binds its script, choreography, viewer and model hashes to desktop/mobile evidence. It records 99 inspection-framing checks, cumulative seating, exact final transforms, reverse traversal, public controls and reduced-motion behavior. A full 19-test browser run and the five final story checks passed, alongside 143 unit/integration tests. Narrative coherence was self-reviewed, not measured with learners. Educational sequence and factory process remain distinct.

## Whole-object opening and movement surface regression

`docs/research/reviews/whole-core-materials/review.json` records the completed-object opening, reversible inward reveal, cumulative build, and final seating. The shared story is available to any mapped GLB through `scene3d.assemblyStory`; a second-object construction fixture exercises that integration on desktop and phone. This is a behavior test, not approval of that fixture's appearance.

The watch's exported material audit now runs during packaged study builds. A regression checks portable normal/roughness finishes across all seven mechanism groups, rather than accepting the rotor as representative. New screenshots compare the movement and rotor under the same rig, including an edge and reverse view. All 16 groups pass export/UV integrity checks. Remaining reverse geometry, artwork, substrate identification and visual fidelity gaps are explicitly retained in the report; no score increase or photorealism release is claimed.

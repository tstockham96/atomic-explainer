# Evaluate the explanation, not just the renderer

**Current verdict: authored prototype, not ready for reliable arbitrary-photo reconstruction.** The new upload studio creates an evidence-backed component plan. It does not claim to generate researched internals automatically. The Murph is a separate authored example. The iPhone case below is research only.

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

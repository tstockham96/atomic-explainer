# Workshop asset and surface review

2026-11-02. Review of the shared workspace, including the calibrated Murph study and normalized Porsche engine. Desktop captures use Chrome hardware WebGL; the main watch images use a 1440 × 900 viewport at 2× pixel density. `compact-complete.png` uses 360 × 640 at 1×.

## Changes checked visually

- The low horizontal bar and short support posts are gone. The suspended key fixture is 330 stage units above the worktop, outside the normal inspection view. An imported articulated side lamp fits within the desktop opening composition.
- A sourced wooden bench, detailed lamp, vise and caliper replace the respective placeholder geometry. Their CC0 licenses, author/source records, origin disclosures and hashes are packaged alongside them. Other room props retain the project's stylized design.
- The mat is a single solid surface with a top-face grid. The former variance-shadow filter produced diagonal bands even after removing the overlapping plane; PCF depth shadows removed those bands in the reviewed views. The lighter minor grid remains readable at the seated angle.
- Reflection capture uses scale-aware clipping distances. Raising the light exposed a fixed 100-unit far-plane bug: the watch's millimeter environment clipped the light out of its reflections. The final movement capture shows the restored metallic highlights and finish detail.
- Glass has stronger narrow reflection strips against the brighter room while retaining opacity=1 and transmission=1. No part-fade behavior was introduced.

## Verification

- Typecheck passed.
- 14 targeted unit/integration checks passed, including portable export of scenery and license notices.
- All 6 hardware browser checks in `presentation.spec.ts` and `porsche.spec.ts` passed: desktop/phone, setting persistence, physical handoffs, front/rear glass, true pairs, second-object story and exact engine reassembly.
- The software-graphics 390px presentation test passed.
- `audit.json` records additional 390px and 360px checks, loaded scenery, parts in view and overflow/errors. These checks do not establish visual fidelity or performance on every device.

The scene remains an art-directed real-time approximation. Room reflections approximate bounced illumination rather than ray tracing. Furniture uses stylized proportions; the engine is a normalized tabletop study, not a claim of life-size presentation. Human acceptance of the aesthetic remains separate from functional test results.

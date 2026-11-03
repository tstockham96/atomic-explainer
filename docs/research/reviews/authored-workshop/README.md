# Authored workshop review — 2026-11-02

The previous room mixed separately positioned browser props, broad ambient fill and runtime shadows. This revision replaces that construction with a single Blender-authored workshop. Cabinet shelves meet their back and side supports; the lamp clamps at the rear of the bench; the hanging tools meet a wall rail. The old clock and pegboard were removed. The high key light stays above the seated view.

Static illumination, indirect bounce and contact shadows are baked in Cycles. The scene has warm overhead/task lighting, cooler window light, a cabinet accent and a neutral off-camera reflected source. The mat has its own atlas, avoiding the blurred grid seen when it shared the entire bench's UV budget. The subject uses live lighting and a reflection probe captured inside the same room.

The four embedded atlases and scene geometry occupy about 3.4 MB; the HDR probe adds about 1.1 MB. Original source assets remain in the authoring directory rather than being shipped as redundant runtime models. Attribution travels with exports. Editable packed Blender source and its build script are included.

## Visual review

Screenshots cover the whole watch, mainspring, movement milestone, front glass, rear glass and final assembly at 1440×900, 390×844 and 360×640. `engine.png` checks reuse with the Porsche. `audit.json` records the actual asset requests, visibility probes, glass properties and overflow checks for 18 watch views; no page/asset errors or horizontal overflow were observed.

Issues caught and corrected during review:

- Imported lamp rotation mode initially ignored the intended rotation, putting its shade through the wall. The importer now preserves world transforms, clears parents and explicitly selects Euler rotation.
- The mat was soft at close range. It now has a dedicated 2048px atlas.
- An off-camera reflection panel blocked the phone opening when the camera pulled back. Such panels remain in the authoring scene for baking/probe capture but are excluded from export.
- The lower room/window boundaries exposed background gaps. The scene now has closed lower walls and a sky plane extending beyond the window aperture.
- Baked materials must not receive a second whole-frame tone map and ambient occlusion pass. Workbench uses native antialiased direct rendering; Original retains its previous post-processing.
- A geometry-frustum test passed the blocked phone view. New ray probes identify the anatomy actually hit before scenery. They report the outer component when it conceals an inner component, rather than incorrectly declaring both invisible.

## Limits

This is a stylized educational workspace, not a reproduction of Bruno Simon's scene. Static lighting is baked; moving-object shadows approximate an area light with a filtered spotlight. Room pixels do not dynamically relight as the subject moves. The center-ray test is an occlusion regression check, not a replacement for rendered review or proof that every silhouette and label is readable. Product reconstruction fidelity and hidden anatomy uncertainty are unchanged by this room revision.

Validation: TypeScript check and 16 focused unit tests passed. Six hardware-browser tests passed (including watch settings/handoffs and Porsche paired internals/reassembly); the four watch tests were rerun after the final post-processing correction. The phone settings/glass test also passed under software graphics. Final screenshots were regenerated after that correction.

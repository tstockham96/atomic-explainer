# iPhone source audit · 2026-10-30

The earlier box-and-cylinder phone failed the user's quality bar and is retained only as a regression fixture. Its passing build, camera and import tests never established visual fidelity.

## Actual inspection

- [Apple product page](https://www.apple.com/iphone-18-pro/) exposes a manufacturer USDZ AR model. Downloaded the linked eSIM asset (8,802,910 bytes), flattened the USD payload using `usdcat`, extracted one device from its paired presentation arrangement, and rendered front/reverse views. The selected device has 94 mesh surfaces. These are obfuscated rendering surfaces, not 94 established functional components.
- [Apple dimensional drawings](https://developer.apple.com/accessories/dimensional-drawings/) were located as a potential dimensional reference. They were not used to fabricate internal dimensions in this pass.
- Visually inspected the full-layout photograph captioned “iPhone 18 Pro” in [iFixit's teardown](https://www.ifixit.com/News/119329/inside-the-tiny-unfixable-eye-iphone-18-pro-and-pro-max-teardown). Visible evidence includes the rounded housing, irregular board assemblies, camera openings/mounts, metallic battery enclosure and the reverse of the display. Those shapes differ substantially from the rejected primitive construction.
- [Sketchfab candidate](https://sketchfab.com/3d-models/apple-iphone-18-collection-v1-120c741535e54620ae9c2d90e6cb43ca): inspected public API metadata. Eight vertices/four faces and advertising copy for a separately sold model. Rejected; a permissive listing license does not make its contents useful product geometry.
- [ArtStation candidate](https://www.artstation.com/marketplace/p/vxvWV/apple-iphone-18-pro-black): commercial GLB listed, not purchased or file-inspected. Different selected finish; internal coverage unestablished. Not approved for reuse or redistribution.

## Result and limits

The local source-model preview uses the converted Apple geometry. Its silhouette, curved enclosure, lens layers, buttons and mapped finishes are substantially more detailed than the primitive fixture. The actual source import runs through the reusable asset-plan command, saves source/reference fingerprints and leaves review pending.

It is an **exterior reference study**, not the finished internal explainer. Small dark irregularities around a camera rim remain visible in the conversion. Shader equivalence, physical component grouping and internal geometry remain unresolved. The source and screenshots stay in ignored local research storage. No redistribution permission for Apple geometry has been established, so the MIT repository ships the inspector, source audit and acquisition plan, not that model.

To reproduce after obtaining permitted local research files, place the converted single-device GLB and inspected teardown screenshot at the paths in `examples/iphone-18-pro/asset-plan.json`, build the viewer, then run:

```sh
npm run explode -- --from-spec examples/iphone-18-pro/source-research.json --asset-plan examples/iphone-18-pro/asset-plan.json --component exterior --out ./iphone-review
```

This is an agent-assisted source-selection trial. It is not evidence that an arbitrary upload now produces accurate hidden components automatically.


## Scroll assembly follow-up

The local `/iphone-study/` route now uses the shared scroll viewer rather than the source inspector. The inspector remains at `/iphone-source-review/`. Inspected isolated front/reverse groups and mapped all 94 source meshes: 92 belong to seven exterior groups (display, enclosure, rear panel, rear optical surfaces, left/right controls and connector); two black occlusion proxies are explicitly omitted. These are explanatory groupings, not an established disassembly procedure.

Verified the real Explode button changes component-relative positions, native reverse scrolling restores the assembly, and inspection retains all component objects while moving context out of frame. Desktop and mobile captures were inspected. The source lacks many reverse faces; declared neutral, untextured reverse visualizations prevent those opaque surfaces vanishing during an orbit. These are **not verified internal finishes or construction**. Lens fronts retain their source optics; camera-rim artifacts persist.

This fixes the missing explosion. It does not close the internal reconstruction or visual-fidelity evaluation gaps, and does not establish arbitrary-upload reconstruction. Battery, logic board, thermal system and complete camera modules remain absent. The shared strict mapping, explicit omission validation and native-scroll regression now apply to any imported object. No Apple geometry is included in the repository.


## Internal reconstruction pass

The local primary preview now uses `internal-study.json` and an authored combined GLB. The exterior geometry is preserved; internal outlines and placement are fitted to the inspected eSIM locator in [Apple’s logic-board procedure](https://support.apple.com/en-us/127410), its removal view, and iFixit’s isolated battery, carrier, processor-side board and separated-board photographs. The Apple repair index establishes the additional functional assemblies. The Pro image on the left of paired Pro/Max photos was used; the right-hand Qualcomm-marked Pro Max board was not copied into the Pro.

The authored assembly has 28 explorable groups: the original seven exterior groups plus cell, carrier, upper/lower board, processor, memory, storage, radio packages, thermal assembly, camera housings, image sensors, front sensing, charging coil/alignment, haptics, acoustic assemblies, flex interconnects, microphones, antenna contacts, rear depth sensing, fasteners and display seal. Model code is in `tools/iphone-study/model.ts`; generic contour, annulus and repeated-detail helpers are in `src/authoring/reference-parts.ts`. Original photos remain local reference files and are not projected onto surfaces. Educational package markings are not claims about exact manufacturer printing.

Material families and observable outlines guide construction. Exact dimensions, hidden finishes, pinouts, fine passive placement, antenna conductors, microscopic chip architecture and internal stabilizers are not established. Some repeated microdetail and mounting features are illustrative. The assembly is not a repair sequence or a manufacturing model. Neither named components nor successful browser checks prove photorealistic fidelity. The sourced exterior and fitted internals do not currently have equal fidelity.

`requirements.json` preserves the researched functional scope independently from the exterior spec. The export checks actual GLB component ownership against that inventory. The previous exterior model correctly fails this check. The broader arbitrary-upload task still needs agent research, modeling, fitting and visual judgment; batch asset preparation alone does not supply those capabilities.

Reference assets: iFixit `iPhone-18-TD_78.jpg`, `iPhone-18-TD_73.jpg`, `Logic-board-left-SOC.jpg`, `Logic-board-right-storage.jpg`, `iPhone-18-TD_3-copy.jpg`, `iPhone-18-TD_1-2.jpg`; Apple `127410_MLB_eSIM_Locator.png` and `127410_MLB_eSIM_BG_Flex_Remove.png`. These were opened and inspected locally. The combined GLB includes Apple source geometry and stays ignored/local; repository code does not grant redistribution rights to that asset.

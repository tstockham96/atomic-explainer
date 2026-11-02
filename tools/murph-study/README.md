# Research-led Murph assembly study

An executable, locally reproducible component reconstruction using the Murph research dossier. This is an authored example, not an unattended arbitrary-object builder. It does not call a paid API at runtime.

The committed model can be used immediately: `npm run build:study`, then `npm run studio`. This copies the portable GLB and HDR from `public/models/murph/`; no original authoring inputs or credentials are required.

To rebuild geometry from your own source inputs:

```sh
node tools/murph-study/build.mjs clean-dial.png segmented.glb studio-small-09.hdr output-directory
```

Inputs:

- A clean dial texture generated from the front and macro references with **all hands, pinions, shadows, reflections and surrounding watch removed**. See `docs/research/murph-dial-prompt.md`.
- The earlier Tripo Murph segmentation. Only the external case shell and leather survive. The source case is fitted to the dial's best-fit plane, scaled to 42 mm, and hollowed before the independent internal assembly is fitted. Original dial, hands, opaque central case surfaces and crown are discarded.
- [Studio Small 09](https://polyhaven.com/a/studio_small_09), by Sergej Majboroda, CC0. This is a lighting asset, not watch geometry.

The builder also copies `docs/research/murph-study.json`. Construction rejects a missing/wrong dossier and attaches the component function, evidence references, uncertainty and geometry scope to the exported nodes.

`src/authoring/murph.ts` builds 16 named assembly groups. Separate child nodes preserve the hour, minute, seconds, rotor and balance pivots. The caseback ring and rear window are independent. A hybrid case retains the preferred generated exterior while removing its opaque center. Smooth cavity walls, optical solids, clean dial, hands and internal parts are authored separately. `src/authoring/h10.ts` follows the curved bridges, large balance setting, central rotor bearing, peripheral weight, kidney-shaped openings and inscriptions visible across the Hamilton, Fratello and SJX images. The bridge pack lifts as a separate subtree during the mechanism lesson; the assembled movement does not expose a generic row of gears.

The default page now provides an eleven-chapter “How it’s made” story: start with the complete movement, inspect each subsequent layer, seat it on the growing watch, and finish with the whole object before the making stories. The prior outside-in separation and inspection tour remains at `?story=explode`. See [assembly stories](../../docs/assembly-stories.md) for the reusable helper, authored script, evidence boundary and checks. It uses Three.js, OrbitControls, physical transmission, a CC0 HDR environment and GTAO contact shading. It fits camera bounds to the viewport. Reduced-motion users receive a stationary model with direct component selection, free inspection, all component explanations and the making stories.

## Inspect/export

With a local development capture receiver on port 4320, `?capture=1` posts actual WebGL renders, layout metadata and an assembled GLB to `/capture`. The receiver is a local QA utility, not a runtime service. Normal preview URLs never send those requests. The GLB includes an independent rotor animation and source/evidence metadata. The capture path reads it back through GLTFLoader and verifies all component/pivot nodes, both transmitting optical solids, the 16 evidence annotations and rotor animation before saving.

## Accuracy and remaining work

The clean dial has no baked hand silhouettes. Its generated printing is still an approximation, including a small imperfect tick near the 40-minute mark. External silhouette fidelity remains limited by the original mesh. Internal plate contours, concealed layout, fits, gear ratios and balance timing are educational approximations informed by H-10 family and general mechanism references. This is not manufacturer CAD or a functioning H-10 simulation. The buckle is not independently reconstructed. The rear window's composition is unverified. The library's unattended component-generation workflow remains separate work.

Reference photographs are local research inputs and are not distributed or relicensed here. The selected educational GLB and lighting asset are now included under `public/models/murph/`, with attribution. Original reference photographs and the source generation intermediates are not included. The authoring code and evidence register accompany the exported asset.

## Optical readability and motion

The sapphire uses a neutral transmitting finish on a closed, shallow domed solid. `src/authoring/crystal.ts` provides reusable profile geometry with curved upper/lower surfaces and a rounded edge. The Murph profile is inferred from Hamilton rolled/laid photographs, not a published manufacturing section. Its perimeter seats at the fitted bezel, a continuous case ledge supports the gasket, and the recessed hand/dial stack clears the underside. The optical solid remains independent when lifted. Both windows use the shared restrained glass environment; broad metal-lighting softboxes must not fill an optical surface with white glare. The background darkens gradually during separation and the hands close-up. Cathedral hands are authored in `src/authoring/hands.ts`: curved petal cells, a segmented spear-shaped minute hand, thin metal borders, separate hubs and a fine seconds needle. Lume occupies openings in the frames rather than a scaled duplicate of the whole hand. The rotor uses surface-bound engraving and satin relief with a bare reverse; its raised outer weight has independently lit radial grooves.

`src/authoring/studyMotion.ts` defines reversible, staged separation and seating. The layers stay open through inspection. Bridges lift axially before sliding, then return before outer layers reseat. Camera movement uses spherical interpolation and precomputed framing at story stops, avoiding a path through the object or distance jumps as context moves out of view. Strap halves move away from their respective lugs.

`test/study-motion.test.ts` checks camera clearance, axial layer order, and bridge sequencing over densely sampled progress. `?capture=1&motion=1&profile=1` additionally records actual browser camera travel, intermediate renders, and assembled side/front/oblique close-ups. Export validation checks both optical assemblies and verifies that every surface remains transmitting.

The crystal lifts another 35 mm clear of the other layers before its isolated 360-degree turn, then returns along the same path. Shared optics helpers are used by this study, the procedural watch and the generic imported-model viewer. `?capture=1&optics=1&motion=1` verifies rendered transmission and captures intermediate turn angles. The production viewer also gives transmitting components a full orbit based on their materials, independent of object or component names.

Focus is created entirely through camera movement and physical separation. No part is hidden or faded during the story, and material opacity/transparency remain constant. Incoming layers arrive before outgoing layers leave, avoiding empty transition frames. The shared generic viewer likewise moves context out of view and uses a plain backdrop. Motion capture asserts visibility and material invariants over 1,001 sampled scroll positions.

## Complete component inspections

The study inserts 16 reversible inspection intervals into its assembly choreography using the shared `createInspectionTour` helper. Each component arrives, turns fully around its geometric centre at fixed framing, and returns before assembly motion resumes. Existing material opacity and visibility are preserved. The tour includes the case, crown, seals, back, strap and each internal group; captions use the component dossier.

`?capture=1&turns=1&motion=1` records front, intermediate and reverse inspection views and framing checks. Unit tests exercise actual hand-to-crystal vertex clearance, surface artwork around holes, reverse-face material assignment, and generic all-component orbit framing. References guide the shapes; hand profiles, engraving typography and hidden H-10 details remain reconstructions rather than factory drawings.

Add `&materials=1` to capture front, oblique and reverse renders of the rotor reloaded from the exported GLB, under the original lighting. Export validation checks that its three observed finishes retain normal, roughness and anisotropy maps. `src/authoring/surface.ts` supplies portable linear/radial brushing with separate front, reverse and wall materials. These are photo-informed finishes; they do not establish substrate or plating. See [the reusable case record](../../docs/reconstruction-cases.md).

Material captures also include both exported glass solids. `turns=1` produces three labeled comparison sheets for all authored parts and a complete material-channel inventory. The front and rear use the same optical-solid builder and shared reflection rig; all transmitting parts get the same inspection backdrop based on their materials. Their photo-informed curved/flat profiles and documented/unknown composition boundaries remain distinct. [Component review and remaining gaps](../../docs/research/murph-material-review.md).

## Repeatable evaluation

Run `npm run eval:browser` to test the packaged GLB at three viewport sizes. With the studio running, run `PLAYWRIGHT_CHANNEL=chrome node tools/evals/record.mjs` to record front/oblique/reverse contact sheets and motion/optics measurements without a capture receiver. Omit the channel variable when using Playwright’s bundled Chromium. This creates evidence, not an automatic fidelity score. See `docs/evaluations.md`.

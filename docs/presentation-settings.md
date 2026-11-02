# Presentation settings

Workbench is the default in the Murph and shared GLB viewer. The Scene setting selector contains only Workbench and Original. `?setting=plain` explicitly selects Original and survives reload. Missing, obsolete or unknown settings use Workbench. Changing settings retains story progress and component-local poses.

The stylized workshop is one Blender-authored room: a timber bench, printed cutting mat, window, built-in cabinet and attached tools. The editable source and reproducible exporter live in `tools/workshop-scene/`. Its camera is centered at a seated eye line, about 10 degrees down, with no lateral story orbit. The camera dollies closer for small components; the original orbit transfers to the object so inspections retain their full turn. Smaller phones use less contextual pullback to keep the object readable.

The room's static lighting and contact shadows are baked in Blender Cycles into four texture atlases. A high warm overhead light, cool window bounce and small cabinet accent give the entire scene one lighting treatment. The browser uses unlit, untone-mapped scenery materials so it does not light baked shadows twice. Workbench renders directly with native MSAA: a whole-frame tone-mapping/ambient-occlusion pass would transform and shadow the baked room a second time. Original retains its post-processing. The moving object uses a live warm key at the authored fixture position, a cool window fill, 24% of its inherited fill, and an HDR reflection probe captured inside the authored room. Only the moving object's shadow is composited onto the mat. This hybrid approximates the baked area light; it is not real-time path tracing. Original restores the previous environment, light levels and shadow configuration.

`src/viewer/three/presentation.ts` and `workdesk.ts` derive the setting from object bounds. Props acquire no component IDs, and no material opacity or transmission changes for emphasis. Glass retains its restrained reflection rig, oriented to the seated view. Clear glass does not cast an opaque shadow. Original lighting is used for anatomy thumbnails, keeping props out of the educational images.

The reusable story stages the next component before the existing assembly leaves the frame. Camera framing expands to include that incoming inspection position, then moves into its close-up. This replaces the previous simultaneous departure/arrival that left an empty view. Each chapter retains its inspection turn, joined explanation and accumulated parts. Scroll distance is `(3 + chapters × 1.25)` viewport heights, about 30% shorter for the 18-chapter watch than the former schedule. The phone caption reserves its maximum required height so new text cannot abruptly change camera framing.

Scale must be established before a ruler can make a dimensional claim. The Murph uses millimeters and its mat has 10 mm major divisions. Arbitrary imported models are normalized and get no dimensional labels. A future calibrated importer must supply an evidenced conversion. A model-to-mat ratio is not a life-size guarantee on an uncalibrated display. Floating parts and the educational assembly order are not a factory-process simulation.

Hardware rendering permits up to 2× pixel density. The Murph post-processing target uses up to four MSAA samples; FXAA is reserved for targets without MSAA. Software graphics uses native 1× pixels, a cheaper transmission buffer and no post-processing. Antialiasing does not repair inaccurate source geometry or baked image artifacts.

## Surface and asset rules

- The mat has one top surface with a UV grid, not a near-coplanar overlay. Divisions remain 10 stage units. There are no floating line meshes or coplanar decals.
- Use baked contact shadows for static scenery and PCF depth shadows only for the moving object. The previous variance filter produced diagonal self-shadow bands. Static geometry must not cast or receive additional runtime shadows. Review moving shadows and atlas seams at desktop and phone pixel densities.
- Keep overhead fixtures substantially above the subject. No low bar, short support posts or cables through the inspection area. The articulated side lamp is scenery; the overhead spotlight remains the principal source.
- Reflection capture near/far distances must scale with the scene. A fixed 100-unit far plane clipped raised lights out of the millimeter-based watch environment while normalized models still captured them, making metal look flat. Check reflected highlights at both calibrated and normalized scales.
- Select reusable assets by inspecting their actual rendered geometry and materials, not only a catalog thumbnail. Keep source, author, license, origin disclosure and modifications with the shipped files. Prefer a cohesive palette and a clear center over filling every space with props.
- Scenery is loaded before the first study frame and bundled into every export alongside its license notices. No third-party asset requests occur at runtime. The surrounding furniture uses stylized proportions; only an evidenced object-to-mat calibration may carry dimensional labels.

## Reusable design checks

- Preserve all component lessons, paired parts, exact final home poses and reverse scrolling.
- Keep a physical part visible during handoffs; test actual transitions, not only settled chapter screenshots.
- Keep the desk fixed and the seated camera direction constant. Check camera continuity after text changes and resizing.
- Verify front and rear glass through multiple angles; opacity checks alone cannot establish readability.
- Inspect metal, matte surfaces, leather and glass under the same principal light. Styling the room must not simplify researched anatomy.
- Review desktop, narrow and short phones, reduced motion, keyboard navigation, setting persistence and the lower anatomy section.
- A frustum check does not establish visible anatomy. Check nearest ray intersections against scenery at the opening and visually review phone pullbacks; reflection-only cards must stay out of the exported geometry.
- Verify reuse on another object. Construction fixtures test behavior, not product fidelity.

The desk, articulated lamp, vise and caliper are locally retained CC0 authoring inputs from Poly Haven and Grab3D. Source and license records are in `public/presentation/workshop/`. The assembled scene and HDR probe are in `public/presentation/atelier/`; the room shell, cabinet, mat and remaining props are authored here. No new runtime engine is required. This remains a stylized workshop, not a copy of Bruno Simon's game or an interactive physics sandbox. See `tools/workshop-scene/README.md` for research references, bake rules and review requirements.

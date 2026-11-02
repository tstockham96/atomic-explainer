# Presentation settings

Workbench is the default in the Murph and shared GLB viewer. The Scene setting selector contains only Workbench and Original. `?setting=plain` explicitly selects Original and survives reload. Missing, obsolete or unknown settings use Workbench. Changing settings retains story progress and component-local poses.

The stylized workshop uses a static desk, mat, tools, books, clock and cactus. Its camera is centered at a seated eye line, about 10 degrees down, with no lateral story orbit. The camera dollies closer for small components; the original orbit transfers to the object so inspections retain their full turn. Smaller phones use less contextual pullback to keep the object readable.

The overhead bench fixture supplies the principal light: a suspended emissive strip 330 stage units above the worktop and a colocated warm, inverse-square spotlight cast a pool onto the work surface and filtered depth shadows. Existing fill lights are reduced to 24% of their original intensity. A reflection environment approximates the overhead strip and a broad wall bounce; scenery receives less environmental fill than the inspected object. This is a real-time lighting approximation, not ray-traced global illumination. Original restores the previous environment, light levels and shadow configuration.

`src/viewer/three/presentation.ts` and `workdesk.ts` derive the setting from object bounds. Props acquire no component IDs, and no material opacity or transmission changes for emphasis. Glass retains its restrained reflection rig, oriented to the seated view. Clear glass does not cast an opaque shadow. Original lighting is used for anatomy thumbnails, keeping props out of the educational images.

The reusable story stages the next component before the existing assembly leaves the frame. Camera framing expands to include that incoming inspection position, then moves into its close-up. This replaces the previous simultaneous departure/arrival that left an empty view. Each chapter retains its inspection turn, joined explanation and accumulated parts. Scroll distance is `(3 + chapters × 1.25)` viewport heights, about 30% shorter for the 18-chapter watch than the former schedule. The phone caption reserves its maximum required height so new text cannot abruptly change camera framing.

Scale must be established before a ruler can make a dimensional claim. The Murph uses millimeters and its mat has 10 mm major divisions. Arbitrary imported models are normalized and get no dimensional labels. A future calibrated importer must supply an evidenced conversion. A model-to-mat ratio is not a life-size guarantee on an uncalibrated display. Floating parts and the educational assembly order are not a factory-process simulation.

Hardware rendering permits up to 2× pixel density. The Murph post-processing target uses up to four MSAA samples; FXAA is reserved for targets without MSAA. Software graphics uses native 1× pixels, a cheaper transmission buffer and no post-processing. Antialiasing does not repair inaccurate source geometry or baked image artifacts.

## Surface and asset rules

- The mat has one top surface with a UV grid, not a near-coplanar overlay. Major divisions remain 10 units; lighter subdivisions use 5 units to avoid a dense subpixel pattern at the seated angle.
- Use PCF depth shadows here. The previous variance filter produced repeating diagonal self-shadow bands across the mat, tabletop and notebook. Bias alone did not resolve it. Review surfaces under moving shadows at both desktop and phone pixel densities.
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
- Verify reuse on another object. Construction fixtures test behavior, not product fidelity.

The desk, articulated lamp, vise and caliper are locally packaged CC0 assets from Poly Haven and Grab3D. Source and license records are in `public/presentation/workshop/`. The room shell, mat and remaining props are authored here. No new runtime library is needed. This remains a stylized workshop, not a copy of Bruno Simon’s game or an interactive physics sandbox.

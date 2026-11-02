# Presentation settings

Workbench is the default in the Murph and shared GLB viewer. The Scene setting selector contains only Workbench and Original. `?setting=plain` explicitly selects Original and survives reload. Missing, obsolete or unknown settings use Workbench. Changing settings retains story progress and component-local poses.

The stylized workshop uses a static desk, mat, tools, books, clock and cactus. Its camera is centered at a seated eye line, about 10 degrees down, with no lateral story orbit. The camera dollies closer for small components; the original orbit transfers to the object so inspections retain their full turn. Smaller phones use less contextual pullback to keep the object readable.

The overhead bench fixture supplies the principal light: an emissive strip and a colocated warm, inverse-square spotlight cast a pool onto the work surface and variance-filtered shadows. Existing fill lights are reduced to 24% of their original intensity. A reflection environment approximates the same overhead strip and room bounce; scenery receives less environmental fill than the inspected object. This is a real-time lighting approximation, not ray-traced global illumination. Original restores the previous environment, light levels and shadow configuration.

`src/viewer/three/presentation.ts` and `workdesk.ts` derive the setting from object bounds. Props acquire no component IDs, and no material opacity or transmission changes for emphasis. Glass retains its restrained reflection rig, oriented to the seated view. Clear glass does not cast an opaque shadow. Original lighting is used for anatomy thumbnails, keeping props out of the educational images.

The reusable story stages the next component before the existing assembly leaves the frame. Camera framing expands to include that incoming inspection position, then moves into its close-up. This replaces the previous simultaneous departure/arrival that left an empty view. Each chapter retains its inspection turn, joined explanation and accumulated parts. Scroll distance is `(3 + chapters × 1.25)` viewport heights, about 30% shorter for the 18-chapter watch than the former schedule. The phone caption reserves its maximum required height so new text cannot abruptly change camera framing.

Scale must be established before a ruler can make a dimensional claim. The Murph uses millimeters and its mat has 10 mm major divisions. Arbitrary imported models are normalized and get no dimensional labels. A future calibrated importer must supply an evidenced conversion. A model-to-mat ratio is not a life-size guarantee on an uncalibrated display. Floating parts and the educational assembly order are not a factory-process simulation.

Hardware rendering permits up to 2× pixel density. The Murph post-processing target uses up to four MSAA samples; FXAA is reserved for targets without MSAA. Software graphics uses native 1× pixels, a cheaper transmission buffer and no post-processing. Antialiasing does not repair inaccurate source geometry or baked image artifacts.

## Reusable design checks

- Preserve all component lessons, paired parts, exact final home poses and reverse scrolling.
- Keep a physical part visible during handoffs; test actual transitions, not only settled chapter screenshots.
- Keep the desk fixed and the seated camera direction constant. Check camera continuity after text changes and resizing.
- Verify front and rear glass through multiple angles; opacity checks alone cannot establish readability.
- Inspect metal, matte surfaces, leather and glass under the same principal light. Styling the room must not simplify researched anatomy.
- Review desktop, narrow and short phones, reduced motion, keyboard navigation, setting persistence and the lower anatomy section.
- Verify reuse on another object. Construction fixtures test behavior, not product fidelity.

All scenery geometry and canvas graphics are authored here. There are no new downloaded room assets or runtime libraries. This remains a stylized workshop, not a copy of Bruno Simon’s game or an interactive physics sandbox.

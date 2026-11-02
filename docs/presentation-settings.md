# Spatial presentation samples

The Murph and shared GLB viewer offer an optional `setting` query parameter and a Scene setting selector: `workbench`, `studio`, `sunset`, or `plain` (Original). Original remains the default while these directions are compared. Switching settings retains story progress and component poses.

Workbench gives the object a rounded physical cutting mat, a curved studio surround and a directional shadow. Studio uses the same seamless surround without the mat. Sunset removes the ground and uses a peach/rose/lilac surround. These are lightweight authored environments, not photographs or generated room assets. The current HDR reflection rig remains in place; these samples are not a calibrated simulation of a real photographic studio.

`src/viewer/three/presentation.ts` derives its set from object bounds, without knowing the product identity. It creates no component IDs, changes no assembly transforms and does not alter component opacity or transmission. Optical inspections darken the set surfaces to improve glass contrast. Real parts remain present and move out of frame as before. Clear glass does not cast an opaque shadow.

Scale must be established before a ruler can make a dimensional claim. The Murph authoring coordinates use millimeters; its mat has 10 mm major divisions. The shared importer normalizes arbitrary objects, so its default mat has no dimensional labels. A future calibrated importer must pass the conversion from its normalized coordinates, with source evidence. A model-to-mat ratio is not a life-size guarantee on an uncalibrated screen. The sample floats above the surface; it is not a physical assembly simulation or a new manufacturing claim.

Edge quality is independent of the background. Hardware rendering now permits up to 2× pixel density. The Murph post-processing targets use up to four MSAA samples; FXAA is reserved for targets without MSAA. The software path uses native 1× pixels instead of 0.75× while retaining the cheaper transmission buffer and skipping post-processing. Antialiasing improves raster edges, not inaccurate source geometry or baked image artifacts.

Review opening, inward travel, a mechanism milestone, front and rear glass at several angles, and complete reassembly. Compare desktop/mobile text contrast, mat shimmer, edge quality and settings changed mid-chapter. Run `test/browser/presentation.spec.ts` alongside assembly-story checks. The second-object construction fixture verifies reuse; it is not a phone fidelity benchmark.

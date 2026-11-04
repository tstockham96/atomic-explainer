# How it’s made: a story that accumulates

Every assembly story opens with the complete object, moves inward to a functional core, and then builds outward. The Hamilton example introduces the assembled watch before revealing its mainspring. Each chapter introduces a capability, inspects its real geometry through a full turn, seats it on the growing object, and explains what that addition makes possible. The sequence closes on the assembled watch before the existing anatomy and making stories.

This is an educational assembly order, not a documented factory procedure. Existing geometry/material accuracy limits remain unchanged. The mainspring, barrel, wheel train, escapement, balance, supports, winding train and rotor each get their own inspection before the H-10 movement milestone. Seventeen physical groups appear in eighteen narrative chapters. The milestone adds a system explanation without adding another physical part. Detailed anatomy remains independent of the chapter list. A chapter count must never replace the physical inventory or conceal missing geometry.

## Reusable contract

`src/viewer/three/assemblyStory.ts` supplies an object-independent schema, timeline, accumulation poses, camera framing and reverse-scroll behavior. `docs/research/murph-assembly-story.json` supplies the Hamilton-specific writing and order. Both the Murph adapter and the general GLB viewer support this contract. Set `scene3d.assemblyStory` to a researched script to enable it for an imported object; the normal site export, studio project import, and recipe assembly preserve it. Without a script, existing exploder tours remain unchanged. A second-object phone construction fixture exercises the general path; it is not a fidelity example. No new per-object viewer code is required.

A script contains a title, evidence-boundary note, `opening: {title, description, from}`, closing statement and ordered chapters. Opening text/direction have generic defaults. Each chapter has this shape:

```json
{
  "id": "motor",
  "kind": "component",
  "componentIds": ["motor"],
  "title": "Begin with the source of motion.",
  "description": "Explain this part and the capability it introduces.",
  "joined": "Explain its connection to the growing assembly and lead to the next chapter.",
  "detail": "Optional concise material or evidence note",
  "from": [0.25, 0.15, 1],
  "approach": [0, 0, 1]
}
```

`from` is the inspection viewing direction; `approach` is the direction from which the part seats. Distances derive from object bounds, not watch millimetres. `kind: "component"` (the default) introduces a part or declared true pair. Every supplied physical group must join exactly once. A `kind: "milestone"` chapter references previously assembled parts to explain their combined behavior; it does not introduce or duplicate meshes. Milestones referring to future parts are rejected. Unmapped and duplicate groups fail validation. Do not group unrelated mechanisms merely to shorten the story.

Pass the common untransformed root, a map of physical component groups sharing that coordinate space, and the script into `createAssemblyStory`. Capture their actual assembled transforms first. Apply `pose(progress)` at each scroll position and use the returned inspection/overview bounds with the helper’s `camera` function. Materials and visibility are not changed. Context and future parts move outside the viewing area; incoming parts turn, restore orientation, and seat. The first 3.5 percent turns around the assembled object; the next 8.5 percent continuously reveals the core through physical travel. The last six percent holds the complete object. A reversed scroll reconstructs the same transforms without accumulated state.

The helper assumes compatible parent coordinates and independently movable groups. Reparent or normalize an imported hierarchy before use; this is not an automatic constraint or collision solver. Inspect incoming paths and seated interfaces against the real geometry. Bounds-based framing alone cannot establish clearance or physical assembly feasibility.

## Research and writing rules

- Choose a throughline: how energy, force, information or material becomes the object’s useful output.
- Establish the whole object first, then reveal a meaningful functional core. “Movement → automatic winding → display → protection → wearability” is this watch’s sequence, not a universal template.
- Connect every chapter to the last and the next. Supply both an inspection explanation and a short seated explanation.
- Show a cumulative result after every addition. Do not reset to an exploded overview between chapters.
- Preserve true pairs in one view. Explain meaningful subsystems with milestone chapters after their distinct component lessons; do not shorten a story by replacing those lessons with a broad subsystem chapter.
- Distinguish educational order from verified manufacturing order. A true manufacturing claim needs process evidence, tooling, interfaces and assembly dependencies; an exterior photo is insufficient.
- End with the whole object and a statement of how the parts work together. Keep anatomy and sources available afterward.

## Preview and evaluation

Build with `node tools/murph-study/build.mjs --packaged dist-site/murph-study`. `/murph-study/index.html` uses the new story; `?story=explode` retains the prior outside-in inspection tour. Historical capture and material-benchmark paths explicitly use that prior mode, so changing the story does not silently overwrite old fidelity evidence.

`test/assembly-story.test.ts` checks the assembled opening, inward transition, accumulation, grouped seating, inventory coverage, reversed poses, stable material opacity and camera continuity across chapter boundaries. `test/browser/assembly-story.spec.ts` checks every chapter at three inspection angles and three viewport sizes, exact seated transforms, final assembly, reduced motion, public navigation and reverse scrolling. These are motion/presentation checks, not a new manufacturing-fidelity score or learner study.

Material correctness is a separate release condition. Inspect actual exported caps, edges and reverse surfaces under a fixed rig. The watch package now emits `material-review.json` too. Portable map/UV checks are necessary but cannot establish photorealism, exact alloys, mechanical accuracy or manufacturing order.

## Milestones preserve detail

After individual `motor` and `motor-mount` chapters, a milestone can use `{"id":"power-unit", "kind":"milestone", "componentIds":["motor","motor-mount"], ...}`. The same meshes lift and turn together, then return to their existing seats. The assembled part count stays unchanged. Separate component lessons remain directly selectable. Narrative length scales with the chapter count so added detail does not compress reading time.

The general viewer's anatomy uses the original component research and declared pairs, not milestone summaries. Unmodeled researched components retain written entries. Each story export writes `story-review.json`: it flags missing lessons and multi-part chapters without a declared inspection group. A milestone never counts as individual lesson coverage. This structural check cannot judge explanation quality, mechanical accuracy or whether a grouping was honestly justified by research.

## Engine and phone studies

The real engine and local sourced-phone exports now use the same story contract:

- `docs/research/porsche-assembly-story.json`: 29 physical groups, 26 component lessons (three declared pairs) and four system milestones. The crankshaft leads into the rotating core, timed mechanism, breathing/ignition, and air/oil cooling before the covers close.
- `docs/research/iphone-assembly-story.json`: 28 physical groups, 28 component lessons and four system milestones. Stored energy leads into computation, connection paths, imaging, sensing/feedback, and the completed enclosure/display. Board layers and left/right controls remain separate lessons because they have distinct roles.

Both `tools/*-study/spec.mjs` builders load the researched story file, so rebuilding a model cannot silently restore the old exploded tour. Existing materials and authored geometry are retained. These scripts rebuild exports; they do not demonstrate new unattended reconstruction from a photo.

Run `npm run build:porsche` to regenerate the public engine. The iPhone build requires the separately obtained, ignored `examples/iphone-18-pro/assets.local/apple-reference.glb`: run `node tools/iphone-study/spec.mjs` and `node --import tsx tools/iphone-study/build.mjs`. Use `PLAYWRIGHT_CHANNEL=chrome` when exporting with installed Chrome. Never commit the sourced Apple geometry or its combined derivative.

`test/browser/porsche.spec.ts` checks all story lessons at three turn positions, milestone/part coverage, scenery clearance, caption clearance, exact cumulative seating, completion, public navigation and reverse scroll on desktop and mobile. It normally tests the public engine. Set `ATOMIC_EXPLAINER_LOCAL_STORIES=1` to include the real local phone and target the running previews on port 4319. The test deliberately does not substitute the primitive construction fixture for the sourced phone.

Review snapshots observe the rendered pose without changing it. Scenery visibility probes include actual mesh triangle centers as well as group centers, because a group center can lie inside a bore or between disconnected members. Passing this check only establishes some visible anatomy, not full silhouette clarity or physical accuracy.

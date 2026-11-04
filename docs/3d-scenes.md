# Authoring a multipart 3D explainer

The viewer can render any object supplied as a multipart model. It does not infer accurate internal geometry from a photograph. Author the mesh separately, then connect it to the existing component descriptions.

## Model requirements

Export a self-contained `.glb` with textures embedded. Give every explorable part a unique node name. Use `node` for one node or `nodes` for several related nodes that should move as one assembly; do not supply both. Mapped nodes must not contain other mapped nodes. Keep the assembly intact in the source file; explode offsets are applied by the viewer. Use an upright object with its main viewing face toward +Z.

The loader centers the assembly and scales its longest dimension to seven scene units. All offsets and focus distances below use those normalized units, not the source model's meters or millimeters. Node transforms are preserved when parts are separated.

Add this field to an existing version-1 spec whose `components` include `lens` and `housing`:

```json
{
  "scene3d": {
    "kind": "gltf",
    "url": "models/camera.glb",
    "parts": [
      { "componentId": "lens", "node": "LensAssembly", "offset": [0, 1.5, 2], "shot": { "from": [0.8, 0.2, 1], "to": [-0.2, 0.4, 1] } },
      { "componentId": "housing", "node": "BodyShell", "offset": [0, -1.5, 0], "distance": 6 }
    ]
  }
}
```

The array determines the order of the component tour. `shot.from` is the starting direction from the component center toward the camera. Every component receives a complete 360-degree inspection orbit at a fixed distance fitted to its geometry. `shot.to` is retained for older specs but is superseded by the full turn. A negative Z direction lets the camera examine a back surface. Optional `distance` is a lower bound on camera distance. Keep directions nonzero and away from the vertical axis. Each node is rotated around its bounding-box center. Unmapped geometry remains in the scene. Missing nodes, unknown component IDs, duplicate nodes, and overlapping part hierarchies produce an explicit loading error.

Place the GLB under `public/models/` for the development viewer. For CLI exports, put it under `models/` beside the input spec:

```bash
npm run build
npm run atomic-explainer -- --from-spec ./my-object/spec.json --out ./my-object/site
```

Local model paths must remain inside the spec directory. The exporter copies self-contained GLBs into the output. External HTTP model URLs require the host to permit cross-origin requests and are not bundled for offline use. Assets must carry a license that allows your intended redistribution; include their attribution with the explainer.

## Inspect true pairs together

Use `scene3d.inspectionGroups` to present a researched pair or repeated functional set once:

```json
{
  "inspectionGroups": [{
    "id": "crankcase",
    "name": "Crankcase halves",
    "componentIds": ["crankcase-left", "crankcase-right"],
    "description": "These mating castings support the crankshaft and close the crankcase.",
    "material": "Cast light alloy · machined mating faces"
  }]
}
```

Keep both entries in `components`, `scene3d.parts`, the GLB and the requirements inventory. The group replaces their separate tour stops, selector options and anatomy cards, starting at the first member's position in the tour. All members stay visible during one shared 360-degree orbit; the camera fits their combined bounds using the first member's `shot.from` and minimum distance. Optional `gap` packs members closer along their existing separation axis during focus (in normalized scene units), then reversibly restores their exploded spacing. Use it when a pair is otherwise too widely separated to read. Each still explodes and returns to its own assembly position. Member IDs remain valid inspection targets. IDs and group membership must be unique.

Author a combined explanation that preserves meaningful differences. Group from function and research, never just a left/right name match. Inspect separation, occlusion and readability at phone and desktop widths; a fitted bounding box cannot prove both surfaces are readable.

`scene3d.lighting: "product"` provides neutral softboxes with contrasting reflection fields for authored PBR surfaces. This is an alternative presentation rig, not automatic material calibration. Preserve imported maps; do not change glass opacity or roughness during inspection.

## Current limits

- Per-part orbit directions are authored in `shot`. The entry/hold/return pacing is still shared; arbitrary camera splines and unequal chapter durations are not yet exposed.
- Embedded GLB animation clips play through Three.js AnimationMixer. Root transforms used by an animation should not also be used as explodable pivots; map a containing node instead.
- Draco, Meshopt, and KTX2 decoder configuration is not included; use uncompressed geometry and ordinary embedded textures.
- The model must already have separate parts. A single fused surface cannot become a truthful internal teardown through this mapping.
- Reduced-motion mode presents written anatomy and any supplied stills; supply representative images for that view.

The procedural watch (`"scene3d": { "kind": "procedural-watch" }`) is a renderer demonstration, not a source of accurate Hamilton geometry. The 2D `film.focus` field only controls the photographic fallback and does not position the 3D camera.

## Default asset

`public/chronograph.json` demonstrates six grouped assemblies, an axial explosion, a reverse-side camera shot, and automatic anatomy thumbnails rendered from the actual model. The source GLB remains unmodified. The runtime adds grouping, lighting, camera movement, and physical separation of context during focus. See `public/models/chronograph/ATTRIBUTION.md` for license and provenance. This exterior model does not include a movement.

For a deliberately planar XY glass cover, optional `coverThickness` gives its existing closed boundary a thin beveled edge at runtime. This is an explicit illustrative geometry modification, not reconstruction or an inferred manufacturing measurement. It rejects nonplanar geometry and multiple boundary loops. Prefer an authored solid glass mesh when one is available.

Set `doubleSided: true` only for a part whose reverse surface must be visible during the teardown. Other parts retain the source material’s face-culling behavior.

## Glass and other transmitting surfaces

Use physical transmission (`KHR_materials_transmission` in glTF) for glass, with metalness zero. Clear glass should keep its authored IOR, transmission, tint and roughness throughout the story; do not turn it opaque or add a milky surface to make a close-up readable. `createClearGlass()` in `src/viewer/three/optics.ts` supplies neutral thin-window defaults. An actual solid edge, restrained reflections and a full inspection orbit make the surface understandable. Tinted and frosted imports retain their authored optical properties.

The shared viewer recognizes transmitting materials, without requiring component names such as “crystal” or “sapphire.” These parts receive a restrained reflection environment. All components, including opaque ones, receive a full 360-degree inspection orbit starting at `shot.from`. Orbit distance stays constant through the turn. Author enough separation for the camera path around each component.

Parts never dissolve, fade, or change opacity during the scroll story. The viewer moves unselected context outside the camera view, then returns it to the exploded assembly between inspections. This keeps opaque objects in the transmission buffer and preserves material appearance. The backdrop is plain rather than a moving cloud effect. A shared scene backdrop keeps direct and transmitted background colors in the same lighting pipeline. Nested transmission and authored alpha-blended objects behind glass remain limitations of this real-time renderer; this is not a ray-traced optical simulation.

`test/optics.test.ts` covers these material invariants. The study's `?capture=1&optics=1` diagnostic renders a contrast chart through ordinary glass and sapphire, from front and oblique viewpoints. It compares the chart with and without the window; it does not infer transparency from material settings alone.

## Component turns and surface details

`src/viewer/three/inspection.ts` supplies reusable reversible inspection intervals, centre-preserving turns, and fixed spherical framing. An authored study can insert these intervals into an existing assembly choreography. The Murph study uses them for all 16 groups; the generic imported-model viewer orbits every mapped component. Finish the turn while context is fully separated, then restore the assembly pose before moving on. Inspect long/thin objects and reverse surfaces at both portrait and landscape sizes.

Bind labels and engraving to supporting triangles or a surface-conforming decal, including cutout masks. `src/authoring/surface.ts` supplies planar UVs and front-face material assignment for authored parts: holes cannot carry artwork, and backs remain undecorated unless supported by references. The Murph rotor uses this path instead of a transparent artwork plane. Base color and engraved relief contain no painted illumination; both use the scene's lighting. The retained generated exterior still limits the study's overall finish fidelity.

The research prompt and generated construction plan carry the same visual-review requirements from `src/pipeline/quality.ts`. Those requirements guide an agent or future component builder; they do not constitute automated visual verification or implement arbitrary-object reconstruction.

## Build an agent-authored component recipe

A construction plan is not geometry. There are now two explicit handoff paths:

1. Source/model a multipart GLB and map its nodes using the existing spec contract.
2. For dimensioned plates, frames, rings and cylindrical parts, author a recipe using `src/spec/assembly.ts`. Build it with the shared assembler:

```sh
npm run atomic-explainer -- --from-spec examples/iphone-18-pro/research.json --assemble examples/iphone-18-pro/assembly.json --out ./phone-out
```

The MCP equivalent is `atomic_explainer_assemble(specPath, assemblyPath, outDir)`. Neither route calls a paid provider. The outputs are a self-contained GLB, an explainer, `assembly-review.json`, and `assembly-project.json`. The last file can be opened through **Open agent-built project** in the local studio, including when no research API key is configured.

Recipes use millimeters for geometry, shared named PBR materials, independently addressable component groups and evidence references. Explosion offsets use the viewer's normalized units (longest assembly dimension is seven units). Openings are actual geometry, not artwork pasted over surfaces. Glass and opaque display/backing materials remain distinct. No photographic lighting is baked into these procedural surfaces.

Every researched component must be represented, references must exist, and deferred construction must be resolved or explicitly scoped before a build is accepted. Structural validation does not prove source entailment. A recipe claiming `reference-matched` still exports with an **unreviewed** checklist. Compare assembled/front/oblique/reverse and exported views against inspected references before changing a review verdict.

This is a limited dimensional modeling vocabulary, not a universal reconstruction model. Organic surfaces, complex castings, fabric, detailed gear trains and exact hidden interfaces still need appropriate modeling tools or sourced assets. Do not replace a difficult part with a box and call it faithful. Schematic geometry may test navigation and educational structure, but must remain visibly labeled.

The iPhone example deliberately tests this shared construction/export/viewer path. Its overall enclosure envelope uses published dimensions; internal forms, positions and finishes are illustrative. Screws, seals, antennas, wireless charging and thermal assemblies are omitted and recorded as unresolved. It is not evidence that one uploaded photo can reconstruct a phone's internals.


## Source models must become actual scroll stories

A source inspector is an intermediate asset review, not an explainer. Accepted tours must rotate the assembly, visibly separate mapped components, inspect them and reassemble correctly when scrolling backward. The shared viewer exposes an **Explode the object** button and an **Exploded overview** navigation option. Browser regression tests use that real button and native reverse scrolling, then compare pairwise component positions; a whole-model zoom cannot pass.

For imported models, set `scene3d.requireCompleteMapping: true` to reject any renderable mesh outside the mapped groups. If a source includes nonphysical occlusion proxies, list their names and evidence-based reasons in `scene3d.omittedNodes`. These are excluded once before the story; mapped components cannot be omitted. Do not use this mechanism to discard difficult physical parts.

`scene3d.lighting: "neutral"` uses a neutral reflection environment without the extra studio key lights. It preserves source material maps; it is not automatic material calibration.

An AR model may have only front-facing surfaces. Prefer verified reverse geometry. Where explicitly illustrative backs are acceptable, a part may declare `reverseSurface: {"color":"#171a1c","roughness":0.7,"note":"Reverse construction unverified; neutral visualization only."}`. This adds untextured back-facing surfaces to opaque single-sided geometry, without repeating front artwork. It does not modify transparent/transmissive glass or reconstruct hidden structure. Record this compromise in the study notice and research audit. It cannot pass an internal-geometry fidelity evaluation.

The iPhone `exterior-study.json` maps 92 source meshes into seven exterior groups and documents two rendering helpers. It is a source-specific mapping using the shared renderer, not automatic component recognition. Source geometry is local-only; see the README for the explicit local-asset build.

## Close the continuous story

The shared timeline reserves 90–98% for reassembly and holds the whole object through the remaining 2%, before anatomy enters. Component inspections use `THREE_TIMING.reassemble` as their end boundary; navigation and evaluation hooks must use the same interval. Reassembly restores actual part transforms without fading parts or switching models. The Porsche engine is an original, bundled 29-assembly example of the same viewer, with a separate research/requirements inventory and no API or proprietary-model prerequisite.

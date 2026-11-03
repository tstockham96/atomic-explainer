# Authored workshop

The viewer loads **one complete scene**, authored and lit in Blender, rather than placing independently shaded props in JavaScript. `workshop-source.blend` contains the editable room, fixtures, materials, packed source textures and seated review camera. `build.py` reproduces it with Blender 4.5 LTS.

```sh
blender --background --factory-startup --python tools/workshop-scene/build.py -- --bake
```

Use `--preview` instead of `--bake` for a faster camera render. Preview output goes to the ignored `.workshop-build/` directory. Blender is an authoring dependency only; end users need no Blender installation.

## Export contract

- Blender coordinates are Z-up, one unit = 100 stage units. The desk surface is at Z=-0.52; the inspection center is the origin. Viewer placement translates this surface to the object's existing floor and converts glTF Y-up back to Z-up.
- `public/presentation/atelier/workshop.glb` contains four geometry layers: room, bench, props, mat. Each has a 2048px packed atlas with Cycles combined illumination, including indirect light and contact shadows. Original surface UVs are preserved during the bake, then replaced with atlas UVs for export.
- The atlas is saved through AgX and embedded as high-quality JPEG in the GLB and displayed with an unlit, **untone-mapped** material. Do not apply the runtime light rig to these pixels again.
- `workshop-probe.hdr` is captured at the inspection center before replacing original materials. It supplies reflections for the moving subject; it is not a generic studio map.
- Off-camera reflection panels contribute to baking and the HDR probe but are excluded from the exported geometry. A phone opening can pull the camera outside the authored camera position; it must never end up behind a lighting panel.
- One runtime warm key follows the authored overhead position. A cool window fill and dim inherited subject fill keep anatomy readable. A separate shadow receiver adds only the moving subject's shadow to the mat. This is an approximation to the baked area light, not real-time path tracing.
- No clock, floating shelves, layered pegboard or stacked mat decal planes. Cabinet sides/back support the shelves; the lamp sits at the bench edge; tools meet their pegs. Keep attachments valid in 3D, not merely in one screenshot.

The scene is intentionally static. The seated camera can dolly and the researched object can rotate, separate and reassemble. The furniture does not belong to component bounds, story IDs or anatomy thumbnails.

## Provenance and references

Imported source geometry comes from the locally retained CC0 inputs in `tools/workshop-scene/assets/`: Poly Haven's articulated lamp and Grab3D's bench, vise and caliper. See `public/presentation/workshop/` for attribution, licenses and the original asset hash manifest. Grab3D discloses AI-assisted procedural Blender authoring. The room layout, cabinetry, window, mat, small props and lighting are authored by this project. Furniture proportions are stylized, not evidence of product dimensions.

Studied as implementation references, **not copied or redistributed**:

- [Bruno Simon's 2025 source](https://github.com/brunosimon/folio-2025): consistent tinted shadows and reflected light in its custom material system. Its live shader approach is different from this baked room.
- [Bruno's room](https://my-room-in-3d.vercel.app/) and [source](https://github.com/brunosimon/my-room-in-3d): cohesive scene composition and local lighting. No room assets copied.
- Three.js Journey: [creating a scene in Blender](https://threejs-journey.com/lessons/creating-a-scene-in-blender), [baking and exporting](https://threejs-journey.com/lessons/baking-and-exporting-the-scene).
- [Spline to Framer workflow](https://spline.design/academy/tutorials/create-a-3d-scroll-animation-integrate-into-framer): embedding still depends on a properly authored 3D scene. A framework switch alone would not fix attachments, shadows or materials.

## Review before publishing

Inspect the Blender preview, then the actual browser: opening, small-component close-up, movement milestone, front/rear glass, complete assembly, reverse scroll, desktop and narrow phone, and a second object. Check shelf and tool contacts, lamp clearance, grid aliasing, shadow seams, baked/live light consistency, transparent glass and text contrast. Runtime tests cannot certify visual quality by counting loaded assets.

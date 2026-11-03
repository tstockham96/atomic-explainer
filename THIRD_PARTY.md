# Third-party software and assets

Explode's own code is MIT-licensed. Third-party code and assets retain their licenses.

- **Three.js**: MIT. https://github.com/mrdoob/three.js
- **Basement Scrollytelling**: MIT, copyright basement.studio. https://github.com/basementstudio/scrollytelling/blob/main/LICENSE
- **Lenis**: MIT. https://github.com/darkroomengineering/lenis
- **GSAP**: GSAP's own standard license, not the repository's MIT license. See the license shipped with the dependency and https://gsap.com/standard-license/.
- **Chronograph Watch model, textures, and renders derived from it**: CC BY 4.0, Eric Chadwick / Darmstadt Graphics Group GmbH (2025), derived from Chronograph Watch Mudmaster by graphiccompressor. Source: https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/ChronographWatch. Full attribution and separate Khronos / DGG trademark notices are in `public/models/chronograph/`. These notices travel with the built viewer. The source GLB is retained; runtime geometry changes are described in the asset attribution.

The reference websites supplied for design direction are not included in this distribution. No Omega, Duo Case, or Hello World models, images, or application code have been incorporated.

- **Murph educational study**: project-authored/generated geometry and textures; not manufacturer CAD. Provenance and limitations are in `public/models/murph/ATTRIBUTION.md`. Hamilton trademarks identify the subject.
- **Studio Small 09 HDR**: Sergej Majboroda / Poly Haven, CC0, https://polyhaven.com/a/studio_small_09 . Attribution accompanies the Murph model.
- **Outfit and Fraunces fonts**: SIL Open Font License 1.1. License files are distributed with the corresponding `@fontsource` packages; the study build copies them alongside the fonts.

- **Workshop scenery**: Poly Haven Desk Lamp Arm 01 (Kuutti Siitonen / Yann Kervran) and Grab3D Workbench, Bench Vise and Vernier Caliper; CC0 1.0. Source URLs, origin disclosures, modifications, license text and asset hashes are in `public/presentation/workshop/`. Those notices travel with exported explainers.

## Blender-authored workshop derivative

`public/presentation/atelier/workshop.glb` incorporates the CC0 workshop sources listed above into an authored room. The source textures, materials and lighting are baked into four atlases. `workshop-probe.hdr` is rendered from that scene. Attribution and license records are retained beside the packaged presentation assets; editable Blender source and reproducible authoring instructions are in `tools/workshop-scene/`. No Bruno Simon or Spline scene assets are redistributed.

## Local-only iPhone study

The Apple exterior reference and the combined internal-study GLB are not bundled or licensed by this repository. Their redistribution rights have not been established. They stay in ignored `assets.local/` directories. Public builds show a source-review page at the iPhone route; they do not present the simple construction fixture as a finished reconstruction. Existing images in `evals/reports/iphone-assembly/` document the project-authored construction fixture, not the manufacturer asset. See `docs/research/iphone-source-audit.md`.

## Porsche engine study

`examples/porsche-911-engine/models/engine.glb` is project-authored educational geometry under MIT, not manufacturer CAD or a redistributed marketplace model. The source, research limitations and asset attribution accompany the example. Brand names identify study subjects and do not imply endorsement.

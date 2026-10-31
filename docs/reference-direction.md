# Reference audit and replacement direction

## References supplied by the user

- Basement Scrollytelling: https://github.com/basementstudio/scrollytelling
- Hello World DSGN: https://www.awwwards.com/sites/hello-world-dsgn → https://helloworlddsgn.com
- Duo Case: https://www.duocase.lol/
- Omega Timeless Adversaries: https://www.omegawatches.com/en-us/timeless-adversaries/james-bond-edition

Inspected the publicly served HTML and relevant source scripts on October 30, 2026. This source audit is not a claim that every reference's motion was visually played back.

Basement provides MIT-licensed React/GSAP timeline components. The implementation now uses its Root, Pin, and Animation components rather than maintaining a separate hand-written ScrollTrigger pin. GSAP retains its separate license.

Duo Case's `script.js` loads `assets/fold-frames/fold-NNN.jpg` and advances the image on scroll. Its fold sequence is rendered imagery; the successful visual standard cannot be attributed solely to live geometry. Omega's page loads a WebGLCanvas module containing a glTF loader and material/rendering code. Neither site's proprietary art, models, or scripts have been copied into the project. Hello World's Awwwards entry resolves to `helloworlddsgn.com`; its HTML imports Three.js and includes a main scene canvas and additional work/phone canvases.

## Concrete defects to address

The user rejected the procedural watch's proportions, artificial finish, overlapping exploded pieces, and repetitive motion. More background themes do not address these defects. The replacement starts from an existing detailed asset with real surface maps and retains its authored shapes.

## Implemented replacement

The Khronos Chronograph Watch is available under CC BY 4.0 with separate logo notices. Source geometry and textures remain unchanged in the GLB. Six assemblies group the cover, hands, dial, bezel, rear plate, and band/fittings. They separate along the Z assembly axis rather than being scattered into arbitrary positions. The camera moves to an oblique overview so that depth becomes visible lateral separation.

Camera framing derives from actual transformed geometry. Automated checks load the shipped GLB, verify complete part mapping, play the second-hand animation, and project bounding boxes into landscape and portrait cameras. The settled exploded view must have no overlapping part bounds. Each close-up must stay inside the viewport and out of the reserved caption area. This does not prove visual quality or validate every intermediate frame; it catches concrete layout regressions.

Each part has its own authored entry and exit viewing direction. The rear plate is inspected from behind. Nonselected parts fade during inspection. A softbox environment gives metal broad reflections and glass readable highlights. Anatomy thumbnails are rendered from the same asset, so no unrelated Murph photographs appear under this new object.

## Scope and remaining work

This chronograph is not the Murph and has no internal movement. It is a usable external model for proving the explainer engine; accurate internal stories require an asset with modeled internals and reliable source material. The earlier Murph prototype remains separately accessible for comparison.

Browser rendering and human visual judgment remain necessary. Geometry tests, license checks, and a successful build must not be reported as reaching the user's visual-quality target. A complete reusable workflow should also allow Blender-authored multipart GLBs, authored camera splines, and optional offline-rendered sequences when a project needs a higher rendering budget. Those authoring features are future work, not implemented capabilities.

## Render review

Captured seven actual WebGL views through a local review page in the in-app browser, including both atmospheres and portrait framing. Initial captures exposed a transmission/background mismatch; the cloud shader now renders to the scene background texture so it participates in the glass transmission pass. The originally planar cover has an explicitly documented, illustrative beveled edge generated from its own boundary. A same-origin iframe check also confirmed the pin remains fixed, captions match their stops, all six anatomy images render, and the theme switch responds. No claim of matching the reference films is made.

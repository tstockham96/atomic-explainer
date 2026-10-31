# Inspect the asset before animating it

This local comparison viewer is an authoring tool, not the final explainer. It loads real GLB geometry, shows an input photograph, isolates named groups, and compares material adjustments with the unmodified provider materials. It does not generate or purchase anything.

```sh
node tools/model-review/build.mjs /path/to/review.json dist-site/object-review
```

Serve with the existing studio and visit `/object-review/index.html`. The input directory contains the manifest, its model and reference assets, and an inspected `parts.png` contact sheet. Keep assets without redistribution permission out of the open-source repository.

A manifest includes `title`, `subtitle`, `model`, `reference`, `referenceUrl`, `referenceNote`, `summary`, `finding`, `rotation` (XYZ radians), and `parts`. Each part has a human-reviewed `name`, exact `nodes`, `description`, and `offset` in the normalized assembly's world space. Offsets must be chosen from actual component bounds and inspected for overlap. Every mesh must be assigned exactly once. Group unrelated fragments only under an explicit unverified/mixed label, never under an invented mechanical identity.

Optional part `material` overrides: `metalness`, `roughness`, `normalScale`. Metalness/roughness overrides replace the corresponding maps; base color and normals are otherwise preserved. These are review adjustments, not inferred physical measurements. The Original materials button restores the provider material exactly. Do not use broad adjustments to hide missing geometry, illegible textures, or reflective artifacts baked into base color.

The browser's `?capture=1` authoring hook can send assembled/separated/individual canvas renders and a layout report to the temporary local review collector on port 4320. Normal use has no dependency on the collector. Capture images do not include HTML labels; inspect label positions separately.

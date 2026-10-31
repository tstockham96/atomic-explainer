# First live Tripo trial

Run on 2026-10-30. Result: provider integration works; the generated asset does not meet the finished explainer's quality target.

## Controlled input

The reference was `public/chronograph/hero.png`, a single render of the licensed Khronos Chronograph Watch. This is a controlled reconstruction test against known geometry, not a claim of Hamilton Murph fidelity or a general evaluation of Tripo. Attribution is in `public/models/chronograph/ATTRIBUTION.md`.

## Request and result

- H3.1 `v3.1-20260211`, detailed geometry, detailed textures, PBR enabled, 100,000 face limit: 60 credits.
- Semantic segmentation `v2.0-20260430`, balanced, connectivity splitting disabled: 40 credits.
- Downloaded both original and segmented GLBs. Original: 11,035,216 bytes, one mesh node. Segmented: 7,991,712 bytes, twelve mesh nodes.
- All twelve segmented materials retained base-color, normal, and metallic/roughness maps. No glass transmission material was present.
- Segmented node names were generic `tripo_part_0` through `tripo_part_11`. No semantic component labels were found in node/mesh extras. This response cannot support reliable label-only matching.
- Both GLBs loaded in the browser. Generated geometry was rotated to align its forward axis with the source for review.

## Visual inspection

Actual WebGL renders were inspected from multiple angles under the same studio environment as the source. Each generated mesh was also rendered individually.

The result preserves a recognizable silhouette and separates some useful shapes, including a bezel and hands. However, fine dial details are degraded, reflective surfaces look irregular, and multiple mesh groups combine unrelated fragments. The dial/back is a rough combined piece, not a clean internal assembly. There is no independently explorable transparent glass or reconstructed movement.

The twelve-part count is therefore not a success criterion. This asset remains a draft and was not substituted for the default explainer.

## Implication for the pipeline

Image-to-model plus segmentation is a useful starting point, but this test does not establish a reliable watch-teardown generator. The agent needs visual component matching, stronger references, component modeling/sourcing, assembly alignment, and repair. Additional views or other settings may improve results, but have not been tested here. This single run does not establish the limits of other providers or object categories.

The trial used the chat agent and the direct Tripo adapter; no OpenAI API calls were required. Only one generation and one segmentation were purchased. Working assets, task records, and review renders remain local rather than being automatically committed or published.

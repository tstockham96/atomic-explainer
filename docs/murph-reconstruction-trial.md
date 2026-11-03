# Murph reconstruction study — 2026-10-30

The user rejected the first licensed-watch Tripo reconstruction for shiny materials, an unreadable dial, and an unintelligible explosion. This second study returns to Hamilton's Khaki Field Murph 42 mm, H70605731.

## Input and generation

The input is Hamilton's own rolled-view product photograph, not the previously generated Murph stills. [Product page](https://www.hamiltonwatch.com/en-us/h70605731-khaki-field-murph-auto.html), [input photograph](https://www.hamiltonwatch.com/media/catalog/product/h/7/h70605731_detail_rolledview.jpg). An additional front photo was consulted, but was not submitted as a second view. The two images show different strap configurations and should not be treated as a calibrated multiview capture.

One H3.1 generation used detailed geometry, a 300,000-face cap, extreme textures, texture model `v3.5-20260815`, de-lighting, original-image texture alignment, and image-aligned orientation. It consumed 70 credits. One v2 balanced segmentation with connectivity splitting consumed 40 credits. Total: 110. No OpenAI API calls and no replacement generations.

The opt-in `quality: "fidelity"` adapter setting records different checkpoint fingerprints from the default. Existing default checkpoints remain resumable. The setting costs more and is an asset-study option, not a guarantee of accurate reconstruction.

## What the returned asset contains

The segmented GLB contains twelve meshes. Actual browser renders of every mesh were inspected, then grouped manually:

| Group | Mesh suffixes | Findings |
| --- | --- | --- |
| Case | 0 | Case and lugs, with a pale generated interior surface; no separate movement or transparent crystal |
| Dial | 3 | Separate dial, but warped numerals, text, and edges; residual hand traces |
| Hands | 8, 9, 11 | Minute, hour, seconds meshes; imperfect profiles and fill |
| Crown | 6 | Separate knurled crown; distorted cap and edges |
| Strap | 1, 2, 4, 5, 7, 10 | Six fragments belonging to the strap, regrouped as one assembly |

These labels are visual inspection results, not provider-supplied semantics or a verified physical teardown. There is no H-10 movement or separately explorable sapphire crystal. The case's pale interior must never be labeled as either.

## Material and presentation correction

The local comparison applies nonmetallic, rougher materials to the strap and dial, reduces exaggerated normal-map effects, and uses separate metal settings for the case, crown, and hands. Base-color textures remain unchanged. The Original materials control restores the provider materials exactly. These overrides are explicit authoring choices, not recovered measurements.

The old diagnostic slider displaced meshes by file order; that is not meaningful disassembly. The reusable `tools/model-review` viewer instead supports inspected groups, deliberate offsets, labels, automatic framing, isolated close-ups, and a source-photo comparison. This is an authoring/quality gate, not the final continuous-scroll product. The raw twelve-mesh contact sheet is also available.

## Result and next asset work

The material correction and grouping improve legibility, but the generated asset still fails the intended photorealistic, accurate-explainer target. Remaining problems are in geometry and textures, not only lighting. A usable Murph asset needs a clean dial with correct printing, refined case and hand geometry, a separate transparent crystal, and a separately sourced or modeled movement based on stronger references.

Reference photographs and generated outputs remain local, outside the source repository: Hamilton's photos do not have an established open redistribution license. The generic comparison tool and provider improvements are reusable open-source code. Do not replace the default explainer or claim this is finished Murph CAD.

Tripo settings were checked against its [image-to-model documentation](https://developers.tripo3d.ai/en/docs/generation-image-to-model/standard) and [segmentation documentation](https://developers.tripo3d.ai/en/docs/mesh-segment).

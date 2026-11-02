# Workbench lighting and story design audit

## Findings and changes

| Area | Finding | Fix and review |
| --- | --- | --- |
| Lighting hierarchy | Similar illumination across the entire room flattened the scene. | A visible overhead emitter and colocated shadow-casting spotlight provide the main light. Dimmer fill and separate room reflections preserve darker surroundings and a lit work area. Reviewed the assembled watch and mechanism in screenshots. |
| Handoffs | Both the outgoing assembly and incoming component traveled outside the view at the same time. | Stage the next part before context departs; expand the camera framing for the handoff. Browser samples across every chapter retain a part in the viewing frustum. |
| Scroll effort | Long chapter allocation made transitions feel like empty scrolling. | About 30% less total scroll length for the 18-chapter Murph; all component explanations and 360-degree inspections remain. |
| Mobile stability | Caption line wrapping changed the camera’s available vertical space at boundaries. | Reserve the maximum mobile caption footprint. Measured all 17 boundaries at three widths; maximum camera-position difference across a 0.0000001 progress step was under 0.000001 scene units. |
| Compact-phone scale | Wide contextual views made the watch too small at the finish. | Reduce contextual pullback on phones; preserve the full camera fit for inspection. Reviewed 360×640 and 390×844 openings and endings. |
| Glass | Edges became difficult to distinguish against the darker room. | Adjust the workshop’s restrained reflection environment and intensity, preserving transmission=1 and opacity=1. Original restores its former reflection settings. Reflections remain angle-dependent. |
| Controls | Four competing setting choices remained after selecting a direction. | Workbench is default, Original is the sole alternative. An explicit Original URL survives reload. |
| Anatomy | New default scenery could enter generated educational thumbnails. | Render anatomy thumbnails in Original, then restore the selected setting. All three Murph thumbnails load with descriptive alt text. |
| Accessibility | Need to retain the non-scrolling route through all explanations. | Keyboard Tab/Enter reaches the skip link and focuses the component guide; reduced-motion chapter navigation still passes. |
| Shared viewer | Changes must apply beyond the watch. | Shared camera, lighting and assembly modules plus second-object browser checks; consistent caption styling in the GLB viewer. |

## Validation

Typecheck passes. The unit suite has 156 passing tests (four localhost-server tests were rerun with localhost permission after the sandbox denied listening). The presentation/assembly browser suite has 11 passing checks, covering all 18 lessons at 1440×900, 390×844 and 360×640, reverse scrolling, final seats, glass, settings and a second-object fixture. Another 15 browser checks cover legacy tours, the engine, source inspection, pause, import and error handling, bringing hardware coverage to 26 checks. A separate software-graphics phone check passes. The recorded manual audit found no page errors, no viewport overflow in its 12 captured states, loaded anatomy images and a working keyboard skip target.

The automated handoff check establishes geometry presence in the camera frustum, not freedom from every possible occlusion. Screenshots and manual inspection supplement it. This is a real-time lighting approximation, not global-illumination simulation or proof of unattended reconstruction quality. The room props remain stylized; the researched product retains its own anatomy and material properties. No external room assets were added.
